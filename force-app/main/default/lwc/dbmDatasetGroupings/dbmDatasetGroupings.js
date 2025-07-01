import { LightningElement, api, track, wire } from 'lwc';
// import { getPicklistValues } from "lightning/uiObjectInfoApi";
import { VALIDATEABLE_COMPONENTS, NUM_GROUPINGS_OPTIONS, DATA_SOURCE_OPTIONS, KEYS, transformConstantObject } from 'c/dbmUtils';

const IDENTIFIERS = {

}
const CLASSES = {
    // SELECTED: 'slds-is-selected',
    SELECTED_ENTRY: 'selectedEntry',
    VISIBLE_INDICATOR: 'visible',
    DRAGGING: 'dragging',
}

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
export default class DbmDatasetGroupings extends LightningElement {

    @api
    get reportDetails() {
        return this._reportDetails;
    }
    set reportDetails(value) {
        this._reportDetails = JSON.parse(JSON.stringify(value));
    }
    @track _reportDetails;

    get reportDetailsString() {
        return JSON.stringify(this.reportDetails);
    }

    elementToFocusOnRerender;

    /* New cell focus management */
    get cellToFocusElement() {
        return this.template.querySelector(`.inputElement[data-grouping-index="${this.cellToFocus.groupingIndex}"][data-entry-index="${this.cellToFocus.entryIndex}"]`);
    }
    cellToFocus;

    /* Bulk add modal management */
    get bulkAddTextareaElement() {
        return this.template.querySelector('.bulkAddTextarea');
    }

    showBulkAddModal = false;
    bulkAddModalRendered = false;
    bulkAddGroupingIndex;

    dragAction;
    get dragElements() {
        // if (!this.dragAction) {
        //     return null;
        // }
        return this.dragAction && {
            indicator: this.template.querySelector(`.dragIndicator[data-grouping-index="${this.dragAction.groupingIndex}"`),
            dragRow: this.template.querySelector(`.entryRow[data-grouping-index="${this.dragAction.groupingIndex}"][data-entry-index="${this.dragAction.originIndex}"]`)
        }
    }

    /* LIFECYCLE HOOKS */
    connectedCallback() {
        window.addEventListener('dragend', this.handleDragEnd);
        let initialReportDetails = JSON.stringify(this.reportDetails);
        this.reportDetails.groupings.forEach((grouping, groupingIndex) => {
            if (!grouping.isDisabled) {
                if (grouping.presetEntries?.length) {
                    grouping.presetEntries.forEach(presetValue => {
                        this.addEntry(groupingIndex, presetValue);
                    })
                    // grouping.entries = grouping.presetEntries.map(entry => this.newEntry(entry));
                    grouping.presetEntries = [];
                }
                if (grouping.entries.length === 0) {
                    this.addEntry(groupingIndex);
                }
            }
        });
        if (initialReportDetails !== JSON.stringify(this.reportDetails)) {
            this.dispatchDetails();
        }
    }

    disconnectedCallback() {
        window.addEventListener('dragend', this.handleDragEnd);
    }

    renderedCallback() {
        // If the modal has just opened, focus on the textarea element
        if (this.bulkAddTextareaElement && !this.bulkAddModalRendered) {
            this.bulkAddTextareaElement.focus();
            this.bulkAddModalRendered = true;
        }
        if (this.cellToFocus && this.cellToFocusElement) {
            this.cellToFocusElement.focus();
            this.cellToFocus = null;
        }
        if (this.elementToFocusOnRerender) {
            this.attemptToFocus(this.elementToFocusOnRerender);
            this.elementToFocusOnRerender = null;
        }
    }

    /* ACTION FUNCTIONS */
    dispatchDetails() {
        const detail = this.reportDetails;
        this.dispatchEvent(new CustomEvent('reportdetailchange', { detail }));
    }

    closeBulkAddModal() {
        this.showBulkAddModal = false;
        this.bulkAddModalRendered = false;
        this.template.querySelector('.bulkAddEntriesButton').focus();
    }

