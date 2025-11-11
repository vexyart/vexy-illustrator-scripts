/**
 * Generate Script From Template
 * @version 1.0.0
 * @description Interactive wizard to create new scripts with proper AIS framework structure
 *
 * @category Utilities
 * @author Vexy Team
 * @license MIT
 *
 * @features
 * - Interactive wizard for new script creation
 * - Auto-generate script with proper header and structure
 * - Correct #include paths for category folder
 * - Main function skeleton with validation wrapper
 * - Error handling and settings persistence boilerplate
 * - Optional UI dialog skeleton
 * - Auto-update scripts.toml catalog
 * - Validate compliance with ValidateHeaders
 *
 * @requires lib/core.jsx
 */




//@target illustrator
var c=File(Folder.myDocuments+"/Adobe Scripts/vexy-ville.ini");if(c.exists){c.open('r');var p=c.read();c.close();var l=File(p+".lib/core.jsx");if(l.exists)$.evalFile(l.fsName);}
app.preferences.setBooleanPreference('ShowExternalJSXWarning', false);

// ============================================================================
// CONFIGURATION
// ============================================================================

var CFG = {
    scriptName: 'GenerateScriptFromTemplate',
    version: '1.0.0',

    // Available categories
    categories: [
        'Favorites',
        'Text',
        'Export',
        'Measurement',
        'Utilities',
        'Artboards',
        'Colors',
        'Layers',
        'Paths',
        'Transform',
        'Selection',
        'Print',
        'Effects',
        'Guides',
        'Layout',
        'Strokes',
        'Preferences',
        'Varia'
    ],

    // Template structure
    template: {
        needsDocument: true,
        needsSelection: false,
        hasUI: false,
        hasSettings: false,
        hasUndo: false
    },

    // Default values
    defaults: {
        author: 'Vexy Team',
        license: 'MIT',
        version: '1.0.0'
    }
};

// ============================================================================
// MAIN FUNCTION
// ============================================================================

function main() {
    try {
        // Collect script information from user
        var info = showWizard();
        if (!info) return;  // User cancelled

        // Generate script content
        var scriptContent = generateScriptContent(info);

        // Get target file path
        var filePath = getTargetFilePath(info);

        // Save script file
        if (!saveScriptFile(filePath, scriptContent)) {
            alert('Failed to save script\nCheck file permissions and try again');
            return;
        }

        // Ask about catalog update
        var updateCatalog = confirm(
            'Script created successfully!\n\n' +
            'Would you like to update scripts.toml catalog?'
        );

        var catalogUpdated = false;
        if (updateCatalog) {
            catalogUpdated = updateScriptsCatalog(info, filePath);
        }

        // Show success
        showSuccess(filePath, catalogUpdated);

    } catch (err) {
        AIS.Error.show('Failed to generate script', err);
    }
}

// ============================================================================
// CORE LOGIC
// ============================================================================

/**
 * Generate complete script content from template
 */
function generateScriptContent(info) {
    var lines = [];

    // Header
    lines.push(generateHeader(info));
    lines.push('');

    // Includes
    lines.push(generateIncludes(info));
    lines.push('');

    // Target directive
    lines.push('//@target illustrator');
    lines.push('app.preferences.setBooleanPreference(\'ShowExternalJSXWarning\', false);');
    lines.push('');

    // Entry point wrapper
    lines.push(generateEntryPoint(info));
    lines.push('');

    // Configuration section
    lines.push(generateConfiguration(info));
    lines.push('');

    // Main function
    lines.push(generateMainFunction(info));
    lines.push('');

    // Core logic section
    lines.push(generateCoreLogic(info));
    lines.push('');

    // UI section (if needed)
    if (info.hasUI) {
        lines.push(generateUISection(info));
        lines.push('');
    }

    // Utilities section
    lines.push(generateUtilitiesSection(info));

    return lines.join('\n');
}

/**
 * Generate JSDoc header
 */
