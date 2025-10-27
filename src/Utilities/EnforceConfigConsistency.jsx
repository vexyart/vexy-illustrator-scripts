/**
 * Enforce Configuration Consistency
 * @version 1.0.0
 * @description Configuration drift detection, schema normalization, and auto-repair for settings files
 * @category Utilities
 * @features Drift detection, schema validation, auto-repair, consistency enforcement, backup creation
 * @author Vexy
 * @usage Run to detect configuration drift, normalize schemas, and repair inconsistent settings
 */

// this_file: Utilities/EnforceConfigConsistency.jsx

#include "../.lib/core.jsx"

//@target illustrator
app.preferences.setBooleanPreference('ShowExternalJSXWarning', false);

// ============================================================================
// CONFIGURATION
// ============================================================================

var CFG = {
    // Settings locations
    SETTINGS_FOLDER: Folder.myDocuments + '/Adobe Scripts/',
    BACKUP_FOLDER: Folder.myDocuments + '/Adobe Scripts/Backups/',
    REPORT_FILE: 'config-consistency-report.html',

    // Schema definitions for common settings
    STANDARD_SCHEMAS: {
        'step-and-repeat-settings.json': {
            copies: {type: 'number', min: 1, max: 1000, required: true},
            horizontalOffset: {type: 'number', required: true},
            verticalOffset: {type: 'number', required: true},
            units: {type: 'string', values: ['px', 'pt', 'mm', 'cm', 'in'], required: true},
            preview: {type: 'boolean', required: false}
        },
        'batch-renamer-settings.json': {
            prefix: {type: 'string', required: false},
            suffix: {type: 'string', required: false},
            startNumber: {type: 'number', min: 0, required: false},
            padding: {type: 'number', min: 1, max: 10, required: false},
            caseSensitive: {type: 'boolean', required: false}
        },
        'export-pdf-settings.json': {
            quality: {type: 'string', values: ['screen', 'print', 'press'], required: true},
            compatibility: {type: 'string', required: true},
            embedFonts: {type: 'boolean', required: true},
            preserveEditing: {type: 'boolean', required: false}
        }
    },

    // Consistency rules
    CONSISTENCY_RULES: {
        units: ['px', 'pt', 'mm', 'cm', 'in'],
        booleans: [true, false],
        minNumber: -999999,
        maxNumber: 999999
    },

    // Report settings
    COLORS: {
        drift: '#dc3545',
        fixed: '#28a745',
        warning: '#ffc107',
        info: '#007bff',
        bg: '#f5f5f5'
    },

    // Backup settings
    MAX_BACKUPS: 50,
    BACKUP_PREFIX: 'config-backup-'
};

// ============================================================================
// MAIN FUNCTION
// ============================================================================

function main() {
    try {
        var dialog = createDialog();

        if (dialog.show() === 1) {
            var action = getSelectedAction(dialog);

            if (action === 'detect') {
                detectDrift();
            } else if (action === 'repair') {
                repairSettings(dialog);
            } else if (action === 'normalize') {
                normalizeSchemas();
            } else if (action === 'backup') {
                createBackup();
            } else if (action === 'restore') {
                restoreFromBackup(dialog);
            }
        }

    } catch (e) {
        AIS.Error.show('Configuration consistency check failed', e);
    }
}

// ============================================================================
// CORE LOGIC
// ============================================================================

/**
 * Detect configuration drift
 */
function detectDrift() {
    var settingsFolder = new Folder(CFG.SETTINGS_FOLDER);
    if (!settingsFolder.exists) {
        alert('No Settings\nSettings folder not found');
        return;
    }

    var settingsFiles = settingsFolder.getFiles('*-settings.json');
    if (settingsFiles.length === 0) {
        alert('No Settings Files\nNo settings files found');
        return;
    }

    var driftReport = {
        timestamp: new Date().toString(),
        files: [],
        totalIssues: 0
    };

    for (var i = 0; i < settingsFiles.length; i++) {
        var file = settingsFiles[i];
        var issues = analyzeSettingsFile(file);

        if (issues.length > 0) {
            driftReport.files.push({
                name: file.name,
                path: file.fsName,
                issues: issues
            });
            driftReport.totalIssues += issues.length;
        }
    }

    generateDriftReport(driftReport);
}

