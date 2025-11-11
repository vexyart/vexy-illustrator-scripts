/**
 * Add Objects Rects
 * @version 1.0.0
 * @description Adds transparent rectangles positioned and sized to match each selected object's bounding box
 * @author Vexy
 * @license MIT
 * @category Selection
 * @requires Illustrator CS4 or higher
 *
 * Features:
 * - Creates a rectangle for each selected object's bounding box
 * - Rectangles placed at bottom of z-order (behind all other objects)
 * - Transparent (no fill) with optional visible stroke
 * - All rectangles placed on a dedicated "Objects" layer at bottom of layer stack
 *
 * Use case: Useful for creating selection boundaries, export masks, or visual guides for objects
 */


//@target illustrator
var c=File(Folder.myDocuments+"/Adobe Scripts/vexy-ville.ini");if(c.exists){c.open('r');var p=c.read();c.close();var l=File(p+".lib/core.jsx");if(l.exists)$.evalFile(l.fsName);}
app.preferences.setBooleanPreference('ShowExternalJSXWarning', false);

// ============================================================================
// CONFIGURATION
// ============================================================================

var CFG = {
    layerName: 'Objects',
    strokeWidth: 1,
    strokeColor: { red: 255, green: 128, blue: 0 }, // Orange
    useStroke: true,  // Set to false for completely invisible rectangles
    useFill: false
};

// ============================================================================
// INITIALIZATION
// ============================================================================



// ============================================================================
// MAIN FUNCTION
// ============================================================================

function main() {
    var doc = app.activeDocument;
    var selection = doc.selection;

    try {
        // Get or create dedicated layer
        var layer = getOrCreateLayer(doc, CFG.layerName);

        // Create rectangle for each selected object
        for (var i = 0; i < selection.length; i++) {
            var item = selection[i];
            createObjectRect(doc, layer, item, i);
        }

        // Move layer to bottom of layer stack
        moveLayerToBottom(doc, layer);

    } catch (e) {
        alert('Error\nFailed to create object rectangles: ' + e.message);
    }
}

// ============================================================================
// CORE LOGIC
// ============================================================================

/**
 * Create a rectangle matching the object's bounding box
 * @param {Document} doc - The active document
 * @param {Layer} layer - The layer to add the rectangle to
 * @param {PageItem} item - The object to match
 * @param {Number} index - The object index
 * @returns {PathItem} The created rectangle
 */
function createObjectRect(doc, layer, item, index) {
    // Get visible bounds (bounding box including stroke)
    var bounds = item.visibleBounds;
    // Bounds format: [left, top, right, bottom]
    var left = bounds[0];
    var top = bounds[1];
    var right = bounds[2];
    var bottom = bounds[3];

    var width = right - left;
    var height = top - bottom;

    // Create rectangle
    // rectangle(top, left, width, height)
    var rect = layer.pathItems.rectangle(top, left, width, height);

    // Name the rectangle for easy identification
    var itemName = item.name || 'Unnamed Object';
    rect.name = itemName + ' Rect';

    // Set appearance
    rect.filled = CFG.useFill;
    rect.stroked = CFG.useStroke;

    if (rect.stroked) {
        rect.strokeWidth = CFG.strokeWidth;
        rect.strokeColor = createRGBColor(
            CFG.strokeColor.red,
            CFG.strokeColor.green,
            CFG.strokeColor.blue
        );
    }

    // Move to bottom of layer z-order
    rect.zOrder(ZOrderMethod.SENDTOBACK);

    return rect;
}

/**
 * Move layer to bottom of layers stack
 * @param {Document} doc - The active document
 * @param {Layer} layer - The layer to move
 */
function moveLayerToBottom(doc, layer) {
    // Move layer to bottom by repeatedly moving it backward
    // until it's at the bottom of the stack
    var targetIndex = doc.layers.length - 1;
    var currentIndex = getLayerIndex(doc, layer);

    while (currentIndex < targetIndex) {
        layer.zOrder(ZOrderMethod.SENDBACKWARD);
        currentIndex++;
    }
}

/**
 * Get the index of a layer in the document
 * @param {Document} doc - The active document
 * @param {Layer} targetLayer - The layer to find
 * @returns {Number} The layer index (0-based)
 */
function getLayerIndex(doc, targetLayer) {
    for (var i = 0; i < doc.layers.length; i++) {
        if (doc.layers[i] === targetLayer) {
            return i;
        }
    }
    return -1;
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Get existing layer or create new one
 * @param {Document} doc - The active document
 * @param {String} layerName - The name of the layer
 * @returns {Layer} The found or created layer
 */
function getOrCreateLayer(doc, layerName) {
    // Try to find existing layer
    for (var i = 0; i < doc.layers.length; i++) {
        if (doc.layers[i].name === layerName) {
            var layer = doc.layers[i];
            layer.locked = false;
            layer.visible = true;
            return layer;
        }
    }

    // Create new layer
    var layer = doc.layers.add();
    layer.name = layerName;
    return layer;
}

/**
 * Create RGB color
 * @param {Number} r - Red value (0-255)
 * @param {Number} g - Green value (0-255)
 * @param {Number} b - Blue value (0-255)
 * @returns {RGBColor} The created color
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

try {
    main();
} catch (e) {
    AIS.Error.show('Script error', e);
}
