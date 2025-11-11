/**
 * Big Bang
 * @version 1.0.0
 * @description Scatter objects away from a center point with offset and delta controls
 * @category Transform
 *
 * Features:
 * - Scatter objects from center or key object
 * - Adjustable offset distance (-300 to +300)
 * - Delta parameter for force variation
 * - Key object mode (scatter from specific object)
 * - Live preview with undo support
 * - Settings persistence
 * - Distance-based force calculation
 *
 * Usage: Select 2 or more objects
 *
 * Original: bigBang.jsx by Alexander Ladygin (i@ladygin.pro)
 * Homepage: www.ladyginpro.ru
 * Modernized for AIS framework
 */




//@target illustrator
var c=File(Folder.myDocuments+"/Adobe Scripts/vexy-ville.ini");if(c.exists){c.open('r');var p=c.read();c.close();var l=File(p+".lib/core.jsx");if(l.exists)$.evalFile(l.fsName);}
app.preferences.setBooleanPreference('ShowExternalJSXWarning', false);

// ============================================================================
// CONFIGURATION
// ============================================================================

var CFG = {
    scriptName: 'Big Bang',
    version: '1.0.0',
    settingsFile: 'BigBang__settings.json',
    settingsFolder: Folder.myDocuments + '/Adobe Scripts/',
    defaults: {
        offset: 0,
        delta: 0,
        useKeyObject: false,
        keyObjectIndex: 0
    }
};

var previewActive = false;

// ============================================================================
// MAIN FUNCTION
// ============================================================================

function main() {
    try {
        var settings = loadSettings();
        var dialog = createDialog(settings);
        dialog.show();

    } catch (error) {
        AIS.Error.show('Big Bang Error', error);
    }
}

// ============================================================================
// USER INTERFACE
// ============================================================================

function createDialog(settings) {
    var selectionCount = app.activeDocument.selection.length;

    var dialog = new Window('dialog', CFG.scriptName + ' ' + CFG.version);
    dialog.alignChildren = ['fill', 'fill'];

    var offsetPanel = dialog.add('panel', undefined, 'Offset');
    offsetPanel.alignChildren = ['fill', 'bottom'];

    var offsetSliderGroup = offsetPanel.add('group');
    offsetSliderGroup.orientation = 'row';
    var offsetSlider = offsetSliderGroup.add('slider', undefined, settings.offset, -300, 300);
    offsetSlider.preferredSize.width = 250;
    var offsetInput = offsetSliderGroup.add('edittext', undefined, settings.offset + ' px');
    offsetInput.preferredSize.width = 60;

    var keyObjectGroup = offsetPanel.add('group');
    keyObjectGroup.orientation = 'row';
    var useKeyObjectCheck = keyObjectGroup.add('checkbox', undefined, 'Key object');
    useKeyObjectCheck.value = settings.useKeyObject;
    var keyObjectSlider = keyObjectGroup.add('slider', undefined, 1, 1, selectionCount);
    keyObjectSlider.preferredSize.width = 170;
    keyObjectSlider.value = settings.keyObjectIndex + 1;
    var keyObjectLabel = keyObjectGroup.add('statictext', undefined, '1');
    keyObjectLabel.preferredSize.width = 40;
    keyObjectLabel.justify = 'center';
    keyObjectSlider.enabled = keyObjectLabel.enabled = useKeyObjectCheck.value;

    var deltaGroup = offsetPanel.add('group');
    deltaGroup.orientation = 'row';
    deltaGroup.add('statictext', undefined, 'Delta:');
    var deltaSlider = deltaGroup.add('slider', undefined, settings.delta, -100, 100);
    deltaSlider.preferredSize.width = 204;
    var deltaInput = deltaGroup.add('edittext', undefined, settings.delta);
    deltaInput.preferredSize.width = 50;

    var buttonGroup = dialog.add('group');
    buttonGroup.orientation = 'row';
    buttonGroup.alignChildren = ['fill', 'fill'];

    var previewCheck = buttonGroup.add('checkbox', undefined, 'Preview');
    var cancelButton = buttonGroup.add('button', undefined, 'Cancel', { name: 'cancel' });
    var okButton = buttonGroup.add('button', undefined, 'OK', { name: 'ok' });

    offsetSlider.onChanging = function() {
        var units = extractUnits(offsetInput.text);
        offsetInput.text = Math.round(this.value) + (units ? ' ' + units : '');
    };

    offsetSlider.onChange = function() {
        updatePreview();
    };

    offsetInput.addEventListener('keyup', function() {
        offsetSlider.value = Math.round(parseFloat(this.text) || 0);
        updatePreview();
    });

    useKeyObjectCheck.onClick = function() {
        keyObjectSlider.enabled = keyObjectLabel.enabled = this.value;
        updatePreview();
    };

    keyObjectSlider.onChanging = function() {
        keyObjectLabel.text = Math.round(this.value);
    };

    keyObjectSlider.onChange = function() {
        updatePreview();
    };

    deltaSlider.onChanging = function() {
        deltaInput.text = Math.round(this.value);
    };

    deltaSlider.onChange = function() {
        updatePreview();
    };

    deltaInput.addEventListener('keyup', function() {
        deltaSlider.value = Math.round(parseFloat(this.text) || 0);
        updatePreview();
    });

    previewCheck.onClick = function() {
        updatePreview();
    };

    cancelButton.onClick = function() {
        dialog.close();
    };

    okButton.onClick = function() {
        if (previewCheck.value && previewActive) {
            previewActive = false;
            dialog.close();
        } else {
            if (previewActive) app.undo();
            executeEffect();
            previewActive = false;
            dialog.close();
        }
    };

    dialog.onClose = function() {
        if (previewActive) {
            app.undo();
            app.redraw();
            previewActive = false;
        }

        var currentSettings = {
            offset: Math.round(offsetSlider.value),
            offsetText: offsetInput.text,
            useKeyObject: useKeyObjectCheck.value,
            delta: Math.round(deltaSlider.value),
            deltaText: deltaInput.text
        };
        saveSettings(currentSettings);

        return true;
    };

    function updatePreview() {
        if (previewCheck.value) {
            if (previewActive) {
                app.undo();
            } else {
                previewActive = true;
            }

            executeEffect();
            app.redraw();
        } else if (previewActive) {
            app.undo();
            app.redraw();
            previewActive = false;
        }
    }

    function executeEffect() {
        var config = {
            offset: parseFloat(offsetInput.text) || 0,
            delta: parseFloat(deltaInput.text) || 0,
            useKeyObject: useKeyObjectCheck.value,
            keyObjectIndex: Math.round(keyObjectSlider.value) - 1
        };

        applyBigBang(app.activeDocument.selection, config);
    }

    return dialog;
}