function generateHeader(info) {
    var lines = [];
    lines.push('/**');
    lines.push(' * ' + info.name);
    lines.push(' * @version ' + CFG.defaults.version);
    lines.push(' * @description ' + info.description);
    lines.push(' *');
    lines.push(' * @category ' + info.category);
    lines.push(' * @author ' + (info.author || CFG.defaults.author));
    lines.push(' * @license ' + CFG.defaults.license);

    if (info.features && info.features.length > 0) {
        lines.push(' *');
        lines.push(' * @features');
        for (var i = 0; i < info.features.length; i++) {
            lines.push(' * - ' + info.features[i]);
        }
    }

    lines.push(' *');
    lines.push(' * @requires lib/core.jsx');
    if (info.hasUI) {
        lines.push(' * @requires lib/ui.jsx');
    }
    lines.push(' */');

    return lines.join('\n');
}

/**
 * Generate #include directives
 */
function generateIncludes(info) {
    var lines = [];
    lines.push('');
    if (info.hasUI) {
        lines.push('#include "../.lib/ui.jsx"');
    }
    return lines.join('\n');
}

/**
 * Generate entry point wrapper
 */
function generateEntryPoint(info) {
    var lines = [];
    lines.push('');

    return lines.join('\n');
}

/**
 * Generate configuration section
 */
function generateConfiguration(info) {
    var lines = [];
    lines.push('// ============================================================================');
    lines.push('// CONFIGURATION');
    lines.push('// ============================================================================');
    lines.push('');
    lines.push('var CFG = {');

    if (info.hasSettings) {
        lines.push('    // Settings persistence');
        lines.push('    settingsName: \'' + toCamelCase(info.name) + '-settings.json\',');
        lines.push('    settingsFolder: Folder.myDocuments + \'/Adobe Scripts/\',');
        lines.push('');
    }

    lines.push('    // Default configuration');
    lines.push('    // TODO: Add configuration options here');
    lines.push('};');

    return lines.join('\n');
}

/**
 * Generate main function
 */
function generateMainFunction(info) {
    var lines = [];
    lines.push('// ============================================================================');
    lines.push('// MAIN FUNCTION');
    lines.push('// ============================================================================');
    lines.push('');
    lines.push('function main() {');
    lines.push('    try {');

    if (info.hasSettings) {
        lines.push('        // Load saved settings');
        lines.push('        var config = loadSettings();');
        lines.push('');
    }

    if (info.hasUI) {
        lines.push('        // Show dialog to get user input');
        lines.push('        var result = showDialog(' + (info.hasSettings ? 'config' : '') + ');');
        lines.push('        if (!result) return;  // User cancelled');
        lines.push('');
        if (info.hasSettings) {
            lines.push('        // Save settings for next time');
            lines.push('        saveSettings(result);');
            lines.push('');
        }
    }

    if (info.hasUndo) {
        lines.push('        // Begin undo group');
        lines.push('        app.activeDocument.selection = null;');
        lines.push('        var undoName = \'' + info.name + '\';');
        lines.push('');
    }

    lines.push('        // TODO: Implement main logic here');
    lines.push('        processItems(' + (info.hasUI ? 'result' : '') + ');');
    lines.push('');
    lines.push('        alert(\'Success!\\n' + info.name + ' completed.\');');
    lines.push('');
    lines.push('    } catch (err) {');
    lines.push('        AIS.Error.show(\'' + info.name + ' failed\', err);');
    lines.push('    }');
    lines.push('}');

    return lines.join('\n');
}

/**
 * Generate core logic section
 */
function generateCoreLogic(info) {
    var lines = [];
    lines.push('// ============================================================================');
    lines.push('// CORE LOGIC');
    lines.push('// ============================================================================');
    lines.push('');
    lines.push('/**');
    lines.push(' * Process items (main business logic)');
    lines.push(' */');
    lines.push('function processItems(' + (info.hasUI ? 'config' : '') + ') {');
    lines.push('    // TODO: Implement processing logic');
    lines.push('    var doc = app.activeDocument;');

    if (info.needsSelection) {
        lines.push('    var selection = doc.selection;');
        lines.push('');
        lines.push('    for (var i = 0; i < selection.length; i++) {');
        lines.push('        var item = selection[i];');
        lines.push('        // TODO: Process each selected item');
        lines.push('    }');
    } else {
        lines.push('');
        lines.push('    // TODO: Add your logic here');
    }

    lines.push('}');

    return lines.join('\n');
}

/**
 * Generate UI section
 */
