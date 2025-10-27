/**
 * Rename Artboard As Size
 * @version 1.0.0
 * @description Renames artboards according to their size in document units with optional text labels
 * @category Artboards
 *
 * @author Sergey Osokin (https://github.com/creold)
 * @license MIT
 * @modernized 2025 - Adapted for AIS framework
 *
 * @features
 *   - Rename active artboard or custom range
 *   - Format options: original name + size, or size only
 *   - Optional rounding to integer values
 *   - Optional unit suffix (px, pt, mm, etc.)
 *   - Optional text labels showing artboard names
 *   - Customizable label font size
 *   - Settings persistence between sessions
 *   - Large canvas mode support
 *   - Custom range input (e.g., "1,3-5")
 *
 * @usage
 *   1. Open a document with artboards
 *   2. Run the script
 *   3. Choose artboard range (active or custom)
 *   4. Select format options
 *   5. Configure options (rounding, units, labels)
 *   6. Click OK
 *
 * @notes
 *   - Supports all document units (px, pt, mm, cm, in, pc, m, ft, yd)
 *   - Text labels are grouped in a layer called "Artboard_Names"
 *   - Settings are saved in ~/Documents/Adobe Scripts/
 */

#include "../.lib/core.jsx"

//@target illustrator
app.preferences.setBooleanPreference('ShowExternalJSXWarning', false);

(function() {
    if (!AIS.Document.hasDocument()) {
        alert('No documents\nOpen a document and try again');
        return;
    }

    main();
})();

// ============================================================================
// CONFIGURATION
// ============================================================================

var CFG = {
    precision: 2,
    separator: '_',
    mgns: [10, 15, 10, 7]
};

var SETTINGS = {
    name: 'RenameArtboardAsSize-settings.json',
    folder: Folder.myDocuments + '/Adobe Scripts/'
};

// ============================================================================
// MAIN FUNCTION
// ============================================================================

function main() {
    var doc = app.activeDocument;
    var docAbs = doc.artboards;
    var currIdx = docAbs.getActiveArtboardIndex();

    // Create and show dialog
    var win = buildDialog(doc, docAbs, currIdx);
    if (win.show() === 1) {
        processArtboards(doc, docAbs, currIdx, win);
    }
}

// ============================================================================
// USER INTERFACE
// ============================================================================

/**
 * Build the main dialog
 */
