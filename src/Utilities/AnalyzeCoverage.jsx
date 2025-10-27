/**
 * Code Coverage Analyzer for AIS Library
 * @version 1.0.0
 * @description Analyzes which AIS library functions are used across all production scripts
 * @category Utilities
 * @author Vexy Illustrator Scripts
 * @license Apache-2.0
 *
 * @features
 * - Scans lib/core.jsx to extract all AIS.* function definitions
 * - Scans all production scripts for AIS.* function calls
 * - Calculates coverage percentage per module (Units, JSON, String, etc.)
 * - Identifies unused/untested library functions
 * - Shows most/least used functions with call counts
 * - Suggests which functions need tests first
 * - Generates coverage heatmap with color coding
 * - HTML report with interactive statistics
 *
 * @usage
 * - Run in Illustrator via File → Scripts → Other Script
 * - Analyzer scans all files automatically
 * - Report opens in browser showing coverage statistics
 * - Use before refactoring library code
 *
 * @requires lib/core.jsx
 */

#include "../.lib/core.jsx"

//@target illustrator
app.preferences.setBooleanPreference('ShowExternalJSXWarning', false);

(function() {
    try {
        main();
    } catch (err) {
        AIS.Error.show('Coverage Analyzer Error', err);
    }
})();

// ============================================================================
// CONFIGURATION
// ============================================================================

var CFG = {
    scriptRoot: new File($.fileName).parent.parent,
    libFile: null,
    productionScripts: [],
    libraryFunctions: {},
    functionCalls: {},
    reportPath: Folder.desktop + '/AIS_Coverage_Report.html'
};

// ============================================================================
// MAIN FUNCTION
// ============================================================================

function main() {
    // Find lib/core.jsx
    CFG.libFile = new File(CFG.scriptRoot + '/lib/core.jsx');
    if (!CFG.libFile.exists) {
        alert('Error\nCannot find lib/core.jsx');
        return;
    }

    // Find all production scripts
    findProductionScripts(CFG.scriptRoot);

    if (CFG.productionScripts.length === 0) {
        alert('Error\nNo production scripts found');
        return;
    }

    // Extract library functions
    extractLibraryFunctions();

    // Scan scripts for function calls
    scanScriptsForCalls();

    // Generate report
    generateReport();

    // Show summary
    var totalFuncs = countTotalFunctions();
    var usedFuncs = countUsedFunctions();
    var coveragePct = totalFuncs > 0 ? ((usedFuncs / totalFuncs) * 100).toFixed(1) : 0;

    alert('Coverage Analysis Complete\n\n' +
          'Library functions: ' + totalFuncs + '\n' +
          'Functions used: ' + usedFuncs + '\n' +
          'Coverage: ' + coveragePct + '%\n' +
          'Scripts scanned: ' + CFG.productionScripts.length + '\n\n' +
          'Report saved to Desktop');

    // Open report
    openReport();
}

// ============================================================================
// FILE SCANNING
// ============================================================================

/**
 * Find all production .jsx scripts
 * @param {Folder} folder - Root folder
 */
function findProductionScripts(folder) {
    var files = folder.getFiles();

    for (var i = 0; i < files.length; i++) {
        if (files[i] instanceof Folder) {
            // Skip old/, old2/, node_modules/
            var name = files[i].name;
            if (name !== 'old' && name !== 'old2' && name !== 'node_modules') {
                findProductionScripts(files[i]);
            }
        } else if (files[i] instanceof File) {
            if (files[i].name.match(/\.jsx$/i)) {
                // Skip lib files themselves
                if (files[i].fsName.indexOf('/lib/') === -1 &&
                    files[i].fsName.indexOf('\\lib\\') === -1) {
                    CFG.productionScripts.push(files[i]);
                }
            }
        }
    }
}

// ============================================================================
// LIBRARY FUNCTION EXTRACTION
// ============================================================================

/**
 * Extract all AIS.* function definitions from lib/core.jsx
 */
function extractLibraryFunctions() {
    CFG.libFile.encoding = 'UTF-8';
    if (!CFG.libFile.open('r')) {
        return;
    }

    var content = CFG.libFile.read();
    CFG.libFile.close();

    // Pattern: AIS.Module.function = function(...)
    var pattern = /AIS\.(\w+)\.(\w+)\s*=\s*function/g;
    var match;

    while ((match = pattern.exec(content)) !== null) {
        var module = match[1];
        var funcName = match[2];
        var fullName = 'AIS.' + module + '.' + funcName;

        if (!CFG.libraryFunctions[module]) {
            CFG.libraryFunctions[module] = [];
        }

        CFG.libraryFunctions[module].push({
            name: funcName,
            fullName: fullName,
            callCount: 0
        });
    }
}

// ============================================================================
// SCRIPT SCANNING FOR FUNCTION CALLS
// ============================================================================

/**
 * Scan all production scripts for AIS.* function calls
 */
