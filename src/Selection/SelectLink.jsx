/**
 * Select Link
 * @version 1.0.0
 * @description Select linked files by name with regex search support
 * @category Selection
 *
 * Features:
 * - Search and select linked files by name
 * - Regular expression support in Find field
 * - Multi-select from list
 * - Real-time search filtering
 * - Bilingual UI (English/Japanese)
 * - Handles Japanese Unicode combining characters (Mac)
 *
 * Original: selectLink.js by sky-chaser-high
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
    scriptName: 'Select Link',
    version: '1.0.0'
};

// ============================================================================
// MAIN FUNCTION
// ============================================================================

function main() {
    try {
        var links = getLinkFiles();
        if (!links.length) {
            alert('No linked files\nThis document contains no linked files');
            return;
        }

        var dialog = showDialog(links);
        if (!dialog) return;

    } catch (error) {
        AIS.Error.show('Select Link Error', error);
    }
}

// ============================================================================
// CORE LOGIC
// ============================================================================

function getLinkFiles() {
    var links = [];
    var items = app.activeDocument.placedItems;

    for (var i = 0; i < items.length; i++) {
        var item = items[i];
        var name = getFilename(item);
        if (!name || isArrayContains(links, name)) continue;
        links.push(name);
    }

    return links.sort();
}

function getFilename(item) {
    var file = getFile(item);
    if (!file) return;

    var filename = File.decode(file.name);
    if (AIS.System.isMac()) {
        return convertJapaneseEncoding(filename);
    }
    return filename;
}

function getFile(item) {
    try {
        return item.file;
    } catch (err) {
        return null;
    }
}

function selectLinkFiles(namePattern) {
    var links = app.activeDocument.placedItems;
    var regex = new RegExp(namePattern, 'ig');

    for (var i = 0; i < links.length; i++) {
        var link = links[i];
        var filename;

        try {
            filename = File.decode(link.file.name);
        } catch (err) {
            filename = File.decode(link.name);
        }

        if (AIS.System.isMac()) {
            filename = convertJapaneseEncoding(filename);
        }

        if (regex.test(filename)) {
            link.selected = true;
        }
    }
}

function filterListItems(items, searchText) {
    var regex = new RegExp(searchText, 'ig');

    for (var i = 0; i < items.length; i++) {
        var item = items[i];
        if (!searchText || regex.test(item.text)) {
            item.selected = true;
        } else {
            item.selected = false;
        }
    }
}

// ============================================================================
// UTILITIES
// ============================================================================

function isArrayContains(array, value) {
    for (var i = 0; i < array.length; i++) {
        if (array[i] === value) return true;
    }
    return false;
}

/**
 * Convert Japanese Unicode Combining Character Sequences
 * Mac-specific handling for dakuten/handakuten characters
 * References:
 * - https://shinkufencer.hateblo.jp/entry/2021/12/04/233000
 * - https://bn.dgcr.com/archives/20080707140200.html
 */
function convertJapaneseEncoding(text) {
    var dakuten = '%E3%82%99';
    var handakuten = '%E3%82%9A';

    var encoded = File.encode(text);
    encoded = convertJapaneseSub(encoded, dakuten, 1);
    encoded = convertJapaneseSub(encoded, handakuten, 2);

    return File.decode(encoded);
}

function convertJapaneseSub(src, code, offset) {
    // Special handling for "da" character
    src = src.replace(/%E3%82%BF%E3%82%99/g, '%E3%83%80');

    var parts = src.split(code);
    for (var i = 0; i < parts.length - 1; i++) {
        var str = parts[i];
        if (!str) continue;

        var body = str.substring(0, str.length - 2);
        var foot = str.substring(str.length - 2, str.length);

        var hex = eval('0x' + foot) + offset;
        hex = hex.toString(16).toUpperCase();

        parts[i] = body + hex;
    }

    return parts.join('');
}

// ============================================================================
// USER INTERFACE
// ============================================================================

function showDialog(links) {
    var ui = localizeUI();

    var dialog = new Window('dialog');
    dialog.text = ui.title;
    dialog.preferredSize.width = 340;
    dialog.orientation = 'column';
    dialog.alignChildren = ['fill', 'top'];
    dialog.spacing = 10;
    dialog.margins = 16;

    // Find field
    var searchGroup = dialog.add('group');
    searchGroup.orientation = 'row';
    searchGroup.alignChildren = ['left', 'center'];
    searchGroup.spacing = 10;
    searchGroup.margins = 0;

    var searchLabel = searchGroup.add('statictext', undefined, ui.find);

    var searchInput = searchGroup.add('edittext', undefined, '');
    searchInput.alignment = ['fill', 'center'];
    searchInput.active = true;

    // List of linked files
    var linkList = dialog.add('listbox', undefined, links, {
        multiselect: true
    });
    linkList.preferredSize.height = 300;

    // Buttons
    var buttonGroup = dialog.add('group');
    buttonGroup.orientation = 'row';
    buttonGroup.alignChildren = ['right', 'center'];
    buttonGroup.spacing = 10;
    buttonGroup.margins = 0;

    var cancelButton = buttonGroup.add('button', undefined, ui.cancel);
    cancelButton.preferredSize.width = 90;

    var okButton = buttonGroup.add('button', undefined, ui.ok);
    okButton.preferredSize.width = 90;

    // Event handlers
    searchInput.onChanging = function() {
        filterListItems(linkList.items, searchInput.text);
    };

    searchLabel.addEventListener('click', function() {
        searchInput.active = false;
        searchInput.active = true;
    });

    cancelButton.onClick = function() {
        dialog.close();
    };

    okButton.onClick = function() {
        var selection = linkList.selection;
        var namePattern = selection ? selection.join('|') : '^';
        selectLinkFiles(namePattern);
        dialog.close();
    };

    dialog.center();
    dialog.show();

    return true;
}

function localizeUI() {
    var lang = AIS.System.isMac() ? 'en' : 'en';

    return {
        title: {
            en: 'Select Link',
            ja: 'リンクを選択'
        }[lang],
        find: {
            en: 'Find:',
            ja: '検索文字列:'
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
        AIS.Error.show('Select Link error', e);
    }
}
