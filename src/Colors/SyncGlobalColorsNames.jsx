/**
 * Sync Global Colors Names
 * @version 1.0.0
 * @description Synchronize global color names across all open documents
 * @category Colors
 *
 * Features:
 * - Sync spot/global color names between documents
 * - Match colors by RGB values
 * - Choose source document from dropdown
 * - Automatically save modified documents
 * - Skip [Registration] color
 *
 * Use case: Maintain consistent color naming across multiple files
 * in a project (e.g., multi-page documents, asset libraries)
 *
 * Original: SyncGlobalColorsNames.jsx by Sergey Osokin
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

    if (app.documents.length < 2) {
        alert('Not enough documents\nOpen at least 2 documents to sync colors between them');
        return;
    }

    main();
})();

// ============================================================================
// CONFIGURATION
// ============================================================================

var CFG = {
    scriptName: 'Sync Global Colors Names',
    version: '1.0.0',
    registrationColor: '[Registration]'
};

// ============================================================================
// MAIN FUNCTION
// ============================================================================

function main() {
    var currentDoc = app.activeDocument;
    var config = showDialog();

    if (!config) return;

    try {
        var sourceDoc = app.documents[config.sourceIndex];
        var colorData = collectGlobalColorData(sourceDoc);

        if (colorData.length === 0) {
            alert('No global colors\nSource document has no global colors to sync');
            return;
        }

        var updatedCount = syncColorsToDocuments(sourceDoc, colorData);

        // Restore original active document
        app.activeDocument = currentDoc;

        alert('Global colors synced\n' + updatedCount + ' document' + (updatedCount === 1 ? '' : 's') + ' updated and saved', 'Success');
    } catch (error) {
        AIS.Error.show('Sync Colors Error', error);
    }
}

// ============================================================================
// CORE LOGIC
// ============================================================================

/**
 * Collect global color data from source document
 * @param {Document} doc - Source document
 * @returns {Array} Array of color data objects
 */
function collectGlobalColorData(doc) {
    var colorData = [];

    for (var i = 0; i < doc.spots.length; i++) {
        var spot = doc.spots[i];

        // Skip registration color
        if (spot.name === CFG.registrationColor) {
            continue;
        }

        colorData.push({
            name: spot.name,
            red: spot.color.red,
            green: spot.color.green,
            blue: spot.color.blue
        });
    }

    return colorData;
}

/**
 * Sync colors to all other open documents
 * @param {Document} sourceDoc - Source document
 * @param {Array} colorData - Array of color data
 * @returns {number} Count of documents updated
 */
function syncColorsToDocuments(sourceDoc, colorData) {
    var updatedCount = 0;

    for (var i = 0; i < app.documents.length; i++) {
        var doc = app.documents[i];

        // Skip source document
        if (doc === sourceDoc) {
            continue;
        }

        var updated = updateDocumentColors(doc, colorData);

        if (updated) {
            // Save document if it has a path
            try {
                app.activeDocument = doc;
                if (doc.path !== '') {
                    doc.save();
                    updatedCount++;
                }
            } catch (error) {
                // Skip documents that can't be saved
            }
        }
    }

    return updatedCount;
}

/**
 * Update global color names in a document
 * @param {Document} doc - Target document
 * @param {Array} colorData - Array of color data from source
 * @returns {boolean} True if any colors were updated
 */
function updateDocumentColors(doc, colorData) {
    var updated = false;

    for (var i = 0; i < colorData.length; i++) {
        var sourceColor = colorData[i];

        for (var j = 0; j < doc.spots.length; j++) {
            var targetSpot = doc.spots[j];

            // Skip registration color
            if (targetSpot.name === CFG.registrationColor) {
                continue;
            }

            // Match by RGB values
            if (colorsMatch(sourceColor, targetSpot.color)) {
                if (targetSpot.name !== sourceColor.name) {
                    targetSpot.name = sourceColor.name;
                    updated = true;
                }
            }
        }
    }

    return updated;
}

/**
 * Check if two colors match by RGB values
 * @param {Object} colorData - Color data object with red/green/blue
 * @param {Color} spotColor - Spot color to compare
 * @returns {boolean} True if colors match
 */
function colorsMatch(colorData, spotColor) {
    return (colorData.red === spotColor.red &&
            colorData.green === spotColor.green &&
            colorData.blue === spotColor.blue);
}

// ============================================================================
// USER INTERFACE
// ============================================================================

/**
 * Show source document selection dialog
 * @returns {Object|null} Configuration object or null if cancelled
 */
function showDialog() {
    var dialog = new Window('dialog', CFG.scriptName + ' ' + CFG.version);
    dialog.orientation = 'column';
    dialog.alignChildren = ['fill', 'fill'];

    // Source document panel
    var panel = dialog.add('panel', undefined, 'Source Document for Sync');
    panel.alignChildren = ['fill', 'center'];
    panel.margins = [10, 15, 10, 10];

    var docNames = [];
    for (var i = 0; i < app.documents.length; i++) {
        docNames.push(app.documents[i].name);
    }

    var docDropdown = panel.add('dropdownlist', [0, 0, 250, 30], docNames);
    docDropdown.selection = 0;
    docDropdown.helpTip = 'Select the document whose color names will be used as the source';

    // Buttons
    var buttonGroup = dialog.add('group');
    buttonGroup.alignChildren = ['center', 'fill'];

    var cancelButton = buttonGroup.add('button', undefined, 'Cancel', {name: 'cancel'});
    var okButton = buttonGroup.add('button', [0, 0, 100, 30], 'OK', {name: 'ok'});

    cancelButton.onClick = function() {
        dialog.close();
    };

    okButton.onClick = function() {
        dialog.close(1);
    };

    dialog.center();
    var result = dialog.show();

    if (result === 1) {
        return {
            sourceIndex: docDropdown.selection.index
        };
    }

    return null;
}
