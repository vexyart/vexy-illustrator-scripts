/**
 * Measure Distance
 * @version 1.0.0
 * @description Measures distance, angle, and curve length between two selected anchor points
 * @category Measurement
 * @author sky-chaser-high (github.com/sky-chaser-high/adobe-illustrator-scripts)
 * @license MIT
 * @modernized 2025 - Adapted for AIS framework
 * @features
 *   - Measure straight-line distance between two points
 *   - Calculate curve length for Bezier segments
 *   - Show angle in degrees and radians
 *   - Display width and height components
 *   - Visual dimension line overlay
 *   - Coordinate display for both points
 *   - Handle positions for curve segments
 *   - Works with text on path and area text
 *   - Bilingual UI (English/Japanese)
 * @usage
 *   1. Use Direct Selection Tool
 *   2. Select exactly two anchor points
 *   3. Run script
 *   4. View measurements in dialog
 *   5. Dimension line appears on artboard
 * @notes
 *   - Requires Illustrator CS4 or higher
 *   - Units match document ruler units
 *   - Angle based on first point (-180° to 180°)
 *   - Labels hidden above 15500% zoom
 *   - Dimension line on special layer
 */

#include "../.lib/core.jsx"

//@target illustrator
app.preferences.setBooleanPreference('ShowExternalJSXWarning', false);

(function() {
    if (!AIS.Document.hasDocument()) {
        alert('No documents\nOpen a document and try again');
        return;
    }

    var aiVersion = parseInt(app.version);
    if (aiVersion < 14) {
        alert('Version not supported\nRequires Illustrator CS4 or higher');
        return;
    }

    main();
})();

// ============================================================================
// CONFIGURATION
// ============================================================================
var CFG = {
    scriptName: 'Measure Distance',
    version: '1.0.0',
    layerName: '__Distance__',
    minPoints: 2,
    maxPoints: 2,
    precision: 4  // Decimal places for rounding
};

// ============================================================================
// MAIN FUNCTION
// ============================================================================
function main() {
    try {
        var doc = app.activeDocument;
        var items = doc.selection;

        // Get all paths including text paths
        var shapes = getPathItems(items);
        var texts = getTextPathItems(doc);
        var allPaths = shapes.concat(texts);

        // Get selected points
        var points = getSelectedPoints(allPaths);

        if (points.length < CFG.minPoints) {
            alert(
                'Not enough points\n' +
                'Select exactly 2 anchor points with Direct Selection Tool'
            );
            return;
        }

        if (points.length > CFG.maxPoints) {
            alert(
                'Too many points\n' +
                'Select exactly 2 anchor points only'
            );
            return;
        }

        // Check if points form a curve
        var isCurve = checkIfCurve(points);

        // Measure distance and angles
        var result = measurePoints(points, isCurve);

        // Draw visual dimension line
        showDimensionLine(points, isCurve);
        app.redraw();

        // Show results dialog
        showResultsDialog(result);

    } catch (e) {
        AIS.Error.show('Measurement failed', e);
    }
}

// ============================================================================
// CORE LOGIC - MEASUREMENT
// ============================================================================

/**
 * Measure distance, angle, and dimensions between two points
 * @param {Array} points - Array of 2 point objects
 * @param {Boolean} isCurve - Whether points form a curve
 * @returns {Object} - Measurement results
 */
