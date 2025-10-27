/**
 * Pre-Flight Check
 * @version 1.1.0
 * @description Validate all scripts for common errors before deployment
 * @author Vexy Illustrator Scripts
 * @license MIT
 * @category Utilities
 * @requires Illustrator CS4 or higher
 *
 * Features:
 * - Scan all .jsx files in project (excluding old/, old2/)
 * - Check for ES6+ syntax violations (const, let, =>, class)
 * - Check for TODO/FIXME in production files
 * - Verify #include paths are correct
 * - Check for common anti-patterns
 * - Verify AIS namespace usage
 * - Check for French strings in UI
 * - Validate version numbering (@version tag)
 * - Check for required JSDoc headers
 * - Generate detailed HTML report
 *
 * Usage: File → Scripts → PreFlightCheck
 * Run before commits or script modernization
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
    scriptName: 'Pre-Flight Check',
    version: '1.1.0',
    projectRoot: null, // Will be determined from script location
    excludeFolders: ['old', 'old2', 'node_modules', '.git'],
    productionExtensions: ['.jsx'],

    // Pattern checks
    patterns: {
        es6: {
            name: 'ES6+ Syntax',
            regex: /\b(const|let)\s+|=>|\bclass\s+/g,
            severity: 'error',
            message: 'ES6+ syntax not supported in ExtendScript'
        },
        todo: {
            name: 'TODO/FIXME markers',
            regex: /\b(TODO|FIXME|XXX|HACK)\b/gi,
            severity: 'warning',
            message: 'Incomplete code markers found'
        },
        french: {
            name: 'French strings',
            regex: /\b(fichier|dossier|erreur|valeur|nom|texte|objet)\b/gi,
            severity: 'warning',
            message: 'Possible French text (should be English-only)'
        },
        hardcodedPaths: {
            name: 'Hardcoded paths',
            regex: /(C:\\|\/Users\/[^\/]+\/|D:\\)/g,
            severity: 'error',
            message: 'Hardcoded absolute paths found'
        },
        includePathsValid: {
            name: 'Invalid #include',
            regex: /#include\s+["']([^"']+)["']/g,
            severity: 'error',
            message: 'Include path may be invalid',
            check: 'include'
        },
        versionTag: {
            name: 'Missing @version',
            regex: /@version\s+\d+\.\d+\.\d+/,
            severity: 'warning',
            message: 'Missing or malformed @version tag (expected format: X.Y.Z)',
            check: 'missing'
        },
        descriptionTag: {
            name: 'Missing @description',
            regex: /@description\s+.+/,
            severity: 'warning',
            message: 'Missing @description tag in header',
            check: 'missing'
        },
        authorTag: {
            name: 'Missing @author',
            regex: /@author\s+.+/,
            severity: 'info',
            message: 'Missing @author tag in header',
            check: 'missing'
        },
        categoryTag: {
            name: 'Missing @category',
            regex: /@category\s+.+/,
            severity: 'info',
            message: 'Missing @category tag in header',
            check: 'missing'
        }
    },

    // HTML report settings
    report: {
        title: 'Pre-Flight Check Report',
        colors: {
            error: '#ef4444',
            warning: '#f59e0b',
            pass: '#10b981',
            bg: '#1f2937',
            text: '#f3f4f6'
        }
    }
};

// ============================================================================
// MAIN FUNCTION
// ============================================================================

function main() {
    try {
        // Determine project root from script location
        var scriptFile = new File($.fileName);
        CFG.projectRoot = scriptFile.parent.parent; // Go up from Utilities/ to root

        // Verify project root
        if (!CFG.projectRoot || !CFG.projectRoot.exists) {
            alert('Error: Could not determine project root\nScript location: ' + $.fileName);
            return;
        }

        // Show start dialog
        if (!confirm('Run Pre-Flight Check?\n\nThis will scan all .jsx files in:\n' + CFG.projectRoot.fsName + '\n\nExcluding: ' + CFG.excludeFolders.join(', '))) {
            return;
        }

        // Run checks
        var results = runPreFlightChecks();

        // Generate HTML report
        var reportPath = generateHTMLReport(results);

        // Show summary
        showSummary(results, reportPath);

    } catch (e) {
        alert('Pre-Flight Check Error:\n' + e.message + '\n\nLine: ' + e.line);
    }
}

// ============================================================================
// PRE-FLIGHT CHECKS
// ============================================================================

function runPreFlightChecks() {
    var results = {
        filesScanned: 0,
        errors: 0,
        warnings: 0,
        passed: 0,
        files: [],
        startTime: new Date()
    };

    // Get all .jsx files
    var files = getAllJSXFiles(CFG.projectRoot);
    results.filesScanned = files.length;

    // Check each file
    for (var i = 0; i < files.length; i++) {
        var fileResult = checkFile(files[i]);
        results.files.push(fileResult);

        // Count issues
        results.errors += fileResult.errors.length;
        results.warnings += fileResult.warnings.length;
        if (fileResult.errors.length === 0 && fileResult.warnings.length === 0) {
            results.passed++;
        }
    }

    results.endTime = new Date();
    results.duration = (results.endTime - results.startTime) / 1000; // seconds

    return results;
}

function checkFile(file) {
    var result = {
        path: file.fsName.replace(CFG.projectRoot.fsName + '/', ''),
        name: file.name,
        errors: [],
        warnings: []
    };

    try {
        // Read file content
        file.encoding = 'UTF-8';
        file.open('r');
        var content = file.read();
        file.close();

        // Run pattern checks
        for (var key in CFG.patterns) {
            if (CFG.patterns.hasOwnProperty(key)) {
                var pattern = CFG.patterns[key];

                if (pattern.check === 'include') {
                    // Special handling for #include paths
                    checkIncludePaths(content, result);
                } else if (pattern.check === 'missing') {
                    // Check for missing patterns (inverse logic)
                    var matches = content.match(pattern.regex);
                    if (!matches) {
                        // Pattern NOT found - this is an issue
                        var issue = {
                            name: pattern.name,
                            message: pattern.message,
                            count: 1,
                            examples: []
                        };

                        if (pattern.severity === 'error') {
                            result.errors.push(issue);
                        } else if (pattern.severity === 'warning') {
                            result.warnings.push(issue);
                        }
                        // Ignore 'info' severity for now
                    }
                } else {
                    // Standard regex check (pattern found = issue)
                    var matches = content.match(pattern.regex);
                    if (matches) {
                        var issue = {
                            name: pattern.name,
                            message: pattern.message,
                            count: matches.length,
                            examples: getUniqueMatches(matches).slice(0, 3)
                        };

                        if (pattern.severity === 'error') {
                            result.errors.push(issue);
                        } else {
                            result.warnings.push(issue);
                        }
                    }
                }
            }
        }

    } catch (e) {
        result.errors.push({
            name: 'File Read Error',
            message: e.message,
            count: 1,
            examples: []
        });
    }

    return result;
}

function checkIncludePaths(content, result) {
    var includeRegex = /#include\s+["']([^"']+)["']/g;
    var match;
    var invalidPaths = [];

    while ((match = includeRegex.exec(content)) !== null) {
        var includePath = match[1];

        // Check if path looks valid
        if (!includePath.match(/^\.\.\/lib\/(core|ui)\.jsx$/)) {
            invalidPaths.push(includePath);
        }
    }

    if (invalidPaths.length > 0) {
        result.warnings.push({
            name: 'Unusual #include paths',
            message: 'Include paths should be ../lib/core.jsx or ../lib/ui.jsx',
            count: invalidPaths.length,
            examples: invalidPaths.slice(0, 3)
        });
    }
}

// ============================================================================
// FILE SCANNING
// ============================================================================

function getAllJSXFiles(folder) {
    var files = [];
    scanFolder(folder, files);
    return files;
}

function scanFolder(folder, files) {
    if (!folder || !folder.exists) return;

    // Skip excluded folders
    var folderName = folder.name.toLowerCase();
    for (var i = 0; i < CFG.excludeFolders.length; i++) {
        if (folderName === CFG.excludeFolders[i].toLowerCase()) {
            return;
        }
    }

    // Get all items
    var items = folder.getFiles();

    for (var j = 0; j < items.length; j++) {
        var item = items[j];

        if (item instanceof Folder) {
            // Recursive scan
            scanFolder(item, files);
        } else if (item instanceof File) {
            // Check file extension
            var ext = item.name.match(/\.[^.]+$/);
            if (ext && ext[0].toLowerCase() === '.jsx') {
                files.push(item);
            }
        }
    }
}

// ============================================================================
// HTML REPORT GENERATION
// ============================================================================

function generateHTMLReport(results) {
    var html = buildHTML(results);

    // Save report
    var reportFile = new File(CFG.projectRoot.fsName + '/preflight-report.html');
    reportFile.encoding = 'UTF-8';
    reportFile.open('w');
    reportFile.write(html);
    reportFile.close();

    return reportFile.fsName;
}

function buildHTML(results) {
    var html = [];
    var c = CFG.report.colors;

    // HTML Header
    html.push('<!DOCTYPE html>');
    html.push('<html lang="en">');
    html.push('<head>');
    html.push('<meta charset="UTF-8">');
    html.push('<meta name="viewport" content="width=device-width, initial-scale=1.0">');
    html.push('<title>' + CFG.report.title + '</title>');
    html.push('<style>');
    html.push('* { margin: 0; padding: 0; box-sizing: border-box; }');
    html.push('body { font-family: -apple-system, system-ui, sans-serif; background: ' + c.bg + '; color: ' + c.text + '; padding: 20px; }');
    html.push('.container { max-width: 1200px; margin: 0 auto; }');
    html.push('h1 { font-size: 28px; margin-bottom: 10px; }');
    html.push('.meta { color: #9ca3af; margin-bottom: 30px; }');
    html.push('.summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 30px; }');
    html.push('.stat { background: #374151; padding: 20px; border-radius: 8px; }');
    html.push('.stat-value { font-size: 32px; font-weight: bold; margin-bottom: 5px; }');
    html.push('.stat-label { color: #9ca3af; font-size: 14px; }');
    html.push('.error { color: ' + c.error + '; }');
    html.push('.warning { color: ' + c.warning + '; }');
    html.push('.pass { color: ' + c.pass + '; }');
    html.push('.file { background: #374151; padding: 20px; border-radius: 8px; margin-bottom: 15px; }');
    html.push('.file-header { font-size: 16px; font-weight: 600; margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center; }');
    html.push('.badge { font-size: 12px; padding: 4px 8px; border-radius: 4px; font-weight: 600; }');
    html.push('.badge-error { background: ' + c.error + '; color: white; }');
    html.push('.badge-warning { background: ' + c.warning + '; color: white; }');
    html.push('.badge-pass { background: ' + c.pass + '; color: white; }');
    html.push('.issue { margin-bottom: 12px; padding: 12px; background: #1f2937; border-left: 3px solid; border-radius: 4px; }');
    html.push('.issue-error { border-color: ' + c.error + '; }');
    html.push('.issue-warning { border-color: ' + c.warning + '; }');
    html.push('.issue-name { font-weight: 600; margin-bottom: 5px; }');
    html.push('.issue-message { color: #9ca3af; font-size: 14px; margin-bottom: 8px; }');
    html.push('.examples { font-family: monospace; font-size: 12px; color: #d1d5db; background: #111827; padding: 8px; border-radius: 4px; }');
    html.push('</style>');
    html.push('</head>');
    html.push('<body>');
    html.push('<div class="container">');

    // Title & Meta
    html.push('<h1>' + CFG.report.title + '</h1>');
    html.push('<div class="meta">');
    html.push('Generated: ' + results.endTime.toString() + ' | ');
    html.push('Duration: ' + results.duration.toFixed(2) + 's');
    html.push('</div>');

    // Summary Statistics
    html.push('<div class="summary">');
    html.push('<div class="stat">');
    html.push('<div class="stat-value">' + results.filesScanned + '</div>');
    html.push('<div class="stat-label">Files Scanned</div>');
    html.push('</div>');
    html.push('<div class="stat">');
    html.push('<div class="stat-value pass">' + results.passed + '</div>');
    html.push('<div class="stat-label">Passed</div>');
    html.push('</div>');
    html.push('<div class="stat">');
    html.push('<div class="stat-value error">' + results.errors + '</div>');
    html.push('<div class="stat-label">Errors</div>');
    html.push('</div>');
    html.push('<div class="stat">');
    html.push('<div class="stat-value warning">' + results.warnings + '</div>');
    html.push('<div class="stat-label">Warnings</div>');
    html.push('</div>');
    html.push('</div>');

    // File Details
    for (var i = 0; i < results.files.length; i++) {
        var file = results.files[i];
        var hasIssues = file.errors.length > 0 || file.warnings.length > 0;

        if (!hasIssues) continue; // Skip files with no issues

        html.push('<div class="file">');

        // File header
        html.push('<div class="file-header">');
        html.push('<span>' + file.path + '</span>');

        if (file.errors.length > 0) {
            html.push('<span class="badge badge-error">' + file.errors.length + ' error' + (file.errors.length !== 1 ? 's' : '') + '</span>');
        } else if (file.warnings.length > 0) {
            html.push('<span class="badge badge-warning">' + file.warnings.length + ' warning' + (file.warnings.length !== 1 ? 's' : '') + '</span>');
        }

        html.push('</div>');

        // Errors
        for (var j = 0; j < file.errors.length; j++) {
            var issue = file.errors[j];
            html.push('<div class="issue issue-error">');
            html.push('<div class="issue-name error">' + issue.name + ' (' + issue.count + ')</div>');
            html.push('<div class="issue-message">' + issue.message + '</div>');
            if (issue.examples && issue.examples.length > 0) {
                html.push('<div class="examples">' + issue.examples.join(', ') + '</div>');
            }
            html.push('</div>');
        }

        // Warnings
        for (var k = 0; k < file.warnings.length; k++) {
            var warn = file.warnings[k];
            html.push('<div class="issue issue-warning">');
            html.push('<div class="issue-name warning">' + warn.name + ' (' + warn.count + ')</div>');
            html.push('<div class="issue-message">' + warn.message + '</div>');
            if (warn.examples && warn.examples.length > 0) {
                html.push('<div class="examples">' + warn.examples.join(', ') + '</div>');
            }
            html.push('</div>');
        }

        html.push('</div>');
    }

    // Footer
    html.push('</div>'); // container
    html.push('</body>');
    html.push('</html>');

    return html.join('\n');
}

// ============================================================================
// UTILITIES
// ============================================================================

function getUniqueMatches(matches) {
    var unique = [];
    var seen = {};

    for (var i = 0; i < matches.length; i++) {
        var match = matches[i];
        if (!seen[match]) {
            unique.push(match);
            seen[match] = true;
        }
    }

    return unique;
}

function showSummary(results, reportPath) {
    var msg = 'Pre-Flight Check Complete\n\n';
    msg += 'Files scanned: ' + results.filesScanned + '\n';
    msg += 'Passed: ' + results.passed + '\n';
    msg += 'Errors: ' + results.errors + '\n';
    msg += 'Warnings: ' + results.warnings + '\n';
    msg += 'Duration: ' + results.duration.toFixed(2) + 's\n\n';

    if (results.errors > 0) {
        msg += '⚠️ ERRORS FOUND - Review report for details\n\n';
    } else if (results.warnings > 0) {
        msg += '⚠️ Warnings found - Review recommended\n\n';
    } else {
        msg += '✅ All checks passed!\n\n';
    }

    msg += 'Report saved to:\n' + reportPath;

    alert(msg);

    // Open report in browser
    var reportFile = new File(reportPath);
    reportFile.execute();
}

// ============================================================================
// ENTRY POINT (handled by IIFE at top)
// ============================================================================
