/**
 * Artboard Size to Selection (LAScripts)
 * @version 1.0.0
 * @description LAScripts wrapper to resize artboard to fit selection. Depends on LAScripts framework. Similar to existing FitArtboardsToArtwork.
 * @author Adobe Illustrator Scripts
 * @license MIT
 * @category Artboards
 */

#include "../lib/core.jsx"

var SCRIPT = {
    name: 'Artboard Size to Selection (LAScripts)',
    version: '1.0.0',
    description: 'LAScripts wrapper to resize artboard to fit selection. Depends on LAScripts framework. Similar to existing FitArtboardsToArtwork.',
    category: 'Artboards',
    requiresDocument: true,
    requiresSelection: true
};

function main() {
    var doc = AIS.Document.getActive();
    if (!doc) return;

    try {
        // TODO: Implement functionality
        // Original script: old2/Artboard Size to Selection.js
        if (selection.length) {
            activeDocument.getActiveArtboard().artboardRect = $.selectionBounds('visibleBounds');
        }
            else {
            }
    } catch (e) {
        AIS.Error.show('Error in Artboard Size to Selection (LAScripts)', e);
    }
}

function validateEnvironment() {
    if (SCRIPT.requiresDocument && !AIS.Document.hasDocument()) {
        return { valid: false, message: 'Please open a document first.' };
    }
    if (SCRIPT.requiresSelection && !AIS.Document.hasSelection()) {
        return { valid: false, message: 'Please select at least one object.' };
    }
    return { valid: true };
}

(function() {
    var validation = validateEnvironment();
    if (!validation.valid) {
        alert(SCRIPT.name + '\n\n' + validation.message);
        return;
    }
    try {
        main();
    } catch (err) {
        AIS.Error.show('Unexpected error occurred', err);
    }
})();
