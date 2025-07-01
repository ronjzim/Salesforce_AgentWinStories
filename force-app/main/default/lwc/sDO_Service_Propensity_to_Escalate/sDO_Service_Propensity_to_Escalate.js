import { LightningElement, wire, api } from 'lwc';
import getCaseData from '@salesforce/apex/SDO_Service_Propensity_to_Escalate_Ctrl.getCaseData';

export default class SDO_Service_Propensity_to_Escalate extends LightningElement {
    @api recordId;
    myCase;
    scoreIsLow;
    scoreIsModerate;
    scoreIsHigh;
    changeDirectionUp;
    changeVal;
    predictorVal1;
    predictorVal2;
    predictorVal3;
    improvementVal1;
    improvementVal2;
    @wire(getCaseData, {recordId: '$recordId'})
    updatedCase({ error, data }) {
        if (data) {
            this.myCase = data;
            console.log('Here is your updated case!:', this.myCase);
            if (this.myCase.SDO_Service_Propensity_Percentage__c <= this.myCase.SDO_Service_PTE_Score_Lower_Threshold__c) {
                this.scoreIsLow = true;
            } else if (this.myCase.SDO_Service_Propensity_Percentage__c > this.myCase.SDO_Service_PTE_Score_Lower_Threshold__c && this.myCase.SDO_Service_Propensity_Percentage__c < this.myCase.SDO_Service_PTE_Score_Upper_Threshold__c){
                this.scoreIsModerate = true;
            } else if (this.myCase.SDO_Service_Propensity_Percentage__c >= this.myCase.SDO_Service_PTE_Score_Upper_Threshold__c) {
                this.scoreIsHigh = true;
            }
            
            if (this.myCase.SDO_Service_Propensity_Change_Direction__c === "Up") {
                this.changeDirectionUp = true;
            } else {
                this.changeDirectionUp = false;
            }
            
            if (this.myCase.SDO_Service_Percent_vs_Last_Change__c > 0) {
                this.changeVal = true;
            }
            if (this.myCase.SDO_Service_Propensity_Predictor_1_Value__c > 0) {
                this.predictorVal1 = true;
            }
            if (this.myCase.SDO_Service_Propensity_Predictor_2_Value__c > 0) {
                this.predictorVal2 = true;
            }
            if (this.myCase.SDO_Service_Propensity_Predictor_3_Value__c > 0) {
                this.predictorVal3 = true;
            }
            if (this.myCase.SDO_Service_Propensity_Improvement_1_Val__c > 0) {
                this.improvementVal1 = true;
            }
            if (this.myCase.SDO_Service_Propensity_Improvement_2_Val__c > 0) {
                this.improvementVal2 = true;
            }
        } else if (error) {
            console.log('Something went wrong with your getCaseData method!:', error);
        }
    }
}