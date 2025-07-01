// TODO: add Settings
// TODO: figure out what to call "percent" metric type in the picklist (Percent, percent, percent-fixed, etc)
// TODO: add status in toolbar
// TODO (on hold): fix alphanumeric ordering
// TODO (on hold): Add users to the report details object so images can be shown on screen
// TODO (on hold): add option to display text options as links
// TODO (on hold): make content pane components auto-focus on first element
// TODO (on hold/complete?): finish post-save behaviour within LWC
// TODO (complete, I think): percent needs to be divided by 100
// TODO (complete??): fix preview pane sizing
// TODO (complete): build list view
// TODO (complete): set up timeout for error if PE never returns
// TODO (complete): disable bulk add button for non-text options
// TODO (complete): don't include blank cells when not checked (and validate to ensure at least 1 is populated)
// TODO (complete): add redo/undo functionality
// TODO (complete): add re-ordering
// TODO (complete): fix spinner not blocking builer header
// TODO (complete): set final error message with copyable JSON
// TODO (complete): add Help
// TODO (complete): add email notifications
// TODO (complete): add chart to report

import { LightningElement, track, api, wire } from 'lwc';
import { subscribe, unsubscribe, onError, setDebugFlag, isEmpEnabled, } from 'lightning/empApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import LightningConfirm from 'lightning/confirm';
import LightningAlert from 'lightning/alert';
import LightningPrompt from 'lightning/prompt';
import { EVENTS, METRIC_NAMES, PREVIEW_PANE_SIZES, defaultReportDetails, transformConstantObject } from "c/dbmUtils";
import saveReportDetails from '@salesforce/apex/DBM25Controller.saveReportDetails';
import createReport from '@salesforce/apex/DBM25Controller.createReport';
import getReportFolders from '@salesforce/apex/DBM25Controller.getReportFolders';
import getDefaultReportFolderName from '@salesforce/apex/DBM25Controller.getDefaultReportFolderName';
import sendFeedback from '@salesforce/apex/DBM25Controller.sendFeedback';

const PLATFORM_EVENT = {
    EVENT: '/event/',
    CHANNEL_NAME: 'DBM_Event__e',
    SUCCESS_FIELD: `Is_Success__c`,
    MESSAGE_FIELD: `Message__c`,
    REPORT_ID_FIELD: 'Report_ID__c',
}

const SAVE_STATUSES = {
    FAILURE: 'fail',
    SUCCESS: 'success',
}

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

const ERROR_WAIT = 15000;
export default class DbmDatasetBuilder extends LightningElement {
    @wire(getDefaultReportFolderName)
    setDefaultReportFolderName({ error, data }) {
        if (data) {
            this.defaultReportFolderName = data;
            this.populateDefaultReportName();
            //     console.log(`reportfoldername = ${data}`);
            //     console.log(`# folders = ${this.reportFolders.length}`);
            //     this.reportFolders.forEach(folder => {
            //         console.log(`${folder.DeveloperName}, match = ${folder.DeveloperName === data}`);
            //     });
            //     if (!this.reportDetails.folderDeveloperName && this.reportFolders.find(folder => folder.DeveloperName === data)) {
            //         this.reportDetails.folderDeveloperName = data;
            //         this.dispatchReportDetails();
            //     }
            // } else {
            //     console.log(`error fetching default report folder name: ${JSON.stringify(error)}`);
        }
    }

    @api
    get reportDetails() {
        return this._reportDetails;
    }
    set reportDetails(value) {
        this._reportDetails = JSON.parse(JSON.stringify(value));
    }
    _reportDetails;

    @api namespace;
    @api changeLog = [];
    @api changeLogIndex = 0;

    @track reportFolders = [];
    subscription;   // Used for receiving Platform Event

    get showSpinner() {
        return this._showSpinner;
    }
    set showSpinner(value) {
        this._showSpinner = value;
        this.dispatchEvent(new CustomEvent(EVENTS.SPINNER_CHANGE, { detail: value }));
    }
    _showSpinner = false;

    previewPaneSizes = [0, 25, 50];
    previewPaneIndex = 1;
    metricNames = transformConstantObject(METRIC_NAMES);
    showImportModal = false;
    finalizeFlag = false;   // Flag set to true the first time the user hits the Finalize stage, which unlocks the save button

    defaultReportDetails = { ...this.processReportDetails(defaultReportDetails()) };
    defaultReportFolderName;
    initialReportDetails;

    saveSuccessful;
    saveStatus;
    errorMessage;

