/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */


/**
     @author        Paul Lucas
     @company       Salesforce
     @description   XdoToolReportingEvent
     @date          27/11/2023

     TODO:
 */

import {TYPE_ENUM, EVENT_ENUM, XdoToolBaseEvent, XdoToolBaseEventProperty} from './xdoToolBaseEvent'

export default class XdoToolProductDevelopmentEvent extends XdoToolBaseEvent {
	constructor(componentName, event, data) {
		super(componentName, data);

		this.setType(TYPE_ENUM().PRODUCT)
			.setEvent(event)
			.setLocalProps(data);
	}

	static apiCalled(componentName, data) {
		return new XdoToolProductDevelopmentEvent(componentName, EVENT_ENUM().PRODUCT.API_CALLED, data);
	}

	static assetInstalled(componentName, data) {
		return new XdoToolProductDevelopmentEvent(componentName, EVENT_ENUM().PRODUCT.ASSET_INSTALLED, data);
	}

	static assetViewed(componentName, data) {
		return new XdoToolProductDevelopmentEvent(componentName, EVENT_ENUM().PRODUCT.ASSET_VIEWED, data);
	}

	static elementClicked(componentName, data) {
		return new XdoToolProductDevelopmentEvent(componentName, EVENT_ENUM().PRODUCT.ELEMENT_CLICKED, data);
	}

	static elementHovered(componentName, data) {
		return new XdoToolProductDevelopmentEvent(componentName, EVENT_ENUM().PRODUCT.ELEMENT_HOVERED, data);
	}

	setLocalProps(data) {
		this.properties.push(new XdoToolBaseEventProperty('element_type', data['trackingElementType']));
		this.properties.push(new XdoToolBaseEventProperty('element_label', data['trackingElementLabel']));
		this.properties.push(new XdoToolBaseEventProperty('element_value', data['trackingElementValue']));

		return this;
	}

	setElementLabel(value) {
		this.element_label = value;
		return this;
	}

	setElementType(value) {
		this.element_type = value;
		return this;
	}

	setElementValue(value) {
		this.element_value = value;
		return this;
	}
}