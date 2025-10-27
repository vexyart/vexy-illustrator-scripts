/**
 * Width to Selection (LAScripts)
 * @version 1.0.0
 * @description LAScripts wrapper to match widths in selection. Depends on LAScripts framework.
 * @author Adobe Illustrator Scripts
 * @license MIT
 * @category Transform
 */

#include "../lib/core.jsx"

var SCRIPT = {
    name: 'Width to Selection (LAScripts)',
    version: '1.0.0',
    description: 'LAScripts wrapper to match widths in selection. Depends on LAScripts framework.',
    category: 'Transform',
    requiresDocument: true,
    requiresSelection: true
};

function main() {
    var doc = AIS.Document.getActive();
    if (!doc) return;

    try {
        // TODO: Implement functionality
        // Original script: old2/Width To Selection.js
        selection[0].Width(selection[1].width, {
            constrain: true,
            anchor: 'center'
        });
    } catch (e) {
        AIS.Error.show('Error in Width to Selection (LAScripts)', e);
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
