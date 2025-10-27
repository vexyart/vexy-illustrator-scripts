/**
 * UI/UX Consistency Validator
 * @version 1.0.0
 * @description Validates user interface consistency across all scripts with dialogs
 * @category Utilities
 * @author Vexy Illustrator Scripts
 *
 * @features
 * - Scans all scripts for dialog creation patterns
 * - Validates button order consistency (OK/Cancel placement)
 * - Checks keyboard shortcut implementation (Enter/Esc)
 * - Verifies font sizes meet minimum standards (10pt)
 * - Validates margins and padding consistency
 * - Checks for help text on complex controls
 * - Generates comprehensive HTML compliance report
 * - Color-coded violation severity (critical/warning/suggestion)
 *
 * @usage
 * Run periodically to ensure UI/UX consistency across all scripts.
 * Especially important before v1.0.0 release.
 *
 * @notes
 * - Requires lib/core.jsx for AIS utilities
 * - Generates HTML report in ~/Documents/Adobe Scripts/
 * - Can detect multiple UI/UX anti-patterns
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
    // UI Standards
    MIN_FONT_SIZE: 10,
    STANDARD_MARGIN: 10,
    STANDARD_PADDING: 5,
    BUTTON_ORDER_STANDARD: 'OK_LEFT', // or 'OK_RIGHT'

    // Severity levels
    SEVERITY: {
        CRITICAL: 'critical',
        WARNING: 'warning',
        SUGGESTION: 'suggestion'
    },

    // Output settings
    REPORT_NAME: 'ui-consistency-report.html',
    REPORT_FOLDER: Folder.myDocuments + '/Adobe Scripts/'
};

// ============================================================================
// MAIN FUNCTION
// ============================================================================

function main() {
    try {
        AIS.Log.info('UI/UX Consistency Validator v1.0.0');
        AIS.Log.info('Scanning scripts for dialog patterns...');

        var results = validateAllScripts();
        var report = generateReport(results);
        var reportPath = saveReport(report);

        showSummary(results, reportPath);

    } catch (err) {
        AIS.Error.show('UI/UX Consistency Validator failed', err);
    }
}

// ============================================================================
// CORE VALIDATION LOGIC
// ============================================================================

/**
 * Validate all production scripts for UI/UX consistency
 * @returns {Object} Validation results
 */
function validateAllScripts() {
    var results = {
        total: 0,
        withDialogs: 0,
        violations: [],
        summary: {
            critical: 0,
            warning: 0,
            suggestion: 0
        }
    };

    var categories = [
        'Favorites', 'Artboards', 'Text', 'Colors', 'Paths',
        'Transform', 'Layers', 'Export', 'Measurement', 'Preferences',
        'Print', 'Selection', 'Strokes', 'Effects', 'Varia'
    ];

    var rootFolder = new Folder(AIS.Path.getDirectory($.fileName) + '/..');

    for (var i = 0; i < categories.length; i++) {
        var categoryFolder = new Folder(rootFolder.fsName + '/' + categories[i]);
        if (!categoryFolder.exists) continue;

        var files = categoryFolder.getFiles('*.jsx');
        for (var j = 0; j < files.length; j++) {
            if (files[j] instanceof Folder) continue;

            results.total++;
            var scriptViolations = validateScript(files[j]);

            if (scriptViolations.length > 0) {
                results.withDialogs++;
                results.violations.push({
                    script: categories[i] + '/' + files[j].name,
                    issues: scriptViolations
                });

                // Count by severity
                for (var k = 0; k < scriptViolations.length; k++) {
                    var severity = scriptViolations[k].severity;
                    results.summary[severity]++;
                }
            }
        }
    }

    return results;
}

/**
 * Validate a single script for UI/UX issues
 * @param {File} file - Script file to validate
 * @returns {Array} Array of violation objects
 */
function validateScript(file) {
    var violations = [];

    try {
        file.encoding = 'UTF-8';
        file.open('r');
        var content = file.read();
        file.close();

        // Check if script has dialogs
        if (!hasDialogs(content)) {
            return violations;
        }

        // Run all UI/UX checks
        violations = violations.concat(checkButtonOrder(content));
        violations = violations.concat(checkKeyboardShortcuts(content));
        violations = violations.concat(checkFontSizes(content));
        violations = violations.concat(checkMarginsAndPadding(content));
        violations = violations.concat(checkHelpText(content));
        violations = violations.concat(checkProgressIndicators(content));
        violations = violations.concat(checkGroupPanels(content));

    } catch (err) {
        violations.push({
            type: 'FILE_READ_ERROR',
            severity: CFG.SEVERITY.CRITICAL,
            message: 'Could not read script file: ' + err.message,
            line: 0
        });
    }

    return violations;
}

