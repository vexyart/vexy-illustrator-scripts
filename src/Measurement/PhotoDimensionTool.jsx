/**
 * Photo Dimension Tool
 * @version 1.0.0
 * @description Transform a straight line into a dimension annotation with arrows and measurement text.
 *              Useful for adding dimensional callouts to technical drawings, architectural plans,
 *              and annotated photos. Automatically calculates line angle and positions dimension
 *              elements correctly for any line orientation.
 * @category Measurement
 * @author Original by Christian Condamine | Modernized for AIS framework
 *
 * @requires lib/core.jsx
 *
 * @features
 *   - Convert straight line path to dimension annotation
 *   - Automatic arrow placement at both ends
 *   - Centered measurement label with custom text
 *   - Choose units: mm, cm, inches, pixels, or none
 *   - Scale adjustment coefficient (% for photo dimensioning)
 *   - 6 color choices for dimension elements
 *   - Auto-rotation to match any line angle
 *   - Handles all line orientations (360°)
 *   - Live preview with undo support
 *   - Creates dedicated "Dimensions" layer
 *   - Settings persistence between sessions
 *
 * @usage
 *   1. Draw a straight line where you want the dimension
 *   2. Select the line with Selection Tool
 *   3. Run script
 *   4. Enter measurement value and choose options
 *   5. Use live preview to verify appearance
 *   6. Click OK to finalize
 *
 * @notes
 *   - Only works with 2-point straight paths
 *   - Scale factor adjusts dimension size to match photo scale
 *   - Original line is hidden but not deleted
 *   - All dimension elements are grouped
 *   - Uses Century Gothic font (fallback to Arial if unavailable)
 *
 * @inspiration Preview management inspired by Alexander Ladygin's tutorial
 *             (https://ladyginpro.ru/blog/create-preview-in-dialog/)
 */

#targetengine photoDimensionTool
#include "../.lib/core.jsx"

//@target illustrator
app.preferences.setBooleanPreference('ShowExternalJSXWarning', false);

// ============================================================================
// CONFIGURATION
// ============================================================================

var CFG = {
    // Unit options
    units: [
        {id: 'mm', label: 'mm'},
        {id: 'cm', label: 'cm'},
        {id: 'in', label: 'inches'},
        {id: 'px', label: 'pixels'},
        {id: 'none', label: 'none'}
    ],

    // Color options (RGB values)
    colors: [
        {id: 'black', label: 'Black', rgb: [0, 0, 0]},
        {id: 'magenta', label: 'Magenta', rgb: [230, 0, 126]},
        {id: 'cyan', label: 'Cyan', rgb: [0, 159, 227]},
        {id: 'green', label: 'Green', rgb: [0, 118, 50]},
        {id: 'yellow', label: 'Yellow', rgb: [255, 236, 66]},
        {id: 'white', label: 'White', rgb: [255, 255, 255]}
    ],

    // Default settings
    defaults: {
        value: 'X',
        unitIndex: 0,      // mm
        colorIndex: 0,     // Black
        scaleFactor: 75,   // 75% scale
        fontName: 'CenturyGothic',
        fontFallback: 'ArialMT'
    },

    // Dimension layer name
    layerName: 'Dimensions'
};

var SETTINGS = {
    name: 'photo-dimension-tool-settings.json',
    folder: Folder.myDocuments + '/Adobe Scripts/'
};

// Global variables for preview management
var previewState = false;
var selectedPath;
var pathInfo;

// ============================================================================
// MAIN FUNCTION
// ============================================================================

