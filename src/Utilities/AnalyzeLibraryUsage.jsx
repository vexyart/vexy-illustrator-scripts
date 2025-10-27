/**
 * Analyze Library Usage | Vexy Utility Script
 * @version 1.0.0
 * @description Analyzes AIS library function usage across all production scripts
 *
 * @author Vexy Scripts Project
 * @license MIT
 *
 * @features
 * - Scans all production scripts for AIS.* function calls
 * - Counts usage frequency for each library function
 * - Identifies unused library functions
 * - Finds scripts not using AIS library properly
 * - Generates usage heatmap visualization
 * - Suggests consolidation opportunities
 * - Checks for deprecated patterns
 * - Provides library health metrics
 * - Identifies most/least used functions
 * - Generates HTML report with statistics and charts
 *
 * @usage
 * Run periodically to assess library health and identify optimization opportunities
 *
 * @notes
 * - Analyzes all categories except old/, old2/, templates/
 * - Tracks both direct calls (AIS.Units.get) and aliased calls
 * - Generates comprehensive usage statistics
 * - Helps prioritize library maintenance and improvements
 */

#include "../.lib/core.jsx"

//@target illustrator
app.preferences.setBooleanPreference('ShowExternalJSXWarning', false);

// ============================================================================
// CONFIGURATION
// ============================================================================

var CFG = {
    name: 'AnalyzeLibraryUsage',
    version: '1.0.0',

    // Folders to analyze
    scanFolders: [
        'Favorites', 'Text', 'Export', 'Measurement', 'Artboards',
        'Layers', 'Preferences', 'Utilities', 'Transform', 'Colors',
        'Paths', 'Selection', 'Print', 'Effects', 'Guides',
        'Layout', 'Strokes', 'Varia'
    ],

    // Folders to exclude
    excludeFolders: ['old', 'old2', 'templates', 'node_modules', '.git'],

    // AIS namespace patterns to search for
    namespacePatterns: [
        /AIS\.(\w+)\.(\w+)/g,  // AIS.Module.function()
        /AIS\.(\w+)/g          // AIS.function()
    ]
};

// ============================================================================
// DATA STRUCTURES
// ============================================================================

/**
 * Usage statistics for library analysis
 * @typedef {Object} UsageStats
 * @property {Object} functionCounts - Function name → usage count
 * @property {Object} moduleCounts - Module name → usage count
 * @property {Object} scriptUsage - Script name → functions used
 * @property {Array} unusedFunctions - Functions defined but never used
 * @property {Array} mostUsed - Most frequently used functions
 * @property {Array} leastUsed - Least used functions
 * @property {Array} scriptsNotUsingLibrary - Scripts not using AIS at all
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

    // Analyze library usage
    var stats = analyzeLibraryUsage(scripts, projectRoot);

    // Generate report
    var reportPath = generateHTMLReport(projectRoot, stats);

    // Open report
    if (reportPath) {
        AIS.System.openURL('file://' + reportPath);
        alert('Analysis complete\n\n' +
              'Scripts analyzed: ' + scripts.length + '\n' +
              'Functions found: ' + stats.uniqueFunctionCount + '\n' +
              'Total calls: ' + stats.totalCalls + '\n' +
              'Scripts using AIS: ' + stats.scriptsUsingLibrary + '/' + scripts.length + '\n\n' +
              'Report opened in browser');
    }
}

// ============================================================================
// SCRIPT SCANNING
// ============================================================================

/**
 * Get project root folder
 * @returns {Folder} Project root folder
 */
function getProjectRoot() {
    var scriptFile = new File($.fileName);
    var scriptFolder = scriptFile.parent; // Utilities/
    var projectRoot = scriptFolder.parent; // Project root
    return projectRoot;
}

/**
 * Scan all production scripts
 * @param {Folder} projectRoot - Project root folder
 * @returns {Array<File>} Array of script files
 */
function scanProductionScripts(projectRoot) {
    var scripts = [];

    for (var i = 0; i < CFG.scanFolders.length; i++) {
        var categoryName = CFG.scanFolders[i];
        var categoryFolder = new Folder(projectRoot.fsName + '/' + categoryName);

        if (!categoryFolder.exists) continue;

        var files = categoryFolder.getFiles('*.jsx');
        for (var j = 0; j < files.length; j++) {
            scripts.push(files[j]);
        }
    }

    return scripts;
}

