/**
 * Change Units
 * @version 1.0.0
 * @description Quickly change ruler units, stroke units, and text units in Illustrator preferences
 * @author Christian Condamine (modernized for AIS)
 * @license MIT
 * @category Preferences
 * @requires Illustrator CS4 or higher
 *
 * Features:
 * - Change ruler, stroke, and optionally text units
 * - Supports mm, points, inches, pixels
 * - Updates both preferences and document
 * - Opens Document Setup for confirmation
 *
 * Original: Christian Condamine (christian.condamine@laposte.net)
 * Modernized to use AIS library while preserving all functionality
 */

#include "../.lib/core.jsx"

//@target illustrator
#targetengine 'main'
app.preferences.setBooleanPreference('ShowExternalJSXWarning', false);

(function() {
    main();
})();

// ============================================================================
// CONFIGURATION
// ============================================================================

var UNITS = {
    mm: { value: 3, label: 'Millimeters', abbr: 'mm' },
    pt: { value: 2, label: 'Points', abbr: 'points' },
    in: { value: 0, label: 'Inches', abbr: 'inches' },
    px: { value: 6, label: 'Pixels', abbr: 'pixels' }
};

// ============================================================================
// MAIN FUNCTION
// ============================================================================

function main() {
    var dialog = showDialog();

    dialog.okBtn.onClick = function() {
        var config = getConfiguration(dialog);
        applyUnits(config);
        openDocumentSetup();
        dialog.close();
    }

    dialog.show();
}

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Get configuration from dialog
 * @param {Object} dialog - Dialog window
 * @returns {Object} Configuration object
 */
function getConfiguration(dialog) {
    var selectedIndex = dialog.unitList.selection.index;
    var unitValue;

    switch (selectedIndex) {
        case 0: // mm
            unitValue = UNITS.mm.value;
            break;
        case 1: // points
            unitValue = UNITS.pt.value;
            break;
        case 2: // inches
            unitValue = UNITS.in.value;
            break;
        case 3: // pixels
            unitValue = UNITS.px.value;
            break;
        default:
            unitValue = UNITS.mm.value;
    }

    return {
        unitValue: unitValue,
        applyToText: dialog.includeText.value
    };
}

/**
 * Apply unit changes to preferences
 * @param {Object} config - Configuration object
 */
function applyUnits(config) {
    try {
        // Set ruler units
        app.preferences.setIntegerPreference('rulerType', config.unitValue);

        // Set stroke units
        app.preferences.setIntegerPreference('strokeUnits', config.unitValue);

        // Set text units (if requested, otherwise default to points)
        if (config.applyToText) {
            app.preferences.setIntegerPreference('text/units', config.unitValue);
        } else {
            app.preferences.setIntegerPreference('text/units', UNITS.pt.value);
        }
    } catch (e) {
        AIS.Error.show('Error applying unit changes', e);
    }
}

/**
 * Open Document Setup dialog via action
 * This allows the user to confirm and modify document-specific settings
 */
function openDocumentSetup() {
    var set = 'UnitsAction';
    var action = 'changeUnits';

    // Action string to open Document Setup dialog
    var actionStr = [
        '/version 3',
        '/name [ ' + set.length,
        ascii2Hex(set),
        ']',
        '/isOpen 0',
        '/actionCount 1',
        '/action-1 {',
        '/name [ ' + action.length,
        ascii2Hex(action),
        ']',
        '/keyIndex 0',
        '/colorIndex 0',
        '/isOpen 0',
        '/eventCount 1',
        '/event-1 {',
        '/useRulersIn1stQuadrant 0',
        '/internalName (adobe_commandManager)',
        '/localizedName [ 32',
        // "Access a menu command" in hex
        '416363c3a964657220c3a020756e6520636f6d6d616e6465206465206d656e75',
        ']',
        '/isOpen 0',
        '/isOn 1',
        '/hasDialog 0',
        '/parameterCount 3',
        '/parameter-1 {',
        '/key 1769238125',
        '/showInPalette -1',
        '/type (ustring)',
        '/value [ 8',
        // "document" in hex
        '646f63756d656e74',
        ']',
        '}',
        '/parameter-2 {',
        '/key 1818455661',
        '/showInPalette -1',
        '/type (ustring)',
        '/value [ 18',
        // "Document Format" in hex
        '466f726d617420646520646f63756d656e74',
        ']',
        '}',
        '/parameter-3 {',
        '/key 1668114788',
        '/showInPalette -1',
        '/type (integer)',
        '/value 84',
        '}',
        '}',
        '}'
    ].join('\n');

    try {
        createAction(actionStr, set);
        app.doScript(action, set);
        app.unloadAction(set, '');
    } catch (e) {
        // Silently fail if action execution fails
        // Document Setup can still be accessed manually via File menu
    }
}

/**
 * Create an Illustrator action from a string
 * @param {String} str - Action string
 * @param {String} act - Action set name
 */
function createAction(str, act) {
    var f = new File('~/' + act + '.aia');
    f.open('w');
    f.write(str);
    f.close();
    app.loadAction(f);
    f.remove();
}

/**
 * Convert ASCII string to hexadecimal
 * @param {String} str - Input string
 * @returns {String} Hexadecimal representation
 */
function ascii2Hex(str) {
    return str.replace(/./g, function(a) {
        return a.charCodeAt(0).toString(16);
    });
}

// ============================================================================
// USER INTERFACE
// ============================================================================

/**
 * Show unit change dialog
 * @returns {Object} Dialog window
 */
function showDialog() {
    var dialog = new Window('dialog');
    dialog.text = 'Change Units';
    dialog.orientation = 'column';
    dialog.alignChildren = ['left', 'top'];
    dialog.spacing = 10;
    dialog.margins = 16;

    // Unit selection
    var unitGroup = dialog.add('group');
    unitGroup.orientation = 'row';
    unitGroup.alignChildren = ['left', 'center'];
    unitGroup.margins = 0;

    var unitLabel = unitGroup.add('statictext', undefined, 'Unit:');
    unitLabel.preferredSize.width = 50;

    var unitList = unitGroup.add('dropdownlist', undefined, [
        UNITS.mm.abbr,
        UNITS.pt.abbr,
        UNITS.in.abbr,
        UNITS.px.abbr
    ]);
    unitList.selection = 0;
    unitList.preferredSize.width = 100;

    // Text units checkbox
    var includeText = dialog.add('checkbox', undefined, 'Include text units?');
    includeText.value = false;

    // Buttons
    var buttonGroup = dialog.add('group');
    buttonGroup.orientation = 'row';
    buttonGroup.alignChildren = ['left', 'center'];
    buttonGroup.margins = 0;

    var okBtn = buttonGroup.add('button', undefined, 'OK');
    okBtn.preferredSize.width = 80;

    var cancelBtn = buttonGroup.add('button', undefined, 'Cancel', { name: 'cancel' });
    cancelBtn.preferredSize.width = 80;

    // Center dialog
    dialog.center();

    // Attach UI elements to dialog object
    dialog.unitList = unitList;
    dialog.includeText = includeText;
    dialog.okBtn = okBtn;

    return dialog;
}

// ============================================================================
// ENTRY POINT (handled by IIFE at top)
// ============================================================================
