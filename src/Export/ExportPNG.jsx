/**
 * Export PNG
 * @version 1.0.0
 * @description Exports artboards as PNG files at 1x, 2x, and 3x resolutions
 * @category Export
 * @author Pixeden
 * @modernized 2025 - Adapted for AIS framework
 * @features
 *   - Export all artboards as PNG
 *   - Three resolution scales (1x, 2x, 3x)
 *   - Automatic folder structure (1x/, 2x/, 3x/)
 *   - Custom naming prefix
 *   - Artboard clipping
 *   - PNG24 format with transparency option
 * @usage
 *   1. Open document with artboards
 *   2. Run script
 *   3. Enter filename prefix
 *   4. Select export folder
 *   5. Files exported to subfolders
 * @notes
 *   - Creates subfolders automatically
 *   - Filename format: prefix_artboardname.png
 *   - All artboards exported
 */

#include "../.lib/core.jsx"

//@target illustrator
app.preferences.setBooleanPreference('ShowExternalJSXWarning', false);

(function() {
    if (!AIS.Document.hasDocument()) {
        alert('No documents\nOpen a document and try again');
        return;
    }
    main();
})();

// ============================================================================
// CONFIGURATION
// ============================================================================
var CFG = {
    scriptName: 'Export PNG',
    version: '1.0.0',
    defaultPrefix: 'export',
    resolutions: [
        { scale: 100, folder: '1x' },
        { scale: 200, folder: '2x' },
        { scale: 300, folder: '3x' }
    ]
};

// ============================================================================
// MAIN FUNCTION
// ============================================================================
function main() {
    try {
        var doc = app.activeDocument;

        // Validate artboards
        if (doc.artboards.length === 0) {
            alert('No artboards\nDocument must have at least one artboard');
            return;
        }

        // Get filename prefix
        var prefix = prompt('Enter filename prefix:', CFG.defaultPrefix);
        if (!prefix || prefix.replace(/\s/g, '').length === 0) {
            alert('Invalid prefix\nPlease enter a valid filename prefix');
            return main();  // Retry
        }

        // Select export folder
        var baseFolder = Folder.selectDialog('Choose export folder');
        if (!baseFolder) {
            return;  // User cancelled
        }

        // Create resolution folders
        var folders = createResolutionFolders(baseFolder);
        if (!folders) {
            alert('Folder creation failed\nCould not create resolution folders');
            return;
        }

        // Export artboards
        exportArtboards(doc, prefix, folders);

        alert(
            'Export complete\n' +
            'Exported ' + doc.artboards.length + ' artboard' +
            (doc.artboards.length === 1 ? '' : 's') + ' at 3 resolutions\n' +
            'Location: ' + baseFolder.fsName
        );

    } catch (e) {
        AIS.Error.show('Export failed', e);
    }
}

// ============================================================================
// CORE LOGIC
// ============================================================================

/**
 * Create resolution subfolders
 * @param {Folder} baseFolder - Base export folder
 * @returns {Object|null} - Folder object with 1x, 2x, 3x properties
 */
function createResolutionFolders(baseFolder) {
    var folders = {};

    try {
        for (var i = 0; i < CFG.resolutions.length; i++) {
            var res = CFG.resolutions[i];
            var folder = new Folder(baseFolder.fsName + '/' + res.folder);

            if (!folder.exists) {
                if (!folder.create()) {
                    return null;
                }
            }

            folders[res.folder] = folder;
        }

        return folders;
    } catch (e) {
        return null;
    }
}

/**
 * Export all artboards at all resolutions
 * @param {Document} doc - Active document
 * @param {String} prefix - Filename prefix
 * @param {Object} folders - Resolution folders
 */
function exportArtboards(doc, prefix, folders) {
    var exportOptions = createExportOptions();

    for (var i = 0; i < doc.artboards.length; i++) {
        // Set active artboard
        doc.artboards.setActiveArtboardIndex(i);
        var artboardName = doc.artboards[i].name;

        // Export at each resolution
        for (var j = 0; j < CFG.resolutions.length; j++) {
            var res = CFG.resolutions[j];
            var folder = folders[res.folder];

            // Set scale
            exportOptions.horizontalScale = res.scale;
            exportOptions.verticalScale = res.scale;

            // Create filename
            var filename = prefix + '_' + artboardName + '.png';
            var destFile = new File(folder.fsName + '/' + filename);

            // Export
            doc.exportFile(destFile, ExportType.PNG24, exportOptions);
        }
    }
}

/**
 * Create PNG export options
 * @returns {ExportOptionsPNG24} - Configured export options
 */
function createExportOptions() {
    var options = new ExportOptionsPNG24();

    // Basic settings
    options.artBoardClipping = true;
    options.antiAliasing = false;
    options.transparency = false;

    // Default scale (will be modified per export)
    options.horizontalScale = 100;
    options.verticalScale = 100;

    return options;
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Prompt user for input
 * @param {String} message - Prompt message
 * @param {String} defaultValue - Default value
 * @returns {String|null} - User input or null if cancelled
 */
function prompt(message, defaultValue) {
    return Window.prompt(message, defaultValue);
}
