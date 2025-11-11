/**
 * Scale Tool
 * @version 1.0.0
 * @description Compare two objects to extract a scale ratio, then apply that ratio to other selected objects
 * @category Transform
 * @author Original: Christian Condamine, Modernized: Vexy Art
 * @license MIT
 *
 * @features
 * - Compare dimensions of 2 objects to calculate scale ratio
 * - 4 scaling options: width 1→2, 2→1, height 1→2, 2→1
 * - Live preview with undo-based preview system
 * - Group vs individual object transformation
 * - Optional stroke/effect scaling
 * - Unit conversion (pt → mm for display)
 * - Persistent settings via JSON
 *
 * @usage
 * 1. Select exactly 2 objects to compare
 * 2. Run script to see dimension comparison palette
 * 3. Select objects to scale
 * 4. Click a preview radio button to see scale ratio applied
 * 5. Adjust options (group/individual, strokes/effects)
 * 6. Click Apply to finalize or Cancel to revert
 *
 * @example
 * - Compare a 100mm wide logo with 50mm reference → 50% scale ratio
 * - Select other logos to scale them down by 50%
 * - Preview shows result before applying
 */




//@target illustrator
var c=File(Folder.myDocuments+"/Adobe Scripts/vexy-ville.ini");if(c.exists){c.open('r');var p=c.read();c.close();var l=File(p+".lib/core.jsx");if(l.exists)$.evalFile(l.fsName);}
app.preferences.setBooleanPreference('ShowExternalJSXWarning', false);

// ============================================================================
// CONFIGURATION
// ============================================================================
var CFG = {
    name: 'Scale Tool',
    version: '1.0.0',
    settings: {
        folder: Folder.myDocuments + '/Adobe Scripts/',
        file: 'ScaleTool-settings.json'
    },
    defaults: {
        scaleStrokes: true,
        scaleMode: 'individual',  // 'individual' or 'group'
        lastRatio: null,
        lastMode: null  // 'w1to2', 'w2to1', 'h1to2', 'h2to1'
    }
};

// ============================================================================
// STATE
// ============================================================================
var STATE = {
    doc: null,
    obj1: null,
    obj2: null,
    dimensions: null,
    ratios: null,
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
        STATE.obj1 = STATE.doc.selection[0];
        STATE.obj2 = STATE.doc.selection[1];
        STATE.config = loadSettings();

        // Calculate dimensions and ratios
        STATE.dimensions = calculateDimensions(STATE.obj1, STATE.obj2);
        STATE.ratios = calculateRatios(STATE.dimensions);

        // Deselect comparison objects
        STATE.doc.selection = null;

        // Show dialog
        showDialog();

    } catch (e) {
        AIS.Error.show('Scale Tool Error', e);
    }
}

// ============================================================================
// CORE LOGIC
// ============================================================================

/**
 * Calculate dimensions of two objects
 */
function calculateDimensions(obj1, obj2) {
    var bounds1 = obj1.geometricBounds;
    var bounds2 = obj2.geometricBounds;

    return {
        obj1: {
            width: bounds1[2] - bounds1[0],
            height: bounds1[1] - bounds1[3]
        },
        obj2: {
            width: bounds2[2] - bounds2[0],
            height: bounds2[1] - bounds2[3]
        }
    };
}

/**
 * Calculate scale ratios between objects
 */
function calculateRatios(dims) {
    return {
        w1to2: (dims.obj1.width / dims.obj2.width) * 100,
        w2to1: (dims.obj2.width / dims.obj1.width) * 100,
        h1to2: (dims.obj1.height / dims.obj2.height) * 100,
        h2to1: (dims.obj2.height / dims.obj1.height) * 100
    };
}

/**
 * Apply scale to current selection
 */
function applyScale(ratio, mode, scaleStrokes) {
    try {
        var sel = STATE.doc.selection;

        if (sel.length === 0) {
            alert('No objects selected\nSelect objects to scale and try again');
            return false;
        }

        if (mode === 'group') {
            applyScaleGrouped(sel, ratio, scaleStrokes);
        } else {
            applyScaleIndividual(sel, ratio, scaleStrokes);
        }

        app.redraw();
        return true;

    } catch (e) {
        AIS.Error.show('Apply Scale Error', e);
        return false;
    }
}

/**
 * Apply scale to each object individually
 */
function applyScaleIndividual(selection, ratio, scaleStrokes) {
    for (var i = 0; i < selection.length; i++) {
        var item = selection[i];

        if (scaleStrokes) {
            item.resize(
                ratio,     // horizontal
                ratio,     // vertical
                true,      // changePositions
                true,      // changeFillPatterns
                true,      // changeFillGradients
                true,      // changeStrokePattern
                ratio      // changeLineWidths
            );
        } else {
            item.resize(ratio, ratio);
        }
    }
}

/**
 * Apply scale to selection as a group
 */
