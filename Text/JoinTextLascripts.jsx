/**
 * Join Text (LAScripts)
 * @version 1.0.0
 * @description LAScripts wrapper to join text frames. Depends on LAScripts framework.
 * @author Adobe Illustrator Scripts
 * @license MIT
 * @category Text
 */

#include "../lib/core.jsx"

var SCRIPT = {
    name: 'Join Text (LAScripts)',
    version: '1.0.0',
    description: 'LAScripts wrapper to join text frames. Depends on LAScripts framework.',
    category: 'Text',
    requiresDocument: true,
    requiresSelection: true
};

function main() {
    var doc = AIS.Document.getActive();
    if (!doc) return;

    try {
        // TODO: Implement functionality
        // Original script: old2/JoinText.js
        selection.joinText({
            reverse: true
        });
    } catch (e) {
        AIS.Error.show('Error in Join Text (LAScripts)', e);
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
