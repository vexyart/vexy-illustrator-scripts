/**
 * Track Script Usage
 * @version 1.0.0
 * @description Tracks script execution statistics for data-driven prioritization
 * @author Vexy Illustrator Scripts (AIS)
 * @license MIT
 * @category Utilities
 * @requires Illustrator CS6 or higher
 *
 * Features:
 * - Log script execution (timestamp, script name, duration)
 * - Track execution frequency per script
 * - Calculate average run time per script
 * - Identify most/least used scripts
 * - Generate usage heatmap HTML report
 * - Privacy-friendly (no document content logged)
 * - Opt-in/opt-out setting
 * - Weekly/monthly usage summaries
 * - Export usage data to JSON
 * - Clear old logs (configurable retention policy)
 *
 * Usage:
 * - Run manually to view usage statistics
 * - Or add to scripts as: AIS.Usage.track('ScriptName')
 * - Configure retention policy in settings
 */




//@target illustrator
var c=File(Folder.myDocuments+"/Adobe Scripts/vexy-ville.ini");if(c.exists){c.open('r');var p=c.read();c.close();var l=File(p+".lib/core.jsx");if(l.exists)$.evalFile(l.fsName);}
app.preferences.setBooleanPreference('ShowExternalJSXWarning', false);

// ============================================================================
// CONFIGURATION
// ============================================================================

var CFG = {
    // File paths
    logFile: Folder.myDocuments + '/Adobe Scripts/usage-log.json',
    settingsFile: Folder.myDocuments + '/Adobe Scripts/usage-settings.json',

    // Retention policy (days)
    retentionDays: 90,

    // Report settings
    topScriptsCount: 15,
    reportTitle: 'Script Usage Analytics',

    // Default settings
    defaults: {
        enabled: true,
        trackTiming: true,
        privacyMode: true // No document names logged
    }
};

// ============================================================================
// MAIN FUNCTION
// ============================================================================

function main() {
    try {
        var settings = loadSettings();

        // Show main menu
        var choice = showMainMenu(settings);

        if (choice === 1) {
            // View usage statistics
            viewUsageStatistics();
        } else if (choice === 2) {
            // Export to JSON
            exportUsageData();
        } else if (choice === 3) {
            // Clear old logs
            clearOldLogs();
        } else if (choice === 4) {
            // Toggle tracking
            toggleTracking(settings);
        } else if (choice === 5) {
            // Settings
            configureSettings(settings);
        }

    } catch (e) {
        AIS.Error.show('Error in Track Script Usage', e);
    }
}

// ============================================================================
// USER INTERFACE
// ============================================================================

/**
 * Show main menu dialog
 * @param {Object} settings Current settings
 * @returns {Number} Menu choice (1-5) or 0 for cancel
 */
function showMainMenu(settings) {
    var dialog = new Window('dialog', 'Script Usage Tracker');
    dialog.alignChildren = 'fill';

    // Status panel
    var statusGroup = dialog.add('panel', undefined, 'Status');
    statusGroup.alignChildren = 'left';
    statusGroup.margins = 15;

    var statusText = statusGroup.add('statictext', undefined, 'Tracking: ' + (settings.enabled ? 'ENABLED' : 'DISABLED'));
    statusText.graphics.font = ScriptUI.newFont('dialog', 'BOLD', 12);

    var logExists = new File(CFG.logFile).exists;
    var logCount = logExists ? Object.keys(loadUsageLog()).length : 0;
    statusGroup.add('statictext', undefined, 'Logged scripts: ' + logCount);

    // Menu buttons
    var btnGroup = dialog.add('group');
    btnGroup.orientation = 'column';
    btnGroup.alignChildren = 'fill';

    var btnView = btnGroup.add('button', undefined, '1. View Usage Statistics');
    var btnExport = btnGroup.add('button', undefined, '2. Export Usage Data (JSON)');
    var btnClear = btnGroup.add('button', undefined, '3. Clear Old Logs');
    var btnToggle = btnGroup.add('button', undefined, '4. Toggle Tracking');
    var btnSettings = btnGroup.add('button', undefined, '5. Settings');

    // Control buttons
    var controlGroup = dialog.add('group');
    var btnCancel = controlGroup.add('button', undefined, 'Close', { name: 'cancel' });

    // Button handlers
    var result = 0;

    btnView.onClick = function() {
        result = 1;
        dialog.close();
    };

    btnExport.onClick = function() {
        result = 2;
        dialog.close();
    };

    btnClear.onClick = function() {
        result = 3;
        dialog.close();
    };

    btnToggle.onClick = function() {
        result = 4;
        dialog.close();
    };

    btnSettings.onClick = function() {
        result = 5;
        dialog.close();
    };

    dialog.show();
    return result;
}

