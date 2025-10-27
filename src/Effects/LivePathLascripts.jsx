/**
 * Live Path (LAScripts)
 * @version 1.0.0
 * @description LAScripts wrapper for live path effects. Depends on LAScripts framework.
 * @author Adobe Illustrator Scripts
 * @license MIT
 * @category Effects
 */

#include "../.lib/core.jsx"

var SCRIPT = {
    name: 'Live Path (LAScripts)',
    version: '1.0.0',
    description: 'LAScripts wrapper for live path effects. Depends on LAScripts framework.',
    category: 'Effects',
    requiresDocument: true,
    requiresSelection: true
};

function main() {
    var doc = AIS.Document.getActive();
    if (!doc) return;

    try {
        // TODO: Implement functionality
        // Original script: old2/Live Path.js
        app.userInteractionLevel = UserInteractionLevel.DONTDISPLAYALERTS;
        app.executeMenuCommand('Make Planet X');
        app.executeMenuCommand('Expand Planet X');
        selection[0].groupItems[selection[0].groupItems.length - 1].remove();
        selection.ungroupAll();
    } catch (e) {
        AIS.Error.show('Error in Live Path (LAScripts)', e);
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