/**
 * Check if script contains dialog code
 * @param {String} content - Script content
 * @returns {Boolean} True if dialogs found
 */
function hasDialogs(content) {
    var dialogPatterns = [
        /new\s+Window\s*\(/i,
        /\.add\s*\(\s*['"]dialog['"]/i,
        /DialogBuilder/i,
        /ScriptUI/i
    ];

    for (var i = 0; i < dialogPatterns.length; i++) {
        if (dialogPatterns[i].test(content)) {
            return true;
        }
    }

    return false;
}

/**
 * Check button order consistency
 * @param {String} content - Script content
 * @returns {Array} Violations found
 */
function checkButtonOrder(content) {
    var violations = [];
    var lines = content.split('\n');

    for (var i = 0; i < lines.length; i++) {
        var line = lines[i];

        // Look for button groups with OK and Cancel
        if (/\.add\s*\(\s*['"]button['"].*OK/i.test(line)) {
            var nextLines = lines.slice(i, Math.min(i + 5, lines.length)).join('\n');

            // Check if Cancel comes after OK (left-to-right order)
            var okIndex = nextLines.search(/OK/i);
            var cancelIndex = nextLines.search(/Cancel/i);

            if (okIndex !== -1 && cancelIndex !== -1 && okIndex > cancelIndex) {
                violations.push({
                    type: 'BUTTON_ORDER',
                    severity: CFG.SEVERITY.WARNING,
                    message: 'Button order: Cancel before OK (standard is OK then Cancel)',
                    line: i + 1
                });
            }
        }
    }

    return violations;
}

/**
 * Check keyboard shortcut implementation
 * @param {String} content - Script content
 * @returns {Array} Violations found
 */
function checkKeyboardShortcuts(content) {
    var violations = [];
    var lines = content.split('\n');

    var hasDialog = false;
    var hasEnterHandler = false;
    var hasEscHandler = false;

    for (var i = 0; i < lines.length; i++) {
        var line = lines[i];

        if (/new\s+Window\s*\(/i.test(line) || /\.add\s*\(\s*['"]dialog['"]/i.test(line)) {
            hasDialog = true;
        }

        if (/addEventListener\s*\(\s*['"]keydown['"]/i.test(line)) {
            var nextLines = lines.slice(i, Math.min(i + 10, lines.length)).join('\n');

            if (/keyCode.*==.*13/i.test(nextLines) || /keyName.*==.*Enter/i.test(nextLines)) {
                hasEnterHandler = true;
            }
            if (/keyCode.*==.*27/i.test(nextLines) || /keyName.*==.*Escape/i.test(nextLines)) {
                hasEscHandler = true;
            }
        }
    }

    if (hasDialog && !hasEnterHandler) {
        violations.push({
            type: 'MISSING_ENTER_SHORTCUT',
            severity: CFG.SEVERITY.WARNING,
            message: 'Dialog missing Enter key handler for OK button',
            line: 0
        });
    }

    if (hasDialog && !hasEscHandler) {
        violations.push({
            type: 'MISSING_ESC_SHORTCUT',
            severity: CFG.SEVERITY.WARNING,
            message: 'Dialog missing Escape key handler for Cancel',
            line: 0
        });
    }

    return violations;
}

/**
 * Check font sizes meet minimum standards
 * @param {String} content - Script content
 * @returns {Array} Violations found
 */
function checkFontSizes(content) {
    var violations = [];
    var lines = content.split('\n');

    for (var i = 0; i < lines.length; i++) {
        var line = lines[i];

        // Look for font size declarations
        var fontSizeMatch = line.match(/\.fontSize\s*=\s*(\d+)/);
        if (fontSizeMatch) {
            var fontSize = parseInt(fontSizeMatch[1], 10);
            if (fontSize < CFG.MIN_FONT_SIZE) {
                violations.push({
                    type: 'FONT_SIZE_TOO_SMALL',
                    severity: CFG.SEVERITY.CRITICAL,
                    message: 'Font size ' + fontSize + 'pt below minimum ' + CFG.MIN_FONT_SIZE + 'pt',
                    line: i + 1
                });
            }
        }
    }

    return violations;
}

/**
 * Check margins and padding consistency
 * @param {String} content - Script content
 * @returns {Array} Violations found
 */
function checkMarginsAndPadding(content) {
    var violations = [];
    var lines = content.split('\n');

    var marginsFound = {};
    var paddingsFound = {};

    for (var i = 0; i < lines.length; i++) {
        var line = lines[i];

        // Look for margin declarations
        var marginMatch = line.match(/\.margins\s*=\s*(\d+)/);
        if (marginMatch) {
            var margin = parseInt(marginMatch[1], 10);
            marginsFound[margin] = (marginsFound[margin] || 0) + 1;

            if (margin !== CFG.STANDARD_MARGIN) {
                violations.push({
                    type: 'NON_STANDARD_MARGIN',
                    severity: CFG.SEVERITY.SUGGESTION,
                    message: 'Margin ' + margin + 'px differs from standard ' + CFG.STANDARD_MARGIN + 'px',
                    line: i + 1
                });
            }
        }

        // Look for padding declarations
        var paddingMatch = line.match(/\.spacing\s*=\s*(\d+)/);
        if (paddingMatch) {
            var padding = parseInt(paddingMatch[1], 10);
            paddingsFound[padding] = (paddingsFound[padding] || 0) + 1;

            if (padding !== CFG.STANDARD_PADDING) {
                violations.push({
                    type: 'NON_STANDARD_PADDING',
                    severity: CFG.SEVERITY.SUGGESTION,
                    message: 'Padding ' + padding + 'px differs from standard ' + CFG.STANDARD_PADDING + 'px',
                    line: i + 1
                });
            }
        }
    }

    return violations;
}

/**
 * Check for help text on complex controls
 * @param {String} content - Script content
 * @returns {Array} Violations found
 */
function checkHelpText(content) {
    var violations = [];
    var lines = content.split('\n');

    for (var i = 0; i < lines.length; i++) {
        var line = lines[i];

        // Look for complex input controls (EditText, DropDownList)
        if (/\.add\s*\(\s*['"]edittext['"]/i.test(line) || /\.add\s*\(\s*['"]dropdownlist['"]/i.test(line)) {
            var nextLines = lines.slice(Math.max(0, i - 2), Math.min(i + 3, lines.length)).join('\n');

            // Check if there's a StaticText label nearby
            if (!/\.add\s*\(\s*['"]statictext['"]/i.test(nextLines)) {
                violations.push({
                    type: 'MISSING_HELP_TEXT',
                    severity: CFG.SEVERITY.SUGGESTION,
                    message: 'Input control without label or help text',
                    line: i + 1
                });
            }
        }
    }

    return violations;
}

/**
 * Check for progress indicators in long operations
 * @param {String} content - Script content
 * @returns {Array} Violations found
 */
function checkProgressIndicators(content) {
    var violations = [];
    var lines = content.split('\n');

    var hasLongLoop = false;
    var hasProgressBar = false;

    for (var i = 0; i < lines.length; i++) {
        var line = lines[i];

        // Look for loops that might be long-running
        if (/for\s*\(.*\.length.*\)/.test(line) || /while\s*\(/.test(line)) {
            var loopContent = lines.slice(i, Math.min(i + 20, lines.length)).join('\n');

            // Check if loop contains Illustrator API calls (likely slow)
            if (/activeDocument|selection|pathItems|textFrames|pageItems/.test(loopContent)) {
                hasLongLoop = true;
            }
        }

        // Look for progress bar
        if (/progressbar/i.test(line) || /progress/i.test(line)) {
            hasProgressBar = true;
        }
    }

    if (hasLongLoop && !hasProgressBar) {
        violations.push({
            type: 'MISSING_PROGRESS_INDICATOR',
            severity: CFG.SEVERITY.SUGGESTION,
            message: 'Long operation without progress indicator',
            line: 0
        });
    }

    return violations;
}

/**
 * Check for group panels to organize controls
 * @param {String} content - Script content
 * @returns {Array} Violations found
 */
function checkGroupPanels(content) {
    var violations = [];
    var lines = content.split('\n');

    var controlCount = 0;
    var groupCount = 0;

    for (var i = 0; i < lines.length; i++) {
        var line = lines[i];

        if (/\.add\s*\(\s*['"]edittext['"]/i.test(line) ||
            /\.add\s*\(\s*['"]checkbox['"]/i.test(line) ||
            /\.add\s*\(\s*['"]radiobutton['"]/i.test(line)) {
            controlCount++;
        }

        if (/\.add\s*\(\s*['"]group['"]/i.test(line) || /\.add\s*\(\s*['"]panel['"]/i.test(line)) {
            groupCount++;
        }
    }

    // If many controls but no groups, suggest organization
    if (controlCount > 5 && groupCount === 0) {
        violations.push({
            type: 'MISSING_GROUP_PANELS',
            severity: CFG.SEVERITY.SUGGESTION,
            message: controlCount + ' controls without group panels for organization',
            line: 0
        });
    }

    return violations;
}

// ============================================================================
// REPORT GENERATION
// ============================================================================

/**
 * Generate HTML report from validation results
 * @param {Object} results - Validation results
 * @returns {String} HTML report
 */
function generateReport(results) {
    var html = [];

    html.push('<!DOCTYPE html>');
    html.push('<html><head>');
    html.push('<meta charset="UTF-8">');
    html.push('<title>UI/UX Consistency Report</title>');
    html.push('<style>');
    html.push('body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }');
    html.push('h1 { color: #333; }');
    html.push('.summary { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }');
    html.push('.stats { display: flex; gap: 20px; margin: 20px 0; }');
    html.push('.stat { background: #f9f9f9; padding: 15px; border-radius: 5px; flex: 1; }');
    html.push('.stat-label { font-size: 12px; color: #666; }');
    html.push('.stat-value { font-size: 32px; font-weight: bold; margin: 5px 0; }');
    html.push('.critical .stat-value { color: #d32f2f; }');
    html.push('.warning .stat-value { color: #f57c00; }');
    html.push('.suggestion .stat-value { color: #0288d1; }');
    html.push('.script { background: white; padding: 15px; margin: 10px 0; border-radius: 5px; }');
    html.push('.script-name { font-weight: bold; color: #1976d2; margin-bottom: 10px; }');
    html.push('.issue { margin: 8px 0; padding: 8px; border-left: 4px solid #ccc; }');
    html.push('.issue.critical { border-left-color: #d32f2f; background: #ffebee; }');
    html.push('.issue.warning { border-left-color: #f57c00; background: #fff3e0; }');
    html.push('.issue.suggestion { border-left-color: #0288d1; background: #e3f2fd; }');
    html.push('.issue-type { font-weight: bold; font-size: 12px; text-transform: uppercase; }');
    html.push('.issue-message { margin: 5px 0; }');
    html.push('.issue-line { font-size: 11px; color: #666; }');
    html.push('.no-issues { color: #4caf50; font-weight: bold; }');
    html.push('</style>');
    html.push('</head><body>');

    // Header
    html.push('<h1>UI/UX Consistency Report</h1>');
    html.push('<p>Generated: ' + new Date().toString() + '</p>');

    // Summary
    html.push('<div class="summary">');
    html.push('<h2>Summary</h2>');
    html.push('<p><strong>Total Scripts:</strong> ' + results.total + '</p>');
    html.push('<p><strong>Scripts with Dialogs:</strong> ' + results.withDialogs + '</p>');
    html.push('<p><strong>Scripts with Issues:</strong> ' + results.violations.length + '</p>');

    html.push('<div class="stats">');
    html.push('<div class="stat critical">');
    html.push('<div class="stat-label">Critical Issues</div>');
    html.push('<div class="stat-value">' + results.summary.critical + '</div>');
    html.push('</div>');
    html.push('<div class="stat warning">');
    html.push('<div class="stat-label">Warnings</div>');
    html.push('<div class="stat-value">' + results.summary.warning + '</div>');
    html.push('</div>');
    html.push('<div class="stat suggestion">');
    html.push('<div class="stat-label">Suggestions</div>');
    html.push('<div class="stat-value">' + results.summary.suggestion + '</div>');
    html.push('</div>');
    html.push('</div>');
    html.push('</div>');

    // Violations by script
    if (results.violations.length === 0) {
        html.push('<p class="no-issues">✓ No UI/UX consistency issues found!</p>');
    } else {
        html.push('<h2>Issues by Script</h2>');

        for (var i = 0; i < results.violations.length; i++) {
            var violation = results.violations[i];
            html.push('<div class="script">');
            html.push('<div class="script-name">' + violation.script + '</div>');

            for (var j = 0; j < violation.issues.length; j++) {
                var issue = violation.issues[j];
                html.push('<div class="issue ' + issue.severity + '">');
                html.push('<div class="issue-type">' + issue.type + ' (' + issue.severity + ')</div>');
                html.push('<div class="issue-message">' + issue.message + '</div>');
                if (issue.line > 0) {
                    html.push('<div class="issue-line">Line: ' + issue.line + '</div>');
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
 * Show summary dialog with results
 * @param {Object} results - Validation results
 * @param {String} reportPath - Path to HTML report
 */
function showSummary(results, reportPath) {
    var message = 'UI/UX Consistency Validation Complete\n\n';
    message += 'Scripts Scanned: ' + results.total + '\n';
    message += 'Scripts with Dialogs: ' + results.withDialogs + '\n';
    message += 'Scripts with Issues: ' + results.violations.length + '\n\n';
    message += 'Critical Issues: ' + results.summary.critical + '\n';
    message += 'Warnings: ' + results.summary.warning + '\n';
    message += 'Suggestions: ' + results.summary.suggestion + '\n\n';
    message += 'Report saved to:\n' + reportPath + '\n\n';
    message += 'Open report now?';

    var response = confirm(message);
    if (response) {
        var reportFile = new File(reportPath);
        reportFile.execute();
    }
}
