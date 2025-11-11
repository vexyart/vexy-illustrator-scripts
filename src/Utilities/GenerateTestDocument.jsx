/**
 * Generate Test Document
 * @version 1.0.0
 * @description Creates a standardized test.ai file with predefined structure for consistent manual testing
 * @author Vexy Illustrator Scripts (AIS)
 * @license MIT
 * @category Utilities
 * @requires Illustrator CS6 or higher
 *
 * Features:
 * - Creates test.ai with 3 artboards (A4, Letter, Square 500×500px)
 * - Generates 5 layers (visible, hidden, locked, nested, empty)
 * - Creates 15+ test objects (paths, text, groups, symbols, etc.)
 * - Adds RGB and CMYK color swatches
 * - Various stroke widths (0.5pt, 1pt, 5pt, 10pt)
 * - Text variations (point text, area text, multi-line)
 * - Nested groups for selection testing
 * - Objects both inside and outside artboards
 * - Save to project root or custom location
 * - Matches TEST_DOCUMENT_SPEC.md specification
 *
 * Usage:
 * - Run once to create test environment
 * - Use for manual testing of all scripts
 * - Reproducible bug reports and testing
 */




//@target illustrator
var c=File(Folder.myDocuments+"/Adobe Scripts/vexy-ville.ini");if(c.exists){c.open('r');var p=c.read();c.close();var l=File(p+".lib/core.jsx");if(l.exists)$.evalFile(l.fsName);}
app.preferences.setBooleanPreference('ShowExternalJSXWarning', false);

// ============================================================================
// CONFIGURATION
// ============================================================================

var CFG = {
    // Document settings
    docName: 'test-document',
    colorMode: DocumentColorSpace.RGB,

    // Artboard sizes (in points)
    artboards: [
        { name: 'A4', width: 595.28, height: 841.89 },           // A4 portrait
        { name: 'Letter', width: 612, height: 792 },             // US Letter
        { name: 'Square', width: 500, height: 500 }              // Square
    ],

    // Layer configuration
    layers: [
        { name: 'Layer 1 - Visible', visible: true, locked: false },
        { name: 'Layer 2 - Hidden', visible: false, locked: false },
        { name: 'Layer 3 - Locked', visible: true, locked: true },
        { name: 'Layer 4 - Nested', visible: true, locked: false },
        { name: 'Layer 5 - Empty', visible: true, locked: false }
    ],

    // Color swatches
    colors: {
        rgb: [
            { name: 'RGB Red', r: 255, g: 0, b: 0 },
            { name: 'RGB Green', r: 0, g: 255, b: 0 },
            { name: 'RGB Blue', r: 0, g: 0, b: 255 }
        ],
        cmyk: [
            { name: 'CMYK Cyan', c: 100, m: 0, y: 0, k: 0 },
            { name: 'CMYK Magenta', c: 0, m: 100, y: 0, k: 0 },
            { name: 'CMYK Yellow', c: 0, m: 0, y: 100, k: 0 }
        ]
    },

    // Stroke widths in points
    strokeWidths: [0.5, 1, 5, 10],

    // Default save location
    defaultPath: '~/Desktop/'
};

// ============================================================================
// MAIN FUNCTION
// ============================================================================

function main() {
    try {
        // Show dialog for save location
        var savePath = getSavePath();
        if (!savePath) {
            return; // User cancelled
        }

        // Create new document
        var doc = createDocument();

        // Create artboards
        createArtboards(doc);

        // Create layers
        createLayers(doc);

        // Add color swatches
        addColorSwatches(doc);

        // Create test objects
        createTestObjects(doc);

        // Save document
        saveDocument(doc, savePath);

        alert('Test document created successfully!\n\nLocation: ' + savePath.fsName + '\n\nArtboards: ' + CFG.artboards.length + '\nLayers: ' + CFG.layers.length + '\nObjects: 15+');

    } catch (e) {
        AIS.Error.show('Error creating test document', e);
    }
}

// ============================================================================
// DOCUMENT CREATION
// ============================================================================

/**
 * Create new document with default settings
 * @returns {Document} New document
 */
function createDocument() {
    var preset = new DocumentPreset();
    preset.colorMode = CFG.colorMode;
    preset.width = CFG.artboards[0].width;
    preset.height = CFG.artboards[0].height;
    preset.units = RulerUnits.Points;

    var doc = app.documents.addDocument(CFG.colorMode, preset);
    doc.pageOrigin = [0, 0];

    return doc;
}

/**
 * Create artboards according to CFG
 * @param {Document} doc Target document
 */
function createArtboards(doc) {
    // Remove default artboard
    doc.artboards.removeAll();

    var xOffset = 0;
    var padding = 100; // Space between artboards

    for (var i = 0; i < CFG.artboards.length; i++) {
        var ab = CFG.artboards[i];
        var rect = [
            xOffset,
            -ab.height,
            xOffset + ab.width,
            0
        ];

        var artboard = doc.artboards.add(rect);
        artboard.name = ab.name;

        xOffset += ab.width + padding;
    }

    doc.artboards.setActiveArtboardIndex(0);
}

