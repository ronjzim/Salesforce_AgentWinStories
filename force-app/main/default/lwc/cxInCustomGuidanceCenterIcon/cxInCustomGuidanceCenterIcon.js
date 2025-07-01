import { LightningElement, api } from "lwc";
export default class CxInCustomGuidanceCenterIcon extends LightningElement {
  @api iconName;
  @api isComplete;

  @api markComplete() {
    this.isComplete = true;
  }

  get isVideo() {
    return this.iconName == "Video";
  }
   get isLesson() {
    return this.iconName == "Lesson";
  }
  get isDocument() {
    return this.iconName == "Document";
  }
  get isLink() {
    return this.iconName == "Link";
  }
  get isAudioRecording() {
    return this.iconName == "Audio Recording";
  }
  get isScheduledEvent() {
    return this.iconName == "Scheduled Event";
  }
  get isTrailhead() {
    return this.iconName == "Trailhead";
  }

  get isProgramOutcome() {
    return this.iconName == "programOutcome";
  }
  
  get isMilestone() {
    return this.iconName == "milestone";
  }

  connectedCallback() {
    console.log("Icon names",this.iconName);
  }
}