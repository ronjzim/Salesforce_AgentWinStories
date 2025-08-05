public without sharing class WinStoryController {

    // This is the NEW method for the Prompt Template.
    // It's designed to be called by backend automation.
    @InvocableMethod(label='Get Win Stories for Prompt')
    public static List<List<String>> getStoriesForPrompt(List<String> opportunityIds) {
        String opportunityId = opportunityIds[0];

        // Your existing logic to call the Flow.
        // The Flow should be configured to accept 'opportunityId' as an input variable.
        Map<String, Object> flowInputs = new Map<String, Object>();
        flowInputs.put('opportunityId', opportunityId);

        try {
            Flow.Interview storyFlow = Flow.Interview.createInterview('Get_Win_Stories_From_Prompt', flowInputs);
            storyFlow.start();

            // IMPORTANT: Your Flow must have a Collection Text Variable marked as "Available for Output"
            // that contains the text of the retrieved win stories.
            // Let's assume that output variable is named 'retrievedWinStoryTexts'.
            List<String> storyTexts = (List<String>) storyFlow.getVariableValue('retrievedWinStoryTexts');

            if (storyTexts != null && !storyTexts.isEmpty()) {
                // Invocable Methods must return a List of Lists.
                // We wrap our list of stories in another list.
                return new List<List<String>>{storyTexts};
            }
        } catch (Exception e) {
            System.debug('An exception occurred when running the flow for the prompt: ' + e.getMessage());
            // If there's an error, return a list containing a single error message.
            return new List<List<String>>{new List<String>{'Error: Could not retrieve win stories. ' + e.getMessage()}};
        }

        // Fallback if the flow returns nothing.
        return new List<List<String>>{new List<String>{'No win stories were found by the flow.'}};
    }


    /*
    ================================================================
    YOUR EXISTING METHODS CAN REMAIN UNCHANGED BELOW
    They can still be used by your Lightning Web Components or for debugging.
    ================================================================
    */

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

            Object inferredIndustryObject = storyFlow.getVariableValue('inferredIndustry');
            System.debug('Raw Inferred Industry Object: ' + inferredIndustryObject);

        } catch (Exception e) {
            System.debug('An exception occurred during debug: ' + e.getMessage());
        }

        System.debug('--- FINISHED INFERENCE DEBUG ---');
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