function buildDialog(doc, docAbs, currIdx) {
    var win = new Window('dialog', 'Rename Artboard As Size v1.0.0');
    win.orientation = 'column';
    win.alignChildren = ['fill', 'fill'];

    // Range panel
    var srcPnl = win.add('panel', undefined, 'Artboards Range');
    srcPnl.orientation = 'column';
    srcPnl.alignChildren = ['left', 'bottom'];
    srcPnl.margins = CFG.mgns;

    var isCurrAb = srcPnl.add('radiobutton', undefined, 'Active #' + (currIdx + 1) + ': "' + AIS.String.truncate(docAbs[currIdx].name, 12) + '"');
    isCurrAb.value = true;

    var wrapper = srcPnl.add('group');
    wrapper.alignChildren = ['left', 'center'];

    var isCstmAb = wrapper.add('radiobutton', undefined, 'Custom:');
    isCstmAb.helpTip = 'Total artboards: ' + docAbs.length;

    var rangeInp = wrapper.add('edittext', undefined, '1-' + docAbs.length);
    rangeInp.helpTip = 'E.g. "1, 3-5" to process 1, 3, 4, 5';
    rangeInp.characters = 10;
    rangeInp.enabled = isCstmAb.value;

    // Format panel
    var formatPnl = win.add('panel', undefined, 'Name Format');
    formatPnl.alignChildren = ['fill', 'center'];
    formatPnl.margins = CFG.mgns;

    var isSaveName = formatPnl.add('radiobutton', undefined, 'Original Name And Size');
    isSaveName.value = true;
    var isRplcName = formatPnl.add('radiobutton', undefined, 'Only Artboard Size');

    // Options panel
    var optPnl = win.add('panel', undefined, 'Options');
    optPnl.alignChildren = ['fill', 'center'];
    optPnl.margins = CFG.mgns;

    var isRound = optPnl.add('checkbox', undefined, 'Round Size To Integer');
    isRound.value = true;

    var isAddUnit = optPnl.add('checkbox', undefined, 'Add Units After Size');
    isAddUnit.value = true;

    var fontGrp = optPnl.add('group');
    fontGrp.alignChildren = ['left', 'bottom'];

    var isAddLabel = fontGrp.add('checkbox', undefined, 'Add Text Label:');
    isAddLabel.value = true;

    var fontInp = fontGrp.add('edittext', undefined, '12 pt');
    fontInp.characters = 6;
    fontInp.enabled = isAddLabel.value;

    // Buttons
    var btns = win.add('group');
    btns.alignChildren = ['fill', 'center'];

    var cancel, ok;
    if (AIS.System.isMac()) {
        cancel = btns.add('button', undefined, 'Cancel', { name: 'cancel' });
        ok = btns.add('button', undefined, 'OK', { name: 'ok' });
    } else {
        ok = btns.add('button', undefined, 'OK', { name: 'ok' });
        cancel = btns.add('button', undefined, 'Cancel', { name: 'cancel' });
    }

    // Event handlers
    loadSettings(win, {
        isCurrAb: isCurrAb,
        isCstmAb: isCstmAb,
        rangeInp: rangeInp,
        isSaveName: isSaveName,
        isRplcName: isRplcName,
        isRound: isRound,
        isAddUnit: isAddUnit,
        isAddLabel: isAddLabel,
        fontInp: fontInp
    });

    isCurrAb.onClick = function() {
        rangeInp.enabled = false;
        isCstmAb.value = false;
    };

    isCstmAb.onClick = function() {
        rangeInp.enabled = true;
        isCurrAb.value = false;
    };

    isAddLabel.onClick = function() {
        fontInp.enabled = this.value;
    };

    fontInp.onChange = function() {
        var value = parseFloat(this.text);
        if (isNaN(value)) value = 12;
        if (value > 1296) value = 1296;
        this.text = value + ' pt';
    };

    cancel.onClick = function() {
        win.close();
    };

    // Store UI elements for later access
    win.ui = {
        isCurrAb: isCurrAb,
        isCstmAb: isCstmAb,
        rangeInp: rangeInp,
        isSaveName: isSaveName,
        isRplcName: isRplcName,
        isRound: isRound,
        isAddUnit: isAddUnit,
        isAddLabel: isAddLabel,
        fontInp: fontInp
    };

    return win;
}

// ============================================================================
// CORE LOGIC
// ============================================================================

/**
 * Process artboards based on user selection
 */
function processArtboards(doc, docAbs, currIdx, win) {
    var ui = win.ui;

    try {
        saveSettings(win, ui);

        var labelGroup;
        if (ui.isAddLabel.value) {
            var labelLayer = getEditableLayer(doc);
            try {
                labelGroup = labelLayer.groupItems.getByName('Artboard_Names');
            } catch (err) {
                labelGroup = labelLayer.groupItems.add();
                labelGroup.name = 'Artboard_Names';
            }
            labelGroup.hidden = false;
            labelGroup.locked = false;
        }

        var data = {
            precision: CFG.precision,
            separator: CFG.separator,
            isSaveName: ui.isSaveName.value,
            isAddUnit: ui.isAddUnit.value,
            fontSize: parseFloat(ui.fontInp.text),
            isRound: ui.isRound.value,
            isAddLabel: ui.isAddLabel.value,
            scaleFactor: doc.scaleFactor ? doc.scaleFactor : 1,
            units: AIS.Units.get()
        };

        if (ui.isCurrAb.value) {
            renameArtboard(docAbs[currIdx], labelGroup, data);
        } else {
            var range = AIS.String.parseIndexes(ui.rangeInp.text, docAbs.length);
            for (var i = 0; i < range.length; i++) {
                renameArtboard(docAbs[range[i]], labelGroup, data);
            }
        }

        if (labelGroup && !labelGroup.pageItems.length) {
            labelGroup.remove();
        }
    } catch (err) {
        AIS.Error.show('Failed to rename artboards', err);
    }
}

