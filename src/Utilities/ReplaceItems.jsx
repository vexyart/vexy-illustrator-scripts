/**
 * Replace Items
 * @version 1.0.0
 * @description Replace selected objects with clipboard/group items
 * @category Utilities
 *
 * Features:
 * - Replace with object from clipboard, top object, or group items
 * - Fit to element size or copy exact dimensions
 * - Copy colors from original objects
 * - Random rotation option
 * - Symbol alignment by registration point
 * - Save/restore preferences
 *
 * Original: replaceItems.jsx by Alexander Ladygin
 * Modernized for AIS framework (removed 'with' statements)
 */




//@target illustrator
var c=File(Folder.myDocuments+"/Adobe Scripts/vexy-ville.ini");if(c.exists){c.open('r');var p=c.read();c.close();var l=File(p+".lib/core.jsx");if(l.exists)$.evalFile(l.fsName);}
app.preferences.setBooleanPreference('ShowExternalJSXWarning', false);

// ============================================================================
// CONFIGURATION
// ============================================================================

var CFG = {
    scriptName: 'Replace Items',
    version: '1.0.0'
};

var SETTINGS = {
    name: 'ReplaceItems_settings.json',
    folder: Folder.myDocuments + '/Adobe Scripts/'
};

// ============================================================================
// MAIN FUNCTION
// ============================================================================

function main() {
    var config = showDialog();
    if (!config) return;

    try {
        executeReplacement(config);
        alert('Replacement complete\nObjects replaced successfully', 'Success');
    } catch (error) {
        AIS.Error.show('Replace Items Error', error);
    }
}

// ============================================================================
// CORE LOGIC
// ============================================================================

function executeReplacement(config) {
    var items = config.replaceInGroup ? app.activeDocument.selection[app.activeDocument.selection.length - 1].pageItems : app.activeDocument.selection;
    var sourceNodes = getSourceNodes(config);

    if (!sourceNodes || (Array.isArray(sourceNodes) && sourceNodes.length === 0)) {
        alert('No source object\nEnsure clipboard has content or group has items');
        return;
    }

    var nodeIndex = 0;

    for (var i = items.length - 1; i >= 0; i--) {
        if (config.sourceMode === 'buffer' && i === 0) break;

        var item = items[i];
        var sourceNode = getNodeForReplacement(sourceNodes, config.sourceMode, nodeIndex);
        var newNode = sourceNode.duplicate(item, ElementPlacement.PLACEBEFORE);

        if (config.randomRotate) {
            randomRotation(newNode);
        }

        applySize(newNode, item, config);
        positionNode(newNode, item, config);

        if (config.copyColors) {
            var itemColor = getFillColor([item]);
            if (itemColor) {
                setFillColor([newNode], itemColor);
            }
        }

        if (!config.saveOriginal) {
            item.remove();
        }

        nodeIndex++;
        if (config.sourceMode === 'successive' && nodeIndex >= sourceNodes.length) {
            nodeIndex = 0;
        }
    }

    if (config.sourceMode === 'buffer' && typeof sourceNodes.remove === 'function') {
        sourceNodes.remove();
    }
}

function getSourceNodes(config) {
    var sel = app.activeDocument.selection;

    if (config.sourceMode === 'buffer') {
        app.activeDocument.selection = null;
        app.paste();
        var pastedItem = app.activeDocument.selection[0];
        app.activeDocument.selection = null;
        return pastedItem;
    } else if (config.sourceMode === 'top') {
        return sel[0];
    } else {
        return sel[0].pageItems;
    }
}

function getNodeForReplacement(nodes, mode, index) {
    if (mode === 'buffer' || mode === 'top') {
        return nodes;
    } else if (mode === 'successive') {
        return nodes[index % nodes.length];
    } else {
        return nodes[Math.floor(Math.random() * nodes.length)];
    }
}

function applySize(newNode, originalItem, config) {
    if (config.copyWidthHeight) {
        newNode.width = originalItem.width;
        newNode.height = originalItem.height;
        return;
    }

    var ratio = config.scaleRatio;
    var smallerDimension = originalItem.height >= originalItem.width ? originalItem.width : originalItem.height;
    var targetSize = smallerDimension * ratio;

    var primaryDim = newNode.height <= newNode.width ? 'width' : 'height';
    var secondaryDim = primaryDim === 'width' ? 'height' : 'width';

    if (config.fitToSize) {
        var percent = targetSize * 100 / newNode[primaryDim] / 100;
        newNode[primaryDim] = targetSize;
        newNode[secondaryDim] *= percent;
    }
}

