import { LightningElement, wire } from "lwc";

import getContactList from "@salesforce/apex/SDO_SCOM_contactListB2B.getContactList";

const columns = [
  {
    label: "Name",
    fieldName: "accLink",
    type: "url",
    typeAttributes: { label: { fieldName: "Name" }, target: "_self" }
  },
  { label: "Title", fieldName: "Title" },
  { label: "Mobile", fieldName: "MobilePhone" },
  { label: "Email", fieldName: "Email", type: "email" }
];
export default class sDO_SCOM_ContactList extends LightningElement {
  data = [];
  error;
  columns = columns;
s
  @wire(getContactList)
  wireContacts({ error, data }) {
    if (data) {
      data = JSON.parse(JSON.stringify(data));
      data.forEach((res) => {
        res.accLink = "/" + res.Id;
      });
      this.data = data;
      this.error = undefined;
    } else if (error) {
      this.error = error;
    }
  }

  renderedCallback() {

    let style = document.createElement('style');
    
    style.innerText = '.slds-table .slds-grid.slds-grid_align-spread{padding: 0.5rem 0rem;}';
    
    this.template.querySelector('lightning-datatable').appendChild(style);
    
    }
}