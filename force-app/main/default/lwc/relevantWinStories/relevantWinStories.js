import { LightningElement, api, wire } from 'lwc';
import { getRecord, getFieldValue } from 'lightning/uiRecordApi';
import { refreshApex } from '@salesforce/apex';
import triggerWinStoryFlow from '@salesforce/apex/WinStoryFlowHelper.triggerWinStoryFlow';

// Import the custom field we need to read from the Opportunity
import WIN_STORY_JSON_FIELD from '@salesforce/schema/Opportunity.Win_Story_JSON_Response__c';

// Define the fields to be loaded by the wire service
const fields = [WIN_STORY_JSON_FIELD];

export default class RelevantWinStoriesLWC extends LightningElement {
    @api recordId;
    @api cardTitle = 'Relevant Win Stories';
    @api maxStories = 3;

    winStories = [];
    error;
    wiredOpportunityResult; // Property to hold the wired result for refreshApex
    isRefreshing = false; // Track refresh state

    // Wire service to get the record data automatically
    @wire(getRecord, { recordId: '$recordId', fields })
    wiredOpportunity(result) {
        this.wiredOpportunityResult = result; // Store the result for the refresh function
        const { error, data } = result;

        console.log('--- LWC wiredOpportunity Fired ---');
        console.log('Current refresh state:', this.isRefreshing);

        if (data) {
            // Use getFieldValue to safely extract the data from the record
            const jsonString = getFieldValue(data, WIN_STORY_JSON_FIELD);
            console.log('1. Raw JSON Response from Field:', jsonString);

            if (jsonString) {
                try {
                    // The string from the field is a direct JSON array.
                    // We can parse it directly.
                    const parsedArray = JSON.parse(jsonString);
                    console.log('2. Successfully Parsed JSON:', parsedArray);

                    // Best practice: ensure the parsed data is actually an array
                    if (Array.isArray(parsedArray)) {
                        this.winStories = parsedArray;
                        this.error = undefined; // Clear any previous errors
                        
                        if (this.isRefreshing) {
                            console.log('3. Refresh complete - new stories loaded:', this.winStories.length);
                            this.isRefreshing = false;
                        }
                    } else {
                        // Handle cases where the JSON is valid but not an array
                        throw new Error('Data format is invalid; expected an array.');
                    }
                } catch (e) {
                    console.error('Error parsing Win Story JSON:', e);
                    this.error = 'Could not display win stories. The data format is invalid.';
                    this.winStories = [];
                    this.isRefreshing = false;
                }
            } else {
                // This is a normal case where the field is empty. Reset the stories.
                console.log('Result: The Win_Story_JSON_Response__c field is currently empty.');
                this.winStories = [];
                this.error = undefined;
                this.isRefreshing = false;
            }
        } else if (error) {
            console.error('Error loading opportunity data:', error);
            this.error = 'An error occurred while loading data from Salesforce.';
            this.winStories = [];
            this.isRefreshing = false;
        }
    }

    /**
     * @description Exposes a getter to the template to easily check if stories exist.
     */
    get hasStories() {
        return this.winStories && this.winStories.length > 0;
    }

    /**
     * @description Public method to allow parent components or flows to trigger a refresh.
     * This launches the "Get Win Stories From Prompt" Flow to repopulate the data.
     */
    @api
    handleRefresh() {
        console.log('=== REFRESH BUTTON CLICKED ===');
        console.log('Record ID:', this.recordId);
        
        this.isRefreshing = true;
        
        // Call Apex method to trigger the Flow
        console.log('Calling Apex to trigger Flow...');
        triggerWinStoryFlow({ recordId: this.recordId })
            .then(result => {
                console.log('Flow triggered successfully:', result);
                console.log('Now refreshing wire service to get updated data...');
                
                // After Flow completes, refresh the wire service to get updated data
                return refreshApex(this.wiredOpportunityResult);
            })
            .then(() => {
                console.log('Wire refresh completed - should have new data now');
                // The isRefreshing flag will be reset in the wiredOpportunity method
            })
            .catch(error => {
                console.error('Error during refresh process:', error);
                this.error = 'Failed to refresh win stories: ' + error.body?.message || error.message;
                this.isRefreshing = false;
            });
    }
}