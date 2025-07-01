import { LightningElement, api, wire } from 'lwc';
import {
    publish,
    MessageContext
   } from "lightning/messageService";
   
import cartChanged from "@salesforce/messageChannel/lightning__commerce_cartChanged";
import { FlowNavigationNextEvent } from 'lightning/flowSupport';

export default class FireCartChangedEvent extends LightningElement {
    @api availableActions = [];

    @wire(MessageContext)
    messageContext;

    connectedCallback() {
        publish(this.messageContext, cartChanged);
        console.log('Fire cartChanged Event');
        this.handleGoNext();
    }

    handleGoNext() {
        // check if NEXT is allowed on this screen
        if (this.availableActions.find(action => action === 'NEXT')) {
            // navigate to the next screen
            const navigateNextEvent = new FlowNavigationNextEvent();
            console.log('Go To next Screen');
            this.dispatchEvent(navigateNextEvent);
        }
    }

}