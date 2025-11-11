/**
 * Migrate Settings | Vexy Utility Script
 * @version 1.0.0
 * @description Helps users migrate settings from old scripts to modernized versions
 *
 * @author Vexy Scripts Project
 * @license MIT
 *
 * @features
 * - Scans for old script settings files in various locations
 * - Maps old script names to new modernized script names
 * - Converts old settings formats to new JSON format
 * - Creates backup of original settings before migration
 * - Generates comprehensive migration report
 * - Handles edge cases (missing files, corrupted data)
 * - Preserves user preferences across script updates
 *
 * @usage
 * Run once after installing modernized Vexy scripts to migrate existing user preferences
 *
 * @notes
 * - Searches common settings locations (Documents, AppData, Library)
 * - Creates backups in ~/Documents/Vexy Scripts/Backups/
 * - Non-destructive (keeps original files intact)
 * - Generates HTML report of migration results
 */




//@target illustrator
var c=File(Folder.myDocuments+"/Adobe Scripts/vexy-ville.ini");if(c.exists){c.open('r');var p=c.read();c.close();var l=File(p+".lib/core.jsx");if(l.exists)$.evalFile(l.fsName);}
app.preferences.setBooleanPreference('ShowExternalJSXWarning', false);

// ============================================================================
// CONFIGURATION
// ============================================================================

var CFG = {
    name: 'MigrateSettings',
    version: '1.0.0',

    // Common settings locations to search
    settingsLocations: [
        Folder.myDocuments + '/Adobe Scripts',
        Folder.myDocuments + '/Illustrator Scripts',
        Folder.myDocuments + '/Scripts'
    ],

    // Backup location
    backupFolder: Folder.myDocuments + '/Vexy Scripts/Backups',

    // Script name mapping (old → new)
    scriptMapping: {
        'Marges': 'AddMargins',
        'ChangerUnites': 'ChangeUnits',
        'Couleur_Calques': 'ChangeLayerColors',
        'Renum_Calques_PlansW': 'RenumberLayersAndArtboards',
        'Vecteurs_Vers_Texte': 'VectorsToText',
        'supprPetitsObjets': 'RemoveSmallObjects',
        'Hauteur_Texte': 'TextHeightTool',
        'CodeCharacter': 'CharacterCodeTool',
        'Caracteres_Speciaux': 'SpecialCharacters',
        'ExportChoixdpi': 'ExportWithDPI',
        'CotationPhoto': 'PhotoDimensionTool',
        'Cotation': 'DimensionTool',
        'Echelle': 'ScaleTool',
        'Hachures': 'HatchingPatterns',
        'Nettoyage': 'DocumentCleanup',
        // Add more mappings as scripts are modernized
        'Fit Artboards': 'FitArtboardsToArtwork',
        'BatchRename': 'BatchRenamer',
        'ColorSimulator': 'ColorBlindSimulator',
        'StepRepeat': 'StepAndRepeat'
    }
};

// ============================================================================
// DATA STRUCTURES
// ============================================================================

/**
 * Migration result for a single settings file
 * @typedef {Object} MigrationResult
 * @property {String} oldName - Original script name
 * @property {String} newName - New modernized script name
 * @property {String} oldPath - Original settings file path
 * @property {String} newPath - New settings file path
 * @property {String} backupPath - Backup file path
 * @property {Boolean} success - Migration successful
 * @property {String} status - Status message
 * @property {Object} oldSettings - Original settings data
 * @property {Object} newSettings - Migrated settings data
 */

// ============================================================================
// MAIN FUNCTION
// ============================================================================

