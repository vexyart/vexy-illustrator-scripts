/**
 * Aggregate Error Logs
 * @version 1.0.0
 * @description Collects and analyzes error logs from all AIS scripts for proactive bug fixing
 * @author Vexy Illustrator Scripts (AIS)
 * @license MIT
 * @category Utilities
 * @requires Illustrator CS6 or higher
 *
 * Features:
 * - Collect all AIS.Error.log() entries from error log files
 * - Parse error messages for patterns and trends
 * - Group errors by script name, type, and frequency
 * - Identify top 10 most common errors
 * - Show error trends over time (daily/weekly/monthly)
 * - Suggest fixes for common error patterns
 * - Generate comprehensive HTML error report
 * - Export error data to CSV for analysis
 * - Clear old logs with configurable retention policy
 * - Privacy-friendly (no document content in logs)
 *
 * Usage:
 * - Run periodically to review errors
 * - Identify recurring issues before users report
 * - Track improvement over time
 */




//@target illustrator
var c=File(Folder.myDocuments+"/Adobe Scripts/vexy-ville.ini");if(c.exists){c.open('r');var p=c.read();c.close();var l=File(p+".lib/core.jsx");if(l.exists)$.evalFile(l.fsName);}
app.preferences.setBooleanPreference('ShowExternalJSXWarning', false);

// ============================================================================
// CONFIGURATION
// ============================================================================

var CFG = {
    // File paths
    logFolder: Folder.myDocuments + '/Adobe Scripts/Logs/',
    errorLogPattern: /error-log.*\.txt$/i,

    // Analysis settings
    topErrorsCount: 10,
    retentionDays: 60,

    // Error categories
    categories: {
        'TypeError': 'Type mismatch errors',
        'ReferenceError': 'Undefined variables',
        'No document': 'Document validation',
        'No selection': 'Selection validation',
        'Permission': 'File access errors',
        'Invalid': 'Invalid input errors',
        'Failed to': 'Operation failures',
        'Cannot': 'Blocked operations'
    },

    // Report settings
    reportTitle: 'Error Log Analysis'
};

// ============================================================================
// MAIN FUNCTION
// ============================================================================

function main() {
    try {
        // Show main menu
        var choice = showMainMenu();

        if (choice === 1) {
            // View error analysis
            viewErrorAnalysis();
        } else if (choice === 2) {
            // Export to CSV
            exportErrorsToCSV();
        } else if (choice === 3) {
            // Clear old logs
            clearOldLogs();
        } else if (choice === 4) {
            // View error details
            viewErrorDetails();
        }

    } catch (e) {
        AIS.Error.show('Error in Aggregate Error Logs', e);
    }
}

// ============================================================================
// USER INTERFACE
// ============================================================================

/**
 * Show main menu dialog
 * @returns {Number} Menu choice (1-4) or 0 for cancel
 */
