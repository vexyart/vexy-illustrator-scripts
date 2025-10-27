/**
 * Crop Artboard (LAScripts)
 * @version 1.0.0
 * @description LAScripts wrapper to crop artboard. Depends on LAScripts framework.
 * @author Adobe Illustrator Scripts
 * @license MIT
 * @category Artboards
 */

#include "../.lib/core.jsx"

var SCRIPT = {
    name: 'Crop Artboard (LAScripts)',
    version: '1.0.0',
    description: 'LAScripts wrapper to crop artboard. Depends on LAScripts framework.',
    category: 'Artboards',
    requiresDocument: true,
    requiresSelection: false
};

function main() {
    var doc = AIS.Document.getActive();
    if (!doc) return;

    try {
        // PHASE 5: This script requires reimplementation from LAScripts framework
        // Original script: old2/Crop Artboard.js
        // Original: old2/Crop Artboard.js
        // Needs manual implementation
    } catch (e) {
        AIS.Error.show('Error in Crop Artboard (LAScripts)', e);
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
