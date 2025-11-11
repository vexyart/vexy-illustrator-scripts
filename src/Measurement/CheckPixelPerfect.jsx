/**
 * Check Pixel Perfect
 * @version 1.0.0
 * @description Checks if path points are aligned to pixel grid and marks misaligned points
 * @category Measurement
 * @features
 * - Detects points not snapped to pixel grid
 * - Marks misaligned points with red circles
 * - Checks both 0.5px and 1.0px increments
 * - Visual feedback for pixel perfection
 * - Works with paths, compound paths, and groups
 * - Creates markers on separate layer for easy cleanup
 * @author Original: Unknown
 * @usage
 * 1. Select one or more path objects
 * 2. Run script
 * 3. Red circles will mark non-pixel-perfect points
 * 4. Check the "Pixel Check" layer for all markers
 * @notes
 * - Points should align to 0.5px or 1.0px increments
 * - Essential for web graphics and icon design
 * - Misalignment causes anti-aliasing issues
 * - Delete "Pixel Check" layer to remove markers
 * - Works best with pixel-based documents (72 DPI)
 * - this_file: Measurement/CheckPixelPerfect.jsx
 */




//@target illustrator
var c=File(Folder.myDocuments+"/Adobe Scripts/vexy-ville.ini");if(c.exists){c.open('r');var p=c.read();c.close();var l=File(p+".lib/core.jsx");if(l.exists)$.evalFile(l.fsName);}
app.preferences.setBooleanPreference('ShowExternalJSXWarning', false);

// ============================================================================
// CONFIGURATION
// ============================================================================

var CFG = {
    scriptName: 'Check Pixel Perfect',
    layerName: 'Pixel Check',
    markerSize: 5,           // Marker circle diameter in points
    markerColor: {
        red: 255,
        green: 0,
        blue: 0
    },
    tolerance: 0.01,         // Tolerance for pixel snap detection
    checkHalfPixel: true     // Check for 0.5px alignment (common for web)
};

// ============================================================================
// MAIN FUNCTION
// ============================================================================

function main() {
    var doc = app.activeDocument;
    var sel = doc.selection;

    // Get document DPI setting (ruler units)
    var units = AIS.Units.get();
    var isPixelDoc = (units === 'px' || units === 'pixel');

    if (!isPixelDoc) {
        var proceed = confirm(
            'Document units are not pixels\n\n' +
            'Current units: ' + units + '\n\n' +
            'Pixel perfect checking works best with pixel-based documents.\n\n' +
            'Continue anyway?'
        );

        if (!proceed) {
            return;
        }
    }

    // Create or get marker layer
    var markerLayer = getOrCreateMarkerLayer(doc);

    // Collect all paths from selection
    var paths = [];
    for (var i = 0; i < sel.length; i++) {
        collectPaths(sel[i], paths);
    }

    if (paths.length === 0) {
        alert('No paths found\nSelect path objects and try again');
        return;
    }

    // Check all points
    var totalPoints = 0;
    var misalignedPoints = 0;

    for (var i = 0; i < paths.length; i++) {
        var path = paths[i];

        if (!path.pathPoints || path.pathPoints.length === 0) {
            continue;
        }

        for (var j = 0; j < path.pathPoints.length; j++) {
            var point = path.pathPoints[j];
            totalPoints++;

            var anchor = point.anchor;
            var leftHandle = point.leftDirection;
            var rightHandle = point.rightDirection;

            // Check anchor point
            if (!isPixelPerfect(anchor[0], anchor[1])) {
                createMarker(anchor, markerLayer);
                misalignedPoints++;
            }

            // Check left handle (if different from anchor)
            if (!isSamePoint(leftHandle, anchor)) {
                if (!isPixelPerfect(leftHandle[0], leftHandle[1])) {
                    createMarker(leftHandle, markerLayer);
                    misalignedPoints++;
                }
            }

            // Check right handle (if different from anchor)
            if (!isSamePoint(rightHandle, anchor)) {
                if (!isPixelPerfect(rightHandle[0], rightHandle[1])) {
                    createMarker(rightHandle, markerLayer);
                    misalignedPoints++;
                }
            }
        }
    }

    // Show results
    app.redraw();

    var message = 'Pixel Perfect Check\n\n';
    message += 'Total points checked: ' + totalPoints + '\n';
    message += 'Misaligned points: ' + misalignedPoints + '\n\n';

    if (misalignedPoints > 0) {
        message += 'Red circles mark misaligned points.\n';
        message += 'Check the "' + CFG.layerName + '" layer.\n\n';
        message += 'Tip: Use View > Snap to Pixel\n';
        message += 'to align points correctly.';
    } else {
        message += 'All points are pixel perfect! ✓';
        // Delete empty marker layer
        try {
            markerLayer.remove();
        } catch (e) {
            // Layer not empty or can't delete - ignore
        }
    }

    alert(message);
}

