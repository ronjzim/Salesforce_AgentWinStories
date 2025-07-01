import {
  LightningElement,
  api
} from 'lwc';
import {
  NavigationMixin
} from 'lightning/navigation';

export default class Parallaxcmp extends NavigationMixin(LightningElement) {

  @api backgroundImage;
  @api mainTitle;
  @api fontColor;
  @api overlayColor
  @api imageHeight
  @api fontSize;
  @api fullWidth;

  get myImage() {
    if (this.fullWidth === true) {
      return "width: 100vw; margin-left: calc(50% - 50vw); margin-right: calc(50% - 50vw);max-width: 100vw; min-height:" + this.imageHeight + "px; background-position: 50% 50%;background-size: cover;background-image: url('../sfsites/c/resource/" + this.backgroundImage;
    }
    return "min-height:" + this.imageHeight + "px; background-position: 50% 50%;background-size: cover;background-image: url('../sfsites/c/resource/" + this.backgroundImage;
  }

  get myTextColor() {
    console.log('the font color is ', this.fontColor);
    return "font-size:" + this.fontSize + "px; color: " + this.fontColor;
  }

  get myOverlay() {
    if (this.fullWidth === true) {
      return "width: 100vw; margin-left: calc(50% - 50vw); margin-right: calc(50% - 50vw);max-width: 100vw; background-color: " + this.overlayColor;
    }
    return "background-color: " + this.overlayColor;
  }


}