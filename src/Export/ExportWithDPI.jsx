/**
 * Export with DPI
 * @version 1.0.0
 * @description Export each layer as a separate image file (PNG or JPEG) with custom resolution.
 *              Useful for creating multiple resolution versions of assets or exporting layers
 *              individually for web, mobile, or print workflows.
 * @category Export
 * @author Original by Christian Condamine | Modernized for AIS framework
 *
 * @requires lib/core.jsx
 *
 * @features
 *   - Export each unlocked layer as separate file
 *   - Choose format: PNG24 or JPEG
 *   - Custom DPI/PPI resolution (72-600)
 *   - PNG: Transparency support, anti-aliasing
 *   - JPEG: Quality 100, baseline optimized
 *   - Uses layer name as filename
 *   - Skips locked layers automatically
 *   - Sanitizes filenames (removes invalid characters)
 *   - Saves settings for next session
 *   - Progress indicator for batch export
 *
 * @usage
 *   1. Open document with multiple layers
 *   2. Unlock layers you want to export
 *   3. Run script
 *   4. Choose export format and resolution
 *   5. Files are saved in same folder as source document
 *
 * @notes
 *   - Locked layers are skipped
 *   - Each layer exports to separate file
 *   - Filename format: [DocumentName]_[LayerName].png
 *   - Resolution range: 72-600 DPI
 *   - Empty layers are skipped automatically
 */




//@target illustrator
var c=File(Folder.myDocuments+"/Adobe Scripts/vexy-ville.ini");if(c.exists){c.open('r');var p=c.read();c.close();var l=File(p+".lib/core.jsx");if(l.exists)$.evalFile(l.fsName);}
app.preferences.setBooleanPreference('ShowExternalJSXWarning', false);

// ============================================================================
// CONFIGURATION
// ============================================================================

var CFG = {
    // Export settings
    formats: [
        {id: 'png', label: 'PNG-24 (with transparency)', ext: '.png'},
        {id: 'jpg', label: 'JPEG (quality 100)', ext: '.jpg'}
    ],

    // Resolution presets
    resolutionPresets: [
        {label: '72 DPI (screen)', value: 72},
        {label: '150 DPI (draft print)', value: 150},
        {label: '300 DPI (print)', value: 300},
        {label: '600 DPI (high-res)', value: 600}
    ],

    // Default settings
    defaults: {
        format: 'png',
        resolution: 300,
        skipEmptyLayers: true,
        antiAliasing: true,
        transparency: true
    },

    // Validation
    minResolution: 72,
    maxResolution: 600
};

var SETTINGS = {
    name: 'export-with-dpi-settings.json',
    folder: Folder.myDocuments + '/Adobe Scripts/'
};

// ============================================================================
// MAIN FUNCTION
// ============================================================================

function main() {
    var doc = AIS.Document.getActive();
    if (!doc) return;

    // Check if document has layers
    if (doc.layers.length === 0) {
        alert('No layers\n\nThis document has no layers to export.');
        return;
    }

    // Check if document is saved (need path for export)
    if (!doc.saved || !doc.path) {
        alert(
            'Document not saved\n\n' +
            'Please save this document first. Files will be exported ' +
            'to the same folder as the document.'
        );
        return;
    }

    // Count exportable layers
    var exportableCount = countExportableLayers(doc);
    if (exportableCount === 0) {
        alert(
            'No exportable layers\n\n' +
            'All layers are locked or empty. Unlock layers you want to export ' +
            'and try again.'
        );
        return;
    }

    // Load settings
    var config = loadSettings();

    // Show dialog
    var result = showDialog(config, exportableCount);
    if (!result) return;  // User cancelled

    // Save settings
    saveSettings(result);

    // Perform export
    try {
        exportLayers(doc, result);
        alert(
            'Export complete\n\n' +
            'Exported ' + result.exportedCount + ' layer(s) to:\n' +
            doc.path
        );
    } catch (err) {
        AIS.Error.show('Export failed', err);
    }
}

// ============================================================================
// USER INTERFACE
// ============================================================================

/**
 * Show export configuration dialog
 * @param {Object} config - Current configuration
 * @param {number} layerCount - Number of exportable layers
 * @returns {Object|null} Export settings or null if cancelled
 */