function main() {
    var doc = AIS.Document.getActive();
    if (!doc) return;

    // Validate selection
    var selection = doc.selection;
    if (selection.length === 0 || selection.length > 1) {
        alert(
            'Invalid selection\n\n' +
            'Please select exactly one straight line path and try again.'
        );
        return;
    }

    // Check if selection is a path
    if (selection[0].typename !== 'PathItem') {
        alert(
            'Not a path\n\n' +
            'Please select a straight line path (not text, group, or other object).'
        );
        return;
    }

    // Store selected path
    selectedPath = selection[0];

    // Validate path has exactly 2 anchor points (straight line)
    if (selectedPath.pathPoints.length !== 2) {
        alert(
            'Not a straight line\n\n' +
            'The selected path must have exactly 2 anchor points. ' +
            'Please select a simple straight line.'
        );
        return;
    }

    // Extract path information
    pathInfo = extractPathInfo(selectedPath);

    // Create or get dimension layer
    var dimensionLayer = createDimensionLayer(doc);

    // Hide original path (but don't delete)
    selectedPath.hidden = true;

    // Show dialog
    showDialog(doc, dimensionLayer);
}

// ============================================================================
// USER INTERFACE
// ============================================================================

/**
 * Show dimension configuration dialog
 * @param {Document} doc - Active document
 * @param {Layer} layer - Dimension layer
 */
function showDialog(doc, layer) {
    // Load settings
    var config = loadSettings();

    var dialog = new Window('dialog', 'Dimension on a Photo');
    dialog.alignChildren = ['left', 'top'];
    dialog.spacing = 5;

    // Value input
    var valueGroup = dialog.add('group');
    var valuePanel = valueGroup.add('panel', undefined, 'Value');
    valuePanel.preferredSize = [145, 60];
    valuePanel.alignChildren = ['left', 'top'];
    valuePanel.margins = 10;

    var valueInput = valuePanel.add('edittext', undefined, config.value);
    valueInput.characters = 8;
    valueInput.preferredSize = [90, 25];
    valueInput.helpTip = 'Enter the measurement value to display';

    // Units dropdown
    var unitPanel = valueGroup.add('panel', undefined, 'Unit');
    unitPanel.preferredSize = [105, 60];
    unitPanel.alignChildren = ['left', 'top'];
    unitPanel.margins = 10;

    var unitDropdown = unitPanel.add('dropdownlist', undefined, []);
    for (var i = 0; i < CFG.units.length; i++) {
        unitDropdown.add('item', CFG.units[i].label);
    }
    unitDropdown.selection = config.unitIndex;
    unitDropdown.preferredSize.width = 80;

    // Divider 1
    var div1 = dialog.add('panel', undefined, undefined);
    div1.alignment = ['fill', 'top'];

    // Scale factor and color
    var formatsGroup = dialog.add('group');

    // Scale factor panel
    var scalePanel = formatsGroup.add('panel', undefined, 'Scale Adjustment');
    scalePanel.preferredSize = [145, 60];
    scalePanel.alignChildren = ['left', 'top'];
    scalePanel.margins = 10;

    var scaleGroup = scalePanel.add('group');
    scaleGroup.orientation = 'row';
    scaleGroup.spacing = 5;

    var scaleInput = scaleGroup.add('edittext', undefined, config.scaleFactor.toString());
    scaleInput.characters = 4;
    scaleInput.preferredSize = [40, 25];
    scaleInput.helpTip = 'Adjust dimension size to match photo scale (% of base size)';

    scaleGroup.add('statictext', undefined, '%');

    // Color panel
    var colorPanel = formatsGroup.add('panel', undefined, 'Color');
    colorPanel.preferredSize = [105, 60];
    colorPanel.alignChildren = ['left', 'top'];
    colorPanel.margins = 10;

    var colorDropdown = colorPanel.add('dropdownlist', undefined, []);
    for (var j = 0; j < CFG.colors.length; j++) {
        colorDropdown.add('item', CFG.colors[j].label);
    }
    colorDropdown.selection = config.colorIndex;
    colorDropdown.preferredSize.width = 80;

    // Divider 2
    var div2 = dialog.add('panel', undefined, undefined);
    div2.alignment = ['fill', 'top'];

    // Buttons
    var buttonGroup = dialog.add('group');
    buttonGroup.alignment = ['right', 'top'];
    buttonGroup.spacing = 10;

    var okBtn = buttonGroup.add('button', undefined, 'OK', {name: 'ok'});
    var cancelBtn = buttonGroup.add('button', undefined, 'Cancel', {name: 'cancel'});

    // Preview update handlers
    valueInput.onChange = function() { updatePreview(doc, layer); };
    unitDropdown.onChange = function() { updatePreview(doc, layer); };
    scaleInput.onChange = function() { updatePreview(doc, layer); };
    colorDropdown.onChange = function() { updatePreview(doc, layer); };

    // OK button handler
    okBtn.onClick = function() {
        previewState = false;  // Don't undo final result
    };

    // Cancel button handler
    cancelBtn.onClick = function() {
        if (previewState) {
            app.undo();  // Remove preview
        }
        selectedPath.hidden = false;  // Show original path
        dialog.close();
    };

    // Save settings on close
    dialog.onClose = function() {
        if (dialog.result === 1) {  // OK was clicked
            saveSettings({
                value: valueInput.text,
                unitIndex: unitDropdown.selection.index,
                colorIndex: colorDropdown.selection.index,
                scaleFactor: parseFloat(scaleInput.text)
            });
        }
    };

    /**
     * Update live preview
     */
    function updatePreview(doc, layer) {
        if (previewState) {
            app.undo();
        } else {
            previewState = true;
        }

        // Get current settings
        var settings = {
            value: valueInput.text,
            unit: CFG.units[unitDropdown.selection.index].label,
            color: CFG.colors[colorDropdown.selection.index],
            scaleFactor: parseFloat(scaleInput.text) / 100
        };

        // Draw dimension
        drawDimension(doc, layer, settings);
        app.redraw();
    }

    // Show initial preview
    dialog.center();
    updatePreview(doc, layer);
    dialog.show();
}

