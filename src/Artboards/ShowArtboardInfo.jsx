/**
 * Show Artboard Info
 * @version 1.0.0
 * @description Display artboard names and dimensions on canvas
 * @category Artboards
 *
 * Features:
 * - Shows artboard index, name, width, and height
 * - Creates non-printing layer for info text
 * - Respects document ruler units
 * - Auto-positions text at top-left of each artboard
 * - XMP metadata fallback for special units (feet, yards, meters)
 *
 * Original: showArtboardName.js by sky-chaser-high
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
    scriptName: 'Show Artboard Info',
    version: '1.0.0',
    layerName: 'Artboard Info',
    margin: 3,
    fontSize: 10,
    scale: 100,
    precision: 10000
};

// ============================================================================
// MAIN FUNCTION
// ============================================================================

function main() {
    try {
        var layer = getOrCreateLayer(CFG.layerName);
        var artboards = app.activeDocument.artboards;

        for (var i = 0; i < artboards.length; i++) {
            var artboard = artboards[i];
            var index = i + 1;
            createArtboardLabel(index, artboard, layer);
        }

        layer.locked = true;
        layer.printable = false;

    } catch (error) {
        AIS.Error.show('Show Artboard Info Error', error);
    }
}

// ============================================================================
// CORE LOGIC
// ============================================================================

function createArtboardLabel(index, artboard, layer) {
    var dimensions = getArtboardDimensions(artboard);
    var units = getRulerUnits();

    var width = convertUnits(dimensions.width + 'pt', units);
    var height = convertUnits(dimensions.height + 'pt', units);

    var contents = '#' + index + ' ' + artboard.name +
        '  W: ' + roundValue(width) + units +
        '  H: ' + roundValue(height) + units;

    var text = layer.textFrames.pointText([dimensions.x, dimensions.y + CFG.margin]);
    text.contents = contents;

    var attributes = text.textRange.characterAttributes;
    attributes.size = CFG.fontSize;
    attributes.horizontalScale = CFG.scale;
    attributes.verticalScale = CFG.scale;
}

function getArtboardDimensions(artboard) {
    var rect = artboard.artboardRect;
    var x1 = rect[0];
    var y1 = rect[1];
    var x2 = rect[2];
    var y2 = rect[3];

    return {
        x: x1,
        y: y1,
        width: Math.abs(x2 - x1),
        height: Math.abs(y2 - y1)
    };
}

function getOrCreateLayer(name) {
    if (!layerExists(name)) {
        return createLayer(name);
    }

    var layer = app.activeDocument.layers[name];
    layer.locked = false;
    layer.visible = true;
    return layer;
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

// ============================================================================
// UNIT CONVERSION
// ============================================================================

function convertUnits(value, unit) {
    try {
        return Number(UnitValue(value).as(unit));
    } catch (err) {
        return Number(UnitValue('1pt').as('pt'));
    }
}

function getRulerUnits() {
    var units = getUnitSymbols();
    var document = app.activeDocument;
    var ruler = document.rulerUnits;

    try {
        switch (ruler) {
            case RulerUnits.Pixels: return units.px;
            case RulerUnits.Points: return units.pt;
            case RulerUnits.Picas: return units.pc;
            case RulerUnits.Inches: return units.inch;
            case RulerUnits.Millimeters: return units.mm;
            case RulerUnits.Centimeters: return units.cm;
            case RulerUnits.Feet: return units.ft;
            case RulerUnits.Yards: return units.yd;
            case RulerUnits.Meters: return units.meter;
        }
    } catch (err) {
        var xmpUnit = getXMPRulerUnits(document.fullName);
        switch (xmpUnit) {
            case 'Feet': return units.ft;
            case 'Yards': return units.yd;
            case 'Meters': return units.meter;
        }
    }

    return units.pt;
}

function getXMPRulerUnits(source) {
    if (!ExternalObject.AdobeXMPScript) {
        ExternalObject.AdobeXMPScript = new ExternalObject('lib:AdobeXMPScript');
    }

    var xmpFile = new XMPFile(source.fsName, XMPConst.FILE_UNKNOWN, XMPConst.OPEN_FOR_READ);
    var xmpPackets = xmpFile.getXMP();
    var xmp = new XMPMeta(xmpPackets.serialize());

    var namespace = 'http://ns.adobe.com/xap/1.0/t/pg/';
    var property = 'xmpTPg:MaxPageSize/stDim:unit';

    var ruler = xmp.getProperty(namespace, property).value;
    return ruler;
}

function getUnitSymbols() {
    return {
        px: 'px',
        pt: 'pt',
        pc: 'pc',
        inch: 'in',
        ft: 'ft',
        yd: 'yd',
        mm: 'mm',
        cm: 'cm',
        meter: 'm'
    };
}

// ============================================================================
// UTILITIES
// ============================================================================

function roundValue(value) {
    return Math.round(value * CFG.precision) / CFG.precision;
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
        AIS.Error.show('Show Artboard Info error', e);
    }
}
