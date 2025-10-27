/**
 * Go to Line
 * @version 1.0.0
 * @description Navigate to specific line in text frames (like VS Code Ctrl+G)
 * @author Adobe Illustrator Scripts
 * @license MIT
 * @category Favorites
 * @requires Illustrator CC 2018 or higher
 */

#include "../lib/core.jsx"
#include "../lib/ui.jsx"

// ============================================================================
// METADATA
// ============================================================================

var SCRIPT = {
    name: 'Go to Line',
    version: '1.0.0',
    description: 'Navigate to specific line number in text (VS Code-like)',
    category: 'Favorites',
    requiresDocument: true,
    requiresSelection: true,
    minVersion: 22 // CC 2018
};

// ============================================================================
// MAIN FUNCTION
// ============================================================================

function main() {
    var doc = AIS.Document.getActive();
    if (!doc) return;

    var selection = doc.selection;
    if (!selection[0] || !selection[0].typename || selection[0].typename !== 'TextFrame') {
        alert('Please select text and enter text editing mode first.');
        return;
    }

    var textFrame = selection[0];
    var story = textFrame.story;
    var lines = story.lines;
    var ranges = story.textRanges;

    if (lines.length === 0) {
        alert('No lines found in selected text.');
        return;
    }

    // Get line contents for list
    var lineContents = getLineContents(lines);

    // Show dialog
    var lineNumber = showGoToLineDialog(lineContents);

    if (lineNumber > 0) {
        navigateToLine(lineNumber, lines, ranges);
        panToLine(lineNumber, lines);
        AIS.Document.redraw();
    }
}

// ============================================================================
// NAVIGATION FUNCTIONS
// ============================================================================

/**
 * Navigate cursor to specified line
 * @param {Number} lineNumber - Line number (1-based)
 * @param {TextLines} lines - Story lines
 * @param {TextRanges} ranges - Story text ranges
 */
function navigateToLine(lineNumber, lines, ranges) {
    try {
        var lineIndex = lineNumber - 1;
        if (lineIndex < 0 || lineIndex >= lines.length) return;

        var line = lines[lineIndex];
        var start = line.start;

        // Move cursor to start of line using cut/paste trick
        // (This is the only reliable way to position cursor in ExtendScript)
        if (lineNumber === 1) {
            line.insertionPoints[0].characters.add(' ');
            start = 1;
        }

        ranges[start - 1].select();
        app.cut();

        if (lineNumber > 1) {
            app.paste();
        }
    } catch (e) {
        AIS.Log.warn('Error navigating to line: ' + e.message);
    }
}

/**
 * Pan view to center on specified line
 * @param {Number} lineNumber - Line number (1-based)
 * @param {TextLines} lines - Story lines
 */
function panToLine(lineNumber, lines) {
    try {
        var story = lines.parent;
        var textFrames = story.textFrames;

        // Find which text frame contains this line
        var frameIndex = getTextFrameIndex(lineNumber, textFrames);
        if (frameIndex < 0) return;

        var frame = textFrames[frameIndex];
        var leading = getLeadingToLine(lineNumber, textFrames, frameIndex);

        // Calculate center point based on text orientation
        var centerPoint;
        if (frame.orientation === TextOrientation.HORIZONTAL) {
            centerPoint = [frame.left, frame.top - leading];
        } else {
            centerPoint = [frame.left + (frame.width - leading), frame.top];
        }

        // Pan view to center on this line
        var view = app.activeDocument.views[0];
        view.centerPoint = centerPoint;
    } catch (e) {
        AIS.Log.warn('Error panning to line: ' + e.message);
    }
}

/**
 * Get text frame index containing specified line
 * @param {Number} lineNumber - Line number (1-based)
 * @param {TextFrames} frames - Text frames in story
 * @returns {Number} Frame index or -1
 */
function getTextFrameIndex(lineNumber, frames) {
    var totalLines = 0;
    for (var i = 0; i < frames.length; i++) {
        totalLines += frames[i].lines.length;
        if (totalLines >= lineNumber) {
            return i;
        }
    }
    return 0;
}

/**
 * Calculate leading (vertical spacing) to specified line
 * @param {Number} lineNumber - Line number (1-based)
 * @param {TextFrames} frames - Text frames in story
 * @param {Number} frameIndex - Index of frame containing line
 * @returns {Number} Total leading in points
 */
function getLeadingToLine(lineNumber, frames, frameIndex) {
    // Count lines in previous frames
    var linesBeforeFrame = 0;
    for (var i = 0; i < frameIndex; i++) {
        linesBeforeFrame += frames[i].lines.length;
    }

    // Calculate leading for lines in current frame
    var leading = 0;
    var linesInFrame = frames[frameIndex].lines;
    var linesToCount = lineNumber - linesBeforeFrame;

    for (var i = 0; i < linesToCount && i < linesInFrame.length; i++) {
        var lineLeading = linesInFrame[i].characterAttributes.leading;
        leading += lineLeading;
    }

    return leading;
}