    /* Manage the various steps of the builder */
    currentStepIndex = 0;
    builderSteps = [
        { label: 'Report Details', value: 'details' },
        { label: 'Groupings', value: 'groupings' },
        { label: 'Data', value: 'data' },
        { label: 'Finalize', value: 'finalize' },
    ];

    /* GETTERS */
    get stepLabels() {
        return this.builderSteps.map(step => step.label);
    }
    get currentStep() {
        return this.builderSteps[this.currentStepIndex] || {};
    }
    get currentStepIs() {
        return {
            [this.currentStep.value]: true
        }
    }

    get currentBuilderStepComponent() {
        return this.template.querySelector('.contentPane *');
    }


    get reportDetailsString() {
        return JSON.stringify(this.reportDetails);
    }

    get reportLink() {
        if (this.reportDetails?.reportId) {
            return '/' + this.reportDetails.reportId;
        }
        return null;
    }

    get nextButtonDisabled() {
        return this.currentStepIndex >= this.builderSteps.length - 1;
    }

    get backButtonDisabled() {
        return this.currentStepIndex === 0;
    }

    get undoButtonDisabled() {
        return this.changeLogIndex === 0;
    }

    get redoButtonDisabled() {
        return this.changeLogIndex === this.changeLog.length - 1;
    }

    get isChanged() {
        return this.reportDetailsString !== JSON.stringify(this.initialReportDetails);
    }

    get saveButtonDisabled() {
        return (!(this.isChanged && (this.finalizeFlag || this.reportDetails.id))) && !this.reportDetails.isClone;
    }

    get noReportId() {
        return !this.reportDetails.reportId;
    }

    // get saveAsButtonDisabled() {
    //     return this.saveButtonDisabled || !this.reportDetails.reportId;
    // }

    get changeLogString() {
        let string = JSON.stringify(this.changeLog[this.changeLogIndex - 1]);
        return string;
    }

    get showPreviewEnlargeButton() {
        return this.previewPaneIndex < this.previewPaneSizes.length - 1;
    }

    get previewElement() {
        return this.template.querySelector('c-dbm-preview');
    }

    get previewPaneWidth() {
        return this.previewPaneSizes[this.previewPaneIndex];
    }

    get contentPaneStyle() {
        let styles = [`max-width: ${100 - this.previewPaneWidth}% !important`];
        styles.push(`width: ${100 - this.previewPaneWidth}% !important`);
        return styles.join('; ');
    }
    get contentPaneStyleString() {
        return JSON.stringify(this.contentPaneStyle);
    }

    get previewPaneStyle() {
        let styles = [`min-width: ${this.previewPaneWidth}% !important`];
        styles.push('margin-left: 1em');
        styles.push('padding-left: 1em');
        if (this.previewPaneWidth) {
            styles.push('border-left: 1px solid rgb(116,116,116, .5)');
        }
        return styles.join('; ');
    }

    /* LIFECYCLE HOOKS */
    connectedCallback() {
        // console.log(`in dbmDatasetBuilder, reportDetails = ${this.reportDetailsString}`);
        // If report details are not already defined, start with a default template
        if (!this.reportDetails) {
            this.reportDetails = { ...this.defaultReportDetails };
        } else {
            this.reportDetails = this.processReportDetails(this.reportDetails);
        }
        this.resetChangeLog();
        this.getReportFolders();

        // Subscribe to Platform Event
        this.subscribeToPlatformEvent();
    }

    rendered;
    renderedCallback() {
        this.resizePreview();
        if (!this.rendered) {
            this.rendered = true;
            this.template.querySelector('.previewPane').addEventListener("transitionend", () => {
                this.resizePreview();
            });
        }
    }

    /* ACTION FUNCTIONS */
    resetBuilder() {
        this.reportDetails = { ...this.defaultReportDetails };
        this.currentStepIndex = 0;
        this.saveSuccessful = null;
        this.saveStatus = null;
        this.resetChangeLog();
        this.getReportFolders();
    }

    resetChangeLog() {
        this.initialReportDetails = { ...this.reportDetails };
        this.changeLogIndex = 0;
        this.changeLog = [{ ...this.reportDetails }];
    }

