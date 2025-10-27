/**
 * Text All Convert to Outline (LAScripts)
 * @version 1.0.0
 * @description LAScripts wrapper to convert all text to outlines. Depends on LAScripts framework.
 * @author Adobe Illustrator Scripts
 * @license MIT
 * @category Text
 */

#include "../.lib/core.jsx"

var SCRIPT = {
    name: 'Text All Convert to Outline (LAScripts)',
    version: '1.0.0',
    description: 'LAScripts wrapper to convert all text to outlines. Depends on LAScripts framework.',
    category: 'Text',
    requiresDocument: true,
    requiresSelection: false
};

function main() {
    var doc = AIS.Document.getActive();
    if (!doc) return;

    try {
        // PHASE 5: This script requires reimplementation from LAScripts framework
        // Original script: old2/Text All Convert to Outline.js
        LA(activeDocument.textFrames, function (item, i) {
            item.createOutline();
        });
    } catch (e) {
        AIS.Error.show('Error in Text All Convert to Outline (LAScripts)', e);
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