/**
 * Get contents of all lines for display
 * @param {TextLines} lines - Story lines
 * @returns {Array} Array of line content strings
 */
function getLineContents(lines) {
    var contents = [];
    for (var i = 0; i < lines.length; i++) {
        var content = lines[i].contents;
        // Truncate long lines
        if (content.length > 80) {
            content = content.substring(0, 77) + '...';
        }
        contents.push(content);
    }
    return contents;
}

// ============================================================================
// UI FUNCTIONS
// ============================================================================

/**
 * Show Go to Line dialog
 * @param {Array} lineContents - Array of line contents
 * @returns {Number} Selected line number (1-based) or 0 if cancelled
 */
function showGoToLineDialog(lineContents) {
    var dialog = new Window('dialog', 'Go to Line');
    dialog.orientation = 'column';
    dialog.alignChildren = ['fill', 'top'];
    dialog.spacing = 10;
    dialog.margins = 16;

    // Description
    var description = dialog.add('statictext', undefined, 'Enter a line number or select a line from the list below.');
    description.preferredSize.width = 500;

    // Line number input
    var lineInput = dialog.add('edittext', undefined, '1');
    lineInput.preferredSize.width = 500;
    lineInput.active = true;

    // Line list
    var lineList = dialog.add('listbox', undefined, undefined, {
        numberOfColumns: 2,
        showHeaders: false,
        columnTitles: ['#', 'Contents']
    });
    lineList.preferredSize.width = 500;
    lineList.preferredSize.height = 220;

    // Populate list
    for (var i = 0; i < lineContents.length; i++) {
        var item = lineList.add('item', String(i + 1));
        item.subItems[0].text = lineContents[i];
    }

    // Buttons
    var buttonGroup = dialog.add('group');
    buttonGroup.orientation = 'row';
    buttonGroup.alignChildren = ['right', 'center'];
    buttonGroup.alignment = ['fill', 'top'];

    var cancelBtn = buttonGroup.add('button', undefined, 'Cancel');
    cancelBtn.preferredSize.width = 90;

    var okBtn = buttonGroup.add('button', undefined, 'OK');
    okBtn.preferredSize.width = 90;

    // Event handlers
    var selectedLine = 0;

    // Keyboard navigation in input field
    lineInput.addEventListener('keydown', function(event) {
        var value = Number(lineInput.text);
        if (isNaN(value)) value = 0;

        var keyboard = ScriptUI.environment.keyboardState;
        var step = keyboard.shiftKey ? 10 : 1;

        if (event.keyName === 'Up') {
            value += step;
            if (value > lineContents.length) value = lineContents.length;
            lineInput.text = String(value);
            event.preventDefault();
        } else if (event.keyName === 'Down') {
            value -= step;
            if (value < 1) value = 1;
            lineInput.text = String(value);
            event.preventDefault();
        }
    });

    // List selection updates input
    lineList.onChange = function() {
        if (lineList.selection) {
            lineInput.text = String(lineList.selection.index + 1);
        }
    };

    // OK button
    okBtn.onClick = function() {
        var num = Number(lineInput.text);
        if (!isNaN(num) && num >= 1 && num <= lineContents.length) {
            selectedLine = num;
            dialog.close();
        } else {
            alert('Please enter a valid line number between 1 and ' + lineContents.length);
        }
    };

    // Cancel button
    cancelBtn.onClick = function() {
        dialog.close();
    };

    // Show dialog
    dialog.center();
    dialog.show();

    return selectedLine;
}

// ============================================================================
// VALIDATION
// ============================================================================

function validateEnvironment() {
    if (!AIS.Document.hasDocument()) {
        return { valid: false, message: 'Please open a document first.' };
    }

    if (!AIS.Document.hasSelection()) {
        return { valid: false, message: 'Please select a text frame and enter text editing mode.' };
    }

    // Check version
    var currentVersion = parseInt(app.version);
    if (currentVersion < SCRIPT.minVersion) {
        return {
            valid: false,
            message: 'This script requires Illustrator CC 2018 or higher.\nCurrent version: ' + app.version
        };
    }

    return { valid: true };
}

// ============================================================================
// ENTRY POINT
// ============================================================================

(function() {
    var validation = validateEnvironment();

    if (!validation.valid) {
        alert(SCRIPT.name + '\n\n' + validation.message);
        return;
    }

    try {
        main();
    } catch (err) {
        AIS.Error.show('Unexpected error occurred', err);
        AIS.Error.log(SCRIPT.name, 'Unexpected error', err);
    }
})();