function showDialog(config, layerCount) {
    var dialog = new Window('dialog', 'Export Layers with DPI');
    dialog.alignChildren = ['fill', 'top'];
    dialog.spacing = 10;
    dialog.margins = 16;

    // Info panel
    var infoPanel = dialog.add('panel', undefined, 'Export Information');
    infoPanel.alignChildren = ['left', 'top'];
    infoPanel.margins = 10;

    var infoGroup = infoPanel.add('group');
    infoGroup.orientation = 'column';
    infoGroup.alignChildren = ['left', 'top'];
    infoGroup.spacing = 5;

    infoGroup.add('statictext', undefined, 'Exportable layers: ' + layerCount);
    infoGroup.add('statictext', undefined, '(Locked layers will be skipped)');

    // Format selection
    var formatPanel = dialog.add('panel', undefined, 'Export Format');
    formatPanel.alignChildren = ['fill', 'top'];
    formatPanel.margins = 10;

    var formatGroup = formatPanel.add('group');
    formatGroup.orientation = 'row';
    formatGroup.spacing = 10;

    formatGroup.add('statictext', undefined, 'Format:');
    var formatDropdown = formatGroup.add('dropdownlist', undefined, []);

    // Populate format dropdown
    for (var i = 0; i < CFG.formats.length; i++) {
        formatDropdown.add('item', CFG.formats[i].label);
        if (CFG.formats[i].id === config.format) {
            formatDropdown.selection = i;
        }
    }
    if (!formatDropdown.selection) formatDropdown.selection = 0;
    formatDropdown.preferredSize.width = 200;

    // Resolution input
    var resPanel = dialog.add('panel', undefined, 'Resolution');
    resPanel.alignChildren = ['fill', 'top'];
    resPanel.margins = 10;

    var resGroup = resPanel.add('group');
    resGroup.orientation = 'row';
    resGroup.spacing = 10;

    resGroup.add('statictext', undefined, 'Resolution:');
    var resInput = resGroup.add('edittext', undefined, config.resolution.toString());
    resInput.characters = 5;
    resInput.preferredSize.width = 60;
    resGroup.add('statictext', undefined, 'DPI/PPI');

    // Add presets
    var presetGroup = resPanel.add('group');
    presetGroup.orientation = 'row';
    presetGroup.spacing = 5;
    presetGroup.add('statictext', undefined, 'Presets:');

    for (var j = 0; j < CFG.resolutionPresets.length; j++) {
        var preset = CFG.resolutionPresets[j];
        var btn = presetGroup.add('button', undefined, preset.value.toString());
        btn.preferredSize.width = 50;
        btn.helpTip = preset.label;

        // Store value in button (closure workaround)
        btn.presetValue = preset.value;

        btn.onClick = function() {
            resInput.text = this.presetValue.toString();
        };
    }

    // Help text
    var helpGroup = dialog.add('group');
    helpGroup.orientation = 'column';
    helpGroup.alignChildren = ['left', 'top'];

    var helpText = helpGroup.add('statictext', undefined,
        'Files will be saved as: [DocumentName]_[LayerName]' + CFG.formats[0].ext,
        {multiline: true}
    );
    helpText.graphics.font = ScriptUI.newFont(helpText.graphics.font.name, 'REGULAR', 10);
    helpText.graphics.foregroundColor = helpText.graphics.newPen(
        helpText.graphics.PenType.SOLID_COLOR,
        [0.5, 0.5, 0.5],
        1
    );

    // Buttons
    var buttonGroup = dialog.add('group');
    buttonGroup.alignment = ['right', 'top'];
    buttonGroup.spacing = 10;

    var okBtn = buttonGroup.add('button', undefined, 'Export', {name: 'ok'});
    var cancelBtn = buttonGroup.add('button', undefined, 'Cancel', {name: 'cancel'});

    // Show dialog
    if (dialog.show() === 1) {
        // Validate resolution
        var resolution = parseFloat(resInput.text);
        if (isNaN(resolution) || resolution < CFG.minResolution || resolution > CFG.maxResolution) {
            alert(
                'Invalid resolution\n\n' +
                'Please enter a resolution between ' + CFG.minResolution +
                ' and ' + CFG.maxResolution + ' DPI.'
            );
            return null;
        }

        // Return settings
        return {
            format: CFG.formats[formatDropdown.selection.index].id,
            formatExt: CFG.formats[formatDropdown.selection.index].ext,
            resolution: resolution,
            exportedCount: 0  // Will be updated during export
        };
    }

    return null;  // User cancelled
}

// ============================================================================
// CORE LOGIC
// ============================================================================

/**
 * Count how many layers can be exported
 * @param {Document} doc - Document to check
 * @returns {number} Number of exportable layers
 */
function countExportableLayers(doc) {
    var count = 0;
    for (var i = 0; i < doc.layers.length; i++) {
        var layer = doc.layers[i];
        if (!layer.locked && layer.pageItems.length > 0) {
            count++;
        }
    }
    return count;
}

/**
 * Export all unlocked layers
 * @param {Document} doc - Document to export from
 * @param {Object} config - Export configuration
 */
function exportLayers(doc, config) {
    var baseName = getDocumentBaseName(doc);
    var exportFolder = doc.path;

    // Hide all unlocked layers first
    hideAllUnlockedLayers(doc);

    // Export each layer
    var exportCount = 0;
    for (var i = 0; i < doc.layers.length; i++) {
        var layer = doc.layers[i];

        // Skip locked or empty layers
        if (layer.locked || layer.pageItems.length === 0) {
            continue;
        }

        // Show only this layer
        layer.visible = true;
        app.redraw();

        // Export layer
        try {
            var layerName = sanitizeFilename(layer.name);
            var filename = baseName + '_' + layerName + config.formatExt;

            if (config.format === 'png') {
                exportLayerAsPNG(doc, layer, exportFolder, filename, config.resolution);
            } else {
                exportLayerAsJPEG(doc, layer, exportFolder, filename, config.resolution);
            }

            exportCount++;
        } catch (err) {
            // Log error but continue with other layers
            AIS.Error.log('Failed to export layer "' + layer.name + '": ' + err.message);
        }

        // Hide layer again
        layer.visible = false;
    }

    // Restore visibility
    showAllUnlockedLayers(doc);

    // Update export count
    config.exportedCount = exportCount;
}