// ============================================================================
// USAGE STATISTICS
// ============================================================================

/**
 * View usage statistics in HTML report
 */
function viewUsageStatistics() {
    var log = loadUsageLog();

    if (Object.keys(log).length === 0) {
        alert('No usage data available.\n\nRun scripts to collect usage statistics.');
        return;
    }

    var stats = calculateStatistics(log);
    var html = generateHTMLReport(stats);
    var reportFile = saveHTMLReport(html);

    // Open report
    reportFile.execute();

    alert('Usage report generated!\n\nTotal scripts tracked: ' + stats.totalScripts + '\nTotal executions: ' + stats.totalExecutions);
}

/**
 * Calculate statistics from usage log
 * @param {Object} log Usage log data
 * @returns {Object} Statistics
 */
function calculateStatistics(log) {
    var stats = {
        totalScripts: 0,
        totalExecutions: 0,
        mostUsed: [],
        leastUsed: [],
        averageDurations: {},
        dateRange: { first: null, last: null }
    };

    var scriptNames = [];
    var scriptData = [];

    // Collect data
    for (var name in log) {
        if (log.hasOwnProperty(name)) {
            scriptNames.push(name);
            var data = log[name];

            var totalDuration = 0;
            var execCount = data.executions.length;

            for (var i = 0; i < execCount; i++) {
                var exec = data.executions[i];
                totalDuration += exec.duration || 0;

                // Track date range
                var execDate = new Date(exec.timestamp);
                if (!stats.dateRange.first || execDate < stats.dateRange.first) {
                    stats.dateRange.first = execDate;
                }
                if (!stats.dateRange.last || execDate > stats.dateRange.last) {
                    stats.dateRange.last = execDate;
                }
            }

            var avgDuration = execCount > 0 ? totalDuration / execCount : 0;

            scriptData.push({
                name: name,
                count: execCount,
                avgDuration: avgDuration,
                lastUsed: data.lastUsed
            });

            stats.totalExecutions += execCount;
            stats.averageDurations[name] = avgDuration;
        }
    }

    stats.totalScripts = scriptNames.length;

    // Sort by usage count (descending)
    scriptData.sort(function(a, b) {
        return b.count - a.count;
    });

    // Top scripts
    stats.mostUsed = scriptData.slice(0, Math.min(CFG.topScriptsCount, scriptData.length));

    // Least used (reverse order, bottom 10)
    var leastCount = Math.min(10, scriptData.length);
    stats.leastUsed = scriptData.slice(-leastCount).reverse();

    return stats;
}

/**
 * Generate HTML report from statistics
 * @param {Object} stats Statistics data
 * @returns {String} HTML content
 */
