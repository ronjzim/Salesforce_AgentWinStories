import { LightningElement, api, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

import getAllObjectData from '@salesforce/apex/PcProductComparisonDataServices.getAllObjectData';
import getPreSelectedObjectData from '@salesforce/apex/PcProductComparisonDataServices.getPreSelectedObjectData'

import noDataFound from '@salesforce/resourceUrl/pcNoDataFound';

export default class PcSearchProduct extends LightningElement {
    objectData = [];
    @api comparingField;
    @api metaField;
    @api comparingImageField;
    @api objectApi;
    @api queryFields;
    @api orderBy;

    doneTypingInterval = 300;
    typingTimer;

    isSelected = false;
    isLoading = false;
    selectedValue;

    handleProductSearch = (event) => {
        clearTimeout(this.typingTimer);

        let value = event.target.value;
        this.typingTimer = setTimeout(() => {
            if(value && value.length > 2){
                this.handleProductSearchHelper(value);
            }
            else{
                this.handleCloseSearchDropDown();
            }
        }, this.doneTypingInterval);
    }

    handleProductSearchHelper =async (searchKey) => {
        try{
            this.isLoading = true;
            let res = await getAllObjectData({searchTerm : searchKey, objectAPIName : this.objectApi, queryFields : this.queryFields + this.comparingField, orderByField : this.orderByField, comparingField : this.comparingField, orderByField : this.orderBy })
            if(res.length>0){
                this.objectData = res.map(ele => {
                    return {...ele, compareField : ele[this.comparingField], metaField : ele[this.metaField], comparingImageField : ele[this.comparingImageField]  };
                });
                this.handleOpenSearchDropDown();
            }
            else{
                this.objectData = [];
                this.objectData.push(
                    {
                        compareField : 'No Data found!',
                        comparingImageField : noDataFound,
                    }
                );
                this.handleOpenSearchDropDown();
            }
        }
        catch(e){
            const evt = new ShowToastEvent({
                title: 'Something went wrong!',
                message: e,
                variant: 'error',
            });
            this.dispatchEvent(evt);
        }
        this.isLoading = false;
    }

    handleSelectedRecord = (evt) => {
        const index = evt.currentTarget.dataset.index;
        this.selectedValue = this.objectData[index];
        this.isSelected = true;
        this.handleCloseSearchDropDown();
        console.log("handleSelectedRecord: ", JSON.stringify(this.selectedValue))
        this.dispatchEvent(new CustomEvent('selectedrecord', {detail : {record : JSON.stringify(this.selectedValue)}}));
    }

    handleOpenSearchDropDown = () => {
        this.template.querySelector('.slds-combobox').classList.add('slds-is-open');
    }

    handleCloseSearchDropDown = () => {
        this.objectData = [];
        this.template.querySelector('.slds-combobox').classList.remove('slds-is-open');
    }

    handleDeselect = () => {
        this.selectedValue = null;
        this.isSelected = false;
        this.dispatchEvent(new CustomEvent('deselectedrecord'));
    }

    @api
    handlePreselectedRecord = async (recordId, queryFields) => {
        let res = await getPreSelectedObjectData({recordId : recordId, objectAPIName : this.objectApi, queryFields : queryFields + this.comparingField, orderByField : this.orderByField, comparingField : this.comparingField, orderByField : this.orderBy });
        this.selectedValue = {...res, compareField : res[this.comparingField], metaField : res[this.metaField], comparingImageField : res[this.comparingImageField]  };
        this.isSelected = true;
        this.handleCloseSearchDropDown();
        console.log("handlePreselectedRecord ", JSON.stringify(this.selectedValue))
        this.dispatchEvent(new CustomEvent('selectedrecord', {detail : {record : JSON.stringify(this.selectedValue)}}));
    }

}