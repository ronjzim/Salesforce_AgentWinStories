import getArticlesFromCollection from '@salesforce/apex/SDO_CMS_RetrieveSingleArticle.getArticlesFromCollection';
import { LightningElement, api} from 'lwc';
import { NavigationMixin } from 'lightning/navigation';

export default class Sdo_CMS_CollectionComponent extends  NavigationMixin(LightningElement) {
    @api collectionToDisplay;
    @api useOnlyImage;
    @api useOnlyText;
    @api contentSource;
    @api useButton;
    @api buttonLabel;
         fetchedArtcle=[];
         imageURL="";
         contentBlock;
         recordPageUrl;
         previewContent=false;

connectedCallback(){
        // launches the apex method to retrieve the articles from the collection.  
        this.getArticle();
        }


        // launches the get content article apex class for the connected call back
getArticle(){
    getArticlesFromCollection({externalId: this.collectionToDisplay})
            .then((result)=>{
                this.fetchedArtcle = JSON.parse(JSON.stringify(result));
                if(this.contentSource === 'Preview Content'){
                    this.previewContent = true;
                }
            })
        }


handleButtonClick(event){
        const articleId =  event.target.dataset.key
          // Generate a URL to a content record page
          this[NavigationMixin.GenerateUrl]({
            type: 'standard__recordPage',
            attributes: {
                name:'Content_Article_Detail__c',
                recordId: articleId,
                objectApiName:'SDO_Experience_ContentArticle__c',
                actionName: 'view',
            },
                }).then((url) => {
                    window.location.href = url
                });
        }
    }