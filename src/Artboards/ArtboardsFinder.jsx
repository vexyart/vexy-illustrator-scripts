/**
 * Artboards Finder
 * @version 1.0.0
 * @description Search and navigate to artboards by name, size, or orientation. Supports multiple search methods (by name, width, height, landscape, portrait, square), multi-select navigation, and customizable zoom ratios. Originally created by Sergey Osokin, modernized for AIS framework.
 * @category Artboards
 * @features
 *   - Search artboards by name with regex support
 *   - Search by exact width or height in document units
 *   - Filter by orientation (landscape, portrait, square)
 *   - Multi-select support for viewing multiple artboards
 *   - Customizable zoom ratio (0.1-1.0)
 *   - Real-time search results as you type
 *   - Settings persistence across sessions
 *   - Large canvas mode support
 *   - Sortable results by dimensions
 * @author Sergey Osokin (original), Vexy (modernization)
 * @usage File → Scripts → Artboards Finder
 *        Type to search, select results, view in canvas
 * @original https://github.com/creold/illustrator-scripts
 * @license MIT
 */

#include "../.lib/core.jsx"

//@target illustrator
app.preferences.setBooleanPreference('ShowExternalJSXWarning', false);

(function() {
    if (!AIS.Document.hasDocument()) {
        alert('No document\nOpen a document and try again');
        return;
    }

    main();
})();

// ============================================================================
// CONFIGURATION
// ============================================================================
var CFG = {
    VERSION: '1.0.0',
    DEF_ZOOM: 0.75,
    MIN_ZOOM: 0.1,
    WIDTH: 280,
    ROWS: 6,
    UI_OPACITY: 0.97,
    UNITS: AIS.Units.get(),
    SCALE_FACTOR: app.activeDocument.scaleFactor || 1,
    IS_MAC: AIS.System.isMac(),
    AI_VERSION: parseFloat(app.version)
};

var SETTINGS = {
    name: 'artboards-finder-settings.json',
    folder: Folder.myDocuments + '/Adobe Scripts/'
};

// ============================================================================
// MAIN FUNCTION
// ============================================================================
function main() {
    try {
        var settings = loadSettings();
        var dialog = createDialog(settings);
        dialog.show();
    } catch (e) {
        AIS.Error.show('Artboard finder failed', e);
    }
}

