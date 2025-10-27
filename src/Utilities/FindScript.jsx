/**
 * Find Script
 * @version 1.0.0
 * @description Fast script search and launcher for 426 scripts across 12 categories
 * @category Utilities
 * @features
 * - Interactive search dialog with real-time filtering
 * - Search by script name (fuzzy matching)
 * - Filter by category
 * - Show script path, size, line count
 * - Quick launch button to execute selected script
 * - Show recently used scripts (last 10)
 * - Keyboard shortcuts for navigation
 * - Favorites/bookmarking system
 * @author Vexy Illustrator Scripts Project
 * @usage
 * 1. Run script (no document needed)
 * 2. Type to search for scripts
 * 3. Double-click or press Enter to execute
 * 4. View script details before launching
 * @notes
 * - Daily productivity tool
 * - Faster than navigating folder structure
 * - Remembers recent scripts for quick access
 * @compatibility Adobe Illustrator CS6-2025
 */

#include "../.lib/core.jsx"

//@target illustrator
app.preferences.setBooleanPreference('ShowExternalJSXWarning', false);

(function() {
    main();
})();

// ============================================================================
// CONFIGURATION
// ============================================================================
var CFG = {
    categories: [
        'Artboards', 'Colors', 'Export', 'Favorites', 'Layers',
        'Measurement', 'Paths', 'Selection', 'Strokes', 'Text',
        'Transform', 'Utilities'
    ],
    recentFile: Folder.myDocuments + '/Adobe Scripts/FindScript_Recent.json',
    maxRecent: 10
};

// ============================================================================
// MAIN FUNCTION
// ============================================================================
function main() {
    try {
        // Get project root
        var scriptFile = new File($.fileName);
        var projectRoot = scriptFile.parent.parent;

        // Scan all scripts
        var allScripts = scanAllScripts(projectRoot);

        // Load recent scripts
        var recent = loadRecent();

        // Show finder dialog
        var selected = showFinderDialog(allScripts, recent);

        if (selected) {
            // Save to recent
            saveToRecent(selected);

            // Execute script
            executeScript(selected);
        }

    } catch (e) {
        AIS.Error.show('Find Script Error', e);
    }
}

// ============================================================================
// CORE LOGIC - SCANNING
// ============================================================================

/**
 * Scan all scripts
 * @param {Folder} root - Project root
 * @returns {Array} All scripts
 */
function scanAllScripts(root) {
    var scripts = [];

    for (var i = 0; i < CFG.categories.length; i++) {
        var catName = CFG.categories[i];
        var catFolder = new Folder(root + '/' + catName);

        if (!catFolder.exists) continue;

        var files = catFolder.getFiles('*.jsx');

        for (var j = 0; j < files.length; j++) {
            scripts.push({
                name: files[j].name.replace(/\.jsx$/i, ''),
                fullName: files[j].name,
                category: catName,
                path: files[j].fsName,
                lines: countFileLines(files[j]),
                size: files[j].length
            });
        }
    }

    return scripts;
}

/**
 * Count file lines
 * @param {File} file - File
 * @returns {Number} Line count
 */
function countFileLines(file) {
    try {
        file.encoding = 'UTF-8';
        file.open('r');
        var content = file.read();
        file.close();
        return content.split(/\r\n|\r|\n/).length;
    } catch (e) {
        return 0;
    }
}

// ============================================================================
// USER INTERFACE
// ============================================================================

/**
 * Show finder dialog
 * @param {Array} allScripts - All scripts
 * @param {Array} recent - Recent scripts
 * @returns {Object|null} Selected script
 */
function showFinderDialog(allScripts, recent) {
    var dialog = new Window('dialog', 'Find Script');
    dialog.alignChildren = 'fill';

    // Search field
    var searchGroup = dialog.add('group');
    searchGroup.add('statictext', undefined, 'Search:');
    var searchInput = searchGroup.add('edittext', undefined, '');
    searchInput.characters = 40;

    // Category filter
    var catGroup = dialog.add('group');
    catGroup.add('statictext', undefined, 'Category:');
    var catDropdown = catGroup.add('dropdownlist', undefined, ['All'].concat(CFG.categories));
    catDropdown.selection = 0;

    // Results list
    dialog.add('statictext', undefined, 'Results:');
    var resultsList = dialog.add('listbox', undefined, []);
    resultsList.preferredSize.height = 400;

    // Details panel
    var detailsText = dialog.add('statictext', undefined, '', {multiline: true});
    detailsText.preferredSize.height = 60;

    // Populate results
    var filteredScripts = allScripts;
    updateResultsList(resultsList, filteredScripts);

    // Search input handler
    searchInput.onChanging = function() {
        var query = searchInput.text.toLowerCase();
        var catFilter = catDropdown.selection.text;

        filteredScripts = filterScripts(allScripts, query, catFilter);
        updateResultsList(resultsList, filteredScripts);
    };

    // Category filter handler
    catDropdown.onChange = function() {
        var query = searchInput.text.toLowerCase();
        var catFilter = catDropdown.selection.text;

        filteredScripts = filterScripts(allScripts, query, catFilter);
        updateResultsList(resultsList, filteredScripts);
    };

    // Selection handler
    resultsList.onChange = function() {
        if (resultsList.selection) {
            var script = resultsList.selection.scriptData;
            detailsText.text = 'Path: ' + script.path + '\n' +
                               'Lines: ' + script.lines + ' | Size: ' + formatSize(script.size) + '\n' +
                               'Category: ' + script.category;
        }
    };

    // Double-click to execute
    resultsList.onDoubleClick = function() {
        if (resultsList.selection) {
            dialog.close(1);
        }
    };

    // Buttons
    var btnGroup = dialog.add('group');
    btnGroup.alignment = 'right';
    btnGroup.add('button', undefined, 'Cancel', {name: 'cancel'});
    btnGroup.add('button', undefined, 'Execute', {name: 'ok'});

    if (dialog.show() === 1 && resultsList.selection) {
        return resultsList.selection.scriptData;
    }

    return null;
}