/**
 * Rename an artboard based on its dimensions
 */
function renameArtboard(ab, target, data) {
    var abName = ab.name;
    var abRect = ab.artboardRect;
    var separator = /\s/.test(abName) ? ' ' : ((/-/.test(abName) ? '-' : data.separator));

    var width = calcDimension(abRect[2] - abRect[0], data);
    var height = calcDimension(abRect[1] - abRect[3], data);

    width = data.isRound ? Math.round(width) : width.toFixed(data.precision);
    height = data.isRound ? Math.round(height) : height.toFixed(data.precision);

    var size = width + 'x' + height;
    if (data.isAddUnit) size += data.units;

    if (data.isSaveName) {
        ab.name += separator + size;
    } else {
        ab.name = size;
    }

    if (data.isAddLabel) {
        addLabel(ab, target, data.fontSize);
    }
}

/**
 * Calculate dimension in document units
 */
function calcDimension(value, data) {
    value = data.scaleFactor * AIS.Units.convert(value, 'px', data.units);
    return data.isRound ? Math.round(value) : value.toFixed(data.precision) * 1;
}

/**
 * Add text label to artboard
 */
function addLabel(ab, target, fontSize) {
    if (isNaN(fontSize)) fontSize = 12;
    if (fontSize > 1296) fontSize = 1296;

    var label = target.textFrames.add();
    label.contents = ab.name;
    label.textRange.characterAttributes.size = fontSize;
    label.position = [ab.artboardRect[0], ab.artboardRect[1] + label.height];
}

/**
 * Find first editable layer
 */
function getEditableLayer(doc) {
    var layers = doc.layers;
    var aLayer = doc.activeLayer;

    if (aLayer.visible && !aLayer.locked) return aLayer;

    for (var i = 0; i < layers.length; i++) {
        var currLayer = layers[i];
        if (currLayer.visible && !currLayer.locked) {
            doc.activeLayer = currLayer;
            return currLayer;
        }
    }

    aLayer.visible = true;
    aLayer.locked = false;
    return aLayer;
}

// ============================================================================
// SETTINGS PERSISTENCE
// ============================================================================

/**
 * Save dialog settings
 */
function saveSettings(win, ui) {
    var folder = new Folder(SETTINGS.folder);
    if (!folder.exists) folder.create();

    var file = new File(SETTINGS.folder + SETTINGS.name);
    file.encoding = 'UTF-8';

    var data = {
        win_x: win.location.x,
        win_y: win.location.y,
        artboard: ui.isCurrAb.value ? 0 : 1,
        saveName: ui.isSaveName.value ? 0 : 1,
        round: ui.isRound.value,
        addUnit: ui.isAddUnit.value,
        addLabel: ui.isAddLabel.value,
        fontSize: ui.fontInp.text
    };

    if (file.open('w')) {
        file.write(AIS.JSON.stringify(data));
        file.close();
    }
}

/**
 * Load dialog settings
 */
function loadSettings(win, ui) {
    var file = new File(SETTINGS.folder + SETTINGS.name);
    if (!file.exists) return;

    try {
        file.encoding = 'UTF-8';
        if (file.open('r')) {
            var json = file.read();
            file.close();

            var data = AIS.JSON.parse(json);
            if (!data) return;

            win.location = [
                data.win_x ? parseInt(data.win_x) : 100,
                data.win_y ? parseInt(data.win_y) : 100
            ];

            ui.isCurrAb.value = data.artboard === 0;
            ui.isCstmAb.value = data.artboard === 1;
            ui.rangeInp.enabled = ui.isCstmAb.value;
            ui.isRplcName.value = data.saveName === 1;
            ui.isRound.value = data.round === true;
            ui.isAddUnit.value = data.addUnit === true;
            ui.isAddLabel.value = data.addLabel === true;
            ui.fontInp.text = parseFloat(data.fontSize) + ' pt';
            ui.fontInp.enabled = ui.isAddLabel.value;
        }
    } catch (err) {
        // Settings file corrupted, use defaults
    }
}
