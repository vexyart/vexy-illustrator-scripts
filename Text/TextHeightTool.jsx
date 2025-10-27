/**
 * Text Height Tool
 * @version 1.0.0
 * @description Calculate and adjust text height based on vectorized capital "H" measurements
 * @author Original: Christian Condamine (christian.condamine@laposte.net)
 *         Modernized for AIS by Adam (2025)
 * @license MIT
 * @category Text
 * @requires Illustrator CS4 or higher
 *
 * Features:
 * - Measures physical height of text by vectorizing capital "H"
 * - Calculates scale factor to achieve target height
 * - Optionally applies transformation to selection
 * - Copies scale factor to clipboard for manual application
 * - Supports mm, inches, and pixels
 *
 * Original: Christian Condamine - Hauteur_Texte.jsx
 * Modernized to use AIS library, English-only UI, and improved workflow
 */

#include "../lib/core.jsx"

//@target illustrator
app.preferences.setBooleanPreference('ShowExternalJSXWarning', false);

// ============================================================================
// ENTRY POINT
// ============================================================================

(function() {
    if (!app.documents.length) {
        alert('No documents\nOpen a document and try again');
        return;
    }

    var selection = app.activeDocument.selection;

    if (!selection.length || selection[0].typename !== 'TextFrame') {
        alert('Invalid selection\nPlease select a text object (not vectorized)\nUse the Direct Selection tool if text is grouped');
        return;
    }

    try {
        main();
    } catch (err) {
        AIS.Error.show('Text Height Tool', err);
    }
})();

// ============================================================================
// CONFIGURATION
// ============================================================================

var CFG = {
    scriptName: 'Text Height Tool',
    scriptVersion: '1.0.0',
    testChar: 'H',  // Character used for height measurement
    units: ['mm', 'inches', 'pixels']
};

// Global state
var currentHeight = 0;
var currentHeightPx = 0;
var currentUnit = '';
var currentUnitCoeff = 1;

// ============================================================================
// MAIN FUNCTION
// ============================================================================

function main() {
    var doc = app.activeDocument;
    var textFrame = doc.selection[0];

    // Get current text unit preferences
    var textUnitPref = app.preferences.getIntegerPreference('text/units');
    var unitInfo = decodeTextUnit(textUnitPref);
    currentUnit = unitInfo.text;
    currentUnitCoeff = unitInfo.coeff;

    // Measure current height
    var measurement = measureTextHeight(textFrame);
    currentHeightPx = measurement.heightPx;
    currentHeight = measurement.height;

    // Show dialog 1: Current height + target height input
    var targetHeight = showHeightDialog();

    if (targetHeight !== null && targetHeight.value !== '') {
        // Calculate scale factor
        var scalePercent = calculateScaleFactor(
            currentHeightPx,
            targetHeight.value,
            targetHeight.unit
        );

        // Show dialog 2: Scale factor + apply/copy options
        showTransformDialog(scalePercent, targetHeight, textFrame);
    }
}

// ============================================================================
// MEASUREMENT
// ============================================================================

/**
 * Measure text height by vectorizing capital H
 * @param {TextFrame} textFrame - Text frame to measure
 * @returns {Object} Object with heightPx and height properties
 */
function measureTextHeight(textFrame) {
    // Duplicate text frame
    var tempText = textFrame.duplicate();
    tempText.contents = CFG.testChar;

    // Create vectorized version
    var vectorized = tempText.duplicate().createOutline();

    // Measure vectorized height
    var heightPx = vectorized.height;
    var height = heightPx / currentUnitCoeff;

    // Clean up temporary objects
    tempText.remove();
    vectorized.remove();

    return {
        heightPx: heightPx,
        height: height
    };
}

// ============================================================================
// USER INTERFACE - DIALOG 1
// ============================================================================

/**
 * Show dialog for current height and target height input
 * @returns {Object|null} Target height object with value and unit, or null if cancelled
 */
function showHeightDialog() {
    var dialog = new Window('dialog');
    dialog.text = CFG.scriptName;
    dialog.orientation = 'column';
    dialog.alignChildren = ['left', 'top'];
    dialog.spacing = 10;
    dialog.margins = 16;

    // Current height display
    var currentHeightText = dialog.add('statictext', undefined,
        'Physical height of selected text:\n' +
        currentHeight.toFixed(2) + ' ' + currentUnit,
        {multiline: true}
    );
    currentHeightText.preferredSize.width = 300;

    dialog.add('panel', undefined, '').preferredSize = [300, 2];

    // Target height input
    var targetLabel = dialog.add('statictext', undefined,
        'Calculate scale for target height:',
        {multiline: true}
    );
    targetLabel.preferredSize.width = 300;

    var targetGroup = dialog.add('group');
    targetGroup.orientation = 'row';
    targetGroup.alignChildren = ['left', 'center'];

    var targetInput = targetGroup.add('edittext', undefined, '');
    targetInput.characters = 8;
    targetInput.helpTip = 'Enter target height for capital "' + CFG.testChar + '"';

    var unitList = targetGroup.add('dropdownlist', undefined, CFG.units);
    unitList.selection = 0; // mm by default
    unitList.preferredSize.width = 80;

    // Button group
    var buttonGroup = dialog.add('group');
    buttonGroup.orientation = 'row';
    buttonGroup.alignChildren = ['center', 'center'];

    var okBtn = buttonGroup.add('button', undefined, 'Calculate', {name: 'ok'});
    var cancelBtn = buttonGroup.add('button', undefined, 'Cancel', {name: 'cancel'});

    dialog.center();

    if (dialog.show() === 1) {
        var value = targetInput.text.replace(/[^0-9.]/g, '');
        if (value !== '') {
            return {
                value: parseFloat(value),
                unit: unitList.selection.text,
                unitIndex: unitList.selection.index
            };
        }
    }

    return null;
}