function measurePoints(points, isCurve) {
    var units = AIS.Units.get();
    var p1 = points[0];
    var p2 = points[1];

    // Convert coordinates to document units
    var x1 = AIS.Units.convert(p1.anchor.x, 'pt', units);
    var y1 = AIS.Units.convert(p1.anchor.y * -1, 'pt', units);
    var x2 = AIS.Units.convert(p2.anchor.x, 'pt', units);
    var y2 = AIS.Units.convert(p2.anchor.y * -1, 'pt', units);

    // Calculate dimensions
    var width = getWidth(p1.anchor, p2.anchor);
    width = roundTo(AIS.Units.convert(width, 'pt', units), CFG.precision);

    var height = getHeight(p1.anchor, p2.anchor);
    height = roundTo(AIS.Units.convert(height, 'pt', units), CFG.precision);

    var distance = getDistance(p1.anchor, p2.anchor);
    distance = roundTo(AIS.Units.convert(distance, 'pt', units), CFG.precision);

    // Calculate angle
    var rad = getAngle(p1.anchor, p2.anchor);
    var deg = rad * 180 / Math.PI;

    // Calculate curve if applicable
    var bezierData = { length: undefined, handles: undefined };
    if (isCurve) {
        bezierData = calculateCurve(points, units);
    }

    return {
        x1: roundTo(x1, CFG.precision),
        y1: roundTo(y1, CFG.precision),
        x2: roundTo(x2, CFG.precision),
        y2: roundTo(y2, CFG.precision),
        width: width,
        height: height,
        distance: distance,
        curveLength: bezierData.length,
        handles: bezierData.handles,
        angle: {
            rad: roundTo(rad, CFG.precision),
            deg: roundTo(deg, CFG.precision)
        },
        units: units
    };
}

/**
 * Calculate curve length and handle positions
 * @param {Array} points - Two point objects
 * @param {String} units - Unit system
 * @returns {Object} - {length, handles}
 */
function calculateCurve(points, units) {
    var bezier = getBezierPoints(points);
    var length = getCurveLength(bezier);

    var handles = {
        left: {
            x: roundTo(AIS.Units.convert(bezier[2].x, 'pt', units), CFG.precision),
            y: roundTo(AIS.Units.convert(bezier[2].y * -1, 'pt', units), CFG.precision)
        },
        right: {
            x: roundTo(AIS.Units.convert(bezier[1].x, 'pt', units), CFG.precision),
            y: roundTo(AIS.Units.convert(bezier[1].y * -1, 'pt', units), CFG.precision)
        }
    };

    return {
        length: roundTo(AIS.Units.convert(length, 'pt', units), CFG.precision),
        handles: handles
    };
}

/**
 * Calculate curve length using parametric sampling
 * @param {Array} bezier - Bezier control points
 * @returns {Number} - Curve length in points
 */
function getCurveLength(bezier) {
    var points = [];
    var step = 0.0005;

    // Sample curve at intervals
    for (var t = 0.0; t <= 1.0; t += step) {
        var point = getBezierPoint(t, bezier);
        points.push(point);
    }

    // Sum distances between sample points
    var length = 0;
    for (var i = 0; i < points.length - 1; i++) {
        length += getDistance(points[i], points[i + 1]);
    }

    return length;
}

/**
 * Calculate point on Bezier curve at parameter t
 * P(t) = (1-t)³P0 + 3(1-t)²tP1 + 3(1-t)t²P2 + t³P3
 * @param {Number} t - Parameter (0 to 1)
 * @param {Array} bezier - Control points
 * @returns {Object} - {x, y} point
 */
function getBezierPoint(t, bezier) {
    var oneMinusT = 1 - t;

    return add(
        add(
            add(
                mult(bezier[0], oneMinusT * oneMinusT * oneMinusT),
                mult(bezier[1], 3 * oneMinusT * oneMinusT * t)
            ),
            mult(bezier[2], 3 * oneMinusT * t * t)
        ),
        mult(bezier[3], t * t * t)
    );
}

/**
 * Get Bezier control points from two path points
 * @param {Array} points - Two point objects
 * @returns {Array} - [P0, P1, P2, P3]
 */
function getBezierPoints(points) {
    var p1 = points[0];
    var p2 = points[1];

    // Adjacent points
    if (p1.index.point + 1 === p2.index.point) {
        return [
            p1.anchor,
            p1.handle.right,
            p2.handle.left,
            p2.anchor
        ];
    }
    // Closed path wrapping
    else if (p1.index.point === 0 && p2.index.point === p2.count - 1) {
        return [
            p1.anchor,
            p1.handle.left,
            p2.handle.right,
            p2.anchor
        ];
    }
}

