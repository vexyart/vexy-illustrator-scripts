/**
 * Character Code Tool
 * @version 1.0.0
 * @description Convert between character and various encoding formats (Binary, Decimal, Hex, Octal, Unicode)
 * @category Utilities
 *
 * Features:
 * - Character → Binary/Decimal/Hex/Octal/Unicode conversion
 * - Decimal/Unicode → Character conversion
 * - Unicode → Decimal conversion
 * - Live conversion with dropdown selection
 * - Input validation and error handling
 * - Educational tool for understanding character encodings
 *
 * Based on: CodeCharacter.jsx by Christian Condamine
 * Original: 179 lines (French) | Modernized: 280 lines (English)
 */




//@target illustrator
var c=File(Folder.myDocuments+"/Adobe Scripts/vexy-ville.ini");if(c.exists){c.open('r');var p=c.read();c.close();var l=File(p+".lib/core.jsx");if(l.exists)$.evalFile(l.fsName);}
app.preferences.setBooleanPreference('ShowExternalJSXWarning', false);

// Note: No document required for this utility
main();

// ============================================================================
// CONFIGURATION
// ============================================================================

var CFG = {
    CONVERSION_MODES: [
        'Char to Binary',
        'Char to Decimal',
        'Char to Hex',
        'Char to Octal',
        'Char to Unicode',
        'Decimal to Char',
        'Unicode to Char',
        'Unicode to Decimal'
    ],
    DEFAULT_MODE: 1 // Char to Decimal
};

// ============================================================================
// MAIN FUNCTION
// ============================================================================

/**
 * Main entry point
 */
function main() {
    try {
        var dialog = buildDialog();
        dialog.show();
    } catch (err) {
        alert('Error creating dialog\n' + err.message);
    }
}

// ============================================================================
// USER INTERFACE
// ============================================================================

/**
 * Build the character code conversion dialog
 * @returns {Window} Dialog window
 */
function buildDialog() {
    var dialog = new Window('dialog', 'Character Code Tool');
    dialog.alignChildren = ['center', 'top'];

    // Input panel
    var inputPanel = dialog.add('panel', undefined, 'Input Value');
    inputPanel.orientation = 'row';
    inputPanel.margins = 10;
    inputPanel.alignChildren = ['left', 'center'];

    var inputField = inputPanel.add('edittext', undefined, '0');
    inputField.characters = 15;
    inputField.active = true;

    var convertBtn = inputPanel.add('button', undefined, '>');
    convertBtn.preferredSize = [30, 25];

    // Conversion mode panel
    var modePanel = dialog.add('panel', undefined, 'Conversion Mode');
    modePanel.orientation = 'row';
    modePanel.margins = 10;

    var modeDropdown = modePanel.add('dropdownlist', undefined, CFG.CONVERSION_MODES);
    modeDropdown.selection = CFG.DEFAULT_MODE;
    modeDropdown.preferredSize = [200, -1];

    // Result panel
    var resultPanel = dialog.add('panel', undefined, 'Result');
    resultPanel.orientation = 'row';
    resultPanel.margins = 10;

    var resultField = resultPanel.add('edittext', undefined, '48');
    resultField.characters = 20;
    resultField.enabled = true; // Allow copying result

    // Close button
    var closeBtn = dialog.add('button', undefined, 'Close', {name: 'ok'});

    // Event handlers
    convertBtn.onClick = function() {
        var result = performConversion(inputField.text, modeDropdown.selection.index);
        resultField.text = result;
        inputField.active = true;
    };

    modeDropdown.onChange = function() {
        var result = performConversion(inputField.text, modeDropdown.selection.index);
        resultField.text = result;
    };

    // Perform initial conversion
    resultField.text = performConversion(inputField.text, modeDropdown.selection.index);

    return dialog;
}

// ============================================================================
// CORE LOGIC - CONVERSION FUNCTIONS
// ============================================================================

/**
 * Perform conversion based on selected mode
 * @param {String} input - Input value
 * @param {Number} modeIndex - Conversion mode index
 * @returns {String} Conversion result
 */
