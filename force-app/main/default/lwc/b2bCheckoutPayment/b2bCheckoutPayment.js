import { LightningElement, api, track } from 'lwc';
import { ShowToastEvent } from "lightning/platformShowToastEvent";

import COMMUNITYID from "@salesforce/community/Id";

import getAddressInfo from "@salesforce/apex/SDO_B2BCommerce_SPC_ComponentController.getAddressInfo";

// LABELS
import creditCardOption from "@salesforce/label/c.B2B_SPC_Payment_Credit_Card_Option";
import poOption from "@salesforce/label/c.B2B_SPC_Payment_PO_Option";
import processingErrorTitle from "@salesforce/label/c.B2B_SPC_Processing_Error";
import altPleaseWait from "@salesforce/label/c.B2B_SPC_Please_Wait";
import header from "@salesforce/label/c.B2B_SPC_Payment_Method_Header";

export default class B2bCheckoutPayment extends LightningElement {

    // Custom Labels
    labels = {
        toast: {
            processingErrorTitle: processingErrorTitle
        },
        component: {
            header: header
            , creditCardOption: creditCardOption
            , poOption: poOption
            , altPleaseWait: altPleaseWait
        }
    };

    @api effectiveAccountId;
    @api cartId;
    @api webstoreId;

    @api cardNumber;
    @api cvv;

    @api billingContactPointAddressId;
    @api hideCardExpirationMonth;
    @api hideCardHolderName;
    @api hideCardType;
    @api hideCreditCardBillingAddress;
    @api hideCVV;
    @api hideExpirationYear;
    @api hidePurchaseOrderBillingAddress;
    @api paymentGatewayId;
    @api purchaseOrderNumber;
    @api requireCardExpirationMonth;
    @api requireCardExpirationYear;
    @api requireCardType;
    @api requireCardholderName;
    @api requireCreditCardBillingAddress;
    @api requireCVV;
    @api requirePurchaseOrderBillingAddress;
    @api paymentType;  // The payment method default, configured within the flow

    @api hidePurchaseOrderPaymentOption;
    @api hideCreditCardPaymentOption;

    // To be displayed in a combo box
    @track addresses = [];
    @track defaultAddress;
    @track selectedAddress;

    communityId = COMMUNITYID;

    constructor() {
        super();
        //console.log('b2bCheckoutPayment: paymentType = ' + this.paymentType);
    }

    @api
    doInit(webstoreId, effectiveAccountId, cartId) {
        this.webstoreId = webstoreId;
		this.effectiveAccountId = effectiveAccountId;
		this.cartId = cartId;
        this.loadAddresses();
    }

    loadAddresses() {

        console.log("loadAddresses() begin");
        console.log("effectiveAccountId", this.effectiveAccountId);
        //console.log("cartId", this.cartId);

        getAddressInfo({
            effectiveAccountId: this.effectiveAccountId,
            isShipping: false,
            isBilling: true
            })
            .then((result) => {
                this.processResult(result);
            })
            .catch((error) => {
                this.processError(error);
            });

    }

    processResult(result) {
        //this.showLoadingSpinner = false;

        if (result) {
            console.log("processResult():" + JSON.stringify(result));

            this.processResults(result);
        }

        this.processMessages(result);
    }

    processResults(result) {
        console.log("b2bCheckoutPayment - productResults()");
        if(result.addresses && result.addresses.length > 0) {
            this.addresses = result.addresses;
        }

        let id;

        if(result.defaultAddress) {
            id = result.defaultAddress;
        }
        else {
            if(this.addresses.length > 0) {
                id = result.addresses[0].Id;
            }

        }

        console.log('id: ' + id)

        this.defaultAddress = id;
        this.selectedAddress = id;
        this.billingContactPointAddressId = id;

        console.log('defaultAddress: ' + this.defaultAddress);
        console.log('selectedAddress: ' + this.selectedAddress);

        const customEvent = new CustomEvent('billingaddresschange', { detail: id, bubbles : true, composed: true });

        this.dispatchEvent(customEvent);

    }

