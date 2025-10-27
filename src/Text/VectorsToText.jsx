/**
 * Vectors to Text
 * @version 1.0.0
 * @description Convert vectorized text back to editable text by matching reference text
 * @author Christian Condamine (modernized for AIS)
 * @license MIT
 * @category Text
 * @requires Illustrator CS4 or higher
 *
 * Features:
 * - Convert outlined text back to editable text
 * - Match size, position, tracking, and color of vectorized group
 * - Requires: 1 vectorized text group + 1 non-vectorized text reference
 *
 * Usage:
 * 1. Select two objects:
 *    - A GROUP of vectorized letters (outlined text)
 *    - A TEXT frame with the same content in the same font (non-vectorized)
 * 2. Run the script
 * 3. The text replaces the vectorized group and is now editable
 *
 * Original: Christian Condamine (christian.condamine@laposte.net)
 * Modernized to use AIS library while preserving all functionality
 */

#include "../.lib/core.jsx"

//@target illustrator
#targetengine 'main'
app.preferences.setBooleanPreference('ShowExternalJSXWarning', false);

(function() {
    if (!app.documents.length) {
        alert('No documents\nOpen a document and try again');
        return;
    }

    if (app.activeDocument.selection.length !== 2) {
        alert('Invalid selection\n\nSelect exactly 2 objects:\n1. Vectorized text (group)\n2. Non-vectorized text (text frame)');
        return;
    }

    main();
})();

// ============================================================================
// MAIN FUNCTION
// ============================================================================

function main() {
    var selection = app.activeDocument.selection;

    // Release compound paths
    app.executeMenuCommand('noCompoundPath');

    // Identify text frame and group
    var textFrame, vectorGroup;

    if (selection[0].typename === 'TextFrame' && selection[1].typename === 'GroupItem') {
        textFrame = selection[0];
        vectorGroup = selection[1];
    } else if (selection[1].typename === 'TextFrame' && selection[0].typename === 'GroupItem') {
        textFrame = selection[1];
        vectorGroup = selection[0];
    } else {
        alert('Invalid selection\n\nSelect exactly 2 objects:\n1. Vectorized text (group)\n2. Non-vectorized text (text frame)');
        return;
    }

    // Convert vectorized text back to editable text
    convertVectorsToText(textFrame, vectorGroup);
}

// ============================================================================
// CONVERSION
// ============================================================================

/**
 * Convert vectorized text back to editable text
 * @param {TextFrame} textFrame - Reference text frame
 * @param {GroupItem} vectorGroup - Vectorized text group
 */
function convertVectorsToText(textFrame, vectorGroup) {
    // Reset text formatting
    textFrame.textRange.paragraphAttributes.justification = Justification.LEFT;
    textFrame.textRange.verticalScale = 100;
    textFrame.textRange.horizontalScale = 100;
    textFrame.textRange.characterAttributes.tracking = 0;

    // Step 1: Match vertical scale
    var tempOutline1 = textFrame.duplicate().createOutline();
    var verticalScale = (vectorGroup.height / tempOutline1.height) * 100;
    textFrame.resize(verticalScale, verticalScale);
    tempOutline1.remove();

    // Step 2: Match position
    var tempOutline2 = textFrame.duplicate().createOutline();
    textFrame.left += vectorGroup.left - tempOutline2.left;
    textFrame.top += vectorGroup.top - tempOutline2.top;

    // Step 3: Match width by adjusting tracking
    var widthDifference = vectorGroup.width - tempOutline2.width;
    var trackingAdjustment = (widthDifference * 1000) / (textFrame.textRange.size * (textFrame.textRange.length - 1));
    tempOutline2.remove();

    textFrame.textRange.characterAttributes.tracking = trackingAdjustment.toFixed(0);

    // Step 4: Match color
    var groupColor = findGroupColor(vectorGroup);
    if (groupColor) {
        textFrame.textRange.fillColor = groupColor;
    }

    // Remove vectorized group
    vectorGroup.remove();
}

/**
 * Find the fill color of the first non-group item in a group
 * Handles nested groups recursively
 * @param {GroupItem} group - Group to search
 * @returns {Color|null} Fill color of first item
 */
function findGroupColor(group) {
    for (var i = 0; i < group.pageItems.length; i++) {
        var item = group.pageItems[i];

        if (item.typename !== 'GroupItem') {
            return item.fillColor;
        } else {
            // Recurse into nested group
            var nestedColor = findGroupColor(item);
            if (nestedColor) {
                return nestedColor;
            }
        }
    }

    return null;
}

// ============================================================================
// ENTRY POINT (handled by IIFE at top)
// ============================================================================
