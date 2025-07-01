/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/**
     @author        Paul Lucas
     @company       Salesforce
     @description   XdoToolTrackingEvent
     @date          24/11/2023

     TODO:
 */

import XdoToolMonitoringEvent from "./xdoToolMonitoringEvent";
import XdoToolProductDevelopmentEvent from "./xdoToolProductDevelopmentEvent";
import XdoToolReportingEvent from "./xdoToolReportingEvent";
import {TYPE_ENUM, EVENT_ENUM} from "./xdoToolBaseEvent"
import {camelToSnake} from "c/xdoToolCommonJs"

class XdoToolTrackingEvent {
	static default = {
		TYPE: TYPE_ENUM().REPORTING,
		EVENT: EVENT_ENUM().REPORTING.CONVERSION.toLowerCase(),
	};

	static eventType = {
		MONITORING: XdoToolMonitoringEvent,
		PRODUCT: XdoToolProductDevelopmentEvent,
		REPORTING: XdoToolReportingEvent
	};

	static getEventContext(trackingEvent) {
		let type;
		let types = Object.entries(EVENT_ENUM());
		let typesLength = types.length;

		for (let i = 0; i < typesLength; i++) {
			type = Object.keys(types[i][1]).filter(event => event === camelToSnake(trackingEvent).toUpperCase()).length > 0 ? types[i][0] : undefined;

			if (type)
				break;
		}

		return type;
	}

	static createInstance(componentName, data) {
		let {trackingType, trackingEvent = this.default.EVENT} = data;

		trackingType = this.getEventContext(trackingEvent); // TODO: Alternatively, create proxy object - https://stackoverflow.com/a/38494334
		try {
			return this.eventType[trackingType?.toUpperCase()][trackingEvent](componentName, data);
		} catch (e) {
			console.warn(`>>>>> Tracking event undefined for data-tracking-type: ${trackingType}, data-tracking-event: ${trackingEvent}`);
			this.reportAvailableEvents(this.eventType);
		}
	}

	static getObjectMethods(obj) {
		return Object.getOwnPropertyNames(obj)
			.filter(prop => typeof obj[prop] === "function");
	}

	static reportAvailableEvents(eventTypes) {
		console.warn('>>>>> Available type/events are: ')

		Object.entries(eventTypes).forEach(entry => {
			const [key, value] = entry;
			console.warn(`data-tracking-type : ${key.toLowerCase()} - data-tracking-event : ${JSON.stringify(this.getObjectMethods(value))}`)
		});
	}
}

export {
	XdoToolTrackingEvent,
	XdoToolMonitoringEvent,
	XdoToolProductDevelopmentEvent,
	XdoToolReportingEvent
}