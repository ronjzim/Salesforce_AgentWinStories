import { LightningElement, track, api } from "lwc";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import getAllConfigurations from "@salesforce/apex/DE_RY_Spotter.getAllConfigurations";
import createConfigRecord from "@salesforce/apex/DE_RY_Spotter.createConfigRecord";
import getConfig from "@salesforce/apex/DE_RY_Spotter.getConfig";
import saveHotspots from "@salesforce/apex/DE_RY_Spotter.saveHotspots";
import deleteRecord from "@salesforce/apex/DE_RY_Spotter.deleteRecord";
import changeImage from "@salesforce/apex/DE_RY_Spotter.changeImage";

export default class SpotterConfig extends LightningElement {
  @api recordId;

  @track configList = [];
  @track filteredConfigList = [];
  @track filterSearchTerm;
  @track currentConfig = {};
  @track hotspots = [];
  @track loading = true;
  @track showEmptyHotspotError = false;
  @track hotspotsToDelete = [];

  showChangeFileUpload = false;
  toast_title_success = "Success!";
  toast_variant_success = "success";
  toast_title_error = "Uh Oh! An error occured";
  toast_variant_error = "error";
  isModalOpen = false;
  modalHeader = "";
  modalContent = "";
  modalActionLabel = "";
  styleString;
  curDeletingSpotIdx;
  curDeletingConfigId;
  //pos1 = 0;
  //pos2 = 0;
  posX = 0;
  posY = 0;
  diffX;
  diffY;
  dragElement;

  handleImageClick(event) {
    try {
      let dot_count = this.template.querySelectorAll(".lg-hotspot").length;
      let currentImage = event.currentTarget;
      ////console.log(currentImage);

      ////console.log("currentImage.offsetTop", currentImage.offsetTop);

      let top_offset = currentImage.y - window.pageYOffset;
      let left_offset = currentImage.x - window.pageXOffset;
      ////console.log(top_offset, left_offset);

      let top_px = Math.round(event.clientY - top_offset);
      let left_px = Math.round(event.clientX - left_offset);
      ////console.log(top_px, left_px);

      let top_perc = (top_px / currentImage.height) * 100;
      let left_perc = (left_px / currentImage.width) * 100;

      ////console.log("Top: " + top_px + "px = " + top_perc + "%");
      ////console.log("Left: " + left_px + "px = " + left_perc + "%");
      ////console.log("Left: " + left_perc + "%; Top: " + top_perc + "%;");
      let styleString = "Left: " + left_perc + "%; Top: " + top_perc + "%;";
      this.hotspots.push({ Style_CSS__c: styleString });
      /* //console.log(
        "this.hotspots",
        this.hotspots,
        "this.hotspots.length",
        this.hotspots.length
      ); */
      //this.expandSection(this.hotspots.length - 1);
    } catch (err) {
      //console.log(err);
    }
  }

  dragMouseDown(event) {
    ////console.log("dragMouseDown");
    event.preventDefault();
    ////console.log("dragMouseDown eventdefaule");
    this.posX = event.clientX;
    this.posY = event.clientY;
    ////console.log("posX", this.posX, "posY", this.posY);
    this.dragElement = event.currentTarget;
    this.diffX = this.posX - event.currentTarget.offsetLeft;
    this.diffY = this.posY - event.currentTarget.offsetTop;
    document.onmouseup = this.closeDragElement.bind(this);
    document.onmousemove = this.elementDrag.bind(this);
  }

  elementDrag(event) {
    try {
      //console.log("elementDrag");
      event.preventDefault();
      let container = this.template.querySelector(".lg-container");
      let container_width = container.offsetWidth;
      let container_height = container.offsetHeight;
      let elmnt = this.dragElement;
      let elmnt_width = elmnt.offsetWidth;
      let elmnt_height = elmnt.offsetHeight;

      this.posX = event.clientX;
      this.posY = event.clientY;

      ////console.log("this.dragElement", this.pos2);
      let newPos_X = this.posX - this.diffX;
      let newPos_Y = this.posY - this.diffY;

      ////console.log({ newPos_X, newPos_Y });

      if (newPos_X < 0) newPos_X = 0;
      if (newPos_Y < 0) newPos_Y = 0;
      if (newPos_X + elmnt_width > container_width)
        newPos_X = container_width - elmnt_width;
      if (newPos_Y + elmnt_height > container_height)
        newPos_Y = container_height - elmnt_height;

      elmnt.style.top = newPos_Y + "px";
      elmnt.style.left = newPos_X + "px";
    } catch (error) {
      console.log(error);
    }
  }