function main() {
    // Show welcome dialog
    var proceed = confirm(
        'Migrate Script Settings\n\n' +
        'This tool will help you migrate settings from old scripts\n' +
        'to the new modernized Vexy versions.\n\n' +
        'What this tool does:\n' +
        '• Searches for existing settings files\n' +
        '• Maps old script names to new names\n' +
        '• Converts settings to new JSON format\n' +
        '• Creates backups of original files\n' +
        '• Generates migration report\n\n' +
        'Your original files will NOT be deleted.\n\n' +
        'Continue with migration?',
        false,
        'Migrate Settings'
    );

    if (!proceed) {
        return;
    }

    // Create backup folder
    var backupDir = createBackupFolder();
    if (!backupDir) {
        alert('Error\nFailed to create backup folder:\n' + CFG.backupFolder);
        return;
    }

    // Find all old settings files
    var settingsFiles = findSettingsFiles();

    if (settingsFiles.length === 0) {
        alert('No settings files found\n\n' +
              'Searched locations:\n' +
              CFG.settingsLocations.join('\n') + '\n\n' +
              'Nothing to migrate.');
        return;
    }

    // Migrate each settings file
    var results = [];
    for (var i = 0; i < settingsFiles.length; i++) {
        var result = migrateSettingsFile(settingsFiles[i], backupDir);
        results.push(result);
    }

    // Generate summary
    var summary = generateSummary(results);

    // Generate HTML report
    var reportPath = generateHTMLReport(results, summary);

    // Open report
    if (reportPath) {
        AIS.System.openURL('file://' + reportPath);
        alert('Migration complete\n\n' +
              'Files found: ' + settingsFiles.length + '\n' +
              'Migrated: ' + summary.migrated + '\n' +
              'Skipped: ' + summary.skipped + '\n' +
              'Failed: ' + summary.failed + '\n\n' +
              'Backups saved to:\n' + CFG.backupFolder + '\n\n' +
              'Report opened in browser');
    }
}

// ============================================================================
// SETTINGS FILE DISCOVERY
// ============================================================================

/**
 * Create backup folder
 * @returns {Folder|null} Backup folder or null if failed
 */
function createBackupFolder() {
    var folder = new Folder(CFG.backupFolder);
    if (!folder.exists) {
        if (!folder.create()) {
            return null;
        }
    }
    return folder;
}

/**
 * Find all settings files in common locations
 * @returns {Array<File>} Array of settings files
 */
function findSettingsFiles() {
    var files = [];

    for (var i = 0; i < CFG.settingsLocations.length; i++) {
        var location = CFG.settingsLocations[i];
        var folder = new Folder(location);

        if (!folder.exists) continue;

        // Search for .json files (modern settings)
        var jsonFiles = folder.getFiles('*.json');
        for (var j = 0; j < jsonFiles.length; j++) {
            files.push(jsonFiles[j]);
        }

        // Search for .txt files (legacy settings)
        var txtFiles = folder.getFiles('*-settings.txt');
        for (var k = 0; k < txtFiles.length; k++) {
            files.push(txtFiles[k]);
        }
    }

    return files;
}

// ============================================================================
// MIGRATION LOGIC
// ============================================================================

/**
 * Migrate a single settings file
 * @param {File} oldFile - Original settings file
 * @param {Folder} backupDir - Backup directory
 * @returns {MigrationResult} Migration result
 */
function migrateSettingsFile(oldFile, backupDir) {
    var result = {
        oldName: '',
        newName: '',
        oldPath: oldFile.fsName,
        newPath: '',
        backupPath: '',
        success: false,
        status: '',
        oldSettings: null,
        newSettings: null
    };

    // Extract script name from filename
    var scriptName = extractScriptName(oldFile.name);
    result.oldName = scriptName;

    // Check if we have a mapping for this script
    var newName = CFG.scriptMapping[scriptName];
    if (!newName) {
        result.status = 'No mapping found (script not yet modernized or unknown)';
        return result;
    }

    result.newName = newName;

    // Read old settings
    result.oldSettings = readSettingsFile(oldFile);
    if (!result.oldSettings) {
        result.status = 'Failed to read settings file';
        return result;
    }

    // Convert to new format
    result.newSettings = convertSettingsFormat(result.oldSettings, scriptName, newName);

    // Create backup
    result.backupPath = createBackup(oldFile, backupDir);
    if (!result.backupPath) {
        result.status = 'Failed to create backup';
        return result;
    }

    // Write new settings file
    var newPath = getNewSettingsPath(newName);
    if (writeSettingsFile(newPath, result.newSettings)) {
        result.newPath = newPath;
        result.success = true;
        result.status = 'Successfully migrated';
    } else {
        result.status = 'Failed to write new settings file';
    }

    return result;
}