function scanScriptsForCalls() {
    CFG.functionCalls = {};

    for (var i = 0; i < CFG.productionScripts.length; i++) {
        var script = CFG.productionScripts[i];
        scanScriptForCalls(script);
    }

    // Update call counts in library functions
    for (var module in CFG.libraryFunctions) {
        if (!CFG.libraryFunctions.hasOwnProperty(module)) continue;

        var funcs = CFG.libraryFunctions[module];
        for (var j = 0; j < funcs.length; j++) {
            var func = funcs[j];
            if (CFG.functionCalls[func.fullName]) {
                func.callCount = CFG.functionCalls[func.fullName];
            }
        }
    }
}

/**
 * Scan single script for AIS.* calls
 * @param {File} script - Script file
 */
function scanScriptForCalls(script) {
    script.encoding = 'UTF-8';
    if (!script.open('r')) {
        return;
    }

    var content = script.read();
    script.close();

    // Pattern: AIS.Module.function(
    var pattern = /AIS\.(\w+)\.(\w+)\s*\(/g;
    var match;

    while ((match = pattern.exec(content)) !== null) {
        var module = match[1];
        var funcName = match[2];
        var fullName = 'AIS.' + module + '.' + funcName;

        if (!CFG.functionCalls[fullName]) {
            CFG.functionCalls[fullName] = 0;
        }
        CFG.functionCalls[fullName]++;
    }
}

// ============================================================================
// STATISTICS
// ============================================================================

/**
 * Count total library functions
 * @returns {Number} Total count
 */
function countTotalFunctions() {
    var count = 0;
    for (var module in CFG.libraryFunctions) {
        if (CFG.libraryFunctions.hasOwnProperty(module)) {
            count += CFG.libraryFunctions[module].length;
        }
    }
    return count;
}

/**
 * Count used library functions (call count > 0)
 * @returns {Number} Used count
 */
function countUsedFunctions() {
    var count = 0;
    for (var module in CFG.libraryFunctions) {
        if (!CFG.libraryFunctions.hasOwnProperty(module)) continue;

        var funcs = CFG.libraryFunctions[module];
        for (var i = 0; i < funcs.length; i++) {
            if (funcs[i].callCount > 0) {
                count++;
            }
        }
    }
    return count;
}

/**
 * Get coverage percentage for module
 * @param {String} module - Module name
 * @returns {Number} Coverage percentage
 */
function getModuleCoverage(module) {
    if (!CFG.libraryFunctions[module]) return 0;

    var funcs = CFG.libraryFunctions[module];
    var total = funcs.length;
    var used = 0;

    for (var i = 0; i < funcs.length; i++) {
        if (funcs[i].callCount > 0) {
            used++;
        }
    }

    return total > 0 ? ((used / total) * 100).toFixed(1) : 0;
}

/**
 * Get top N most used functions
 * @param {Number} n - Number to return
 * @returns {Array} Top functions
 */
function getTopFunctions(n) {
    var allFuncs = [];

    for (var module in CFG.libraryFunctions) {
        if (!CFG.libraryFunctions.hasOwnProperty(module)) continue;
        allFuncs = allFuncs.concat(CFG.libraryFunctions[module]);
    }

    // Sort by call count descending
    allFuncs.sort(function(a, b) {
        return b.callCount - a.callCount;
    });

    return allFuncs.slice(0, n);
}

/**
 * Get unused functions
 * @returns {Array} Unused functions
 */
function getUnusedFunctions() {
    var unused = [];

    for (var module in CFG.libraryFunctions) {
        if (!CFG.libraryFunctions.hasOwnProperty(module)) continue;

        var funcs = CFG.libraryFunctions[module];
        for (var i = 0; i < funcs.length; i++) {
            if (funcs[i].callCount === 0) {
                unused.push(funcs[i]);
            }
        }
    }

    return unused;
}

// ============================================================================
// REPORT GENERATION
// ============================================================================

/**
 * Generate HTML coverage report
 */
function generateReport() {
    var html = '<!DOCTYPE html>\n<html>\n<head>\n';
    html += '<meta charset="UTF-8">\n';
    html += '<title>AIS Library Coverage Report</title>\n';
    html += '<style>\n';
    html += 'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 40px; background: #f5f5f5; }\n';
    html += 'h1, h2 { color: #333; }\n';
    html += '.summary { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }\n';
    html += '.stats { display: flex; gap: 20px; margin: 20px 0; }\n';
    html += '.stat { background: white; padding: 15px 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); flex: 1; }\n';
    html += '.stat-value { font-size: 32px; font-weight: bold; color: #007bff; }\n';
    html += '.stat-label { color: #666; font-size: 14px; margin-top: 5px; }\n';
    html += 'table { width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin: 20px 0; }\n';
    html += 'th { background: #007bff; color: white; padding: 12px; text-align: left; }\n';
    html += 'td { padding: 10px 12px; border-bottom: 1px solid #ddd; }\n';
    html += 'tr:hover { background: #f8f9fa; }\n';
    html += '.coverage-bar { background: #e9ecef; height: 20px; border-radius: 10px; overflow: hidden; }\n';
    html += '.coverage-fill { background: #28a745; height: 100%; transition: width 0.3s; }\n';
    html += '.coverage-low .coverage-fill { background: #dc3545; }\n';
    html += '.coverage-medium .coverage-fill { background: #ffc107; }\n';
    html += '.unused { background: #fff3cd; }\n';
    html += '.code { font-family: "SF Mono", Monaco, monospace; font-size: 13px; background: #f8f9fa; padding: 2px 6px; border-radius: 3px; }\n';
    html += '</style>\n';
    html += '</head>\n<body>\n';

    // Title
    html += '<h1>AIS Library Coverage Report</h1>\n';
    html += '<p>Generated: ' + new Date().toString() + '</p>\n';

    // Summary stats
    var totalFuncs = countTotalFunctions();
    var usedFuncs = countUsedFunctions();
    var unusedFuncs = totalFuncs - usedFuncs;
    var coveragePct = totalFuncs > 0 ? ((usedFuncs / totalFuncs) * 100).toFixed(1) : 0;

    html += '<div class="stats">\n';
    html += '<div class="stat"><div class="stat-value">' + totalFuncs + '</div><div class="stat-label">Total Functions</div></div>\n';
    html += '<div class="stat"><div class="stat-value">' + usedFuncs + '</div><div class="stat-label">Used (' + coveragePct + '%)</div></div>\n';
    html += '<div class="stat"><div class="stat-value">' + unusedFuncs + '</div><div class="stat-label">Unused</div></div>\n';
    html += '<div class="stat"><div class="stat-value">' + CFG.productionScripts.length + '</div><div class="stat-label">Scripts Scanned</div></div>\n';
    html += '</div>\n';

    // Module breakdown
    html += '<h2>Coverage by Module</h2>\n';
    html += '<table>\n';
    html += '<thead><tr><th>Module</th><th>Functions</th><th>Used</th><th>Coverage</th></tr></thead>\n';
    html += '<tbody>\n';

    for (var module in CFG.libraryFunctions) {
        if (!CFG.libraryFunctions.hasOwnProperty(module)) continue;

        var funcs = CFG.libraryFunctions[module];
        var total = funcs.length;
        var used = 0;

        for (var i = 0; i < funcs.length; i++) {
            if (funcs[i].callCount > 0) used++;
        }

        var coverage = getModuleCoverage(module);
        var barClass = coverage < 50 ? 'coverage-low' : (coverage < 80 ? 'coverage-medium' : '');

        html += '<tr>\n';
        html += '<td><strong>' + module + '</strong></td>\n';
        html += '<td>' + total + '</td>\n';
        html += '<td>' + used + '</td>\n';
        html += '<td><div class="coverage-bar ' + barClass + '"><div class="coverage-fill" style="width: ' + coverage + '%"></div></div>' + coverage + '%</td>\n';
        html += '</tr>\n';
    }

    html += '</tbody>\n</table>\n';

    // Top 10 most used
    var topFuncs = getTopFunctions(10);
    html += '<h2>Top 10 Most Used Functions</h2>\n';
    html += '<table>\n';
    html += '<thead><tr><th>Rank</th><th>Function</th><th>Calls</th></tr></thead>\n';
    html += '<tbody>\n';

    for (var i = 0; i < topFuncs.length; i++) {
        html += '<tr>\n';
        html += '<td>' + (i + 1) + '</td>\n';
        html += '<td><span class="code">' + topFuncs[i].fullName + '()</span></td>\n';
        html += '<td>' + topFuncs[i].callCount + '</td>\n';
        html += '</tr>\n';
    }

    html += '</tbody>\n</table>\n';

    // Unused functions
    var unused = getUnusedFunctions();
    if (unused.length > 0) {
        html += '<h2>Unused Functions (' + unused.length + ')</h2>\n';
        html += '<table>\n';
        html += '<thead><tr><th>Function</th><th>Recommendation</th></tr></thead>\n';
        html += '<tbody>\n';

        for (var i = 0; i < unused.length; i++) {
            html += '<tr class="unused">\n';
            html += '<td><span class="code">' + unused[i].fullName + '()</span></td>\n';
            html += '<td>Consider adding tests or removing if truly unused</td>\n';
            html += '</tr>\n';
        }

        html += '</tbody>\n</table>\n';
    }

    html += '</body>\n</html>';

    // Write report
    var file = new File(CFG.reportPath);
    file.encoding = 'UTF-8';
    if (file.open('w')) {
        file.write(html);
        file.close();
    }
}

/**
 * Open HTML report in browser
 */
function openReport() {
    var file = new File(CFG.reportPath);
    if (file.exists) {
        file.execute();
    }
}
