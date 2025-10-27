/**
 * Rotate Artboards With Objects
 * @version 1.0.0
 * @description Rotate artboards 90 degrees (clockwise or counterclockwise) along with all objects on them. Preserves object positions relative to the artboard and handles locked/hidden items. Works on active artboard or all artboards at once. Originally created by Alexander Ladygin and Sergey Osokin, modernized for AIS framework.
 * @category Artboards
 * @features
 *   - Rotate active artboard or all artboards
 *   - 90° clockwise or counterclockwise rotation
 *   - Preserves object positions relative to artboard
 *   - Handles locked items (temporarily unlocks)
 *   - Handles hidden items (preserves visibility state)
 *   - Rotates artboard bounds and all contained objects
 *   - Maintains spatial relationships
 * @author Alexander Ladygin, Sergey Osokin (original), Vexy (modernization)
 * @usage File → Scripts → Rotate Artboards With Objects
 *        Choose active or all artboards, select rotation direction
 * @original http://www.ladyginpro.ru
 * @license Public Domain
 */

#include "../.lib/core.jsx"

//@target illustrator
app.preferences.setBooleanPreference('ShowExternalJSXWarning', false);
app.userInteractionLevel = UserInteractionLevel.DONTDISPLAYALERTS;

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
    VERSION: '1.0.0'
};

// ============================================================================
// MAIN FUNCTION
// ============================================================================
function main() {
    try {
        var doc = app.activeDocument;
        var activeIndex = doc.artboards.getActiveArtboardIndex();
        var activeNumber = activeIndex + 1;
        var totalBoards = doc.artboards.length;

        var result = showDialog(activeNumber, totalBoards);
        if (!result) return;

        var lockedItems = [];
        var hiddenItems = [];

        // Save item states
        saveItemStates(doc, lockedItems, hiddenItems);

        // Perform rotation
        if (result.target === 'active') {
            rotateArtboard(doc.artboards[activeIndex], result.direction);
        } else {
            for (var i = 0; i < totalBoards; i++) {
                doc.artboards.setActiveArtboardIndex(i);
                rotateArtboard(doc.artboards[i], result.direction);
            }
        }

        // Restore item states
        restoreItemStates(doc, lockedItems, hiddenItems);

        app.selection = null;
        app.redraw();

    } catch (e) {
        AIS.Error.show('Artboard rotation failed', e);
    }
}

// ============================================================================
// CORE LOGIC
// ============================================================================
function rotateArtboard(artboard, direction) {
    var doc = app.activeDocument;
    app.coordinateSystem = CoordinateSystem.ARTBOARDCOORDINATESYSTEM;

    var rect = artboard.artboardRect;
    var width = rect[2] - rect[0];
    var height = -(rect[3] - rect[1]);

    app.selection = null;
    doc.selectObjectsOnActiveArtboard();

    // Calculate new artboard rect (swapped dimensions)
    var newRect = [
        rect[0] + width / 2 - (height / 2),
        rect[1] - height / 2 + (width / 2),
        rect[2] - width / 2 + (height / 2),
        rect[3] + height / 2 - (width / 2)
    ];

    // Rotate all objects on artboard
    for (var i = 0; i < app.selection.length; i++) {
        var item = app.selection[i];
        var pos = item.position;
        var itemWidth = item.width;
        var itemHeight = item.height;
        var top = pos[1] - rect[1];
        var left = pos[0] - rect[0];

        if (direction === 'cw') {
            // Rotate 90° clockwise
            item.rotate(-90, true, true, true, true, Transformation.CENTER);
            item.position = [newRect[2] - itemHeight + top, newRect[1] - left];
        } else {
            // Rotate 90° counterclockwise
            item.rotate(90, true, true, true, true, Transformation.CENTER);
            item.position = [newRect[0] - top, newRect[3] + left + itemWidth];
        }
    }

    app.selection = null;
    artboard.artboardRect = newRect;
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
function showDialog(activeNumber, totalBoards) {
    var dialog = new Window('dialog', 'Rotate Artboards With Objects v' + CFG.VERSION);
    dialog.orientation = 'column';
    dialog.alignChildren = ['fill', 'fill'];

    // Target panel
    var targetPanel = dialog.add('panel', undefined, 'What to rotate?');
    targetPanel.orientation = 'column';
    targetPanel.alignChildren = 'left';
    targetPanel.margins = 20;

    var activeRb = targetPanel.add('radiobutton', undefined, 'Active Artboard #' + activeNumber);
    var allRb = targetPanel.add('radiobutton', undefined, 'All ' + totalBoards + ' Artboards');
    activeRb.value = true;

    // Angle panel
    var anglePanel = dialog.add('panel', undefined, 'Rotation angle:');
    anglePanel.orientation = 'row';
    anglePanel.alignChildren = ['fill', 'fill'];
    anglePanel.margins = 20;

    var cwRb = anglePanel.add('radiobutton', undefined, '90° CW');
    var ccwRb = anglePanel.add('radiobutton', undefined, '90° CCW');
    cwRb.value = true;

    // Buttons
    var btnGroup = dialog.add('group');
    btnGroup.alignChildren = ['fill', 'fill'];
    btnGroup.margins = [0, 10, 0, 0];

    var cancelBtn = btnGroup.add('button', undefined, 'Cancel', {name: 'cancel'});
    cancelBtn.helpTip = 'Press Esc to Close';

    var okBtn = btnGroup.add('button', undefined, 'OK', {name: 'ok'});
    okBtn.helpTip = 'Press Enter to Run';
    okBtn.active = true;

    dialog.center();

    if (dialog.show() === 2) return null;

    return {
        target: activeRb.value ? 'active' : 'all',
        direction: cwRb.value ? 'cw' : 'ccw'
    };
}
