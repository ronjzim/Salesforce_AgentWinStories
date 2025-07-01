import { LightningElement, api} from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import getContentArticle from '@salesforce/apex/SDO_CMS_RetrieveSingleArticle.getContentArticle';


export default class SDO_CMS_SingleComponent extends NavigationMixin(LightningElement) {
    @api articleToDisplay;
    @api cssHeightOverride;
    @api recordId;
    @api imageAlignment;
    @api useOnlyImage;
    @api useOnlyText;
    @api contentSource;
    @api useButton;
    @api TextOverLay;
    @api buttonLabel;
         fetchedArtcle=[];
         previewContent=false;
         standardView=true;


connectedCallback(){
    // launches the apex method to retrieve the article. 
        this.getArticle();
    }


renderedCallback(){
    // launches the CSS Variable initiation for the rendered call back. 
        this.initCSSVariables();
    }


    // launches the get content article apex class for the connected call back
getArticle(){
    getContentArticle({externalId: this.articleToDisplay, sfRecordId: this.recordId})
        .then((result)=>{
            this.fetchedArtcle = JSON.parse(JSON.stringify(result));
            if(this.contentSource === 'Preview Content'){
                    this.previewContent = true;
            }
        })
    }

    // initCSSvariables is a function that dynamically updates the CSS height for the .img img div class
    // this function runs on rendered callback
initCSSVariables() {
        var css = document.body.style;
        if(this.cssHeightOverride === 'auto'){
            css.setProperty('--modalHeight', this.cssHeightOverride);
        } else if(this.cssHeightOverride == null){
            css.setProperty('--modalHeight', 'auto');
        } else {
            css.setProperty('--modalHeight', this.cssHeightOverride +'px');
        }
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