// ============================================================================
// CORE LOGIC
// ============================================================================

/**
 * Check if coordinate is pixel perfect
 */
function isPixelPerfect(x, y) {
    // Check X coordinate
    var xFrac = Math.abs(x - Math.round(x));

    var xAligned = false;
    if (xFrac < CFG.tolerance || xFrac > (1 - CFG.tolerance)) {
        // Aligned to whole pixel
        xAligned = true;
    } else if (CFG.checkHalfPixel) {
        // Check for half-pixel alignment (0.5)
        var xHalfFrac = Math.abs(xFrac - 0.5);
        if (xHalfFrac < CFG.tolerance) {
            xAligned = true;
        }
    }

    // Check Y coordinate
    var yFrac = Math.abs(y - Math.round(y));

    var yAligned = false;
    if (yFrac < CFG.tolerance || yFrac > (1 - CFG.tolerance)) {
        // Aligned to whole pixel
        yAligned = true;
    } else if (CFG.checkHalfPixel) {
        // Check for half-pixel alignment (0.5)
        var yHalfFrac = Math.abs(yFrac - 0.5);
        if (yHalfFrac < CFG.tolerance) {
            yAligned = true;
        }
    }

    return xAligned && yAligned;
}

/**
 * Create visual marker at misaligned point
 */
function createMarker(point, layer) {
    var marker = layer.pathItems.ellipse(
        point[1] + CFG.markerSize / 2,  // Top
        point[0] - CFG.markerSize / 2,  // Left
        CFG.markerSize,                  // Width
        CFG.markerSize                   // Height
    );

    marker.stroked = true;
    marker.filled = false;
    marker.strokeWidth = 0.5;

    var color = new RGBColor();
    color.red = CFG.markerColor.red;
    color.green = CFG.markerColor.green;
    color.blue = CFG.markerColor.blue;
    marker.strokeColor = color;
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Collect all paths from item (handles groups and compound paths)
 */
function collectPaths(item, paths) {
    if (item.typename === 'PathItem') {
        paths.push(item);

    } else if (item.typename === 'CompoundPathItem') {
        for (var i = 0; i < item.pathItems.length; i++) {
            paths.push(item.pathItems[i]);
        }

    } else if (item.typename === 'GroupItem') {
        for (var i = 0; i < item.pageItems.length; i++) {
            collectPaths(item.pageItems[i], paths);
        }
    }
}

/**
 * Get or create marker layer
 */
function getOrCreateMarkerLayer(doc) {
    var layer;

    try {
        // Try to get existing layer
        layer = doc.layers.getByName(CFG.layerName);
        // Clear existing markers
        for (var i = layer.pageItems.length - 1; i >= 0; i--) {
            layer.pageItems[i].remove();
        }
    } catch (e) {
        // Create new layer
        layer = doc.layers.add();
        layer.name = CFG.layerName;
    }

    return layer;
}

/**
 * Check if two points are the same
 */
function isSamePoint(p1, p2) {
    var dx = Math.abs(p1[0] - p2[0]);
    var dy = Math.abs(p1[1] - p2[1]);
    return dx < 0.001 && dy < 0.001;
}

// ============================================================================
// EXECUTE
// ============================================================================

if (!AIS.Document.hasDocument()) {
    alert('No document\nOpen a document and try again');
} else if (!AIS.Document.hasSelection()) {
    alert('No selection\nSelect one or more paths and try again');
} else {
    try {
        main();
    } catch (e) {
        AIS.Error.show('Check Pixel Perfect error', e);
    }
}
