/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */


/**
     @author        Paul Lucas
     @company       Salesforce
     @description   xdoToolConstantNavigation
     @date          9/2/2024

     TODO: 
 */

const NAVIGATION = {
	ACTION: {
		NEW: 'new',
		VIEW: 'view',
		EDIT: 'edit',
		LIST: 'list',
		HOME: 'home',
	},

	TYPE: {
		OBJECT_PAGE: 'standard__objectPage',
		RECORD_PAGE: 'standard__recordPage',
		NAMED_PAGE: 'standard__namedPage',
		NAV_ITEM_PAGE: 'standard__navItemPage',
		RECORD_RELATIONSHIP_PAGE: 'standard__recordRelationshipPage',
		COMPONENT: 'standard__component',
		WEB_PAGE: 'standard__webPage',
	}
}

export{
	NAVIGATION
}