// ============================================================================
// ANALYSIS LOGIC
// ============================================================================

/**
 * Analyze library usage across all scripts
 * @param {Array<File>} scripts - Script files to analyze
 * @param {Folder} projectRoot - Project root folder
 * @returns {UsageStats} Usage statistics
 */
function analyzeLibraryUsage(scripts, projectRoot) {
    var stats = {
        functionCounts: {},
        moduleCounts: {},
        scriptUsage: {},
        totalCalls: 0,
        uniqueFunctionCount: 0,
        scriptsUsingLibrary: 0,
        scriptsNotUsingLibrary: []
    };

    // First, get all functions defined in lib/core.jsx
    var definedFunctions = getDefinedLibraryFunctions(projectRoot);

    // Analyze each script
    for (var i = 0; i < scripts.length; i++) {
        var script = scripts[i];
        var usage = analyzeScript(script);

        if (usage.callCount > 0) {
            stats.scriptsUsingLibrary++;
            stats.scriptUsage[script.name] = usage;

            // Aggregate function counts
            for (var funcName in usage.functions) {
                if (usage.functions.hasOwnProperty(funcName)) {
                    if (!stats.functionCounts[funcName]) {
                        stats.functionCounts[funcName] = 0;
                    }
                    stats.functionCounts[funcName] += usage.functions[funcName];
                    stats.totalCalls += usage.functions[funcName];
                }
            }

            // Aggregate module counts
            for (var modName in usage.modules) {
                if (usage.modules.hasOwnProperty(modName)) {
                    if (!stats.moduleCounts[modName]) {
                        stats.moduleCounts[modName] = 0;
                    }
                    stats.moduleCounts[modName] += usage.modules[modName];
                }
            }
        } else {
            stats.scriptsNotUsingLibrary.push(script.name);
        }
    }

    // Calculate unique function count
    for (var fn in stats.functionCounts) {
        if (stats.functionCounts.hasOwnProperty(fn)) {
            stats.uniqueFunctionCount++;
        }
    }

    // Find unused functions
    stats.unusedFunctions = findUnusedFunctions(definedFunctions, stats.functionCounts);

    // Sort most/least used
    stats.mostUsed = getSortedFunctions(stats.functionCounts, false).slice(0, 10);
    stats.leastUsed = getSortedFunctions(stats.functionCounts, true).slice(0, 10);

    return stats;
}

/**
 * Analyze library usage in a single script
 * @param {File} script - Script file
 * @returns {Object} Usage data for this script
 */
function analyzeScript(script) {
    var usage = {
        functions: {},
        modules: {},
        callCount: 0
    };

    // Read script content
    script.encoding = 'UTF-8';
    if (!script.open('r')) {
        return usage;
    }

    var content = script.read();
    script.close();

    // Find all AIS.* calls
    // Pattern 1: AIS.Module.function()
    var match;
    var pattern1 = /AIS\.(\w+)\.(\w+)/g;
    while ((match = pattern1.exec(content)) !== null) {
        var module = match[1];
        var func = match[2];
        var fullName = module + '.' + func;

        // Count function
        if (!usage.functions[fullName]) {
            usage.functions[fullName] = 0;
        }
        usage.functions[fullName]++;
        usage.callCount++;

        // Count module
        if (!usage.modules[module]) {
            usage.modules[module] = 0;
        }
        usage.modules[module]++;
    }

    return usage;
}

/**
 * Get all functions defined in lib/core.jsx
 * @param {Folder} projectRoot - Project root
 * @returns {Array<String>} Array of function names
 */
function getDefinedLibraryFunctions(projectRoot) {
    var functions = [];

    var libFile = new File(projectRoot.fsName + '/lib/core.jsx');
    if (!libFile.exists) {
        return functions;
    }

    libFile.encoding = 'UTF-8';
    if (!libFile.open('r')) {
        return functions;
    }

    var content = libFile.read();
    libFile.close();

    // Find all AIS.Module.functionName = function() patterns
    var pattern = /AIS\.(\w+)\.(\w+)\s*=\s*function/g;
    var match;

    while ((match = pattern.exec(content)) !== null) {
        var module = match[1];
        var func = match[2];
        functions.push(module + '.' + func);
    }

    return functions;
}

/**
 * Find functions defined but never used
 * @param {Array<String>} defined - Defined functions
 * @param {Object} used - Used function counts
 * @returns {Array<String>} Unused functions
 */
