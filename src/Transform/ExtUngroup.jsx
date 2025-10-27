/**
 * Extended Ungroup
 * @version 1.0.0
 * @description Custom ungrouping with multiple target options and clipping mask release
 * @category Transform
 *
 * Features:
 * - Target options: selected objects, active layer, artboard, or entire document
 * - Ungroup all nested groups recursively
 * - Release clipping masks with optional mask shape removal
 * - Removes empty clipping mask paths
 * - Works with visible and unlocked layers only
 *
 * Original: ExtUngroup.jsx by Sergey Osokin (hi@sergosokin.ru)
 * Based on: ungroupV1.js by Jiwoong Song & John Wundes
 * Homepage: github.com/creold/illustrator-scripts
 * Modernized for AIS framework
 */

#include "../.lib/core.jsx"

//@target illustrator
app.preferences.setBooleanPreference('ShowExternalJSXWarning', false);

(function() {
    if (!AIS.Document.hasDocument()) {
        alert('No document\nOpen a document and try again');
        return;
    }

    main();
})();

// ============================================================================
// CONFIGURATION
// ============================================================================

var CFG = {
    scriptName: 'Extended Ungroup',
    version: '1.0.0'
};

// Global state
var maskShapesToRemove = [];

// ============================================================================
// MAIN FUNCTION
// ============================================================================

function main() {
    try {
        var doc = app.activeDocument;

        if (doc.groupItems.length === 0) {
            alert('No groups found\nDocument does not contain any groups');
            return;
        }

        var dialog = createDialog(doc);
        dialog.show();

    } catch (error) {
        AIS.Error.show('Extended Ungroup Error', error);
    }
}

// ============================================================================
// USER INTERFACE
// ============================================================================

function createDialog(doc) {
    var currLayer = doc.activeLayer;
    var boardNum = doc.artboards.getActiveArtboardIndex() + 1;
    var hasSelection = doc.selection.length > 0;

    var win = new Window('dialog', CFG.scriptName + ' ' + CFG.version);
    win.orientation = 'column';
    win.alignChildren = ['fill', 'fill'];

    var targetPanel = win.add('panel', undefined, 'Target');
    targetPanel.alignChildren = 'left';
    targetPanel.margins = [10, 20, 10, 10];

    var selRadio = null;
    var layerRadio = null;

    if (hasSelection) {
        selRadio = targetPanel.add('radiobutton', undefined, 'Selected objects');
        selRadio.value = true;
    }

    if (!currLayer.locked && currLayer.visible) {
        layerRadio = targetPanel.add('radiobutton', undefined, 'Active layer "' + currLayer.name + '"');
        if (!hasSelection) layerRadio.value = true;
    }

    var boardRadio = targetPanel.add('radiobutton', undefined, 'Artboard \u2116 ' + boardNum);
    var docRadio = targetPanel.add('radiobutton', undefined, 'All in document');

    if (!hasSelection && !layerRadio) {
        boardRadio.value = true;
    }

    var optionsPanel = win.add('panel', undefined, 'Options');
    optionsPanel.alignChildren = 'left';
    optionsPanel.margins = [10, 20, 10, 10];

    var ungroupCheck = optionsPanel.add('checkbox', undefined, 'Ungroup All');
    ungroupCheck.value = true;

    var clippingCheck = optionsPanel.add('checkbox', undefined, 'Release Clipping Masks');
    var removeMaskCheck = optionsPanel.add('checkbox', undefined, 'Remove Mask Shapes');
    removeMaskCheck.enabled = false;

    clippingCheck.onClick = function() {
        removeMaskCheck.enabled = clippingCheck.value;
    };

    var buttonGroup = win.add('group');
    buttonGroup.alignChildren = ['fill', 'fill'];
    buttonGroup.margins = [0, 10, 0, 0];

    var cancelButton = buttonGroup.add('button', undefined, 'Cancel', { name: 'cancel' });
    cancelButton.helpTip = 'Press Esc to Close';

    var okButton = buttonGroup.add('button', undefined, 'OK', { name: 'ok' });
    okButton.helpTip = 'Press Enter to Run';

    var copyright = win.add('statictext', undefined, '\u00A9 Sergey Osokin, sergosokin.ru');
    copyright.justify = 'center';
    copyright.enabled = false;

    okButton.onClick = function() {
        maskShapesToRemove = [];

        if (selRadio && selRadio.value) {
            processSelection(doc, clippingCheck.value);
        }
        else if (layerRadio && layerRadio.value) {
            ungroupRecursive(currLayer, clippingCheck.value);
        }
        else if (boardRadio.value) {
            processArtboard(doc, clippingCheck.value);
        }
        else if (docRadio.value) {
            processDocument(doc, clippingCheck.value);
        }

        if (removeMaskCheck.value) {
            removeMaskShapes(maskShapesToRemove);
        }

        win.close();
    };

    cancelButton.onClick = function() {
        win.close();
    };

    return win;
}

// ============================================================================
// CORE LOGIC
// ============================================================================

function processSelection(doc, releaseClipping) {
    var selection = doc.selection;
    for (var i = 0; i < selection.length; i++) {
        if (selection[i].typename === 'GroupItem') {
            ungroupRecursive(selection[i], releaseClipping);
        }
    }
}

function processArtboard(doc, releaseClipping) {
    doc.selectObjectsOnActiveArtboard();
    var items = doc.selection;
    for (var i = 0; i < items.length; i++) {
        if (items[i].typename === 'GroupItem') {
            ungroupRecursive(items[i], releaseClipping);
        }
    }
    doc.selection = null;
}

function processDocument(doc, releaseClipping) {
    for (var i = 0; i < doc.layers.length; i++) {
        var layer = doc.layers[i];
        if (!layer.locked && layer.visible && layer.groupItems.length > 0) {
            ungroupRecursive(layer, releaseClipping);
        }
    }
}

function ungroupRecursive(obj, releaseClipping) {
    if (!releaseClipping && obj.clipped) {
        return;
    }

    var children = getChildren(obj);

    if (children.length < 1) {
        obj.remove();
        return;
    }

    for (var i = 0; i < children.length; i++) {
        var child = children[i];
        try {
            if (child.parent.typename !== 'Layer') {
                child.move(obj, ElementPlacement.PLACEBEFORE);

                if (isEmptyMaskShape(child)) {
                    maskShapesToRemove.push(child);
                }
            }

            if (child.typename === 'GroupItem' || child.typename === 'Layer') {
                ungroupRecursive(child, releaseClipping);
            }
        } catch (error) {
            // Continue processing other items
        }
    }
}

function getChildren(obj) {
    var children = [];

    if (Object.prototype.toString.call(obj) === '[object Array]') {
        children.push.apply(children, obj);
    } else {
        for (var i = 0; i < obj.pageItems.length; i++) {
            children.push(obj.pageItems[i]);
        }
    }

    if (obj.layers) {
        for (var i = 0; i < obj.layers.length; i++) {
            children.push(obj.layers[i]);
        }
    }

    return children;
}

function isEmptyMaskShape(item) {
    if (item.typename === 'PathItem' && !item.filled && !item.stroked) {
        return true;
    }

    if (item.typename === 'CompoundPathItem' &&
        !item.pathItems[0].filled && !item.pathItems[0].stroked) {
        return true;
    }

    if (item.typename === 'TextFrame' &&
        item.textRange.fillColor == '[NoColor]' &&
        item.textRange.strokeColor == '[NoColor]') {
        return true;
    }

    return false;
}

function removeMaskShapes(shapes) {
    for (var i = 0; i < shapes.length; i++) {
        shapes[i].remove();
    }
}