  closeDragElement() {
    //console.log("closeDragElement");
    document.onmouseup = null;
    document.onmousemove = null;
    if (this.dragElement.style.top.endsWith("px")) {
      let container = this.template.querySelector(".lg-container");
      let new_left_perc =
        parseInt(this.dragElement.style.left) / (container.offsetWidth / 100);
      let new_top_perc =
        parseInt(this.dragElement.style.top) / (container.offsetHeight / 100);
      //console.log(JSON.stringify(this.hotspots));
      //console.log("new_left_perc", new_left_perc, "new_top_perc", new_top_perc);
      this.dragElement.style.top = `${new_top_perc}%`;
      this.dragElement.style.left = `${new_left_perc}%`;
      this.hotspots[
        this.dragElement.dataset.idx
      ].Style_CSS__c = this.createStyleString(new_left_perc, new_top_perc);
      console.log(JSON.stringify(this.hotspots));
    }
  }

  handleHotspotClicked(event) {
    //console.log("hotspot clicked");
    let idx = event.currentTarget.dataset.idx;
    this.highlightHotspot(idx);
    this.expandSection(idx);
  }

  createStyleString(left, top) {
    return `Left: ${left}%; Top: ${top}%;`;
  }

  connectedCallback() {
    this.getConfigurationsList();
  }

  getConfigurationsList() {
    this.loading = true;
    getAllConfigurations()
      .then((response) => {
        this.configList = response;
        if (!this.filterSearchTerm) this.filteredConfigList = response;
        ////console.log("this.filteredConfigList", this.filteredConfigList);
      })
      .catch((error) => {
        //console.log("errorgettingconfig", error);
        this.toastIt(
          this.toast_title_error,
          error.body.message,
          this.toast_variant_error
        );
      })
      .finally(() => {
        this.loading = false;
      });
  }

  filterConfigList(event) {
    ////console.log(event.target.value);
    this.filterSearchTerm = event.target.value;
    this.filteredConfigList = this.configList.filter((config) =>
      config.Name.toLowerCase().includes(event.target.value)
    );
  }

  handleConfigSelect(event) {
    const configId = event.detail.name;
    if (configId && configId != this.currentConfig.Id) {
      //this.currentConfig.Image_URL__c = null;
      this.handleCancelConfig();
      this.loading = true;
      //console.log("handleConfigSelect", configId);
      getConfig({ configId })
        .then((response) => {
          this.currentConfig = response;
          this.hotspots = response.Spotter_Hotspots__r || [];
        })
        .catch((error) => {
          //console.log("error getting config Record ", error);
          this.toastIt(
            this.toast_title_error,
            error.body.message,
            this.toast_variant_error
          );
        })
        .finally(() => {
          this.loading = false;
        });
    }
  }

  handleUploadFinished(event) {
    this.loading = true;
    // Get the list of uploaded files
    const uploadedFiles = event.detail.files;
    ////console.log("No. of files uploaded : " + uploadedFiles.length);
    ////console.log("uploaded file detail", event.detail.files);
    createConfigRecord(event.detail.files[0])
      .then((response) => {
        //console.log("configRecord Created Successfully", response);
        this.currentConfig = response;
        this.getConfigurationsList();
        this.toastIt(
          this.toast_title_success,
          "The image was uploaded and a configuration was created successfully",
          this.toast_variant_success
        );
      })
      .catch((error) => {
        //console.log("error creating config Record ", error);
        this.toastIt(
          this.toast_title_error,
          error.body.message,
          this.toast_variant_error
        );
      })
      .finally(() => {
        this.loading = false;
      });
  }

  handleProductSelect(event) {
    let hotspotIdx = event.target.dataset.idx;
    let selectedProductId = event.detail.value[0];
    //console.log("Product Selected IDX", hotspotIdx);
    //console.log("Product Id", selectedProductId);
    this.hotspots[hotspotIdx].Product__c = selectedProductId;
    //console.log(this.hotspots);
  }

  handleChangeImage() {
    this.showChangeFileUpload = true;
  }

  handleConfigNameChange(event) {
    this.currentConfig.Name = event.target.value.trim();
  }

  handleConfigTitleChange(event) {
    this.currentConfig.Title__c = event.target.value.trim();
  }

  handleNewImageUploadFinished(event) {
    this.loading = true;
    const uploadedFileId = event.detail.files[0].documentId;
    changeImage({ configId: this.currentConfig.Id, documentId: uploadedFileId })
      .then((result) => {
        this.currentConfig.Image_URL__c = result;
        this.showChangeFileUpload = false;
        this.toastIt(
          this.toast_title_success,
          "The new image was saved successfully",
          this.toast_variant_success
        );
      })
      .catch((error) => {
        //console.log("error changing image", error);
        this.toastIt(
          this.toast_title_error,
          error.body.message,
          this.toast_variant_error
        );
      })
      .finally(() => {
        this.loading = false;
      });
  }

