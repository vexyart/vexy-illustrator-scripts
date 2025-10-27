/**
 * Color Group Replacer
 * @version 1.0.0
 * @description Replaces spot color values in one color group with spot colors from another group
 * @category Colors
 * @author Sergey Osokin (https://github.com/creold)
 * @license MIT
 * @modernized 2025 - Adapted for AIS framework
 * @features
 *   - Replace by matching swatch names
 *   - Replace by swatch order
 *   - Live preview mode
 *   - Works with spot colors only
 *   - Preserves swatch names
 *   - Updates all artwork using the swatches
 * @usage
 *   1. Ensure you have at least 2 color groups in the Swatches panel
 *   2. Run the script
 *   3. Select source group (colors to copy from)
 *   4. Select destination group (colors to replace)
 *   5. Choose mode: by matching names or by order
 *   6. Enable preview to see changes in real-time
 * @notes
 *   Only spot colors are replaced
 *   Name matching is case-insensitive and uses partial matching
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
    uiMgns: [10, 15, 10, 10],
    dlgOpacity: 0.98
};

// ============================================================================
// MAIN FUNCTION
// ============================================================================
function main() {
    var doc = app.activeDocument;
    var swGroups = getColorGroups(doc);

    if (swGroups.length < 2) {
        alert('Insufficient color groups\nAt least two color groups are required');
        return;
    }

    showDialog(doc, swGroups);
}

// ============================================================================
// USER INTERFACE
// ============================================================================
function showDialog(doc, swGroups) {
    var isUndo = false;
    var toName = swGroups[0];
    var fromName = swGroups[1];
    var lastIdx = swGroups.length - 1;

    var win = new Window('dialog', 'Color Group Replacer v1.0.0');
    win.orientation = 'column';
    win.alignChildren = ['fill', 'top'];
    win.opacity = CFG.dlgOpacity;

    // Source
    var fromPnl = win.add('panel', undefined, 'Pick from color group');
    fromPnl.alignChildren = 'fill';
    fromPnl.margins = CFG.uiMgns;

    var fromList = fromPnl.add('dropdownlist', undefined, swGroups);
    fromList.selection = 1;

    // Destination
    var toPnl = win.add('panel', undefined, 'Apply to color group');
    toPnl.alignChildren = 'fill';
    toPnl.margins = CFG.uiMgns;

    var toList = toPnl.add('dropdownlist', undefined, swGroups);
    toList.selection = 0;

    // Replace mode
    var modePnl = win.add('panel', undefined, 'Mode');
    modePnl.orientation = 'row';
    modePnl.alignChildren = 'left';
    modePnl.margins = CFG.uiMgns;

    var isByName = modePnl.add('radiobutton', undefined, 'By matching names');
    isByName.value = true;

    var isByOrder = modePnl.add('radiobutton', undefined, 'By swatches order');

    // Buttons
    var btns = win.add('group');
    btns.alignChildren = ['fill', 'bottom'];

    var isPreview = btns.add('checkbox', undefined, 'Preview');
    isPreview.value = false;

    var cancel, ok;
    if (AIS.System.isMac()) {
        cancel = btns.add('button', undefined, 'Cancel', { name: 'cancel' });
        ok = btns.add('button', undefined, 'Apply', { name: 'ok' });
    } else {
        ok = btns.add('button', undefined, 'Apply', { name: 'ok' });
        cancel = btns.add('button', undefined, 'Cancel', { name: 'cancel' });
    }
    cancel.helpTip = 'Press Esc to Close';
    ok.helpTip = 'Press Enter to Run';

    var copyright = win.add('statictext', undefined, '\u00A9 Sergey Osokin. Visit Github');
    copyright.justify = 'center';

    // Events
    if (isPreview.value) preview();

    toList.onChange = fromList.onChange = function() {
        toName = toList.selection.text;
        fromName = fromList.selection.text;
        preview();
    };

    isByName.onClick = isByOrder.onClick = isPreview.onClick = preview;

    function preview() {
        try {
            if (isPreview.value) {
                if (isUndo) {
                    app.undo();
                } else {
                    isUndo = true;
                }
                validateAndReplace(true);
                // Force redraw by adding and removing layer
                var aLayer = doc.activeLayer;
                var tmpLayer = doc.layers.add();
                doc.activeLayer = aLayer;
                tmpLayer.remove();
                app.redraw();
            } else if (isUndo) {
                app.undo();
                app.redraw();
                isUndo = false;
            }
        } catch (err) {
            AIS.Error.show('Preview failed', err);
        }
    }

    ok.onClick = function() {
        if (isUndo) app.undo();
        validateAndReplace(false);
        isUndo = false;
    };

    cancel.onClick = function() {
        if (isUndo) app.undo();
        win.close();
    };

    copyright.addEventListener('mousedown', function() {
        AIS.System.openURL('https://github.com/creold');
    });

    function validateAndReplace(fromPreview) {
        var destIdx = toList.selection.index;

        if (fromName === toName) {
            alert('Invalid selection\nSelect a group other than destination');
            isUndo = false;
            fromList.selection = destIdx == lastIdx ? 0 : Math.min(destIdx + 1, lastIdx);
            return;
        }

        replaceSpotColors(toName, fromName, isByOrder.value);

        if (!fromPreview) win.close();
    }

    win.center();
    win.show();
}

// ============================================================================
// CORE LOGIC
// ============================================================================

/**
 * Get document color group names
 * @param {Document} doc - Active document
 * @returns {Array} - Array of color group names
 */