/**
 * Analyze a settings file for issues
 * @param {File} file - Settings file to analyze
 * @returns {Array} Array of issues found
 */
function analyzeSettingsFile(file) {
    var issues = [];

    try {
        file.encoding = 'UTF-8';
        file.open('r');
        var content = file.read();
        file.close();

        // Parse JSON
        var settings = AIS.JSON.parse(content);

        // Check if we have a standard schema
        var schema = CFG.STANDARD_SCHEMAS[file.name];

        if (schema) {
            // Validate against standard schema
            issues = issues.concat(validateAgainstSchema(settings, schema, file.name));
        } else {
            // Infer schema and check for common issues
            issues = issues.concat(detectCommonIssues(settings, file.name));
        }

    } catch (e) {
        issues.push({
            type: 'PARSE_ERROR',
            severity: 'critical',
            message: 'Failed to parse JSON: ' + e.message,
            fixable: false
        });
    }

    return issues;
}

/**
 * Validate settings against a schema
 * @param {Object} settings - Settings object
 * @param {Object} schema - Schema definition
 * @param {String} fileName - File name
 * @returns {Array} Array of validation issues
 */
function validateAgainstSchema(settings, schema, fileName) {
    var issues = [];

    // Check required fields
    for (var key in schema) {
        if (schema.hasOwnProperty(key)) {
            var fieldSchema = schema[key];

            if (fieldSchema.required && !settings.hasOwnProperty(key)) {
                issues.push({
                    type: 'MISSING_REQUIRED',
                    severity: 'critical',
                    field: key,
                    message: 'Required field "' + key + '" is missing',
                    fixable: true,
                    suggestedValue: getDefaultValue(fieldSchema)
                });
            }

            if (settings.hasOwnProperty(key)) {
                var value = settings[key];

                // Type validation
                if (fieldSchema.type === 'number' && typeof value !== 'number') {
                    issues.push({
                        type: 'TYPE_MISMATCH',
                        severity: 'critical',
                        field: key,
                        message: 'Field "' + key + '" should be number, got ' + typeof value,
                        fixable: true,
                        currentValue: value,
                        suggestedValue: parseFloat(value) || getDefaultValue(fieldSchema)
                    });
                }

                if (fieldSchema.type === 'string' && typeof value !== 'string') {
                    issues.push({
                        type: 'TYPE_MISMATCH',
                        severity: 'critical',
                        field: key,
                        message: 'Field "' + key + '" should be string, got ' + typeof value,
                        fixable: true,
                        currentValue: value,
                        suggestedValue: String(value)
                    });
                }

                if (fieldSchema.type === 'boolean' && typeof value !== 'boolean') {
                    issues.push({
                        type: 'TYPE_MISMATCH',
                        severity: 'critical',
                        field: key,
                        message: 'Field "' + key + '" should be boolean, got ' + typeof value,
                        fixable: true,
                        currentValue: value,
                        suggestedValue: Boolean(value)
                    });
                }

                // Range validation for numbers
                if (fieldSchema.type === 'number' && typeof value === 'number') {
                    if (fieldSchema.min !== undefined && value < fieldSchema.min) {
                        issues.push({
                            type: 'OUT_OF_RANGE',
                            severity: 'warning',
                            field: key,
                            message: 'Field "' + key + '" value ' + value + ' is below minimum ' + fieldSchema.min,
                            fixable: true,
                            currentValue: value,
                            suggestedValue: fieldSchema.min
                        });
                    }

                    if (fieldSchema.max !== undefined && value > fieldSchema.max) {
                        issues.push({
                            type: 'OUT_OF_RANGE',
                            severity: 'warning',
                            field: key,
                            message: 'Field "' + key + '" value ' + value + ' exceeds maximum ' + fieldSchema.max,
                            fixable: true,
                            currentValue: value,
                            suggestedValue: fieldSchema.max
                        });
                    }
                }

                // Enum validation
                if (fieldSchema.values && AIS.Array.indexOf(fieldSchema.values, value) === -1) {
                    issues.push({
                        type: 'INVALID_VALUE',
                        severity: 'critical',
                        field: key,
                        message: 'Field "' + key + '" has invalid value "' + value + '". Allowed: ' + fieldSchema.values.join(', '),
                        fixable: true,
                        currentValue: value,
                        suggestedValue: fieldSchema.values[0]
                    });
                }
            }
        }
    }

    // Check for unexpected fields
    for (var settingKey in settings) {
        if (settings.hasOwnProperty(settingKey) && !schema.hasOwnProperty(settingKey)) {
            issues.push({
                type: 'UNEXPECTED_FIELD',
                severity: 'info',
                field: settingKey,
                message: 'Unexpected field "' + settingKey + '" not in schema',
                fixable: false
            });
        }
    }

    return issues;
}

