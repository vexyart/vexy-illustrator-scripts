/**
 * Export as PDF
 * @version 1.0.0
 * @description Export multiple PDFs simultaneously with various presets and options
 * @author sky-chaser-high (modernized for AIS)
 * @license MIT
 * @category Favorites
 * @requires Illustrator CS6 or higher
 *
 * Features:
 * - Select up to 5 PDF presets simultaneously
 * - Single or multiple file export
 * - Artboard range selection (All or specific ranges)
 * - Batch process: Active document, all open documents, or all documents in folder
 * - Create text outlines before export
 * - View PDF after saving option
 * - Custom filename suffixes
 *
 * Original: github.com/sky-chaser-high/adobe-illustrator-scripts
 * Modernized to use AIS library while preserving all functionality
 */

#include "../.lib/core.jsx"

//@target illustrator
app.preferences.setBooleanPreference('ShowExternalJSXWarning', false);

(function() {
    if (!app.documents.length) {
        alert('No documents\nOpen a document and try again');
        return;
    }

    if (!isValidVersion()) {
        alert('This script requires Illustrator CS6 or higher\nCurrent version: ' + app.version);
        return;
    }

    main();
})();

// ============================================================================
// MAIN FUNCTION
// ============================================================================

function main() {
    var dialog = showDialog();

    dialog.ok.onClick = function() {
        var config = getConfiguration(dialog);
        var isValid = checkInputValues(config);
        if (!isValid) return;

        exportAllDocumentsAsPDFs(config);
        dialog.close();
    }

    dialog.show();
}

// ============================================================================
// EXPORT LOGIC
// ============================================================================

/**
 * Export all documents as PDFs
 * @param {Object} config - Configuration object
 */
function exportAllDocumentsAsPDFs(config) {
    var docs = 1;
    if (config.isAllOpenDocuments) docs = app.documents.length;

    if (config.isAllDocumentsInFolder) {
        var files = getAllDocuments(config.isAllOpenDocuments);
        exportAllDocumentsInFolder(files, config);
    }

    for (var i = 0; i < docs; i++) {
        var isFileSave = saveAiDocument();
        if (!isFileSave) return;
        exportAsPDFs(config);
    }
}

/**
 * Export all documents in a folder
 * @param {Array} files - Array of file objects
 * @param {Object} config - Configuration object
 */
function exportAllDocumentsInFolder(files, config) {
    for (var i = 0; i < files.length; i++) {
        var file = files[i];
        app.open(file);
        exportAsPDFs(config);
    }
}

/**
 * Export document as PDFs with all selected presets
 * @param {Object} config - Configuration object
 */
function exportAsPDFs(config) {
    if (config.outline) createOutline();

    var doc = app.activeDocument;
    var src = doc.fullName.fsName;
    var ranges = getArtboardRanges(config.ranges);

    for (var i = 0; i < config.presets.length; i++) {
        var suffix = config.names[i];
        var preset = config.presets[i];
        if (preset.index < 2) continue;

        if (config.isSingleFile) {
            exportAsSinglePDF(src, preset.text, ranges.join(), suffix, config.view);
        }
        else {
            exportAsMultiplePDFs(src, preset.text, ranges, suffix, config.view);
        }
    }

    doc.close(SaveOptions.DONOTSAVECHANGES);
}

/**
 * Export as single PDF file
 * @param {String} src - Source file path
 * @param {String} preset - PDF preset name
 * @param {String} ranges - Artboard ranges
 * @param {String} suffix - Filename suffix
 * @param {Boolean} view - View after saving
 */
function exportAsSinglePDF(src, preset, ranges, suffix, view) {
    var filename = getFilename(src, suffix);
    var file = new File(filename);

    var options = new PDFSaveOptions();
    options.pDFPreset = preset;
    options.artboardRange = ranges;
    options.viewAfterSaving = view;

    app.activeDocument.saveAs(file, options);
}

/**
 * Export as multiple PDF files
 * @param {String} src - Source file path
 * @param {String} preset - PDF preset name
 * @param {Array} ranges - Array of artboard ranges
 * @param {String} suffix - Filename suffix
 * @param {Boolean} view - View after saving
 */
function exportAsMultiplePDFs(src, preset, ranges, suffix, view) {
    for (var i = 0; i < ranges.length; i++) {
        var range = ranges[i];

        var filename = getFilename(src, suffix + '_' + range);
        var file = new File(filename);

        var options = new PDFSaveOptions();
        options.pDFPreset = preset;
        options.artboardRange = range;
        options.viewAfterSaving = view;

        app.activeDocument.saveAs(file, options);
    }
}

