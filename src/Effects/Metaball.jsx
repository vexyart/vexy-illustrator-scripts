/**
 * Metaball
 * @version 1.0.0
 * @description Create metaball-like organic shapes between circles
 * @category Effects
 *
 * Features:
 * - Creates smooth connections between circular paths
 * - Adjustable connection rate (0-100%)
 * - Copies stroke and fill from original circles
 * - Works with groups and compound paths
 * - Mathematical curve generation using trigonometry
 *
 * Usage: Draw circles, select them, run script, enter rate value
 *
 * Note: May create overlapping anchor points. Use "Merge Overlapped Anchors" script if needed
 *
 * Original: Metaball.jsx by SATO Hiroyuki (2004-2009)
 * Homepage: http://park12.wakwak.com/~shp/lc/et/en_aics_script.html
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
        alert('No selection\nSelect circles and try again');
        return;
    }

    main();
})();

// ============================================================================
// CONFIGURATION
// ============================================================================

var CFG = {
    scriptName: 'Metaball',
    version: '1.0.0',
    handleLengthRate: 2,
    defaultRate: 50,
    minRate: 0,
    maxRate: 100
};

// ============================================================================
// MAIN FUNCTION
// ============================================================================

function main() {
    try {
        var paths = [];
        getPathItemsInSelection(1, paths);

        if (paths.length < 2) {
            alert('Not enough circles\nSelect at least 2 circles and try again');
            return;
        }

        activateEditableLayer(paths[0]);

        var rateStr = prompt('Metaball: rate ( 0 < x <= 100 )', CFG.defaultRate);
        if (!rateStr || isNaN(rateStr) || rateStr <= 0) return;

        var rate = parseFloat(rateStr);
        if (rate > CFG.maxRate) rate = CFG.maxRate;
        rate /= 100;

        var allPaths = paths.slice(0);

        for (var i = paths.length - 1; i >= 1; i--) {
            for (var j = i - 1; j >= 0; j--) {
                var metaballPath = createMetaball(paths[i], paths[j], rate, CFG.handleLengthRate);
                if (metaballPath != null) {
                    allPaths.push(metaballPath);
                }
            }
        }

        app.activeDocument.selection = allPaths;

    } catch (error) {
        AIS.Error.show('Metaball Error', error);
    }
}

// ============================================================================
// CORE LOGIC
// ============================================================================

function createMetaball(circle1, circle2, rate, handleLengthRate) {
    var data1 = getCircleData(circle1);
    var center1 = data1[0];
    var radius1 = data1[1] / 2;

    var data2 = getCircleData(circle2);
    var center2 = data2[0];
    var radius2 = data2[1] / 2;

    if (radius1 == 0 || radius2 == 0) return null;

    var halfPi = Math.PI / 2;
    var distance = calculateDistance(center1, center2);

    if (distance <= Math.abs(radius1 - radius2)) {
        return null;
    }

    var angle1, angle2;
    if (distance < radius1 + radius2) {
        angle1 = Math.acos((radius1 * radius1 + distance * distance - radius2 * radius2) / (2 * radius1 * distance));
        angle2 = Math.acos((radius2 * radius2 + distance * distance - radius1 * radius1) / (2 * radius2 * distance));
    } else {
        angle1 = 0;
        angle2 = 0;
    }

    var baseAngle = getAngle(center1, center2);
    var tangentAngle = Math.acos((radius1 - radius2) / distance);

    var angle1a = baseAngle + angle1 + (tangentAngle - angle1) * rate;
    var angle1b = baseAngle - angle1 - (tangentAngle - angle1) * rate;
    var angle2a = baseAngle + Math.PI - angle2 - (Math.PI - angle2 - tangentAngle) * rate;
    var angle2b = baseAngle - Math.PI + angle2 + (Math.PI - angle2 - tangentAngle) * rate;

    var point1a = pointFromAngle(center1, angle1a, radius1);
    var point1b = pointFromAngle(center1, angle1b, radius1);
    var point2a = pointFromAngle(center2, angle2a, radius2);
    var point2b = pointFromAngle(center2, angle2b, radius2);

    var distance2 = Math.min(rate * handleLengthRate, calculateDistance(point1a, point2a) / (radius1 + radius2));
    distance2 *= Math.min(1, distance * 2 / (radius1 + radius2));
    var handle1 = radius1 * distance2;
    var handle2 = radius2 * distance2;

    var path = app.activeDocument.activeLayer.pathItems.add();
    path.setEntirePath([point1a, point2a, point2b, point1b]);

    var points = path.pathPoints;

    points[0].leftDirection = points[0].anchor;
    points[0].rightDirection = pointFromAngle(point1a, angle1a - halfPi, handle1);

    points[1].rightDirection = points[1].anchor;
    points[1].leftDirection = pointFromAngle(point2a, angle2a + halfPi, handle2);

    points[2].leftDirection = points[2].anchor;
    points[2].rightDirection = pointFromAngle(point2b, angle2b - halfPi, handle2);

    points[3].rightDirection = points[3].anchor;
    points[3].leftDirection = pointFromAngle(point1b, angle1b + halfPi, handle1);

    path.stroked = circle1.stroked;
    if (path.stroked) path.strokeColor = circle1.strokeColor;

    path.filled = circle1.filled;
    if (path.filled) path.fillColor = circle1.fillColor;

    path.closed = true;

    return path;
}

// ============================================================================
// GEOMETRIC CALCULATIONS
// ============================================================================

function getCircleData(pathItem) {
    var bounds = pathItem.geometricBounds;
    var width = bounds[2] - bounds[0];
    var height = bounds[1] - bounds[3];
    var center = [bounds[0] + width / 2, bounds[3] + height / 2];
    return [center, width];
}

function pointFromAngle(point, angle, distance) {
    return [
        point[0] + Math.cos(angle) * distance,
        point[1] + Math.sin(angle) * distance
    ];
}

function calculateDistance(point1, point2) {
    return Math.sqrt(
        Math.pow(point1[0] - point2[0], 2) +
        Math.pow(point1[1] - point2[1], 2)
    );
}

function getAngle(point1, point2) {
    return Math.atan2(point2[1] - point1[1], point2[0] - point1[0]);
}

// ============================================================================
// PATH COLLECTION
// ============================================================================

function getPathItemsInSelection(minPoints, paths) {
    if (app.documents.length < 1) return;

    var selection = app.activeDocument.selection;
    if (!(selection instanceof Array) || selection.length < 1) return;

    extractPaths(selection, minPoints, paths);
}

function extractPaths(items, minPoints, paths) {
    for (var i = 0; i < items.length; i++) {
        var item = items[i];

        if (item.typename === 'PathItem' && !item.guides && !item.clipping) {
            if (minPoints && item.pathPoints.length <= minPoints) {
                continue;
            }
            paths.push(item);
        }
        else if (item.typename === 'GroupItem') {
            extractPaths(item.pageItems, minPoints, paths);
        }
        else if (item.typename === 'CompoundPathItem') {
            extractPaths(item.pathItems, minPoints, paths);
        }
    }
}

// ============================================================================
// UTILITIES
// ============================================================================

function activateEditableLayer(pathItem) {
    var layer = app.activeDocument.activeLayer;
    if (layer.locked || !layer.visible) {
        app.activeDocument.activeLayer = pathItem.layer;
    }
}
