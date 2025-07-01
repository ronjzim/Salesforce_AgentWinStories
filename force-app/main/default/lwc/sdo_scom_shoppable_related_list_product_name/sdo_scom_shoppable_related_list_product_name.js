import { LightningElement, api } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';

const PRODUCT_PAGE_REF = {
    type: 'standard__recordPage',
    attributes: {
        recordId: '',
        objectApiName: 'Product2',
        actionName: 'view'
    }
};

export default class Sdo_scom_shoppable_related_list_product_name extends NavigationMixin(LightningElement) {
    productUrl = '#';
    _productId;
    @api
    get productId() {
        return this._productId;
    }
    set productId(value) {
        this._productId = value;
        PRODUCT_PAGE_REF.attributes.recordId = value;
        this.loadProductUrl();
    }

    @api productName;

    connectedCallback() {
        this.loadProductUrl();
    }

    loadProductUrl() {
        if(!this.productId || this.productUrl !== '#') {
            return;
        }
        this[NavigationMixin.GenerateUrl](PRODUCT_PAGE_REF)
            .then((url) => {
                this.productUrl = url;
            }).catch(e => {
                console.log('Error in generating product url: ', e);
            });
    }

    handleClick(event) {
        event.preventDefault();
        this[NavigationMixin.Navigate](PRODUCT_PAGE_REF);
    }
}