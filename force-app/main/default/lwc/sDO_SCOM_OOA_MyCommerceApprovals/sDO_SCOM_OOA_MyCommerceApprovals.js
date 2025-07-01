import { LightningElement, wire, track } from 'lwc';
import { updateRecord } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';
import { NavigationMixin } from 'lightning/navigation';
import getCurrentUserApprovals from "@salesforce/apex/SDO_SCOM_OOA_Utility.getCurrentUserApprovals";

export default class SDO_SCOM_OOA_MyCommerceApprovals extends  NavigationMixin(LightningElement) {
    @track statusPicklistOptions = [
        { "label": "Awaiting Response", "value": "Awaiting Response" },
        { "label": "Approved", "value": "Approved" },
        { "label": "Denied", "value": "Denied" }
    ];
    @track data;
    @track error;
    @track draftValues = [];
    @track lastSavedData = [];
    @track approvalRequestsData;
    isLoading = false;

    @track columns = [
        {
            label: 'Request No.',
            fieldName: 'id',
            type: 'recordLink',
            typeAttributes: {
                recordId: { fieldName: 'Id' },
                recordLabel: { fieldName: 'Name' }
            },
        },
        {
            label: 'Requester',
            fieldName: 'Requester',
            type: 'text',
        },
        {
            label: 'Budget Limit',
            fieldName: 'Budget_Limit__c',
            type: 'currency',
            cellAttributes: { alignment: 'left' } 
        },
        {
            label: 'Requested Amount',
            fieldName: 'Credit_Override_Amount__c',
            type: 'currency',
            cellAttributes: { alignment: 'left' } 
        },
        {
            label: 'Status',
            fieldName: 'Status__c',
            type: 'picklist',
            editable: true,
            typeAttributes: {
                placeholder: 'Choose a Status',
                options: { fieldName: 'statusPicklistOptions' },
                value: { fieldName: 'Status__c' },
                context: { fieldName: 'Id' }
            },
            wrapText: true
        }
    ];

    @wire(getCurrentUserApprovals)
    approvalRequests(result) {
        this.approvalRequestsData = result;
        let { error, data } = result;
        if (data) {
            //console.log('approvalRequests', data);
            this.data = data.map((record) => {
                let rec = { ...record };
                rec.Requester = `${rec?.Requester__r?.FirstName} ${rec?.Requester__r?.LastName}` || '';
                rec.statusPicklistOptions = this.statusPicklistOptions;
                return rec;
            });
            this.lastSavedData = JSON.parse(JSON.stringify(this.data));
            this.error = undefined;
        } else if (error) {
            console.log('approvalRequests', error);
            this.error = error;
            this.data = undefined;
        }
    }

    updateDraftValues(updateItem) {
        let draftValueChanged = false;
        let copyDraftValues = [...this.draftValues];
        //store changed value to do operations
        //on save. This will enable inline editing &
        //show standard cancel & save button
        copyDraftValues.forEach(item => {
            if (item.Id === updateItem.Id) {
                for (let field in updateItem) {
                    item[field] = updateItem[field];
                }
                draftValueChanged = true;
            }
        });

        if (draftValueChanged) {
            this.draftValues = [...copyDraftValues];
        } else {
            this.draftValues = [...copyDraftValues, updateItem];
        }
    }

    //handler to handle cell changes & update values in draft values
    handleCellChange(event) {
        let draftValues = event.detail.draftValues;
        draftValues.forEach(ele => {
            this.updateDraftValues(ele);
        })
    }

    handleSave(event) {
        this.isLoading = true;
        this.saveDraftValues = this.draftValues;

        const recordInputs = this.saveDraftValues.slice().map(draft => {
            const fields = Object.assign({}, draft);
            return { fields };
        });

        // Updating the records using the UiRecordAPi
        const promises = recordInputs.map(recordInput => updateRecord(recordInput));
        Promise.all(promises).then(async(res) => {
            this.showToast('Success', 'Records Updated Successfully!', 'success', 'dismissable');
            await refreshApex(this.approvalRequestsData);
            this.draftValues = [];
        }).catch(error => {
            console.log(error);
            this.showToast('Error', 'Uh oh! An Error Occured.', 'error', 'dismissable');
        }).finally(() => {
            this.draftValues = [];
            this.isLoading = false;
        });
    }

    handleCancel(event) {
        //remove draftValues & revert data changes
        this.data = JSON.parse(JSON.stringify(this.lastSavedData));
        this.draftValues = [];
    }

    showToast(title, message, variant, mode) {
        const evt = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant,
            mode: mode
        });
        this.dispatchEvent(evt);
    }

    handleRecordNav(event) {
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: {
                recordId: event.detail.recordId,
                objectApiName: 'SDO_SCOM_OOA_Commerce_Approval_Requests__c', // Replace with the API name of the object (e.g., Account, Contact)
                actionName: 'view'
            }
        });
    }

}