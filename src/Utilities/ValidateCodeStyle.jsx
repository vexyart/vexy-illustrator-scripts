/**
 * Validate Code Style | Vexy Utility Script
 * @version 1.0.0
 * @description Validates code style consistency across all production scripts to ensure maintainable, uniform codebase
 *
 * @author Vexy Scripts Project
 * @license Apache-2.0
 *
 * @features
 * - Validates file structure compliance (sections in correct order)
 * - Checks function naming conventions (camelCase, UPPER_SNAKE_CASE)
 * - Verifies indentation consistency (tabs vs spaces)
 * - Checks line length limits (< 120 characters)
 * - Validates comment formatting (JSDoc style)
 * - Checks error handling patterns (try-catch structure)
 * - Detects magic numbers (should be named constants)
 * - Verifies consistent string quotes (single vs double)
 * - Generates HTML report with style violations
 * - Shows examples of correct style for each violation
 *
 * @usage
 * Run before commits, before releases, or when refactoring to ensure code style consistency
 *
 * @notes
 * - Enforces project-specific coding standards (see CLAUDE.md)
 * - Scans all .jsx files except old/, old2/, templates/
 * - Reports both critical violations and suggestions
 * - Does not automatically fix code (use EnforceHeaderConsistency for headers)
 */




//@target illustrator
var c=File(Folder.myDocuments+"/Adobe Scripts/vexy-ville.ini");if(c.exists){c.open('r');var p=c.read();c.close();var l=File(p+".lib/core.jsx");if(l.exists)$.evalFile(l.fsName);}
app.preferences.setBooleanPreference('ShowExternalJSXWarning', false);

// ============================================================================
// CONFIGURATION
// ============================================================================

var CFG = {
    name: 'ValidateCodeStyle',
    version: '1.0.0',

    // Folders to scan
    scanFolders: [
        'Favorites', 'Text', 'Export', 'Measurement', 'Artboards',
        'Layers', 'Preferences', 'Utilities', 'Transform', 'Colors',
        'Paths', 'Selection', 'Print', 'Effects', 'Guides',
        'Layout', 'Strokes', 'Varia'
    ],

    // Folders to exclude
    excludeFolders: ['old', 'old2', 'templates', 'node_modules', '.git', 'tests'],

    // Style rules
    rules: {
        maxLineLength: 120,
        indentChar: '    ', // 4 spaces
        preferredQuote: "'", // Single quotes preferred
        maxFunctionLength: 100, // lines
        maxNestingDepth: 4,
        magicNumberThreshold: 2 // if number appears 2+ times, should be constant
    },

    // Required file structure sections (in order)
    requiredSections: [
        'JSDoc header',
        '#include statements',
        '//@target',
        'CONFIGURATION',
        'MAIN FUNCTION',
        'CORE LOGIC or BUSINESS LOGIC',
        'USER INTERFACE or UI FUNCTIONS',
        'UTILITIES',
        'ENTRY POINT'
    ],

    // Naming patterns
    patterns: {
        camelCase: /^[a-z][a-zA-Z0-9]*$/,
        PascalCase: /^[A-Z][a-zA-Z0-9]*$/,
        UPPER_SNAKE_CASE: /^[A-Z][A-Z0-9_]*$/,
        functionName: /^[a-z_][a-zA-Z0-9_]*$/
    }
};

// ============================================================================
// DATA STRUCTURES
// ============================================================================

/**
 * Style validation result for a single script
 * @typedef {Object} StyleValidationResult
 * @property {String} file - File path
 * @property {String} category - Category folder
 * @property {Number} lineCount - Total lines
 * @property {Array} errors - Critical style violations
 * @property {Array} warnings - Non-critical issues
 * @property {Array} suggestions - Improvement suggestions
 * @property {Object} stats - Code statistics
 */

// ============================================================================
// MAIN FUNCTION
// ============================================================================

