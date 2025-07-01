import { LightningElement, api, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

import fetchCustomCartValidation from '@salesforce/apex/SDO_B2B_Cart_CustomValidation.fetchCustomCartValidation';
import fetchInitValues from "@salesforce/apex/SDO_B2B_Cart_CustomValidation.fetchInitValues";

import COMMUNITYID from '@salesforce/community/Id';

export default class B2bCartCustomValidation extends LightningElement {

    // Custom Labels
    labels = {
        toast: {
            processingErrorTitle: 'Processing Error'
        },
        component: {
            altPleaseWait: 'Please wait...'
        }
    };

    @api effectiveAccountId;

    @api cartId;

    communityId = COMMUNITYID;

    webstoreId;

    customMessageText;
    customMessageType;

    @track showLoadingSpinner = false;

    connectedCallback() {
        console.log("B2bCartCustomValidation: connectedCallback()");

        if(this.cartId) {
            this.getCustomCartValidation();
        }
        else {
            this.doInit();
        }

    }

    doInit() {
        this.showLoadingSpinner = true;
        fetchInitValues({
            communityId: this.communityId,
            effectiveAccountId: this.effectiveAccountId
        })
            .then((result) => {
                console.log('result: ' + JSON.stringify(result));
                if (result) {
                    this.webstoreId = result.webstoreId;
                    this.effectiveAccountId = result.effectiveAccountId;
                    this.cartId = result.cartId;

                    if(this.cartId) {

                        this.getCustomCartValidation();
                        
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

    getCustomCartValidation() {

        console.log("getCustomCartValidation() begin");

        console.log("cartId", this.cartId);

        this.showLoadingSpinner = true;

        fetchCustomCartValidation({
            cartId: this.cartId
        })
            .then((result) => {
                this.showLoadingSpinner = false;
                this.processResult(result);
            })
            .catch((error) => {
                this.showLoadingSpinner = false;
                this.processError(error);
            });

    }

    processResult(result) {
        //this.showLoadingSpinner = false;

        console.log("b2bCheckoutCartSummary(): processResult");

        if (result) {
            console.log("processResult():" + JSON.stringify(result));

            this.processResults(result);
        }

        this.processMessages(result);
    }

    processResults(result) {
        // console.log("productResults()", productResults);

        if(result.customMessageType) {
            this.customMessageType = result.customMessageType;
        }

        if(result.customMessageText) {
            this.customMessageText = result.customMessageText;
        }

    }

    processError(error) {
        // console.log("processError()", error);
        console.log("b2bCheckoutCartSummary(): processError");
        console.log("b2bCheckoutCartSummary(): " + error.body.message);

        //this.showLoadingSpinner = false;
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

        }
    }

    get isInfo() {
        if(this.customMessageType === 'Info') {
            return true;
        }
        else {
            return false;
        }
    }

    get isError() {
        if(this.customMessageType === 'Error') {
            return true;
        }
        else {
            return false;
        }
    }

}