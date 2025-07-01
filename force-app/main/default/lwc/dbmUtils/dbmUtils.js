const MAX_NUM_GROUPINGS = 2;
const NAMESPACE = 'dbm2';

// const DEFAULT_REPORT_FOLDER_NAME = 'DBM Reports';

const PREVIEW_PANE_SIZES = {
    HIDDEN: 'hidden',
    SMALL: 'small',
    LARGE: 'large'
}

const METRIC_TYPES = {
    NUMBER: { label: 'Number', value: 'number', default: true },
    CURRENCY: { label: 'Currency', value: 'currency' },
    PERCENT: { label: 'Percent', value: 'percent-fixed' },
}

const METRIC_NAMES = {
    CUSTOM: { label: '--Custom--', value: 'custom' },
    RECORD_COUNT: { label: 'Record Count', value: 'recordCount', default: true },
    REVENUE: { label: 'Revenue', value: 'revenue' },
    AMOUNT: { label: 'Amount', value: 'amount' },
    QUANTITY: { label: 'Quantity', value: 'quantity' },
}

const NUM_GROUPINGS_OPTIONS = [
    { label: 'One', value: '1' },
    { label: 'Two', value: '2' },
];

const DATA_SOURCE_OPTIONS = {
    CUSTOM: { label: 'Custom Text (default)', value: 'custom', grouping: 'Free Text', default: true },
    USER: { label: 'Users', value: 'user', grouping: 'Pull from Salesforce' },
    SOBJECT: { label: 'sObject Records', value: 'sobject', grouping: 'Pull from Salesforce' },
    PICKLIST: { label: 'Picklist Field Values', value: 'picklist', grouping: 'Pull from Salesforce' },
    MONTHS: { label: 'Months (Jan-Dec)', value: 'months', grouping: 'Preset Values', presetEntries: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'] },
    QUARTERS: { label: 'Quarters (Q1-Q4)', value: 'quarters', grouping: 'Preset Values', presetEntries: ['Q1', 'Q2', 'Q3', 'Q4'] },
    PRIORITIES: { label: 'Priorities (Low-Critical)', value: 'priorities', grouping: 'Preset Values' },
};

const EVENTS = {
    NAVIGATE: 'navigate',
    REPORT_DETAIL_CHANGE: 'reportdetailchange',    
    COPY_TO_CLIPBOARD: 'copy',
    REFRESH_RECORDS: 'refreshrecords',
    SPINNER_CHANGE: 'spinnerchange',
    OPEN_REPORT: 'openreport',
    TARGETS: {
        LIST_VIEW: 'listView',
        DATASET_BUILDER: 'datasetBuilder'
    }
}

const CHART_TYPES = [
    { label: 'Vertical Bar Chart', style: 'bar', name: 'vbar', multiGroupings: [true, false] },
    { label: 'Stacked Vertical Bar Chart', style: 'bar', name: 'stackvbar', multiGroupings: [true] },
    { label: 'Horizontal Bar Chart', style: 'horizontalBar', name: 'hbar', multiGroupings: [true, false] },
    { label: 'Stacked Horizontal Bar Chart', style: 'horizontalBar', name: 'stackhbar', multiGroupings: [true] },
    { label: 'Pie Chart', style: 'pie', name: 'donut', multiGroupings: [false] },
];

const CHART_COLOURS = [
    '#1b96ff',
    '#ad7bee',
    '#ff538a',
    '#ff5d2d',
    '#ca8501',
    '#06a59a',
    '#7f8ced',
    '#cb65ff',
    '#fe5c4c',
    '#dd7a01',
    '#3ba755',
    '#0d9dda'
];

const KEYS = {
    ESCAPE: 27,
    BACKSPACE: 8,
    DELETE: 46
}

const VALIDATEABLE_COMPONENTS = ['input', 'lightning-input', 'lightning-combobox', 'lightning-checkbox', 'lightning-dual-listbox', 'lightning-radio-group', 'lightning-slider', 'c-fsc_object-field-selector', 'c-fsc_combobox', 'c-fsc_lookup'];

const defaultReportDetails = () => {
    let reportDetails = {
        maxNumGroupings: MAX_NUM_GROUPINGS,
        numGroupings: '1',
        metricType: transformConstantObject(METRIC_TYPES).default.value,
        metricName: transformConstantObject(METRIC_NAMES).default.value,
        groupings: [],
        data: [[null]],
        chartType: CHART_TYPES[0].name
    }
    for (let i = 0; i < MAX_NUM_GROUPINGS; i++) {
        reportDetails.groupings.push(newGrouping(i));
    }
    return reportDetails;
}

const newGrouping = (index) => {
    let newGrouping = {
        dataSource: transformConstantObject(DATA_SOURCE_OPTIONS).default.value,
        entries: [],
        presetEntries: []
    };
    return newGrouping;
}

const switchGroupings = (reportDetails) => {
    reportDetails = JSON.parse(JSON.stringify(reportDetails));
    let tempGrouping = JSON.parse(JSON.stringify(reportDetails.groupings[0]));
    reportDetails.groupings[0] = JSON.parse(JSON.stringify(reportDetails.groupings[1]));
    reportDetails.groupings[1] = tempGrouping;
    let datasets = [[]];
    if (reportDetails.data.length) {
        datasets = reportDetails.data[0].map(row => []);
    }
    // console.log(`datasets = ${JSON.stringify(datasets)}`);
    reportDetails.data.forEach(row => {
        row.forEach((cell, colIndex) => {
            datasets[colIndex].push(cell);
        })
    })
    reportDetails.data = datasets;
    return reportDetails;
}

const validate = () => {
    let allValid = true;
    for (let tagName of VALIDATEABLE_COMPONENTS) {
        for (let el of this.template.querySelectorAll(tagName)) {
            allValid = allValid && el.reportValidity();
        }
    }
    return allValid;
}


const transformConstantObject = (constant) => {
    return {
        list: constant,
        get options() { return Object.values(this.list); },
        get default() { return this.options.find(option => option.default) || this.options[0]; },
        findFromValue: function (value) {
            let entry = this.options.find(option => option.value == value);
            return entry || this.default;
        },
        findFromLabel: function (label) {
            let entry = this.options.find(option => option.label == label);
            return entry || this.default;
        }
    }
}

export { NAMESPACE, PREVIEW_PANE_SIZES, METRIC_TYPES, METRIC_NAMES, NUM_GROUPINGS_OPTIONS, DATA_SOURCE_OPTIONS, EVENTS, CHART_TYPES, CHART_COLOURS, VALIDATEABLE_COMPONENTS, KEYS, defaultReportDetails, newGrouping, switchGroupings, validate, transformConstantObject };