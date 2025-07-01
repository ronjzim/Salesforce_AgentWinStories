import { LightningElement, wire, api } from 'lwc';
import getCaseData from '@salesforce/apex/SDO_Service_Customer_Effort_Score_Ctrl.getCaseData';

export default class SDO_Service_Customer_Effort_Score extends LightningElement {
    @api recordId;
    myCase;
    scoreIsLow;
    scoreIsModerate;
    scoreIsHigh;
    skillGauge;
    @wire(getCaseData, {recordId: '$recordId'})
    updatedCase({ error, data }) {
        if (data) {
            this.myCase = data;
            console.log('Here is your updated case!:', this.myCase);
            if (this.myCase.SDO_Service_Customer_Effort_Score__c <= this.myCase.SDO_Service_CES_Score_Lower_Threshold__c) {
                this.scoreIsLow = true;
            } else if (this.myCase.SDO_Service_Customer_Effort_Score__c > this.myCase.SDO_Service_CES_Score_Lower_Threshold__c && this.myCase.SDO_Service_Customer_Effort_Score__c < this.myCase.SDO_Service_CES_Score_Upper_Threshold__c) {
                this.scoreIsModerate = true;
            } else if (this.myCase.SDO_Service_Customer_Effort_Score__c >= this.myCase.SDO_Service_CES_Score_Upper_Threshold__c) {
                this.scoreIsHigh = true;
            }
        } else if (error) {
            console.log('Something went wrong with your getCaseData method!:', error);
        }
    }

    get widthPercentage() {
        return `width:${this.myCase.SDO_Service_Customer_Effort_Score__c}%`
    }
}