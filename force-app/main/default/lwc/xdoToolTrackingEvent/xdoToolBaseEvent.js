/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/**
     @author        Paul Lucas
     @company       Salesforce
     @description   XdoToolBaseEvent
     @date          27/11/2023

     TODO: 
        -
 */

import Id from '@salesforce/user/Id';
import {isTrue} from 'c/xdoToolCommonJs'

const DEFAULT_DELAY = 50;
const TYPE_ENUM = () => {
	return {
		MONITORING: "Monitoring",
		PRODUCT: "Product",
		REPORTING: "Reporting"
	}
}
const EVENT_ENUM = () => {
	return {
		MONITORING: {
			PING: "Ping"
		},
		PRODUCT: {
			API_CALLED: "Api Called",
			ASSET_INSTALLED: "Asset Installed",
			ASSET_VIEWED: "Asset Viewed",
			ELEMENT_CLICKED: "Element Clicked",
			ELEMENT_HOVERED: "Element Hovered"
		},
		REPORTING: {
			CONVERSION: "Conversion"
		}
	}
}

class XdoToolBaseEventProperty {
	name = '';
	value = '';

	constructor(name, value) {
		this.name = name;
		this.value = value;
	}
}

class XdoToolBaseEvent {
	properties = [];

	id = '';
	asset_identifier = '';
	action = '';
	version = '';
	event = '';
	type = '';
	delay = DEFAULT_DELAY;
	once = false;
	// userId = Id;


	// page = '';

	// value = '';

	// TODO: delete?
	// component = '';
	// section = '';
	// targetUri = '';
	// email

	constructor(componentName, data) {
		if (this.constructor == XdoToolBaseEvent) {
			throw new Error("XdoToolBaseEvent class cannot be instantiated.");
		}

		this.setAttributes(data)
			.setProps(data)
			.setAssetIdentifier(componentName);
	}

	getDelay() {
		let delay = parseInt(this.delay, 10);

		return isNaN(delay) ? DEFAULT_DELAY : delay;
	}

	getSerialized() {
		return JSON.stringify(this);
	}

	setAttributes(data) {
		({
			trackingAction: this.action,
			trackingDelay: this.delay = DEFAULT_DELAY,
			trackingId: this.id,
			trackingOnce: this.once = false,
			trackingVersion: this.version
		} = data);

		this.once = isTrue(this.once);
		return this;
	}

	setProps(data) {
		this.properties.push(new XdoToolBaseEventProperty('action', data['trackingAction']));
		this.properties.push(new XdoToolBaseEventProperty('dom_event', data['trackingDomEvent']));
		this.properties.push(new XdoToolBaseEventProperty('page', window.location.href));
		this.properties.push(new XdoToolBaseEventProperty('source', data['trackingSource']));
		this.properties.push(new XdoToolBaseEventProperty('value', data['trackingValue']));

		return this;
	}

	setAssetIdentifier(value) {
		this.asset_identifier = `${value}_${this.version}`;
		this.properties.push(new XdoToolBaseEventProperty('asset_identifier', this.asset_identifier));

		return this;
	}

	// setComponentName(value) {
	// 	this.component = value;
	// 	return this;
	// }

	setEvent(value) {
		this.event = value;
		return this;
	}

	setType(value) {
		this.type = value;
		this.properties.push(new XdoToolBaseEventProperty('type', value));
		return this;
	}
}

export {
	TYPE_ENUM,
	EVENT_ENUM,
	XdoToolBaseEventProperty,
	XdoToolBaseEvent
}