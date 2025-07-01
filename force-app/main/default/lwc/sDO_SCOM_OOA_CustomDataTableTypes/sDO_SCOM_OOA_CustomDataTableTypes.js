import LightningDatatable from 'lightning/datatable';
import picklistView from './picklistView.html';
import picklistEdit from './picklistEdit.html'
import recordLink from './recordLink.html'

export default class SDO_SCOM_OOA_CustomDataTableTypes extends LightningDatatable {
    static customTypes = {
        picklist: {
            template: picklistView,
            editTemplate: picklistEdit,
            standardCellLayout: true,
            typeAttributes: ['label', 'placeholder', 'options', 'value', 'context', 'variant','name']
        },
        recordLink: {
            template: recordLink,
            standardCellLayout: true,
            typeAttributes: ['recordId', 'recordLabel']
        }
    };
}