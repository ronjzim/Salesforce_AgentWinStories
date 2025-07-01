// TODO: add sort columns to list view

import { LightningElement, api, wire, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import LightningConfirm from 'lightning/confirm';

import { EVENTS } from "c/dbmUtils";
// import getReportDetailRecords from '@salesforce/apex/DBM25Controller.getReportDetailRecords';
import deleteReports from '@salesforce/apex/DBM25Controller.deleteReports';

import REPORT_REPORTID_FIELD from "@salesforce/schema/DBM_Report__c.Report_ID__c";

const COLUMNS = [
    { label: 'Report Name', fieldName: 'Name', type: 'text', sortable: true, hideDefaultActions: true },
    { label: 'Metric Name', fieldName: 'Metric_Label__c', type: 'text', sortable: true },
    { label: 'Metric Type', fieldName: 'Metric_Type__c', type: 'text', sortable: true },
    { label: 'Number of Groupings', fieldName: 'Number_of_Groupings__c', type: 'number', sortable: true },
    { label: 'Created Date', fieldName: 'CreatedDate', type: 'date', sortable: true },
    { label: 'Last Modified Date', fieldName: 'LastModifiedDate', type: 'date', sortable: true },
];

const ACTION_TYPES = {
    MULTI: 'multiRowAction',
    SINGLE: 'singleRowAction',
}

const SORT_DIRECTIONS = {
    ASCENDING: 'asc',
    DESCENDING: 'desc'
}

export default class DbmListView extends LightningElement {
    @api
    get namespace() {
        return this._namespace;
    }
    set namespace(value) {
        this._namespace = value;
        if (this.namespace) {
            this.columns.forEach(col => {
                // Only add namespace to custom fields, and where namespace hasn't already been added
                if (col.fieldName?.includes('__c') && !col.fieldName?.startsWith(`${this.namespace}__`)) {
                    col.fieldName = this.prependNamespace(col.fieldName);
                }
            })
        }
    }
    _namespace;

    @api reportDetailRecords = [];
    // @api isLoaded = false;


    // @track tableRows = [];
    @track columns = COLUMNS;
    @track reportDetailRecords = [];
    @track selectedRowIndexes = [];
    @track rowActions = [
        { name: 'open', iconName: 'utility:open', isSingleRowAction: true, tooltip: 'Open in Dataset Builder', title: 'Open', onclick: (rowIndex) => this.openInDatasetBuilder(rowIndex) },
        { name: 'clone', iconName: 'utility:copy', isSingleRowAction: true, tooltip: 'Clone dataset', title: 'Clone', onclick: (rowIndex) => this.cloneReport(rowIndex) },
        { name: 'copy', iconName: 'utility:copy_to_clipboard', isSingleRowAction: true, tooltip: 'Copy dataset code to clipboard', title: 'Copy', onclick: (rowIndex) => this.copyToClipboard(rowIndex) },
        { name: 'openReport', iconName: 'utility:new_window', isSingleRowAction: true, tooltip: 'Open report in Report Builder', title: 'Open Report', onclick: (rowIndex) => this.openReport(rowIndex) },
        // { name: 'preview', iconName: 'utility:preview', isSingleRowAction: true, tooltip: 'Preview dataset in side panel', title: 'Preview' },
        { name: 'delete', iconName: 'utility:delete', isSingleRowAction: false, tooltip: 'Delete selected dataset(s)', title: 'Delete', onclick: (rowIndex) => this.deleteReports(rowIndex) },
    ];

    // showSpinner;
    get showSpinner() {
        return this._showSpinner;
    }
    set showSpinner(value) {
        this._showSpinner = value;
        this.dispatchEvent(new CustomEvent(EVENTS.SPINNER_CHANGE, { detail: value }));
    }
    _showSpinner = false;

    // sortDirection = SORT_DIRECTIONS.DESCENDING;
    sortAscending = false;
    sortedBy = 'LastModifiedDate';
    numberOfSelectedRows = 0;
    searchTerm;
    isPending = false;

    get tableRows() {
        return this.processRecordsIntoRows(this.reportDetailRecords);
    }

    get updatedActions() {
        return this.rowActions.map(action => {
            return {
                ...action,
                isDisabled: action.isSingleRowAction ? (this.selectedRowIndexes.length !== 1) : (this.selectedRowIndexes.length === 0)
            }
        })
    }

    get allRowsSelected() {
        return this.selectedRowIndexes.length === this.tableRows.length;
    }

    // get showSpinner() {
    //     let value = !this.isLoaded || this.isPending;
    // }

    get allAreHidden() {
        return this.tableRows.length && this.tableRows.every(row => row.isHidden);
    }

    get sortIcon() {
        return this.sortAscending ? 'utility:arrowup' : 'utility:arrowdown';
        // return this.sortDirection = SORT_DIRECTIONS.ASCENDING ? 'utility:arrowup' : 'utility:arrowdown';
    }

    /* LIFECYCLE HOOKS */
    connectedCallback() {
        this.sortColumns();
    }

    /* ACTION FUNCTIONS */
    processRecordsIntoRows(records) {
        // let selectedRowCount = 0;
        let rows = records.map((record, rowIndex) => {
            let row = {
                id: record.Id,
                reportId: record[REPORT_REPORTID_FIELD.fieldApiName],
                isSelected: this.selectedRowIndexes.includes(rowIndex),
                fields: []
            };
            this.columns.forEach((col, colIndex) => {
                row.fields.push({
                    isFirst: colIndex === 0,
                    fieldName: col.fieldName,
                    fieldType: col.type,
                    fieldLabel: col.label,
                    value: record[col.fieldName],
                    [`is${col.fieldName}`]: true,
                    [`is${col.type}`]: true
                });
                if (row.fields[colIndex].fieldName === this.prependNamespace('Number_of_Groupings__c')) {
                    // console.log(`in number of groupings`);
                    let groupings = record[this.prependNamespace('DBM_Report_Groupings__r')];
                    if (groupings) {
                        let groupingNames = groupings.map(grouping => grouping.Name);
                        // console.log(`groupingNames = ${JSON.stringify(groupingNames)}`);
                        row.fields[colIndex].value += ` (${groupings.map(grouping => grouping.Name).join(', ')})`;

                    }
                }
                // Filter `isHidden` property based on `searchTerm`
                if (this.searchTerm) {
                    let isHidden = true;
                    row.fields.forEach(field => {
                        if (String(field.value).toLowerCase().includes(this.searchTerm)) {
                            isHidden = false;
                        }
                    });
                    row.isHidden = isHidden;
                }

            });
            return row;
        });
        return rows;
    }

    openInDatasetBuilder(rowIndex) {
        if (!(rowIndex) >= 0 && this.selectedRowIndexes.length === 1) {
            rowIndex = this.selectedRowIndexes[0];
        }
        // if (this.selectedRowIndexes.length === 1) {
        let reportDetailId = this.tableRows[rowIndex].id;
        let reportDetailRecord = this.reportDetailRecords.find(record => record.Id === reportDetailId);
        const detail = {
            reportDetailRecord,
            target: EVENTS.TARGETS.DATASET_BUILDER
        }
        this.dispatchEvent(new CustomEvent(EVENTS.NAVIGATE, { detail }));
        // }
    }

    copyToClipboard(rowIndex) {
        if (!(rowIndex) >= 0 && this.selectedRowIndexes.length === 1) {
            rowIndex = this.selectedRowIndexes[0];
        }
        const detail = {
            sobjectRecord: this.reportDetailRecords[rowIndex]
        };
        // console.log(`detail = ${JSON.stringify(detail)}`);
        this.dispatchEvent(new CustomEvent(EVENTS.COPY_TO_CLIPBOARD, { detail }))

        // }
    }

    openReport(rowIndex) {
        if (!(rowIndex) >= 0 && this.selectedRowIndexes.length === 1) {
            rowIndex = this.selectedRowIndexes[0];
        }
        this.dispatchEvent(new CustomEvent(EVENTS.OPEN_REPORT, { detail: this.tableRows[rowIndex].reportId }));
    }

    cloneReport(rowIndex) {
        if (!(rowIndex) >= 0 && this.selectedRowIndexes.length === 1) {
            rowIndex = this.selectedRowIndexes[0];
        }
        let reportDetailId = this.tableRows[rowIndex].id;
        let reportDetailRecord = this.reportDetailRecords.find(record => record.Id === reportDetailId);
        let clonedRecord = {
            ...reportDetailRecord,
            Id: null,
            [REPORT_REPORTID_FIELD.fieldApiName]: null,
            Name: `Copy of ${reportDetailRecord.Name}`
        }

        const detail = {
            reportDetailRecord: clonedRecord,
            isClone: true,
            target: EVENTS.TARGETS.DATASET_BUILDER
        }
        this.dispatchEvent(new CustomEvent(EVENTS.NAVIGATE, { detail }));
    }

    async deleteReports(rowIndex) {
        let recordIds = [], reportIds = [];
        let indexesToDelete = (!(rowIndex >= 0)) ? this.selectedRowIndexes : [rowIndex];
        let length = indexesToDelete.length;
        indexesToDelete.forEach(index => {
            let selectedRow = this.tableRows[index];
            recordIds.push(selectedRow.id);
            reportIds.push(selectedRow.reportId);
        });
        let plural = length > 1 ? 's' : '';
        const confirmResult = await LightningConfirm.open({
            message: `Are you sure you want to delete ${length} dataset${plural}? Due to technical limitations, this will not delete the associated report${plural}, but the report${plural} will no longer have any data to show.`,
            label: 'Confirm Delete',
            theme: 'error',
        });
        if (confirmResult) {
            // this.isPending = true;
            this.showSpinner = true;
            let toast;
            deleteReports({ reportDetailRecordIds: recordIds, reportIds: reportIds })
                .then(() => {
                    this.dispatchEvent(new CustomEvent(EVENTS.REFRESH_RECORDS));
                    toast = new ShowToastEvent({
                        title: `Report${plural} Successfully Deleted`,
                        message: `${length} report${plural} successfully deleted`,
                        variant: 'success',
                    });
                    this.selectedRowIndexes = [];
                })
                .catch((errorMessage => {
                    console.log(`errorMessage = ${JSON.stringify(errorMessage)}`);
                    toast = new ShowToastEvent({
                        title: 'Error Deleting Records',
                        message: `There was an error when trying to delete the report${plural}: ${errorMessage}`,
                        variant: 'error',
                    });
                }))
                .finally(() => {
                    this.dispatchEvent(toast);
                    // this.isPending = false;
                    this.showSpinner = false;
                });
        }
    }

    sortColumns() {
        this.columns.forEach(col => {
            col.isSortedBy = col.fieldName === this.sortedBy;
        })
        let cloneData = [...this.reportDetailRecords];
        cloneData.sort(this.sortFunction(this.sortedBy, this.sortAscending ? 1 : -1));
        this.reportDetailRecords = cloneData;
    }

    /* EVENT HANDLERS */
    handleRefreshRecordsClick() {
        this.dispatchEvent(new CustomEvent(EVENTS.REFRESH_RECORDS));
    }

    handleColumnSortClick(event) {
        let newSortedBy = event.currentTarget.dataset.fieldName;
        if (this.sortedBy === newSortedBy) {
            this.sortAscending = !this.sortAscending;
        } else {
            this.sortedBy = newSortedBy;
        }
        this.sortColumns();
    }

    handleRowAction(event) {
        console.log(JSON.stringify(event.detail));
    }

    handleRowSelection(event) {

    }

    handleSearchChange(event) {
        this.searchTerm = event.target.value.toLowerCase();
    }

    handleRowSelectChange(event) {
        const index = Number(event.target.dataset.rowIndex);
        const value = event.target.checked;
        if (value) {
            this.selectedRowIndexes.push(index);
        } else {
            let currentIndex = this.selectedRowIndexes.findIndex(rowIndex => rowIndex === index);
            this.selectedRowIndexes.splice(currentIndex, 1);
        }
    }

    handleSelectAllChange(event) {
        if (event.target.checked) {
            this.selectedRowIndexes = this.tableRows.map((row, index) => index);
        } else {
            this.selectedRowIndexes = [];
        }
    }

    handleNewDatasetClick() {
        const detail = {
            target: EVENTS.TARGETS.DATASET_BUILDER
        }
        this.dispatchEvent(new CustomEvent(EVENTS.NAVIGATE, { detail }));
    }

    handleRecordNameClick(event) {
        const reportDetailId = event.target.dataset.rowId;
        console.log(`reportDetailId = ${reportDetailId}`);
        let reportDetailRecord = this.reportDetailRecords.find(record => record.Id === reportDetailId);
        const detail = {
            reportDetailRecord,
            target: EVENTS.TARGETS.DATASET_BUILDER
        }
        this.dispatchEvent(new CustomEvent(EVENTS.NAVIGATE, { detail }));
    }

    handleRowActionMenuSelect(event) {
        console.log(`handleRowActionMenuSelect: ${event.detail.value}, ${event.target.dataset.rowIndex}`);
        const selectedAction = this.rowActions.find(action => action.name === event.detail.value);
        if (selectedAction) {
            selectedAction.onclick(event.target.dataset.rowIndex);
        }
    }

    /* UTILITY FUNCTIONS */
    prependNamespace(str) {
        if (this.namespace) {
            return `${this.namespace}__${str}`;
        }
        return str;
    }

    sortFunction(field, reverse, primer) {
        const key = primer
            ? function (x) {
                return primer(x[field]);
            }
            : function (x) {
                return x[field];
            };

        return function (a, b) {
            a = key(a);
            b = key(b);
            return reverse * ((a > b) - (b > a));
        };
    }
}