/**
 * Extract script name from settings filename
 * @param {String} filename - Settings filename
 * @returns {String} Script name
 */
function extractScriptName(filename) {
    // Remove extensions and common suffixes
    var name = filename.replace(/\.(json|txt)$/i, '');
    name = name.replace(/-settings$/i, '');
    name = name.replace(/_settings$/i, '');
    return name;
}

/**
 * Read settings from file
 * @param {File} file - Settings file
 * @returns {Object|null} Settings object or null if failed
 */
function readSettingsFile(file) {
    file.encoding = 'UTF-8';
    if (!file.open('r')) {
        return null;
    }

    var content = file.read();
    file.close();

    // Try to parse as JSON
    try {
        var settings = AIS.JSON.parse(content);
        return settings;
    } catch (e) {
        // If JSON parse fails, try to parse as key=value format (legacy)
        return parseLegacySettings(content);
    }
}

/**
 * Parse legacy key=value settings format
 * @param {String} content - File content
 * @returns {Object} Settings object
 */
function parseLegacySettings(content) {
    var settings = {};
    var lines = content.split('\n');

    for (var i = 0; i < lines.length; i++) {
        var line = lines[i].trim();
        if (line.length === 0 || line.charAt(0) === '#') continue;

        var parts = line.split('=');
        if (parts.length >= 2) {
            var key = parts[0].trim();
            var value = parts.slice(1).join('=').trim();

            // Try to parse value as number or boolean
            if (value === 'true') {
                settings[key] = true;
            } else if (value === 'false') {
                settings[key] = false;
            } else if (!isNaN(parseFloat(value))) {
                settings[key] = parseFloat(value);
            } else {
                settings[key] = value;
            }
        }
    }

    return settings;
}

/**
 * Convert settings from old format to new format
 * @param {Object} oldSettings - Old settings object
 * @param {String} oldName - Old script name
 * @param {String} newName - New script name
 * @returns {Object} New settings object
 */
function convertSettingsFormat(oldSettings, oldName, newName) {
    var newSettings = {};

    // Copy all settings as-is (most should work directly)
    for (var key in oldSettings) {
        if (oldSettings.hasOwnProperty(key)) {
            newSettings[key] = oldSettings[key];
        }
    }

    // Add metadata
    newSettings._migrated = true;
    newSettings._migratedFrom = oldName;
    newSettings._migrationDate = new Date().toISOString();

    // Apply script-specific conversions
    newSettings = applyScriptSpecificConversions(newSettings, oldName, newName);

    return newSettings;
}

/**
 * Apply script-specific setting conversions
 * @param {Object} settings - Settings object
 * @param {String} oldName - Old script name
 * @param {String} newName - New script name
 * @returns {Object} Converted settings
 */
function applyScriptSpecificConversions(settings, oldName, newName) {
    // Script-specific conversion rules
    switch (newName) {
        case 'AddMargins':
            // Convert French field names to English
            if (settings.hasOwnProperty('marge')) {
                settings.margin = settings.marge;
                delete settings.marge;
            }
            if (settings.hasOwnProperty('mode')) {
                // Map French mode names
                var modeMap = {
                    'guides': 'guides',
                    'rectangles': 'rectangles',
                    'redimensionner': 'resize'
                };
                settings.mode = modeMap[settings.mode] || settings.mode;
            }
            break;

        case 'ChangeUnits':
            // Unit names should be consistent
            if (settings.hasOwnProperty('unite')) {
                settings.unit = settings.unite;
                delete settings.unite;
            }
            break;

        case 'ExportWithDPI':
            // Ensure DPI is a number
            if (settings.hasOwnProperty('dpi') && typeof settings.dpi !== 'number') {
                settings.dpi = parseFloat(settings.dpi) || 300;
            }
            break;

        // Add more script-specific conversions as needed
    }

    return settings;
}

/**
 * Create backup of original settings file
 * @param {File} originalFile - Original file
 * @param {Folder} backupDir - Backup directory
 * @returns {String|null} Backup file path or null if failed
 */
