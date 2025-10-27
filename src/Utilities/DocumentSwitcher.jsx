/**
 * Document Switcher
 * @version 1.0.0
 * @description Quick document switcher with search and filtering
 * @category Utilities
 * @features
 * - List all open documents in searchable interface
 * - Filter documents by name (real-time search)
 * - Shows unsaved documents with indicator (*)
 * - Displays document name and folder path
 * - Remembers window position and size
 * - Remembers last search query
 * - Resizable dialog window
 * - Quick activation with single click
 * - Sorted results (exact match first, then partial)
 * @author Original: Sergey Osokin (hi@sergosokin.ru)
 * @discussion https://community.adobe.com/t5/illustrator-discussions/display-opened-windows-in-a-panel-as-a-buttons/td-p/14745128
 * @usage
 * 1. Run script (works best with multiple documents open)
 * 2. Type in search box to filter documents
 * 3. Click document name to activate it
 * 4. Window position and search persist between runs
 * @notes
 * - Unsaved documents marked with * (full-width asterisk)
 * - Untitled documents show empty folder path
 * - Search results sorted by relevance (exact match > starts with > contains)
 * - Settings saved to: ~/Documents/Adobe Scripts/Document_Switcher_data.json
 * @compatibility Adobe Illustrator CC 2019-2025
 */

#include "../.lib/core.jsx"

//@target illustrator
app.preferences.setBooleanPreference('ShowExternalJSXWarning', false);

(function() {
    if (!AIS.Document.hasDocument()) {
        alert('No documents\nOpen at least one document and try again');
        return;
    }

    main();
})();

// ============================================================================
// CONFIGURATION
// ============================================================================
var SCRIPT = {
    name: 'Document Switcher',
    version: 'v1.0.0'
};

var SETTINGS = {
    name: 'Document_Switcher_data.json',
    folder: Folder.myDocuments + '/Adobe Scripts/'
};

// ============================================================================
// MAIN FUNCTION
// ============================================================================
function main() {
    // Save document info before activating (activation reorders array)
    var docs = collectDocumentInfo();

    // Create dialog
    var win = new Window('dialog', SCRIPT.name + ' ' + SCRIPT.version, undefined, {resizeable: true});
    win.opacity = 0.97;
    win.preferredSize.width = 240;
    win.alignChildren = ['fill', 'fill'];

    // Search box group
    var queryGrp = win.add('group');
    queryGrp.alignChildren = ['fill', 'center'];
    queryGrp.alignment = ['fill', 'top'];

    var query = queryGrp.add('edittext', undefined, '');
    query.alignment = ['fill', 'center'];
    query.active = true;

    var btnClear = queryGrp.add('button', undefined, 'Clear');
    btnClear.preferredSize.width = 50;
    btnClear.alignment = ['right', 'center'];

    // Active document label
    var docLbl = win.add('statictext', undefined, 'Active: ' + getActiveDocumentName());
    docLbl.alignment = ['fill', 'top'];

    // Document list
    var list = win.add('listbox', undefined, '', {
        numberOfColumns: 3,
        showHeaders: true,
        columnTitles: ['', 'Name', 'Folder'],
        columnWidths: [10, 40, 45]
    });

    // Footer with total count and close button
    var footer = win.add('group');
    footer.alignChildren = ['fill', 'center'];
    footer.alignment = ['fill', 'bottom'];

    var total = footer.add('statictext', undefined, 'Total: ' + docs.length);
    total.preferredSize.width = 60;
    total.alignment = ['left', 'center'];

    var btnClose = footer.add('button', undefined, 'Close');
    btnClose.alignment = ['right', 'center'];

    // Initialize list
    populateList(docs, query.text);
    list.preferredSize.width = 240;

    // ========================================================================
    // EVENT HANDLERS
    // ========================================================================

    query.onChanging = function() {
        var results = query.text.length ? filterDocuments(query.text, docs) : docs;
        populateList(results, query.text);
    };

    btnClear.onClick = function() {
        query.text = '';
        this.active = true;
        query.active = true;
        populateList(docs, '');
    };

    list.onChange = function() {
        activateSelectedDocument();
    };

    btnClose.onClick = function() {
        win.close();
    };

    win.onShow = function() {
        loadSettings();
        var results = query.text.length ? filterDocuments(query.text, docs) : docs;
        populateList(results, query.text);
        this.layout.resize();
    };

    win.onResizing = function() {
        this.layout.resize();
    };

    win.onClose = function() {
        saveSettings();
    };

    // ========================================================================
    // DIALOG FUNCTIONS
    // ========================================================================

    /**
     * Populate list with documents
     * @param {Array} arr - Array of document objects
     * @param {String} searchText - Current search text
     */
    function populateList(arr, searchText) {
        var currDoc = getActiveDocumentName();

        list.removeAll();

        for (var i = 0; i < arr.length; i++) {
            addListItem(arr[i], currDoc);
        }

        if (searchText && searchText.length) {
            total.text = 'Found: ' + arr.length;
        } else {
            total.text = 'Total: ' + arr.length;
        }
    }

    /**
     * Add document as list item
     * @param {Object} doc - Document info object
     * @param {String} activeName - Name of currently active document
     */
    function addListItem(doc, activeName) {
        var row = list.add('item', doc.saved ? '' : '\uFF0A'); // Full-width asterisk
        row.subItems[0].text = doc.name;
        row.subItems[1].text = doc.path;
        if (activeName === doc.name) {
            row.selected = true;
        }
    }

    /**
     * Activate document selected in list
     */
    function activateSelectedDocument() {
        for (var i = 0; i < list.children.length; i++) {
            var item = list.children[i];
            if (item.selected) {
                docLbl.text = 'Active: ' + item.subItems[0].text;
                switchToDocument(item.subItems[0].text, item.subItems[1].text);
            }
        }
    }

    /**
     * Save window position, size, and search query
     */
    function saveSettings() {
        var folder = new Folder(SETTINGS.folder);
        if (!folder.exists) folder.create();

        var file = new File(SETTINGS.folder + SETTINGS.name);
        file.encoding = 'UTF-8';
        file.open('w');

        var prefs = {
            win_x: win.location.x,
            win_y: win.location.y,
            win_w: win.size.width,
            win_h: win.size.height,
            query: query.text
        };

        file.write(prefs.toSource());
        file.close();
    }

    /**
     * Load saved window position, size, and search query
     */
    function loadSettings() {
        var file = new File(SETTINGS.folder + SETTINGS.name);
        if (!file.exists) return;

        try {
            file.encoding = 'UTF-8';
            file.open('r');
            var json = file.readln();
            var prefs = new Function('return ' + json)();
            file.close();

            if (typeof prefs !== 'undefined') {
                win.location = [prefs.win_x || 0, prefs.win_y || 0];
                if (prefs.win_w && prefs.win_h) {
                    win.size = [prefs.win_w, prefs.win_h];
                }
                query.text = prefs.query || '';
                win.update();
            }
        } catch (err) {
            // Silently handle settings load errors
        }
    }

    win.show();
}