function main() {
    var projectRoot = getProjectRoot();
    if (!projectRoot) {
        alert('Error\nCould not determine project root folder');
        return;
    }

    // Scan all production scripts
    var scripts = scanProductionScripts(projectRoot);

    if (scripts.length === 0) {
        alert('No scripts found\nCheck project folder structure');
        return;
    }

    // Validate each script
    var results = [];
    for (var i = 0; i < scripts.length; i++) {
        var result = validateScriptStyle(scripts[i]);
        results.push(result);
    }

    // Generate summary statistics
    var summary = generateSummary(results);

    // Generate HTML report
    var reportPath = generateHTMLReport(projectRoot, results, summary);

    // Show results dialog
    showResultsDialog(summary, reportPath);
}

// ============================================================================
// CORE VALIDATION LOGIC
// ============================================================================

/**
 * Validate code style for a single script
 * @param {File} file - Script file to validate
 * @returns {StyleValidationResult} - Validation result
 */
function validateScriptStyle(file) {
    var result = {
        file: file.name,
        fullPath: file.fsName,
        category: getCategoryFromPath(file.fsName),
        lineCount: 0,
        errors: [],
        warnings: [],
        suggestions: [],
        stats: {
            functions: 0,
            longLines: 0,
            maxNesting: 0,
            commentLines: 0,
            codeLines: 0,
            emptyLines: 0
        }
    };

    try {
        file.encoding = 'UTF-8';
        file.open('r');
        var content = file.read();
        file.close();

        var lines = content.split('\n');
        result.lineCount = lines.length;

        // Run all style checks
        checkFileStructure(lines, result);
        checkLineLength(lines, result);
        checkIndentation(lines, result);
        checkNamingConventions(lines, result);
        checkStringQuotes(lines, result);
        checkMagicNumbers(lines, result);
        checkErrorHandling(lines, result);
        checkCommentStyle(lines, result);
        checkFunctionLength(lines, result);
        checkNestingDepth(lines, result);
        calculateStats(lines, result);

    } catch (e) {
        result.errors.push({
            line: 0,
            message: 'Failed to read file: ' + e.message,
            severity: 'error'
        });
    }

    return result;
}

/**
 * Check file structure (sections in correct order)
 */
function checkFileStructure(lines, result) {
    var foundSections = [];
    var expectedOrder = [
        {pattern: /^\/\*\*/, name: 'JSDoc header', required: true},
        {pattern: /^#include/, name: '#include', required: true},
        {pattern: /^\/@target/, name: '@target', required: true},
        {pattern: /\/\/ CONFIGURATION/, name: 'CONFIGURATION', required: false},
        {pattern: /\/\/ MAIN FUNCTION/, name: 'MAIN FUNCTION', required: true},
        {pattern: /\/\/ (CORE|BUSINESS) LOGIC/, name: 'LOGIC', required: false},
        {pattern: /\/\/ (USER INTERFACE|UI)/, name: 'UI', required: false},
        {pattern: /\/\/ UTILITIES/, name: 'UTILITIES', required: false},
        {pattern: /\/\/ ENTRY POINT/, name: 'ENTRY POINT', required: true}
    ];

    for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        for (var j = 0; j < expectedOrder.length; j++) {
            if (expectedOrder[j].pattern.test(line)) {
                foundSections.push({
                    name: expectedOrder[j].name,
                    line: i + 1,
                    index: j
                });
            }
        }
    }

    // Check if required sections exist
    for (var k = 0; k < expectedOrder.length; k++) {
        if (expectedOrder[k].required) {
            var found = false;
            for (var m = 0; m < foundSections.length; m++) {
                if (foundSections[m].index === k) {
                    found = true;
                    break;
                }
            }
            if (!found) {
                result.errors.push({
                    line: 0,
                    message: 'Missing required section: ' + expectedOrder[k].name,
                    severity: 'error',
                    fix: 'Add section comment: // ============================================================================\n// ' + expectedOrder[k].name.toUpperCase() + '\n// ============================================================================'
                });
            }
        }
    }

    // Check section order
    for (var n = 1; n < foundSections.length; n++) {
        if (foundSections[n].index < foundSections[n-1].index) {
            result.warnings.push({
                line: foundSections[n].line,
                message: 'Section "' + foundSections[n].name + '" appears out of order (expected after "' + foundSections[n-1].name + '")',
                severity: 'warning'
            });
        }
    }
}

/**
 * Check line length (< 120 characters)
 */
