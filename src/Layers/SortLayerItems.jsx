/**
 * Sort Layer Items
 * @version 1.0.0
 * @description Sort objects alphabetically inside layers
 * @category Layers
 *
 * Features:
 * - Sort items in active layer or all visible/unlocked layers
 * - Include/exclude sublayers
 * - Reverse alphabetical order option
 * - Smart name handling (text contents, symbol names)
 * - Mixed case sorting (uppercase first or lowercase first)
 * - Numeric sorting support
 *
 * Original: SortLayerItems.jsx by Sergey Osokin (hi@sergosokin.ru)
 * Based on sortLayers.jsx by Tom Scharstein (https://github.com/Inventsable)
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
    scriptName: 'Sort Layer Items',
    version: '1.0.0',
    isLowerFirst: true,
    isReverse: false,
    isInSublayers: false,
    uiOpacity: 0.98
};

// ============================================================================
// MAIN FUNCTION
// ============================================================================

function main() {
    try {
        var doc = app.activeDocument;
        var activeLayer = doc.activeLayer;
        var shortName = activeLayer.name.length <= 14 ?
            activeLayer.name :
            activeLayer.name.substr(0, 14) + '...';

        var visibleLayers = getVisibleLayers(doc, CFG.isInSublayers);

        var dialog = showDialog(shortName, visibleLayers.length);
        if (!dialog) return;

        var config = dialog.config;

        if (config.activeOnly) {
            if (activeLayer.locked) {
                alert('Active layer is locked\nUnlock the layer and try again');
                return;
            }
            if (!activeLayer.visible) {
                alert('Active layer is hidden\nMake the layer visible and try again');
                return;
            }
            sortLayerItems(activeLayer, CFG.isLowerFirst, config.reverse);
        } else {
            var layers = getVisibleLayers(doc, config.includeSublayers);
            for (var i = 0; i < layers.length; i++) {
                sortLayerItems(layers[i], CFG.isLowerFirst, config.reverse);
            }
        }
    } catch (error) {
        AIS.Error.show('Sort Layer Items Error', error);
    }
}

// ============================================================================
// CORE LOGIC
// ============================================================================

function sortLayerItems(layer, isLowerFirst, isReverse) {
    var items = getPageItems(layer);

    items.sort(function(a, b) {
        var aName = getItemName(a);
        var bName = getItemName(b);

        // Numeric sorting
        if (!isNaN(aName) && !isNaN(bName)) {
            return 1 * aName - 1 * bName;
        }

        // Mixed case handling
        if (hasMixedCase(aName, bName)) {
            return handleMixedCase(aName, bName, isLowerFirst);
        }

        // Standard alphabetical
        return aName.toLowerCase().localeCompare(bName.toLowerCase());
    });

    // Apply sort order via z-order
    for (var i = 0; i < items.length; i++) {
        items[i].zOrder(isReverse ? ZOrderMethod.BRINGTOFRONT : ZOrderMethod.SENDTOBACK);
    }
}

function getVisibleLayers(parent, includeSublayers) {
    var out = [];

    for (var i = 0; i < parent.layers.length; i++) {
        var layer = parent.layers[i];
        if (!layer.locked && layer.visible) {
            out.push(layer);
            if (includeSublayers) {
                out = out.concat(getVisibleLayers(layer, includeSublayers));
            }
        }
    }

    return out;
}

function getPageItems(parent) {
    var out = [];
    if (!parent.pageItems) return out;

    for (var i = 0; i < parent.pageItems.length; i++) {
        out.push(parent.pageItems[i]);
    }

    return out;
}

function getItemName(item) {
    if (item.typename === 'TextFrame' && isEmpty(item.name) && !isEmpty(item.contents)) {
        return item.contents;
    } else if (item.typename === 'SymbolItem' && isEmpty(item.name)) {
        return item.symbol.name;
    } else {
        return item.name;
    }
}

// ============================================================================
// UTILITIES
// ============================================================================

function isEmpty(str) {
    return str.replace(/\s/g, '').length === 0;
}

function hasMixedCase(a, b) {
    if (a.charAt(0).toLowerCase() !== b.charAt(0).toLowerCase()) {
        return false;
    }
    return (isUpperCase(a) && isLowerCase(b)) || (isLowerCase(a) && isUpperCase(b));
}

function handleMixedCase(a, b, isLowerFirst) {
    var result = a === b ? 0 : isUpperCase(a) ? 1 : -1;
    return isLowerFirst ? result : result * -1;
}

function isUpperCase(text) {
    return /[A-Z]/.test(text.charAt(0));
}

function isLowerCase(text) {
    return /[a-z]/.test(text.charAt(0));
}

// ============================================================================
// USER INTERFACE
// ============================================================================

function showDialog(activeLayerName, visibleLayerCount) {
    var dialog = new Window('dialog', CFG.scriptName + ' ' + CFG.version);
    dialog.orientation = 'column';
    dialog.alignChildren = 'fill';
    dialog.spacing = 10;
    dialog.opacity = CFG.uiOpacity;

    // Layers panel
    var layersPanel = dialog.add('panel', undefined, 'Layers');
    layersPanel.alignChildren = 'left';
    layersPanel.margins = [10, 15, 10, 10];

    var activeRb = layersPanel.add('radiobutton', undefined, 'Active <' + activeLayerName + '>');
    activeRb.value = true;

    var allRb = layersPanel.add('radiobutton', undefined, visibleLayerCount + ' visible & unlocked layers');

    // Options
    var optionsGroup = dialog.add('group');
    optionsGroup.orientation = 'column';
    optionsGroup.alignChildren = 'left';
    optionsGroup.margins = [10, 0, 10, 0];

    var sublayersCheck = optionsGroup.add('checkbox', undefined, 'Include all sublayers');
    sublayersCheck.value = CFG.isInSublayers;

    var reverseCheck = optionsGroup.add('checkbox', undefined, 'Reverse alphabetical order');
    reverseCheck.value = CFG.isReverse;

    // Buttons
    var buttonGroup = dialog.add('group');
    buttonGroup.orientation = 'row';
    buttonGroup.alignChildren = ['fill', 'fill'];
    buttonGroup.margins = [10, 0, 10, 0];

    var cancelButton = buttonGroup.add('button', undefined, 'Cancel', {name: 'cancel'});
    cancelButton.helpTip = 'Press Esc to Close';

    var okButton = buttonGroup.add('button', undefined, 'OK', {name: 'ok'});
    okButton.helpTip = 'Press Enter to Run';

    // Copyright
    var copyright = dialog.add('statictext', undefined, '\u00A9 Sergey Osokin. Visit Github');
    copyright.justify = 'center';

    // Event handlers
    sublayersCheck.onClick = function() {
        var doc = app.activeDocument;
        var layers = getVisibleLayers(doc, sublayersCheck.value);
        allRb.text = layers.length + ' visible & unlocked layers';
    };

    copyright.addEventListener('mousedown', function() {
        AIS.System.openURL('https://github.com/creold');
    });

    cancelButton.onClick = function() {
        dialog.close();
    };

    okButton.onClick = function() {
        dialog.config = {
            activeOnly: activeRb.value,
            includeSublayers: sublayersCheck.value,
            reverse: reverseCheck.value
        };
        dialog.close(1);
    };

    dialog.center();
    var result = dialog.show();

    return result === 1 ? dialog : null;
}
