/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */


/**
     @author        Paul Lucas
     @company       Salesforce
     @description   Common JS
     @date          15/5/21

     TODO:
 		- Refactor into categories
 */

const TRUTHY_VALUES = [true, 'true', 1];

import {ShowToastEvent} from "lightning/platformShowToastEvent";

/**
 * Show a toast
 * @param caller
 * @param title
 * @param message
 * @param messageData
 * @param variant
 * @param mode
 */
const showToast = (caller, title, message, messageData, variant, mode) => {
	caller.dispatchEvent(new ShowToastEvent({
		'title': title.charAt(0).toUpperCase() +
			title.substr(1).toLowerCase(),
		'message': message,
		'messageData': messageData,
		'variant': variant,
		'mode': mode,
	}));
};

/**
 * https://github.com/ai/nanoid
 *
 * @param t
 * @returns {string}
 */
const nanoId = (t = 21) => {
	let e = '', r = crypto.getRandomValues(new Uint8Array(t));
	for (; t--;) {
		let n = 63 & r[t];
		e += n < 36 ? n.toString(36) : n < 62 ? (n - 26).toString(
			36).toUpperCase() : n < 63 ? '_' : '-';
	}
	return e;
};

/**
 * Return the object type
 * @param object
 * @returns {string}
 */
const type = (object) => {
	return Object.prototype.toString.apply(object).replace(/\[object (.+)\]/i, '$1').toLowerCase();
};

/**
 * Attempt to parse and log an object
 * @param object
 */
const log = (object) => {
	try {
		// switch (type(object)) {
		// 	case 'string':
		// 		console.log(object);
		// 		break;
		// 	case 'object':
		// 		console.log(object);
		// 		break;
		//
		// 	default:
		// 		console.log(JSON.parse(JSON.stringify(object)));
		// }

		console.log(`>>>>> ${object}`);
		console.log(JSON.parse(JSON.stringify(object)));
	} catch (e) {
		console.error(e);
		console.log('>>>>> Falling back: ');
		console.log(object);
	}
};

/**
 * Convert a dictionary to a list
 * @param dictionary
 * @returns {[]}
 */
const dictionaryToList = (dictionary) => {
	// TODO: Check for object
	let items = Object.values(dictionary);

	// TODO: Type every item?
	return items.reduce((a, b) => a.concat(b)); // .map(i => new item(i));
};

/**
 * Convert a list to a tree hierarchy
 * @param dataset
 * @returns {[]}
 */
const listToTree = (dataset) => {
	let hashTable = Object.create(null),
		dataTree = [];

	hashTable = dataset.reduce(
		(obj, item) => (obj[item.id] = item, obj), hashTable);

	dataset.forEach(item => {
		if (item.folder) {
			hashTable[item.folder].children.push(hashTable[item.id]);
		} else {
			dataTree.push(hashTable[item.id]);
		}
	});

	return dataTree;
};

/**
 * Deep clone an array
 * @param a
 * @param fn
 * @returns {any[]}
 */
const cloneArray = (a, fn) => {
	let keys = Object.keys(a);
	let a2 = new Array(keys.length);

	for (let i = 0; i < keys.length; i++) {
		let k = keys[i];
		let cur = a[k];
		if (typeof cur !== 'object' || cur === null) {
			a2[k] = cur;
		} else if (cur instanceof Date) {
			a2[k] = new Date(cur);
		} else {
			a2[k] = fn(cur);
		}
	}
	return a2;
};

/**
 * Camel or Pascal case to snake case
 * @param str
 * @returns {string}
 */
const camelToSnake = str => str.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();

/**
 * Deep clone an object
 * @param o
 * @returns {{}|*[]|Date|*}
 */
