/**
 * Import CSV to Swatch
 * @version 1.0.0
 * @description Imports colors from CSV file to Swatches panel
 * @category Colors
 * @features
 * - Import CMYK, RGB, and HEX color formats
 * - Flexible CSV parsing (comma or tab separated)
 * - Auto-detection of color format
 * - Optional swatch naming
 * - 3-digit HEX support (CSS-style)
 * - Validation and error handling
 * - Automatic color mode matching
 * @author Original: sky-chaser-high
 * @usage
 * 1. Open a document
 * 2. Run script
 * 3. Select CSV file with colors
 * 4. Colors imported to Swatches panel
 * @notes
 * CSV Format examples:
 * CMYK: Cyan,Magenta,Yellow,Black,Name
 * RGB: Red,Green,Blue,Name
 * HEX: Hex,Name
 * - Line 1 is header (skipped)
 * - Name column is optional
 * - HEX: # prefix optional, 3-digit expands (F0F → FF00FF)
 * - Document color mode should match CSV format
 * - this_file: Colors/ImportCSVtoSwatch.jsx
 */




//@target illustrator
var c=File(Folder.myDocuments+"/Adobe Scripts/vexy-ville.ini");if(c.exists){c.open('r');var p=c.read();c.close();var l=File(p+".lib/core.jsx");if(l.exists)$.evalFile(l.fsName);}
app.preferences.setBooleanPreference('ShowExternalJSXWarning', false);

// ============================================================================
// CONFIGURATION
// ============================================================================

var CFG = {
    scriptName: 'Import CSV to Swatch',
    defaultName: 'Imported Color' // Default name if not provided
};

// ============================================================================
// MAIN FUNCTION
// ============================================================================

function main() {
    var file = File.openDialog('Select a CSV file to import');

    if (!file) {
        return; // User cancelled
    }

    if (!file.exists) {
        alert('File not found\nThe selected file does not exist');
        return;
    }

    // Read CSV file
    var colors = [];
    file.encoding = 'UTF-8';

    if (file.open('r')) {
        colors = parseCSVFile(file);
        file.close();
    } else {
        alert('Cannot open file\nFailed to read the CSV file');
        return;
    }

    if (colors.length === 0) {
        alert('No colors found\nThe CSV file contains no valid color data');
        return;
    }

    // Import colors to swatches
    var doc = app.activeDocument;
    var imported = 0;
    var failed = 0;

    for (var i = 0; i < colors.length; i++) {
        var color = colors[i];

        if (createSwatch(doc, color)) {
            imported++;
        } else {
            failed++;
        }
    }

    // Show results
    var message = 'Import Complete\n\n';
    message += 'Colors imported: ' + imported + '\n';

    if (failed > 0) {
        message += 'Failed: ' + failed + '\n\n';
        message += 'Failed colors may have invalid values\n';
        message += 'or mismatched color mode (CMYK vs RGB)';
    }

    alert(message);
}

// ============================================================================
// CORE LOGIC
// ============================================================================

/**
 * Parse CSV file and extract colors
 */
