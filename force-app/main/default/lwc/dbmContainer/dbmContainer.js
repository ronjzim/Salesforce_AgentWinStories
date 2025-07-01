import { LightningElement, wire, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { getRecord } from 'lightning/uiRecordApi';

import { EVENTS, METRIC_NAMES, METRIC_TYPES, defaultReportDetails, transformConstantObject } from "c/dbmUtils";
import getReportDetailRecords from '@salesforce/apex/DBM25Controller.getReportDetailRecords';
import getPackageNamespace from '@salesforce/apex/DBM25Controller.getPackageNamespace';
import sendFeedback from '@salesforce/apex/DBM25Controller.sendFeedback';

import DBMREPORT_OBJECT from "@salesforce/schema/DBM_Report__c";
import REPORT_NAME_FIELD from "@salesforce/schema/DBM_Report__c.Name";
import REPORT_METRICLABEL_FIELD from "@salesforce/schema/DBM_Report__c.Metric_Label__c";
import REPORT_METRICTYPE_FIELD from "@salesforce/schema/DBM_Report__c.Metric_Type__c";
import REPORT_FOLDERNAME_FIELD from "@salesforce/schema/DBM_Report__c.Report_Folder_name__c";
import REPORT_REPORTID_FIELD from "@salesforce/schema/DBM_Report__c.Report_ID__c";
import REPORT_NUMBEROFGROUPINGS_FIELD from "@salesforce/schema/DBM_Report__c.Number_of_Groupings__c";
import REPORT_CHARTTYPE_FIELD from "@salesforce/schema/DBM_Report__c.Chart_Type__c";

import DBMREPORTGROUPING_OBJECT from "@salesforce/schema/DBM_Report_Grouping__c";
import GROUPING_NAME_FIELD from "@salesforce/schema/DBM_Report_Grouping__c.Name";
import GROUPING_DATASOURCE_FIELD from "@salesforce/schema/DBM_Report_Grouping__c.Data_Source__c";
import GROUPING_OBJECTNAME_FIELD from "@salesforce/schema/DBM_Report_Grouping__c.Object_Name__c";
import GROUPING_FIELDNAME_FIELD from "@salesforce/schema/DBM_Report_Grouping__c.Field_Name__c";
import GROUPING_DISPLAYASLINK_FIELD from "@salesforce/schema/DBM_Report_Grouping__c.Display_as_Link__c";

import DBMREPORTGROUPINGENTRY_OBJECT from "@salesforce/schema/DBM_Report_Grouping_Entry__c";
import GROUPINGENTRY_NAME_FIELD from "@salesforce/schema/DBM_Report_Grouping_Entry__c.Name";
import GROUPINGENTRY_GROUPING_FIELD from "@salesforce/schema/DBM_Report_Grouping_Entry__c.Grouping__c";
import GROUPINGENTRY_GROUPINGORDER_FIELD from "@salesforce/schema/DBM_Report_Grouping_Entry__c.Grouping_Order__c";
import GROUPINGENTRY_RECORDID_FIELD from "@salesforce/schema/DBM_Report_Grouping_Entry__c.Record_ID__c";
import GROUPINGENTRY_USER_FIELD from "@salesforce/schema/DBM_Report_Grouping_Entry__c.User__c";

import DBMDATAENTRY_OBJECT from "@salesforce/schema/DBM_Data_Entry__c";
import DATAENTRY_NAME_FIELD from "@salesforce/schema/DBM_Data_Entry__c.Name";
import DATAENTRY_VALUE_FIELD from "@salesforce/schema/DBM_Data_Entry__c.Value__c";
import DATAENTRY_GROUPING1_FIELD from "@salesforce/schema/DBM_Data_Entry__c.Grouping_1__c";
import DATAENTRY_GROUPING2_FIELD from "@salesforce/schema/DBM_Data_Entry__c.Grouping_2__c";

import USER_ID from '@salesforce/user/Id';
import USER_NAME from '@salesforce/schema/User.Name';
import USER_EMAIL from '@salesforce/schema/User.Email';

/*
const MENU_PANEL_OPTIONS = [
    { name: 'existing', label: 'View Existing Datasets', iconName: 'utility:record_alt' },
    { name: 'new', label: 'Build Dataset', iconName: 'utility:record_create' },
    { name: 'settings', label: 'Settings', iconName: 'utility:settings' },
    { name: 'help', label: 'Help', iconName: 'utility:help_center' },
]
*/

const FEEDBACK_TYPE_OPTIONS = [
    { label: `Bug - something isn\'t working properly`, value: 'Bug' },
    { label: `Feature Suggestion - something I think you should implement`, value: 'Feature Suggestion' },
    { label: `Design Suggestion - something I think should work/look differently`, value: 'Design Suggestion' },
    { label: `Question - something that isn't in the documentation`, value: 'Question' },
    { label: `Other`, value: 'Other' },        
];

const FEEDBACK_PRIORITY_OPTIONS = [
    { label: `Low - Just a suggestion, doesn't stop me from using/enjoying DBM2`, value: 'Low' },
    { label: `Medium - I think this would really help, but it isn't make or break`, value: 'Medium' },
    { label: `High - Signficant impact, but I can still technically make it work`, value: 'High' },
    { label: `Critical - It isn't working, I can't save/generate reports`, value: 'CRITICAL' },
];
export default class DbmContainer extends LightningElement {
    @wire(getRecord, { recordId: USER_ID, fields: [USER_NAME, USER_EMAIL] })
    user;

    @wire(getPackageNamespace)
    namespace;

    @track reportDetailRecords = [];

    get reportDetailRecordsLoaded() {
        return this._reportDetailRecordsLoaded;
    }
    set reportDetailRecordsLoaded(value) {
        this._reportDetailRecordsLoaded = value;
        this.showSpinner = !value;
    }
    _reportDetailRecordsLoaded = false;

    showSpinner = false;
    showFeedbackSpinner = false;    
    showHelpModal = false;
    showContactInfo = false;

    versionNumber = '1.0.0';
    shortLink = 'http://sfdc.co/dbm2'
    documentationLink = 'https://salesforce.quip.com/4iAgAXt6pK5u';
    slackChannelLink = 'https://salesforce.enterprise.slack.com/archives/C02JG9L59C3';
    demoVideoLink = 'https://salesforce.vidyard.com/watch/utZ7KSZRDLkxAQ4ictrfNz?';
    feedbackTypeOptions = FEEDBACK_TYPE_OPTIONS;
    feedbackPriorityOptions = FEEDBACK_PRIORITY_OPTIONS;
    feedbackResult;
    

    activePanel;
    get activePanelIs() {
        return {
            [this.activePanel]: true
        }
    }

    /* LIFECYCLE HOOKS */
    connectedCallback() {
        this.activePanel = Object.values(EVENTS.TARGETS)[0];
        if (!this.reportDetailRecordsLoaded) {
            this.fetchReportDetailRecords();
        }
    }

    /* ACTION FUNCTIONS */
    async fetchReportDetailRecords() {
        this.reportDetailRecordsLoaded = false;
        try {
            this.reportDetailRecords = await getReportDetailRecords();
        } catch (error) {
            console.log(`Error getting report detail records: ${JSON.stringify(error)}`);
        }
        this.reportDetailRecordsLoaded = true;
    }

    openHelpModal() {
        this.showHelpModal = true;
    }

    closeHelpModal() {
        this.showHelpModal = false;
        this.handleClearFeedbackResultClick();
    }

    /* EVENT HANDLERS */
    handleReportDetailChange(event) {
        // console.log(`in dbmContainer, reportDetails: ${JSON.stringify(event.detail)}`);
    }

    handleNewDatasetClick() {
        this.reportDetails = null;
        this.activePanel = NAVIGATION.TARGETS.DATASET_BUILDER;
    }

    handleRefreshRecordsList() {
        // console.log(`in handleRefreshRecordsList`);
        this.fetchReportDetailRecords();
    }

    handleNavigation(event) {
        // console.log(`in dbmContainer handleNavigation, event = ${JSON.stringify(event.detail)}`);
        this.reportDetails = this.processApexRecord(event.detail.reportDetailRecord, event.detail.isClone);
        this.activePanel = event.detail.target;
    }

    handleCopyToClipboard(event) {
        // console.log(`in handleCopyToClipboard`);// ${event}`);
        let copyString;
        if (event.detail.string) {
            copyString = event.detail.string;
        } else if (event.detail.sobjectRecord) {
            copyString = JSON.stringify(this.processApexRecord(event.detail.sobjectRecord));
        }
        navigator.clipboard.writeText(copyString).then(
            () => {
                /* clipboard successfully set */
                const toast = new ShowToastEvent({
                    title: 'Success',
                    message: 'A JSON (code) string containing your report details has been successfully copied to your clipboard',
                    variant: 'success',
                });
                this.dispatchEvent(toast);

            },
            async () => {
                /* clipboard write failed */
                await LightningAlert.open({
                    message: 'There was an error copying to the clipboard',
                    theme: 'error', // a red theme intended for error states
                    label: 'Error!', // this is the header text
                });
            },
        );
    }

    handleSpinnerChange(event) {
        this.showSpinner = event.detail;
    }

    handleOpenReport(event) {
        window.open('/' + event.detail, '_blank');
    }

    handleFeedbackResponseChange() {
        this.showContactInfo = !this.showContactInfo;
    }

    async handleSubmitFeedbackClick() {
        const feedbackFields = ['type', 'priority', 'comments', 'response', 'name', 'email'];
        let feedback = {};
        let isValid = true;
        feedbackFields.forEach(field => {
            // console.log(`field name = feedback${field.charAt(0).toUpperCase() + field.slice(1)}}`);
            let fieldEl = this.template.querySelector(`.feedback${field.charAt(0).toUpperCase() + field.slice(1)}`);
            if (fieldEl) {
                feedback[field] = fieldEl.value || fieldEl.checked;
                isValid = fieldEl.reportValidity() && isValid;
            }
        })
        if (isValid) {
            const subject = `Feedback — ${feedback.type} (${feedback.priority} priority)`;
            let responseRequestedBody = (feedback.response ? `RESPONSE REQUESTED<br>${(this.showContactInfo ? `${feedback.name} / ${feedback.email}<br>` : '')}<br>` : '')
            const body = `${responseRequestedBody}COMMENTS:<br>${feedback.comments}`;
            // const body = (feedback.response ? 'RESPONSE REQUESTED<br>' : '') + feedback.comments;
            this.showFeedbackSpinner = true;
            let response = await sendFeedback({ subject, body });
            if (response.isSuccess) {
                this.feedbackResult = 'Thank you for your feedback!' + (feedback.response ? ' Someone will follow up with you shortly.' : '');
            } else {
                this.feedbackResult = 'Sorry, there was an error submitting your feedback. Please try again, or contact David Fromstein directly.';
            }
            this.showFeedbackSpinner = false;            
        }
    }

    handleClearFeedbackResultClick() {
        this.feedbackResult = null;
        this.showContactInfo = false;
    }

    /* UTILITY FUNCTIONS */
    processApexRecord(sobjectData, isClone) {
        // console.log(`in dbmContainer processApexRecord`);
        // Start by assuming the report details will be the default values
        let reportDetails = defaultReportDetails();
        // If SObject data is being passed in, then overwrite the default values with that data
        if (sobjectData) {
            reportDetails.isClone = isClone;
            // Populate Report Details properties
            reportDetails.id = sobjectData.Id;
            reportDetails.reportName = sobjectData[REPORT_NAME_FIELD.fieldApiName];
            let metricLabel = sobjectData[REPORT_METRICLABEL_FIELD.fieldApiName];
            let standardLabel = Object.values(METRIC_NAMES).find(metricName => metricName.label === metricLabel);
            // console.log(`standardLabel = ${standardLabel}`);
            if (standardLabel) {
                reportDetails.metricName = standardLabel.value;
            } else {
                reportDetails.metricName = METRIC_NAMES.CUSTOM.value;
                reportDetails.metricIsCustom = true;
                reportDetails.customMetricName = metricLabel;
            }
            reportDetails.metricType = Object.values(METRIC_TYPES).find(type => type.label === sobjectData[REPORT_METRICTYPE_FIELD.fieldApiName] || type.value === sobjectData[REPORT_METRICTYPE_FIELD.fieldApiName]).value;            
            reportDetails.folderDeveloperName = sobjectData[REPORT_FOLDERNAME_FIELD.fieldApiName];
            reportDetails.reportId = sobjectData[REPORT_REPORTID_FIELD.fieldApiName];
            reportDetails.numGroupings = sobjectData[REPORT_NUMBEROFGROUPINGS_FIELD.fieldApiName];
            reportDetails.chartType = sobjectData[REPORT_CHARTTYPE_FIELD.fieldApiName];
            // console.log(`Report Object details finished: ${JSON.stringify(reportDetails)}`);

            let data = [];

            // Populate Grouping and Grouping Entry properties
            sobjectData[this.prependNamespace('DBM_Report_Groupings__r')].forEach((groupingSobject, groupingIndex) => {
                // console.log(`in grouping ${groupingIndex}: ${JSON.stringify(groupingSobject)}`);
                let grouping = reportDetails.groupings[groupingIndex];
                grouping.id = groupingSobject.Id;
                grouping.name = groupingSobject[GROUPING_NAME_FIELD.fieldApiName];
                grouping.dataSource = groupingSobject[GROUPING_DATASOURCE_FIELD.fieldApiName];
                grouping.objectName = groupingSobject[GROUPING_OBJECTNAME_FIELD.fieldApiName];
                grouping.fieldName = groupingSobject[GROUPING_FIELDNAME_FIELD.fieldApiName];
                // grouping.displayAsLink = groupingSobject[GROUPING_DISPLAYASLINK_FIELD.fieldApiName];
                let groupingEntrySobjects = sobjectData[this.prependNamespace('DBM_Report_Grouping_Entries__r')].filter(gentrySobject => gentrySobject[GROUPINGENTRY_GROUPING_FIELD.fieldApiName] === grouping.id);
                grouping.entries = groupingEntrySobjects.map((gentrySobject, gentryIndex) => {
                    if (groupingIndex === 0) {
                        data.push([null]);
                    } else if (groupingIndex === 1 && gentryIndex > 0) {
                        data.forEach(row => {
                            row.push(null);
                        })
                    }
                    return {
                        id: gentrySobject.Id,
                        value: gentrySobject[GROUPINGENTRY_NAME_FIELD.fieldApiName],
                        recordId: gentrySobject[GROUPINGENTRY_RECORDID_FIELD.fieldApiName],
                    }
                });
            });
            // console.log(`groupings after groupings populated: ${JSON.stringify(reportDetails.groupings)}`);
            // console.log(`data after grouping entries populated: ${JSON.stringify(data)}`);

            // Populate Data Entry properties
            let dataEntrySobjects = sobjectData[this.prependNamespace('DBM_Data_Entries__r')];
            dataEntrySobjects.forEach(dataEntrySobject => {
                const grouping1 = dataEntrySobject[DATAENTRY_GROUPING1_FIELD.fieldApiName];
                const grouping2 = dataEntrySobject[DATAENTRY_GROUPING2_FIELD.fieldApiName];
                // console.log(`dataEntry = ${JSON.stringify(dataEntrySobject)}`);
                // console.log(`grouping1 = ${grouping1}, grouping2 = ${grouping2}`);
                let rowIndex = reportDetails.groupings[0].entries.findIndex(groupingEntry => groupingEntry.id === grouping1);
                let colIndex = grouping2 ? reportDetails.groupings[1].entries.findIndex(groupingEntry => groupingEntry.id === grouping2) : 0;
                // console.log(`rowIndex = ${rowIndex}, colIndex = ${colIndex}, value = ${dataEntrySobject[DATAENTRY_VALUE_FIELD.fieldApiName]}`);

                data[rowIndex][colIndex] = dataEntrySobject[DATAENTRY_VALUE_FIELD.fieldApiName];
            });
            reportDetails.data = data;
        }
        // console.log(`reportDetails at end of processApexRecord = ${JSON.stringify(reportDetails)}`);
        return reportDetails;
    }

    prependNamespace(str) {
        if (this.namespace?.data) {
            return `${this.namespace.data}__${str}`;
        }
        return str;
    }


    /* Unused code related to menu panels (no longer in use)
    selectMenuPanelOption(optionName) {
        console.log(`in selectMenuPanelOption, selecting "${optionName}"`);
        this.selectedMenuPanelOption = optionName;
        this.menuPanelOptions.forEach((option) => {
            option.isSelected = option.name === optionName;
        })
        this.menuPanelOptions = this.menuPanelOptions.map(option => option);
    }

    handleMenuPanelToggleClick() {
        this.menuPanelIsOpen = !this.menuPanelIsOpen;
        let appContainer = this.template.querySelector('.appContainer');
        appContainer.classList.toggle('panelCollapsed');
    }

    handleMenuPanelOptionClick(event) {
        console.log(`in handleMenuPanelOptionClick`);
        console.log(`${JSON.stringify(event.currentTarget.dataset)}`);
        this.selectMenuPanelOption(event.currentTarget.dataset.name);
    }


    newMenuPanelOption(optionObject, isSelected) {
        const itemClassList = ['slds-nav-vertical__item', 'slds-nav-vertical__title', 'slds-p-left_x-small'];
        let newOption = {
            isSelected,
            name: optionObject.name,
            label: optionObject.label,
            iconName: optionObject.iconName,
            get navItemClass() {
                let classList = [...itemClassList];
                if (this.isSelected) {
                    classList.push('slds-is-active');
                }
                return classList.join(' ');
            }
        }
        return newOption;
    }*/
    /**/

}