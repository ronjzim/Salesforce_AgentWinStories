import { LightningElement, track, wire, api } from "lwc";
import { getRecord, getRecordNotifyChange } from "lightning/uiRecordApi";
import { subscribe, unsubscribe, onError, setDebugFlag, isEmpEnabled } from "lightning/empApi";
import getActiveProgram from "@salesforce/apex/cxInCustomGuidanceCenterCls.getActiveProgram";
import getAllPrograms from "@salesforce/apex/cxInCustomGuidanceCenterCls.getAllPrograms";
import getSections from "@salesforce/apex/cxInCustomGuidanceCenterCls.getSections"
import activateProgram from "@salesforce/apex/cxInCustomGuidanceCenterCls.activateProgram";
import setExerciseAsComplete from "@salesforce/apex/cxInCustomGuidanceCenterCls.setExerciseAsComplete";
import resetProgress from "@salesforce/apex/cxInCustomGuidanceCenterCls.resetProgress";

export default class SidebarTest extends LightningElement {
  progId;
  @track progOutcomeList;
  @track allSectionsList;
  @track program;
  @track allPrograms = [];
  // @track isModalOpen = false;
  isLoading = true;
  videoEmbedURL;
  @track lesson=[];
  @track lessonName;
  @track lessonDescription;
  @track lessonRichText;
  @track videoName;
  @track videoDescription;
  @track video=[];
  isOpen = false;
  isExpanded = false;
  isShowAllPrograms = false;
  isShowLessonDetails = false;
  isLessonContent = false;
  @track milestoneCheck;
  @track allSections;
  @track programOutcome = [];
  //hidden feature vars
  clickTimer;
  clickTimerDelay = 200;
  clickPrevent = false;
  sectionsExpanded = true;
  @api outcomeType;
  @track milestoneOutcomeType;

  //CDC Config
  channelName = "/data/CGC_Milestone_and_Exercise__ChangeEvent";
  subscription = {};
  responseMessage;
  isDisplayMsg;

  connectedCallback() {
    //console.log("🚀 ~ connectedCallback ~ connectedCallback");
    //get program records
    this.getAllData();

    //CDC Init
    this.handleSubscribe();
    this.registerErrorListener();

    //Tampermonkey Events
    document.addEventListener("deRYGuidanceCenterEvent", this.receiveMessage);
    document.dispatchEvent(
      new CustomEvent("deRYIsCustomGuidanceCenterAvailable", {
        bubbles: true
      })
    );
    if (localStorage.getItem("isCustomGuidanceCenterOpenLWC") === "true") {
      try {
        this.isOpen = true;
        document.dispatchEvent(
          new CustomEvent("deRYHighlightTrailheadIcon", {
            detail: true,
            bubbles: true
          })
        );
        //console.log(">>> highlighting trailhead from LWC");
      } catch (err) {
        console.log("err : ", err);
      }
    }
  }

  disconnectedCallback() {
    document.removeEventListener("deRYGuidanceCenterEvent", this.receiveMessage);
    this.handleUnsubscribe();
    //console.log(">>> disconecting");
  }

  /******************** 
    CDC Methods Start 
    ********************/
  handleSubscribe() {
    const messageCallback = (response) => {
      //console.log("New message received: ", JSON.stringify(response));
      this.handleNotification(response);
    };

    subscribe(this.channelName, -1, messageCallback).then((response) => {
      //console.log("Subscription request sent to: ", JSON.stringify(response.channel));
      if (this.subscription) {
        this.handleUnsubscribe();
      }
      this.subscription = response;
      this.handleNotification(response);
    });
  }

  handleUnsubscribe() {
    unsubscribe(this.subscription, (response) => {
      console.log("unsubscribe() response: ", JSON.stringify(response));
    });
  }

  registerErrorListener() {
    onError((error) => {
      console.log("Received error from server: ", JSON.stringify(error));
    });
  }

  handleNotification(response) {
    if (response.hasOwnProperty("data")) {
      //console.log("CDC >>> ", response.data);
      this.getAllData();
    }
  }
  /******************** 
    CDC Methods End 
    ********************/

  getAllData() {
    console.log("Indide getalldata");
    getAllPrograms()
      .then((result) => {
        // console.log(">>> program apex data getAllProgram", result);
        try {
          this.allPrograms = result;
          this.error = undefined;
          console.log(">>>>>displaying all programs", this.allPrograms);
        } catch (error) {
          console.error('getAllData >>> ', getActiveProgram);
        }
      })
      .catch((error) => {
        console.log(">>> CGC program apex error getAllPrograms", error);
        this.error = error;
        this.allPrograms = undefined;
      })
      .finally(() => {
        this.isLoading = false;
      });
    this.callGetProgram();
  }