function positionNode(newNode, originalItem, config) {
    newNode.left = originalItem.left - (newNode.width - originalItem.width) / 2;
    newNode.top = originalItem.top + (newNode.height - originalItem.height) / 2;

    if (config.symbolByRegPoint && newNode.typename === 'SymbolItem') {
        var regPos = getSymbolPositionByRegistrationPoint(newNode);
        newNode.left += (originalItem.left + originalItem.width / 2) - regPos[0];
        newNode.top += (originalItem.top - originalItem.height / 2) - regPos[1];
    }
}

function randomRotation(item) {
    var angle = Math.floor(Math.random() * 360);
    item.rotate(angle, true, true, true, true, Transformation.CENTER);
}

function setFillColor(items, color) {
    if (!color) return;

    for (var i = 0; i < items.length; i++) {
        var item = items[i];

        if (item.typename === 'GroupItem') {
            setFillColor(item.pageItems, color);
        } else if (item.typename === 'CompoundPathItem') {
            if (item.pathItems.length > 0) {
                item.pathItems[0].fillColor = color;
            }
        } else if (item.typename === 'PathItem') {
            item.fillColor = color;
        }
    }
}

function getFillColor(items) {
    for (var i = 0; i < items.length; i++) {
        var item = items[i];

        if (item.typename === 'GroupItem') {
            var groupColor = getFillColor(item.pageItems);
            if (groupColor) return groupColor;
        } else if (item.typename === 'CompoundPathItem' && item.pathItems.length > 0) {
            return item.pathItems[0].fillColor;
        } else if (item.typename === 'PathItem') {
            return item.fillColor;
        }
    }
    return null;
}

function getSymbolPositionByRegistrationPoint(symbolItem) {
    var backupSymbol = symbolItem.symbol;
    var tempSymbol = app.activeDocument.symbols.add(symbolItem, SymbolRegistrationPoint.SYMBOLTOPLEFTPOINT);

    symbolItem.symbol = tempSymbol;
    var position = [symbolItem.left, symbolItem.top];

    symbolItem.symbol = backupSymbol;
    tempSymbol.remove();

    return position;
}

// ============================================================================
// USER INTERFACE
// ============================================================================

