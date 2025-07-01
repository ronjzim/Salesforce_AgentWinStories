/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */


/**
     @author        Paul Lucas
     @company       Salesforce
     @description   api
     @date          9/2/2024

     TODO:
 */

const API = {
	METHOD: {
		NAVIGATION: {
			FOCUS_NAVIGATION_ITEM: 'focusNavigationItem',
			// TODO: https://developer.salesforce.com/docs/atlas.en-us.api_console.meta/api_console/sforce_api_console_methods_lightning_navigationItemAPI.htm
		},
		WORKSPACE: {
			ADD_TO_BROWSER_TITLE_QUEUE: 'addToBrowserTitleQueue',
			CLOSE_TAB: 'closeTab',
			DISABLE_TAB_CLOSE: 'disableTabClose',
			FOCUS_TAB: 'focusTab',
			GENERATE_CONSOLE_URL: 'generateConsoleUrl',
			GET_ALL_TAB_INFO: 'getAllTabInfo',
			GET_ENCLOSING_TAB_ID: 'getEnclosingTabId',
			GET_FOCUSED_TAB_INFO: 'getFocusedTabInfo',
			GET_TAB_INFO: 'getTabInfo',
			GET_TAB_URL: 'getTabURL',
			IS_CONSOLE_NAVIGATION: 'isConsoleNavigation',
			IS_SUB_TAB: 'isSubtab',
			OPEN_CONSOLE_URL: 'openConsoleUrl',
			OPEN_SUB_TAB: 'openSubtab',
			OPEN_TAB: 'openTab',
			REFRESH_TAB: 'refreshTab',
			REMOVE_FROM_BROWSER_TITLE_QUEUE: 'removeFromBrowserTitleQueue',
			SET_TAB_HIGHLIGHTED: 'setTabHighlighted',
			SET_TAB_ICON: 'setTabIcon',
			SET_TAB_LABEL: 'setTabLabel',
		},

		UTILITY_BAR: {
			DISABLE_UTILITY_POPOUT: 'disableUtilityPopOut',
			// TODO: https://developer.salesforce.com/docs/atlas.en-us.api_console.meta/api_console/sforce_api_console_lightning_disableUtilityPopOut.htm
		},

		CHAT: {
			END_CHAT: 'endChat',
			// TODO: https://developer.salesforce.com/docs/atlas.en-us.api_console.meta/api_console/sforce_api_console_lightning_endChat.htm
		},

		OMNI: {
			ACCEPT_AGENT_WORK: 'acceptAgentWork',
			// TODO: https://developer.salesforce.com/docs/atlas.en-us.api_console.meta/api_console/sforce_api_console_lightning_acceptagentwork.htm
		}
	}
}

export {
	API
}