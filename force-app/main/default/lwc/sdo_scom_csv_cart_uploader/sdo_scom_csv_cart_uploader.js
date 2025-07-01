import { LightningElement, api, wire } from 'lwc';
import Toast from 'lightning/toast';
import { refreshCartSummary } from 'commerce/cartApi';
import { AppContextAdapter, SessionContextAdapter } from 'commerce/contextApi';
import addToCart from '@salesforce/apex/SDO_SCOM_CSVCartUploadService.addToCart';
import Sdo_Scom_CSV_Cart_Uploader_Template from '@salesforce/resourceUrl/Sdo_Scom_CSV_Cart_Uploader_Template';
import UploadStatusModel from 'c/sdo_scom_csv_cart_upload_status_modal';

const CSV_NEW_LINE_REGEX = /(?:\r\n?|\n)/;
const MAX_FILE_SIZE = 5000;

export default class Sdo_scom_csv_cart_uploader extends LightningElement {
    @api title;
    @api iconName;
    @api addToCartLabel;
    @api resetLabel;
    @api successMessage;
    @api partialSuccessMessage;
    @api errorMessageModalLabel;
    @api errorMessageSectionLabel;

    acceptedFormats = ['.csv'];
    selectedFiles = [];
    showSpinner = false;

    webstoreId;
    effectiveAccountId;

    @wire(AppContextAdapter)
    appContextHandler({ data, loaded }) {
        if (loaded && data) {
            this.webstoreId = data.webstoreId;
        }
    }

    @wire(SessionContextAdapter)
    sessionHandler({ data, loaded }) {
        if (loaded && data) {
            this.effectiveAccountId = data.effectiveAccountId;
        }
    }

    get disableAddToCart() {
        return !this.selectedFiles.length || !this.validateFile();
    }

    get fileInput() {
        return this.template.querySelector('.input-file');
    }

    get showAddToCart() {
        return 
    }

    handleDownloadTemplate() {
        window.open(Sdo_Scom_CSV_Cart_Uploader_Template, '_blank');
    }

    handleReset() {
        this.selectedFiles = [];
        this.fileInput?.setCustomValidity('');
        this.fileInput?.reportValidity();
    }

    handleFilesChange(event) {
        this.selectedFiles = event.target.files || [];
        this.validateFile();
    }

    validateFile() {
        const csvFile = this.selectedFiles[0];
        if (csvFile?.size > MAX_FILE_SIZE) {
            const errorMessage = `File Size: ${csvFile.size} bytes, exced ${MAX_FILE_SIZE} bytes limit.`;
            this.fileInput?.setCustomValidity(errorMessage);
        } else {
            this.fileInput?.setCustomValidity('');
        }
        return this.fileInput?.reportValidity();
    }

    handleAddItemsToCart() {
        if (!this.validateFile()) {
            return;
        }
        this.showSpinner = true;
        const csvFile = this.selectedFiles[0];
        this.fileReader = new FileReader();
        this.fileReader.onloadend = (() => {
            const textContent = this.fileReader.result;
            const products = this.convertCSVToJson(textContent);
            this.addToCartInBatches(products);
        });
        this.fileReader.readAsText(csvFile);
    }
    addToCartInBatches(products) {
        const productsCopy = products.slice(0);
        const addToCartArrayPromisses = [];
        while (productsCopy.length) {
            addToCartArrayPromisses.push(
                addToCart({
                    webstoreId: this.webstoreId,
                    effectiveAccountId: this.effectiveAccountId,
                    products: productsCopy.splice(0, 20) //Get Products API supports only 20 Items
                }).catch(exception => {
                    return Promise.reject(exception?.body?.message);
                })
            );
        }
        Promise.allSettled(addToCartArrayPromisses).then(results => {
            const errors = [];
            const exceptionsSet = new Set();
            results.forEach(result => {
                const { status, value, reason } = result;
                if(status === 'fulfilled') {
                    value && errors.push(...result.value);
                } else {
                    reason && exceptionsSet.add(reason);
                }
            });
            const exceptions = exceptionsSet.values().toArray();
            this.showSpinner = false;
            return this.handleErrors(products, errors, exceptions);
        }).then(() => {
            refreshCartSummary();
            this.handleReset();
        });
    }
    convertCSVToJson(csvContent) {
        const csvRows = csvContent.split(CSV_NEW_LINE_REGEX).slice(1); // Removing csv header
        const jsonContent = csvRows.reduce((jsonRows, csvRow)=> {
            const [productCode, quantity] = csvRow.split(',');
            if(productCode.trim()) {
                const jsonRow = {
                    productCode: productCode.trim(),
                    quantity: Math.round(quantity.trim() || 1)
                }
                jsonRows.push(jsonRow);
                return jsonRows;
            }
        }, []);
        return jsonContent;
    }
    async handleErrors(products, errors, exceptions) {
        const errorsLength = errors.length;
        if(errorsLength) {
            const totalNoOfItems = products.length;
            const partialSuccessMessage = this.partialSuccessMessage
                .replace('{0}', totalNoOfItems - errorsLength)
                .replace('{1}', totalNoOfItems);
            
            return UploadStatusModel.open({
                label: this.errorMessageModalLabel,
                size: 'medium',
                partialSuccessMessage,
                errorMessageSectionLabel: this.errorMessageSectionLabel,
                errors,
                exceptions
            });
        } else if(exceptions.length) {
            this.showErrorToast('There are some exceptions!', exceptions.join('; '));
        } else {
            this.showSuccessToast(this.successMessage);
        }
        return Promise.resolve();
    }

    showSuccessToast(label) {
        Toast.show({
            label: label,
            mode: 'sticky',
            variant: 'success'
        }, this);
    }

    showErrorToast(label, message) {
        Toast.show({
            label: label,
            message: message,
            mode: 'sticky',
            variant: 'error'
        }, this);
    }
}