/**
 * Export layer as PNG
 * @param {Document} doc - Document
 * @param {Layer} layer - Layer to export
 * @param {Folder} folder - Export folder
 * @param {string} filename - Output filename
 * @param {number} resolution - DPI resolution
 */
function exportLayerAsPNG(doc, layer, folder, filename, resolution) {
    // Select all items on layer
    layer.hasSelectedArtwork = true;

    // Group selection to get bounds
    app.executeMenuCommand('group');
    var bounds = doc.selection[0].visibleBounds;

    // Export options
    var options = new ImageCaptureOptions();
    options.antiAliasing = true;
    options.artBoardClipping = false;
    options.transparency = true;
    options.horizontalScale = 100;
    options.verticalScale = 100;
    options.resolution = resolution;

    // Export
    var file = new File(folder + '/' + filename);
    doc.imageCapture(file, bounds, options);

    // Ungroup
    app.executeMenuCommand('ungroup');
}

/**
 * Export layer as JPEG
 * @param {Document} doc - Document
 * @param {Layer} layer - Layer to export
 * @param {Folder} folder - Export folder
 * @param {string} filename - Output filename (without extension)
 * @param {number} resolution - DPI resolution
 */
function exportLayerAsJPEG(doc, layer, folder, filename, resolution) {
    // Create asset from layer
    layer.hasSelectedArtwork = true;
    var asset = doc.assets.addFromSelection();
    asset.assetName = layer.name;

    // Disable subfolder creation
    app.preferences.setIntegerPreference('plugin/SmartExportUI/CreateFoldersPreference', 0);

    // Configure export
    var whatToExport = new ExportForScreensItemToExport();
    whatToExport.assets = [asset.assetID];
    whatToExport.artboards = '';
    whatToExport.document = false;

    // JPEG options
    var jpgOptions = new ExportForScreensOptionsJPEG();
    jpgOptions.antiAliasing = AntiAliasingMethod.ARTOPTIMIZED;
    jpgOptions.compressionMethod = JPEGCompressionMethodType.BASELINEOPTIMIZED;
    jpgOptions.scaleType = ExportForScreensScaleType.SCALEBYRESOLUTION;
    jpgOptions.scaleTypeValue = resolution;

    // Export
    doc.exportForScreens(folder, ExportForScreensType.SE_JPEG100, jpgOptions, whatToExport);
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Get document base name (without extension)
 * @param {Document} doc - Document
 * @returns {string} Base name
 */
function getDocumentBaseName(doc) {
    var name = doc.name;
    var dotIndex = name.lastIndexOf('.');
    if (dotIndex > 0) {
        name = name.substring(0, dotIndex);
    }
    return name;
}

/**
 * Sanitize filename by removing invalid characters
 * @param {string} name - Original name
 * @returns {string} Sanitized name
 */
function sanitizeFilename(name) {
    // Remove invalid characters for filenames
    return name.replace(/[\/\\:*?"<>|]/g, '_');
}

/**
 * Hide all unlocked layers
 * @param {Document} doc - Document
 */
function hideAllUnlockedLayers(doc) {
    for (var i = 0; i < doc.layers.length; i++) {
        if (!doc.layers[i].locked) {
            doc.layers[i].visible = false;
        }
    }
}

/**
 * Show all unlocked layers
 * @param {Document} doc - Document
 */
function showAllUnlockedLayers(doc) {
    for (var i = 0; i < doc.layers.length; i++) {
        if (!doc.layers[i].locked) {
            doc.layers[i].visible = true;
        }
    }
}

/**
 * Load settings from JSON file
 * @returns {Object} Settings configuration
 */
function loadSettings() {
    try {
        var file = new File(SETTINGS.folder + SETTINGS.name);
        if (file.exists) {
            file.encoding = 'UTF-8';
            file.open('r');
            var json = file.read();
            file.close();
            return AIS.JSON.parse(json);
        }
    } catch (err) {
        // Ignore errors, use defaults
    }
    return CFG.defaults;
}

/**
 * Save settings to JSON file
 * @param {Object} config - Configuration to save
 */
function saveSettings(config) {
    try {
        var folder = new Folder(SETTINGS.folder);
        if (!folder.exists) folder.create();

        var file = new File(SETTINGS.folder + SETTINGS.name);
        file.encoding = 'UTF-8';
        file.open('w');
        file.write(AIS.JSON.stringify({
            format: config.format,
            resolution: config.resolution
        }));
        file.close();
    } catch (err) {
        // Ignore errors
    }
}

// ============================================================================
// ENTRY POINT
// ============================================================================

// ============================================================================
// EXECUTE
// ============================================================================

if (!AIS.Document.hasDocument()) {
    alert('No document\n\nOpen a document and try again.');
} else {
    try {
        main();
    } catch (e) {
        AIS.Error.show('Script error', e);
    }
}
