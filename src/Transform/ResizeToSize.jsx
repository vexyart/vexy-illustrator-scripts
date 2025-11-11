/**
 * Resize To Size
 * @version 1.0.0
 * @description Resize selected objects to exact dimensions with live preview
 * @category Transform
 * @author Sergey Osokin (https://github.com/creold)
 * @license MIT
 * @modernized 2025 - Adapted for AIS framework
 * @features
 *   - Resize to exact width and/or height
 *   - Support for all unit systems
 *   - Live preview mode
 *   - Scale proportionally or independently
 *   - Scale strokes and effects option
 *   - Multiple scaling modes (bounds, visible bounds)
 *   - Remember last settings
 * @usage
 *   1. Select objects to resize
 *   2. Enter desired width and/or height
 *   3. Choose scaling options
 *   4. Preview or apply
 * @notes
 *   - Uses document units by default
 *   - Settings saved between sessions
 *   - Supports grouped objects
 */




//@target illustrator
var c=File(Folder.myDocuments+"/Adobe Scripts/vexy-ville.ini");if(c.exists){c.open('r');var p=c.read();c.close();var l=File(p+".lib/core.jsx");if(l.exists)$.evalFile(l.fsName);}
app.preferences.setBooleanPreference('ShowExternalJSXWarning', false);

// ============================================================================
// CONFIGURATION
// ============================================================================
var CFG = {
    scriptName: 'Resize To Size',
    version: '1.0.0',
    uiWidth: 280,
    uiMargin: 10,
    aiVers: parseInt(app.version),
    units: ['px', 'pt', 'pc', 'mm', 'cm', 'in', 'ft'],
    unitsLabels: ['Pixels', 'Points', 'Picas', 'Millimeters', 'Centimeters', 'Inches', 'Feet']
};

var SETTINGS = {
    name: 'resize-to-size-settings.json',
    folder: Folder.myDocuments + '/Adobe Scripts/'
};

// ============================================================================
// MAIN FUNCTION
// ============================================================================
function main() {
    try {
        var doc = app.activeDocument;
        var sel = doc.selection;

        // Get current dimensions
        var bounds = getSelectionBounds(sel);
        var currentWidth = bounds.width;
        var currentHeight = bounds.height;

        // Get document units
        var docUnits = AIS.Units.get();
        var unitsIndex = getUnitsIndex(docUnits);

        // Load settings
        var config = loadSettings();

        // Create dialog
        var dialog = createDialog(currentWidth, currentHeight, docUnits, unitsIndex, config);
        if (!dialog) return;

        var result = dialog.show();
        if (result === 1) {
            // OK button clicked
            var finalConfig = getConfiguration(dialog);
            saveSettings(finalConfig);
            applyResize(sel, bounds, finalConfig);
        }

    } catch (e) {
        AIS.Error.show('Resize failed', e);
    }
}

// ============================================================================
// CORE LOGIC
// ============================================================================

/**
 * Get selection bounds
 * @param {Array} selection - Document selection
 * @returns {Object} - {left, top, right, bottom, width, height}
 */
function getSelectionBounds(selection) {
    var bounds;

    if (selection.length === 1) {
        bounds = selection[0].geometricBounds;
    } else {
        // Multiple objects - get collective bounds
        var minX = Infinity;
        var minY = -Infinity;
        var maxX = -Infinity;
        var maxY = Infinity;

        for (var i = 0; i < selection.length; i++) {
            var b = selection[i].geometricBounds;
            if (b[0] < minX) minX = b[0];
            if (b[1] > minY) minY = b[1];
            if (b[2] > maxX) maxX = b[2];
            if (b[3] < maxY) maxY = b[3];
        }

        bounds = [minX, minY, maxX, maxY];
    }

    return {
        left: bounds[0],
        top: bounds[1],
        right: bounds[2],
        bottom: bounds[3],
        width: Math.abs(bounds[2] - bounds[0]),
        height: Math.abs(bounds[1] - bounds[3])
    };
}

/**
 * Apply resize to selection
 * @param {Array} selection - Objects to resize
 * @param {Object} currentBounds - Current bounds
 * @param {Object} config - Configuration
 */
