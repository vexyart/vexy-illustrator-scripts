/**
 * Add Margins
 * @version 1.0.0
 * @description Add margins or padding to artboards with guides, rectangles, or artboard resize
 * @author Christian Condamine (modernized for AIS)
 * @license MIT
 * @category Artboards
 * @requires Illustrator CS4 or higher
 *
 * Features:
 * - Apply to all or custom artboard ranges
 * - Uniform, directional, or alternate (facing pages) margins
 * - Create as guides, rectangles, or resize artboards
 * - Live preview with undo
 * - Unit support: mm, pixels, inches
 *
 * Original: Based on MulaRahul's addMargin.jsx and AddPadding.jsx
 * Extended by Christian Condamine with live preview
 * Modernized to use AIS library while preserving all functionality
 */

#include "../lib/core.jsx"

//@target illustrator
#targetengine 'main'
app.preferences.setBooleanPreference('ShowExternalJSXWarning', false);

(function() {
    if (!app.documents.length) {
        alert('No documents\nOpen a document and try again');
        return;
    }

    main();
})();

// ============================================================================
// CONFIGURATION
// ============================================================================

var CFG = {
    layerName: 'Margins',
    defaultMargin: 15,
    defaultUnit: 'mm',
    previewUndo: false
};

var UNITS = {
    mm: { multiplier: 2.834645, label: 'mm' },
    px: { multiplier: 1, label: 'pixels' },
    in: { multiplier: 72, label: 'inches' }
};

var marginLayer;

// ============================================================================
// MAIN FUNCTION
// ============================================================================

function main() {
    var dialog = showDialog();

    dialog.createBtn.onClick = function() {
        if (CFG.previewUndo) {
            app.undo();
        }
        var config = getConfiguration(dialog);
        renderMargins(config);
        dialog.close();
    }

    dialog.cancelBtn.onClick = function() {
        if (CFG.previewUndo) {
            app.undo();
        }
        if (marginLayer && marginLayer.groupItems.length === 0) {
            marginLayer.remove();
        }
        dialog.close();
    }

    // Initialize preview
    updatePreview(dialog);

    dialog.show();
}

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Get configuration from dialog
 * @param {Object} dialog - Dialog window
 * @returns {Object} Configuration object
 */
function getConfiguration(dialog) {
    var artboards = dialog.allArtboards.value ? 'all' : dialog.customArtboards.text;

    var marginType = 'uniform';
    if (dialog.directional.value) marginType = 'directional';
    else if (dialog.alternate.value) marginType = 'alternate';

    var outputType = 'guides';
    if (dialog.asRectangle.value) outputType = 'rectangle';
    else if (dialog.asMargin.value) outputType = 'margin';

    return {
        artboards: artboards,
        marginType: marginType,
        outputType: outputType,
        unit: dialog.unitList.selection.text,
        margins: {
            all: parseFloat(dialog.marginAll.text),
            top: parseFloat(dialog.topMargin.text),
            right: parseFloat(dialog.rightMargin.text),
            left: parseFloat(dialog.leftMargin.text),
            bottom: parseFloat(dialog.bottomMargin.text),
            oddLeft: parseFloat(dialog.oddLeftMargin.text),
            oddRight: parseFloat(dialog.oddRightMargin.text),
            evenLeft: parseFloat(dialog.evenLeftMargin.text),
            evenRight: parseFloat(dialog.evenRightMargin.text)
        }
    };
}

// ============================================================================
// RENDERING
// ============================================================================

/**
 * Render margins based on configuration
 * @param {Object} config - Configuration object
 */
function renderMargins(config) {
    var doc = app.activeDocument;
    var artboardIndices = getArtboardIndices(config.artboards, doc.artboards.length);

    // Create layer for guides/rectangles (not needed for margin mode)
    if (config.outputType !== 'margin') {
        createMarginLayer();
    }

    for (var i = 0; i < artboardIndices.length; i++) {
        var idx = artboardIndices[i];
        addMarginToArtboard(doc.artboards, idx, config);
    }

    // Rearrange artboards if in margin mode
    if (config.outputType === 'margin') {
        var margins = calculateMargins(0, config);
        doc.rearrangeArtboards(
            DocumentArtboardLayout.GridByCol,
            1,
            margins.left,
            true
        );
    }
}

