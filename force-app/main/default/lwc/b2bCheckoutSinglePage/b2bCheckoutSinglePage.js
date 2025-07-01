import { LightningElement, api, track } from 'lwc';
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import { FlowAttributeChangeEvent, FlowNavigationNextEvent } from 'lightning/flowSupport';

import COMMUNITYID from "@salesforce/community/Id";

import fetchInitValues from "@salesforce/apex/SDO_B2BCommerce_SPC_ComponentController.fetchInitValues";
import getCartSummary from "@salesforce/apex/SDO_B2BCommerce_SPC_ComponentController.getCartSummary";

// LABELS
import nextButton from "@salesforce/label/c.B2B_SPC_Next_Button";
import processingErrorTitle from "@salesforce/label/c.B2B_SPC_Processing_Error";
import altPleaseWait from "@salesforce/label/c.B2B_SPC_Please_Wait";

export default class B2bCheckoutSinglePage extends LightningElement {

    @api cartId;
    @api effectiveAccountId;

    // User entered
    @api billingContactPointAddressId;
    @api hideCardExpirationMonth = false;
    @api hideCardHolderName = false;
    @api hideCardType = false;
    @api hideCreditCardBillingAddress = false;
    @api hideCVV = false;
    @api hideExpirationYear = false;
    @api hidePurchaseOrderBillingAddress = false;
    @api paymentGatewayId;
    @api purchaseOrderNumber;
    @api requireCardExpirationMonth;
    @api requireCardExpirationYear;
    @api requireCardType;
    @api requireCardholderName;
    @api requireCreditCardBillingAddress;
    @api requireCVV;
    @api requirePurchaseOrderBillingAddress;
    @api paymentType;
    @api makeComponentReadOnly;

    @api shippingContactPointAddressId;
    @api shippingInstructions;

    // FFEIX[03/17/23] : capture Request Date in checkout
    @api shippingRequestDate;
    // FFEIX:END

    // Component display options
    @api hideShipToSection = false;
    @api hideDeliveryMethodSelection = false; // Use the no-charge option when true
    @api hidePaymentMethodSection = false;
    @api hideCartSummarySection = false;

    // Ship To options
    @api hideDeliveryInstructions = false;
    @api hideShippingAddressSelection = false;
    @api hideShippingAddressManualEntry = false;

    // Payment options as determined by the admin
    @api hidePurchaseOrderPaymentOption = false;
    @api hideCreditCardPaymentOption = false;

    // FFEIX[03/17/23] : Add flow output value for Card
    @api nameOnCard;
    @api cardType;
    @api cardNumber;
    @api cvv;
    @api expiryMonth;
    @api expiryYear;
    // FFEIX:END

    @api useDefaultDeliveryMethod = false;
    @api useDefaultTaxRate = false;

    @api autoLaunchEditShipToAddressDialog = false;

    @api
    availableActions = [];

    communityId = COMMUNITYID;

    @api webstoreId;

    // Used to determine if/when the cart summary may be loaded
    isShipToLocationSet = false;
    isDeliveryMethodSet = false;

    @track showLoadingSpinner = false;

    // Custom Labels
    labels = {
        toast: {
            processingErrorTitle: processingErrorTitle
        },
        component: {
            nextButton: nextButton,
            altPleaseWait: altPleaseWait
        }
    };

    constructor() {
        super();

        console.log('B2bCheckoutSinglePage: paymentType = ', this.paymentType);

        this.template.addEventListener('loadingspinner', this.handleSpinnerEvent.bind(this));

        this.template.addEventListener('reloadsummary', this.handleReloadSummaryEvent.bind(this));
    }

    connectedCallback() {
        console.log("B2bCheckoutSinglePage: connectedCallback()");
        console.log("cartId: ", this.cartId);

        // console.log('b2bCheckoutSinglePage - hidePurchaseOrderPaymentOption typeof = ' + (typeof this.hidePurchaseOrderPaymentOption));
        // console.log('b2bCheckoutSinglePage - hidePurchaseOrderPaymentOption = ' + this.hidePurchaseOrderPaymentOption);

        // console.log('b2bCheckoutSinglePage - hideCreditCardPaymentOption typeof = ' + (typeof this.hideCreditCardPaymentOption));
        // console.log('b2bCheckoutSinglePage - hideCreditCardPaymentOption = ' + this.hideCreditCardPaymentOption);

        // console.log('b2bCheckoutSinglePage - hideShippingAddressSelection typeof = ' + (typeof this.hideShippingAddressSelection));
        // console.log('b2bCheckoutSinglePage - hideShippingAddressSelection = ' + this.hideShippingAddressSelection);

        console.log("hideShippingAddressManualEntry: ", this.hideShippingAddressManualEntry);

        this.doInit();

    }

