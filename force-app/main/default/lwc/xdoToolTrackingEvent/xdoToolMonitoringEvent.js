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

export default class XdoToolMonitoringEvent extends XdoToolBaseEvent {
	constructor(componentName, event, data) {
		super(componentName, data);

		this.setType(TYPE_ENUM().MONITORING)
			.setEvent(event)
			.setLocalProps(data);
	}

	static ping(componentName, data) {
		return new XdoToolMonitoringEvent(componentName, EVENT_ENUM().MONITORING.PING, data);
	}

	setLocalProps(data) {
		this.properties.push(new XdoToolBaseEventProperty('system_up', data['trackingSystemUp']));
		this.properties.push(new XdoToolBaseEventProperty('response_time', data['trackingResponseTime']));
		return this;
	}

	setSystemUp(value) {
		this.system_up = value;
		return this;
	}

	setResponseTime(value) {
		this.response_time = value;
		return this;
	}
}