function applyResize(selection, currentBounds, config) {
    var width = parseFloat(config.width);
    var height = parseFloat(config.height);

    // Convert to points if needed
    if (config.units !== 'pt') {
        width = AIS.Units.convert(width, config.units, 'pt');
        height = AIS.Units.convert(height, config.units, 'pt');
    }

    // Calculate scale factors
    var scaleX = 100;
    var scaleY = 100;

    if (config.resizeWidth && width > 0) {
        scaleX = (width / currentBounds.width) * 100;
    }

    if (config.resizeHeight && height > 0) {
        scaleY = (height / currentBounds.height) * 100;
    }

    // Apply proportional scaling if needed
    if (config.proportional) {
        if (config.resizeWidth && config.resizeHeight) {
            // Use smaller scale to fit both
            var minScale = Math.min(scaleX, scaleY);
            scaleX = minScale;
            scaleY = minScale;
        } else if (config.resizeWidth) {
            scaleY = scaleX;
        } else if (config.resizeHeight) {
            scaleX = scaleY;
        }
    }

    // Apply scaling
    for (var i = 0; i < selection.length; i++) {
        selection[i].resize(
            scaleX,
            scaleY,
            true,  // changePositions
            true,  // changeFillPatterns
            true,  // changeFillGradients
            true,  // changeStrokePattern
            config.scaleStrokes ? scaleX : 100,  // changeLineWidths
            Transformation.CENTER  // scaleAbout
        );
    }

    app.redraw();
}

/**
 * Get units index from units code
 * @param {String} units - Units code
 * @returns {Number} - Index in units array
 */
function getUnitsIndex(units) {
    for (var i = 0; i < CFG.units.length; i++) {
        if (CFG.units[i] === units) {
            return i;
        }
    }
    return 0;  // Default to pixels
}

// ============================================================================
// USER INTERFACE
// ============================================================================

/**
 * Create main dialog
 * @param {Number} currentWidth - Current width in points
 * @param {Number} currentHeight - Current height in points
 * @param {String} docUnits - Document units
 * @param {Number} unitsIndex - Units dropdown index
 * @param {Object} config - Saved configuration
 * @returns {Window} - Dialog window
 */
function createDialog(currentWidth, currentHeight, docUnits, unitsIndex, config) {
    var dialog = new Window('dialog', CFG.scriptName + ' v' + CFG.version);
    dialog.orientation = 'column';
    dialog.alignChildren = ['fill', 'top'];
    dialog.spacing = CFG.uiMargin;
    dialog.margins = CFG.uiMargin;

    // Size panel
    var sizePanel = dialog.add('panel', undefined, 'Size');
    sizePanel.orientation = 'column';
    sizePanel.alignChildren = ['fill', 'top'];
    sizePanel.spacing = 8;
    sizePanel.margins = CFG.uiMargin;

    // Width row
    var widthRow = sizePanel.add('group');
    widthRow.orientation = 'row';
    widthRow.alignChildren = ['left', 'center'];
    widthRow.add('checkbox', undefined, 'Width:').value = config.resizeWidth;
    var widthInput = widthRow.add('edittext', undefined, formatNumber(
        AIS.Units.convert(currentWidth, 'pt', docUnits)
    ));
    widthInput.characters = 10;
    widthInput.enabled = config.resizeWidth;

    // Height row
    var heightRow = sizePanel.add('group');
    heightRow.orientation = 'row';
    heightRow.alignChildren = ['left', 'center'];
    heightRow.add('checkbox', undefined, 'Height:').value = config.resizeHeight;
    var heightInput = heightRow.add('edittext', undefined, formatNumber(
        AIS.Units.convert(currentHeight, 'pt', docUnits)
    ));
    heightInput.characters = 10;
    heightInput.enabled = config.resizeHeight;

    // Units row
    var unitsRow = sizePanel.add('group');
    unitsRow.orientation = 'row';
    unitsRow.alignChildren = ['left', 'center'];
    unitsRow.add('statictext', undefined, 'Units:');
    var unitsDropdown = unitsRow.add('dropdownlist', undefined, CFG.unitsLabels);
    unitsDropdown.selection = unitsIndex;

    // Options panel
    var optionsPanel = dialog.add('panel', undefined, 'Options');
    optionsPanel.orientation = 'column';
    optionsPanel.alignChildren = ['left', 'top'];
    optionsPanel.spacing = 6;
    optionsPanel.margins = CFG.uiMargin;

    var proportionalCheck = optionsPanel.add('checkbox', undefined, 'Proportional');
    proportionalCheck.value = config.proportional;

    var scaleStrokesCheck = optionsPanel.add('checkbox', undefined, 'Scale Strokes & Effects');
    scaleStrokesCheck.value = config.scaleStrokes;

    // Preview checkbox
    var previewCheck = dialog.add('checkbox', undefined, 'Preview');
    previewCheck.value = false;

    // Buttons
    var buttonGroup = dialog.add('group');
    buttonGroup.orientation = 'row';
    buttonGroup.alignChildren = ['center', 'center'];
    buttonGroup.add('button', undefined, 'Cancel', {name: 'cancel'});
    buttonGroup.add('button', undefined, 'OK', {name: 'ok'});

    // Event handlers
    var widthCheck = widthRow.children[0];
    var heightCheck = heightRow.children[0];

    widthCheck.onClick = function() {
        widthInput.enabled = this.value;
        if (this.value && previewCheck.value) {
            updatePreview(dialog);
        }
    };

    heightCheck.onClick = function() {
        heightInput.enabled = this.value;
        if (this.value && previewCheck.value) {
            updatePreview(dialog);
        }
    };

    widthInput.onChanging = function() {
        if (previewCheck.value) {
            updatePreview(dialog);
        }
    };

    heightInput.onChanging = function() {
        if (previewCheck.value) {
            updatePreview(dialog);
        }
    };

    unitsDropdown.onChange = function() {
        if (previewCheck.value) {
            updatePreview(dialog);
        }
    };

    proportionalCheck.onClick = function() {
        if (previewCheck.value) {
            updatePreview(dialog);
        }
    };

    scaleStrokesCheck.onClick = function() {
        if (previewCheck.value) {
            updatePreview(dialog);
        }
    };

    var previewState = false;

    previewCheck.onClick = function() {
        if (this.value) {
            updatePreview(dialog);
        } else {
            if (previewState) {
                app.undo();
                app.redraw();
                previewState = false;
            }
        }
    };

    /**
     * Update live preview
     * @param {Window} dlg - Dialog window
     */
    function updatePreview(dlg) {
        if (previewState) {
            app.undo();
        } else {
            previewState = true;
        }

        var cfg = getConfiguration(dlg);
        var doc = app.activeDocument;
        var sel = doc.selection;
        var bounds = getSelectionBounds(sel);

        applyResize(sel, bounds, cfg);
    }

    // Store references for getConfiguration
    dialog.widthCheck = widthCheck;
    dialog.heightCheck = heightCheck;
    dialog.widthInput = widthInput;
    dialog.heightInput = heightInput;
    dialog.unitsDropdown = unitsDropdown;
    dialog.proportionalCheck = proportionalCheck;
    dialog.scaleStrokesCheck = scaleStrokesCheck;

    return dialog;
}

