/**
 * Make Numbers Sequence
 * @version 1.0.0
 * @description Fill text frames with sequential numbers with extensive customization
 * @category Text
 *
 * Features:
 * - Define start, end, and increment values
 * - Add leading zeros (auto or fixed length)
 * - Sort by layer order, rows, or columns
 * - Replace full text, numbers only, or placeholder {%n}
 * - Shuffle number order randomly
 * - Remove unused text frames
 * - Live preview of sequence
 * - Persistent settings
 *
 * Original: MakeNumbersSequence.jsx by Sergey Osokin
 * Idea: Egor Chistyakov (@chegr)
 * Modernized for AIS framework
 */




//@target illustrator
var c=File(Folder.myDocuments+"/Adobe Scripts/vexy-ville.ini");if(c.exists){c.open('r');var p=c.read();c.close();var l=File(p+".lib/core.jsx");if(l.exists)$.evalFile(l.fsName);}
app.preferences.setBooleanPreference('ShowExternalJSXWarning', false);

// ============================================================================
// CONFIGURATION
// ============================================================================

var CFG = {
    scriptName: 'Make Numbers Sequence',
    version: '1.0.0',
    placeholder: '{%n}',
    defaults: {
        start: 1,
        end: 50,
        increment: 5,
        leadingZeros: false,
        autoDigits: true,
        fixedDigits: 3,
        useAll: false,
        shuffle: false,
        removeUnused: false,
        sortMode: 'order',      // 'order', 'rows', 'columns'
        replaceMode: 'full'      // 'full', 'numbers', 'placeholder'
    }
};

var SETTINGS = {
    name: 'Make_Numbers_Sequence_data.json',
    folder: Folder.myDocuments + '/Adobe Scripts/'
};

// ============================================================================
// MAIN FUNCTION
// ============================================================================

function main(textFrames) {
    showDialog(textFrames);
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
            var nested = collectTextFrames(item.pageItems);
            frames = frames.concat(nested);
        }
    }

    return frames;
}

/**
 * Calculate number sequence
 * @param {number} increment - Step between numbers
 * @param {number} start - Starting number
 * @param {number} end - Ending number
 * @param {number} maxCount - Maximum count of numbers
 * @returns {Array} Array of numbers
 */
function calculateSequence(increment, start, end, maxCount) {
    var result = [];
    var current = start;
    var i = 0;

    if (increment > 0 && start <= end) {
        // Positive increment, ascending
        while ((current + increment <= end || i === 0) && i < maxCount) {
            current = start + (i * increment);
            if (current <= end) {
                result.push(current);
            }
            i++;
        }
    } else if (increment < 0 && start >= end) {
        // Negative increment, descending
        while ((current + increment >= end || i === 0) && i < maxCount) {
            current = start + (i * increment);
            if (current >= end) {
                result.push(current);
            }
            i++;
        }
    } else if (increment === 0) {
        // Zero increment - repeat same number
        while (i < maxCount) {
            result.push(start);
            i++;
        }
    }

    return result;
}

/**
 * Get maximum digit length from a set of numbers
 * @returns {number} Maximum length
 */
function getMaxDigitLength() {
    var max = 0;

    for (var i = 0; i < arguments.length; i++) {
        if (typeof arguments[i] === 'number') {
            var len = Math.abs(arguments[i]).toString().length;
            if (len > max) {
                max = len;
            }
        }
    }

    return max;
}

/**
 * Pad number with leading zeros
 * @param {number} num - Number to pad
 * @param {number} length - Target length
 * @returns {string} Padded number as string
 */
function padWithZeros(num, length) {
    var str = num.toString();
    while (str.length < length) {
        str = '0' + str;
    }
    return str;
}

/**
 * Shuffle array randomly
 * @param {Array} arr - Array to shuffle (modified in place)
 * @returns {Array} Shuffled array
 */
function shuffleArray(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = arr[j];
        arr[j] = arr[i];
        arr[i] = temp;
    }
    return arr;
}

/**
 * Filter text frames by content pattern
 * @param {Array} frames - Text frames to filter
 * @param {string} pattern - Regex pattern string
 * @returns {Array} Filtered text frames
 */
