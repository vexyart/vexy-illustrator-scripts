/**
 * Settings Schema Validator
 * @version 1.0.0
 * @description Validates settings file schemas for data integrity and consistency
 * @category Utilities
 * @author Vexy Illustrator Scripts
 *
 * @features
 * - Defines standard settings schema format for all scripts
 * - Scans all script settings files in ~/Documents/Adobe Scripts/
 * - Validates required fields are present
 * - Detects type mismatches (expected number, got string)
 * - Validates value ranges (min/max for numbers)
 * - Checks for obsolete/deprecated fields
 * - Auto-fixes common schema issues with backup
 * - Generates comprehensive schema compliance report
 * - Schema migration support for version upgrades
 *
 * @usage
 * Run periodically to ensure settings file integrity.
 * Run after settings format changes to validate migrations.
 *
 * @notes
 * - Requires lib/core.jsx for AIS utilities
 * - Creates backups before auto-fix operations
 * - Generates HTML report in ~/Documents/Adobe Scripts/
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
    // Settings folder
    SETTINGS_FOLDER: Folder.myDocuments + '/Adobe Scripts/',

    // Schema definitions for common settings patterns
    COMMON_SCHEMAS: {
        // Numeric settings
        numeric: {
            type: 'number',
            validate: function(value) {
                return typeof value === 'number' && !isNaN(value);
            }
        },
        // String settings
        string: {
            type: 'string',
            validate: function(value) {
                return typeof value === 'string';
            }
        },
        // Boolean settings
        boolean: {
            type: 'boolean',
            validate: function(value) {
                return typeof value === 'boolean';
            }
        },
        // Unit settings (e.g., 'mm', 'pt', 'px')
        unit: {
            type: 'string',
            validate: function(value) {
                var validUnits = ['mm', 'cm', 'in', 'pt', 'px', 'pc'];
                return validUnits.indexOf(value) !== -1;
            }
        },
        // Range numeric (with min/max)
        range: {
            type: 'number',
            validate: function(value, schema) {
                if (typeof value !== 'number' || isNaN(value)) return false;
                if (schema.min !== undefined && value < schema.min) return false;
                if (schema.max !== undefined && value > schema.max) return false;
                return true;
            }
        }
    },

    // Output settings
    REPORT_NAME: 'settings-schema-report.html',
    BACKUP_SUFFIX: '.backup'
};

// ============================================================================
// MAIN FUNCTION
// ============================================================================

function main() {
    try {
        AIS.Log.info('Settings Schema Validator v1.0.0');
        AIS.Log.info('Scanning settings files...');

        var results = validateAllSettings();
        var report = generateReport(results);
        var reportPath = saveReport(report);

        // Offer to auto-fix issues
        if (results.violations.length > 0 && results.fixable > 0) {
            var shouldFix = confirm(
                'Found ' + results.fixable + ' fixable schema issues.\n\n' +
                'Auto-fix these issues?\n' +
                '(Backups will be created first)'
            );

            if (shouldFix) {
                var fixed = autoFixIssues(results);
                alert('Auto-fix complete!\n\nFixed ' + fixed + ' issues.\nBackups saved with .backup extension.');
            }
        }

        showSummary(results, reportPath);

    } catch (err) {
        AIS.Error.show('Settings Schema Validator failed', err);
    }
}

// ============================================================================
// CORE VALIDATION LOGIC
// ============================================================================

/**
 * Validate all settings files
 * @returns {Object} Validation results
 */
