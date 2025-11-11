/**
 * Replace Formatted Text
 * @version 1.0.0
 * @description Paste text from clipboard without formatting while preserving paragraph character styles
 * @category Replace
 *
 * Features:
 * - Paste text from clipboard into text frames
 * - Preserve original paragraph character formatting
 * - Apply first paragraph style to all text if insufficient styles
 * - Works with multiple selected text frames
 * - Recursive group processing
 *
 * Based on: ReplaceFormattedText.jsx by Sergey Osokin
 * Source: https://github.com/creold
 * Original: 190 lines | Modernized: 220 lines
 */




//@target illustrator
var c=File(Folder.myDocuments+"/Adobe Scripts/vexy-ville.ini");if(c.exists){c.open('r');var p=c.read();c.close();var l=File(p+".lib/core.jsx");if(l.exists)$.evalFile(l.fsName);}
app.preferences.setBooleanPreference('ShowExternalJSXWarning', false);

// ============================================================================
// MAIN FUNCTION
// ============================================================================

/**
 * Main entry point
 */
function main() {
    try {
        var doc = app.activeDocument;
        var sel = doc.selection;

        // Get all text frames from selection
        var textFrames = getTextFrames(sel);

        if (textFrames.length === 0) {
            alert('No text frames selected\nSelect at least one text frame and try again');
            return;
        }

        // Get clipboard content
        var clipboardText = getClipboardText(sel);

        if (!clipboardText) {
            alert('Clipboard is empty\nCopy some text and try again');
            return;
        }

        // Replace content in all text frames
        for (var i = 0; i < textFrames.length; i++) {
            replaceWithFormattedText(textFrames[i], clipboardText);
        }

    } catch (err) {
        AIS.Error.show('Failed to replace formatted text', err);
    }
}

// ============================================================================
// CORE LOGIC
// ============================================================================

/**
 * Get all text frames from collection (recursive for groups)
 * @param {Collection} collection - Selection or group items
 * @returns {Array} Array of text frames
 */
function getTextFrames(collection) {
    var result = [];

    for (var i = 0; i < collection.length; i++) {
        var item = collection[i];

        if (item.typename === 'TextFrame') {
            result.push(item);
        } else if (item.typename === 'GroupItem') {
            // Recursive: process group contents
            var groupFrames = getTextFrames(item.pageItems);
            result = result.concat(groupFrames);
        }
    }

    return result;
}

/**
 * Get text content from clipboard by pasting temporarily
 * @param {Selection} originalSelection - Original selection to restore
 * @returns {String} Clipboard text content
 */
function getClipboardText(originalSelection) {
    var clipboardText = '';

    try {
        // Paste to get clipboard content
        app.paste();

        // Get content from pasted item
        if (app.selection.length > 0) {
            var pastedItem = app.selection[0];

            if (pastedItem.typename === 'TextFrame') {
                clipboardText = pastedItem.contents;
            }

            // Remove pasted item
            pastedItem.remove();
        }

        // Restore original selection
        app.selection = originalSelection;

    } catch (err) {
        // Clipboard might be empty or contain non-text
    }

    return clipboardText;
}

/**
 * Replace text content while preserving paragraph character formatting
 * @param {TextFrame} textFrame - Target text frame
 * @param {String} newText - New text content from clipboard
 */
function replaceWithFormattedText(textFrame, newText) {
    try {
        // Step 1: Extract character attributes from each paragraph
        var originalStyles = extractParagraphStyles(textFrame);

        // Step 2: Replace text content
        textFrame.contents = newText;

        // Step 3: Apply original styles to new paragraphs
        applyParagraphStyles(textFrame, originalStyles);

    } catch (err) {
        // Skip this text frame if error occurs
    }
}

/**
 * Extract character attributes from each paragraph's first character
 * @param {TextFrame} textFrame - Source text frame
 * @returns {Array} Array of character attribute objects
 */
function extractParagraphStyles(textFrame) {
    var styles = [];

    try {
        var paragraphs = textFrame.paragraphs;

        for (var i = 0; i < paragraphs.length; i++) {
            var para = paragraphs[i];

            // Only extract style from non-empty paragraphs
            if (para.contents.replace(/^\s+|\s+$/g, '').length > 0) {
                if (para.characters.length > 0) {
                    var charAttrs = para.characters[0].characterAttributes;
                    var styleCopy = copyCharacterAttributes(charAttrs);
                    styles.push(styleCopy);
                }
            }
        }
    } catch (err) {
        // Return whatever styles we collected
    }

    return styles;
}

/**
 * Apply character styles to paragraphs in text frame
 * @param {TextFrame} textFrame - Target text frame
 * @param {Array} styles - Array of character attribute objects
 */
function applyParagraphStyles(textFrame, styles) {
    if (styles.length === 0) {
        return;
    }

    try {
        var paragraphs = textFrame.paragraphs;
        var styleIndex = 0;

        for (var i = 0; i < paragraphs.length; i++) {
            var para = paragraphs[i];

            // Only apply to non-empty paragraphs
            if (para.contents.replace(/^\s+|\s+$/g, '').length > 0) {
                // Use corresponding style, or last style if we run out
                var style = (styleIndex < styles.length) ? styles[styleIndex] : styles[styles.length - 1];

                applyCharacterAttributes(style, para.characterAttributes);
                styleIndex++;
            }
        }
    } catch (err) {
        // Skip if error occurs
    }
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Copy character attributes object (deep copy of properties)
 * @param {CharacterAttributes} attrs - Source attributes
 * @returns {Object} Copy of attributes
 */
function copyCharacterAttributes(attrs) {
    var copy = {};

    for (var key in attrs) {
        if (attrs.hasOwnProperty(key)) {
            try {
                copy[key] = attrs[key];
            } catch (err) {
                // Skip properties that can't be read
            }
        }
    }

    return copy;
}

/**
 * Apply character attributes to target
 * @param {Object} sourceAttrs - Source attributes object
 * @param {CharacterAttributes} targetAttrs - Target attributes to modify
 */
function applyCharacterAttributes(sourceAttrs, targetAttrs) {
    for (var key in sourceAttrs) {
        try {
            // Special case: Fix Illustrator bug with empty stroke color
            if (key === 'strokeWeight') {
                var strokeColor = sourceAttrs.strokeColor;
                if (strokeColor && strokeColor.typename === 'NoColor') {
                    targetAttrs.strokeWeight = 0;
                    continue;
                }
            }

            targetAttrs[key] = sourceAttrs[key];
        } catch (err) {
            // Skip properties that can't be set
        }
    }
}

// ============================================================================
// EXECUTE
// ============================================================================

if (!AIS.Document.hasDocument()) {
    alert('No document\nOpen a document and try again');
} else if (!AIS.Document.hasSelection()) {
    alert('No selection\nSelect at least one text frame and try again');
} else {
    try {
        main();
    } catch (e) {
        AIS.Error.show('Script error', e);
    }
}
