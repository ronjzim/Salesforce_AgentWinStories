import { LightningElement, api, track } from 'lwc';

// LABELS
import enterPONumber from "@salesforce/label/c.B2B_SPC_Enter_PO_Number";
export default class B2bCheckoutPaymentPo extends LightningElement {

    // Custom Labels
	labels = {
		toast: {},
		component: {
			enterPONumber: enterPONumber
		}
	};

    @api cartId;
    
    @api purchaseOrderNumber;

    handlePoChange(event) {
        console.log('handlePoChange child');

        this.purchaseOrderNumber = event.detail.value;

        const selectedEvent = new CustomEvent('pochange', { detail: event.detail.value, bubbles : true, composed: true });

        this.dispatchEvent(selectedEvent);

    };

}