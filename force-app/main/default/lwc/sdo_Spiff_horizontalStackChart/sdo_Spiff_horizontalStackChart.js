import { LightningElement, api, track } from 'lwc';
import { capatilizeFirstOfEachWord } from 'c/sdo_Spiff_generalHelper';

export default class HorizontalStackChart extends LightningElement {

    //-------------------------PUBLIC VARIABLES--------------------------------//

    @api mainBarLength; //To calculate the main bar length for horizontal stack chart graph

    @api commission; //To get the commission plans from the parent component

    @api label = {
        quotaLabel:'Quota'    
    }; // To get the custom label for quota

    @api showComponent=false;

    //-------------------------PRIVATE VARIABLES--------------------------------//

    @track anotherWordForQuota; //To store the another word for Quota with capitalized first letter
    
    @track isRendered = false; //Flag to restrict the rendered callback to run once.

    //-------------------------LIFECYCLE HOOKS--------------------------------//

    //This method will be called when the component is loading
    connectedCallback(){
        window.addEventListener('resize', this.handleResize.bind(this));
    }

    //This method is called when component is rendered
    renderedCallback() {
        if(!this.isRendered){
            this.pageLayoutChanged();
            this.isRendered = true;
            this.anotherWordForQuota = capatilizeFirstOfEachWord(this.label.quotaLabel);
        }
    }

    //-------------------------GETTERS & SETTERS--------------------------------//
    
    //gets the band data and sets the sections of band with appropriate width
    get bandDataList(){
        //if band data is not empty, set the appropriate width of band items
            if(this.horizontalBarData.bandList && this.horizontalBarData.bandList.length>0){
                return this.horizontalBarData.bandList.map((band)=>{
                    return {...band,
                        ...{widthCSS : 'width : '+ ((this.mainBarLength * band['width'])/100) + 'px'},
                        ...{styleCSS : 'background : '+band['color']},
                        ...{colorCSS : 'background : '+band['color']}
                    };
                });
            }
    }

    pageLayoutChanged(){
        let container = this.template.querySelector(`[data-id="bandList"]`);
        if(container!=null){
            this.mainBarLength = container.offsetWidth;
        }
        
    }

    //This method is used to set the mainbar length based on the container offset.
    handleResize(){
        let container = this.template.querySelector(`[data-id="bandList"]`);
        if(container!=null){
            this.mainBarLength = container.offsetWidth;
        }
    }

    get horizontalBarData(){
        return this.commission.horizontalBarData;
    }

    get seperatorCSS(){
        return 'left : '+ (this.horizontalBarData.quotaPercent) + '%';
    }

    get closedSeperatorCSS(){
        return 'left : '+ (this.horizontalBarData.closedQuotaPercent) + '%';
    }

    get ifClosedSeperatorCSS(){
        return 'left : '+ (this.horizontalBarData.ifClosedQuotaPercent) + '%';
    }

    get closedSeperatorTextCSS(){
        let left = (this.horizontalBarData.closedQuotaPercent + 0.7);

        return 'left : '+ left + '%';
    }

    get ifClosedSeperatorTextCSS(){
        let left = (this.horizontalBarData.ifClosedQuotaPercent + 0.7);

        return 'left : '+ left + '%';
    }

    get quotaBarCSS(){

        //get the left most pixel
        let right = this.horizontalBarData.ifClosedQuotaPercent ;

        return 'width : '+ right + '%';

    }

    get nextTierCSS(){

        //get the left most pixel
        let ifClosed = this.horizontalBarData.ifClosedQuotaPercent ;

        return 'width : '+ ifClosed + '%;background : #7079fe';

    }

    get bandWindowCSS(){

        //get the left most pixel
        let width = this.mainBarLength ;

        return 'width : '+ width + 'px';

    }
    
}