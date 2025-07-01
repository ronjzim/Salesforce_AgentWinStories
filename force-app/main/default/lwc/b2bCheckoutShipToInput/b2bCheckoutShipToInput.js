import { LightningElement, api, track } from 'lwc';
import { ShowToastEvent } from "lightning/platformShowToastEvent";

import COMMUNITYID from "@salesforce/community/Id";

import getAddressInfo from "@salesforce/apex/SDO_B2BCommerce_SPC_ComponentController.getAddressInfo";
import setCartDeliveryGroupShipToAddress from "@salesforce/apex/SDO_B2BCommerce_SPC_ComponentController.setCartDeliveryGroupShipToAddress";
import setCartDeliveryGroupShipToAddressManual from "@salesforce/apex/SDO_B2BCommerce_SPC_ComponentController.setCartDeliveryGroupShipToAddressManual";
import fetchCartDeliveryGroupAddress from "@salesforce/apex/SDO_B2BCommerce_SPC_ComponentController.fetchCartDeliveryGroupAddress";

// LABELS
import shipToSectionHeader from "@salesforce/label/c.B2B_SPC_Ship_To_Section_Header";
import shipToDeliveryInstructions from "@salesforce/label/c.B2B_SPC_Delivery_Instructions";
import shipToRequestedDate from "@salesforce/label/c.B2B_SPC_Requested_Date";
import requestedDatePlaceholder from "@salesforce/label/c.B2B_SPC_Requested_Date_Placeholder";
import deliveryInstructionsPlaceholder from "@salesforce/label/c.B2B_SPC_Delivery_Instructions_Placeholder";
import enterAddress from "@salesforce/label/c.B2B_SPC_Ship_To_Enter_Address_Button";
import cancelAddressDialog from "@salesforce/label/c.B2B_SPC_Cancel";
import saveAddressDialog from "@salesforce/label/c.B2B_SPC_Save";
import addressBookOption from "@salesforce/label/c.B2B_SPC_Ship_To_Address_book_option";
import manualEntryOption from "@salesforce/label/c.B2B_SPC_Ship_To_Manual_Entry_option";
import addressNotSelected from "@salesforce/label/c.B2B_SPC_Ship_To_Address_not_defined";
import enterRequiredFields from "@salesforce/label/c.B2B_SPC_Ship_To_Enter_Required_Fields";
import selectAddress from "@salesforce/label/c.B2B_SPC_Ship_To_Select_Address";
import requiredInformationMissing from "@salesforce/label/c.B2B_SPC_Required_Information_Missing";
import processingErrorTitle from "@salesforce/label/c.B2B_SPC_Processing_Error";
import altPleaseWait from "@salesforce/label/c.B2B_SPC_Please_Wait";

export default class B2bCheckoutShipToInput extends LightningElement {

    // Custom Labels
    labels = {
        toast: {
            processingErrorTitle: processingErrorTitle,
            addressNotSelected: addressNotSelected,
            requiredInformationMissing: requiredInformationMissing,
            selectAddress: selectAddress,
            enterRequiredFields: enterRequiredFields
        },
        component: {
            shipToSectionHeader: shipToSectionHeader,
            shipToDeliveryInstructions: shipToDeliveryInstructions,
            shipToRequestedDate: shipToRequestedDate,
            requestedDatePlaceholder: requestedDatePlaceholder,
            deliveryInstructionsPlaceholder: deliveryInstructionsPlaceholder,
            enterAddress: enterAddress,
            addressBookOption: addressBookOption,
            manualEntryOption: manualEntryOption,
            altPleaseWait: altPleaseWait,
            cancelAddressDialog: cancelAddressDialog,
            saveAddressDialog: saveAddressDialog

        }
    };

    @api effectiveAccountId;
    @api cartId;
    @api webstoreId;

    // User entered
    @api shippingContactPointAddressId;
    @api shippingInstructions;

    @api addressInputType;

    @api makeComponentReadOnly;

    // To be displayed in a radio button group
    addresses = [];
    defaultAddress;
    selectedAddress;

    // address manual entry fields
    @api companyName;
    @api streetAddress1;
    @api country;
    @api city;
    @api stateProvince;
    @api postalCode;

    // Component display options
    @api hideShipToSection;
    @api hideDeliveryInstructions;
    @api hideShippingAddressSelection;
    @api hideShippingAddressManualEntry;

    @api autoLaunchEditShipToAddressDialog;

    @api requestedDeliveryDate;

    communityId = COMMUNITYID;

