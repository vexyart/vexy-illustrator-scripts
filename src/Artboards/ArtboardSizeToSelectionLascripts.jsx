/**
 * Artboard Size to Selection (LAScripts)
 * @version 1.0.0
 * @description LAScripts wrapper to resize artboard to fit selection. Depends on LAScripts framework. Similar to existing FitArtboardsToArtwork.
 * @author Adobe Illustrator Scripts
 * @license MIT
 * @category Artboards
 */




//@target illustrator
var c=File(Folder.myDocuments+"/Adobe Scripts/vexy-ville.ini");if(c.exists){c.open('r');var p=c.read();c.close();var l=File(p+".lib/core.jsx");if(l.exists)$.evalFile(l.fsName);}
app.preferences.setBooleanPreference('ShowExternalJSXWarning', false);

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
        // PHASE 5: This script requires reimplementation from LAScripts framework
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

// ============================================================================
// EXECUTE
// ============================================================================

var validation = validateEnvironment();
if (!validation.valid) {
    alert(SCRIPT.name + '\n\n' + validation.message);
} else {
    try {
        main();
    } catch (e) {
        AIS.Error.show('Script error', e);
    }
}