function checkLineLength(lines, result) {
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        if (line.length > CFG.rules.maxLineLength) {
            result.stats.longLines++;
            result.warnings.push({
                line: i + 1,
                message: 'Line too long (' + line.length + ' chars, max ' + CFG.rules.maxLineLength + ')',
                severity: 'warning',
                fix: 'Break into multiple lines or shorten'
            });
        }
    }
}

/**
 * Check indentation consistency
 */
function checkIndentation(lines, result) {
    var tabCount = 0;
    var spaceCount = 0;

    for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        if (line.match(/^\t/)) {
            tabCount++;
        } else if (line.match(/^    /)) {
            spaceCount++;
        }
    }

    if (tabCount > 0 && spaceCount > 0) {
        result.warnings.push({
            line: 0,
            message: 'Mixed tabs and spaces detected (tabs: ' + tabCount + ', spaces: ' + spaceCount + ')',
            severity: 'warning',
            fix: 'Use consistent indentation (project standard: 4 spaces)'
        });
    }

    // Check for inconsistent indentation levels
    for (var j = 0; j < lines.length; j++) {
        var line2 = lines[j];
        var indent = line2.match(/^(\s+)/);
        if (indent && indent[1].length % 4 !== 0) {
            result.warnings.push({
                line: j + 1,
                message: 'Inconsistent indentation (' + indent[1].length + ' spaces, should be multiple of 4)',
                severity: 'warning'
            });
        }
    }
}

/**
 * Check naming conventions
 */
function checkNamingConventions(lines, result) {
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i];

        // Check function names (should be camelCase or _camelCase)
        var funcMatch = line.match(/^function\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/);
        if (funcMatch) {
            var funcName = funcMatch[1];
            if (!CFG.patterns.functionName.test(funcName)) {
                result.warnings.push({
                    line: i + 1,
                    message: 'Function name "' + funcName + '" does not follow camelCase convention',
                    severity: 'warning',
                    fix: 'Use camelCase: ' + funcName.charAt(0).toLowerCase() + funcName.slice(1)
                });
            }
        }

        // Check constants (should be UPPER_SNAKE_CASE)
        var constMatch = line.match(/^var\s+([A-Z][A-Z0-9_]*)\s*=/);
        if (constMatch) {
            var constName = constMatch[1];
            if (!CFG.patterns.UPPER_SNAKE_CASE.test(constName)) {
                result.suggestions.push({
                    line: i + 1,
                    message: 'Constant "' + constName + '" should use UPPER_SNAKE_CASE',
                    severity: 'suggestion'
                });
            }
        }
    }
}

/**
 * Check string quote consistency
 */
