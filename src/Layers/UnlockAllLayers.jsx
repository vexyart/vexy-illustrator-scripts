/**
 * Unlock All Layers
 * @version 1.0.0
 * @description Unlocks all layers in the active document
 * @author Adobe Illustrator Scripts
 * @license MIT
 * @category Layers
 */




//@target illustrator
var c=File(Folder.myDocuments+"/Adobe Scripts/vexy-ville.ini");if(c.exists){c.open('r');var p=c.read();c.close();var l=File(p+".lib/core.jsx");if(l.exists)$.evalFile(l.fsName);}
app.preferences.setBooleanPreference('ShowExternalJSXWarning', false);

var SCRIPT = {
    name: 'Unlock All Layers',
    version: '1.0.0',
    description: 'Unlock all layers in document',
    category: 'Layers',
    requiresDocument: true,
    requiresSelection: false
};

function main() {
    var doc = AIS.Document.getActive();
    if (!doc) return;

    try {
        var layers = doc.layers;
        for (var i = 0; i < layers.length; i++) {
            layers[i].locked = false;
            // Unlock sublayers recursively
            unlockSublayers(layers[i]);
        }
    } catch (e) {
        AIS.Error.show('Error unlocking layers', e);
    }
}

function unlockSublayers(layer) {
    if (layer.layers && layer.layers.length > 0) {
        for (var i = 0; i < layer.layers.length; i++) {
            layer.layers[i].locked = false;
            unlockSublayers(layer.layers[i]);
        }
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
