/**
 * Renumber Layers and Artboards
 * @version 1.0.0
 * @description Renumber layers and/or artboards with optional prefix, suffix, and alpha-numeric encoding
 * @author Christian Condamine (modernized for AIS)
 * @license MIT
 * @category Layers
 * @requires Illustrator CS4 or higher
 *
 * Features:
 * - Renumber layers and/or artboards
 * - Custom starting value
 * - Add prefix and suffix
 * - Alpha-numeric encoding for numbers > 99 (10→a0, 11→b0, etc.)
 * - Zero-padded numbering (01-09)
 *
 * Original: Christian Condamine (christian.condamine@laposte.net)
 * Modernized to use AIS library while preserving all functionality
 */




//@target illustrator
var c=File(Folder.myDocuments+"/Adobe Scripts/vexy-ville.ini");if(c.exists){c.open('r');var p=c.read();c.close();var l=File(p+".lib/core.jsx");if(l.exists)$.evalFile(l.fsName);}
app.preferences.setBooleanPreference('ShowExternalJSXWarning', false);

// ============================================================================
// MAIN FUNCTION
// ============================================================================

function main() {
    var dialog = showDialog();
    var cancelled = false;

    dialog.cancelBtn.onClick = function() {
        cancelled = true;
        dialog.close();
    }

    dialog.okBtn.onClick = function() {
        var config = getConfiguration(dialog);

        if (!config.applyToLayers && !config.applyToArtboards) {
            alert('Invalid configuration\nCheck at least one option:\n- Layers\n- Artboards');
            return;
        }

        renumberObjects(config);
        dialog.close();
    }

    dialog.show();
}

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Get configuration from dialog
 * @param {Object} dialog - Dialog window
 * @returns {Object} Configuration object
 */
function getConfiguration(dialog) {
    var startValue = dialog.startValue.text;

    return {
        prefix: dialog.prefix.text,
        startValue: startValue === '' ? 1 : parseInt(startValue, 10),
        suffix: dialog.suffix.text,
        applyToArtboards: dialog.applyToArtboards.value,
        applyToLayers: dialog.applyToLayers.value,
        useAlphaNumeric: dialog.alphaNumeric.value
    };
}

// ============================================================================
// RENUMBERING
// ============================================================================

/**
 * Renumber layers and/or artboards
 * @param {Object} config - Configuration object
 */
function renumberObjects(config) {
    var doc = app.activeDocument;

    if (config.applyToLayers) {
        renumberLayers(doc.layers, config);
    }

    if (config.applyToArtboards) {
        renumberArtboards(doc.artboards, config);
    }
}

/**
 * Renumber layers
 * @param {Object} layers - Layers collection
 * @param {Object} config - Configuration object
 */
function renumberLayers(layers, config) {
    for (var i = 0; i < layers.length; i++) {
        var number = config.startValue + i;
        layers[i].name = formatName(number, config);
    }
}

/**
 * Renumber artboards
 * @param {Object} artboards - Artboards collection
 * @param {Object} config - Configuration object
 */
function renumberArtboards(artboards, config) {
    for (var i = 0; i < artboards.length; i++) {
        var number = config.startValue + i;
        artboards[i].name = formatName(number, config);
    }
}

/**
 * Format name with number, prefix, and suffix
 * @param {Number} number - Number to format
 * @param {Object} config - Configuration object
 * @returns {String} Formatted name
 */
function formatName(number, config) {
    var formattedNumber;

    // Numbers 1-9: zero-padded (01-09)
    if (number <= 9) {
        formattedNumber = '0' + number;
    }
    // Numbers 10-99: no padding
    else if (number <= 99) {
        formattedNumber = number.toString();
    }
    // Numbers 100+: alpha-numeric encoding if enabled
    else {
        if (config.useAlphaNumeric) {
            formattedNumber = encodeAlphaNumeric(number);
        } else {
            formattedNumber = number.toString();
        }
    }

    return config.prefix + formattedNumber + config.suffix;
}

/**
 * Encode number using alpha-numeric system
 * Numbers 100-109 → a0-a9, 110-119 → b0-b9, etc.
 * @param {Number} number - Number to encode
 * @returns {String} Encoded number
 */