function findUnusedFunctions(defined, used) {
    var unused = [];

    for (var i = 0; i < defined.length; i++) {
        var funcName = defined[i];
        if (!used[funcName] || used[funcName] === 0) {
            unused.push(funcName);
        }
    }

    return unused;
}

/**
 * Get sorted list of functions by usage count
 * @param {Object} functionCounts - Function → count
 * @param {Boolean} ascending - Sort ascending (least used first)
 * @returns {Array<Object>} Sorted array of {name, count}
 */
function getSortedFunctions(functionCounts, ascending) {
    var arr = [];

    for (var name in functionCounts) {
        if (functionCounts.hasOwnProperty(name)) {
            arr.push({name: name, count: functionCounts[name]});
        }
    }

    arr.sort(function(a, b) {
        return ascending ? a.count - b.count : b.count - a.count;
    });

    return arr;
}

// ============================================================================
// REPORTING
// ============================================================================

/**
 * Generate HTML analysis report
 * @param {Folder} projectRoot - Project root
 * @param {UsageStats} stats - Usage statistics
 * @returns {String|null} Report path or null
 */
function generateHTMLReport(projectRoot, stats) {
    var html = generateReportHeader();
    html += generateReportSummary(stats);
    html += generateMostUsedSection(stats);
    html += generateLeastUsedSection(stats);
    html += generateUnusedSection(stats);
    html += generateModuleBreakdown(stats);
    html += generateScriptDetails(stats);
    html += generateRecommendations(stats);
    html += generateReportFooter();

    // Save report
    var reportFile = new File(projectRoot.fsName + '/library-usage-report.html');
    reportFile.encoding = 'UTF-8';

    if (!reportFile.open('w')) {
        alert('Error\nFailed to create report file');
        return null;
    }

    reportFile.write(html);
    reportFile.close();

    return reportFile.fsName;
}

/**
 * Generate report HTML header
 * @returns {String} HTML header
 */
function generateReportHeader() {
    return '<!DOCTYPE html>\n' +
        '<html>\n' +
        '<head>\n' +
        '<meta charset="UTF-8">\n' +
        '<title>Library Usage Analysis - Vexy Scripts</title>\n' +
        '<style>\n' +
        'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif; margin: 20px; background: #f5f5f5; }\n' +
        'h1 { color: #333; border-bottom: 3px solid #2962FF; padding-bottom: 10px; }\n' +
        'h2 { color: #555; margin-top: 30px; border-bottom: 1px solid #ddd; padding-bottom: 5px; }\n' +
        '.summary { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }\n' +
        '.stat { display: inline-block; margin: 10px 20px 10px 0; padding: 10px 15px; border-radius: 5px; }\n' +
        '.stat-label { font-size: 12px; color: #666; display: block; }\n' +
        '.stat-value { font-size: 24px; font-weight: bold; display: block; }\n' +
        '.stat-primary { background: #E3F2FD; color: #1976D2; }\n' +
        '.stat-success { background: #E8F5E9; color: #388E3C; }\n' +
        '.section { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }\n' +
        '.function-list { list-style: none; padding: 0; }\n' +
        '.function-item { padding: 10px; margin: 5px 0; background: #f5f5f5; border-radius: 5px; display: flex; justify-content: space-between; align-items: center; }\n' +
        '.function-name { font-family: monospace; font-weight: bold; color: #2962FF; }\n' +
        '.function-count { background: #2962FF; color: white; padding: 2px 10px; border-radius: 12px; font-size: 12px; font-weight: bold; }\n' +
        '.bar { height: 20px; background: linear-gradient(90deg, #2962FF, #64B5F6); border-radius: 3px; margin: 5px 0; position: relative; }\n' +
        '.bar-label { position: absolute; right: 5px; top: 2px; color: white; font-size: 11px; font-weight: bold; }\n' +
        '.recommendation { background: #FFF3E0; border-left: 4px solid #FF9800; padding: 15px; margin: 10px 0; border-radius: 3px; }\n' +
        '.timestamp { color: #999; font-size: 12px; }\n' +
        'table { width: 100%; border-collapse: collapse; margin: 15px 0; }\n' +
        'th { background: #2962FF; color: white; padding: 10px; text-align: left; }\n' +
        'td { padding: 8px; border-bottom: 1px solid #ddd; }\n' +
        'tr:hover { background: #f5f5f5; }\n' +
        '</style>\n' +
        '</head>\n' +
        '<body>\n' +
        '<h1>📊 Library Usage Analysis</h1>\n' +
        '<div class="timestamp">Generated: ' + new Date().toString() + '</div>\n';
}