    async saveReportDetails() {
        // console.log(`in saveReportDetails`);
        try {
            this.showSpinner = true;
            this.saveStatus = null;
            // Process blank values into zeroes, if specified
            if (this.reportDetails.saveBlanksAsZeroes) {
                this.reportDetails.data = this.reportDetails.data.map(row => {
                    return row.map(cell => cell === null ? 0 : cell);
                })
            }

            this.reportDetails = this.reportDetails;    // Necessary for some edge-case last minute display changes to appear
            let saveResponse = await saveReportDetails({ reportDetailsString: this.reportDetailsString });
            console.log(`saveResponse = ${JSON.stringify(saveResponse)}`);
            if (saveResponse.errorMessage) {
                this.processSaveResult(saveResponse.errorMessage);
            } else {
                this.reportDetails.id = saveResponse.reportId;
                this.dispatchReportDetails();
                this.generateReportMetadata();
            }
        } catch (error) {
            console.log(`Error saving report: ${JSON.stringify(error)}`);
            let errorMessage = 'There was an unknown error saving your report.';
            if (error.body?.pageErrors?.length) {
                errorMessage = `${error.body.pageErrors[0].message}. Code = ${error.body.pageErrors[0].statusCode}`;
            } else if (error.body?.message) {
                errorMessage = `${error.body.message}.`;
                if (error.body.exceptionType) {
                    errorMessage += ` Code = ${error.body.exceptionType}.`;
                }
                if (error.body.stackTrace) {
                    errorMessage += ' ' + error.body.stackTrace;
                }
            }
            this.processSaveResult(errorMessage);
        }
    }

    async generateReportMetadata() {
        await createReport({ reportDetailsRecordId: this.reportDetails.id });
        setTimeout(() => {
            // console.log(`timeout hit, saveSuccessful = ${this.saveSuccessful}, errorMessage = ${this.errorMessage}`);
            // if (!this.saveSuccessful && !this.errorMessage) {
            if (!this.saveStatus && !this.errorMessage) {
                this.processSaveResult(`Unknown error, server request timed out while generating report`);
            }
        }, ERROR_WAIT);
    }

    processReportDetails(reportDetails) {
        reportDetails.metricLabel = reportDetails.metricName === METRIC_NAMES.CUSTOM.value ? reportDetails.customMetricName : this.metricNames.findFromValue(reportDetails.metricName).label;
        reportDetails.groupings.forEach((grouping, index) => {
            // Update classString for columns in dbmGroupings            
            // let classList = ['slds-col', 'slds-p-horizontal_xxx-small'];
            let classList = ['slds-col', 'slds-p-horizontal_none'];
            if (index < reportDetails.numGroupings) {
                classList.push(`slds-size_1-of-${reportDetails.numGroupings}`);
            } else {
                classList.push('slds-hide');
            }
            grouping.classString = classList.join(' ');

            // Update dataSourceIs for conditional visibility based on dataSource
            grouping.dataSourceIs = {
                [grouping.dataSource]: true
            };

            grouping.groupingNumber = (Number(index) + 1);
            grouping.enumerateClass = grouping.enumerate ? 'brand' : 'neutral';
            grouping.inputLabel = 'Enter Name for Grouping #' + (Number(index) + 1);

            // Update isDisabled
            grouping.isDisabled = index >= Number(reportDetails.numGroupings)
        });
        return reportDetails;
    }

    updateReportDetails(reportDetails, updateChangeLog = true) {
        let newProcessedReportDetails = this.processReportDetails(reportDetails);
        // console.log(`in dbmDatasetBuilder updateReportDetails, reportDetails = ${JSON.stringify(newProcessedReportDetails)}`);
        let reportDetailsChanged = this.reportDetailsString !== JSON.stringify(newProcessedReportDetails);
        // console.log(`reportDetailsChanged = ${reportDetailsChanged}`);
        if (reportDetailsChanged) {
            this.reportDetails = newProcessedReportDetails;
            this.dispatchReportDetails();
            if (updateChangeLog) {
                this.changeLogIndex++;
                this.changeLog[this.changeLogIndex] = { ...this.reportDetails };
                this.changeLog.length = this.changeLogIndex + 1;
            }
        }
    }

    async getReportFolders() {
        try {
            this.reportFolders = await getReportFolders();
            this.populateDefaultReportName();
        } catch (error) {
            console.log(`Error getting report folders: ${JSON.stringify(error)}`);
        }
    }