  selectProgram(evt) {
    this.isLoading = true;
    console.log("RecordID", evt.currentTarget.dataset.programid);
    activateProgram({
      recordId: evt.currentTarget.dataset.programid
    })

      .then((result) => {
        //console.log(">>> program apex data getProgram", result);
        this.callGetProgram();
        this.error = undefined;
      })
      .catch((error) => {
        console.log(">>> CGC program apex error selectProgram", error);
        this.error = error;
      });
  }

  callGetProgram() {
    console.log("Inside callgetprogram");
    getActiveProgram()
      .then((result) => {
        try {
          console.log(">>> program apex data getProgram", result);
          this.program = result;
          this.error = undefined;
          console.log("Active programs", this.program);
          this.progId = this.program[0].Id;
          console.log("prog id", this.progId);

          if(this.program[0].Milestone_Icon_Type__c === "Icon") {
            this.milestoneOutcomeType = true;
          } else {
            this.milestoneOutcomeType = false;
          }

          console.log("mile type", this.program[0].Milestone_Icon_Type__c);
          console.log("mile type val", this.milestoneOutcomeType);

          console.log("programmmmm>>>>>", this.program);

          this.callGetSections();
          if (this.isShowAllPrograms) {
            this.isShowAllPrograms = false;
          }
        } catch (error) {
          console.error('getActiveProgram >>> ', getActiveProgram);
        }
      })
      .catch((error) => {
        console.log(">>> CGC program apex error getProgram", error);
        if (error.body.message === "List has no rows for assignment to SObject") {
          this.isShowAllPrograms = true;
        }
        this.error = error;
        this.program = undefined;
      })
      .finally(() => {
        this.isLoading = false;
      });

  }
  callGetSections() {
    getSections({ progId: this.progId })
      .then((result) => {
        // console.log(">>> program apex data getAllProgram", result);
        try {
          this.allSections = result;
          this.error = undefined;
          // console.log(">>>>All Sections", this.allSections);
          this.progOutcomeList = this.allSections.progOutcomeList;
          this.allSectionsList = this.allSections.seclist;
          console.log("Sections List",this.allSectionsList);
          console.log("Program Outcome List",this.progOutcomeList);
         for(let i=0;i<this.allSectionsList.length;i++){
           for(let j=0;j<this.allSectionsList[i].Milestones_and_Exercises__r.length;j++){
             if(this.allSectionsList[i].Milestones_and_Exercises__r[j].Type__c==="Lesson"){
              this.lesson.push(this.allSectionsList[i].Milestones_and_Exercises__r[j]);
              // console.log("Lessons inside Exercise",JSON.parse(JSON.stringify(this.lesson)));
             }
               else if(this.allSectionsList[i].Milestones_and_Exercises__r[j].Type__c==="Video"){
               this.video.push(this.allSectionsList[i].Milestones_and_Exercises__r[j]);
              //  console.log("Videos inside Exercises",this.video);
             }
           
             }
           }
         }
        catch (error) {
          console.log("Get Sections Error", error);
        }
      })
      .catch((error) => {
        console.log(">>> CGC program apex error getAllPrograms", error);
        this.error = error;
        this.allSections = undefined;
      })
      .finally(() => {
        this.isLoading = false;
      });

  }


  handleExerciseClick(evt) {
    let { recid, type, url, iscomplete } = evt.currentTarget.dataset;

    console.log("------", evt.currentTarget.dataset);
    console.log("------", url);

    if (!url && type !== "Lesson") {
      return;
    }
    console.log(evt.currentTarget.dataset);
    if (type == "Video" || type == "Lesson") {
      this.isShowLessonDetails = true;
      this.isExpanded = true;
      if (type == "Lesson") {
        this.isLessonContent = true;
        for (let i = 0; i < this.lesson.length; i++) {
          if (recid === this.lesson[i].Id) {
            this.lessonName = this.lesson[i].Name__c;

            this.lessonDescription = this.lesson[i].Description__c;
            this.lessonRichText = this.lesson[i].Lesson_Description__c;
          }

        }

      } else if (type == "Video") {
        this.isLessonContent = false;
         for (let i = 0; i < this.video.length; i++) {
          if (recid === this.video[i].Id) {
            this.videoName = this.video[i].Name__c;
            console.log("Video Name",this.videoName);
            this.videoDescription = this.video[i].Description__c;
            console.log("Video Description",this.videoDescription);
          }

        }
        if (url.includes("youtube")) {
          this.videoEmbedURL = `https://www.youtube.com/embed/${this.parser_youtube(url)}`;
        } else if (url.includes("vidyard")) {
          this.videoEmbedURL = `https://play.vidyard.com/${this.parser_vidyard(
            url
          )}.html?autoplay=0&amp;custom_id=&amp;embed_button=0&amp;viral_sharing=0&amp;`;
        }
      }
    } else {
      window.open(url, "_blank");
    }

    if (iscomplete !== "true") {
      try {
        evt.currentTarget
          .closest(".thp-item-card__container")
          .querySelector("c-cx-in-custom-guidance-center-icon")
          .markComplete();

        setExerciseAsComplete({ recordId: recid })
          .then((result) => {
            //console.log(">>> update apex success", result);
            this.getAllData();
          })
          .catch((error) => {
            console.log(">>> update apex error", error);
          });
      } catch (error) {
        console.log("err,", error);
      }
    }
   
  }

