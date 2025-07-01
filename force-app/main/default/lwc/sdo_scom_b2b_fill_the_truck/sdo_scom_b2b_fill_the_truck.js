import { LightningElement, api, wire } from 'lwc';
import { AppContextAdapter, SessionContextAdapter } from 'commerce/contextApi';

import getFilledCapacity from '@salesforce/apex/SDO_SCOM_B2B_FillTheTruckService.getFilledCapacity';

export default class Sdo_scom_b2b_fill_the_truck extends LightningElement {
    @api numberOfTrucksLabel;
    @api totalTruckCapacityLabel;
    @api remainingTruckCapacityLabel;
    @api filledTruckCapacityLabel;

    @api totalTruckCapacity;

    filledTruckCapacity = 0;
    remainingTruckCapacityPercentage = 0;
    numberOfTrucks = 0;

    effectiveAccountId;
    webstoreId;
    isLoading = true;
    computedStyle = '';
    layoutItemSize = '3';
    layoutDlClass = '';

    @wire(SessionContextAdapter)
    sessionHandler({ data, loaded }) {
        if (loaded && data) {
            this.effectiveAccountId = data.effectiveAccountId;
            this.getFilledCapacity();
        }
    }

    @wire(AppContextAdapter)
    appContextHandler({ data, loaded }) {
        if (loaded && data) {
            this.webstoreId = data.webstoreId;
            this.getFilledCapacity();
        }
    }

    getFilledCapacity() {
        if (!this.webstoreId || !this.effectiveAccountId) {
            return;
        }
        getFilledCapacity({
            'effectiveAccountId': this.effectiveAccountId,
            'webstoreId': this.webstoreId
        }).then((filledCapacity = 0) => {
            this.numberOfTrucks = Math.ceil(filledCapacity / this.totalTruckCapacity); 1
            // If filled capacity is more than total truck capacity, 
            // then we are calculating truck capacity for last truck
            this.filledTruckCapacity = filledCapacity === 0 ?
                filledCapacity :
                ((filledCapacity % this.totalTruckCapacity) || this.totalTruckCapacity);
            const filledTruckCapacityPercentage = this.filledTruckCapacity / this.totalTruckCapacity;
            this.remainingTruckCapacityPercentage = 1 - filledTruckCapacityPercentage;
            this.computedStyle = filledTruckCapacityPercentage ? `--c-progress-bar-width: ${filledTruckCapacityPercentage * 100}%;` : '';
        }).catch(e => {
            console.error("Fill the truck error: ", e);
        }).finally(() => {
            this.isLoading = false;
        });
    }

    get layoutItems() {
        return [
            {
                label: this.numberOfTrucksLabel,
                value: this.numberOfTrucks,
                formatStyle: 'decimal'
            },
            {
                label: this.totalTruckCapacityLabel,
                value: this.totalTruckCapacity,
                formatStyle: 'decimal'
            },
            {
                label: this.remainingTruckCapacityLabel,
                value: this.remainingTruckCapacityPercentage,
                formatStyle: 'percent'
            },
            {
                label: this.filledTruckCapacityLabel,
                value: this.filledTruckCapacity,
                formatStyle: 'decimal'
            }
        ]
    }

    get progressContainer() {
        return this.template.querySelector('.progress-container');
    }

    calculateLayoutAlignments() {
        const containerWidth = this.progressContainer.offsetWidth;
        if (containerWidth <= 767) {
            this.layoutItemSize = '12';
            this.layoutDlClass = 'slds-grid slds-grid_align-spread';
        } else {
            this.layoutItemSize = '3';
            this.layoutDlClass = '';
        }
    }

    renderedCallback() {
        if(!this.rendered) {
            this.calculateLayoutAlignments();
            this.rendered = true;
        }
    }
}