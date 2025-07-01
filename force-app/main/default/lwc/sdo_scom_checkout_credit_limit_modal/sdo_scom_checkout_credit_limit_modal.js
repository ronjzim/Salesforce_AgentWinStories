import { api } from 'lwc';
import LightningModal from 'lightning/modal';

export default class Sdo_scom_checkout_credit_limit_modal extends LightningModal {
    @api content;

    handleOkay() {
        this.close('okay');
    }
}