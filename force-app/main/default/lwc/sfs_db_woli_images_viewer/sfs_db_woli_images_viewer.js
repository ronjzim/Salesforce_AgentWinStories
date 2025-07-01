import { LightningElement,api } from 'lwc';
import getWoliFiles from '@salesforce/apex/SFS_DocBuilderMgr.getRelatedFilesByRecordId';
export default class Sfs_db_woli_images_viewer extends LightningElement {

    @api recordId;
    @api showImageDescription;
    showImages=true;
    filesList=[];

    connectedCallback() {
        this.retrieveWOLIFiles();
    }
    retrieveWOLIFiles()
    {
        getWoliFiles({ recordId: this.recordId })
          .then(result => {
            console.log('Result', result);
            this.filesList= Object.keys(result).map(item=>({"label":result[item],
             "value": item,
             "url":`/sfc/servlet.shepherd/document/download/${item}`
            }))
            console.log('FileList',this.filesList.length);
            if(this.filesList.length==0)
            {
              this.showImages=false;
            }
          })
          .catch(error => {
            console.error('Error:', error);
        });
    }

}