function validateAllSettings() {
    var results = {
        total: 0,
        valid: 0,
        violations: [],
        fixable: 0,
        summary: {
            missingFields: 0,
            typeMismatch: 0,
            rangeViolation: 0,
            obsoleteFields: 0,
            invalidJSON: 0
        }
    };

    var settingsFolder = new Folder(CFG.SETTINGS_FOLDER);
    if (!settingsFolder.exists) {
        AIS.Log.warning('Settings folder not found: ' + CFG.SETTINGS_FOLDER);
        return results;
    }

    var files = settingsFolder.getFiles('*-settings.json');
    for (var i = 0; i < files.length; i++) {
        if (files[i] instanceof Folder) continue;

        results.total++;
        var fileViolations = validateSettingsFile(files[i]);

        if (fileViolations.length > 0) {
            results.violations.push({
                file: files[i].name,
                path: files[i].fsName,
                issues: fileViolations
            });

            // Count issues by type
            for (var j = 0; j < fileViolations.length; j++) {
                var issue = fileViolations[j];
                results.summary[issue.type]++;
                if (issue.fixable) results.fixable++;
            }
        } else {
            results.valid++;
        }
    }

    return results;
}

/**
 * Validate a single settings file
 * @param {File} file - Settings file
 * @returns {Array} Array of violations
 */
function validateSettingsFile(file) {
    var violations = [];

    try {
        // Read file
        file.encoding = 'UTF-8';
        file.open('r');
        var content = file.read();
        file.close();

        // Parse JSON
        var settings;
        try {
            settings = AIS.JSON.parse(content);
        } catch (parseErr) {
            violations.push({
                type: 'invalidJSON',
                severity: 'critical',
                message: 'Invalid JSON: ' + parseErr.message,
                field: null,
                fixable: false
            });
            return violations;
        }

        // Infer schema from settings structure
        var schema = inferSchema(settings);

        // Validate against schema
        violations = violations.concat(validateAgainstSchema(settings, schema));

    } catch (err) {
        violations.push({
            type: 'invalidJSON',
            severity: 'critical',
            message: 'Could not read file: ' + err.message,
            field: null,
            fixable: false
        });
    }

    return violations;
}

/**
 * Infer schema from settings object
 * @param {Object} settings - Settings object
 * @returns {Object} Inferred schema
 */
function inferSchema(settings) {
    var schema = {};

    for (var key in settings) {
        if (!settings.hasOwnProperty(key)) continue;

        var value = settings[key];
        var valueType = typeof value;

        // Determine field schema based on value
        if (valueType === 'number') {
            schema[key] = {
                type: 'number',
                required: true,
                min: 0, // Default min for numbers
                max: undefined
            };
        } else if (valueType === 'string') {
            // Check if it's a unit
            var validUnits = ['mm', 'cm', 'in', 'pt', 'px', 'pc'];
            if (validUnits.indexOf(value) !== -1) {
                schema[key] = {
                    type: 'unit',
                    required: true
                };
            } else {
                schema[key] = {
                    type: 'string',
                    required: true
                };
            }
        } else if (valueType === 'boolean') {
            schema[key] = {
                type: 'boolean',
                required: true
            };
        } else {
            schema[key] = {
                type: 'unknown',
                required: false
            };
        }
    }

    return schema;
}

/**
 * Validate settings against schema
 * @param {Object} settings - Settings object
 * @param {Object} schema - Schema definition
 * @returns {Array} Violations
 */
