import { LightningElement, track, wire, api } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import { ShowToastEvent } from 'lightning/platformShowToastEvent'
import saveFakeData from '@salesforce/apex/SDO_Analytics_ReportFakerController.saveFakeData';
//import createReport from '@salesforce/apex/ReportFakerController.createReport'; // This is now being handled by the VF page controller, in order to access the user session ID
import getExistingFakeData from '@salesforce/apex/SDO_Analytics_ReportFakerController.getExistingFakeData';

const VF_PAGE_NAME = 'SDO_Analytics_userSessionIdHelper';
const DEFAULT_METRIC_NAME = 'Value';
const DEFAULT_PRIMARY_GROUPING = 'Primary Grouping';
const DEFAULT_SECONDARY_GROUPING = 'Secondary Grouping';

export default class CreateReport extends NavigationMixin(LightningElement) {
    @track reportItems = [];
    @api folderName = 'DashboardMagicReports';
    group;  // for legacy reasons, this represents the report name
    errorMessage;
    existingMembers;
    reportId;
    hasSecondGrouping;
    primaryGrouping;
    secondaryGrouping;
    @api diagramImageSource = 'https://i.imgur.com/FEes7xd.png';
    showSpinner;

    showModal = false;
    showBulkAddModal = false;

    bulkAddString;

    @track groups = [];
    groupIndex = 0;

    @track fakedataRecords = [];

    existingMatches = [];
    @wire(getExistingFakeData)
    existingFakeData;

    //metricName = DEFAULT_METRIC_NAME;
    metricType = this.defaultMetricType;

    steps = [
        {
            name: 'details',
            backButton: { disabled: true, label: 'Back', variant: 'neutral' },
            nextButton: { label: 'Next', variant: 'neutral' }
        },
        {
            name: 'data',
            backButton: { label: 'Back' },
            nextButton: { label: 'Finish', variant: 'brand' }
        },
        {
            name: 'data',
            backButton: { label: 'Back', disabled: true },
            nextButton: { label: 'Finish', variant: 'brand', disabled: true }
        }
    ];
    currentStepIndex = 0;
    get currentStep() {
        return this.steps[this.currentStepIndex];
    }

    connectedCallback() {
        this.resetGroups();
    }

    newFakedataRecord(groupIndex, sGroup) {
        let pGroup;
        let recordIndex = 0;
        let existingRecordInGroup = this.fakedataRecords.find(el => {
            return el.groupIndex == groupIndex;
        });
        if (groupIndex >= 0 && existingRecordInGroup) {
            pGroup = existingRecordInGroup.primaryGrouping;
            if (this.hasSecondGrouping) {
                let maxRecordIndex = 0;
                for (let rec of this.fakedataRecords) {
                    if (rec.groupIndex === groupIndex && rec.recordIndex > maxRecordIndex)
                        maxRecordIndex = rec.recordIndex;
                }
                recordIndex = maxRecordIndex + 1;
            }
        } else {
            groupIndex = this.groupIndex;
            this.groupIndex++;
        }
        return {
            primaryGrouping: pGroup,
            secondaryGrouping: sGroup,
            groupIndex: groupIndex,
            recordIndex: recordIndex
        }
    }

    resetGroups() {
        this.fakedataRecords = [this.newFakedataRecord()];
    }

    addNewGroup() {
        this.fakedataRecords = [...this.fakedataRecords, this.newFakedataRecord()];
    }

    validateInputs(cardSpecifier) {
        let allInputsValid = true;
        for (let input of this.template.querySelectorAll(cardSpecifier + 'lightning-input')) {
            let valid = input.reportValidity();
            if (!valid) {
                allInputsValid = false;
                console.log('input "' + input.label + ' is invalid');
            }
        }
        return allInputsValid;
    }

