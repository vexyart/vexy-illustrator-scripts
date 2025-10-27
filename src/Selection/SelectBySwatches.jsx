/**
 * Select By Swatches
 * @version 1.0.0
 * @description Selects objects if the stroke or fill color matches selected swatches
 * @category Selection
 * @author Sergey Osokin (https://github.com/creold)
 * @license MIT
 * @modernized 2025 - Adapted for AIS framework
 * @features
 *   - Select by fill color matching swatches
 *   - Select by stroke color matching swatches
 *   - Select by either fill or stroke color
 *   - Keyboard shortcuts (1, 2, 3)
 *   - Supports multiple swatch selection
 *   - Fast selection via dynamic actions
 * @usage
 *   1. Select one or more swatches in the Swatches panel
 *   2. Run the script
 *   3. Choose Fill Color (1), Stroke Color (2), or Fill or Stroke (3)
 * @notes
 *   WARNING: Don't put this script in an action slot for quick run - it will freeze Illustrator
 *   Uses temporary actions for fast selection with multiple swatches
 */

#include "../.lib/core.jsx"

//@target illustrator
app.preferences.setBooleanPreference('ShowExternalJSXWarning', false);

(function() {
    if (!AIS.Document.hasDocument()) {
        alert('No documents\nOpen a document and try again');
        return;
    }
    main();
})();

// ============================================================================
// CONFIGURATION
// ============================================================================
var CFG = {
    keyword: '%selswatch%',
    set: 'SelBySwatch',
    action: 'SelectByNote',
    path: Folder.myDocuments + '/Adobe Scripts/',
    dlgOpacity: 0.97
};

// ============================================================================
// MAIN FUNCTION
// ============================================================================
function main() {
    var doc = app.activeDocument;
    var selSwatch = doc.swatches.getSelected();

    if (!selSwatch.length) {
        alert('No swatches selected\nSelect at least one swatch and try again');
        return;
    }

    showDialog(doc, selSwatch);
}

// ============================================================================
// USER INTERFACE
// ============================================================================
function showDialog(doc, selSwatch) {
    var win = new Window('dialog', 'Select By Swatches v1.0.0');
    win.orientation = 'column';
    win.alignChildren = 'fill';
    win.spacing = 10;
    win.margins = 16;
    win.preferredSize.width = 190;
    win.opacity = CFG.dlgOpacity;

    var fillBtn = win.add('button', undefined, 'Fill Color');
    fillBtn.helpTip = 'Press <1> for quick access';

    var strokeBtn = win.add('button', undefined, 'Stroke Color');
    strokeBtn.helpTip = 'Press <2> for quick access';

    var anyBtn = win.add('button', undefined, 'Fill or Stroke');
    anyBtn.helpTip = 'Press <3> for quick access';

    // Auto-focus on Mac or recent AI versions
    if (AIS.System.isMac() || parseFloat(app.version) >= 26.4 || parseFloat(app.version) <= 17) {
        fillBtn.active = true;
    }

    var copyright = win.add('statictext', undefined, 'Visit Github');
    copyright.justify = 'center';

    copyright.addEventListener('mousedown', function() {
        AIS.System.openURL('https://github.com/creold/');
    });

    fillBtn.onClick = function() { process(1); };
    strokeBtn.onClick = function() { process(2); };
    anyBtn.onClick = function() { process(3); };

    // Keyboard shortcuts
    win.addEventListener('keydown', function(kd) {
        var key = kd.keyName;
        if (key.match(/1/)) fillBtn.notify();
        if (key.match(/2/)) strokeBtn.notify();
        if (key.match(/3/)) anyBtn.notify();
    });

    function process(code) {
        // Fix bug on PC when top layer is hidden or locked
        var tmpLay = doc.layers.add();

        var items = [];
        switch (selSwatch.length) {
            case 1:
                items = getItemsBySwatch(selSwatch[0], code);
                selectItems(items, code);
                break;
            default: // Multiple swatches selected
                for (var i = 0; i < selSwatch.length; i++) {
                    items = items.concat(getItemsBySwatch(selSwatch[i], code));
                }
                selectItems(items, 3);
                break;
        }

        if (!items.length) {
            alert('No items found\nNo objects match the selected swatches');
        }

        try {
            tmpLay.remove();
        } catch (err) {}

        win.close();
    }

    win.center();
    win.show();
}

// ============================================================================
// CORE LOGIC
// ============================================================================

/**
 * Find objects of the same color
 * @param {Object} swatch - The swatch color
 * @param {number} code - Selection mode (1=fill, 2=stroke, 3=both)
 * @returns {Array} - Array of selected items
 */
