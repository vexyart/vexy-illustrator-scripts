/**
 * Join Overlapping Paths
 * @version 1.0.0
 * @description Join open paths with overlapping anchor points within tolerance
 * @category Paths
 *
 * Features:
 * - User-specified tolerance for overlapping points
 * - Delete isolated single-point paths
 * - Merge overlapping points on same path
 * - Join open paths with overlapping endpoints
 * - Group support (not compound paths)
 * - Detailed operation report
 * - Tolerance-based midpoint averaging
 *
 * Note: Only selected paths are processed
 *
 * Original: joinOverlap.jsx by Christian Condamine & Mads Wolff (2017)
 * Based on: JOIN PATHS WITH OVERLAPPING POINTS
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
        alert('No selection\nSelect paths to join and try again');
        return;
    }

    main();
})();

// ============================================================================
// CONFIGURATION
// ============================================================================

var CFG = {
    scriptName: 'Join Overlapping Paths',
    version: '1.0.0',
    defaultTolerance: 0
};

var stats = {
    totalPoints: 0,
    isolatedPoints: 0,
    openPaths: 0,
    closedPaths: 0,
    mergedPoints: 0,
    joinedPaths: 0,
    remainingPaths: 0
};

// ============================================================================
// MAIN FUNCTION
// ============================================================================

function main() {
    try {
        var tolerance = showToleranceDialog();
        if (tolerance === null) return;

        resetStats();
        var selection = app.activeDocument.selection;
        processItems(selection, tolerance);

        showReportDialog();
        app.activeDocument.selection = null;

    } catch (error) {
        AIS.Error.show('Join Overlapping Paths Error', error);
    }
}

// ============================================================================
// USER INTERFACE
// ============================================================================

function showToleranceDialog() {
    var dialog = new Window('dialog', CFG.scriptName);
    dialog.orientation = 'column';
    dialog.alignChildren = ['left', 'top'];
    dialog.spacing = 10;
    dialog.margins = 16;

    var toleranceGroup = dialog.add('group');
    toleranceGroup.orientation = 'row';
    toleranceGroup.alignChildren = ['left', 'center'];

    var toleranceLabel = toleranceGroup.add('statictext', undefined, 'Tolerance:');
    var toleranceInput = toleranceGroup.add('edittext', undefined, CFG.defaultTolerance);
    toleranceInput.characters = 10;
    toleranceInput.active = true;

    var reportCheck = dialog.add('checkbox', undefined, 'Show operation report');
    reportCheck.value = true;

    var buttonGroup = dialog.add('group');
    buttonGroup.orientation = 'row';
    buttonGroup.alignChildren = ['left', 'center'];

    var okButton = buttonGroup.add('button', undefined, 'OK', { name: 'ok' });
    var cancelButton = buttonGroup.add('button', undefined, 'Cancel', { name: 'cancel' });

    var tolerance = null;
    var showReport = true;

    okButton.onClick = function() {
        var value = parseFloat(toleranceInput.text);
        tolerance = isNaN(value) ? 0 : Math.abs(value);
        showReport = reportCheck.value;
        dialog.close();
    };

    cancelButton.onClick = function() {
        tolerance = null;
        dialog.close();
    };

    dialog.show();

    CFG.showReport = showReport;
    return tolerance;
}

function showReportDialog() {
    if (!CFG.showReport) return;

    var totalSelected = stats.openPaths + stats.closedPaths;

    var dialog = new Window('dialog', 'Operation Report');
    dialog.orientation = 'column';
    dialog.alignChildren = ['fill', 'top'];
    dialog.spacing = 10;
    dialog.margins = 16;

    var selectedGroup = dialog.add('group');
    selectedGroup.orientation = 'row';
    selectedGroup.alignChildren = ['left', 'center'];
    var selectedLabel = selectedGroup.add('statictext', undefined, 'Selected paths:');
    selectedLabel.preferredSize.width = 200;
    var selectedValue = selectedGroup.add('edittext', undefined, totalSelected);
    selectedValue.characters = 8;
    selectedValue.enabled = false;

    var detailsPanel = dialog.add('panel', undefined, 'Including');
    detailsPanel.orientation = 'column';
    detailsPanel.alignChildren = ['left', 'top'];
    detailsPanel.margins = 10;

    var openGroup = detailsPanel.add('group');
    openGroup.orientation = 'row';
    openGroup.alignChildren = ['left', 'center'];
    var openLabel = openGroup.add('statictext', undefined, 'Open paths:');
    openLabel.preferredSize.width = 160;
    var openValue = openGroup.add('edittext', undefined, stats.openPaths);
    openValue.characters = 8;
    openValue.enabled = false;

    var closedGroup = detailsPanel.add('group');
    closedGroup.orientation = 'row';
    closedGroup.alignChildren = ['left', 'center'];
    var closedLabel = closedGroup.add('statictext', undefined, 'Closed paths:');
    closedLabel.preferredSize.width = 160;
    var closedValue = closedGroup.add('edittext', undefined, stats.closedPaths);
    closedValue.characters = 8;
    closedValue.enabled = false;

    dialog.add('panel', undefined, undefined).preferredSize = [300, 2];

    addResultLine(dialog, 'Isolated points deleted:', stats.isolatedPoints);
    addResultLine(dialog, 'Overlapped points merged:', stats.mergedPoints);
    addResultLine(dialog, 'Paths joined:', stats.joinedPaths);
    addResultLine(dialog, 'Remaining paths:', stats.remainingPaths + stats.closedPaths);

    var closeButton = dialog.add('button', undefined, 'Close', { name: 'cancel' });
    closeButton.alignment = ['center', 'top'];

    dialog.show();
}

function addResultLine(dialog, labelText, value) {
    var group = dialog.add('group');
    group.orientation = 'row';
    group.alignChildren = ['left', 'center'];
    var label = group.add('statictext', undefined, '- ' + labelText);
    label.preferredSize.width = 200;
    var valueField = group.add('edittext', undefined, value);
    valueField.characters = 8;
    valueField.enabled = false;
}

// ============================================================================
// CORE LOGIC
// ============================================================================

function processItems(items, tolerance) {
    var itemArray = [];
    for (var i = 0; i < items.length; i++) {
        itemArray.push(items[i]);
    }

    var openPaths = [];
    var overlapClusters = [];

    for (var i = 0; i < itemArray.length; i++) {
        var item = itemArray[i];

        if (item.typename === 'GroupItem') {
            processItems(item.pageItems, tolerance);
        }
        else if (item.typename === 'PathItem') {
            if (item.pathPoints.length > 1) {
                mergeDuplicatePoints(item);
            }

            if (item.pathPoints.length === 1) {
                item.remove();
                stats.isolatedPoints++;
                stats.openPaths++;
            }
            else if (!item.closed) {
                openPaths.push(item);
                stats.openPaths++;
            }
            else {
                stats.closedPaths++;
            }
        }
    }

    if (openPaths.length > 0) {
        findAndJoinOverlaps(openPaths, tolerance, overlapClusters);
    }
}

function mergeDuplicatePoints(path) {
    var points = [];
    for (var i = 0; i < path.pathPoints.length; i++) {
        points.push(path.pathPoints[i]);
    }

    for (var j = 0; j < points.length; j++) {
        var point = points[j];
        var nextIndex = j + ((!path.closed || (j + 1 < points.length)) ? 1 : 1 - points.length);
        var nextPoint = points[nextIndex];

        if (nextPoint && arePointsSame(point, nextPoint)) {
            nextPoint.leftDirection = point.leftDirection;
            point.remove();
            stats.mergedPoints++;
        }

        stats.totalPoints++;
    }
}

function arePointsSame(point1, point2) {
    return point1.anchor[0] === point2.anchor[0] &&
           point1.anchor[1] === point2.anchor[1] &&
           point1.rightDirection[0] === point1.anchor[0] &&
           point1.rightDirection[1] === point1.anchor[1] &&
           point2.leftDirection[0] === point1.anchor[0] &&
           point2.leftDirection[1] === point1.anchor[1];
}

function findAndJoinOverlaps(paths, tolerance, overlapClusters) {
    for (var i = 0; i < paths.length; i++) {
        var pathA = paths[i];
        var pointsA = pathA.pathPoints;

        for (var j = 0; j < pointsA.length; j++) {
            var pointA = pointsA[j];

            for (var k = i + 1; k < paths.length; k++) {
                var pathB = paths[k];
                var pointsB = pathB.pathPoints;

                for (var l = 0; l < pointsB.length; l++) {
                    var pointB = pointsB[l];

                    if (arePointsOverlapping(pointA, pointB, tolerance)) {
                        if (tolerance > 0) {
                            averagePointPositions(pointA, pointB);
                        }

                        addToCluster(pathA, pathB, overlapClusters);
                    }
                }
            }
        }
    }

    joinClusters(overlapClusters);
}

function arePointsOverlapping(pointA, pointB, tolerance) {
    if (tolerance === 0) {
        return pointA.anchor[0] === pointB.anchor[0] &&
               pointA.anchor[1] === pointB.anchor[1];
    }

    var dx = pointA.anchor[0] - pointB.anchor[0];
    var dy = pointA.anchor[1] - pointB.anchor[1];
    var distance = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));

    return tolerance >= distance;
}

function averagePointPositions(pointA, pointB) {
    var dx = (pointA.anchor[0] - pointB.anchor[0]) / 2;
    var dy = (pointA.anchor[1] - pointB.anchor[1]) / 2;

    pointA.anchor = [pointA.anchor[0] - dx, pointA.anchor[1] - dy];
    pointA.leftDirection = [pointA.leftDirection[0] - dx, pointA.leftDirection[1] - dy];
    pointA.rightDirection = [pointA.rightDirection[0] - dx, pointA.rightDirection[1] - dy];

    pointB.anchor = [pointB.anchor[0] + dx, pointB.anchor[1] + dy];
    pointB.leftDirection = [pointB.leftDirection[0] + dx, pointB.leftDirection[1] + dy];
    pointB.rightDirection = [pointB.rightDirection[0] + dx, pointB.rightDirection[1] + dy];
}

function addToCluster(pathA, pathB, overlapClusters) {
    if (pathA.overlapCluster === undefined) {
        if (pathB.overlapCluster === undefined) {
            pathA.overlapCluster = [];
            pathB.overlapCluster = pathA.overlapCluster;
            pathA.overlapCluster.push(pathA);
            pathA.overlapCluster.push(pathB);
            overlapClusters.push(pathA.overlapCluster);
        } else {
            pathA.overlapCluster = pathB.overlapCluster;
            pathA.overlapCluster.push(pathA);
        }
    } else {
        pathB.overlapCluster = pathA.overlapCluster;
        pathA.overlapCluster.push(pathB);
    }
}

function joinClusters(overlapClusters) {
    for (var i = 0; i < overlapClusters.length; i++) {
        var cluster = overlapClusters[i];
        app.activeDocument.selection = cluster;

        stats.joinedPaths += cluster.length;
        stats.remainingPaths++;

        app.executeMenuCommand('join');

        var joinedPath = app.activeDocument.selection[0];
        delete joinedPath.overlapCluster;
    }
}

// ============================================================================
// UTILITIES
// ============================================================================

function resetStats() {
    stats.totalPoints = 0;
    stats.isolatedPoints = 0;
    stats.openPaths = 0;
    stats.closedPaths = 0;
    stats.mergedPoints = 0;
    stats.joinedPaths = 0;
    stats.remainingPaths = 0;
}
