/**
 * Add Artboard Rects
 * @version 1.0.0
 * @description Adds transparent rectangles positioned and sized to match each artboard
 * @author Vexy
 * @license MIT
 * @category Artboards
 * @requires Illustrator CS4 or higher
 *
 * Features:
 * - Creates a rectangle for each artboard
 * - Rectangles placed at bottom of z-order (behind all other objects)
 * - Transparent (no fill) with optional visible stroke
 * - All rectangles placed on a dedicated layer at bottom of layer stack
 *
 * Use case: Useful for creating selection boundaries, export masks, or visual guides
 */

//@target illustrator
app.preferences.setBooleanPreference('ShowExternalJSXWarning', false);

// ============================================================================
// CONFIGURATION
// ============================================================================

var CFG = {
    layerName: 'Artboard Rectangles',
    strokeWidth: 1,
    strokeColor: { red: 0, green: 128, blue: 255 }, // Light blue
    useStroke: true,  // Set to false for completely invisible rectangles
    useFill: false
};

// ============================================================================
// INITIALIZATION
// ============================================================================

(function() {
    if (!app.documents.length) {
        return;
    }

    main();
})();

// ============================================================================
// MAIN FUNCTION
// ============================================================================

function main() {
    var doc = app.activeDocument;
    var artboards = doc.artboards;

    if (artboards.length === 0) {
        return;
    }

    try {
        // Get or create dedicated layer
        var layer = getOrCreateLayer(doc, CFG.layerName);

        // Create rectangle for each artboard
        for (var i = 0; i < artboards.length; i++) {
            createArtboardRect(doc, layer, artboards[i], i);
        }

        // Move layer to bottom of layer stack
        moveLayerToBottom(doc, layer);

    } catch (e) {
        // Silently fail
    }
}

// ============================================================================
// CORE LOGIC
// ============================================================================

/**
 * Create a rectangle matching the artboard bounds
 * @param {Document} doc - The active document
 * @param {Layer} layer - The layer to add the rectangle to
 * @param {Artboard} artboard - The artboard to match
 * @param {Number} index - The artboard index
 * @returns {PathItem} The created rectangle
 */
function createArtboardRect(doc, layer, artboard, index) {
    var bounds = artboard.artboardRect;
    // Artboard bounds format: [left, top, right, bottom]
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
    rect.name = 'Artboard ' + (index + 1) + ' Rect';

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
