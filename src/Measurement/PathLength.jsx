/**
 * Path Length
 * @version 1.0.0
 * @description Calculates and displays length of selected paths
 * @category Measurement
 * @author SATO Hiroyuki (http://park12.wakwak.com/~shp/lc/et/en_aics_script.html)
 * @license Free to use and distribute
 * @modernized 2025 - Adapted for AIS framework
 * @features
 *   - Measures individual path lengths
 *   - Calculates total length of all selected paths
 *   - Displays results as text labels
 *   - Choice of units (mm or points)
 *   - Uses native PathItem.length property when available
 *   - Simpson's method for accurate curve measurement
 *   - Works with paths in groups/compounds
 * @usage
 *   1. Select paths to measure
 *   2. Run script
 *   3. Length labels appear above each path
 *   4. Total shown if multiple paths
 * @notes
 *   - Labels placed at path center
 *   - Results in millimeters by default
 *   - Font: MyriadPro-Regular (or system default)
 *   - Ignores guides and clipping paths
 */




//@target illustrator
var c=File(Folder.myDocuments+"/Adobe Scripts/vexy-ville.ini");if(c.exists){c.open('r');var p=c.read();c.close();var l=File(p+".lib/core.jsx");if(l.exists)$.evalFile(l.fsName);}
app.preferences.setBooleanPreference('ShowExternalJSXWarning', false);

// ============================================================================
// CONFIGURATION
// ============================================================================
var CFG = {
    scriptName: 'Path Length',
    version: '1.0.0',
    fontSize: 12,
    fontName: 'MyriadPro-Regular',
    digits: 2,  // Decimal places
    useMM: true,  // true = millimeters, false = points
    divisionNumber: 1024,  // Precision for Simpson's method
    putTextOnFirstLayer: false  // Layer placement
};

// ============================================================================
// MAIN FUNCTION
// ============================================================================
function main() {
    try {
        var doc = app.activeDocument;
        var sel = doc.selection;

        // Extract paths from selection
        var selectedPaths = [];
        extractPaths(sel, 1, selectedPaths);

        if (selectedPaths.length === 0) {
            alert('No paths found\nSelect at least one path');
            return;
        }

        // Prepare layer for text output
        var layer = prepareLayer(doc);

        // Measure and label paths
        var results = [];
        var allPathsLength = 0;
        var unit = CFG.useMM ? 'mm' : 'pt';

        for (var i = 0; i < selectedPaths.length; i++) {
            var pathLength = measurePath(selectedPaths[i]);
            allPathsLength += pathLength;

            // Convert to mm if needed
            var displayLength = CFG.useMM ? pointsToMM(pathLength) : pathLength;
            displayLength = fixedTo(displayLength, CFG.digits);

            // Find center position for label
            var position = findCenter(selectedPaths[i]);

            // Write label
            writeResultAsText(
                layer,
                displayLength + ' ' + unit,
                CFG.fontName,
                CFG.fontSize,
                position,
                results
            );
        }

        // Write total if multiple paths
        if (selectedPaths.length > 1) {
            var totalLength = CFG.useMM ? pointsToMM(allPathsLength) : allPathsLength;
            totalLength = fixedTo(totalLength, CFG.digits);

            var position = findCenter(selectedPaths[0]);
            position[1] -= CFG.fontSize;

            writeResultAsText(
                layer,
                'Total: ' + totalLength + ' ' + unit,
                CFG.fontName,
                CFG.fontSize,
                position,
                results
            );
        }

        // Select results and original paths
        doc.selection = results.concat(selectedPaths);

        alert(
            'Measurement complete\n' +
            'Measured ' + selectedPaths.length + ' path' +
            (selectedPaths.length === 1 ? '' : 's')
        );

    } catch (e) {
        AIS.Error.show('Measurement failed', e);
    }
}

// ============================================================================
// CORE LOGIC
// ============================================================================

/**
 * Measure path length
 * @param {PathItem} path - Path to measure
 * @returns {Number} - Length in points
 */
function measurePath(path) {
    var aiVersion = parseInt(app.version);

    // Use native property if CS3+ (version 13+)
    if (aiVersion >= 13 && path.length !== undefined) {
        return path.length;
    }

    // Manual calculation using Simpson's method
    var pathLength = 0;
    var pathPoints = path.pathPoints;

    for (var j = 0; j < pathPoints.length; j++) {
        var k;
        if (j === pathPoints.length - 1) {
            if (path.closed) {
                k = 0;
            } else {
                break;
            }
        } else {
            k = j + 1;
        }

        var segmentLength = getLength(
            [
                pathPoints[j].anchor,
                pathPoints[j].rightDirection,
                pathPoints[k].leftDirection,
                pathPoints[k].anchor
            ],
            CFG.divisionNumber
        );

        pathLength += segmentLength;
    }

    return pathLength;
}

/**
 * Calculate segment length using Simpson's method
 * @param {Array} q - [anchor1, rightHandle, leftHandle, anchor2]
 * @param {Number} divNum - Division number for precision
 * @returns {Number} - Segment length
 */