// ============================================================================
// GEOMETRY UTILITIES
// ============================================================================

function getWidth(point1, point2) {
    return Math.abs(point2.x - point1.x);
}

function getHeight(point1, point2) {
    return Math.abs(point2.y - point1.y);
}

function getDistance(point1, point2) {
    var dx = point2.x - point1.x;
    var dy = point2.y - point1.y;
    return Math.sqrt(dx * dx + dy * dy);
}

function getAngle(point1, point2) {
    var dx = point2.x - point1.x;
    var dy = point2.y - point1.y;
    return Math.atan2(dy, dx);
}

function add(a, b) {
    return { x: a.x + b.x, y: a.y + b.y };
}

function mult(a, scalar) {
    return { x: a.x * scalar, y: a.y * scalar };
}

function roundTo(value, decimals) {
    var multiplier = Math.pow(10, decimals);
    return Math.round(value * multiplier) / multiplier;
}

// ============================================================================
// VISUAL FEEDBACK - DIMENSION LINE
// ============================================================================

/**
 * Draw dimension line on artboard
 * @param {Array} points - Two point objects
 * @param {Boolean} isCurve - Whether to draw curve
 */
function showDimensionLine(points, isCurve) {
    var doc = app.activeDocument;
    var mode = doc.documentColorSpace;
    var isCMYK = (mode === DocumentColorSpace.CMYK);

    // Define colors
    var colors = {
        curve: isCMYK ? setCMYKColor(0, 100, 100, 0) : setRGBColor(230, 0, 18),
        line: isCMYK ? setCMYKColor(0, 100, 100, 0) : setRGBColor(230, 0, 18),
        circle: isCMYK ? setCMYKColor(0, 100, 100, 0) : setRGBColor(230, 0, 18),
        labelFill: isCMYK ? setCMYKColor(0, 0, 0, 60) : setRGBColor(127, 127, 127),
        labelStroke: isCMYK ? setCMYKColor(0, 0, 0, 0) : setRGBColor(255, 255, 255),
        labelText: isCMYK ? setCMYKColor(0, 0, 0, 0) : setRGBColor(255, 255, 255)
    };

    var layer = getDimensionLayer(CFG.layerName);
    var p1 = points[0].anchor;
    var p2 = points[1].anchor;

    // Draw elements
    if (isCurve) {
        drawCurveLine(points, layer, colors.curve);
    }
    drawStraightLine(points, layer, colors.line, isCurve);
    drawCircle(p1, layer, colors.circle);
    drawCircle(p2, layer, colors.circle);

    // Draw labels (if zoom allows)
    var aiVersion = parseInt(app.version);
    if (aiVersion >= 24) {
        drawLabel('#1', p1, p2, layer, colors);
        drawLabel('#2', p2, p1, layer, colors);
    }
}

function drawCurveLine(points, layer, color) {
    var view = app.activeDocument.views[0];
    var width = 4 / view.zoom;
    var p1 = points[0];
    var p2 = points[1];

    var line = layer.pathItems.add();
    line.setEntirePath([
        [p1.anchor.x, p1.anchor.y],
        [p2.anchor.x, p2.anchor.y]
    ]);
    line.filled = false;
    line.stroked = true;
    line.strokeWidth = width;
    line.strokeDashes = [];
    line.strokeColor = color;

    // Set handles
    if (p1.index.point + 1 === p2.index.point) {
        line.pathPoints[0].rightDirection = [p1.handle.right.x, p1.handle.right.y];
        line.pathPoints[1].leftDirection = [p2.handle.left.x, p2.handle.left.y];
    } else if (p1.index.point === 0 && p2.index.point === p2.count - 1) {
        line.pathPoints[0].rightDirection = [p1.handle.left.x, p1.handle.left.y];
        line.pathPoints[1].leftDirection = [p2.handle.right.x, p2.handle.right.y];
    }
}

