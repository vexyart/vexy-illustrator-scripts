/**
 * Remember Selection Layers
 * @version 1.0.0
 * @description Save and restore selected items to their original layers
 * @category Selection
 *
 * Features:
 * - Save layer data to item tags
 * - Restore items to original layers
 * - Clear saved layer data
 * - Works with matching layer names
 * - Handles locked and hidden layers
 *
 * Note: Order within layers is not restored
 *
 * Original: RememberSelectionLayers.jsx by Sergey Osokin (hi@sergosokin.ru)
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

    if (!AIS.Document.hasSelection()) {
        alert('No selection\nSelect one or more items and try again');
        return;
    }

    main();
})();

// ============================================================================
// CONFIGURATION
// ============================================================================

var CFG = {
    scriptName: 'Remember Selection Layers',
    version: '1.0.0',
    keyLayer: 'lyrParent',
    keyIndex: 'lyrIdx',
    uiOpacity: 0.98
};

// ============================================================================
// MAIN FUNCTION
// ============================================================================

function main() {
    try {
        var dialog = createDialog();
        dialog.show();

    } catch (error) {
        AIS.Error.show('Remember Selection Layers Error', error);
    }
}

// ============================================================================
// USER INTERFACE
// ============================================================================

function createDialog() {
    var dialog = new Window('dialog', CFG.scriptName + ' ' + CFG.version);
    dialog.preferredSize.width = 210;
    dialog.orientation = 'column';
    dialog.alignChildren = ['fill', 'center'];
    dialog.opacity = CFG.uiOpacity;

    var saveButton = dialog.add('button', undefined, 'Save Layers Data');
    var restoreButton = dialog.add('button', undefined, 'Restore To Original');
    var clearButton = dialog.add('button', undefined, 'Clear Data');
    var cancelButton = dialog.add('button', undefined, 'Cancel', { name: 'cancel' });

    var copyright = dialog.add('statictext', undefined, 'Visit Github');
    copyright.justify = 'center';

    saveButton.onClick = function() {
        saveLayers();
        dialog.close();
    };

    restoreButton.onClick = function() {
        restoreLayers();
        dialog.close();
    };

    clearButton.onClick = function() {
        clearLayerData();
        dialog.close();
    };

    cancelButton.onClick = function() {
        dialog.close();
    };

    copyright.addEventListener('mousedown', function() {
        AIS.System.openURL('https://github.com/creold/');
    });

    dialog.center();
    return dialog;
}

// ============================================================================
// CORE LOGIC
// ============================================================================

function saveLayers() {
    var selection = app.activeDocument.selection;

    for (var i = selection.length - 1; i >= 0; i--) {
        var item = selection[i];
        var parentLayer = getParentLayer(item);
        var sameLayers = getLayersByName(parentLayer.name);
        var layerIndex = sameLayers.length - 1;

        while (parentLayer !== sameLayers[layerIndex]) {
            layerIndex--;
        }

        addTag(item, CFG.keyLayer, parentLayer.name);
        addTag(item, CFG.keyIndex, layerIndex);
    }
}

function restoreLayers() {
    var selection = app.activeDocument.selection;

    for (var i = selection.length - 1; i >= 0; i--) {
        var item = selection[i];
        var layerName = getTagValue(item, CFG.keyLayer);
        var layerIndex = getTagValue(item, CFG.keyIndex);

        if (layerName.length && layerIndex.length) {
            moveToLayer(item, layerName, parseInt(layerIndex));
            removeTag(item, CFG.keyLayer);
            removeTag(item, CFG.keyIndex);
        }
    }
}

function clearLayerData() {
    var selection = app.activeDocument.selection;

    for (var i = selection.length - 1; i >= 0; i--) {
        var item = selection[i];
        removeTag(item, CFG.keyLayer);
        removeTag(item, CFG.keyIndex);
    }
}

// ============================================================================
// LAYER OPERATIONS
// ============================================================================

function getParentLayer(item) {
    if (item.parent.typename === 'Document') {
        return item;
    }
    return getParentLayer(item.parent);
}

function getLayersByName(name) {
    var layers = [];
    var doc = app.activeDocument;

    for (var i = doc.layers.length - 1; i >= 0; i--) {
        if (doc.layers[i].name === name) {
            layers.unshift(doc.layers[i]);
        }
    }

    return layers;
}

function moveToLayer(item, layerName, layerIndex) {
    var targetLayers = getLayersByName(layerName);

    if (item.layer === targetLayers[layerIndex]) return;

    try {
        var targetLayer = targetLayers[layerIndex];
        var wasVisible = targetLayer.visible;
        var wasLocked = targetLayer.locked;

        targetLayer.visible = true;
        targetLayer.locked = false;

        item.move(targetLayer, ElementPlacement.PLACEATBEGINNING);

        targetLayer.visible = wasVisible;
        targetLayer.locked = wasLocked;
    } catch (error) {
        // Layer may not be accessible
    }
}

// ============================================================================
// TAG OPERATIONS
// ============================================================================

function addTag(item, key, value) {
    var tag = item.tags.add();
    tag.name = key;
    tag.value = value;
}

function getTagValue(item, key) {
    try {
        var tag = item.tags.getByName(key);
        return tag.value;
    } catch (error) {
        return '';
    }
}

function removeTag(item, key) {
    try {
        var tag = item.tags.getByName(key);
        tag.remove();
    } catch (error) {
        // Tag may not exist
    }
}