// ============================================================================
// ARTBOARD RANGE PROCESSING
// ============================================================================

/**
 * Parse and validate artboard ranges
 * @param {String} range - Range string (e.g., "1,3-5,7")
 * @returns {Array} Sorted array of artboard numbers
 */
function getArtboardRanges(range) {
    var artboard = {
        min: 1,
        max: app.activeDocument.artboards.length
    };
    var ranges = [];

    var nums = range.split(/,/g);

    for (var i = 0; i < nums.length; i++) {
        var num = nums[i];
        var value = parseInt(num);
        if (/-/.test(num)) {
            ranges = ranges.concat(getSpecifiedRange(num, ranges));
        }
        else if (artboard.max < value) {
            if (dupeRangeExists(ranges, artboard.max)) continue;
            ranges.push(artboard.max);
        }
        else if (value < artboard.min) {
            if (dupeRangeExists(ranges, artboard.min)) continue;
            ranges.push(artboard.min);
        }
        else if (value) {
            if (dupeRangeExists(ranges, value)) continue;
            ranges.push(value);
        }
    }
    return ranges.sort(function(a, b) {
        return a - b;
    });
}

/**
 * Get specified range from text (e.g., "3-7" → [3,4,5,6,7])
 * @param {String} text - Range text
 * @param {Array} totalRanges - Existing ranges to avoid duplicates
 * @returns {Array} Array of artboard numbers
 */
function getSpecifiedRange(text, totalRanges) {
    var artboard = {
        min: 1,
        max: app.activeDocument.artboards.length
    };
    var ranges = [];

    if (/^-/.test(text)) text = artboard.min + text;
    if (/-$/.test(text)) text = text + artboard.max;

    var str = text.split(/-+/);

    var start = parseInt(str[0]);
    var end = parseInt(str[1]);
    if (end < start) {
        start = parseInt(str[1]);
        end = parseInt(str[0]);
    }
    if (artboard.max < end) end = artboard.max;

    for (var i = start; i <= end; i++) {
        if (dupeRangeExists(totalRanges, i)) continue;
        ranges.push(i);
    }
    return ranges;
}

/**
 * Check if range value already exists
 * @param {Array} ranges - Array of existing ranges
 * @param {Number} value - Value to check
 * @returns {Boolean} True if duplicate exists
 */
function dupeRangeExists(ranges, value) {
    for (var i = 0; i < ranges.length; i++) {
        var range = ranges[i];
        if (range == value) return true;
    }
    return false;
}

// ============================================================================
// DOCUMENT MANAGEMENT
// ============================================================================

/**
 * Get all documents in the same folder(s) as open documents
 * @param {Boolean} isAllOpenDocuments - True to check all open documents' folders
 * @returns {Array} Array of file objects
 */
function getAllDocuments(isAllOpenDocuments) {
    var files = [];
    var dirs = [];

    var docs = [app.activeDocument];
    if (isAllOpenDocuments) docs = app.documents;

    for (var i = 0; i < docs.length; i++) {
        var dir = docs[i].path;
        if (dupeFileExists(dirs, dir)) continue;
        dirs.push(dir);
    }

    for (var i = 0; i < dirs.length; i++) {
        var items = dirs[i].getFiles('*.ai');

        for (var j = 0; j < items.length; j++) {
            var item = items[j];
            if (dupeFileExists(docs, item)) continue;
            files.push(item);
        }
    }

    return files;
}

/**
 * Check if file already exists in array
 * @param {Array} files - Array of files or documents
 * @param {File} value - File to check
 * @returns {Boolean} True if duplicate exists
 */
function dupeFileExists(files, value) {
    for (var i = 0; i < files.length; i++) {
        var file = files[i];
        if (file.fsName == value.fsName) return true;
        if (file.fullName && file.fullName.fsName == value.fsName) return true;
    }
    return false;
}

/**
 * Create text outlines
 */
function createOutline() {
    var layers = app.activeDocument.layers;
    unlockAllLayers(layers);
    app.executeMenuCommand('unlockAll');
    app.executeMenuCommand('selectall');
    app.executeMenuCommand('outline');
}

/**
 * Unlock all layers recursively
 * @param {Layers} layers - Layer collection
 */
function unlockAllLayers(layers) {
    for (var i = 0; i < layers.length; i++) {
        var layer = layers[i];
        layer.locked = false;
        var children = layer.layers;
        unlockAllLayers(children);
    }
}

