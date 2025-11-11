/**
 * Draw Circumscribed Circle
 * @version 1.0.0
 * @description Draw a circumscribed circle through 2 or 3 anchor points
 * @category Paths
 *
 * Features:
 * - Draw circle through 3 anchor points (true circumcircle)
 * - Draw circle through 2 anchor points (diameter mode)
 * - Supports anchor points from paths, compound paths, and text paths
 * - Works with area text and path text anchor points
 * - Uses Heron's formula for triangle area calculation
 * - Precise circumcenter calculation using coordinate geometry
 *
 * Note: For 2 points, creates circle with those points as diameter
 *
 * Usage: Select 2-3 anchor points with Direct Selection Tool
 *
 * Original: drawCircumscribedCircle.js by sky-chaser-high
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
    scriptName: 'Draw Circumscribed Circle',
    version: '1.0.0',
    minPoints: 2,
    maxPoints: 3
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

        var anchorPoints = getSelectedAnchorPoints(allPaths);

        if (anchorPoints.length < CFG.minPoints) {
            alert('Not enough points\nSelect 2-3 anchor points with Direct Selection Tool');
            return;
        }

        if (anchorPoints.length > CFG.maxPoints) {
            alert('Too many points\nSelect only 2-3 anchor points');
            return;
        }

        drawCircumscribedCircle(anchorPoints);

    } catch (error) {
        AIS.Error.show('Draw Circumscribed Circle Error', error);
    }
}

// ============================================================================
// CORE LOGIC
// ============================================================================

function drawCircumscribedCircle(points) {
    var radius = calculateRadius(points);

    if (!radius || isNaN(radius)) {
        alert('Invalid geometry\nPoints must form a valid circle (not collinear)');
        return;
    }

    var center = calculateCircumcenter(points);
    var top = center.y + radius;
    var left = center.x - radius;
    var diameter = radius * 2;

    var layer = app.activeDocument.activeLayer;
    var circle = layer.pathItems.ellipse(top, left, diameter, diameter);

    circle.fillColor = new NoColor();
    circle.stroked = true;
    circle.strokeWidth = 1;
    circle.strokeColor = app.activeDocument.defaultStrokeColor;
}

// ============================================================================
// GEOMETRIC CALCULATIONS
// ============================================================================

function calculateCircumcenter(points) {
    if (points.length === 2) {
        return calculateMidpoint(points[0], points[1]);
    }

    var p1 = points[0];
    var p2 = points[1];
    var p3 = points[2];

    var x1 = p1.x, y1 = p1.y;
    var x2 = p2.x, y2 = p2.y;
    var x3 = p3.x, y3 = p3.y;

    var x1Sq = Math.pow(x1, 2);
    var y1Sq = Math.pow(y1, 2);
    var x2Sq = Math.pow(x2, 2);
    var y2Sq = Math.pow(y2, 2);
    var x3Sq = Math.pow(x3, 2);
    var y3Sq = Math.pow(y3, 2);

    var numeratorY = (x3 - x1) * (x1Sq + y1Sq - x2Sq - y2Sq) -
                     (x2 - x1) * (x1Sq + y1Sq - x3Sq - y3Sq);
    var denominatorY = 2 * (x3 - x1) * (y1 - y2) -
                       2 * (x2 - x1) * (y1 - y3);

    var centerY = numeratorY / denominatorY;

    var centerX;
    if (x1 === x2) {
        centerX = (2 * (y1 - y3) * centerY - x1Sq - y1Sq + x3Sq + y3Sq) /
                  (2 * (x3 - x1));
    } else {
        centerX = (2 * (y1 - y2) * centerY - x1Sq - y1Sq + x2Sq + y2Sq) /
                  (2 * (x2 - x1));
    }

    return { x: centerX, y: centerY };
}

function calculateMidpoint(point1, point2) {
    var x = point1.x - (point1.x - point2.x) / 2;
    var y = point1.y - (point1.y - point2.y) / 2;
    return { x: x, y: y };
}

function calculateRadius(points) {
    if (points.length === 2) {
        return getDistance(points[0], points[1]) / 2;
    }

    var side1 = getDistance(points[0], points[1]);
    var side2 = getDistance(points[1], points[2]);
    var side3 = getDistance(points[2], points[0]);

    var area = calculateTriangleArea(side1, side2, side3);

    if (!area || area === 0) {
        return null;
    }

    var radius = (side1 * side2 * side3) / (4 * area);
    return radius;
}

function calculateTriangleArea(side1, side2, side3) {
    var semiperimeter = (side1 + side2 + side3) / 2;
    var area = Math.sqrt(
        semiperimeter *
        (semiperimeter - side1) *
        (semiperimeter - side2) *
        (semiperimeter - side3)
    );
    return area;
}

function getDistance(point1, point2) {
    var deltaX = point2.x - point1.x;
    var deltaY = point2.y - point1.y;
    return Math.sqrt(Math.pow(deltaX, 2) + Math.pow(deltaY, 2));
}

// ============================================================================
// ANCHOR POINT COLLECTION
// ============================================================================

function getSelectedAnchorPoints(paths) {
    var ANCHOR = PathPointSelection.ANCHORPOINT;
    var selectedPoints = [];

    for (var i = 0; i < paths.length; i++) {
        var pathPoints = paths[i].pathPoints;

        for (var j = 0; j < pathPoints.length; j++) {
            var point = pathPoints[j];

            if (point.selected === ANCHOR) {
                selectedPoints.push({
                    x: point.anchor[0],
                    y: point.anchor[1]
                });
            }
        }
    }

    return selectedPoints;
}

// ============================================================================
// ITEM COLLECTION
// ============================================================================

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

// ============================================================================
// EXECUTE
// ============================================================================

if (!AIS.Document.hasDocument()) {
    alert('No document\nOpen a document and try again');
} else if (!AIS.Document.hasSelection()) {
    alert('No selection\nSelect 2-3 anchor points with Direct Selection Tool');
} else {
    try {
        main();
    } catch (e) {
        AIS.Error.show('Draw Circumscribed Circle error', e);
    }
}
