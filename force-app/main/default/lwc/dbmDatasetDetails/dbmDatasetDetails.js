import { LightningElement, api, wire, track } from 'lwc';
import LightningConfirm from 'lightning/confirm';
import { METRIC_TYPES, METRIC_NAMES, NUM_GROUPINGS_OPTIONS, DATA_SOURCE_OPTIONS, VALIDATEABLE_COMPONENTS, /*validate,*/ switchGroupings, transformConstantObject } from 'c/dbmUtils';
import getPicklistValues from '@salesforce/apex/DBM25Controller.getPicklistValues';

export default class DbmDatasetDetails extends LightningElement {
    @api
    get reportDetails() {
        return this._reportDetails;
    }
    set reportDetails(value) {
        this._reportDetails = JSON.parse(JSON.stringify(value));
    }
    @track _reportDetails;

    metricTypes = transformConstantObject(METRIC_TYPES);
    metricNames = transformConstantObject(METRIC_NAMES);
    dataSources = transformConstantObject(DATA_SOURCE_OPTIONS);

    reportName;
    exampleDisclaimer = 'Any previews or examples in Dashboard Magic are just that. After creating your fake data, you\'ll be able to display it on a standard Lightning dashboard chart with exactly the same functionality as any other.';

    // numGroupingsOptions = NUM_GROUPINGS_OPTIONS;
    get numGroupingsOptions() {
        return NUM_GROUPINGS_OPTIONS.map(option => {
            return {
                ...option,
                variant: option.value == this.reportDetails?.numGroupings ? 'brand' : ''
            }
        });
    }

    numGroupings = this.numGroupingsOptions[0].value;

    /* WIRE METHODS */

    /* LIFECYCLE HOOKS */
    connectedCallback() {
    }

    renderedCallback() {
    }

    /* ACTION FUNCTIONS */
    dispatchDetails() {
        const detail = this.reportDetails;
        this.dispatchEvent(new CustomEvent('reportdetailchange', { detail }));
    }

    async confirmGroupingPropertyClear(event, functionName) {
        console.log(`in confirmGroupingPropertyClear`);
        const targetElement = event.target;
        const groupingIndex = Number(targetElement.dataset.index);
        let grouping = this.reportDetails.groupings[groupingIndex];
        if (grouping.entries.some(entry => {
            return entry.value;
        })) {
            console.log(`at least one grouping entry has a value, so we need to ask for confirmation`);
            const result = await LightningConfirm.open({
                // message: 'Changing the data source will clear all entries for this value. Proceed?',
                message: targetElement.dataset.confirmClearMessage,
                label: 'Confirm Clearing Entries'
                // variant: 'headerless',
            });
            if (result) {
                console.log(`confirmed, let's delete`);
                targetElement[functionName]();
                grouping.entries = [];
                grouping.presetEntries = [];    // Not sure if this is necessary, better safe than sorry
                this.dispatchDetails();

            }
        } else {
            console.log(`no grouping entry has a value, so no confirmation is required`)
            targetElement[functionName]();
            grouping.entries = [];
            grouping.presetEntries = [];
            this.dispatchDetails();
        }
    }

    resetGrouping2() {
        this.reportDetails.numGroupings = 1;
        this.reportDetails.groupings[1].entries = [];
        this.reportDetails.groupings[1].name = null;
        this.reportDetails.groupings[1].dataSource = this.dataSources.default.value;
        this.reportDetails.data.forEach(row => {
            row.length = 1;
        });
        this.dispatchDetails();
    }

    /* EVENT HANDLERS */
    handleReportDetailChange(event) {
        this.reportDetails[event.target.name] = event.detail.value;
        if (event.target.name === 'metricName') {
            this.reportDetails.metricIsCustom = event.detail.value === METRIC_NAMES.CUSTOM.value;
        }
        this.dispatchDetails();
    }

