import {
  LightningElement,
  track,
  wire,
  api
} from "lwc";
import {
  NavigationMixin
} from "lightning/navigation";
import {
  getRecord
} from "lightning/uiRecordApi";
//import TIME_ZONE from "@salesforce/i18n/timeZone";
import getTaskList from "@salesforce/apex/SDO_Experience_RecordSnapshotCtrl.getTaskList";
import getCaseList from "@salesforce/apex/SDO_Experience_RecordSnapshotCtrl.getCaseList";
import getAssetList from "@salesforce/apex/SDO_Experience_RecordSnapshotCtrl.getAssetList";
import getLeadList from "@salesforce/apex/SDO_Experience_RecordSnapshotCtrl.getLeadList";
import getOppList from "@salesforce/apex/SDO_Experience_RecordSnapshotCtrl.getOppList";
import userId from "@salesforce/user/Id";
import name from "@salesforce/schema/User.Name";
import fname from "@salesforce/schema/User.FirstName";
import photo from "@salesforce/schema/User.FullPhotoUrl";

export default class sdo_Experience_RecordSnapshot extends NavigationMixin(
  LightningElement
) {
  @api displayimage;
  @api displayGreeting;
  @api backgroundColor;
  @api tasksOn = "true";
  @api casesOn = "true";
  @api prodsOn;
  @api leadsOn;
  @api oppsOn;
  @api userId;
  @track name;
  @track fname;
  @track photo;
  @track error;
  cases;
  tasks;
  opps;
  prods;
  leads;

  @wire(getRecord, {
    recordId: userId,
    fields: [name, photo, fname],
  })
  wireuser({
    error,
    data
  }) {
    if (error) {
      this.error = error;
    } else if (data) {
      this.name = data.fields.Name.value;
      this.fname = data.fields.FirstName.value;
      this.photo = "background-image: url(" + data.fields.FullPhotoUrl.value;
    }
  }

  @wire(getTaskList)
  wiredTasks({
    error,
    data
  }) {
    if (data) {
      this.tasks = data;
      this.error = undefined;
    } else if (error) {
      this.error = error;
      this.tasks = undefined;
    }
  }

  @wire(getCaseList)
  wiredCases({
    error,
    data
  }) {
    if (data) {
      this.cases = data;
      this.error = undefined;
    } else if (error) {
      this.error = error;
      this.cases = undefined;
    }
  }

  @wire(getAssetList)
  wiredAssets({
    error,
    data
  }) {
    if (data) {
      this.assets = data;
      this.error = undefined;
    } else if (error) {
      this.error = error;
      this.assets = undefined;
    }
  }

  @wire(getLeadList)
  wiredLeads({
    error,
    data
  }) {
    if (data) {
      this.leads = data;
      this.error = undefined;
    } else if (error) {
      this.error = error;
      this.leads = undefined;
    }
  }

  @wire(getOppList)
  wiredOpps({
    error,
    data
  }) {
    if (data) {
      this.opps = data;
      this.error = undefined;
    } else if (error) {
      this.error = error;
      this.opps = undefined;
    }
  }

  get greeting() {
    var d = new Date();
    let options = {
      hour12: false,
      hour: "2-digit",
    };
    let theHour = d.toLocaleTimeString("en-US", options);
    console.log("the Hour is", theHour);

    if (theHour >= 6 && theHour < 12) {
      return "Good Morning";
    }
    if (theHour >= 12 && theHour < 18) {
      return "Good Afternoon";
    }
    return "Good Evening";
  }

  get backColor() {
    return "background-color:" + this.backgroundColor;
  }

  get photoFlex() {
    if (this.displayimage === "Top") {
      return "height:11em;width:11em;margin-bottom:1em;" + this.photo;
    } else if (this.displayimage === "None") {
      this.imageMargin = "display:none;";
      return "display:none";
    }
    return this.photo;
  }

  get profileFlex() {
    if (this.displayimage !== "Left" && this.displayGreeting === true) {
      this.imageMargin = "";
      return "flex-direction: column; flex-wrap: nowrap;align-items: center;justify-content:center";
    } else if (this.displayimage === "None" && this.displayGreeting === false) {
      return "justify-content:center; min-width:inherit;";
    }
    this.imageMargin = "margin-right:1rem;";
    return "align-items:center;";
  }

  get textFlex() {
    if (this.displayimage !== "Left" && this.displayGreeting === true) {
      return "text-align: center;";
    } else if (this.displayGreeting === false) {
      return "display:none";
    }

    return "";
  }

  navigateToTasks() {
    this[NavigationMixin.Navigate]({
      type: "standard__objectPage",
      attributes: {
        objectApiName: "Task",
        actionName: "list",
      },
    });
  }

  navigateToCases() {
    this[NavigationMixin.Navigate]({
      type: "standard__objectPage",
      attributes: {
        objectApiName: "Case",
        actionName: "list",
      },
    });
  }

  navigateToLeads() {
    this[NavigationMixin.Navigate]({
      type: "standard__objectPage",
      attributes: {
        objectApiName: "Lead",
        actionName: "list",
      },
    });
  }

  navigateToOpps() {
    this[NavigationMixin.Navigate]({
      type: "standard__objectPage",
      attributes: {
        objectApiName: "Opportunity",
        actionName: "list",
      },
    });
  }
}