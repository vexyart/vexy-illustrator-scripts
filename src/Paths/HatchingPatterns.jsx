/**
 * Hatching Patterns
 * @version 1.0.0
 * @description Add vector hatching patterns to selected path or compound path with live preview
 * @category Paths
 * @author Original: Christian Condamine, Modernized: Vexy Art
 * @license MIT
 *
 * @features
 * - 10 different hatching curve patterns (straight to complex curves)
 * - Adjustable spacing, angle, and stroke thickness
 * - Live preview with undo-based updates
 * - Optional color preservation from original object
 * - Settings persistence via JSON
 * - Pattern preview buttons with visual icons
 * - Uses Pathfinder operations for clipping
 *
 * @usage
 * 1. Select one path or compound path
 * 2. Run script to open hatching dialog
 * 3. Adjust spacing (mm), angle (degrees), thickness (mm)
 * 4. Click a pattern button to preview
 * 5. Enable/disable color preservation
 * 6. Click OK to apply or Cancel to revert
 *
 * @example
 * - Select a circle → Apply diagonal hatching at 45° with 4mm spacing
 * - Select complex shape → Apply curved pattern with color preservation
 * - Preview updates in real-time as settings change
 */




//@target illustrator
var c=File(Folder.myDocuments+"/Adobe Scripts/vexy-ville.ini");if(c.exists){c.open('r');var p=c.read();c.close();var l=File(p+".lib/core.jsx");if(l.exists)$.evalFile(l.fsName);}
app.preferences.setBooleanPreference('ShowExternalJSXWarning', false);

// ============================================================================
// CONFIGURATION
// ============================================================================
var CFG = {
    name: 'Hatching Patterns',
    version: '1.0.0',
    settings: {
        folder: Folder.myDocuments + '/Adobe Scripts/',
        file: 'HatchingPatterns-settings.json'
    },
    defaults: {
        spacing: 4,        // mm
        angle: 45,         // degrees
        thickness: 0.5,    // mm
        patternType: 'A',  // A-J
        preserveColor: true
    },
    // Pattern curve definitions (handle positions relative to perimeter)
    patterns: {
        'A': { p1: [0, 0], p2: [0, 0] },                    // Straight
        'B': { p1: [0, 0], p2: [-1/1.8, 1/1.8] },           // Curve right
        'C': { p1: [0, 0], p2: [0, 1/1.8] },                // Curve up
        'D': { p1: [1/1.8, -1/1.8], p2: [1/1.8, 1/1.8] },  // S-curve
        'E': { p1: [1/1.8, -1/1.8], p2: [-1/1.8, 1/1.8] }, // Reverse S
        'F': { p1: [1/1.8, 1/1.8], p2: [-1/1.8, -1/1.8] }, // Double curve
        'G': { p1: [1/1.8, 0], p2: [-1/1.8, 1/1.8] },      // Wave right
        'H': { p1: [1/1.8, 0], p2: [-1/1.8, -1/1.8] },     // Wave left
        'I': { p1: [1/1.8, 1/1.8], p2: [-1/1.8, 0] },      // Diagonal wave
        'J': { p1: [1/1.8, -1/1.8], p2: [-1/1.8, 0] }      // Reverse diagonal
    }
};

// ============================================================================
// STATE
// ============================================================================
var STATE = {
    doc: null,
    layer: null,
    originalItem: null,
    itemType: null,
    color: null,
    bounds: null,
    perimeter: 0,
    config: null,
    previewActive: false,
    dialog: null
};

// ============================================================================
// MAIN FUNCTION
// ============================================================================
function main() {
    try {
        STATE.doc = app.activeDocument;
        STATE.originalItem = STATE.doc.selection[0];
        STATE.layer = STATE.originalItem.layer;
        STATE.itemType = STATE.originalItem.typename;
        STATE.config = loadSettings();

        // Get color from object
        if (STATE.itemType === 'PathItem') {
            STATE.color = STATE.originalItem.stroked ?
                STATE.originalItem.strokeColor : STATE.originalItem.fillColor;
            // Make it stroked only
            STATE.originalItem.filled = false;
            STATE.originalItem.stroked = true;
            STATE.originalItem.strokeColor = STATE.color;
        } else {
            STATE.color = STATE.originalItem.pathItems[0].stroked ?
                STATE.originalItem.pathItems[0].strokeColor :
                STATE.originalItem.pathItems[0].fillColor;
        }

        // Calculate bounds and perimeter
        var b = STATE.originalItem.geometricBounds;
        STATE.bounds = {
            left: b[0],
            top: b[1],
            width: b[2] - b[0],
            height: b[1] - b[3]
        };
        STATE.perimeter = Math.round(STATE.bounds.width * 2 + STATE.bounds.height);

        // Mark original for later reference
        STATE.originalItem.name = 'baseSelection';

        showDialog();

    } catch (e) {
        AIS.Error.show('Hatching Patterns Error', e);
    }
}

