import { LightningElement, api, wire, track } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import spiffResources from '@salesforce/resourceUrl/SDO_Spiff_CommissionResources';
//import getSalesUserCommissions from '@salesforce/apex/CommissionManager.getSalesUserCommissions';
import { getRecord } from 'lightning/uiRecordApi';

const OPPORTUNITY_FIELDS = ["Opportunity.Amount", "Opportunity.IsWon", "Opportunity.IsClosed", "Opportunity.StageName"];

//Constant message type for data loading message
const DATA_LOADING_MESSAGE_TYPE = 'DATA_LOADING';


export default class UserCommissions extends NavigationMixin(LightningElement) {

    
    //-------------------------CUSTOM LABELS--------------------------------//
    
    customLabels = {
        dataLoadText : 'Loading',
        noAccessMessage : 'No Access',
        letsGetStartedMessage : `Let's get started`,
        noLineItemMessage : 'No Line Items',
        noPlansMessage : 'No Plan'
    }
    
    //-------------------------STATIC RESOURCES--------------------------------//
    
    spiffLogo = spiffResources+'/images/SpiffLogo.jpg'; //Spiff logo image
    leftDotImage = spiffResources+'/images/dot-left.png'; //background image of spiff message
    tennisImage = spiffResources+'/images/tennisLoad.gif'; //spiff loader image
    noLineItemImage = spiffResources+'/images/No_Line_Item_Background.png'; //No line item background image
    
    //-------------------------DESIGN VARIABLES--------------------------------//
    
    @api currency_code;
    @api plan_name;
    @api statement_period;
    @api days_left;

    @api breakdown_1_label;
    @api breakdown_1_percent;

    @api breakdown_2_label;
    @api breakdown_2_percent;

    @api current_commission;
    @api next_commission;
    
    @api quota;
    @api closed_quota;

    //-------------------------PUBLIC VARIABLES--------------------------------//
    
    
    //record id of current record
    @api recordId;

    //object Name of current record
    @api objectApiName;
    
    //switch to show the refresh button
    @api hideRefresh = false;
    
    //show initiator message
    @api loadInitiatorMessage = false;
    
    @api lastModifiedDate;
    
    @api record;

    @api quote;

    
    //-------------------------PRIVATE VARIABLES--------------------------------//
    
    @track commissionResponse;

    @track showAsOnHeader = false; //switch to show the data fetched as on date detail 
    @track messageType; // message type to be shown
    @track message ; //final message to be shown
    @track iframeURL; //iframe URL of SPIFF
    @track timeStamp; //datetime of latest fetched commission data
    @track horizontalBarData; //Horizontal bar data for Horizontal Stack Chart   
    @track currentObjectField; 
    //open close accordion
    @track open = true;

    //message switches
    @track showMessage = false;
    @track showLoader = false;
    @track showPageLoader = true;
    @track showMainBody = false;
    @track showVirtualBody = false;
    @track enableCommissionBreakdownLink = false;
    
    //-------------------------LIFECYCLE HOOKS--------------------------------//
    
    //This method is called when component is loaded
    async connectedCallback(){
		this.showMainBody = false;
		this.showPageLoader = true;
        await Promise.resolve();
        this.getCommission();
    }
    
    //-------------------------METHODS-------------------------------------------//
    
    @wire(getRecord, { recordId: '$recordId', fields: OPPORTUNITY_FIELDS })
    wiredRecord({ error, data }) {
        if (error) console.log('Spiff Error', error);

        //handle data 
        if (data) {
            this.record = data;
            this.getCommission();
        }
        else {
            console.log('No Access');
            //show message for no access
            this.showMessageContent(true, null, 'Unknown Exception');
            this.showAsOnHeader = false;
            
        }
    }

	loaded() {
		return !!this.record;
	}
    
