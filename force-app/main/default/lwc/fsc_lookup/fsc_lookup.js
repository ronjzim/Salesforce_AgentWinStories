import { LightningElement, api, track, wire } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';
import search from '@salesforce/apex/FscLookupController.search';
import getRecentlyViewed from '@salesforce/apex/FscLookupController.getRecentlyViewed';
import getRecordsFromIds from '@salesforce/apex/FscLookupController.getRecordsFromIds';

const DEFAULTS = {
    NUM_RECENTLY_VIEWED: 5,
    DEBOUNCE_DELAY: 200
}

const ACTIONS = {
    NEW_RECORD: {
        label: 'New Record',
        value: 'newRecord',
        icon: 'utility:add',
        isAction: true
    }
}

export default class Fsc_lookup extends NavigationMixin(LightningElement) {
    /* PUBLIC PROPERTIES */
    // @api objectName;

    @api label = 'Select Record';
    @api placeholder = 'Type to search records';
    @api required;
    @api allowMultiselect;
    @api publicClass;
    @api publicStyle;
    @api debounceDelay = DEFAULTS.DEBOUNCE_DELAY;
    @api fieldsToSearch = '';
    @api fieldsToDisplay = '';
    @api iconName;
    @api preventClearIntercept;
    @api isLoading = false;
    @api showNewRecordAction = false;
    @api excludeSublabelInFilter = false;   // If true, the 'sublabel' text of an option is included when determining if an option is a match for a given search text.
    @api includeValueInFilter = false;  // If true, the 'value' text of an option is not included when determining if an option is a match for a given search text.
    @api whereClause;
    @api orderByClause; // Reserved for future use

    /* PRIVATE PROPERTIES */
    @track recentlyViewedRecords = [];
    @track records = [];
    showNewRecordModal;
    debugModeOn = true;

    /* PUBLIC GETTERS AND SETTERS */
    @api
    get objectName() {
        return this._objectName;
    }
    set objectName(value) {
        this._objectName = value;
        this.getRecentlyViewed();
    }
    _objectName;

    @api
    get values() {
        return this._values || [];
    }
    set values(values) {
        if (!values) {
            this._values = [];
        } else {
            this._values = Array.isArray(values) ? values : [values];
            // this.debug('in set values');
            let unqueriedValues = this.values.filter(value => !this.records.some(record => record.value == value));
            // this.debug('unqueried values: ' + JSON.stringify(unqueriedValues));
            if (unqueriedValues.length) {
                // String objectName, String fieldsToReturn, List<String> idsToRetrieve
                getRecordsFromIds({
                    objectName: this.objectName,
                    fieldsToReturn: this.fieldsToDisplay,
                    idsToRetrieve: unqueriedValues
                }).then(result => {
                    // this.debug('got result');
                    // this.debug(JSON.stringify(result));
                    this.records = [...this.records, ...this.parseFields(result)];
                    this.addNewRecordAction();
                    // this.debug('finished get getRecordsFromIds result');
                }).catch(error => {
                    // this.debug('in getRecordsFromIds error');
                    this.debug(`in lookup set values, error: ${JSON.stringify(error)}`);
                }).finally(() => {
                    // this.debug('finished search change, setting isloading to false');
                    this.isLoading = false;
                })
            }
        }
    }
    @track _values = [];

    @api
    get value() {
        return this.values.join(this.valueDelimiter);
    }
    set value(value) {
        if (!value) {
            this.values = [];
        } else {
            value = String(value);
            this.values = this.allowMultiselect ? value.split(this.valueDelimiter).map(val => val.trim()) : [value];
        }
    }

    @api
    get selectedRecords() {
        let records = [];
        for (let value of this.values) {
            const record = this.records.find(rec => rec.value === value);
            if (record) {
                records.push(record);
            }
        }
        return records;
    }

    @api
    reportValidity() {
        return this.combobox.reportValidity();
    }

    @api
    validate() {
        return this.combobox.validate();
    }

    @api focus() {
        this.combobox.focus();
    }

    @api
    get selectedRecord() {
        return this.selectedRecords.length ? this.selectedRecords[0] : null;
    }

    get combobox() {
        return this.template.querySelector('c-fsc_combobox');
    }

    get isDisabled() {
        return this.disabled || !this.objectName;
    }

    get computedPlaceholder() {
        if (!this.objectName) {
            return 'No object selected, please select an object';
        } else if (this.isLoading) {
            return 'Loading...';
        } else {
            return this.placeholder;
        }
    }

    @wire(getObjectInfo, { objectApiName: '$objectName' })
    objectInfo;

