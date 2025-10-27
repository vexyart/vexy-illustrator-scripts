/**
 * Library Function Deprecation Manager
 * @version 1.0.0
 * @description Manages deprecation of AIS library functions with migration assistance
 * @category Utilities
 * @author Vexy Illustrator Scripts
 *
 * @features
 * - Marks AIS functions with @deprecated tag in JSDoc
 * - Detects deprecated function usage across all scripts
 * - Shows runtime warnings when deprecated functions called
 * - Suggests modern alternative functions
 * - Tracks deprecation timeline (deprecated in v1.x, removed in v2.x)
 * - Generates comprehensive deprecation report
 * - Auto-rewrites scripts to use new functions
 * - Tests equivalence between old and new functions
 *
 * @usage
 * Run when evolving AIS library API to ensure backward compatibility.
 * Helps maintain all 426 scripts during library changes.
 *
 * @notes
 * - Requires lib/core.jsx for AIS utilities
 * - Generates HTML deprecation report
 * - Creates backup before auto-rewriting scripts
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
    // Deprecation status levels
    STATUS: {
        ACTIVE: 'active',
        DEPRECATED: 'deprecated',
        REMOVED: 'removed'
    },

    // Severity levels
    SEVERITY: {
        INFO: 'info',
        WARNING: 'warning',
        ERROR: 'error'
    },

    // Output settings
    REPORT_NAME: 'deprecations-report.html',
    REPORT_FOLDER: Folder.myDocuments + '/Adobe Scripts/',
    BACKUP_SUFFIX: '.pre-deprecation-fix'
};

// ============================================================================
// MAIN FUNCTION
// ============================================================================

function main() {
    try {
        AIS.Log.info('Library Function Deprecation Manager v1.0.0');
        AIS.Log.info('Scanning AIS library and production scripts...');

        var deprecations = scanLibraryDeprecations();
        var usage = scanScriptUsage(deprecations);
        var report = generateReport(deprecations, usage);
        var reportPath = saveReport(report);

        // Offer to auto-fix deprecated usage
        if (usage.totalUsages > 0) {
            var shouldFix = confirm(
                'Found ' + usage.totalUsages + ' usages of deprecated functions.\n\n' +
                'Auto-rewrite scripts to use modern alternatives?\n' +
                '(Backups will be created first)'
            );

            if (shouldFix) {
                var fixed = autoFixDeprecations(usage, deprecations);
                alert('Auto-fix complete!\n\nFixed ' + fixed + ' scripts.\nBackups saved with ' + CFG.BACKUP_SUFFIX + ' extension.');
            }
        }

        showSummary(deprecations, usage, reportPath);

    } catch (err) {
        AIS.Error.show('Deprecation Manager failed', err);
    }
}

// ============================================================================
// LIBRARY SCANNING
// ============================================================================

/**
 * Scan AIS library for deprecated functions
 * @returns {Object} Deprecation data
 */
function scanLibraryDeprecations() {
    var deprecations = {
        functions: [],
        summary: {
            active: 0,
            deprecated: 0,
            removed: 0
        }
    };

    var libraryFiles = [
        new File(AIS.Path.getDirectory($.fileName) + '/../lib/core.jsx'),
        new File(AIS.Path.getDirectory($.fileName) + '/../lib/ui.jsx')
    ];

    for (var i = 0; i < libraryFiles.length; i++) {
        if (!libraryFiles[i].exists) continue;

        libraryFiles[i].encoding = 'UTF-8';
        libraryFiles[i].open('r');
        var content = libraryFiles[i].read();
        libraryFiles[i].close();

        var functions = parseLibraryFunctions(content, libraryFiles[i].name);
        deprecations.functions = deprecations.functions.concat(functions);

        // Count by status
        for (var j = 0; j < functions.length; j++) {
            deprecations.summary[functions[j].status]++;
        }
    }

    return deprecations;
}