    addEntry(groupingIndex, entryValue, ignoreFocus) {
        this.reportDetails.groupings[groupingIndex].entries.push(this.newEntry(entryValue));
        this.cellToFocus = { groupingIndex, entryIndex: this.reportDetails.groupings[groupingIndex].entries.length - 1 };
        /* Add data */
        if (this.reportDetails.groupings[groupingIndex].entries.length > 1) {
            const len1 = this.reportDetails.data.length;
            const len2 = this.reportDetails.data[0].length;
            if (groupingIndex === 0) {
                let newRow = [];
                for (let i = 0; i < len2; i++) {
                    newRow.push(null);
                }
                this.reportDetails.data.push(newRow);
            }
            if (groupingIndex === 1) {
                this.reportDetails.data.forEach(column => {
                    column.push(null);
                })
            }
        }
    }

    removeEntry(groupingIndex, entryIndex, showConfirm) {
        this.reportDetails.groupings[groupingIndex].entries.splice(entryIndex, 1);
        if (groupingIndex === 0) {
            this.reportDetails.data.splice(entryIndex, 1);
        }
        if (groupingIndex === 1) {
            this.reportDetails.data.forEach(column => {
                column.splice(entryIndex, 1);
            })
        }
    }

    reorderEntries(groupingIndex, originIndex, targetIndex) {
        let entries = this.reportDetails.groupings[groupingIndex].entries;
        let movingEntry = entries.splice(originIndex, 1)[0];
        if (originIndex < targetIndex) {
            targetIndex--;
        }
        entries.splice(targetIndex, 0, movingEntry);        
        if (groupingIndex === 0) {
            let movingRow = this.reportDetails.data.splice(originIndex, 1)[0];
            this.reportDetails.data.splice(targetIndex, 0, movingRow);
        } else if (groupingIndex === 1) {
            this.reportDetails.data.forEach(row => {
                let movingCell = row.splice(originIndex, 1)[0];
                row.splice(targetIndex, 0, movingCell);
            })
        }        
        this.dispatchDetails();
    }

    addEnumerations(groupingIndex) {
        let grouping = this.reportDetails.grouping[groupingIndex];
        grouping.entries.forEach((entry, index) => {
            // entry.number = Number(index) + 1;
            let letter = ALPHABET.charAt(index);
            if (index > ALPHABET.length-1) {
                letter = ALPHABET.charAt(ALPHABET.length-1) + (1 + index - ALPHABET.length);
            }
            entry.value = `${letter}. ${entry.value}`;
        })
    }

    removeEnumerations(groupingIndex) {
        let grouping = this.reportDetails.grouping[groupingIndex];
        grouping.entries.forEach((entry, index) => {
            
        });
    }

    /* EVENT HANDLERS */
    handleAddEntryClick(event) {
        let index = Number(event.target.dataset.index);
        this.addEntry(index);
        this.dispatchDetails();
    }

    handleEntryRecordChange(event) {
        let eventData = this.getDataFromEvent(event);
        eventData.entry.recordId = event.detail.value;
        eventData.entry.value = event.detail.selectedRecord?.label;
        this.dispatchDetails();
    }

    handleEntryTextChange(event) {
        let eventData = this.getDataFromEvent(event);
        eventData.entry.value = event.detail.value;
        this.dispatchDetails();
    }

    handleEntryDeleteClick(event) {
        let eventData = this.getDataFromEvent(event);
        this.removeEntry(eventData.groupingIndex, eventData.entryIndex);
        if (eventData.grouping.entries.length === 0) {
            this.addEntry(eventData.groupingIndex);
        }
        this.dispatchDetails();
    }

    handleBulkAddClick(event) {
        this.bulkAddGroupingIndex = Number(event.target.dataset.index);
        this.showBulkAddModal = true;
    }

    handleBulkAddModalKeydown(event) {
        if (event.keyCode == KEYS.ESCAPE) {
            this.closeBulkAddModal();
        }
    }

    handleBulkAddModalSaveClick() {
        let lines = this.bulkAddTextareaElement.value.split(/\n/);
        let grouping = this.reportDetails.groupings[this.bulkAddGroupingIndex];
        let lineCount = 0;
        lines.forEach(line => {
            if (line) {
                this.addEntry(this.bulkAddGroupingIndex, line);
                lineCount++;
            }
        });
        // If the bulk add was done with a blank first entry, remove that entry after the bulk add
        if (grouping.entries.length === lineCount + 1 && !grouping.entries[0].value) {
            this.removeEntry(this.bulkAddGroupingIndex, 0);
        }
        this.closeBulkAddModal();
        this.dispatchDetails();
    }