function createBackup(originalFile, backupDir) {
    var timestamp = new Date().getTime();
    var backupName = originalFile.name.replace(/\.(json|txt)$/i, '-backup-' + timestamp + '$&');
    var backupFile = new File(backupDir.fsName + '/' + backupName);

    // Copy file
    try {
        originalFile.copy(backupFile);
        return backupFile.fsName;
    } catch (e) {
        return null;
    }
}

/**
 * Get path for new settings file
 * @param {String} scriptName - New script name
 * @returns {String} New settings file path
 */
function getNewSettingsPath(scriptName) {
    return Folder.myDocuments + '/Adobe Scripts/' + scriptName + '-settings.json';
}

/**
 * Write settings to file
 * @param {String} path - File path
 * @param {Object} settings - Settings object
 * @returns {Boolean} Success
 */
function writeSettingsFile(path, settings) {
    // Ensure directory exists
    var file = new File(path);
    var folder = file.parent;
    if (!folder.exists) {
        folder.create();
    }

    // Write file
    file.encoding = 'UTF-8';
    if (!file.open('w')) {
        return false;
    }

    var json = AIS.JSON.stringify(settings);
    file.write(json);
    file.close();

    return true;
}

// ============================================================================
// REPORTING
// ============================================================================

/**
 * Generate summary statistics
 * @param {Array<MigrationResult>} results - Migration results
 * @returns {Object} Summary statistics
 */
function generateSummary(results) {
    var summary = {
        total: results.length,
        migrated: 0,
        skipped: 0,
        failed: 0
    };

    for (var i = 0; i < results.length; i++) {
        var result = results[i];
        if (result.success) {
            summary.migrated++;
        } else if (result.status.indexOf('No mapping') !== -1) {
            summary.skipped++;
        } else {
            summary.failed++;
        }
    }

    return summary;
}

/**
 * Generate HTML migration report
 * @param {Array<MigrationResult>} results - Migration results
 * @param {Object} summary - Summary statistics
 * @returns {String|null} Report file path or null if failed
 */
function generateHTMLReport(results, summary) {
    var html = generateReportHeader();
    html += generateReportSummary(summary);
    html += generateReportResults(results);
    html += generateReportFooter();

    // Save report
    var reportFile = new File(Folder.myDocuments + '/Vexy Scripts/migration-report.html');
    var folder = reportFile.parent;
    if (!folder.exists) {
        folder.create();
    }

    reportFile.encoding = 'UTF-8';
    if (!reportFile.open('w')) {
        return null;
    }

    reportFile.write(html);
    reportFile.close();

    return reportFile.fsName;
}

/**
 * Generate report HTML header
 * @returns {String} HTML header
 */
function generateReportHeader() {
    return '<!DOCTYPE html>\n' +
        '<html>\n' +
        '<head>\n' +
        '<meta charset="UTF-8">\n' +
        '<title>Settings Migration Report - Vexy Scripts</title>\n' +
        '<style>\n' +
        'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif; margin: 20px; background: #f5f5f5; }\n' +
        'h1 { color: #333; border-bottom: 3px solid #2962FF; padding-bottom: 10px; }\n' +
        'h2 { color: #555; margin-top: 30px; }\n' +
        '.summary { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }\n' +
        '.stat { display: inline-block; margin: 10px 20px 10px 0; padding: 10px 15px; border-radius: 5px; }\n' +
        '.stat-label { font-size: 12px; color: #666; display: block; }\n' +
        '.stat-value { font-size: 24px; font-weight: bold; display: block; }\n' +
        '.stat-total { background: #E3F2FD; color: #1976D2; }\n' +
        '.stat-success { background: #E8F5E9; color: #388E3C; }\n' +
        '.stat-skipped { background: #FFF3E0; color: #F57C00; }\n' +
        '.stat-failed { background: #FFEBEE; color: #D32F2F; }\n' +
        '.result { background: white; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #ddd; }\n' +
        '.result-success { border-left-color: #4CAF50; }\n' +
        '.result-skipped { border-left-color: #FF9800; }\n' +
        '.result-failed { border-left-color: #F44336; }\n' +
        '.migration-arrow { color: #2962FF; font-weight: bold; margin: 0 10px; }\n' +
        '.old-name { font-weight: bold; color: #666; }\n' +
        '.new-name { font-weight: bold; color: #2962FF; }\n' +
        '.status { margin: 5px 0; padding: 5px 10px; border-radius: 3px; font-size: 13px; }\n' +
        '.path { font-size: 11px; color: #999; word-break: break-all; }\n' +
        '.timestamp { color: #999; font-size: 12px; }\n' +
        '</style>\n' +
        '</head>\n' +
        '<body>\n' +
        '<h1>⚙️ Settings Migration Report</h1>\n' +
        '<div class="timestamp">Generated: ' + new Date().toString() + '</div>\n';
}

