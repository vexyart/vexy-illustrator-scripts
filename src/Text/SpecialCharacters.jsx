/**
 * Special Characters
 * @version 1.0.0
 * @description Display a floating palette for inserting special characters during text editing.
 *              Provides quick access to commonly used typography symbols, accented characters,
 *              and special symbols that are not directly accessible from the keyboard.
 * @category Text
 * @author Original by Christian Condamine | Modernized for AIS framework
 *
 * @requires lib/core.jsx
 *
 * @features
 *   - Floating palette with categorized character buttons
 *   - French accented capitals (À, É, È, Ù, Ç)
 *   - Ligatures (Æ, Œ, æ, œ)
 *   - Typography symbols (©, ®, ™, €, £, ¥)
 *   - Punctuation (—, –, «, », ", ", ', ')
 *   - Math symbols (±, ×, ÷, ≠, ≈)
 *   - Inserts character at text cursor position
 *   - Persistent palette (stays open while working)
 *   - Validates text selection before insertion
 *
 * @usage
 *   1. Place text cursor in a text frame at desired insertion point
 *   2. Run script to display palette
 *   3. Click any button to insert that character
 *   4. Palette remains open for multiple insertions
 *   5. Close palette when done
 *
 * @notes
 *   - Uses #targetengine for persistent palette
 *   - Uses BridgeTalk for communication with Illustrator
 *   - Cursor must be placed in text (no selection)
 *   - Works with point text, area text, and path text
 */

#targetengine specialCharactersPalette
#include "../.lib/core.jsx"

//@target illustrator
app.preferences.setBooleanPreference('ShowExternalJSXWarning', false);

// ============================================================================
// CONFIGURATION
// ============================================================================

var CFG = {
    // Character categories and their symbols
    characters: {
        // French accented capitals
        french: [
            {char: '\u00C0', label: 'À'},  // A grave
            {char: '\u00C9', label: 'É'},  // E acute
            {char: '\u00C8', label: 'È'},  // E grave
            {char: '\u00D9', label: 'Ù'},  // U grave
            {char: '\u00C7', label: 'Ç'}   // C cedilla
        ],

        // Ligatures
        ligatures: [
            {char: '\u00C6', label: 'Æ'},  // AE capital
            {char: '\u0152', label: 'Œ'},  // OE capital
            {char: '\u00E6', label: 'æ'},  // ae lowercase
            {char: '\u0153', label: 'œ'},  // oe lowercase
            {char: '\u00D8', label: 'Ø'}   // O slash
        ],

        // Typography symbols
        symbols: [
            {char: '\u00A9', label: '©'},  // Copyright
            {char: '\u00AE', label: '®'},  // Registered
            {char: '\u2122', label: '™'},  // Trademark
            {char: '\u00A7', label: '§'},  // Section
            {char: '\u00B6', label: '¶'}   // Paragraph
        ],

        // Currency
        currency: [
            {char: '\u20AC', label: '€'},  // Euro
            {char: '\u00A3', label: '£'},  // Pound
            {char: '\u00A5', label: '¥'},  // Yen
            {char: '\u00A2', label: '¢'},  // Cent
            {char: '\u0192', label: 'ƒ'}   // Florin
        ],

        // Punctuation
        punctuation: [
            {char: '\u2014', label: '—'},  // Em dash
            {char: '\u2013', label: '–'},  // En dash
            {char: '\u00AB', label: '«'},  // Left guillemet
            {char: '\u00BB', label: '»'},  // Right guillemet
            {char: '\u2026', label: '…'}   // Ellipsis
        ],

        // Quotes
        quotes: [
            {char: '\u201C', label: '"'},  // Left double quote
            {char: '\u201D', label: '"'},  // Right double quote
            {char: '\u2018', label: '''},  // Left single quote
            {char: '\u2019', label: '''},  // Right single quote
            {char: '\u201A', label: '‚'}   // Single low quote
        ],

        // Math
        math: [
            {char: '\u00B1', label: '±'},  // Plus-minus
            {char: '\u00D7', label: '×'},  // Multiplication
            {char: '\u00F7', label: '÷'},  // Division
            {char: '\u2260', label: '≠'},  // Not equal
            {char: '\u2248', label: '≈'}   // Almost equal
        ]
    },

    // UI settings
    ui: {
        paletteTitle: 'Special Characters',
        buttonSize: 30,
        buttonSpacing: 5,
        buttonsPerRow: 5,
        categorySpacing: 15,
        fontSize: 16
    }
};

// Global variable for character to insert (used by BridgeTalk)
var currentChar;