    processSaveResult(errorMessage) {
        // console.log(`in processSaveResult, errorMessage = ${errorMessage}`);
        if (errorMessage) {
            this.saveSuccessful = false;
            this.saveStatus = SAVE_STATUSES.FAILURE;
            this.errorMessage = errorMessage;
            sendFeedback({ subject: 'Failure', body: errorMessage + ' <br> ' + this.reportDetailsString });
        } else {
            this.dispatchEvent(new CustomEvent(EVENTS.REFRESH_RECORDS));
            this.saveSuccessful = true;
            this.saveStatus = SAVE_STATUSES.SUCCESS;
            let successVerb = 'updated';
            // Only send feedback the first time the report is saved (meaning it has no initial ID), not on every edit
            if (!this.initialReportDetails.id) {
                successVerb = 'created';
                sendFeedback({ subject: 'Success', body: this.reportDetailsString });
                this.currentStepIndex = this.builderSteps.length;   // If the report is newly created, navigate to the success screen. Only shown on initial save.
            }
            this.resetChangeLog();
            const toast = new ShowToastEvent({
                title: 'Success',
                message: `Your report has been successfully ${successVerb}`,
                variant: 'success',
            });
            this.dispatchEvent(toast);
        }
        this.showSpinner = false;
    }

    dispatchReportDetails() {
        this.dispatchEvent(new CustomEvent(EVENTS.REPORT_DETAIL_CHANGE, { detail: this.processReportDetails(this.reportDetails) }));
    }

    importReportDetails() {
        const importModalInput = this.template.querySelector('.importTextarea');
        if (importModalInput) {
            let importedDetails = JSON.parse(importModalInput.value);
            if (this.reportDetails.id !== importedDetails.id) {
                importedDetails.id = null;
            }
            if (this.reportDetails.reportId !== importedDetails.reportId) {
                importedDetails.reportId = null;
            }
            importedDetails.isClone = true;
            this.updateReportDetails(importedDetails);
        }
        this.closeImportModal();
    }

    closeImportModal() {
        this.showImportModal = false;
    }

    // If we have a list of report folders to compare to, and if we have a default folder name, and if the reportDetails doesn't have a folderDeveloperName value, set it to the default name
    populateDefaultReportName() {
        // First confirm that the defaultReportFolderName is indeed a valid report folders        
        if (this.reportFolders.length && this.defaultReportFolderName && !this.reportDetails.folderDeveloperName) {
            if (this.reportFolders.find(folder => folder.DeveloperName === this.defaultReportFolderName)) {
                let updatedReportDetails = {
                    ...this.reportDetails,
                    folderDeveloperName: this.defaultReportFolderName
                }   // I have to do it this way rather than updating this.reportDetails directly because otherwise a change wouldn't be detected. That's probably not ideal...
                this.updateReportDetails(updatedReportDetails, false);
                this.resetChangeLog();
            }
        }
    }

    /* EVENT HANDLERS */
    handleReportDetailChange(event) {
        this.updateReportDetails(event.detail);
    }

    async handleBackToListViewClick() {
        // The user made any changes, confirm before leaving. Check to see if (1) an unsaved report is back to its default state, or (2) a cloned report is not back to 
        // if (!(this.reportDetails.id && JSON.stringify(this.reportDetails) === JSON.stringify(this.defaultReportDetails)) && 
        //     /*!this.undoButtonDisabled || */(!this.reportDetails.id && JSON.stringify(this.reportDetails) !== JSON.stringify(this.defaultReportDetails))) {
        if (this.isChanged) {
            const result = await LightningConfirm.open({
                message: 'If you leave this page you will lose your unsaved changes. Are you sure you want to go back to the list view?',
                label: 'Confirm Back',
                theme: 'info'
            });
            if (!result) {
                return;
            }
        }
        const detail = {
            target: EVENTS.TARGETS.LIST_VIEW
        }
        this.dispatchEvent(new CustomEvent(EVENTS.NAVIGATE, { detail }));
    }

    handleStepClick(event) {
        this.currentStepIndex = event.detail.index;
    }

    handleBackButtonClick() {
        this.currentStepIndex--;
    }

    handleNextButtonClick(event) {
        let isValid = this.currentBuilderStepComponent.validate();
        if (isValid) {
            this.currentStepIndex++;
            if (this.currentStep.value === 'finalize') {
                this.finalizeFlag = true;
            }
        }
    }

    handlePreviewEnlargeClick() {
        if (this.previewPaneIndex < this.previewPaneSizes.length - 1) {
            this.previewPaneIndex++;
        }
    }

    handlePreviewShrinkClick() {
        if (this.previewPaneIndex > 0) {
            this.previewPaneIndex--;
        }
    }

    // If the user has clicked their mouse in the `data` component and not on a cell or header, clear the selection
    handleContentPaneMouseUp() {
        let dataCmp = this.template.querySelector('c-dbm-dataset-data');
        if (dataCmp && !dataCmp.preventClearSelection()) {
            dataCmp.unselectSelectedElements();
        }
    }

