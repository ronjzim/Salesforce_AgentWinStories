import { LightningElement, api } from 'lwc';

export default class sdo_CMS_ContentByTopicAndType extends LightningElement {

    // Params from config
    @api topicId;
    @api contentType;
    @api inBuilder;
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

    //Params for content
    topicMode = true;

}