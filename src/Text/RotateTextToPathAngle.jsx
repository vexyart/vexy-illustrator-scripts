/**
 * Rotate Text to Path Angle
 * @version 1.0.0
 * @description Rotate text to match path segment or line between two anchor points
 * @category Text
 *
 * Features:
 * - Rotates text to match path segment angle
 * - Works with two selected anchor points or path segment
 * - Supports point text (rotates around anchor point)
 * - Handles vertical text orientation
 * - Automatic quadrant-based rotation adjustments
 *
 * Note: Curves are not supported
 *
 * Usage: Select two anchor points or path segment with Direct Selection Tool + text objects
 *
 * Original: rotateTextToMatchPathSegmentAngle.js by sky-chaser-high
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
        alert('No selection\nSelect anchor points and text objects, then try again');
        return;
    }

    main();
})();

// ============================================================================
// CONFIGURATION
// ============================================================================

var CFG = {
    scriptName: 'Rotate Text to Path Angle',
    version: '1.0.0'
};

// ============================================================================
// MAIN FUNCTION
// ============================================================================

function main() {
    try {
        var items = app.activeDocument.selection;
        var textFrames = getTextFrames(items);
        var paths = getPathItems(items);

        if (textFrames.length === 0 || paths.length === 0) {
            alert('Invalid selection\nSelect anchor points and text objects');
            return;
        }

        rotateTextToSegmentAngle(textFrames, paths);

    } catch (error) {
        AIS.Error.show('Rotate Text to Path Angle Error', error);
    }
}

// ============================================================================
// CORE LOGIC
// ============================================================================

function rotateTextToSegmentAngle(textFrames, paths) {
    var anchorPoints = getSelectedAnchorPoints(paths);

    if (anchorPoints.length !== 2) {
        alert('Anchor point selection\nSelect exactly two anchor points or a path segment');
        return;
    }

    var segmentAngle = calculateSegmentAngle(anchorPoints);

    for (var i = 0; i < textFrames.length; i++) {
        var text = textFrames[i];
        var textAngle = getTextRotationAngle(text);
        var rotationRad = calculateRotation(segmentAngle, textAngle, isVerticalText(text));
        var rotationDeg = radiansToDegrees(rotationRad);
        var pivotPoint = getPivotPoint(text);

        text.rotate(rotationDeg);

        if (pivotPoint) {
            moveToPivotPoint(text, pivotPoint);
        }
    }
}

function calculateRotation(segmentAngle, textAngle, isVertical) {
    var rotation = segmentAngle - textAngle;

    if (isObtuseAngle(segmentAngle)) {
        rotation -= Math.PI;
    }

    if (isVertical) {
        rotation -= Math.PI / 2;
        if (isSecondQuadrant(segmentAngle)) rotation -= Math.PI;
        if (isFourthQuadrant(segmentAngle)) rotation -= Math.PI;
    }

    return rotation;
}

// ============================================================================
// GEOMETRIC CALCULATIONS
// ============================================================================

function getTextRotationAngle(textFrame) {
    var matrix = textFrame.matrix;
    return Math.atan2(matrix.mValueB, matrix.mValueA);
}

function calculateSegmentAngle(points) {
    var point1 = createPoint(points[0]);
    var point2 = createPoint(points[1]);
    var deltaX = point2.x - point1.x;
    var deltaY = point2.y - point1.y;
    return Math.atan2(deltaY, deltaX);
}

function createPoint(pathPoint) {
    return {
        x: pathPoint.anchor[0],
        y: pathPoint.anchor[1]
    };
}

function radiansToDegrees(radians) {
    return radians * 180 / Math.PI;
}

function isObtuseAngle(radians) {
    var rightAngle = Math.PI / 2;
    return rightAngle <= radians || radians <= rightAngle * -1;
}

function isSecondQuadrant(radians) {
    return isObtuseAngle(radians) && 0 < radians;
}

function isFourthQuadrant(radians) {
    return !isObtuseAngle(radians) && radians < 0;
}

function isVerticalText(textFrame) {
    return textFrame.orientation === TextOrientation.VERTICAL;
}

// ============================================================================
// TEXT POSITIONING
// ============================================================================

function getPivotPoint(textFrame) {
    if (textFrame.kind !== TextType.POINTTEXT) return null;
    return textFrame.anchor;
}

function moveToPivotPoint(textFrame, originalPoint) {
    var deltaX = originalPoint[0] - textFrame.anchor[0];
    var deltaY = originalPoint[1] - textFrame.anchor[1];
    textFrame.translate(deltaX, deltaY);
}

// ============================================================================
// ANCHOR POINT SELECTION
// ============================================================================

function getSelectedAnchorPoints(paths) {
    var isSinglePath = (paths.length === 1);
    var ANCHOR = PathPointSelection.ANCHORPOINT;
    var selectedPoints = [];

    for (var i = 0; i < paths.length; i++) {
        var pathPoints = paths[i].pathPoints;
        for (var j = 0; j < pathPoints.length; j++) {
            var point = pathPoints[j];

            if (isSinglePath && isPointSelected(j, pathPoints)) {
                selectedPoints.push(point);
            }
            else if (!isSinglePath && point.selected === ANCHOR) {
                selectedPoints.push(point);
            }
        }
    }

    return selectedPoints;
}

function isPointSelected(index, pathPoints) {
    var ANCHOR = PathPointSelection.ANCHORPOINT;
    var LEFT = PathPointSelection.LEFTDIRECTION;
    var RIGHT = PathPointSelection.RIGHTDIRECTION;

    var start = 0;
    var end = pathPoints.length - 1;
    var nextIndex = (index < end) ? index + 1 : start;
    var prevIndex = (index > start) ? index - 1 : end;

    var currentPoint = pathPoints[index];
    var nextPoint = pathPoints[nextIndex];
    var prevPoint = pathPoints[prevIndex];

    if (currentPoint.selected === ANCHOR || pathPoints.length === 2) return true;
    if (currentPoint.selected === RIGHT && nextPoint.selected === LEFT) return true;
    if (currentPoint.selected === LEFT && prevPoint.selected === RIGHT) return true;

    return false;
}

// ============================================================================
// ITEM COLLECTION
// ============================================================================

function getTextFrames(items) {
    var textFrames = [];

    for (var i = 0; i < items.length; i++) {
        var item = items[i];

        if (item.typename === 'TextFrame') {
            textFrames.push(item);
        }
        else if (item.typename === 'GroupItem') {
            textFrames = textFrames.concat(getTextFrames(item.pageItems));
        }
    }

    return textFrames;
}

function getPathItems(items) {
    var paths = [];

    for (var i = 0; i < items.length; i++) {
        var item = items[i];

        if (item.typename === 'PathItem' || item.typename === 'CompoundPathItem') {
            paths.push(item);
        }
        else if (item.typename === 'GroupItem') {
            paths = paths.concat(getPathItems(item.pageItems));
        }
    }

    return paths;
}
