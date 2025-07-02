public without sharing class WinStoryController {

    public class WinStory {
        @AuraEnabled public String id { get; set; }
        @AuraEnabled public String customerName { get; set; }
        @AuraEnabled public Integer relevanceScore { get; set; }
        @AuraEnabled public String summary { get; set; }
    }

    // The method now includes (callout=true) to allow it to call the AI service
    @AuraEnabled(cacheable=true, callout=true)
    public static List<WinStory> getStoriesFromAgent(String opportunityId) {
        try {
            // 1. Get Account Info
            Opportunity opp = [SELECT Account.Name, Account.Industry
                               FROM Opportunity WHERE Id = :opportunityId LIMIT 1];

            if (opp.AccountId == null) { return new List<WinStory>(); }

            // --- STEP 1: INFER THE INDUSTRY DIRECTLY IN APEX ---
            String inferencePrompt = 'The account is named ' + opp.Account.Name + ' and is in the ' + opp.Account.Industry + ' industry. Based on the provided text, what is a more accurate, single business category? For example, if the text is "The account is named Adaptive Sports Center and is in the Communications industry", a good answer would be "Sports and Recreation". Respond with ONLY the new category name.';
            String inferredIndustry = getAiResponse(inferencePrompt);

            if (String.isBlank(inferredIndustry)) {
                System.debug('Could not infer an industry.');
                return new List<WinStory>();
            }
            System.debug('AI Inferred Industry: ' + inferredIndustry);


            // --- STEP 2: GET WIN STORIES USING THE INFERRED INDUSTRY ---
            String winStoryPrompt = 'Using the industry ' + inferredIndustry + ', perform a semantic search through all slides in the \'Agentforce Highspot Agent Library\' to find the 2 most similar customer win stories. Your entire response must be ONLY a raw JSON array of objects. Each object must have these four keys: "id" "customerName" "relevanceScore" "summary" (must be in the past tense and include quantitative/qualitative metrics) Do not add any text before or after the JSON array.';
            String rawJsonResponse = getAiResponse(winStoryPrompt);

            if(String.isBlank(rawJsonResponse)){
                System.debug('AI did not return any win stories.');
                return new List<WinStory>();
            }
            System.debug('AI Returned Stories JSON: ' + rawJsonResponse);

            return (List<WinStory>) JSON.deserialize(rawJsonResponse.trim(), List<WinStory>.class);

        } catch (Exception e) {
            System.debug(LoggingLevel.ERROR, 'WinStoryController EXCEPTION: ' + e.getMessage() + ' at line ' + e.getLineNumber());
            // Return an empty list on error, not the test story, to avoid confusion.
            return new List<WinStory>();
        }
    }

    // Helper method to call the Einstein GPT service
    private static String getAiResponse(String promptText) {
        ConnectApi.EinsteinGptRequest request = new ConnectApi.EinsteinGptRequest();
        request.prompt = promptText;

        // Make the direct callout to the AI
        ConnectApi.EinsteinGptResponse response = ConnectApi.EinsteinGpt.getGenerations(request);
        
        if (response.generations != null && !response.generations.isEmpty()) {
            // Return the text from the first response generation
            return response.generations.get(0).text;
        }
        return null;
    }
}