function checkStringQuotes(lines, result) {
    var singleQuotes = 0;
    var doubleQuotes = 0;

    for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        // Count string literals (avoid comments)
        if (!line.match(/^\s*\/\//)) {
            var singles = line.match(/'/g);
            var doubles = line.match(/"/g);
            if (singles) singleQuotes += singles.length / 2; // Divide by 2 (opening + closing)
            if (doubles) doubleQuotes += doubles.length / 2;
        }
    }

    if (singleQuotes > 0 && doubleQuotes > 0) {
        var ratio = singleQuotes / (singleQuotes + doubleQuotes);
        if (ratio < 0.8 && ratio > 0.2) {
            result.suggestions.push({
                line: 0,
                message: 'Mixed quote styles (single: ' + Math.round(singleQuotes) + ', double: ' + Math.round(doubleQuotes) + ')',
                severity: 'suggestion',
                fix: 'Project standard: prefer single quotes'
            });
        }
    }
}

/**
 * Check for magic numbers
 */
function checkMagicNumbers(lines, result) {
    var numbers = {};

    for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        // Skip constant definitions and comments
        if (line.match(/^var\s+[A-Z]/) || line.match(/^\s*\/\//)) {
            continue;
        }

        // Find numeric literals (excluding 0, 1, -1, 2 which are common)
        var numMatches = line.match(/\b(\d+\.?\d*)\b/g);
        if (numMatches) {
            for (var j = 0; j < numMatches.length; j++) {
                var num = numMatches[j];
                if (num !== '0' && num !== '1' && num !== '2' && num !== '-1') {
                    if (!numbers[num]) {
                        numbers[num] = [];
                    }
                    numbers[num].push(i + 1);
                }
            }
        }
    }

    // Report numbers that appear multiple times
    for (var num2 in numbers) {
        if (numbers[num2].length >= CFG.rules.magicNumberThreshold) {
            result.suggestions.push({
                line: numbers[num2][0],
                message: 'Magic number ' + num2 + ' appears ' + numbers[num2].length + ' times (lines: ' + numbers[num2].slice(0,3).join(', ') + '...)',
                severity: 'suggestion',
                fix: 'Consider defining as named constant: var SOME_NAME = ' + num2 + ';'
            });
        }
    }
}

/**
 * Check error handling patterns
 */
function checkErrorHandling(lines, result) {
    var tryBlocks = 0;
    var catchBlocks = 0;
    var functions = 0;

    for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        if (line.match(/^\s*try\s*\{/)) tryBlocks++;
        if (line.match(/^\s*} catch\s*\(/)) catchBlocks++;
        if (line.match(/^function\s+/)) functions++;
    }

    if (tryBlocks === 0 && functions > 5) {
        result.warnings.push({
            line: 0,
            message: 'No error handling found (0 try-catch blocks in ' + functions + ' functions)',
            severity: 'warning',
            fix: 'Add try-catch blocks for error handling, especially around file I/O and main logic'
        });
    }

    if (tryBlocks !== catchBlocks) {
        result.errors.push({
            line: 0,
            message: 'Mismatched try-catch blocks (try: ' + tryBlocks + ', catch: ' + catchBlocks + ')',
            severity: 'error'
        });
    }
}

/**
 * Check comment style
 */
function checkCommentStyle(lines, result) {
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i];

        // Check for inline comments without space
        if (line.match(/\/\/\S/)) {
            result.suggestions.push({
                line: i + 1,
                message: 'Inline comment should have space after // marker',
                severity: 'suggestion',
                fix: 'Change "//" to "// "'
            });
        }

        // Check for JSDoc-style comments that aren't properly formatted
        if (line.match(/\/\*\*/) && !line.match(/\/\*\*\s*$/)) {
            result.warnings.push({
                line: i + 1,
                message: 'JSDoc comment should start on its own line',
                severity: 'warning'
            });
        }
    }
}

/**
 * Check function length
 */
function checkFunctionLength(lines, result) {
    var functionStarts = [];
    var functionEnds = [];

    for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        if (line.match(/^function\s+/)) {
            functionStarts.push(i);
        }
    }

    // Find function ends by matching braces (simple heuristic)
    for (var j = 0; j < functionStarts.length; j++) {
        var start = functionStarts[j];
        var braceCount = 0;
        var foundStart = false;

        for (var k = start; k < lines.length; k++) {
            var line2 = lines[k];
            if (line2.indexOf('{') !== -1) {
                braceCount++;
                foundStart = true;
            }
            if (line2.indexOf('}') !== -1) {
                braceCount--;
                if (foundStart && braceCount === 0) {
                    functionEnds.push(k);
                    var length = k - start;
                    if (length > CFG.rules.maxFunctionLength) {
                        result.suggestions.push({
                            line: start + 1,
                            message: 'Function is too long (' + length + ' lines, recommended max: ' + CFG.rules.maxFunctionLength + ')',
                            severity: 'suggestion',
                            fix: 'Consider breaking into smaller functions'
                        });
                    }
                    break;
                }
            }
        }
    }
}

/**
 * Check nesting depth
 */
function checkNestingDepth(lines, result) {
    var maxDepth = 0;
    var currentDepth = 0;
    var lineWithMaxDepth = 0;

    for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        var opens = (line.match(/\{/g) || []).length;
        var closes = (line.match(/\}/g) || []).length;

        currentDepth += opens - closes;

        if (currentDepth > maxDepth) {
            maxDepth = currentDepth;
            lineWithMaxDepth = i + 1;
        }
    }

    result.stats.maxNesting = maxDepth;

    if (maxDepth > CFG.rules.maxNestingDepth) {
        result.warnings.push({
            line: lineWithMaxDepth,
            message: 'Excessive nesting depth (' + maxDepth + ' levels, max recommended: ' + CFG.rules.maxNestingDepth + ')',
            severity: 'warning',
            fix: 'Refactor complex logic, use early returns, extract nested code into functions'
        });
    }
}

