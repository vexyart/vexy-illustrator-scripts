/**
 * App Quit (LAScripts)
 * @version 1.0.0
 * @description LAScripts wrapper to quit Illustrator application. Depends on LAScripts framework.
 * @author Adobe Illustrator Scripts
 * @license MIT
 * @category Documents
 */

#include "../.lib/core.jsx"

var SCRIPT = {
    name: 'App Quit (LAScripts)',
    version: '1.0.0',
    description: 'LAScripts wrapper to quit Illustrator application. Depends on LAScripts framework.',
    category: 'Documents',
    requiresDocument: true,
    requiresSelection: false
};

function main() {
    var doc = AIS.Document.getActive();
    if (!doc) return;

    try {
        // TODO: Implement functionality
        // Original script: old2/App quit.js
            app.quit();
            app.forceQuit();
            $.documents.closeOther('save');
            app.forceQuit();
    } catch (e) {
        AIS.Error.show('Error in App Quit (LAScripts)', e);
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