// ============================================================================
// CORE LOGIC - GEOMETRY & DRAWING
// ============================================================================

/**
 * Extract information from selected path
 * @param {PathItem} path - Selected path
 * @returns {Object} Path information
 */
function extractPathInfo(path) {
    var bounds = path.geometricBounds;
    var p1 = path.pathPoints[0].anchor;
    var p2 = path.pathPoints[1].anchor;

    return {
        // Anchor points
        p1x: p1[0],
        p1y: p1[1],
        p2x: p2[0],
        p2y: p2[1],

        // Bounds and dimensions
        width: bounds[2] - bounds[0],
        height: bounds[1] - bounds[3],
        length: path.length,

        // Direction indicators
        horizDir: (p1[0] < p2[0]) ? 1 : -1,
        vertDir: (p1[1] < p2[1]) ? 1 : -1,

        // Angle calculation
        angle: Math.atan2(bounds[2] - bounds[0], bounds[1] - bounds[3]) * 180 / Math.PI
    };
}

/**
 * Draw the complete dimension annotation
 * @param {Document} doc - Document
 * @param {Layer} layer - Dimension layer
 * @param {Object} settings - Dimension settings
 */
function drawDimension(doc, layer, settings) {
    // Create group for dimension elements
    var dimensionGroup = layer.groupItems.add();
    dimensionGroup.name = 'Dimension';

    // Create color
    var color = new RGBColor();
    color.red = settings.color.rgb[0];
    color.green = settings.color.rgb[1];
    color.blue = settings.color.rgb[2];

    // Calculate scaling factors
    var scale = settings.scaleFactor;
    var lineWidth = 0.3 * scale;
    var arrowSize = 5 * lineWidth;
    var arrowLength = 20 * lineWidth;

    // Create arrows
    var arrow1 = createArrow(dimensionGroup, pathInfo.p1x, pathInfo.p1y,
                            arrowSize, arrowLength, color, lineWidth * 2);
    var arrow2 = createArrow(dimensionGroup, pathInfo.p2x, pathInfo.p2y,
                            arrowSize, arrowLength, color, lineWidth * 2);

    // Create text frame
    var labelText = settings.value;
    if (settings.unit !== 'none') {
        labelText += ' ' + settings.unit;
    }

    var textFrame = createTextFrame(dimensionGroup, labelText, color, 8 * scale);
    var textWidth = textFrame.width;

    // Create dimension lines
    var gapSize = (pathInfo.length - (textWidth * 1.2)) / 2;

    var line1 = dimensionGroup.pathItems.add();
    line1.setEntirePath([
        [pathInfo.p1x, pathInfo.p1y],
        [pathInfo.p1x, pathInfo.p1y - gapSize]
    ]);
    line1.strokeWidth = lineWidth;
    line1.strokeColor = color;
    line1.filled = false;

    var line2 = dimensionGroup.pathItems.add();
    line2.setEntirePath([
        [pathInfo.p2x, pathInfo.p2y],
        [pathInfo.p2x, pathInfo.p2y + gapSize]
    ]);
    line2.strokeWidth = lineWidth;
    line2.strokeColor = color;
    line2.filled = false;

    // Rotate and position based on line orientation
    positionDimensionElements(arrow1, arrow2, line1, line2, textFrame);
}

