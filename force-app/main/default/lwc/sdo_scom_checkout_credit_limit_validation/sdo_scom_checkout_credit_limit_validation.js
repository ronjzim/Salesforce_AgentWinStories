import { LightningElement, api, wire } from 'lwc';
import { useCheckoutComponent } from 'commerce/checkoutApi';
import { SessionContextAdapter } from 'commerce/contextApi';

import CreditLimitModal from 'c/sdo_scom_checkout_credit_limit_modal';
import getAvailableCreditLimit from '@salesforce/apex/Sdo_Scom_CheckoutCreditLimitService.getAvailableCreditLimit';
import LOCALE from "@salesforce/i18n/locale";

export default class Sdo_scom_checkout_credit_limit_validation extends useCheckoutComponent(LightningElement) {
    /**
     * Populated by checkout DP from {!Checkout.Details}
     */
    @api checkoutDetails;

    @api creditValidationHeader;

    @api creditValidationErrorMessage;

    @wire(SessionContextAdapter)
    sessionContext;

    /**
     * Check whether Purchase Order is selected
     */
    get isPurchaseOrderPaymentMethodSelected() {
        const elems = document.querySelectorAll('lightning-radio-group.multi-payment-accordion-radio-group-style') || [];
        return Array.prototype.some.call(elems, (paymentMethodElem => paymentMethodElem.value === 'purchase-order'));
    }

    getCreditLimitErrorMessage(exceededValue) {
        return this.creditValidationErrorMessage.replace('{0}', exceededValue);
    }

    formattedCurrency(value, currencyIsoCode) {
        return new Intl.NumberFormat(LOCALE, {
            style: "currency",
            currency: currencyIsoCode,
            currencyDisplay: "symbol",
        }).format(value);
    }

    showCreditLimitValidationMessage({content, label}) {
        CreditLimitModal.open({
            label: label,
            size: 'medium',
            description: 'Credit Limit Validation Modal',
            content: content
        });
    }

    getAvailableCreditLimit() {
        return getAvailableCreditLimit({effectiveAccountId: this.sessionContext?.data?.effectiveAccountId})
            .then((result) => {
                const { AvailableCredit: availableCreditLimit } = result;
                const { currencyIsoCode, grandTotalAmount: cartTotal } = this.checkoutDetails?.cartSummary;
                if ((availableCreditLimit - cartTotal) >= 0) {
                    return Promise.resolve(true);
                }
                const exceededValue = this.formattedCurrency(cartTotal - availableCreditLimit, currencyIsoCode);
                const content = this.getCreditLimitErrorMessage(exceededValue);
                this.showCreditLimitValidationMessage({label: this.creditValidationHeader, content});
                return Promise.resolve(false);
            })
            .catch((error) => {
                const label = "Something Went Wrong!";
                const errorMessage = error?.body?.message || 'Please contact your system administrator.'
                this.showCreditLimitValidationMessage({label, content: errorMessage});
                return Promise.resolve(false);
            });
    }

    /**
     * process payment when our container asks us to
     */
    stageAction(checkoutStage) {
        if (checkoutStage === 'REPORT_VALIDITY_SAVE') {
            if (this.isPurchaseOrderPaymentMethodSelected) {
                return this.getAvailableCreditLimit();
            }
        }
        return Promise.resolve(true);
    }
}