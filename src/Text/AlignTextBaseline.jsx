/**
 * Align Text Baseline
 * @version 1.0.0
 * @description Align text frames vertically by baseline with custom spacing
 * @category Text
 *
 * Features:
 * - Aligns point text frames by their baseline (not bounds)
 * - Custom vertical spacing between baselines
 * - Live preview mode
 * - Keyboard shortcuts (Up/Down arrow + Shift for +/- 10)
 * - Automatic sorting by position
 * - Works with selected text frames or groups containing text
 *
 * Original: AlignTextBaseline.jsx by Sergey Osokin
 * Modernized for AIS framework
 */




//@target illustrator
var c=File(Folder.myDocuments+"/Adobe Scripts/vexy-ville.ini");if(c.exists){c.open('r');var p=c.read();c.close();var l=File(p+".lib/core.jsx");if(l.exists)$.evalFile(l.fsName);}
app.preferences.setBooleanPreference('ShowExternalJSXWarning', false);

// ============================================================================
// CONFIGURATION
// ============================================================================

var CFG = {
    scriptName: 'Align Text Baseline',
    version: '1.0.0',
    defaultSpace: 10,
    enablePreview: false,
    uiOpacity: 0.96
};

// ============================================================================
// MAIN FUNCTION
// ============================================================================

function main(textFrames) {
    // Sort text frames by position (horizontal or vertical)
    sortTextFramesByPosition(textFrames);

    var units = AIS.Units.get();
    var scaleFactor = app.activeDocument.scaleFactor || 1;

    var config = showDialog(units, scaleFactor, textFrames);
    // Config is null if cancelled, processing happens in dialog
}

// ============================================================================
// CORE LOGIC
// ============================================================================

/**
 * Collect all text frames from selection (including nested in groups)
 * @param {Array} selection - Document selection
 * @returns {Array} Array of TextFrame objects
 */
function collectTextFrames(selection) {
    var frames = [];

    for (var i = 0; i < selection.length; i++) {
        var item = selection[i];

        if (item.typename === 'TextFrame') {
            frames.push(item);
        } else if (item.typename === 'GroupItem') {
            // Recursively collect text frames from groups
            var nested = collectTextFrames(item.pageItems);
            frames = frames.concat(nested);
        }
    }

    return frames;
}

/**
 * Sort text frames by position (horizontal or vertical arrangement)
 * Reference: Hiroyuki Sato (shspage)
 * @param {Array} frames - Array of TextFrame objects
 */
function sortTextFramesByPosition(frames) {
    // Collect horizontal and vertical positions
    var lefts = [];
    var tops = [];

    for (var i = 0; i < frames.length; i++) {
        lefts.push(frames[i].left);
        tops.push(frames[i].top);
    }

    // Determine if arrangement is more horizontal or vertical
    var horizontalSpread = getArrayMax(lefts) - getArrayMin(lefts);
    var verticalSpread = getArrayMax(tops) - getArrayMin(tops);

    if (horizontalSpread > verticalSpread) {
        // Horizontal arrangement - sort left to right, then top to bottom
        frames.sort(function(a, b) {
            return comparePosition(a.left, b.left, b.top, a.top);
        });
    } else {
        // Vertical arrangement - sort top to bottom, then left to right
        frames.sort(function(a, b) {
            return comparePosition(b.top, a.top, a.left, b.left);
        });
    }
}

/**
 * Compare position of two values with fallback
 * @param {number} primary1 - Primary comparison value for object 1
 * @param {number} primary2 - Primary comparison value for object 2
 * @param {number} secondary1 - Secondary comparison value for object 1
 * @param {number} secondary2 - Secondary comparison value for object 2
 * @returns {number} Comparison result
 */
function comparePosition(primary1, primary2, secondary1, secondary2) {
    return primary1 === primary2 ? secondary1 - secondary2 : primary1 - primary2;
}

/**
 * Distribute text frames by baseline with spacing
 * @param {Array} frames - Array of TextFrame objects
 * @param {number} spacePx - Spacing in pixels
 */
function distributeByBaseline(frames, spacePx) {
    var anchorFrame = frames[0];

    for (var i = 1; i < frames.length; i++) {
        moveTextByBaseline(anchorFrame, frames[i], spacePx * i);
    }
}

/**
 * Move text frame to align baseline with spacing from anchor
 * @param {TextFrame} anchor - Reference text frame
 * @param {TextFrame} target - Text frame to move
 * @param {number} targetSpace - Target spacing from anchor baseline
 */
function moveTextByBaseline(anchor, target, targetSpace) {
    // Calculate current distance between baselines
    var currentDistance = anchor.anchor[1] - target.anchor[1];
    var adjustment = targetSpace - currentDistance;

    // Move target text frame vertically
    target.position = [target.position[0], target.position[1] - adjustment];
}

// ============================================================================
// USER INTERFACE
// ============================================================================

/**
 * Show main dialog with preview
 * @param {string} units - Current document units
 * @param {number} scaleFactor - Document scale factor
 * @param {Array} textFrames - Array of text frames to align
 * @returns {Object|null} Configuration or null if cancelled
 */
