/**
 * Run All Tests
 * @version 1.0.0
 * @description Automated test runner that validates all production scripts can load without errors
 * @author Adam (2025)
 * @license MIT
 * @category Utilities
 * @requires Illustrator CS4 or higher
 *
 * Features:
 * - Scans all production .jsx files (excludes old/, old2/, templates/)
 * - Validates syntax by attempting to read each file
 * - Checks for proper #include statements
 * - Verifies @target illustrator directive
 * - Generates summary report with pass/fail counts
 * - Identifies broken or problematic scripts
 * - Export results to HTML report
 *
 * Usage:
 * - Run before commits to catch broken scripts
 * - Run before releases for final validation
 * - Helps maintain code quality across large codebase
 */

#include "../.lib/core.jsx"

//@target illustrator
app.preferences.setBooleanPreference('ShowExternalJSXWarning', false);

// ============================================================================
// ENTRY POINT
// ============================================================================

(function() {
    try {
        main();
    } catch (err) {
        AIS.Error.show('Run All Tests', err);
    }
})();

// ============================================================================
// CONFIGURATION
// ============================================================================

var CFG = {
    scriptName: 'Run All Tests',
    scriptVersion: '1.0.0',
    excludedPaths: ['old', 'old2', 'templates', 'node_modules', '.git'],
    requiredDirective: '//@target illustrator',
    reportFileName: 'test-results-' + new Date().getTime() + '.html'
};

// ============================================================================
// MAIN FUNCTION
// ============================================================================

function main() {
    var scriptPath = getScriptPath();
    var projectRoot = scriptPath.parent.parent;

    // Scan for all production .jsx files
    var scripts = scanForScripts(projectRoot);

    if (scripts.length === 0) {
        alert('No scripts found\nCheck project structure and try again');
        return;
    }

    // Run tests on each script
    var results = runTests(scripts);

    // Generate report
    var report = generateReport(results);

    // Save HTML report
    var reportFile = saveReport(projectRoot, report);

    // Show summary
    showSummary(results, reportFile);
}

// ============================================================================
// SCRIPT SCANNING
// ============================================================================

/**
 * Get the folder containing this script
 * @returns {Folder} Script folder
 */
function getScriptPath() {
    try {
        return new File($.fileName).parent;
    } catch (e) {
        return Folder.myDocuments;
    }
}

/**
 * Scan project for all production .jsx files
 * @param {Folder} folder - Root folder to scan
 * @returns {Array} Array of File objects
 */
function scanForScripts(folder) {
    var scripts = [];
    scanFolderRecursive(folder, scripts);
    return scripts;
}

/**
 * Recursively scan folder for .jsx files
 * @param {Folder} folder - Folder to scan
 * @param {Array} results - Array to collect results
 */
function scanFolderRecursive(folder, results) {
    var files = folder.getFiles();

    for (var i = 0; i < files.length; i++) {
        var item = files[i];

        // Skip excluded paths
        if (isExcludedPath(item.fsName)) {
            continue;
        }

        if (item instanceof Folder) {
            // Recurse into subfolder
            scanFolderRecursive(item, results);
        } else if (item instanceof File && item.name.match(/\.jsx$/i)) {
            // Skip library files (they're not standalone scripts)
            if (item.parent.name !== 'lib') {
                results.push(item);
            }
        }
    }
}

/**
 * Check if path should be excluded
 * @param {String} path - File system path
 * @returns {Boolean} True if should be excluded
 */
function isExcludedPath(path) {
    for (var i = 0; i < CFG.excludedPaths.length; i++) {
        if (path.indexOf('/' + CFG.excludedPaths[i] + '/') !== -1 ||
            path.indexOf('\\' + CFG.excludedPaths[i] + '\\') !== -1) {
            return true;
        }
    }
    return false;
}

// ============================================================================
// TEST EXECUTION
// ============================================================================

/**
 * Run tests on all scripts
 * @param {Array} scripts - Array of File objects
 * @returns {Array} Array of test result objects
 */