/**
 * Add margin to a specific artboard
 * @param {Object} artboards - Artboards collection
 * @param {Number} idx - Artboard index
 * @param {Object} config - Configuration object
 */
function addMarginToArtboard(artboards, idx, config) {
    var margins = calculateMargins(idx, config);
    var rect = artboards[idx].artboardRect;
    var left = rect[0];
    var top = rect[1];
    var right = rect[2];
    var bottom = rect[3];

    if (config.outputType === 'margin') {
        // Resize artboard
        artboards[idx].artboardRect = [
            left - margins.left,
            top + margins.top,
            right + margins.right,
            bottom - margins.bottom
        ];
    } else {
        // Create rectangle for margin area
        var width = Math.abs(right - left) - (margins.left + margins.right);
        var height = Math.abs(top - bottom) - (margins.top + margins.bottom);

        var marginRect = marginLayer.pathItems.rectangle(
            top - margins.top,
            left + margins.left,
            width,
            height
        );

        marginRect.name = (idx + 1).toString();
        marginRect.filled = false;

        if (config.outputType === 'guides') {
            marginRect.guides = true;
        } else {
            marginRect.stroked = true;
            marginRect.strokeColor = createBlackColor();
        }
    }
}

/**
 * Calculate margins for a specific artboard
 * @param {Number} idx - Artboard index
 * @param {Object} config - Configuration object
 * @returns {Object} Calculated margins in pixels
 */
function calculateMargins(idx, config) {
    var margins = {
        left: config.margins.all,
        top: config.margins.all,
        right: config.margins.all,
        bottom: config.margins.all
    };

    // Directional margins
    if (config.marginType === 'directional') {
        margins.left = config.margins.left;
        margins.top = config.margins.top;
        margins.right = config.margins.right;
        margins.bottom = config.margins.bottom;
    }

    // Alternate (facing pages)
    if (config.marginType === 'alternate') {
        if ((idx + 1) % 2 === 0) {
            // Even artboard number (odd index)
            margins.left = config.margins.evenLeft;
            margins.right = config.margins.evenRight;
        } else {
            // Odd artboard number (even index)
            margins.left = config.margins.oddLeft;
            margins.right = config.margins.oddRight;
        }
    }

    // Convert to pixels
    var multiplier = UNITS[getUnitKey(config.unit)].multiplier;
    margins.left *= multiplier;
    margins.top *= multiplier;
    margins.right *= multiplier;
    margins.bottom *= multiplier;

    return margins;
}

/**
 * Get unit key from unit label
 * @param {String} unitLabel - Unit label
 * @returns {String} Unit key
 */
function getUnitKey(unitLabel) {
    for (var key in UNITS) {
        if (UNITS[key].label === unitLabel) {
            return key;
        }
    }
    return 'mm';
}

// ============================================================================
// ARTBOARD RANGE PARSING
// ============================================================================

/**
 * Get artboard indices from range string or 'all'
 * @param {String} range - Range string (e.g., "1, 3, 5-8") or 'all'
 * @param {Number} totalArtboards - Total number of artboards
 * @returns {Array} Array of artboard indices (0-based)
 */
function getArtboardIndices(range, totalArtboards) {
    if (range === 'all') {
        var indices = [];
        for (var i = 0; i < totalArtboards; i++) {
            indices.push(i);
        }
        return indices;
    }

    return parseInputRange(range);
}

/**
 * Parse input range string
 * @param {String} query - Range string (e.g., "1, 3, 5-8")
 * @returns {Array} Array of artboard indices (0-based)
 */