/**
 * Detect common issues in settings without a schema
 * @param {Object} settings - Settings object
 * @param {String} fileName - File name
 * @returns {Array} Array of detected issues
 */
function detectCommonIssues(settings, fileName) {
    var issues = [];

    for (var key in settings) {
        if (settings.hasOwnProperty(key)) {
            var value = settings[key];

            // Check for null or undefined
            if (value === null || value === undefined) {
                issues.push({
                    type: 'NULL_VALUE',
                    severity: 'warning',
                    field: key,
                    message: 'Field "' + key + '" is null or undefined',
                    fixable: false
                });
            }

            // Check for empty strings
            if (typeof value === 'string' && value.length === 0) {
                issues.push({
                    type: 'EMPTY_STRING',
                    severity: 'info',
                    field: key,
                    message: 'Field "' + key + '" is an empty string',
                    fixable: false
                });
            }

            // Check for NaN
            if (typeof value === 'number' && isNaN(value)) {
                issues.push({
                    type: 'NAN_VALUE',
                    severity: 'critical',
                    field: key,
                    message: 'Field "' + key + '" is NaN',
                    fixable: true,
                    suggestedValue: 0
                });
            }

            // Check for Infinity
            if (typeof value === 'number' && !isFinite(value)) {
                issues.push({
                    type: 'INFINITE_VALUE',
                    severity: 'critical',
                    field: key,
                    message: 'Field "' + key + '" is Infinity',
                    fixable: true,
                    suggestedValue: 0
                });
            }
        }
    }

    return issues;
}

/**
 * Repair settings files
 * @param {Object} dialog - The dialog object
 */
function repairSettings(dialog) {
    var autoFix = dialog.autoFixCheck.value;

    if (!autoFix) {
        alert('Auto-Fix Disabled\nPlease enable auto-fix to repair settings');
        return;
    }

    // Create backup first
    createBackup();

    var settingsFolder = new Folder(CFG.SETTINGS_FOLDER);
    var settingsFiles = settingsFolder.getFiles('*-settings.json');

    var repairReport = {
        timestamp: new Date().toString(),
        filesRepaired: 0,
        issuesFixed: 0,
        files: []
    };

    for (var i = 0; i < settingsFiles.length; i++) {
        var file = settingsFiles[i];
        var issues = analyzeSettingsFile(file);

        if (issues.length === 0) continue;

        // Filter fixable issues
        var fixable = [];
        for (var j = 0; j < issues.length; j++) {
            if (issues[j].fixable) {
                fixable.push(issues[j]);
            }
        }

        if (fixable.length === 0) continue;

        // Load settings
        file.encoding = 'UTF-8';
        file.open('r');
        var content = file.read();
        file.close();

        var settings = AIS.JSON.parse(content);

        // Apply fixes
        for (var k = 0; k < fixable.length; k++) {
            var issue = fixable[k];

            if (issue.type === 'MISSING_REQUIRED') {
                settings[issue.field] = issue.suggestedValue;
            } else if (issue.type === 'TYPE_MISMATCH' || issue.type === 'OUT_OF_RANGE' || issue.type === 'INVALID_VALUE') {
                settings[issue.field] = issue.suggestedValue;
            } else if (issue.type === 'NAN_VALUE' || issue.type === 'INFINITE_VALUE') {
                settings[issue.field] = issue.suggestedValue;
            }
        }

        // Save repaired settings
        file.encoding = 'UTF-8';
        file.open('w');
        file.write(AIS.JSON.stringify(settings));
        file.close();

        repairReport.filesRepaired++;
        repairReport.issuesFixed += fixable.length;
        repairReport.files.push({
            name: file.name,
            issuesFixed: fixable.length,
            issues: fixable
        });
    }

    generateRepairReport(repairReport);
}