// ============================================================================
// CORE LOGIC
// ============================================================================

/**
 * Collect information about all open documents
 * @returns {Array} Array of document info objects
 */
function collectDocumentInfo() {
    var arr = [];

    for (var i = 0; i < app.documents.length; i++) {
        var doc = app.documents[i];
        var hasExtension = doc.name.indexOf('.') > -1;

        arr.push({
            name: decodeURI(doc.name),
            path: hasExtension ? decodeURI(doc.path) : '',
            saved: doc.saved && hasExtension
        });
    }

    return arr;
}

/**
 * Get name of currently active document
 * @returns {String} Active document name
 */
function getActiveDocumentName() {
    return app.documents.length ? decodeURI(app.activeDocument.name) : '';
}

/**
 * Filter documents by search query with relevance sorting
 * @param {String} query - Search string
 * @param {Array} arr - Array of document objects
 * @returns {Array} Filtered and sorted array
 */
function filterDocuments(query, arr) {
    var results = [];

    // Find matching documents with scoring
    for (var i = 0; i < arr.length; i++) {
        var index = query.length > 0 ?
                    arr[i].name.toLowerCase().indexOf(query.toLowerCase()) : 0;

        if (index !== -1) {
            // Score: 1 = exact match at start, 0.5 = match elsewhere
            var score = index === 0 ? 1 : 0.5;
            results.push({
                obj: arr[i],
                name: arr[i].name,
                score: score,
                index: index
            });
        }
    }

    // Sort by score, then by index, then alphabetically
    for (var j = 0; j < results.length; j++) {
        for (var k = j + 1; k < results.length; k++) {
            var a = results[j];
            var b = results[k];

            // Higher score wins, then lower index, then alphabetical
            if (b.score > a.score ||
                (b.score === a.score && a.index > b.index) ||
                (b.score === a.score && a.index === b.index && a.name.localeCompare(b.name) > 0)) {
                var temp = results[j];
                results[j] = results[k];
                results[k] = temp;
            }
        }
    }

    // Extract sorted document objects
    var sortedResults = [];
    for (var s = 0; s < results.length; s++) {
        sortedResults.push(results[s].obj);
    }

    return sortedResults;
}

/**
 * Switch to document by name and path
 * @param {String} docName - Document name
 * @param {String} docPath - Document path
 */
function switchToDocument(docName, docPath) {
    for (var i = 0; i < app.documents.length; i++) {
        var doc = app.documents[i];
        if (docName.toString() === decodeURI(doc.name).toString() &&
            docPath.toString() === decodeURI(doc.path).toString()) {
            doc.activate();
            break;
        }
    }
}
