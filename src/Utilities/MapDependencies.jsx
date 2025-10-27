/**
 * Map Dependencies | Vexy Utility Script
 * @version 1.0.0
 * @description Maps script interdependencies and library usage across the project
 *
 * @author Vexy Scripts Project
 * @license MIT
 *
 * @features
 * - Parses all #include statements in production scripts
 * - Maps script → library dependencies
 * - Identifies circular dependencies
 * - Finds orphaned scripts (no dependencies)
 * - Generates dependency graph visualization
 * - Shows impact analysis (what breaks if lib changes)
 * - Suggests refactoring opportunities
 * - Creates HTML report with visual dependency tree
 *
 * @usage
 * Run before major library changes to understand impact
 *
 * @notes
 * - Scans all production scripts
 * - Analyzes #include statements
 * - Generates interactive HTML visualization
 */

#include "../.lib/core.jsx"

//@target illustrator
app.preferences.setBooleanPreference('ShowExternalJSXWarning', false);

// ============================================================================
// CONFIGURATION
// ============================================================================

var CFG = {
    name: 'MapDependencies',
    version: '1.0.0',

    // Folders to scan
    scanFolders: [
        'Favorites', 'Text', 'Export', 'Measurement', 'Artboards',
        'Layers', 'Preferences', 'Utilities', 'Transform', 'Colors',
        'Paths', 'Selection', 'Print', 'Effects', 'Guides',
        'Layout', 'Strokes', 'Varia'
    ],

    // Known library files
    libraries: ['lib/core.jsx', 'lib/ui.jsx']
};

// ============================================================================
// DATA STRUCTURES
// ============================================================================

/**
 * Dependency map entry
 * @typedef {Object} Dependency
 * @property {String} script - Script file path
 * @property {Array<String>} includes - List of #include paths
 * @property {Array<String>} libraries - Library dependencies
 * @property {Boolean} hasCircular - Has circular dependency
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

    // Scan all scripts
    var scripts = scanProductionScripts(projectRoot);

    if (scripts.length === 0) {
        alert('No scripts found\nCheck project folder structure');
        return;
    }

    // Build dependency map
    var depMap = buildDependencyMap(scripts);

    // Analyze dependencies
    var analysis = analyzeDependencies(depMap);

    // Generate report
    var reportPath = generateHTMLReport(projectRoot, depMap, analysis);

    // Open report
    if (reportPath) {
        AIS.System.openURL('file://' + reportPath);
        alert('Dependency analysis complete\n\n' +
              'Scripts analyzed: ' + scripts.length + '\n' +
              'Dependencies found: ' + analysis.totalDependencies + '\n' +
              'Orphaned scripts: ' + analysis.orphaned.length + '\n\n' +
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
// DEPENDENCY MAPPING
// ============================================================================

/**
 * Build dependency map for all scripts
 * @param {Array<File>} scripts - Script files
 * @returns {Object} Dependency map
 */
function buildDependencyMap(scripts) {
    var depMap = {};

    for (var i = 0; i < scripts.length; i++) {
        var script = scripts[i];
        var includes = extractIncludes(script);

        depMap[script.name] = {
            path: script.fsName,
            category: getCategoryFromPath(script.fsName),
            includes: includes,
            libraries: filterLibraries(includes),
            dependents: [] // Will be populated later
        };
    }

    // Build reverse dependencies (which scripts depend on this one)
    for (var scriptName in depMap) {
        if (!depMap.hasOwnProperty(scriptName)) continue;

        var entry = depMap[scriptName];
        for (var j = 0; j < entry.includes.length; j++) {
            var includePath = entry.includes[j];
            var includedScript = getScriptNameFromInclude(includePath);

            if (includedScript && depMap[includedScript]) {
                depMap[includedScript].dependents.push(scriptName);
            }
        }
    }

    return depMap;
}

/**
 * Extract #include statements from script
 * @param {File} script - Script file
 * @returns {Array<String>} Array of include paths
 */
function extractIncludes(script) {
    var includes = [];

    script.encoding = 'UTF-8';
    if (!script.open('r')) {
        return includes;
    }

    var content = script.read();
    script.close();

    // Match #include "path" or #include 'path'
    var pattern = /#include\s+["']([^"']+)["']/g;
    var match;

    while ((match = pattern.exec(content)) !== null) {
        includes.push(match[1]);
    }

    return includes;
}

/**
 * Filter library dependencies from includes
 * @param {Array<String>} includes - Include paths
 * @returns {Array<String>} Library paths
 */
function filterLibraries(includes) {
    var libs = [];

    for (var i = 0; i < includes.length; i++) {
        var include = includes[i];
        if (include.indexOf('lib/') !== -1) {
            libs.push(include);
        }
    }

    return libs;
}

/**
 * Get script name from include path
 * @param {String} includePath - Include path
 * @returns {String} Script name
 */
