public without sharing class WinStoryFlowHelper {
    
    @AuraEnabled
    public static String triggerWinStoryFlow(String recordId) {
        System.debug('=== START triggerWinStoryFlow ===');
        System.debug('Input recordId: ' + recordId);
        
        try {
            // First, get the Opportunity record to extract Account details
            Opportunity opp = [
                SELECT Id, Account.Name, Account.Industry 
                FROM Opportunity 
                WHERE Id = :recordId 
                LIMIT 1
            ];
            
            System.debug('Found Opportunity: ' + opp);
            System.debug('Account Name: ' + opp.Account.Name);
            System.debug('Account Industry: ' + opp.Account.Industry);
            
            // Create input variables for the Flow with the EXACT variable names from the Flow
            Map<String, Object> inputVariables = new Map<String, Object>();
            inputVariables.put('recordID', recordId);
            inputVariables.put('opportunityAccountName', opp.Account.Name);
            inputVariables.put('opportunityIndustry', opp.Account.Industry);
            
            System.debug('Input variables: ' + inputVariables);
            
            System.debug('Creating Flow Interview...');
            Flow.Interview flowInterview = Flow.Interview.createInterview('Get_Win_Stories_From_Prompt', inputVariables);
            
            System.debug('Starting Flow execution...');
            flowInterview.start();
            
            System.debug('Flow execution completed');
            return 'Flow triggered successfully';
            
        } catch (Exception e) {
            System.debug('Error in triggerWinStoryFlow: ' + e.getMessage());
            System.debug('Stack trace: ' + e.getStackTraceString());
            throw new AuraHandledException('Error: ' + e.getMessage());
        }
    }
}