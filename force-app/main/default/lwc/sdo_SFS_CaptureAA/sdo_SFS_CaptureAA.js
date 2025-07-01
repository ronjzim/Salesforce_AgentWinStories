import { LightningElement ,api,wire,track} from 'lwc';
import {notifyRecordUpdateAvailable} from 'lightning/uiRecordApi';
import getAssetId from '@salesforce/apex/SDO_SFS_AAController.getAssetId';
import getAssetAttributes from '@salesforce/apex/SDO_SFS_AAController.getAssetAttributes'
import saveAttribute from '@salesforce/apex/SDO_SFS_AAController.saveAttribute';
import LightningAlert from 'lightning/alert';
import { refreshApex } from '@salesforce/apex';

export default class Sdo_SFS_CaptureAA extends LightningElement {
    isShowDetails=true;
    @track records;
    @api recordId;
    @api assetId;   
    @api attributeId;
    @track changedRecords=[];
    @track pickListOptions=[];
    @track dummyData=[];
    @track assetName;
    @track workOrderNumber;

    connectedCallback()
    {
        this.retrieveAssetDetails();
    }
    
    retrieveAssetDetails()
    {
       getAssetId({workOrderId:this.recordId})
       .then((result) => {
        this.assetId = result;
        this.retrieveAssetAttributes();
       })
       .catch((error) => {
            LightningAlert.open({
                message:error,
                theme:'error',
                label:'Error'
            });       
        });
    }
    retrieveAssetAttributes()
    {
      getAssetAttributes({assetId:this.assetId,workOrderId:this.recordId})
      .then((result) => {
        this.changedRecords=[];
        this.records=result;
        this.records.map((item) => {
            var newItem = {};
            this.assetName = item.AssetName;
            this.workOrderNumber = item.WorkOrderNumber;
            newItem.Id = item.Id;
            newItem.AttributeName = item.AttributeName;
            newItem.AttributeValue = item.AttributeValue;
            newItem.DataType = item.DataType;
            newItem.IsRequired = item.IsRequired;
            newItem.UnitOfMeasure = '';
            if(item.UnitOfMeasure) {
                newItem.UnitOfMeasure = item.UnitOfMeasure; } 
            newItem.isNumeric = false;
            newItem.isText = false;
            newItem.isDate = false;
            newItem.isDateTime = false;
            newItem.isCheckbox = false;
            newItem.isPicklist = false;
            newItem.dataType = 'text';
            newItem.isNotPicklist = true;
            newItem.pickListOptions=[];
            switch (newItem.DataType) {
                case 'Number':
                  newItem.isNumeric = true;
                  newItem.dataType = 'number';
                  break;
                case 'Text':
                  newItem.isText = true;
                  newItem.dataType = 'text';
                  break;
                case 'Date':
                  newItem.isDate = true;
                  newItem.dataType = 'date';
                  newItem.displayDate = new Date(newItem.AttributeValue);
                  break;
                case 'Datetime':
                    newItem.isDatetime = true;
                    newItem.dataType = 'datetime';
                    break;
                case 'Checkbox':
                    newItem.isCheckbox = true;
                    newItem.dataType = 'checkbox';
                    break;
                case 'Picklist':
                    newItem.isPicklist = true;  
                    newItem.dataType = 'picklist';
                    newItem.isNotPicklist = false;
                    let options=[];
                    item.listPLV.forEach(element=>{
                        options.push({
                            label: element.DisplayValue,
                            value: element.Id
                        });
                    });
                    newItem.pickListOptions = options;
                    break;
            }
            this.changedRecords.push(newItem);  
        });
      })
      .catch((error) => {
        LightningAlert.open({
            message:error,
            theme:'error',
            label:'Error'
        });
      });
    }
    // wire to get asset id from apex
    // @wire(getAssetId, {workOrderId:'$recordId'})
    // retrieveAssetId({error, data}) {
    //     if (error) {
    //         // TODO: Error handling
    //     } else if (data) {
    //         this.assetId=data;
    //     }
    // }
    // @wire(getAssetAttributes, {assetId:'$assetId',workOrderId:'$recordId'})
    // retrieveAssetAttributes(result) {
    //     this.dummyData=result;
    //     if (result.error) {
    //         // TODO: Error handling
    //     } else if (result.data) {
    //         this.changedRecords=[];
    //         this.records=result.data;
    //         this.records.map((item) => {
    //             var newItem = {};
    //             this.assetName = item.AssetName;
    //             this.workOrderNumber = item.WorkOrderNumber;
    //             newItem.Id = item.Id;
    //             newItem.AttributeName = item.AttributeName;
    //             newItem.AttributeValue = item.AttributeValue;
    //             newItem.DataType = item.DataType;
    //             newItem.IsRequired = item.IsRequired;
    //             newItem.UnitOfMeasure = '';
    //             if(item.UnitOfMeasure) {
    //                 newItem.UnitOfMeasure = item.UnitOfMeasure; } 
    //             newItem.isNumeric = false;
    //             newItem.isText = false;
    //             newItem.isDate = false;
    //             newItem.isDateTime = false;
    //             newItem.isCheckbox = false;
    //             newItem.isPicklist = false;
    //             newItem.dataType = 'text';
    //             newItem.isNotPicklist = true;
    //             newItem.pickListOptions=[];
    //             switch (newItem.DataType) {
    //                 case 'Number':
    //                   newItem.isNumeric = true;
    //                   newItem.dataType = 'number';
    //                   break;
    //                 case 'Text':
    //                   newItem.isText = true;
    //                   newItem.dataType = 'text';
    //                   break;
    //                 case 'Date':
    //                   newItem.isDate = true;
    //                   newItem.dataType = 'date';
    //                   newItem.displayDate = new Date(newItem.AttributeValue);
    //                   break;
    //                 case 'Datetime':
    //                     newItem.isDatetime = true;
    //                     newItem.dataType = 'datetime';
    //                     break;
    //                 case 'Checkbox':
    //                     newItem.isCheckbox = true;
    //                     newItem.dataType = 'checkbox';
    //                     break;
    //                 case 'Picklist':
    //                     newItem.isPicklist = true;  
    //                     newItem.dataType = 'picklist';
    //                     newItem.isNotPicklist = false;
    //                     let options=[];
    //                     item.listPLV.forEach(element=>{
    //                         options.push({
    //                             label: element.DisplayValue,
    //                             value: element.Id
    //                         });
    //                     });
    //                     newItem.pickListOptions = options;
    //                     break;
    //             }
    //             this.changedRecords.push(newItem);  
    //         });
    //     }    
    // }
    get aName() {
        if(this.assetName) return this.assetName;
        return '';
    }
    get wNumber() {
        if(this.workOrderNumber) return this.workOrderNumber;
        return '';
    }                 
    //add values entered by the user to the changedRecords array
    handleInputChange(event) {
            const recordId = event.target.dataset.key;
            const fieldApiName = event.target.dataset.field;
            const value = event.target.value;
    
            const updatedChangedRecords = this.changedRecords.map(record => {
                if (record.Id === recordId) {
                    return { ...record, [fieldApiName]: value };
                }
                return record;
            });
    
            this.changedRecords = updatedChangedRecords;
        }
    handlePicklistChange(event) {
        this.picklistValue = event.detail.value;
    }
    //this method will do nothing for text, number, picklist and checkbox data types
    //but it will convert dates to yyyy-mm-ddT00:00:00Z and it will convert
    //datetime to yyyy-mm-ddTHH:MM:SSZ
    processDataType(dataType,attributeValue) {
        if (dataType == 'text' || dataType == 'number' || dataType == 'picklist' || dataType == 'checkbox') {
            return attributeValue;
        }
        if (dataType == 'date' ) {
            return attributeValue.toISOString().split('T')[0]+'T00:00:00Z';
        }
        if (dataType == 'datetime') {
            return attributeValue.toISOString();
        }
    }
    //loop through all of the entered values and upate them all
    //if a mandatory attribute has no value, throw an error
    updateAttributes()
    {
        this.isShowDetails=!this.isShowDetails;
    }
    async updateAllRecords(event) {
        let recordIds=[];
        let requiredFieldMissingNames=[];
        this.changedRecords.forEach(record => {
            if(record.IsRequired) {
                if(record.Value) {}
                else {requiredFieldMissingNames.push(record.AttributeName)};
            }
        })
        if(requiredFieldMissingNames.length==0) {
            this.changedRecords.forEach(record => {
            
                    if(record.Value) {
                        let currentRecord = {recordId: record.Id};
                        recordIds.push(currentRecord);
                        var newValue = '';
                        newValue = record.Value;
                        saveAttribute({attributeId:record.Id,attributeValue:newValue})
                    }
                })
                //refreshApex not working in SFS Mobile as far as I can tell at this moment                
               // await refreshApex(this.dummyData);
                await notifyRecordUpdateAvailable(recordIds);
                await this.updateAttributes();
                await this.retrieveAssetAttributes();
                await LightningAlert.open({
                    message: 'Attributes have been updated',
                    theme: 'success', 
                    label: 'Success', 
                });                
                // this.template.querySelectorAll('lightning-input').forEach(element => {
                //     if(element.type === 'checkbox' || element.type === 'checkbox-button'){
                //     element.checked = false;
                //     }else{
                //     element.value = null;
                //     }}); 
                // this.template.querySelectorAll('lightning-combobox').forEach(element => {
                //     element.value = null;
                //      }) ;     
            }
        else {
            await LightningAlert.open({
                message: 'Required attributes have not been entered. Please enter values for: ' + requiredFieldMissingNames.join(),
                theme: 'error', 
                label: 'Required attributes missing', 
            });            
        }
    }   
}