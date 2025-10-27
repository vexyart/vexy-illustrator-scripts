/**
 * Change Layer Colors
 * @version 1.0.0
 * @description Change the color of layers containing selected objects
 * @author Christian Condamine (modernized for AIS)
 * @license MIT
 * @category Layers
 * @requires Illustrator CS4 or higher
 *
 * Features:
 * - Select objects and change their layer colors
 * - Uses system color picker for selection
 * - Applies to all layers of selected objects
 *
 * Original: Christian Condamine (christian.condamine@laposte.net)
 * Modernized to use AIS library while preserving all functionality
 */

#include "../.lib/core.jsx"

//@target illustrator
#targetengine main
app.preferences.setBooleanPreference('ShowExternalJSXWarning', false);

(function() {
    if (!app.documents.length) {
        alert('No documents\nOpen a document and try again');
        return;
    }

    if (!app.activeDocument.selection.length) {
        alert('No selection\nSelect at least one object and try again');
        return;
    }

    main();
})();

// ============================================================================
// MAIN FUNCTION
// ============================================================================

function main() {
    var selection = app.activeDocument.selection;
    var defaultColor = 0xF96163; // Default pink color

    // Show color picker
    var selectedColor = $.colorPicker(defaultColor);

    // User cancelled color picker
    if (selectedColor === -1) {
        return;
    }

    // Convert hex color to RGB
    var rgbColor = hexToRGB(selectedColor);

    // Apply color to layers of selected objects
    applyColorToLayers(selection, rgbColor);
}

// ============================================================================
// COLOR UTILITIES
// ============================================================================

/**
 * Convert hexadecimal color to RGBColor
 * @param {Number} hex - Hexadecimal color value
 * @returns {RGBColor} RGB color object
 */
function hexToRGB(hex) {
    var r = hex >> 16;
    var g = (hex & 0x00ff00) >> 8;
    var b = hex & 0xff;

    var color = new RGBColor();
    color.red = r;
    color.green = g;
    color.blue = b;

    return color;
}

/**
 * Apply color to layers of selected objects
 * @param {Array} selection - Selected objects
 * @param {RGBColor} color - RGB color to apply
 */
function applyColorToLayers(selection, color) {
    var processedLayers = {};

    for (var i = 0; i < selection.length; i++) {
        var item = selection[i];
        var layerName = item.layer.name;

        // Avoid processing the same layer multiple times
        if (!processedLayers[layerName]) {
            item.layer.color = color;
            processedLayers[layerName] = true;
        }
    }
}

// ============================================================================
// ENTRY POINT (handled by IIFE at top)
// ============================================================================