function filterByPattern(frames, pattern) {
    var result = [];
    var regex = new RegExp(pattern, 'gi');

    for (var i = 0; i < frames.length; i++) {
        if (regex.test(frames[i].contents)) {
            result.push(frames[i]);
        }
    }

    return result;
}

/**
 * Sort text frames by rows (left to right, top to bottom)
 * @param {Array} frames - Text frames to sort
 * @param {number} tolerance - Vertical tolerance for row detection
 */
function sortByRows(frames, tolerance) {
    frames.sort(function(a, b) {
        if (Math.abs(b.top - a.top) <= tolerance) {
            return a.left - b.left;
        }
        return b.top - a.top;
    });
}

/**
 * Sort text frames by columns (top to bottom, left to right)
 * @param {Array} frames - Text frames to sort
 * @param {number} tolerance - Horizontal tolerance for column detection
 */
function sortByColumns(frames, tolerance) {
    frames.sort(function(a, b) {
        if (Math.abs(a.left - b.left) <= tolerance) {
            return b.top - a.top;
        }
        return a.left - b.left;
    });
}

/**
 * Get text tolerance for sorting (based on character height)
 * @param {TextFrame} frame - Sample text frame
 * @returns {number} Tolerance value
 */
function getTextTolerance(frame) {
    if (frame.typename !== 'TextFrame') {
        return 0;
    }

    try {
        var dup = frame.duplicate();
        dup.selected = false;
        dup.contents = '0';
        var tolerance = dup.height;
        dup.remove();
        return tolerance;
    } catch (error) {
        return 0;
    }
}

// ============================================================================
// USER INTERFACE
// ============================================================================

/**
 * Show main dialog
 * @param {Array} textFrames - Text frames to number
 */