function generateUISection(info) {
    var lines = [];
    lines.push('// ============================================================================');
    lines.push('// USER INTERFACE');
    lines.push('// ============================================================================');
    lines.push('');
    lines.push('/**');
    lines.push(' * Show configuration dialog');
    lines.push(' */');
    lines.push('function showDialog(config) {');
    lines.push('    var dialog = new Window(\'dialog\', \'' + info.name + '\');');
    lines.push('    dialog.alignChildren = [\'fill\', \'top\'];');
    lines.push('    dialog.spacing = 10;');
    lines.push('    dialog.margins = 15;');
    lines.push('');
    lines.push('    // Main panel');
    lines.push('    var mainPanel = dialog.add(\'panel\', undefined, \'Configuration\');');
    lines.push('    mainPanel.alignChildren = [\'fill\', \'top\'];');
    lines.push('    mainPanel.margins = 15;');
    lines.push('');
    lines.push('    // TODO: Add UI controls here');
    lines.push('    var infoText = mainPanel.add(\'statictext\', undefined, \'' + info.description + '\', {multiline: true});');
    lines.push('    infoText.preferredSize.width = 400;');
    lines.push('');
    lines.push('    // Buttons');
    lines.push('    var buttonGroup = dialog.add(\'group\');');
    lines.push('    buttonGroup.alignment = [\'right\', \'top\'];');
    lines.push('');
    lines.push('    var cancelBtn = buttonGroup.add(\'button\', undefined, \'Cancel\', {name: \'cancel\'});');
    lines.push('    var okBtn = buttonGroup.add(\'button\', undefined, \'OK\', {name: \'ok\'});');
    lines.push('');
    lines.push('    if (dialog.show() === 1) {');
    lines.push('        // TODO: Collect values from UI controls');
    lines.push('        return {');
    lines.push('            // Add configuration properties here');
    lines.push('        };');
    lines.push('    }');
    lines.push('');
    lines.push('    return null;');
    lines.push('}');

    return lines.join('\n');
}

/**
 * Generate utilities section
 */
function generateUtilitiesSection(info) {
    var lines = [];
    lines.push('// ============================================================================');
    lines.push('// UTILITIES');
    lines.push('// ============================================================================');

    if (info.hasSettings) {
        lines.push('');
        lines.push('/**');
        lines.push(' * Load saved settings');
        lines.push(' */');
        lines.push('function loadSettings() {');
        lines.push('    var file = new File(CFG.settingsFolder + CFG.settingsName);');
        lines.push('    if (!file.exists) return getDefaultConfig();');
        lines.push('');
        lines.push('    file.encoding = \'UTF-8\';');
        lines.push('    file.open(\'r\');');
        lines.push('    var json = file.read();');
        lines.push('    file.close();');
        lines.push('');
        lines.push('    try {');
        lines.push('        return AIS.JSON.parse(json);');
        lines.push('    } catch (err) {');
        lines.push('        return getDefaultConfig();');
        lines.push('    }');
        lines.push('}');
        lines.push('');
        lines.push('/**');
        lines.push(' * Save settings for next run');
        lines.push(' */');
        lines.push('function saveSettings(config) {');
        lines.push('    var folder = new Folder(CFG.settingsFolder);');
        lines.push('    if (!folder.exists) folder.create();');
        lines.push('');
        lines.push('    var file = new File(CFG.settingsFolder + CFG.settingsName);');
        lines.push('    file.encoding = \'UTF-8\';');
        lines.push('    file.open(\'w\');');
        lines.push('    file.write(AIS.JSON.stringify(config));');
        lines.push('    file.close();');
        lines.push('}');
        lines.push('');
        lines.push('/**');
        lines.push(' * Get default configuration');
        lines.push(' */');
        lines.push('function getDefaultConfig() {');
        lines.push('    return {');
        lines.push('        // TODO: Add default configuration');
        lines.push('    };');
        lines.push('}');
    }

    return lines.join('\n');
}

/**
 * Get target file path for new script
 */
function getTargetFilePath(info) {
    var projectRoot = getProjectRoot();
    var categoryFolder = new Folder(projectRoot + '/' + info.category);

    if (!categoryFolder.exists) {
        categoryFolder.create();
    }

    var fileName = toPascalCase(info.name) + '.jsx';
    return categoryFolder.fsName + '/' + fileName;
}

