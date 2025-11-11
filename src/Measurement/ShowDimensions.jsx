/**
 * Show Dimensions
 * @version 1.0.0
 * @description Displays dimensions on selected paths with visual measurement lines
 * @category Measurement
 * @features
 * - Dimension lines for straight and curved segments
 * - Color-coded by path
 * - Rotated text labels showing measurements
 * - Grouped dimensions for easy management
 * - Bezier curve support with accurate length calculation
 * - Unit-aware display (mm, pt, px, etc.)
 * @author Original: Hiroyuki Sato (@shsato on GitHub)
 * @usage
 * 1. Select one or more paths
 * 2. Run script
 * 3. Dimension lines will be drawn on a new "Dimensions" layer
 * @notes
 * - Each path gets a unique color for its dimensions
 * - All dimension elements are grouped together
 * - Dimensions stay in sync with document units
 * - this_file: Measurement/ShowDimensions.jsx
 */




//@target illustrator
var c=File(Folder.myDocuments+"/Adobe Scripts/vexy-ville.ini");if(c.exists){c.open('r');var p=c.read();c.close();var l=File(p+".lib/core.jsx");if(l.exists)$.evalFile(l.fsName);}
app.preferences.setBooleanPreference('ShowExternalJSXWarning', false);

// ============================================================================
// CONFIGURATION
// ============================================================================

var CFG = {
    scriptName: 'Show Dimensions',
    layerName: 'Dimensions',
    colors: [
        [255, 0, 0],      // Red
        [0, 0, 255],      // Blue
        [0, 180, 0],      // Green
        [255, 128, 0],    // Orange
        [128, 0, 128],    // Purple
        [0, 180, 180],    // Cyan
        [255, 0, 255]     // Magenta
    ],
    lineWidth: 0.5,           // Dimension line stroke width
    arrowSize: 3,             // Arrow head size
    textSize: 8,              // Text size in points
    offset: 10,               // Offset from path in points
    precision: 2,             // Decimal places
    samplesPerSegment: 100    // Curve sampling density
};

// ============================================================================
// MAIN FUNCTION
// ============================================================================

function main() {
    var doc = app.activeDocument;
    var sel = doc.selection;
    var paths = [];

    // Collect all path items
    for (var i = 0; i < sel.length; i++) {
        if (sel[i].typename === 'PathItem') {
            paths.push(sel[i]);
        } else if (sel[i].typename === 'GroupItem') {
            collectPathsFromGroup(sel[i], paths);
        } else if (sel[i].typename === 'CompoundPathItem') {
            for (var j = 0; j < sel[i].pathItems.length; j++) {
                paths.push(sel[i].pathItems[j]);
            }
        }
    }

    if (paths.length === 0) {
        alert('No paths found\nSelect path objects and try again');
        return;
    }

    // Get or create dimensions layer
    var dimensionLayer = getOrCreateLayer(doc, CFG.layerName);

    // Process each path
    var allDimensions = [];
    var units = AIS.Units.get();

    for (var i = 0; i < paths.length; i++) {
        var path = paths[i];
        var color = CFG.colors[i % CFG.colors.length];
        var dimensions = createDimensionsForPath(path, color, dimensionLayer, units);

        if (dimensions.length > 0) {
            allDimensions = allDimensions.concat(dimensions);
        }
    }

    // Group all dimension elements
    if (allDimensions.length > 0) {
        var group = dimensionLayer.groupItems.add();
        group.name = 'Dimension Group';

        for (var i = allDimensions.length - 1; i >= 0; i--) {
            allDimensions[i].moveToBeginning(group);
        }
    }

    app.redraw();
    alert('Success\n' + paths.length + ' path(s) dimensioned\n' +
          allDimensions.length + ' dimension elements created');
}

// ============================================================================
// CORE LOGIC
// ============================================================================

/**
 * Create dimension lines for a single path
 */