/**
 * Normalize schemas across all settings files
 */
function normalizeSchemas() {
    var settingsFolder = new Folder(CFG.SETTINGS_FOLDER);
    var settingsFiles = settingsFolder.getFiles('*-settings.json');

    var normalizeReport = {
        timestamp: new Date().toString(),
        filesProcessed: 0,
        schemasInferred: 0,
        files: []
    };

    for (var i = 0; i < settingsFiles.length; i++) {
        var file = settingsFiles[i];

        try {
            file.encoding = 'UTF-8';
            file.open('r');
            var content = file.read();
            file.close();

            var settings = AIS.JSON.parse(content);
            var schema = inferSchema(settings);

            normalizeReport.filesProcessed++;
            normalizeReport.schemasInferred++;
            normalizeReport.files.push({
                name: file.name,
                schema: schema,
                fieldCount: AIS.Object.keys(schema).length
            });

        } catch (e) {
            normalizeReport.files.push({
                name: file.name,
                error: e.message
            });
        }
    }

    generateNormalizeReport(normalizeReport);
}

/**
 * Infer schema from settings object
 * @param {Object} settings - Settings object
 * @returns {Object} Inferred schema
 */
function inferSchema(settings) {
    var schema = {};

    for (var key in settings) {
        if (settings.hasOwnProperty(key)) {
            var value = settings[key];
            var fieldSchema = {type: typeof value, required: true};

            if (typeof value === 'number') {
                fieldSchema.min = CFG.CONSISTENCY_RULES.minNumber;
                fieldSchema.max = CFG.CONSISTENCY_RULES.maxNumber;
            }

            schema[key] = fieldSchema;
        }
    }

    return schema;
}

/**
 * Create backup of all settings files
 */
function createBackup() {
    var backupFolder = new Folder(CFG.BACKUP_FOLDER);
    if (!backupFolder.exists) {
        backupFolder.create();
    }

    var timestamp = new Date().getTime();
    var snapshotFolder = new Folder(CFG.BACKUP_FOLDER + CFG.BACKUP_PREFIX + timestamp);
    snapshotFolder.create();

    var settingsFolder = new Folder(CFG.SETTINGS_FOLDER);
    var settingsFiles = settingsFolder.getFiles('*-settings.json');

    var backedUp = 0;

    for (var i = 0; i < settingsFiles.length; i++) {
        var file = settingsFiles[i];

        file.encoding = 'UTF-8';
        file.open('r');
        var content = file.read();
        file.close();

        var backupFile = new File(snapshotFolder.fsName + '/' + file.name);
        backupFile.encoding = 'UTF-8';
        backupFile.open('w');
        backupFile.write(content);
        backupFile.close();

        backedUp++;
    }

    // Clean old backups
    cleanOldBackups();

    alert('Backup Created\n' +
          'Timestamp: ' + timestamp + '\n' +
          'Files backed up: ' + backedUp + '\n' +
          'Location: ' + snapshotFolder.fsName);
}

/**
 * Restore settings from a backup
 * @param {Object} dialog - The dialog object
 */
function restoreFromBackup(dialog) {
    var backups = getAvailableBackups();

    if (backups.length === 0) {
        alert('No Backups\nNo backup snapshots found');
        return;
    }

    var selectedIdx = dialog.backupList.selection ? dialog.backupList.selection.index : -1;

    if (selectedIdx === -1) {
        alert('No Selection\nPlease select a backup to restore');
        return;
    }

    var backup = backups[selectedIdx];

    var confirmed = confirm('Restore Confirmation\n' +
                           'Restore from backup: ' + formatTimestamp(backup.timestamp) + '\n' +
                           'Files: ' + backup.fileCount + '\n\n' +
                           'Current settings will be overwritten.\n' +
                           'Continue?');

    if (!confirmed) return;

    // Restore files
    var backupFolder = new Folder(backup.path);
    var files = backupFolder.getFiles('*.json');

    var restored = 0;

    for (var i = 0; i < files.length; i++) {
        var backupFile = files[i];

        backupFile.encoding = 'UTF-8';
        backupFile.open('r');
        var content = backupFile.read();
        backupFile.close();

        var settingsFile = new File(CFG.SETTINGS_FOLDER + backupFile.name);
        settingsFile.encoding = 'UTF-8';
        settingsFile.open('w');
        settingsFile.write(content);
        settingsFile.close();

        restored++;
    }

    alert('Restore Complete\n' +
          'Files restored: ' + restored + '\n' +
          'From backup: ' + formatTimestamp(backup.timestamp));
}