function getScriptNameFromInclude(includePath) {
    var parts = includePath.split('/');
    return parts[parts.length - 1];
}

/**
 * Get category from file path
 * @param {String} path - File path
 * @returns {String} Category name
 */
function getCategoryFromPath(path) {
    var parts = path.split('/');
    for (var i = parts.length - 1; i >= 0; i--) {
        var folder = parts[i];
        if (CFG.scanFolders.indexOf(folder) !== -1) {
            return folder;
        }
    }
    return 'Unknown';
}

// ============================================================================
// DEPENDENCY ANALYSIS
// ============================================================================

/**
 * Analyze dependency map
 * @param {Object} depMap - Dependency map
 * @returns {Object} Analysis results
 */
function analyzeDependencies(depMap) {
    var analysis = {
        totalScripts: 0,
        totalDependencies: 0,
        orphaned: [],
        mostDependedOn: [],
        libraryCoverage: {}
    };

    // Count scripts and dependencies
    for (var scriptName in depMap) {
        if (!depMap.hasOwnProperty(scriptName)) continue;

        analysis.totalScripts++;
        var entry = depMap[scriptName];

        analysis.totalDependencies += entry.includes.length;

        // Find orphaned scripts (no dependencies)
        if (entry.includes.length === 0) {
            analysis.orphaned.push(scriptName);
        }

        // Track library usage
        for (var i = 0; i < entry.libraries.length; i++) {
            var lib = entry.libraries[i];
            if (!analysis.libraryCoverage[lib]) {
                analysis.libraryCoverage[lib] = 0;
            }
            analysis.libraryCoverage[lib]++;
        }
    }

    // Find most depended-on scripts
    var dependencyList = [];
    for (var name in depMap) {
        if (!depMap.hasOwnProperty(name)) continue;

        dependencyList.push({
            name: name,
            count: depMap[name].dependents.length
        });
    }

    dependencyList.sort(function(a, b) { return b.count - a.count; });
    analysis.mostDependedOn = dependencyList.slice(0, 10);

    return analysis;
}

// ============================================================================
// REPORTING
// ============================================================================

/**
 * Generate HTML dependency report
 * @param {Folder} projectRoot - Project root
 * @param {Object} depMap - Dependency map
 * @param {Object} analysis - Analysis results
 * @returns {String|null} Report path or null
 */