/**
 * Save script file
 */
function saveScriptFile(filePath, content) {
    var file = new File(filePath);

    // Check if file already exists
    if (file.exists) {
        var overwrite = confirm(
            'File already exists:\n' + filePath + '\n\nOverwrite?'
        );
        if (!overwrite) return false;
    }

    file.encoding = 'UTF-8';
    if (!file.open('w')) return false;
    file.write(content);
    file.close();

    return true;
}

/**
 * Update scripts.toml catalog (simplified - actual implementation would parse TOML)
 */
function updateScriptsCatalog(info, filePath) {
    try {
        // NOTE: This is a simplified implementation
        // A full implementation would properly parse and update the TOML file

        var catalogPath = getProjectRoot() + '/scripts.toml';
        var catalogFile = new File(catalogPath);

        if (!catalogFile.exists) {
            alert('scripts.toml not found\nSkipping catalog update');
            return false;
        }

        // Read existing catalog
        catalogFile.encoding = 'UTF-8';
        catalogFile.open('r');
        var content = catalogFile.read();
        catalogFile.close();

        // Append new entry (simplified)
        var entry = '\n# ' + info.name + '\n';
        entry += '[[script]]\n';
        entry += 'name = "' + info.name + '"\n';
        entry += 'file = "' + info.category + '/' + toPascalCase(info.name) + '.jsx"\n';
        entry += 'category = "' + info.category + '"\n';
        entry += 'quality = 3\n';  // Default quality
        entry += 'description = "' + info.description + '"\n';

        // Append entry
        catalogFile.open('a');
        catalogFile.write(entry);
        catalogFile.close();

        return true;

    } catch (err) {
        alert('Failed to update catalog:\n' + err.message);
        return false;
    }
}

/**
 * Get project root folder
 */
function getProjectRoot() {
    var scriptFile = new File($.fileName);
    var utilitiesFolder = scriptFile.parent;
    var projectRoot = utilitiesFolder.parent;
    return projectRoot.fsName;
}

/**
 * Convert string to PascalCase
 */
function toPascalCase(str) {
    return str
        .replace(/[^\w\s]/g, '')  // Remove special chars
        .split(/\s+/)  // Split on whitespace
        .map(function(word) {
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        })
        .join('');
}

/**
 * Convert string to camelCase
 */