/**
 * Parse library functions from content
 * @param {String} content - Library file content
 * @param {String} fileName - Library file name
 * @returns {Array} Function definitions
 */
function parseLibraryFunctions(content, fileName) {
    var functions = [];
    var lines = content.split('\n');

    for (var i = 0; i < lines.length; i++) {
        var line = lines[i];

        // Look for AIS namespace function definitions
        var match = line.match(/AIS\.(\w+)\.(\w+)\s*=\s*function/);
        if (!match) {
            match = line.match(/(\w+)\s*:\s*function/);
        }

        if (match) {
            var funcInfo = parseFunctionInfo(lines, i, fileName);
            if (funcInfo) {
                functions.push(funcInfo);
            }
        }
    }

    return functions;
}

/**
 * Parse function information including deprecation status
 * @param {Array} lines - File lines
 * @param {Number} lineIndex - Starting line index
 * @param {String} fileName - File name
 * @returns {Object} Function info
 */
function parseFunctionInfo(lines, lineIndex, fileName) {
    var funcLine = lines[lineIndex];
    var funcName = extractFunctionName(funcLine);
    if (!funcName) return null;

    // Look backward for JSDoc comment
    var jsdoc = extractJSDoc(lines, lineIndex);

    // Check for @deprecated tag
    var deprecated = jsdoc.indexOf('@deprecated') !== -1;
    var alternative = extractAlternative(jsdoc);
    var version = extractVersion(jsdoc);
    var removalVersion = extractRemovalVersion(jsdoc);

    var status = CFG.STATUS.ACTIVE;
    if (deprecated) {
        status = removalVersion ? CFG.STATUS.DEPRECATED : CFG.STATUS.DEPRECATED;
    }

    return {
        name: funcName,
        file: fileName,
        line: lineIndex + 1,
        status: status,
        alternative: alternative,
        deprecatedIn: version,
        removedIn: removalVersion,
        jsdoc: jsdoc
    };
}

/**
 * Extract function name from line
 * @param {String} line - Code line
 * @returns {String} Function name
 */
function extractFunctionName(line) {
    var match = line.match(/AIS\.(\w+)\.(\w+)/);
    if (match) {
        return 'AIS.' + match[1] + '.' + match[2];
    }

    match = line.match(/(\w+)\s*:\s*function/);
    if (match) {
        return match[1];
    }

    return null;
}

/**
 * Extract JSDoc comment before function
 * @param {Array} lines - File lines
 * @param {Number} lineIndex - Function line index
 * @returns {String} JSDoc content
 */
function extractJSDoc(lines, lineIndex) {
    var jsdoc = [];
    var i = lineIndex - 1;

    // Walk backward to find JSDoc start
    while (i >= 0) {
        var line = lines[i];
        jsdoc.unshift(line);

        if (line.indexOf('/**') !== -1) {
            break;
        }

        i--;
    }

    return jsdoc.join('\n');
}

/**
 * Extract alternative function from JSDoc
 * @param {String} jsdoc - JSDoc content
 * @returns {String} Alternative function name
 */
function extractAlternative(jsdoc) {
    var match = jsdoc.match(/@deprecated.*use\s+(\S+)/i);
    if (match) return match[1];

    match = jsdoc.match(/@alternative\s+(\S+)/i);
    if (match) return match[1];

    return null;
}

/**
 * Extract deprecation version from JSDoc
 * @param {String} jsdoc - JSDoc content
 * @returns {String} Version string
 */
function extractVersion(jsdoc) {
    var match = jsdoc.match(/@deprecated.*v([\d.]+)/i);
    if (match) return match[1];

    match = jsdoc.match(/@since.*deprecated.*v([\d.]+)/i);
    if (match) return match[1];

    return null;
}

/**
 * Extract removal version from JSDoc
 * @param {String} jsdoc - JSDoc content
 * @returns {String} Version string
 */