function createDimensionsForPath(path, color, layer, units) {
    var dimensions = [];

    if (!path.pathPoints || path.pathPoints.length === 0) {
        return dimensions;
    }

    var points = path.pathPoints;
    var isClosed = path.closed;
    var segmentCount = isClosed ? points.length : points.length - 1;

    // Process each segment
    for (var i = 0; i < segmentCount; i++) {
        var p1 = points[i];
        var p2 = points[(i + 1) % points.length];

        var segmentDimensions = createSegmentDimension(p1, p2, color, layer, units);
        dimensions = dimensions.concat(segmentDimensions);
    }

    return dimensions;
}

/**
 * Create dimension for a single segment (straight or curved)
 */
function createSegmentDimension(p1, p2, color, layer, units) {
    var elements = [];

    // Check if segment is curved
    var isCurved = !isZeroPoint(p1.rightDirection, p1.anchor) ||
                   !isZeroPoint(p2.leftDirection, p2.anchor);

    var length;
    var midPoint;

    if (isCurved) {
        // Calculate curved segment
        var bezier = [
            p1.anchor,
            p1.rightDirection,
            p2.leftDirection,
            p2.anchor
        ];
        length = getCurveLength(bezier, CFG.samplesPerSegment);
        midPoint = getBezierPoint(0.5, bezier);
    } else {
        // Straight segment
        length = getDistance(p1.anchor, p2.anchor);
        midPoint = getMidpoint(p1.anchor, p2.anchor);
    }

    // Create dimension line
    var line = createDimensionLine(p1.anchor, p2.anchor, midPoint, color, layer);
    elements.push(line);

    // Create text label
    var text = createDimensionText(length, midPoint, p1.anchor, p2.anchor, color, layer, units);
    elements.push(text);

    // Create arrows
    var arrow1 = createArrow(p1.anchor, p2.anchor, true, color, layer);
    var arrow2 = createArrow(p2.anchor, p1.anchor, true, color, layer);
    elements.push(arrow1);
    elements.push(arrow2);

    return elements;
}

/**
 * Create dimension line
 */
function createDimensionLine(start, end, midPoint, color, layer) {
    var line = layer.pathItems.add();
    line.stroked = true;
    line.filled = false;
    line.strokeWidth = CFG.lineWidth;
    line.strokeColor = createRGBColor(color[0], color[1], color[2]);

    // Calculate offset perpendicular to segment
    var angle = Math.atan2(end[1] - start[1], end[0] - start[0]);
    var perpAngle = angle + Math.PI / 2;
    var offsetX = Math.cos(perpAngle) * CFG.offset;
    var offsetY = Math.sin(perpAngle) * CFG.offset;

    // Create line with offset
    line.setEntirePath([
        [start[0] + offsetX, start[1] + offsetY],
        [end[0] + offsetX, end[1] + offsetY]
    ]);

    return line;
}

/**
 * Create dimension text
 */
function createDimensionText(length, position, start, end, color, layer, units) {
    var text = layer.textFrames.add();

    // Format length with unit
    var displayLength = AIS.Number.round(length, CFG.precision);
    text.contents = displayLength + ' ' + units;

    // Style text
    text.textRange.characterAttributes.size = CFG.textSize;
    text.textRange.characterAttributes.fillColor = createRGBColor(color[0], color[1], color[2]);

    // Position text at midpoint with offset
    var angle = Math.atan2(end[1] - start[1], end[0] - start[0]);
    var perpAngle = angle + Math.PI / 2;
    var offsetX = Math.cos(perpAngle) * CFG.offset;
    var offsetY = Math.sin(perpAngle) * CFG.offset;

    text.position = [position[0] + offsetX, position[1] + offsetY];

    // Rotate text to align with dimension line
    var angleDeg = angle * 180 / Math.PI;
    if (angleDeg < -90 || angleDeg > 90) {
        angleDeg += 180; // Flip text if upside down
    }
    text.rotate(angleDeg);

    return text;
}

/**
 * Create arrow head
 */