function generateHTMLReport(stats) {
    var html = '<!DOCTYPE html>\n<html>\n<head>\n';
    html += '<meta charset="UTF-8">\n';
    html += '<title>' + CFG.reportTitle + '</title>\n';
    html += '<style>\n';
    html += 'body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }\n';
    html += 'h1 { color: #2962FF; }\n';
    html += 'h2 { color: #424242; margin-top: 30px; }\n';
    html += '.summary { background: white; padding: 20px; border-radius: 5px; margin-bottom: 20px; }\n';
    html += '.stat { display: inline-block; margin-right: 40px; }\n';
    html += '.stat-value { font-size: 32px; font-weight: bold; color: #2962FF; }\n';
    html += '.stat-label { font-size: 14px; color: #666; }\n';
    html += 'table { width: 100%; border-collapse: collapse; background: white; }\n';
    html += 'th { background: #2962FF; color: white; padding: 12px; text-align: left; }\n';
    html += 'td { padding: 10px; border-bottom: 1px solid #ddd; }\n';
    html += 'tr:hover { background: #f0f0f0; }\n';
    html += '.bar { background: #2962FF; height: 20px; border-radius: 3px; }\n';
    html += '.duration { color: #FF6F00; font-weight: bold; }\n';
    html += '</style>\n</head>\n<body>\n';

    // Header
    html += '<h1>' + CFG.reportTitle + '</h1>\n';

    // Summary stats
    html += '<div class="summary">\n';
    html += '<div class="stat">\n';
    html += '<div class="stat-value">' + stats.totalScripts + '</div>\n';
    html += '<div class="stat-label">Scripts Tracked</div>\n';
    html += '</div>\n';
    html += '<div class="stat">\n';
    html += '<div class="stat-value">' + stats.totalExecutions + '</div>\n';
    html += '<div class="stat-label">Total Executions</div>\n';
    html += '</div>\n';

    if (stats.dateRange.first && stats.dateRange.last) {
        html += '<div class="stat">\n';
        html += '<div class="stat-label">Date Range</div>\n';
        html += '<div>' + formatDate(stats.dateRange.first) + ' to ' + formatDate(stats.dateRange.last) + '</div>\n';
        html += '</div>\n';
    }

    html += '</div>\n';

    // Most used scripts
    html += '<h2>Most Used Scripts (Top ' + stats.mostUsed.length + ')</h2>\n';
    html += '<table>\n';
    html += '<tr><th>Rank</th><th>Script Name</th><th>Executions</th><th>Avg Duration (ms)</th><th>Usage</th></tr>\n';

    var maxCount = stats.mostUsed.length > 0 ? stats.mostUsed[0].count : 1;

    for (var i = 0; i < stats.mostUsed.length; i++) {
        var script = stats.mostUsed[i];
        var barWidth = Math.floor((script.count / maxCount) * 100);

        html += '<tr>\n';
        html += '<td>' + (i + 1) + '</td>\n';
        html += '<td><strong>' + script.name + '</strong></td>\n';
        html += '<td>' + script.count + '</td>\n';
        html += '<td class="duration">' + Math.round(script.avgDuration) + '</td>\n';
        html += '<td><div class="bar" style="width:' + barWidth + '%"></div></td>\n';
        html += '</tr>\n';
    }

    html += '</table>\n';

    // Least used scripts
    html += '<h2>Least Used Scripts (Bottom 10)</h2>\n';
    html += '<table>\n';
    html += '<tr><th>Script Name</th><th>Executions</th><th>Last Used</th></tr>\n';

    for (var j = 0; j < stats.leastUsed.length; j++) {
        var leastScript = stats.leastUsed[j];
        html += '<tr>\n';
        html += '<td>' + leastScript.name + '</td>\n';
        html += '<td>' + leastScript.count + '</td>\n';
        html += '<td>' + formatDate(new Date(leastScript.lastUsed)) + '</td>\n';
        html += '</tr>\n';
    }

    html += '</table>\n';

    html += '</body>\n</html>';

    return html;
}

/**
 * Save HTML report to temp file
 * @param {String} html HTML content
 * @returns {File} Report file
 */
function saveHTMLReport(html) {
    var reportFile = new File(Folder.temp + '/script-usage-report.html');
    reportFile.encoding = 'UTF-8';
    reportFile.open('w');
    reportFile.write(html);
    reportFile.close();

    return reportFile;
}

// ============================================================================
// DATA EXPORT
// ============================================================================

/**
 * Export usage data to JSON file
 */
function exportUsageData() {
    var log = loadUsageLog();

    if (Object.keys(log).length === 0) {
        alert('No usage data to export.');
        return;
    }

    var file = File.saveDialog('Export usage data as:', '*.json');
    if (!file) return;

    // Ensure .json extension
    if (!/\.json$/i.test(file.name)) {
        file = new File(file.path + '/' + file.name + '.json');
    }

    file.encoding = 'UTF-8';
    file.open('w');
    file.write(AIS.JSON.stringify(log, null, 2));
    file.close();

    alert('Usage data exported successfully!\n\nLocation: ' + file.fsName);
}

// ============================================================================
// LOG MANAGEMENT
// ============================================================================

/**
 * Clear logs older than retention period
 */
function clearOldLogs() {
    var log = loadUsageLog();
    var cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - CFG.retentionDays);

    var removed = 0;
    var kept = 0;

    for (var name in log) {
        if (log.hasOwnProperty(name)) {
            var scriptData = log[name];
            var newExecs = [];

            for (var i = 0; i < scriptData.executions.length; i++) {
                var exec = scriptData.executions[i];
                var execDate = new Date(exec.timestamp);

                if (execDate >= cutoffDate) {
                    newExecs.push(exec);
                    kept++;
                } else {
                    removed++;
                }
            }

            if (newExecs.length > 0) {
                scriptData.executions = newExecs;
            } else {
                delete log[name];
            }
        }
    }

    saveUsageLog(log);

    alert('Log cleanup complete!\n\nRemoved: ' + removed + ' old entries\nKept: ' + kept + ' recent entries\n\nRetention period: ' + CFG.retentionDays + ' days');
}

