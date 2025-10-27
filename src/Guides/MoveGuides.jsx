/**
 * Move Guides
 * @version 1.0.0
 * @description Move all guide objects to a layer, frontmost, or backmost
 * @category Guides
 *
 * Features:
 * - Move guides to a specific layer (creates if doesn't exist)
 * - Bring guides to front of each layer
 * - Send guides to back of each layer
 * - Works with unlocked and visible layers only
 * - Uses menu command detection to find guides
 * - Custom layer naming
 *
 * Note: Guides in locked or hidden layers are not processed
 *
 * Original: moveGuides.js by sky-chaser-high
 * Homepage: github.com/sky-chaser-high/adobe-illustrator-scripts
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
    scriptName: 'Move Guides',
    version: '1.0.0',
    defaultLayerName: 'Guides'
};

// ============================================================================
// MAIN FUNCTION
// ============================================================================

function main() {
    try {
        var dialog = createDialog();
        dialog.show();

    } catch (error) {
        AIS.Error.show('Move Guides Error', error);
    }
}

// ============================================================================
// USER INTERFACE
// ============================================================================

function createDialog() {
    var dialog = new Window('dialog', CFG.scriptName + ' ' + CFG.version);
    dialog.orientation = 'column';
    dialog.alignChildren = ['fill', 'top'];
    dialog.spacing = 10;
    dialog.margins = 16;

    var destinationPanel = dialog.add('panel', undefined, 'Destination');
    destinationPanel.orientation = 'column';
    destinationPanel.alignChildren = ['left', 'top'];
    destinationPanel.spacing = 10;
    destinationPanel.margins = 10;

    var optionsGroup = destinationPanel.add('group');
    optionsGroup.orientation = 'column';
    optionsGroup.alignChildren = ['left', 'center'];
    optionsGroup.spacing = 10;
    optionsGroup.margins = [0, 8, 0, 0];

    var layerRadio = optionsGroup.add('radiobutton', undefined, 'Layer');
    layerRadio.value = true;

    var layerInputGroup = optionsGroup.add('group');
    layerInputGroup.orientation = 'row';
    layerInputGroup.alignChildren = ['left', 'center'];
    layerInputGroup.spacing = 10;
    layerInputGroup.margins = [18, 0, 0, 6];

    var nameLabel = layerInputGroup.add('statictext', undefined, 'Name:');
    var nameInput = layerInputGroup.add('edittext', undefined, CFG.defaultLayerName);
    nameInput.preferredSize.width = 100;
    nameInput.active = true;

    var frontRadio = optionsGroup.add('radiobutton', undefined, 'Bring to Front');
    var backRadio = optionsGroup.add('radiobutton', undefined, 'Send to Back');

    var buttonGroup = dialog.add('group');
    buttonGroup.orientation = 'row';
    buttonGroup.alignChildren = ['right', 'center'];
    buttonGroup.spacing = 10;
    buttonGroup.margins = [0, 6, 0, 0];

    var cancelButton = buttonGroup.add('button', undefined, 'Cancel', { name: 'cancel' });
    cancelButton.preferredSize.width = 90;

    var okButton = buttonGroup.add('button', undefined, 'OK', { name: 'ok' });
    okButton.preferredSize.width = 90;

    nameLabel.addEventListener('click', function() {
        nameInput.active = false;
        nameInput.active = true;
    });

    layerRadio.onClick = function() {
        frontRadio.value = false;
        backRadio.value = false;
        layerInputGroup.enabled = true;
        nameInput.active = false;
        nameInput.active = true;
    };

    frontRadio.onClick = function() {
        layerRadio.value = false;
        layerInputGroup.enabled = false;
    };

    backRadio.onClick = function() {
        layerRadio.value = false;
        layerInputGroup.enabled = false;
    };

    okButton.onClick = function() {
        var layerName = nameInput.text || CFG.defaultLayerName;

        var destination = {
            moveToLayer: layerRadio.value,
            bringToFront: frontRadio.value,
            sendToBack: backRadio.value,
            layerName: layerName
        };

        moveGuidesTo(destination);
        dialog.close();
    };

    cancelButton.onClick = function() {
        dialog.close();
    };

    return dialog;
}

// ============================================================================
// CORE LOGIC
// ============================================================================

function moveGuidesTo(destination) {
    var doc = app.activeDocument;
    var initialPathCount = doc.pathItems.length;

    app.executeMenuCommand('deselectall');
    app.executeMenuCommand('clearguide');

    var afterClearCount = doc.pathItems.length;

    if (initialPathCount === afterClearCount) {
        alert('No guides found\nDocument contains no guide objects to move');
        return;
    }

    app.executeMenuCommand('undo');

    if (destination.moveToLayer) {
        moveSelectedToLayer(destination.layerName);
    }

    if (destination.bringToFront) {
        app.executeMenuCommand('sendToFront');
    }

    if (destination.sendToBack) {
        app.executeMenuCommand('sendToBack');
    }

    app.executeMenuCommand('deselectall');
}

// ============================================================================
// LAYER OPERATIONS
// ============================================================================

function moveSelectedToLayer(layerName) {
    var layer = getOrCreateLayer(layerName);
    var selectedItems = app.activeDocument.selection;

    for (var i = selectedItems.length - 1; i >= 0; i--) {
        var item = selectedItems[i];
        item.move(layer, ElementPlacement.PLACEATEND);
    }
}

function getOrCreateLayer(layerName) {
    if (layerExists(layerName)) {
        var layer = app.activeDocument.layers[layerName];
        layer.locked = false;
        layer.visible = true;
        return layer;
    }

    return createLayer(layerName);
}

function createLayer(layerName) {
    var layer = app.activeDocument.layers.add();
    layer.name = layerName;
    layer.zOrder(ZOrderMethod.BRINGTOFRONT);
    return layer;
}

function layerExists(layerName) {
    try {
        app.activeDocument.layers[layerName];
        return true;
    } catch (error) {
        return false;
    }
}