    connectedCallback() {
        // console.log("b2bCheckoutShipToInput: connectedCallback()");
        // console.log("effectiveAccountId: ", this.effectiveAccountId);
        console.log("hideDeliveryInstructions: ", this.hideDeliveryInstructions);

        console.log('b2bCheckoutShipToInput - hideShippingAddressManualEntry = ', this.hideShippingAddressManualEntry);
        console.log('b2bCheckoutShipToInput - hideShippingAddressSelection = ', this.hideShippingAddressSelection);
        console.log('b2bCheckoutShipToInput - hideShipToSection = ', this.hideShipToSection);

    }

    @api
    doInit(webstoreId, effectiveAccountId, cartId) {
        this.webstoreId = webstoreId;
        this.effectiveAccountId = effectiveAccountId;
        this.cartId = cartId;
        this.loadAddresses();
    }

    loadAddresses() {

        console.log("b2bCheckoutShipToInput: loadAddresses()");
        console.log("cartId: ", this.cartId);
        console.log("effectiveAccountId: ", this.effectiveAccountId);

        getAddressInfo({
                effectiveAccountId: this.effectiveAccountId,
                isShipping: true,
                isBilling: false
            })
            .then((result) => {
                this.processResult(result);
            })
            .catch((error) => {
                this.processError(error);
            });

    }

    processResult(result) {

        if (result) {
            console.log("processResult():" + JSON.stringify(result));

            this.processResults(result);
        }

        this.processMessages(result);
    }

    processResults(result) {
        // console.log("productResults()", productResults);
        if (result.addresses && result.addresses.length > 0) {
            this.addresses = result.addresses;
        }

        let id;

        if (result.defaultAddress) {
            id = result.defaultAddress;
        } else {
            if (this.addresses.length > 0) {
                id = this.addresses[0].Id;
            }

        }

        this.defaultAddress = id;
        this.selectedAddress = id;

        // The account may have a default ContactPointAddress defined.
        // When that is the case, the user will see that address selected in the component.
        // That results in the user seeing no sales tax calculated.
        // An option would be for the parent component to call the child to set the default.
        // The other option would be to force an update to the CartDeliveryGroup upon component load.
        // Currently the Apex method does not identify what address has been selected before.
        // The workaround here is to force an update to the CartDeliveryGroup when the component is loaded.

        // This will ensure that the CartDeliveryGroup has an address from the beginning
        // and that sales tax will be a value other than zero.
        // This doesn't work because initially, this component doesn't have the cartId
        // Retrieving the addresses only requires the effectiveAccountId.
        // this.updateCartDeliveryGroupShipToAddress(id);

        console.log('B2bCheckoutShipToInput - processResults()');
        console.log('selectedAddress: ' + this.selectedAddress);

        this.setCartDeliveryGroupDefaultAddress();

    }

    get options() {

        let addressOptions = [];

        for (let i = 0; i < this.addresses.length; i++) {

            const addr = this.addresses[i];
            let opt = {};
            opt.label = addr.Address.street + ', ' + addr.Address.city + ', ' + (addr.Address.state ? addr.Address.state + ', ' : '') + addr.Address.postalCode + ' ' + addr.Address.country;
            opt.value = addr.Id;

            addressOptions.push(opt);
        }

        return addressOptions;
    }

    processError(error) {
        //console.log("processError()", error);

        this.dispatchEvent(
            new ShowToastEvent({
                title: this.labels.toast.processingErrorTitle,
                message: error.body.message,
                variant: "error"
            })
        );
    }