// ============================================================================
// USER INTERFACE
// ============================================================================
function createDialog(settings) {
    var doc = app.activeDocument;
    var results = [];

    var dialog = new Window('dialog', 'Artboards Finder v' + CFG.VERSION);
    dialog.opacity = CFG.UI_OPACITY;

    // Search method panel
    var filterPanel = dialog.add('panel', undefined, 'Search Method');
    filterPanel.orientation = 'row';
    filterPanel.bounds = [0, 0, CFG.WIDTH, 120];

    var nameRb = addRadioButton(filterPanel, 0, 0, 'By name');
    nameRb.value = true;
    var widthRb = addRadioButton(filterPanel, 0, 1, 'By width, ' + CFG.UNITS);
    var heightRb = addRadioButton(filterPanel, 0, 2, 'By height, ' + CFG.UNITS);
    var landscapeRb = addRadioButton(filterPanel, 1, 0, 'Landscape');
    var portraitRb = addRadioButton(filterPanel, 1, 1, 'Portrait');
    var squareRb = addRadioButton(filterPanel, 1, 2, 'Square');

    // Search input
    var searchInput = dialog.add('edittext', undefined, 'Enter name...');
    searchInput.preferredSize.width = CFG.WIDTH;

    if (CFG.IS_MAC || CFG.AI_VERSION >= 26.4 || CFG.AI_VERSION <= 17) {
        searchInput.active = true;
    }

    // Results listbox
    var listbox = dialog.add('listbox', [0, 0, CFG.WIDTH, 20 + 21 * CFG.ROWS], undefined, {
        numberOfColumns: 4,
        showHeaders: true,
        columnTitles: ['#', 'Name', 'Width', 'Height'],
        multiselect: true
    });

    // Zoom options
    var zoomGroup = dialog.add('group');
    zoomGroup.alignChildren = ['left', 'bottom'];

    var zoomCheck = zoomGroup.add('checkbox', undefined,
        'Center view with zoom ratio (' + CFG.MIN_ZOOM + '-1)');
    var zoomInput = zoomGroup.add('edittext', undefined, CFG.DEF_ZOOM);
    zoomInput.characters = 5;

    // Buttons
    var btnGroup = dialog.add('group');
    btnGroup.alignChildren = ['center', 'center'];
    var closeBtn = btnGroup.add('button', undefined, 'Close', {name: 'cancel'});

    // Apply saved settings
    if (settings) {
        applySettings(settings, filterPanel, searchInput, zoomCheck, zoomInput);
    }

    // Initial search
    updateResults();

    // Event handlers
    searchInput.onChanging = updateResults;

    for (var i = 0; i < filterPanel.children.length; i++) {
        filterPanel.children[i].onClick = function() {
            var orientationMode = portraitRb.value || landscapeRb.value || squareRb.value;
            searchInput.enabled = !orientationMode;
            updateResults();
        };
    }

    listbox.onChange = function() {
        selectArtboards();
    };

    zoomCheck.onClick = function() {
        selectArtboards();
    };

    zoomInput.onChange = function() {
        var value = parseFloat(this.text);
        if (isNaN(value)) value = CFG.DEF_ZOOM;
        if (value > 1) this.text = 1;
        if (value < CFG.MIN_ZOOM) this.text = CFG.MIN_ZOOM;
        selectArtboards();
    };

    closeBtn.onClick = function() {
        saveCurrentSettings();
        dialog.close();
    };

    // Update search results
    function updateResults() {
        results = [];
        listbox.removeAll();

        var filterIndex = getSelectedFilterIndex();
        var searchText = searchInput.text;

        results = findArtboards(filterIndex, searchText);

        // Sort results
        if (widthRb.value || landscapeRb.value || squareRb.value) {
            results.sort(function(a, b) { return b.width - a.width; });
        }
        if (heightRb.value || portraitRb.value) {
            results.sort(function(a, b) { return b.height - a.height; });
        }

        // Populate listbox
        for (var i = 0; i < results.length; i++) {
            var row = listbox.add('item', results[i].index + 1);
            row.subItems[0].text = results[i].name;
            row.subItems[1].text = results[i].width;
            row.subItems[2].text = results[i].height;
        }
    }

    function getSelectedFilterIndex() {
        for (var i = 0; i < filterPanel.children.length; i++) {
            if (filterPanel.children[i].value) return i;
        }
        return 0;
    }

    function selectArtboards() {
        var selectedAbs = [];
        var firstIndex = -1;

        for (var i = 0; i < listbox.children.length; i++) {
            if (listbox.children[i].selected) {
                selectedAbs.push(results[i].artboard);
                if (firstIndex === -1) firstIndex = results[i].index;
            }
        }

        if (selectedAbs.length === 0) return;

        doc.artboards.setActiveArtboardIndex(firstIndex);

        var zoomRatio = parseFloat(zoomInput.text) || CFG.DEF_ZOOM;
        zoomToArtboards(selectedAbs, zoomRatio, zoomCheck.value);
    }

    function saveCurrentSettings() {
        var config = {
            filter: getSelectedFilterIndex(),
            search: searchInput.text,
            isZoom: zoomCheck.value,
            ratio: zoomInput.text
        };
        saveSettings(config);
    }

    dialog.center();
    return dialog;
}

function addRadioButton(panel, col, row, label) {
    var rb = panel.add('radiobutton', undefined, label);
    var stepX = 140;
    var stepY = 30;
    var x0 = 10;
    var y0 = 20;

    var x = x0 + stepX * col;
    var y = y0 + stepY * row;
    rb.bounds = [x, y, x + 120, y + 20];

    return rb;
}