function getColorGroups(doc) {
    var out = [];

    for (var i = 0; i < doc.swatchGroups.length; i++) {
        var group = doc.swatchGroups[i];
        if (group.name !== '') out.push(group.name);
    }

    return out;
}

/**
 * Replace spot color values
 * @param {string} toStr - Destination group name
 * @param {string} fromStr - Source group name
 * @param {boolean} isByOrder - Use order matching vs name matching
 */
function replaceSpotColors(toStr, fromStr, isByOrder) {
    var doc = app.activeDocument;

    try {
        var toGroup = doc.swatchGroups.getByName(toStr);
    } catch (err) {
        alert('Group not found\n' + toStr + ' was not found');
        return;
    }

    try {
        var fromGroup = doc.swatchGroups.getByName(fromStr);
    } catch (err) {
        alert('Group not found\n' + fromStr + ' was not found');
        return;
    }

    var toColors = toGroup.getAllSwatches();
    var fromColors = fromGroup.getAllSwatches();

    for (var j = 0; j < toColors.length; j++) {
        var toSw = toColors[j];
        var name = toSw.name.toLowerCase();
        if (isNotSpot(toSw)) continue;

        if (isByOrder) {
            if (fromColors[j] && !isNotSpot(fromColors[j])) {
                replaceColorValues(toSw, fromColors[j]);
            }
        } else {
            for (var k = 0; k < fromColors.length; k++) {
                var fromSw = fromColors[k];
                if (isNotSpot(fromSw)) continue;
                if (fromSw.name.toLowerCase().indexOf(name) !== -1) {
                    replaceColorValues(toSw, fromSw);
                }
            }
        }
    }
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Check if swatch is NOT a spot color
 * @param {Swatch} sw - Swatch to check
 * @returns {boolean} - True if not a spot color
 */
function isNotSpot(sw) {
    return sw.color.typename !== 'SpotColor';
}

/**
 * Replace color values for RGB or CMYK
 * @param {Swatch} sw1 - Destination swatch
 * @param {Swatch} sw2 - Source swatch
 */
function replaceColorValues(sw1, sw2) {
    var c1 = sw1.color.spot.color;
    var c2 = sw2.color.spot.color;
    for (var key in c1) {
        if (typeof c1[key] === 'number' && c2.hasOwnProperty(key)) {
            c1[key] = c2[key];
        }
    }
}