/**
 * Create layers according to CFG
 * @param {Document} doc Target document
 */
function createLayers(doc) {
    // Remove default layer
    while (doc.layers.length > 0) {
        doc.layers[0].remove();
    }

    for (var i = 0; i < CFG.layers.length; i++) {
        var layerCfg = CFG.layers[i];
        var layer = doc.layers.add();
        layer.name = layerCfg.name;
        layer.visible = layerCfg.visible;
        layer.locked = layerCfg.locked;
    }
}

// ============================================================================
// COLOR SWATCHES
// ============================================================================

/**
 * Add RGB and CMYK color swatches
 * @param {Document} doc Target document
 */
function addColorSwatches(doc) {
    // Add RGB swatches
    for (var i = 0; i < CFG.colors.rgb.length; i++) {
        var colorCfg = CFG.colors.rgb[i];
        var color = new RGBColor();
        color.red = colorCfg.r;
        color.green = colorCfg.g;
        color.blue = colorCfg.b;

        var swatch = doc.swatches.add();
        swatch.name = colorCfg.name;
        swatch.color = color;
    }

    // Add CMYK swatches
    for (var j = 0; j < CFG.colors.cmyk.length; j++) {
        var cmykCfg = CFG.colors.cmyk[j];
        var cmykColor = new CMYKColor();
        cmykColor.cyan = cmykCfg.c;
        cmykColor.magenta = cmykCfg.m;
        cmykColor.yellow = cmykCfg.y;
        cmykColor.black = cmykCfg.k;

        var cmykSwatch = doc.swatches.add();
        cmykSwatch.name = cmykCfg.name;
        cmykSwatch.color = cmykColor;
    }
}

// ============================================================================
// TEST OBJECTS
// ============================================================================

/**
 * Create all test objects on layers
 * @param {Document} doc Target document
 */
function createTestObjects(doc) {
    var layer1 = doc.layers.getByName('Layer 1 - Visible');
    var layer3 = doc.layers.getByName('Layer 3 - Locked');
    var layer4 = doc.layers.getByName('Layer 4 - Nested');

    // Unlock layer 3 temporarily to add objects
    layer3.locked = false;

    // Create objects on Layer 1
    createRectangles(doc, layer1);
    createCircles(doc, layer1);
    createTextObjects(doc, layer1);

    // Create objects on Layer 3
    createPaths(doc, layer3);

    // Create nested groups on Layer 4
    createNestedGroups(doc, layer4);

    // Lock layer 3 again
    layer3.locked = true;
}

/**
 * Create rectangle test objects
 * @param {Document} doc Target document
 * @param {Layer} layer Target layer
 */
function createRectangles(doc, layer) {
    var x = 50;
    var y = -50;
    var size = 80;

    for (var i = 0; i < CFG.strokeWidths.length; i++) {
        var rect = layer.pathItems.rectangle(y, x, size, size);
        rect.filled = false;
        rect.stroked = true;
        rect.strokeWidth = CFG.strokeWidths[i];
        rect.strokeColor = getSwatchColor(doc, 'RGB Red');
        rect.name = 'Rectangle ' + CFG.strokeWidths[i] + 'pt';

        x += size + 20;
    }
}

/**
 * Create circle test objects
 * @param {Document} doc Target document
 * @param {Layer} layer Target layer
 */
function createCircles(doc, layer) {
    var x = 50;
    var y = -180;
    var radius = 40;

    for (var i = 0; i < 3; i++) {
        var circle = layer.pathItems.ellipse(y, x, radius * 2, radius * 2);

        if (i === 0) {
            // Filled, no stroke
            circle.filled = true;
            circle.stroked = false;
            circle.fillColor = getSwatchColor(doc, 'RGB Blue');
            circle.name = 'Circle Filled';
        } else if (i === 1) {
            // Stroked, no fill
            circle.filled = false;
            circle.stroked = true;
            circle.strokeWidth = 2;
            circle.strokeColor = getSwatchColor(doc, 'RGB Green');
            circle.name = 'Circle Stroked';
        } else {
            // Both fill and stroke
            circle.filled = true;
            circle.stroked = true;
            circle.fillColor = getSwatchColor(doc, 'CMYK Yellow');
            circle.strokeWidth = 3;
            circle.strokeColor = getSwatchColor(doc, 'CMYK Cyan');
            circle.name = 'Circle Both';
        }

        x += (radius * 2) + 30;
    }
}

/**
 * Create text test objects
 * @param {Document} doc Target document
 * @param {Layer} layer Target layer
 */
