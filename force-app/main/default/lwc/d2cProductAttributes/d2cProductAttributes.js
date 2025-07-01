import { LightningElement, wire, track, api } from 'lwc';
import { getRecord, getFieldValue } from "lightning/uiRecordApi";

export default class D2cProductAttributes extends LightningElement {
    @track error;
    @api recordId; // Gets or sets the unique identifier of a product. @type {string}
    @track mapMyObjectPath = [];
    @track sObjName;
    @api myFieldLabel;
    @api myNewObjectField;
    prodFieldValue;

    get fields() {
       console.log(" ########## Display Object Name - NEW ############### " + this.myNewObjectField);
       this.mapMyObjectPath = [this.myNewObjectField];

        return this.mapMyObjectPath;
    }

@wire(getRecord, { recordId: '$recordId', fields: '$fields' })
loadProduct({ error, data }) {
    if (error) {
      // TODO: handle error
      
    } else if (data) {
      // Get data
      this.prodFieldValue =  getFieldValue(data, this.myNewObjectField);

    }
  }
}