// ============================================================================
// USER INTERFACE - DIALOG 2
// ============================================================================

/**
 * Show dialog for scale factor and transformation options
 * @param {Number} scalePercent - Scale factor as percentage
 * @param {Object} targetHeight - Target height information
 * @param {TextFrame} textFrame - Original text frame
 */
function showTransformDialog(scalePercent, targetHeight, textFrame) {
    var dialog = new Window('dialog');
    dialog.text = 'Scale Factor';
    dialog.orientation = 'column';
    dialog.alignChildren = ['left', 'top'];
    dialog.spacing = 10;
    dialog.margins = 16;

    // Scale factor display
    var infoText = dialog.add('statictext', undefined,
        'Scale percentage to resize text\n' +
        'based on height of ' + targetHeight.value + ' ' + targetHeight.unit + ':',
        {multiline: true}
    );
    infoText.preferredSize.width = 320;

    var scaleGroup = dialog.add('group');
    scaleGroup.orientation = 'row';
    scaleGroup.alignChildren = ['left', 'center'];
    scaleGroup.spacing = 5;

    var scaleInput = scaleGroup.add('edittext', undefined, scalePercent.toFixed(2));
    scaleInput.characters = 10;
    scaleInput.helpTip = 'Scale factor (editable)';

    scaleGroup.add('statictext', undefined, '%');

    dialog.add('panel', undefined, '').preferredSize = [320, 2];

    // Instructions
    var instructionText = dialog.add('statictext', undefined,
        'Click "Apply" to transform the selected text,\n' +
        'or "Copy" to copy the percentage to clipboard.',
        {multiline: true}
    );
    instructionText.preferredSize.width = 320;

    // Button group
    var buttonGroup = dialog.add('group');
    buttonGroup.orientation = 'row';
    buttonGroup.alignChildren = ['center', 'center'];

    var applyBtn = buttonGroup.add('button', undefined, 'Apply');
    var copyBtn = buttonGroup.add('button', undefined, 'Copy', {name: 'cancel'});

    // Apply button handler
    applyBtn.onClick = function() {
        var scale = parseFloat(scaleInput.text);
        if (!isNaN(scale) && scale > 0) {
            try {
                app.activeDocument.selection[0].resize(scale, scale);
                alert('Transformation applied\n' + scale.toFixed(2) + '% scale');
            } catch (err) {
                alert('Error applying transformation\n' + err.message);
            }
        } else {
            alert('Invalid scale value\nPlease enter a positive number');
            return;
        }
        dialog.close();
    };

    // Copy button handler
    copyBtn.onClick = function() {
        var scale = parseFloat(scaleInput.text);
        if (!isNaN(scale)) {
            copyToClipboard(scale.toFixed(2));
            alert('Copied to clipboard\n' + scale.toFixed(2) + '%');
        }
        dialog.close();
    };

    dialog.center();
    dialog.show();
}

// ============================================================================
// CALCULATIONS
// ============================================================================

/**
 * Calculate scale factor percentage
 * @param {Number} currentHeightPx - Current height in pixels
 * @param {Number} targetValue - Target height value
 * @param {String} targetUnit - Target unit (mm, inches, pixels)
 * @returns {Number} Scale factor as percentage
 */
function calculateScaleFactor(currentHeightPx, targetValue, targetUnit) {
    var targetPx = convertToPixels(targetValue, targetUnit);
    var scalePercent = (targetPx * 100) / currentHeightPx;
    return scalePercent;
}

/**
 * Convert value to pixels based on unit
 * @param {Number} value - Value to convert
 * @param {String} unit - Unit type (mm, inches, pixels)
 * @returns {Number} Value in pixels
 */
function convertToPixels(value, unit) {
    switch (unit) {
        case 'mm':
            return value * 2.834645;
        case 'inches':
            return value * 72;
        case 'pixels':
            return value;
        default:
            return value;
    }
}

/**
 * Decode text unit preference
 * @param {Number} unitPref - Illustrator unit preference code
 * @returns {Object} Object with coeff and text properties
 */
function decodeTextUnit(unitPref) {
    switch (unitPref) {
        case 0:  // Inches
            return {coeff: 72, text: 'inches'};
        case 1:  // Millimeters
            return {coeff: 2.834645, text: 'mm'};
        case 2:  // Points
            return {coeff: 1, text: 'points'};
        case 6:  // Pixels
            return {coeff: 1, text: 'pixels'};
        default:
            return {coeff: 1, text: 'pixels'};
    }
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Copy text to clipboard
 * @param {String} text - Text to copy
 */
function copyToClipboard(text) {
    try {
        var tempText = app.activeDocument.textFrames.add();
        tempText.contents = text;
        app.selection = [];
        tempText.selected = true;
        app.copy();
        tempText.remove();
    } catch (err) {
        // Silent fail - clipboard operations can be flaky
    }
}