/**
 * Calculate code statistics
 */
function calculateStats(lines, result) {
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        var trimmed = AIS.String.trim(line);

        if (trimmed === '') {
            result.stats.emptyLines++;
        } else if (trimmed.indexOf('//') === 0 || trimmed.indexOf('/*') === 0 || trimmed.indexOf('*') === 0) {
            result.stats.commentLines++;
        } else {
            result.stats.codeLines++;
        }

        if (line.match(/^function\s+/)) {
            result.stats.functions++;
        }
    }
}

// ============================================================================
// REPORTING
// ============================================================================

/**
 * Generate summary statistics
 */
function generateSummary(results) {
    var summary = {
        totalScripts: results.length,
        totalErrors: 0,
        totalWarnings: 0,
        totalSuggestions: 0,
        scriptsWithErrors: 0,
        scriptsWithWarnings: 0,
        perfectScripts: 0,
        totalLines: 0,
        totalFunctions: 0,
        avgLinesPerScript: 0,
        avgFunctionsPerScript: 0
    };

    for (var i = 0; i < results.length; i++) {
        var result = results[i];
        summary.totalErrors += result.errors.length;
        summary.totalWarnings += result.warnings.length;
        summary.totalSuggestions += result.suggestions.length;
        summary.totalLines += result.lineCount;
        summary.totalFunctions += result.stats.functions;

        if (result.errors.length > 0) {
            summary.scriptsWithErrors++;
        } else if (result.warnings.length > 0) {
            summary.scriptsWithWarnings++;
        } else {
            summary.perfectScripts++;
        }
    }

    if (results.length > 0) {
        summary.avgLinesPerScript = Math.round(summary.totalLines / results.length);
        summary.avgFunctionsPerScript = Math.round(summary.totalFunctions / results.length);
    }

    return summary;
}

/**
 * Generate HTML report
 */
