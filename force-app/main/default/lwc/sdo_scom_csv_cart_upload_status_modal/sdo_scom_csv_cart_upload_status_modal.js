import { api } from 'lwc';
import LightningModal from 'lightning/modal';

export default class Sdo_scom_csv_cart_upload_status_modal extends LightningModal {
    @api partialSuccessMessage;
    @api errorMessageSectionLabel;
    @api errors;
    @api exceptions;
}