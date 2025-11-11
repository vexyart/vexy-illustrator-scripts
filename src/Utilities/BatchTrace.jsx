/**
 * Batch Trace
 * @version 1.0.0
 * @description Batch trace placed and embedded raster images with presets
 * @category Utilities
 *
 * Features:
 * - Trace selected images or entire folders
 * - Support for multiple image formats (BMP, GIF, JPEG, PNG, PSD, TIFF)
 * - Include subfolder files option
 * - Multiple tracing presets
 * - Expand traced images option
 * - Single or multiple output documents
 * - RGB/CMYK color space selection
 * - Progress bar for batch operations
 * - Save/restore preferences
 *
 * Original: BatchTrace.jsx by Sergey Osokin (hi@sergosokin.ru)
 * Modernized for AIS framework
 */




//@target illustrator
var c=File(Folder.myDocuments+"/Adobe Scripts/vexy-ville.ini");if(c.exists){c.open('r');var p=c.read();c.close();var l=File(p+".lib/core.jsx");if(l.exists)$.evalFile(l.fsName);}
app.preferences.setBooleanPreference('ShowExternalJSXWarning', false);

// ============================================================================
// CONFIGURATION
// ============================================================================

var CFG = {
    scriptName: 'Batch Trace',
    version: '1.0.0',
    extList: ['bmp', 'gif', 'giff', 'jpeg', 'jpg', 'psd', 'png', 'tif', 'tiff'],
    isInclSubdir: true,
    isReverse: true,
    isExpand: true,
    spacing: 10,
    uiMargins: [10, 15, 10, 10],
    dlgOpacity: 0.97
};

var SETTINGS = {
    name: 'BatchTrace_settings.json',
    folder: Folder.myDocuments + '/Adobe Scripts/'
};

// ============================================================================
// MAIN FUNCTION
// ============================================================================

function main() {
    if (!/illustrator/i.test(app.name)) {
        alert('Error\nRun script from Adobe Illustrator');
        return;
    }

    try {
        var config = showDialog();
        if (!config) return;

        executeTracing(config);
    } catch (error) {
        AIS.Error.show('Batch Trace Error', error);
    }
}

// ============================================================================
// CORE LOGIC
// ============================================================================

function executeTracing(config) {
    var images = config.images;
    var amount = images.length;

    if (amount === 0) {
        alert('No images found\nSelect images or choose a folder with images');
        return;
    }

    var doc = null;
    var colorProf = config.colorMode === 'RGB' ? DocumentColorSpace.RGB : DocumentColorSpace.CMYK;

    if (config.mode === 'folder' && config.singleDoc) {
        doc = app.documents.add(colorProf);
    }

    for (var i = 0; i < amount; i++) {
        var img = images[i];

        if (config.mode === 'selection') {
            traceRaster(img, config.presetIndex, config.expand);
        } else {
            var imgName = img.name.replace(/\.[^\.]+$/, '');
            if (!config.singleDoc) {
                doc = app.documents.add(colorProf);
            }

            var pImg = doc.placedItems.add();
            pImg.file = new File(img);
            pImg.name = imgName;
            traceRaster(pImg, config.presetIndex, config.expand);

            if (parseFloat(app.version) >= 16) {
                app.executeMenuCommand('Fit Artboard to artwork bounds');
            }

            if (!config.singleDoc) {
                saveFile(imgName + '_traced.ai', config.outputDir + '/traced', doc);
            }
        }

        if (config.progressBar) {
            config.progressBar.value = parseInt(100 * (i + 1) / amount);
        }
    }

    if (config.mode === 'folder' && config.singleDoc) {
        saveFile('traced_images.ai', config.outputDir, doc);
        alert('Result exported to\n' + decodeURI(config.outputDir + '/traced_images.ai'));
    }
}

function traceRaster(img, presetIndex, expand) {
    var tImg = img.trace();
    var preset = app.tracingPresetsList[presetIndex];
    tImg.tracing.tracingOptions.loadFromPreset(preset);
    tImg.name = img.name;
    app.redraw();

    if (expand) {
        tImg.tracing.expandTracing().selected = true;
    }
}