// ============================================================================
// MAIN FUNCTION
// ============================================================================

function main() {
    // Validate selection
    var doc = app.activeDocument;
    var selection = doc.selection;

    // Check if cursor is in text
    if (selection.typename !== 'TextRange') {
        alert(
            'No text cursor\n\n' +
            'Please place the text cursor in a text frame at the position ' +
            'where you want to insert a special character, then run this script again.'
        );
        return;
    }

    // Check if text is selected (we need cursor position, not selection)
    if (selection.length !== 0) {
        alert(
            'Text selected\n\n' +
            'Please place the cursor at the insertion point (without selecting text), ' +
            'then run this script again.'
        );
        return;
    }

    // Store reference for insertion
    var textIndex = selection.start;
    var textChars = selection.parent.textRange.characters;

    // Show palette
    showPalette();
}

// ============================================================================
// USER INTERFACE
// ============================================================================

/**
 * Show the floating character palette
 * @returns {Window} The palette window
 */
function showPalette() {
    // Create palette window (floating, stays on top)
    var palette = new Window('palette', CFG.ui.paletteTitle, undefined);
    palette.alignChildren = ['fill', 'top'];
    palette.spacing = CFG.ui.categorySpacing;
    palette.margins = 16;

    // Add category groups
    addCategoryGroup(palette, 'French', CFG.characters.french);
    addCategoryGroup(palette, 'Ligatures', CFG.characters.ligatures);
    addCategoryGroup(palette, 'Symbols', CFG.characters.symbols);
    addCategoryGroup(palette, 'Currency', CFG.characters.currency);
    addCategoryGroup(palette, 'Punctuation', CFG.characters.punctuation);
    addCategoryGroup(palette, 'Quotes', CFG.characters.quotes);
    addCategoryGroup(palette, 'Math', CFG.characters.math);

    // Add close button
    var closeGroup = palette.add('group');
    closeGroup.alignment = ['center', 'top'];
    var closeBtn = closeGroup.add('button', undefined, 'Close');
    closeBtn.preferredSize.width = 150;
    closeBtn.onClick = function() {
        palette.close();
    };

    // Show palette
    palette.show();

    return palette;
}

/**
 * Add a category group of character buttons to the palette
 * @param {Window} parent - Parent window
 * @param {string} title - Category title
 * @param {Array} chars - Array of character objects {char, label}
 */
function addCategoryGroup(parent, title, chars) {
    var group = parent.add('group');
    group.orientation = 'column';
    group.alignChildren = ['fill', 'top'];
    group.spacing = 5;

    // Add category title
    var titleText = group.add('statictext', undefined, title);
    titleText.graphics.font = ScriptUI.newFont(titleText.graphics.font.name, 'BOLD', 11);

    // Add character buttons
    var buttonGroup = group.add('group');
    buttonGroup.orientation = 'row';
    buttonGroup.spacing = CFG.ui.buttonSpacing;

    for (var i = 0; i < chars.length; i++) {
        var charData = chars[i];
        var btn = buttonGroup.add('button', undefined, charData.label);
        btn.preferredSize = [CFG.ui.buttonSize, CFG.ui.buttonSize];
        btn.graphics.font = ScriptUI.newFont(btn.graphics.font.name, 'BOLD', CFG.ui.fontSize);

        // Store character in button (closure workaround)
        btn.charValue = charData.char;

        // Button click handler
        btn.onClick = function() {
            insertCharacter(this.charValue);
            // Deactivate button to give visual feedback
            this.active = false;
        };
    }
}

// ============================================================================
// CORE LOGIC
// ============================================================================

/**
 * Insert a character at the current cursor position
 * Uses BridgeTalk to communicate with Illustrator from palette engine
 * @param {string} char - Character to insert
 */
function insertCharacter(char) {
    // Build script to execute in Illustrator
    var script = [
        'var doc = app.activeDocument;',
        'var selection = doc.selection;',
        'if (selection.typename === "TextRange" && selection.length === 0) {',
        '    selection.contents = "' + char + '";',
        '}'
    ].join('\n');

    // Execute via BridgeTalk
    var bt = new BridgeTalk();
    bt.target = 'illustrator';
    bt.body = script;
    bt.send();
}

// ============================================================================
// ENTRY POINT
// ============================================================================

// Run main function
try {
    if (!app.documents.length) {
        alert(
            'No document\n\n' +
            'Open a document with text frames and try again.'
        );
    } else {
        main();
    }
} catch (err) {
    alert(
        'Error: ' + err.message + '\n' +
        'Line: ' + (err.line || 'unknown')
    );
}
