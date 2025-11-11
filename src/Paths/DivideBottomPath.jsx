/**
 * Divide Bottom Path
 * @version 1.0.0
 * @description Divides the bottom path at intersection points with top paths
 * @category Paths
 * @features
 * - Divides bottom path at all intersection points
 * - Optional removal of top paths after division
 * - Optional random stroke colors for resulting segments
 * - Preserves path properties (stroke width, fill, etc.)
 * - Uses Illustrator's Planet X for intersection detection
 * - Handles closed and open paths
 * @author Original: Sergey Osokin (hi@sergosokin.ru)
 * @credits Cut At Selected Anchors algorithm by Hiroyuki Sato (https://github.com/shspage)
 * @usage
 * 1. Select two or more paths (bottom path will be divided)
 * 2. Run script
 * 3. Bottom path is divided at intersection points with top paths
 * @notes
 * - Bottom path = last selected path in stacking order
 * - Top paths can optionally be removed (isRmvTop = true)
 * - Random stroke colors can be applied (isRndColor = false by default)
 * - Requires Illustrator CC 2019 or later (v16+)
 * - If paths split unexpectedly, try moving paths slightly before rerunning
 * @compatibility Adobe Illustrator CC 2019-2025
 */




//@target illustrator
var c=File(Folder.myDocuments+"/Adobe Scripts/vexy-ville.ini");if(c.exists){c.open('r');var p=c.read();c.close();var l=File(p+".lib/core.jsx");if(l.exists)$.evalFile(l.fsName);}
app.preferences.setBooleanPreference('ShowExternalJSXWarning', false);

// ============================================================================
// CONFIGURATION
// ============================================================================
var CFG = {
    removeTopPaths: true,    // Remove top paths after division
    randomStrokeColor: false // Apply random stroke colors to segments
};

// ============================================================================
// MAIN FUNCTION
// ============================================================================
function main() {
    var paths = collectPaths(selection);

    if (paths.length < 2) {
        alert('Not enough paths\nSelect at least two paths');
        return;
    }

    // Add intersection points using Planet X
    addIntersectionPoints();

    // Check for Planet X error (paths split unexpectedly)
    if (selection.length !== paths.length) {
        selection = null;
        app.redraw();
        alert('Path problem\n' +
              'Due to an Illustrator error, resulting paths got split.\n' +
              'Try moving the paths slightly before running the script again.',
              'Script Error');
        app.undo();
        return;
    }

    var lastIdx = selection.length - 1;
    var bottomPath = selection[lastIdx];
    var topPaths = convertToArray(selection);
    topPaths.splice(lastIdx, 1);

    // Get intersection points
    var topPoints = collectAllPoints(topPaths);
    var intersectionIndices = findIntersectionPoints(bottomPath, topPoints);

    // Divide bottom path at intersection points
    selectPathPoints(bottomPath, intersectionIndices);
    dividePathAtSelectedPoints(bottomPath);

    // Apply random stroke colors if enabled
    if (CFG.randomStrokeColor) {
        applyRandomColors();
    }

    // Remove top paths if enabled
    if (CFG.removeTopPaths) {
        for (var i = topPaths.length - 1; i >= 0; i--) {
            topPaths[i].remove();
        }
    }
}

// ============================================================================
// CORE LOGIC
// ============================================================================

/**
 * Collect valid paths from selection
 * @param {Object} coll - Selection collection
 * @returns {Array} Array of valid path items
 */
function collectPaths(coll) {
    var out = [];

    for (var i = 0; i < coll.length; i++) {
        var item = coll[i];

        if (item.typename === 'GroupItem' && item.pageItems.length > 0) {
            out = out.concat(collectPaths(item.pageItems));
        } else if (item.typename === 'PathItem') {
            // Ensure path has stroke
            if (!item.stroked) {
                item.stroked = true;
                item.strokeWidth = 1;
                item.strokeColor = generateRandomColor();
            }

            // Keep only stroked paths with visible width
            if (item.stroked && item.strokeWidth > 0) {
                item.filled = false;
                out.push(item);
            } else {
                item.selected = false;
            }
        } else {
            // Deselect non-path items
            item.selected = false;
        }
    }

    return out;
}

/**
 * Convert collection to standard array
 * @param {Object} coll - Collection to convert
 * @returns {Array} Standard JavaScript array
 */
function convertToArray(coll) {
    var out = [];
    for (var i = 0; i < coll.length; i++) {
        out.push(coll[i]);
    }
    return out;
}

/**
 * Collect all anchor points from paths
 * @param {Array} paths - Array of path items
 * @returns {Array} Array of anchor point coordinates
 */
function collectAllPoints(paths) {
    var out = [];

    for (var i = 0; i < paths.length; i++) {
        var item = paths[i];
        if (item.typename !== 'PathItem') continue;

        var pp = item.pathPoints;
        for (var j = 0; j < pp.length; j++) {
            out.push(pp[j].anchor);
        }
    }

    return out;
}

/**
 * Add intersection points to paths using Planet X
 * Uses Illustrator's built-in Planet X feature
 */
function addIntersectionPoints() {
    app.executeMenuCommand('group');
    app.executeMenuCommand('Make Planet X');
    selection[0].translate(0, 0); // Force view update
    app.executeMenuCommand('Expand Planet X');

    try {
        app.executeMenuCommand('ungroup');
        app.executeMenuCommand('ungroup');
    } catch (err) {
        // Silently handle ungroup errors
    }
}