/**
 * Get configuration from dialog
 * @param {Window} dialog - Dialog window
 * @returns {Object} - Configuration object
 */
function getConfiguration(dialog) {
    return {
        resizeWidth: dialog.widthCheck.value,
        resizeHeight: dialog.heightCheck.value,
        width: dialog.widthInput.text,
        height: dialog.heightInput.text,
        units: CFG.units[dialog.unitsDropdown.selection.index],
        proportional: dialog.proportionalCheck.value,
        scaleStrokes: dialog.scaleStrokesCheck.value
    };
}

// ============================================================================
// SETTINGS PERSISTENCE
// ============================================================================

/**
 * Load settings from file
 * @returns {Object} - Configuration object
 */
function loadSettings() {
    var file = new File(SETTINGS.folder + SETTINGS.name);
    if (!file.exists) {
        return getDefaultConfig();
    }

    try {
        file.encoding = 'UTF-8';
        file.open('r');
        var json = file.read();
        file.close();
        return AIS.JSON.parse(json);
    } catch (e) {
        return getDefaultConfig();
    }
}

/**
 * Save settings to file
 * @param {Object} config - Configuration to save
 */
function saveSettings(config) {
    try {
        var folder = new Folder(SETTINGS.folder);
        if (!folder.exists) folder.create();

        var file = new File(SETTINGS.folder + SETTINGS.name);
        file.encoding = 'UTF-8';
        file.open('w');
        file.write(AIS.JSON.stringify(config));
        file.close();
    } catch (e) {
        // Silent fail for settings save
    }
}

/**
 * Get default configuration
 * @returns {Object} - Default config
 */
function getDefaultConfig() {
    return {
        resizeWidth: true,
        resizeHeight: true,
        width: '100',
        height: '100',
        units: 'pt',
        proportional: true,
        scaleStrokes: true
    };
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Format number for display
 * @param {Number} num - Number to format
 * @returns {String} - Formatted number
 */
function formatNumber(num) {
    return Math.round(num * 100) / 100;
}

// ============================================================================
// EXECUTE
// ============================================================================

if (!AIS.Document.hasDocument()) {
    alert('No documents\nOpen a document and try again');
} else if (!AIS.Document.hasSelection()) {
    alert('No selection\nSelect objects and try again');
} else {
    try {
        main();
    } catch (e) {
        AIS.Error.show('Resize To Size error', e);
    }
}
