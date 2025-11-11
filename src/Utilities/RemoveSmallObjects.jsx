/**
 * Remove Small Objects
 * @version 1.0.0
 * @description Delete objects whose width and/or height are smaller than specified thresholds
 * @category Utilities
 *
 * Features:
 * - Width and height thresholds with unit selection (mm, inches, pixels)
 * - AND/OR logic for combined thresholds
 * - Apply to selection or entire document
 * - Live preview counter showing objects to be deleted
 * - Input validation and error handling
 * - Cleanup utility for removing tiny unwanted objects
 *
 * Based on: supprPetitsObjets.jsx by Christian Condamine
 * Original: 305 lines (French) | Modernized: 380 lines (English)
 */




//@target illustrator
var c=File(Folder.myDocuments+"/Adobe Scripts/vexy-ville.ini");if(c.exists){c.open('r');var p=c.read();c.close();var l=File(p+".lib/core.jsx");if(l.exists)$.evalFile(l.fsName);}
app.preferences.setBooleanPreference('ShowExternalJSXWarning', false);

// ============================================================================
// CONFIGURATION
// ============================================================================

var CFG = {
    UNITS: ['mm', 'inches', 'pixels'],
    DEFAULT_UNIT: 0, // mm
    DEFAULT_WIDTH: '0.2',
    DEFAULT_LOGIC: 'OR' // 'AND' or 'OR'
};

// ============================================================================
// MAIN FUNCTION
// ============================================================================

/**
 * Main entry point
 */
function main() {
    try {
        var doc = app.activeDocument;
        var dialog = buildDialog(doc);
        dialog.show();
    } catch (err) {
        AIS.Error.show('Failed to create dialog', err);
    }
}

// ============================================================================
// USER INTERFACE
// ============================================================================

/**
 * Build the remove small objects dialog
 * @param {Document} doc - Active document
 * @returns {Window} Dialog window
 */
function buildDialog(doc) {
    var dialog = new Window('dialog', 'Remove Small Objects');
    dialog.orientation = 'column';
    dialog.alignChildren = ['left', 'top'];

    // Threshold panel
    var thresholdPanel = dialog.add('panel', undefined, 'Remove Objects Smaller Than');
    thresholdPanel.orientation = 'column';
    thresholdPanel.alignChildren = ['left', 'top'];
    thresholdPanel.margins = 10;

    // Width group
    var widthGroup = thresholdPanel.add('group');
    widthGroup.orientation = 'row';
    widthGroup.alignChildren = ['left', 'center'];

    widthGroup.add('statictext', undefined, 'Width:');
    var widthField = widthGroup.add('edittext', undefined, CFG.DEFAULT_WIDTH);
    widthField.characters = 8;

    var unitDropdown = widthGroup.add('dropdownlist', undefined, CFG.UNITS);
    unitDropdown.selection = CFG.DEFAULT_UNIT;
    unitDropdown.preferredSize = [80, -1];

    // Divider
    thresholdPanel.add('panel', undefined, undefined, {borderStyle: 'black'}).minimumSize = [180, 2];

    // Logic group (AND/OR)
    var logicGroup = thresholdPanel.add('group');
    logicGroup.orientation = 'row';
    logicGroup.alignChildren = ['left', 'center'];

    var andRadio = logicGroup.add('radiobutton', undefined, 'AND');
    var orRadio = logicGroup.add('radiobutton', undefined, 'OR');
    orRadio.value = true;

    // Divider
    thresholdPanel.add('panel', undefined, undefined, {borderStyle: 'black'}).minimumSize = [180, 2];

    // Height group
    var heightGroup = thresholdPanel.add('group');
    heightGroup.orientation = 'row';
    heightGroup.alignChildren = ['left', 'center'];

    heightGroup.add('statictext', undefined, 'Height:');
    var heightField = heightGroup.add('edittext', undefined, '');
    heightField.characters = 8;

    var unitLabel = heightGroup.add('statictext', undefined, unitDropdown.selection.text);
    unitLabel.preferredSize = [80, -1];

    // Scope panel
    var scopePanel = dialog.add('panel', undefined, 'Apply To');
    scopePanel.orientation = 'column';
    scopePanel.alignChildren = ['left', 'top'];
    scopePanel.margins = 10;

    var selectionRadio = scopePanel.add('radiobutton', undefined, 'Selection');
    var documentRadio = scopePanel.add('radiobutton', undefined, 'Entire Document');
    selectionRadio.value = true;

    // Counter panel
    var counterPanel = dialog.add('panel', undefined, 'Objects to be Deleted');
    counterPanel.orientation = 'row';
    counterPanel.alignChildren = ['left', 'center'];
    counterPanel.margins = 10;

    var counterText = counterPanel.add('statictext', undefined, '0');
    counterText.preferredSize = [50, -1];

    // Buttons
    var buttonGroup = dialog.add('group');
    buttonGroup.orientation = 'row';
    buttonGroup.alignChildren = ['center', 'center'];

    var okBtn = buttonGroup.add('button', undefined, 'Delete', {name: 'ok'});
    var cancelBtn = buttonGroup.add('button', undefined, 'Cancel', {name: 'cancel'});

    // Event handlers
    function updateCounter() {
        var config = getConfiguration();
        var count = countSmallObjects(doc, config);
        counterText.text = count.toString();
    }

    function getConfiguration() {
        return {
            widthThreshold: widthField.text !== '' ? parseFloat(widthField.text) : null,
            heightThreshold: heightField.text !== '' ? parseFloat(heightField.text) : null,
            unit: unitDropdown.selection.index,
            logic: andRadio.value ? 'AND' : 'OR',
            scope: selectionRadio.value ? 'selection' : 'document'
        };
    }

    widthField.onChange = updateCounter;
    heightField.onChange = updateCounter;
    unitDropdown.onChange = function() {
        unitLabel.text = unitDropdown.selection.text;
        updateCounter();
    };
    andRadio.onClick = updateCounter;
    orRadio.onClick = updateCounter;

    selectionRadio.onClick = function() {
        if (selectionRadio.value && doc.selection.length === 0) {
            alert('Nothing is selected\nSwitching to Entire Document mode');
            documentRadio.value = true;
        }
        updateCounter();
    };

    documentRadio.onClick = updateCounter;

    okBtn.onClick = function() {
        var config = getConfiguration();

        if (config.widthThreshold === null && config.heightThreshold === null) {
            alert('Error: Enter at least one threshold value\nProvide width and/or height threshold');
            return;
        }

        var count = removeSmallObjects(doc, config);
        alert('Deleted ' + count + ' object(s)');
        dialog.close();
    };

    // Initial counter update
    updateCounter();

    return dialog;
}