/**
 * Create an arrow path
 * @param {GroupItem} group - Parent group
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {number} width - Arrow width
 * @param {number} length - Arrow length
 * @param {RGBColor} color - Stroke color
 * @param {number} strokeWidth - Stroke width
 * @returns {PathItem} Arrow path
 */
function createArrow(group, x, y, width, length, color, strokeWidth) {
    var arrow = group.pathItems.add();
    arrow.setEntirePath([
        [x - width, y - length],
        [x, y],
        [x + width, y - length]
    ]);
    arrow.stroked = true;
    arrow.filled = false;
    arrow.strokeColor = color;
    arrow.strokeWidth = strokeWidth;
    return arrow;
}

/**
 * Create text frame for dimension label
 * @param {GroupItem} group - Parent group
 * @param {string} text - Label text
 * @param {RGBColor} color - Text color
 * @param {number} size - Font size
 * @returns {TextFrame} Text frame
 */
function createTextFrame(group, text, color, size) {
    var textFrame = group.textFrames.add();
    textFrame.contents = text;

    // Try to use Century Gothic, fallback to Arial
    try {
        textFrame.textRange.characterAttributes.textFont =
            app.textFonts.getByName(CFG.defaults.fontName);
    } catch (err) {
        try {
            textFrame.textRange.characterAttributes.textFont =
                app.textFonts.getByName(CFG.defaults.fontFallback);
        } catch (err2) {
            // Use default font
        }
    }

    textFrame.textRange.size = size;
    textFrame.textRange.characterAttributes.fillColor = color;
    textFrame.filled = true;
    textFrame.stroked = false;
    textFrame.paragraphs[0].paragraphAttributes.justification = Justification.CENTER;

    return textFrame;
}

/**
 * Position and rotate dimension elements based on line orientation
 * @param {PathItem} arrow1 - First arrow
 * @param {PathItem} arrow2 - Second arrow
 * @param {PathItem} line1 - First dimension line
 * @param {PathItem} line2 - Second dimension line
 * @param {TextFrame} textFrame - Dimension label
 */
