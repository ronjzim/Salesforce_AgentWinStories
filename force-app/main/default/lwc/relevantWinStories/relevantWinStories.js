import { LightningElement, api, wire } from 'lwc';
import getStoriesFromAgentFlow from '@salesforce/apex/WinStoryController.getStoriesFromAgentFlow';
import getTestStories from '@salesforce/apex/WinStoryController.getTestStories';

export default class RelevantWinStories extends LightningElement {
    @api recordId;
    @api cardTitle = 'Relevant Win Stories';
    @api maxStories = 3;
    
    winStories = [];
    error;
    showLoadingSpinner = false;

    // Switch back to the original method for testing
    @wire(getStoriesFromAgentFlow, { opportunityId: '$recordId' })
    wiredStories({ error, data }) {
        console.log('=== Wire method called ===');
        console.log('RecordId:', this.recordId);
        console.log('Data received:', data);
        console.log('Error received:', error);
        
        if (data) {
            console.log('Data type:', typeof data);
            console.log('Data length:', Array.isArray(data) ? data.length : 'Not an array');
            console.log('Data contents:', JSON.stringify(data, null, 2));
            
            this.winStories = data;
            this.error = undefined;
            this.showLoadingSpinner = false;
            
            console.log('winStories set to:', this.winStories);
            console.log('hasStories:', this.hasStories);
        } else if (error) {
            console.error('=== Error in wire method ===');
            console.error('Error:', error);
            console.error('Error message:', error.body?.message);
            console.error('Error stack:', error.body?.stackTrace);
            
            this.error = error;
            this.winStories = [];
            this.showLoadingSpinner = false;
        }
    }

    get hasStories() {
        return this.winStories && this.winStories.length > 0;
    }

    get displayedStories() {
        return this.winStories.slice(0, this.maxStories);
    }

    get emptyStateMessage() {
        if (this.error) {
            return `Error: ${this.error.body?.message || 'Unknown error occurred'}`;
        }
        return 'No relevant win stories found for this opportunity.';
    }

    fetchRelevantStories() {
        this.showLoadingSpinner = true;
        
        // Call the imperative method to refresh data
        getStoriesFromAgentFlow({ opportunityId: this.recordId })
            .then(result => {
                this.winStories = result;
                this.error = undefined;
                this.showLoadingSpinner = false;
            })
            .catch(error => {
                this.error = error;
                this.winStories = [];
                this.showLoadingSpinner = false;
                console.error('Error refreshing stories:', error);
            });
    }

    // Method for your agent to call to populate stories
    @api
    setWinStories(stories) {
        this.winStories = stories || [];
        this.showLoadingSpinner = false;
    }

    // Method for your agent to show/hide loading state
    @api
    setLoadingState(isLoading) {
        this.showLoadingSpinner = isLoading;
    }

    handleStoryClick(event) {
        const storyId = event.currentTarget.dataset.storyId;
        // Dispatch custom event for parent components to handle
        this.dispatchEvent(new CustomEvent('storyselected', {
            detail: { storyId: storyId }
        }));
    }

    handleRefresh() {
        this.fetchRelevantStories();
    }
}