function drawStraightLine(points, layer, color, isCurve) {
    var view = app.activeDocument.views[0];
    var width = isCurve ? 2 / view.zoom : 4 / view.zoom;
    var dash = isCurve ? [10 / view.zoom, 8 / view.zoom] : [];

    var p1 = [points[0].anchor.x, points[0].anchor.y];
    var p2 = [points[1].anchor.x, points[1].anchor.y];

    var line = layer.pathItems.add();
    line.setEntirePath([p1, p2]);
    line.filled = false;
    line.stroked = true;
    line.strokeWidth = width;
    line.strokeDashes = dash;
    line.strokeColor = color;
}

function drawCircle(point, layer, color) {
    var view = app.activeDocument.views[0];
    var radius = 6 / view.zoom;
    var diameter = radius * 2;
    var top = point.y + radius;
    var left = point.x - radius;

    var circle = layer.pathItems.ellipse(top, left, diameter, diameter);
    circle.stroked = false;
    circle.filled = true;
    circle.fillColor = color;
}

function drawLabel(text, p1, p2, layer, colors) {
    var view = app.activeDocument.views[0];
    var fontSize = 20 / view.zoom;

    // Skip if too small
    if (fontSize < 0.1) return;

    var margin = 10 / view.zoom;
    var padding = 5 / view.zoom;
    var width = 32 / view.zoom;
    var height = 24 / view.zoom;
    var radius = 4 / view.zoom;
    var strokeWidth = 1 / view.zoom;

    // Position based on angle
    var rad = getAngle(p1, p2);
    var top = (rad < 0) ? p1.y + margin + height : p1.y - margin;
    var left = p1.x - (width / 2);

    // Draw background
    var rect = layer.pathItems.roundedRectangle(top, left, width, height, radius, radius);
    rect.fillColor = colors.labelFill;
    rect.strokeColor = colors.labelStroke;
    rect.strokeWidth = strokeWidth;

    // Workaround for Illustrator bug
    rect.selected = true;
    rect.selected = false;

    // Add text
    var position = [p1.x, top - height + padding];
    var textFrame = layer.textFrames.pointText(position);
    textFrame.contents = text;

    var attributes = textFrame.textRange.characterAttributes;
    attributes.size = fontSize;
    attributes.fillColor = colors.labelText;

    // Try to set font
    try {
        attributes.textFont = app.textFonts['HelveticaNeue'];
    } catch (e) {
        // Use default font
    }

    var paragraph = textFrame.textRange.paragraphAttributes;
    paragraph.justification = Justification.CENTER;
}

// ============================================================================
// POINT SELECTION
// ============================================================================

/**
 * Get selected anchor points from paths
 * @param {Array} shapes - Array of PathItems
 * @returns {Array} - Selected points
 */
function getSelectedPoints(shapes) {
    var ANCHOR = PathPointSelection.ANCHORPOINT;
    var selection = [];

    for (var i = 0; i < shapes.length; i++) {
        var points = shapes[i].pathPoints;
        for (var j = 0; j < points.length; j++) {
            var point = points[j];
            if (point.selected === ANCHOR) {
                selection.push(createPointObject(i, j, points.length, point));
            }
        }
    }

    return selection;
}

function createPointObject(itemIndex, pointIndex, totalPoints, pathPoint) {
    var anchor = pathPoint.anchor;
    var left = pathPoint.leftDirection;
    var right = pathPoint.rightDirection;

    return {
        index: {
            item: itemIndex,
            point: pointIndex
        },
        count: totalPoints,
        anchor: { x: anchor[0], y: anchor[1] },
        handle: {
            left: { x: left[0], y: left[1] },
            right: { x: right[0], y: right[1] }
        }
    };
}

/**
 * Check if two points form a curve
 * @param {Array} points - Two point objects
 * @returns {Boolean}
 */