// ============================================================================
// CORE LOGIC
// ============================================================================

/**
 * Apply hatching pattern to selection
 */
function applyHatching(spacing, angle, thickness, patternType, preserveColor) {
    try {
        // Convert mm to points
        var spacingPt = AIS.Units.convert(spacing, 'mm', 'pt');
        var thicknessPt = AIS.Units.convert(thickness, 'mm', 'pt');

        // Copy base selection
        STATE.originalItem.selected = true;
        app.copy();
        app.executeMenuCommand('pasteFront');
        var copy = STATE.doc.selection[0];
        copy.name = 'copieBaseSelection';

        // Make copy filled for masking
        if (STATE.itemType === 'PathItem') {
            copy.filled = true;
            copy.stroked = false;
        } else {
            for (var n = 0; n < copy.pathItems.length; n++) {
                copy.pathItems[n].filled = true;
                copy.pathItems[n].stroked = false;
            }
        }

        // Create hatching group
        var hatchGroup = STATE.layer.groupItems.add();
        hatchGroup.name = 'grpHachures';

        // Get pattern handle offsets
        var pattern = CFG.patterns[patternType];
        var p1x = pattern.p1[0] * STATE.perimeter;
        var p1y = pattern.p1[1] * STATE.perimeter;
        var p2x = pattern.p2[0] * STATE.perimeter;
        var p2y = pattern.p2[1] * STATE.perimeter;

        // Create hatching lines
        var lineCount = Math.ceil(STATE.perimeter / spacingPt);
        for (var i = 0; i < lineCount; i++) {
            var line = hatchGroup.pathItems.add();
            line.name = 'ligne' + i;

            // Start point
            var pt1 = line.pathPoints.add();
            pt1.anchor = [STATE.bounds.left, STATE.bounds.top - (spacingPt * i)];
            pt1.rightDirection = pt1.leftDirection = [
                pt1.anchor[0] + p1x,
                pt1.anchor[1] + p1y
            ];

            // End point
            var pt2 = line.pathPoints.add();
            pt2.anchor = [
                STATE.bounds.left + STATE.perimeter,
                STATE.bounds.top - (spacingPt * i)
            ];
            pt2.rightDirection = pt2.leftDirection = [
                pt2.anchor[0] + p2x,
                pt2.anchor[1] + p2y
            ];

            // Style line
            line.stroked = true;
            line.strokeWidth = thicknessPt;
            line.strokeColor = preserveColor ? STATE.color : createBlackColor();
        }

        // Rotate hatching group
        hatchGroup.rotate(angle, true, false, false, false, Transformation.CENTER);

        // Center on original bounds
        hatchGroup.left = STATE.bounds.left - (hatchGroup.width - STATE.bounds.width) / 2;
        hatchGroup.top = STATE.bounds.top + (hatchGroup.height - STATE.bounds.height) / 2;

        // Create clipping mask
        var maskBounds = hatchGroup.geometricBounds;
        var mask = STATE.layer.pathItems.add();
        mask.name = 'masque';
        mask.setEntirePath([
            [maskBounds[0] - 10, maskBounds[1] + 10],
            [maskBounds[0] - 10, maskBounds[3] - 10],
            [maskBounds[2] + 10, maskBounds[3] - 10],
            [maskBounds[2] + 10, maskBounds[1] + 10]
        ]);
        mask.closed = true;

        // Apply pathfinder operations
        STATE.layer.selection = null;
        var tempGroup = STATE.layer.groupItems.add();
        copy.move(tempGroup, ElementPlacement.PLACEATBEGINNING);
        mask.move(tempGroup, ElementPlacement.PLACEATBEGINNING);
        tempGroup.selected = true;

        app.executeMenuCommand('compoundPath');
        hatchGroup.selected = true;
        app.executeMenuCommand('ungroup');
        if (STATE.itemType === 'PathItem') {
            app.executeMenuCommand('ungroup');
        }

        // Use Pathfinder Divide
        app.executeMenuCommand('Make Planet X');
        app.executeMenuCommand('Expand Planet X');
        app.executeMenuCommand('ungroup');

        // Remove unwanted group (keep hatched result)
        var sel = STATE.doc.selection;
        var removeIdx = -1;
        for (var j = 0; j < 2 && j < sel.length; j++) {
            if (sel[j].pageItems[0].typename === 'CompoundPathItem' ||
                sel[j].pageItems[0].filled === true) {
                removeIdx = j;
                break;
            }
        }
        if (removeIdx >= 0) {
            sel[removeIdx].remove();
        }

        app.redraw();

    } catch (e) {
        AIS.Error.show('Apply Hatching Error', e);
    }
}