const clone = (o) => {
	if (typeof o !== 'object' || o === null) return o;
	if (o instanceof Date) return new Date(o);
	if (Array.isArray(o)) return cloneArray(o, clone);
	let o2 = {};

	for (let k in o) {
		if (Object.hasOwnProperty.call(o, k) === false) continue;

		let cur = o[k];

		if (typeof cur !== 'object' || cur === null) {
			o2[k] = cur;
		} else if (cur instanceof Date) {
			o2[k] = new Date(cur);
		} else {
			o2[k] = clone(cur);
		}
	}
	return o2;
};

/**
 * Reduces one or more errors into a string[] of error messages.
 * @param {errorResponse|errorResponse[]} errors
 * @return {String[]} Error messages
 *
 * TODO: Refactor conditioning
 */
const reduceErrors = (errors) => {
	if (!Array.isArray(errors)) {
		errors = [errors];
	}

	return errors.filter(Boolean).map((error) => {
		if (Array.isArray(error.body)) {
			return error.body.map((b) => b.message);
		} else if (error.body && isString(error.body.message)) {
			return error.body.message;
		} else if (isString(error.message)) {
			return error.message;
		} else if (isString(error.statusText)) {
			return error.statusText;
		} else {
			return error;
		}
	}).reduce((prev, curr) => prev.concat((curr) ? curr.replace(/(<([^>]+)>)/gi, '') : ''),
		[]).filter(Boolean);
};

/**
 * True if value is typeof string
 * @param value
 * @returns {boolean}
 */
const isString = (value) => {
	return typeof value === 'string';
};

/**
 * Dynamic string replacement
 * @param str
 * @param obj
 */
const interpolate = (str, obj) => {
	return str.replace(/\${(.*?)}/g, (match, captured) => obj[captured]);
};

/**
 * A random integer between two values, inclusive
 * @param min
 * @param max
 */
const getRandomIntInclusive = (min, max) => {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min + 1) + min); // The maximum is inclusive and the minimum is inclusive
}

/**
 * Boolean true if a value is an opinionated truthy
 * @param value
 * @returns {boolean}
 */
const isTrue = (value) => {
	return TRUTHY_VALUES.some(function (t) {
		return t === value;
	});
}

/**
 * Test if a value is of type boolean
 * @param value
 * @returns {boolean}
 */
const isBoolean = value => 'boolean' === typeof value;

/**
 * Return a CustomEvent invocation function
 * @param eventProps
 * @param eventType
 * @param eventCategory
 * @returns {function(methodName, methodArgs): Promise<unknown>}
 */
const eventEmitter = (eventProps, eventType, eventCategory) => {
	return (methodName, methodArgs) => {
		console.log('>>>>> call eventEmitter.methodName: ' + methodName);
		return new Promise((resolve, reject) => {
			const eventInit = {
				detail: {
					category: eventCategory,
					methodName: methodName,
					methodArgs: methodArgs,
					callback: (err, response) => {
						return (err) ? reject(err) : resolve(response);
					}
				}, ...eventProps
			};

			window.dispatchEvent(new CustomEvent(eventType, eventInit));
		});
	}
}

/**
 * Return an encapsulated CustomEvent invocation function
 * @param eventType
 * @param eventCategory
 * @returns {function(methodName, methodArgs): Promise<unknown>}
 */
const eventEmitterMin = (eventType, eventCategory) => {
	return eventEmitter({
		bubbles: false,
		composed: false,
		cancelable: false,
	}, eventType, eventCategory)
}

/**
 * Async await wrapper for error handling
 * https://www.npmjs.com/package/await-to-js
 *
 * @param promise
 * @returns {Promise<any>}
 */
const to = promise => promise.then(res => [null, res]).catch(err => [err || true, null]);

export {
	camelToSnake,
	clone,
	cloneArray,
	dictionaryToList,
	eventEmitter,
	eventEmitterMin,
	getRandomIntInclusive,
	interpolate,
	isBoolean,
	isTrue,
	listToTree,
	log,
	nanoId,
	reduceErrors,
	showToast,
	to,
	type
};