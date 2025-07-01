public with sharing class SDO_Service_Propensity_to_Escalate_Ctrl {
    @AuraEnabled(cacheable=true)
    public static Case getCaseData(String recordId) {
        Case myCase = [SELECT Id, SDO_Service_Propensity_Improvement_2_Val__c, SDO_Service_Propensity_Improvement_2__c, SDO_Service_Propensity_Improvement_1_Val__c, SDO_Service_Propensity_Improvement_1__c, SDO_Service_Propensity_Predictor_3__c, SDO_Service_Propensity_Predictor_3_Value__c, SDO_Service_Propensity_Predictor_2_Value__c, SDO_Service_Propensity_Predictor_1_Value__c, SDO_Service_Propensity_Predictor_1__c, SDO_Service_Propensity_Predictor_2__c, SDO_Service_Percent_vs_Last_Change__c, SDO_Service_Propensity_Percentage__c, SDO_Service_Propensity_to_Escalate__c, SDO_Service_Propensity_Change_Direction__c, SDO_Service_PTE_Score_Lower_Threshold__c, SDO_Service_PTE_Score_Upper_Threshold__c FROM Case WHERE Id =: recordId];
        return myCase;
    }
}