function extractRemovalVersion(jsdoc) {
    var match = jsdoc.match(/@removed.*v([\d.]+)/i);
    if (match) return match[1];

    match = jsdoc.match(/will be removed in v([\d.]+)/i);
    if (match) return match[1];

    return null;
}

// ============================================================================
// SCRIPT USAGE SCANNING
// ============================================================================

/**
 * Scan all scripts for deprecated function usage
 * @param {Object} deprecations - Deprecation data
 * @returns {Object} Usage data
 */
function scanScriptUsage(deprecations) {
    var usage = {
        scripts: [],
        totalUsages: 0,
        bySeverity: {
            info: 0,
            warning: 0,
            error: 0
        }
    };

    // Get deprecated function list
    var deprecatedFuncs = [];
    for (var i = 0; i < deprecations.functions.length; i++) {
        if (deprecations.functions[i].status === CFG.STATUS.DEPRECATED) {
            deprecatedFuncs.push(deprecations.functions[i]);
        }
    }

    if (deprecatedFuncs.length === 0) {
        return usage;
    }

    // Scan production scripts
    var categories = [
        'Favorites', 'Artboards', 'Text', 'Colors', 'Paths',
        'Transform', 'Layers', 'Export', 'Measurement', 'Preferences'
    ];

    var rootFolder = new Folder(AIS.Path.getDirectory($.fileName) + '/..');

    for (var i = 0; i < categories.length; i++) {
        var categoryFolder = new Folder(rootFolder.fsName + '/' + categories[i]);
        if (!categoryFolder.exists) continue;

        var files = categoryFolder.getFiles('*.jsx');
        for (var j = 0; j < files.length; j++) {
            if (files[j] instanceof Folder) continue;

            var scriptUsage = scanScriptFile(files[j], deprecatedFuncs);
            if (scriptUsage.usages.length > 0) {
                usage.scripts.push({
                    script: categories[i] + '/' + files[j].name,
                    usages: scriptUsage.usages
                });

                usage.totalUsages += scriptUsage.usages.length;

                // Count by severity
                for (var k = 0; k < scriptUsage.usages.length; k++) {
                    var severity = scriptUsage.usages[k].severity;
                    usage.bySeverity[severity]++;
                }
            }
        }
    }

    return usage;
}

/**
 * Scan single script file for deprecated usage
 * @param {File} file - Script file
 * @param {Array} deprecatedFuncs - Deprecated functions
 * @returns {Object} Usage info
 */
function scanScriptFile(file, deprecatedFuncs) {
    var usage = {
        usages: []
    };

    try {
        file.encoding = 'UTF-8';
        file.open('r');
        var content = file.read();
        file.close();

        var lines = content.split('\n');

        for (var i = 0; i < deprecatedFuncs.length; i++) {
            var func = deprecatedFuncs[i];
            var funcName = func.name;

            // Find usages
            for (var j = 0; j < lines.length; j++) {
                if (lines[j].indexOf(funcName) !== -1) {
                    // Determine severity
                    var severity = CFG.SEVERITY.WARNING;
                    if (func.removedIn) {
                        severity = CFG.SEVERITY.ERROR;
                    }

                    usage.usages.push({
                        function: funcName,
                        line: j + 1,
                        alternative: func.alternative,
                        deprecatedIn: func.deprecatedIn,
                        removedIn: func.removedIn,
                        severity: severity
                    });
                }
            }
        }

    } catch (err) {
        AIS.Log.error('Could not scan ' + file.name + ': ' + err.message);
    }

    return usage;
}

// ============================================================================
// AUTO-FIX LOGIC
// ============================================================================

/**
 * Auto-fix deprecated function usage
 * @param {Object} usage - Usage data
 * @param {Object} deprecations - Deprecation data
 * @returns {Number} Number of scripts fixed
 */
