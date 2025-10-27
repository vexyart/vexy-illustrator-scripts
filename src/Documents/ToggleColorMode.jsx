/**
 * Toggle Color Mode
 * @version 1.0.0
 * @description Toggle document color mode between RGB and CMYK
 * @author Adobe Illustrator Scripts
 * @license MIT
 * @category Documents
 */

#include "../.lib/core.jsx"

var SCRIPT = {
    name: 'Toggle Color Mode',
    version: '1.0.0',
    description: 'Toggle between RGB and CMYK color modes',
    category: 'Documents',
    requiresDocument: true,
    requiresSelection: false
};

function main() {
    var doc = AIS.Document.getActive();
    if (!doc) return;

    try {
        // Toggle between RGB and CMYK
        if (doc.documentColorSpace == DocumentColorSpace.RGB) {
            doc.documentColorSpace = DocumentColorSpace.CMYK;
        } else {
            doc.documentColorSpace = DocumentColorSpace.RGB;
        }

        AIS.Document.redraw();
    } catch (e) {
        AIS.Error.show('Error toggling color mode', e);
    }
}

function validateEnvironment() {
    if (SCRIPT.requiresDocument && !AIS.Document.hasDocument()) {
        return { valid: false, message: 'Please open a document first.' };
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
