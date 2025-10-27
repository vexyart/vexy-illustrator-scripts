/**
 * Distribute Gradient Stops
 * @version 1.0.0
 * @description Evenly distributes gradient stops with uniform spacing. Processes all selected paths with gradient fills or strokes, calculating equal spacing between the first and last stops and redistributing intermediate stops accordingly. Handles compound paths correctly. Originally created by Sergey Osokin, modernized for AIS framework.
 * @category Colors
 * @features
 *   - Evenly spaces all gradient stops
 *   - Processes gradient fills and strokes
 *   - Works on multiple selected objects
 *   - Handles groups recursively
 *   - Handles compound paths correctly
 *   - Preserves first and last stop positions
 *   - No dialog - instant application
 * @author Sergey Osokin (original), Vexy (modernization)
 * @usage File → Scripts → Distribute Gradient Stops
 *        Select objects with gradients, run script
 * @original https://github.com/creold/illustrator-scripts
 * @license MIT
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
        alert('No objects selected\nSelect objects with gradients and try again');
        return;
    }

    main();
})();

// ============================================================================
// MAIN FUNCTION
// ============================================================================
function main() {
    try {
        var paths = [];
        var tempPaths = [];

        collectPaths(app.activeDocument.selection, paths, tempPaths);

        if (paths.length === 0) {
            alert('No paths with gradients found\nSelect objects with gradient fills or strokes');
            return;
        }

        var processedCount = processGradients(paths);

        // Clean up temporary paths created for compound path fix
        for (var i = 0; i < tempPaths.length; i++) {
            tempPaths[i].remove();
        }

        app.redraw();

        if (processedCount > 0) {
            alert('Gradient Stops Distributed\n\nProcessed ' + processedCount + ' gradient(s)');
        } else {
            alert('No gradients to distribute\nSelected objects must have gradient fills or strokes');
        }

    } catch (e) {
        AIS.Error.show('Gradient stop distribution failed', e);
    }
}

// ============================================================================
// PATH COLLECTION
// ============================================================================
function collectPaths(items, paths, tempPaths) {
    for (var i = 0; i < items.length; i++) {
        var item = items[i];

        try {
            if (item.typename === 'GroupItem') {
                collectPaths(item.pageItems, paths, tempPaths);
            } else if (item.typename === 'PathItem') {
                paths.push(item);
            } else if (item.typename === 'CompoundPathItem') {
                // Fix for compound paths created from groups
                if (item.pathItems.length === 0) {
                    tempPaths.push(item.pathItems.add());
                }
                paths.push(item.pathItems[0]);
            }
        } catch (e) {
            // Skip items that can't be processed
        }
    }
}

// ============================================================================
// GRADIENT PROCESSING
// ============================================================================
function processGradients(paths) {
    var count = 0;

    for (var i = 0; i < paths.length; i++) {
        var path = paths[i];

        if (path.filled && isGradientColor(path.fillColor)) {
            distributeStops(path.fillColor.gradient);
            count++;
        }

        if (path.stroked && isGradientColor(path.strokeColor)) {
            distributeStops(path.strokeColor.gradient);
            count++;
        }
    }

    return count;
}

function isGradientColor(color) {
    return color.typename === 'GradientColor';
}

function distributeStops(gradient) {
    var stops = gradient.gradientStops;
    var stopCount = stops.length;

    if (stopCount < 3) {
        // Need at least 3 stops to distribute (first, middle(s), last)
        return;
    }

    var firstPos = stops[0].rampPoint;
    var lastPos = stops[stopCount - 1].rampPoint;
    var totalDistance = lastPos - firstPos;
    var step = totalDistance / (stopCount - 1);

    // Reset all ramp points to minimal spacing to avoid shuffle issues
    // This is a workaround for Illustrator's gradient stop sorting behavior
    resetRampPoints(gradient, stopCount, firstPos);

    // Distribute intermediate stops evenly
    for (var i = stopCount - 2; i > 0; i--) {
        stops[i].rampPoint = firstPos + i * step;
    }
}

function resetRampPoints(gradient, stopCount, firstPos) {
    var delta = 0.0001;
    var stops = gradient.gradientStops;

    for (var i = 0; i < stopCount - 1; i++) {
        stops[i].rampPoint = firstPos + i * delta;
    }
}