    //Method to get commission with an opetion to force fetch latest commission data for Spiff
    getCommission() {
        if (!this.loaded()) return;
        
		this.showMainBody = false;
        this.showPageLoader = true;
        
        //Total length of bar
        let quota_percent = 80;
        let is_closed = this.record.fields.IsClosed.value;
        let is_won = this.record.fields.IsWon.value;
        let deal_amount = this.record.fields.Amount.value;

        let closed_percent = Math.min(Math.round((this.closed_quota / this.quota) * 100), 100);
        // Percentage of total quota the opportunity amount makes for
        let opportunity_quota_percent = Math.min(Math.ceil((deal_amount / this.quota) * 100), 100);
        
        // Rendered bar chart values skewed by quota percentage
        let rendered_closed_percent = Math.min(Math.round(closed_percent * (quota_percent/100)), 100);
        let rendered_if_closed_percent = Math.min(Math.round(opportunity_quota_percent * (quota_percent / 100)),100);
        
        let commission = Math.round(((Number(this.current_commission) / 100) * deal_amount) * 100) / 100;

        let total_remaining = this.quota - this.closed_quota;
        let total_closed = this.closed_quota + deal_amount;

        if (is_closed && is_won) {
            total_remaining -= deal_amount;
            total_closed += deal_amount;
        }

        if (!is_closed) {
            closed_percent += opportunity_quota_percent;
        }

        //show message for data loading
        this.showMessageContent(true,DATA_LOADING_MESSAGE_TYPE,this.customLabels.dataLoadText);
    

        this.commissionResponse = {
            statement_period: this.statement_period,
            days_left: this.days_left,
            plans: [
                {
                    id: 1,
                    name: this.plan_name,
                    currencyCode: this.currency_code,
                    planAmount: commission,
                    hasPlanAmount: true,
                    hasPlanException: false,
                    hasCurrentTier: true,
                    isLast: false,
                    hasNextTier: true,
                    quotaPercent: 90, // percentage of total bar quota will take up
                    achievedPercentage: closed_percent,
                    hasIfClosedPercent: true,
                    hasClosedPercent: is_closed && is_won,
                    quota: {
                        currency_code: 'USD',
                        sce_amount: this.quota,
                        sce_remaining_attainment_amount: total_remaining,
                        sce_current_tier_percent: this.current_commission,
                        sce_next_tier_percent: this.next_commission,
                        sce_year_to_date_attainment: total_closed
                    },
                    payout_rules: [
                        {
                            id: 1,
                            name: this.breakdown_1_label,
                            amount: Math.round(commission * this.breakdown_1_percent) / 100,
                            currency_code: 'USD'
                        },
                        {
                            id: 2,
                            name: this.breakdown_2_label,
                            amount: Math.round(commission * this.breakdown_2_percent) / 100,
                            currency_code: 'USD'
                        }
                    ],
                    horizontalBarData: {
                        quotaPercent: quota_percent,
                        closedQuotaPercent: rendered_closed_percent + rendered_if_closed_percent,
                        ifClosedQuotaPercent: rendered_closed_percent + rendered_if_closed_percent,
                        bandList: [],
                    }
                },
            ]
        }

        // set reference pointer
        let bandlist = this.commissionResponse.plans[0].horizontalBarData.bandList;
        if (!is_closed)
            bandlist.push(
                {
                    index: 0, 
                    label: 'Closed',
                    width: rendered_closed_percent,
                    color: '#3F47E9',
                    showLegend: true,
                    colorCSS: '#3F47E9',
                },
                {
                    index: 1,
                    label: 'If deal is closed',
                    width: rendered_if_closed_percent,
                    color: '#949AFF',
                    showLegend: true,
                    colorCSS: '#949AFF',
                },
                {
                    index: 2,
                    label: 'Remaining to close',
                    width: quota_percent - rendered_closed_percent - rendered_if_closed_percent,
                    color: '#FFD180',
                    showLegend: true,
                    colorCSS: '#FFD180',
                });
        else {
            bandlist.push(
                {
                    index: 0, 
                    label: 'Closed',
                    width: rendered_closed_percent + rendered_if_closed_percent,
                    color: '#3F47E9',
                    showLegend: true,
                    colorCSS: '#3F47E9',
                },
                {
                    index: 1,
                    label: 'Remaining to close',
                    width: quota_percent - rendered_closed_percent - rendered_if_closed_percent,
                    color: '#FFD180',
                    showLegend: true,
                    colorCSS: '#FFD180',
                })
        }

        setTimeout(() => {
            this.showMessageContent(false,null,null);
            this.showPageLoader = false;
            this.showMainBody = true;
            this.showVirtualBody = false;
         }, 2000)
    }
    
    //This method called to reload the component
    refresh(){
        //refresh the commission from SPIFF Server
        this.showMainBody = false;
        this.showPageLoader = true;
        this.getCommission();
    }
    
    //loads the component after initiator message
    loadCommission(){
        //refresh the commission from SPIFF Server
        this.loadInitiatorMessage = false;
        this.getCommission();
    }
    
    //This method handles the error and load messages
    showMessageContent(show,messageType,message){
        
        //if we need to show message
        if(show){
            
            this.showMessage = true;
            this.message = message;
            
            //incase it is dataload message
            if(messageType==DATA_LOADING_MESSAGE_TYPE){
                this.showLoader = true;
            }
            else{
                 this.showLoader = false;
            }
            
        }
        
        //if we need to hide message
        else{
            this.showMessage = false;
        }
    }
    
    //method used to open and close accordion
    changeState(){

        this.open = !this.open;
    }

    
    //-------------------------GETTERS AND SETTERS-------------------------------//
    
    //getter to calculate the days left in statement period
    get daysLeftMessage(){
        
        let daysDiff = 0;
        let daysLeftMessage = '';
        
        //if response from Spiff is valid and not null
        if(this.validResponse){
            
            daysDiff = Math.ceil((new Date(this.commissionResponse['statement_period']['end_date']) - new Date()) / (1000 * 60 * 60 * 24));
            
            if(daysDiff==1){
                daysLeftMessage = '1 day left in this period';
            }
            else if(daysDiff>1){
                daysLeftMessage = ''+daysDiff+' days left in this period';
            }
        
        }
        
        return daysLeftMessage;
    }
    
    get lastModifiedDateFormatted(){
        
        if(this.lastModifiedDate){
            return new Date(this.lastModifiedDate);
        }
        
        return null;
        
    }

}