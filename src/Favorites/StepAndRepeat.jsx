/**
 * Step and Repeat
 * @version 2.1.0
 * @description Repeatedly duplicate selected objects (equivalent to InDesign's Step and Repeat)
 * @author sky-chaser-high (modernized for AIS)
 * @license MIT
 * @category Favorites
 * @requires Illustrator CS4 or higher
 *
 * Features:
 * - Repeat mode: Linear duplication with offset
 * - Grid mode: Create rows × columns grid
 * - Live preview with real-time updates
 * - Keyboard shortcuts: Arrow keys to adjust values (Shift for ×5)
 * - Supports all ruler units
 *
 * Original: github.com/sky-chaser-high/adobe-illustrator-scripts
 * Modernized to use AIS library while preserving all functionality
 */

#include "../.lib/core.jsx"

//@target illustrator
app.preferences.setBooleanPreference('ShowExternalJSXWarning', false);

(function() {
    if (!app.documents.length) {
        alert('No documents\nOpen a document and try again');
        return;
    }

    if (!isValidVersion()) {
        alert('This script requires Illustrator CS4 or higher\nCurrent version: ' + app.version);
        return;
    }

    main();
})();

// ============================================================================
// MAIN FUNCTION
// ============================================================================

function main() {
    var items = app.activeDocument.selection;
    if (!items.length) {
        alert('No objects selected\nSelect one or more objects and try again');
        return;
    }

    var dialog = showDialog(items);

    dialog.ok.onClick = function() {
        if (dialog.preview.value) return dialog.close();
        var config = getConfiguration(dialog);
        if (!validate(config)) return;
        stepAndRepeat(config);
        dialog.close();
    }

    dialog.preview.onClick = function() {
        if (dialog.preview.value) {
            var config = getConfiguration(dialog);
            if (!validate(config)) return;
            stepAndRepeat(config);
        }
        else {
            restore(items);
        }
        app.redraw();
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
    var ruler = AIS.Units.get();
    var rows = getValue(dialog.rows.text);
    var columns = getValue(dialog.columns.text);
    var vertical = getValue(dialog.vertical.text);
    var horizontal = getValue(dialog.horizontal.text);
    return {
        mode: {
            repeat: dialog.grid.value ? false : true,
            grid: dialog.grid.value ? true : false
        },
        rows: parseInt(rows),
        columns: parseInt(columns),
        vertical: AIS.Units.convert(vertical, ruler, 'pt'),
        horizontal: AIS.Units.convert(horizontal, ruler, 'pt')
    };
}

/**
 * Validate configuration values
 * @param {Object} config - Configuration object
 * @returns {Boolean} True if valid
 */
function validate(config) {
    if (config.rows < 1 || config.columns < 1) {
        alert('The value must be greater than 1.');
        return false;
    }
    return true;
}

// ============================================================================
// DUPLICATION LOGIC
// ============================================================================

/**
 * Execute step and repeat
 * @param {Object} config - Configuration object
 */
function stepAndRepeat(config) {
    var items = app.activeDocument.selection;
    for (var i = 0; i < items.length; i++) {
        var item = items[i];
        if (config.mode.repeat) repeat(item, config);
        if (config.mode.grid) grid(item, config);
    }
}

/**
 * Repeat mode: Linear duplication
 * @param {Object} item - Item to duplicate
 * @param {Object} config - Configuration object
 */
function repeat(item, config) {
    var x = config.horizontal;
    var y = config.vertical * -1;
    for (var i = 0; i < config.rows; i++) {
        item.duplicate();
        item.translate(x, y);
    }
}

/**
 * Grid mode: Create rows × columns grid
 * @param {Object} item - Item to duplicate
 * @param {Object} config - Configuration object
 */
function grid(item, config) {
    var top = item.top;
    var left = item.left;
    for (var i = 0; i < config.rows; i++) {
        for (var j = 0; j < config.columns - 1; j++) {
            item.duplicate();
            item.translate(config.horizontal, 0);
        }
        if (i < config.rows - 1) {
            item.duplicate();
            item.top = top - config.vertical * (i + 1);
            item.left = left;
        }
    }
}

// ============================================================================
// PREVIEW & RESTORE
// ============================================================================

/**
 * Preview changes
 * @param {Object} dialog - Dialog window
 * @param {Array} items - Original items
 */
function preview(dialog, items) {
    if (!dialog.preview.value) return;
    restore(items);
    var config = getConfiguration(dialog);
    if (!validate(config)) return;
    stepAndRepeat(config);
    app.redraw();
}

/**
 * Restore original selection
 * @param {Array} items - Original items
 */
function restore(items) {
    var current = app.activeDocument.selection;
    if (items.length == current.length) return;
    app.undo();
    for (var i = 0; i < items.length; i++) {
        var item = items[i];
        item.selected = true;
    }
    app.redraw();
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Get numeric value from text (handles full-width characters)
 * @param {String} text - Input text
 * @returns {Number} Numeric value
 */
function getValue(text) {
    var twoByteChar = /[！-～]/g;
    var value = text.replace(twoByteChar, function(str) {
        return String.fromCharCode(str.charCodeAt(0) - 0xFEE0);
    });
    if (isNaN(value) || !value) return 0;
    return Number(value);
}

/**
 * Check if Illustrator version is valid
 * @returns {Boolean} True if CS4 or higher
 */
function isValidVersion() {
    var cs4 = 14;
    var aiVersion = parseInt(app.version);
    if (aiVersion < cs4) return false;
    return true;
}

// ============================================================================
// USER INTERFACE
// ============================================================================

/**
 * Show step and repeat dialog
 * @param {Array} items - Selected items
 * @returns {Object} Dialog window
 */
function showDialog(items) {
    var dialog = new Window('dialog');
    dialog.text = 'Step and Repeat';
    dialog.orientation = 'row';
    dialog.alignChildren = ['center', 'top'];
    dialog.spacing = 10;
    dialog.margins = 16;

    var group1 = dialog.add('group', undefined, { name: 'group1' });
    group1.orientation = 'column';
    group1.alignChildren = ['left', 'center'];
    group1.spacing = 10;
    group1.margins = 0;

    var panel1 = group1.add('panel', undefined, undefined, { name: 'panel1' });
    panel1.text = 'Repeat';
    panel1.orientation = 'column';
    panel1.alignChildren = ['left', 'center'];
    panel1.spacing = 10;
    panel1.margins = 10;

    var group2 = panel1.add('group', undefined, { name: 'group2' });
    group2.orientation = 'row';
    group2.alignChildren = ['left', 'fill'];
    group2.spacing = 10;
    group2.margins = 4;

    var group3 = group2.add('group', undefined, { name: 'group3' });
    group3.preferredSize.width = 60;
    group3.orientation = 'row';
    group3.alignChildren = ['right', 'center'];
    group3.spacing = 10;
    group3.margins = 0;

    var statictext1 = group3.add('statictext', undefined, undefined, { name: 'statictext1' });
    statictext1.text = 'Count:';
    statictext1.justify = 'right';

    var edittext1 = group2.add('edittext', undefined, undefined, { name: 'edittext1' });
    edittext1.text = '1';
    edittext1.preferredSize.width = 90;
    edittext1.preferredSize.height = 20;
    edittext1.active = true;

    var group4 = group2.add('group', undefined, { name: 'group4' });
    group4.preferredSize.width = 80;
    group4.orientation = 'row';
    group4.alignChildren = ['right', 'center'];
    group4.spacing = 10;
    group4.margins = 0;

    var statictext2 = group4.add('statictext', undefined, undefined, { name: 'statictext2' });
    statictext2.text = 'Columns:';
    statictext2.justify = 'right';
    statictext2.visible = false;

    var edittext2 = group2.add('edittext', undefined, undefined, { name: 'edittext2' });
    edittext2.text = '1';
    edittext2.preferredSize.width = 90;
    edittext2.preferredSize.height = 20;
    edittext2.visible = false;

    var group5 = panel1.add('group', undefined, { name: 'group5' });
    group5.orientation = 'row';
    group5.alignChildren = ['left', 'fill'];
    group5.spacing = 10;
    group5.margins = 0;

    var checkbox1 = group5.add('checkbox', undefined, undefined, { name: 'checkbox1' });
    checkbox1.text = 'Create as a grid';

    var panel2 = group1.add('panel', undefined, undefined, { name: 'panel2' });
    panel2.text = 'Offset';
    panel2.orientation = 'row';
    panel2.alignChildren = ['left', 'center'];
    panel2.spacing = 10;
    panel2.margins = 10;

    var group6 = panel2.add('group', undefined, { name: 'group6' });
    group6.orientation = 'row';
    group6.alignChildren = ['left', 'fill'];
    group6.spacing = 10;
    group6.margins = 4;

    var group7 = group6.add('group', undefined, { name: 'group7' });
    group7.preferredSize.width = 60;
    group7.orientation = 'row';
    group7.alignChildren = ['right', 'center'];
    group7.spacing = 10;
    group7.margins = 0;

    var statictext3 = group7.add('statictext', undefined, undefined, { name: 'statictext3' });
    statictext3.text = 'Vertical:';
    statictext3.justify = 'right';

    var edittext3 = group6.add('edittext', undefined, undefined, { name: 'edittext3' });
    edittext3.text = '10';
    edittext3.preferredSize.width = 90;
    edittext3.preferredSize.height = 20;

    var group8 = group6.add('group', undefined, { name: 'group8' });
    group8.preferredSize.width = 80;
    group8.orientation = 'row';
    group8.alignChildren = ['right', 'center'];
    group8.spacing = 10;
    group8.margins = 0;

    var statictext4 = group8.add('statictext', undefined, undefined, { name: 'statictext4' });
    statictext4.text = 'Horizontal:';
    statictext4.justify = 'right';

    var edittext4 = group6.add('edittext', undefined, undefined, { name: 'edittext4' });
    edittext4.text = '10';
    edittext4.preferredSize.width = 90;
    edittext4.preferredSize.height = 20;

    var group9 = dialog.add('group', undefined, { name: 'group9' });
    group9.orientation = 'column';
    group9.alignChildren = ['center', 'center'];
    group9.spacing = 10;
    group9.margins = 0;

    var button1 = group9.add('button', undefined, undefined, { name: 'button1' });
    button1.text = 'OK';
    button1.preferredSize.width = 90;
    button1.preferredSize.height = 30;

    var button2 = group9.add('button', undefined, undefined, { name: 'button2' });
    button2.text = 'Cancel';
    button2.preferredSize.width = 90;
    button2.preferredSize.height = 30;

    var checkbox2 = group9.add('checkbox', undefined, undefined, { name: 'checkbox2' });
    checkbox2.text = 'Preview';

    // Hidden button for ESC key workaround
    var button3 = group9.add('button', undefined, undefined, { name: 'button3' });
    button3.text = 'Cancel';
    button3.preferredSize.height = 18;
    button3.hide();

    button3.onClick = function() {
        if (checkbox2.value) {
            restore(items);
        }
        dialog.close();
    }

    button2.onClick = function() {
        button3.notify('onClick');
    }

    checkbox1.onClick = function() {
        statictext2.visible = !statictext2.visible;
        edittext2.visible = !edittext2.visible;
        panel1.text = checkbox1.value ? 'Grid' : 'Repeat';
        statictext1.text = checkbox1.value ? 'Rows:' : 'Count:';
        edittext1.active = false;
        edittext1.active = true;
        preview(dialog, items);
    }

    edittext1.onChanging = function() {
        preview(dialog, items);
    }

    edittext2.onChanging = function() {
        preview(dialog, items);
    }

    edittext3.onChanging = function() {
        preview(dialog, items);
    }

    edittext4.onChanging = function() {
        preview(dialog, items);
    }

    edittext1.addEventListener('keydown', function(event) {
        setRepeatValue(event);
        preview(dialog, items);
    });

    edittext2.addEventListener('keydown', function(event) {
        setRepeatValue(event);
        preview(dialog, items);
    });

    edittext3.addEventListener('keydown', function(event) {
        setOffsetValue(event);
        preview(dialog, items);
    });

    edittext4.addEventListener('keydown', function(event) {
        setOffsetValue(event);
        preview(dialog, items);
    });

    statictext1.addEventListener('click', function() {
        edittext1.active = false;
        edittext1.active = true;
    });

    statictext2.addEventListener('click', function() {
        edittext2.active = false;
        edittext2.active = true;
    });

    statictext3.addEventListener('click', function() {
        edittext3.active = false;
        edittext3.active = true;
    });

    statictext4.addEventListener('click', function() {
        edittext4.active = false;
        edittext4.active = true;
    });

    dialog.rows = edittext1;
    dialog.columns = edittext2;
    dialog.vertical = edittext3;
    dialog.horizontal = edittext4;
    dialog.grid = checkbox1;
    dialog.preview = checkbox2;
    dialog.ok = button1;
    return dialog;
}

/**
 * Handle keyboard input for repeat values (up/down arrows)
 * @param {Object} event - Keyboard event
 */
function setRepeatValue(event) {
    var value = getValue(event.target.text);
    var keyboard = ScriptUI.environment.keyboardState;
    var step = keyboard.shiftKey ? 5 : 1;
    if (event.keyName == 'Up') {
        value += step;
        event.target.text = value;
        event.preventDefault();
    }
    if (event.keyName == 'Down') {
        value -= step;
        if (value < 1) value = 1;
        event.target.text = value;
        event.preventDefault();
    }
}

/**
 * Handle keyboard input for offset values (up/down arrows)
 * @param {Object} event - Keyboard event
 */
function setOffsetValue(event) {
    var value = getValue(event.target.text);
    var keyboard = ScriptUI.environment.keyboardState;
    var step = keyboard.shiftKey ? 5 : 1;
    if (event.keyName == 'Up') {
        value += step;
        event.target.text = value;
        event.preventDefault();
    }
    if (event.keyName == 'Down') {
        value -= step;
        event.target.text = value;
        event.preventDefault();
    }
}

// ============================================================================
// ENTRY POINT (handled by IIFE at top)
// ============================================================================
