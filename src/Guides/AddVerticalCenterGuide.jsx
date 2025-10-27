/**
 * Add Vertical Center Guide
 * @version 1.0.0
 * @description Add a vertical guide at the center of the active artboard
 * @author Adobe Illustrator Scripts
 * @license MIT
 * @category Guides
 */

#include "../.lib/core.jsx"

var SCRIPT = {
    name: 'Add Vertical Center Guide',
    version: '1.0.0',
    description: 'Add vertical guide at artboard center',
    category: 'Guides',
    requiresDocument: true,
    requiresSelection: false
};

function main() {
    var doc = AIS.Document.getActive();
    if (!doc) return;

    try {
        var artboard = doc.artboards[doc.artboards.getActiveArtboardIndex()];
        var rect = artboard.artboardRect;

        // Calculate center X position
        var centerX = (rect[0] + rect[2]) / 2;

        // Create vertical guide
        var guide = doc.pathItems.add();
        guide.stroked = false;
        guide.filled = false;
        guide.guides = true;
        guide.setEntirePath([[centerX, rect[1]], [centerX, rect[3]]]);

        AIS.Document.redraw();
    } catch (e) {
        AIS.Error.show('Error adding guide', e);
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