    loadExistingFakeData() {
        this.fakedataRecords = [];
        //console.log('found ' + this.existingMatches.length + ' records');
        for (let existing of this.existingMatches) {
            this.fakedataRecords = [...this.fakedataRecords, {
                primaryGrouping: existing.Label__c,
                secondaryGrouping: existing.Secondary_Grouping__c,
                value: existing.Value__c
            }];
        }
        let primaryGroupings = new Set();
        for (let fakeRec of this.fakedataRecords) {
            primaryGroupings.add(fakeRec.primaryGrouping);
        }
        primaryGroupings = [...primaryGroupings];
        for (let i = 0; i < primaryGroupings.length; i++) {
            let groupRecords = this.fakedataRecords.filter(el => { return el.primaryGrouping === primaryGroupings[i] });

            for (let j = 0; j < groupRecords.length; j++) {
                groupRecords[j].groupIndex = i;
                groupRecords[j].recordIndex = j;
            }
        }
        //console.log('fakedatarecords = ' + JSON.stringify(this.fakedataRecords));
        this.popToast('Success', 'The existing records have been loaded. Click Next to see them', 'success');
    }


    /* GETTERS/SETTERS */

    get fakedataGroups() {
        let groupIndices = new Set(), groups = [];
        for (let fakeRec of this.fakedataRecords) {
            groupIndices.add(fakeRec.groupIndex);
        }
        groupIndices = [...groupIndices].sort((a, b) => { return Number(a) - Number(b) });

        for (let groupIndex of groupIndices) {
            let groupRecords = this.getRecordsByGroup(groupIndex);
            groups.push({
                index: groupIndex,
                records: groupRecords,
                primaryGrouping: groupRecords[0].primaryGrouping,
                firstValue: groupRecords[0] ? groupRecords[0].value : null
            });
        }
        return groups;
    }

    get primaryGroupingPlaceholder() {
        return this.primaryGrouping || DEFAULT_PRIMARY_GROUPING;
    }

    get secondaryGroupingPlaceholder() {
        return this.secondaryGrouping || DEFAULT_SECONDARY_GROUPING;
    }

    get metricTypeOptions() {
        return [
            { label: 'Number', value: 'number' },
            { label: 'Currency', value: 'currency' },
            { label: 'Percent', value: 'percent' }
        ];
    }

    get defaultMetricType() {
        return this.metricTypeOptions[0].value;
    }

    /* no longer using a namespace, this was an attempt to make this work from a managed package
    get namespace() {
        
        let url = window.location.href;
        let delim = '__';
        let delimPos = url.indexOf(delim);
        let namespace;
        if (delimPos > 0) {            
            namespace = url.substring(url.lastIndexOf('/')+1, delimPos + delim.length);
        }
        console.log('namespace = '+ namespace);
        return namespace;
        
    }
    */
    /* END GETTERS/SETTERS */

    /* EVENT HANDLERS */
    handleSave() {
        if (!this.validateInputs()) {
            return;
        }
        this.showSpinner = true;
        let reportItems = [];
        for (let rec of this.fakedataRecords) {
            reportItems.push({
                group: this.group,
                label: rec.primaryGrouping,
                secondary: this.hasSecondGrouping ? rec.secondaryGrouping : null,
                value: rec.value
            });
        }
        saveFakeData({ fakeDataString: JSON.stringify(reportItems) }).then(resultString => {
            // Once the fake data records have been inserted, navigate to the associated VF page with data for the controller to create the report
            let vfParams = ['group', 'primaryGrouping', 'secondaryGrouping', 'metricName', 'metricType'];
            let paramString = '?';
            for (let i = 0; i < vfParams.length; i++) {
                if (i > 0)
                    paramString += '&';
                paramString += vfParams[i] + '=';
                paramString += this[vfParams[i]] ? this[vfParams[i]] : '';
            }
            //let vfUrl = '/apex/' + VF_PAGE_NAME + '?group=' + this.group + '&primaryGrouping=' + this.primaryGrouping + '&secondaryGrouping=' + this.secondaryGrouping+'&metricName='+ this.metricName;
            let vfUrl = '/apex/' + VF_PAGE_NAME + paramString;
            console.log('vfUrl = ' + vfUrl);

            this[NavigationMixin.GenerateUrl]({
                type: 'standard__webPage',
                attributes: {
                    url: vfUrl
                }
            }).then(goUrl => {
                window.open(goUrl);
            });

            // Advance to "finished" screen
            this.template.querySelector('.dataCard').classList.add('slds-hide');
            this.template.querySelector('.finishedCard').classList.remove('slds-hide');
            this.currentStepIndex++;
            this.showSpinner = false;

        }).catch(error => {
            this.popToast('Error', 'Something went wrong. Please contact david.fromstein@salesforce.com for support. Copy this error code: ' + JSON.stringify(error), 'error');
            console.log('error from saveFakeData', JSON.stringify(error));
        });
        return;
    }

