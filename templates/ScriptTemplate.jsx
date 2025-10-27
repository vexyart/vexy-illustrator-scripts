/**
 * Script Name
 * @version 1.0.0
 * @description Brief description of what this script does
 * @author Adobe Illustrator Scripts
 * @license MIT
 * @category Category name (Artboards, Text, Colors, etc.)
 */

// ============================================================================
// IMPORTS
// ============================================================================

#include "../lib/core.jsx"
#include "../lib/ui.jsx"

// ============================================================================
// METADATA
// ============================================================================

var SCRIPT = {
    name: 'Script Name',
    version: '1.0.0',
    description: 'Brief description',
    category: 'Category',
    requiresDocument: true,
    requiresSelection: false
};

// ============================================================================
// CONFIGURATION
// ============================================================================

var CONFIG = {
    // Default configuration values
    defaultValue: 10,
    maxValue: 100,
    enablePreview: true,

    // Preference storage
    prefsFile: 'ScriptName_prefs.json',

    // Load preferences
    loadPrefs: function() {
        try {
            var file = new File(Folder.myDocuments + '/Adobe Scripts/' + this.prefsFile);
            if (file.exists) {
                file.open('r');
                var data = file.read();
                file.close();

                var prefs = eval('(' + data + ')');
                AIS.Object.extend(this, prefs);
            }
        } catch (e) {
            AIS.Log.warn('Could not load preferences: ' + e.message);
        }
    },

    // Save preferences
    savePrefs: function() {
        try {
            var folder = new Folder(Folder.myDocuments + '/Adobe Scripts');
            if (!folder.exists) folder.create();

            var file = new File(folder + '/' + this.prefsFile);
            file.open('w');

            var prefs = {
                defaultValue: this.defaultValue,
                maxValue: this.maxValue
                // Add other preferences to save
            };

            file.write(JSON.stringify(prefs, null, 2));
            file.close();
        } catch (e) {
            AIS.Log.warn('Could not save preferences: ' + e.message);
        }
    }
};

// ============================================================================
// MAIN FUNCTION
// ============================================================================

/**
 * Main script entry point
 */
function main() {
    // Load user preferences
    CONFIG.loadPrefs();

    // Show dialog and get user input
    var userInput = showDialog();

    if (!userInput) {
        return; // User cancelled
    }

    // Save preferences for next time
    CONFIG.savePrefs();

    // Perform the main operation
    processDocument(userInput);

    // Redraw document
    AIS.Document.redraw();
}

// ============================================================================
// UI FUNCTIONS
// ============================================================================

/**
 * Show the main dialog
 * @returns {Object|null} User input values or null if cancelled
 */
function showDialog() {
    // Create dialog using UI builder
    var builder = new AIS.UI.DialogBuilder(SCRIPT.name, AIS.UI.Constants.DIALOG_MEDIUM);

    // Add main panel
    var panel = builder.addPanel('Options');

    // Add input controls
    var valueInput = builder.addInput(
        panel,
        'Value:',
        CONFIG.defaultValue.toString(),
        {
            helpTip: 'Enter a value between 0 and ' + CONFIG.maxValue,
            active: true
        }
    );

    // Validate numeric input
    AIS.UI.validateNumeric(valueInput, {
        min: 0,
        max: CONFIG.maxValue,
        decimals: 0,
        defaultValue: CONFIG.defaultValue
    });

    // Add checkbox example
    var enableOption = builder.addCheckbox(
        panel,
        'Enable option',
        true,
        { helpTip: 'Enable this option' }
    );

    // Add OK/Cancel buttons
    var buttons = builder.addButtons({
        onOk: function() {
            // Validate inputs before closing
            var value = AIS.Validate.parseInt(valueInput.text, CONFIG.defaultValue);

            if (!AIS.Number.inRange(value, 0, CONFIG.maxValue)) {
                AIS.UI.message(
                    'Invalid Input',
                    'Value must be between 0 and ' + CONFIG.maxValue
                );
                return false; // Keep dialog open
            }

            // Store values in CONFIG for saving
            CONFIG.defaultValue = value;

            return true; // Close dialog
        }
    });

    // Show dialog
    var result = builder.show();

    if (result === 0) {
        return null; // User cancelled
    }

    // Return user input
    return {
        value: AIS.Validate.parseInt(valueInput.text, CONFIG.defaultValue),
        enableOption: enableOption.value
    };
}

// ============================================================================
// BUSINESS LOGIC
// ============================================================================

/**
 * Process the document with user input
 * @param {Object} input - User input from dialog
 */
function processDocument(input) {
    var doc = AIS.Document.getActive();
    if (!doc) return;

    try {
        // Implement main functionality here

        // Example: Process selection
        if (SCRIPT.requiresSelection) {
            var selection = AIS.Document.getSelection();

            for (var i = 0; i < selection.length; i++) {
                var item = selection[i];
                processItem(item, input);
            }
        }

    } catch (e) {
        AIS.Error.show('Error processing document', e);
        AIS.Error.log(SCRIPT.name, 'Processing error', e);
    }
}

/**
 * Process individual item
 * @param {PageItem} item - Item to process
 * @param {Object} input - User input
 */
function processItem(item, input) {
    // Implement item-specific processing
    // This is just an example
    try {
        // Do something with the item based on input.value
        // ...

    } catch (e) {
        AIS.Log.error('Error processing item: ' + e.message);
    }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Helper function example
 * @param {*} param - Description
 * @returns {*} Description
 */
function helperFunction(param) {
    // Helper logic
    return param;
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate script can run
 * @returns {Object} Validation result {valid: Boolean, message: String}
 */
function validateEnvironment() {
    // Check for document
    if (SCRIPT.requiresDocument && !AIS.Document.hasDocument()) {
        return {
            valid: false,
            message: 'Please open a document first.'
        };
    }

    // Check for selection
    if (SCRIPT.requiresSelection && !AIS.Document.hasSelection()) {
        return {
            valid: false,
            message: 'Please select at least one object.'
        };
    }

    // Check Illustrator version
    if (!AIS.Core.checkVersion()) {
        return {
            valid: false,
            message: 'This script requires Adobe Illustrator CC 2012 or higher.'
        };
    }

    return { valid: true };
}

// ============================================================================
// ENTRY POINT
// ============================================================================

(function() {
    // Validate environment
    var validation = validateEnvironment();

    if (!validation.valid) {
        alert(SCRIPT.name + '\n\n' + validation.message);
        return;
    }

    // Run main function with error handling
    try {
        main();
    } catch (err) {
        AIS.Error.show('Unexpected error occurred', err);
        AIS.Error.log(SCRIPT.name, 'Unexpected error', err);
    }
})();
