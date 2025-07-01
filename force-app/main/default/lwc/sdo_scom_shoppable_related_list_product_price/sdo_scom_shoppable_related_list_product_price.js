import { LightningElement, api, wire } from 'lwc';
import { ProductPricingAdapter } from 'commerce/productApi';

export default class Sdo_scom_shoppable_related_list_product_price extends LightningElement {
    originalPrice = '';
    unitPrice = '';
    negotiatedPrice = '';
    currencyCode = '';
    isLoading = true;
    @api productId;

    @wire(ProductPricingAdapter, {
        productId: '$productId'
    })
    getProductPrice({ data, loaded}) {
        if (loaded && data) {
            this.originalPrice = data.listPrice;
            this.unitPrice = data.unitPrice;
            this.negotiatedPrice = data.negotiatedPrice;
            this.currencyCode = data.currencyIsoCode;
            this.isLoading = false;
        }
    }

    get showOriginalPrice() {
        return this.originalPrice != this.negotiatedPrice;
    }
}