function performConversion(input, modeIndex) {
    try {
        switch (modeIndex) {
            case 0: return charToBinary(input);
            case 1: return charToDecimal(input);
            case 2: return charToHex(input);
            case 3: return charToOctal(input);
            case 4: return charToUnicode(input);
            case 5: return decimalToChar(input);
            case 6: return unicodeToChar(input);
            case 7: return unicodeToDecimal(input);
            default: return 'Error';
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
function charToBinary(input) {
    var code;

    if (!isNaN(input)) {
        // Input is a number
        code = parseInt(input, 10);
    } else {
        // Input is a character
        if (input.length !== 1) {
            alert('Error: Enter only one character');
            return 'Error';
        }
        code = input.charCodeAt(0);
    }

    // Convert to binary and pad to 8 bits
    var binary = code.toString(2);
    var padding = 8 - (binary.length % 8);
    if (padding !== 8 && padding > 0) {
        binary = new Array(padding + 1).join('0') + binary;
    }

    return binary;
}

/**
 * Convert character to decimal (ASCII/Unicode code point)
 * @param {String} input - Single character
 * @returns {String} Decimal code
 */
function charToDecimal(input) {
    if (input.length !== 1) {
        alert('Error: Enter only one character');
        return 'Error';
    }

    return input.charCodeAt(0).toString();
}

/**
 * Convert character to hexadecimal
 * @param {String} input - Character or decimal number
 * @returns {String} Hex representation
 */
function charToHex(input) {
    var code;

    if (!isNaN(input)) {
        // Input is a number
        code = parseInt(input, 10);
    } else {
        // Input is a character
        if (input.length !== 1) {
            alert('Error: Enter only one character');
            return 'Error';
        }
        code = input.charCodeAt(0);
    }

    return code.toString(16).toUpperCase();
}

/**
 * Convert character to octal
 * @param {String} input - Character or decimal number
 * @returns {String} Octal representation (with backslash prefix)
 */
function charToOctal(input) {
    var code;

    if (!isNaN(input)) {
        // Input is a number
        code = parseInt(input, 10);
    } else {
        // Input is a character
        if (input.length !== 1) {
            alert('Error: Enter only one character');
            return 'Error';
        }
        code = input.charCodeAt(0);
    }

    return '\\' + code.toString(8);
}

/**
 * Convert character to Unicode escape sequence
 * @param {String} input - Single character
 * @returns {String} Unicode escape sequence (\uXXXX)
 */
function charToUnicode(input) {
    if (input.length !== 1) {
        alert('Error: Enter only one character');
        return 'Error';
    }

    var hex = input.charCodeAt(0).toString(16).toUpperCase();

    // Pad to 4 digits
    while (hex.length < 4) {
        hex = '0' + hex;
    }

    return '\\u' + hex;
}

/**
 * Convert decimal code to character
 * @param {String} input - Decimal code point
 * @returns {String} Character
 */
function decimalToChar(input) {
    if (isNaN(input)) {
        alert('Error: Enter a valid decimal number');
        return 'Error';
    }

    var code = parseInt(input, 10);
    return String.fromCharCode(code);
}

/**
 * Convert Unicode escape sequence to character
 * @param {String} input - Unicode escape (\uXXXX or XXXX)
 * @returns {String} Character
 */
function unicodeToChar(input) {
    // Extract last 4 hex digits
    var hex = input.substr(input.length - 4, 4);

    if (hex.length !== 4) {
        alert('Error: Unicode value must have at least 4 characters');
        return 'Error';
    }

    var code = parseInt(hex, 16);
    return String.fromCharCode(code);
}

/**
 * Convert Unicode escape sequence to decimal
 * @param {String} input - Unicode escape (\uXXXX or XXXX)
 * @returns {String} Decimal code
 */
function unicodeToDecimal(input) {
    // Extract last 4 hex digits
    var hex = input.substr(input.length - 4, 4);

    if (hex.length !== 4) {
        alert('Error: Unicode value must have at least 4 characters');
        return 'Error';
    }

    var code = parseInt(hex, 16);
    return code.toString();
}
