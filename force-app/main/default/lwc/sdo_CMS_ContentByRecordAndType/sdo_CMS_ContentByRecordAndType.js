import { LightningElement, wire, api } from 'lwc';
import basePath from '@salesforce/community/basePath';
import getCMSContent from '@salesforce/apex/SDO_Experience_ManagedContentController.getCMSContent';

export default class sdo_CMS_ContentByRecordAndType extends LightningElement {

    // Params from config
    @api recordId;
    @api contentType;
    @api numberContentItems;
    @api pathAttribute;
    @api titleAttribute;
    @api bodyAttribute;
    @api imageAttribute;
    @api imageHeight;
    @api imagePosition;
    @api linkAttribute;
    @api contentDisplayStyle;
    @api gridColumns;

    // Params from parent
    @api topicMode = false;

    //Params for content manipulation
    content;
    contentArray;
    items;
    attributesCollected = new Set();
    error;
    isCardDisplayStyle = false;
    isGalleryDisplayStyle = false;

    //Fetch CMS content
    @wire(getCMSContent, { recordId: '$recordId', numItems: '$numberContentItems', managedContentType: '$contentType', singleTopicMode: '$topicMode' })
    wiredContent({ error, data }) {
        if (data) {
            this.cleanUpForDisplay(data);

        } else if (error) {

            //Grab error
            this.error = 'Unknown error';
            this.content = undefined;
            if (Array.isArray(error.body)) {
                this.error = error.body.map(e => e.message).join(', ');
            } else if (typeof error.body.message === 'string') {
                this.error = error.body.message;
            }
            console.log("CMS Component Debug || Error" + error);

        }
    }

    //Private function to do all the data massaging
    cleanUpForDisplay(data) {

        if (this.contentDisplayStyle == 'Grid') {
            this.isCardDisplayStyle = true;
        } else {
            this.isGalleryDisplayStyle = true;
        }

        //Grab data
        this.contentArray = data;
        this.content = JSON.stringify(this.contentArray);
        let sitePath = basePath.slice(0, -2); // remove the ending /s from basePath

        //Temporarily hold items
        let itemsToTweak = [];

        //Make desired item tweaks based on config
        for (let item of this.contentArray.items) {

            //Clone the original item object json
            let itemToAdd = JSON.parse(JSON.stringify(item));

            //Parse nodes and adjust accordingly
            for (let [nodeName, node] of Object.entries(itemToAdd.contentNodes)) {

                //Collect attribute
                this.attributesCollected.add(nodeName);

                //HTML Decode Rich Text
                //console.log("CMS Component Debug || Checking if " + nodeName + " of type " + node.nodeType + " needs to be decoded.");
                if (node.nodeType == 'RichText') {
                    //Encode
                    node.value = this.htmlDecode(node.value);
                }

                //Adjust image URLs if it's not a fully-qualified URL
                //console.log("CMS Component Debug || Checking if " + nodeName + " of type " + node.nodeType + " needs to have its URL adjusted.");
                if (node.nodeType == 'Media' && node.url.substring(0, 4) != 'http') {
                    // node.url = '/sfsites/c' + node.url;
                    node.url = sitePath + node.url;
                }
            }

            //Adjust item based on config
            let emptyVal = { "value" : "" };
            let emptyImgVal = { "url": "" };


            // Set Title --> {item.contentNodes.title.value}
            if (this.titleAttribute) {
               itemToAdd.contentNodes.title = itemToAdd["contentNodes"][this.titleAttribute] ? itemToAdd["contentNodes"][this.titleAttribute] : emptyVal;
             }

            // Set Body --> {item.contentNodes.excerpt.value}
            if (this.bodyAttribute) {
                itemToAdd.contentNodes.excerpt = itemToAdd["contentNodes"][this.bodyAttribute] ? itemToAdd["contentNodes"][this.bodyAttribute] : emptyVal;
            }

            if (this.imageAttribute) {
                itemToAdd.contentNodes.bannerImage = itemToAdd["contentNodes"][this.imageAttribute] ? itemToAdd["contentNodes"][this.imageAttribute] : emptyImgVal;
            }

            // Set URL --> item.contentUrlName
            if (this.pathAttribute && itemToAdd.contentUrlName) {
                itemToAdd.contentUrlName = basePath + '/' + this.pathAttribute + '/' + itemToAdd.contentKey;
            }

            //Add to array
            itemsToTweak.push(itemToAdd);
        }

        //Assign items
        this.items = itemsToTweak;
    }

    //Private function to decode HTML
    htmlDecode(input) {
        var doc = new DOMParser().parseFromString(input, "text/html");
        return doc.documentElement.textContent;
    }

    //Private functions to set up scrolling for the gallery view
    slideRight() {
        let currentAmount = this.template.querySelector('.cms-gallery-block').scrollLeft;
        let cardWidth = this.template.querySelector('.cms-gallery-block').scrollWidth;
        let cardCount = this.items.length;
        let moveToVal = currentAmount + (cardWidth / cardCount);
        console.log("CMS Component Debug || Looking at moving across " + cardCount + " cards with a total width of " + cardWidth) ;
        this.slide(moveToVal);
    }
    slideLeft() {
        let currentAmount = this.template.querySelector('.cms-gallery-block').scrollLeft;
        let cardWidth = this.template.querySelector('.cms-gallery-block').scrollWidth;
        let cardCount = this.items.length;
        let moveToVal = currentAmount - (cardWidth / cardCount);
        console.log("CMS Component Debug || Looking at moving across " + cardCount + " cards with a total width of " + cardWidth) ;
        this.slide(moveToVal);

    }
    slide(val) {
        let currentAmount = this.template.querySelector('.cms-gallery-block').scrollLeft;
        console.log("CMS Component Debug || Scrolling to: " + val + " from " + currentAmount);

        this.template.querySelector('.cms-gallery-block').scrollLeft = val;
        /* this.template.querySelector('.cms-gallery-block').animate([
            { scrollLeft: currentAmount },
            { scrollLeft: val }
          ], {
            // timing options
            duration: 0,
            iterations: 2
          });
        */

    }

    get gridSize(){
        if(this.gridColumns === "1"){
            return "grid-template-columns: repeat(1, 1fr)";
        }

        return "grid-template-columns: repeat(2, 1fr)";
    }

    get imageStyle(){
        return "height:" + this.imageHeight + ";object-position:" + this.imagePosition;
    }

}