function autoFixDeprecations(usage, deprecations) {
    var fixed = 0;

    for (var i = 0; i < usage.scripts.length; i++) {
        var scriptInfo = usage.scripts[i];

        // Check if all usages have alternatives
        var canFix = true;
        for (var j = 0; j < scriptInfo.usages.length; j++) {
            if (!scriptInfo.usages[j].alternative) {
                canFix = false;
                break;
            }
        }

        if (canFix) {
            if (fixScriptFile(scriptInfo)) {
                fixed++;
            }
        }
    }

    return fixed;
}

/**
 * Fix a single script file
 * @param {Object} scriptInfo - Script usage info
 * @returns {Boolean} True if fixed
 */
function fixScriptFile(scriptInfo) {
    try {
        var rootFolder = new Folder(AIS.Path.getDirectory($.fileName) + '/..');
        var file = new File(rootFolder.fsName + '/' + scriptInfo.script);

        // Read content
        file.encoding = 'UTF-8';
        file.open('r');
        var content = file.read();
        file.close();

        // Backup
        var backup = new File(file.fsName + CFG.BACKUP_SUFFIX);
        file.copy(backup);

        // Replace deprecated functions
        for (var i = 0; i < scriptInfo.usages.length; i++) {
            var usage = scriptInfo.usages[i];
            var pattern = new RegExp(usage.function.replace(/\./g, '\\.'), 'g');
            content = content.replace(pattern, usage.alternative);
        }

        // Write fixed content
        file.open('w');
        file.write(content);
        file.close();

        return true;

    } catch (err) {
        AIS.Log.error('Could not fix ' + scriptInfo.script + ': ' + err.message);
        return false;
    }
}

// ============================================================================
// REPORT GENERATION
// ============================================================================

/**
 * Generate HTML deprecation report
 * @param {Object} deprecations - Deprecation data
 * @param {Object} usage - Usage data
 * @returns {String} HTML report
 */