function parseInputRange(query) {
    var parts = query.split(',');
    var indices = [];

    for (var i = 0; i < parts.length; i++) {
        var part = parts[i].replace(/\s/g, '');

        if (part.indexOf('-') !== -1) {
            // Range (e.g., "5-8")
            var rangeParts = part.split('-');
            var start = parseInt(rangeParts[0]);
            var end = parseInt(rangeParts[1]);

            for (var j = start; j <= end; j++) {
                indices.push(j - 1); // Convert to 0-based
            }
        } else {
            // Single number
            indices.push(parseInt(part) - 1); // Convert to 0-based
        }
    }

    return indices;
}

// ============================================================================
// LAYER MANAGEMENT
// ============================================================================

/**
 * Create or find margin layer
 */
function createMarginLayer() {
    var doc = app.activeDocument;

    for (var i = 0; i < doc.layers.length; i++) {
        if (doc.layers[i].name === CFG.layerName) {
            marginLayer = doc.layers[i];
            marginLayer.locked = false;
            marginLayer.visible = true;
            doc.activeLayer = marginLayer;
            return;
        }
    }

    marginLayer = doc.layers.add();
    marginLayer.name = CFG.layerName;
    doc.activeLayer = marginLayer;
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Create black CMYK color
 * @returns {CMYKColor} Black color
 */
function createBlackColor() {
    var color = new CMYKColor();
    color.cyan = 0;
    color.magenta = 0;
    color.yellow = 0;
    color.black = 100;
    return color;
}

/**
 * Update preview
 * @param {Object} dialog - Dialog window
 */
function updatePreview(dialog) {
    if (CFG.previewUndo) {
        app.undo();
    } else {
        CFG.previewUndo = true;
        app.redraw();
    }

    var config = getConfiguration(dialog);
    renderMargins(config);
    app.redraw();
}

// ============================================================================
// USER INTERFACE
// ============================================================================

/**
 * Show margin dialog
 * @returns {Object} Dialog window
 */
function showDialog() {
    var dialog = new Window('dialog');
    dialog.text = 'Add Margins or Padding';
    dialog.alignChildren = ['fill', 'fill'];

    // Artboard selection
    var artboardPanel = dialog.add('panel', undefined, 'Artboards');
    artboardPanel.orientation = 'row';
    artboardPanel.margins = 15;
    artboardPanel.alignChildren = ['fill', 'center'];

    var allArtboards = artboardPanel.add('radiobutton', undefined, 'All');
    allArtboards.value = true;
    allArtboards.onClick = function() {
        customArtboards.enabled = false;
        updatePreview(dialog);
    };

    var customOption = artboardPanel.add('radiobutton', undefined, 'Custom');
    customOption.onClick = function() {
        customArtboards.enabled = true;
        updatePreview(dialog);
    };

    var customArtboards = artboardPanel.add('edittext', undefined, '1, 3, 5-8');
    customArtboards.enabled = false;
    customArtboards.minimumSize = [100, 0];
    customArtboards.onChange = function() {
        updatePreview(dialog);
    };

    // Margin settings
    var marginPanel = dialog.add('panel', undefined, 'Margins');
    marginPanel.margins = 15;
    marginPanel.alignment = ['fill', 'center'];
    marginPanel.alignChildren = ['left', 'center'];

    var marginRadioGroup = marginPanel.add('group');
    marginRadioGroup.orientation = 'column';
    marginRadioGroup.alignChildren = ['left', 'center'];

    // Uniform margins
    var uniformGroup = marginRadioGroup.add('group');
    var uniformMargins = uniformGroup.add('radiobutton', undefined, 'Uniform');
    uniformMargins.value = true;
    uniformMargins.onClick = function() {
        topMargin.enabled = false;
        leftMargin.enabled = false;
        rightMargin.enabled = false;
        bottomMargin.enabled = false;
        marginAll.enabled = true;
        updatePreview(dialog);
    };

    var marginAll = uniformGroup.add('edittext', undefined, CFG.defaultMargin.toString());
    marginAll.minimumSize = [60, 0];
    marginAll.onChange = function() {
        updatePreview(dialog);
    };

    var unitList = uniformGroup.add('dropdownlist', undefined, [
        UNITS.mm.label,
        UNITS.px.label,
        UNITS.in.label
    ]);
    unitList.selection = 0;
    unitList.onChange = function() {
        updatePreview(dialog);
    };

    // Directional margins
    var directional = marginRadioGroup.add('radiobutton', undefined, 'Directional');
    directional.onClick = function() {
        topMargin.enabled = true;
        leftMargin.enabled = true;
        rightMargin.enabled = true;
        bottomMargin.enabled = true;
        marginAll.enabled = false;
        updatePreview(dialog);
    };

    var directionalPanel = marginPanel.add('group');
    directionalPanel.orientation = 'row';
    directionalPanel.alignment = ['left', 'center'];

    // Top
    var topGroup = directionalPanel.add('group');
    topGroup.orientation = 'column';
    topGroup.alignChildren = ['left', 'center'];
    topGroup.add('statictext', undefined, 'Top');
    var topMargin = topGroup.add('edittext', undefined, '10');
    topMargin.minimumSize = [50, 0];
    topMargin.onChange = function() {
        updatePreview(dialog);
    };
    topMargin.enabled = false;

    // Right
    var rightGroup = directionalPanel.add('group');
    rightGroup.orientation = 'column';
    rightGroup.alignChildren = ['left', 'center'];
    rightGroup.add('statictext', undefined, 'Right');
    var rightMargin = rightGroup.add('edittext', undefined, '10');
    rightMargin.minimumSize = [50, 0];
    rightMargin.onChange = function() {
        updatePreview(dialog);
    };
    rightMargin.enabled = false;

    // Left
    var leftGroup = directionalPanel.add('group');
    leftGroup.orientation = 'column';
    leftGroup.alignChildren = ['left', 'center'];
    leftGroup.add('statictext', undefined, 'Left');
    var leftMargin = leftGroup.add('edittext', undefined, '10');
    leftMargin.minimumSize = [50, 0];
    leftMargin.onChange = function() {
        updatePreview(dialog);
    };
    leftMargin.enabled = false;

    // Bottom
    var bottomGroup = directionalPanel.add('group');
    bottomGroup.orientation = 'column';
    bottomGroup.alignChildren = ['left', 'center'];
    bottomGroup.add('statictext', undefined, 'Bottom');
    var bottomMargin = bottomGroup.add('edittext', undefined, '10');
    bottomMargin.minimumSize = [50, 0];
    bottomMargin.onChange = function() {
        updatePreview(dialog);
    };
    bottomMargin.enabled = false;

    // Facing pages
    var facingPanel = dialog.add('panel', undefined, 'Facing Pages');
    facingPanel.margins = 15;
    facingPanel.alignChildren = ['left', 'center'];

    var facingGroup = facingPanel.add('group');
    facingGroup.orientation = 'row';

    var similar = facingGroup.add('radiobutton', undefined, 'Similar');
    similar.value = true;
    similar.onClick = function() {
        oddPanel.enabled = false;
        evenPanel.enabled = false;
        updatePreview(dialog);
    };

    var alternate = facingGroup.add('radiobutton', undefined, 'Alternate');
    alternate.onClick = function() {
        oddPanel.enabled = true;
        evenPanel.enabled = true;
        updatePreview(dialog);
    };

    // Odd pages
    var oddPanel = facingPanel.add('panel', undefined, 'Odd Pages');
    oddPanel.orientation = 'row';
    oddPanel.margins = 15;
    oddPanel.alignment = ['fill', 'center'];
    oddPanel.alignChildren = ['fill', 'center'];
    oddPanel.enabled = false;

    var oddLeftGroup = oddPanel.add('group');
    oddLeftGroup.add('statictext', undefined, 'Left');
    var oddLeftMargin = oddLeftGroup.add('edittext', undefined, '10');
    oddLeftMargin.minimumSize = [40, 0];
    oddLeftMargin.onChange = function() {
        updatePreview(dialog);
    };

    var oddRightGroup = oddPanel.add('group');
    oddRightGroup.add('statictext', undefined, 'Right');
    var oddRightMargin = oddRightGroup.add('edittext', undefined, '10');
    oddRightMargin.minimumSize = [40, 0];
    oddRightMargin.onChange = function() {
        updatePreview(dialog);
    };

    // Even pages
    var evenPanel = facingPanel.add('panel', undefined, 'Even Pages');
    evenPanel.orientation = 'row';
    evenPanel.margins = 15;
    evenPanel.alignment = ['fill', 'center'];
    evenPanel.alignChildren = ['fill', 'center'];
    evenPanel.enabled = false;

    var evenLeftGroup = evenPanel.add('group');
    evenLeftGroup.add('statictext', undefined, 'Left');
    var evenLeftMargin = evenLeftGroup.add('edittext', undefined, '10');
    evenLeftMargin.minimumSize = [40, 0];
    evenLeftMargin.onChange = function() {
        updatePreview(dialog);
    };

    var evenRightGroup = evenPanel.add('group');
    evenRightGroup.add('statictext', undefined, 'Right');
    var evenRightMargin = evenRightGroup.add('edittext', undefined, '10');
    evenRightMargin.minimumSize = [40, 0];
    evenRightMargin.onChange = function() {
        updatePreview(dialog);
    };

    // Output type
    var typePanel = dialog.add('panel', undefined, 'Create');
    typePanel.orientation = 'row';
    typePanel.margins = 15;
    typePanel.alignChildren = ['left', 'center'];

    var asRectangle = typePanel.add('radiobutton', undefined, 'Rectangle');
    asRectangle.onClick = function() {
        if (CFG.previewUndo) {
            CFG.previewUndo = false;
        }
        updatePreview(dialog);
        updatePreview(dialog);
    };

    var asGuide = typePanel.add('radiobutton', undefined, 'Guides');
    asGuide.value = true;
    asGuide.onClick = function() {
        if (CFG.previewUndo) {
            CFG.previewUndo = false;
        }
        updatePreview(dialog);
        updatePreview(dialog);
    };

    var asMargin = typePanel.add('radiobutton', undefined, 'Resize Artboards');
    asMargin.onClick = function() {
        CFG.previewUndo = true;
        updatePreview(dialog);
    };

    // Buttons
    var buttonGroup = dialog.add('group');

    var createBtn = buttonGroup.add('button', undefined, 'Create', { name: 'ok' });
    createBtn.alignment = ['fill', 'center'];

    var cancelBtn = buttonGroup.add('button', undefined, 'Cancel', { name: 'cancel' });

    // Attach UI elements to dialog object
    dialog.allArtboards = allArtboards;
    dialog.customArtboards = customArtboards;
    dialog.uniformMargins = uniformMargins;
    dialog.directional = directional;
    dialog.similar = similar;
    dialog.alternate = alternate;
    dialog.marginAll = marginAll;
    dialog.topMargin = topMargin;
    dialog.rightMargin = rightMargin;
    dialog.leftMargin = leftMargin;
    dialog.bottomMargin = bottomMargin;
    dialog.oddLeftMargin = oddLeftMargin;
    dialog.oddRightMargin = oddRightMargin;
    dialog.evenLeftMargin = evenLeftMargin;
    dialog.evenRightMargin = evenRightMargin;
    dialog.asRectangle = asRectangle;
    dialog.asGuide = asGuide;
    dialog.asMargin = asMargin;
    dialog.unitList = unitList;
    dialog.createBtn = createBtn;
    dialog.cancelBtn = cancelBtn;

    return dialog;
}

// ============================================================================
// ENTRY POINT (handled by IIFE at top)
// ============================================================================