function showDialog(textFrames) {
    var isMac = AIS.System.isMac();
    var aiVersion = parseInt(app.version, 10);

    // Load saved settings
    var settings = loadSettings();

    // Dialog window
    var dialog = new Window('dialog', CFG.scriptName + ' ' + CFG.version);
    dialog.orientation = 'row';
    dialog.alignChildren = ['fill', 'top'];
    dialog.opacity = 0.97;

    // Left column - main controls
    var leftColumn = dialog.add('group');
    leftColumn.orientation = 'column';
    leftColumn.alignChildren = ['fill', 'top'];

    // Numbers panel
    var numbersPanel = leftColumn.add('panel', undefined, 'Numbers');
    numbersPanel.alignChildren = 'left';
    numbersPanel.spacing = 15;
    numbersPanel.margins = [10, 15, 10, 10];

    var inputGroup = numbersPanel.add('group');
    inputGroup.spacing = 15;

    var startGroup = inputGroup.add('group');
    startGroup.add('statictext', undefined, 'Start:');
    var startInput = startGroup.add('edittext', undefined, settings.start.toString());
    startInput.preferredSize.width = 48;

    if (isMac || aiVersion >= 26.4 || aiVersion <= 17) {
        startInput.active = true;
    }

    var endGroup = inputGroup.add('group');
    endGroup.add('statictext', undefined, 'End:');
    var endInput = endGroup.add('edittext', undefined, settings.end.toString());
    endInput.preferredSize.width = 48;

    var incGroup = inputGroup.add('group');
    incGroup.add('statictext', undefined, 'Increment:');
    var incInput = incGroup.add('edittext', undefined, settings.increment.toString());
    incInput.preferredSize.width = 48;

    // Number options
    var optionsGroup = numbersPanel.add('group');
    optionsGroup.alignChildren = ['left', 'top'];

    // Left options column
    var optLeft = optionsGroup.add('group');
    optLeft.orientation = 'column';
    optLeft.alignChildren = 'left';

    var useAllCheck = optLeft.add('checkbox', undefined, 'Number to last text');
    useAllCheck.value = settings.useAll;
    useAllCheck.helpTip = 'Auto-calculate end value based on text count';

    var shuffleCheck = optLeft.add('checkbox', undefined, 'Shuffle numbers order');
    shuffleCheck.value = settings.shuffle;

    var removeCheck = optLeft.add('checkbox', undefined, 'Remove unused texts');
    removeCheck.value = settings.removeUnused;

    // Divider
    var divider = optionsGroup.add('panel', undefined, undefined);
    divider.alignment = 'fill';

    // Right options column
    var optRight = optionsGroup.add('group');
    optRight.orientation = 'column';
    optRight.alignChildren = 'left';

    var leadingZerosCheck = optRight.add('checkbox', undefined, 'Add leading zeros');
    leadingZerosCheck.value = settings.leadingZeros;
    leadingZerosCheck.helpTip = 'E.g. 01, 02, 006, 00005';

    var autoDigitsRadio = optRight.add('radiobutton', undefined, 'Auto number of digits');
    autoDigitsRadio.value = settings.autoDigits;

    var fixedDigitsGroup = optRight.add('group');
    var fixedDigitsRadio = fixedDigitsGroup.add('radiobutton', undefined, 'Fixed, no less than:');
    fixedDigitsRadio.value = !settings.autoDigits;
    var fixedDigitsInput = fixedDigitsGroup.add('edittext', undefined, settings.fixedDigits.toString());
    fixedDigitsInput.characters = 3;

    // Options row (sorting and replacement)
    var optRow = leftColumn.add('group');
    optRow.alignChildren = ['fill', 'top'];

    // Sort panel
    var sortPanel = optRow.add('panel', undefined, 'Sort before numbering');
    sortPanel.alignChildren = 'left';
    sortPanel.margins = [10, 15, 10, 10];

    var sortOrderRadio = sortPanel.add('radiobutton', undefined, 'By order in layers');
    sortOrderRadio.value = (settings.sortMode === 'order');

    var sortRowsRadio = sortPanel.add('radiobutton', undefined, 'By rows (like Z)');
    sortRowsRadio.value = (settings.sortMode === 'rows');

    var sortColsRadio = sortPanel.add('radiobutton', undefined, 'By columns (like И)');
    sortColsRadio.value = (settings.sortMode === 'columns');

    // Replace panel
    var replacePanel = optRow.add('panel', undefined, 'Replace text to number');
    replacePanel.alignChildren = 'left';
    replacePanel.margins = [10, 15, 10, 10];

    var replaceFullRadio = replacePanel.add('radiobutton', undefined, 'Full text content');
    replaceFullRadio.value = (settings.replaceMode === 'full');

    var replaceNumbersRadio = replacePanel.add('radiobutton', undefined, 'Numbers in text');
    replaceNumbersRadio.value = (settings.replaceMode === 'numbers');

    var replacePlaceholderRadio = replacePanel.add('radiobutton', undefined, 'Only ' + CFG.placeholder + ' placeholder');
    replacePlaceholderRadio.value = (settings.replaceMode === 'placeholder');

    // Right column - buttons and preview
    var rightColumn = dialog.add('group');
    rightColumn.orientation = 'column';
    rightColumn.alignChildren = ['fill', 'top'];
    rightColumn.maximumSize.width = 80;

    var cancelButton, okButton;
    if (isMac) {
        cancelButton = rightColumn.add('button', undefined, 'Cancel', {name: 'cancel'});
        okButton = rightColumn.add('button', undefined, 'OK', {name: 'ok'});
    } else {
        okButton = rightColumn.add('button', undefined, 'OK', {name: 'ok'});
        cancelButton = rightColumn.add('button', undefined, 'Cancel', {name: 'cancel'});
    }

    cancelButton.helpTip = 'Press Esc to close';
    okButton.helpTip = 'Press Enter to apply';

    rightColumn.add('statictext', undefined, 'Preview');
    var previewText = rightColumn.add('statictext', undefined, '1\n2\n3\n4\n5\n6\n7\n8', {multiline: true});
    previewText.preferredSize.height = 110;

    // Event handlers
    startInput.onChange = endInput.onChange = incInput.onChange = updatePreview;
    replaceFullRadio.onClick = replaceNumbersRadio.onClick = replacePlaceholderRadio.onClick = updatePreview;
    fixedDigitsInput.onChange = shuffleCheck.onClick = updatePreview;

    leadingZerosCheck.onClick = function() {
        autoDigitsRadio.enabled = this.value;
        fixedDigitsGroup.enabled = this.value;
        updatePreview();
    };

    autoDigitsRadio.onClick = function() {
        fixedDigitsRadio.value = false;
        fixedDigitsInput.enabled = false;
        updatePreview();
    };

    fixedDigitsRadio.onClick = function() {
        autoDigitsRadio.value = false;
        fixedDigitsInput.enabled = true;
        updatePreview();
    };

    useAllCheck.onClick = function() {
        endGroup.enabled = !this.value;
        removeCheck.enabled = !this.value;
        updatePreview();
    };

    cancelButton.onClick = function() {
        dialog.close();
    };

    okButton.onClick = function() {
        applyNumbering();
        saveCurrentSettings();
        dialog.close(1);
    };

    /**
     * Update preview display
     */
    function updatePreview() {
        var tempFrames = [].concat(textFrames);
        var usePadding = leadingZerosCheck.value;
        var fixedLen = Math.max(1, parseFloatSafe(fixedDigitsInput.text, 3));

        var inc = parseFloatSafe(incInput.text, 1);
        var start = parseFloatSafe(startInput.text, 0);
        var end = useAllCheck.value ? start + (tempFrames.length - 1) * inc : parseFloatSafe(endInput.text, 10);

        var digitLen = getMaxDigitLength(start, end, (usePadding && fixedDigitsRadio.value ? Math.pow(10, fixedLen - 1) : 1));

        // Filter frames if needed
        if (replaceNumbersRadio.value) {
            tempFrames = filterByPattern(tempFrames, '\\d');
        } else if (replacePlaceholderRadio.value) {
            tempFrames = filterByPattern(tempFrames, CFG.placeholder);
        }

        var numbers = calculateSequence(inc, start, end, tempFrames.length);

        if (shuffleCheck.value) {
            shuffleArray(numbers);
        }

        // Apply padding if enabled
        for (var i = 0; i < numbers.length; i++) {
            if (usePadding && numbers[i] >= 0) {
                numbers[i] = padWithZeros(numbers[i], digitLen);
            }
        }

        // Show shortened preview
        var preview = getShortArray(numbers, 7, 2);
        previewText.text = preview.join('\n');
    }

    /**
     * Apply numbering to text frames
     */
    function applyNumbering() {
        var frames = [].concat(textFrames);
        var tolerance = getTextTolerance(frames[0]);

        var inc = parseFloatSafe(incInput.text, 1);
        var start = parseFloatSafe(startInput.text, 0);
        var end = useAllCheck.value ? start + (frames.length - 1) * inc : parseFloatSafe(endInput.text, 10);

        var usePadding = leadingZerosCheck.value;
        var fixedLen = Math.max(1, parseFloatSafe(fixedDigitsInput.text, 3));
        var digitLen = getMaxDigitLength(start, end, (usePadding && fixedDigitsRadio.value ? Math.pow(10, fixedLen - 1) : 1));

        // Sort if needed
        if (sortRowsRadio.value && !shuffleCheck.value) {
            sortByRows(frames, tolerance);
        } else if (sortColsRadio.value && !shuffleCheck.value) {
            sortByColumns(frames, tolerance);
        }

        // Filter frames if needed
        var replaceNumbers = replaceNumbersRadio.value;
        var replacePlaceholder = replacePlaceholderRadio.value;

        if (replaceNumbers) {
            frames = filterByPattern(frames, '\\d');
        } else if (replacePlaceholder) {
            frames = filterByPattern(frames, CFG.placeholder);
        }

        // Generate numbers
        var numbers = calculateSequence(inc, start, end, frames.length);

        if (shuffleCheck.value) {
            shuffleArray(numbers);
        }

        // Apply numbers to frames
        var pattern = replaceNumbers ? '(\\d+([.,]\\d+)*)' : CFG.placeholder;
        var regex = new RegExp(pattern, 'gi');

        for (var i = 0; i < numbers.length && i < frames.length; i++) {
            var numValue = usePadding && numbers[i] >= 0 ? padWithZeros(numbers[i], digitLen) : numbers[i];

            if (replacePlaceholder || replaceNumbers) {
                frames[i].contents = frames[i].contents.replace(regex, numValue.toString());
            } else {
                frames[i].contents = numValue.toString();
            }
        }

        // Remove unused frames if enabled
        if (removeCheck.enabled && removeCheck.value && numbers.length < frames.length) {
            for (var j = numbers.length; j < frames.length; j++) {
                frames[j].remove();
            }
        }
    }

    /**
     * Save current settings
     */
    function saveCurrentSettings() {
        var prefs = {
            start: startInput.text,
            end: endInput.text,
            increment: incInput.text,
            sortMode: sortOrderRadio.value ? 'order' : (sortRowsRadio.value ? 'rows' : 'columns'),
            replaceMode: replaceFullRadio.value ? 'full' : (replaceNumbersRadio.value ? 'numbers' : 'placeholder'),
            useAll: useAllCheck.value,
            shuffle: shuffleCheck.value,
            leadingZeros: leadingZerosCheck.value,
            autoDigits: autoDigitsRadio.value,
            fixedDigits: fixedDigitsInput.text,
            removeUnused: removeCheck.value
        };

        var folder = new Folder(SETTINGS.folder);
        if (!folder.exists) {
            folder.create();
        }

        var file = new File(SETTINGS.folder + SETTINGS.name);
        file.encoding = 'UTF-8';
        file.open('w');
        file.write(AIS.JSON.stringify(prefs));
        file.close();
    }

    // Initialize state
    endGroup.enabled = !useAllCheck.value;
    removeCheck.enabled = !useAllCheck.value;
    autoDigitsRadio.enabled = leadingZerosCheck.value;
    fixedDigitsGroup.enabled = leadingZerosCheck.value;
    fixedDigitsInput.enabled = !autoDigitsRadio.value;

    // Initial preview
    updatePreview();

    dialog.center();
    dialog.show();
}

