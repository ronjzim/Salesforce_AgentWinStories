import { LightningElement, api } from 'lwc';
import {nanoId} from 'c/xdoToolCommonJs'
import XdoToolTrackingEventHandlerBase from 'c/xdoToolTrackingEventHandlerBase';

export default class Sdo_Experience_EventTracking extends XdoToolTrackingEventHandlerBase {
    @api experienceSite;

    COMPONENT_NAME = 'SdoExperienceEventTracking';
    HANDLER_REGISTRATION_DELAY = 100;
    VERSION = 'v1';
    NANOID = nanoId();

    componentName;
    hasRendered = false;

    connectedCallback() {
        this.componentName = this.COMPONENT_NAME;
        super.connectedCallback();
        
        // Existing code...
    }

    renderedCallback() {
        // Existing code...
        
        if (!this.hasRendered) {
            window.setTimeout(this.registerTrackingHandlers.bind(this), this.HANDLER_REGISTRATION_DELAY);
            this.hasRendered = true;
        }
    }
}