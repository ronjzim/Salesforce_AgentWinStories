/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */


/**
     @author        Paul Lucas
     @company       Salesforce
     @description   XdoToolTrackingEventConfig
     @date          1/4/2024
 */

import {api} from 'lwc';
import {TOAST} from 'c/xdoToolConstants'
import {nanoId, reduceErrors, showToast, to} from 'c/xdoToolCommonJs'
import XdoToolTrackingEventHandlerBase from 'c/xdoToolTrackingEventHandlerBase';

export default class XdoToolTrackingEventConfig extends XdoToolTrackingEventHandlerBase {
	COMPONENT_NAME = 'XdoToolTrackingEventConfig';
	HANDLER_REGISTRATION_DELAY = 100;
	VERSION = 'v1';
	NANOID = nanoId();

	/**
	 * Internal properties
	 */
	_error;
	_data;
	// _loadingMessage = CONSTANTS.LOADING_MESSAGES.DEFAULT;
	_queryTimeout = null;
	_isLoading;

	/**
	 * Private properties
	 */
	// CONSTANTS = CONSTANTS;
	// clientFormFactor = CLIENT_FORM_FACTOR;

	/**
	 * Public properties
	 */
		// @api recordId;
	@api pageContext;

	/**
	 * Getters and Setters
	 */
	get hostStyle() {
		return this.template.host.style;
	}

	get isPageContextValid() {
		return this.pageContext?.trim().length > 0;
	}

	get error() {
		return this._error;
	}

	set error(value) {
		this._error = value;

		// if (this._error) {
		// 	showToast(
		// 		this,
		// 		CONSTANTS.TOAST_MESSAGE_TYPES.ERROR,
		// 		reduceErrors(this._error).join(', '),
		// 		'',
		// 		CONSTANTS.TOAST_THEMES.ERROR,
		// 		CONSTANTS.TOAST_MODE.STICKY);
		// }
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
		this.loadResources()
			.catch(error => {
				console.log('>>>>> Error in renderedCallback: ' + error);
				this.error = error;
			});

		console.log('>>>> Resources loaded')

		if (!this.hasRendered) {
			window.setTimeout(this.registerTrackingHandlers.bind(this), this.HANDLER_REGISTRATION_DELAY);
			this.hasRendered = true;
		}
	}

	loading(message) {
		this.loadingMessage = message ? message : this.loadingMessage;
		this.isLoading = true;
	}

	loaded() {
		this.isLoading = false;
	}

	/**
	 * @description Load resources
	 *
	 * @returns {Promise<void>}
	 */
	async loadResources() {

		//  if (err) new Error('Failed to load highlightjs');
	}

	/**
	 * @description Initialise component once connected to DOM
	 *
	 * @returns {Promise<void>}
	 */
	async initialise() {
		try {

		} catch (error) {
			this.error = error;
			console.error('>>>>> Error in initialise: ');
			console.error(error);
		} finally {
		}
	}
}