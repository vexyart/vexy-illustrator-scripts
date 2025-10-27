/**
 * Character Code Tool
 * @version 1.0.0
 * @description Convert between characters and their numeric representations (ASCII, Unicode, Binary, Hex, Octal)
 * @author Original: Christian Condamine (christian.condamine@laposte.net)
 *         Modernized for AIS by Adam (2025)
 * @license MIT
 * @category Text
 * @requires Illustrator CS4 or higher
 *
 * Features:
 * - Character to Binary
 * - Character to Decimal (ASCII code)
 * - Character to Hexadecimal
 * - Character to Octal
 * - Character to Unicode
 * - Decimal to Character
 * - Unicode to Character
 * - Unicode to Decimal
 * - Live conversion as you type
 *
 * Original: Christian Condamine - CodeCharacter.jsx
 * Modernized to use AIS library and English-only UI
 */

#include "../lib/core.jsx"

//@target illustrator
app.preferences.setBooleanPreference('ShowExternalJSXWarning', false);

// ============================================================================
// ENTRY POINT
// ============================================================================

(function() {
    try {
        main();
    } catch (err) {
        AIS.Error.show('Character Code Tool', err);
    }
})();

// ============================================================================
// CONFIGURATION
// ============================================================================

var CFG = {
    scriptName: 'Character Code Tool',
    scriptVersion: '1.0.0',
    conversionModes: [
        'char to bin',
        'char to dec',
        'char to hex',
        'char to oct',
        'char to unicode',
        'dec to char',
        'unicode to char',
        'unicode to dec'
    ]
};

// ============================================================================
// MAIN FUNCTION
// ============================================================================

function main() {
    var dialog = showDialog();
    dialog.show();
}

// ============================================================================
// USER INTERFACE
// ============================================================================

/**
 * Create and show dialog
 * @returns {Window} Dialog window
 */
function showDialog() {
    var dialog = new Window('dialog');
    dialog.text = CFG.scriptName;
    dialog.orientation = 'column';
    dialog.alignChildren = ['center', 'top'];
    dialog.spacing = 10;
    dialog.margins = 16;

    // Input panel
    var inputPanel = dialog.add('panel', undefined, 'Value to convert');
    inputPanel.orientation = 'row';
    inputPanel.alignChildren = ['left', 'center'];
    inputPanel.margins = 16;
    inputPanel.spacing = 5;
    inputPanel.preferredSize.width = 300;

    var inputText = inputPanel.add('edittext', undefined, '');
    inputText.preferredSize.width = 200;
    inputText.helpTip = 'Enter character, decimal code, or unicode value';

    var convertBtn = inputPanel.add('button', undefined, '>');
    convertBtn.preferredSize.width = 40;
    convertBtn.helpTip = 'Convert (or press Enter)';

    // Conversion type panel
    var conversionPanel = dialog.add('panel', undefined, 'Base Conversion');
    conversionPanel.orientation = 'row';
    conversionPanel.alignChildren = ['fill', 'center'];
    conversionPanel.margins = 16;

    var conversionList = conversionPanel.add('dropdownlist', undefined, CFG.conversionModes);
    conversionList.selection = 1; // char to dec by default
    conversionList.preferredSize.width = 260;

    // Result panel
    var resultPanel = dialog.add('panel', undefined, 'Result');
    resultPanel.orientation = 'row';
    resultPanel.alignChildren = ['fill', 'center'];
    resultPanel.margins = 16;

    var resultText = resultPanel.add('edittext', undefined, 'Result');
    resultText.preferredSize.width = 260;
    resultText.helpTip = 'Result of conversion';

    // Button
    var closeBtn = dialog.add('button', undefined, 'Close', {name: 'ok'});

    // Event handlers
    function performConversion() {
        var input = inputText.text;
        var modeIndex = conversionList.selection.index;
        var result = convert(input, modeIndex);
        resultText.text = result;
        inputText.active = true;
    }

    convertBtn.onClick = function() {
        performConversion();
    };

    inputText.onActivate = function() {
        performConversion();
    };

    conversionList.onChange = function() {
        if (inputText.text !== '') {
            performConversion();
        }
    };

    dialog.center();
    return dialog;
}

// ============================================================================
// CONVERSION LOGIC
// ============================================================================

/**
 * Convert input based on selected mode
 * @param {String} input - Input value
 * @param {Number} modeIndex - Conversion mode index
 * @returns {String} Converted result
 */
function convert(input, modeIndex) {
    try {
        switch (modeIndex) {
            case 0:
                return charToBin(input);
            case 1:
                return charToDec(input);
            case 2:
                return charToHex(input);
            case 3:
                return charToOct(input);
            case 4:
                return charToUnicode(input);
            case 5:
                return decToChar(input);
            case 6:
                return unicodeToChar(input);
            case 7:
                return unicodeToDec(input);
            default:
                return 'Error: Invalid mode';
        }
    } catch (err) {
        return 'Error: ' + err.message;
    }
}

