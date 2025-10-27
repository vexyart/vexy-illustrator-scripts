/**
 * Height to Selection (LAScripts)
 * @version 1.0.0
 * @description LAScripts wrapper to match heights in selection. Depends on LAScripts framework.
 * @author Adobe Illustrator Scripts
 * @license MIT
 * @category Transform
 */

#include "../.lib/core.jsx"

var SCRIPT = {
    name: 'Height to Selection (LAScripts)',
    version: '1.0.0',
    description: 'LAScripts wrapper to match heights in selection. Depends on LAScripts framework.',
    category: 'Transform',
    requiresDocument: true,
    requiresSelection: true
};

function main() {
    var doc = AIS.Document.getActive();
    if (!doc) return;

    try {
        // PHASE 5: This script requires reimplementation from LAScripts framework
        // Original script: old2/Height To Selection.js
        selection[0].Height(selection[1].height, {
            constrain: true,
            anchor: 'center'
        });
    } catch (e) {
        AIS.Error.show('Error in Height to Selection (LAScripts)', e);
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
