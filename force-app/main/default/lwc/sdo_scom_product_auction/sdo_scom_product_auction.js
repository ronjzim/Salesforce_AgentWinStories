import { LightningElement, track, api, wire } from 'lwc';
import getProductAuctionDetails from '@salesforce/apex/Sdo_Scom_Auction_Service.getProductAuctionDetails';
import addAuctionBid from '@salesforce/apex/Sdo_Scom_Auction_Service.addAuctionBid';
import { AppContextAdapter, SessionContextAdapter } from 'commerce/contextApi';
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import currency from '@salesforce/i18n/currency';

export default class Sdo_scom_product_auction extends LightningElement {
    startDate;
    endDate;

    numberOfBids = 0;
    startingBidPrice = 0;
    bidAmount;

    isBidValid = true;
    auctionActive = false;
    auctionClosed = false;
    auctionPending = false;
    isGuestUser = true;
    noAuctions = true;

    _recordId;
    accountId;
    auctionId;
    webstoreId;
    userId;

    latestBid = 0;
    errorMessage = '';

    @api placeBidText = 'Place bid';
    @api guestUserText = 'This product can only be bought in Auction. If you want to participate in the auction, please Login or Register.';
    @api textFieldLabelText = 'Would you like to bid for this product?';
    @api noAuctionText = 'No Auctions planned yet, please revisit later.';

    @api get value() {
        return this._recordId;
    }

    set value(value) {
        this._recordId = value;
        this.populateAuctionDetails(this.webstoreId, this.value);
    }

    @wire(AppContextAdapter)
    appContextHandler({ data, loaded }) {
        if (loaded && data) {
            this.webstoreId = data.webstoreId;
            this.populateAuctionDetails(this.webstoreId, this.value);
        }
    }

    @wire(SessionContextAdapter)
    sessionHandler({ data, loaded }) {
        if (loaded && data) {
            this.accountId = data.effectiveAccountId;
            this.isGuestUser = !data.isLoggedIn;
            this.userId = data.userId;
        }
    }

    get hideAuctionSection() {
        return this.auctionClosed || this.auctionPending || this.isGuestUser;
    }

    get cureencyCode() {
        return currency;
    }

    placeBidButtonClick() {
        if(!this.isBidValid) {
            this.errorMessage = 'Bid amount must be greater than all existing bids. Please check the latest bid.';
            return;
        }
        const requestParams = {
            Account__c: this.accountId,
            Auction__c: this.auctionId,
            Product__c: this.value,
            User__c: this.userId,
            Bid_Amount__c: this.bidAmount
        };
        addAuctionBid({
            request: requestParams
        }).then(result => {
            console.log('Bid added successfully:', result);
            this.latestBid = result.Bid_Amount__c;
            this.numberOfBids++;

            const toastEvent = new ShowToastEvent({
                title: "Success!",
                message: "Your bid added successfully",
                variant: "success",
            });
            this.dispatchEvent(toastEvent);
            this.clearField();
        }).catch(error => {
            console.error('Error adding bid:', error);
            const toastEvent = new ShowToastEvent({
                title: "Error!",
                message: error?.body?.message,
                variant: "error",
            });
            this.dispatchEvent(toastEvent);
        });
    }

    clearField() {
        this.template.querySelector('lightning-input[data-id="inputField"]').value = '';
    }

    populateAuctionDetails(webStoreId, productId) {
        if(productId && webStoreId) {
            this.fetchAuctionDetails({
                productId,
                webStoreId
            });
        }
    }

    fetchAuctionDetails(request) {
        getProductAuctionDetails({request})
            .then(result => {
                if (result) {
                    this.noAuctions = false;
                    const auctionStatus = result.auction.Status__c;
                    this.startingBidPrice = result.auction.Starting_Bid_Price__c;
                    this.auctionId = result.auction.Id;

                    this.startDate = this.formatDate(result.auction.Start_Date_Time__c);
                    this.endDate = this.formatDate(result.auction.End_Date_Time__c);

                    if(auctionStatus === 'Active') {
                        this.auctionActive = true;
                    }
                    else if(auctionStatus === 'Pending') {
                        this.auctionPending = true;
                    }
                    else if(auctionStatus === 'Closed') {
                        this.auctionClosed = true;
                    }

                    this.updateAuctionBidsDetails(result.auctionBids);
                } else {
                    this.noAuctions = true;
                }
                return [];
            })
            .catch(error => {
                console.error('Error fetching auction details or bids', error);
            });
    }

    updateAuctionBidsDetails(bids = []) {
        this.numberOfBids = bids.length;
        this.latestBid = this.numberOfBids
            ? Math.max(...bids.map(bid => bid.Bid_Amount__c))
            : this.startingBidPrice;
    }

    handleBidAmountChange(event) {
        this.bidAmount = event.target.value;
        this.isBidValid = Number(this.bidAmount) > Number(this.latestBid);
        this.errorMessage = '';
    }

    formatDate(dateString) {
        const date = new Date(dateString);
    
        const now = new Date();
        const diffMs = date - now;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
        const dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()];
        const time = date.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });
    
        const formattedDate = `${diffDays}d ${diffHours}h ${dayOfWeek}, ${time}`;
        return formattedDate;
    }
}