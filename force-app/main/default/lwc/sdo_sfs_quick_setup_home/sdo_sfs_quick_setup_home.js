import { LightningElement,api } from 'lwc';
import {FlowNavigationNextEvent} from 'lightning/flowSupport';

export default class Sdo_sfs_quick_setup_home extends LightningElement {

    @api buttonCheck;
    @api title;
    @api description;
    @api buttonLabel1;
    @api cardIcon;

    proceedtoNext(event)
    {
        console.log('Clicked');
        this.buttonCheck=true;
       const nextNavigationEvent = new FlowNavigationNextEvent();
       this.dispatchEvent(nextNavigationEvent);

    }
}