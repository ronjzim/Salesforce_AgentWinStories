import LightningDatatable from 'lightning/datatable';
import productImageTemplate from './productImage.html';
import productNameTemplate from './productName.html';
import productPriceTemplate from './productPrice.html';

export default class Sdo_scom_shoppable_related_list_data_table extends LightningDatatable {
    static customTypes = {
        productImage: {
            template: productImageTemplate,
            standardCellLayout: true,
            typeAttributes: ['imageUrl', 'imageAltText']
        },
        productName: {
            template: productNameTemplate,
            standardCellLayout: true,
            typeAttributes: ['productId', 'productName']
        },
        productPrice: {
            template: productPriceTemplate,
            standardCellLayout: true,
            typeAttributes: ['productId']
        }
    };
}