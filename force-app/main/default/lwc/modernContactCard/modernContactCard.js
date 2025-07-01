// modernContactCard.js
import { LightningElement, api, wire, track } from 'lwc';
import { getRecord, updateRecord } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';

import CONTACT_OBJECT from '@salesforce/schema/Contact';
import ID_FIELD from '@salesforce/schema/Contact.Id';
import FIRSTNAME_FIELD from '@salesforce/schema/Contact.FirstName';
import LASTNAME_FIELD from '@salesforce/schema/Contact.LastName';
import EMAIL_FIELD from '@salesforce/schema/Contact.Email';
import PHONE_FIELD from '@salesforce/schema/Contact.Phone';
import TITLE_FIELD from '@salesforce/schema/Contact.Title';
import DEPARTMENT_FIELD from '@salesforce/schema/Contact.Department';
import ACCOUNT_NAME_FIELD from '@salesforce/schema/Contact.Account.Name';
import DESCRIPTION_FIELD from '@salesforce/schema/Contact.Description';

const FIELDS = [
    ID_FIELD,
    FIRSTNAME_FIELD,
    LASTNAME_FIELD,
    EMAIL_FIELD,
    PHONE_FIELD,
    TITLE_FIELD,
    DEPARTMENT_FIELD,
    ACCOUNT_NAME_FIELD,
    DESCRIPTION_FIELD
];

export default class ModernContactCard extends LightningElement {
    @api recordId;
    @track isEditing = false;
    @track isLoading = false;
    @track editData = {};

    wiredContactResult;

    @wire(getRecord, { recordId: '$recordId', fields: FIELDS })
    wiredContact(result) {
        this.wiredContactResult = result;
        if (result.error) {
            this.showToast('Error', 'Error loading contact record', 'error');
        }
    }

    get contact() {
        return this.wiredContactResult?.data;
    }

    get contactName() {
        if (!this.contact) return '';
        const firstName = this.contact.fields.FirstName.value || '';
        const lastName = this.contact.fields.LastName.value || '';
        return `${firstName} ${lastName}`.trim();
    }

    get contactInitials() {
        if (!this.contact) return '';
        const firstName = this.contact.fields.FirstName.value || '';
        const lastName = this.contact.fields.LastName.value || '';
        return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    }

    get email() {
        return this.contact?.fields?.Email?.value || '';
    }

    get phone() {
        return this.contact?.fields?.Phone?.value || '';
    }

    get title() {
        return this.contact?.fields?.Title?.value || '';
    }

    get department() {
        return this.contact?.fields?.Department?.value || '';
    }

    get accountName() {
        return this.contact?.fields?.Account?.value?.fields?.Name?.value || '';
    }

    get description() {
        return this.contact?.fields?.Description?.value || '';
    }

    handleEdit() {
        this.isEditing = true;
        this.editData = {
            [ID_FIELD.fieldApiName]: this.recordId,
            [FIRSTNAME_FIELD.fieldApiName]: this.contact.fields.FirstName.value || '',
            [LASTNAME_FIELD.fieldApiName]: this.contact.fields.LastName.value || '',
            [EMAIL_FIELD.fieldApiName]: this.email,
            [PHONE_FIELD.fieldApiName]: this.phone,
            [TITLE_FIELD.fieldApiName]: this.title,
            [DEPARTMENT_FIELD.fieldApiName]: this.department,
            [DESCRIPTION_FIELD.fieldApiName]: this.description
        };
    }

    handleCancel() {
        this.isEditing = false;
        this.editData = {};
    }

    handleInputChange(event) {
        const field = event.target.dataset.field;
        this.editData[field] = event.target.value;
    }

    async handleSave() {
        this.isLoading = true;
        try {
            await updateRecord({ fields: this.editData });
            await refreshApex(this.wiredContactResult);
            this.isEditing = false;
            this.showToast('Success', 'Contact updated successfully', 'success');
        } catch (error) {
            this.showToast('Error', 'Error updating contact: ' + error.body.message, 'error');
        } finally {
            this.isLoading = false;
        }
    }

    showToast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({
            title,
            message,
            variant
        }));
    }
}