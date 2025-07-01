import { LightningElement, api, wire, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';
import { CurrentPageReference } from 'lightning/navigation';

import getFieldSetInformation from '@salesforce/apex/PcProductComparisonDataServices.getFieldSetInformation';
import addProductToCart from '@salesforce/apex/PcProductComparisonDataServices.addProductToCart';
import getProductPrice from '@salesforce/apex/PcProductComparisonDataServices.getProductPrice';

import COMMUNITYID from '@salesforce/community/Id';


export default class PcProductComparison extends LightningElement {
    @api pageTitle;
    @api pageSubTitle;
    @api pageIcon;

    @api objectAPI;
    @api fieldSetList;
    @api orderBy;

    @api comparingField;
    @api imageFields;
    @api colorFields;
    @api metaField;
    @api comparingImageField;
    @api isThirdProductNotAvailable = false;
    queryFieldsVal;
    comparingFieldLabel;
    imageFieldSet = new Set();
    colorFieldSet = new Set();

    @track product1quantity = 0;
    @track product2quantity = 0;
    @track product3quantity = 0;

    product1Selected = {};
    product2Selected = {};
    product3Selected = {};
    product1PreSelectedVal = {};

    @track productList = [{Id : '', Name : '--None--', selected : true }];

    @track sections = [];

    isLoading = false;

    currentPageReference = null; 
    preselectedProductId = null;

    // Getting url parameter to check for prepopulated product Id
    @wire(CurrentPageReference)
    getStateParameters(currentPageReference) {
        if (currentPageReference && currentPageReference.state.c__productId) {
            this.preselectedProductId = currentPageReference.state.c__productId;
        }
    }

    connectedCallback(){
        this.isLoading = true;
        console.log("connected callback: ", this.imageFields)
        if(this.imageFields)
            this.imageFieldSet = new Set([...this.imageFields.split(',')]);
        if(this.colorFields)
            this.colorFieldSet = new Set([...this.colorFields.split(',')]);    
    }

    // Fetch property of comparing field
    @wire(getObjectInfo, { objectApiName: '$objectAPI' })
    objectInfo({error,data}){
        if(data){
            if(data.fields[this.comparingField]){
                this.comparingFieldLabel = data.fields[this.comparingField].label;
            }
        }
        if(error){
            const event = new ShowToastEvent({
                title: 'Error!',
                variant : 'error',
                message:
                    'Something went wrong! '+error,
            });
            this.dispatchEvent(event);
        }
    }

    // Fetching Field Set Information from the server
    @wire(getFieldSetInformation, {objectAPIName : '$objectAPI', fieldsetListStr : '$fieldSetList', comparingFieldInfo : '$comparingField'})
    handleObjectDataFetch({error,data}) {
        if(data){
            try{
                this.handleFieldSetInformationTransform(data);
            }
            catch(e){
                console.log(e);
                const event = new ShowToastEvent({
                    title: 'Error!',
                    variant : 'error',
                    message:
                        'Something went wrong! '+e,
                });
                this.dispatchEvent(event);
                this.isLoading = false;
            }
        }
        else{
            const event = new ShowToastEvent({
                title: 'Error!',
                variant : 'error',
                message:
                    'Something went wrong! '+error,
            });
            this.dispatchEvent(event);
            this.isLoading = false;
        }
    }

    // Transforming Feild set information and picking fields to query
    handleFieldSetInformationTransform = (fieldSetInformation) => {
        let mapFieldSetFieldWise = new Map();
        let queryFields = '';

        for(let fieldSetInfo of fieldSetInformation){
            let fieldSetArr = [];
            if(mapFieldSetFieldWise.has(fieldSetInfo.fieldSetName + '-' + fieldSetInfo.fieldSetLabel)){
                fieldSetArr = mapFieldSetFieldWise.get(fieldSetInfo.fieldSetName + '-' + fieldSetInfo.fieldSetLabel);
            }
            fieldSetArr.push({fieldLabel : fieldSetInfo.fieldLabel, fieldName : fieldSetInfo.fieldName, fieldSetLabel :  fieldSetInfo.fieldSetLabel});
            mapFieldSetFieldWise.set(fieldSetInfo.fieldSetName + '-' + fieldSetInfo.fieldSetLabel, fieldSetArr);
            queryFields += fieldSetInfo.fieldName+', ';

            // console.log("fieldsetinfo ", fieldSetInfo, fieldSetInformation)
            // console.log("fieldsetarr ", fieldSetArr)
            // console.log("queryfields ", queryFields)
        }
        this.isLoading = false;
        this.queryFieldsVal = queryFields; 
        this.handleSectionGenerator(mapFieldSetFieldWise);
        if(this.preselectedProductId){
            this.handlePreselectedRecord(this.queryFieldsVal);
        }
    }

    // Handle Preselection of Product
    handlePreselectedRecord = (queryFieldsVal) => {
        this.template.querySelectorAll('c-pc-search-product')[0].handlePreselectedRecord(this.preselectedProductId, queryFieldsVal);
    }


    //Generation Sections through fieldset dynamically 
    handleSectionGenerator = (mapFieldSetFieldWise) => {
        for(let [key, value] of mapFieldSetFieldWise.entries()){
            let tempSectionInfo = {
                headerLabel : key.split('-')[1],
                headerName : key.split('-')[0],
            };
            let fields = [];
            console.log("handleSectionGenerator: ", mapFieldSetFieldWise)
            for( let i of value){
                let isImage = false;
                let isText = false;
                let isColor = false;
                if(this.imageFieldSet.has(i.fieldName)){
                    isImage = true;
                }
                else if(this.colorFieldSet.has(i.fieldName)){
                    isColor = true;
                }
                else{
                    isText = true;
                }
                fields.push({
                    fieldLabel : i.fieldLabel,
                    fieldName : i.fieldName,
                    isImage : isImage,
                    isText : isText,
                    isColor : isColor,
                    product1Val : '',
                    product2Val : '',
                    product3Val : ''
                });
            }
            fields.push({
                fieldLabel: 'List Price',
                fieldName : 'list price',
                isImage : false,
                isText : true,
                isColor : false,
                product1Val : '',
                product2Val : '',
                product3Val : ''
            })
            fields.push({
                fieldLabel: 'Unit Price',
                fieldName : 'unit price',
                isImage : false,
                isText : true,
                isColor : false,
                product1Val : '',
                product2Val : '',
                product3Val : ''
            })
            fields.push({
                fieldLabel: 'Discount',
                fieldName : 'discount',
                isImage : false,
                isText : true,
                isColor : false,
                product1Val : '',
                product2Val : '',
                product3Val : ''
            })
            tempSectionInfo.fields = fields;
            this.sections.push(tempSectionInfo);
        }
    }

    handleProductSelected = (evt) => {
        const prodIndex = (evt.target.dataset.prodindex);
        const selectedProduct = JSON.parse(evt.detail.record);

        if(prodIndex === '1'){
            getProductPrice({
                communityId: COMMUNITYID, 
                accountId: null, 
                recordId: selectedProduct.Id
            }).then((res) => {
                console.log(res)
                this.product1Selected = selectedProduct;
                this.product1Selected['list price'] = '$' + (res['listPrice'] == null ? 0 : res['listPrice']);
                this.product1Selected['unit price'] = '$' + res['unitPrice'];

                if(res['unitPrice'] && res['listPrice']){
                    this.product1Selected['discount'] =  '$' + (res['unitPrice'] - res['listPrice']);
                } else {
                    this.product1Selected['discount'] = '$' + 0;
                }

                this.product1quantity = 1;
                console.log("getproductprice1: ", this.product1Selected)
                this.handleValueInputIntoUI();
            })
        }
        else if(prodIndex === '2'){
            getProductPrice({
                communityId: COMMUNITYID, 
                accountId: null, 
                recordId: selectedProduct.Id
            }).then((res) => {
                console.log(res)
                this.product2Selected = selectedProduct;
                this.product2Selected['list price'] = '$' + (res['listPrice'] == null ? 0 : res['listPrice']);
                this.product2Selected['unit price'] = '$' + res['unitPrice'];

                if(res['unitPrice'] && res['listPrice']){
                    this.product2Selected['discount'] =  '$' + (res['unitPrice'] - res['listPrice']);
                } else {
                    this.product2Selected['discount'] = '$' + 0;
                }

                this.product2quantity = 1;
                console.log("getproductprice2: ", this.product2Selected)
                this.handleValueInputIntoUI();
            })
        }
        if(prodIndex === '3'){
            getProductPrice({
                communityId: COMMUNITYID, 
                accountId: null, 
                recordId: selectedProduct.Id
            }).then((res) => {
                console.log(res)
                this.product3Selected = selectedProduct;
                this.product3Selected['list price'] = '$' + (res['listPrice'] == null ? 0 : res['listPrice']);
                this.product3Selected['unit price'] = '$' + res['unitPrice'];

                if(res['unitPrice'] && res['listPrice']){
                    this.product3Selected['discount'] =  '$' + (res['unitPrice'] - res['listPrice']);
                } else {
                    this.product3Selected['discount'] = '$' + 0;
                }

                this.product3quantity = 1;
                console.log("getproductprice3: ", this.product3Selected)
                this.handleValueInputIntoUI();
            })
        }
    }

    handleProductDeselected = (evt) => {
        const prodIndex = (evt.target.dataset.prodindex);
        if(prodIndex === '1'){
            this.product1Selected = null;
            this.product1quantity = 0;
        }
        else if(prodIndex === '2'){
            this.product2Selected = null;
            this.product2quantity = 0;
        }
        if(prodIndex === '3'){
            this.product3Selected = null;
            this.product3quantity = 0;
        }
        try{
            this.handleValueInputIntoUI();
        }
        catch(e){
            console.log('error',e);
        }
    }

    updateQuantity = (evt) => {
        let prodIndex = evt.target.dataset.prodindex;

        if(prodIndex === '1'){
            this.product1quantity = evt.target.value;
        }
        else if(prodIndex === '2'){
            this.product2quantity = evt.target.value;
        }
        if(prodIndex === '3'){
            this.product3quantity = evt.target.value;
        }

        console.log(this.product1quantity, this.product2quantity, this.product3quantity)

    }

    handleAddProductToCart = (evt) => {
        let prodIndex = evt.target.dataset.prodindex;
        let selectedProductId;
        let selectedQuantity;
        console.log("handleaddproducttocart: ", this.product1quantity, this.product2quantity, this.product3quantity );
        
        if(prodIndex === '1'){
            selectedProductId = this.product1Selected.Id;
            selectedQuantity = this.product1quantity;
        }
        else if(prodIndex === '2'){
            selectedProductId = this.product2Selected.Id;
            selectedQuantity = this.product2quantity;
        }
        if(prodIndex === '3'){
            selectedProductId = this.product3Selected.Id;
            selectedQuantity = this.product3quantity;
        }
        console.log("selectedproductid: ", selectedProductId, selectedQuantity)

        addProductToCart({
            communityId: COMMUNITYID, 
            accountId: null, recordId: 
            selectedProductId, 
            quantity: selectedQuantity.toString()
        }).then((res) => {
            console.log("addproducttocart ", res)
        });
    }

    

    // Update the UI basis product selection
    handleValueInputIntoUI = () => {
        for(let i of this.sections){
            for(let j  of i.fields){
                if(j.isColor){
                    let stylePallete = [];
                    if(this.product1Selected && this.product1Selected[j.fieldName]){
                        for(let i = 0;i < this.product1Selected[j.fieldName].split(',').length; i++){
                            stylePallete.push(`background:${this.product1Selected[j.fieldName].split(',')[i]}; position:relative;right:${i*10}px`);
                        }
                    }
                    j.product1Val = stylePallete;
                    stylePallete = [];
                    if(this.product2Selected && this.product2Selected[j.fieldName]){
                        for(let i = 0;i < this.product2Selected[j.fieldName].split(',').length; i++){
                            stylePallete.push(`background:${this.product2Selected[j.fieldName].split(',')[i]}; position:relative;right:${i*10}px`);
                        }
                    }
                    j.product2Val = stylePallete;
                    stylePallete = [];
                    if(this.product3Selected && this.product3Selected[j.fieldName]){
                        for(let i = 0;i < this.product3Selected[j.fieldName].split(',').length; i++){
                            stylePallete.push(`background:${this.product3Selected[j.fieldName].split(',')[i]}; position:relative;right:${i*10}px`);
                        }
                    }
                    j.product3Val = stylePallete;
                }
                else{
                    j.product1Val = this.product1Selected &&  this.product1Selected[j.fieldName] ? this.product1Selected[j.fieldName] : '';
                    console.log("handleValueInputIntoUI ", j.fieldName, this.product1Selected)
                    j.product2Val = this.product2Selected && this.product2Selected[j.fieldName] ? this.product2Selected[j.fieldName] : '';
                    j.product3Val = this.product3Selected &&  this.product3Selected[j.fieldName] ? this.product3Selected[j.fieldName] : '';
                }
            }
        }
    }

    handleToggleClick(evt) {
        evt.currentTarget.classList.toggle("slds-is-open");
        evt.currentTarget.querySelector('.slds-accordion__content').removeAttribute("hidden");
    }
}