function parseCSVFile(file) {
    var colors = [];
    var lineNum = 0;

    // Skip header line
    if (!file.eof) {
        file.readln();
        lineNum++;
    }

    // Read color data
    while (!file.eof) {
        var line = file.readln();
        lineNum++;

        if (!line || line.length === 0) {
            continue; // Skip empty lines
        }

        // Remove quotes and split by comma or tab
        var values = line.replace(/["']/g, '').split(/,|\t/);

        // Trim whitespace from values
        for (var i = 0; i < values.length; i++) {
            values[i] = AIS.String.trim(values[i]);
        }

        var color = parseColorFromValues(values);
        if (color) {
            colors.push(color);
        }
    }

    return colors;
}

/**
 * Parse color from CSV values based on format
 */
function parseColorFromValues(values) {
    if (!values || values.length === 0) {
        return null;
    }

    var doc = app.activeDocument;
    var mode = doc.documentColorSpace;

    // Determine format based on document color space and value count
    if (mode === DocumentColorSpace.CMYK && values.length >= 4) {
        // CMYK format: C, M, Y, K, [Name]
        return parseCMYKColor(values);

    } else if (mode === DocumentColorSpace.RGB) {
        if (values.length >= 3 && isNumeric(values[0])) {
            // RGB format: R, G, B, [Name]
            return parseRGBColor(values);
        } else {
            // HEX format: Hex, [Name]
            return parseHEXColor(values);
        }
    }

    return null;
}

/**
 * Parse CMYK color from values
 */
function parseCMYKColor(values) {
    var c = clampValue(parseFloat(values[0]), 0, 100);
    var m = clampValue(parseFloat(values[1]), 0, 100);
    var y = clampValue(parseFloat(values[2]), 0, 100);
    var k = clampValue(parseFloat(values[3]), 0, 100);
    var name = values[4] || '';

    return {
        type: 'CMYK',
        cyan: c,
        magenta: m,
        yellow: y,
        black: k,
        name: name || ('C=' + c + ' M=' + m + ' Y=' + y + ' K=' + k)
    };
}

/**
 * Parse RGB color from values
 */
function parseRGBColor(values) {
    var r = clampValue(parseFloat(values[0]), 0, 255);
    var g = clampValue(parseFloat(values[1]), 0, 255);
    var b = clampValue(parseFloat(values[2]), 0, 255);
    var name = values[3] || '';

    return {
        type: 'RGB',
        red: r,
        green: g,
        blue: b,
        name: name || ('R=' + r + ' G=' + g + ' B=' + b)
    };
}

/**
 * Parse HEX color from values
 */
function parseHEXColor(values) {
    var hexValue = values[0] || '';
    var name = values[1] || '';

    // Remove # prefix and non-hex characters
    var hex = hexValue.replace(/^#/, '').replace(/[^a-fA-F0-9]/g, '0');

    if (hex.length === 0) {
        return null;
    }

    var rgb;

    if (hex.length === 3) {
        // 3-digit HEX: expand like CSS (e.g., F0F → FF00FF)
        var r = hex.charAt(0);
        var g = hex.charAt(1);
        var b = hex.charAt(2);
        rgb = {
            r: r + r,
            g: g + g,
            b: b + b
        };
    } else {
        // 6-digit HEX: pad if needed
        hex = ('000000' + hex).slice(-6);
        rgb = {
            r: hex.substring(0, 2),
            g: hex.substring(2, 4),
            b: hex.substring(4, 6)
        };
    }

    return {
        type: 'RGB',
        red: parseInt(rgb.r, 16),
        green: parseInt(rgb.g, 16),
        blue: parseInt(rgb.b, 16),
        name: name || ('#' + hexValue.replace(/^#/, '').toUpperCase())
    };
}

/**
 * Create swatch from color data
 */
function createSwatch(doc, colorData) {
    try {
        var swatch = doc.swatches.add();
        var color;

        if (colorData.type === 'CMYK') {
            color = new CMYKColor();
            color.cyan = colorData.cyan;
            color.magenta = colorData.magenta;
            color.yellow = colorData.yellow;
            color.black = colorData.black;
        } else {
            color = new RGBColor();
            color.red = colorData.red;
            color.green = colorData.green;
            color.blue = colorData.blue;
        }

        swatch.color = color;
        swatch.name = colorData.name;

        return true;
    } catch (e) {
        // Remove failed swatch
        try {
            if (swatch) {
                swatch.remove();
            }
        } catch (removeErr) {
            // Ignore remove error
        }
        return false;
    }
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Clamp value between min and max
 */
function clampValue(value, min, max) {
    if (isNaN(value) || value < min) {
        return min;
    }
    if (value > max) {
        return max;
    }
    return value;
}

/**
 * Check if string is numeric
 */
function isNumeric(str) {
    return !isNaN(parseFloat(str)) && isFinite(str);
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
        AIS.Error.show('Import CSV to Swatch error', e);
    }
}