function generateHTMLReport(projectRoot, results, summary) {
    var reportFile = new File(projectRoot + '/code-style-report.html');

    try {
        reportFile.encoding = 'UTF-8';
        reportFile.open('w');

        // Write HTML header
        reportFile.write('<!DOCTYPE html>\n');
        reportFile.write('<html lang="en">\n<head>\n');
        reportFile.write('<meta charset="UTF-8">\n');
        reportFile.write('<meta name="viewport" content="width=device-width, initial-scale=1.0">\n');
        reportFile.write('<title>Code Style Validation Report</title>\n');
        reportFile.write('<style>\n');
        reportFile.write('body { font-family: -apple-system, system-ui, sans-serif; margin: 40px; background: #f5f5f5; }\n');
        reportFile.write('h1 { color: #333; border-bottom: 3px solid #2962FF; padding-bottom: 10px; }\n');
        reportFile.write('h2 { color: #555; margin-top: 40px; }\n');
        reportFile.write('.summary { background: white; padding: 20px; border-radius: 8px; margin-bottom: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }\n');
        reportFile.write('.stat { display: inline-block; margin: 10px 20px 10px 0; }\n');
        reportFile.write('.stat-label { font-size: 12px; color: #666; text-transform: uppercase; }\n');
        reportFile.write('.stat-value { font-size: 32px; font-weight: bold; color: #2962FF; }\n');
        reportFile.write('.script { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }\n');
        reportFile.write('.script-header { font-size: 18px; font-weight: bold; margin-bottom: 10px; }\n');
        reportFile.write('.issue { margin: 10px 0; padding: 10px; border-left: 4px solid; }\n');
        reportFile.write('.error { border-color: #D50000; background: #FFEBEE; }\n');
        reportFile.write('.warning { border-color: #FF6F00; background: #FFF3E0; }\n');
        reportFile.write('.suggestion { border-color: #2962FF; background: #E3F2FD; }\n');
        reportFile.write('.fix { font-style: italic; color: #666; margin-top: 5px; font-size: 14px; }\n');
        reportFile.write('.perfect { color: #00C853; font-weight: bold; }\n');
        reportFile.write('.stats { font-size: 14px; color: #666; margin-top: 10px; }\n');
        reportFile.write('</style>\n</head>\n<body>\n');

        // Write title and timestamp
        reportFile.write('<h1>Code Style Validation Report</h1>\n');
        reportFile.write('<p>Generated: ' + new Date().toString() + '</p>\n');

        // Write summary
        reportFile.write('<div class="summary">\n');
        reportFile.write('<h2>Summary</h2>\n');
        reportFile.write('<div class="stat"><div class="stat-label">Scripts Analyzed</div><div class="stat-value">' + summary.totalScripts + '</div></div>\n');
        reportFile.write('<div class="stat"><div class="stat-label">Errors</div><div class="stat-value" style="color:#D50000;">' + summary.totalErrors + '</div></div>\n');
        reportFile.write('<div class="stat"><div class="stat-label">Warnings</div><div class="stat-value" style="color:#FF6F00;">' + summary.totalWarnings + '</div></div>\n');
        reportFile.write('<div class="stat"><div class="stat-label">Suggestions</div><div class="stat-value" style="color:#2962FF;">' + summary.totalSuggestions + '</div></div>\n');
        reportFile.write('<div class="stat"><div class="stat-label">Perfect Scripts</div><div class="stat-value" style="color:#00C853;">' + summary.perfectScripts + '</div></div>\n');
        reportFile.write('<p>Total code lines: ' + summary.totalLines + ' | Average: ' + summary.avgLinesPerScript + ' lines/script | ' + summary.avgFunctionsPerScript + ' functions/script</p>\n');
        reportFile.write('</div>\n');

        // Write per-script details
        reportFile.write('<h2>Per-Script Details</h2>\n');

        for (var i = 0; i < results.length; i++) {
            var result = results[i];
            var isPerfect = result.errors.length === 0 && result.warnings.length === 0 && result.suggestions.length === 0;

            reportFile.write('<div class="script">\n');
            reportFile.write('<div class="script-header">' + result.file + ' <span style="font-size:14px; color:#666;">(' + result.category + ')</span>');
            if (isPerfect) {
                reportFile.write(' <span class="perfect">✓ Perfect</span>');
            }
            reportFile.write('</div>\n');
            reportFile.write('<div class="stats">Lines: ' + result.lineCount + ' | Functions: ' + result.stats.functions + ' | Max nesting: ' + result.stats.maxNesting + ' | Long lines: ' + result.stats.longLines + '</div>\n');

            // Write errors
            if (result.errors.length > 0) {
                for (var j = 0; j < result.errors.length; j++) {
                    var error = result.errors[j];
                    reportFile.write('<div class="issue error">');
                    reportFile.write('<strong>Error (Line ' + error.line + '):</strong> ' + error.message);
                    if (error.fix) {
                        reportFile.write('<div class="fix">Fix: ' + error.fix + '</div>');
                    }
                    reportFile.write('</div>\n');
                }
            }

            // Write warnings
            if (result.warnings.length > 0) {
                for (var k = 0; k < result.warnings.length; k++) {
                    var warning = result.warnings[k];
                    reportFile.write('<div class="issue warning">');
                    reportFile.write('<strong>Warning (Line ' + warning.line + '):</strong> ' + warning.message);
                    if (warning.fix) {
                        reportFile.write('<div class="fix">Fix: ' + warning.fix + '</div>');
                    }
                    reportFile.write('</div>\n');
                }
            }

            // Write suggestions (limit to 5 per script to avoid clutter)
            if (result.suggestions.length > 0) {
                var displayCount = Math.min(result.suggestions.length, 5);
                for (var m = 0; m < displayCount; m++) {
                    var suggestion = result.suggestions[m];
                    reportFile.write('<div class="issue suggestion">');
                    reportFile.write('<strong>Suggestion (Line ' + suggestion.line + '):</strong> ' + suggestion.message);
                    if (suggestion.fix) {
                        reportFile.write('<div class="fix">Fix: ' + suggestion.fix + '</div>');
                    }
                    reportFile.write('</div>\n');
                }
                if (result.suggestions.length > 5) {
                    reportFile.write('<p><em>... and ' + (result.suggestions.length - 5) + ' more suggestions</em></p>\n');
                }
            }

            if (isPerfect) {
                reportFile.write('<p class="perfect">No style issues found!</p>\n');
            }

            reportFile.write('</div>\n');
        }

        reportFile.write('</body>\n</html>');
        reportFile.close();

        return reportFile.fsName;
    } catch (e) {
        alert('Error generating report\n' + e.message);
        return null;
    }
}

