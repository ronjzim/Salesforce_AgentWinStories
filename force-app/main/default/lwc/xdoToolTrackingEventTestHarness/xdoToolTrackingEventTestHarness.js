/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */


/**
     @author        Paul Lucas
     @company       Salesforce
     @description   XdoToolTrackingEventTestHarness
     @date          14/2/2024

     TODO:
 */


import {LightningElement, track, api} from 'lwc';

import {TOAST} from 'c/xdoToolConstants'
import {reduceErrors, showToast, nanoId} from 'c/xdoToolCommonJs'
import XdoToolTrackingEventHandlerBase from 'c/xdoToolTrackingEventHandlerBase';

export default class XdoToolTrackingEventTestHarness extends XdoToolTrackingEventHandlerBase {
	COMPONENT_NAME = 'XdoToolTrackingEventTestHarness';
	HANDLER_REGISTRATION_DELAY = 100;
	VERSION = 'v1';
	NANOID = nanoId();
	// static renderMode = 'light'; // the default is 'shadow'

	/**
	 * Internal properties
	 */
	_error;
	_data;
	// _loadingMessage = CONSTANTS.LOADING_MESSAGES.DEFAULT;
	_loadingMessage = 'CONSTANTS.LOADING_MESSAGES.DEFAULT';
	_queryTimeout = null;
	_isLoading;

	/**
	 * Private properties
	 */
	message = 'Initialising Test Harness...';
	hasRendered = false;

	var1 = 'blah1';
	var2 = 'blah1';
	value = 'value to track';
	
	

	/**
	 * Public properties
	 */
	@api recordId;
	@api objectApiName;

	/**
	 * Getters and Setters
	 */
	get hostStyle() {
		return this.template.host.style;
	}

	get error() {
		return this._error;
	}

	set error(value) {
		this._error = value;

		if (this._error) {
			showToast(
				this,
				TOAST.MESSAGE_TYPE.ERROR,
				reduceErrors(this._error).join(', '),
				'',
				TOAST.THEME.ERROR,
				TOAST.MODE.STICKY);
		}
	}

	get loadingMessage() {
		return this._loadingMessage;
	}

	set loadingMessage(value) {
		this._loadingMessage = value; // TODO Sanitize
	}

	get isLoading() {
		return this._isLoading;
	}

	set isLoading(value) {
		this._isLoading = value;

		// Disable buttons
		// if (this.tableData) {
		// 	this.tableData.isLoading = value;
		// }
	}

	get shouldTrackEvent() {
		return (this.var1 === this.var2);
	}

	/**
	 * constructor: Called when the component is created. This hook flows from parent to child. You can’t access child
	 * elements in the component body because they don’t exist yet. Properties are not passed yet, either. Properties
	 * are assigned to the component after construction and before the connectedCallback() hook.
	 * You can access the host element with this.template.
	 */
	constructor() {
		super();
	}

	/**
	 * connectedCallBack: Called when the element is inserted into a document. This hook flows from parent to child.
	 * You can’t access child elements in the component body because they don’t exist yet.
	 * You can access the host element with this.template.
	 */
	connectedCallback() {
		this.componentName = this.COMPONENT_NAME;
		super.connectedCallback();
		
		//this.hostStyle.setProperty('--table-height', this.getTableHeight());

		this.initialise().catch(error => {
			console.log('>>>>> Error in connectedCallback: ' + error);
			this.error = error;
		});
	}

	/**
	 * disconnectedCallback: Called when the element is removed from a document. This hook flows from parent to child.
	 */
	disconnectedCallback() {
	}

	/**
	 * render: For complex tasks like conditionally rendering a template or importing a custom one, use render()
	 * to override standard rendering functionality. This function gets invoked after connectedCallback() and must
	 * return a valid HTML template.
	 */

	// render(){}

	/**
	 * renderedCallback: Called after every render of the component. This lifecycle hook is specific to
	 * Lightning Web Components, it isn’t from the HTML custom elements specification. This hook flows from child to parent.
	 */
	renderedCallback() {
		if (!this.hasRendered) {
			window.setTimeout(this.registerTrackingHandlers.bind(this), this.HANDLER_REGISTRATION_DELAY);
			this.hasRendered = true;
		}
	}

	/**
	 * errorCallback: Called when a descendant component throws an error in one of its lifecycle hooks.
	 * The error argument is a JavaScript native error object, and the stack argument is a string.
	 * This lifecycle hook is specific to Lightning Web Components, it isn’t from the HTML custom elements specification.
	 *
	 * @param error
	 * @param stack
	 */
	errorCallback(error, stack) {
	}

	loading(message) {
		this.loadingMessage = message ? message : this.loadingMessage;
		this.isLoading = true;
	}

	loaded() {
		this.isLoading = false;
	}

	/**
	 * @description Initialise component once connected to DOM
	 *
	 * @returns {Promise<void>}
	 */
	async initialise() {
		try {
			// await this.getNextPage();
			showToast(
				this,
				TOAST.MESSAGE_TYPE.SUCCESS,
				'Tracking Event Test Harness is ready!',
				'',
				TOAST.THEME.SUCCESS,
				TOAST.MODE.PESTER);
		} catch (error) {
			this.error = error;
			console.error('>>>>> Error in initialise: ');
			console.error(error);
		} finally {
		}
	}

	handleButtonClick(event) {
		const dataset = {
			domEvent: event.type,
			version: this.VERSION,
			source: 'https://github.com/sfdc-qbranch-emu/DemoBrix-2-xDO-Tool-EventTracking/',
			event: 'conversion',
			action: 'Test harness button clicked imperatively',
			minutesSaved: 1.5,
			value: this.value,
			once: false
		};

		this.value = 'updated value to track';

		this.trackEvent(dataset);
		// this.trackEvent(this.refs.buttonDeclarative.dataset);
		// this.trackEvent(this.template.querySelector('lightning-button.buttonDeclarative').dataset);
	}
}