function saveFile(name, dir, doc) {
    var folder = new Folder(dir);
    if (!folder.exists) {
        folder.create();
    }

    var outFile = new File(dir + '/' + name);
    doc.saveAs(outFile);
    doc.close(SaveOptions.DONOTSAVECHANGES);
}

function getRasters(collection) {
    var out = [];

    for (var i = 0; i < collection.length; i++) {
        var item = collection[i];

        if (item.pageItems && item.pageItems.length) {
            out = out.concat(getRasters(item.pageItems));
        } else if (/raster|placed/i.test(item.typename)) {
            out.push(item);
        } else {
            item.selected = false;
        }
    }

    return out;
}

function getAllFiles(dir, extList, inclSubdir) {
    var fList = dir.getFiles();
    var regexp = new RegExp(extList.join('|'));
    var out = [];

    for (var i = 0; i < fList.length; i++) {
        var f = fList[i];

        if (inclSubdir && f instanceof Folder) {
            out = out.concat(getAllFiles(f, extList, inclSubdir));
        } else if (f instanceof File) {
            var ext = f.name.toLowerCase().match(/\.[^\.]+$/);
            if (ext && regexp.test(ext[0])) {
                out.push(f);
            }
        }
    }

    return out;
}

// ============================================================================
// USER INTERFACE
// ============================================================================

