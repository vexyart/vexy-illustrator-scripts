/**
 * Batch Text Edit
 * @version 1.0.0
 * @description Edit the contents of multiple text frames all at once in a single dialog. Displays all selected text frames as lines in an edittext, allowing bulk find/replace or editing. Supports sorting by visual order or layer tree order, reverse order, and handles multiline text with return code replacement. Originally created by Hiroyuki Sato with sorting by Alexander Ladygin, modernized for AIS framework.
 * @category Text
 * @features
 *   - Bulk edit multiple text frames at once
 *   - Multiline edittext with scrolling
 *   - Sort by visual order (left→right or top→bottom)
 *   - Sort by layer tree order
 *   - Reverse display order option
 *   - Return code replacement (@ / represents line breaks)
 *   - Handles point text and area text
 *   - Preserves character formatting of first character
 *   - Recursively finds text in groups
 * @author Hiroyuki Sato, Alexander Ladygin (original), Vexy (modernization)
 * @usage File → Scripts → Batch Text Edit
 *        Select text frames, edit all contents in dialog
 * @original https://github.com/shspage
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

    if (!AIS.Document.hasSelection()) {
        alert('No text frames selected\nSelect text frames and try again');
        return;
    }

    main();
})();

// ============================================================================
// CONFIGURATION
// ============================================================================
var CFG = {
    VERSION: '1.0.0',
    RETURN_CODE_ALT: '@/',
    EDITTEXT_WIDTH: 200,
    EDITTEXT_HEIGHT: 200,
    AI_VERSION: parseFloat(app.version)
};

// ============================================================================
// MAIN FUNCTION
// ============================================================================
function main() {
    try {
        var textFrames = collectTextFrames();

        if (textFrames.length === 0) {
            alert('No text frames in selection\nSelect text frames and try again');
            return;
        }

        showDialog(textFrames);

    } catch (e) {
        AIS.Error.show('Batch text edit failed', e);
    }
}

// ============================================================================
// TEXT FRAME COLLECTION
// ============================================================================
function collectTextFrames() {
    var visualOrder = [];
    var layerOrder = [];
    extractTextFrames(app.activeDocument.selection, visualOrder, layerOrder);
    return {
        visual: visualOrder,
        layer: layerOrder,
        active: visualOrder
    };
}

function extractTextFrames(items, visualArr, layerArr) {
    for (var i = 0; i < items.length; i++) {
        if (items[i].typename === 'TextFrame') {
            var vtf = new VirtualTextFrame(items[i]);
            visualArr.push(vtf);
            layerArr.push(vtf);
        } else if (items[i].typename === 'GroupItem') {
            extractTextFrames(items[i].pageItems, visualArr, layerArr);
        }
    }
}

function VirtualTextFrame(textFrame) {
    this.tf = textFrame;

    if (textFrame.kind === TextType.POINTTEXT) {
        this.left = textFrame.left;
        this.top = textFrame.top;
    } else {
        var path = textFrame.textPath;
        this.left = path.left;
        this.top = path.top;
    }
}

// ============================================================================
// SORTING
// ============================================================================
function sortByVisualOrder(frames) {
    var rect = calculateBounds(frames);
    var width = rect[2] - rect[0];
    var height = rect[1] - rect[3];

    if (width > height) {
        // Wider than tall: sort left to right, then top to bottom
        frames.sort(function(a, b) {
            return a.left === b.left ? b.top - a.top : a.left - b.left;
        });
    } else {
        // Taller than wide: sort top to bottom, then left to right
        frames.sort(function(a, b) {
            return a.top === b.top ? a.left - b.left : b.top - a.top;
        });
    }
}

function calculateBounds(frames) {
    var left = frames[0].left;
    var top = frames[0].top;
    var right = frames[0].left;
    var bottom = frames[0].top;

    for (var i = 1; i < frames.length; i++) {
        left = Math.min(left, frames[i].left);
        top = Math.max(top, frames[i].top);
        right = Math.max(right, frames[i].left);
        bottom = Math.min(bottom, frames[i].top);
    }

    return [left, top, right, bottom];
}

// ============================================================================
// CONTENT MANAGEMENT
// ============================================================================
function getContents(frames) {
    var contents = [];
    for (var i = 0; i < frames.length; i++) {
        var text = frames[i].tf.contents;
        text = text.replace(/\r/g, CFG.RETURN_CODE_ALT);
        contents.push(text);
    }
    return contents;
}

function applyContents(frames, editedText) {
    var lines = editedText.split('\n');

    // Remove trailing empty lines
    while (lines.length > 0 && lines[lines.length - 1] === '') {
        lines.pop();
    }

    for (var i = 0; i < frames.length; i++) {
        if (i >= lines.length) break;

        var text = lines[i].replace(new RegExp(CFG.RETURN_CODE_ALT, 'g'), '\r');
        frames[i].tf.contents = text;
    }
}

// ============================================================================
// USER INTERFACE
// ============================================================================
function showDialog(textFrames) {
    var dialog = new Window('dialog', 'Batch Text Edit v' + CFG.VERSION);
    dialog.orientation = 'column';
    dialog.alignChildren = 'fill';

    // Edittext area
    var etOptions = {
        multiline: true,
        scrolling: true
    };

    if (CFG.AI_VERSION > 15) {
        etOptions.wantReturn = true;
    }

    var editText = dialog.add('edittext', [0, 0, CFG.EDITTEXT_WIDTH, CFG.EDITTEXT_HEIGHT], '', etOptions);

    // Sorting options
    var sortByTreeCb = dialog.add('checkbox', [0, 0, CFG.EDITTEXT_WIDTH, 30],
        'Sort by [Layers] tree\ninstead of visual order');

    var reverseCb = dialog.add('checkbox', [0, 0, CFG.EDITTEXT_WIDTH, 15],
        'Reverse display order');

    // Info text
    var infoText = '* "' + CFG.RETURN_CODE_ALT + '" means a return code';
    if (CFG.AI_VERSION <= 15) {
        infoText += '\r* Use ctrl+enter for new line';
    }

    var infoLabel = dialog.add('statictext', undefined, infoText, {multiline: true});

    // Buttons
    var btnGroup = dialog.add('group');
    var okBtn = btnGroup.add('button', undefined, 'OK');
    var cancelBtn = btnGroup.add('button', undefined, 'Cancel');

    // Initialize display
    sortByVisualOrder(textFrames.visual);
    textFrames.active = textFrames.visual;
    updateDisplay();

    // Event handlers
    sortByTreeCb.onClick = function() {
        updateSorting();
    };

    reverseCb.onClick = function() {
        textFrames.active.reverse();
        updateDisplay();
    };

    okBtn.onClick = function() {
        applyContents(textFrames.active, editText.text);
        dialog.close();
    };

    editText.active = true;
    dialog.center();
    dialog.show();

    // Helper functions
    function updateSorting() {
        if (sortByTreeCb.value) {
            textFrames.active = textFrames.layer.slice();
        } else {
            textFrames.active = textFrames.visual.slice();
            sortByVisualOrder(textFrames.active);
        }

        if (reverseCb.value) {
            textFrames.active.reverse();
        }

        updateDisplay();
    }

    function updateDisplay() {
        var contents = getContents(textFrames.active);
        editText.text = contents.join('\n');
        dialog.update();
    }
}