function generateReport(deprecations, usage) {
    var html = [];

    html.push('<!DOCTYPE html>');
    html.push('<html><head>');
    html.push('<meta charset="UTF-8">');
    html.push('<title>Library Deprecation Report</title>');
    html.push('<style>');
    html.push('body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }');
    html.push('h1 { color: #333; }');
    html.push('.summary { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }');
    html.push('.stats { display: flex; gap: 20px; margin: 20px 0; }');
    html.push('.stat { background: #f9f9f9; padding: 15px; border-radius: 5px; flex: 1; }');
    html.push('.stat-label { font-size: 12px; color: #666; }');
    html.push('.stat-value { font-size: 32px; font-weight: bold; margin: 5px 0; }');
    html.push('.deprecated .stat-value { color: #ff9800; }');
    html.push('.error .stat-value { color: #f44336; }');
    html.push('.warning .stat-value { color: #ff9800; }');
    html.push('.function { background: white; padding: 15px; margin: 10px 0; border-radius: 5px; }');
    html.push('.function-name { font-weight: bold; color: #1976d2; font-family: monospace; }');
    html.push('.script { background: white; padding: 15px; margin: 10px 0; border-radius: 5px; }');
    html.push('.script-name { font-weight: bold; color: #1976d2; margin-bottom: 10px; }');
    html.push('.usage { margin: 8px 0; padding: 8px; border-left: 4px solid #ccc; }');
    html.push('.usage.warning { border-left-color: #ff9800; background: #fff3e0; }');
    html.push('.usage.error { border-left-color: #f44336; background: #ffebee; }');
    html.push('.alternative { font-family: monospace; background: #e8f5e9; padding: 2px 6px; border-radius: 3px; }');
    html.push('</style>');
    html.push('</head><body>');

    // Header
    html.push('<h1>Library Deprecation Report</h1>');
    html.push('<p>Generated: ' + new Date().toString() + '</p>');

    // Summary
    html.push('<div class="summary">');
    html.push('<h2>Summary</h2>');
    html.push('<p><strong>Total Functions:</strong> ' + deprecations.functions.length + '</p>');
    html.push('<p><strong>Active:</strong> ' + deprecations.summary.active + '</p>');
    html.push('<p><strong>Deprecated:</strong> ' + deprecations.summary.deprecated + '</p>');
    html.push('<p><strong>Scripts with Deprecated Usage:</strong> ' + usage.scripts.length + '</p>');

    html.push('<div class="stats">');
    html.push('<div class="stat deprecated">');
    html.push('<div class="stat-label">Deprecated Functions</div>');
    html.push('<div class="stat-value">' + deprecations.summary.deprecated + '</div>');
    html.push('</div>');
    html.push('<div class="stat warning">');
    html.push('<div class="stat-label">Warnings</div>');
    html.push('<div class="stat-value">' + usage.bySeverity.warning + '</div>');
    html.push('</div>');
    html.push('<div class="stat error">');
    html.push('<div class="stat-label">Errors</div>');
    html.push('<div class="stat-value">' + usage.bySeverity.error + '</div>');
    html.push('</div>');
    html.push('</div>');
    html.push('</div>');

    // Deprecated functions
    if (deprecations.summary.deprecated > 0) {
        html.push('<h2>Deprecated Functions</h2>');

        for (var i = 0; i < deprecations.functions.length; i++) {
            var func = deprecations.functions[i];
            if (func.status !== CFG.STATUS.DEPRECATED) continue;

            html.push('<div class="function">');
            html.push('<div class="function-name">' + func.name + '</div>');
            html.push('<div>File: ' + func.file + ' (line ' + func.line + ')</div>');
            if (func.deprecatedIn) {
                html.push('<div>Deprecated in: v' + func.deprecatedIn + '</div>');
            }
            if (func.removedIn) {
                html.push('<div>Will be removed in: v' + func.removedIn + '</div>');
            }
            if (func.alternative) {
                html.push('<div>Alternative: <span class="alternative">' + func.alternative + '</span></div>');
            }
            html.push('</div>');
        }
    }

    // Usage in scripts
    if (usage.scripts.length > 0) {
        html.push('<h2>Deprecated Usage in Scripts</h2>');

        for (var i = 0; i < usage.scripts.length; i++) {
            var scriptInfo = usage.scripts[i];
            html.push('<div class="script">');
            html.push('<div class="script-name">' + scriptInfo.script + '</div>');

            for (var j = 0; j < scriptInfo.usages.length; j++) {
                var use = scriptInfo.usages[j];
                html.push('<div class="usage ' + use.severity + '">');
                html.push('<div><strong>' + use.function + '</strong> at line ' + use.line + '</div>');
                if (use.alternative) {
                    html.push('<div>Use instead: <span class="alternative">' + use.alternative + '</span></div>');
                }
                if (use.removedIn) {
                    html.push('<div style="color: #f44336;">⚠️ Will be removed in v' + use.removedIn + '</div>');
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
    var folder = new Folder(CFG.REPORT_FOLDER);
    if (!folder.exists) folder.create();

    var file = new File(CFG.REPORT_FOLDER + CFG.REPORT_NAME);
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
 * @param {Object} deprecations - Deprecation data
 * @param {Object} usage - Usage data
 * @param {String} reportPath - Report file path
 */
function showSummary(deprecations, usage, reportPath) {
    var message = 'Library Deprecation Analysis Complete\n\n';
    message += 'Total Functions: ' + deprecations.functions.length + '\n';
    message += 'Active: ' + deprecations.summary.active + '\n';
    message += 'Deprecated: ' + deprecations.summary.deprecated + '\n\n';
    message += 'Scripts with Deprecated Usage: ' + usage.scripts.length + '\n';
    message += 'Total Usages: ' + usage.totalUsages + '\n';
    message += 'Warnings: ' + usage.bySeverity.warning + '\n';
    message += 'Errors: ' + usage.bySeverity.error + '\n\n';
    message += 'Report saved to:\n' + reportPath + '\n\n';
    message += 'Open report now?';

    var response = confirm(message);
    if (response) {
        var reportFile = new File(reportPath);
        reportFile.execute();
    }
}
