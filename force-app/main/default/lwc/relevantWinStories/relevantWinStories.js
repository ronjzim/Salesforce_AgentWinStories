import { LightningElement, api, wire } from 'lwc';
import { getRecord, getFieldValue } from 'lightning/uiRecordApi';

// Import the new custom field
import WIN_STORY_JSON_FIELD from '@salesforce/schema/Opportunity.Win_Story_JSON_Response__c';

// The fields to load, including the standard Industry and our new field
const fields = ['Opportunity.Account.Industry', WIN_STORY_JSON_FIELD];

export default class RelevantWinStoriesLWC extends LightningElement {
    @api recordId;
    @api cardTitle = 'Relevant Win Stories';
    @api maxStories = 3;
    
    winStories = [];
    hasStories = false;

    @wire(getRecord, { recordId: '$recordId', fields })
    wiredOpportunity({ error, data }) {
        console.log('--- Wire Service Called ---')
        if (data) {
            console.log('1. Data received from Salesforce:', data);
            const jsonString = getFieldValue(data, WIN_STORY_JSON_FIELD);
            
            if (jsonString) {
                console.log('2. JSON string from field:', jsonString);
                try {
                    // 1. Clean the string by removing all newline characters.
                    const cleanJsonString = jsonString.replace(/\r?\n|\r/g, '');
                    console.log('3. Cleaned JSON string:', cleanJsonString);
                    
                    // 2. Now, parse the clean string.
                    this.winStories = JSON.parse(cleanJsonString);
                    this.hasStories = this.winStories.length > 0;

                    console.log('4. Successfully parsed stories:', this.winStories);
                    console.log('5. hasStories is now:', this.hasStories);

                } catch (e) {
                    console.error('Error parsing Win Story JSON:', e);
                    this.winStories = [];
                    this.hasStories = false;
                }
            } else {
                console.log('Result: the Win_Story_JSON_Response__c field is empty.');
                this.winStories = [];
                this.hasStories = false;
            }
        } else if (error) {
            console.error('Error loading opportunity:', error);
        }
    }
}