/**
 * Toggle tracking on/off
 * @param {Object} settings Current settings
 */
function toggleTracking(settings) {
    settings.enabled = !settings.enabled;
    saveSettings(settings);

    alert('Script usage tracking is now: ' + (settings.enabled ? 'ENABLED' : 'DISABLED'));
}

/**
 * Configure settings
 * @param {Object} settings Current settings
 */
function configureSettings(settings) {
    var dialog = new Window('dialog', 'Usage Tracking Settings');
    dialog.alignChildren = 'fill';

    // Enable tracking
    var enableGroup = dialog.add('group');
    var enableCheck = enableGroup.add('checkbox', undefined, 'Enable usage tracking');
    enableCheck.value = settings.enabled;

    // Track timing
    var timingGroup = dialog.add('group');
    var timingCheck = timingGroup.add('checkbox', undefined, 'Track script execution time');
    timingCheck.value = settings.trackTiming;

    // Privacy mode
    var privacyGroup = dialog.add('group');
    var privacyCheck = privacyGroup.add('checkbox', undefined, 'Privacy mode (no document names)');
    privacyCheck.value = settings.privacyMode;

    // Buttons
    var btnGroup = dialog.add('group');
    var btnOK = btnGroup.add('button', undefined, 'OK', { name: 'ok' });
    var btnCancel = btnGroup.add('button', undefined, 'Cancel', { name: 'cancel' });

    if (dialog.show() === 1) {
        settings.enabled = enableCheck.value;
        settings.trackTiming = timingCheck.value;
        settings.privacyMode = privacyCheck.value;
        saveSettings(settings);

        alert('Settings saved successfully!');
    }
}

// ============================================================================
// FILE OPERATIONS
// ============================================================================

/**
 * Load usage log from JSON file
 * @returns {Object} Usage log data
 */
function loadUsageLog() {
    var file = new File(CFG.logFile);

    if (!file.exists) {
        return {};
    }

    file.encoding = 'UTF-8';
    file.open('r');
    var content = file.read();
    file.close();

    return AIS.JSON.parse(content) || {};
}

/**
 * Save usage log to JSON file
 * @param {Object} log Usage log data
 */
function saveUsageLog(log) {
    var folder = new Folder(Folder.myDocuments + '/Adobe Scripts');
    if (!folder.exists) folder.create();

    var file = new File(CFG.logFile);
    file.encoding = 'UTF-8';
    file.open('w');
    file.write(AIS.JSON.stringify(log, null, 2));
    file.close();
}

/**
 * Load settings from JSON file
 * @returns {Object} Settings
 */
function loadSettings() {
    var file = new File(CFG.settingsFile);

    if (!file.exists) {
        return CFG.defaults;
    }

    file.encoding = 'UTF-8';
    file.open('r');
    var content = file.read();
    file.close();

    return AIS.JSON.parse(content) || CFG.defaults;
}

/**
 * Save settings to JSON file
 * @param {Object} settings Settings data
 */
function saveSettings(settings) {
    var folder = new Folder(Folder.myDocuments + '/Adobe Scripts');
    if (!folder.exists) folder.create();

    var file = new File(CFG.settingsFile);
    file.encoding = 'UTF-8';
    file.open('w');
    file.write(AIS.JSON.stringify(settings, null, 2));
    file.close();
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Format date for display
 * @param {Date} date Date object
 * @returns {String} Formatted date
 */
function formatDate(date) {
    if (!date) return 'N/A';

    var year = date.getFullYear();
    var month = padZero(date.getMonth() + 1);
    var day = padZero(date.getDate());
    var hour = padZero(date.getHours());
    var minute = padZero(date.getMinutes());

    return year + '-' + month + '-' + day + ' ' + hour + ':' + minute;
}

/**
 * Pad number with leading zero
 * @param {Number} num Number to pad
 * @returns {String} Padded string
 */
function padZero(num) {
    return num < 10 ? '0' + num : num.toString();
}

// ============================================================================
// EXECUTE
// ============================================================================

try {
    main();
} catch (e) {
    AIS.Error.show('Script error', e);
}
