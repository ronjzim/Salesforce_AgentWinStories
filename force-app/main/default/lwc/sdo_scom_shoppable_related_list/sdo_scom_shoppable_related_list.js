import { LightningElement, api, track, wire } from 'lwc';
import { AppContextAdapter, SessionContextAdapter } from 'commerce/contextApi';
import { addItemToCart } from 'commerce/cartApi';
import { ProductAdapter } from 'commerce/productApi';
import Toast from 'lightning/toast';

import getShoppableAssets from '@salesforce/apex/Sdo_Scom_ShoppableAssetsService.getShoppableAssets';

import { filteredColumns } from './relatedListDataTableService.js';
export default class Sdo_scom_shoppable_related_list extends LightningElement {
    @api assetId;
    @api assetName;
    @api relatedListTitle;
    @api noItemsMessage;
    @api noOfRowsForPage;
    @api addToCartLabel;
    @api addToCartSuccesMessage;

    @api hideImageColumn;
    @api hideProductNameColumn;
    @api hidePriceColumn;
    @api hideAddToCartColumn;

    isLoggedIn = true;
    effectiveAccountId;
    webstoreId;
    isLoading = true;

    shoppableAssetsMap = {};
    @track shoppableAssets = [];
    @track filteredShoppableAssets = [];
    @track currentPageShoppableAssets = [];
    totalShoppableAssets = 0;
    currentPage = 1;
    rowNumberOffset = 0;
    searchTerm = '';
    currentProductId;
    expandedRows = [];

    @wire(SessionContextAdapter)
    sessionHandler({ data, loaded }) {
        if (loaded && data) {
            this.effectiveAccountId = data.effectiveAccountId;
            this.isLoggedIn = data.isLoggedIn;
            this.getShoppableAssets();
        }
    }

    @wire(AppContextAdapter)
    appContextHandler({ data, loaded }) {
        if (loaded && data) {
            this.webstoreId = data.webstoreId;
            this.getShoppableAssets();
        }
    }

    getShoppableAssets() {
        if (!this.assetId || !this.webstoreId || (!this.effectiveAccountId && this.isLoggedIn)) {
            return;
        }
        return getShoppableAssets({
            assetId: this.assetId,
            webstoreId: this.webstoreId,
            effectiveAccountId: this.effectiveAccountId
        }).then(respose => {
            this.generateTableData(respose);
        }).catch(error => {
            throw error;
        }).finally(() => {
            this.isLoading = false;
        });
    }
    isVariantProduct(productData) {
        return productData.ProductClass === 'VariationParent' ||
            productData.ProductClass === 'Variation Parent';
    }
    getImageUrl(imageData) {
        const { alternateText, thumbnailUrl, url } = imageData || {};
        
        return {
            imageUrl: thumbnailUrl || url,
            imageAltText: alternateText
        };
    }

    getChildren(productData) {
        const childrenData = {
            _children: []
        }
        if(this.isVariantProduct(productData)) {
            return {
                _children: []
            }
        }
        return {};
    }

    generateTableData(shoppableAssets = []) {
        this.shoppableAssets = shoppableAssets.map(asset => {
            const { defaultImage, fields, id, sku } = asset;
            const assetData = {
                ...this.getImageUrl(asset.defaultImage),
                id,
                sku,
                name: fields.Name,
                addToCartLabel: this.addToCartLabel,
                disableAddToCart: this.isVariantProduct(fields),
                ...this.getChildren(fields)
            }
            this.shoppableAssetsMap[id] = assetData;
            return assetData;
        });
        this.filterShoppableAssets();
        this.resetPagination();
    }

    filterShoppableAssets() {
        if(this.searchTerm) {
            const searchTerm = (this.searchTerm || '').toLowerCase();
            this.filteredShoppableAssets = this.shoppableAssets.filter(asset => {
                return asset.name.toLowerCase().includes(searchTerm);
            });
        } else {
            this.filteredShoppableAssets = this.shoppableAssets;
        }
        this.totalShoppableAssets = this.filteredShoppableAssets.length;
    }

