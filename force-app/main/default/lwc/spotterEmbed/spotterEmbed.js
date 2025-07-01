import { LightningElement, api, track, wire } from "lwc";
import communityId from "@salesforce/community/Id";
import { CurrentPageReference, NavigationMixin } from "lightning/navigation";
import FORM_FACTOR from "@salesforce/client/formFactor";
import getEmbedInfo from "@salesforce/apex/DE_RY_Spotter.getEmbedInfo";
import getUserAccountID from "@salesforce/apex/DE_RY_Spotter.getUserAccountID";
import { resolve } from "c/spotterCmsResourceResolver";
import { getRecord } from "lightning/uiRecordApi";

export default class SpotterEmbed extends NavigationMixin(LightningElement) {
  @api recordId;
  @api spotterMode;
  @api configId;
  @api showSpotterTitle;
  @api showHotspotsDesktop;
  @api showHotspotsMobile;
  @api showProductCarousel;
  @api productCarouselTitle;
  @api effectiveAccountId;

  @track currentConfig;
  @track hotspots = [];

  currencyIsoCode;

  @track error;

  @track showScrollButtonLeft = false;
  @track showScrollButtonRight = false;

  @track currentPageReferenceDetails;

  isRefreshing;

  connectedCallback() {
    this.doInit();
  }

  async invokeGetConfig() {
    if (this.spotterMode === "Select Manually" || this.hasRecordContext) {
      this.getConfigInfo();
    }
  }

  async doInit() {
    if (!this.effectiveAccountId) {
      try {
        const accId = await getUserAccountID();
        this.effectiveAccountId = accId;
      } catch (error) {
        console.error(error);
      }
    }
    this.invokeGetConfig();
  }

  @wire(CurrentPageReference)
  handlePageChange(currentPageReference) {
    this.currentPageReferenceDetails = currentPageReference;
    this.currentConfig = undefined;
    this.invokeGetConfig();
  }

  renderedCallback() {
    if (this.isRendered) {
      return;
    }
    window.addEventListener("resize", this.imageLoaded.bind(this));
    document.addEventListener("click", (this._handler = this.handleDocumentClick.bind(this)));
    this.isRendered = true;
  }

  handleDocumentClick() {
    let allHotspots = this.template.querySelectorAll(".lg-hotspot-dot");
    allHotspots.forEach((spot) => {
      spot.classList.remove("lg-hotspot-active");
    });
  }

  imageLoaded() {
    //console.log("--------- rendered callback >>>>");
    let allhotspots = this.template.querySelectorAll(".lg-hotspot");
    let container = this.template.querySelector(".lg-container");
    let containerRect = container?.getBoundingClientRect();
    if (this.showProductCarousel) {
      this.handleCarouselScroll();
    }

    //console.log("conHieght", container.offsetHeight);
    //console.log("conWidth", container.offsetWidth);
    allhotspots.forEach((elem) => {
      let idx = elem.dataset.idx;
      let toolptipElem = this.template.querySelector(`.lg-tooltip[data-idx="${idx}"]`);
      if (toolptipElem) {
        let tooltipRect = toolptipElem.getBoundingClientRect();
        //console.log("idx", idx);
        //console.log("containerRect", JSON.stringify(containerRect));
        //console.log("tooltipRect", JSON.stringify(tooltipRect));

        let relativePos = {};

        relativePos.top = tooltipRect.top - containerRect.top;
        relativePos.right = tooltipRect.right - containerRect.right;
        relativePos.bottom = tooltipRect.bottom - containerRect.bottom;
        relativePos.left = tooltipRect.left - containerRect.left;
        //console.log("relativePos", relativePos);

        if (relativePos.right > 0) {
          //console.log(idx, " goes out on right ");
          toolptipElem.classList.add("lg-tooltip-left");
        } else if (relativePos.left < 0) {
          //console.log(idx, " goes out on left");
          toolptipElem.classList.add("lg-tooltip-right");
        }
      }
    });
  }

  getConfigInfo() {
    getEmbedInfo({
      spotterMode: this.spotterMode,
      configId: this.configId,
      communityId: communityId,
      effectiveAccountId: this.effectiveAccountId,
      productRecordId: this.recordId,
    })
      .then((result) => {
        this.error = undefined;
        let { config, pricelist, productImages, relatedProductId } = result;
        //console.log('spotter result ///// >>> ', result);
        if (config && (this.isManualSelect || (this.hasRecordContext && this.recordId == relatedProductId))) {
          this.currentConfig = result.config;
          this.hotspots = result.config.Spotter_Hotspots__r;
        } else {
          this.currentConfig = undefined;
        }
        //console.log("spotter data >>> ", result);
        if (pricelist && !pricelist.error.message) {
          this.setPricesforHotspots(result.pricelist);
        }
        if (productImages) {
          this.setImagesForHotspots(result.productImages);
        }
      })
      .catch((error) => {
        this.error = error;
        console.log("error fetching config", error);
      });
  }

  setPricesforHotspots(pricelistData) {
    try {
      this.currencyIsoCode = pricelistData.currencyIsoCode;
      let pricelist = pricelistData.pricingLineItemResults;
      this.hotspots.forEach((prodspot) => {
        let spot_productId = prodspot.Product__c;
        let spot_price;
        let minimum_fraction_digits;
        if (spot_productId) {
          let price_object = pricelist.find((product) => product.productId === spot_productId);
          if (price_object && !price_object.error.message) {
            let unitPrice = price_object.unitPrice;
            spot_price = unitPrice;
            minimum_fraction_digits = unitPrice.includes(".") ? 2 : 0;
          }
        }
        prodspot.Price = spot_price;
        prodspot.minimum_fraction_digits = minimum_fraction_digits;
      });
    } catch (err) {
      console.log("error setPricesforHotspots", err);
    }
  }

