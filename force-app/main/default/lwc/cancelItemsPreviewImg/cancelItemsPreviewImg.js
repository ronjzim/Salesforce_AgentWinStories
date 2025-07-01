import { LightningElement, wire, api } from 'lwc';
import { getRecord } from 'lightning/uiRecordApi';

const FIELDS = [
    'Product2.Name',
    'Product2.purl__c',
];

export default class CancelItemsPreviewImg extends LightningElement {
    @api productid;

    @wire(getRecord, { recordId: '$productid', fields: FIELDS })
    product;

    get name() {
        return this.product.data.fields.Name.value;
    }

    get image() {
        return this.product.data.fields.purl__c.value;
    }

    get imageStyle(){
       return "background-image:url('" + this.product.data.fields.purl__c.value;
    }

}