/**
 * Convert to Global Color
 * @version 1.0.0
 * @description Converts selected or all swatches to global process colors
 * @category Colors
 * @features
 * - Convert spot colors to global process colors
 * - Works with CMYK, RGB, and Grayscale colors
 * - Selective conversion (selected swatches only)
 * - Batch conversion (all swatches)
 * - Preserves color values and names
 * - Handles duplicate name conflicts
 * @author Original: sky-chaser-high
 * @usage
 * 1. Open document with swatches
 * 2. (Optional) Select swatches in Swatches panel
 * 3. Run script
 * 4. Selected (or all) swatches converted to global colors
 * @notes
 * - If no swatches selected, converts all swatches
 * - Skips swatches with duplicate names
 * - Global colors allow centralized color management
 * - Color order may change after conversion
 * - CS (Illustrator 11) or higher required
 * - this_file: Colors/ConvertToGlobalColor.jsx
 */




//@target illustrator
var c=File(Folder.myDocuments+"/Adobe Scripts/vexy-ville.ini");if(c.exists){c.open('r');var p=c.read();c.close();var l=File(p+".lib/core.jsx");if(l.exists)$.evalFile(l.fsName);}
app.preferences.setBooleanPreference('ShowExternalJSXWarning', false);

// ============================================================================
// CONFIGURATION
// ============================================================================

var CFG = {
    scriptName: 'Convert to Global Color'
};

// ============================================================================
// MAIN FUNCTION
// ============================================================================

function main() {
    var doc = app.activeDocument;
    var swatches = getTargetSwatches(doc);

    if (swatches.length === 0) {
        alert('No swatches to convert\nDocument has no convertible swatches');
        return;
    }

    // Convert swatches to global colors
    var converted = 0;
    var skipped = 0;

    // Process in reverse to handle removal safely
    for (var i = swatches.length - 1; i >= 0; i--) {
        var swatch = swatches[i];
        var result = convertSwatchToGlobal(doc, swatch);

        if (result) {
            converted++;
        } else {
            skipped++;
        }
    }

    // Show results
    var message = 'Conversion Complete\n\n';
    message += 'Converted: ' + converted + '\n';

    if (skipped > 0) {
        message += 'Skipped: ' + skipped + '\n\n';
        message += 'Skipped swatches may have\n';
        message += 'duplicate names or errors';
    }

    alert(message);
}

// ============================================================================
// CORE LOGIC
// ============================================================================

/**
 * Get swatches to convert (selected or all)
 */
function getTargetSwatches(doc) {
    var swatches = doc.swatches;
    var selected = swatches.getSelected();

    // Use selected swatches if any, otherwise all swatches
    var targets = selected.length > 0 ? selected : swatches;
    var result = [];

    // Collect convertible swatches
    for (var i = 0; i < targets.length; i++) {
        var swatch = targets[i];

        // Skip non-color swatches (None, Registration)
        if (!swatch.color) {
            continue;
        }

        var typename = swatch.color.typename;

        // Check if convertible (process colors or spot colors)
        if (typename === 'CMYKColor' ||
            typename === 'RGBColor' ||
            typename === 'GrayColor' ||
            typename === 'SpotColor') {
            result.push(swatch);
        }
    }

    return result;
}

/**
 * Convert a swatch to global process color
 */
function convertSwatchToGlobal(doc, swatch) {
    var color = swatch.color;
    var typename = color.typename;

    if (typename === 'CMYKColor' || typename === 'RGBColor' || typename === 'GrayColor') {
        // Convert local color to global process
        return createGlobalSwatch(doc, swatch);

    } else if (typename === 'SpotColor') {
        // Convert spot to global process
        return convertSpotTypeToGlobal(color.spot);
    }

    return false;
}

/**
 * Create new global process swatch from local color
 */
function createGlobalSwatch(doc, swatch) {
    try {
        var spot = doc.spots.add();
        spot.name = swatch.name;
        spot.color = convertColorObject(swatch.color, doc);
        spot.colorType = ColorModel.PROCESS;

        // Remove original local swatch
        swatch.remove();
        return true;

    } catch (e) {
        // Failed to create (likely duplicate name)
        try {
            if (spot) {
                spot.remove();
            }
        } catch (removeErr) {
            // Ignore
        }
        return false;
    }
}

/**
 * Convert existing spot swatch from SPOT to PROCESS
 */
function convertSpotTypeToGlobal(spotColor) {
    try {
        if (spotColor.colorType === ColorModel.SPOT) {
            spotColor.colorType = ColorModel.PROCESS;
            return true;
        }
    } catch (e) {
        // Already process or conversion failed
    }
    return false;
}

/**
 * Convert color object to appropriate type
 */
function convertColorObject(color, doc) {
    var typename = color.typename;

    if (typename === 'CMYKColor') {
        return createCMYKColor(
            color.cyan,
            color.magenta,
            color.yellow,
            color.black
        );

    } else if (typename === 'RGBColor') {
        return createRGBColor(
            color.red,
            color.green,
            color.blue
        );

    } else if (typename === 'GrayColor') {
        // Convert grayscale based on document color space
        var mode = doc.documentColorSpace;

        if (mode === DocumentColorSpace.CMYK) {
            return createCMYKColor(0, 0, 0, color.gray);
        } else {
            // Convert gray (0-100) to RGB (0-255)
            var grayRGB = mapValue(color.gray, 0, 100, 0, 255);
            return createRGBColor(grayRGB, grayRGB, grayRGB);
        }
    }

    return color;
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Create CMYK color
 */
function createCMYKColor(c, m, y, k) {
    var color = new CMYKColor();
    color.cyan = c;
    color.magenta = m;
    color.yellow = y;
    color.black = k;
    return color;
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

/**
 * Map value from one range to another
 */
function mapValue(value, inMin, inMax, outMin, outMax) {
    var inRange = inMax - inMin;
    var normalized = (value - inMin) / inRange;
    var outRange = outMax - outMin;
    return outMin + (normalized * outRange);
}

// ============================================================================
// EXECUTE
// ============================================================================

if (!AIS.Document.hasDocument()) {
    alert('No document\nOpen a document and try again');
} else {
    try {
        main();
    } catch (e) {
        AIS.Error.show('Convert to Global Color error', e);
    }
}