  setImagesForHotspots(imagesArray) {
    //console.log(imagesArray);
    try {
      this.hotspots.forEach((prodspot) => {
        let spot_productId = prodspot.Product__c;
        let imgAltText;
        let imgUrl;
        if (spot_productId) {
          let image_object = imagesArray.find((prodImage) => prodImage.id === spot_productId);
          //console.log(image_object);
          if (image_object) {
            imgAltText = image_object.defaultImage.alternativeText;
            imgUrl = resolve(image_object.defaultImage.url);
          }
          //console.log(imgAltText, imgUrl);
          prodspot.imgAltText = imgAltText;
          prodspot.imgUrl = imgUrl;
        }
      });
      //console.log(this.hotspots);
    } catch (error) {
      console.log("error setImagesForHotspots", error);
    }
  }

  handleTooltipClick(event) {
    let productId = event.currentTarget.dataset.productid;
    this[NavigationMixin.Navigate]({
      type: "standard__recordPage",
      attributes: {
        recordId: productId,
        objectApiName: "Product2",
        actionName: "view",
      },
    });
  }

  handleHospotClick(event) {
    event.stopPropagation();
    if (FORM_FACTOR === "Small" || FORM_FACTOR === "Medium") {
      let idx = event.currentTarget.dataset.idx;
      let hotspotElem = this.template.querySelector(`.lg-hotspot-dot[data-idx="${idx}"]`);
      if (hotspotElem.classList.contains("lg-hotspot-active")) {
        hotspotElem.classList.remove("lg-hotspot-active");
      } else if (!hotspotElem.classList.contains("lg-hotspot-active")) {
        let allHotspots = this.template.querySelectorAll(".lg-hotspot-dot");
        allHotspots.forEach((spot) => {
          spot.classList.remove("lg-hotspot-active");
        });
        hotspotElem.classList.add("lg-hotspot-active");
      }
    }
  }

  handleHotspotMouseIn(event) {
    if (FORM_FACTOR !== "Small" && FORM_FACTOR !== "Medium") {
      let idx = event.currentTarget.dataset.idx;
      let hotspotElem = this.template.querySelector(`.lg-hotspot-dot[data-idx="${idx}"]`);
      if (!hotspotElem.classList.contains("lg-hotspot-active")) {
        let allHotspots = this.template.querySelectorAll(".lg-hotspot-dot");
        allHotspots.forEach((spot) => {
          spot.classList.remove("lg-hotspot-active");
        });
        hotspotElem.classList.add("lg-hotspot-active");
      }
    }
  }

  handleHotspotMouseOut(event) {
    if (FORM_FACTOR !== "Small" && FORM_FACTOR !== "Medium") {
      let idx = event.currentTarget.dataset.idx;
      let hotspotElem = this.template.querySelector(`.lg-hotspot-dot[data-idx="${idx}"]`);
      hotspotElem.classList.remove("lg-hotspot-active");
    }
  }

  scrollCarousel(event) {
    let scrollto = event.currentTarget.dataset.scrollto;
    let scrollElement = this.template.querySelector(".product-carousel");
    if (scrollto === "start") {
      scrollElement.scrollLeft = 0;
    } else if (scrollto === "end") {
      scrollElement.scrollLeft = scrollElement.scrollWidth;
    }
  }

  handleCarouselScroll(event) {
    let elem = event ? event.currentTarget : this.template.querySelector(".product-carousel");
    if (elem) {
      if (elem.scrollLeft > 0) {
        this.showScrollButtonLeft = true;
      }
      if (elem.scrollLeft < elem.scrollWidth - elem.offsetWidth) {
        this.showScrollButtonRight = true;
      }
      if (elem.scrollLeft === 0) {
        this.showScrollButtonLeft = false;
      }
      if (Math.ceil(elem.scrollLeft) >= elem.scrollWidth - elem.offsetWidth) {
        this.showScrollButtonRight = false;
      }
    }
  }

  get carouselButtonClassLeft() {
    return `slds-button slds-button_icon carousel-button ${this.showScrollButtonLeft ? "caurosel-button-show" : ""}`;
  }

  get carouselButtonClassRight() {
    return `slds-button slds-button_icon carousel-button carousel-button-right ${this.showScrollButtonRight ? "caurosel-button-show" : ""}`;
  }

  get resolvedEffectiveAccountId() {
    const effectiveAccountId = this.effectiveAccountId || "";
    let resolved = null;

    if (effectiveAccountId.length > 0 && effectiveAccountId !== "000000000000000") {
      resolved = effectiveAccountId;
    }
    return resolved;
  }

  get containerClass() {
    let cls = "lg-container ";
    if (
      ((FORM_FACTOR === "Small" || FORM_FACTOR === "Medium") && this.showHotspotsMobile === "Always") ||
      (FORM_FACTOR !== "Small" && FORM_FACTOR !== "Medium" && this.showHotspotsDesktop === "Always")
    ) {
      cls += "lg-hotspots-show-always";
    }
    return cls;
  }

  get hasRecordContext() {
    return this.spotterMode === "Based on Current Product Record" && this.recordId;
  }

  get isManualSelect() {
    return this.spotterMode === "Select Manually";
  }

  get productCarouselList() {
    let deduplicated = this.hotspots.reduce((acc, current) => {
      let isExists = acc.find((item) => item.Product__c === current.Product__c);
      if (!isExists) {
        acc.push(current);
      }
      return acc;
    }, []);
    return deduplicated;
  }
}