/**
 * Clean old backups (keep only MAX_BACKUPS)
 */
function cleanOldBackups() {
    var backupFolder = new Folder(CFG.BACKUP_FOLDER);
    if (!backupFolder.exists) return;

    var backups = backupFolder.getFiles(function(f) {
        return f instanceof Folder && f.name.indexOf(CFG.BACKUP_PREFIX) === 0;
    });

    if (backups.length <= CFG.MAX_BACKUPS) return;

    // Sort by timestamp
    backups.sort(function(a, b) {
        var tsA = parseInt(a.name.replace(CFG.BACKUP_PREFIX, ''), 10);
        var tsB = parseInt(b.name.replace(CFG.BACKUP_PREFIX, ''), 10);
        return tsA - tsB; // Oldest first
    });

    // Remove oldest backups
    var toRemove = backups.length - CFG.MAX_BACKUPS;
    for (var i = 0; i < toRemove; i++) {
        backups[i].remove();
    }
}

// ============================================================================
// USER INTERFACE
// ============================================================================

/**
 * Create the main dialog
 * @returns {Window} The dialog window
 */
function createDialog() {
    var dialog = new Window('dialog', 'Enforce Configuration Consistency');
    dialog.alignChildren = ['fill', 'top'];
    dialog.spacing = 10;
    dialog.margins = 16;

    // Action selection
    var actionGroup = dialog.add('panel', undefined, 'Action');
    actionGroup.alignChildren = ['left', 'top'];
    actionGroup.spacing = 8;
    actionGroup.margins = 10;

    var detectRadio = actionGroup.add('radiobutton', undefined, 'Detect Configuration Drift');
    var repairRadio = actionGroup.add('radiobutton', undefined, 'Repair Settings (with backup)');
    var normalizeRadio = actionGroup.add('radiobutton', undefined, 'Normalize Schemas');
    var backupRadio = actionGroup.add('radiobutton', undefined, 'Create Backup');
    var restoreRadio = actionGroup.add('radiobutton', undefined, 'Restore from Backup');

    detectRadio.value = true;

    dialog.detectRadio = detectRadio;
    dialog.repairRadio = repairRadio;
    dialog.normalizeRadio = normalizeRadio;
    dialog.backupRadio = backupRadio;
    dialog.restoreRadio = restoreRadio;

    // Repair options panel
    var repairPanel = dialog.add('panel', undefined, 'Repair Options');
    repairPanel.alignChildren = ['left', 'top'];
    repairPanel.spacing = 8;
    repairPanel.margins = 10;
    repairPanel.visible = false;

    var autoFixCheck = repairPanel.add('checkbox', undefined, 'Auto-fix issues (creates backup first)');
    autoFixCheck.value = true;
    dialog.autoFixCheck = autoFixCheck;
    dialog.repairPanel = repairPanel;

    // Backup list panel
    var backupPanel = dialog.add('panel', undefined, 'Available Backups');
    backupPanel.alignChildren = ['fill', 'top'];
    backupPanel.spacing = 8;
    backupPanel.margins = 10;
    backupPanel.minimumSize = [500, 150];
    backupPanel.visible = false;

    var backupList = backupPanel.add('listbox', undefined, [], {multiselect: false});
    backupList.minimumSize = [480, 120];
    dialog.backupList = backupList;
    dialog.backupPanel = backupPanel;

    // Populate backup list
    populateBackupList(dialog);

    // Radio button handlers
    repairRadio.onClick = function() {
        repairPanel.visible = true;
        backupPanel.visible = false;
    };

    restoreRadio.onClick = function() {
        repairPanel.visible = false;
        backupPanel.visible = true;
    };

    detectRadio.onClick = normalizeRadio.onClick = backupRadio.onClick = function() {
        repairPanel.visible = false;
        backupPanel.visible = false;
    };

    // Buttons
    var buttonGroup = dialog.add('group');
    buttonGroup.alignment = ['right', 'top'];
    var okBtn = buttonGroup.add('button', undefined, 'OK', {name: 'ok'});
    var cancelBtn = buttonGroup.add('button', undefined, 'Cancel', {name: 'cancel'});

    return dialog;
}

