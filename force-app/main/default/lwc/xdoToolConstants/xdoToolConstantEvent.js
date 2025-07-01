/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */


/**
     @author        Paul Lucas
     @company       Salesforce
     @description   xdoToolConstantEvent
     @date          9/2/2024

     TODO: 
 */

const EVENT = {
	TYPE: {
		INTERNAL_API_EVENT: 'internalapievent',
		EXECUTE_MACRO: 'executemacro',
	},

	CATEGORY: {
		WORKSPACE_API: 'workspaceAPI',
		UTILITY_BAR_API: 'utilityBarAPI',
		OMNI_API: 'omniAPI',
		EMP_API: 'empApi', // Check casing empAPI?
		NAVIGATION_API: 'navigationApi', // Check this exists
	}
}

export {
	EVENT
}