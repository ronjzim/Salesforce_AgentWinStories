import { LightningElement, api } from 'lwc';
import { ShowToastEvent } from "lightning/platformShowToastEvent";

// LABELS
import companyName from "@salesforce/label/c.B2B_SPC_Company_Name";
import streetAddress1 from "@salesforce/label/c.B2B_SPC_Street_Address";
import country from "@salesforce/label/c.B2B_SPC_Country";
import city from "@salesforce/label/c.B2B_SPC_City";
import stateProvince from "@salesforce/label/c.B2B_SPC_State_Province";
import postalcode from "@salesforce/label/c.B2B_SPC_Postal_Code";
import companyNameInvalid from "@salesforce/label/c.B2B_SPC_Company_Name_Not_Valid";
import addressNotValid from "@salesforce/label/c.B2B_SPC_Street_Address_Not_Valid";
import countryNotValid from "@salesforce/label/c.B2B_SPC_Country_Not_Valid";
import cityNotValid from "@salesforce/label/c.B2B_SPC_City_Not_Valid";
import stateProvinceNotValid from "@salesforce/label/c.B2B_SPC_State_Province_Not_Valid";
import postalcodeNotValid from "@salesforce/label/c.B2B_SPC_Postal_Code_Not_Valid";
import processingErrorTitle from "@salesforce/label/c.B2B_SPC_Processing_Error";

export default class B2bCheckoutEditAddress extends LightningElement {

    // Custom Labels
    labels = {
        toast: {
            processingErrorTitle: processingErrorTitle
            , companyNameNotValid: companyNameInvalid
            , addressNotValid: addressNotValid
            , countryNotValid: countryNotValid
            , cityNotValid: cityNotValid
            , stateProvinceNotValid: stateProvinceNotValid
            , postalcodeNotValid: postalcodeNotValid
        },
        component: {

            companyName: companyName
            , streetAddress1: streetAddress1
            , streetAddress2: 'Address Line 2'
            , streetAddress3: 'Address Line 3'
            , country: country
            , city: city
            , stateProvince: stateProvince
            , postalcode: postalcode
        }
    };

    @api companyName;
    @api streetAddress1;
    @api country;
    @api city;
    @api stateProvince;
    @api postalCode;

    handleCompanyNameChange (event) {

        this.companyName = event.detail.value;

        // const selectedEvent = new CustomEvent('companynamechange', { detail: event.detail.value, bubbles : true, composed: true });

        // this.dispatchEvent(selectedEvent);

    }

    handleStreetAddress1Change (event) {

        this.streetAddress1 = event.detail.value;

        // const selectedEvent = new CustomEvent('streetaddress1change', { detail: event.detail.value, bubbles : true, composed: true });

        // this.dispatchEvent(selectedEvent);

    }

    handleCountryChange (event) {

        this.country = event.detail.value;

        // const selectedEvent = new CustomEvent('countrychange', { detail: event.detail.value, bubbles : true, composed: true });

        // this.dispatchEvent(selectedEvent);

    }

    handleStateProvinceChange (event) {

        console.log('handleStateProvinceChange', event.detail.value);

        this.stateProvince = event.detail.value;

        // const selectedEvent = new CustomEvent('statechange', { detail: event.detail.value, bubbles : true, composed: true });

        // this.dispatchEvent(selectedEvent);

    }

    handleCityChange (event) {

        this.city = event.detail.value;

        // const selectedEvent = new CustomEvent('citychange', { detail: event.detail.value, bubbles : true, composed: true });

        // this.dispatchEvent(selectedEvent);

    }

    handlePostalCodeChange (event) {

        this.postalCode = event.detail.value;

        // const selectedEvent = new CustomEvent('postalcodechange', { detail: event.detail.value, bubbles : true, composed: true });

        // this.dispatchEvent(selectedEvent);

    }

    @api
    validateFields() {

        const allValid = [...this.template.querySelectorAll('.requiredInput')]
            .reduce((validSoFar, inputFields) => {
                inputFields.reportValidity();
                return validSoFar && inputFields.checkValidity();
            }, true);

        console.log('validateFields(): ' + allValid);

        return allValid;
    }

    @api
    getManualAddress() {

        let address = {};
        address.companyName = this.companyName;
        address.streetAddress1 = this.streetAddress1;
        address.country = this.country;
        address.city = this.city;
        address.stateProvince = this.stateProvince;
        address.postalCode = this.postalCode;

        return address;
    }

}