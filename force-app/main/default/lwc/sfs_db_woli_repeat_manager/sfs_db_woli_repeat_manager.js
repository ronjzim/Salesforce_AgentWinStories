import { LightningElement,api } from 'lwc';
import getWOLIData from '@salesforce/apex/SFS_DocBuilderMgr.getWolis';
export default class Sfs_db_woli_repeat_manager extends LightningElement {

    @api recordId;
    @api showWOLIInfo;
    @api showWorkPlans;
    @api showFiles;
    @api showProductsConsumed;
    @api showImageDescription;
    woliResults=[];
    connectedCallback() {
        this.retrieveWolis();
    }
    retrieveWolis()
    {
        getWOLIData({ workOrderId: this.recordId })
          .then(result => {
            console.log('Result', result);
            this.woliResults=result;
          })
          .catch(error => {
            console.error('Error:', error);
        });
    }

}