function createArrow(point, direction, isStart, color, layer) {
    var arrow = layer.pathItems.add();
    arrow.stroked = false;
    arrow.filled = true;
    arrow.fillColor = createRGBColor(color[0], color[1], color[2]);

    // Calculate arrow direction
    var angle = Math.atan2(direction[1] - point[1], direction[0] - point[0]);
    if (!isStart) {
        angle += Math.PI;
    }

    var perpAngle = angle + Math.PI / 2;
    var offsetX = Math.cos(perpAngle) * CFG.offset;
    var offsetY = Math.sin(perpAngle) * CFG.offset;

    // Arrow tip at point with offset
    var tipX = point[0] + offsetX;
    var tipY = point[1] + offsetY;

    // Arrow wings
    var wing1Angle = angle + Math.PI - Math.PI / 6;
    var wing2Angle = angle + Math.PI + Math.PI / 6;

    var wing1 = [
        tipX + Math.cos(wing1Angle) * CFG.arrowSize,
        tipY + Math.sin(wing1Angle) * CFG.arrowSize
    ];
    var wing2 = [
        tipX + Math.cos(wing2Angle) * CFG.arrowSize,
        tipY + Math.sin(wing2Angle) * CFG.arrowSize
    ];

    arrow.setEntirePath([
        [tipX, tipY],
        wing1,
        wing2
    ]);
    arrow.closed = true;

    return arrow;
}

// ============================================================================
// BEZIER CURVE CALCULATIONS
// ============================================================================

/**
 * Calculate length of Bezier curve using sampling
 */
function getCurveLength(bezier, samples) {
    var length = 0;
    var prevPoint = bezier[0];

    for (var i = 1; i <= samples; i++) {
        var t = i / samples;
        var point = getBezierPoint(t, bezier);
        length += getDistance(prevPoint, point);
        prevPoint = point;
    }

    return length;
}

/**
 * Get point on Bezier curve at parameter t
 * P(t) = (1-t)³P0 + 3(1-t)²tP1 + 3(1-t)t²P2 + t³P3
 */
function getBezierPoint(t, bezier) {
    var t2 = t * t;
    var t3 = t2 * t;
    var mt = 1 - t;
    var mt2 = mt * mt;
    var mt3 = mt2 * mt;

    return [
        mt3 * bezier[0][0] + 3 * mt2 * t * bezier[1][0] + 3 * mt * t2 * bezier[2][0] + t3 * bezier[3][0],
        mt3 * bezier[0][1] + 3 * mt2 * t * bezier[1][1] + 3 * mt * t2 * bezier[2][1] + t3 * bezier[3][1]
    ];
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Collect all paths from a group recursively
 */
function collectPathsFromGroup(group, paths) {
    for (var i = 0; i < group.pageItems.length; i++) {
        var item = group.pageItems[i];

        if (item.typename === 'PathItem') {
            paths.push(item);
        } else if (item.typename === 'GroupItem') {
            collectPathsFromGroup(item, paths);
        } else if (item.typename === 'CompoundPathItem') {
            for (var j = 0; j < item.pathItems.length; j++) {
                paths.push(item.pathItems[j]);
            }
        }
    }
}

/**
 * Get or create layer
 */
function getOrCreateLayer(doc, name) {
    try {
        return doc.layers.getByName(name);
    } catch (e) {
        var layer = doc.layers.add();
        layer.name = name;
        return layer;
    }
}

/**
 * Check if handle is at anchor (no curve)
 */
function isZeroPoint(handle, anchor) {
    var dx = Math.abs(handle[0] - anchor[0]);
    var dy = Math.abs(handle[1] - anchor[1]);
    return dx < 0.001 && dy < 0.001;
}

/**
 * Calculate distance between two points
 */
function getDistance(p1, p2) {
    var dx = p2[0] - p1[0];
    var dy = p2[1] - p1[1];
    return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Get midpoint between two points
 */
function getMidpoint(p1, p2) {
    return [
        (p1[0] + p2[0]) / 2,
        (p1[1] + p2[1]) / 2
    ];
}

/**
 * Create RGB color
 */
function createRGBColor(r, g, b) {
    var color = new RGBColor();
    color.red = r;
    color.green = g;
    color.blue = b;
    return color;
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
        AIS.Error.show('Show Dimensions error', e);
    }
}
