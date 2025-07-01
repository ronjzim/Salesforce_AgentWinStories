import { LightningElement,api } from 'lwc';
import getWorkPlanData from '@salesforce/apex/SFS_DocBuilderMgr.getRelatedWorkSteps';
export default class Sfs_db_workplan_viewer extends LightningElement {

    @api recordId;
    workPlanSteps=[];
    showWorkPlans=true;
    connectedCallback() {
        this.retrieveWorkPlanData();
    }
    retrieveWorkPlanData()
    {
        getWorkPlanData({ woId: this.recordId })
          .then(result => {
            console.log('Result', result);
            this.workPlanSteps=result;
            if(this.workPlanSteps.length==0)
            {
              this.showWorkPlans=false;
            }
          })
          .catch(error => {
            console.error('Error:', error);
        });
    }

}