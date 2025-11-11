/**
 * Opacity Mask Clip
 * @version 1.0.0
 * @description Enable the Clip checkbox for opacity masks in Transparency panel
 * @category Paths
 *
 * Features:
 * - Enables Clip checkbox for selected objects with opacity masks
 * - Uses dynamic Adobe action generation
 * - Processes recursively into groups
 * - Temporary layer for stable processing
 * - Fullscreen mode for large selections (>10 objects)
 * - Confirmation dialog for safety
 *
 * WARNING: Don't put this script in an action slot - it will freeze Illustrator
 *
 * Original: OpacityMaskClip.jsx by Sergey Osokin
 * Homepage: github.com/creold/illustrator-scripts
 * Modernized for AIS framework
 */




//@target illustrator
var c=File(Folder.myDocuments+"/Adobe Scripts/vexy-ville.ini");if(c.exists){c.open('r');var p=c.read();c.close();var l=File(p+".lib/core.jsx");if(l.exists)$.evalFile(l.fsName);}
app.preferences.setBooleanPreference('ShowExternalJSXWarning', false);

// ============================================================================
// CONFIGURATION
// ============================================================================

var CFG = {
    scriptName: 'Opacity Mask Clip',
    version: '1.0.0',
    actionSet: 'OpacityMaskClipv1.0.0',
    actionName: 'ActivateClip',
    actionPath: Folder.myDocuments + '/Adobe Scripts/',
    tempLayerName: 'Remove This Layer',
    fullscreenLimit: 10
};

// ============================================================================
// MAIN FUNCTION
// ============================================================================

function main() {
    try {
        var aiVersion = parseInt(app.version);
        if (aiVersion < 16) {
            alert('Version Error\nThis script requires Illustrator CS6 or later');
            return;
        }

        var confirmed = confirm(
            'This script requires opacity masks to be selected.\n\n' +
            'Have you selected only objects with opacity masks?'
        );
        if (!confirmed) return;

        var doc = app.activeDocument;
        var selection = collectSelection(app.selection);
        var userScreenMode = doc.views[0].screenMode;

        app.selection = [];
        var tempLayer = doc.layers.add();
        tempLayer.name = CFG.tempLayerName;

        createClipAction(CFG.actionName, CFG.actionSet, CFG.actionPath);

        if (selection.length > CFG.fullscreenLimit) {
            doc.views[0].screenMode = ScreenMode.FULLSCREEN;
        }

        app.userInteractionLevel = UserInteractionLevel.DONTDISPLAYALERTS;
        try {
            processOpacityMasks(selection, tempLayer, CFG.actionName, CFG.actionSet);
        } catch (err) {}
        app.userInteractionLevel = UserInteractionLevel.DISPLAYALERTS;

        app.selection = [];
        tempLayer.remove();

        try {
            app.unloadAction(CFG.actionSet, '');
        } catch (err) {}

        doc.views[0].screenMode = userScreenMode;

    } catch (error) {
        AIS.Error.show('Opacity Mask Clip Error', error);
    }
}

// ============================================================================
// CORE LOGIC
// ============================================================================

function processOpacityMasks(items, tempLayer, actionName, actionSet) {
    var i = items.length - 1;

    while (i > -1) {
        var item = items[i];

        var tempItem = item.layer.pathItems.add();
        tempItem.move(item, ElementPlacement.PLACEBEFORE);
        app.selection = [];

        item.move(tempLayer, ElementPlacement.PLACEATBEGINNING);
        app.selection = [item];

        try {
            app.doScript(actionName, actionSet);
        } catch (err) {}

        app.selection[0].move(tempItem, ElementPlacement.PLACEBEFORE);
        tempItem.remove();
        app.selection = [];

        if (item.typename === 'GroupItem' && item.pageItems.length) {
            processOpacityMasks(item.pageItems, tempLayer, actionName, actionSet);
        }

        i--;
    }
}

function collectSelection(collection) {
    var result = [];
    for (var i = 0; i < collection.length; i++) {
        result.push(collection[i]);
    }
    return result;
}

// ============================================================================
// ACTION GENERATION
// ============================================================================

function createClipAction(name, set, path) {
    var folder = new Folder(path);
    if (!folder.exists) folder.create();

    var actionStr = [
        '/version 3',
        '/name [' + set.length,
        '    ' + stringToHex(set),
        ']',
        '/isOpen 1',
        '/actionCount 1',
        '/action-1 {',
        '    /name [' + name.length,
        '        ' + stringToHex(name),
        '    ]',
        '    /keyIndex 0',
        '    /colorIndex 0',
        '    /isOpen 1',
        '    /eventCount 1',
        '    /event-1 {',
        '        /useRulersIn1stQuadrant 0',
        '        /internalName (ai_plugin_transparency)',
        '        /localizedName [ 12',
        '            5472616e73706172656e6379',
        '        ]',
        '        /isOpen 1',
        '        /isOn 1',
        '        /hasDialog 0',
        '        /parameterCount 1',
        '        /parameter-1 {',
        '            /key 1668049264',
        '            /showInPalette 4294967295',
        '            /type (boolean)',
        '            /value 1',
        '        }',
        '    }',
        '}'
    ].join('\n');

    try {
        app.unloadAction(set, '');
    } catch (err) {}

    saveAndLoadAction(actionStr, set, path);
}

function saveAndLoadAction(actionCode, setName, path) {
    var file = new File(path + '/' + setName + '.aia');
    file.open('w');
    file.write(actionCode);
    file.close();
    app.loadAction(file);
    file.remove();
}

function stringToHex(str) {
    return str.replace(/./g, function(char) {
        return char.charCodeAt(0).toString(16);
    });
}

// ============================================================================
// EXECUTE
// ============================================================================

if (!AIS.Document.hasDocument()) {
    alert('No document\nOpen a document and try again');
} else if (!AIS.Document.hasSelection()) {
    alert('No selection\nSelect objects with opacity masks and try again');
} else {
    try {
        main();
    } catch (e) {
        AIS.Error.show('Opacity Mask Clip error', e);
    }
}