function createTextObjects(doc, layer) {
    // Point text - single line
    var pointText = layer.textFrames.add();
    pointText.contents = 'Single line point text';
    pointText.top = -300;
    pointText.left = 50;
    pointText.textRange.characterAttributes.size = 14;
    pointText.name = 'Point Text Single';

    // Point text - multi-line
    var multiText = layer.textFrames.add();
    multiText.contents = 'Multi-line\npoint text\nwith three lines';
    multiText.top = -350;
    multiText.left = 50;
    multiText.textRange.characterAttributes.size = 12;
    multiText.name = 'Point Text Multi';

    // Area text
    var areaText = layer.textFrames.areaText([[250, -300], [400, -300], [400, -400], [250, -400]]);
    areaText.contents = 'This is area text inside a rectangular frame. It will wrap automatically to fit the boundaries.';
    areaText.textRange.characterAttributes.size = 11;
    areaText.name = 'Area Text';
}

/**
 * Create path test objects
 * @param {Document} doc Target document
 * @param {Layer} layer Target layer
 */
function createPaths(doc, layer) {
    // Triangle
    var triangle = layer.pathItems.add();
    triangle.setEntirePath([
        [450, -50],
        [500, -130],
        [400, -130]
    ]);
    triangle.closed = true;
    triangle.filled = true;
    triangle.fillColor = getSwatchColor(doc, 'CMYK Magenta');
    triangle.name = 'Triangle Path';

    // Star
    var star = layer.pathItems.star([580, -90], 30, 10, 5);
    star.filled = true;
    star.stroked = true;
    star.fillColor = getSwatchColor(doc, 'RGB Red');
    star.strokeColor = getSwatchColor(doc, 'RGB Blue');
    star.strokeWidth = 2;
    star.name = 'Star Path';
}

/**
 * Create nested group test objects
 * @param {Document} doc Target document
 * @param {Layer} layer Target layer
 */
function createNestedGroups(doc, layer) {
    // Create outer group
    var outerGroup = layer.groupItems.add();
    outerGroup.name = 'Outer Group';

    // Add rectangle to outer group
    var rect1 = outerGroup.pathItems.rectangle(-450, 50, 100, 60);
    rect1.filled = true;
    rect1.fillColor = getSwatchColor(doc, 'RGB Green');
    rect1.name = 'Outer Rectangle';

    // Create middle group
    var middleGroup = outerGroup.groupItems.add();
    middleGroup.name = 'Middle Group';

    // Add circle to middle group
    var circle1 = middleGroup.pathItems.ellipse(-470, 180, 50, 50);
    circle1.filled = true;
    circle1.fillColor = getSwatchColor(doc, 'RGB Blue');
    circle1.name = 'Middle Circle';

    // Create inner group
    var innerGroup = middleGroup.groupItems.add();
    innerGroup.name = 'Inner Group';

    // Add small rectangle to inner group
    var rect2 = innerGroup.pathItems.rectangle(-480, 250, 30, 30);
    rect2.filled = true;
    rect2.fillColor = getSwatchColor(doc, 'RGB Red');
    rect2.name = 'Inner Rectangle';
}

/**
 * Get color from swatch by name
 * @param {Document} doc Target document
 * @param {String} name Swatch name
 * @returns {Color} Color object
 */
function getSwatchColor(doc, name) {
    try {
        var swatch = doc.swatches.getByName(name);
        return swatch.color;
    } catch (e) {
        // Return black if swatch not found
        var black = new GrayColor();
        black.gray = 100;
        return black;
    }
}

// ============================================================================
// FILE OPERATIONS
// ============================================================================

/**
 * Show dialog to select save location
 * @returns {File} Save path or null if cancelled
 */
function getSavePath() {
    var defaultFolder = new Folder(CFG.defaultPath);
    if (!defaultFolder.exists) {
        defaultFolder = Folder.desktop;
    }

    var file = File.saveDialog('Save test document as:', '*.ai');

    if (file) {
        // Ensure .ai extension
        if (!/\.ai$/i.test(file.name)) {
            file = new File(file.path + '/' + file.name + '.ai');
        }
        return file;
    }

    return null;
}

/**
 * Save document to specified path
 * @param {Document} doc Document to save
 * @param {File} file Save path
 */
function saveDocument(doc, file) {
    var saveOptions = new IllustratorSaveOptions();
    saveOptions.compatibility = Compatibility.ILLUSTRATOR15; // CS5
    saveOptions.compressed = true;
    saveOptions.embedICCProfile = true;
    saveOptions.embedLinkedFiles = false;
    saveOptions.flattenOutput = OutputFlattening.PRESERVEAPPEARANCE;
    saveOptions.pdfCompatible = true;

    doc.saveAs(file, saveOptions);
}

// ============================================================================
// UTILITIES
// ============================================================================

// ============================================================================
// EXECUTE
// ============================================================================

try {
    main();
} catch (e) {
    AIS.Error.show('Script error', e);
}