// ============================================================================
// ARTBOARD SEARCH
// ============================================================================
function findArtboards(filterIndex, searchText) {
    var doc = app.activeDocument;
    var results = [];
    var precision = CFG.AI_VERSION >= 24 ? 4 : 2;

    for (var i = 0; i < doc.artboards.length; i++) {
        var ab = doc.artboards[i];
        var rect = ab.artboardRect;
        var widthPx = rect[2] - rect[0];
        var heightPx = Math.abs(rect[1] - rect[3]);

        var width = CFG.SCALE_FACTOR * AIS.Units.convert(widthPx, 'pt', CFG.UNITS);
        var height = CFG.SCALE_FACTOR * AIS.Units.convert(heightPx, 'pt', CFG.UNITS);

        var match = false;

        switch (filterIndex) {
            case 0: // By name
                var regex = new RegExp(searchText, 'i');
                match = ab.name.match(regex);
                break;
            case 1: // By width
                match = width.toFixed(precision).indexOf(searchText) !== -1;
                break;
            case 2: // By height
                match = height.toFixed(precision).indexOf(searchText) !== -1;
                break;
            case 3: // Landscape
                match = width > height;
                break;
            case 4: // Portrait
                match = width < height;
                break;
            case 5: // Square
                match = width.toFixed(4) === height.toFixed(4);
                break;
        }

        if (match) {
            results.push({
                index: i,
                name: ab.name,
                artboard: ab,
                width: (1 * width.toFixed(precision)),
                height: (1 * height.toFixed(precision))
            });
        }
    }

    return results;
}

// ============================================================================
// ZOOM & NAVIGATION
// ============================================================================
function zoomToArtboards(artboards, ratio, useZoom) {
    var doc = app.activeDocument;

    if (useZoom) {
        doc.views[0].zoom = 1;
    }

    var screenBounds = doc.views[0].bounds;
    var screenWidth = screenBounds[2] - screenBounds[0];
    var screenHeight = screenBounds[1] - screenBounds[3];
    var screenProportion = screenHeight / screenWidth;

    var bounds = calculateCombinedBounds(artboards);
    var width = bounds[2] - bounds[0];
    var height = bounds[1] - bounds[3];

    var centerX = bounds[0] + width / 2;
    var centerY = bounds[1] - height / 2;
    doc.views[0].centerPoint = [centerX, centerY];

    if (useZoom) {
        var zoomRatioW = screenWidth / width;
        var zoomRatioH = screenHeight / height;
        var zoomRatio = (width * screenProportion >= height) ? zoomRatioW : zoomRatioH;
        doc.views[0].zoom = zoomRatio * ratio;
    }

    app.redraw();
}

function calculateCombinedBounds(artboards) {
    var firstRect = artboards[0].artboardRect;
    var left = firstRect[0];
    var top = firstRect[1];
    var right = firstRect[2];
    var bottom = firstRect[3];

    for (var i = 1; i < artboards.length; i++) {
        var rect = artboards[i].artboardRect;
        left = Math.min(rect[0], left);
        top = Math.max(rect[1], top);
        right = Math.max(rect[2], right);
        bottom = Math.min(rect[3], bottom);
    }

    return [left, top, right, bottom];
}

// ============================================================================
// SETTINGS PERSISTENCE
// ============================================================================
function saveSettings(config) {
    try {
        var folder = new Folder(SETTINGS.folder);
        if (!folder.exists) folder.create();

        var file = new File(SETTINGS.folder + SETTINGS.name);
        file.encoding = 'UTF-8';
        file.open('w');
        file.write(AIS.JSON.stringify(config));
        file.close();
    } catch (e) {
        // Silently fail - settings are optional
    }
}

function loadSettings() {
    try {
        var file = new File(SETTINGS.folder + SETTINGS.name);
        if (!file.exists) return null;

        file.encoding = 'UTF-8';
        file.open('r');
        var json = file.read();
        file.close();

        return AIS.JSON.parse(json);
    } catch (e) {
        return null;
    }
}

function applySettings(settings, filterPanel, searchInput, zoomCheck, zoomInput) {
    try {
        if (settings.filter !== undefined && filterPanel.children[settings.filter]) {
            filterPanel.children[settings.filter].value = true;
            if (settings.filter > 2) {
                searchInput.enabled = false;
            }
        }
        if (settings.search !== undefined) {
            searchInput.text = settings.search;
        }
        if (settings.isZoom !== undefined) {
            zoomCheck.value = settings.isZoom;
        }
        if (settings.ratio !== undefined) {
            zoomInput.text = settings.ratio;
        }
    } catch (e) {
        // Silently fail - settings application is optional
    }
}
