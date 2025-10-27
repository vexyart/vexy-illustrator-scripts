/**
 * Monitor Script Health
 * @version 1.0.0
 * @description Production health monitoring system with periodic checks and error rate tracking
 * @category Utilities
 * @features Health checks, error tracking, performance monitoring, usage statistics, automated alerts
 * @author Vexy
 * @usage Run to check script health, view error rates, and analyze production issues
 */

// this_file: Utilities/MonitorScriptHealth.jsx

#include "../.lib/core.jsx"

//@target illustrator
app.preferences.setBooleanPreference('ShowExternalJSXWarning', false);

// ============================================================================
// CONFIGURATION
// ============================================================================

var CFG = {
    // Health data storage
    HEALTH_FOLDER: Folder.myDocuments + '/Adobe Scripts/Health/',
    ERROR_LOG: 'script-errors.json',
    USAGE_LOG: 'script-usage.json',
    HEALTH_REPORT: 'health-report.html',

    // Monitoring thresholds
    THRESHOLDS: {
        errorRate: 0.05,        // 5% error rate threshold
        minExecutions: 10,       // Minimum runs before calculating rate
        crashRate: 0.01,        // 1% crash rate threshold
        slowExecution: 5000,    // 5 seconds is considered slow
        memoryWarning: 80       // 80% memory usage warning
    },

    // Time periods (milliseconds)
    PERIODS: {
        hour: 3600000,
        day: 86400000,
        week: 604800000,
        month: 2592000000
    },

    // Health status levels
    STATUS: {
        HEALTHY: 'healthy',
        WARNING: 'warning',
        CRITICAL: 'critical',
        UNKNOWN: 'unknown'
    },

    // Report colors
    COLORS: {
        healthy: '#28a745',
        warning: '#ffc107',
        critical: '#dc3545',
        info: '#007bff',
        bg: '#f5f5f5'
    },

    // Max log entries to keep
    MAX_LOG_ENTRIES: 10000
};

// ============================================================================
// MAIN FUNCTION
// ============================================================================

function main() {
    try {
        var dialog = createDialog();

        if (dialog.show() === 1) {
            var action = getSelectedAction(dialog);

            if (action === 'check') {
                runHealthCheck();
            } else if (action === 'errors') {
                viewErrorLog();
            } else if (action === 'usage') {
                viewUsageStats();
            } else if (action === 'clean') {
                cleanOldLogs(dialog);
            } else if (action === 'export') {
                exportHealthReport();
            }
        }

    } catch (e) {
        AIS.Error.show('Health monitoring failed', e);
    }
}

// ============================================================================
// CORE LOGIC
// ============================================================================

/**
 * Run comprehensive health check
 */
function runHealthCheck() {
    var results = {
        timestamp: new Date().getTime(),
        date: new Date().toString(),
        overall: CFG.STATUS.HEALTHY,
        checks: []
    };

    // Check 1: Error rate analysis
    results.checks.push(checkErrorRates());

    // Check 2: Script availability
    results.checks.push(checkScriptAvailability());

    // Check 3: Library integrity
    results.checks.push(checkLibraryIntegrity());

    // Check 4: Settings file health
    results.checks.push(checkSettingsHealth());

    // Check 5: Recent crashes
    results.checks.push(checkRecentCrashes());

    // Determine overall status
    for (var i = 0; i < results.checks.length; i++) {
        if (results.checks[i].status === CFG.STATUS.CRITICAL) {
            results.overall = CFG.STATUS.CRITICAL;
            break;
        } else if (results.checks[i].status === CFG.STATUS.WARNING && results.overall !== CFG.STATUS.CRITICAL) {
            results.overall = CFG.STATUS.WARNING;
        }
    }

    // Save health check results
    saveHealthCheck(results);

    // Generate and show report
    generateHealthReport(results);
}

/**
 * Check error rates for all scripts
 * @returns {Object} Check result
 */
