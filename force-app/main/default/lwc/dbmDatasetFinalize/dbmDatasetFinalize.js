import { LightningElement, api, wire } from 'lwc';
import { VALIDATEABLE_COMPONENTS } from "c/dbmUtils";

export default class DbmDatasetFinalize extends LightningElement {
    @api
    get reportDetails() {
        return this._reportDetails;
    }
    set reportDetails(value) {
        this._reportDetails = JSON.parse(JSON.stringify(value));
    }
    _reportDetails;
    @api foldersList = [];

    get folderOptions() {
        let options = this.foldersList.map(folder => {
            return {
                label: folder.Name,
                value: folder.DeveloperName
            }
        });
        // console.log(`options = ${JSON.stringify(options)}`);
        return options;
    }

    dispatchDetails() {
        const detail = this.reportDetails;
        this.dispatchEvent(new CustomEvent('reportdetailchange', { detail }));
    }

    /* EVENT HANDLERS */
    handleReportDetailChange(event) {
        this.reportDetails[event.target.name] = event.detail.value;
        this.dispatchDetails();
    }

    /* UTILITY FUNCTIONS */
    @api validate() {
        let allValid = true;
        for (let tagName of VALIDATEABLE_COMPONENTS) {
            for (let el of this.template.querySelectorAll(tagName)) {
                allValid = el.reportValidity() && allValid;
            }
        }
        return allValid;
    }
}