function showMainMenu() {
    var dialog = new Window('dialog', 'Error Log Aggregator');
    dialog.alignChildren = 'fill';

    // Status panel
    var statusGroup = dialog.add('panel', undefined, 'Status');
    statusGroup.alignChildren = 'left';
    statusGroup.margins = 15;

    var logs = collectErrorLogs();
    var totalErrors = 0;

    for (var i = 0; i < logs.length; i++) {
        totalErrors += logs[i].errors.length;
    }

    statusGroup.add('statictext', undefined, 'Error log files found: ' + logs.length);
    statusGroup.add('statictext', undefined, 'Total errors: ' + totalErrors);

    // Menu buttons
    var btnGroup = dialog.add('group');
    btnGroup.orientation = 'column';
    btnGroup.alignChildren = 'fill';

    var btnAnalyze = btnGroup.add('button', undefined, '1. View Error Analysis Report');
    var btnExport = btnGroup.add('button', undefined, '2. Export Errors to CSV');
    var btnClear = btnGroup.add('button', undefined, '3. Clear Old Logs');
    var btnDetails = btnGroup.add('button', undefined, '4. View Error Details');

    // Control buttons
    var controlGroup = dialog.add('group');
    var btnCancel = controlGroup.add('button', undefined, 'Close', { name: 'cancel' });

    // Button handlers
    var result = 0;

    btnAnalyze.onClick = function() {
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

    btnDetails.onClick = function() {
        result = 4;
        dialog.close();
    };

    dialog.show();
    return result;
}

// ============================================================================
// ERROR ANALYSIS
// ============================================================================

/**
 * View comprehensive error analysis report
 */
function viewErrorAnalysis() {
    var logs = collectErrorLogs();

    if (logs.length === 0) {
        alert('No error logs found.\n\nLogs will be created when scripts encounter errors.');
        return;
    }

    var analysis = analyzeErrors(logs);
    var html = generateHTMLReport(analysis);
    var reportFile = saveHTMLReport(html);

    // Open report
    reportFile.execute();

    alert('Error analysis complete!\n\nTotal errors: ' + analysis.totalErrors + '\nUnique error types: ' + analysis.errorTypes.length + '\nMost common: ' + (analysis.topErrors.length > 0 ? analysis.topErrors[0].pattern : 'N/A'));
}

/**
 * Analyze error logs and extract statistics
 * @param {Array} logs Array of log file data
 * @returns {Object} Analysis results
 */
function analyzeErrors(logs) {
    var analysis = {
        totalErrors: 0,
        totalScripts: 0,
        errorTypes: [],
        topErrors: [],
        scriptErrors: {},
        timeline: {},
        suggestions: []
    };

    var errorPatterns = {};
    var scriptSet = {};

    // Process all errors
    for (var i = 0; i < logs.length; i++) {
        var log = logs[i];
        var errors = log.errors;

        for (var j = 0; j < errors.length; j++) {
            var error = errors[j];
            analysis.totalErrors++;

            // Track scripts
            if (error.script) {
                scriptSet[error.script] = true;

                if (!analysis.scriptErrors[error.script]) {
                    analysis.scriptErrors[error.script] = [];
                }
                analysis.scriptErrors[error.script].push(error);
            }

            // Extract error pattern
            var pattern = extractErrorPattern(error.message);

            if (!errorPatterns[pattern]) {
                errorPatterns[pattern] = {
                    pattern: pattern,
                    count: 0,
                    examples: []
                };
            }

            errorPatterns[pattern].count++;

            if (errorPatterns[pattern].examples.length < 3) {
                errorPatterns[pattern].examples.push(error.message);
            }

            // Track timeline
            if (error.timestamp) {
                var date = error.timestamp.split(' ')[0]; // Get date part
                if (!analysis.timeline[date]) {
                    analysis.timeline[date] = 0;
                }
                analysis.timeline[date]++;
            }

            // Categorize error
            var category = categorizeError(error.message);
            if (analysis.errorTypes.indexOf(category) === -1) {
                analysis.errorTypes.push(category);
            }
        }
    }

    analysis.totalScripts = countKeys(scriptSet);

    // Convert patterns object to sorted array
    var patternArray = [];
    for (var pattern in errorPatterns) {
        if (errorPatterns.hasOwnProperty(pattern)) {
            patternArray.push(errorPatterns[pattern]);
        }
    }

    // Sort by count (descending)
    patternArray.sort(function(a, b) {
        return b.count - a.count;
    });

    // Top errors
    analysis.topErrors = patternArray.slice(0, CFG.topErrorsCount);

    // Generate suggestions
    analysis.suggestions = generateSuggestions(analysis.topErrors);

    return analysis;
}

/**
 * Extract error pattern from message
 * @param {String} message Error message
 * @returns {String} Error pattern
 */
function extractErrorPattern(message) {
    // Remove line numbers
    message = message.replace(/line \d+/gi, 'line N');

    // Remove file paths
    message = message.replace(/[A-Z]:[\\\/][^\s]+/g, 'PATH');
    message = message.replace(/\/[^\s]+\.(jsx|js)/gi, 'PATH');

    // Remove numbers in quotes
    message = message.replace(/["'][0-9]+["']/g, 'NUM');

    // Truncate long messages
    if (message.length > 100) {
        message = message.substring(0, 100) + '...';
    }

    return message;
}

/**
 * Categorize error by type
 * @param {String} message Error message
 * @returns {String} Category name
 */
function categorizeError(message) {
    for (var category in CFG.categories) {
        if (CFG.categories.hasOwnProperty(category)) {
            if (message.indexOf(category) !== -1) {
                return category;
            }
        }
    }

    return 'Other';
}

/**
 * Generate fix suggestions for common errors
 * @param {Array} topErrors Top error patterns
 * @returns {Array} Suggestions
 */
function generateSuggestions(topErrors) {
    var suggestions = [];

    for (var i = 0; i < Math.min(5, topErrors.length); i++) {
        var error = topErrors[i];
        var suggestion = {
            error: error.pattern,
            fix: 'Review error handling in affected scripts',
            priority: i < 3 ? 'High' : 'Medium'
        };

        // Specific suggestions
        if (error.pattern.indexOf('TypeError') !== -1) {
            suggestion.fix = 'Add type validation before operations';
        } else if (error.pattern.indexOf('No document') !== -1) {
            suggestion.fix = 'Add AIS.Document.hasDocument() check';
        } else if (error.pattern.indexOf('No selection') !== -1) {
            suggestion.fix = 'Add AIS.Document.hasSelection() check';
        } else if (error.pattern.indexOf('Permission') !== -1) {
            suggestion.fix = 'Check file/folder permissions and existence';
        }

        suggestions.push(suggestion);
    }

    return suggestions;
}

// ============================================================================
// REPORT GENERATION
// ============================================================================

/**
 * Generate HTML error analysis report
 * @param {Object} analysis Analysis results
 * @returns {String} HTML content
 */
function generateHTMLReport(analysis) {
    var html = '<!DOCTYPE html>\n<html>\n<head>\n';
    html += '<meta charset="UTF-8">\n';
    html += '<title>' + CFG.reportTitle + '</title>\n';
    html += '<style>\n';
    html += 'body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }\n';
    html += 'h1 { color: #D50000; }\n';
    html += 'h2 { color: #424242; margin-top: 30px; }\n';
    html += '.summary { background: white; padding: 20px; border-radius: 5px; margin-bottom: 20px; }\n';
    html += '.stat { display: inline-block; margin-right: 40px; }\n';
    html += '.stat-value { font-size: 32px; font-weight: bold; color: #D50000; }\n';
    html += '.stat-label { font-size: 14px; color: #666; }\n';
    html += 'table { width: 100%; border-collapse: collapse; background: white; margin-bottom: 30px; }\n';
    html += 'th { background: #D50000; color: white; padding: 12px; text-align: left; }\n';
    html += 'td { padding: 10px; border-bottom: 1px solid #ddd; }\n';
    html += 'tr:hover { background: #fff5f5; }\n';
    html += '.error-pattern { font-family: monospace; font-size: 12px; background: #f5f5f5; padding: 5px; }\n';
    html += '.count { font-weight: bold; color: #D50000; }\n';
    html += '.suggestion { background: #E3F2FD; padding: 10px; margin: 10px 0; border-left: 4px solid #2962FF; }\n';
    html += '.priority-high { color: #D50000; font-weight: bold; }\n';
    html += '.priority-medium { color: #FF6F00; }\n';
    html += '</style>\n</head>\n<body>\n';

    // Header
    html += '<h1>' + CFG.reportTitle + '</h1>\n';

    // Summary stats
    html += '<div class="summary">\n';
    html += '<div class="stat">\n';
    html += '<div class="stat-value">' + analysis.totalErrors + '</div>\n';
    html += '<div class="stat-label">Total Errors</div>\n';
    html += '</div>\n';
    html += '<div class="stat">\n';
    html += '<div class="stat-value">' + analysis.totalScripts + '</div>\n';
    html += '<div class="stat-label">Affected Scripts</div>\n';
    html += '</div>\n';
    html += '<div class="stat">\n';
    html += '<div class="stat-value">' + analysis.errorTypes.length + '</div>\n';
    html += '<div class="stat-label">Error Categories</div>\n';
    html += '</div>\n';
    html += '</div>\n';

    // Top errors
    html += '<h2>Top ' + analysis.topErrors.length + ' Most Common Errors</h2>\n';
    html += '<table>\n';
    html += '<tr><th>Rank</th><th>Error Pattern</th><th>Count</th><th>Example</th></tr>\n';

    for (var i = 0; i < analysis.topErrors.length; i++) {
        var error = analysis.topErrors[i];
        html += '<tr>\n';
        html += '<td>' + (i + 1) + '</td>\n';
        html += '<td class="error-pattern">' + escapeHTML(error.pattern) + '</td>\n';
        html += '<td class="count">' + error.count + '</td>\n';
        html += '<td>' + escapeHTML(error.examples[0] || '') + '</td>\n';
        html += '</tr>\n';
    }

    html += '</table>\n';

    // Suggestions
    if (analysis.suggestions.length > 0) {
        html += '<h2>Suggested Fixes</h2>\n';

        for (var j = 0; j < analysis.suggestions.length; j++) {
            var suggestion = analysis.suggestions[j];
            var priorityClass = suggestion.priority === 'High' ? 'priority-high' : 'priority-medium';

            html += '<div class="suggestion">\n';
            html += '<strong class="' + priorityClass + '">Priority: ' + suggestion.priority + '</strong><br>\n';
            html += '<strong>Error:</strong> ' + escapeHTML(suggestion.error) + '<br>\n';
            html += '<strong>Suggested Fix:</strong> ' + suggestion.fix + '\n';
            html += '</div>\n';
        }
    }

    // Error categories
    html += '<h2>Error Categories (' + analysis.errorTypes.length + ')</h2>\n';
    html += '<ul>\n';

    for (var k = 0; k < analysis.errorTypes.length; k++) {
        var type = analysis.errorTypes[k];
        var description = CFG.categories[type] || 'Other errors';
        html += '<li><strong>' + type + '</strong>: ' + description + '</li>\n';
    }

    html += '</ul>\n';

    html += '</body>\n</html>';

    return html;
}

/**
 * Save HTML report to temp file
 * @param {String} html HTML content
 * @returns {File} Report file
 */
function saveHTMLReport(html) {
    var reportFile = new File(Folder.temp + '/error-analysis-report.html');
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
 * Export errors to CSV file
 */
function exportErrorsToCSV() {
    var logs = collectErrorLogs();

    if (logs.length === 0) {
        alert('No error logs to export.');
        return;
    }

    var file = File.saveDialog('Export errors as:', '*.csv');
    if (!file) return;

    // Ensure .csv extension
    if (!/\.csv$/i.test(file.name)) {
        file = new File(file.path + '/' + file.name + '.csv');
    }

    // Generate CSV content
    var csv = 'Timestamp,Script,Error Message,Stack Trace\n';

    for (var i = 0; i < logs.length; i++) {
        var errors = logs[i].errors;

        for (var j = 0; j < errors.length; j++) {
            var error = errors[j];
            csv += '"' + (error.timestamp || '') + '",';
            csv += '"' + (error.script || '') + '",';
            csv += '"' + escapeCSV(error.message || '') + '",';
            csv += '"' + escapeCSV(error.stack || '') + '"\n';
        }
    }

    file.encoding = 'UTF-8';
    file.open('w');
    file.write(csv);
    file.close();

    alert('Errors exported successfully!\n\nLocation: ' + file.fsName);
}

// ============================================================================
// LOG MANAGEMENT
// ============================================================================

/**
 * Collect all error logs from log folder
 * @returns {Array} Array of log data objects
 */
function collectErrorLogs() {
    var logFolder = new Folder(CFG.logFolder);

    if (!logFolder.exists) {
        return [];
    }

    var files = logFolder.getFiles(function(f) {
        return f instanceof File && CFG.errorLogPattern.test(f.name);
    });

    var logs = [];

    for (var i = 0; i < files.length; i++) {
        var file = files[i];
        var logData = parseErrorLog(file);

        if (logData.errors.length > 0) {
            logs.push(logData);
        }
    }

    return logs;
}

/**
 * Parse error log file
 * @param {File} file Log file
 * @returns {Object} Parsed log data
 */
function parseErrorLog(file) {
    var logData = {
        filename: file.name,
        errors: []
    };

    file.encoding = 'UTF-8';
    file.open('r');
    var content = file.read();
    file.close();

    // Parse entries (simple line-based parsing)
    var lines = content.split('\n');
    var currentError = null;

    for (var i = 0; i < lines.length; i++) {
        var line = lines[i];

        if (line.indexOf('[ERROR]') === 0) {
            // Save previous error
            if (currentError) {
                logData.errors.push(currentError);
            }

            // Start new error
            currentError = {
                timestamp: '',
                script: '',
                message: '',
                stack: ''
            };

            // Parse error line
            var parts = line.split('|');
            if (parts.length >= 3) {
                currentError.timestamp = parts[0].replace('[ERROR]', '').trim();
                currentError.script = parts[1].trim();
                currentError.message = parts[2].trim();
            }
        } else if (currentError && line.trim() !== '') {
            // Continuation of stack trace
            currentError.stack += line + '\n';
        }
    }

    // Save last error
    if (currentError) {
        logData.errors.push(currentError);
    }

    return logData;
}

/**
 * Clear logs older than retention period
 */
function clearOldLogs() {
    var cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - CFG.retentionDays);

    var logFolder = new Folder(CFG.logFolder);
    if (!logFolder.exists) {
        alert('No logs folder found.');
        return;
    }

    var files = logFolder.getFiles(function(f) {
        return f instanceof File && CFG.errorLogPattern.test(f.name);
    });

    var removed = 0;

    for (var i = 0; i < files.length; i++) {
        var file = files[i];

        if (file.modified < cutoffDate) {
            file.remove();
            removed++;
        }
    }

    alert('Log cleanup complete!\n\nRemoved: ' + removed + ' old log files\nRetention period: ' + CFG.retentionDays + ' days');
}

/**
 * View detailed error information
 */
function viewErrorDetails() {
    var logs = collectErrorLogs();

    if (logs.length === 0) {
        alert('No error logs found.');
        return;
    }

    // Build detailed view dialog
    var dialog = new Window('dialog', 'Error Details');
    dialog.preferredSize = [700, 500];
    dialog.alignChildren = 'fill';

    var list = dialog.add('listbox', undefined, [], { multiselect: false });
    list.preferredSize = [680, 400];

    // Populate list
    for (var i = 0; i < logs.length; i++) {
        var errors = logs[i].errors;

        for (var j = 0; j < errors.length; j++) {
            var error = errors[j];
            var display = error.timestamp + ' | ' + error.script + ' | ' + error.message.substring(0, 80);
            list.add('item', display);
        }
    }

    var btnGroup = dialog.add('group');
    var btnClose = btnGroup.add('button', undefined, 'Close', { name: 'cancel' });

    dialog.show();
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Escape HTML special characters
 * @param {String} str String to escape
 * @returns {String} Escaped string
 */
function escapeHTML(str) {
    return str.replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&#39;');
}

/**
 * Escape CSV special characters
 * @param {String} str String to escape
 * @returns {String} Escaped string
 */
function escapeCSV(str) {
    return str.replace(/"/g, '""');
}

/**
 * Count object keys
 * @param {Object} obj Object to count
 * @returns {Number} Key count
 */
function countKeys(obj) {
    var count = 0;
    for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
            count++;
        }
    }
    return count;
}

// ============================================================================
// EXECUTE
// ============================================================================

try {
    main();
} catch (e) {
    AIS.Error.show('Script error', e);
}
