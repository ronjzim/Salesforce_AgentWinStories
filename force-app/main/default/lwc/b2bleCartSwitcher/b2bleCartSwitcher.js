import { LightningElement, wire, api, track } from 'lwc';
import { getAppContext, getSessionContext } from "commerce/contextApi";
//import { CartSummaryAdapter } from 'commerce/cartApi';
import Id from "@salesforce/user/Id";

//import { effectiveAccount } from 'commerce/effectiveAccountApi';

import communityId from '@salesforce/community/Id';
import getCarts from '@salesforce/apex/CartSwitcherController.getCarts';
import createCart from '@salesforce/apex/CartSwitcherController.createCart';
import setPrimaryCart from '@salesforce/apex/CartSwitcherController.setPrimaryCart';
import deleteCart from '@salesforce/apex/CartSwitcherController.deleteCart';
import takeOwnership from '@salesforce/apex/CartSwitcherController.takeOwnership';
import releaseOwnership from '@salesforce/apex/CartSwitcherController.releaseOwnership';
import shareCart from '@salesforce/apex/CartSwitcherController.shareCart';

export default class B2bleCartSwitcher extends LightningElement {
    @api effectiveAccountId;
    @api cartTypes;

    @track carts = [];

    @track showDeleteModal = false;
    @track showCreateModal = false;
    //@track currentCart;

    orderOptions = [];
    userId = Id;

    connectedCallback() {
        if (this.cartTypes!=null) {
            //set the first dummy option
            this.orderOptions.push({label: "Don't know yet", value: "Cart"});
            var cartTypesList = this.cartTypes.split(",");

            for (var i=0; i<cartTypesList.length; i++) {
                var cartType = cartTypesList[i];
                this.orderOptions.push({label: cartType, value: cartType});
            } 
        } else {
            //setting some defaults
            this.orderOptions = [
                {label: "Don't know yet", value: "Cart"},
                {label:"OCP",value:"OCP"},
                {label:"Care Moto",value:"Care Moto"},
                {label:"Auto Refill",value:"Auto Refill"},
                {label:"Evasione",value:"Evasione"},
            ];
        }

        if (!this.effectiveAccountId) {
            console.log("Passed effective account is null");
            //console.log("setting effective account from API: " + effectiveAccount.accountId);
            
            Promise.all([ getSessionContext()]).then((sessionContext) => {
                console.log("session context");
                console.log(sessionContext);
                console.log("setting effective account from API: " + sessionContext[0].effectiveAccountId);
                this.effectiveAccountId = sessionContext[0].effectiveAccountId;
                this.getAccountCarts();
            });
            //this.effectiveAccountId = effectiveAccount.accountId;
        } else {
            this.getAccountCarts();
        }
    }

    /*
    @wire(CartSummaryAdapter)
    cartSummaryHandler(response) {
        if (response.data) {
            console.log("Account Switch::CartSummaryAdapter::Got Data");
            console.log(response.data);
            this.currentCart = response.data.cartId;
            console.log("Current Cart: " + this.currentCart);
        } else if (response.error) {
            console.error("Account Switch::CartSummaryAdapter::error");
            console.error(response.error);
        }
    }
    */

    getAccountCarts() {
        console.log("Effective account id: " + this.effectiveAccountId);
        getCarts({
            communityId: communityId,
            effectiveAccountId: this.effectiveAccountId
        }).then(result => {
            console.log("Got carts");
            console.log(result);
            this.carts = result;
        })
        .catch(err => {
            console.error("Error getting carts");
            console.error(err);
        })
    }    

    newCartData = {
        orderType: null
    }
    openCreateModal() {
        this.showCreateModal = true;
    }
    closeCreateModal() {
        this.showCreateModal = false;
    }
    onOrderTypeChange(evt) {
        this.newCartData.orderType = evt.target.value;
    }
    createNewCart() {
        //TODO: open a modal to request additional info before creating the cart
        //like the name and the order type
        console.log("Creating a new Cart");
        console.log("Order type: " + this.newCartData.orderType);
        createCart({
            communityId: communityId,
            effectiveAccountId: this.effectiveAccountId,
            cartName: this.newCartData.orderType
        }).then(result => {
            console.log("Created the new cart");
            console.log(result);
            //refreshing the carts
            this.getAccountCarts();
            this.closeCreateModal();
        }).catch(err => {
            console.error("Error creating the new cart");
            console.error(err);
        });
    }

    switchToCart(evt) {
        var cartId = evt.currentTarget.dataset.id;
        setPrimaryCart({
            communityId: communityId,
            effectiveAccountId: this.effectiveAccountId,
            cartId: cartId,
        }).then(result => {
            console.log("activated cart");
            window.location.reload();
        })
        .catch(err => {
            console.error("Error making the cart " + cartId + " primary");
            console.error(err);
        });
    }

    takeCartOwnership(evt) {
        var cartId = evt.currentTarget.dataset.id;
        takeOwnership({
            communityId: communityId,
            effectiveAccountId: this.effectiveAccountId,
            cartId: cartId,
        }).then(result => {
            console.log("cart ownership taken");
            window.location.reload();
        })
        .catch(err => {
            console.error("Error taking cart ownership for cart: " + cartId);
            console.error(err);
        });
    }

    releaseCartOwnership(evt) {
        var cartId = evt.currentTarget.dataset.id;
        releaseOwnership({
            communityId: communityId,
            effectiveAccountId: this.effectiveAccountId,
            cartId: cartId,
        }).then(result => {
            console.log("cart ownership released");
            window.location.reload();
        })
        .catch(err => {
            console.error("Error releasing cart ownership for cart: " + cartId);
            console.error(err);
        });
    }

    shareCartOwnership(evt) {
        var cartId = evt.currentTarget.dataset.id;
        shareCart({
            communityId: communityId,
            effectiveAccountId: this.effectiveAccountId,
            cartId: cartId,
        }).then(result => {
            console.log("cart shared successfully");
            window.location.reload();
        })
        .catch(err => {
            console.error("Error sharing the cart: " + cartId);
            console.error(err);
        });
    }

    cartToBeDeleted = null;
    openDeleteModal(evt) {
        var cartId = evt.currentTarget.dataset.id;
        this.cartToBeDeleted = cartId;
        this.showDeleteModal = true;
    }
    closeDeleteModal() {
        this.cartToBeDeleted = null;
        this.showDeleteModal = false;
    }
    deleteAccountCart() {
        deleteCart({
            communityId: communityId,
            effectiveAccountId: this.effectiveAccountId,
            cartId: this.cartToBeDeleted
        }).then(result => {
            console.log("deleted cart");
            window.location.reload();
        })
        .catch(err => {
            console.error("Error deleting the cart " + cartId);
            console.error(err);
        });
    }
}