/**
 * Show results dialog
 */
function showResultsDialog(summary, reportPath) {
    var dialog = new Window('dialog', CFG.name + ' v' + CFG.version);
    dialog.alignChildren = ['fill', 'top'];

    // Summary panel
    var summaryGroup = dialog.add('panel', undefined, 'Validation Summary');
    summaryGroup.alignChildren = ['fill', 'top'];
    summaryGroup.margins = [20, 20, 20, 20];

    var stats1 = summaryGroup.add('statictext', undefined, 'Scripts analyzed: ' + summary.totalScripts);
    var stats2 = summaryGroup.add('statictext', undefined, 'Errors: ' + summary.totalErrors + ' | Warnings: ' + summary.totalWarnings + ' | Suggestions: ' + summary.totalSuggestions);
    var stats3 = summaryGroup.add('statictext', undefined, 'Perfect scripts: ' + summary.perfectScripts + ' | With errors: ' + summary.scriptsWithErrors + ' | With warnings: ' + summary.scriptsWithWarnings);
    var stats4 = summaryGroup.add('statictext', undefined, 'Total code lines: ' + summary.totalLines + ' | Average: ' + summary.avgLinesPerScript + ' lines/script');

    // Color code the statistics
    if (summary.totalErrors > 0) {
        stats2.graphics.foregroundColor = stats2.graphics.newPen(stats2.graphics.PenType.SOLID_COLOR, [0.8, 0, 0], 1);
    } else if (summary.totalWarnings > 0) {
        stats2.graphics.foregroundColor = stats2.graphics.newPen(stats2.graphics.PenType.SOLID_COLOR, [1, 0.4, 0], 1);
    } else {
        stats2.graphics.foregroundColor = stats2.graphics.newPen(stats2.graphics.PenType.SOLID_COLOR, [0, 0.7, 0.3], 1);
    }

    // Report path
    if (reportPath) {
        var reportGroup = dialog.add('group');
        reportGroup.orientation = 'column';
        reportGroup.alignChildren = ['fill', 'top'];
        reportGroup.add('statictext', undefined, 'Full report saved to:');
        var pathText = reportGroup.add('edittext', undefined, reportPath, {readonly: true, multiline: true});
        pathText.minimumSize = [500, 40];
    }

    // Buttons
    var buttonGroup = dialog.add('group');
    buttonGroup.alignment = ['center', 'bottom'];

    if (reportPath) {
        var openButton = buttonGroup.add('button', undefined, 'Open Report');
        openButton.onClick = function() {
            var reportFile = new File(reportPath);
            reportFile.execute();
        };
    }

    var closeButton = buttonGroup.add('button', undefined, 'Close', {name: 'ok'});

    dialog.show();
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Get project root folder
 */
function getProjectRoot() {
    try {
        var scriptFile = new File($.fileName);
        var scriptFolder = scriptFile.parent; // Utilities/
        var projectRoot = scriptFolder.parent; // Project root
        return projectRoot.fsName;
    } catch (e) {
        return null;
    }
}

/**
 * Scan production scripts
 */
function scanProductionScripts(projectRoot) {
    var scripts = [];

    for (var i = 0; i < CFG.scanFolders.length; i++) {
        var folderPath = projectRoot + '/' + CFG.scanFolders[i];
        var folder = new Folder(folderPath);

        if (folder.exists) {
            var files = folder.getFiles('*.jsx');
            for (var j = 0; j < files.length; j++) {
                scripts.push(files[j]);
            }
        }
    }

    return scripts;
}

/**
 * Get category from file path
 */
function getCategoryFromPath(path) {
    for (var i = 0; i < CFG.scanFolders.length; i++) {
        if (path.indexOf('/' + CFG.scanFolders[i] + '/') !== -1) {
            return CFG.scanFolders[i];
        }
    }
    return 'Unknown';
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
