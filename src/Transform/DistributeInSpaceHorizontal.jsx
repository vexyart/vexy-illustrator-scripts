/**
 * Distribute In Space (Horizontal)
 * @version 1.0.0
 * @description Distributes selected objects horizontally with equal spacing between them. Uses the leftmost and rightmost objects as anchor points and distributes all other objects evenly in the space between. Respects the Align panel's "Use Preview Bounds" setting to include or exclude stroke width. Reference point setting affects alignment. Originally created by sky-chaser-high, modernized for AIS framework.
 * @category Transform
 * @features
 *   - Equal horizontal spacing between 3+ objects
 *   - Uses leftmost/rightmost objects as anchors (don't move)
 *   - Respects "Use Preview Bounds" preference
 *   - Respects reference point setting (affects object alignment)
 *   - Automatically sorts objects by position
 *   - Works with any object types
 * @author sky-chaser-high (original), Vexy (modernization)
 * @usage File → Scripts → Distribute In Space (Horizontal)
 *        Select 3+ objects, run script
 * @original https://github.com/sky-chaser-high/adobe-illustrator-scripts
 * @license MIT
 */




//@target illustrator
var c=File(Folder.myDocuments+"/Adobe Scripts/vexy-ville.ini");if(c.exists){c.open('r');var p=c.read();c.close();var l=File(p+".lib/core.jsx");if(l.exists)$.evalFile(l.fsName);}
app.preferences.setBooleanPreference('ShowExternalJSXWarning', false);

// ============================================================================
// MAIN FUNCTION
// ============================================================================
function main() {
    try {
        var items = app.activeDocument.selection;

        if (items.length < 3) {
            alert('Not enough objects\nSelect at least 3 objects to distribute');
            return;
        }

        var baseItems = getBaseItems(items);
        var targetItems = getTargetItems(items, baseItems);

        if (targetItems.length === 0) {
            alert('No objects to distribute\nObjects must be between leftmost and rightmost items');
            return;
        }

        distributeHorizontally(targetItems, baseItems);
        app.redraw();

    } catch (e) {
        AIS.Error.show('Horizontal distribution failed', e);
    }
}

// ============================================================================
// CORE LOGIC
// ============================================================================
function distributeHorizontally(targetItems, baseItems) {
    var leftBounds = getBounds(baseItems.left);
    var space = calculateSpace(baseItems);
    var distribution = space / (targetItems.length + 1);

    for (var i = 0; i < targetItems.length; i++) {
        var item = targetItems[i];
        var newPosition = leftBounds.right + distribution * (i + 1);
        var distance = calculateDistance(item, newPosition);
        item.translate(distance, 0);
    }
}

function calculateDistance(item, targetPosition) {
    var width = getEffectiveWidth(item);
    var bounds = getBounds(item);
    var currentRefPoint = bounds.left + width;
    return targetPosition - currentRefPoint;
}

function getEffectiveWidth(item) {
    var pref = app.preferences;
    var point = pref.getIntegerPreference('plugin/Transform/AnchorPoint');
    var bounds = getBounds(item);
    var width = bounds.right - bounds.left;

    // Reference point positions: 0-8 (left-middle-right for each of top-center-bottom)
    // Left (0,3,6): no offset
    // Center (1,4,7): half width offset
    // Right (2,5,8): full width offset
    if (/[036]/.test(point.toString())) return 0;
    if (/[147]/.test(point.toString())) return width / 2;
    if (/[258]/.test(point.toString())) return width;

    return 0; // Default to left
}

function calculateSpace(baseItems) {
    var leftBounds = getBounds(baseItems.left);
    var rightBounds = getBounds(baseItems.right);
    return Math.abs(rightBounds.left - leftBounds.right);
}

function getBaseItems(selection) {
    var leftItem = selection[0];
    var rightItem = selection[0];

    for (var i = 1; i < selection.length; i++) {
        var item = selection[i];
        var bounds = getBounds(item);

        var leftBounds = getBounds(leftItem);
        var rightBounds = getBounds(rightItem);

        if (bounds.left < leftBounds.left) {
            leftItem = item;
        }

        if (bounds.left > rightBounds.left) {
            rightItem = item;
        }
    }

    return {
        left: leftItem,
        right: rightItem
    };
}

function getTargetItems(selection, baseItems) {
    var leftBounds = getBounds(baseItems.left);
    var rightBounds = getBounds(baseItems.right);
    var items = [];

    for (var i = 0; i < selection.length; i++) {
        var item = selection[i];
        var bounds = getBounds(item);

        if (bounds.left > leftBounds.left && bounds.left < rightBounds.left) {
            items.push(item);
        }
    }

    // Sort by horizontal position (left to right)
    items.sort(function(a, b) {
        var boundsA = getBounds(a);
        var boundsB = getBounds(b);
        return boundsA.left - boundsB.left;
    });

    return items;
}

function getBounds(item) {
    var pref = app.preferences;
    var usePreviewBounds = pref.getBooleanPreference('includeStrokeInBounds');
    var bounds = usePreviewBounds ? item.visibleBounds : item.geometricBounds;

    return {
        top: bounds[1],
        left: bounds[0],
        bottom: bounds[3],
        right: bounds[2]
    };
}

// ============================================================================
// EXECUTE
// ============================================================================

if (!AIS.Document.hasDocument()) {
    alert('No document\nOpen a document and try again');
} else if (!AIS.Document.hasSelection()) {
    alert('No objects selected\nSelect at least 3 objects and try again');
} else {
    try {
        main();
    } catch (e) {
        AIS.Error.show('Script error', e);
    }
}