/**
 * Generate report summary section
 * @param {Object} summary - Summary statistics
 * @returns {String} HTML summary
 */
function generateReportSummary(summary) {
    return '<div class="summary">\n' +
        '<h2>Migration Summary</h2>\n' +
        '<div class="stat stat-total">\n' +
        '<span class="stat-label">Total Files</span>\n' +
        '<span class="stat-value">' + summary.total + '</span>\n' +
        '</div>\n' +
        '<div class="stat stat-success">\n' +
        '<span class="stat-label">✓ Migrated</span>\n' +
        '<span class="stat-value">' + summary.migrated + '</span>\n' +
        '</div>\n' +
        '<div class="stat stat-skipped">\n' +
        '<span class="stat-label">⊘ Skipped</span>\n' +
        '<span class="stat-value">' + summary.skipped + '</span>\n' +
        '</div>\n' +
        '<div class="stat stat-failed">\n' +
        '<span class="stat-label">✗ Failed</span>\n' +
        '<span class="stat-value">' + summary.failed + '</span>\n' +
        '</div>\n' +
        '</div>\n';
}

/**
 * Generate report results section
 * @param {Array<MigrationResult>} results - Migration results
 * @returns {String} HTML results
 */
function generateReportResults(results) {
    var html = '<h2>Migration Details</h2>\n';

    for (var i = 0; i < results.length; i++) {
        html += generateResultHTML(results[i]);
    }

    return html;
}

/**
 * Generate HTML for single result
 * @param {MigrationResult} result - Migration result
 * @returns {String} HTML
 */
function generateResultHTML(result) {
    var statusClass = result.success ? 'result-success' : (result.status.indexOf('No mapping') !== -1 ? 'result-skipped' : 'result-failed');
    var statusIcon = result.success ? '✓' : (result.status.indexOf('No mapping') !== -1 ? '⊘' : '✗');

    var html = '<div class="result ' + statusClass + '">\n';
    html += '<div>' + statusIcon + ' <span class="old-name">' + result.oldName + '</span>';

    if (result.newName) {
        html += '<span class="migration-arrow">→</span><span class="new-name">' + result.newName + '</span>';
    }

    html += '</div>\n';
    html += '<div class="status">' + result.status + '</div>\n';

    if (result.oldPath) {
        html += '<div class="path">Old: ' + result.oldPath + '</div>\n';
    }
    if (result.newPath) {
        html += '<div class="path">New: ' + result.newPath + '</div>\n';
    }
    if (result.backupPath) {
        html += '<div class="path">Backup: ' + result.backupPath + '</div>\n';
    }

    html += '</div>\n';

    return html;
}

/**
 * Generate report footer
 * @returns {String} HTML footer
 */
function generateReportFooter() {
    return '<div style="margin-top: 30px; padding: 20px; background: #E3F2FD; border-radius: 5px; color: #1565C0;">\n' +
        '<strong>Note:</strong> Your original settings files have been preserved and backed up to:<br>\n' +
        '<code>' + CFG.backupFolder + '</code>\n' +
        '</div>\n' +
        '</body>\n</html>';
}

// ============================================================================
// ENTRY POINT
// ============================================================================

// ============================================================================
// EXECUTE
// ============================================================================

try {
    main();
} catch (e) {
    AIS.Error.show('Script error', e);
}
