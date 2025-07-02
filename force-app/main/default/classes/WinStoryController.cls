public without sharing class WinStoryController {

    public class WinStory {
        @AuraEnabled public String id { get; set; }
        @AuraEnabled public String customerName { get; set; }
        @AuraEnabled public Integer relevanceScore { get; set; }
        @AuraEnabled public String summary { get; set; }
    }

    @AuraEnabled(cacheable=true)
    public static List<WinStory> getStoriesFromAgentFlow(String opportunityId) {
        // This is a temporary method for debugging the inferred industry
        System.debug('--- STARTING INFERENCE DEBUG ---');
        try {
            Opportunity opp = [SELECT Account.Name, Account.Industry
                            FROM Opportunity WHERE Id = :opportunityId LIMIT 1];

            if (opp.AccountId == null) { return getTestStories(); }

            Map<String, Object> flowInputs = new Map<String, Object>();
            flowInputs.put('opportunityAccountName', opp.Account.Name);
            flowInputs.put('opportunityIndustry', opp.Account.Industry);

            Flow.Interview storyFlow = Flow.Interview.createInterview('Get_Win_Stories_From_Prompt', flowInputs);
            storyFlow.start();

            // Get the output variable from the FIRST step of your Flow
            Object inferredIndustryObject = storyFlow.getVariableValue('inferredIndustry');

            // Log the result to the Apex Debug Log
            System.debug('Raw Inferred Industry Object: ' + inferredIndustryObject);

        } catch (Exception e) {
            System.debug('An exception occurred during debug: ' + e.getMessage());
        }

        System.debug('--- FINISHED INFERENCE DEBUG ---');
        // Always return the fallback data during this test
        return getTestStories();
    }
    
    @AuraEnabled(cacheable=true)
    public static List<WinStory> getTestStories() {
        List<WinStory> testStories = new List<WinStory>();
        WinStory story1 = new WinStory();
        story1.id = 'test_1';
        story1.customerName = 'Test Customer 1 (Error Fallback)';
        story1.relevanceScore = 10;
        story1.summary = 'This is test data returned because an error occurred in the Apex class.';
        testStories.add(story1);
        return testStories;
    }
}