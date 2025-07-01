import { LightningElement, api, track } from 'lwc';
import { EVENTS, METRIC_TYPES, CHART_TYPES, CHART_COLOURS, switchGroupings } from 'c/dbmUtils';
import CHART_ICONS from '@salesforce/resourceUrl/ChartIcons';

const CHART_DETAIL_FORMAT = {
    STRING: 'string',
    ARRAY: 'array'
}
export default class DbmPreview extends LightningElement {

    @track
    chartTypes = CHART_TYPES.map(chartType => {
        return {
            ...chartType,
            get src() {
                let suffix = (this.isActive && '_active') || (this.isDisabled && '_disabled') || '';
                return CHART_ICONS + '/' + chartType.name + suffix + '.png';
            }
        }
    });

    get chartTypesString() {
        return JSON.stringify(this.chartTypes);
    }

    @api chartTitle;
    @api
    get chartType() {
        return this._chartType;
    }
    set chartType(value) {
        this._chartType = value;
        // When the chartType changes, update the isActive property for the list of chartTypes
        this.chartTypes = this.chartTypes.map(chartType => {
            chartType.isActive = chartType.name === this.chartType;
            return chartType;
        })
    }
    _chartType;

    get chartDetails() {
        let details = this.chartTypes.find(chartType => chartType.name === this.chartType);
        if (!details) {
            return {};
        }
        details['is' + details.name] = true;
        return details;
    }

    get chartDetailsString() {
        return JSON.stringify(this.chartDetails);
    }

    @api
    get reportDetails() {
        return this._reportDetails;
    }
    set reportDetails(value) {
        this._reportDetails = JSON.parse(JSON.stringify(value));
        this.useSubgroupings = !this.reportDetails.groupings[1].isDisabled;
        this.drawChart();
        this.showChart = false;
        this.chartType = this.reportDetails.chartType;
    }
    _reportDetails;

    @api metricName;
    @api metricType;
    @api grouping1Name;
    @api grouping2Name;
    @api chartWidth;
    @api chartHeight = '500px';
    @api dontAnimate = false;
    @api showChart = false;

    @api lwccChartDetailFormat = CHART_DETAIL_FORMAT.STRING;    // I don't know if I'm going crazy but I swear the LWCC charts used to take an array (which their documentation also says). But now it seems to only work with a string, so I'm adding a property to account for that if it changes back.

    @api
    get useSubgroupings() {
        return this._useSubgroupings;
    }
    set useSubgroupings(value) {
        this._useSubgroupings = Boolean(value);
        // Set isDisabled to true for any chart types not compatible with the new value of useSubgroupings
        this.chartTypes = this.chartTypes.map(chartType => {
            chartType.isDisabled = !chartType.multiGroupings.includes(this.useSubgroupings);
            return chartType;
        });
        this.setDefaultChartType();
        this.drawChart();
    }
    _useSubgroupings = false;

    @api hideIfNoData;

    @track datasets = [];
    @track uniqueGroupings = [];
    @track uniqueSubgroupings = [];


    @api
    get chartDataString() {
        return this._chartDataString;
    }
    set chartDataString(value) {
        this._chartDataString = value;
        if (this.chartDataString) {
            this.rows = JSON.parse(value);
            this.drawChart();
        }
    }
    _chartDataString;

    get datasetsString() {
        return JSON.stringify(this.datasets);
    }


    @api
    get rows() {
        return this._rows;
    }
    set rows(value) {
        this._rows = value;
    }
    _rows = [];

    @track chartLabels = [];

    get hideChart() {
        if (!this.hideIfNoData) {
            return false;
        } else if (this.rows.length && this.rows[0].value && this.rows[0].grouping) {
            return false;
        } else {
            return true;
        }
    }

    get isDonut() {
        return this.chartDetails.isdonut;
    }

    get isStacked() {
        return this.chartType.includes('stack');
    }

    get linearAxis() {
        return !this.isDonut && (this.chartType.includes('hbar') ? 'x' : 'y');
    }

    get linearLabel() {
        return this.reportDetails.metricLabel;
    }

    get categoryAxis() {
        return !this.isDonut && (this.chartType.includes('hbar') ? 'y' : 'x');
    }

    get categoryLabel() {
        return this.reportDetails.groupings[0].name;
    }

    get legendLabel() {
        return this.isDonut ? this.reportDetails.groupings[0].name : this.reportDetails.groupings[1].name;
    }

    get displayLegend() {
        return this.isDonut || this.useSubgroupings;
    }

    connectedCallback() {
        this.setDefaultChartType();
    }

    iconSize = '40px';
    renderedCallback() {
        if (!this.showChart) {
            this.showChart = true;
        }
        this.resizeChart();
    }

    setDefaultChartType() {
        if (!this.chartType || this.chartDetails.isDisabled) {
            this.chartType = this.chartTypes.find(chartType => !chartType.isDisabled).name;
        }
    }

    handleChartTypeClick(event) {
        this.chartType = event.target.dataset.chartType;
        this.showChart = false;
        this.reportDetails.chartType = this.chartType;
        console.log(`changing reportType to ${this.reportDetails.chartType}`);
        this.dispatchEvent(new CustomEvent(EVENTS.REPORT_DETAIL_CHANGE, { detail: this.reportDetails }));
    }

    drawChart() {
        // console.log(`in dbm2preview: starting drawChart`);
        this.chartLabels = this.reportDetails.groupings[0].entries.map(groupingEntry => groupingEntry.value);
        // console.log(`dbm2preview chartLabels = ${JSON.stringify(this.chartLabels)}`);
        if (!this.useSubgroupings) {
            this.datasets = [{
                data: this.convertChartDetailsIntoLwccFormat(this.reportDetails.data.map(dataRow => dataRow[0] || 0)),
                colour: CHART_COLOURS[0]
            }]
        } else {
            this.datasets = switchGroupings(this.reportDetails).data.map((dataset, index) => {
                return {
                    label: this.reportDetails.groupings[1].entries[index]?.value,
                    data: this.convertChartDetailsIntoLwccFormat(dataset),
                    colour: CHART_COLOURS[index % CHART_COLOURS.length],
                    stack: 1
                }
            });
        }
    }


    ticksCallback = (value, index, values) => {
        if (this.reportDetails.metricType == METRIC_TYPES.CURRENCY.value) {
            return '$' + value;
        } else if (this.reportDetails.metricType == METRIC_TYPES.PERCENT.value) {
            return value + '%';
        } else {
            return value;
        }
    }

    /* UTILITY FUNCTIONS */
    // See note at `lwccChartDetailFormat`
    convertChartDetailsIntoLwccFormat(details) {
        if (this.lwccChartDetailFormat == CHART_DETAIL_FORMAT.STRING) {
            return JSON.stringify(details);
        } else {
            return details;
        }
    }

    @api
    resizeChart() {
        let componentWidth = this.template.querySelector('.previewContainer').offsetWidth;
        if (componentWidth <= 200) {
            this.iconSize = '20px';
        } else if (componentWidth <= 400) {
            this.iconSize = '30px';
        } else {
            this.iconSize = '40px';
        }
    }
}