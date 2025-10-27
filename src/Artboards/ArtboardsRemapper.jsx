/**
 * Artboards Remapper
 * @version 1.0.0
 * @description Save artboard names to text file or apply names from file with range selection
 * @category Artboards
 *
 * Features:
 * - Save artboard names to text file
 * - Apply names from text file to artboards
 * - Range selection (start/end index)
 * - Default file location on desktop
 * - Cross-platform file handling
 *
 * Original: ArtboardsRemapper.jsx by Sergey Osokin
 * Based on code by Carlos Canto
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

    var doc = app.activeDocument;
    if (!doc.artboards || doc.artboards.length === 0) {
        alert('No artboards\nDocument must have at least one artboard');
        return;
    }

    main();
})();

// ============================================================================
// CONFIGURATION
// ============================================================================

var CFG = {
    scriptName: 'Artboards Remapper',
    version: '1.0.0',
    defaultFile: 'artboardsRemapper.txt'
};

// ============================================================================
// MAIN FUNCTION
// ============================================================================

function main() {
    var doc = app.activeDocument;
    var artboards = doc.artboards;
    var currentIndex = artboards.getActiveArtboardIndex();

    var config = showDialog(artboards.length, currentIndex);
    if (!config) return;

    try {
        if (config.mode === 'save') {
            executeSaveMode(artboards, config);
        } else {
            executeApplyMode(artboards, config);
        }
    } catch (error) {
        AIS.Error.show('Artboards Remapper Error', error);
    }
}

// ============================================================================
// CORE LOGIC
// ============================================================================

/**
 * Execute save mode - write artboard names to file
 * @param {Artboards} artboards - Document artboards collection
 * @param {Object} config - User configuration
 */
function executeSaveMode(artboards, config) {
    var names = getArtboardNames(artboards, config.startIndex, config.endIndex);

    if (names.length === 0) {
        alert('No artboards in range\nAdjust start/end indexes and try again');
        return;
    }

    var success = writeNamesToFile(names, config.file);
    if (success) {
        alert('Artboard names saved\n' + names.length + ' names written to:\n' + decodeURIComponent(config.file.fsName), 'Success');
    }
}

/**
 * Execute apply mode - read names from file and apply to artboards
 * @param {Artboards} artboards - Document artboards collection
 * @param {Object} config - User configuration
 */
function executeApplyMode(artboards, config) {
    var file = config.file;

    // If default file doesn't exist, prompt for file selection
    if (!file.exists) {
        file = selectTextFile();
        if (!file) return;
    }

    var names = readNamesFromFile(file);

    if (names.length === 0 || (names.length === 1 && names[0] === '')) {
        alert('No names found\nFile is empty or contains no valid names');
        return;
    }

    var count = applyNamesToArtboards(artboards, names, config.startIndex, config.endIndex);
    alert('Artboard names applied\n' + count + ' artboards renamed', 'Success');
}

/**
 * Get artboard names from specified range
 * @param {Artboards} artboards - Document artboards collection
 * @param {number} startIndex - Start index (0-based)
 * @param {number} endIndex - End index (inclusive, 0-based)
 * @returns {Array} Array of artboard names
 */
function getArtboardNames(artboards, startIndex, endIndex) {
    var names = [];
    for (var i = startIndex; i <= endIndex; i++) {
        if (i < artboards.length) {
            names.push(artboards[i].name);
        }
    }
    return names;
}

/**
 * Write names to text file
 * @param {Array} names - Array of artboard names
 * @param {File} file - Target file
 * @returns {boolean} Success status
 */
function writeNamesToFile(names, file) {
    try {
        file.encoding = 'UTF-8';
        file.open('w');
        file.write(names.join('\n'));
        file.close();
        return true;
    } catch (error) {
        alert('File write error\n' + error.message, 'Error');
        return false;
    }
}

/**
 * Read names from text file
 * @param {File} file - Source file
 * @returns {Array} Array of names
 */
function readNamesFromFile(file) {
    try {
        file.encoding = 'UTF-8';
        file.open('r');
        var content = file.read();
        file.close();

        // Split on any line break type (Unix/Mac/Windows)
        var names = content.split(/\n|\r\n|\r/);
        return names;
    } catch (error) {
        alert('File read error\n' + error.message, 'Error');
        return [];
    }
}

/**
 * Apply names to artboards in specified range
 * @param {Artboards} artboards - Document artboards collection
 * @param {Array} names - Array of new names
 * @param {number} startIndex - Start index (0-based)
 * @param {number} endIndex - End index (inclusive, 0-based)
 * @returns {number} Count of artboards renamed
 */
function applyNamesToArtboards(artboards, names, startIndex, endIndex) {
    var count = 0;
    var maxIndex = Math.min(endIndex, artboards.length - 1);

    for (var i = startIndex, j = 0; i <= maxIndex && j < names.length; i++, j++) {
        if (names[j] && names[j].length > 0) {
            artboards[i].name = names[j];
            count++;
        }
    }

    return count;
}

/**
 * Prompt user to select a text file
 * @returns {File|null} Selected file or null if cancelled
 */