function checkErrorRates() {
    var errors = loadErrorLog();
    var usage = loadUsageLog();

    var scriptStats = {};
    var highErrorScripts = [];

    // Count executions per script
    for (var i = 0; i < usage.length; i++) {
        var entry = usage[i];
        if (!scriptStats[entry.script]) {
            scriptStats[entry.script] = {executions: 0, errors: 0};
        }
        scriptStats[entry.script].executions++;
    }

    // Count errors per script
    for (var j = 0; j < errors.length; j++) {
        var error = errors[j];
        if (scriptStats[error.script]) {
            scriptStats[error.script].errors++;
        }
    }

    // Calculate error rates
    for (var script in scriptStats) {
        if (scriptStats.hasOwnProperty(script)) {
            var stats = scriptStats[script];
            if (stats.executions >= CFG.THRESHOLDS.minExecutions) {
                var errorRate = stats.errors / stats.executions;

                if (errorRate >= CFG.THRESHOLDS.errorRate) {
                    highErrorScripts.push({
                        script: script,
                        errorRate: errorRate,
                        errors: stats.errors,
                        executions: stats.executions
                    });
                }
            }
        }
    }

    var status = CFG.STATUS.HEALTHY;
    if (highErrorScripts.length > 0) {
        var maxRate = 0;
        for (var k = 0; k < highErrorScripts.length; k++) {
            if (highErrorScripts[k].errorRate > maxRate) {
                maxRate = highErrorScripts[k].errorRate;
            }
        }
        status = maxRate >= CFG.THRESHOLDS.errorRate * 2 ? CFG.STATUS.CRITICAL : CFG.STATUS.WARNING;
    }

    return {
        name: 'Error Rate Analysis',
        status: status,
        message: highErrorScripts.length > 0
            ? highErrorScripts.length + ' script(s) with high error rates'
            : 'All scripts within acceptable error rates',
        details: highErrorScripts
    };
}

/**
 * Check script file availability
 * @returns {Object} Check result
 */
function checkScriptAvailability() {
    var repoRoot = getRepositoryRoot();
    var categories = getFolders(repoRoot);
    var missing = [];
    var totalScripts = 0;

    for (var i = 0; i < categories.length; i++) {
        var category = categories[i];
        var folder = new Folder(repoRoot + '/' + category);

        if (!folder.exists) continue;

        var scripts = folder.getFiles('*.jsx');
        totalScripts += scripts.length;

        for (var j = 0; j < scripts.length; j++) {
            var script = scripts[j];

            // Check if file is readable
            try {
                script.encoding = 'UTF-8';
                script.open('r');
                script.close();
            } catch (e) {
                missing.push({
                    path: category + '/' + script.name,
                    error: e.message
                });
            }
        }
    }

    var status = missing.length === 0 ? CFG.STATUS.HEALTHY :
                 missing.length > 5 ? CFG.STATUS.CRITICAL : CFG.STATUS.WARNING;

    return {
        name: 'Script Availability',
        status: status,
        message: totalScripts + ' scripts checked, ' + missing.length + ' issues found',
        details: missing
    };
}

/**
 * Check library file integrity
 * @returns {Object} Check result
 */
