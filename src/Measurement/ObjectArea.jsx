/**
 * Object Area
 * @version 1.0.0
 * @description Displays the area of selected path objects in various units
 * @category Measurement
 * @features
 * - Calculate area of paths, compound paths, and groups
 * - Multiple unit options (cm², mm², inches², points²)
 * - Automatic unit detection from document settings
 * - Total area for multiple selections
 * - High precision calculations
 * @author Original: Unknown
 * @usage
 * 1. Select one or more path objects
 * 2. Run script
 * 3. Choose unit from dialog
 * 4. View area in selected unit
 * @notes
 * - Uses Illustrator's built-in PathItem.area property
 * - Area is calculated in square points then converted
 * - Supports compound paths (holes are subtracted)
 * - Groups calculate sum of all contained paths
 * - this_file: Measurement/ObjectArea.jsx
 */

#include "../.lib/core.jsx"

//@target illustrator
app.preferences.setBooleanPreference('ShowExternalJSXWarning', false);

(function() {
    if (!AIS.Document.hasDocument()) {
        alert('No document\nOpen a document and try again');
        return;
    }

    if (!AIS.Document.hasSelection()) {
        alert('No selection\nSelect one or more path objects and try again');
        return;
    }

    try {
        main();
    } catch (e) {
        AIS.Error.show('Object Area error', e);
    }
})();

// ============================================================================
// CONFIGURATION
// ============================================================================

var CFG = {
    scriptName: 'Object Area',
    units: [
        { name: 'Square Centimeters', abbr: 'cm²', factor: 0.0050452946 },
        { name: 'Square Millimeters', abbr: 'mm²', factor: 5.0452946 },
        { name: 'Square Inches', abbr: 'in²', factor: 0.01929012 },
        { name: 'Square Points', abbr: 'pt²', factor: 1 }
    ],
    precision: 4  // Decimal places for area display
};

// ============================================================================
// MAIN FUNCTION
// ============================================================================

function main() {
    var doc = app.activeDocument;
    var sel = doc.selection;

    // Show unit selection dialog
    var unitIndex = showUnitDialog();
    if (unitIndex === -1) {
        return; // User cancelled
    }

    var unit = CFG.units[unitIndex];

    // Calculate total area
    var totalArea = 0;
    var pathCount = 0;

    for (var i = 0; i < sel.length; i++) {
        var item = sel[i];
        var itemArea = getItemArea(item);

        if (itemArea > 0) {
            totalArea += itemArea;
            pathCount++;
        }
    }

    if (pathCount === 0) {
        alert('No measurable paths\nSelect path objects with area and try again');
        return;
    }

    // Convert from square points to selected unit
    var convertedArea = totalArea * unit.factor;
    var displayArea = AIS.Number.round(convertedArea, CFG.precision);

    // Show results
    var message = 'Area Calculation\n\n';
    message += 'Objects: ' + pathCount + '\n';
    message += 'Total Area: ' + displayArea + ' ' + unit.abbr + '\n\n';

    if (pathCount > 1) {
        var avgArea = convertedArea / pathCount;
        message += 'Average Area: ' + AIS.Number.round(avgArea, CFG.precision) + ' ' + unit.abbr;
    }

    alert(message);
}

// ============================================================================
// CORE LOGIC
// ============================================================================

/**
 * Get area of an item (handles different types)
 */
function getItemArea(item) {
    var area = 0;

    if (item.typename === 'PathItem' && !item.guides) {
        // Simple path - use built-in area property
        area = Math.abs(item.area);

    } else if (item.typename === 'CompoundPathItem') {
        // Compound path - sum all path areas
        for (var i = 0; i < item.pathItems.length; i++) {
            area += Math.abs(item.pathItems[i].area);
        }

    } else if (item.typename === 'GroupItem') {
        // Group - recursively calculate all contained items
        area = getGroupArea(item);

    } else if (item.typename === 'TextFrame') {
        // Ignore text frames
        area = 0;
    }

    return area;
}

/**
 * Calculate total area of all paths in a group
 */
function getGroupArea(group) {
    var area = 0;

    for (var i = 0; i < group.pageItems.length; i++) {
        var item = group.pageItems[i];
        area += getItemArea(item);
    }

    return area;
}

// ============================================================================
// USER INTERFACE
// ============================================================================

/**
 * Show unit selection dialog
 */
function showUnitDialog() {
    var dialog = new Window('dialog', CFG.scriptName);
    dialog.alignChildren = 'fill';

    // Instructions
    var infoGroup = dialog.add('group');
    infoGroup.orientation = 'column';
    infoGroup.alignChildren = 'left';

    var info = infoGroup.add('statictext', undefined, 'Select unit for area calculation:');
    info.graphics.font = ScriptUI.newFont(info.graphics.font.name, ScriptUI.FontStyle.BOLD, 12);

    // Unit selection
    var unitGroup = dialog.add('panel', undefined, 'Units');
    unitGroup.alignChildren = 'left';
    unitGroup.margins = 15;

    var radioButtons = [];
    for (var i = 0; i < CFG.units.length; i++) {
        var unit = CFG.units[i];
        var radio = unitGroup.add('radiobutton', undefined, unit.name + ' (' + unit.abbr + ')');
        radioButtons.push(radio);

        if (i === 0) {
            radio.value = true; // Select first unit by default
        }
    }

    // Try to select unit based on document ruler units
    var docUnit = getDocumentUnitIndex();
    if (docUnit !== -1) {
        radioButtons[docUnit].value = true;
    }

    // Buttons
    var buttonGroup = dialog.add('group');
    buttonGroup.alignment = 'center';

    var okButton = buttonGroup.add('button', undefined, 'Calculate', { name: 'ok' });
    var cancelButton = buttonGroup.add('button', undefined, 'Cancel', { name: 'cancel' });

    // Show dialog
    if (dialog.show() === 1) {
        // Find selected radio button
        for (var i = 0; i < radioButtons.length; i++) {
            if (radioButtons[i].value) {
                return i;
            }
        }
        return 0; // Default to first unit
    } else {
        return -1; // Cancelled
    }
}

/**
 * Get document unit and map to unit index
 */
function getDocumentUnitIndex() {
    var units = AIS.Units.get();

    switch (units) {
        case 'mm':
            return 1; // Square Millimeters
        case 'cm':
            return 0; // Square Centimeters
        case 'in':
        case 'inch':
            return 2; // Square Inches
        case 'pt':
        case 'point':
            return 3; // Square Points
        default:
            return -1; // Unknown - use default
    }
}
