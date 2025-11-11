/**
 * Select Artboard Objects
 * @version 1.0.0
 * @description Select objects inside or outside active artboard with tolerance
 * @category Selection
 *
 * Features:
 * - Select all objects inside artboard bounds
 * - Select all objects outside artboard bounds
 * - Adjustable tolerance for boundary detection
 * - Handles clipped groups and compound paths
 * - Preserves object stacking order
 *
 * Use case: Clean up artboards, prepare for export, organize multi-artboard documents
 *
 * Original: SelectArtboardObjects.jsx by Sergey Osokin
 * Modernized for AIS framework
 */




//@target illustrator
var c=File(Folder.myDocuments+"/Adobe Scripts/vexy-ville.ini");if(c.exists){c.open('r');var p=c.read();c.close();var l=File(p+".lib/core.jsx");if(l.exists)$.evalFile(l.fsName);}
app.preferences.setBooleanPreference('ShowExternalJSXWarning', false);

// ============================================================================
// CONFIGURATION
// ============================================================================

var CFG = {
    scriptName: 'Select Artboard Objects',
    version: '1.0.0',
    defaultTolerance: 1
};

// ============================================================================
// MAIN FUNCTION
// ============================================================================

function main() {
    var doc = app.activeDocument;
    var artboards = doc.artboards;
    var activeIndex = artboards.getActiveArtboardIndex();
    var activeArtboard = artboards[activeIndex];

    var config = showDialog(activeArtboard.name);
    if (!config) return;

    try {
        var units = AIS.Units.get();
        var scaleFactor = doc.scaleFactor || 1;
        var tolerancePx = AIS.Units.convert(config.tolerance / scaleFactor, units, 'px');

        // Invert tolerance for inside selection (shrink artboard bounds)
        if (config.selectInside) {
            tolerancePx *= -1;
        }

        // Get all document items
        app.executeMenuCommand('selectall');
        app.redraw();

        var allItems = collectAllItems(app.selection);

        app.executeMenuCommand('deselectall');
        app.selection = null;

        // Classify items by overlap with artboard
        var artboardBounds = activeArtboard.artboardRect;
        var insideItems = [];
        var outsideItems = [];

        for (var i = 0; i < allItems.length; i++) {
            var itemBounds = getVisibleBounds(allItems[i]);
            var overlaps = boundsOverlap(itemBounds, artboardBounds, tolerancePx);

            if (overlaps) {
                insideItems.push(allItems[i]);
            } else {
                outsideItems.push(allItems[i]);
            }
        }

        // Select appropriate set
        var targetItems = config.selectInside ? insideItems : outsideItems;

        if (targetItems.length === 0) {
            alert('No objects found\nNo objects ' + (config.selectInside ? 'inside' : 'outside') + ' artboard bounds');
            return;
        }

        selectItemsPreservingOrder(targetItems);

        alert('Objects selected\n' + targetItems.length + ' object' + (targetItems.length === 1 ? '' : 's') + ' selected', 'Success');
    } catch (error) {
        AIS.Error.show('Select Artboard Objects Error', error);
    }
}

// ============================================================================
// CORE LOGIC
// ============================================================================

/**
 * Collect all editable items from selection (flattened)
 * @param {Array} collection - Illustrator selection
 * @returns {Array} Flat array of editable items
 */
function collectAllItems(collection) {
    var results = [];

    for (var i = 0; i < collection.length; i++) {
        var item = collection[i];

        if (!item.editable) {
            continue;
        }

        if (item.pageItems && item.pageItems.length > 0) {
            // Recursively collect from groups
            var nested = collectAllItems(item.pageItems);
            results = results.concat(nested);
        } else {
            results.push(item);
        }
    }

    return results;
}

/**
 * Get visible bounds of object (handles clipped groups)
 * Based on: github.com/joshbduncan/illustrator-scripts
 * @param {Object} obj - Page item
 * @returns {Array} Bounds array [left, top, right, bottom]
 */
function getVisibleBounds(obj) {
    var bounds;

    if (obj.typename === 'GroupItem') {
        if (obj.clipped) {
            // Find clipping path
            var clippingPath = findClippingPath(obj);
            if (clippingPath) {
                bounds = clippingPath.geometricBounds;
            } else {
                bounds = obj.geometricBounds;
            }
        } else {
            // Calculate combined bounds from all sub-items
            bounds = calculateGroupBounds(obj);
        }
    } else {
        bounds = obj.geometricBounds;
    }

    return bounds;
}

/**
 * Find clipping path in clipped group
 * @param {GroupItem} group - Clipped group
 * @returns {PageItem|null} Clipping path or null
 */
function findClippingPath(group) {
    for (var i = 0; i < group.pageItems.length; i++) {
        var item = group.pageItems[i];

        if (item.clipping) {
            return item;
        }

        if (item.typename === 'CompoundPathItem') {
            if (item.pathItems.length > 0 && item.pathItems[0].clipping) {
                return item;
            }
        }
    }

    // Default to first item if no explicit clipping path found
    return group.pageItems.length > 0 ? group.pageItems[0] : null;
}

/**
 * Calculate combined bounds from group's sub-items
 * @param {GroupItem} group - Group item
 * @returns {Array} Combined bounds [left, top, right, bottom]
 */