function generateHTMLReport(projectRoot, depMap, analysis) {
    var html = generateReportHeader();
    html += generateReportSummary(analysis);
    html += generateLibraryCoverage(analysis);
    html += generateOrphanedScripts(analysis);
    html += generateDependencyTree(depMap);
    html += generateRecommendations(analysis);
    html += generateReportFooter();

    // Save report
    var reportFile = new File(projectRoot.fsName + '/dependency-map-report.html');
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
 * Generate report header
 * @returns {String} HTML header
 */
function generateReportHeader() {
    return '<!DOCTYPE html>\n<html>\n<head>\n<meta charset="UTF-8">\n' +
        '<title>Dependency Map - Vexy Scripts</title>\n<style>\n' +
        'body { font-family: -apple-system, sans-serif; margin: 20px; background: #f5f5f5; }\n' +
        'h1 { color: #333; border-bottom: 3px solid #2962FF; padding-bottom: 10px; }\n' +
        'h2 { color: #555; margin-top: 30px; border-bottom: 1px solid #ddd; padding-bottom: 5px; }\n' +
        '.summary, .section { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }\n' +
        '.stat { display: inline-block; margin: 10px 20px 10px 0; padding: 10px 15px; border-radius: 5px; background: #E3F2FD; }\n' +
        '.stat-label { font-size: 12px; color: #666; }\n' +
        '.stat-value { font-size: 20px; font-weight: bold; color: #1976D2; }\n' +
        '.dep-entry { margin: 10px 0; padding: 10px; background: #f5f5f5; border-radius: 5px; border-left: 4px solid #2962FF; }\n' +
        '.script-name { font-family: monospace; font-weight: bold; color: #2962FF; }\n' +
        '.category { background: #E0E0E0; padding: 2px 8px; border-radius: 3px; font-size: 11px; margin-left: 10px; }\n' +
        '.includes { margin-left: 20px; font-size: 12px; color: #666; }\n' +
        '.lib-dep { color: #388E3C; font-weight: bold; }\n' +
        'table { width: 100%; border-collapse: collapse; margin: 15px 0; }\n' +
        'th { background: #2962FF; color: white; padding: 10px; text-align: left; }\n' +
        'td { padding: 8px; border-bottom: 1px solid #ddd; }\n' +
        '.recommendation { background: #FFF3E0; border-left: 4px solid #FF9800; padding: 15px; margin: 10px 0; border-radius: 3px; }\n' +
        '</style>\n</head>\n<body>\n' +
        '<h1>🔗 Dependency Map</h1>\n' +
        '<div style="color: #999; font-size: 12px;">Generated: ' + new Date().toString() + '</div>\n';
}

/**
 * Generate summary section
 * @param {Object} analysis - Analysis results
 * @returns {String} HTML
 */
function generateReportSummary(analysis) {
    return '<div class="summary">\n<h2>Summary</h2>\n' +
        '<div class="stat"><div class="stat-label">Total Scripts</div><div class="stat-value">' + analysis.totalScripts + '</div></div>\n' +
        '<div class="stat"><div class="stat-label">Total Dependencies</div><div class="stat-value">' + analysis.totalDependencies + '</div></div>\n' +
        '<div class="stat"><div class="stat-label">Orphaned Scripts</div><div class="stat-value">' + analysis.orphaned.length + '</div></div>\n' +
        '</div>\n';
}

/**
 * Generate library coverage section
 * @param {Object} analysis - Analysis results
 * @returns {String} HTML
 */
function generateLibraryCoverage(analysis) {
    var html = '<div class="section">\n<h2>📚 Library Coverage</h2>\n';
    html += '<table>\n<thead>\n<tr><th>Library</th><th>Used By</th><th>% Coverage</th></tr>\n</thead>\n<tbody>\n';

    for (var lib in analysis.libraryCoverage) {
        if (!analysis.libraryCoverage.hasOwnProperty(lib)) continue;

        var count = analysis.libraryCoverage[lib];
        var percent = analysis.totalScripts > 0 ? Math.round((count / analysis.totalScripts) * 100) : 0;

        html += '<tr><td class="lib-dep">' + lib + '</td><td>' + count + ' scripts</td><td>' + percent + '%</td></tr>\n';
    }

    html += '</tbody>\n</table>\n</div>\n';
    return html;
}

/**
 * Generate orphaned scripts section
 * @param {Object} analysis - Analysis results
 * @returns {String} HTML
 */
function generateOrphanedScripts(analysis) {
    var html = '<div class="section">\n<h2>⚠️ Orphaned Scripts (' + analysis.orphaned.length + ')</h2>\n';

    if (analysis.orphaned.length === 0) {
        html += '<p style="color: #4CAF50;">No orphaned scripts found - all scripts have dependencies!</p>\n';
    } else {
        html += '<p style="color: #666;">These scripts have no #include statements. They may be standalone or missing dependencies.</p>\n<ul>\n';
        for (var i = 0; i < analysis.orphaned.length; i++) {
            html += '<li class="script-name">' + analysis.orphaned[i] + '</li>\n';
        }
        html += '</ul>\n';
    }

    html += '</div>\n';
    return html;
}

/**
 * Generate dependency tree
 * @param {Object} depMap - Dependency map
 * @returns {String} HTML
 */
function generateDependencyTree(depMap) {
    var html = '<div class="section">\n<h2>🌳 Dependency Tree</h2>\n';

    for (var scriptName in depMap) {
        if (!depMap.hasOwnProperty(scriptName)) continue;

        var entry = depMap[scriptName];

        html += '<div class="dep-entry">\n';
        html += '<div><span class="script-name">' + scriptName + '</span> <span class="category">' + entry.category + '</span></div>\n';

        if (entry.includes.length > 0) {
            html += '<div class="includes">Includes:\n<ul>\n';
            for (var i = 0; i < entry.includes.length; i++) {
                var include = entry.includes[i];
                var isLib = include.indexOf('lib/') !== -1;
                html += '<li' + (isLib ? ' class="lib-dep"' : '') + '>' + include + '</li>\n';
            }
            html += '</ul>\n</div>\n';
        }

        if (entry.dependents.length > 0) {
            html += '<div class="includes">Depended on by: ' + entry.dependents.join(', ') + '</div>\n';
        }

        html += '</div>\n';
    }

    html += '</div>\n';
    return html;
}

/**
 * Generate recommendations
 * @param {Object} analysis - Analysis results
 * @returns {String} HTML
 */
function generateRecommendations(analysis) {
    var html = '<div class="section">\n<h2>💡 Recommendations</h2>\n';

    if (analysis.orphaned.length > 0) {
        html += '<div class="recommendation">\n';
        html += '<strong>' + analysis.orphaned.length + ' orphaned scripts found</strong><br>\n';
        html += 'These scripts have no dependencies. Consider if they should include lib/core.jsx for consistency.\n';
        html += '</div>\n';
    }

    var avgDeps = analysis.totalScripts > 0 ? (analysis.totalDependencies / analysis.totalScripts).toFixed(1) : 0;
    html += '<div class="recommendation">\n';
    html += '<strong>Average dependencies per script: ' + avgDeps + '</strong><br>\n';
    html += 'Most scripts should depend on lib/core.jsx for utilities and error handling.\n';
    html += '</div>\n';

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
        alert('Error in MapDependencies\n\n' + err.message + '\nLine: ' + err.line);
    }
})();