    handleGroupingNumberClick(event) {
        // const index = Number(event.target.dataset.index);
        // this.reportDetails.groupings[index].enumerate = !this.reportDetails.groupings[index].enumerate;
        let eventData = this.getDataFromEvent(event);
        eventData.grouping.enumerate = !eventData.grouping.enumerate;
        // console.log('about to dispatch handleGroupingNumberClick');
        if (eventData.grouping.enumerate) {
            this.addEnumerations(eventData.groupingIndex);
        } else {
            this.removeEnumerations(eventData.groupingIndex);
        }
        this.dispatchDetails();
    }

    handleEntryDragStart(event) {
        this.dragAction = {
            groupingIndex: Number(event.target.dataset.groupingIndex),
            originIndex: Number(event.target.dataset.entryIndex),
        }
        event.dataTransfer.setData("text/plain", JSON.stringify(this.dragAction));
        this.dragElements.dragRow.classList.add(CLASSES.DRAGGING);
    }

    handleEntryDragOver(event) {
        event.preventDefault();
        event.stopPropagation();
        let entryIndex = Number(event.currentTarget.dataset.entryIndex);
        // Only take dragover action if the dragged item is in the same groupingIndex and isn't being dragged over itself
        if (event.currentTarget.dataset.groupingIndex == this.dragAction.groupingIndex && entryIndex != this.dragAction.originIndex) {
            let rect = event.currentTarget.getBoundingClientRect();
            let offset = 0.25 * parseFloat(getComputedStyle(document.documentElement).fontSize);    // Converting rem to px. 0.25 is half the size of x-small padding
            let baselineY = this.template.querySelector('.entriesContainer').getBoundingClientRect().top;
            if (event.clientY < rect.top + rect.height / 2) {
                if (entryIndex !== this.dragAction.originIndex + 1) {
                    this.dragAction.targetIndex = entryIndex;
                    this.dragElements.indicator.style.top = `${rect.top - baselineY - offset - 1}px`; // -1 was just through trial and error
                }
            } else {
                if (entryIndex !== this.dragAction.originIndex - 1) {
                    this.dragAction.targetIndex = entryIndex + 1;
                    this.dragElements.indicator.style.top = `${rect.bottom - baselineY + offset - 1}px`; // -1 was just through trial and error
                }
            }
            this.dragElements.indicator.classList.add(CLASSES.VISIBLE_INDICATOR);
        }
    }

    handleEntryDragLeave(event) {
        this.dragElements.indicator.classList.remove(CLASSES.VISIBLE_INDICATOR);
        this.dragAction.targetIndex = undefined;
    }

    handleDragEnd = () => {
        this.dragElements.indicator.classList.remove(CLASSES.VISIBLE_INDICATOR);
        this.dragElements.dragRow.classList.remove(CLASSES.DRAGGING);
        if (this.dragAction.targetIndex >= 0) {
            this.reorderEntries(this.dragAction.groupingIndex, this.dragAction.originIndex, this.dragAction.targetIndex);            
        }
    }

    /* UTILITY FUNCTIONS */
    getDataFromEvent(event) {
        const groupingIndex = Number(event.target.dataset.groupingIndex);
        const entryIndex = Number(event.target.dataset.entryIndex);
        let grouping = this.reportDetails.groupings[groupingIndex];
        let entry;
        if (grouping && grouping.entries) {
            entry = grouping.entries[entryIndex];
        }
        let data = {
            groupingIndex,
            entryIndex,
            grouping,
            entry
        };
        return data;

    }

    newEntry(value) {
        return {
            value
        };
    }

    @api validate() {
        let allValid = true;
        for (let tagName of VALIDATEABLE_COMPONENTS) {
            for (let el of this.template.querySelectorAll(tagName)) {
                allValid = el.reportValidity() && allValid;
            }
        }
        return allValid;
    }

    attemptToFocus(element) {
        if (element) {
            element.focus();
        }
    }

