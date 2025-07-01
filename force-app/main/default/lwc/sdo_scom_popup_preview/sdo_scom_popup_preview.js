import { LightningElement, api } from 'lwc';

export default class Sdo_scom_popup_preview extends LightningElement {
    @api inputLabel = 'Email';
    @api buttonLabel = 'Get my discount';
    @api popUpTitle = 'GET 15% OFF YOUR FIRST ORDER';
    @api popUpDescription = 'Sign up for our emails to get a discount code for your first order with us!';
    @api inputPlaceholder = 'Your Email';
    @api productContentId;
    @api thankYouImageContentId;
    @api altText = 'Thank you!';

    handleShowModal() {
        const modal = this.template.querySelector("c-sdo_scom_popup");
        modal.show();
    }
}