function showDialog(units, scaleFactor, textFrames) {
    var isMac = AIS.System.isMac();
    var aiVersion = parseFloat(app.version);
    var previewActive = false;

    var dialog = new Window('dialog', CFG.scriptName + ' ' + CFG.version);
    dialog.alignChildren = ['fill', 'top'];
    dialog.opacity = CFG.uiOpacity;

    // Spacing input
    var inputGroup = dialog.add('group');
    inputGroup.alignChildren = ['fill', 'center'];

    inputGroup.add('statictext', undefined, 'Vertical spacing, ' + units + ':');
    var spaceInput = inputGroup.add('edittext', undefined, CFG.defaultSpace.toString());
    spaceInput.characters = 10;
    spaceInput.helpTip = 'Spacing between baselines\nUse Up/Down arrows to adjust (+Shift for ±10)';

    // Set focus on Mac or newer Illustrator
    if (isMac || aiVersion >= 26.4 || aiVersion <= 17) {
        spaceInput.active = true;
    }

    // Control buttons
    var buttonGroup = dialog.add('group');
    buttonGroup.alignChildren = ['fill', 'center'];

    var previewCheckbox = buttonGroup.add('checkbox', undefined, 'Preview');
    previewCheckbox.value = CFG.enablePreview;

    var cancelButton = buttonGroup.add('button', undefined, 'Cancel', {name: 'cancel'});
    var okButton = buttonGroup.add('button', undefined, 'OK', {name: 'ok'});

    // Event handlers
    previewCheckbox.onClick = function() {
        updatePreview();
    };

    spaceInput.onChange = function() {
        updatePreview();
    };

    // Keyboard shortcuts for value adjustment
    spaceInput.addEventListener('keydown', function(event) {
        var step = ScriptUI.environment.keyboardState.shiftKey ? 10 : 1;

        if (event.keyName === 'Down') {
            this.text = (parseFloat(this.text) - step).toString();
            event.preventDefault();
            updatePreview();
        } else if (event.keyName === 'Up') {
            this.text = (parseFloat(this.text) + step).toString();
            event.preventDefault();
            updatePreview();
        }
    });

    cancelButton.onClick = function() {
        dialog.close();
    };

    okButton.onClick = function() {
        // If preview is active, undo it before final apply
        if (previewActive) {
            app.undo();
        }

        // Apply final distribution
        applyDistribution();
        previewActive = false;
        dialog.close(1);
    };

    dialog.onClose = function() {
        // Undo preview if dialog cancelled
        if (previewActive) {
            try {
                app.undo();
            } catch (error) {
                // Ignore undo errors
            }
        }
    };

    /**
     * Update preview if checkbox is enabled
     */
    function updatePreview() {
        if (!previewCheckbox.value) {
            // Preview disabled - undo if was active
            if (previewActive) {
                try {
                    app.undo();
                    app.redraw();
                    previewActive = false;
                } catch (error) {
                    // Ignore undo errors
                }
            }
            return;
        }

        try {
            // Undo previous preview
            if (previewActive) {
                app.undo();
            } else {
                previewActive = true;
            }

            // Apply new preview
            applyDistribution();
            app.redraw();
        } catch (error) {
            // Ignore preview errors
        }
    }

    /**
     * Apply distribution to text frames
     */
    function applyDistribution() {
        var spaceValue = parseFloatSafe(spaceInput.text, CFG.defaultSpace);
        var spacePx = AIS.Units.convert(spaceValue / scaleFactor, units, 'px');
        distributeByBaseline(textFrames, spacePx);
    }

    // Initial preview if enabled
    if (previewCheckbox.value) {
        updatePreview();
    }

    dialog.center();
    dialog.show();

    return null;
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Get maximum value in array
 * @param {Array} arr - Array of numbers
 * @returns {number} Maximum value
 */
function getArrayMax(arr) {
    return Math.max.apply(null, arr);
}

/**
 * Get minimum value in array
 * @param {Array} arr - Array of numbers
 * @returns {number} Minimum value
 */
function getArrayMin(arr) {
    return Math.min.apply(null, arr);
}

/**
 * Parse string to float with fallback default
 * @param {string} str - String to parse
 * @param {number} defaultValue - Default value if parse fails
 * @returns {number} Parsed number or default
 */
function parseFloatSafe(str, defaultValue) {
    if (arguments.length < 2) {
        defaultValue = 1;
    }

    // Replace comma with period and remove non-numeric characters except minus and period
    str = str.replace(/,/g, '.').replace(/[^\d.-]/g, '');

    // Handle multiple periods - keep only first
    var parts = str.split('.');
    str = parts[0] ? parts[0] + '.' + parts.slice(1).join('') : '';

    // Keep only first minus sign
    str = str.substr(0, 1) + str.substr(1).replace(/-/g, '');

    if (isNaN(str) || str.length === 0) {
        return parseFloat(defaultValue);
    }

    return parseFloat(str);
}

// ============================================================================
// EXECUTE
// ============================================================================

if (!AIS.Document.hasDocument()) {
    alert('No document\nOpen a document and try again');
} else if (!AIS.Document.hasSelection()) {
    alert('No selection\nSelect at least 2 text frames and try again');
} else {
    try {
        main();
    } catch (e) {
        AIS.Error.show('Align Text Baseline error', e);
    }
}
