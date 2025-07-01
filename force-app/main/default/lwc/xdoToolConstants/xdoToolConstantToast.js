/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */


/**
     @author        Paul Lucas
     @company       Salesforce
     @description   xdoToolConstantToast
     @date          9/2/2024

     TODO:
 */

const TOAST = {
	MESSAGE_TYPE: {
		ALERT: 'alert',
		CONFIRM: 'confirm',
		ERROR: 'error',
		SUCCESS: 'success',
		TICKER: 'ticker',
		TOAST: 'toast',
		WARNING: 'warning',
		FAILURE: 'Failure',
	},

	THEME: {
		DEFAULT: 'default',
		SUCCESS: 'success',
		ERROR: 'error',
		WARNING: 'warning',
		INFORMATION: 'info',
		OFFLINE: 'offline',
	},

	MODE: {
		DISMISSIBLE: 'dismissable', // Typo in LWC core
		PESTER: 'pester',
		STICKY: 'sticky',
	}
}

export {
	TOAST
}