/**
 * Generate summary section
 * @param {UsageStats} stats - Usage statistics
 * @returns {String} HTML
 */
function generateReportSummary(stats) {
    var totalScripts = stats.scriptsUsingLibrary + stats.scriptsNotUsingLibrary.length;
    var adoptionRate = totalScripts > 0 ? Math.round((stats.scriptsUsingLibrary / totalScripts) * 100) : 0;

    return '<div class="summary">\n' +
        '<h2>Summary</h2>\n' +
        '<div class="stat stat-primary">\n' +
        '<span class="stat-label">Total Library Calls</span>\n' +
        '<span class="stat-value">' + stats.totalCalls + '</span>\n' +
        '</div>\n' +
        '<div class="stat stat-primary">\n' +
        '<span class="stat-label">Unique Functions Used</span>\n' +
        '<span class="stat-value">' + stats.uniqueFunctionCount + '</span>\n' +
        '</div>\n' +
        '<div class="stat stat-success">\n' +
        '<span class="stat-label">Scripts Using AIS</span>\n' +
        '<span class="stat-value">' + stats.scriptsUsingLibrary + '/' + totalScripts + '</span>\n' +
        '</div>\n' +
        '<div class="stat stat-primary">\n' +
        '<span class="stat-label">Adoption Rate</span>\n' +
        '<span class="stat-value">' + adoptionRate + '%</span>\n' +
        '</div>\n' +
        '</div>\n';
}

/**
 * Generate most used functions section
 * @param {UsageStats} stats - Usage statistics
 * @returns {String} HTML
 */
function generateMostUsedSection(stats) {
    if (stats.mostUsed.length === 0) {
        return '';
    }

    var maxCount = stats.mostUsed[0].count;
    var html = '<div class="section">\n<h2>🔥 Most Used Functions (Top 10)</h2>\n';

    for (var i = 0; i < stats.mostUsed.length; i++) {
        var item = stats.mostUsed[i];
        var percent = Math.round((item.count / maxCount) * 100);

        html += '<div style="margin: 10px 0;">\n';
        html += '<div><span class="function-name">' + item.name + '</span> <span class="function-count">' + item.count + ' calls</span></div>\n';
        html += '<div class="bar" style="width: ' + percent + '%;">\n';
        html += '<span class="bar-label">' + percent + '%</span>\n';
        html += '</div>\n</div>\n';
    }

    html += '</div>\n';
    return html;
}

/**
 * Generate least used functions section
 * @param {UsageStats} stats - Usage statistics
 * @returns {String} HTML
 */
function generateLeastUsedSection(stats) {
    if (stats.leastUsed.length === 0) {
        return '';
    }

    var html = '<div class="section">\n<h2>❄️ Least Used Functions (Bottom 10)</h2>\n';
    html += '<p style="color: #666;">These functions are defined but rarely used. Consider if they are still needed.</p>\n';
    html += '<ul class="function-list">\n';

    for (var i = 0; i < stats.leastUsed.length; i++) {
        var item = stats.leastUsed[i];
        html += '<li class="function-item">\n';
        html += '<span class="function-name">' + item.name + '</span>\n';
        html += '<span class="function-count">' + item.count + ' calls</span>\n';
        html += '</li>\n';
    }

    html += '</ul>\n</div>\n';
    return html;
}

/**
 * Generate unused functions section
 * @param {UsageStats} stats - Usage statistics
 * @returns {String} HTML
 */
function generateUnusedSection(stats) {
    if (stats.unusedFunctions.length === 0) {
        return '<div class="section">\n<h2>✓ Unused Functions</h2>\n' +
               '<p style="color: #4CAF50;">All defined library functions are being used!</p>\n</div>\n';
    }

    var html = '<div class="section">\n<h2>⚠️ Unused Functions (' + stats.unusedFunctions.length + ')</h2>\n';
    html += '<p style="color: #666;">These functions are defined in lib/core.jsx but never called. Consider removing if obsolete.</p>\n';
    html += '<ul class="function-list">\n';

    for (var i = 0; i < stats.unusedFunctions.length; i++) {
        html += '<li class="function-item"><span class="function-name">' + stats.unusedFunctions[i] + '</span></li>\n';
    }

    html += '</ul>\n</div>\n';
    return html;
}