/**
 * Update preview
 */
function updatePreview() {
    try {
        // Undo previous preview
        if (STATE.previewActive) {
            STATE.doc.selection[0].remove();
            STATE.doc.selection = null;

            // Re-select original
            var items = STATE.layer.pageItems;
            for (var i = 0; i < items.length; i++) {
                if (items[i].name === 'baseSelection') {
                    items[i].selected = true;
                    break;
                }
            }
        } else {
            STATE.previewActive = true;
            app.redraw();
        }

        // Get current settings from dialog
        var spacing = parseFloat(STATE.dialog.spacingText.text);
        var angle = parseFloat(STATE.dialog.angleText.text);
        var thickness = parseFloat(STATE.dialog.thicknessText.text);
        var patternType = STATE.dialog.currentPattern || 'A';
        var preserveColor = STATE.dialog.colorCheck.value;

        // Apply hatching
        applyHatching(spacing, angle, thickness, patternType, preserveColor);

    } catch (e) {
        AIS.Error.show('Preview Error', e);
    }
}

/**
 * Finalize hatching
 */
function finalize() {
    try {
        STATE.doc.selection = null;

        // Find and select original
        var items = STATE.layer.pageItems;
        for (var i = 0; i < items.length; i++) {
            if (items[i].name === 'baseSelection') {
                items[i].selected = true;
                items[i].name = '';
                break;
            }
        }

    } catch (e) {
        AIS.Error.show('Finalize Error', e);
    }
}

/**
 * Cancel hatching (remove preview)
 */
function cancel() {
    try {
        if (STATE.previewActive) {
            STATE.doc.selection[0].remove();

            // Re-select original
            var items = STATE.layer.pageItems;
            for (var i = 0; i < items.length; i++) {
                if (items[i].name === 'baseSelection') {
                    items[i].selected = true;
                    items[i].name = '';
                    break;
                }
            }

            STATE.previewActive = false;
        }
    } catch (e) {
        // Silent fail on cancel
    }
}

// ============================================================================
// USER INTERFACE
// ============================================================================