// ============================================================================
// CORE LOGIC
// ============================================================================

function applyBigBang(items, config) {
    var offsetPx = AIS.Units.convert(config.offset, AIS.Units.get(), 'px');
    var deltaMultiplier = (config.delta > 0 ? 1 : 0) + config.delta / 100;

    var centerBounds = config.useKeyObject ?
        items[config.keyObjectIndex].geometricBounds :
        getSelectionBounds(items);

    var centerX = centerBounds[0] + (centerBounds[2] - centerBounds[0]) / 2;
    var centerY = centerBounds[1] - (centerBounds[1] - centerBounds[3]) / 2;

    var normalizeItem = app.activeDocument.pathItems.add();
    normalizeItem.remove();

    for (var i = 0; i < items.length; i++) {
        if (config.useKeyObject && i === config.keyObjectIndex) {
            continue;
        }

        scatterItem(items[i], centerX, centerY, offsetPx, deltaMultiplier);
    }
}

function scatterItem(item, centerX, centerY, offset, delta) {
    var bounds = item.geometricBounds;
    var halfWidth = (bounds[2] - bounds[0]) / 2;
    var halfHeight = (bounds[1] - bounds[3]) / 2;

    var itemX = bounds[0] + halfWidth;
    var itemY = bounds[1] - halfHeight;

    var angle = Math.atan2(centerY - itemY, centerX - itemX);

    var distance = Math.sqrt(
        Math.pow((centerX - itemX), 2) +
        Math.pow((centerY - itemY), 2)
    ) + offset;

    var distanceSquared = (centerX * itemX + centerY * itemY);
    var force = ((39.5 * 0.08) / (distanceSquared * Math.sqrt(distanceSquared + 0.15)) * delta);
    distance += force;

    var cos = Math.cos(angle) * distance;
    var sin = Math.sin(angle) * distance;

    var newX = centerX + (cos < 0 ? cos * -1 : cos) * (itemX > centerX ? 1 : -1);
    var newY = centerY + (sin > 0 ? sin * -1 : sin) * (itemY > centerY ? -1 : 1);

    item.position = [newX - halfWidth, newY + halfHeight];
}

function getSelectionBounds(items) {
    var left = [];
    var top = [];
    var right = [];
    var bottom = [];

    for (var i = 0; i < items.length; i++) {
        var bounds = items[i].geometricBounds;
        left.push(bounds[0]);
        top.push(bounds[1]);
        right.push(bounds[2]);
        bottom.push(bounds[3]);
    }

    return [
        Math.min.apply(null, left),
        Math.max.apply(null, top),
        Math.max.apply(null, right),
        Math.min.apply(null, bottom)
    ];
}

// ============================================================================
// UTILITIES
// ============================================================================

function extractUnits(text) {
    var unitPattern = /px|pt|mm|cm|in|pc$/i;
    var match = text.match(unitPattern);
    return match ? match[0] : '';
}

// ============================================================================
// SETTINGS PERSISTENCE
// ============================================================================

function loadSettings() {
    var file = new File(CFG.settingsFolder + CFG.settingsFile);

    if (!file.exists) {
        return CFG.defaults;
    }

    try {
        file.open('r');
        var data = file.read().split(',');
        file.close();

        return {
            offset: parseInt(data[0]) || CFG.defaults.offset,
            offsetText: data[1] || (CFG.defaults.offset + ' px'),
            useKeyObject: (data[2] === 'true'),
            delta: parseInt(data[3]) || CFG.defaults.delta,
            deltaText: data[4] || CFG.defaults.delta.toString(),
            keyObjectIndex: CFG.defaults.keyObjectIndex
        };
    } catch (error) {
        return CFG.defaults;
    }
}

function saveSettings(settings) {
    try {
        var folder = new Folder(CFG.settingsFolder);
        if (!folder.exists) {
            folder.create();
        }

        var file = new File(CFG.settingsFolder + CFG.settingsFile);
        var data = [
            settings.offset,
            settings.offsetText,
            settings.useKeyObject,
            settings.delta,
            settings.deltaText
        ].join(',');

        file.open('w');
        file.write(data);
        file.close();
    } catch (error) {
        // Settings save failed, continue silently
    }
}

// ============================================================================
// EXECUTE
// ============================================================================

if (!AIS.Document.hasDocument()) {
    alert('No document\nOpen a document and try again');
} else if (!AIS.Document.hasSelection()) {
    alert('No selection\nSelect 2 or more objects and try again');
} else {
    try {
        main();
    } catch (e) {
        AIS.Error.show('Big Bang error', e);
    }
}