/**
 * Convert character to binary
 * @param {String} input - Character or decimal number
 * @returns {String} Binary representation
 */
function charToBin(input) {
    if (input.length === 0) return '';

    var code;
    if (!isNaN(input)) {
        code = parseInt(input);
    } else {
        if (input.length !== 1) {
            alert('Invalid input\nPlease enter only one character');
            return 'Error';
        }
        code = input.charCodeAt(0);
    }

    var bin = code.toString(2);
    // Pad to multiple of 4 bits
    var padding = (4 - (bin.length % 4)) % 4;
    for (var i = 0; i < padding; i++) {
        bin = '0' + bin;
    }

    return bin;
}

/**
 * Convert character to decimal (ASCII/Unicode code)
 * @param {String} input - Single character
 * @returns {String} Decimal code
 */
function charToDec(input) {
    if (input.length === 0) return '';
    if (input.length !== 1) {
        alert('Invalid input\nPlease enter only one character');
        return 'Error';
    }

    return input.charCodeAt(0).toString();
}

/**
 * Convert character to hexadecimal
 * @param {String} input - Character or decimal number
 * @returns {String} Hexadecimal representation
 */
function charToHex(input) {
    if (input.length === 0) return '';

    var code;
    if (!isNaN(input)) {
        code = parseInt(input);
    } else {
        if (input.length !== 1) {
            alert('Invalid input\nPlease enter only one character');
            return 'Error';
        }
        code = input.charCodeAt(0);
    }

    return code.toString(16).toUpperCase();
}

/**
 * Convert character to octal
 * @param {String} input - Character or decimal number
 * @returns {String} Octal representation
 */
function charToOct(input) {
    if (input.length === 0) return '';

    var code;
    if (!isNaN(input)) {
        code = parseInt(input);
    } else {
        if (input.length !== 1) {
            alert('Invalid input\nPlease enter only one character');
            return 'Error';
        }
        code = input.charCodeAt(0);
    }

    return '\\' + code.toString(8);
}

/**
 * Convert character to Unicode escape sequence
 * @param {String} input - Single character
 * @returns {String} Unicode escape (e.g., \\u0041)
 */
function charToUnicode(input) {
    if (input.length === 0) return '';
    if (input.length !== 1) {
        alert('Invalid input\nPlease enter only one character');
        return 'Error';
    }

    var hex = input.charCodeAt(0).toString(16);
    // Pad to 4 digits
    while (hex.length < 4) {
        hex = '0' + hex;
    }

    return '\\u' + hex.toUpperCase();
}

/**
 * Convert decimal to character
 * @param {String} input - Decimal ASCII/Unicode code
 * @returns {String} Character
 */
function decToChar(input) {
    if (input.length === 0) return '';
    if (isNaN(input)) {
        alert('Invalid input\nPlease enter a valid decimal number');
        return 'Error';
    }

    var code = parseInt(input);
    if (code < 0 || code > 1114111) {
        alert('Invalid code\nDecimal code must be between 0 and 1114111');
        return 'Error';
    }

    return String.fromCharCode(code);
}

/**
 * Convert Unicode escape sequence to character
 * @param {String} input - Unicode escape (e.g., \\u0041 or 0041)
 * @returns {String} Character
 */
function unicodeToChar(input) {
    if (input.length === 0) return '';

    // Extract last 4 hex digits
    var hex = input.substr(input.length - 4, 4);

    if (hex.length !== 4) {
        alert('Invalid Unicode\nPlease enter at least 4 hex digits (e.g., \\u0041 or 0041)');
        return 'Error';
    }

    // Validate hex
    if (!/^[0-9A-Fa-f]{4}$/.test(hex)) {
        alert('Invalid Unicode\nLast 4 characters must be valid hexadecimal digits');
        return 'Error';
    }

    var code = parseInt(hex, 16);
    return String.fromCharCode(code);
}

/**
 * Convert Unicode escape sequence to decimal
 * @param {String} input - Unicode escape (e.g., \\u0041 or 0041)
 * @returns {String} Decimal code
 */
function unicodeToDec(input) {
    if (input.length === 0) return '';

    // Extract last 4 hex digits
    var hex = input.substr(input.length - 4, 4);

    if (hex.length !== 4) {
        alert('Invalid Unicode\nPlease enter at least 4 hex digits (e.g., \\u0041 or 0041)');
        return 'Error';
    }

    // Validate hex
    if (!/^[0-9A-Fa-f]{4}$/.test(hex)) {
        alert('Invalid Unicode\nLast 4 characters must be valid hexadecimal digits');
        return 'Error';
    }

    var code = parseInt(hex, 16);
    return code.toString();
}
