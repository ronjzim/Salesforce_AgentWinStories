public without sharing class WinStoryController {

    public class WinStory {
        @AuraEnabled public String id { get; set; }
        @AuraEnabled public String customerName { get; set; }
        @AuraEnabled public Integer relevanceScore { get; set; }
        @AuraEnabled public String summary { get; set; }
    }

    @AuraEnabled(cacheable=true)
    public static List<WinStory> getStoriesFromAgentFlow(String opportunityId) {
        try {
            // 1. Get the Name and Industry from the PARENT ACCOUNT
            Opportunity opp = [SELECT Account.Name, Account.Industry 
                               FROM Opportunity 
                               WHERE Id = :opportunityId LIMIT 1];
            
            String accName = opp.Account.Name;
            String accIndustry = opp.Account.Industry;
            
            if (String.isBlank(accIndustry)) {
                accIndustry = 'General';
            }

            // 2. Set up Flow inputs for BOTH Name and Industry
            Map<String, Object> flowInputs = new Map<String, Object>();
            flowInputs.put('opportunityAccountName', accName);
            flowInputs.put('opportunityIndustry', accIndustry);

            // 3. Run the Flow
            Flow.Interview storyFlow = Flow.Interview.createInterview('Get_Win_Stories_From_Prompt', flowInputs);
            storyFlow.start();
            
            // ... (The rest of the parsing code remains the same) ...
            Object rawResponseObject = storyFlow.getVariableValue('promptResponse');
            if (rawResponseObject == null) { return new List<WinStory>(); }
            String rawJsonFromAgent = (String)rawResponseObject;
            if (String.isBlank(rawJsonFromAgent)) { return new List<WinStory>(); }

            String finalJsonToParse = rawJsonFromAgent;
            Integer startIndex = finalJsonToParse.indexOf('[');
            Integer endIndex = finalJsonToParse.lastIndexOf(']');
            
            if (startIndex != -1 && endIndex != -1 && endIndex > startIndex) {
                finalJsonToParse = finalJsonToParse.substring(startIndex, endIndex + 1);
            } else {
                return getTestStories();
            }
            
            finalJsonToParse = finalJsonToParse.replace('\\"', '"').replace('\\n', ' ').replace('\\r', ' ').replace('\\t', ' ');
            return (List<WinStory>) JSON.deserialize(finalJsonToParse, List<WinStory>.class);

        } catch (Exception e) {
            System.debug('WinStoryController EXCEPTION: ' + e.getMessage() + ' at line ' + e.getLineNumber());
            return getTestStories();
        }
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