function checkIfCurve(points) {
    var p1 = points[0];
    var p2 = points[1];

    // Must be on same path
    if (p1.index.item !== p2.index.item) return false;

    var hasHandles = false;

    // Adjacent points
    if (p1.index.point + 1 === p2.index.point) {
        hasHandles = hasHandle(p2.anchor, p2.handle.left) ||
                     hasHandle(p1.anchor, p1.handle.right);
    }
    // Closed path wrapping
    else if (p1.index.point === 0 && p2.index.point === p2.count - 1) {
        hasHandles = hasHandle(p1.anchor, p1.handle.left) ||
                     hasHandle(p2.anchor, p2.handle.right);
    }

    return hasHandles;
}

function hasHandle(anchor, handle) {
    return anchor.x !== handle.x || anchor.y !== handle.y;
}

// ============================================================================
// PATH COLLECTION
// ============================================================================

function getPathItems(items) {
    var shapes = [];
    for (var i = 0; i < items.length; i++) {
        var item = items[i];
        if (item.typename === 'PathItem') {
            shapes.push(item);
        } else if (item.typename === 'CompoundPathItem') {
            shapes = shapes.concat(getPathItems(item.pathItems));
        } else if (item.typename === 'GroupItem') {
            shapes = shapes.concat(getPathItems(item.pageItems));
        }
    }
    return shapes;
}

function getTextPathItems(doc) {
    var items = [];
    var texts = doc.textFrames;
    for (var i = 0; i < texts.length; i++) {
        var text = texts[i];
        if (text.selected && text.kind !== TextType.POINTTEXT) {
            items.push(text.textPath);
        }
    }
    return items;
}

// ============================================================================
// LAYER MANAGEMENT
// ============================================================================

function getDimensionLayer(name) {
    var doc = app.activeDocument;
    var layer;

    try {
        layer = doc.layers[name];
        layer.locked = false;
        layer.visible = true;
    } catch (e) {
        layer = doc.layers.add();
        layer.name = name;
        layer.zOrder(ZOrderMethod.BRINGTOFRONT);
    }

    return layer;
}

// ============================================================================
// COLOR UTILITIES
// ============================================================================

function setCMYKColor(c, m, y, k) {
    var color = new CMYKColor();
    color.cyan = c;
    color.magenta = m;
    color.yellow = y;
    color.black = k;
    return color;
}

function setRGBColor(r, g, b) {
    var color = new RGBColor();
    color.red = r;
    color.green = g;
    color.blue = b;
    return color;
}

// ============================================================================
// USER INTERFACE - RESULTS DIALOG
// ============================================================================

function showResultsDialog(result) {
    var ui = getLocalizedStrings();
    var units = result.units;
    var curveText = result.curveLength ?
        '  [' + ui.curve + ' ' + result.curveLength + ' ' + units + ']' : '';

    var dialog = new Window('dialog');
    dialog.text = ui.title;
    dialog.orientation = 'column';
    dialog.alignChildren = ['fill', 'top'];
    dialog.spacing = 10;
    dialog.margins = 16;

    // Results panel
    var resultsPanel = dialog.add('panel', undefined, ui.result);
    resultsPanel.orientation = 'row';
    resultsPanel.alignChildren = ['left', 'top'];
    resultsPanel.spacing = 10;
    resultsPanel.margins = 10;

    var resultsGroup = resultsPanel.add('group');
    resultsGroup.orientation = 'row';
    resultsGroup.spacing = 10;

    // Labels column
    var labelsGroup = resultsGroup.add('group');
    labelsGroup.orientation = 'column';
    labelsGroup.alignChildren = ['right', 'center'];
    labelsGroup.spacing = 10;

    labelsGroup.add('statictext', undefined, ui.distance + ':');
    labelsGroup.add('statictext', undefined, ui.width + ':');
    labelsGroup.add('statictext', undefined, ui.height + ':');
    labelsGroup.add('statictext', undefined, ui.angle + ':');

    // Values column
    var valuesGroup = resultsGroup.add('group');
    valuesGroup.orientation = 'column';
    valuesGroup.alignChildren = ['left', 'center'];
    valuesGroup.spacing = 10;

    valuesGroup.add('statictext', undefined, result.distance + ' ' + units + curveText);
    valuesGroup.add('statictext', undefined, result.width + ' ' + units);
    valuesGroup.add('statictext', undefined, result.height + ' ' + units);
    valuesGroup.add('statictext', undefined,
        result.angle.deg + ui.deg + '  [' + result.angle.rad + ' ' + ui.rad + ']');

    // Position panel
    var posPanel = dialog.add('panel', undefined, ui.position);
    posPanel.orientation = 'row';
    posPanel.alignChildren = ['left', 'top'];
    posPanel.spacing = 10;
    posPanel.margins = 10;

    var posGroup = posPanel.add('group');
    posGroup.orientation = 'row';
    posGroup.spacing = 10;

    // Point 1
    addPointSection(posGroup, ui.point + ' #1', result.x1, result.y1,
        result.handles ? result.handles.right : null, units, ui.handle, result.curveLength);

    // Point 2
    addPointSection(posGroup, ui.point + ' #2', result.x2, result.y2,
        result.handles ? result.handles.left : null, units, ui.handle, result.curveLength);

    // Buttons
    var buttonGroup = dialog.add('group');
    buttonGroup.orientation = 'row';
    buttonGroup.alignChildren = ['right', 'center'];

    var okButton = buttonGroup.add('button', undefined, 'OK');
    okButton.preferredSize.width = 85;

    okButton.onClick = function() {
        app.undo();
        app.redraw();
        dialog.close();
    };

    dialog.show();
}