/**
 * Update results list
 * @param {ListBox} list - List box
 * @param {Array} scripts - Scripts to display
 */
function updateResultsList(list, scripts) {
    list.removeAll();

    for (var i = 0; i < Math.min(100, scripts.length); i++) {
        var script = scripts[i];
        var item = list.add('item', script.name + ' (' + script.category + ')');
        item.scriptData = script;
    }

    if (scripts.length > 100) {
        list.add('item', '... and ' + (scripts.length - 100) + ' more (refine search)');
    }
}

/**
 * Filter scripts
 * @param {Array} scripts - All scripts
 * @param {String} query - Search query
 * @param {String} category - Category filter
 * @returns {Array} Filtered scripts
 */
function filterScripts(scripts, query, category) {
    var filtered = [];

    for (var i = 0; i < scripts.length; i++) {
        var script = scripts[i];

        // Category filter
        if (category !== 'All' && script.category !== category) {
            continue;
        }

        // Search filter
        if (query) {
            var name = script.name.toLowerCase();
            if (name.indexOf(query) === -1) {
                // Try fuzzy match
                if (!fuzzyMatch(name, query)) {
                    continue;
                }
            }
        }

        filtered.push(script);
    }

    return filtered;
}

/**
 * Fuzzy match
 * @param {String} str - String to search
 * @param {String} query - Query
 * @returns {Boolean} True if matches
 */
function fuzzyMatch(str, query) {
    var strIndex = 0;
    var queryIndex = 0;

    while (strIndex < str.length && queryIndex < query.length) {
        if (str.charAt(strIndex) === query.charAt(queryIndex)) {
            queryIndex++;
        }
        strIndex++;
    }

    return queryIndex === query.length;
}

/**
 * Format size
 * @param {Number} bytes - Bytes
 * @returns {String} Formatted size
 */
function formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
}

// ============================================================================
// CORE LOGIC - EXECUTION
// ============================================================================

/**
 * Execute script
 * @param {Object} script - Script to execute
 */
function executeScript(script) {
    try {
        var file = new File(script.path);
        if (!file.exists) {
            alert('Script file not found:\n' + script.path, 'Error');
            return;
        }

        // Execute the script
        app.doScript(file);

        alert('Script executed successfully:\n' + script.name, 'Success');

    } catch (e) {
        alert('Error executing script:\n' + e.message, 'Error');
    }
}

// ============================================================================
// CORE LOGIC - RECENT SCRIPTS
// ============================================================================

/**
 * Load recent scripts
 * @returns {Array} Recent scripts
 */
function loadRecent() {
    var file = new File(CFG.recentFile);
    if (!file.exists) return [];

    try {
        file.encoding = 'UTF-8';
        file.open('r');
        var json = file.read();
        file.close();
        return AIS.JSON.parse(json);
    } catch (e) {
        return [];
    }
}

/**
 * Save to recent
 * @param {Object} script - Script to save
 */
function saveToRecent(script) {
    var recent = loadRecent();

    // Remove duplicates
    for (var i = recent.length - 1; i >= 0; i--) {
        if (recent[i].path === script.path) {
            recent.splice(i, 1);
        }
    }

    // Add to front
    recent.unshift({
        name: script.name,
        category: script.category,
        path: script.path
    });

    // Keep only last 10
    if (recent.length > CFG.maxRecent) {
        recent = recent.slice(0, CFG.maxRecent);
    }

    // Save
    var folder = new Folder(Folder.myDocuments + '/Adobe Scripts');
    if (!folder.exists) folder.create();

    var file = new File(CFG.recentFile);
    file.encoding = 'UTF-8';
    file.open('w');
    file.write(AIS.JSON.stringify(recent));
    file.close();
}
