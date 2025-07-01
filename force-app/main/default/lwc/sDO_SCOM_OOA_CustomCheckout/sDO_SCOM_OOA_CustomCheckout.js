import { LightningElement, track, wire, api } from "lwc";
import { NavigationMixin } from "lightning/navigation";
import Id from "@salesforce/user/Id";
import { CartItemsAdapter, CartStatusAdapter } from "commerce/cartApi";
import { restartCheckout } from "commerce/checkoutApi";

import getCurrentUserDetails from "@salesforce/apex/SDO_SCOM_OOA_CustomCheckoutController.getCurrentUserDetails";
import requestOverride from "@salesforce/apex/SDO_SCOM_OOA_CustomCheckoutController.requestOverride";
import getCartApprovalStatus from "@salesforce/apex/SDO_SCOM_OOA_CustomCheckoutController.getCartApprovalStatus";

export default class SDO_SCOM_OOA_CustomCheckout extends NavigationMixin(
  LightningElement
) {
  userId = Id;

  @api orgAdminApproverId;

  @track subscription = null;
  @track currentCartData;
  @track currentCartItems;
  @track cartApprovalStatus = {};
  @track currentUserDetails = {};
  @track productExceptions = [];

  @track creditApprovalStatus;
  @track productApprovalStatus;

  isLoading = false;

  masterRoles = ["Admin", "Finance"];

  @wire(CartStatusAdapter)
  checkoutCapabilitiesHandler;

  @wire(CartItemsAdapter, {
    productFieldNames: ["SDO_SCOM_OOA_Allowed_Limit__c"]
  })
  getCartItems({ data, error }) {
    if (data) {
      console.log("Cart Items", data);
      this.currentCartData = data.cartSummary;
      this.currentCartItems = data.cartItems;
      //console.log('this.productExceptions', this.productExceptions);
      this.refreshCartApprovalStatus();
      this.updateProductExceptions();
    } else if (error) {
      console.error(error);
    }
  }

  @wire(getCurrentUserDetails, { userId: "$userId" })
  handleUserDetails({ error, data }) {
    if (data) {
      /* console.log("getCurrentUserDetails Data", data); */
      this.currentUserDetails = data;
    } else if (error) {
      console.error("getCurrentUserDetails Error:", error);
    }
  }

  async handleCheckout() {
    /* console.log("handleCheckout"); */
    /* if (this.canCheckout) { */
    await restartCheckout();
    /* } */
    const navContextPageName = this.canCheckout ? "Current_Checkout" : "Login";
    this[NavigationMixin.Navigate]({
      type: "comm__namedPage",
      attributes: {
        name: "Current_Checkout"
      }
    });
  }

  handleRequestCreditOverride() {
    /* console.log("handleRequestCreditOverride"); */
    this.isLoading = true;

    let approvalRequest = {
      cartId: this.currentCartData.cartId,
      approverId: this.currentUserDetails.Contact.SDO_SCOM_OOA_Approver__c,
      accountName: this.currentUserDetails.Contact?.Account?.Name,
      cartValue: this.currentCartData.grandTotalAmount,
      isBudgetExceded: this.isBudgetExceded,
      hasProductExceptions: Boolean(this.productExceptions.length),
      orgAdminApproverId: this.orgAdminApproverId
    };

    if (this.productExceptions) {
      let prodExcpPayload = "<ul><li>";
      prodExcpPayload += this.productExceptions
        .map((item) => item.message)
        .join("</li><li>");
      prodExcpPayload += "</li></ul>";
      approvalRequest.productExceptions = prodExcpPayload;
    }

    requestOverride(approvalRequest)
      .then((result) => {
        //console.log("requestOverride result:", result);
        this.refreshCartApprovalStatus();
      })
      .catch((error) => {
        console.error("requestOverride Error:", error);
      });
  }

  refreshCartApprovalStatus() {
    getCartApprovalStatus({ cartId: this.currentCartData.cartId })
      .then((result) => {
        //console.log("refreshCartApprovalStatus result:", result);
        this.cartApprovalStatus = result;
        this.creditApprovalStatus =
          result?.SDO_SCOM_OOA_Credit_Override_Status__c;
        this.productApprovalStatus =
          result?.SDO_SCOM_OOA_Products_Override_Status__c;
      })
      .catch((error) => {
        console.error("refreshCartApprovalStatus Error:", error);
      })
      .finally(() => {
        this.isLoading = false;
      });
  }

  updateProductExceptions() {
    try {
      let exeptionList = [];
      /* console.log("exeptionList : ", exeptionList); */
      if (this.currentCartItems) {
        this.currentCartItems.forEach((item) => {
          let { cartItem } = item;
          let { productDetails, quantity, name } = cartItem;
          let cartQuantity = Number(quantity);
          let allowedLimit =
            productDetails.fields.SDO_SCOM_OOA_Allowed_Limit__c;
          /* console.log('currentCartItem : ', cartItem, productDetails, quantity); */
          /* console.log(
            name,
            " quantity : ",
            quantity,
            " limit : ",
            allowedLimit
          ); */
          if (allowedLimit) {
            allowedLimit = Number(allowedLimit);
            let exceptionData = {};
            if (allowedLimit == 0) {
              exceptionData.message = name;
              exeptionList.push({
                productId: productDetails.productId,
                message: name
              });
            } else if (cartQuantity > allowedLimit) {
              exeptionList.push({
                productId: productDetails.productId,
                message: `${name}'s allowed limit is ${allowedLimit} (ordering ${cartQuantity})`
              });
            }
          }
        });
      }
      //console.log("exeptionList : ", exeptionList);
      this.productExceptions = exeptionList;
    } catch (err) {
      console.log("exeptionList error : ", err);
    }
  }

  get userHasContact() {
    return this?.currentUserDetails?.Contact;
  }

  get isBudgetExceded() {
    /* if (this.userHasContact) { */
    let SDO_SCOM_OOA_Budget_Limit__c =
      this?.userHasContact?.SDO_SCOM_OOA_Budget_Limit__c;
    /* return SDO_SCOM_OOA_Access__c == "Buyer" && Number(this?.currentCartData?.grandTotalAmount) > SDO_SCOM_OOA_Budget_Limit__c; */
    return Boolean(
      this.userHasContact &&
        SDO_SCOM_OOA_Budget_Limit__c != 0 &&
        Number(this?.currentCartData?.grandTotalAmount) >
          SDO_SCOM_OOA_Budget_Limit__c
    );
    /* } else {
      return false;
    } */
  }

  get hasExceptions() {
    return (
      this.userHasContact &&
      !this.masterRoles.includes(
        this?.currentUserDetails?.Contact?.SDO_SCOM_OOA_Access__c
      ) &&
      (this.isBudgetExceded || this.productExceptions.length > 0)
    );
  }

  get hasProductExceptions() {
    return this.productExceptions.length > 0;
  }

  get showCheckout() {
    return (
      this?.currentUserDetails?.Contact?.SDO_SCOM_OOA_Access__c != "Viewer"
    );
  }

  get isApproved() {
    return (
      (this.isBudgetExceded &&
        this.creditApprovalStatus == "Approved" &&
        this.productExceptions.length == 0) ||
      (this.productExceptions.length > 0 &&
        this.productApprovalStatus == "Approved" &&
        !this.isBudgetExceded) ||
      (this.isBudgetExceded &&
        this.creditApprovalStatus == "Approved" &&
        this.productExceptions.length > 0 &&
        this.productApprovalStatus == "Approved")
    );
  }

  get isCheckoutDisabled() {
    if (this.hasExceptions) {
      if (this.isApproved) {
        return false;
      } else if (
        this.creditApprovalStatus != null ||
        this.productApprovalStatus != null
      ) {
        return true;
      } else {
        return this.hasExceptions;
      }
    } else {
      return false;
    }
  }

  get canCheckout() {
    return !!this.checkoutCapabilitiesHandler?.data?.isGuestCheckoutEnabled;
  }

  get isApprovalRequested() {
    return this.creditApprovalStatus || this.productApprovalStatus;
  }

  get exceptionTitle() {
    let message;
    let cssClass = "slds-text-heading_small ";
    if (
      this.creditApprovalStatus == "Awaiting Response" ||
      this.productApprovalStatus == "Awaiting Response"
    ) {
      message = "Your cart has a few exceptions and is submitted for approval";
    } else if (
      this.creditApprovalStatus == "Denied" ||
      this.productApprovalStatus == "Denied"
    ) {
      message =
        "Your cart has a few exceptions and your approval request has been denied";
      cssClass += "slds-text-color_destructive";
    } else if (this.isApproved) {
      message = "Your cart has been approved for checkout";
      cssClass += "slds-text-color_success";
    } else {
      message = "Your cart has a few exceptions and needs approval";
      cssClass += "slds-text-color_destructive";
    }
    return { message, cssClass };
  }

  get showRequestForApproval() {
    if (
      (this.isBudgetExceded && this.creditApprovalStatus == "Approved") ||
      (this.productExceptions.length > 0 &&
        this.productApprovalStatus == "Approved")
    ) {
      return false;
    } else {
      return this.hasExceptions;
    }
  }
}