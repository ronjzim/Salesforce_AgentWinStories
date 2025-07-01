import { LightningElement, track, wire } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import getCurrentCommunityUsersInfoForCompany from "@salesforce/apex/SDO_SCOM_OOA_Utility.getCurrentCommunityUsersInfoForCompany";

export default class SDO_SCOM_OOA_MyCompanyUsers extends NavigationMixin(LightningElement) {
    @track data;
    @track error;
    isLoading = false;

    @track columns = [
        {
            label: 'User',
            fieldName: 'id',
            type: 'recordLink',
            typeAttributes: {
                recordId: { fieldName: 'contactId' },
                recordLabel: { fieldName: 'name' }
            },
        },
        {
            label: 'Access',
            fieldName: 'access',
            type: 'text',
        },
        {
            label: 'Approver',
            fieldName: 'approver',
            type: 'text',
        },
        {
            label: 'Budget',
            fieldName: 'budget',
            type: 'currency',
            cellAttributes: { alignment: 'left' }
        }
    ];

    @wire(getCurrentCommunityUsersInfoForCompany)
    companyUsers(result) {
        try {
            let { error, data } = result;
            if (data) {
                this.data = data.map((netMem) => {
                    let { Member } = netMem;
                    return {
                        id: netMem.Id,
                        contactId: Member?.Contact?.Id,
                        name: `${Member.FirstName} ${Member.LastName}`,
                        access: Member?.Contact?.SDO_SCOM_OOA_Access__c,
                        budget: Member?.Contact?.SDO_SCOM_OOA_Budget_Limit__c,
                        approver: Member?.Contact?.SDO_SCOM_OOA_Approver__r?.Name,
                    }
                });
                this.error = undefined;
            } else if (error) {
                console.log('companyUsers error', error);
                this.error = error;
                this.data = undefined;
            }
        } catch (err) {
            console.log('companyUsers error', error);
        }
    }

    handleRecordNav(event) {
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: {
                recordId: event.detail.recordId,
                objectApiName: 'Contact', // Replace with the API name of the object (e.g., Account, Contact)
                actionName: 'view'
            }
        });
    }

}