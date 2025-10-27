/**
 * Fill Color Random (LAScripts)
 * @version 1.0.0
 * @description LAScripts wrapper to apply random fill color. Depends on LAScripts framework.
 * @author Adobe Illustrator Scripts
 * @license MIT
 * @category Colors
 */

#include "../.lib/core.jsx"

var SCRIPT = {
    name: 'Fill Color Random (LAScripts)',
    version: '1.0.0',
    description: 'LAScripts wrapper to apply random fill color. Depends on LAScripts framework.',
    category: 'Colors',
    requiresDocument: true,
    requiresSelection: true
};

function main() {
    var doc = AIS.Document.getActive();
    if (!doc) return;

    try {
        // PHASE 5: This script requires reimplementation from LAScripts framework
        // Original script: old2/Fill Color Random.js
        var _color = 'random';
             _color = $.color($.getColorMode('shortname'), 'random');
        selection.fill(_color);
    } catch (e) {
        AIS.Error.show('Error in Fill Color Random (LAScripts)', e);
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
