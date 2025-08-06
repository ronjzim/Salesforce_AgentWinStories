# AI-Powered Customer Win Story Component

## Description

This project is a Salesforce Lightning Web Component (LWC) that displays relevant customer win stories directly on an Opportunity record page. It leverages Einstein Prompt Builder with Data Cloud search retrieval to intelligently analyze the Opportunity's Account details and perform a semantic search against a knowledge base to find and display the most relevant success stories.

The component provides sales users with immediate access to powerful social proof, tailored to the specific customer they are engaging with, with the ability to refresh and get updated win stories on demand.

***
## Features

* **Einstein Prompt Builder Integration:** Uses Prompt Builder with Data Cloud search retrieval to find relevant win stories based on Opportunity account details.
* **Semantic Content Search:** Performs AI-powered search against a connected Data Cloud library (e.g., Highspot content) for win stories that match the opportunity context.
* **Dynamic LWC Display:** Presents the returned win stories in a clean card layout on the Opportunity page with customer names, relevance scores, and summaries.
* **Manual Refresh Capability:** Users can click a refresh button to trigger new win story searches and get updated results.
* **Reactive Data Loading:** The LWC automatically displays win stories when the custom field is populated and updates when new data is available.

***
## Requirements & Prerequisites

Before deploying this component, you must configure your Salesforce org correctly.

1. **Einstein Features:** Your org must have:
   - **Einstein Prompt Builder** enabled and configured
   - **Data Cloud** enabled with search capabilities
   - **Einstein Search** configured and active

2. **Data Cloud Library:** You must have a Data Cloud library configured with your win story documents (e.g., connected to Highspot or other content repositories).

3. **Custom Field:** You must create a custom field on the **Opportunity** object to store the JSON response from the Flow.
   * **Data Type:** `Text Area (Long)`
   * **Field Label:** `Win Story JSON Response`
   * **API Name:** `Win_Story_JSON_Response__c`

4. **Permissions:** Ensure your users have the following permission sets:
   - Einstein Search and Prompt Builder User
   - Data Cloud Subscriber User
   - Any additional Agentforce permissions if using Agentforce features

***
## Setup & Installation

Follow these steps to get the component working in your org.

#### 1. Create the Prompt Template

Create a Prompt Template in Einstein Prompt Builder:

* **Name:** `Relevant_Win_Stories_Prompt`
* **Type:** Field Generation
* **Object:** Opportunity
* **Data Retrieval:** Configure Einstein Search retriever pointing to your Data Cloud library
* **Prompt:** Create a prompt that searches for win stories relevant to the opportunity's industry and account details
* **Output:** Configure to return a JSON array of win stories with structure:
  ```json
  [
    {
      "id": "document_id",
      "customerName": "Customer Name",
      "relevanceScore": 0.95,
      "summary": "Brief summary of the win story"
    }
  ]
  ```

#### 2. Create the Flow

Create an autolaunched Flow that uses the prompt template:

* **Name:** `Get_Win_Stories_From_Prompt`
* **Type:** Autolaunched Flow
* **Input Variables:**
  * `recordID` (Type: Text) - The Opportunity record ID
  * `opportunityAccountName` (Type: Text) - Account name for context
  * `opportunityIndustry` (Type: Text) - Account industry for context

* **Flow Elements:**
  1. **Get Records:** Get the Opportunity record using `recordID`
  2. **Generate Prompt Response:** Use your `Relevant_Win_Stories_Prompt` template
     - Input: Pass the Opportunity record
     - Output: Store result in `promptResponse` variable
  3. **Update Records:** Update the Opportunity record
     - Set `Win_Story_JSON_Response__c` = `{!promptResponse}`

* **Activate** the Flow when complete.

#### 3. Deploy the Components

Deploy the LWC and Apex class to your org using VS Code and SFDX:

```bash
sfdx force:source:deploy -p force-app/main/default/lwc/relevantWinStories
sfdx force:source:deploy -p force-app/main/default/classes/WinStoryFlowHelper.cls
```

#### 4. Add to Page Layout

1. Navigate to **Setup → Object Manager → Opportunity → Lightning Record Pages**
2. Edit your Opportunity record page
3. Drag the **Relevant Win Stories** component onto the page
4. Configure the component properties:
   - **Card Title:** "Relevant Win Stories" (or customize as needed)
   - **Max Stories:** 3 (or desired number)
5. Save and activate the page

***
## How It Works

1. **Initial Load:** When an Opportunity page loads, the LWC checks if the `Win_Story_JSON_Response__c` field has data and displays any existing win stories.

2. **Manual Refresh:** Users can click the refresh button in the component, which:
   - Calls the `WinStoryFlowHelper.triggerWinStoryFlow()` Apex method
   - The Apex method launches the `Get_Win_Stories_From_Prompt` Flow
   - The Flow uses Einstein Prompt Builder to search the Data Cloud library
   - New win stories are saved to the `Win_Story_JSON_Response__c` field
   - The LWC automatically updates to display the new results

3. **Data Display:** Win stories are displayed in cards showing:
   - Customer name
   - Relevance score
   - Summary of the win story
   - Configurable maximum number of stories

***
## Troubleshooting

**Common Issues:**

1. **Einstein Search Retriever Errors:**
   - Verify Data Cloud library is active and accessible
   - Check that Einstein Search indices are built
   - Ensure proper permissions are assigned

2. **Flow Execution Timeouts:**
   - Data Cloud searches can take time; this is normal
   - The component handles long-running operations gracefully

3. **Permission Issues:**
   - Verify all required Einstein and Data Cloud permission sets are assigned
   - Check both user permissions and automated process user permissions

4. **No Win Stories Displayed:**
   - Check that the custom field `Win_Story_JSON_Response__c` exists
   - Verify the Flow is active and properly configured
   - Test the Prompt Template directly in Prompt Builder

***
## Customization

The component is designed to be flexible and can be customized:

- **Styling:** Modify the CSS in the LWC to match your org's design
- **Data Structure:** Adjust the JSON structure in the Prompt Template and corresponding LWC parsing
- **Search Logic:** Enhance the prompt to include additional context or search criteria
- **Display Options:** Add more fields to the win story cards or