function checkLibraryIntegrity() {
    var repoRoot = getRepositoryRoot();
    var issues = [];

    var libFiles = ['lib/core.jsx', 'lib/ui.jsx'];

    for (var i = 0; i < libFiles.length; i++) {
        var libPath = repoRoot + '/' + libFiles[i];
        var libFile = new File(libPath);

        if (!libFile.exists) {
            issues.push({
                file: libFiles[i],
                issue: 'File not found',
                severity: 'critical'
            });
            continue;
        }

        try {
            libFile.encoding = 'UTF-8';
            libFile.open('r');
            var content = libFile.read();
            libFile.close();

            // Check for ES6+ syntax
            var es6Patterns = [
                {pattern: /\bconst\s+/g, name: 'const'},
                {pattern: /\blet\s+/g, name: 'let'},
                {pattern: /=>/g, name: 'arrow functions'},
                {pattern: /\bclass\s+/g, name: 'class'},
                {pattern: /`[^`]*`/g, name: 'template literals'}
            ];

            for (var j = 0; j < es6Patterns.length; j++) {
                var match = content.match(es6Patterns[j].pattern);
                if (match) {
                    issues.push({
                        file: libFiles[i],
                        issue: 'ES6+ syntax detected: ' + es6Patterns[j].name,
                        severity: 'critical'
                    });
                }
            }

            // Check for missing AIS namespace
            if (libFiles[i] === 'lib/core.jsx' && content.indexOf('var AIS = AIS ||') === -1) {
                issues.push({
                    file: libFiles[i],
                    issue: 'AIS namespace not found',
                    severity: 'critical'
                });
            }

        } catch (e) {
            issues.push({
                file: libFiles[i],
                issue: 'Read error: ' + e.message,
                severity: 'critical'
            });
        }
    }

    var criticalCount = 0;
    for (var k = 0; k < issues.length; k++) {
        if (issues[k].severity === 'critical') criticalCount++;
    }

    var status = issues.length === 0 ? CFG.STATUS.HEALTHY :
                 criticalCount > 0 ? CFG.STATUS.CRITICAL : CFG.STATUS.WARNING;

    return {
        name: 'Library Integrity',
        status: status,
        message: libFiles.length + ' library files checked, ' + issues.length + ' issues found',
        details: issues
    };
}

/**
 * Check settings file health
 * @returns {Object} Check result
 */
function checkSettingsHealth() {
    var settingsFolder = new Folder(Folder.myDocuments + '/Adobe Scripts/');
    if (!settingsFolder.exists) {
        return {
            name: 'Settings Health',
            status: CFG.STATUS.HEALTHY,
            message: 'No settings files found',
            details: []
        };
    }

    var settingsFiles = settingsFolder.getFiles('*-settings.json');
    var issues = [];

    for (var i = 0; i < settingsFiles.length; i++) {
        var file = settingsFiles[i];

        try {
            file.encoding = 'UTF-8';
            file.open('r');
            var content = file.read();
            file.close();

            // Try to parse JSON
            var settings = AIS.JSON.parse(content);

            // Check for common issues
            if (typeof settings !== 'object') {
                issues.push({
                    file: file.name,
                    issue: 'Invalid settings format',
                    severity: 'warning'
                });
            }

        } catch (e) {
            issues.push({
                file: file.name,
                issue: 'JSON parse error: ' + e.message,
                severity: 'warning'
            });
        }
    }

    var status = issues.length === 0 ? CFG.STATUS.HEALTHY : CFG.STATUS.WARNING;

    return {
        name: 'Settings Health',
        status: status,
        message: settingsFiles.length + ' settings files checked, ' + issues.length + ' issues found',
        details: issues
    };
}

/**
 * Check for recent crashes
 * @returns {Object} Check result
 */
function checkRecentCrashes() {
    var errors = loadErrorLog();
    var now = new Date().getTime();
    var dayAgo = now - CFG.PERIODS.day;

    var recentCrashes = [];
    for (var i = 0; i < errors.length; i++) {
        if (errors[i].timestamp >= dayAgo && errors[i].severity === 'crash') {
            recentCrashes.push(errors[i]);
        }
    }

    var status = recentCrashes.length === 0 ? CFG.STATUS.HEALTHY :
                 recentCrashes.length > 5 ? CFG.STATUS.CRITICAL : CFG.STATUS.WARNING;

    return {
        name: 'Recent Crashes',
        status: status,
        message: recentCrashes.length + ' crash(es) in the last 24 hours',
        details: recentCrashes
    };
}

/**
 * View error log with filtering
 */
function viewErrorLog() {
    var errors = loadErrorLog();

    if (errors.length === 0) {
        alert('Error Log\nNo errors recorded');
        return;
    }

    // Group by script
    var byScript = {};
    for (var i = 0; i < errors.length; i++) {
        var error = errors[i];
        if (!byScript[error.script]) {
            byScript[error.script] = [];
        }
        byScript[error.script].push(error);
    }

    var report = ['Error Log Summary', '================', ''];
    report.push('Total errors: ' + errors.length);
    report.push('Scripts affected: ' + AIS.Object.keys(byScript).length);
    report.push('');

    // Top 10 scripts by error count
    var scripts = [];
    for (var script in byScript) {
        if (byScript.hasOwnProperty(script)) {
            scripts.push({
                name: script,
                count: byScript[script].length
            });
        }
    }

    scripts.sort(function(a, b) {
        return b.count - a.count;
    });

    report.push('Top Scripts by Error Count:');
    report.push('---------------------------');

    for (var j = 0; j < Math.min(10, scripts.length); j++) {
        report.push((j + 1) + '. ' + scripts[j].name + ': ' + scripts[j].count + ' errors');
    }

    alert(report.join('\n'));
}

/**
 * View usage statistics
 */
function viewUsageStats() {
    var usage = loadUsageLog();

    if (usage.length === 0) {
        alert('Usage Statistics\nNo usage data recorded');
        return;
    }

    // Calculate statistics
    var byScript = {};
    var totalDuration = 0;

    for (var i = 0; i < usage.length; i++) {
        var entry = usage[i];
        if (!byScript[entry.script]) {
            byScript[entry.script] = {
                count: 0,
                totalDuration: 0
            };
        }
        byScript[entry.script].count++;
        if (entry.duration) {
            byScript[entry.script].totalDuration += entry.duration;
            totalDuration += entry.duration;
        }
    }

    var scripts = [];
    for (var script in byScript) {
        if (byScript.hasOwnProperty(script)) {
            scripts.push({
                name: script,
                count: byScript[script].count,
                avgDuration: byScript[script].totalDuration / byScript[script].count
            });
        }
    }

    scripts.sort(function(a, b) {
        return b.count - a.count;
    });

    var report = ['Usage Statistics', '================', ''];
    report.push('Total executions: ' + usage.length);
    report.push('Unique scripts: ' + scripts.length);
    report.push('Average duration: ' + Math.round(totalDuration / usage.length) + 'ms');
    report.push('');
    report.push('Most Used Scripts:');
    report.push('------------------');

    for (var j = 0; j < Math.min(10, scripts.length); j++) {
        report.push((j + 1) + '. ' + scripts[j].name + ': ' + scripts[j].count + ' runs (avg ' +
                   Math.round(scripts[j].avgDuration) + 'ms)');
    }

    alert(report.join('\n'));
}

/**
 * Clean old log entries
 * @param {Object} dialog - The dialog object
 */
function cleanOldLogs(dialog) {
    var days = parseInt(dialog.daysField.text, 10);
    if (isNaN(days) || days < 1) {
        alert('Invalid Input\nPlease enter a valid number of days');
        return;
    }

    var cutoff = new Date().getTime() - (days * CFG.PERIODS.day);

    var errors = loadErrorLog();
    var usage = loadUsageLog();

    var errorsBefore = errors.length;
    var usageBefore = usage.length;

    // Filter logs
    var errorsFiltered = [];
    for (var i = 0; i < errors.length; i++) {
        if (errors[i].timestamp >= cutoff) {
            errorsFiltered.push(errors[i]);
        }
    }

    var usageFiltered = [];
    for (var j = 0; j < usage.length; j++) {
        if (usage[j].timestamp >= cutoff) {
            usageFiltered.push(usage[j]);
        }
    }

    // Save filtered logs
    saveErrorLog(errorsFiltered);
    saveUsageLog(usageFiltered);

    alert('Logs Cleaned\n' +
          'Removed ' + (errorsBefore - errorsFiltered.length) + ' error entries\n' +
          'Removed ' + (usageBefore - usageFiltered.length) + ' usage entries');
}

/**
 * Export comprehensive health report
 */
function exportHealthReport() {
    var results = {
        timestamp: new Date().getTime(),
        date: new Date().toString(),
        overall: CFG.STATUS.HEALTHY,
        checks: [
            checkErrorRates(),
            checkScriptAvailability(),
            checkLibraryIntegrity(),
            checkSettingsHealth(),
            checkRecentCrashes()
        ]
    };

    for (var i = 0; i < results.checks.length; i++) {
        if (results.checks[i].status === CFG.STATUS.CRITICAL) {
            results.overall = CFG.STATUS.CRITICAL;
            break;
        } else if (results.checks[i].status === CFG.STATUS.WARNING && results.overall !== CFG.STATUS.CRITICAL) {
            results.overall = CFG.STATUS.WARNING;
        }
    }

    generateHealthReport(results);
}

// ============================================================================
// USER INTERFACE
// ============================================================================

/**
 * Create the main dialog
 * @returns {Window} The dialog window
 */
function createDialog() {
    var dialog = new Window('dialog', 'Monitor Script Health');
    dialog.alignChildren = ['fill', 'top'];
    dialog.spacing = 10;
    dialog.margins = 16;

    // Action selection
    var actionGroup = dialog.add('panel', undefined, 'Action');
    actionGroup.alignChildren = ['left', 'top'];
    actionGroup.spacing = 8;
    actionGroup.margins = 10;

    var checkRadio = actionGroup.add('radiobutton', undefined, 'Run Health Check');
    var errorsRadio = actionGroup.add('radiobutton', undefined, 'View Error Log');
    var usageRadio = actionGroup.add('radiobutton', undefined, 'View Usage Statistics');
    var cleanRadio = actionGroup.add('radiobutton', undefined, 'Clean Old Logs');
    var exportRadio = actionGroup.add('radiobutton', undefined, 'Export Health Report');

    checkRadio.value = true;

    dialog.checkRadio = checkRadio;
    dialog.errorsRadio = errorsRadio;
    dialog.usageRadio = usageRadio;
    dialog.cleanRadio = cleanRadio;
    dialog.exportRadio = exportRadio;

    // Clean logs panel
    var cleanPanel = dialog.add('panel', undefined, 'Clean Logs Older Than');
    cleanPanel.alignChildren = ['fill', 'top'];
    cleanPanel.spacing = 8;
    cleanPanel.margins = 10;
    cleanPanel.visible = false;

    var daysGroup = cleanPanel.add('group');
    daysGroup.add('statictext', undefined, 'Days:');
    var daysField = daysGroup.add('edittext', undefined, '30');
    daysField.characters = 10;
    dialog.daysField = daysField;
    dialog.cleanPanel = cleanPanel;

    // Radio button handlers
    cleanRadio.onClick = function() {
        cleanPanel.visible = true;
    };

    checkRadio.onClick = errorsRadio.onClick = usageRadio.onClick = exportRadio.onClick = function() {
        cleanPanel.visible = false;
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
    if (dialog.checkRadio.value) return 'check';
    if (dialog.errorsRadio.value) return 'errors';
    if (dialog.usageRadio.value) return 'usage';
    if (dialog.cleanRadio.value) return 'clean';
    if (dialog.exportRadio.value) return 'export';
    return 'check';
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Get repository root folder
 * @returns {String} Repository root path
 */
function getRepositoryRoot() {
    var scriptFile = new File($.fileName);
    var scriptFolder = scriptFile.parent;
    return scriptFolder.parent.fsName;
}

/**
 * Get production folders
 * @param {String} root - Repository root path
 * @returns {Array} Array of folder names
 */
function getFolders(root) {
    return ['Favorites', 'Artboards', 'Colors', 'Export', 'Layers', 'Paths', 'Text', 'Transform', 'Utilities'];
}

/**
 * Load error log
 * @returns {Array} Array of error entries
 */
function loadErrorLog() {
    var file = new File(CFG.HEALTH_FOLDER + CFG.ERROR_LOG);
    if (!file.exists) {
        return [];
    }

    file.encoding = 'UTF-8';
    file.open('r');
    var content = file.read();
    file.close();

    try {
        return AIS.JSON.parse(content);
    } catch (e) {
        return [];
    }
}

/**
 * Save error log
 * @param {Array} errors - Array of error entries
 */
function saveErrorLog(errors) {
    var folder = new Folder(CFG.HEALTH_FOLDER);
    if (!folder.exists) {
        folder.create();
    }

    // Trim to max entries
    if (errors.length > CFG.MAX_LOG_ENTRIES) {
        errors = errors.slice(errors.length - CFG.MAX_LOG_ENTRIES);
    }

    var file = new File(CFG.HEALTH_FOLDER + CFG.ERROR_LOG);
    file.encoding = 'UTF-8';
    file.open('w');
    file.write(AIS.JSON.stringify(errors));
    file.close();
}

/**
 * Load usage log
 * @returns {Array} Array of usage entries
 */
function loadUsageLog() {
    var file = new File(CFG.HEALTH_FOLDER + CFG.USAGE_LOG);
    if (!file.exists) {
        return [];
    }

    file.encoding = 'UTF-8';
    file.open('r');
    var content = file.read();
    file.close();

    try {
        return AIS.JSON.parse(content);
    } catch (e) {
        return [];
    }
}

/**
 * Save usage log
 * @param {Array} usage - Array of usage entries
 */
function saveUsageLog(usage) {
    var folder = new Folder(CFG.HEALTH_FOLDER);
    if (!folder.exists) {
        folder.create();
    }

    // Trim to max entries
    if (usage.length > CFG.MAX_LOG_ENTRIES) {
        usage = usage.slice(usage.length - CFG.MAX_LOG_ENTRIES);
    }

    var file = new File(CFG.HEALTH_FOLDER + CFG.USAGE_LOG);
    file.encoding = 'UTF-8';
    file.open('w');
    file.write(AIS.JSON.stringify(usage));
    file.close();
}

/**
 * Save health check results
 * @param {Object} results - Health check results
 */
function saveHealthCheck(results) {
    var folder = new Folder(CFG.HEALTH_FOLDER);
    if (!folder.exists) {
        folder.create();
    }

    var file = new File(CFG.HEALTH_FOLDER + 'last-health-check.json');
    file.encoding = 'UTF-8';
    file.open('w');
    file.write(AIS.JSON.stringify(results));
    file.close();
}

/**
 * Generate HTML health report
 * @param {Object} results - Health check results
 */
function generateHealthReport(results) {
    var html = [];

    html.push('<!DOCTYPE html>');
    html.push('<html><head><meta charset="UTF-8">');
    html.push('<title>Script Health Report</title>');
    html.push('<style>');
    html.push('body { font-family: "Segoe UI", Arial, sans-serif; margin: 20px; background: ' + CFG.COLORS.bg + '; }');
    html.push('h1 { color: #333; border-bottom: 2px solid #ddd; padding-bottom: 10px; }');
    html.push('.status-badge { display: inline-block; padding: 5px 12px; border-radius: 12px; font-weight: bold; color: white; }');
    html.push('.healthy { background: ' + CFG.COLORS.healthy + '; }');
    html.push('.warning { background: ' + CFG.COLORS.warning + '; }');
    html.push('.critical { background: ' + CFG.COLORS.critical + '; }');
    html.push('.check { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #ddd; }');
    html.push('.details { margin-top: 10px; padding: 10px; background: #f9f9f9; font-size: 0.9em; }');
    html.push('</style></head><body>');

    html.push('<h1>Script Health Report</h1>');
    html.push('<p><strong>Generated:</strong> ' + results.date + '</p>');
    html.push('<p><strong>Overall Status:</strong> <span class="status-badge ' + results.overall + '">' +
              results.overall.toUpperCase() + '</span></p>');

    for (var i = 0; i < results.checks.length; i++) {
        var check = results.checks[i];
        var borderColor = check.status === CFG.STATUS.HEALTHY ? CFG.COLORS.healthy :
                         check.status === CFG.STATUS.WARNING ? CFG.COLORS.warning : CFG.COLORS.critical;

        html.push('<div class="check" style="border-left-color: ' + borderColor + ';">');
        html.push('<h3>' + check.name + ' <span class="status-badge ' + check.status + '">' +
                 check.status.toUpperCase() + '</span></h3>');
        html.push('<p>' + check.message + '</p>');

        if (check.details && check.details.length > 0) {
            html.push('<div class="details">');
            html.push('<strong>Details:</strong><ul>');

            for (var j = 0; j < Math.min(20, check.details.length); j++) {
                var detail = check.details[j];
                var text = '';

                if (typeof detail === 'string') {
                    text = detail;
                } else if (detail.script) {
                    text = detail.script + ': ' + Math.round(detail.errorRate * 100) + '% error rate (' +
                           detail.errors + '/' + detail.executions + ')';
                } else if (detail.file) {
                    text = detail.file + ': ' + (detail.issue || detail.error);
                } else {
                    text = AIS.JSON.stringify(detail);
                }

                html.push('<li>' + escapeHtml(text) + '</li>');
            }

            if (check.details.length > 20) {
                html.push('<li><em>... and ' + (check.details.length - 20) + ' more</em></li>');
            }

            html.push('</ul></div>');
        }

        html.push('</div>');
    }

    html.push('</body></html>');

    var reportFile = new File(CFG.HEALTH_FOLDER + CFG.HEALTH_REPORT);
    reportFile.encoding = 'UTF-8';
    reportFile.open('w');
    reportFile.write(html.join('\n'));
    reportFile.close();

    reportFile.execute();

    alert('Health Report Generated\n' +
          'Overall Status: ' + results.overall.toUpperCase() + '\n' +
          'Report opened in default browser');
}

/**
 * Escape HTML special characters
 * @param {String} str - String to escape
 * @returns {String} Escaped string
 */
function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// ============================================================================
// ENTRY POINT
// ============================================================================

main();