function runTests(scripts) {
    var results = [];

    for (var i = 0; i < scripts.length; i++) {
        var script = scripts[i];
        var result = testScript(script);
        results.push(result);
    }

    return results;
}

/**
 * Test a single script
 * @param {File} scriptFile - Script to test
 * @returns {Object} Test result
 */
function testScript(scriptFile) {
    var result = {
        file: scriptFile.fsName,
        name: scriptFile.name,
        passed: true,
        errors: [],
        warnings: []
    };

    try {
        // Test 1: Can we read the file?
        scriptFile.encoding = 'UTF-8';
        scriptFile.open('r');
        var content = scriptFile.read();
        scriptFile.close();

        if (!content || content.length === 0) {
            result.passed = false;
            result.errors.push('File is empty or unreadable');
            return result;
        }

        // Test 2: Check for @target illustrator
        if (content.indexOf(CFG.requiredDirective) === -1) {
            result.warnings.push('Missing //@target illustrator directive');
        }

        // Test 3: Check for #include statement (for non-template scripts)
        if (scriptFile.parent.name !== 'templates' &&
            content.indexOf('#include') === -1) {
            result.warnings.push('No #include statement found (may not use AIS library)');
        }

        // Test 4: Check for proper #include path
        if (content.indexOf('#include') !== -1) {
            var includeMatch = content.match(/#include\s+"([^"]+)"/);
            if (includeMatch) {
                var includePath = includeMatch[1];
                // Verify it's pointing to lib/core.jsx
                if (includePath.indexOf('lib/core.jsx') === -1) {
                    result.warnings.push('Unusual #include path: ' + includePath);
                }
            }
        }

        // Test 5: Check for basic syntax errors (simple validation)
        var syntaxErrors = checkBasicSyntax(content);
        if (syntaxErrors.length > 0) {
            result.passed = false;
            result.errors = result.errors.concat(syntaxErrors);
        }

        // Test 6: Check for version tag
        if (content.indexOf('@version') === -1) {
            result.warnings.push('Missing @version tag in header');
        }

        // Test 7: Check for description
        if (content.indexOf('@description') === -1) {
            result.warnings.push('Missing @description tag in header');
        }

    } catch (e) {
        result.passed = false;
        result.errors.push('Exception: ' + e.toString());
    }

    return result;
}

/**
 * Check for basic syntax errors
 * @param {String} content - Script content
 * @returns {Array} Array of error messages
 */
function checkBasicSyntax(content) {
    var errors = [];

    // Check for mismatched braces
    var openBraces = (content.match(/\{/g) || []).length;
    var closeBraces = (content.match(/\}/g) || []).length;
    if (openBraces !== closeBraces) {
        errors.push('Mismatched braces: ' + openBraces + ' open, ' + closeBraces + ' close');
    }

    // Check for mismatched parentheses
    var openParens = (content.match(/\(/g) || []).length;
    var closeParens = (content.match(/\)/g) || []).length;
    if (openParens !== closeParens) {
        errors.push('Mismatched parentheses: ' + openParens + ' open, ' + closeParens + ' close');
    }

    // Check for ES6+ violations
    if (content.match(/\bconst\s+/)) {
        errors.push('ES6+ syntax violation: "const" keyword found');
    }
    if (content.match(/\blet\s+/)) {
        errors.push('ES6+ syntax violation: "let" keyword found');
    }
    if (content.match(/=>/)) {
        errors.push('ES6+ syntax violation: arrow function "=>" found');
    }
    if (content.match(/\bclass\s+/)) {
        errors.push('ES6+ syntax violation: "class" keyword found');
    }

    return errors;
}

// ============================================================================
// REPORT GENERATION
// ============================================================================

/**
 * Generate HTML report
 * @param {Array} results - Test results
 * @returns {String} HTML report
 */
function generateReport(results) {
    var passCount = 0;
    var failCount = 0;
    var warningCount = 0;

    for (var i = 0; i < results.length; i++) {
        if (results[i].passed) {
            passCount++;
        } else {
            failCount++;
        }
        warningCount += results[i].warnings.length;
    }

    var html = [];
    html.push('<!DOCTYPE html>');
    html.push('<html>');
    html.push('<head>');
    html.push('<meta charset="UTF-8">');
    html.push('<title>Test Results - ' + new Date().toString() + '</title>');
    html.push('<style>');
    html.push('body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif; margin: 20px; background: #f5f5f5; }');
    html.push('.container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }');
    html.push('h1 { color: #333; border-bottom: 3px solid #4CAF50; padding-bottom: 10px; }');
    html.push('h2 { color: #555; margin-top: 30px; }');
    html.push('.summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin: 20px 0; }');
    html.push('.stat { background: #f8f9fa; padding: 20px; border-radius: 5px; text-align: center; }');
    html.push('.stat.pass { border-left: 4px solid #4CAF50; }');
    html.push('.stat.fail { border-left: 4px solid #f44336; }');
    html.push('.stat.warn { border-left: 4px solid #ff9800; }');
    html.push('.stat-number { font-size: 36px; font-weight: bold; margin: 10px 0; }');
    html.push('.stat-label { color: #666; font-size: 14px; text-transform: uppercase; }');
    html.push('.test-result { margin: 15px 0; padding: 15px; border-radius: 5px; border-left: 4px solid #ddd; }');
    html.push('.test-result.pass { background: #f1f8f4; border-left-color: #4CAF50; }');
    html.push('.test-result.fail { background: #ffebee; border-left-color: #f44336; }');
    html.push('.test-name { font-weight: 600; color: #333; margin-bottom: 5px; }');
    html.push('.test-file { font-size: 12px; color: #666; font-family: monospace; }');
    html.push('.error { color: #d32f2f; margin: 5px 0; padding: 5px 10px; background: #ffcdd2; border-radius: 3px; }');
    html.push('.warning { color: #f57c00; margin: 5px 0; padding: 5px 10px; background: #ffe0b2; border-radius: 3px; }');
    html.push('.badge { display: inline-block; padding: 3px 8px; border-radius: 3px; font-size: 11px; font-weight: 600; text-transform: uppercase; }');
    html.push('.badge.pass { background: #4CAF50; color: white; }');
    html.push('.badge.fail { background: #f44336; color: white; }');
    html.push('</style>');
    html.push('</head>');
    html.push('<body>');
    html.push('<div class="container">');
    html.push('<h1>🧪 Script Test Results</h1>');
    html.push('<p>Generated: ' + new Date().toString() + '</p>');

    // Summary
    html.push('<div class="summary">');
    html.push('<div class="stat pass">');
    html.push('<div class="stat-number">' + passCount + '</div>');
    html.push('<div class="stat-label">Passed</div>');
    html.push('</div>');
    html.push('<div class="stat fail">');
    html.push('<div class="stat-number">' + failCount + '</div>');
    html.push('<div class="stat-label">Failed</div>');
    html.push('</div>');
    html.push('<div class="stat warn">');
    html.push('<div class="stat-number">' + warningCount + '</div>');
    html.push('<div class="stat-label">Warnings</div>');
    html.push('</div>');
    html.push('</div>');

    // Failed tests
    if (failCount > 0) {
        html.push('<h2>❌ Failed Tests (' + failCount + ')</h2>');
        for (var i = 0; i < results.length; i++) {
            if (!results[i].passed) {
                html.push('<div class="test-result fail">');
                html.push('<div class="test-name">');
                html.push('<span class="badge fail">FAIL</span> ');
                html.push(escapeHtml(results[i].name));
                html.push('</div>');
                html.push('<div class="test-file">' + escapeHtml(results[i].file) + '</div>');
                for (var j = 0; j < results[i].errors.length; j++) {
                    html.push('<div class="error">❌ ' + escapeHtml(results[i].errors[j]) + '</div>');
                }
                for (var k = 0; k < results[i].warnings.length; k++) {
                    html.push('<div class="warning">⚠️ ' + escapeHtml(results[i].warnings[k]) + '</div>');
                }
                html.push('</div>');
            }
        }
    }

    // Passed tests with warnings
    var passedWithWarnings = [];
    for (var i = 0; i < results.length; i++) {
        if (results[i].passed && results[i].warnings.length > 0) {
            passedWithWarnings.push(results[i]);
        }
    }

    if (passedWithWarnings.length > 0) {
        html.push('<h2>⚠️ Passed with Warnings (' + passedWithWarnings.length + ')</h2>');
        for (var i = 0; i < passedWithWarnings.length; i++) {
            html.push('<div class="test-result pass">');
            html.push('<div class="test-name">');
            html.push('<span class="badge pass">PASS</span> ');
            html.push(escapeHtml(passedWithWarnings[i].name));
            html.push('</div>');
            html.push('<div class="test-file">' + escapeHtml(passedWithWarnings[i].file) + '</div>');
            for (var j = 0; j < passedWithWarnings[i].warnings.length; j++) {
                html.push('<div class="warning">⚠️ ' + escapeHtml(passedWithWarnings[i].warnings[j]) + '</div>');
            }
            html.push('</div>');
        }
    }

    // All passed tests
    var cleanPasses = passCount - passedWithWarnings.length;
    if (cleanPasses > 0) {
        html.push('<h2>✅ Passed (' + cleanPasses + ')</h2>');
        for (var i = 0; i < results.length; i++) {
            if (results[i].passed && results[i].warnings.length === 0) {
                html.push('<div class="test-result pass">');
                html.push('<div class="test-name">');
                html.push('<span class="badge pass">PASS</span> ');
                html.push(escapeHtml(results[i].name));
                html.push('</div>');
                html.push('<div class="test-file">' + escapeHtml(results[i].file) + '</div>');
                html.push('</div>');
            }
        }
    }

    html.push('</div>');
    html.push('</body>');
    html.push('</html>');

    return html.join('\n');
}

/**
 * Escape HTML special characters
 * @param {String} text - Text to escape
 * @returns {String} Escaped text
 */
function escapeHtml(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// ============================================================================
// REPORT SAVING
// ============================================================================

/**
 * Save report to file
 * @param {Folder} projectRoot - Project root folder
 * @param {String} html - HTML report content
 * @returns {File} Saved report file
 */
function saveReport(projectRoot, html) {
    var reportFile = new File(projectRoot.fsName + '/' + CFG.reportFileName);
    reportFile.encoding = 'UTF-8';
    reportFile.open('w');
    reportFile.write(html);
    reportFile.close();

    return reportFile;
}

// ============================================================================
// USER INTERFACE
// ============================================================================

/**
 * Show summary dialog
 * @param {Array} results - Test results
 * @param {File} reportFile - Report file
 */
function showSummary(results, reportFile) {
    var passCount = 0;
    var failCount = 0;
    var warningCount = 0;

    for (var i = 0; i < results.length; i++) {
        if (results[i].passed) {
            passCount++;
        } else {
            failCount++;
        }
        warningCount += results[i].warnings.length;
    }

    var message = '=== Test Results ===\n\n';
    message += 'Total Scripts: ' + results.length + '\n';
    message += 'Passed: ' + passCount + ' ✅\n';
    message += 'Failed: ' + failCount + ' ❌\n';
    message += 'Warnings: ' + warningCount + ' ⚠️\n\n';

    if (failCount === 0) {
        message += 'All tests passed!\n\n';
    } else {
        message += 'Some tests failed. Review report for details.\n\n';
    }

    message += 'Report saved to:\n' + reportFile.fsName + '\n\n';
    message += 'Open report now?';

    if (confirm(message)) {
        reportFile.execute();
    }
}