    /* Dead code from when I thought we were going to do an up/down reordering of entries rather than drag and drop */
    /*
    moveEntry() {
        let movingEntry = this.reorderAction.entries.splice(this.reorderAction.selectedEntryIndex, 1)[0];
        this.reorderAction.entries.splice(this.reorderAction.newEntryIndex, 0, movingEntry);
        this.reorderAction.selectedEntryIndex = this.reorderAction.newEntryIndex;
        this.reorderAction = this.reorderAction;
    }

    handleReorderClick(event) {
        let groupingIndex = Number(event.target.dataset.index);
        this.reorderAction = {
            groupingIndex,
            entries: [...this.reportDetails.groupings[groupingIndex].entries]
        }
        // this.selectedGroupingIndex = Number(event.target.dataset.index);
        // this.entriesToReorder = [...this.reportDetails.groupings[this.selectedGroupingIndex].entries];
        // this.showReorderModal = true;
    }

    handleReorderModalCancel() {
        this.reorderAction = null;
        // this.showReorderModal = false;
        // this.selectedGroupingIndex = null;
        // this.selectedEntryIndex = null;
        // this.entriesToReorder = [];
    }

    handleReorderModalConfirm() {
        // this.reportDetails.groupings[this.selectedGroupingIndex].entries = [...this.entriesToReorder];
        this.reportDetails.groupings[this.reorderAction.groupingIndex].entries = [...this.reorderAction.entries];
        if (this.reorderAction.groupingIndex === 0) {
            console.log(`starting data = ${this.reportDetails.data}`);
            let movingRow = this.reportDetails.data.splice(this.reorderAction.originalEntryIndex, 1)[0];
            console.log(`in process data = ${this.reportDetails.data}`);
            this.reportDetails.data.splice(this.reorderAction.newEntryIndex, 0, movingRow);
            console.log(`finished data = ${this.reportDetails.data}`);
            // let movingEntry = this.entriesToReorder.splice(originIndex, 1)[0];
            // this.entriesToReorder.splice(newIndex, 0, movingEntry);
            // this.selectedEntryIndex = newIndex;

        }
        this.reorderAction = null;
        // this.showReorderModal = false;
        // this.selectedGroupingIndex = null;
        // this.selectedEntryIndex = null;
        // this.entriesToReorder = [];
        this.dispatchDetails();
    }

    handleReorderEntryClick(event) {
        this.reorderAction = {
            ...this.reorderAction,
            originalEntryIndex: Number(event.currentTarget.dataset.index),
            selectedEntryIndex: Number(event.currentTarget.dataset.index),
        };
        let entryEls = this.template.querySelectorAll('.entryToReorder');
        [...entryEls].forEach((el, index) => {
            if (index === this.reorderAction.selectedEntryIndex) {
                el.classList.add(CLASSES.SELECTED_ENTRY);
                el.setAttribute('aria-selected', 'true');
            } else {
                el.classList.remove(CLASSES.SELECTED_ENTRY);
                el.setAttribute('aria-selected', 'false');
            }
        });
    }

    handleMoveEntryToTopClick() {
        if (this.reorderAction.selectedEntryIndex > 0) {
            this.reorderAction.newEntryIndex = 0;
            this.moveEntry();
            // this.moveEntry(this.selectedEntryIndex, 0);
        }
    }

    handleMoveEntryUpClick() {
        if (this.reorderAction.selectedEntryIndex > 0) {
            this.reorderAction.newEntryIndex = this.reorderAction.selectedEntryIndex - 1;
            this.moveEntry();
            // this.moveEntry(this.selectedEntryIndex, this.selectedEntryIndex - 1);
        }
    }

    handleMoveEntryDownClick() {
        if (this.reorderAction.selectedEntryIndex < this.reorderAction.entries.length - 1) {
            this.reorderAction.newEntryIndex = this.reorderAction.selectedEntryIndex + 1;
            this.moveEntry();
            // this.moveEntry(this.selectedEntryIndex, this.selectedEntryIndex + 1);
        }
    }

    handleMoveEntryToBottomClick() {
        if (this.reorderAction.selectedEntryIndex < this.reorderAction.entries.length - 1) {
            this.reorderAction.newEntryIndex = this.reorderAction.entries.length - 1;
            this.moveEntry();
            // this.moveEntry(this.selectedEntryIndex, this.entriesToReorder.length - 1);
        }
    }
    */
}