function encodeAlphaNumeric(number) {
    var str = number.toString();
    var hundreds = str.substring(0, 2); // First two digits
    var units = str.substring(2, 3); // Third digit

    var encodedHundreds = getAlphaCode(hundreds);

    return encodedHundreds + units;
}

/**
 * Get alpha code for hundreds place
 * @param {String} hundreds - Two-digit string (10-35)
 * @returns {String} Alpha code (a-z)
 */
function getAlphaCode(hundreds) {
    var codes = {
        '10': 'a', '11': 'b', '12': 'c', '13': 'd', '14': 'e',
        '15': 'f', '16': 'g', '17': 'h', '18': 'i', '19': 'j',
        '20': 'k', '21': 'l', '22': 'm', '23': 'n', '24': 'o',
        '25': 'p', '26': 'q', '27': 'r', '28': 's', '29': 't',
        '30': 'u', '31': 'v', '32': 'w', '33': 'x', '34': 'y',
        '35': 'z'
    };

    return codes[hundreds] || hundreds;
}

// ============================================================================
// USER INTERFACE
// ============================================================================

/**
 * Show renumber dialog
 * @returns {Object} Dialog window
 */
function showDialog() {
    var dialog = new Window('dialog');
    dialog.text = 'Renumber Layers and Artboards';
    dialog.alignChildren = ['left', 'top'];

    // Prefix
    var prefixGroup = dialog.add('group');
    prefixGroup.orientation = 'row';

    var prefixLabel = prefixGroup.add('statictext', undefined, 'Prefix:');
    prefixLabel.preferredSize.width = 100;

    var prefix = prefixGroup.add('edittext', undefined, '');
    prefix.characters = 20;
    prefix.active = true;

    // Starting value
    var startGroup = dialog.add('group');
    startGroup.orientation = 'row';

    var startLabel = startGroup.add('statictext', undefined, 'Starting value:');
    startLabel.preferredSize.width = 100;

    var startValue = startGroup.add('edittext', undefined, '');
    startValue.characters = 10;

    var alphaNumeric = startGroup.add('checkbox', undefined, 'Alpha_Num');
    alphaNumeric.value = false;
    alphaNumeric.helpTip = 'Encode numbers > 99 as letters\n(100→a0, 110→b0, etc.)';

    // Suffix
    var suffixGroup = dialog.add('group');
    suffixGroup.orientation = 'row';

    var suffixLabel = suffixGroup.add('statictext', undefined, 'Suffix:');
    suffixLabel.preferredSize.width = 100;

    var suffix = suffixGroup.add('edittext', undefined, '');
    suffix.characters = 20;

    // Targets
    var targetGroup = dialog.add('group');
    targetGroup.orientation = 'row';

    var applyToArtboards = targetGroup.add('checkbox', undefined, 'Artboards');
    applyToArtboards.value = false;
    applyToArtboards.helpTip = 'Apply to artboards';

    var applyToLayers = targetGroup.add('checkbox', undefined, 'Layers');
    applyToLayers.value = false;
    applyToLayers.helpTip = 'Apply to layers';

    // Buttons
    var buttonGroup = dialog.add('group');
    buttonGroup.orientation = 'row';

    var okBtn = buttonGroup.add('button', undefined, 'OK');
    okBtn.preferredSize.width = 80;

    var cancelBtn = buttonGroup.add('button', undefined, 'Cancel', { name: 'cancel' });
    cancelBtn.preferredSize.width = 80;

    // Center dialog
    dialog.center();

    // Attach UI elements to dialog object
    dialog.prefix = prefix;
    dialog.startValue = startValue;
    dialog.suffix = suffix;
    dialog.applyToArtboards = applyToArtboards;
    dialog.applyToLayers = applyToLayers;
    dialog.alphaNumeric = alphaNumeric;
    dialog.okBtn = okBtn;
    dialog.cancelBtn = cancelBtn;

    return dialog;
}

// ============================================================================
// ENTRY POINT (handled by IIFE at top)
// ============================================================================

// ============================================================================
// EXECUTE
// ============================================================================

try {
    main();
} catch (e) {
    AIS.Error.show('Script error', e);
}