function applyScaleGrouped(selection, ratio, scaleStrokes) {
    // Group items
    app.executeMenuCommand('group');
    var group = STATE.doc.selection[0];

    // Scale group
    if (scaleStrokes) {
        group.resize(
            ratio,
            ratio,
            true,
            true,
            true,
            true,
            ratio
        );
    } else {
        group.resize(ratio, ratio);
    }

    // Ungroup
    app.executeMenuCommand('ungroup');
}

/**
 * Update preview with current settings
 */
function updatePreview(ratio, mode, scaleStrokes) {
    try {
        // Undo previous preview if active
        if (STATE.previewActive) {
            app.undo();
        } else {
            STATE.previewActive = true;
        }

        // Apply new preview
        if (applyScale(ratio, mode, scaleStrokes)) {
            app.redraw();
        }

    } catch (e) {
        AIS.Error.show('Preview Error', e);
    }
}

// ============================================================================
// USER INTERFACE
// ============================================================================

function showDialog() {
    var dlg = new Window('palette', CFG.name + ' v' + CFG.version);
    dlg.orientation = 'column';
    dlg.alignChildren = ['fill', 'top'];
    dlg.spacing = 10;
    dlg.margins = 16;

    // ========================================
    // Comparison Panel
    // ========================================
    var compPanel = dlg.add('panel', undefined, 'Dimension Comparison');
    compPanel.orientation = 'row';
    compPanel.alignChildren = ['left', 'top'];
    compPanel.spacing = 20;
    compPanel.margins = 15;

    // Dimensions group
    var dimsGroup = compPanel.add('group');
    dimsGroup.orientation = 'column';
    dimsGroup.alignChildren = ['left', 'center'];
    dimsGroup.spacing = 8;

    // Width section
    var widthLabel = dimsGroup.add('statictext', undefined, 'Width:');
    widthLabel.graphics.font = ScriptUI.newFont('dialog', 'Bold', 12);

    var w1Group = dimsGroup.add('group');
    w1Group.add('statictext', undefined, 'Object 1:');
    var w1Text = w1Group.add('edittext', undefined, toMM(STATE.dimensions.obj1.width));
    w1Text.characters = 10;
    w1Text.enabled = false;
    w1Group.add('statictext', undefined, 'mm');

    dimsGroup.add('panel', undefined, undefined, {borderStyle: 'gray'}).maximumSize = [200, 1];

    var w2Group = dimsGroup.add('group');
    w2Group.add('statictext', undefined, 'Object 2:');
    var w2Text = w2Group.add('edittext', undefined, toMM(STATE.dimensions.obj2.width));
    w2Text.characters = 10;
    w2Text.enabled = false;
    w2Group.add('statictext', undefined, 'mm');

    dimsGroup.add('panel', undefined, undefined, {borderStyle: 'white'}).maximumSize = [10, 10];

    // Height section
    var heightLabel = dimsGroup.add('statictext', undefined, 'Height:');
    heightLabel.graphics.font = ScriptUI.newFont('dialog', 'Bold', 12);

    var h1Group = dimsGroup.add('group');
    h1Group.add('statictext', undefined, 'Object 1:');
    var h1Text = h1Group.add('edittext', undefined, toMM(STATE.dimensions.obj1.height));
    h1Text.characters = 10;
    h1Text.enabled = false;
    h1Group.add('statictext', undefined, 'mm');

    dimsGroup.add('panel', undefined, undefined, {borderStyle: 'gray'}).maximumSize = [200, 1];

    var h2Group = dimsGroup.add('group');
    h2Group.add('statictext', undefined, 'Object 2:');
    var h2Text = h2Group.add('edittext', undefined, toMM(STATE.dimensions.obj2.height));
    h2Text.characters = 10;
    h2Text.enabled = false;
    h2Group.add('statictext', undefined, 'mm');

    // Preview buttons group
    var previewGroup = compPanel.add('group');
    previewGroup.orientation = 'column';
    previewGroup.alignChildren = ['left', 'center'];
    previewGroup.spacing = 16;

    // Radio buttons with percentages
    var previewW1 = previewGroup.add('radiobutton', undefined, 'Preview');
    var percentW1 = previewGroup.add('edittext', undefined, STATE.ratios.w1to2.toFixed(2) + '%');
    percentW1.characters = 8;
    percentW1.enabled = false;

    previewGroup.add('panel', undefined, undefined, {borderStyle: 'gray'}).maximumSize = [100, 1];

    var previewW2 = previewGroup.add('radiobutton', undefined, 'Preview');
    var percentW2 = previewGroup.add('edittext', undefined, STATE.ratios.w2to1.toFixed(2) + '%');
    percentW2.characters = 8;
    percentW2.enabled = false;

    previewGroup.add('panel', undefined, undefined, {borderStyle: 'white'}).maximumSize = [10, 10];

    var previewH1 = previewGroup.add('radiobutton', undefined, 'Preview');
    var percentH1 = previewGroup.add('edittext', undefined, STATE.ratios.h1to2.toFixed(2) + '%');
    percentH1.characters = 8;
    percentH1.enabled = false;

    previewGroup.add('panel', undefined, undefined, {borderStyle: 'gray'}).maximumSize = [100, 1];

    var previewH2 = previewGroup.add('radiobutton', undefined, 'Preview');
    var percentH2 = previewGroup.add('edittext', undefined, STATE.ratios.h2to1.toFixed(2) + '%');
    percentH2.characters = 8;
    percentH2.enabled = false;

    // ========================================
    // Options Panel
    // ========================================
    var optsPanel = dlg.add('panel', undefined, 'Transformation Options');
    optsPanel.orientation = 'column';
    optsPanel.alignChildren = ['fill', 'top'];
    optsPanel.spacing = 8;
    optsPanel.margins = 15;

    // Mode radio buttons
    var modeGroup = optsPanel.add('group');
    var modeLabel = modeGroup.add('statictext', undefined, 'Mode:');
    modeLabel.minimumSize.width = 80;
    var modeIndividual = modeGroup.add('radiobutton', undefined, 'Each Object');
    var modeGroup_btn = modeGroup.add('radiobutton', undefined, 'All as Group');

    if (STATE.config.scaleMode === 'group') {
        modeGroup_btn.value = true;
    } else {
        modeIndividual.value = true;
    }

    // Stroke checkbox
    var strokesCheck = optsPanel.add('checkbox', undefined, 'Apply to strokes and effects');
    strokesCheck.value = STATE.config.scaleStrokes;

    // ========================================
    // Buttons
    // ========================================
    var btnGroup = dlg.add('group');
    btnGroup.orientation = 'row';
    btnGroup.alignChildren = ['center', 'center'];
    btnGroup.spacing = 10;

    var applyBtn = btnGroup.add('button', undefined, 'Apply', {name: 'ok'});
    var cancelBtn = btnGroup.add('button', undefined, 'Cancel', {name: 'cancel'});

    // ========================================
    // Event Handlers
    // ========================================

    previewW1.onClick = function() {
        if (previewW1.value) {
            var mode = modeIndividual.value ? 'individual' : 'group';
            updatePreview(STATE.ratios.w1to2, mode, strokesCheck.value);
        }
    };

    previewW2.onClick = function() {
        if (previewW2.value) {
            var mode = modeIndividual.value ? 'individual' : 'group';
            updatePreview(STATE.ratios.w2to1, mode, strokesCheck.value);
        }
    };

    previewH1.onClick = function() {
        if (previewH1.value) {
            var mode = modeIndividual.value ? 'individual' : 'group';
            updatePreview(STATE.ratios.h1to2, mode, strokesCheck.value);
        }
    };

    previewH2.onClick = function() {
        if (previewH2.value) {
            var mode = modeIndividual.value ? 'individual' : 'group';
            updatePreview(STATE.ratios.h2to1, mode, strokesCheck.value);
        }
    };

    modeIndividual.onClick = function() {
        if (STATE.previewActive) {
            // Re-apply preview with new mode
            var ratio = getCurrentRatio();
            if (ratio) {
                updatePreview(ratio, 'individual', strokesCheck.value);
            }
        }
    };

    modeGroup_btn.onClick = function() {
        if (STATE.previewActive) {
            // Re-apply preview with new mode
            var ratio = getCurrentRatio();
            if (ratio) {
                updatePreview(ratio, 'group', strokesCheck.value);
            }
        }
    };

    strokesCheck.onClick = function() {
        if (STATE.previewActive) {
            // Re-apply preview with new stroke setting
            var ratio = getCurrentRatio();
            var mode = modeIndividual.value ? 'individual' : 'group';
            if (ratio) {
                updatePreview(ratio, mode, strokesCheck.value);
            }
        }
    };

    applyBtn.onClick = function() {
        // Save settings
        STATE.config.scaleStrokes = strokesCheck.value;
        STATE.config.scaleMode = modeIndividual.value ? 'individual' : 'group';
        saveSettings(STATE.config);

        dlg.close();
    };

    cancelBtn.onClick = function() {
        // Undo preview if active
        if (STATE.previewActive) {
            app.undo();
        }
        dlg.close();
    };

    // Helper function to get currently selected ratio
    function getCurrentRatio() {
        if (previewW1.value) return STATE.ratios.w1to2;
        if (previewW2.value) return STATE.ratios.w2to1;
        if (previewH1.value) return STATE.ratios.h1to2;
        if (previewH2.value) return STATE.ratios.h2to1;
        return null;
    }

    STATE.dialog = dlg;
    dlg.show();

    // Show instruction after dialog is shown
    alert('Select objects to scale\nThen click a Preview button to see the scale applied\n\nAdjust mode and options as needed\nClick Apply to finalize or Cancel to revert');
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Convert points to millimeters for display
 */
function toMM(points) {
    var mm = AIS.Units.convert(points, 'pt', 'mm');
    return mm.toFixed(2);
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

        // Merge with defaults to handle new settings
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
        // Silent fail - settings are not critical
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