function getItemsBySwatch(swatch, code) {
    var doc = app.activeDocument;
    var total = [];

    if (code == 1 || code == 3) {
        app.selection = null;
        doc.defaultFillColor = swatch.color;
        app.executeMenuCommand('Find Fill Color menu item');
        if (app.selection.length) {
            total.push.apply(total, app.selection);
        }
    }

    if (code == 2 || code == 3) {
        app.selection = null;
        doc.defaultStrokeColor = swatch.color;
        app.executeMenuCommand('Find Stroke Color menu item');
        if (app.selection.length) {
            total.push.apply(total, app.selection);
        }
    }

    return total;
}

/**
 * Selects items in array (handles multiple swatches via action)
 * @param {Array} arr - Array of items to select
 * @param {number} code - Selection mode
 */
function selectItems(arr, code) {
    if (code !== 3 || !arr.length) return;
    addNote(arr, CFG.keyword);
    selectByNote(CFG.set, CFG.action, CFG.path, CFG.keyword);
    removeNote(arr, CFG.keyword);
}

/**
 * Put keyword into Note in Attributes panel
 * @param {Array} coll - Array of items
 * @param {string} key - Keyword for notes
 */
function addNote(coll, key) {
    for (var i = 0; i < coll.length; i++) {
        if (coll[i].note == '') {
            coll[i].note = key;
        } else {
            coll[i].note += key;
        }
    }
}

/**
 * Remove keyword from Note in Attributes panel
 * @param {Array} coll - Array of items
 * @param {string} key - Keyword for notes
 */
function removeNote(coll, key) {
    var regexp = new RegExp(key, 'gi');
    for (var i = 0; i < coll.length; i++) {
        coll[i].note = coll[i].note.replace(regexp, '');
    }
}

/**
 * Run fast selection via created action
 * @param {string} set - Name of action set
 * @param {string} name - Action name
 * @param {string} path - Folder path for .aia file
 * @param {string} key - Keyword for notes
 */
function selectByNote(set, name, path, key) {
    if (!Folder(path).exists) Folder(path).create();

    // Generate Action
    var actionCode = '/version 3\n' +
        '/name [ ' + set.length + '\n' +
        '  ' + ascii2Hex(set) + '\n' +
        ']\n' +
        '/isOpen 1\n' +
        '/actionCount 1\n' +
        '/action-1 {\n' +
        '  /name [ ' + name.length + '\n' +
        '    ' + ascii2Hex(name) + '\n' +
        '  ]\n' +
        '  /keyIndex 0\n' +
        '  /colorIndex 0\n' +
        '  /isOpen 1\n' +
        '  /eventCount 1\n' +
        '  /event-1 {\n' +
        '    /useRulersIn1stQuadrant 0\n' +
        '    /internalName (adobe_setSelection)\n' +
        '    /localizedName [ 13\n' +
        '      5365742053656c656374696f6e\n' +
        '    ]\n' +
        '    /isOpen 0\n' +
        '    /isOn 1\n' +
        '    /hasDialog 0\n' +
        '    /parameterCount 3\n' +
        '    /parameter-1 {\n' +
        '      /key 1952807028\n' +
        '      /showInPalette 4294967295\n' +
        '      /type (ustring)\n' +
        '      /value [ ' + key.length + '\n' +
        '        ' + ascii2Hex(key) + '\n' +
        '      ]\n' +
        '    }\n' +
        '    /parameter-2 {\n' +
        '      /key 2003792484\n' +
        '      /showInPalette 4294967295\n' +
        '      /type (boolean)\n' +
        '      /value 0\n' +
        '    }\n' +
        '    /parameter-3 {\n' +
        '      /key 1667330917\n' +
        '      /showInPalette 4294967295\n' +
        '      /type (boolean)\n' +
        '      /value 0\n' +
        '    }\n' +
        '  }\n' +
        '}';

    try {
        app.unloadAction(set, '');
    } catch (err) {}

    createAction(actionCode, set, path);
    app.doScript(name, set);
    app.redraw();
    app.unloadAction(set, '');
}

/**
 * Load Action to Adobe Illustrator
 * @param {string} str - Action code
 * @param {string} set - Name of action set
 * @param {string} path - Folder path for .aia file
 */
function createAction(str, set, path) {
    var f = new File(path + '/' + set + '.aia');
    f.open('w');
    f.write(str);
    f.close();
    app.loadAction(f);
    f.remove();
}

/**
 * Convert string to hex
 * @param {string} str - Input string
 * @returns {string} - Hex value
 */
function ascii2Hex(str) {
    return str.replace(/./g, function(a) {
        return a.charCodeAt(0).toString(16);
    });
}
