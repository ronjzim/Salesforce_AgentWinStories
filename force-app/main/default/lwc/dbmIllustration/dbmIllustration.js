import { LightningElement } from 'lwc';
import { EVENTS } from "c/dbmUtils";

export default class DbmIllustration extends LightningElement {
    handleNewDataset() {
        this.dispatchEvent(new CustomEvent('new'));
    }
}