function positionDimensionElements(arrow1, arrow2, line1, line2, textFrame) {
    var angle = pathInfo.angle;
    var hDir = pathInfo.horizDir;
    var vDir = pathInfo.vertDir;

    // Calculate text position (midpoint of line)
    var midX = pathInfo.p1x + ((pathInfo.p2x - pathInfo.p1x) / 2);
    var midY = pathInfo.p1y + ((pathInfo.p2y - pathInfo.p1y) / 2);

    // Rotate based on quadrant
    if (hDir > 0) {
        if (vDir > 0) {
            // Quadrant 1 (right-up)
            arrow1.rotate(180 - angle, true, true, true, true, Transformation.TOP);
            arrow2.rotate(180 - angle, true, true, true, true, Transformation.BOTTOM);
            line1.rotate(180 - angle, true, true, true, true, Transformation.TOP);
            line2.rotate(180 - angle, true, true, true, true, Transformation.BOTTOM);

            textFrame.left = midX - (textFrame.width / 2);
            textFrame.top = midY + (textFrame.height / 2);
            textFrame.rotate(90 - angle, true, true, true, true, Transformation.CENTER);
        } else {
            // Quadrant 4 (right-down)
            arrow1.rotate(angle, true, true, true, true, Transformation.TOP);
            arrow2.rotate(angle, true, true, true, true, Transformation.BOTTOM);
            line1.rotate(angle, true, true, true, true, Transformation.TOP);
            line2.rotate(angle, true, true, true, true, Transformation.BOTTOM);

            textFrame.left = midX - (textFrame.width / 2);
            textFrame.top = midY + (textFrame.height / 2);
            textFrame.rotate(-90 + angle, true, true, true, true, Transformation.CENTER);
        }
    } else {
        if (vDir > 0) {
            // Quadrant 2 (left-up)
            arrow1.rotate(angle - 180, true, true, true, true, Transformation.TOP);
            arrow2.rotate(angle - 180, true, true, true, true, Transformation.BOTTOM);
            line1.rotate(angle - 180, true, true, true, true, Transformation.TOP);
            line2.rotate(angle - 180, true, true, true, true, Transformation.BOTTOM);

            textFrame.left = midX - (textFrame.width / 2);
            textFrame.top = midY + (textFrame.height / 2);
            textFrame.rotate(270 + angle, true, true, true, true, Transformation.CENTER);
        } else {
            // Quadrant 3 (left-down)
            arrow1.rotate(-angle, true, true, true, true, Transformation.TOP);
            arrow2.rotate(-angle, true, true, true, true, Transformation.BOTTOM);
            line1.rotate(-angle, true, true, true, true, Transformation.TOP);
            line2.rotate(-angle, true, true, true, true, Transformation.BOTTOM);

            textFrame.left = midX - (textFrame.width / 2);
            textFrame.top = midY + (textFrame.height / 2);
            textFrame.rotate(90 - angle, true, true, true, true, Transformation.CENTER);
        }
    }
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Create or get dimension layer
 * @param {Document} doc - Document
 * @returns {Layer} Dimension layer
 */
function createDimensionLayer(doc) {
    // Check if layer already exists
    for (var i = 0; i < doc.layers.length; i++) {
        if (doc.layers[i].name === CFG.layerName) {
            doc.activeLayer = doc.layers[i];
            return doc.layers[i];
        }
    }

    // Create new layer
    var layer = doc.layers.add();
    layer.name = CFG.layerName;
    doc.activeLayer = layer;
    return layer;
}

/**
 * Load settings from JSON file
 * @returns {Object} Settings configuration
 */
function loadSettings() {
    try {
        var file = new File(SETTINGS.folder + SETTINGS.name);
        if (file.exists) {
            file.encoding = 'UTF-8';
            file.open('r');
            var json = file.read();
            file.close();
            return AIS.JSON.parse(json);
        }
    } catch (err) {
        // Ignore errors, use defaults
    }
    return CFG.defaults;
}

/**
 * Save settings to JSON file
 * @param {Object} config - Configuration to save
 */
function saveSettings(config) {
    try {
        var folder = new Folder(SETTINGS.folder);
        if (!folder.exists) folder.create();

        var file = new File(SETTINGS.folder + SETTINGS.name);
        file.encoding = 'UTF-8';
        file.open('w');
        file.write(AIS.JSON.stringify(config));
        file.close();
    } catch (err) {
        // Ignore errors
    }
}

// ============================================================================
// ENTRY POINT
// ============================================================================

(function() {
    if (!AIS.Document.hasDocument()) {
        alert('No document\n\nOpen a document and try again.');
        return;
    }

    try {
        main();
    } catch (err) {
        AIS.Error.show('Photo Dimension Tool failed', err);
    }
})();
