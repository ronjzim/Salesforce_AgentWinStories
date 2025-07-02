import { LightningElement, api, wire } from 'lwc';
import { getRecord, getFieldValue } from 'lightning/uiRecordApi';
import { refreshApex } from '@salesforce/apex'; // Import refreshApex to refresh the wire service

// Import the new custom field
import WIN_STORY_JSON_FIELD from '@salesforce/schema/Opportunity.Win_Story_JSON_Response__c';

// The fields to load, including the standard Industry and our new field
const fields = ['Opportunity.Account.Industry', WIN_STORY_JSON_FIELD];

export default class RelevantWinStoriesLWC extends LightningElement {
    @api recordId;
    @api cardTitle = 'Relevant Win Stories';
    @api maxStories = 3;

    @api winStories = [];
    @api hasStories = false;

    wiredOpportunityResult; // Store the wire result for refreshApex

    @wire(getRecord, { recordId: '$recordId', fields })
    wiredOpportunity(result) {
        this.wiredOpportunityResult = result; // Capture the wire result for refreshApex
        const { error, data } = result;

        console.log('--- Wire Service Called ---');
        console.log('Record ID:', this.recordId);
        console.log('Fields being queried:', fields);

        if (data) {
            console.log('1. Data received from Salesforce:', JSON.stringify(data, null, 2));
            const jsonString = getFieldValue(data, WIN_STORY_JSON_FIELD);

            if (jsonString) {
                console.log('2. JSON string from field:', jsonString);
                try {
                    // 1. Clean the string by removing all newline characters.
                    const cleanJsonString = jsonString.replace(/\r?\n|\r/g, '');
                    console.log('3. Cleaned JSON string:', cleanJsonString);

                    // 2. Parse the clean string.
                    const parsedData = JSON.parse(cleanJsonString);

                    // 3. Parse the "value" field if it exists and is a string.
                    if (typeof parsedData.value === 'string') {
                        parsedData.value = JSON.parse(parsedData.value);
                    }

                    // 4. Validate and filter the parsed data.
                    if (Array.isArray(parsedData.value)) {
                        this.winStories = parsedData.value.filter(
                            story => story.id && story.customerName && story.summary
                        );
                        this.hasStories = this.winStories.length > 0;
                    } else {
                        console.warn('Parsed data is not an array:', parsedData.value);
                        this.winStories = [];
                        this.hasStories = false;
                    }

                    console.log('4. Validated and filtered stories:', this.winStories);
                    console.log('5. hasStories is now:', this.hasStories);
                } catch (e) {
                    console.error('Error parsing Win Story JSON:', e);
                    this.winStories = [];
                    this.hasStories = false;
                }
            } else {
                console.warn('Result: the Win_Story_JSON_Response__c field is empty.');
                this.winStories = [];
                this.hasStories = false;
            }
        } else if (error) {
            console.error('Error loading opportunity:', error);
        }
    }

    @api showLoadingSpinner = false;

    handleRefresh() {
        console.log('Refresh button clicked. Refreshing wire service...');
        this.showLoadingSpinner = true; // Show spinner
        if (this.wiredOpportunityResult) {
            refreshApex(this.wiredOpportunityResult)
                .then(() => {
                    console.log('Wire service refreshed successfully.');
                    console.log('Updated wiredOpportunityResult:', this.wiredOpportunityResult);
                })
                .catch(error => {
                    console.error('Error refreshing wire service:', error);
                })
                .finally(() => {
                    this.showLoadingSpinner = false; // Hide spinner
                });
        } else {
            console.warn('No wire result available to refresh.');
            this.showLoadingSpinner = false; // Hide spinner
        }
    }
}