/**
 * Prompt to save document if unsaved
 * @returns {Boolean} True if OK to proceed
 */
function saveAiDocument() {
    var isFileSave = true;

    var doc = app.activeDocument;
    if (doc.saved) return isFileSave;

    var dialog = showSaveDialog();

    dialog.doNotSave.onClick = function() {
        dialog.close();
    }

    dialog.cancel.onClick = function() {
        isFileSave = false;
        dialog.close();
    }

    dialog.save.onClick = function() {
        if (doc.fullName.exists) doc.save();
        else app.executeMenuCommand('save');
        dialog.close();
    }

    dialog.show();
    return isFileSave;
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Get filename with suffix
 * @param {String} src - Source file path
 * @param {String} suffix - Suffix to add
 * @returns {String} New filename
 */
function getFilename(src, suffix) {
    var extension = '.pdf';
    var str = '_' + suffix + extension;
    var filename = src.replace(/\.ai$/, str);
    return filename;
}

/**
 * Get list of PDF presets
 * @returns {Array} Array of preset names
 */
function getPDFPresets() {
    try {
        var presets = app.PDFPresetsList;
        return ['Select a Preset', '-'].concat(presets.sort());
    }
    catch (err) {
        alert('Failed to load PDF presets');
        return [];
    }
}

/**
 * Check if Illustrator version is valid
 * @returns {Boolean} True if CS6 or higher
 */
function isValidVersion() {
    var cs6 = 16;
    var current = parseInt(app.version);
    if (current < cs6) return false;
    return true;
}

/**
 * Validate configuration inputs
 * @param {Object} config - Configuration object
 * @returns {Boolean} True if valid
 */
function checkInputValues(config) {
    var isValid = false;
    var message = 'Select at least one preset.';

    var index = 2;
    for (var i = 0; i < config.presets.length; i++) {
        var preset = config.presets[i];
        if (preset.index < index) continue;
        isValid = true;
    }

    if (isValid) {
        isValid = /^[0-9,-]*$/ig.test(config.ranges);
        if (!isValid) message = 'Invalid Artboard Range';
    }

    if (!isValid) showWarning(message);
    return isValid;
}

/**
 * Get configuration from dialog
 * @param {Object} dialog - Dialog window
 * @returns {Object} Configuration object
 */
function getConfiguration(dialog) {
    var name1 = dialog.name1.text;
    if (!name1) name1 = '1';
    var name2 = dialog.name2.text;
    if (!name2) name2 = '2';
    var name3 = dialog.name3.text;
    if (!name3) name3 = '3';
    var name4 = dialog.name4.text;
    if (!name4) name4 = '4';
    var name5 = dialog.name5.text;
    if (!name5) name5 = '5';

    var isAllArtboareds = dialog.artboard.all.value;
    var ranges = dialog.ranges.text;
    ranges = ranges.replace(/\s/g, '');
    if (!ranges || isAllArtboareds) ranges = '1-' + app.activeDocument.artboards.length;

    return {
        presets: [
            dialog.preset1.selection,
            dialog.preset2.selection,
            dialog.preset3.selection,
            dialog.preset4.selection,
            dialog.preset5.selection
        ],
        names: [
            name1,
            name2,
            name3,
            name4,
            name5
        ],
        isSingleFile: dialog.file.single.value,
        isMultipleFiles: dialog.file.multiple.value,
        isAllArtboareds: isAllArtboareds,
        isRangeArtboards: dialog.artboard.range.value,
        ranges: ranges,
        isActiveDocument: dialog.activeDocument.value,
        isAllOpenDocuments: dialog.openDocuments.value,
        isAllDocumentsInFolder: dialog.allDocuments.value,
        outline: dialog.outline.value,
        view: dialog.view.value
    };
}

// ============================================================================
// USER INTERFACE
// ============================================================================

/**
 * Show main export dialog
 * @returns {Object} Dialog window
 */
function showDialog() {
    var presets = getPDFPresets();

    var hasMultiArtboards = (app.activeDocument.artboards.length > 1) ? true : false;
    var hasMultiOpenFiles = (app.documents.length > 1) ? true : false;

    var range = '1';
    if (hasMultiArtboards) {
        range = '1-' + app.activeDocument.artboards.length;
    }

    var dialog = new Window('dialog');
    dialog.text = 'Export Adobe PDF';
    dialog.orientation = 'column';
    dialog.alignChildren = ['fill', 'top'];
    dialog.spacing = 10;
    dialog.margins = 16;

    var panel1 = dialog.add('panel', undefined, undefined, { name: 'panel1' });
    panel1.text = 'PDF';
    panel1.orientation = 'column';
    panel1.alignChildren = ['fill', 'top'];
    panel1.spacing = 10;
    panel1.margins = 10;

    var group1 = panel1.add('group', undefined, { name: 'group1' });
    group1.orientation = 'row';
    group1.alignChildren = ['left', 'bottom'];
    group1.spacing = 10;
    group1.margins = [0, 4, 0, 0];

    var group2 = group1.add('group', undefined, { name: 'group2' });
    group2.orientation = 'column';
    group2.alignChildren = ['center', 'center'];
    group2.spacing = 18;
    group2.margins = [0, 0, 0, 4];

    var statictext1 = group2.add('statictext', undefined, undefined, { name: 'statictext1' });
    statictext1.text = '1';

    var statictext2 = group2.add('statictext', undefined, undefined, { name: 'statictext2' });
    statictext2.text = '2';

    var statictext3 = group2.add('statictext', undefined, undefined, { name: 'statictext3' });
    statictext3.text = '3';

    var statictext4 = group2.add('statictext', undefined, undefined, { name: 'statictext4' });
    statictext4.text = '4';

    var statictext5 = group2.add('statictext', undefined, undefined, { name: 'statictext5' });
    statictext5.text = '5';

    var group3 = group1.add('group', undefined, { name: 'group3' });
    group3.orientation = 'column';
    group3.alignChildren = ['left', 'center'];
    group3.spacing = 10;
    group3.margins = 0;

    var statictext6 = group3.add('statictext', undefined, undefined, { name: 'statictext6' });
    statictext6.text = 'Presets';

    var group4 = group3.add('group', undefined, { name: 'group4' });
    group4.preferredSize.width = 300;
    group4.orientation = 'column';
    group4.alignChildren = ['fill', 'center'];
    group4.spacing = 10;
    group4.margins = 0;

    var dropdown1 = group4.add('dropdownlist', undefined, presets, { name: 'dropdown1' });
    dropdown1.selection = 0;
    dropdown1.active = true;

    var dropdown2 = group4.add('dropdownlist', undefined, presets, { name: 'dropdown2' });
    dropdown2.selection = 0;

    var dropdown3 = group4.add('dropdownlist', undefined, presets, { name: 'dropdown3' });
    dropdown3.selection = 0;

    var dropdown4 = group4.add('dropdownlist', undefined, presets, { name: 'dropdown4' });
    dropdown4.selection = 0;

    var dropdown5 = group4.add('dropdownlist', undefined, presets, { name: 'dropdown5' });
    dropdown5.selection = 0;

    var group5 = group1.add('group', undefined, { name: 'group5' });
    group5.orientation = 'column';
    group5.alignChildren = ['fill', 'center'];
    group5.spacing = 10;
    group5.margins = 0;

    var statictext7 = group5.add('statictext', undefined, undefined, { name: 'statictext7' });
    statictext7.text = 'Filename Suffix';

    var group6 = group5.add('group', undefined, { name: 'group6' });
    group6.orientation = 'column';
    group6.alignChildren = ['fill', 'center'];
    group6.spacing = 10;
    group6.margins = 0;

    var edittext1 = group6.add('edittext', undefined, undefined, { name: 'edittext1' });
    edittext1.text = '1';

    var edittext2 = group6.add('edittext', undefined, undefined, { name: 'edittext2' });
    edittext2.text = '2';

    var edittext3 = group6.add('edittext', undefined, undefined, { name: 'edittext3' });
    edittext3.text = '3';

    var edittext4 = group6.add('edittext', undefined, undefined, { name: 'edittext4' });
    edittext4.text = '4';

    var edittext5 = group6.add('edittext', undefined, undefined, { name: 'edittext5' });
    edittext5.text = '5';

    var divider1 = panel1.add('panel', undefined, undefined, { name: 'divider1' });
    divider1.alignment = 'fill';

    var group7 = panel1.add('group', undefined, { name: 'group7' });
    group7.orientation = 'row';
    group7.alignChildren = ['left', 'center'];
    group7.spacing = 10;
    group7.margins = 0;

    var statictext8 = group7.add('statictext', undefined, undefined, { name: 'statictext8' });
    statictext8.text = 'Export PDFs as:';

    var group8 = group7.add('group', undefined, { name: 'group8' });
    group8.orientation = 'row';
    group8.alignChildren = ['left', 'center'];
    group8.spacing = 10;
    group8.margins = [0, 3, 0, 0];

    var radiobutton1 = group8.add('radiobutton', undefined, undefined, { name: 'radiobutton1' });
    radiobutton1.text = 'Single File';
    radiobutton1.value = true;

    var radiobutton2 = group8.add('radiobutton', undefined, undefined, { name: 'radiobutton2' });
    radiobutton2.text = 'Multiple Files';
    radiobutton2.enabled = hasMultiArtboards ? true : false;

    var panel2 = dialog.add('panel', undefined, undefined, { name: 'panel2' });
    panel2.text = 'Artboards';
    panel2.orientation = 'column';
    panel2.alignChildren = ['left', 'top'];
    panel2.spacing = 10;
    panel2.margins = 10;

    var group9 = panel2.add('group', undefined, { name: 'group9' });
    group9.orientation = 'row';
    group9.alignChildren = ['left', 'center'];
    group9.spacing = 10;
    group9.margins = [0, 4, 0, 0];

    var group10 = group9.add('group', undefined, { name: 'group10' });
    group10.orientation = 'row';
    group10.alignChildren = ['left', 'center'];
    group10.spacing = 10;
    group10.margins = [0, 2, 0, 0];

    var radiobutton3 = group10.add('radiobutton', undefined, undefined, { name: 'radiobutton3' });
    radiobutton3.text = 'All';
    radiobutton3.value = true;

    var radiobutton4 = group10.add('radiobutton', undefined, undefined, { name: 'radiobutton4' });
    radiobutton4.text = 'Range:';
    radiobutton4.enabled = hasMultiArtboards ? true : false;

    var edittext6 = group9.add('edittext', undefined, undefined, { name: 'edittext6' });
    edittext6.text = range;
    edittext6.preferredSize.width = 100;
    edittext6.enabled = false;

    var panel3 = dialog.add('panel', undefined, undefined, { name: 'panel3' });
    panel3.text = 'Documents';
    panel3.orientation = 'column';
    panel3.alignChildren = ['left', 'top'];
    panel3.spacing = 10;
    panel3.margins = 10;

    var group11 = panel3.add('group', undefined, { name: 'group11' });
    group11.orientation = 'column';
    group11.alignChildren = ['left', 'center'];
    group11.spacing = 10;
    group11.margins = [0, 8, 0, 0];

    var radiobutton5 = group11.add('radiobutton', undefined, undefined, { name: 'radiobutton5' });
    radiobutton5.text = 'Active Document';
    radiobutton5.value = true;

    var radiobutton6 = group11.add('radiobutton', undefined, undefined, { name: 'radiobutton6' });
    radiobutton6.text = 'All Open Documents';
    radiobutton6.enabled = hasMultiOpenFiles ? true : false;

    var checkbox1 = group11.add('checkbox', undefined, undefined, { name: 'checkbox1' });
    checkbox1.text = 'All Documents in the Same Folder';

    var panel4 = dialog.add('panel', undefined, undefined, { name: 'panel4' });
    panel4.text = 'Options';
    panel4.orientation = 'column';
    panel4.alignChildren = ['left', 'top'];
    panel4.spacing = 10;
    panel4.margins = 10;

    var group12 = panel4.add('group', undefined, { name: 'group12' });
    group12.orientation = 'column';
    group12.alignChildren = ['left', 'center'];
    group12.spacing = 10;
    group12.margins = [0, 8, 0, 0];

    var checkbox2 = group12.add('checkbox', undefined, undefined, { name: 'checkbox2' });
    checkbox2.text = 'Create Outlines';

    var checkbox3 = group12.add('checkbox', undefined, undefined, { name: 'checkbox3' });
    checkbox3.text = 'View PDF after Saving';

    var group13 = dialog.add('group', undefined, { name: 'group13' });
    group13.orientation = 'row';
    group13.alignChildren = ['right', 'center'];
    group13.spacing = 10;
    group13.margins = 0;

    var button1 = group13.add('button', undefined, undefined, { name: 'Cancel' });
    button1.text = 'Cancel';
    button1.preferredSize.width = 90;

    var button2 = group13.add('button', undefined, undefined, { name: 'OK' });
    button2.text = 'OK';
    button2.preferredSize.width = 90;

    radiobutton3.onClick = function() {
        edittext6.enabled = false;
    }

    radiobutton4.onClick = function() {
        edittext6.enabled = true;
        edittext6.active = false;
        edittext6.active = true;
    }

    button1.onClick = function() {
        dialog.close();
    }

    dialog.preset1 = dropdown1;
    dialog.preset2 = dropdown2
    dialog.preset3 = dropdown3;
    dialog.preset4 = dropdown4;
    dialog.preset5 = dropdown5;
    dialog.name1 = edittext1;
    dialog.name2 = edittext2
    dialog.name3 = edittext3;
    dialog.name4 = edittext4;
    dialog.name5 = edittext5;
    dialog.file = {
        single: radiobutton1,
        multiple: radiobutton2
    };
    dialog.artboard = {
        all: radiobutton3,
        range: radiobutton4
    };
    dialog.ranges = edittext6;
    dialog.activeDocument = radiobutton5;
    dialog.openDocuments = radiobutton6;
    dialog.allDocuments = checkbox1;
    dialog.outline = checkbox2;
    dialog.view = checkbox3;
    dialog.ok = button2;
    return dialog;
}

/**
 * Show save dialog
 * @returns {Object} Dialog window
 */
function showSaveDialog() {
    var filename = File.decode(app.activeDocument.name);

    var dialog = new Window('dialog');
    dialog.text = 'Adobe Illustrator';
    dialog.orientation = 'column';
    dialog.alignChildren = ['fill', 'top'];
    dialog.spacing = 10;
    dialog.margins = 16;

    var group1 = dialog.add('group', undefined, { name: 'group1' });
    group1.orientation = 'column';
    group1.alignChildren = ['fill', 'center'];
    group1.spacing = 10;
    group1.margins = 0;

    var group4 = group1.add('group', undefined, { name: 'group4' });
    group4.orientation = 'column';
    group4.alignChildren = ['left', 'center'];
    group4.spacing = 2;
    group4.margins = 0;

    var statictext1 = group4.add('statictext', undefined, undefined, { name: 'statictext1', multiline: true });
    statictext1.text = 'Save changes to the Adobe Illustrator document "' + filename + '" before exporting?';
    statictext1.preferredSize.width = 415;

    var statictext2 = group4.add('statictext', undefined, undefined, { name: 'statictext2' });
    statictext2.text = "If you don't save, your changes will be lost.";

    var group5 = group1.add('group', undefined, { name: 'group5' });
    group5.orientation = 'row';
    group5.alignChildren = ['right', 'center'];
    group5.spacing = 10;
    group5.margins = [0, 6, 0, 0];

    var button1 = group5.add('button', undefined, undefined, { name: 'button1' });
    button1.text = "Don't Save";
    button1.preferredSize.width = 90;

    var button2 = group5.add('button', undefined, undefined, { name: 'Cancel' });
    button2.text = 'Cancel';
    button2.preferredSize.width = 90;

    var button3 = group5.add('button', undefined, undefined, { name: 'OK' });
    button3.text = 'Save';
    button3.preferredSize.width = 90;
    button3.active = true;

    dialog.doNotSave = button1;
    dialog.cancel = button2;
    dialog.save = button3;
    return dialog;
}

/**
 * Show warning dialog
 * @param {String} message - Warning message
 */
function showWarning(message) {
    var dialog = new Window('dialog');
    dialog.text = 'Adobe Illustrator';
    dialog.orientation = 'column';
    dialog.alignChildren = ['fill', 'top'];
    dialog.spacing = 10;
    dialog.margins = 16;

    var group1 = dialog.add('group', undefined, { name: 'group1' });
    group1.orientation = 'column';
    group1.alignChildren = ['fill', 'center'];
    group1.spacing = 10;
    group1.margins = 0;

    var group4 = group1.add('group', undefined, { name: 'group4' });
    group4.orientation = 'column';
    group4.alignChildren = ['left', 'center'];
    group4.spacing = 10;
    group4.margins = 0;

    var statictext1 = group4.add('statictext', undefined, undefined, { name: 'statictext1', multiline: true });
    statictext1.text = message;

    var group5 = group1.add('group', undefined, { name: 'group5' });
    group5.orientation = 'row';
    group5.alignChildren = ['right', 'center'];
    group5.spacing = 10;
    group5.margins = [0, 20, 0, 0];

    var button1 = group5.add('button', undefined, undefined, { name: 'OK' });
    button1.text = 'OK';
    button1.preferredSize.width = 90;
    button1.active = true;

    dialog.show();
}

// ============================================================================
// ENTRY POINT (handled by IIFE at top)
// ============================================================================
