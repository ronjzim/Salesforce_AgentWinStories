public with sharing class SDO_Service_Customer_Effort_Score_Ctrl {
    @AuraEnabled(cacheable=true)
    public static Case getCaseData(String recordId) {
        Case myCase = [SELECT Id, SDO_Service_Customer_Effort_Score__c, SDO_Service_Speed_to_Answer__c, SDO_Service_Agent_Interactions__c, SDO_Service_Email_Response_Time__c, SDO_Service_Escalated__c, SDO_Service_CES_Score_Lower_Threshold__c, SDO_Service_CES_Score_Upper_Threshold__c FROM Case WHERE Id =: recordId];
        return myCase;
    }
}