function selectTextFile() {
    var isMac = AIS.System.isMac();
    var fileFilter = isMac ? function(f) {
        return f instanceof Folder || (f instanceof File && /\.txt$/i.test(f.name));
    } : '*.txt';

    var file = File.openDialog('Select text file with artboard names', fileFilter, false);
    return file;
}

// ============================================================================
// USER INTERFACE
// ============================================================================

/**
 * Show main dialog
 * @param {number} artboardCount - Total artboard count
 * @param {number} currentIndex - Current active artboard index
 * @returns {Object|null} Configuration object or null if cancelled
 */
function showDialog(artboardCount, currentIndex) {
    var isMac = AIS.System.isMac();
    var aiVersion = parseFloat(app.version);
    var defaultFile = new File(Folder.desktop + '/' + CFG.defaultFile);

    var dialog = new Window('dialog', CFG.scriptName + ' ' + CFG.version);
    dialog.orientation = 'column';
    dialog.alignChildren = ['fill', 'top'];

    // Mode selection
    var modeGroup = dialog.add('group');
    modeGroup.alignChildren = ['left', 'center'];

    var saveRadio = modeGroup.add('radiobutton', undefined, 'Save To File');
    saveRadio.value = true;

    // Set focus on Mac or newer Illustrator versions
    if (isMac || aiVersion >= 26.4 || aiVersion <= 17) {
        saveRadio.active = true;
    }

    var applyRadio = modeGroup.add('radiobutton', undefined, 'Apply From File');

    // Index range panel
    var rangePanel = dialog.add('panel', undefined, 'Artboard Index Range (1-based)');
    rangePanel.orientation = 'row';
    rangePanel.alignChildren = ['fill', 'center'];
    rangePanel.margins = [10, 15, 10, 7];

    var startGroup = rangePanel.add('group');
    startGroup.alignChildren = ['left', 'center'];

    startGroup.add('statictext', undefined, 'Start:');
    var startInput = startGroup.add('edittext', undefined, (currentIndex + 1).toString());
    startInput.characters = 6;
    startInput.helpTip = 'First artboard index (1 to ' + artboardCount + ')';

    var endGroup = rangePanel.add('group');
    endGroup.alignChildren = ['left', 'center'];

    endGroup.add('statictext', undefined, 'End:');
    var endInput = endGroup.add('edittext', undefined, artboardCount.toString());
    endInput.characters = 6;
    endInput.helpTip = 'Last artboard index (1 to ' + artboardCount + ')';

    // File path display
    var fileLabel = dialog.add('statictext', undefined, decodeURIComponent(defaultFile.fsName));
    fileLabel.helpTip = 'Click to reveal file location\n' + decodeURIComponent(defaultFile.fsName);

    // Buttons
    var buttonGroup = dialog.add('group');
    buttonGroup.alignChildren = ['fill', 'center'];

    var cancelButton, okButton;
    if (isMac) {
        cancelButton = buttonGroup.add('button', undefined, 'Cancel', {name: 'cancel'});
        okButton = buttonGroup.add('button', undefined, 'OK', {name: 'ok'});
    } else {
        okButton = buttonGroup.add('button', undefined, 'OK', {name: 'ok'});
        cancelButton = buttonGroup.add('button', undefined, 'Cancel', {name: 'cancel'});
    }

    cancelButton.helpTip = 'Press Esc to close';
    okButton.helpTip = 'Press Enter to continue';

    // Event handlers
    fileLabel.addEventListener('mousedown', function() {
        var folder = new Folder(defaultFile.path);
        if (folder.exists) {
            folder.execute();
        }
    });

    cancelButton.onClick = function() {
        dialog.close();
    };

    okButton.onClick = function() {
        var config = validateAndGetConfig();
        if (config) {
            dialog.close(1);
        }
    };

    /**
     * Validate inputs and return configuration
     * @returns {Object|null} Configuration or null if invalid
     */
    function validateAndGetConfig() {
        // Parse indexes (convert from 1-based to 0-based)
        var startIdx = parseInt(startInput.text, 10) - 1;
        var endIdx = parseInt(endInput.text, 10) - 1;

        // Validate start index
        if (isNaN(startIdx) || startIdx < 0 || startIdx >= artboardCount) {
            alert('Invalid start index\nMust be between 1 and ' + artboardCount, 'Input Error');
            return null;
        }

        // Validate end index
        if (isNaN(endIdx) || endIdx < 0 || endIdx >= artboardCount) {
            alert('Invalid end index\nMust be between 1 and ' + artboardCount, 'Input Error');
            return null;
        }

        // Validate range
        if (endIdx < startIdx) {
            alert('Invalid range\nEnd index must be greater than or equal to start index', 'Input Error');
            return null;
        }

        return {
            mode: saveRadio.value ? 'save' : 'apply',
            startIndex: startIdx,
            endIndex: endIdx,
            file: defaultFile
        };
    }

    // Store config for access after dialog closes
    var result = null;
    var originalClose = dialog.close;
    dialog.close = function(returnValue) {
        if (returnValue === 1) {
            result = validateAndGetConfig();
        }
        originalClose.call(dialog, returnValue);
    };

    dialog.center();
    var dialogResult = dialog.show();

    return dialogResult === 1 ? result : null;
}