  showAllPrograms() {
    this.isShowAllPrograms = true;
    this.isShowLessonDetails = false;
    this.isExpanded = false;
  }

  doSingleClick() {
    this.clickTimer = setTimeout(() => {
      if (!this.clickPrevent && this.isShowLessonDetails === true) {
        this.isShowLessonDetails = false;
        this.isExpanded = false;
      } else if (!this.clickPrevent) {
        this.isShowAllPrograms = true;
      }
      this.clickPrevent = false;
    }, this.clickTimerDelay);
  }

  doReset() {
    console.log("Inside doRest", this.progId);
    clearTimeout(this.clickTimer);

    this.clickPrevent = true;
    this.isLoading = true;
    resetProgress({
      programId: this.progId
    })
      .then((result) => {
        //console.log(">>> reset apex success", result);
        this.getAllData();

      })
      .catch((error) => {
        console.log(">>> reset apex error", error);
      });
  }

  goToApp() {
    let url = `https://${location.host}/lightning/app/c__Guidance_Center_Demo_Manager`;
    window.open(url, "_blank");
  }

  parser_youtube(url) {
    let regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    let match = url.match(regExp);
    return match && match[7].length == 11 ? match[7] : false;
  }

  parser_vidyard(url) {
    let regExp = /^https:\/\/[a-zA-Z]+\.vidyard.com\/watch\/([a-zA-Z0-9]+)\??$/i;
    let match = url.match(regExp);
    return match[1];
  }

  handleToggleClick(evt) {
    let curId = evt.currentTarget.dataset.id;
    console.log("curId>>>>>" + curId);
    this.template.querySelector("[data-toggle=" + curId + "]").classList.toggle("is-open");
  }

  toggleExpand(e) {
    if (this.sectionsExpanded) {
      this.template.querySelectorAll(".section-header").forEach((element) => {
        element.classList.remove("is-open");
      });
      this.sectionsExpanded = false;
      e.target.label = "Expand All";
    } else {
      this.template.querySelectorAll(".section-header").forEach((element) => {
        element.classList.add("is-open");
      });
      this.sectionsExpanded = true;
      e.target.label = "Collapse All";
    }
  }

  /******************** 
    Sidebar Methods Start 
    ********************/

  //Tampermonkey Event Handler
  receiveMessage = (event) => {
    //console.log("event", event.detail);
    try {
      this.isOpen = event.detail;
      localStorage.setItem("isCustomGuidanceCenterOpenLWC", event.detail.toString());
    } catch (err) {
      console.log("err : ", err);
    }
  };

  closeSidebar() {
    this.isOpen = false;
    localStorage.setItem("isCustomGuidanceCenterOpenLWC", false);
    document.dispatchEvent(
      new CustomEvent("deRYHighlightTrailheadIcon", {
        detail: false,
        bubbles: true
      })
    );
  }

  /******************** 
    Sidebar Methods End 
    ********************/

  get sidebarClass() {
    return `customGuidanceCenter wrapper slds-panel slds-grid slds-grid_vertical slds-is-fixed ${
      this.isExpanded ? "opened expanded" : this.isOpen ? "opened" : ""
      }`;
  }

  get showIllustation() {
    return !this.isLoading && !this.program && !this.allPrograms;
  }

  get headerTitle() {
    return this.isShowAllPrograms ? "Guidance Center" : this.program?.Name;
  }

  get isShowProgramDetails() {
    return this.program && (this.isShowAllPrograms === false && this.isShowLessonDetails === false);
  }

}