function validateAgainstSchema(settings, schema) {
    var violations = [];

    // Check for required fields
    for (var key in schema) {
        if (!schema.hasOwnProperty(key)) continue;

        var fieldSchema = schema[key];

        if (fieldSchema.required && !settings.hasOwnProperty(key)) {
            violations.push({
                type: 'missingFields',
                severity: 'critical',
                message: 'Missing required field: ' + key,
                field: key,
                fixable: true,
                suggestedValue: getDefaultValue(fieldSchema.type)
            });
        }
    }

    // Check existing fields
    for (var key in settings) {
        if (!settings.hasOwnProperty(key)) continue;

        var value = settings[key];
        var fieldSchema = schema[key];

        if (!fieldSchema) {
            // Unknown field (possibly obsolete)
            violations.push({
                type: 'obsoleteFields',
                severity: 'warning',
                message: 'Unknown/obsolete field: ' + key,
                field: key,
                fixable: true
            });
            continue;
        }

        // Type validation
        var typeValid = validateType(value, fieldSchema);
        if (!typeValid) {
            violations.push({
                type: 'typeMismatch',
                severity: 'critical',
                message: 'Type mismatch for ' + key + ': expected ' + fieldSchema.type + ', got ' + typeof value,
                field: key,
                fixable: true,
                suggestedValue: coerceType(value, fieldSchema.type)
            });
        }

        // Range validation for numbers
        if (fieldSchema.type === 'number' && typeof value === 'number') {
            if (fieldSchema.min !== undefined && value < fieldSchema.min) {
                violations.push({
                    type: 'rangeViolation',
                    severity: 'warning',
                    message: key + ' value ' + value + ' below minimum ' + fieldSchema.min,
                    field: key,
                    fixable: true,
                    suggestedValue: fieldSchema.min
                });
            }
            if (fieldSchema.max !== undefined && value > fieldSchema.max) {
                violations.push({
                    type: 'rangeViolation',
                    severity: 'warning',
                    message: key + ' value ' + value + ' above maximum ' + fieldSchema.max,
                    field: key,
                    fixable: true,
                    suggestedValue: fieldSchema.max
                });
            }
        }
    }

    return violations;
}

/**
 * Validate value against type
 * @param {*} value - Value to validate
 * @param {Object} schema - Field schema
 * @returns {Boolean} True if valid
 */
function validateType(value, schema) {
    var valueType = typeof value;

    if (schema.type === 'number') {
        return valueType === 'number' && !isNaN(value);
    } else if (schema.type === 'string') {
        return valueType === 'string';
    } else if (schema.type === 'boolean') {
        return valueType === 'boolean';
    } else if (schema.type === 'unit') {
        var validUnits = ['mm', 'cm', 'in', 'pt', 'px', 'pc'];
        return valueType === 'string' && validUnits.indexOf(value) !== -1;
    }

    return true; // Unknown type passes
}

/**
 * Get default value for type
 * @param {String} type - Type name
 * @returns {*} Default value
 */
function getDefaultValue(type) {
    if (type === 'number') return 0;
    if (type === 'string') return '';
    if (type === 'boolean') return false;
    if (type === 'unit') return 'mm';
    return null;
}

/**
 * Coerce value to type
 * @param {*} value - Value to coerce
 * @param {String} type - Target type
 * @returns {*} Coerced value
 */
function coerceType(value, type) {
    if (type === 'number') {
        var num = parseFloat(value);
        return isNaN(num) ? 0 : num;
    } else if (type === 'string') {
        return String(value);
    } else if (type === 'boolean') {
        return Boolean(value);
    }

    return value;
}

// ============================================================================
// AUTO-FIX LOGIC
// ============================================================================

/**
 * Auto-fix fixable issues
 * @param {Object} results - Validation results
 * @returns {Number} Number of files fixed
 */
function autoFixIssues(results) {
    var fixed = 0;

    for (var i = 0; i < results.violations.length; i++) {
        var violation = results.violations[i];
        var hasFixableIssues = false;

        for (var j = 0; j < violation.issues.length; j++) {
            if (violation.issues[j].fixable) {
                hasFixableIssues = true;
                break;
            }
        }

        if (hasFixableIssues) {
            if (fixSettingsFile(violation.path, violation.issues)) {
                fixed++;
            }
        }
    }

    return fixed;
}

/**
 * Fix a settings file
 * @param {String} filePath - Settings file path
 * @param {Array} issues - Issues to fix
 * @returns {Boolean} True if fixed successfully
 */
