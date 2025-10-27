/**
 * Export Color Values to CSV
 * @version 1.0.0
 * @description Exports color values of path objects or swatches to CSV file
 * @category Colors
 * @features
 * - Export colors from selected paths or swatches
 * - Supports CMYK, RGB, and Grayscale colors
 * - Exports to CSV file on Desktop
 * - Includes swatch names for global colors
 * - Handles fill and stroke colors
 * - Automatic format detection based on document color mode
 * - Skip gradients and patterns (output warning)
 * @author Original: sky-chaser-high
 * @usage
 * 1. Select path objects OR select swatches in panel
 * 2. Run script
 * 3. CSV file created on Desktop
 * @notes
 * - If both paths and swatches selected, paths take priority
 * - If nothing selected, exports all swatches
 * - Global colors include swatch names in export
 * - Text objects and gradients are skipped
 * - File saved as ColorValues.csv on Desktop
 * - this_file: Colors/ExportColorValuesToCSV.jsx
 */

#include "../.lib/core.jsx"

//@target illustrator
app.preferences.setBooleanPreference('ShowExternalJSXWarning', false);

(function() {
    if (!AIS.Document.hasDocument()) {
        alert('No document\nOpen a document and try again');
        return;
    }

    try {
        main();
    } catch (e) {
        AIS.Error.show('Export Color Values error', e);
    }
})();

// ============================================================================
// CONFIGURATION
// ============================================================================

var CFG = {
    scriptName: 'Export Color Values to CSV',
    filename: 'ColorValues.csv',
    location: '~/Desktop/'
};

// ============================================================================
// MAIN FUNCTION
// ============================================================================

function main() {
    var doc = app.activeDocument;
    var items = getPathItems(doc.selection);

    var colors = [];
    if (items.length > 0) {
        // Export from selected paths
        colors = getColorsFromPaths(items);
    } else {
        // Export from swatches
        colors = getColorsFromSwatches(doc);
    }

    if (colors.length === 0) {
        alert('No colors found\nSelect objects with colors or swatches');
        return;
    }

    // Generate CSV content
    var csv = generateCSV(colors, doc.documentColorSpace);

    // Save to file
    var file = new File(CFG.location + CFG.filename);
    file.encoding = 'UTF-8';
    file.lineFeed = 'Unix';

    if (file.open('w')) {
        file.write(csv);
        file.close();

        alert('Export Complete\n\n' +
              'Colors exported: ' + colors.length + '\n' +
              'File: ' + CFG.filename + '\n' +
              'Location: Desktop');
    } else {
        alert('Export Failed\nCould not create CSV file on Desktop');
    }
}

// ============================================================================
// CORE LOGIC
// ============================================================================

/**
 * Get all path items from selection (including groups and compounds)
 */
function getPathItems(selection) {
    var paths = [];

    for (var i = 0; i < selection.length; i++) {
        var item = selection[i];

        if (item.typename === 'PathItem') {
            paths.push(item);

        } else if (item.typename === 'CompoundPathItem') {
            // Get last path item (backside)
            if (item.pathItems.length > 0) {
                paths.push(item.pathItems[item.pathItems.length - 1]);
            }

        } else if (item.typename === 'GroupItem') {
            // Recursively collect paths from groups
            var groupPaths = getPathItems(item.pageItems);
            paths = paths.concat(groupPaths);
        }
    }

    return paths;
}

/**
 * Extract colors from path objects
 */
function getColorsFromPaths(paths) {
    var colors = [];

    for (var i = 0; i < paths.length; i++) {
        var path = paths[i];

        // Get fill color
        if (path.filled) {
            var fillData = extractColorData(path.fillColor);
            if (fillData) {
                colors.push(fillData);
            }
        }

        // Get stroke color
        if (path.stroked) {
            var strokeData = extractColorData(path.strokeColor);
            if (strokeData) {
                colors.push(strokeData);
            }
        }
    }

    return colors;
}

/**
 * Extract colors from swatches
 */
function getColorsFromSwatches(doc) {
    var colors = [];
    var swatches = doc.swatches;
    var selected = swatches.getSelected();

    // Use selected swatches if any, otherwise all
    var targets = selected.length > 0 ? selected : swatches;

    for (var i = 0; i < targets.length; i++) {
        var swatch = targets[i];

        if (!swatch.color) {
            continue; // Skip None, Registration
        }

        var colorData = extractColorData(swatch.color);
        if (colorData) {
            colors.push(colorData);
        }
    }

    return colors;
}

/**
 * Extract color values from color object
 */
function extractColorData(color) {
    var typename = color.typename;

    if (typename === 'CMYKColor') {
        return {
            type: 'CMYK',
            values: [color.cyan, color.magenta, color.yellow, color.black],
            name: ''
        };

    } else if (typename === 'RGBColor') {
        return {
            type: 'RGB',
            values: [color.red, color.green, color.blue],
            grayscale: '',
            name: ''
        };

    } else if (typename === 'GrayColor') {
        return {
            type: 'Gray',
            values: ['', '', ''],
            grayscale: color.gray,
            name: ''
        };

    } else if (typename === 'SpotColor') {
        return extractSpotColorData(color.spot);

    } else if (typename === 'PatternColor') {
        return {
            type: 'Pattern',
            values: ['', '', '', ''],
            name: color.pattern.name
        };

    } else if (typename === 'GradientColor' || typename === 'NoColor') {
        // Skip gradients and no color
        return null;
    }

    return null;
}

/**
 * Extract spot color data
 */
function extractSpotColorData(spot) {
    // Skip registration color
    if (spot.colorType === ColorModel.REGISTRATION) {
        return null;
    }

    var baseData = extractColorData(spot.color);
    if (baseData) {
        baseData.name = spot.name;
    }

    return baseData;
}

/**
 * Generate CSV content from color data
 */
function generateCSV(colors, colorSpace) {
    var lines = [];

    // Header row
    if (colorSpace === DocumentColorSpace.RGB) {
        lines.push('Red,Green,Blue,Grayscale,Swatch name');
    } else {
        lines.push('Cyan,Magenta,Yellow,Black,Swatch name');
    }

    // Data rows
    for (var i = 0; i < colors.length; i++) {
        var color = colors[i];
        var row = [];

        if (color.type === 'CMYK') {
            row = color.values.slice(); // Copy array
            row.push(color.name);

        } else if (color.type === 'RGB') {
            row = color.values.slice();
            row.push(color.grayscale);
            row.push(color.name);

        } else if (color.type === 'Gray') {
            row = color.values.slice();
            row.push(color.grayscale);
            row.push(color.name);

        } else if (color.type === 'Pattern') {
            row = color.values.slice();
            row.push(color.name);
        }

        if (row.length > 0) {
            lines.push(row.join(','));
        }
    }

    return lines.join('\n');
}