// ============================================================================
// CORE LOGIC
// ============================================================================

/**
 * Count objects that match removal criteria
 * @param {Document} doc - Active document
 * @param {Object} config - Configuration object
 * @returns {Number} Count of objects to be removed
 */
function countSmallObjects(doc, config) {
    var count = 0;
    var items = (config.scope === 'selection') ? doc.selection : doc.pageItems;

    // Convert thresholds to points
    var widthPt = convertToPoints(config.widthThreshold, config.unit);
    var heightPt = convertToPoints(config.heightThreshold, config.unit);

    for (var i = 0; i < items.length; i++) {
        if (shouldRemove(items[i], widthPt, heightPt, config.logic)) {
            count++;
        }
    }

    return count;
}

/**
 * Remove objects that match criteria
 * @param {Document} doc - Active document
 * @param {Object} config - Configuration object
 * @returns {Number} Count of removed objects
 */
function removeSmallObjects(doc, config) {
    var count = 0;

    // Convert thresholds to points
    var widthPt = convertToPoints(config.widthThreshold, config.unit);
    var heightPt = convertToPoints(config.heightThreshold, config.unit);

    if (config.scope === 'selection') {
        // Remove from selection (forward iteration, items removed from array)
        var sel = doc.selection;
        for (var i = 0; i < sel.length; i++) {
            if (shouldRemove(sel[i], widthPt, heightPt, config.logic)) {
                sel[i].remove();
                count++;
                i--; // Adjust index after removal
            }
        }
    } else {
        // Remove from document (backward iteration for safety)
        var items = doc.pageItems;
        for (var i = items.length - 1; i >= 0; i--) {
            if (shouldRemove(items[i], widthPt, heightPt, config.logic)) {
                items[i].remove();
                count++;
            }
        }
    }

    return count;
}

/**
 * Check if object should be removed based on size thresholds
 * @param {PageItem} item - Object to check
 * @param {Number|null} widthPt - Width threshold in points (null if not set)
 * @param {Number|null} heightPt - Height threshold in points (null if not set)
 * @param {String} logic - 'AND' or 'OR'
 * @returns {Boolean} True if object should be removed
 */
function shouldRemove(item, widthPt, heightPt, logic) {
    // At least one threshold must be set (validated in UI)
    if (widthPt !== null && heightPt !== null) {
        // Both thresholds set
        if (logic === 'AND') {
            return (item.width < widthPt && item.height < heightPt);
        } else {
            return (item.width < widthPt || item.height < heightPt);
        }
    } else if (widthPt !== null) {
        // Only width threshold
        return (item.width < widthPt);
    } else {
        // Only height threshold
        return (item.height < heightPt);
    }
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Convert value to points based on unit
 * Uses AIS.Units.convert() for consistent unit handling across framework
 * @param {Number|null} value - Value to convert
 * @param {Number} unitIndex - Unit index (0=mm, 1=inches, 2=pixels)
 * @returns {Number|null} Value in points, or null if input is null
 */
function convertToPoints(value, unitIndex) {
    if (value === null) {
        return null;
    }

    switch (unitIndex) {
        case 0: // mm to pt
            return AIS.Units.convert(value, 'mm', 'pt');
        case 1: // inches to pt
            return AIS.Units.convert(value, 'in', 'pt');
        case 2: // pixels (already in pt)
            return value;
        default:
            return value;
    }
}

// ============================================================================
// EXECUTE
// ============================================================================

if (!AIS.Document.hasDocument()) {
    alert('No document\nOpen a document and try again');
} else {
    try {
        main();
    } catch (e) {
        AIS.Error.show('Script error', e);
    }
}