    updateCurrentPageShoppableAssets() {
        const startIndex = (this.currentPage - 1) * this.noOfRowsForPage;
        let endIndex = startIndex + this.noOfRowsForPage;
        endIndex = endIndex > this.totalShoppableAssets ? this.totalShoppableAssets : endIndex;

        this.rowNumberOffset = startIndex;
        this.currentPageShoppableAssets = this.filteredShoppableAssets.slice(startIndex, endIndex);
    }

    resetPagination() {
        this.currentPage = 1;
        this.updateCurrentPageShoppableAssets();
    }

    get columns() {
        const columnFilters = {
            sku: true,
            productImage: !this.hideImageColumn,
            productName: !this.hideProductNameColumn,
            productPrice: !this.hidePriceColumn,
            addToCart: !this.hideAddToCartColumn
        }
        return filteredColumns(columnFilters);
    }

    get totalPages() {
        return Math.ceil(this.totalShoppableAssets / this.noOfRowsForPage) || 1;
    }

    get disablePrevious() {
        return this.currentPage <= 1;
    }

    get disableNext() {
        return this.currentPage >= this.totalPages;
    }

    handlePreviousClick() {
        this.isLoading = true;
        this.currentPage -= 1;
        this.updateCurrentPageShoppableAssets();
        this.isLoading = false;
    }

    handleNextClick() {
        this.isLoading = true;
        this.currentPage += 1;
        this.updateCurrentPageShoppableAssets();
        this.isLoading = false;
    }

    handleRowAction(event) {
        this.isLoading = true;
        const { name: actionName } =  event?.detail?.action;
        if(actionName === 'AddToCart') {
            this.handleAddItemToCart(event);
        }
        this.isLoading = false;
    }

    handleAddItemToCart(event) {
        addItemToCart(
            event?.detail?.row?.id,
            1
        ).then(() => {
            Toast.show({
                label: this.addToCartSuccesMessage,
                mode: 'dismissible',
                variant: 'success'
            }, this);
        }).catch(ex => {
            const { code, messaage } = ex?.error;
            Toast.show({
                label: code + ": " + messaage,
                mode: 'dismissible',
                variant: 'error'
            }, this);
        })
    }

    handleSearch(event) {
        this.isLoading = true;
        this.searchTerm = event?.target?.value;
        this.filterShoppableAssets();
        this.resetPagination();
        this.isLoading = false;
    }

    handleDownload() {
        const fileName = `${this.assetName}-${this.assetId}-${this.relatedListTitle.toLowerCase().replaceAll(' ', '-')}.csv`;
        const columns = ['assetId', 'productId'];
        const content = this.shoppableAssets.reduce((content, item) => {
            return `${content}\n${this.assetId},${item.id}`;
        }, columns.join(','));

        const assetBlob = new Blob([content], {type: 'text/csv'});
        const assetBlobUrl = window.URL.createObjectURL(assetBlob);

        const elem = this.template.querySelector(".download-link");
        elem.href = assetBlobUrl;
        elem.download = fileName;
        elem.click();
        window.URL.revokeObjectURL(assetBlobUrl);
    }

    handleRefresh() {
        this.isLoading = true;
        this.searchTerm = '';
        this.getShoppableAssets();
    }

    @wire(ProductAdapter, {
        productId: '$currentProductId',
    })
    handleProductVariationsResponse({ data, loaded }) {
        if (loaded && data) {
            const {
                id, 
                variationInfo: {
                    attributesToProductMappings: productVariations
                }
            } = data;

            const parentProduct = this.shoppableAssetsMap[id];
            parentProduct._children = productVariations.map(variant => {
                const { canonicalKey, productId } = variant;
                const variantData = {
                    imageUrl: parentProduct.imageUrl,
                    imageAltText: parentProduct.alternateText,
                    id: productId,
                    name: `${parentProduct.name} (${canonicalKey})`,
                    addToCartLabel: this.addToCartLabel,
                }
                this.shoppableAssetsMap[productId] = variantData;
                return variantData;
            });
            this.currentPageShoppableAssets = this.currentPageShoppableAssets.slice(0);
        }
        if(loaded) {
            this.isLoading = false;
        }
    }

    handleRowToggle(event) {
        const { name, isExpanded, hasChildrenContent, row} = event?.detail;
        if(isExpanded && !hasChildrenContent && row._children.length == 0) {
            this.currentProductId = name;
        }
    }
}