    handleReportNameChange(event) {
        this.group = event.currentTarget.value;
        this.existingMatches = this.existingFakeData.data.filter(el => {
            return el.Group__c === this.group;
        });
    }

    handlePrimaryGroupingChange(event) {
        this.primaryGrouping = event.currentTarget.value;
    }

    handleSecondaryGroupingChange(event) {
        this.secondaryGrouping = event.currentTarget.value;
    }

    handleMetricNameChange(event) {
        this.metricName = event.currentTarget.value;
    }

    handleMetricTypeChange(event) {
        this.metricType = event.detail.value;
    }

    handleRecordPrimaryChange(event) {
        let groupIndex = this.findParentRow(event).dataset.groupIndex;
        //console.log('groupIndex = ' + groupIndex, event.currentTarget.value);
        for (let rec of this.fakedataRecords) {
            if (rec.groupIndex == groupIndex) {
                rec.primaryGrouping = event.currentTarget.value;
            }
        }
    }

    handleRecordSecondaryChange(event) {
        let parentRow = this.findParentRow(event);
        let groupIndex = parentRow.dataset.groupIndex;
        let recordIndex = parentRow.dataset.recordIndex;
        let groupRecords = this.fakedataRecords.filter(el => {
            return el.groupIndex == groupIndex;
        });
        if (groupRecords && groupRecords[recordIndex]) {
            groupRecords[recordIndex].secondaryGrouping = event.currentTarget.value;
        }
    }

    handleRecordValueChange(event) {
        let parentRow = this.findParentRow(event);
        let groupIndex = parentRow.dataset.groupIndex;  
        let recordIndex = parentRow.dataset.recordIndex;
        let rec = this.fakedataRecords.find(el => {
            return el.groupIndex == groupIndex && (!recordIndex || el.recordIndex == recordIndex);
        });
        if (rec) {
            rec.value = event.currentTarget.value;
        }
    }

    handlePercentUpdate(event) {
        if (this.metricType === 'percent') {
            event.currentTarget.value /= 100;
        }    
    }

    handleModalClose() {
        this.showModal = false;
        this.handleSave();
    }

    // i dunno this isn't working
    handleModalButtonClick(event) {
        this.showModal = null;
        //console.log('in handleModalButtonClick: ' + event.detail);
        if (event.detail === 'ok') {
            this.showModal = null;
        }
        //console.log(event.detail === 'ok');
        //console.log(this.showModal);
    }

    handlePrint() {
        console.log('print: ' + JSON.stringify(this.fakedataRecords));
    }

    handleNewGroupClick() {
        this.addNewGroup();
    }

    handleAddSubgroupClick(event) {
        let ind = Number(this.findParentRow(event).dataset.groupIndex);
        let newFake = this.newFakedataRecord(ind);
        this.fakedataRecords.push(newFake);
    }

    handleBulkAdd() {
        let bulkAddString = this.template.querySelector('lightning-textarea').value;
        for (let newRecord of bulkAddString.split('\n')) {
            for (let group of this.fakedataGroups) {
                let newFake = this.newFakedataRecord(group.index, newRecord);
                if (group.records.length === 1 && !group.records[0].secondaryGrouping && !group.records[0].value) {
                    console.log('in a fakey');
                    this.fakedataRecords = this.fakedataRecords.filter(el => el.groupIndex !== group.index);
                }
                this.fakedataRecords.push(newFake);
            }
        }
    }

    handleNumerate() {

    }

    handleDelete(event) {
        let parentRow = this.findParentRow(event);
        let rowType = parentRow.dataset.rowType;
        let groupIndex = parentRow.dataset.groupIndex;
        if (rowType === 'primary') {
            this.fakedataRecords = this.fakedataRecords.filter(el => {
                return el.groupIndex != groupIndex;
            });
            if (this.fakedataRecords.length === 0) {
                this.addNewGroup();
            }
        }
        if (rowType === 'secondary') {
            let recordIndex = parentRow.dataset.recordIndex;
            // If this is the only remaining record in its group, don't delete the whole group, just null out the secondary values
            //console.log(JSON.stringify(this.getRecordsByGroup(groupIndex)));
            if (this.getRecordsByGroup(groupIndex).length == 1) {
                let rec = this.fakedataRecords.find(el => {
                    return el.groupIndex == groupIndex && el.recordIndex == recordIndex;
                })
                rec.value = null;
                rec.secondaryGrouping = null;
            } else {
                // If not the only record, just delete it
                this.fakedataRecords = this.fakedataRecords.filter(el => {
                    return !(el.groupIndex == groupIndex && el.recordIndex == recordIndex);
                });
            }
        }
        //console.log('finished handleDelete');
    }

