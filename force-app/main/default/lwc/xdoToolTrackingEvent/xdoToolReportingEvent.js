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

import {TYPE_ENUM, EVENT_ENUM, XdoToolBaseEventProperty,XdoToolBaseEvent} from './xdoToolBaseEvent'

export default class XdoToolReportingEvent extends XdoToolBaseEvent {
	constructor(componentName, event, data) {
		super(componentName, data);
		this.setType(TYPE_ENUM().REPORTING)
			.setEvent(event)
			.setLocalProps(data);
	}

	static conversion(componentName, data) {
		return new XdoToolReportingEvent(componentName, EVENT_ENUM().REPORTING.CONVERSION, data);
	}

	setLocalProps(data) {
		this.properties.push(new XdoToolBaseEventProperty('minutes_saved', data['trackingMinutesSaved']));
		return this;
	}
}