    async handleGroupingNumberChange(event) {
        console.log(`in handleGroupingNumberChange, ${event.target.value}`)
        if (event.target.value == 2) {
            this.reportDetails.numGroupings = event.target.value;
            this.dispatchDetails();
        } else if (this.reportDetails.numGroupings == 2 && this.reportDetails.groupings[1].entries.length > 1) {
            const result = await LightningConfirm.open({
                message: 'Removing the second grouping level will clear any values entered under that grouping level. Proceed?',
                label: 'Confirm Removing Grouping Level'
            });
            if (result) {
                this.resetGrouping2();
            }
        } else {
            this.resetGrouping2();
        }
    }

    handleGroupingDetailChange(event) {
        const groupingIndex = Number(event.target.dataset.index);
        let grouping = this.reportDetails.groupings[groupingIndex];
        grouping[event.target.name] = event.detail.value;
        if (event.target.name === 'dataSource') {
            let selectedDataSource = this.dataSources.options.find(source => source.value === grouping.dataSource);
            if (selectedDataSource?.presetEntries) {
                grouping.presetEntries = selectedDataSource.presetEntries;
            }
        }
        this.dispatchDetails();
    }

    handleGroupingObjectFieldChange(event) {
        const groupingIndex = Number(event.target.dataset.index);
        let grouping = this.reportDetails.groupings[groupingIndex];
        grouping.objectName = event.detail.objectValue;
        grouping.fieldName = event.detail.fieldValue;
        this.dispatchDetails();

        if (grouping.dataSource === DATA_SOURCE_OPTIONS.PICKLIST.value) {
            getPicklistValues({ objectName: event.detail.objectValue, fieldName: event.detail.fieldValue }).
                then(result => {
                    this.reportDetails.groupings[groupingIndex].presetEntries = result; // Need to use full reportDetails reference because just referencing `grouping` wasn't working. Maybe because of the async promise?
                    this.dispatchDetails();
                }).catch(error => {
                    console.log(`getPicklistValues error: ${JSON.stringify(error)}`);
                });
        }
    }

    handleGroupingPropertyClearRequest(event) {
        console.log(`in handleGroupingPropertyClearRequest`);
        this.confirmGroupingPropertyClear(event, 'clearSelection');
    }

    handleGroupingPropertyObjectClearRequest(event) {
        console.log(`in handleGroupingPropertyObjectClearRequest`);
        this.confirmGroupingPropertyClear(event, 'clearObjectSelection');
    }

    handleGroupingPropertyFieldClearRequest(event) {
        console.log(`in handleGroupingPropertyFieldClearRequest`);
        this.confirmGroupingPropertyClear(event, 'clearFieldSelection');
    }

    handleSwitchGroupingsClick() {
        this.reportDetails = switchGroupings(this.reportDetails);
        this.dispatchDetails();
    }

    /* UTILITY FUNCTIONS */
    @api validate() {
        let allValid = true;

        // Grouping names must be different from each other or it will cause errors in the Apex code
        if (this.reportDetails.numGroupings > 1) {
            let repeatGroupings = {};
            this.reportDetails.groupings.forEach((grouping, index) => {
                if (repeatGroupings[grouping.name]) {
                    repeatGroupings[grouping.name].push(index);
                } else {
                    repeatGroupings[grouping.name] = [index];
                }
            });

            this.reportDetails.groupings.forEach((grouping, index) => {
                let el = this.template.querySelector(`.groupingName[data-index="${index}"]`);
                if (repeatGroupings[grouping.name].length > 1) {
                    el.setCustomValidity(`Grouping names must be unique`);
                    allValid = false;
                } else {
                    el.setCustomValidity('');
                }
            });
        }

        for (let tagName of VALIDATEABLE_COMPONENTS) {
            for (let el of this.template.querySelectorAll(tagName)) {
                allValid = el.reportValidity() && allValid;
            }
        }

        return allValid;
    }
}