function toCamelCase(str) {
    var pascal = toPascalCase(str);
    return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

// ============================================================================
// USER INTERFACE
// ============================================================================

/**
 * Show wizard to collect script information
 */
function showWizard() {
    var dialog = new Window('dialog', 'Create New Script');
    dialog.alignChildren = ['fill', 'top'];
    dialog.spacing = 10;
    dialog.margins = 15;
    dialog.preferredSize.width = 500;

    // Basic info panel
    var basicPanel = dialog.add('panel', undefined, 'Basic Information');
    basicPanel.alignChildren = ['fill', 'top'];
    basicPanel.margins = 15;

    // Script name
    var nameGroup = basicPanel.add('group');
    nameGroup.add('statictext', undefined, 'Script Name:').preferredSize.width = 120;
    var nameInput = nameGroup.add('edittext', undefined, '');
    nameInput.preferredSize.width = 300;
    nameInput.active = true;

    // Description
    var descGroup = basicPanel.add('group');
    descGroup.alignChildren = ['left', 'top'];
    descGroup.add('statictext', undefined, 'Description:').preferredSize.width = 120;
    var descInput = descGroup.add('edittext', undefined, '', {multiline: true});
    descInput.preferredSize = [300, 60];

    // Category
    var catGroup = basicPanel.add('group');
    catGroup.add('statictext', undefined, 'Category:').preferredSize.width = 120;
    var catDropdown = catGroup.add('dropdownlist', undefined, CFG.categories);
    catDropdown.selection = 3;  // Default to 'Measurement'
    catDropdown.preferredSize.width = 300;

    // Author
    var authorGroup = basicPanel.add('group');
    authorGroup.add('statictext', undefined, 'Author:').preferredSize.width = 120;
    var authorInput = authorGroup.add('edittext', undefined, CFG.defaults.author);
    authorInput.preferredSize.width = 300;

    // Features panel
    var featuresPanel = dialog.add('panel', undefined, 'Features (one per line)');
    featuresPanel.alignChildren = ['fill', 'top'];
    featuresPanel.margins = 15;

    var featuresInput = featuresPanel.add('edittext', undefined, '', {multiline: true, scrolling: true});
    featuresInput.preferredSize = [470, 80];

    // Options panel
    var optionsPanel = dialog.add('panel', undefined, 'Script Options');
    optionsPanel.alignChildren = ['left', 'top'];
    optionsPanel.margins = 15;

    var needsDocCheck = optionsPanel.add('checkbox', undefined, 'Requires active document');
    needsDocCheck.value = true;
    var needsSelCheck = optionsPanel.add('checkbox', undefined, 'Requires selection');
    var hasUICheck = optionsPanel.add('checkbox', undefined, 'Has user interface dialog');
    var hasSettingsCheck = optionsPanel.add('checkbox', undefined, 'Save/load user settings');
    var hasUndoCheck = optionsPanel.add('checkbox', undefined, 'Support undo/redo');

    // Buttons
    var buttonGroup = dialog.add('group');
    buttonGroup.alignment = ['right', 'top'];

    var cancelBtn = buttonGroup.add('button', undefined, 'Cancel', {name: 'cancel'});
    var okBtn = buttonGroup.add('button', undefined, 'Generate Script', {name: 'ok'});

    if (dialog.show() === 1) {
        // Validate inputs
        if (!nameInput.text || nameInput.text.length < 3) {
            alert('Invalid script name\nPlease enter at least 3 characters');
            return null;
        }

        if (!descInput.text || descInput.text.length < 10) {
            alert('Invalid description\nPlease enter at least 10 characters');
            return null;
        }

        // Parse features
        var features = [];
        if (featuresInput.text) {
            var featureLines = featuresInput.text.split('\n');
            for (var i = 0; i < featureLines.length; i++) {
                var line = featureLines[i].replace(/^\s*-?\s*/, '').replace(/\s*$/, '');
                if (line) features.push(line);
            }
        }

        return {
            name: nameInput.text,
            description: descInput.text,
            category: catDropdown.selection.text,
            author: authorInput.text,
            features: features,
            needsDocument: needsDocCheck.value,
            needsSelection: needsSelCheck.value,
            hasUI: hasUICheck.value,
            hasSettings: hasSettingsCheck.value,
            hasUndo: hasUndoCheck.value
        };
    }

    return null;
}

/**
 * Show success dialog
 */
function showSuccess(filePath, catalogUpdated) {
    var dialog = new Window('dialog', 'Script Created!');
    dialog.alignChildren = ['fill', 'top'];
    dialog.spacing = 10;
    dialog.margins = 15;

    dialog.add('statictext', undefined, 'New script created successfully!');
    dialog.add('statictext', undefined, 'File saved to:');

    var pathText = dialog.add('edittext', undefined, filePath, {readonly: true});
    pathText.preferredSize.width = 400;

    if (catalogUpdated) {
        dialog.add('statictext', undefined, '✓ scripts.toml catalog updated');
    }

    dialog.add('statictext', undefined, '\nNext steps:');
    var steps = dialog.add('statictext', undefined,
        '1. Open the file in your editor\n' +
        '2. Search for "TODO" comments\n' +
        '3. Implement the script logic\n' +
        '4. Test in Adobe Illustrator',
        {multiline: true});

    var okBtn = dialog.add('button', undefined, 'OK', {name: 'ok'});

    dialog.show();
}

// ============================================================================
// EXECUTE
// ============================================================================

try {
    main();
} catch (e) {
    AIS.Error.show('GenerateScriptFromTemplate error', e);
}

// ============================================================================
// EXECUTE
// ============================================================================

if (!AIS.Document.hasDocument()) {
    alert(\'No document\\nOpen a document and try again\');
} else if (!AIS.Document.hasSelection()) {
    alert(\'No selection\\nSelect objects and try again\');
} else {
    try {
        main();
    } catch (e) {
        AIS.Error.show('GenerateScriptFromTemplate error', e);
    }
}