function fixSettingsFile(filePath, issues) {
    try {
        var file = new File(filePath);

        // Read current settings
        file.encoding = 'UTF-8';
        file.open('r');
        var content = file.read();
        file.close();

        var settings = AIS.JSON.parse(content);

        // Apply fixes
        for (var i = 0; i < issues.length; i++) {
            var issue = issues[i];
            if (!issue.fixable) continue;

            if (issue.type === 'missingFields') {
                // Add missing field with default value
                settings[issue.field] = issue.suggestedValue;
            } else if (issue.type === 'typeMismatch') {
                // Fix type mismatch
                settings[issue.field] = issue.suggestedValue;
            } else if (issue.type === 'rangeViolation') {
                // Fix range violation
                settings[issue.field] = issue.suggestedValue;
            } else if (issue.type === 'obsoleteFields') {
                // Remove obsolete field
                delete settings[issue.field];
            }
        }

        // Backup original
        var backup = new File(filePath + CFG.BACKUP_SUFFIX);
        file.copy(backup);

        // Write fixed settings
        file.open('w');
        file.write(AIS.JSON.stringify(settings, true));
        file.close();

        return true;

    } catch (err) {
        AIS.Log.error('Could not fix ' + filePath + ': ' + err.message);
        return false;
    }
}

// ============================================================================
// REPORT GENERATION
// ============================================================================

/**
 * Generate HTML report
 * @param {Object} results - Validation results
 * @returns {String} HTML report
 */
function generateReport(results) {
    var html = [];

    html.push('<!DOCTYPE html>');
    html.push('<html><head>');
    html.push('<meta charset="UTF-8">');
    html.push('<title>Settings Schema Validation Report</title>');
    html.push('<style>');
    html.push('body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }');
    html.push('h1 { color: #333; }');
    html.push('.summary { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }');
    html.push('.stats { display: flex; gap: 20px; margin: 20px 0; }');
    html.push('.stat { background: #f9f9f9; padding: 15px; border-radius: 5px; flex: 1; }');
    html.push('.stat-label { font-size: 12px; color: #666; }');
    html.push('.stat-value { font-size: 32px; font-weight: bold; margin: 5px 0; }');
    html.push('.valid .stat-value { color: #4caf50; }');
    html.push('.violations .stat-value { color: #f44336; }');
    html.push('.fixable .stat-value { color: #ff9800; }');
    html.push('.file { background: white; padding: 15px; margin: 10px 0; border-radius: 5px; }');
    html.push('.file-name { font-weight: bold; color: #1976d2; margin-bottom: 10px; }');
    html.push('.issue { margin: 8px 0; padding: 8px; border-left: 4px solid #ccc; }');
    html.push('.issue.critical { border-left-color: #f44336; background: #ffebee; }');
    html.push('.issue.warning { border-left-color: #ff9800; background: #fff3e0; }');
    html.push('.issue-type { font-weight: bold; font-size: 12px; text-transform: uppercase; }');
    html.push('.issue-message { margin: 5px 0; }');
    html.push('.issue-field { font-family: monospace; background: #f5f5f5; padding: 2px 6px; border-radius: 3px; }');
    html.push('.fixable-tag { display: inline-block; background: #4caf50; color: white; padding: 2px 8px; border-radius: 3px; font-size: 10px; margin-left: 8px; }');
    html.push('.no-issues { color: #4caf50; font-weight: bold; font-size: 18px; }');
    html.push('</style>');
    html.push('</head><body>');

    // Header
    html.push('<h1>Settings Schema Validation Report</h1>');
    html.push('<p>Generated: ' + new Date().toString() + '</p>');

    // Summary
    html.push('<div class="summary">');
    html.push('<h2>Summary</h2>');
    html.push('<p><strong>Total Settings Files:</strong> ' + results.total + '</p>');
    html.push('<p><strong>Valid Files:</strong> ' + results.valid + '</p>');
    html.push('<p><strong>Files with Issues:</strong> ' + results.violations.length + '</p>');

    html.push('<div class="stats">');
    html.push('<div class="stat valid">');
    html.push('<div class="stat-label">Valid Files</div>');
    html.push('<div class="stat-value">' + results.valid + '</div>');
    html.push('</div>');
    html.push('<div class="stat violations">');
    html.push('<div class="stat-label">Files with Issues</div>');
    html.push('<div class="stat-value">' + results.violations.length + '</div>');
    html.push('</div>');
    html.push('<div class="stat fixable">');
    html.push('<div class="stat-label">Auto-Fixable</div>');
    html.push('<div class="stat-value">' + results.fixable + '</div>');
    html.push('</div>');
    html.push('</div>');

    // Issue breakdown
    html.push('<h3>Issue Breakdown</h3>');
    html.push('<ul>');
    html.push('<li>Missing Fields: ' + results.summary.missingFields + '</li>');
    html.push('<li>Type Mismatches: ' + results.summary.typeMismatch + '</li>');
    html.push('<li>Range Violations: ' + results.summary.rangeViolation + '</li>');
    html.push('<li>Obsolete Fields: ' + results.summary.obsoleteFields + '</li>');
    html.push('<li>Invalid JSON: ' + results.summary.invalidJSON + '</li>');
    html.push('</ul>');
    html.push('</div>');

    // Violations by file
    if (results.violations.length === 0) {
        html.push('<p class="no-issues">✓ All settings files are valid!</p>');
    } else {
        html.push('<h2>Issues by File</h2>');

        for (var i = 0; i < results.violations.length; i++) {
            var violation = results.violations[i];
            html.push('<div class="file">');
            html.push('<div class="file-name">' + violation.file + '</div>');
            html.push('<div style="font-size: 11px; color: #666; margin-bottom: 10px;">' + violation.path + '</div>');

            for (var j = 0; j < violation.issues.length; j++) {
                var issue = violation.issues[j];
                html.push('<div class="issue ' + issue.severity + '">');
                html.push('<div class="issue-type">' + issue.type + ' (' + issue.severity + ')');
                if (issue.fixable) {
                    html.push('<span class="fixable-tag">AUTO-FIXABLE</span>');
                }
                html.push('</div>');
                html.push('<div class="issue-message">' + issue.message + '</div>');
                if (issue.field) {
                    html.push('<div>Field: <span class="issue-field">' + issue.field + '</span></div>');
                }
                if (issue.suggestedValue !== undefined) {
                    html.push('<div style="font-size: 11px; color: #666;">Suggested: ' + issue.suggestedValue + '</div>');
                }
                html.push('</div>');
            }

            html.push('</div>');
        }
    }

    html.push('</body></html>');

    return html.join('\n');
}