function showDialog() {
    var saved = loadSettings();

    var dialog = new Window('dialog', CFG.scriptName + ' ' + CFG.version);
    dialog.orientation = 'column';
    dialog.alignChildren = ['fill', 'fill'];

    var mainGroup = dialog.add('group');
    mainGroup.orientation = 'row';

    var sourcePanel = mainGroup.add('panel', undefined, 'What to replace with?');
    sourcePanel.orientation = 'column';
    sourcePanel.alignChildren = ['fill', 'fill'];
    sourcePanel.margins = [20, 30, 20, 20];

    var bufferRadio = sourcePanel.add('radiobutton', undefined, 'Object in clipboard');
    var topRadio = sourcePanel.add('radiobutton', undefined, 'Top object');
    var successiveRadio = sourcePanel.add('radiobutton', undefined, 'All in group (successive)');
    var randomRadio = sourcePanel.add('radiobutton', undefined, 'All in group (random)');

    var ratioGroup = sourcePanel.add('group');
    ratioGroup.orientation = 'row';
    ratioGroup.alignChildren = ['fill', 'fill'];
    var ratioInput = ratioGroup.add('edittext', undefined, saved.scaleRatio);
    ratioInput.characters = 8;
    ratioGroup.add('statictext', undefined, '%');

    var groupCheck = sourcePanel.add('checkbox', undefined, 'Replace items in a group?');

    var optionsPanel = mainGroup.add('panel');
    optionsPanel.orientation = 'column';
    optionsPanel.alignChildren = ['fill', 'fill'];
    optionsPanel.margins = 20;

    var fitSizeCheck = optionsPanel.add('checkbox', undefined, 'Fit to element size');
    var copyWHCheck = optionsPanel.add('checkbox', undefined, 'Copy Width & Height');
    var saveOrigCheck = optionsPanel.add('checkbox', undefined, 'Save original element');
    var copyColorsCheck = optionsPanel.add('checkbox', undefined, 'Copy colors from element');
    var randomRotateCheck = optionsPanel.add('checkbox', undefined, 'Random element rotation');
    var symbolRegPointCheck = optionsPanel.add('checkbox', undefined, 'Align symbols by registration point');

    bufferRadio.value = saved.sourceMode === 'buffer';
    topRadio.value = saved.sourceMode === 'top';
    successiveRadio.value = saved.sourceMode === 'successive';
    randomRadio.value = saved.sourceMode === 'random';
    groupCheck.value = saved.replaceInGroup;
    fitSizeCheck.value = saved.fitToSize;
    copyWHCheck.value = saved.copyWidthHeight;
    saveOrigCheck.value = saved.saveOriginal;
    copyColorsCheck.value = saved.copyColors;
    randomRotateCheck.value = saved.randomRotate;
    symbolRegPointCheck.value = saved.symbolByRegPoint;

    copyWHCheck.onClick = function() {
        ratioGroup.enabled = !copyWHCheck.value;
        fitSizeCheck.enabled = !copyWHCheck.value;
    };

    fitSizeCheck.onClick = function() {
        copyWHCheck.enabled = !fitSizeCheck.value;
    };

    ratioGroup.enabled = !copyWHCheck.value;
    fitSizeCheck.enabled = !copyWHCheck.value;
    copyWHCheck.enabled = !fitSizeCheck.value;

    var buttonGroup = dialog.add('group');
    buttonGroup.alignChildren = ['fill', 'fill'];

    var cancelButton = buttonGroup.add('button', undefined, 'Cancel');
    var okButton = buttonGroup.add('button', undefined, 'OK');

    cancelButton.onClick = function() {
        dialog.close();
    };

    okButton.onClick = function() {
        dialog.close(1);
    };

    dialog.onClose = function() {
        if (dialog.result === 1) {
            var settings = {
                sourceMode: bufferRadio.value ? 'buffer' : (topRadio.value ? 'top' : (successiveRadio.value ? 'successive' : 'random')),
                replaceInGroup: groupCheck.value,
                fitToSize: fitSizeCheck.value,
                copyWidthHeight: copyWHCheck.value,
                saveOriginal: saveOrigCheck.value,
                copyColors: copyColorsCheck.value,
                randomRotate: randomRotateCheck.value,
                symbolByRegPoint: symbolRegPointCheck.value,
                scaleRatio: parseFloat(ratioInput.text) / 100 || 1
            };
            saveSettings(settings);
        }
    };

    dialog.center();
    var result = dialog.show();

    if (result === 1) {
        return {
            sourceMode: bufferRadio.value ? 'buffer' : (topRadio.value ? 'top' : (successiveRadio.value ? 'successive' : 'random')),
            replaceInGroup: groupCheck.value,
            fitToSize: fitSizeCheck.value,
            copyWidthHeight: copyWHCheck.value,
            saveOriginal: saveOrigCheck.value,
            copyColors: copyColorsCheck.value,
            randomRotate: randomRotateCheck.value,
            symbolByRegPoint: symbolRegPointCheck.value,
            scaleRatio: parseFloat(ratioInput.text) / 100 || 1
        };
    }

    return null;
}

// ============================================================================
// SETTINGS PERSISTENCE
// ============================================================================

function loadSettings() {
    var defaults = {
        sourceMode: 'buffer',
        replaceInGroup: false,
        fitToSize: false,
        copyWidthHeight: false,
        saveOriginal: false,
        copyColors: false,
        randomRotate: false,
        symbolByRegPoint: false,
        scaleRatio: '100'
    };

    var file = new File(SETTINGS.folder + SETTINGS.name);
    if (!file.exists) return defaults;

    try {
        file.encoding = 'UTF-8';
        file.open('r');
        var content = file.read();
        file.close();

        var saved = AIS.JSON.parse(content);
        return saved || defaults;
    } catch (error) {
        return defaults;
    }
}

function saveSettings(settings) {
    var folder = new Folder(SETTINGS.folder);
    if (!folder.exists) {
        folder.create();
    }

    try {
        var file = new File(SETTINGS.folder + SETTINGS.name);
        file.encoding = 'UTF-8';
        file.open('w');
        file.write(AIS.JSON.stringify(settings));
        file.close();
    } catch (error) {
        // Silently fail settings save
    }
}

// ============================================================================
// EXECUTE
// ============================================================================

if (!AIS.Document.hasDocument()) {
    alert('No document\nOpen a document and try again');
} else if (!AIS.Document.hasSelection()) {
    alert('No selection\nSelect objects to replace and try again');
} else {
    try {
        main();
    } catch (e) {
        AIS.Error.show('Replace Items error', e);
    }
}
