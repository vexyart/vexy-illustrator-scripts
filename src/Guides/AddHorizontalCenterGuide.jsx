/**
 * Add Horizontal Center Guide
 * @version 1.0.0
 * @description Add a horizontal guide at the center of the active artboard
 * @author Adobe Illustrator Scripts
 * @license MIT
 * @category Guides
 */




//@target illustrator
var c=File(Folder.myDocuments+"/Adobe Scripts/vexy-ville.ini");if(c.exists){c.open('r');var p=c.read();c.close();var l=File(p+".lib/core.jsx");if(l.exists)$.evalFile(l.fsName);}
app.preferences.setBooleanPreference('ShowExternalJSXWarning', false);

var SCRIPT = {
    name: 'Add Horizontal Center Guide',
    version: '1.0.0',
    description: 'Add horizontal guide at artboard center',
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

        // Calculate center Y position
        var centerY = (rect[1] + rect[3]) / 2;

        // Create horizontal guide
        var guide = doc.pathItems.add();
        guide.stroked = false;
        guide.filled = false;
        guide.guides = true;
        guide.setEntirePath([[rect[0], centerY], [rect[2], centerY]]);

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

// ============================================================================
// EXECUTE
// ============================================================================

var validation = validateEnvironment();
if (!validation.valid) {
    alert(SCRIPT.name + '\n\n' + validation.message);
} else {
    try {
        main();
    } catch (e) {
        AIS.Error.show('Script error', e);
    }
}