    processMessages(result) {
        if (result.messagesJson) {
            let messages = JSON.parse(result.messagesJson);
            //console.log("processMessages()", messages);

            // Process messages returned
            // Display toasts when applicable
            // Create content for the details section

            for (var i = 0; i < messages.length; i++) {
                var message = messages[i];

                if (message.toast === true) {
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: message.title,
                            message: message.message,
                            variant: message.severity
                        })
                    );
                }
            }

            this.showProcessLog = true;
        }
    }

    handleAddressChange(event) {

        console.log('B2bCheckoutShipToInput - handleAddressChange');
        console.log('selectedAddress:', event.detail.value);

        const selectedAddress = event.detail.value;
        console.log('Option selected with value: ' + selectedAddress);

        this.selectedAddress = selectedAddress;
        this.shippingContactPointAddressId = selectedAddress;

        // Update the CartDeliveryGroup

        this.updateCartDeliveryGroupShipToAddress(selectedAddress);

    }

    // Called by the parent component
    setCartDeliveryGroupDefaultAddress() {

        if (this.shippingContactPointAddressId === undefined || this.shippingContactPointAddressId === null) {
            const defaultAddressId = this.defaultAddress;

            this.updateCartDeliveryGroupShipToAddress(defaultAddressId);
        } else {
            this.updateCartDeliveryGroupShipToAddress(this.shippingContactPointAddressId);
        }

    }

    // Update the CartDeliveryGroup record to have the address fields from the selected address.
    updateCartDeliveryGroupShipToAddress(contactPointAddressId) {

        console.log('inside updateCartDeliveryGroupShipToAddress()');
        console.log('contactPointAddressId: ' + contactPointAddressId);

        setCartDeliveryGroupShipToAddress({
                contactPointAddress: contactPointAddressId,
                cartId: this.cartId
            })
            .then((result) => {

                console.log('back from setCartDeliveryGroupShipToAddress');

                this.processMessages(result);

                // Send the change to the containing component
                const customEvent2 = new CustomEvent('shippingaddresschange', {
                    detail: contactPointAddressId,
                    bubbles: true,
                    composed: true
                });

                this.dispatchEvent(customEvent2);
            })
            .catch((error) => {
                this.processError(error);
            });

    }

    // Update the CartDeliveryGroup record to have the address fields from the selected address.
    updateCartDeliveryGroupShipToAddressManual() {

        console.log('inside updateCartDeliveryGroupShipToAddressManual()');

        setCartDeliveryGroupShipToAddressManual({
                companyName: this.companyName,
                streetAddress1: this.streetAddress1,
                city: this.city,
                stateProvince: this.stateProvince,
                postalCode: this.postalCode,
                country: this.country,
                cartId: this.cartId
            })
            .then((result) => {

                console.log('back from updateCartDeliveryGroupShipToAddressManual');

                this.processMessages(result);

                // Send the change to the containing component
                const customEvent = new CustomEvent('shippingaddresschange', {
                    detail: null,
                    bubbles: true,
                    composed: true
                });

                this.dispatchEvent(customEvent);

                this.showModal = false;
            })
            .catch((error) => {
                this.processError(error);
            });

    }

    get displayDeliveryInstructions() {

        // console.log('b2bCheckoutShipToInput - hideDeliveryInstructions typeof = ' + (typeof this.hideDeliveryInstructions));
        // console.log('b2bCheckoutShipToInput - hideDeliveryInstructions = ' + this.hideDeliveryInstructions);

        if (this.hideDeliveryInstructions !== undefined) {

            if (this.hideDeliveryInstructions === true) {
                // console.log('displayDeliveryInstructions returning true (1)');
                return false;
            } else {
                // console.log('displayDeliveryInstructions returning false');
                return true;
            }
        } else {
            // console.log('displayDeliveryInstructions returning true (2)');
            return false;
        }
    }

    get displayShippingAddressSelection() {

        console.log('b2bCheckoutShipToInput - hideShippingAddressSelection typeof = ' + (typeof this.hideShippingAddressSelection));
        console.log('b2bCheckoutShipToInput - hideShippingAddressSelection = ' + this.hideShippingAddressSelection);

        if (this.hideShippingAddressSelection !== undefined) {

            if (this.hideShippingAddressSelection === true) {
                // console.log('displayDeliveryInstructions returning true (1)');
                return false;
            } else {
                // console.log('displayDeliveryInstructions returning false');
                return true;
            }
        } else {
            // console.log('displayDeliveryInstructions returning true (2)');
            return true;
        }

    }

    get addressInputMethods() {

        // console.log('addressInputType = ' + this.addressInputType);
        // console.log('hideShippingAddressSelection = ' + this.hideShippingAddressSelection);
        // console.log('hideShippingAddressManualEntry = ' + this.hideShippingAddressManualEntry);

        let theOptions = [];

        if (this.hideShippingAddressSelection === false) {
            theOptions.push({ label: this.labels.component.addressBookOption, value: 'select' });
        }

        if (this.hideShippingAddressManualEntry === false) {
            theOptions.push({ label: this.labels.component.manualEntryOption, value: 'manual' });
        }

        // Default the selected option
        if (theOptions.length > 0) {

            if (this.addressInputType !== undefined) {

            } else {
                this.addressInputType = theOptions[0].value;
            }

        }

        return theOptions;
    }

    get isSelect() {
        if (this.addressInputType == 'select') {
            return true;
        } else {
            return false;
        }
    }

    get isManual() {
        if (this.addressInputType == 'manual') {
            return true;
        } else {
            return false;
        }
    }

    handleShippingInstructionsChange(event) {
        const value = event.detail.value;

        this.shippingInstructions = value;

        const selectedEvent = new CustomEvent('shippinginstructionschange', { detail: event.detail.value, bubbles: true, composed: true });

        this.dispatchEvent(selectedEvent);
    }

    handleRequestDate(event) {
        const value = event.detail;
        this.requestedDeliveryDate = value;
        console.log("b2bCheckoutShipToInput: handleRequestDate()", JSON.stringify(this.requestedDeliveryDate));
        // FFEIX[03/17/23] : capture Request Date in checkout
        const selectedEvent = new CustomEvent("shippingrequestdatechange", { detail: event.detail.value, bubbles: true, composed: true });
        this.dispatchEvent(selectedEvent);
        // FFEIX:END

    }

    handleAddressInputTypeChange(event) {

        const value = event.detail.value;
        this.addressInputType = value;

        // const customEvent = new CustomEvent('shiptoentrytypechange', {
        //     detail : value, bubbles : true, composed: false
        // });

        // this.dispatchEvent(customEvent);
    }

    handleCompanyNameChange(event) {
        const value = event.detail;
        this.companyName = value;
    }

    handleStreetAddress1Change(event) {
        const value = event.detail;
        this.streetAddress1 = value;
    }

    handleCountryChange(event) {
        const value = event.detail;
        this.country = value;
    }

    handleStateProvinceChange(event) {
        const value = event.detail;
        this.stateProvince = value;
    }

    handleCityChange(event) {
        const value = event.detail;
        this.city = value;
    }

    handlePostalCodeChange(event) {
        const value = event.detail;
        this.postalcode = value;
    }

    @track showModal = false;

    handleShowModal(event) {

        this.showModal = true;
    }

    handleCloseModal(event) {
        this.showModal = false;
    }

    handleSaveModal(event) {

        const comp = this.template.querySelector('c-b2b-checkout-edit-address');
        if (comp) {
            const isValid = comp.validateFields();

            if (isValid) {
                const manualAddress = comp.getManualAddress();

                console.log('manualAddress: ' + JSON.stringify(manualAddress));

                // save the address
                this.companyName = manualAddress.companyName;
                this.streetAddress1 = manualAddress.streetAddress1;
                this.city = manualAddress.city;
                this.stateProvince = manualAddress.stateProvince;
                this.postalCode = manualAddress.postalCode;
                this.country = manualAddress.country;

                // update the cart delivery group
                // call the address changed custom event
                this.updateCartDeliveryGroupShipToAddressManual();

            } else {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: this.labels.toast.requiredInformationMissing,
                        message: this.labels.toast.enterRequiredFields,
                        variant: "error"
                    })
                );
            }

        } else {
            console.log('child component not found (c-b2b-checkout-edit-address)!');
        }

    }

    get hasStreetAddress1() {
        if (this.streetAddress1 && this.streetAddress1 != '') {
            return true;
        } else {
            return false;
        }
    }

    getCartDeliveryGroupAddress() {
        fetchCartDeliveryGroupAddress({
                cartId: this.cartId
            })
            .then((result) => {
                console.log('fetchCartDeliveryGroupAddress result: ' + JSON.stringify(result));
                if (result && result.cartDeliveryGroup) {

                    const cdg = result.cartDeliveryGroup;

                    if (cdg.DeliverToName) {
                        this.companyName = cdg.DeliverToName;
                    }

                    if (cdg.DeliverToStreet) {
                        this.streetAddress1 = cdg.DeliverToStreet;
                    }

                    if (cdg.DeliverToCity) {
                        this.city = cdg.DeliverToCity;
                    }

                    if (cdg.DeliverToState) {
                        this.stateProvince = cdg.DeliverToState;
                    }

                    if (cdg.DeliverToPostalCode) {
                        this.postalCode = cdg.DeliverToPostalCode;
                    }

                    if (cdg.DeliverToCountry) {
                        this.country = cdg.DeliverToCountry;
                    }

                    // Automatically display the dialog after we retrieve the address info
                    if (this.autoLaunchEditShipToAddressDialog && this.hideShippingAddressManualEntry === false) {
                        this.showModal = true;
                    }

                }
            })
            .catch((error) => {
                console.log("error from doInit()");
                console.log(error);

                this.dispatchEvent(
                    new ShowToastEvent({
                        title: this.labels.toast.processingErrorTitle,
                        message: error.message,
                        variant: "error"
                    })
                );
            });
    }

    @api
    validateAddressSelection() {

        if (this.selectedAddress === undefined || this.selectedAddress === null) {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: this.labels.toast.requiredInformationMissing,
                    message: this.labels.toast.selectAddress,
                    variant: "error"
                })
            );

            return false;
        } else {
            return true;
        }

    }

    get displayShipToSection() {
        if (this.hideShipToSection === true) {
            return false;
        } else if (this.hideShippingAddressSelection === true && this.hideShippingAddressManualEntry === true) {
            console.log('ship to address input hidden');
            return false;
        } else {
            console.log('ship to address input visible');
            return true;
        }
    }

}