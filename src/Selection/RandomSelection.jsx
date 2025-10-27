/**
 * Random Selection
 * @version 1.0.0
 * @description Randomly select objects by percentage or count
 * @category Selection
 *
 * Features:
 * - Select objects by percentage (1-100%)
 * - Select objects by exact count
 * - Fischer-Yates shuffle algorithm for true randomization
 * - Optimized selection/deselection logic
 * - Live preview with Apply button
 *
 * Original: RandomSelection.js by Boris Boguslavsky
 * Based on Random Selection from Randomill Plugin (https://randomill.com)
 * Modernized for AIS framework
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
        alert('No selection\nSelect two or more objects and try again');
        return;
    }

    main();
})();

// ============================================================================
// CONFIGURATION
// ============================================================================

var CFG = {
    scriptName: 'Random Selection',
    version: '1.0.0',
    defaultValue: 50,
    selectionTippingPoint: 0.6
};

// ============================================================================
// MAIN FUNCTION
// ============================================================================

function main() {
    try {
        showDialog();
    } catch (error) {
        AIS.Error.show('Random Selection Error', error);
    }
}

// ============================================================================
// CORE LOGIC
// ============================================================================

function randomizeSelection(objects, mode, value) {
    if (objects.length < 2) {
        throw new Error('Select at least two objects to randomize selection');
    }

    var numValue = parseFloat(value);
    if (isNaN(numValue)) {
        throw new Error('Invalid value entered');
    }

    var targetCount = calculateTargetCount(objects.length, mode, numValue);

    if (targetCount <= 0) {
        app.activeDocument.selection = [];
        return;
    }

    if (targetCount >= objects.length) {
        return;
    }

    var strategy = determineStrategy(objects.length, targetCount);
    var randomIndices = createRandomizedIndices(objects.length);

    if (!strategy.deselect) {
        app.activeDocument.selection = [];
    }

    for (var i = 0; i < strategy.count; i++) {
        var index = randomIndices[i];
        if (objects[index] !== undefined) {
            objects[index].selected = !strategy.deselect;
        }
    }
}

function calculateTargetCount(totalCount, mode, value) {
    var target;

    if (mode === 'percentage') {
        target = Math.round((totalCount * value) / 100);
    } else {
        target = Math.floor(value);
    }

    if (target <= 0) return 0;
    if (target >= totalCount) return totalCount;

    return target;
}

function determineStrategy(totalCount, targetCount) {
    var percentage = targetCount / totalCount;

    if (percentage <= CFG.selectionTippingPoint) {
        return {
            deselect: false,
            count: targetCount
        };
    } else {
        return {
            deselect: true,
            count: totalCount - targetCount
        };
    }
}

function createRandomizedIndices(length) {
    var indices = [];
    for (var i = 0; i < length; i++) {
        indices.push(i);
    }
    return shuffleArray(indices);
}

function shuffleArray(array) {
    var currentIndex = array.length;

    while (currentIndex !== 0) {
        var randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        var temp = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temp;
    }

    return array;
}

// ============================================================================
// USER INTERFACE
// ============================================================================

function showDialog() {
    var dialog = new Window('dialog', CFG.scriptName + ' ' + CFG.version);
    dialog.orientation = 'column';
    dialog.alignChildren = ['left', 'top'];
    dialog.spacing = 10;
    dialog.margins = 16;

    // Options group
    var optionsGroup = dialog.add('group');
    optionsGroup.orientation = 'row';
    optionsGroup.alignChildren = ['fill', 'fill'];
    optionsGroup.alignment = ['fill', 'top'];

    // Selection method panel
    var methodPanel = optionsGroup.add('panel', undefined, 'Selection Method:');
    methodPanel.orientation = 'column';
    methodPanel.alignChildren = ['left', 'top'];
    methodPanel.margins = 16;
    methodPanel.alignment = ['fill', 'top'];

    var percentageRadio = methodPanel.add('radiobutton', undefined, 'Percentage');
    percentageRadio.value = true;
    var countRadio = methodPanel.add('radiobutton', undefined, 'Count');

    // Value input panel
    var valuePanel = optionsGroup.add('panel', undefined, 'Value:');
    valuePanel.orientation = 'column';
    valuePanel.alignChildren = ['left', 'top'];
    valuePanel.margins = 10;
    valuePanel.alignment = ['fill', 'fill'];

    var valueInput = valuePanel.add('edittext', undefined, CFG.defaultValue);
    valueInput.characters = 5;

    // Footer buttons
    var buttonGroup = dialog.add('group');
    buttonGroup.alignment = ['fill', 'top'];
    buttonGroup.alignChildren = ['fill', 'fill'];
    buttonGroup.margins = [0, 0, 0, 0];

    var closeButton = buttonGroup.add('button', undefined, 'Close');
    var applyButton = buttonGroup.add('button', undefined, 'Apply');
    applyButton.active = true;

    // Event handlers
    closeButton.onClick = function() {
        dialog.close();
    };

    applyButton.onClick = function() {
        try {
            if (!app.activeDocument || app.activeDocument.selection.length === 0) {
                alert('No selection\nSelect objects first');
                return;
            }

            var mode = percentageRadio.value ? 'percentage' : 'count';
            var objects = app.activeDocument.selection;

            randomizeSelection(objects, mode, valueInput.text);
            app.redraw();

        } catch (error) {
            alert('Error\n' + error.message);
        }
    };

    dialog.center();
    dialog.show();
}