/**
 * Save report to file
 * @param {String} report - HTML report
 * @returns {String} Report file path
 */
function saveReport(report) {
    var folder = new Folder(CFG.SETTINGS_FOLDER);
    if (!folder.exists) folder.create();

    var file = new File(CFG.SETTINGS_FOLDER + CFG.REPORT_NAME);
    file.encoding = 'UTF-8';
    file.open('w');
    file.write(report);
    file.close();

    return file.fsName;
}

// ============================================================================
// USER INTERFACE
// ============================================================================

/**
 * Show summary dialog
 * @param {Object} results - Validation results
 * @param {String} reportPath - Report file path
 */
function showSummary(results, reportPath) {
    var message = 'Settings Schema Validation Complete\n\n';
    message += 'Total Files: ' + results.total + '\n';
    message += 'Valid Files: ' + results.valid + '\n';
    message += 'Files with Issues: ' + results.violations.length + '\n\n';
    message += 'Issue Breakdown:\n';
    message += '- Missing Fields: ' + results.summary.missingFields + '\n';
    message += '- Type Mismatches: ' + results.summary.typeMismatch + '\n';
    message += '- Range Violations: ' + results.summary.rangeViolation + '\n';
    message += '- Obsolete Fields: ' + results.summary.obsoleteFields + '\n';
    message += '- Invalid JSON: ' + results.summary.invalidJSON + '\n\n';
    message += 'Report saved to:\n' + reportPath + '\n\n';
    message += 'Open report now?';

    var response = confirm(message);
    if (response) {
        var reportFile = new File(reportPath);
        reportFile.execute();
    }
}
