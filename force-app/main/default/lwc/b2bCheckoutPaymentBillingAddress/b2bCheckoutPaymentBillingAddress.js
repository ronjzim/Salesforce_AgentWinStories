import { LightningElement, api, track } from 'lwc';
import { ShowToastEvent } from "lightning/platformShowToastEvent";

// LABELS
import billingAddress from "@salesforce/label/c.B2B_SPC_Billing_Address";
import addressNotSelected from "@salesforce/label/c.B2B_SPC_Billing_Address_Not_Defined";
import processingErrorTitle from "@salesforce/label/c.B2B_SPC_Processing_Error";
import altPleaseWait from "@salesforce/label/c.B2B_SPC_Please_Wait";

export default class B2bCheckoutPaymentBillingAddress extends LightningElement {

    // Custom Labels
    labels = {
        toast: {
            processingErrorTitle: processingErrorTitle
            , addressNotSelected: addressNotSelected
        },
        component: {
            billingAddress: billingAddress
            , altPleaseWait: altPleaseWait
        }
    };

    @api hideAddress;
    @api requireAddress;

    // To be displayed in a combo box
    @api options = [];
    @api defaultAddress;
    @api selectedAddress;

    handleAddressChange(event) {

        console.log('handleAddressChange child');

        this.selectedAddress = event.detail.value;

        const selectedEvent = new CustomEvent('billingaddresschange', { detail: event.detail.value, bubbles : true, composed: true });

        this.dispatchEvent(selectedEvent);

    }

    @api
	validateAddressSelection() {

		if(this.selectedAddress === undefined || this.selectedAddress === null) {
			this.dispatchEvent(
				new ShowToastEvent({
					title: this.labels.toast.addressNotSelected,
					//message: error.body.message,
					variant: "error"
				})
			);

			return false;
		}
		else {
			return true;
		}

	}

}