    handleNavBack() {
        this.template.querySelector('.dataCard').classList.add('slds-hide');
        this.template.querySelector('.detailsCard').classList.remove('slds-hide');
        this.currentStepIndex--;
    }

    handleNavNext() {
        if (this.currentStepIndex === 0) {
            if (this.validateInputs('.detailsCard ')) {
                this.template.querySelector('.detailsCard').classList.add('slds-hide');
                this.template.querySelector('.dataCard').classList.remove('slds-hide');
                this.currentStepIndex++;
            }
        } else {
            if (this.validateInputs('.dataCard ')) {
                //this.handleSave();
                this.showModal = true;
            }
        }
    }

    handleToggleSecondGrouping() {
        this.hasSecondGrouping = this.template.querySelector('.multiGroupToggle').checked;
    }

    handleRefresh() {
        location.reload();
    }

    handleFinishIntro() {
        this.template.querySelector('.introCard').classList.add('slds-hide');
        this.template.querySelector('.navHeader').classList.remove('slds-hide');
        this.template.querySelector('.detailsCard').classList.remove('slds-hide');        
    }
    /* END EVENT HANDLERS */

    /* UTILITY CLASSES */
    findParentRow(event) {
        let el = event.currentTarget;
        while (!el.dataset.groupIndex && el.parentNode) {
            el = el.parentNode;
        }
        return el;
    }

    getRecordsByGroup(groupIndex) {
        return this.fakedataRecords.filter(el => {
            return el.groupIndex == groupIndex;
        })
    }

    getRecordByIndexes(groupIndex, recordIndex) {
        return this.fakedataRecords.filter(el => {
            return el.groupIndex == groupIndex && el.recordIndex == recordIndex;
        })
    }

    popToast(title, message, variant) {
        const event = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant
        });
        this.dispatchEvent(event);
    }

    /*
    handlerowCheckboxSelect(event) {
        console.log('rowtype = ' + event.currentTarget.dataset.rowType);
        let rowType = event.currentTarget.dataset.rowType;
        let groupIndex = event.currentTarget.dataset.groupIndex;
        if (rowType === 'all') {
            let checkboxes = this.template.querySelectorAll('.rowCheckbox');
            let allAreChecked = true;
            for (let checkbox of checkboxes) {
                if (!checkbox.checked) {
                    allAreChecked = false;
                    break;
                }
            }
            for (let checkbox of checkboxes) {
                checkbox.checked = !allAreChecked;
            }
            event.currentTarget.checked = !allAreChecked;
        } else {
            if (rowType === 'primary') {
                console.log('groupIndex = ' + groupIndex);
                let checkboxes = this.template.querySelectorAll('.rowCheckbox[data-group-index="' + groupIndex + '"][data-record-index]');
                console.log(checkboxes.length);
                let allAreChecked = true;
                for (let checkbox of checkboxes) {
                    console.log('checkbox.checked = ' + checkbox.checked);
                    if (!checkbox.checked) {
                        allAreChecked = false;
                        break;
                    }
                }
                console.log('about to set them all to ' + !allAreChecked);
                for (let checkbox of checkboxes) {
                    checkbox.checked = !allAreChecked;
                }
                event.currentTarget.checked = !allAreChecked;
            } else {
                let primaryCheckbox = this.template.querySelector('.rowCheckbox[data-group-index="' + groupIndex + '"][data-row-type="primary"]');
                for (let checkbox of checkboxes) {
                    console.log('checkbox.checked = ' + checkbox.checked);
                    if (!checkbox.checked) {
                        primaryCheckbox.checked = false;
                        break;
                    }
                }
            }
        }
    }
    */
}