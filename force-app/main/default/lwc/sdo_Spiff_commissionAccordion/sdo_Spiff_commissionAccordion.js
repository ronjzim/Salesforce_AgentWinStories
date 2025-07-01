import { LightningElement, api,track } from 'lwc';

export default class CommissionAccordion extends LightningElement {

    //-------------------------PUBLIC VARIABLES--------------------------------//
    
    // commission provided by parent component
    @api commission; 

    //-------------------------PRIVATE VARIABLES--------------------------------//

    //open close accordion
    @track open = false;

    //Flag to restrict the rendered callback to run once.
    @track isRendered = false; 

    //-------------------------LIFECYCLE HOOKS--------------------------------//

    //This method is called when component is rendered
    renderedCallback() {
        if(!this.isRendered){
            if(this.commission.isFirst){
                this.open = true;
            }
            this.isRendered = true;
        }
    }

    //-------------------------METHODS-------------------------------------------//

    //method used to open and close accordion
    changeState(){

        this.open = !this.open;
    }

}