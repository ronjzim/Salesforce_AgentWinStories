import { LightningElement, api, track, wire } from 'lwc';
import { getContent } from "experience/cmsDeliveryApi";
import Id from "@salesforce/site/Id";

export default class Sdo_scom_popup extends LightningElement {

    thankYouImageUrl;
    imageUrl;
    showThankYouImage = false;

    @track showPopUp = false;

    @api inputLabel = 'Email';

    @api buttonLabel = 'Get my discount';

    @api popUpTitle = 'GET 15% OFF YOUR FIRST ORDER';

    @api popUpDescription = 'Sign up for our emails to get a discount code for your first order with us!';

    @api inputPlaceholder = 'Your Email';

    @api productContentId; 

    @api thankYouImageContentId;

    @api altText;
    
    @api show() {
        this.showPopUp = true;
    }

    @wire(getContent, { channelOrSiteId: Id, contentKeyOrId: "$productContentId" })
    onGetProductContent(results) {
        let content = results.data;
        if(content) {
            this.imageUrl  = content?.contentBody["sfdc_cms:media"]?.url;
            if(this.imageUrl && this.imageUrl.startsWith("/cms")) {
              this.imageUrl = `${basePath}/sfsites/c${this.imageUrl}`;
            }
        }
    }

    @wire(getContent, { channelOrSiteId: Id, contentKeyOrId: "$thankYouImageContentId" })
    onGetThankyouContent(results) {
        let content = results.data;
        if(content) {
            this.thankYouImageUrl  = content?.contentBody["sfdc_cms:media"]?.url;
            if(this.thankYouImageUrl && this.thankYouImageUrl.startsWith("/cms")) {
              this.thankYouImageUrl = `${basePath}/sfsites/c${this.thankYouImageUrl}`;
            }       
        }
    }

    handleDialogClose() {
        this.showPopUp = false;
        this.showThankYouImage = false;
    }

    handleClick() {
        this.showThankYouImage = true;
        this.showPopUp = false;
    }

    handleCheckBoxChange() {
        console.log("checkbox checked")
    }
}