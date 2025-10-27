/**
 * Remove Small Objects
 * @version 1.0.0
 * @description Delete objects whose width and/or height are less than the chosen dimension
 * @author Original: Christian Condamine (christian.condamine@laposte.net)
 *         Modernized for AIS by Adam (2025)
 * @license MIT
 * @category Utilities
 * @requires Illustrator CS4 or higher
 *
 * Features:
 * - Filter by width, height, or both (AND/OR logic)
 * - Apply to selection or entire document
 * - Unit conversion (mm, inches, pixels)
 * - Live preview counter showing how many objects will be deleted
 * - Non-destructive preview (only deletes on OK)
 *
 * Original: Christian Condamine - supprPetitsObjets.jsx
 * Modernized to use AIS library, English-only UI, and improved error handling
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

    try {
        main();
    } catch (err) {
        AIS.Error.show('Remove Small Objects', err);
    }
})();

// ============================================================================
// CONFIGURATION
// ============================================================================

var CFG = {
    scriptName: 'Remove Small Objects',
    scriptVersion: '1.0.0',
    defaultWidth: 0.2,
    defaultUnit: 'mm',
    units: ['mm', 'inches', 'pixels']
};

// ============================================================================
// MAIN FUNCTION
// ============================================================================

function main() {
    var doc = app.activeDocument;
    var selection = doc.selection;

    var dialog = showDialog(selection);

    dialog.okBtn.onClick = function() {
        var config = getConfiguration(dialog);

        if (!validateConfiguration(config)) {
            return;
        }

        // Convert units to points
        var widthPx = convertToPoints(config.width, config.unit);
        var heightPx = convertToPoints(config.height, config.unit);

        // Execute deletion
        var count = 0;
        if (config.applyToSelection) {
            count = removeSmallObjectsFromSelection(selection, widthPx, heightPx, config.logic);
        } else {
            count = removeSmallObjectsFromDocument(doc, widthPx, heightPx, config.logic);
        }

        alert('Removed ' + count + ' object(s)');
        dialog.close();
    };

    dialog.show();
}

// ============================================================================
// USER INTERFACE
// ============================================================================

/**
 * Create and show dialog
 * @param {Array} selection - Current selection
 * @returns {Window} Dialog window
 */