    connectedCallback() {
        // this.debug('in lookup connectedcallback');
        // this.getRecentlyViewed();

        // If no icon name is provided, try using `standard:[objectName]` with objectName converted to snake case
        if (!this.iconName) {
            this.iconName = `standard:${this.objectName.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase()}`;
        }
    }

    getRecentlyViewed() {
        this.isLoading = true;
        getRecentlyViewed({ objectName: this.objectName, fieldsToReturn: this.fieldsToDisplay, numRecordsToReturn: DEFAULTS.NUM_RECENTLY_VIEWED, whereClause: this.whereClause })
            .then(result => {
                // this.debug('getRecentlyView result = ' + JSON.stringify(result));
                this.recentlyViewedRecords = this.parseFields(result);
                if (!this.records.length) {
                    this.resetRecentlyViewed();
                }
            })
            .catch(error => {
                this.debug('ERROR: ' + JSON.stringify(error));
            }).finally(() => {
                this.isLoading = false;
            })
    }

    handleSearchChange = (searchText) => {
        // this.debug('in handleSearchChange for ' + searchText);
        if (!searchText) {
            this.resetRecentlyViewed();
        } else {
            this.isLoading = true;
            search({
                searchTerm: searchText,
                objectName: this.objectName,
                fieldsToSearch: this.fieldsToSearch || (this.excludeSublabelInFilter ? null : this.fieldsToDisplay),
                fieldsToReturn: this.fieldsToDisplay,
                whereClause: this.whereClause,
                orderByClause: this.orderByClause,
                numRecordsToReturn: 0
            }).then(result => {
                // this.debug('got result');
                // this.debug(JSON.stringify(result));
                this.records = this.parseFields(result);
                this.addNewRecordAction();
                // this.debug('finished get result');
            }).catch(error => {
                // this.debug('in error');
                this.debug(`In lookup handleSearchChange, error: ${JSON.stringify(error)}`);
            }).finally(() => {
                // this.debug('finished search change, setting isloading to false');
                this.isLoading = false;
            })
        }
    }

    parseFields(apexResults) {
        let displayFields, labelField, sublabel;
        if (this.fieldsToDisplay) {
            displayFields = this.fieldsToDisplay.split(',');
            labelField = displayFields.splice(0, 1);
        }

        return apexResults.map(record => {
            if (!labelField) {
                let nonIdFields = Object.keys(record).filter(fieldName => fieldName != 'Id');
                if (nonIdFields.length !== 1) {
                    // THROW ERROR
                    this.debug('Error: expected exactly one other field');
                }
                labelField = nonIdFields[0];
            }
            if (displayFields && displayFields.length) {
                let sublabelValues = [];
                for (let sublabelField of displayFields) {
                    if (record[sublabelField]) {
                        sublabelValues.push(record[sublabelField]);
                    }
                }
                sublabel = sublabelValues.join(' • ');
            }
            return {
                label: record[labelField],
                value: record.Id,
                sublabel: sublabel,
                icon: this.iconName
            }
        });
    }

    resetRecentlyViewed() {
        this.records = this.recentlyViewedRecords.map(rec => Object.assign({}, rec));
        this.addNewRecordAction();
    }

    addNewRecordAction() {
        if (this.showNewRecordAction) {
            this.records.unshift(ACTIONS.NEW_RECORD);
        }
    }
    handleComboboxChange(event) {
        if (this.allowMultiselect) {
            this.values = event.detail.values;
        } else {
            this.value = event.detail.value;
        }
        this.dispatchRecords();
    }

    handleCustomAction(event) {
        // this.debug('in handleCustomAction');
        // this.debug(event.detail);
        if (event.detail === ACTIONS.NEW_RECORD.value) {
            this.showNewRecordModal = true;
            // this.template.querySelector('.newRecordModal').open();
        }
    }

    handlewNewRecordSave(event) {
        const evt = new ShowToastEvent({
            title: 'Record Created',
            message: 'Record ID: ' + event.detail.id,
            variant: 'success',
        });
        this.dispatchEvent(evt);
        this.closeNewRecordModal();
    }

    closeNewRecordModal() {
        this.showNewRecordModal = false;
    }

    dispatchRecords() {
        let detail;
        if (this.allowMultiselect) {
            detail = {
                values: this.values,
                selectedRecords: this.selectedRecords
            }
        } else {
            detail = {
                value: this.value,
                selectedRecord: this.selectedRecord
            }
        }
        // this.debug('about to dispatch, ' + JSON.stringify(detail));
        this.dispatchEvent(new CustomEvent('recordchange', { detail: detail }));
    }

    /* UTILITY FUNCTIONS */
    debug(msg) {
        if (this.debugModeOn) {
            console.log(msg);
        }
    }
}