function calculateGroupBounds(group) {
    var leftPoints = [];
    var topPoints = [];
    var rightPoints = [];
    var bottomPoints = [];

    for (var i = 0; i < group.pageItems.length; i++) {
        var subBounds = getVisibleBounds(group.pageItems[i]);
        leftPoints.push(subBounds[0]);
        topPoints.push(subBounds[1]);
        rightPoints.push(subBounds[2]);
        bottomPoints.push(subBounds[3]);
    }

    return [
        Math.min.apply(Math, leftPoints),
        Math.max.apply(Math, topPoints),
        Math.max.apply(Math, rightPoints),
        Math.min.apply(Math, bottomPoints)
    ];
}

/**
 * Check if two bounding boxes overlap
 * @param {Array} bounds1 - First bounds [left, top, right, bottom]
 * @param {Array} bounds2 - Second bounds [left, top, right, bottom]
 * @param {number} tolerance - Tolerance in pixels (negative shrinks bounds2)
 * @returns {boolean} True if bounds overlap
 */
function boundsOverlap(bounds1, bounds2, tolerance) {
    // Check for no overlap (with tolerance)
    if ((bounds1[2] <= bounds2[0] + tolerance || bounds1[0] >= bounds2[2] - tolerance) ||
        (bounds1[3] >= bounds2[1] - tolerance || bounds1[1] <= bounds2[3] + tolerance)) {
        return false;
    }
    return true;
}

/**
 * Select items while preserving stacking order
 * Uses temporary group technique to maintain z-order
 * @param {Array} items - Items to select
 */
function selectItemsPreservingOrder(items) {
    if (items.length === 0) return;

    var layer = items[0].layer;
    var tempGroup = layer.groupItems.add();
    var tempMarkers = [];

    // Create temporary markers and move items to group
    for (var i = 0; i < items.length; i++) {
        var marker = layer.pathItems.add();
        marker.move(items[i], ElementPlacement.PLACEBEFORE);
        tempMarkers.push(marker);
        items[i].move(tempGroup, ElementPlacement.PLACEATEND);
    }

    // Select the group
    tempGroup.selected = true;

    // Restore items to original positions
    var groupItems = tempGroup.pageItems;
    for (var j = 0; j < groupItems.length; j++) {
        groupItems[j].move(tempMarkers[j], ElementPlacement.PLACEBEFORE);
        tempMarkers[j].move(tempGroup, ElementPlacement.PLACEATBEGINNING);
    }

    // Clean up
    tempGroup.remove();
}

// ============================================================================
// USER INTERFACE
// ============================================================================

/**
 * Show dialog for configuration
 * @param {string} artboardName - Name of active artboard
 * @returns {Object|null} Configuration or null if cancelled
 */
function showDialog(artboardName) {
    var isMac = AIS.System.isMac();
    var aiVersion = parseFloat(app.version);
    var units = AIS.Units.get();

    var dialog = new Window('dialog', CFG.scriptName + ' ' + CFG.version);
    dialog.orientation = 'column';
    dialog.alignChildren = ['fill', 'center'];

    // Display artboard name (truncate if too long)
    var displayName = artboardName.length > 20 ? artboardName.substring(0, 20) + '...' : artboardName;
    dialog.add('statictext', undefined, 'Artboard: ' + displayName);

    // Selection mode panel
    var modePanel = dialog.add('panel', undefined, 'Which objects to select');
    modePanel.orientation = 'column';
    modePanel.alignChildren = ['fill', 'center'];
    modePanel.margins = [10, 15, 10, 7];

    var insideRadio = modePanel.add('radiobutton', undefined, 'All Inside Artboard');
    insideRadio.value = true;

    var outsideRadio = modePanel.add('radiobutton', undefined, 'All Outside Artboard');

    if (isMac || aiVersion >= 26.4 || aiVersion <= 17) {
        insideRadio.active = true;
    }

    // Tolerance panel
    var tolerancePanel = dialog.add('panel', undefined, 'Artboard Tolerance, ' + units);
    tolerancePanel.orientation = 'row';
    tolerancePanel.alignChildren = ['fill', 'center'];
    tolerancePanel.margins = [10, 15, 10, 7];

    var toleranceInput = tolerancePanel.add('edittext', undefined, CFG.defaultTolerance.toString());
    toleranceInput.characters = 8;
    toleranceInput.helpTip = 'Tolerance for boundary detection\nPositive value extends artboard bounds\nNegative value shrinks artboard bounds';

    // Buttons
    var buttonGroup = dialog.add('group');
    buttonGroup.alignChildren = ['fill', 'fill'];

    var cancelButton = buttonGroup.add('button', undefined, 'Cancel', {name: 'cancel'});
    var okButton = buttonGroup.add('button', undefined, 'OK', {name: 'ok'});

    cancelButton.onClick = function() {
        dialog.close();
    };

    okButton.onClick = function() {
        var tolerance = parseFloat(toleranceInput.text);

        if (isNaN(tolerance)) {
            alert('Invalid tolerance\nEnter a numeric value', 'Input Error');
            return;
        }

        dialog.close(1);
    };

    dialog.center();
    var result = dialog.show();

    if (result === 1) {
        return {
            selectInside: insideRadio.value,
            tolerance: parseFloat(toleranceInput.text)
        };
    }

    return null;
}

// ============================================================================
// EXECUTE
// ============================================================================

if (!AIS.Document.hasDocument()) {
    alert('No document\nOpen a document and try again');
} else {
    try {
        main();
    } catch (e) {
        AIS.Error.show('Select Artboard Objects error', e);
    }
}