  handleCancelConfig() {
    ////console.log("cancelling config");
    this.currentConfig = {};
    this.hotspots = [];
    this.hotspotsToDelete = [];
    this.showEmptyHotspotError = false;
    this.showChangeFileUpload = false;
  }

  handleSaveConfig() {
    let isFormValid = this.isdetailAndTitleValid();
    if (isFormValid && !this.hotspotsWithNoProduct) {
      this.loading = true;
      let sanitisedHotspots = this.getSanitisedHotspots();
      //console.log("save Called", JSON.stringify(sanitisedHotspots));
      saveHotspots({
        configRec: this.currentConfig,
        hotspots: sanitisedHotspots,
        hotspotsToDelete: this.hotspotsToDelete
      })
        .then((result) => {
          //console.log("hotspots Saved Successfully", result);
          this.hotspots = result;
          this.toastIt(
            this.toast_title_success,
            "The configuration was saved successfully",
            this.toast_variant_success
          );
          this.getConfigurationsList();
          this.showEmptyHotspotError = false;
          this.showChangeFileUpload = false;
          this.hotspotsToDelete = [];
        })
        .catch((error) => {
          //console.log("error saving hotspot Records", error);
          this.toastIt(
            this.toast_title_error,
            error.body.message,
            this.toast_variant_error
          );
        })
        .finally(() => {
          this.loading = false;
        });
    } else if (this.hotspotsWithNoProduct) {
      this.showEmptyHotspotError = true;
      this.scrollDetailCardToTop();
    }
  }

  isdetailAndTitleValid() {
    let configNameField = this.template.querySelector(".configNameField");
    let configTitleField = this.template.querySelector(".configTitleField");
    let isNameFieldValid = configNameField.checkValidity();
    let isTitleFiedlValid = configTitleField.checkValidity();
    let areBothValid = isNameFieldValid && isTitleFiedlValid;

    if (!areBothValid) {
      this.scrollDetailCardToTop();
    }
    if (!isNameFieldValid) {
      configNameField.reportValidity();
    }
    if (!isTitleFiedlValid) {
      configTitleField.reportValidity();
    }
    return isNameFieldValid && isTitleFiedlValid;
  }

  scrollDetailCardToTop() {
    this.template.querySelector(".detailCard").scrollTop = 0;
  }

  getSanitisedHotspots() {
    let allHotspots = this.template.querySelectorAll(".lg-hotspot");
    allHotspots.forEach((spot) => {
      let currentHotspot = this.hotspots[spot.dataset.idx];
      currentHotspot.Style_CSS__c = `Left: ${spot.style.left}; Top: ${spot.style.top};`;
      currentHotspot.Spotter_Configuration__c = this.currentConfig.Id;
    });
    return this.hotspots;
  }

  handleDeleteHotspot(event) {
    this.curDeletingSpotIdx = event.target.dataset.idx;
    //console.log("delete hotspot called pos", this.curDeletingSpotIdx);

    this.launchConfirm(
      "Delete Hotspot",
      "Are you sure you want to delete this hotspot?",
      "Delete"
    );
  }

  handleDeleteConfig() {
    //console.log("delete config called");
    this.launchConfirm(
      "Delete Spotter Configuration",
      "Are you sure you want to delete this spotter configuration?",
      "Delete"
    );
  }

  launchConfirm(header, content, actionLabel) {
    this.modalHeader = header;
    this.modalContent = content;
    this.modalActionLabel = actionLabel;
    this.showModal();
  }

  showModal() {
    this.isModalOpen = true;
  }

  handleModalConfirm() {
    if (this.modalHeader == "Delete Hotspot") {
      let hotspotRec = this.hotspots[this.curDeletingSpotIdx];
      this.removeHotspotFromList(this.curDeletingSpotIdx);
      if (hotspotRec.hasOwnProperty("Id")) {
        this.hotspotsToDelete.push(hotspotRec);
      }
    } else if (this.modalHeader == "Delete Spotter Configuration") {
      this.deleteRecFromDB(this.currentConfig.Id);
    }
    this.isModalOpen = false;
  }