    async handleSaveButtonClick() {
        // console.log(`in handleSaveButtonClick`);
        if (await this.validateSave()) {
            this.saveReportDetails();
        }
    }

    async handleSaveAsButtonClick() {
        if (await this.validateSave()) {
            let newName = await LightningPrompt.open({
                message: 'Enter name for cloned report',
                label: 'Enter New Report Name', // this is the header text
                defaultValue: `${this.reportDetails.reportName} copy`
            });
            if (newName) {
                // console.log(`going to clone ${newName}`);
                this.reportDetails.reportName = newName;
                this.reportDetails.id = null;
                this.reportDetails.reportId = null;
                // console.log(`clone reportDetails = ${this.reportDetailsString}`);
                // this.dispatchReportDetails();
                this.saveReportDetails();
            } else {
                // console.log(`no clone for you!`);
            }
        }
    }

    handleCopyToClipboardClick() {
        const detail = {
            string: this.reportDetailsString
        };
        this.dispatchEvent(new CustomEvent(EVENTS.COPY_TO_CLIPBOARD, { detail }))
    }

    handleImportClick() {
        this.showImportModal = true;
    }

    handlePlatformEventReceipt(response) {
        console.log(`in handlePlatformEventReceipt`);
        const payload = response.data.payload;
        console.log(`payload = ${JSON.stringify(payload)}`);
        const errorMessage = payload[this.prependNamespace(PLATFORM_EVENT.MESSAGE_FIELD)];
        const reportId = payload[this.prependNamespace(PLATFORM_EVENT.REPORT_ID_FIELD)];
        const isSuccess = payload[this.prependNamespace(PLATFORM_EVENT.SUCCESS_FIELD)];
        if (isSuccess) {
            this.reportDetails.reportId = reportId;
            this.processSaveResult();
        } else {
            this.processSaveResult(errorMessage);
        }
        console.log(`finished handlePlatformEventReceipt`);
    }

    handleUndoClick() {
        this.changeLogIndex--;
        this.updateReportDetails(this.changeLog[this.changeLogIndex], false);
    }

    handleRedoClick() {
        this.changeLogIndex++;
        this.updateReportDetails(this.changeLog[this.changeLogIndex], false);
    }

    handleOpenReportClick() {
        this.dispatchEvent(new CustomEvent(EVENTS.OPEN_REPORT, { detail: this.reportDetails.reportId }));
    }

    handleErrorModalCloseClick() {
        this.errorMessage = null;
    }

    /* UTILITY FUNCTIONS */
    @api
    resizePreview() {
        if (this.previewElement) {
            this.previewElement.resizeChart();
        }
    }

    prependNamespace(str) {
        if (this.namespace) {
            return `${this.namespace}__${str}`;
        }
        return str;
    }

    subscribeToPlatformEvent() {
        console.log(`in subscribe to platform event. namespace = ${this.namespace}`);
        const self = this;
        const messageCallback = function (response) {
            self.handlePlatformEventReceipt(response);
        }
        if (!this.subscription) {
            console.log(`subscribing to channel ${PLATFORM_EVENT.EVENT + this.prependNamespace(PLATFORM_EVENT.CHANNEL_NAME)}`);
            subscribe(PLATFORM_EVENT.EVENT + this.prependNamespace(PLATFORM_EVENT.CHANNEL_NAME), -1, messageCallback).then(response => {
                this.subscription = response;
            });
        }
    }

    async validateSave() {
        let isValid = this.currentBuilderStepComponent.validate();
        if (isValid) {
            // Additional validation
            let invalidMessage;
            let validGroupingEntries = this.reportDetails.groupings.every(grouping => {
                return grouping.isDisabled || grouping.entries.some(entry => entry.value);
            });
            let validData = isValid = this.reportDetails.data.some(row => row.some(cell => cell !== null));
            let validFolderName = !!this.reportDetails.folderDeveloperName;
            if (!validGroupingEntries) {
                invalidMessage = 'Each grouping level must have at least one valid entry';
            } else if (!validData) {
                invalidMessage = 'At least one data entry must have a numeric value';
            } else if (!validFolderName) {
                invalidMessage = 'Please select a folder to save your report in'
            }
            if (invalidMessage) {
                await LightningAlert.open({
                    message: invalidMessage,
                    theme: 'error', // a red theme intended for error states
                    label: 'Missing Required Information', // this is the header text
                });
            } else {
                return true;
            }
        }
        return false;
    }
}