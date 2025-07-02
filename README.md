# AI-Powered Customer Win Story Component

## Description

This project is a Salesforce Lightning Web Component (LWC) that displays relevant customer win stories directly on an Opportunity record page. It leverages an Einstein Copilot-powered Flow to intelligently analyze the Opportunity's Account details, infer a specific industry, and perform a semantic search against a knowledge base to find and display the most relevant success stories.

This provides sales users with immediate access to powerful social proof, tailored to the specific customer they are engaging with.

***
## Features

* **AI-Powered Industry Inference:** Automatically refines broad industry categories (e.g., "Financial Services") into more specific ones (e.g., "Financial Technology") for better search results.
* **Semantic Content Search:** Uses an AI agent to search a connected data library (e.g., Highspot) or any form of unstructured data for win stories that match the inferred industry.
* **Dynamic LWC Display:** Presents the returned win stories in a clean card layout on the Opportunity page.
* **Asynchronous Processing:** The AI analysis runs in the background, saving the result to the record, which the LWC then reactively displays.

***
## Requirements & Prerequisites

Before deploying this component, you must configure your Salesforce org correctly.

1.  **Einstein Copilot:** Your org must have **Einstein Copilot enabled** and fully provisioned. The "Generate AI Agent Response" action must be available in the Flow Builder.

2.  **Custom Field:** You must create a custom field on the **Opportunity** object to store the JSON response from the Flow.
    * **Data Type:** `Text Area (Long)`
    * **Field Label:** `Win Story JSON Response`
    * **API Name:** `Win_Story_JSON_Response__c`

***
## Setup & Installation

Follow these steps to get the component working in your org.

#### 1. Create the Flow

You must create a two-step, autolaunched Flow that powers the component.

* **Name:** `Get_Win_Stories_From_Prompt`
* **Input Variables:**
    * `opportunityAccountName` (Type: Text)
    * `opportunityIndustry` (Type: Text)
* **Step 1: Infer Industry**
    * Add a "Generate AI Agent Response" action.
    * **Prompt:** Use a prompt to infer a specific industry from the input variables.
    * **Output:** Store the result in a new Flow variable called `inferredIndustry`.
* **Step 2: Get Win Stories**
    * Add a second "Generate AI Agent Response" action.
    * **Prompt:** Use the `{!inferredIndustry.value}` to search your knowledge base for win stories and return them as a raw JSON array.
    * **Output:** Store the result in a new Flow variable called `promptResponse`.
* **Step 3: Update the Record**
    * Add a final **"Update Records"** element.
    * Configure it to update the triggering Opportunity record.
    * Set the `Win_Story_JSON_Response__c` field to the value of `{!promptResponse.value}`.
* **Activate** the new version of your Flow.

#### 2. Deploy the LWC

Deploy the `winStoryViewer` LWC to your org using VS Code and SFDX.

```bash
sfdx force:source:deploy -p force-app/main/default/lwc/winStoryViewer