function showDialog(selection) {
    var dialog = new Window('dialog');
    dialog.text = CFG.scriptName;
    dialog.orientation = 'column';
    dialog.alignChildren = ['left', 'top'];
    dialog.spacing = 10;
    dialog.margins = 16;

    // Panel 1: Size Filters
    var sizePanel = dialog.add('panel', undefined, 'Smaller than');
    sizePanel.orientation = 'column';
    sizePanel.alignChildren = ['left', 'top'];
    sizePanel.spacing = 10;
    sizePanel.margins = 16;
    sizePanel.preferredSize.width = 280;

    // Width group
    var widthGroup = sizePanel.add('group');
    widthGroup.orientation = 'row';
    widthGroup.alignChildren = ['left', 'center'];

    widthGroup.add('statictext', undefined, 'Width:').preferredSize.width = 60;
    var widthInput = widthGroup.add('edittext', undefined, CFG.defaultWidth);
    widthInput.preferredSize.width = 80;
    widthInput.helpTip = 'Enter width threshold (leave empty to ignore)';

    var unitList = widthGroup.add('dropdownlist', undefined, CFG.units);
    unitList.selection = 0; // mm by default
    unitList.preferredSize.width = 80;

    // Divider
    sizePanel.add('panel', undefined, '').preferredSize = [260, 2];

    // Logic group (AND/OR)
    var logicGroup = sizePanel.add('group');
    logicGroup.orientation = 'row';
    logicGroup.alignChildren = ['left', 'center'];
    logicGroup.spacing = 20;

    var andRadio = logicGroup.add('radiobutton', undefined, 'AND');
    andRadio.helpTip = 'Object must be smaller in BOTH width AND height';
    var orRadio = logicGroup.add('radiobutton', undefined, 'OR');
    orRadio.helpTip = 'Object is smaller in EITHER width OR height';
    orRadio.value = true;

    // Divider
    sizePanel.add('panel', undefined, '').preferredSize = [260, 2];

    // Height group
    var heightGroup = sizePanel.add('group');
    heightGroup.orientation = 'row';
    heightGroup.alignChildren = ['left', 'center'];

    heightGroup.add('statictext', undefined, 'Height:').preferredSize.width = 60;
    var heightInput = heightGroup.add('edittext', undefined, '');
    heightInput.preferredSize.width = 80;
    heightInput.helpTip = 'Enter height threshold (leave empty to ignore)';

    var unitLabel = heightGroup.add('statictext', undefined, unitList.selection.text);
    unitLabel.preferredSize.width = 80;

    // Panel 2: Apply To
    var applyPanel = dialog.add('panel', undefined, 'Apply to:');
    applyPanel.orientation = 'column';
    applyPanel.alignChildren = ['left', 'top'];
    applyPanel.margins = 16;
    applyPanel.spacing = 10;

    var selectionRadio = applyPanel.add('radiobutton', undefined, 'Selection');
    selectionRadio.value = (selection.length > 0);
    selectionRadio.helpTip = 'Remove small objects from current selection only';

    var documentRadio = applyPanel.add('radiobutton', undefined, 'Entire document');
    documentRadio.value = (selection.length === 0);
    documentRadio.helpTip = 'Remove small objects from all layers in document';

    // Panel 3: Preview Counter
    var counterPanel = dialog.add('panel', undefined, 'Objects to be deleted:');
    counterPanel.orientation = 'row';
    counterPanel.alignChildren = ['left', 'center'];
    counterPanel.margins = 16;
    counterPanel.graphics.backgroundColor = counterPanel.graphics.newBrush(
        counterPanel.graphics.BrushType.SOLID_COLOR,
        [0.4, 0.5, 0.4]
    );

    var counterText = counterPanel.add('statictext', undefined, '0');
    counterText.characters = 10;
    counterText.graphics.font = ScriptUI.newFont(counterText.graphics.font.name, 'Bold', 14);

    // Button group
    var buttonGroup = dialog.add('group');
    buttonGroup.orientation = 'row';
    buttonGroup.alignChildren = ['center', 'center'];

    var okBtn = buttonGroup.add('button', undefined, 'Delete', {name: 'ok'});
    var cancelBtn = buttonGroup.add('button', undefined, 'Cancel', {name: 'cancel'});

    // Event handlers for live preview
    function updateCounter() {
        var config = getConfiguration(dialog);

        if (!config.width && !config.height) {
            counterText.text = '0';
            return;
        }

        var widthPx = convertToPoints(config.width, config.unit);
        var heightPx = convertToPoints(config.height, config.unit);

        var count = 0;
        if (config.applyToSelection) {
            count = countSmallObjectsInSelection(selection, widthPx, heightPx, config.logic);
        } else {
            count = countSmallObjectsInDocument(app.activeDocument, widthPx, heightPx, config.logic);
        }

        counterText.text = count.toString();
    }

    widthInput.onChange = function() { updateCounter(); };
    heightInput.onChange = function() { updateCounter(); };
    unitList.onChange = function() {
        unitLabel.text = unitList.selection.text;
        updateCounter();
    };
    andRadio.onClick = function() { updateCounter(); };
    orRadio.onClick = function() { updateCounter(); };

    selectionRadio.onClick = function() {
        if (selectionRadio.value && selection.length === 0) {
            alert('No selection\nPlease select objects or choose "Entire document"');
            documentRadio.value = true;
            selectionRadio.value = false;
        }
        updateCounter();
    };

    documentRadio.onClick = function() {
        updateCounter();
    };

    // Attach objects for easy access
    dialog.widthInput = widthInput;
    dialog.heightInput = heightInput;
    dialog.unitList = unitList;
    dialog.andRadio = andRadio;
    dialog.orRadio = orRadio;
    dialog.selectionRadio = selectionRadio;
    dialog.documentRadio = documentRadio;
    dialog.okBtn = okBtn;
    dialog.cancelBtn = cancelBtn;

    // Initial counter update
    updateCounter();

    dialog.center();
    return dialog;
}

/**
 * Get configuration from dialog
 * @param {Window} dialog - Dialog window
 * @returns {Object} Configuration object
 */