function showDialog() {
    var saved = loadSettings();

    var images = app.documents.length ? getRasters(app.selection) : [];
    var tpList = [];

    for (var i = 0; i < app.tracingPresetsList.length; i++) {
        tpList.push(app.tracingPresetsList[i]);
    }

    if (CFG.isReverse) {
        tpList.reverse();
    }

    var imgDir = saved.dir || Folder.desktop;

    var dialog = new Window('dialog', CFG.scriptName + ' ' + CFG.version);
    dialog.orientation = 'column';
    dialog.alignChildren = 'fill';
    dialog.spacing = CFG.spacing;
    dialog.preferredSize.width = 210;
    dialog.opacity = CFG.dlgOpacity;

    // Mode selection
    var modeGroup = dialog.add('group');
    modeGroup.alignChildren = 'fill';

    var selRb = modeGroup.add('radiobutton', undefined, 'Selection (' + images.length + ')');
    selRb.value = saved.selection !== false;
    var dirRb = modeGroup.add('radiobutton', undefined, 'Folder');
    dirRb.value = saved.selection === false;

    // Folder options panel
    var srcPanel = dialog.add('panel', undefined, 'Images source folder');
    srcPanel.orientation = 'column';
    srcPanel.alignChildren = 'fill';
    srcPanel.margins = CFG.uiMargins;

    var srcBtn = srcPanel.add('button', undefined, 'Choose');
    var srcLbl = srcPanel.add('edittext', undefined, decodeURI(imgDir), {readonly: true});
    srcLbl.characters = 10;

    var inclSubdirCheck = srcPanel.add('checkbox', undefined, 'Include subfolder files');
    inclSubdirCheck.value = saved.isSubdir !== false;

    var oneDocCheck = srcPanel.add('checkbox', undefined, 'Vectorize in single .ai');
    oneDocCheck.value = saved.single === true;

    var colorGroup = srcPanel.add('group');
    colorGroup.alignChildren = ['fill', 'top'];
    colorGroup.add('statictext', undefined, 'Color');

    var rgbRb = colorGroup.add('radiobutton', undefined, 'RGB');
    rgbRb.value = saved.rgb !== false;
    var cmykRb = colorGroup.add('radiobutton', undefined, 'CMYK');
    cmykRb.value = saved.rgb === false;

    // Tracing preset panel
    var presetPanel = dialog.add('panel', undefined, 'Tracing preset');
    presetPanel.margins = CFG.uiMargins;
    presetPanel.alignChildren = 'fill';

    var presetList = presetPanel.add('dropdownlist', undefined, tpList);
    presetList.preferredSize.width = 100;
    presetList.selection = saved.preset || 0;

    var expandCheck = dialog.add('checkbox', undefined, 'Expand traced image');
    expandCheck.value = saved.expand !== false;

    // Buttons
    var buttonGroup = dialog.add('group');
    buttonGroup.orientation = 'row';
    buttonGroup.alignChildren = 'fill';

    var cancelButton = buttonGroup.add('button', undefined, 'Cancel', {name: 'cancel'});
    var okButton = buttonGroup.add('button', undefined, 'OK', {name: 'ok'});

    // Copyright link
    var copyright = dialog.add('statictext', undefined, 'Original by Sergey Osokin');
    copyright.justify = 'center';

    // Progress bar
    var progressGroup = dialog.add('group');
    var progressBar = progressGroup.add('progressbar', [20, 5, 200, 10], 0, 100);

    // Initial visibility
    if (!images.length) {
        selRb.enabled = false;
        dirRb.value = true;
    }

    if (selRb.value) {
        srcPanel.visible = false;
        srcPanel.maximumSize = [0, 0];
        dialog.spacing = CFG.spacing / 1.5;
    }

    // Event handlers
    selRb.onClick = function() {
        srcPanel.visible = false;
        srcPanel.maximumSize = [0, 0];
        dialog.spacing = CFG.spacing / 1.5;
        dialog.layout.layout(true);
    };

    dirRb.onClick = function() {
        srcPanel.visible = true;
        srcPanel.maximumSize = [1000, 1000];
        dialog.spacing = CFG.spacing;
        dialog.layout.layout(true);
    };

    srcBtn.onClick = function() {
        var dir = Folder.selectDialog('Select the source folder...');
        if (dir !== null) {
            srcLbl.text = decodeURI(dir);
            imgDir = dir;
        }
    };

    copyright.addEventListener('mousedown', function() {
        AIS.System.openURL('https://github.com/creold/');
    });

    cancelButton.onClick = function() {
        dialog.close();
    };

    okButton.onClick = function() {
        okButton.text = 'Wait...';
        okButton.enabled = false;

        var mode = selRb.value ? 'selection' : 'folder';
        var targetImages = images;

        if (mode === 'folder') {
            var folder = new Folder(decodeURI(srcLbl.text));
            targetImages = getAllFiles(folder, CFG.extList, inclSubdirCheck.value);
        }

        var presetIndex = CFG.isReverse ?
            tpList.length - 1 - presetList.selection.index :
            presetList.selection.index;

        var config = {
            mode: mode,
            images: targetImages,
            presetIndex: presetIndex,
            expand: expandCheck.value,
            singleDoc: oneDocCheck.value,
            colorMode: rgbRb.value ? 'RGB' : 'CMYK',
            outputDir: decodeURI(srcLbl.text),
            progressBar: progressBar
        };

        saveSettings({
            selection: selRb.value,
            dir: srcLbl.text,
            isSubdir: inclSubdirCheck.value,
            single: oneDocCheck.value,
            rgb: rgbRb.value,
            expand: expandCheck.value,
            preset: presetList.selection.index
        });

        dialog.close(1);

        try {
            executeTracing(config);
        } catch (error) {
            AIS.Error.show('Tracing Error', error);
        }
    };

    dialog.center();
    var result = dialog.show();

    return result === 1;
}

// ============================================================================
// SETTINGS PERSISTENCE
// ============================================================================

function loadSettings() {
    var defaults = {
        selection: true,
        dir: Folder.desktop,
        isSubdir: true,
        single: false,
        rgb: true,
        expand: true,
        preset: 0
    };

    var file = new File(SETTINGS.folder + SETTINGS.name);
    if (!file.exists) return defaults;

    try {
        file.encoding = 'UTF-8';
        file.open('r');
        var content = file.read();
        file.close();

        var saved = AIS.JSON.parse(content);
        return saved || defaults;
    } catch (error) {
        return defaults;
    }
}

function saveSettings(settings) {
    var folder = new Folder(SETTINGS.folder);
    if (!folder.exists) {
        folder.create();
    }

    try {
        var file = new File(SETTINGS.folder + SETTINGS.name);
        file.encoding = 'UTF-8';
        file.open('w');
        file.write(AIS.JSON.stringify(settings));
        file.close();
    } catch (error) {
        // Silently fail settings save
    }
}

// ============================================================================
// EXECUTE
// ============================================================================

try {
    main();
} catch (e) {
    AIS.Error.show('Batch Trace error', e);
}
