/**
 * Make Trapping Stroke
 * @version 1.0.0
 * @description Sets stroke color from fill with overprint enabled for print production trapping
 * @category Strokes
 * @features
 * - Creates trapping strokes matching fill colors
 * - Enables overprint for proper prepress trapping
 * - Handles gradients by interpolating colors
 * - Live preview with undo/redo
 * - Configurable stroke weight (pt/mm)
 * - Force add stroke option for objects without strokes
 * - Supports RGB, CMYK, Grayscale, Spot, and Gradient fills
 * @author Original: Sergey Osokin (hi@sergosokin.ru)
 * @usage
 * 1. Select path objects with fills
 * 2. Run script
 * 3. Configure stroke weight and units
 * 4. Enable "Force add stroke" if objects have no strokes
 * 5. Use Preview to see results before applying
 * @notes
 * - Skips patterns and empty fills
 * - Round cap and round corner applied automatically
 * - "Force add stroke" may not work correctly on Mac OS
 * - Gradient fills use averaged color interpolation for strokes
 * @compatibility Adobe Illustrator CC 2019-2025
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
        alert('No selection\nSelect at least one path with a fill and try again');
        return;
    }

    main();
})();

// ============================================================================
// CONFIGURATION
// ============================================================================
var SCRIPT = {
    name: 'Make Trapping Stroke',
    version: 'v1.0.0'
};

var CFG = {
    width: 1,               // Default stroke width
    isAddStroke: false,     // Force add stroke
    isRndCap: true,         // Force round stroke cap
    isRndCorner: true,      // Force round stroke corner
    uiOpacity: 0.98,        // UI window opacity
    preview: false
};

// ============================================================================
// MAIN FUNCTION
// ============================================================================
function main() {
    var doc = app.activeDocument;
    var paths = [];
    var isUndo = false;
    var tmpPath = null;

    // Collect valid paths from selection
    var badFills = collectPaths(selection, paths);
    var hasStroke = checkHasStroke(paths);

    if (paths.length === 0) {
        alert('No valid paths\nSelect paths with color fills (not patterns or empty fills)');
        return;
    }

    // Create dialog
    var win = new Window('dialog', SCRIPT.name + ' ' + SCRIPT.version);
    win.orientation = 'column';
    win.opacity = CFG.uiOpacity;

    var wrapper = win.add('group');
    wrapper.orientation = 'row';
    wrapper.alignChildren = 'fill';
    wrapper.spacing = 15;

    // Left panel - Options
    var opts = wrapper.add('group');
    opts.orientation = 'column';
    opts.alignChildren = ['fill', 'top'];
    opts.spacing = 16;

    // Weight input
    var widthGrp = opts.add('group');
    widthGrp.alignChildren = ['fill', 'center'];
    widthGrp.add('statictext', undefined, 'Weight:');
    var widthInp = widthGrp.add('edittext', [0, 0, 70, 25], CFG.width);
    if (AIS.System.isMac() || parseFloat(app.version) >= 26.4 || parseFloat(app.version) <= 17) {
        widthInp.active = true;
    }

    // Units selection
    var unitsGrp = opts.add('group');
    unitsGrp.alignChildren = 'center';
    unitsGrp.add('statictext', undefined, 'Units:');
    var isPt = unitsGrp.add('radiobutton', undefined, 'pt');
    isPt.bounds = [0, 0, 35, 16];
    var isMm = unitsGrp.add('radiobutton', undefined, 'mm');
    isMm.bounds = [0, 0, 45, 16];
    isMm.value = true;

    // Force add stroke option
    var isAddStroke = opts.add('checkbox', undefined, 'Force add stroke');
    isAddStroke.value = CFG.isAddStroke;

    // Separator
    var separator = wrapper.add('panel');
    separator.minimumSize.width = separator.maximumSize.width = 2;

    // Right panel - Buttons
    var btns = wrapper.add('group');
    btns.orientation = 'column';
    btns.alignChildren = ['fill', 'top'];
    var cancel = btns.add('button', undefined, 'Cancel', {name: 'cancel'});
    var ok = btns.add('button', undefined, 'OK', {name: 'ok'});
    var isPreview = btns.add('checkbox', undefined, 'Preview');
    isPreview.value = CFG.preview;

    // Mac OS warning
    if (AIS.System.isMac()) {
        win.add('statictext', [0, 0, 240, 30],
            "The 'Force add stroke' option on Mac OS \nmay not work correctly",
            {multiline: true});
    }

    // Copyright link
    var copyright = win.add('statictext', undefined, '\u00A9 Sergey Osokin. Visit Github');
    copyright.justify = 'center';

    copyright.addEventListener('mousedown', function() {
        AIS.System.openURL('https://github.com/creold/');
    });

    // Event handlers
    widthInp.onChanging = preview;
    isPt.onClick = preview;
    isMm.onClick = preview;
    isPreview.onClick = preview;
    isAddStroke.onClick = preview;

    // Use Up/Down arrow keys (+ Shift)
    widthInp.addEventListener('keydown', function(kd) {
        var step = ScriptUI.environment.keyboardState.shiftKey ? 10 : 1;
        if (kd.keyName === 'Down') {
            var val = parseFloat(this.text) || CFG.width;
            val = val - step;
            if (val < 0.001) val = 0.001;
            this.text = val;
            kd.preventDefault();
            preview();
        }
        if (kd.keyName === 'Up') {
            var val = parseFloat(this.text) || CFG.width;
            val = val + step;
            if (val <= 1000) {
                this.text = val;
                kd.preventDefault();
                preview();
            }
        }
    });

    ok.onClick = okClick;
    cancel.onClick = function() {
        win.close();
    };

    win.onClose = function() {
        try {
            if (isUndo) {
                app.undo();
                isUndo = false;
            }
        } catch (e) {}

        if (tmpPath) {
            try {
                tmpPath.remove();
            } catch (e) {}
        }
        app.redraw();

        if (badFills > 0) {
            var msg = 'Attention\nThe script skipped ' + badFills + ' path(s) ';
            msg += 'with patterns or empty fills.';
            alert(msg, SCRIPT.name);
        }
    };

    // Run initial preview if enabled
    if (isPreview.value) preview();

    win.center();
    win.show();

    // ========================================================================
    // DIALOG FUNCTIONS
    // ========================================================================
    function preview() {
        try {
            if (isPreview.value && (hasStroke || isAddStroke.value)) {
                if (isUndo) {
                    app.undo();
                } else {
                    isUndo = true;
                }
                applyStrokes();
                app.redraw();
            } else if (isUndo) {
                app.undo();
                app.redraw();
                isUndo = false;
            }
        } catch (e) {
            // Silently handle preview errors
        }
    }

    function okClick() {
        if (isPreview.value && isUndo) {
            app.undo();
        }
        applyStrokes();
        isUndo = false;
        win.close();
    }

    function applyStrokes() {
        // Create temporary path for preview fix
        if (!tmpPath) {
            tmpPath = doc.activeLayer.pathItems.add();
            tmpPath.name = '__TempPath';
        }

        var widthVal = parseFloat(widthInp.text) || CFG.width;
        if (isMm.value) {
            widthVal = AIS.Units.convert(widthVal, 'mm', 'pt');
        }

        var isRgb = (doc.documentColorSpace === DocumentColorSpace.RGB);

        for (var i = 0; i < paths.length; i++) {
            var item = paths[i];

            // Force add stroke if option enabled
            if (isAddStroke.value && !item.stroked) {
                item.stroked = true;
            }

            // Apply stroke properties
            if (item.stroked) {
                item.strokeWidth = widthVal;
                if (CFG.isRndCap) {
                    item.strokeCap = StrokeCap.ROUNDENDCAP;
                }
                if (CFG.isRndCorner) {
                    item.strokeJoin = StrokeJoin.ROUNDENDJOIN;
                }
                item.strokeOverprint = true;
                setStrokeColor(item, isRgb);
            }
        }
    }
}

// ============================================================================
// CORE LOGIC
// ============================================================================

/**
 * Collect paths with valid fills from selection
 * @param {Object} coll - Collection to search
 * @param {Array} out - Output array for valid paths
 * @returns {Number} Count of skipped items with invalid fills
 */