    get paymentMethods() {

        console.log('paymentType = ' + this.paymentType);
        console.log('B2bCheckoutPayment - hideCreditCardPaymentOption = ', this.hideCreditCardPaymentOption);
        console.log('B2bCheckoutPayment - hidePurchaseOrderPaymentOption = ', this.hidePurchaseOrderPaymentOption);

        let theOptions = [];

        if(this.hideCreditCardPaymentOption === undefined || this.hideCreditCardPaymentOption === false) {
            theOptions.push({ label: this.labels.component.creditCardOption, value: 'CardPayment' });
        }
        
        if(this.hidePurchaseOrderPaymentOption === undefined || this.hidePurchaseOrderPaymentOption === false) {

            theOptions.push({ label: this.labels.component.poOption, value: 'PurchaseOrderNumber' });
        }

        return theOptions;
    }

    get addressOptions() {

        let options = [];

        for(let i = 0; i < this.addresses.length; i++) {

            const addr = this.addresses[i];
            let opt = {};
            opt.label = addr.Address.street + ', ' + addr.Address.city + ', ' + (addr.Address.state ? addr.Address.state + ', ' : '') + addr.Address.postalCode + ' ' + addr.Address.country;
            opt.value = addr.Id;

            options.push(opt);
        }

        return options;
    }

    processError(error) {
        // console.log("processError()", error);
        this.showLoadingSpinner = false;
        this.dispatchEvent(
            new ShowToastEvent({
                title: this.labels.toast.processingErrorTitle,
                message: error.body.message,
                variant: "error"
            })
        );
    }

    processMessages(result) {
        if (result.messagesJson) {
            let messages = JSON.parse(result.messagesJson);
            // console.log("processMessages()", messages);

            // Process messages returned
            // Display toasts when applicable
            // Create content for the details section

            for (var i = 0; i < messages.length; i++) {
                var message = messages[i];

                if (message.toast === true) {
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: message.title,
                            message: message.message,
                            variant: message.severity
                        })
                    );
                }
            }

            this.showProcessLog = true;
        }
    }

    handlePaymentTypeChange(event) {
        console.log('inside handlePaymentTypeChange - child');
        console.log('paymentType: ' + event.detail.value);
        const selectedOption = event.detail.value;

        this.paymentType = selectedOption;

        const selectedEvent = new CustomEvent('paymenttypechange', { detail: selectedOption, bubbles : true, composed: true });

        this.dispatchEvent(selectedEvent);
    }

    handleBillingAddressChange(event) {

        console.log('handleBillingAddressChange grand parent');

        const selectedAddress = event.detail;
        console.log('selectedAddress: ' + selectedAddress);

        this.selectedAddress = selectedAddress;

    }

    handlePoChange(event) {
        console.log('inside handlePoChange - parent');
        this.purchaseOrderNumber = event.detail;
    };

    handleNameChange(event) {
        this.nameOnCard = event.detail;
    };

    handleCardTypeChange(event) {
        console.log('handleCardTypeChange parent');
        this.cardType = event.detail;
    };

    handleCardNumberChange(event) {
        this.cardNumber = event.detail;
    };

    handleCVVChange(event) {
        this.cvv = event.detail;
    }

    handleExpiryMonthChange(event) {
        this.expiryMonth = event.detail;
    };

    handleExpiryYearChange(event) {
        this.expiryYear = event.detail;
    };

    get isPO() {
        if(this.paymentType === 'PurchaseOrderNumber') {
            return true;
        }
        else {
            return false;
        }
    }

    get isCC() {
        if(this.paymentType === 'CardPayment') {
            return true;
        }
        else {
            return false;
        }
    }

    @api
	validateAddressSelection() {

		const comp1 = this.template.querySelector('c-b2b-checkout-payment-billing-address');
        if(comp1) {
            let isValid = comp1.validateAddressSelection();
            
            return isValid;
        
        }

    }

    get displayPurchaseOrderBillingAddresses() {

        if(this.hidePurchaseOrderBillingAddress !== undefined) {

            if(this.hidePurchaseOrderBillingAddress === true) {
                return false;
            }
            else {
                return true;
            }
        }
        else {
            return false;
        }

    }
    
    get displayCreditCardBillingAddresses() {

        if(this.hideCreditCardBillingAddress !== undefined) {

            if(this.hideCreditCardBillingAddress === true) {
                return false;
            }
            else {
                return true;
            }
        }
        else {
            return false;
        }

    }

}