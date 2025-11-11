/**
 * Reverse Gradient Color
 * @version 1.0.0
 * @description Reverse gradient colors and opacity without changing stop positions
 * @category Colors
 *
 * Features:
 * - Reverses order of colors in gradients
 * - Reverses opacity values
 * - Maintains stop locations
 * - Works with linear and radial gradients
 * - Processes paths, compound paths, and groups
 *
 * Original: ReverseGradientColor.jsx by Sergey Osokin
 * Modernized for AIS framework
 */




//@target illustrator
var c=File(Folder.myDocuments+"/Adobe Scripts/vexy-ville.ini");if(c.exists){c.open('r');var p=c.read();c.close();var l=File(p+".lib/core.jsx");if(l.exists)$.evalFile(l.fsName);}
app.preferences.setBooleanPreference('ShowExternalJSXWarning', false);

// ============================================================================
// MAIN FUNCTION
// ============================================================================

function main() {
    var selection = app.activeDocument.selection;
    var gradientPaths = collectGradientPaths(selection);

    if (gradientPaths.length === 0) {
        alert('No gradient fills\nSelect objects with gradient fills and try again');
        return;
    }

    try {
        for (var i = 0; i < gradientPaths.length; i++) {
            reverseGradientColors(gradientPaths[i]);
        }

        alert('Gradient colors reversed\n' + gradientPaths.length + ' gradient' + (gradientPaths.length === 1 ? '' : 's') + ' processed', 'Success');
    } catch (error) {
        AIS.Error.show('Reverse Gradient Error', error);
    }
}

// ============================================================================
// CORE LOGIC
// ============================================================================

/**
 * Collect all paths with gradient fills from selection
 * @param {Array} items - Selection items
 * @returns {Array} Array of PathItem objects with gradient fills
 */
function collectGradientPaths(items) {
    var paths = [];

    for (var i = 0; i < items.length; i++) {
        var item = items[i];

        try {
            if (item.typename === 'GroupItem') {
                // Recursively collect from groups
                var nested = collectGradientPaths(item.pageItems);
                paths = paths.concat(nested);
            } else if (item.typename === 'PathItem') {
                // Check if path has gradient fill
                if (item.filled && hasGradientFill(item)) {
                    paths.push(item);
                }
            } else if (item.typename === 'CompoundPathItem') {
                // Check compound path's first path item
                if (item.pathItems.length > 0) {
                    var firstPath = item.pathItems[0];
                    if (firstPath.filled && hasGradientFill(firstPath)) {
                        paths.push(firstPath);
                    }
                }
            }
        } catch (error) {
            // Skip items that cause errors
        }
    }

    return paths;
}

/**
 * Check if path has gradient fill
 * @param {PathItem} path - Path to check
 * @returns {boolean} True if has gradient fill
 */
function hasGradientFill(path) {
    try {
        return path.fillColor.typename === 'GradientColor';
    } catch (error) {
        return false;
    }
}

/**
 * Reverse gradient colors and opacity
 * @param {PathItem} path - Path with gradient fill
 */
function reverseGradientColors(path) {
    var gradient = path.fillColor.gradient;
    var stops = gradient.gradientStops;

    // Swap colors and opacity from outside to inside
    var left = 0;
    var right = stops.length - 1;

    while (left < right) {
        var leftStop = stops[left];
        var rightStop = stops[right];

        // Store left values
        var tempColor = leftStop.color;
        var tempOpacity = leftStop.opacity;

        // Move right values to left
        leftStop.color = rightStop.color;
        leftStop.opacity = rightStop.opacity;

        // Move stored left values to right
        rightStop.color = tempColor;
        rightStop.opacity = tempOpacity;

        left++;
        right--;
    }
}

// ============================================================================
// EXECUTE
// ============================================================================

if (!AIS.Document.hasDocument()) {
    alert('No document\nOpen a document and try again');
} else if (!AIS.Document.hasSelection()) {
    alert('No selection\nSelect objects with gradient fills and try again');
} else {
    try {
        main();
    } catch (e) {
        AIS.Error.show('Script error', e);
    }
}