function collectPaths(coll, out) {
    var noColor = 0;

    for (var i = 0; i < coll.length; i++) {
        var item = coll[i];

        if (item.typename === 'GroupItem' && item.pageItems.length > 0) {
            noColor += collectPaths(item.pageItems, out);
        } else if (item.typename === 'CompoundPathItem') {
            if (item.pathItems.length > 0 && hasColorFill(item.pathItems[0])) {
                noColor += collectPaths(item.pathItems, out);
            } else {
                noColor++;
            }
        } else if (item.typename === 'PathItem') {
            if (hasColorFill(item)) {
                out.push(item);
            } else {
                noColor++;
            }
        }
    }

    return noColor;
}

/**
 * Check if path has a valid color fill (not pattern, not empty)
 * @param {PathItem} obj - Path to check
 * @returns {Boolean} True if has valid fill
 */
function hasColorFill(obj) {
    if (!obj.filled) return false;

    var fillType = obj.fillColor.typename;
    return (fillType === 'RGBColor' ||
            fillType === 'CMYKColor' ||
            fillType === 'GrayColor' ||
            fillType === 'SpotColor' ||
            fillType === 'GradientColor');
}

/**
 * Check if any paths have strokes
 * @param {Array} arr - Array of paths
 * @returns {Boolean} True if any path has stroke
 */