/**
 * Get selected action from dialog
 * @param {Object} dialog - The dialog object
 * @returns {String} The selected action
 */
function getSelectedAction(dialog) {
    if (dialog.detectRadio.value) return 'detect';
    if (dialog.repairRadio.value) return 'repair';
    if (dialog.normalizeRadio.value) return 'normalize';
    if (dialog.backupRadio.value) return 'backup';
    if (dialog.restoreRadio.value) return 'restore';
    return 'detect';
}

/**
 * Populate backup list
 * @param {Object} dialog - The dialog object
 */
function populateBackupList(dialog) {
    var backups = getAvailableBackups();

    dialog.backupList.removeAll();

    for (var i = 0; i < backups.length; i++) {
        var backup = backups[i];
        var label = formatTimestamp(backup.timestamp) + ' (' + backup.fileCount + ' files)';
        dialog.backupList.add('item', label);
    }

    if (backups.length > 0) {
        dialog.backupList.selection = 0;
    }
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Get available backups
 * @returns {Array} Array of backup metadata
 */
function getAvailableBackups() {
    var backupFolder = new Folder(CFG.BACKUP_FOLDER);
    if (!backupFolder.exists) {
        return [];
    }

    var backups = [];
    var folders = backupFolder.getFiles(function(f) {
        return f instanceof Folder && f.name.indexOf(CFG.BACKUP_PREFIX) === 0;
    });

    for (var i = 0; i < folders.length; i++) {
        var folder = folders[i];
        var timestamp = parseInt(folder.name.replace(CFG.BACKUP_PREFIX, ''), 10);
        var files = folder.getFiles('*.json');

        backups.push({
            timestamp: timestamp,
            path: folder.fsName,
            fileCount: files.length
        });
    }

    // Sort by timestamp descending
    backups.sort(function(a, b) {
        return b.timestamp - a.timestamp;
    });

    return backups;
}

/**
 * Get default value for a field schema
 * @param {Object} fieldSchema - Field schema definition
 * @returns {*} Default value
 */
function getDefaultValue(fieldSchema) {
    if (fieldSchema.type === 'number') {
        if (fieldSchema.min !== undefined) return fieldSchema.min;
        return 0;
    }

    if (fieldSchema.type === 'string') {
        if (fieldSchema.values && fieldSchema.values.length > 0) return fieldSchema.values[0];
        return '';
    }

    if (fieldSchema.type === 'boolean') {
        return false;
    }

    return null;
}

/**
 * Format timestamp for display
 * @param {Number} timestamp - Unix timestamp
 * @returns {String} Formatted date string
 */
function formatTimestamp(timestamp) {
    var date = new Date(timestamp);
    var year = date.getFullYear();
    var month = padZero(date.getMonth() + 1);
    var day = padZero(date.getDate());
    var hours = padZero(date.getHours());
    var minutes = padZero(date.getMinutes());

    return year + '-' + month + '-' + day + ' ' + hours + ':' + minutes;
}

/**
 * Pad number with zero
 * @param {Number} num - Number to pad
 * @returns {String} Padded string
 */
function padZero(num) {
    return num < 10 ? '0' + num : num.toString();
}

/**
 * Generate drift detection report
 * @param {Object} report - Drift report data
 */
function generateDriftReport(report) {
    var html = [];

    html.push('<!DOCTYPE html>');
    html.push('<html><head><meta charset="UTF-8">');
    html.push('<title>Configuration Drift Report</title>');
    html.push('<style>');
    html.push('body { font-family: "Segoe UI", Arial, sans-serif; margin: 20px; background: ' + CFG.COLORS.bg + '; }');
    html.push('h1 { color: #333; border-bottom: 2px solid #ddd; padding-bottom: 10px; }');
    html.push('.file { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid ' + CFG.COLORS.drift + '; }');
    html.push('.issue { margin: 8px 0; padding: 8px; background: #f9f9f9; }');
    html.push('.critical { color: ' + CFG.COLORS.drift + '; }');
    html.push('.warning { color: ' + CFG.COLORS.warning + '; }');
    html.push('.info { color: ' + CFG.COLORS.info + '; }');
    html.push('</style></head><body>');

    html.push('<h1>Configuration Drift Report</h1>');
    html.push('<p><strong>Generated:</strong> ' + report.timestamp + '</p>');
    html.push('<p><strong>Total Issues:</strong> ' + report.totalIssues + '</p>');
    html.push('<p><strong>Files Affected:</strong> ' + report.files.length + '</p>');

    for (var i = 0; i < report.files.length; i++) {
        var file = report.files[i];
        html.push('<div class="file">');
        html.push('<h3>' + file.name + '</h3>');
        html.push('<p>Issues: ' + file.issues.length + '</p>');

        for (var j = 0; j < file.issues.length; j++) {
            var issue = file.issues[j];
            var cssClass = issue.severity;

            html.push('<div class="issue">');
            html.push('<span class="' + cssClass + '">[' + issue.severity.toUpperCase() + ']</span> ');
            html.push('<strong>' + issue.type + '</strong>: ' + issue.message);

            if (issue.fixable) {
                html.push(' <em>(fixable)</em>');
            }

            html.push('</div>');
        }

        html.push('</div>');
    }

    html.push('</body></html>');

    var reportFile = new File(CFG.SETTINGS_FOLDER + CFG.REPORT_FILE);
    reportFile.encoding = 'UTF-8';
    reportFile.open('w');
    reportFile.write(html.join('\n'));
    reportFile.close();

    reportFile.execute();

    alert('Drift Report Generated\n' +
          'Total Issues: ' + report.totalIssues + '\n' +
          'Files Affected: ' + report.files.length + '\n' +
          'Report opened in default browser');
}

/**
 * Generate repair report
 * @param {Object} report - Repair report data
 */
function generateRepairReport(report) {
    var html = [];

    html.push('<!DOCTYPE html>');
    html.push('<html><head><meta charset="UTF-8">');
    html.push('<title>Configuration Repair Report</title>');
    html.push('<style>');
    html.push('body { font-family: "Segoe UI", Arial, sans-serif; margin: 20px; background: ' + CFG.COLORS.bg + '; }');
    html.push('h1 { color: #333; border-bottom: 2px solid #ddd; padding-bottom: 10px; }');
    html.push('.file { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid ' + CFG.COLORS.fixed + '; }');
    html.push('.fix { margin: 8px 0; padding: 8px; background: #f9f9f9; }');
    html.push('</style></head><body>');

    html.push('<h1>Configuration Repair Report</h1>');
    html.push('<p><strong>Generated:</strong> ' + report.timestamp + '</p>');
    html.push('<p><strong>Files Repaired:</strong> ' + report.filesRepaired + '</p>');
    html.push('<p><strong>Issues Fixed:</strong> ' + report.issuesFixed + '</p>');

    for (var i = 0; i < report.files.length; i++) {
        var file = report.files[i];
        html.push('<div class="file">');
        html.push('<h3>' + file.name + '</h3>');
        html.push('<p>Issues Fixed: ' + file.issuesFixed + '</p>');

        for (var j = 0; j < file.issues.length; j++) {
            var issue = file.issues[j];
            html.push('<div class="fix">');
            html.push('<strong>' + issue.type + '</strong>: ' + issue.message);
            html.push('</div>');
        }

        html.push('</div>');
    }

    html.push('</body></html>');

    var reportFile = new File(CFG.SETTINGS_FOLDER + 'repair-report.html');
    reportFile.encoding = 'UTF-8';
    reportFile.open('w');
    reportFile.write(html.join('\n'));
    reportFile.close();

    reportFile.execute();

    alert('Repair Complete\n' +
          'Files Repaired: ' + report.filesRepaired + '\n' +
          'Issues Fixed: ' + report.issuesFixed + '\n' +
          'Report opened in default browser');
}

/**
 * Generate schema normalization report
 * @param {Object} report - Normalize report data
 */
function generateNormalizeReport(report) {
    alert('Schema Normalization Complete\n' +
          'Files Processed: ' + report.filesProcessed + '\n' +
          'Schemas Inferred: ' + report.schemasInferred);
}

// ============================================================================
// ENTRY POINT
// ============================================================================

main();