  deleteRecFromDB(recordId) {
    this.loading = true;
    //console.log("deleting from db");
    deleteRecord({ recordId })
      .then((result) => {
        if (result) {
          if (this.modalHeader == "Delete Hotspot") {
            this.removeHotspotFromList(this.curDeletingSpotIdx);
          } else if (this.modalHeader == "Delete Spotter Configuration") {
            this.toastIt(
              "Success!",
              "The configuration has been deleted successfully.",
              "success"
            );
            this.getConfigurationsList();
            this.handleCancelConfig();
          }
        }
      })
      .catch((error) => {
        //console.log("error deleting config", error);
        this.toastIt(
          this.toast_title_error,
          error.body.message,
          this.toast_variant_error
        );
      })
      .finally(() => {
        this.resetDeleteData();
        this.loading = false;
      });
  }

  removeHotspotFromList(idx) {
    if (idx) {
      //console.log("removing Hotspot From List with IDX", idx);
      this.hotspots.splice(idx, 1);
      this.toastIt(
        "Success!",
        "The hotspot has been deleted successfully.",
        "success"
      );
    }
  }

  closeModal(doReset) {
    this.isModalOpen = false;
    this.resetDeleteData();
  }

  /* toggleModal() {
    this.isModalOpen = !this.isModalOpen;
  } */

  handleSectionClick(event) {
    //console.log("section clicked");
    let idx = event.currentTarget.dataset.idx;
    this.highlightHotspot(idx);
    this.expandSection(idx, false);
  }

  highlightHotspot(idx) {
    //console.log("highlighting hotspot", idx);
    let hotspotElem = this.template.querySelector(
      `.lg-hotspot[data-idx="${idx}"]`
    );
    if (!hotspotElem.classList.contains("lg-hotspot-active")) {
      let allHotspots = this.template.querySelectorAll(".lg-hotspot");
      allHotspots.forEach((spot) => {
        spot.classList.remove("lg-hotspot-active");
      });
      hotspotElem.classList.add("lg-hotspot-active");
    }
  }

  expandSection(idx, doScroll = true) {
    //console.log(this.template.querySelectorAll(".hotspot-section"));
    //console.log("expand section", idx);
    let sectionElem = this.template.querySelector(
      `.hotspot-section[data-idx="${idx}"]`
    );
    if (!sectionElem.classList.contains("slds-is-open")) {
      let allSections = this.template.querySelectorAll(".hotspot-section");
      allSections.forEach((section) => {
        section.classList.remove("slds-is-open");
      });
      sectionElem.classList.add("slds-is-open");
      if (doScroll) {
        sectionElem.scrollIntoView({ behavior: "smooth" });
      }
    }
  }

  resetDeleteData() {
    this.modalContent = null;
    this.modalActionLabel = null;
    this.modalContent = null;
    this.curDeletingSpotIdx = null;
  }

  toastIt(title, message, variant) {
    const event = new ShowToastEvent({
      title: title,
      message: message,
      variant: variant
    });
    this.dispatchEvent(event);
  }

  get acceptedFormats() {
    return [".jpg", ".jpeg", ".png"];
  }

  get modalClass() {
    return `slds-modal ${this.isModalOpen ? "slds-fade-in-open" : ""}`;
  }

  get modalBackdropClass() {
    return `slds-backdrop ${this.isModalOpen ? "slds-backdrop_open" : ""}`;
  }

  get doConfigsExist() {
    return this.configList.length > 0;
  }

  /* get isSaveDisabled() {
    return !(
      this.currentConfig.Name &&
      this.currentConfig.Name.trim() &&
      this.currentConfig.Title__c &&
      this.currentConfig.Title__c.trim()
    );
  } */

  get navSelectedItem() {
    return this.recordId || this.currentConfig.Id;
  }

  get detailSectionCardCss() {
    return `slds-card height100 slds-scrollable_y detailCard ${
      this.showEmptyHotspotError ? "hasEmptyHotspotError" : ""
    }`;
  }

  get hotspotsWithNoProduct() {
    let msg = "";
    let hotspotNumbers = [];
    this.hotspots.forEach((spot, index) => {
      if (!spot.Product__c) {
        hotspotNumbers.push(index + 1);
      }
    });
    if (hotspotNumbers.length > 0) {
      let htxt = hotspotNumbers.length > 1 ? "Hotspots" : "Hotspot";
      msg = `The ${htxt} numbered ${hotspotNumbers.join(
        ", "
      )} do not have any products linked to them. Please link them to their products or delete them to save the configutation. The empty hotspot sections have been highlighted below.`;
    }
    return msg;
  }

  get showEmptyHotspotMessage() {
    return this.showEmptyHotspotError && this.hotspotsWithNoProduct;
  }
}