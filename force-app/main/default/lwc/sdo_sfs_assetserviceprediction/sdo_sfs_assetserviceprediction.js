import { LightningElement,api } from 'lwc';
import { ShowToastEvent } from "lightning/platformShowToastEvent";

import createPlan from '@salesforce/apex/SDO_SFS_ASP.createWorkPlan';
export default class Sdo_sfs_assetserviceprediction extends LightningElement {
@api predictionMsg;
@api recordId;
@api workPlanName;
@api workStepName;
@api showActions;
addPlan()
{
    createPlan({ woId: this.recordId,workPlanName:this.workPlanName,workStepName:this.workStepName })
      .then(result => {
        console.log('Result', result);
        const evt = new ShowToastEvent({
            title: 'Success',
            message: 'Work Plan added Successfully!',
            variant: 'Success',
            });
            this.dispatchEvent(evt);
      })
      .catch(error => {
        console.error('Error:', error);
         const evt = new ShowToastEvent({
            title: 'Warning',
            message: error,
            variant: 'Warning',
            });
            this.dispatchEvent(evt);
    });

}
}