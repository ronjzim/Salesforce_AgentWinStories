import { LightningElement, api } from 'lwc';

const KEYS = {
    ESCAPE: 27
}

export default class DbmModal extends LightningElement {

    @api header;
    @api cancelLabel = 'Cancel';
    @api confirmLabel = 'Confirm';
    @api hideConfirm = false;
    // @api disableAutoFocus = false;
    // @api showModal = false;
    // @api preventDefaultCancel = false;
    @api name;

    get showConfirmButton() {
        return !this.hideConfirm;
    }

    /* ACTION FUNCTIONS */
    // @api
    // close() {
    //     this.showModal = false;
    // }

    // @api
    // open() {
    //     this.showModal = true;
    // }

    cancelModal() {    
        this.dispatchEvent(new CustomEvent('cancel'));
        // if (!this.preventDefaultCancel) {
        //     this.close();
        // }
    }

    confirmModal() {
        this.dispatchEvent(new CustomEvent('confirm'));
    }

    /* EVENT HANDLERS */
    handleModalKeyDown(event) {
        if (event.keyCode == KEYS.ESCAPE) {
            this.cancelModal();
        }
    }

    handleCancelClick() {
        this.cancelModal();
    }

    handleConfirmClick() {
        this.confirmModal();
    }
}