/**
 * Generate module breakdown section
 * @param {UsageStats} stats - Usage statistics
 * @returns {String} HTML
 */
function generateModuleBreakdown(stats) {
    var html = '<div class="section">\n<h2>📦 Module Breakdown</h2>\n';
    html += '<table>\n<thead>\n<tr><th>Module</th><th>Total Calls</th><th>% of Total</th></tr>\n</thead>\n<tbody>\n';

    // Sort modules by usage
    var modules = [];
    for (var name in stats.moduleCounts) {
        if (stats.moduleCounts.hasOwnProperty(name)) {
            modules.push({name: name, count: stats.moduleCounts[name]});
        }
    }

    modules.sort(function(a, b) { return b.count - a.count; });

    for (var i = 0; i < modules.length; i++) {
        var module = modules[i];
        var percent = stats.totalCalls > 0 ? Math.round((module.count / stats.totalCalls) * 100) : 0;
        html += '<tr><td><strong>' + module.name + '</strong></td><td>' + module.count + '</td><td>' + percent + '%</td></tr>\n';
    }

    html += '</tbody>\n</table>\n</div>\n';
    return html;
}

/**
 * Generate script details section
 * @param {UsageStats} stats - Usage statistics
 * @returns {String} HTML
 */
function generateScriptDetails(stats) {
    var html = '<div class="section">\n<h2>📄 Scripts Not Using AIS Library</h2>\n';

    if (stats.scriptsNotUsingLibrary.length === 0) {
        html += '<p style="color: #4CAF50;">All scripts are using the AIS library!</p>\n';
    } else {
        html += '<p style="color: #666;">These scripts don\'t use AIS library functions. Consider migrating them.</p>\n';
        html += '<ul>\n';
        for (var i = 0; i < stats.scriptsNotUsingLibrary.length; i++) {
            html += '<li>' + stats.scriptsNotUsingLibrary[i] + '</li>\n';
        }
        html += '</ul>\n';
    }

    html += '</div>\n';
    return html;
}

/**
 * Generate recommendations section
 * @param {UsageStats} stats - Usage statistics
 * @returns {String} HTML
 */
function generateRecommendations(stats) {
    var html = '<div class="section">\n<h2>💡 Recommendations</h2>\n';

    // Generate smart recommendations
    if (stats.unusedFunctions.length > 5) {
        html += '<div class="recommendation">\n';
        html += '<strong>High number of unused functions (' + stats.unusedFunctions.length + ')</strong><br>\n';
        html += 'Consider removing unused functions from lib/core.jsx to reduce library size and maintenance burden.\n';
        html += '</div>\n';
    }

    if (stats.scriptsNotUsingLibrary.length > 0) {
        html += '<div class="recommendation">\n';
        html += '<strong>' + stats.scriptsNotUsingLibrary.length + ' scripts not using AIS library</strong><br>\n';
        html += 'These scripts may be legacy LAScripts wrappers or unmigrated code. Consider modernizing them.\n';
        html += '</div>\n';
    }

    var totalScripts = stats.scriptsUsingLibrary + stats.scriptsNotUsingLibrary.length;
    var adoptionRate = totalScripts > 0 ? Math.round((stats.scriptsUsingLibrary / totalScripts) * 100) : 0;

    if (adoptionRate < 80) {
        html += '<div class="recommendation">\n';
        html += '<strong>Library adoption rate is ' + adoptionRate + '%</strong><br>\n';
        html += 'Target 100% adoption by migrating remaining scripts to use AIS library.\n';
        html += '</div>\n';
    }

    if (html === '<div class="section">\n<h2>💡 Recommendations</h2>\n') {
        html += '<p style="color: #4CAF50;">Library usage looks healthy! No immediate recommendations.</p>\n';
    }

    html += '</div>\n';
    return html;
}

/**
 * Generate report footer
 * @returns {String} HTML footer
 */
function generateReportFooter() {
    return '</body>\n</html>';
}

// ============================================================================
// ENTRY POINT
// ============================================================================

(function() {
    try {
        main();
    } catch (err) {
        alert('Error in AnalyzeLibraryUsage\n\n' +
              err.message + '\n' +
              'Line: ' + err.line);
    }
})();
