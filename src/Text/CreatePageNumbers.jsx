/**
 * Create Page Numbers
 * @version 1.0.0
 * @description Place page numbers at specified locations on artboards
 * @category Text
 *
 * Features:
 * - InDesign-style page numbering for artboards
 * - 9 position options (top/middle/bottom × left/center/right)
 * - Facing pages support (left/right page numbering)
 * - Section prefix option
 * - Customizable font size and margin
 * - Numeric page numbering only
 * - Bilingual UI (English/Japanese)
 * - Creates dedicated "Page Numbers" layer
 *
 * Original: createPageNumbers.js by sky-chaser-high
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
    scriptName: 'Create Page Numbers',
    version: '1.0.0',
    layerName: 'Page Numbers',
    defaultFont: 'Helvetica'
};

// ============================================================================
// MAIN FUNCTION
// ============================================================================

function main() {
    try {
        var dialog = showDialog();
        if (!dialog) return;

        var config = getConfiguration(dialog);
        createPageNumbers(config);
    } catch (error) {
        AIS.Error.show('Create Page Numbers Error', error);
    }
}

// ============================================================================
// CORE LOGIC
// ============================================================================

function createPageNumbers(config) {
    var font = {
        name: getFont(CFG.defaultFont),
        size: config.fontsize,
        color: getDefaultColor()
    };

    var units = AIS.Units.get();
    var margin = {
        x: AIS.Units.convert(config.margin, units, 'pt'),
        y: AIS.Units.convert(config.margin, units, 'pt')
    };

    var layer = getOrCreateLayer(CFG.layerName);
    var artboards = app.activeDocument.artboards;

    for (var i = 0; i < artboards.length; i++) {
        var artboard = getArtboardBounds(artboards[i]);
        var position = calculatePosition(i, artboard, margin, config);
        var contents = getPageContents(i, config);
        createPageNumberText(contents, font, layer, position);
    }
}

function createPageNumberText(contents, font, layer, position) {
    var text = layer.textFrames.pointText([position.x, position.y]);
    text.contents = contents.contents;
    text.textRange.paragraphAttributes.justification = contents.justification;

    var attributes = text.textRange.characterAttributes;
    attributes.textFont = font.name;
    attributes.size = font.size;
    attributes.horizontalScale = 100;
    attributes.verticalScale = 100;
    attributes.fillColor = font.color;
    attributes.strokeColor = new NoColor();
}

function getPageContents(artboardIndex, config) {
    var position = config.position;
    var page = config.start + artboardIndex;
    var prefix = (config.prefix) ? config.prefix + ' ' : '';
    var contents = prefix + page;
    var justification = Justification.CENTER;

    if (position.TOP_LEFT.value || position.MIDDLE_LEFT.value || position.BOTTOM_LEFT.value) {
        justification = Justification.LEFT;
        if (config.facing && config.prefix) {
            contents = page + ' ' + config.prefix;
        }
        if (artboardIndex % 2 === 1 && config.facing) {
            contents = prefix + page;
            justification = Justification.RIGHT;
        }
    }

    if (position.TOP_RIGHT.value || position.MIDDLE_RIGHT.value || position.BOTTOM_RIGHT.value) {
        justification = Justification.RIGHT;
        if (artboardIndex % 2 === 1 && config.facing) {
            if (config.prefix) {
                contents = page + ' ' + config.prefix;
            }
            justification = Justification.LEFT;
        }
    }

    return {
        contents: contents,
        justification: justification
    };
}

function calculatePosition(page, artboard, margin, config) {
    var position = config.position;
    var fontsize = config.fontsize;
    var facing = config.facing;
    var anchor = { x: 0, y: 0 };

    if (position.TOP_LEFT.value) {
        anchor.x = artboard.x1 + margin.x;
        anchor.y = artboard.y1 - margin.y - fontsize;
        if (page % 2 === 1 && facing) {
            anchor.x = artboard.x2 - margin.x;
        }
        return anchor;
    }

    if (position.TOP_CENTER.value) {
        anchor.x = artboard.center.x;
        anchor.y = artboard.y1 - margin.y - fontsize;
        return anchor;
    }

    if (position.TOP_RIGHT.value) {
        anchor.x = artboard.x2 - margin.x;
        anchor.y = artboard.y1 - margin.y - fontsize;
        if (page % 2 === 1 && facing) {
            anchor.x = artboard.x1 + margin.x;
        }
        return anchor;
    }

    if (position.MIDDLE_LEFT.value) {
        anchor.x = artboard.x1 + margin.x;
        anchor.y = artboard.center.y - fontsize / 2;
        if (page % 2 === 1 && facing) {
            anchor.x = artboard.x2 - margin.x;
        }
        return anchor;
    }

    if (position.MIDDLE_CENTER.value) {
        anchor.x = artboard.center.x;
        anchor.y = artboard.center.y - fontsize / 2;
        return anchor;
    }

    if (position.MIDDLE_RIGHT.value) {
        anchor.x = artboard.x2 - margin.x;
        anchor.y = artboard.center.y - fontsize / 2;
        if (page % 2 === 1 && facing) {
            anchor.x = artboard.x1 + margin.x;
        }
        return anchor;
    }

    if (position.BOTTOM_LEFT.value) {
        anchor.x = artboard.x1 + margin.x;
        anchor.y = artboard.y2 + margin.y;
        if (page % 2 === 1 && facing) {
            anchor.x = artboard.x2 - margin.x;
        }
        return anchor;
    }

    if (position.BOTTOM_CENTER.value) {
        anchor.x = artboard.center.x;
        anchor.y = artboard.y2 + margin.y;
        return anchor;
    }

    if (position.BOTTOM_RIGHT.value) {
        anchor.x = artboard.x2 - margin.x;
        anchor.y = artboard.y2 + margin.y;
        if (page % 2 === 1 && facing) {
            anchor.x = artboard.x1 + margin.x;
        }
        return anchor;
    }

    return anchor;
}

function getArtboardBounds(item) {
    var artboard = {
        x1: item.artboardRect[0],
        y1: item.artboardRect[1],
        x2: item.artboardRect[2],
        y2: item.artboardRect[3]
    };
    artboard.width = Math.abs(artboard.x2 - artboard.x1);
    artboard.height = Math.abs(artboard.y2 - artboard.y1);
    artboard.center = {
        x: artboard.x1 + (artboard.width / 2),
        y: artboard.y1 - (artboard.height / 2)
    };
    return artboard;
}

// ============================================================================
// UTILITIES
// ============================================================================

function getDefaultColor() {
    switch (app.activeDocument.documentColorSpace) {
        case DocumentColorSpace.CMYK:
            return createCMYKColor(0, 0, 0, 100);
        case DocumentColorSpace.RGB:
            return createRGBColor(0, 0, 0);
        default:
            return createRGBColor(0, 0, 0);
    }
}

function createCMYKColor(c, m, y, k) {
    var color = new CMYKColor();
    color.cyan = c;
    color.magenta = m;
    color.yellow = y;
    color.black = k;
    return color;
}

function createRGBColor(r, g, b) {
    var color = new RGBColor();
    color.red = r;
    color.green = g;
    color.blue = b;
    return color;
}

function getOrCreateLayer(name) {
    if (layerExists(name)) {
        var layer = app.activeDocument.layers[name];
        layer.locked = false;
        layer.visible = true;
        return layer;
    } else {
        return createLayer(name);
    }
}

function createLayer(name) {
    var layer = app.activeDocument.layers.add();
    layer.name = name;
    layer.zOrder(ZOrderMethod.BRINGTOFRONT);
    return layer;
}

function layerExists(name) {
    try {
        app.activeDocument.layers[name];
        return true;
    } catch (err) {
        return false;
    }
}

function getFont(name) {
    try {
        return app.textFonts[name];
    } catch (err) {
        return app.textFonts[0];
    }
}

// ============================================================================
// USER INTERFACE
// ============================================================================

function showDialog() {
    var ui = localizeUI();
    var units = AIS.Units.get();

    var dialog = new Window('dialog');
    dialog.text = ui.title;
    dialog.orientation = 'column';
    dialog.alignChildren = ['fill', 'top'];
    dialog.spacing = 10;
    dialog.margins = 10;

    // Main horizontal group
    var mainGroup = dialog.add('group');
    mainGroup.orientation = 'row';
    mainGroup.alignChildren = ['left', 'top'];
    mainGroup.spacing = 10;
    mainGroup.margins = 0;

    // Labels column
    var labelColumn = mainGroup.add('group');
    labelColumn.orientation = 'column';
    labelColumn.alignChildren = ['right', 'top'];
    labelColumn.spacing = 10;
    labelColumn.margins = 0;

    var positionLabel = labelColumn.add('group');
    positionLabel.orientation = 'column';
    positionLabel.alignChildren = ['left', 'center'];
    positionLabel.spacing = 10;
    positionLabel.margins = 0;
    var positionText = positionLabel.add('statictext', undefined, ui.position);

    var startLabel = labelColumn.add('group');
    startLabel.orientation = 'row';
    startLabel.alignChildren = ['left', 'center'];
    startLabel.spacing = 10;
    startLabel.margins = [0, 93, 0, 0];
    var startText = startLabel.add('statictext', undefined, ui.start);

    var prefixLabel = labelColumn.add('group');
    prefixLabel.orientation = 'row';
    prefixLabel.alignChildren = ['left', 'center'];
    prefixLabel.spacing = 10;
    prefixLabel.margins = [0, 8, 0, 0];
    var prefixText = prefixLabel.add('statictext', undefined, ui.prefix);

    var fontLabel = labelColumn.add('group');
    fontLabel.orientation = 'row';
    fontLabel.alignChildren = ['left', 'center'];
    fontLabel.spacing = 10;
    fontLabel.margins = [0, 8, 0, 0];
    var fontText = fontLabel.add('statictext', undefined, ui.font);

    var marginLabel = labelColumn.add('group');
    marginLabel.orientation = 'row';
    marginLabel.alignChildren = ['left', 'center'];
    marginLabel.spacing = 10;
    marginLabel.margins = [0, 8, 0, 0];
    var marginText = marginLabel.add('statictext', undefined, ui.margin);

    // Controls column
    var controlColumn = mainGroup.add('group');
    controlColumn.orientation = 'column';
    controlColumn.alignChildren = ['left', 'center'];
    controlColumn.spacing = 10;
    controlColumn.margins = 0;

    // Position grid (3x3 radio buttons)
    var positionGrid = controlColumn.add('group');
    positionGrid.orientation = 'column';
    positionGrid.alignChildren = ['left', 'center'];
    positionGrid.spacing = 10;
    positionGrid.margins = 0;

    var posRow1 = positionGrid.add('group');
    posRow1.orientation = 'row';
    posRow1.alignChildren = ['left', 'center'];
    posRow1.spacing = 10;
    posRow1.margins = 0;
    var topLeft = posRow1.add('radiobutton');
    var topCenter = posRow1.add('radiobutton');
    var topRight = posRow1.add('radiobutton');

    var posRow2 = positionGrid.add('group');
    posRow2.orientation = 'row';
    posRow2.alignChildren = ['left', 'center'];
    posRow2.spacing = 10;
    posRow2.margins = 0;
    var middleLeft = posRow2.add('radiobutton');
    var middleCenter = posRow2.add('radiobutton');
    var middleRight = posRow2.add('radiobutton');

    var posRow3 = positionGrid.add('group');
    posRow3.orientation = 'row';
    posRow3.alignChildren = ['left', 'center'];
    posRow3.spacing = 10;
    posRow3.margins = 0;
    var bottomLeft = posRow3.add('radiobutton');
    var bottomCenter = posRow3.add('radiobutton');
    var bottomRight = posRow3.add('radiobutton');
    bottomRight.value = true;

    // Facing pages checkbox
    var facingGroup = controlColumn.add('group');
    facingGroup.orientation = 'row';
    facingGroup.alignChildren = ['left', 'center'];
    facingGroup.spacing = 10;
    facingGroup.margins = 0;
    var facingCheck = facingGroup.add('checkbox', undefined, ui.facing);

    // Start page number
    var startGroup = controlColumn.add('group');
    startGroup.orientation = 'row';
    startGroup.alignChildren = ['left', 'center'];
    startGroup.spacing = 10;
    startGroup.margins = 0;
    var startInput = startGroup.add('edittext', undefined, '1');
    startInput.preferredSize.width = 100;

    // Section prefix
    var prefixGroup = controlColumn.add('group');
    prefixGroup.orientation = 'row';
    prefixGroup.alignChildren = ['left', 'center'];
    prefixGroup.spacing = 10;
    prefixGroup.margins = 0;
    var prefixInput = prefixGroup.add('edittext', undefined, '');
    prefixInput.preferredSize.width = 100;

    // Font size
    var fontsizeGroup = controlColumn.add('group');
    fontsizeGroup.orientation = 'row';
    fontsizeGroup.alignChildren = ['left', 'center'];
    fontsizeGroup.spacing = 5;
    fontsizeGroup.margins = 0;
    var fontsizeInput = fontsizeGroup.add('edittext', undefined, '10');
    fontsizeInput.preferredSize.width = 100;
    var fontsizeUnit = fontsizeGroup.add('statictext', undefined, 'pt');

    // Margin
    var marginGroup = controlColumn.add('group');
    marginGroup.orientation = 'row';
    marginGroup.alignChildren = ['left', 'center'];
    marginGroup.spacing = 5;
    marginGroup.margins = 0;
    var marginInput = marginGroup.add('edittext', undefined, '5');
    marginInput.preferredSize.width = 100;
    var marginUnit = marginGroup.add('statictext', undefined, units);

    // Buttons
    var buttonGroup = dialog.add('group');
    buttonGroup.orientation = 'row';
    buttonGroup.alignChildren = ['right', 'center'];
    buttonGroup.spacing = 10;
    buttonGroup.margins = [0, 10, 0, 0];

    var cancelButton = buttonGroup.add('button', undefined, ui.cancel);
    cancelButton.preferredSize.width = 90;
    cancelButton.preferredSize.height = 26;

    var okButton = buttonGroup.add('button', undefined, ui.ok);
    okButton.preferredSize.width = 90;
    okButton.preferredSize.height = 26;

    // Event handlers for mutually exclusive radio buttons
    topLeft.onClick = function() {
        middleLeft.value = middleCenter.value = middleRight.value = false;
        bottomLeft.value = bottomCenter.value = bottomRight.value = false;
    };

    topCenter.onClick = function() {
        middleLeft.value = middleCenter.value = middleRight.value = false;
        bottomLeft.value = bottomCenter.value = bottomRight.value = false;
    };

    topRight.onClick = function() {
        middleLeft.value = middleCenter.value = middleRight.value = false;
        bottomLeft.value = bottomCenter.value = bottomRight.value = false;
    };

    middleLeft.onClick = function() {
        topLeft.value = topCenter.value = topRight.value = false;
        bottomLeft.value = bottomCenter.value = bottomRight.value = false;
    };

    middleCenter.onClick = function() {
        topLeft.value = topCenter.value = topRight.value = false;
        bottomLeft.value = bottomCenter.value = bottomRight.value = false;
    };

    middleRight.onClick = function() {
        topLeft.value = topCenter.value = topRight.value = false;
        bottomLeft.value = bottomCenter.value = bottomRight.value = false;
    };

    bottomLeft.onClick = function() {
        topLeft.value = topCenter.value = topRight.value = false;
        middleLeft.value = middleCenter.value = middleRight.value = false;
    };

    bottomCenter.onClick = function() {
        topLeft.value = topCenter.value = topRight.value = false;
        middleLeft.value = middleCenter.value = middleRight.value = false;
    };

    bottomRight.onClick = function() {
        topLeft.value = topCenter.value = topRight.value = false;
        middleLeft.value = middleCenter.value = middleRight.value = false;
    };

    // Label click handlers to focus inputs
    startText.addEventListener('click', function() {
        startInput.active = false;
        startInput.active = true;
    });

    prefixText.addEventListener('click', function() {
        prefixInput.active = false;
        prefixInput.active = true;
    });

    fontText.addEventListener('click', function() {
        fontsizeInput.active = false;
        fontsizeInput.active = true;
    });

    marginText.addEventListener('click', function() {
        marginInput.active = false;
        marginInput.active = true;
    });

    cancelButton.onClick = function() {
        dialog.close();
    };

    okButton.onClick = function() {
        dialog.close(1);
    };

    // Store references for getConfiguration
    dialog.position = {
        TOP_LEFT: topLeft,
        TOP_CENTER: topCenter,
        TOP_RIGHT: topRight,
        MIDDLE_LEFT: middleLeft,
        MIDDLE_CENTER: middleCenter,
        MIDDLE_RIGHT: middleRight,
        BOTTOM_LEFT: bottomLeft,
        BOTTOM_CENTER: bottomCenter,
        BOTTOM_RIGHT: bottomRight
    };
    dialog.facing = facingCheck;
    dialog.start = startInput;
    dialog.prefix = prefixInput;
    dialog.fontsize = fontsizeInput;
    dialog.margin = marginInput;

    dialog.center();
    var result = dialog.show();

    return result === 1 ? dialog : null;
}

function getConfiguration(dialog) {
    var start = Number(dialog.start.text);
    if (start < 1 || isNaN(start)) start = 1;

    var fontsize = Number(dialog.fontsize.text);
    if (fontsize < 1 || isNaN(fontsize)) fontsize = 10;

    var margin = Number(dialog.margin.text);
    if (isNaN(margin)) margin = 5;

    return {
        position: dialog.position,
        facing: dialog.facing.value,
        start: start,
        prefix: dialog.prefix.text,
        fontsize: fontsize,
        margin: margin
    };
}

function localizeUI() {
    var lang = AIS.System.isMac() ? 'en' : 'en';

    return {
        title: {
            en: 'Create Page Numbers',
            ja: 'ノンブル作成'
        }[lang],
        position: {
            en: 'Position:',
            ja: '位置:'
        }[lang],
        facing: {
            en: 'Facing Pages',
            ja: '見開き'
        }[lang],
        start: {
            en: 'Start Page Number:',
            ja: '開始ページ番号:'
        }[lang],
        prefix: {
            en: 'Section Prefix:',
            ja: 'セクションプレフィックス:'
        }[lang],
        font: {
            en: 'Font Size:',
            ja: 'フォントサイズ:'
        }[lang],
        margin: {
            en: 'Margin:',
            ja: '余白:'
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
        AIS.Error.show('Create Page Numbers error', e);
    }
}
