import { LightningElement,api } from 'lwc';
export default class Sfs_db_workstep_viewer extends LightningElement {

@api woStep={};
iconName='utility:success';
iconVariant='success';

connectedCallback() 
{
   if(this.woStep.Status!='Completed')
   {
        this.iconName='utility:warning';
        this.iconVariant='warning';
   }
}


}