function getConfiguration(dialog) {
    var width = dialog.widthInput.text.replace(/[^0-9.]/g, '');
    var height = dialog.heightInput.text.replace(/[^0-9.]/g, '');

    return {
        width: width !== '' ? parseFloat(width) : null,
        height: height !== '' ? parseFloat(height) : null,
        unit: dialog.unitList.selection.text,
        logic: dialog.andRadio.value ? 'and' : 'or',
        applyToSelection: dialog.selectionRadio.value
    };
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate configuration
 * @param {Object} config - Configuration object
 * @returns {Boolean} True if valid
 */
function validateConfiguration(config) {
    if (config.width === null && config.height === null) {
        alert('Invalid input\nPlease enter at least one dimension (width or height)');
        return false;
    }

    if (config.width !== null && (isNaN(config.width) || config.width <= 0)) {
        alert('Invalid width\nWidth must be a positive number');
        return false;
    }

    if (config.height !== null && (isNaN(config.height) || config.height <= 0)) {
        alert('Invalid height\nHeight must be a positive number');
        return false;
    }

    return true;
}

// ============================================================================
// UNIT CONVERSION
// ============================================================================

/**
 * Convert value to points based on unit
 * @param {Number} value - Value to convert
 * @param {String} unit - Unit type (mm, inches, pixels)
 * @returns {Number} Value in points
 */
function convertToPoints(value, unit) {
    if (value === null || value === undefined) return null;

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

// ============================================================================
// CORE LOGIC - COUNTING
// ============================================================================

/**
 * Count small objects in selection
 * @param {Array} selection - Selection array
 * @param {Number} widthPx - Width threshold in points
 * @param {Number} heightPx - Height threshold in points
 * @param {String} logic - 'and' or 'or'
 * @returns {Number} Count of matching objects
 */
function countSmallObjectsInSelection(selection, widthPx, heightPx, logic) {
    var count = 0;

    for (var i = 0; i < selection.length; i++) {
        if (isObjectSmall(selection[i], widthPx, heightPx, logic)) {
            count++;
        }
    }

    return count;
}

/**
 * Count small objects in document
 * @param {Document} doc - Document
 * @param {Number} widthPx - Width threshold in points
 * @param {Number} heightPx - Height threshold in points
 * @param {String} logic - 'and' or 'or'
 * @returns {Number} Count of matching objects
 */
function countSmallObjectsInDocument(doc, widthPx, heightPx, logic) {
    var count = 0;

    for (var i = 0; i < doc.pageItems.length; i++) {
        if (isObjectSmall(doc.pageItems[i], widthPx, heightPx, logic)) {
            count++;
        }
    }

    return count;
}

// ============================================================================
// CORE LOGIC - REMOVAL
// ============================================================================

/**
 * Remove small objects from selection
 * @param {Array} selection - Selection array
 * @param {Number} widthPx - Width threshold in points
 * @param {Number} heightPx - Height threshold in points
 * @param {String} logic - 'and' or 'or'
 * @returns {Number} Count of removed objects
 */
function removeSmallObjectsFromSelection(selection, widthPx, heightPx, logic) {
    var count = 0;

    // Iterate backwards to avoid index issues when removing
    for (var i = selection.length - 1; i >= 0; i--) {
        if (isObjectSmall(selection[i], widthPx, heightPx, logic)) {
            try {
                selection[i].remove();
                count++;
            } catch (err) {
                // Skip locked or protected items
            }
        }
    }

    return count;
}

/**
 * Remove small objects from document
 * @param {Document} doc - Document
 * @param {Number} widthPx - Width threshold in points
 * @param {Number} heightPx - Height threshold in points
 * @param {String} logic - 'and' or 'or'
 * @returns {Number} Count of removed objects
 */
function removeSmallObjectsFromDocument(doc, widthPx, heightPx, logic) {
    var count = 0;

    // Iterate backwards to avoid index issues when removing
    for (var i = doc.pageItems.length - 1; i >= 0; i--) {
        if (isObjectSmall(doc.pageItems[i], widthPx, heightPx, logic)) {
            try {
                doc.pageItems[i].remove();
                count++;
            } catch (err) {
                // Skip locked or protected items
            }
        }
    }

    return count;
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Check if object is small based on criteria
 * @param {PageItem} item - Page item to check
 * @param {Number} widthPx - Width threshold in points (null to ignore)
 * @param {Number} heightPx - Height threshold in points (null to ignore)
 * @param {String} logic - 'and' or 'or'
 * @returns {Boolean} True if object matches criteria
 */
function isObjectSmall(item, widthPx, heightPx, logic) {
    var widthMatch = false;
    var heightMatch = false;

    // Check width
    if (widthPx !== null) {
        widthMatch = Math.abs(item.width) < widthPx;
    }

    // Check height
    if (heightPx !== null) {
        heightMatch = Math.abs(item.height) < heightPx;
    }

    // Apply logic
    if (widthPx !== null && heightPx !== null) {
        if (logic === 'and') {
            return widthMatch && heightMatch;
        } else {
            return widthMatch || heightMatch;
        }
    } else if (widthPx !== null) {
        return widthMatch;
    } else if (heightPx !== null) {
        return heightMatch;
    }

    return false;
}
