/**
 * Match Gradient Stops
 * @version 1.0.0
 * @description Match gradient stop locations and midpoints across swatches
 * @category Colors
 *
 * Features:
 * - Match gradient stop locations across multiple gradients
 * - Copy midpoint positions between gradients
 * - Works with swatches panel selections
 * - Bilingual UI (English/Japanese)
 * - Preserves colors while matching positions
 *
 * Original: matchLocationOfGradientStop.js by sky-chaser-high
 * Homepage: github.com/sky-chaser-high/adobe-illustrator-scripts
 * Modernized for AIS framework
 */




//@target illustrator
var c=File(Folder.myDocuments+"/Adobe Scripts/vexy-ville.ini");if(c.exists){c.open('r');var p=c.read();c.close();var l=File(p+".lib/core.jsx");if(l.exists)$.evalFile(l.fsName);}
app.preferences.setBooleanPreference('ShowExternalJSXWarning', false);

// ============================================================================
// CONFIGURATION
// ============================================================================

var CFG = {
    scriptName: 'Match Gradient Stops',
    version: '1.0.0'
};

// ============================================================================
// MAIN FUNCTION
// ============================================================================

function main() {
    try {
        var gradientSwatches = getGradientSwatches();

        if (gradientSwatches.length < 2) {
            alert('Not enough gradients\nSelect two or more gradient swatches in the Swatches panel');
            return;
        }

        var swatchNames = getSwatchNames(gradientSwatches);
        var dialog = showDialog(swatchNames);

        if (!dialog) return;

        var sourceIndex = dialog.sourceIndex;
        if (sourceIndex === null) {
            alert('No selection\nSelect a source gradient from the list');
            return;
        }

        var source = gradientSwatches[sourceIndex];
        matchGradientLocations(source, gradientSwatches);

    } catch (error) {
        AIS.Error.show('Match Gradient Stops Error', error);
    }
}

// ============================================================================
// CORE LOGIC
// ============================================================================

function matchGradientLocations(source, swatches) {
    var locations = getGradientStopLocations(source.color);

    for (var i = 0; i < swatches.length; i++) {
        var swatch = swatches[i];
        if (swatch.name === source.name) continue;

        setGradientStopLocations(swatch.color, locations);
    }
}

function getGradientStopLocations(color) {
    var locations = {
        midPoints: [],
        rampPoints: []
    };

    var stops = color.gradient.gradientStops;
    for (var i = 0; i < stops.length; i++) {
        locations.midPoints.push(stops[i].midPoint);
        locations.rampPoints.push(stops[i].rampPoint);
    }

    return locations;
}

function setGradientStopLocations(color, locations) {
    var stops = color.gradient.gradientStops;

    for (var i = 0; i < stops.length; i++) {
        stops[i].midPoint = locations.midPoints[i];
        stops[i].rampPoint = locations.rampPoints[i];
    }
}

function getGradientSwatches() {
    var gradients = [];
    var selected = app.activeDocument.swatches.getSelected();

    for (var i = 0; i < selected.length; i++) {
        if (selected[i].color.typename === 'GradientColor') {
            gradients.push(selected[i]);
        }
    }

    return gradients;
}

function getSwatchNames(swatches) {
    var names = [];
    for (var i = 0; i < swatches.length; i++) {
        names.push(swatches[i].name);
    }
    return names;
}

// ============================================================================
// USER INTERFACE
// ============================================================================

function showDialog(swatchNames) {
    var ui = localizeUI();

    var dialog = new Window('dialog');
    dialog.text = ui.title;
    dialog.orientation = 'column';
    dialog.alignChildren = ['right', 'top'];
    dialog.spacing = 10;
    dialog.margins = 16;

    // Message and list
    var contentGroup = dialog.add('group');
    contentGroup.orientation = 'column';
    contentGroup.alignChildren = ['left', 'top'];
    contentGroup.spacing = 10;
    contentGroup.margins = 0;

    var message = contentGroup.add('statictext', undefined, ui.message);

    var swatchList = contentGroup.add('listbox', undefined, swatchNames);
    swatchList.preferredSize.width = 380;
    swatchList.preferredSize.height = 200;

    // Buttons
    var buttonGroup = dialog.add('group');
    buttonGroup.orientation = 'row';
    buttonGroup.alignChildren = ['left', 'center'];
    buttonGroup.spacing = 10;
    buttonGroup.margins = 0;

    var cancelButton = buttonGroup.add('button', undefined, ui.cancel);
    cancelButton.preferredSize.width = 90;

    var okButton = buttonGroup.add('button', undefined, ui.ok);
    okButton.preferredSize.width = 90;

    // Event handlers
    cancelButton.onClick = function() {
        dialog.close();
    };

    okButton.onClick = function() {
        if (swatchList.selection === null) {
            alert('No selection\nSelect a source gradient from the list');
            return;
        }
        dialog.sourceIndex = swatchList.selection.index;
        dialog.close(1);
    };

    dialog.center();
    var result = dialog.show();

    return result === 1 ? dialog : null;
}

function localizeUI() {
    var lang = AIS.System.isMac() ? 'en' : 'en';

    return {
        title: {
            en: 'Match Gradient Stops',
            ja: 'Match Location of Gradient Stop'
        }[lang],
        message: {
            en: 'Select a source gradient.',
            ja: '元となるグラデーションを選択してください。'
        }[lang],
        cancel: {
            en: 'Cancel',
            ja: 'キャンセル'
        }[lang],
        ok: {
            en: 'OK',
            ja: 'OK'
        }[lang]
    };
}

// ============================================================================
// EXECUTE
// ============================================================================

if (!AIS.Document.hasDocument()) {
    alert('No document\nOpen a document and try again');
} else {
    try {
        main();
    } catch (e) {
        AIS.Error.show('Match Gradient Stops error', e);
    }
}
