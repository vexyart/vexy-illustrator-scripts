/**
 * Round Coordinates
 * @version 1.0.0
 * @description Round object coordinates to grid or custom step based on reference point
 * @category Transform
 *
 * Features:
 * - Round coordinates to grid subdivisions or custom step
 * - Align to 9 reference points (Transform panel points)
 * - Global or artboard ruler coordinate systems
 * - Respects "Include Stroke in Bounds" preference
 * - Clipping group support
 * - Large canvas mode compensation
 * - Supports all document units (px, pt, mm, cm, in, ft, yd, m)
 * - XMP metadata parsing for special units
 *
 * Original: RoundCoordinates.jsx by Sergey Osokin (hi@sergosokin.ru)
 * Homepage: github.com/creold/illustrator-scripts
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
        alert('No selection\nSelect one or more objects and try again');
        return;
    }

    main();
})();

// ============================================================================
// CONFIGURATION
// ============================================================================

var CFG = {
    scriptName: 'Round Coordinates',
    version: '1.0.0',
    step: 1
};

// ============================================================================
// MAIN FUNCTION
// ============================================================================

function main() {
    try {
        var doc = app.activeDocument;
        var pref = app.preferences;

        var config = {
            step: CFG.step,
            units: AIS.Units.get(),
            refPoint: pref.getIntegerPreference('plugin/Transform/AnchorPoint'),
            includeStroke: pref.getBooleanPreference('includeStrokeInBounds'),
            scaleFactor: doc.scaleFactor ? doc.scaleFactor : 1,
            grid: {
                spacing: pref.getRealPreference('Grid/Horizontal/Spacing'),
                subdivisions: pref.getIntegerPreference('Grid/Horizontal/Ticks')
            }
        };

        if (config.step === 0) {
            config.step = AIS.Units.convert(config.grid.spacing, 'px', config.units) / config.grid.subdivisions;
        }

        var useGlobalRulers = confirm(
            'Use global (Yes) or artboard (No) rulers?\n' +
            'Artboard rulers are set by default.\n' +
            'To toggle between ruler modes, choose View > Rulers > Change to...'
        );

        var originalCoordSys = app.coordinateSystem;

        if (useGlobalRulers) {
            app.coordinateSystem = CoordinateSystem.DOCUMENTCOORDINATESYSTEM;
        } else {
            app.coordinateSystem = CoordinateSystem.ARTBOARDCOORDINATESYSTEM;
        }

        var selection = doc.selection;

        for (var i = 0; i < selection.length; i++) {
            roundItemCoordinates(selection[i], config);
        }

        app.coordinateSystem = originalCoordSys;

    } catch (error) {
        AIS.Error.show('Round Coordinates Error', error);
    }
}

// ============================================================================
// CORE LOGIC
// ============================================================================

function roundItemCoordinates(item, config) {
    var boundsPx = getVisibleBounds(item, config.includeStroke);
    var boundsUnits = [];

    for (var j = 0; j < boundsPx.length; j++) {
        var converted = AIS.Units.convert(boundsPx[j], 'px', config.units);
        boundsUnits.push(converted * config.scaleFactor);
    }

    var delta = calculateDelta(config.refPoint, boundsUnits, config.step, config.units, config.scaleFactor);

    var geometricBounds = item.geometricBounds;
    item.position = [
        geometricBounds[0] + delta.x,
        geometricBounds[1] + delta.y
    ];
}

// ============================================================================
// BOUNDS CALCULATION
// ============================================================================

function getVisibleBounds(item, includeStroke) {
    var children = [];

    if (item.typename === 'GroupItem' && !item.clipped) {
        collectChildren(item.pageItems, children);
    }
    else if (item.typename === 'GroupItem' && item.clipped) {
        var clippingPath = getClippingPath(item);
        if (clippingPath) children.push(clippingPath);
    }
    else {
        children.push(item);
    }

    if (children.length === 0) {
        return item.geometricBounds;
    }

    var bounds = includeStroke ? children[0].visibleBounds : children[0].geometricBounds;

    for (var i = 1; i < children.length; i++) {
        var childBounds = includeStroke ? children[i].visibleBounds : children[i].geometricBounds;
        bounds = mergeBounds(childBounds, bounds);
    }

    return bounds;
}

function collectChildren(collection, array) {
    for (var i = 0; i < collection.length; i++) {
        var item = collection[i];

        try {
            if (item.typename === 'GroupItem') {
                if (!item.clipped) {
                    collectChildren(item.pageItems, array);
                } else {
                    var mask = getClippingPath(item);
                    if (mask) array.push(mask);
                }
            } else {
                array.push(item);
            }
        } catch (error) {
            // Continue with next item
        }
    }
}

function getClippingPath(group) {
    for (var i = 0; i < group.pageItems.length; i++) {
        var item = group.pageItems[i];
        if (isClippingPath(item)) {
            return item;
        }
    }
    return null;
}

function isClippingPath(item) {
    var clipText = (
        item.typename === 'TextFrame' &&
        item.textRange.characterAttributes.fillColor == '[NoColor]' &&
        item.textRange.characterAttributes.strokeColor == '[NoColor]'
    );

    return (
        (item.typename === 'CompoundPathItem' && item.pathItems[0].clipping) ||
        item.clipping ||
        clipText
    );
}

function mergeBounds(bounds1, bounds2) {
    return [
        Math.min(bounds1[0], bounds2[0]),
        Math.max(bounds1[1], bounds2[1]),
        Math.max(bounds1[2], bounds2[2]),
        Math.min(bounds1[3], bounds2[3])
    ];
}

// ============================================================================
// COORDINATE ROUNDING
// ============================================================================

function calculateDelta(refPoint, bounds, step, units, scaleFactor) {
    var centerX = bounds[0] + (bounds[2] - bounds[0]) / 2;
    var centerY = bounds[1] + (bounds[3] - bounds[1]) / 2;
    var x = 0;
    var y = 0;

    switch (refPoint) {
        case 0: // Top Left
            x = getRoundingDelta(bounds[0], step);
            y = getRoundingDelta(bounds[1], step);
            break;
        case 1: // Top Center
            x = getRoundingDelta(centerX, step);
            y = getRoundingDelta(bounds[1], step);
            break;
        case 2: // Top Right
            x = getRoundingDelta(bounds[2], step);
            y = getRoundingDelta(bounds[1], step);
            break;
        case 3: // Left Center
            x = getRoundingDelta(bounds[0], step);
            y = getRoundingDelta(centerY, step);
            break;
        case 4: // Center
            x = getRoundingDelta(centerX, step);
            y = getRoundingDelta(centerY, step);
            break;
        case 5: // Right Center
            x = getRoundingDelta(bounds[2], step);
            y = getRoundingDelta(centerY, step);
            break;
        case 6: // Bottom Left
            x = getRoundingDelta(bounds[0], step);
            y = getRoundingDelta(bounds[3], step);
            break;
        case 7: // Bottom Center
            x = getRoundingDelta(centerX, step);
            y = getRoundingDelta(bounds[3], step);
            break;
        case 8: // Bottom Right
            x = getRoundingDelta(bounds[2], step);
            y = getRoundingDelta(bounds[3], step);
            break;
    }

    x = AIS.Units.convert(x, units, 'px') / scaleFactor;
    y = AIS.Units.convert(y, units, 'px') / scaleFactor;

    return { x: x, y: y };
}

function getRoundingDelta(value, step) {
    var fractional = Math.round(value) - value;
    var sign = getSign(value);
    var closest = getClosestMultiple(Math.abs(value), step);
    var truncated = truncate(fractional + value);

    return fractional + (sign * closest - truncated);
}

function getClosestMultiple(value, step) {
    var x = truncate(value / step);

    if (!(value % step)) {
        return value;
    }

    var nextMultiple = step * (x + 1);
    var prevMultiple = step * x;

    return (nextMultiple - value) < (value - prevMultiple) ? nextMultiple : prevMultiple;
}

function truncate(n) {
    n = +n;
    return (n - n % 1) || (!isFinite(n) || n === 0 ? n : n < 0 ? -0 : 0);
}

function getSign(n) {
    return n ? (n < 0 ? -1 : 1) : 0;
}
