/**
 * Resize Artboards With Objects
 * @version 1.0.0
 * @description Resize artboards and all objects on them proportionally. Supports resizing by scale percentage, new width, or new height. Works on active artboard, all artboards, or custom artboard range. Option to include hidden and locked items. Originally created by Alexander Ladygin with refinement by Sergey Osokin, modernized for AIS framework.
 * @category Artboards
 * @features
 *   - Resize by scale factor (percentage)
 *   - Resize to specific width in document units
 *   - Resize to specific height in document units
 *   - Resize active artboard, all artboards, or custom range (e.g., "1,3-5,7")
 *   - Optional inclusion of hidden and locked items
 *   - Proportional resizing maintains relative object positions
 *   - Preserves item states (locked/hidden) after operation
 * @author Alexander Ladygin, Sergey Osokin (original), Vexy (modernization)
 * @usage File → Scripts → Resize Artboards With Objects
 *        Enter new dimension or scale, select artboards to resize
 * @original http://www.ladyginpro.ru
 * @license Public Domain
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
    VERSION: '1.0.0',
    UNITS: AIS.Units.get()
};

// ============================================================================
// MAIN FUNCTION
// ============================================================================
function main() {
    try {
        var doc = app.activeDocument;
        var activeIndex = doc.artboards.getActiveArtboardIndex();
        var initialValue = getArtboardWidth(activeIndex);

        var result = showDialog(activeIndex, initialValue);
        if (!result) return;

        var lockedItems = [];
        var hiddenItems = [];

        if (result.includeLockedHidden) {
            saveItemStates(doc, lockedItems, hiddenItems);
        }

        processResize(result);

        if (result.includeLockedHidden) {
            restoreItemStates(doc, lockedItems, hiddenItems);
        }

        app.redraw();

    } catch (e) {
        AIS.Error.show('Artboard resize failed', e);
    }
}

// ============================================================================
// CORE LOGIC
// ============================================================================
function processResize(config) {
    var doc = app.activeDocument;
    var artboards = [];

    if (config.target === 'active') {
        artboards.push(doc.artboards.getActiveArtboardIndex());
    } else if (config.target === 'all') {
        for (var i = 0; i < doc.artboards.length; i++) {
            artboards.push(i);
        }
    } else {
        artboards = parseArtboardRange(config.customRange, doc.artboards.length);
    }

    for (var i = 0; i < artboards.length; i++) {
        var index = artboards[i];
        doc.artboards.setActiveArtboardIndex(index);
        resizeArtboard(index, config);
    }
}

function resizeArtboard(artboardIndex, config) {
    var doc = app.activeDocument;
    var artboard = doc.artboards[artboardIndex];
    var rect = artboard.artboardRect;

    var artWidth = rect[2] - rect[0];
    var artHeight = -(rect[3] - rect[1]);

    var resizeFactor = calculateResizeFactor(config, artWidth, artHeight);

    if (resizeFactor === null || resizeFactor === 0) {
        return;
    }

    // Save and clear selection
    var savedSelection = app.selection;
    app.selection = null;

    // Select objects on artboard
    app.coordinateSystem = CoordinateSystem.ARTBOARDCOORDINATESYSTEM;
    doc.selectObjectsOnActiveArtboard();

    var items = app.selection;

    // Resize artboard
    artboard.artboardRect = [
        rect[0],
        rect[1],
        rect[0] + artWidth * resizeFactor,
        rect[1] - artHeight * resizeFactor
    ];

    // Resize and reposition objects
    for (var i = 0; i < items.length; i++) {
        items[i].resize(
            resizeFactor * 100,
            resizeFactor * 100,
            true, true, true, true,
            resizeFactor * 100,
            Transformation.TOPLEFT
        );

        items[i].position = [
            items[i].position[0] * resizeFactor,
            items[i].position[1] * resizeFactor
        ];
    }

    // Restore selection
    app.selection = savedSelection;
}

function calculateResizeFactor(config, currentWidth, currentHeight) {
    var value = parseFloat(config.value);

    if (isNaN(value) || value === 0) {
        return null;
    }

    if (config.mode === 'scale') {
        // Percentage mode
        return value / 100;
    } else if (config.mode === 'width') {
        // New width mode
        var widthPt = AIS.Units.convert(value, CFG.UNITS, 'pt');
        return widthPt / currentWidth;
    } else {
        // New height mode
        var heightPt = AIS.Units.convert(value, CFG.UNITS, 'pt');
        return heightPt / currentHeight;
    }
}

function parseArtboardRange(rangeText, maxBoards) {
    var cleaned = rangeText.replace(/ /g, '').replace(/[^-0-9,]/g, '');
    var parts = cleaned.split(',');
    var indices = [];

    for (var i = 0; i < parts.length; i++) {
        if (parts[i].indexOf('-') !== -1) {
            // Range like "3-5"
            var bounds = parts[i].split('-');
            var start = parseInt(bounds[0]);
            var end = parseInt(bounds[1]);

            if (!isNaN(start) && !isNaN(end)) {
                for (var j = start; j <= end; j++) {
                    if (j >= 1 && j <= maxBoards) {
                        indices.push(j - 1); // Convert to 0-based
                    }
                }
            }
        } else {
            // Single number
            var num = parseInt(parts[i]);
            if (!isNaN(num) && num >= 1 && num <= maxBoards) {
                indices.push(num - 1); // Convert to 0-based
            }
        }
    }

    return indices;
}

function getArtboardWidth(index) {
    var doc = app.activeDocument;
    var rect = doc.artboards[index].artboardRect;
    var widthPt = rect[2] - rect[0];
    return Math.round(AIS.Units.convert(widthPt, 'pt', CFG.UNITS));
}

function saveItemStates(doc, lockedItems, hiddenItems) {
    for (var i = 0; i < doc.pageItems.length; i++) {
        var item = doc.pageItems[i];

        if (item.locked) {
            lockedItems.push(i);
            item.locked = false;
        }

        if (item.hidden) {
            hiddenItems.push(i);
            item.hidden = false;
        }
    }
}

function restoreItemStates(doc, lockedItems, hiddenItems) {
    for (var i = 0; i < lockedItems.length; i++) {
        doc.pageItems[lockedItems[i]].locked = true;
    }

    for (var i = 0; i < hiddenItems.length; i++) {
        doc.pageItems[hiddenItems[i]].hidden = true;
    }
}

// ============================================================================
// USER INTERFACE
// ============================================================================
function showDialog(activeIndex, initialValue) {
    var doc = app.activeDocument;

    var dialog = new Window('dialog', 'Resize Artboards With Objects v' + CFG.VERSION);
    dialog.orientation = 'column';
    dialog.alignChildren = ['fill', 'fill'];

    // Resize mode panel
    var modePanel = dialog.add('panel', undefined, 'Resize artboard:');
    modePanel.orientation = 'column';
    modePanel.alignChildren = ['fill', 'fill'];

    var scaleRb = modePanel.add('radiobutton', undefined, 'New scale factor');
    var widthRb = modePanel.add('radiobutton', undefined, 'New artboard width');
    var heightRb = modePanel.add('radiobutton', undefined, 'New artboard height');
    widthRb.value = true;

    // Target panel
    var targetPanel = dialog.add('panel');
    targetPanel.orientation = 'column';
    targetPanel.alignChildren = ['fill', 'fill'];

    var activeRb = targetPanel.add('radiobutton', undefined, 'Only active artboard');
    var allRb = targetPanel.add('radiobutton', undefined, 'All artboards');
    var customRb = targetPanel.add('radiobutton', undefined, 'Custom artboards');
    var customInput = targetPanel.add('edittext', undefined, (activeIndex + 1).toString());
    activeRb.value = true;
    customInput.enabled = false;

    // Options panel
    var optPanel = dialog.add('panel');
    optPanel.orientation = 'column';
    optPanel.alignChildren = ['fill', 'fill'];

    var includeCheck = optPanel.add('checkbox', undefined, 'Include hidden & locked items');
    includeCheck.value = false;

    // Value input
    var inputGroup = dialog.add('panel');
    inputGroup.orientation = 'row';
    inputGroup.alignChildren = ['fill', 'fill'];

    var valueInput = inputGroup.add('edittext', undefined, initialValue.toString());
    valueInput.minimumSize = [120, undefined];
    valueInput.active = true;

    var unitLabel = inputGroup.add('statictext', undefined, CFG.UNITS);

    // Buttons
    var btnGroup = dialog.add('group');
    btnGroup.alignChildren = ['fill', 'fill'];
    btnGroup.margins = [0, 0, 0, 0];

    var cancelBtn = btnGroup.add('button', undefined, 'Cancel');
    cancelBtn.helpTip = 'Press Esc to Close';

    var okBtn = btnGroup.add('button', [0, 0, 100, 30], 'OK');
    okBtn.helpTip = 'Press Enter to Run';
    okBtn.active = true;

    // Event handlers
    scaleRb.onClick = function() {
        unitLabel.text = '%';
    };

    widthRb.onClick = heightRb.onClick = function() {
        unitLabel.text = CFG.UNITS;
    };

    customRb.onClick = function() {
        customInput.enabled = true;
    };

    activeRb.onClick = allRb.onClick = function() {
        customInput.enabled = false;
    };

    dialog.center();

    if (dialog.show() === 2) return null;

    var mode = scaleRb.value ? 'scale' : (widthRb.value ? 'width' : 'height');
    var target = activeRb.value ? 'active' : (allRb.value ? 'all' : 'custom');

    return {
        mode: mode,
        value: valueInput.text,
        target: target,
        customRange: customInput.text,
        includeLockedHidden: includeCheck.value
    };
}
