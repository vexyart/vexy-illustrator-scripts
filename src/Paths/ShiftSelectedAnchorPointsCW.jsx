/**
 * Shift Selected Anchor Points CW
 * @version 1.0.0
 * @description Shift selected anchor points clockwise along the path
 * @category Paths
 *
 * Features:
 * - Shift anchor point selection clockwise
 * - Path polarity awareness (positive/negative)
 * - Boundary wraparound for closed paths
 * - Supports paths, compound paths, and text paths
 * - Works with area text and path text anchor points
 *
 * Usage: Select anchor points with Direct Selection Tool
 *
 * Original: shiftSelectedAnchorPointsCW.js by sky-chaser-high
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

    if (!AIS.Document.hasSelection()) {
        alert('No selection\nSelect anchor points with Direct Selection Tool');
        return;
    }

    main();
})();

// ============================================================================
// CONFIGURATION
// ============================================================================

var CFG = {
    scriptName: 'Shift Selected Anchor Points CW',
    version: '1.0.0',
    direction: 'cw'
};

// ============================================================================
// MAIN FUNCTION
// ============================================================================

function main() {
    try {
        var items = app.activeDocument.selection;
        var pathItems = getPathItems(items);
        var textPathItems = getTextPathItems();
        var allPaths = pathItems.concat(textPathItems);

        if (allPaths.length === 0) {
            alert('No paths found\nSelect paths with anchor points');
            return;
        }

        for (var i = 0; i < allPaths.length; i++) {
            shiftAnchorPointsCW(allPaths[i]);
        }

    } catch (error) {
        AIS.Error.show('Shift Anchor Points CW Error', error);
    }
}

// ============================================================================
// CORE LOGIC
// ============================================================================

function shiftAnchorPointsCW(path) {
    var selectedIndexes = getSelectedAnchorPointIndexes(path);

    if (selectedIndexes.length === 0) {
        return;
    }

    var pointCount = path.pathPoints.length;
    var clockwise = (path.polarity === PolarityValues.POSITIVE);

    var newIndexes = clockwise ?
        getForwardIndexes(selectedIndexes, pointCount) :
        getBackwardIndexes(selectedIndexes, pointCount);

    deselectAllPoints(path, selectedIndexes);
    selectPoints(path, newIndexes);
}

function deselectAllPoints(path, indexes) {
    var NOSELECTION = PathPointSelection.NOSELECTION;

    for (var i = 0; i < indexes.length; i++) {
        path.pathPoints[indexes[i]].selected = NOSELECTION;
    }
}

function selectPoints(path, indexes) {
    var ANCHOR = PathPointSelection.ANCHORPOINT;

    for (var i = 0; i < indexes.length; i++) {
        path.pathPoints[indexes[i]].selected = ANCHOR;
    }
}

// ============================================================================
// INDEX CALCULATION
// ============================================================================

function getForwardIndexes(indexes, pointCount) {
    var newIndexes = [];

    for (var i = 0; i < indexes.length; i++) {
        var newIndex = (indexes[i] < pointCount - 1) ? indexes[i] + 1 : 0;
        newIndexes.push(newIndex);
    }

    return newIndexes;
}

function getBackwardIndexes(indexes, pointCount) {
    var newIndexes = [];

    for (var i = 0; i < indexes.length; i++) {
        var newIndex = (indexes[i] > 0) ? indexes[i] - 1 : pointCount - 1;
        newIndexes.push(newIndex);
    }

    return newIndexes;
}

function getSelectedAnchorPointIndexes(path) {
    var ANCHOR = PathPointSelection.ANCHORPOINT;
    var indexes = [];
    var points = path.pathPoints;

    for (var i = 0; i < points.length; i++) {
        if (points[i].selected === ANCHOR) {
            indexes.push(i);
        }
    }

    return indexes;
}

// ============================================================================
// ITEM COLLECTION
// ============================================================================

function getPathItems(items) {
    var paths = [];

    for (var i = 0; i < items.length; i++) {
        var item = items[i];

        if (item.typename === 'PathItem') {
            paths.push(item);
        }
        else if (item.typename === 'CompoundPathItem') {
            paths = paths.concat(getPathItems(item.pathItems));
        }
        else if (item.typename === 'GroupItem') {
            paths = paths.concat(getPathItems(item.pageItems));
        }
    }

    return paths;
}

function getTextPathItems() {
    var AREA_TEXT = TextType.AREATEXT;
    var PATH_TEXT = TextType.PATHTEXT;
    var textPaths = [];
    var textFrames = app.activeDocument.textFrames;

    for (var i = 0; i < textFrames.length; i++) {
        var textFrame = textFrames[i];

        if (textFrame.selected &&
            (textFrame.kind === AREA_TEXT || textFrame.kind === PATH_TEXT)) {
            textPaths.push(textFrame.textPath);
        }
    }

    return textPaths;
}
