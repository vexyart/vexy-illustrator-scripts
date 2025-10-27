/**
 * Subtract Top Path
 * @version 1.0.0
 * @description Subtract the top path from all paths below it
 * @category Paths
 *
 * Features:
 * - Subtract top path from multiple paths below
 * - Works with filled and stroked paths
 * - Handles compound paths
 * - Color-aware processing
 * - Optional fullscreen mode for large selections
 * - Remove top path when finished (configurable)
 *
 * Original: SubtractTopPath.jsx by Sergey Osokin (hi@sergosokin.ru)
 * Modernized for AIS framework
 */

#include "../.lib/core.jsx"

//@target illustrator
app.preferences.setBooleanPreference('ShowExternalJSXWarning', false);

(function() {
    if (!AIS.Document.hasDocument()) {
        alert('No document\nOpen a document and try again');
        return;
    }

    if (!AIS.Document.hasSelection()) {
        alert('No selection\nSelect two or more paths and try again');
        return;
    }

    if (app.selection.typename === 'TextRange') {
        alert('Invalid selection\nSelect two or more paths and try again');
        return;
    }

    main();
})();

// ============================================================================
// CONFIGURATION
// ============================================================================

var CFG = {
    removeTop: true,
    useFullscreen: false
};

// ============================================================================
// MAIN FUNCTION
// ============================================================================

function main() {
    try {
        var doc = app.activeDocument;
        var initialScreenMode = doc.views[0].screenMode;
        var cutter = app.selection[0];

        cutter.selected = false;

        var paths = getPaths(app.selection);

        if (paths.length === 0) {
            alert('No valid paths\nSelect two or more paths and try again');
            return;
        }

        // Switch to fullscreen for large selections
        if (CFG.useFullscreen && paths.length > 10) {
            doc.views[0].screenMode = ScreenMode.FULLSCREEN;
        }

        for (var i = paths.length - 1; i >= 0; i--) {
            processSubtraction(cutter, paths[i]);
        }

        if (CFG.removeTop) {
            cutter.remove();
        }

        app.selection = null;
        app.redraw();
        doc.views[0].screenMode = initialScreenMode;
    } catch (error) {
        AIS.Error.show('Subtract Top Path Error', error);
    }
}

// ============================================================================
// CORE LOGIC
// ============================================================================

function getPaths(collection) {
    var out = [];

    for (var i = 0; i < collection.length; i++) {
        var item = collection[i];

        if (item.pageItems && item.pageItems.length) {
            out = out.concat(getPaths(item.pageItems));
        } else if (/compound/i.test(item.typename) && item.pathItems && !item.pathItems[0].clipping) {
            out.push(item);
        } else if (/pathitem/i.test(item.typename) && !item.clipping) {
            out.push(item);
        }
    }

    return out;
}

function processSubtraction(cutter, target) {
    var testPath = /compound/i.test(target.typename) ? target.pathItems[0] : target;

    // Skip filled open paths
    if (testPath.filled && testPath.stroked && !testPath.closed) {
        return;
    }

    app.selection = null;

    var cutterCopy = cutter.duplicate();
    cutterCopy.move(target, ElementPlacement.PLACEBEFORE);
    target.selected = true;
    cutterCopy.selected = true;
    app.redraw();

    if (testPath.stroked && !testPath.closed) {
        if (isOverlapping(cutterCopy, target)) {
            subtractFromLine();
        } else {
            cutterCopy.remove();
        }
    } else {
        subtractFromShape();
        removeContainedPaths(app.selection);
    }
}

function isOverlapping(pathA, pathB) {
    var dupA = pathA.duplicate();
    var dupB = pathB.duplicate();

    app.selection = null;
    dupA.selected = true;
    dupB.selected = true;

    app.executeMenuCommand('group');
    app.executeMenuCommand('Live Pathfinder Divide');
    app.executeMenuCommand('expandStyle');
    app.executeMenuCommand('ungroup');

    var resultCount = app.selection.length;

    for (var i = app.selection.length - 1; i >= 0; i--) {
        app.selection[i].remove();
    }

    pathA.selected = true;
    pathB.selected = true;

    return resultCount > 1;
}

function subtractFromLine() {
    app.executeMenuCommand('Make Planet X');
    app.executeMenuCommand('Expand Planet X');

    if (app.selection[0].pageItems.length === 1) {
        app.executeMenuCommand('ungroup');
    }

    app.selection[0].groupItems[app.selection[0].groupItems.length - 1].remove();
    app.executeMenuCommand('ungroup');
}

function subtractFromShape() {
    app.executeMenuCommand('group');
    app.executeMenuCommand('Live Pathfinder Subtract');
    app.executeMenuCommand('expandStyle');
    app.executeMenuCommand('ungroup');
}

function removeContainedPaths(collection) {
    if (collection.length === 1) return;

    var path0 = collection[0];
    var path1 = collection[1];
    var type0 = path0.typename;
    var type1 = path1.typename;

    if (/compound/i.test(type0)) path0 = path0.pathItems[0];
    if (/compound/i.test(type1)) path1 = path1.pathItems[0];

    try {
        if (/group/i.test(type0) || /group/i.test(type1) ||
            !isEqualColor(path0.fillColor, path1.fillColor)) {
            for (var i = collection.length - 1; i >= 0; i--) {
                collection[i].remove();
            }
        }
    } catch (e) {
        // Silently fail if color comparison fails
    }
}

// ============================================================================
// UTILITIES
// ============================================================================

function isEqualColor(colorA, colorB) {
    if (colorA.typename !== colorB.typename) return false;
    if (colorA == '[NoColor]' && colorB == '[NoColor]') return true;

    var valuesA = (colorA.typename == 'PatternColor') ? [colorA.pattern] : getColorValues(colorA);
    var valuesB = (colorB.typename == 'PatternColor') ? [colorB.pattern] : getColorValues(colorB);

    return isEqualArray(valuesA, valuesB);
}

function getColorValues(color) {
    var out = [];

    if (!color.typename) return out;

    switch (color.typename) {
        case 'CMYKColor':
            out.push(color.cyan, color.magenta, color.yellow, color.black);
            break;
        case 'RGBColor':
            out.push(color.red, color.green, color.blue);
            break;
        case 'GrayColor':
            out.push(color.gray, color.gray, color.gray);
            break;
        case 'LabColor':
            out.push(color.a, color.b, color.l);
            break;
        case 'SpotColor':
            out = out.concat(getColorValues(color.spot.color));
            break;
        case 'GradientColor':
            for (var i = 0; i < color.gradient.gradientStops.length; i++) {
                out = out.concat(getColorValues(color.gradient.gradientStops[i].color));
            }
            break;
    }

    return out;
}

function isEqualArray(arrayA, arrayB) {
    if (arrayA.length === 0 || arrayA.length !== arrayB.length) {
        return false;
    }

    for (var i = 0; i < arrayA.length; i++) {
        if (arrayA[i] !== arrayB[i]) return false;
    }

    return true;
}
