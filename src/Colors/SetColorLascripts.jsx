/**
 * Set Color (LAScripts)
 * @version 1.0.0
 * @description LAScripts demo showing color setting functionality. Framework demo code.
 * @author Adobe Illustrator Scripts
 * @license MIT
 * @category Colors
 */

#include "../.lib/core.jsx"

var SCRIPT = {
    name: 'Set Color (LAScripts)',
    version: '1.0.0',
    description: 'LAScripts demo showing color setting functionality. Framework demo code.',
    category: 'Colors',
    requiresDocument: true,
    requiresSelection: false
};

function main() {
    var doc = AIS.Document.getActive();
    if (!doc) return;

    try {
        // PHASE 5: This script requires reimplementation from LAScripts framework
        // Original script: old2/Set Color.js
        var rgb  = $.color('rgb', [100,100,0]),
            cmyk = $.color('cmyk', [100,100,0,0]),
            gray = $.color('gray', 30),
            hex  = $.toHex(rgb, true),
            random = $.color('rgb', 'random');
    } catch (e) {
        AIS.Error.show('Error in Set Color (LAScripts)', e);
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