function checkHasStroke(arr) {
    for (var i = 0; i < arr.length; i++) {
        if (arr[i].stroked) return true;
    }
    return false;
}

/**
 * Set stroke color from fill color
 * @param {PathItem} obj - Path to modify
 * @param {Boolean} isRgb - Document color mode
 */
function setStrokeColor(obj, isRgb) {
    var fColor = obj.fillColor;
    var sColor = fColor;

    // Handle gradient fills by interpolating colors
    if (fColor.typename === 'GradientColor') {
        sColor = interpolateGradientColor(fColor.gradient, isRgb);
    }

    obj.strokeColor = sColor;
}

/**
 * Interpolate gradient colors by averaging all stops
 * Algorithm by moody allen (moodyallen7@gmail.com)
 * @param {Gradient} grad - Gradient to interpolate
 * @param {Boolean} isRgb - Document color mode
 * @returns {Color} Averaged color
 */
function interpolateGradientColor(grad, isRgb) {
    var amt = grad.gradientStops.length;
    var cSum = {}; // Sum of color channels

    // Sum all color channels from all stops
    for (var i = 0; i < amt; i++) {
        var c = grad.gradientStops[i].color;

        // Convert spot to color
        if (c.typename === 'SpotColor') {
            c = c.spot.color;
        }

        // Convert grayscale to RGB/CMYK channels
        if (c.typename === 'GrayColor') {
            c.red = c.green = c.blue = c.black = c.gray;
        }

        // Sum all numeric properties
        for (var key in c) {
            if (typeof c[key] === 'number') {
                if (cSum[key]) {
                    cSum[key] += c[key];
                } else {
                    cSum[key] = c[key];
                }
            }
        }
    }

    // Create averaged color
    var mix = isRgb ? new RGBColor() : new CMYKColor();
    for (var key in cSum) {
        mix[key] = cSum[key] / amt;
    }

    return mix;
}

// ============================================================================
// UTILITIES
// ============================================================================
// (All utilities provided by AIS library - see #include "../.lib/core.jsx")