    doInit() {

        this.showLoadingSpinner = true;

        fetchInitValues({
                communityId: this.communityId,
                effectiveAccountId: this.effectiveAccountId,
                cartId: this.cartId
            })
            .then((result) => {
                this.showLoadingSpinner = false;

                console.log('b2bCheckoutSinglePage - back from fetchInitValues()');
                console.log('result:', result);
                console.log('fetchInitValues result: ' + JSON.stringify(result));

                if (result) {

                    if (result.webstoreId) {
                        this.webstoreId = result.webstoreId;
                    }

                    if (result.effectiveAccountId) {
                        this.effectiveAccountId = result.effectiveAccountId;
                    }

                    this.currency = result.currencyIsoCode;

                    console.log('currency: ' + this.currency);

                    if (result.cartId) {

                        this.cartId = result.cartId;

                        // Does the initial retrieve of the cart summary.
                        // A custom event will be thrown whenever the ship to or carrier is changed to reload the cart summary.

                        this.loadCartSummary(true);

                        // The cart summary will be loaded after the ship to addresses are loaded and a default address is applied (or not)

                        const comp1 = this.template.querySelector('c-b2b-checkout-ship-to-input');
                        if (comp1) {
                            comp1.doInit(this.webstoreId, this.effectiveAccountId, this.cartId);
                        } else {
                            console.log('child component not found (c-b2b-checkout-ship-to-input)!');
                        }

                        const comp2 = this.template.querySelector('c-b2b-checkout-delivery-method-selection');
                        if (comp2) {
                            comp2.setProperties(this.webstoreId, this.effectiveAccountId, this.cartId, this.currency);
                            comp2.loadDeliveryMethods();
                        } else {
                            console.log('child component not found (c-b2b-checkout-delivery-method-selection)!');
                        }

                        // Set the default ship to address, so that tax will be displayed when a default ship to is designated
                        // if the ship to address is not already set, the method will send an event to reload the cart summary
                        const comp3 = this.template.querySelector('c-b2b-checkout-payment');
                        if (comp3) {
                            comp3.doInit(this.webstoreId, this.effectiveAccountId, this.cartId);
                        } else {
                            console.log('child component not found (c-b2b-checkout-payment)!');
                        }

                    }
                }
            })
            .catch((error) => {
                console.log("error from doInit()");
                console.log(error);
                this.showLoadingSpinner = false;
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: this.labels.toast.processingErrorTitle,
                        message: error.message,
                        variant: "error"
                    })
                );
            });
    }

    handleSpinnerEvent(event) {
        console.log('inside handleSpinnerEvent');
        console.log('detail: ' + event.detail);
        this.showLoadingSpinner = event.detail;
    }

    handleReloadSummaryEvent(event) {

        console.log('b2bCheckoutSinglePage - handleReloadSummaryEvent - parent');

        if (this.isShipToLocationSet && this.isDeliveryMethodSet) {
            console.log('isShipToLocationSet and isDeliveryMethodSet are both true');

            this.loadCartSummary(true);
        } else {
            console.log('isShipToLocationSet and isDeliveryMethodSet are not both true');
        }
    }

    // Drives the reload of the cart summary
    handleShippingAddressChange(event) {
        console.log('b2bCheckoutSinglePage - handleShippingAddressChange - parent');
        console.log('shippingContactPointAddressId:', event.detail);

        this.shippingContactPointAddressId = event.detail;
        this.isShipToLocationSet = true;

        this.handleReloadSummaryEvent(null);
    }

    // Drives the reload of the cart summary
    handleDeliveryMethodChange(event) {
        this.isDeliveryMethodSet = true;

        this.handleReloadSummaryEvent(null);
    }

    handleShippingInstructionsChange(event) {
        console.log('inside handleShippingInstructionsChange - parent');
        console.log('shippingInstructions: ' + event.detail);

        this.shippingInstructions = event.detail;
    }

    // FFEIX[06/13/22] : capture Request Date in checkout
    handleShippingRequestDateChange(event) {
            console.log('inside handleShippingRequestDateChange - parent');
            console.log('shippingRequestDate: ' + event.detail);

            this.shippingRequestDate = event.detail;
        }
        // FFEIX:END

    handlePaymentTypeChange(event) {
        console.log('inside handlePaymentTypeChange - parent');
        console.log('paymentType: ' + event.detail);

        this.paymentType = event.detail;
    }

    handlePoChange(event) {
        console.log('iside handlePoChange - grand parent');
        console.log('purchaseOrderNumber: ' + event.detail);
        this.purchaseOrderNumber = event.detail;
    };

    // Probably don't need these

    handleNameChange(event) {
        this.nameOnCard = event.detail;
    };

    handleCardTypeChange(event) {
        console.log('handleCardTypeChange grand parent');
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

    handleBillingAddressChange(event) {

        console.log('handleBillingAddressChange grand parent');

        const selectedAddress = event.detail;
        console.log('selectedAddress: ' + selectedAddress);

        this.billingContactPointAddressId = selectedAddress;

    }

    handleGoNext() {

        console.log('inside handleGoNext');

        // var attributeChangeEvent = new FlowAttributeChangeEvent('newStreet', this.newStreet);
        // this.dispatchEvent(attributeChangeEvent);

        // console.log('newStreet set');

        // attributeChangeEvent = new FlowAttributeChangeEvent('newCity', this.newCity);
        // this.dispatchEvent(attributeChangeEvent);

        // console.log('newCity set');

        // attributeChangeEvent = new FlowAttributeChangeEvent('newState', this.newState);
        // this.dispatchEvent(attributeChangeEvent);

        // attributeChangeEvent = new FlowAttributeChangeEvent('newPostalCode', this.newPostalCode);
        // this.dispatchEvent(attributeChangeEvent);

        // attributeChangeEvent = new FlowAttributeChangeEvent('newCountry', this.newCountry);
        // this.dispatchEvent(attributeChangeEvent);

        // attributeChangeEvent = new FlowAttributeChangeEvent('newPhone', this.newPhone);
        // this.dispatchEvent(attributeChangeEvent);

        // attributeChangeEvent = new FlowAttributeChangeEvent('newFax', this.newFax);
        // this.dispatchEvent(attributeChangeEvent);

        const comp1 = this.template.querySelector('c-b2b-checkout-ship-to-input');
        if (comp1) {
            let isValid = comp1.validateAddressSelection();
            if (isValid === false) {
                return;
            }
        }

        const comp2 = this.template.querySelector('c-b2b-checkout-delivery-method-selection');
        if (comp2) {
            let isValid = comp2.validateDeliveryMethodSelection();
            if (isValid === false) {
                return;
            }
        }

        if (this.hidePaymentMethodSection == false) {
            const comp3 = this.template.querySelector('c-b2b-checkout-payment');
            if (comp3) {
                let isValid = comp3.validateAddressSelection();
                if (isValid === false) {
                    return;
                }
            }
        }

        console.log('checking for NEXT');

        // check if NEXT is allowed on this screen
        if (this.availableActions.find(action => action === 'NEXT')) {
            // navigate to the next screen
            const navigateNextEvent2 = new FlowNavigationNextEvent();

            console.log('going to next');
            this.dispatchEvent(navigateNextEvent2);
        }
    }

    subtotal = 0.00;
    estShipping = 0.00;
    estTax = 0.00;
    total = 0.00;
    totalAdjusted;
    totalPromoAmount = 0;
    totalProductAmount = 0;
    totalAfterAdjustment = 0;

    handleReloadSummaryCreditInfoEvent(event) {
        console.log('handleReloadSummaryCreditInfoEvent begin', event.detail);
        this.loadCartSummary(true, event.detail);
    }

    loadCartSummary(recalculateTax, success) {

        console.log("loadCartSummary() begin");
        console.log("effectiveAccountId", this.effectiveAccountId);
        console.log("webstoreId: ", this.webstoreId);
        console.log("cartId", this.cartId);

        this.handleSpinnerEvent({ detail: true });

        getCartSummary({
                effectiveAccountId: this.effectiveAccountId,
                webstoreId: this.webstoreId,
                activeOrCartId: this.cartId,
                recalculateTax: recalculateTax,
                useDefaultRate: this.useDefaultTaxRate
            })
            .then((result) => {

                console.log('getCartSummary result:', result);

                this.total = result.grandTotalAmount;
                this.estTax = result.totalTaxAmount;
                this.subtotal = result.totalProductAmount;
                this.estShipping = result.shippingFee;
                this.totalPromoAmount = result.totalPromotionalAdjustmentAmount;
                this.totalAfterAdjustment = result.totalProductAmountAfterAdjustments;

                this.processMessages(result);

                this.handleSpinnerEvent({ detail: false });

                if (success) {

                    if (success === "reloadcreditinfo") {
                        this.reloadCreditInfoEvent();
                    }
                }
            })
            .catch((error) => {
                this.handleSpinnerEvent({ detail: false });
                this.processError(error);
            });

    }

    processError(error) {
        // console.log("processError()", error);
        console.log("b2bCheckoutSinglePage(): processError");
        console.log("b2bCheckoutSinglePage():", error);

        let message = error.body ? error.body.message : error;

        //this.showLoadingSpinner = false;
        this.dispatchEvent(
            new ShowToastEvent({
                title: this.labels.toast.processingErrorTitle,
                message: message,
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

        }
    }

}