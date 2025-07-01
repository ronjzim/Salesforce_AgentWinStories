import { LightningElement, api } from 'lwc';

export default class SDO_SCOM_OOA_CustomDataTableRecordLink extends LightningElement {
    @api recordId;
    @api recordLabel;

    handleNav() {
        let paramData = { recordId: this.recordId, recordLabel: this.recordLabel };
        console.log(paramData);
        const ev = new CustomEvent('recordlinkclick', {
            composed: true,
            bubbles: true,
            cancelable: true,
            detail: paramData,
        });
        this.dispatchEvent(ev);
    }
}