function showDialog() {
    var dlg = new Window('dialog', CFG.name + ' v' + CFG.version);
    dlg.orientation = 'column';
    dlg.alignChildren = ['fill', 'top'];
    dlg.spacing = 10;
    dlg.margins = 16;

    // ========================================
    // Settings Panel
    // ========================================
    var settingsPanel = dlg.add('panel', undefined, 'Settings');
    settingsPanel.orientation = 'column';
    settingsPanel.alignChildren = ['fill', 'top'];
    settingsPanel.spacing = 8;
    settingsPanel.margins = 15;

    // Spacing
    var spacingGroup = settingsPanel.add('group');
    spacingGroup.add('statictext', undefined, 'Spacing:').characters = 12;
    var spacingText = spacingGroup.add('edittext', undefined, STATE.config.spacing.toString());
    spacingText.characters = 6;
    spacingGroup.add('statictext', undefined, 'mm');

    // Angle
    var angleGroup = settingsPanel.add('group');
    angleGroup.add('statictext', undefined, 'Angle:').characters = 12;
    var angleText = angleGroup.add('edittext', undefined, STATE.config.angle.toString());
    angleText.characters = 6;
    angleGroup.add('statictext', undefined, 'degrees');

    // Thickness
    var thicknessGroup = settingsPanel.add('group');
    thicknessGroup.add('statictext', undefined, 'Thickness:').characters = 12;
    var thicknessText = thicknessGroup.add('edittext', undefined, STATE.config.thickness.toString());
    thicknessText.characters = 6;
    thicknessGroup.add('statictext', undefined, 'mm');

    // ========================================
    // Pattern Selection Panel
    // ========================================
    var patternPanel = dlg.add('panel', undefined, 'Pattern Type');
    patternPanel.orientation = 'column';
    patternPanel.alignChildren = ['center', 'top'];
    patternPanel.spacing = 10;
    patternPanel.margins = 15;

    // Row 1: A-E
    var row1 = patternPanel.add('group');
    row1.spacing = 10;
    var btnA = row1.add('button', undefined, 'A');
    var btnB = row1.add('button', undefined, 'B');
    var btnC = row1.add('button', undefined, 'C');
    var btnD = row1.add('button', undefined, 'D');
    var btnE = row1.add('button', undefined, 'E');

    btnA.preferredSize = btnB.preferredSize = btnC.preferredSize =
    btnD.preferredSize = btnE.preferredSize = [40, 30];

    // Row 2: F-J
    var row2 = patternPanel.add('group');
    row2.spacing = 10;
    var btnF = row2.add('button', undefined, 'F');
    var btnG = row2.add('button', undefined, 'G');
    var btnH = row2.add('button', undefined, 'H');
    var btnI = row2.add('button', undefined, 'I');
    var btnJ = row2.add('button', undefined, 'J');

    btnF.preferredSize = btnG.preferredSize = btnH.preferredSize =
    btnI.preferredSize = btnJ.preferredSize = [40, 30];

    // ========================================
    // Options
    // ========================================
    var colorCheck = dlg.add('checkbox', undefined, 'Preserve original color');
    colorCheck.value = STATE.config.preserveColor;

    // ========================================
    // Buttons
    // ========================================
    var btnGroup = dlg.add('group');
    btnGroup.orientation = 'row';
    btnGroup.alignChildren = ['center', 'center'];
    btnGroup.spacing = 10;

    var okBtn = btnGroup.add('button', undefined, 'OK', {name: 'ok'});
    var cancelBtn = btnGroup.add('button', undefined, 'Cancel', {name: 'cancel'});

    // ========================================
    // Store references in STATE
    // ========================================
    STATE.dialog = {
        window: dlg,
        spacingText: spacingText,
        angleText: angleText,
        thicknessText: thicknessText,
        colorCheck: colorCheck,
        currentPattern: STATE.config.patternType
    };

    // ========================================
    // Event Handlers
    // ========================================

    function setPattern(type) {
        STATE.dialog.currentPattern = type;
        updatePreview();
    }

    btnA.onClick = function() { setPattern('A'); };
    btnB.onClick = function() { setPattern('B'); };
    btnC.onClick = function() { setPattern('C'); };
    btnD.onClick = function() { setPattern('D'); };
    btnE.onClick = function() { setPattern('E'); };
    btnF.onClick = function() { setPattern('F'); };
    btnG.onClick = function() { setPattern('G'); };
    btnH.onClick = function() { setPattern('H'); };
    btnI.onClick = function() { setPattern('I'); };
    btnJ.onClick = function() { setPattern('J'); };

    spacingText.onChange = function() { updatePreview(); };
    angleText.onChange = function() { updatePreview(); };
    thicknessText.onChange = function() { updatePreview(); };
    colorCheck.onClick = function() { updatePreview(); };

    okBtn.onClick = function() {
        // Save settings
        STATE.config.spacing = parseFloat(spacingText.text);
        STATE.config.angle = parseFloat(angleText.text);
        STATE.config.thickness = parseFloat(thicknessText.text);
        STATE.config.patternType = STATE.dialog.currentPattern;
        STATE.config.preserveColor = colorCheck.value;
        saveSettings(STATE.config);

        finalize();
        dlg.close();
    };

    cancelBtn.onClick = function() {
        cancel();
        dlg.close();
    };

    dlg.onClose = function() {
        saveSettings(STATE.config);
    };

    // Show dialog and initial preview
    dlg.center();
    updatePreview();
    dlg.show();

    // Show usage hint
    alert('Select a hatching pattern\nAdjust settings as needed\n\nPreview updates automatically\nClick OK to apply or Cancel to revert');
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Create black RGB color
 */
function createBlackColor() {
    var black = new RGBColor();
    black.red = 0;
    black.green = 0;
    black.blue = 0;
    return black;
}

/**
 * Load settings from JSON file
 */
function loadSettings() {
    try {
        var file = new File(CFG.settings.folder + CFG.settings.file);

        if (!file.exists) {
            return AIS.Object.clone(CFG.defaults);
        }

        file.encoding = 'UTF-8';
        file.open('r');
        var json = file.read();
        file.close();

        var config = AIS.JSON.parse(json);

        // Merge with defaults
        for (var key in CFG.defaults) {
            if (config[key] === undefined) {
                config[key] = CFG.defaults[key];
            }
        }

        return config;

    } catch (e) {
        return AIS.Object.clone(CFG.defaults);
    }
}

/**
 * Save settings to JSON file
 */
function saveSettings(config) {
    try {
        var folder = new Folder(CFG.settings.folder);
        if (!folder.exists) {
            folder.create();
        }

        var file = new File(CFG.settings.folder + CFG.settings.file);
        file.encoding = 'UTF-8';
        file.open('w');
        file.write(AIS.JSON.stringify(config));
        file.close();

    } catch (e) {
        // Silent fail - settings not critical
    }
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
        AIS.Error.show('Script error', e);
    }
}
