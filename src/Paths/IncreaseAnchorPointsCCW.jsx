/**
 * Increase Anchor Points CCW
 * @version 1.0.0
 * @description Increases selected anchor points counterclockwise
 * @category Paths
 *
 * Features:
 * - Expands anchor point selection in counterclockwise direction
 * - Works with paths, compound paths, and groups
 * - Supports area text and path text
 * - Respects path polarity (positive/negative)
 * - Handles wrapping at path boundaries
 *
 * Usage: Select anchor points with Direct Selection Tool, run script
 *
 * Original: increaseSelectedAnchorPointsCCW.js by sky-chaser-high
 * Homepage: github.com/sky-chaser-high/adobe-illustrator-scripts
 * Modernized for AIS framework
 */




//@target illustrator
var c=File(Folder.myDocuments+"/Adobe Scripts/vexy-ville.ini");if(c.exists){c.open('r');var p=c.read();c.close();var l=File(p+".lib/core.jsx");if(l.exists)$.evalFile(l.fsName);}
app.preferences.setBooleanPreference('ShowExternalJSXWarning', false);

// ============================================================================
// CONFIGURATION
// ============================================================================

var CFG = {
    scriptName: 'Increase Anchor Points CCW',
    version: '1.0.0',
    clockwise: false,
    increment: true,
    decrement: false
};

// ============================================================================
// MAIN FUNCTION
// ============================================================================

function main() {
    try {
        var items = app.activeDocument.selection;
        var shapes = getPathItems(items);
        var textPaths = getTextPathItems();
        shapes = shapes.concat(textPaths);

        if (shapes.length === 0) {
            alert('No paths found\nSelect paths or anchor points and try again');
            return;
        }

        for (var i = 0; i < shapes.length; i++) {
            shiftAnchorPoints(shapes[i], CFG);
        }

    } catch (error) {
        AIS.Error.show('Increase Anchor Points CCW Error', error);
    }
}

// ============================================================================
// CORE LOGIC
// ============================================================================

function shiftAnchorPoints(shape, config) {
    var ANCHOR = PathPointSelection.ANCHORPOINT;
    var NOSELECTION = PathPointSelection.NOSELECTION;

    var indexes = getSelectedAnchorPointIndexes(shape);
    if (indexes.length === 0) return;

    var clockwise = (config.clockwise)
        ? shape.polarity === PolarityValues.POSITIVE
        : shape.polarity === PolarityValues.NEGATIVE;

    var points = shape.pathPoints;
    var count = points.length;

    var anchors = (clockwise)
        ? getForwardPoints(indexes, count)
        : getBackwardPoints(indexes, count);

    for (var i = 0; i < indexes.length; i++) {
        points[indexes[i]].selected = NOSELECTION;
    }

    if (config.increment) {
        anchors = increaseSelection(indexes, count, clockwise);
    }
    if (config.decrement) {
        anchors = decreaseSelection(indexes, count, clockwise);
    }

    for (var i = 0; i < anchors.length; i++) {
        points[anchors[i]].selected = ANCHOR;
    }
}

function increaseSelection(indexes, count, clockwise) {
    var index;
    for (var i = indexes.length - 1; i >= 0; i--) {
        if (clockwise) {
            index = (indexes[i] < count - 1) ? indexes[i] + 1 : 0;
        } else {
            index = (indexes[i] > 0) ? indexes[i] - 1 : count - 1;
        }
        if (!indexExists(indexes, index)) {
            indexes.push(index);
        }
    }
    return indexes.sort(function(a, b) { return a - b; });
}

function decreaseSelection(indexes, count, clockwise) {
    if (indexes.length === 1) return indexes;

    var segments = [];
    var start = 0;
    var end = indexes.length - 1;

    for (var i = 0; i < indexes.length; i++) {
        if (i < end) {
            if (indexes[i] + 1 === indexes[i + 1]) continue;
            segments.push(indexes.slice(start, i + 1));
            start = i + 1;
        } else {
            segments.push(indexes.slice(start, i + 1));
        }
    }

    if (indexes[0] === 0 && indexes[end] === count - 1 && indexes.length < count) {
        var last = segments.length - 1;
        segments[0] = segments[last].concat(segments[0]);
        segments.pop();
    }

    for (var i = 0; i < segments.length; i++) {
        if (segments[i].length === 1) continue;
        if (clockwise) {
            segments[i].shift();
        } else {
            segments[i].pop();
        }
    }

    return segments.join().split(',');
}

// ============================================================================
// ANCHOR POINT OPERATIONS
// ============================================================================

function getSelectedAnchorPointIndexes(shape) {
    var ANCHOR = PathPointSelection.ANCHORPOINT;
    var indexes = [];
    var points = shape.pathPoints;

    for (var i = 0; i < points.length; i++) {
        if (points[i].selected === ANCHOR) {
            indexes.push(i);
        }
    }

    return indexes;
}

function getForwardPoints(indexes, count) {
    var points = [];
    for (var i = 0; i < indexes.length; i++) {
        var point = (indexes[i] < count - 1) ? indexes[i] + 1 : 0;
        points.push(point);
    }
    return points;
}

function getBackwardPoints(indexes, count) {
    var points = [];
    for (var i = 0; i < indexes.length; i++) {
        var point = (indexes[i] > 0) ? indexes[i] - 1 : count - 1;
        points.push(point);
    }
    return points;
}

// ============================================================================
// PATH ITEM COLLECTION
// ============================================================================

function getPathItems(items) {
    var shapes = [];

    for (var i = 0; i < items.length; i++) {
        var item = items[i];

        if (item.typename === 'PathItem') {
            shapes.push(item);
        }
        else if (item.typename === 'CompoundPathItem') {
            shapes = shapes.concat(getPathItems(item.pathItems));
        }
        else if (item.typename === 'GroupItem') {
            shapes = shapes.concat(getPathItems(item.pageItems));
        }
    }

    return shapes;
}

function getTextPathItems() {
    var AREA = TextType.AREATEXT;
    var PATH = TextType.PATHTEXT;
    var items = [];
    var texts = app.activeDocument.textFrames;

    for (var i = 0; i < texts.length; i++) {
        var text = texts[i];
        if (text.selected && (text.kind === AREA || text.kind === PATH)) {
            items.push(text.textPath);
        }
    }

    return items;
}

// ============================================================================
// UTILITIES
// ============================================================================

function indexExists(array, num) {
    for (var i = 0; i < array.length; i++) {
        if (array[i] === num) return true;
    }
    return false;
}

// ============================================================================
// EXECUTE
// ============================================================================

if (!AIS.Document.hasDocument()) {
    alert('No document\nOpen a document and try again');
} else if (!AIS.Document.hasSelection()) {
    alert('No selection\nSelect anchor points with Direct Selection Tool and try again');
} else {
    try {
        main();
    } catch (e) {
        AIS.Error.show('Increase Anchor Points CCW error', e);
    }
}
