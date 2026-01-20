import { LightningElement, api, wire } from 'lwc';
import { getRecord, getFieldValue } from 'lightning/uiRecordApi';

// Exact API Names provided
const FIELD_CURRENT_SAP = 'Asset.Current_SAP_Score__c';
const FIELD_TARGET_SAP = 'Asset.Target_SAP__c';
const FIELD_TARGET_BAND = 'Asset.Target_EPC_Band__c';

const FIELDS = [FIELD_CURRENT_SAP, FIELD_TARGET_SAP, FIELD_TARGET_BAND];

export default class EnergyCert extends LightningElement {
    @api recordId;

    currentScore = null;
    potentialScore = null;
    targetBandLetter = null;

    // Standard SAP Rating bands
    // min/max values define where the score arrows appear
    baseBands = [
        { label: 'A', min: 92, max: 999, colorClass: 'band-a', width: '35%' },
        { label: 'B', min: 81, max: 91,  colorClass: 'band-b', width: '40%' },
        { label: 'C', min: 69, max: 80,  colorClass: 'band-c', width: '45%' },
        { label: 'D', min: 55, max: 68,  colorClass: 'band-d', width: '50%' },
        { label: 'E', min: 39, max: 54,  colorClass: 'band-e', width: '55%' },
        { label: 'F', min: 21, max: 38,  colorClass: 'band-f', width: '60%' },
        { label: 'G', min: 0,  max: 20,  colorClass: 'band-g', width: '65%' }
    ];

    @wire(getRecord, { recordId: '$recordId', fields: FIELDS })
    assetRecord({ error, data }) {
        if (data) {
            this.currentScore = getFieldValue(data, FIELD_CURRENT_SAP);
            this.potentialScore = getFieldValue(data, FIELD_TARGET_SAP);
            this.targetBandLetter = getFieldValue(data, FIELD_TARGET_BAND);
        } else if (error) {
            console.error('Error loading Asset fields', error);
        }
    }

    get bands() {
        return this.baseBands.map(band => {
            // SAFEGUARD: Round inputs to handle decimals (e.g. 68.5)
            // preventing them from falling into "gaps" between integer bands.
            const cScore = this.currentScore != null ? Math.round(this.currentScore) : null;
            const pScore = this.potentialScore != null ? Math.round(this.potentialScore) : null;

            // 1. Check if we should show the "Current" arrow
            const showCurrent = cScore != null && 
                                cScore >= band.min && 
                                cScore <= band.max;

            // 2. Check if we should show the "Potential" arrow
            const showPotential = pScore != null && 
                                  pScore >= band.min && 
                                  pScore <= band.max;

            // 3. Check if this is the "Target Band"
            const isTargetBand = this.targetBandLetter === band.label;

            // POLISH: Display "92+" for Band A instead of "92-999"
            const rangeDisplay = band.label === 'A' ? '92+' : `${band.min}-${band.max}`;

            return {
                ...band,
                rangeText: `(${rangeDisplay})`,
                
                showCurrentArrow: showCurrent,
                showPotentialArrow: showPotential,
                showTargetMarker: isTargetBand,

                barClass: `bar ${band.colorClass}`,
                arrowClass: `arrow-shape ${band.colorClass}`,
                style: `width: ${band.width};`
            };
        });
    }
}