/**
 * Find indices of intersection points on path
 * @param {PathItem} path - Path to check
 * @param {Array} points - Array of intersection point coordinates
 * @returns {Array} Array of path point indices
 */
function findIntersectionPoints(path, points) {
    if (path.typename !== 'PathItem') return [];

    var pathPoints = path.pathPoints;
    var indices = [];

    for (var i = 0; i < pathPoints.length; i++) {
        var pt = pathPoints[i];
        if (points.length && matchesCoordinate(pt.anchor, points)) {
            indices.push(i);
        }
    }

    return indices;
}

/**
 * Check if coordinate matches any in list (with tolerance)
 * @param {Array} coord - Coordinate to check [x, y]
 * @param {Array} coordList - List of coordinates to match against
 * @returns {Boolean} True if match found
 */
function matchesCoordinate(coord, coordList) {
    for (var i = 0; i < coordList.length; i++) {
        if (coord[0].toFixed(2) == coordList[i][0].toFixed(2) &&
            coord[1].toFixed(2) == coordList[i][1].toFixed(2)) {
            coordList.splice(i, 1); // Remove matched point
            return true;
        }
    }
    return false;
}

/**
 * Select specific path points by indices
 * @param {PathItem} path - Path to select points on
 * @param {Array} indices - Array of point indices to select
 */
function selectPathPoints(path, indices) {
    selection = [];
    for (var i = 0; i < indices.length; i++) {
        var idx = indices[i];
        path.pathPoints[idx].selected = PathPointSelection.ANCHORPOINT;
    }
}

/**
 * Divide path at selected anchor points
 * Algorithm by Hiroyuki Sato (https://github.com/shspage)
 * @param {PathItem} path - Path to divide
 */
function dividePathAtSelectedPoints(path) {
    if (!path) return;

    var pp = path.pathPoints;
    var firstAnchSel = isPointSelected(pp[0]);
    var indices = [[0]];

    // Build index groups between selected points
    for (var i = 1; i < pp.length; i++) {
        indices[indices.length - 1].push(i);
        if (isPointSelected(pp[i])) {
            indices.push([i]);
        }
    }

    // Check if division is needed
    if (indices.length < 2 && !(firstAnchSel && path.closed)) {
        return;
    }

    // Adjust indices for closed paths
    if (path.closed) {
        if (firstAnchSel) {
            indices[indices.length - 1].push(0);
        } else {
            var firstGroup = indices.shift();
            indices[indices.length - 1] = indices[indices.length - 1].concat(firstGroup);
        }
    }

    // Create new paths from index groups
    for (var i = 0; i < indices.length; i++) {
        var idxGroup = indices[i];
        var anchors = [];

        // Collect anchors for this segment
        for (var j = idxGroup.length - 1; j >= 0; j--) {
            anchors.unshift(pp[idxGroup[j]].anchor);
        }

        // Create duplicate path with segment
        var newPath = path.duplicate();
        newPath.closed = false;
        newPath.setEntirePath(anchors);

        // Copy handle directions and point types
        for (var j = newPath.pathPoints.length - 1; j >= 0; j--) {
            newPath.pathPoints[j].rightDirection = pp[idxGroup[j]].rightDirection;
            newPath.pathPoints[j].leftDirection = pp[idxGroup[j]].leftDirection;
            newPath.pathPoints[j].pointType = pp[idxGroup[j]].pointType;
        }

        newPath.selected = true;
    }

    // Remove original path
    path.remove();
}

/**
 * Check if path point is selected
 * @param {PathPoint} point - Path point to check
 * @returns {Boolean} True if anchor point is selected
 */
function isPointSelected(point) {
    return point.selected === PathPointSelection.ANCHORPOINT;
}

/**
 * Apply random stroke colors to selected paths
 */
function applyRandomColors() {
    var isRgb = (app.activeDocument.documentColorSpace === DocumentColorSpace.RGB);

    for (var i = selection.length - 1; i >= 0; i--) {
        if (selection[i].stroked) {
            selection[i].strokeColor = generateRandomColor(isRgb);
        }
    }
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Generate random RGB or CMYK color
 * @param {Boolean} isRgb - Use RGB mode (default: true)
 * @returns {Color} Random color object
 */
function generateRandomColor(isRgb) {
    if (arguments.length === 0) isRgb = true;

    var c = isRgb ? new RGBColor() : new CMYKColor();

    if (isRgb) {
        c.red = Math.min(randomInt(0, 255, 8), 255);
        c.green = Math.min(randomInt(0, 255, 8), 255);
        c.blue = Math.min(randomInt(0, 255, 8), 255);
    } else {
        c.cyan = randomInt(0, 100, 5);
        c.magenta = randomInt(0, 100, 5);
        c.yellow = randomInt(0, 100, 5);
        c.black = 0;
    }

    return c;
}

/**
 * Get random integer in range with step
 * @param {Number} min - Minimum value
 * @param {Number} max - Maximum value
 * @param {Number} step - Step increment
 * @returns {Number} Random integer
 */
function randomInt(min, max, step) {
    var rand = min - 0.5 + Math.random() * (max - min + 1);
    return Math.round(rand / step) * step;
}

// ============================================================================
// EXECUTE
// ============================================================================

if (!AIS.Document.hasDocument()) {
    alert('No document\nOpen a document and try again');
} else if (!AIS.Document.hasSelection()) {
    alert('No selection\nSelect two or more paths and try again');
} else {
    try {
        main();
    } catch (e) {
        AIS.Error.show('Script error', e);
    }
}