// ============================================================================
// SETTINGS PERSISTENCE
// ============================================================================

/**
 * Load settings from file
 * @returns {Object} Settings object
 */
function loadSettings() {
    var file = new File(SETTINGS.folder + SETTINGS.name);

    if (file.exists) {
        try {
            file.encoding = 'UTF-8';
            file.open('r');
            var content = file.read();
            file.close();

            var saved = AIS.JSON.parse(content);

            return {
                start: saved.start || CFG.defaults.start,
                end: saved.end || CFG.defaults.end,
                increment: saved.increment || CFG.defaults.increment,
                leadingZeros: saved.leadingZeros || CFG.defaults.leadingZeros,
                autoDigits: saved.autoDigits !== undefined ? saved.autoDigits : CFG.defaults.autoDigits,
                fixedDigits: saved.fixedDigits || CFG.defaults.fixedDigits,
                useAll: saved.useAll || CFG.defaults.useAll,
                shuffle: saved.shuffle || CFG.defaults.shuffle,
                removeUnused: saved.removeUnused || CFG.defaults.removeUnused,
                sortMode: saved.sortMode || CFG.defaults.sortMode,
                replaceMode: saved.replaceMode || CFG.defaults.replaceMode
            };
        } catch (error) {
            // Return defaults on error
        }
    }

    return CFG.defaults;
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Parse string to float with fallback
 * @param {string} str - String to parse
 * @param {number} defaultValue - Default value
 * @returns {number} Parsed number
 */
function parseFloatSafe(str, defaultValue) {
    if (arguments.length < 2) {
        defaultValue = 1;
    }

    str = str.replace(/,/g, '.').replace(/[^\d.-]/g, '');
    var parts = str.split('.');
    str = parts[0] ? parts[0] + '.' + parts.slice(1).join('') : '';
    str = str.substr(0, 1) + str.substr(1).replace(/-/g, '');

    if (isNaN(str) || str.length === 0) {
        return parseFloat(defaultValue);
    }

    return parseFloat(str);
}

/**
 * Get shortened array for preview
 * @param {Array} arr - Array to shorten
 * @param {number} firstCount - Count from beginning
 * @param {number} lastCount - Count from end
 * @returns {Array} Shortened array with ellipsis
 */
function getShortArray(arr, firstCount, lastCount) {
    if (arr.length <= firstCount) {
        return arr;
    }

    var first = arr.slice(0, firstCount - (lastCount + 1));
    var last = arr.slice(-lastCount);
    return first.concat('...', last);
}

// ============================================================================
// EXECUTE
// ============================================================================

if (!AIS.Document.hasDocument()) {
    alert('No document\nOpen a document and try again');
} else if (!AIS.Document.hasSelection()) {
    alert('No selection\nSelect text frames and try again');
} else {
    try {
        main();
    } catch (e) {
        AIS.Error.show('Make Numbers Sequence error', e);
    }
}