function getLength(q, divNum) {
    var divUnit = 1 / divNum;

    // Bezier coefficients
    var m = [
        q[3][0] - q[0][0] + 3 * (q[1][0] - q[2][0]),
        q[0][0] - 2 * q[1][0] + q[2][0],
        q[1][0] - q[0][0]
    ];

    var n = [
        q[3][1] - q[0][1] + 3 * (q[1][1] - q[2][1]),
        q[0][1] - 2 * q[1][1] + q[2][1],
        q[1][1] - q[0][1]
    ];

    // Derivative coefficients
    var k = [
        m[0] * m[0] + n[0] * n[0],
        4 * (m[0] * m[1] + n[0] * n[1]),
        2 * ((m[0] * m[2] + n[0] * n[2]) + 2 * (m[1] * m[1] + n[1] * n[1])),
        4 * (m[1] * m[2] + n[1] * n[2]),
        m[2] * m[2] + n[2] * n[2]
    ];

    /**
     * Function to calculate at t
     * @param {Number} t - Parameter
     * @param {Array} k - Coefficients
     * @returns {Number} - Value at t
     */
    function fc(t, k) {
        return Math.sqrt(t * (t * (t * (t * k[0] + k[1]) + k[2]) + k[3]) + k[4]) || 0;
    }

    // Simpson's integration
    var total = 0;
    var i;

    // Odd indices
    for (i = 1; i < divNum; i += 2) {
        total += fc(i * divUnit, k);
    }
    total *= 2;

    // Even indices
    for (i = 2; i < divNum; i += 2) {
        total += fc(i * divUnit, k);
    }

    return (fc(0, k) + fc(1, k) + total * 2) * divUnit;
}

/**
 * Extract paths from selection
 * @param {Array} items - Selection items
 * @param {Number} minPoints - Minimum points required
 * @param {Array} paths - Output array
 */
function extractPaths(items, minPoints, paths) {
    for (var i = 0; i < items.length; i++) {
        var item = items[i];

        if (item.typename === 'PathItem') {
            // Skip guides and clipping paths
            if (item.guides || item.clipping) {
                continue;
            }

            // Check minimum points
            if (minPoints && item.pathPoints.length <= minPoints) {
                continue;
            }

            paths.push(item);
        } else if (item.typename === 'GroupItem') {
            extractPaths(item.pageItems, minPoints, paths);
        } else if (item.typename === 'CompoundPathItem') {
            extractPaths(item.pathItems, minPoints, paths);
        }
    }
}

/**
 * Prepare layer for text output
 * @param {Document} doc - Active document
 * @returns {Layer} - Layer for text
 */
function prepareLayer(doc) {
    if (CFG.putTextOnFirstLayer) {
        var layer = doc.layers[0];
        if (layer.locked) layer.locked = false;
        if (!layer.visible) layer.visible = true;
        return layer;
    } else {
        var activeLayer = doc.activeLayer;
        if (activeLayer.locked || !activeLayer.visible) {
            // Use layer of first selected path
            return doc.selection[0].layer;
        }
        return activeLayer;
    }
}

/**
 * Write measurement result as text
 * @param {Layer} layer - Target layer
 * @param {String} text - Text content
 * @param {String} fontName - Font name
 * @param {Number} fontSize - Font size
 * @param {Array} position - [x, y] position
 * @param {Array} results - Output array
 */
function writeResultAsText(layer, text, fontName, fontSize, position, results) {
    try {
        var textFrame = layer.textFrames.add();
        textFrame.contents = text;

        // Set character attributes
        var attributes = textFrame.textRange.characterAttributes;
        attributes.size = fontSize;

        // Try to set font
        try {
            attributes.textFont = app.textFonts.getByName(fontName);
        } catch (e) {
            // Use default font if specified font not found
        }

        // Set paragraph attributes
        var paragraph = textFrame.textRange.paragraphAttributes;
        paragraph.justification = Justification.LEFT;
        paragraph.autoLeadingAmount = 120;

        // Center text at position
        textFrame.position = [
            position[0] - textFrame.width / 2,
            position[1] + textFrame.height / 2
        ];

        results.push(textFrame);
    } catch (e) {
        // Silent fail for text creation
    }
}

/**
 * Find center of path
 * @param {PageItem} item - Path item
 * @returns {Array} - [x, y] center position
 */
function findCenter(item) {
    var bounds = item.geometricBounds;
    return [
        (bounds[0] + bounds[2]) / 2,
        (bounds[1] + bounds[3]) / 2
    ];
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Convert points to millimeters
 * @param {Number} points - Value in points
 * @returns {Number} - Value in millimeters
 */
function pointsToMM(points) {
    return points * 0.35277778;
}

/**
 * Format number to fixed decimal places
 * @param {Number} num - Number to format
 * @param {Number} decimals - Decimal places
 * @returns {String} - Formatted number
 */
function fixedTo(num, decimals) {
    var multiplier = Math.pow(10, decimals);
    var rounded = (Math.round(num * multiplier)) + '';

    if (decimals <= 0) {
        return rounded;
    }

    // Pad with zeros if needed
    while (rounded.length < decimals + 1) {
        rounded = '0' + rounded;
    }

    // Insert decimal point
    var integerPart = rounded.substr(0, rounded.length - decimals);
    var decimalPart = rounded.substr(rounded.length - decimals, decimals);
    var result = integerPart + '.' + decimalPart;

    // Remove trailing zeros and decimal point
    result = result.replace(/0+$/, '');
    result = result.replace(/\.$/, '');

    return result;
}

// ============================================================================
// EXECUTE
// ============================================================================

if (!AIS.Document.hasDocument()) {
    alert('No documents\nOpen a document and try again');
} else if (!AIS.Document.hasSelection()) {
    alert('No selection\nSelect paths and try again');
} else {
    try {
        main();
    } catch (e) {
        AIS.Error.show('Path Length error', e);
    }
}
