import { LightningElement, api, track } from 'lwc';

const PATH_ITEM_CLASSES = {
    BASE: 'slds-path__item',
    CURRENT: 'slds-is-active',
    COMPLETE: 'slds-is-complete',
    // COMPLETE: 'slds-theme_success',
    INCOMPLETE: 'slds-is-incomplete',
}


export default class StagePath extends LightningElement {
    @api 
    get stages() {
        return this._stages;
    }
    set stages(value) {
        if (Array.isArray(value)) {
            this._stages = value.map(stage => {
                return {...stage}
            });                
            this.updateStages();
        } else {
            this._stages = [];
        }
    }
    @track _stages = [];
    @api clickedStage;
    @api enableNavigation = false;


    @api
    get currentStageIndex() {
        return parseInt(this._currentStageIndex, 10) || 0;
    }
    set currentStageIndex(value) {
        // console.log(`in set currentStageIndex, currentStageIndex = ${JSON.stringify(value)}`);        
        this._currentStageIndex = value;
        this.updateStages();
    }
    _currentStageIndex;

    get currentStage() {
        if (this.stages.length) {
            return this.stages[this.currentStageIndex];
        } else {
            return {}
        }
    }

    connectedCallback() {
        if (this.stages.length == 0) {
            console.log('StagePath error: no stages provided');
            return;
        }
    }

    updateStages() {
        // console.log(`in updateStages, currentStageIndex = ${this.currentStageIndex}`);
        this.stages.forEach((stage, index) => {
            let classList = [PATH_ITEM_CLASSES.BASE];
            stage.isCurrent = index == this.currentStageIndex;
            stage.isComplete = index < this.currentStageIndex;
            if (stage.isCurrent) {
                classList.push(PATH_ITEM_CLASSES.CURRENT);
            } else if (stage.isComplete) {
                classList.push(PATH_ITEM_CLASSES.COMPLETE);
            } else {
                classList.push(PATH_ITEM_CLASSES.INCOMPLETE);
            }
            stage.classString = classList.join(' ');
            // console.log(`concluding stage = ${JSON.stringify(stage)}`);
        });
    }

    handleStageClick(event) {
        if (this.enableNavigation) {
            this.currentStageIndex = event.currentTarget.dataset.index;
            // const clickedIndex = event.currentTarget.dataset.index;
            // this.clickedStage = this.stages[clickedIndex].label;
            const detail = {
                index: this.currentStageIndex
            }
            const stageclickEvent = new CustomEvent("stageclick", { detail });
            this.dispatchEvent(stageclickEvent);
        }
    }

    newStage(stage, isCurrent) {
        return {
            ...stage,
            isCurrent: isCurrent,
            get classString() {
                let classes = [PATH_ITEM_CLASSES.BASE];
                if (this.isCurrent) {
                    classes.push(PATH_ITEM_CLASSES.CURRENT);
                } else if (this.isComplete) {
                    classes.push(PATH_ITEM_CLASSES.COMPLETE);
                } else {
                    classes.push(PATH_ITEM_CLASSES.INCOMPLETE)
                }
                return classes.join(' ');
            }
        }
    }
}