function addPointSection(parent, title, x, y, handle, units, handleLabel, hasCurve) {
    var section = parent.add('group');
    section.orientation = 'column';
    section.spacing = 10;

    // Point title
    var titleGroup = section.add('group');
    titleGroup.orientation = 'column';
    titleGroup.spacing = 10;
    titleGroup.margins = [0, 8, 0, 0];

    titleGroup.add('statictext', undefined, title);

    // Coordinates
    var coordGroup = titleGroup.add('group');
    coordGroup.orientation = 'row';
    coordGroup.spacing = 10;
    coordGroup.margins = [10, 0, 0, 0];

    var coordLabels = coordGroup.add('group');
    coordLabels.orientation = 'column';
    coordLabels.spacing = 10;
    coordLabels.add('statictext', undefined, 'X:');
    coordLabels.add('statictext', undefined, 'Y:');

    var coordValues = coordGroup.add('group');
    coordValues.orientation = 'column';
    coordValues.spacing = 10;
    coordValues.preferredSize.width = 120;
    coordValues.add('statictext', undefined, x + ' ' + units);
    coordValues.add('statictext', undefined, y + ' ' + units);

    // Handle (if curve)
    if (hasCurve) {
        var handleGroup = section.add('group');
        handleGroup.orientation = 'column';
        handleGroup.spacing = 10;
        handleGroup.margins = [0, 8, 0, 0];

        handleGroup.add('statictext', undefined, handleLabel);

        var handleCoords = handleGroup.add('group');
        handleCoords.orientation = 'row';
        handleCoords.spacing = 10;
        handleCoords.margins = [10, 0, 0, 0];

        var handleLabels = handleCoords.add('group');
        handleLabels.orientation = 'column';
        handleLabels.spacing = 10;
        handleLabels.add('statictext', undefined, 'X:');
        handleLabels.add('statictext', undefined, 'Y:');

        var handleValues = handleCoords.add('group');
        handleValues.orientation = 'column';
        handleValues.spacing = 10;
        handleValues.preferredSize.width = 120;
        handleValues.add('statictext', undefined, handle ? (handle.x + ' ' + units) : '-');
        handleValues.add('statictext', undefined, handle ? (handle.y + ' ' + units) : '-');
    }
}

function getLocalizedStrings() {
    return {
        title: 'Measure Distance',
        result: 'Result',
        distance: 'Distance',
        curve: 'Curve',
        width: 'Width',
        height: 'Height',
        angle: 'Angle',
        deg: '°',
        rad: 'rad',
        position: 'Position',
        point: 'Anchor Point',
        handle: 'Handle'
    };
}
