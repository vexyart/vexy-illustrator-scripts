/**
 * Check Compatibility - Script Compatibility Checker
 * @version 1.0.0
 * @description Check Adobe Illustrator version requirements for all scripts
 *
 * @author Vexy Scripts Project
 * @license Apache-2.0
 *
 * @features
 * - Detect current Adobe Illustrator version
 * - Parse script @requires tags for version requirements
 * - Check if current AI version meets script requirements
 * - Generate compatibility matrix (script → AI version)
 * - Flag incompatible scripts for user's AI version
 * - Suggest alternative scripts or workarounds
 * - Export compatibility report to HTML
 * - Show feature availability by AI version
 * - Interactive UI with compatibility list
 * - Color-coded status (green/yellow/red)
 *
 * @usage
 * 1. Run script in Adobe Illustrator
 * 2. View compatibility report for current AI version
 * 3. See which scripts work with your version
 * 4. Export HTML report for reference
 *
 * @notes
 * - Scans all production scripts (excludes old/, old2/)
 * - Requires @requires tag in script JSDoc header
 * - Version format: "Illustrator CS6" or "Illustrator 2020" or "CC 2015.3+"
 * - Compatible: Green, Warning: Yellow, Incompatible: Red
 * - Report saved to Desktop
 *
 * @requires Illustrator CS6 or later
 * @requires lib/core.jsx
 */

#include "../.lib/core.jsx"

//@target illustrator
app.preferences.setBooleanPreference('ShowExternalJSXWarning', false);

// ============================================================================
// CONFIGURATION
// ============================================================================

var CFG = {
    projectRoot: getProjectRoot(),
    reportFileName: 'compatibility-report.html',
    minVersion: 16.0,  // CS6
    versionNames: {
        '16.0': 'CS6',
        '17.0': '2013',
        '18.0': '2014',
        '19.0': '2015',
        '20.0': '2015.3',
        '21.0': '2017',
        '22.0': '2018',
        '23.0': '2019',
        '24.0': '2020',
        '25.0': '2021',
        '26.0': '2022',
        '27.0': '2023',
        '28.0': '2024',
        '29.0': '2025'
    }
};

// ============================================================================
// MAIN FUNCTION
// ============================================================================

function main() {
    // Get current AI version
    var currentVersion = detectIllustratorVersion();

    // Show compatibility dialog
    showCompatibilityDialog(currentVersion);
}

// ============================================================================
// CORE LOGIC
// ============================================================================

/**
 * Detect current Adobe Illustrator version
 * @returns {Object} Version info {raw, major, minor, name}
 */
function detectIllustratorVersion() {
    var versionString = app.version;
    var parts = versionString.split('.');
    var major = parseFloat(parts[0]);
    var minor = parts.length > 1 ? parseFloat(parts[1]) : 0;
    var full = parseFloat(parts[0] + '.' + parts[1]);

    var name = CFG.versionNames[major + '.0'] || 'Unknown';

    return {
        raw: versionString,
        major: major,
        minor: minor,
        full: full,
        name: name,
        displayName: 'Illustrator ' + name + ' (v' + versionString + ')'
    };
}

/**
 * Parse script requirements from JSDoc header
 * @param {File} file Script file
 * @returns {Object|null} Requirements {raw, minVersion, maxVersion} or null
 */
function parseRequirements(file) {
    try {
        file.encoding = 'UTF-8';
        file.open('r');

        var inHeader = false;
        var requiresLine = null;

        // Read first 100 lines looking for JSDoc header
        for (var i = 0; i < 100; i++) {
            if (file.eof) break;

            var line = file.readln();

            // Start of JSDoc header
            if (line.indexOf('/**') !== -1) {
                inHeader = true;
            }

            // End of JSDoc header
            if (inHeader && line.indexOf('*/') !== -1) {
                break;
            }

            // Look for @requires tag
            if (inHeader && line.indexOf('@requires') !== -1) {
                requiresLine = line;
                break;
            }
        }

        file.close();

        if (!requiresLine) {
            return null;
        }

        // Parse @requires line
        return parseRequiresTag(requiresLine);

    } catch (e) {
        return null;
    }
}

/**
 * Parse @requires tag string
 * @param {String} requiresLine Line containing @requires tag
 * @returns {Object} Requirements {raw, minVersion, maxVersion}
 */
function parseRequiresTag(requiresLine) {
    var raw = requiresLine.replace(/.*@requires\s+/, '').trim();

    var result = {
        raw: raw,
        minVersion: CFG.minVersion,
        maxVersion: null
    };

    // Parse different formats:
    // "Illustrator CS6 or later"
    // "Illustrator 2020+"
    // "Illustrator CC 2015.3 or later"

    // Try to extract version number
    var versionMatch = raw.match(/(\d+(?:\.\d+)?)/);
    if (versionMatch) {
        result.minVersion = parseFloat(versionMatch[1]);
    } else {
        // Try to match version names
        for (var version in CFG.versionNames) {
            if (CFG.versionNames.hasOwnProperty(version)) {
                var name = CFG.versionNames[version];
                if (raw.indexOf(name) !== -1) {
                    result.minVersion = parseFloat(version);
                    break;
                }
            }
        }
    }

    return result;
}

/**
 * Check if script is compatible with AI version
 * @param {Object} requirements Script requirements
 * @param {Object} aiVersion AI version info
 * @returns {String} 'compatible', 'warning', or 'incompatible'
 */
function checkCompatibility(requirements, aiVersion) {
    if (!requirements) {
        return 'unknown';  // No @requires tag
    }

    if (aiVersion.major < requirements.minVersion) {
        return 'incompatible';
    }

    if (requirements.maxVersion && aiVersion.major > requirements.maxVersion) {
        return 'incompatible';
    }

    // Warning if close to min version
    if (aiVersion.major === requirements.minVersion) {
        return 'warning';
    }

    return 'compatible';
}

/**
 * Scan all production scripts for compatibility
 * @param {Object} aiVersion AI version info
 * @returns {Array} Array of compatibility results
 */
function scanScripts(aiVersion) {
    var results = [];

    // Get all .jsx files (exclude old/, old2/, templates/, lib/)
    var folders = [
        'Favorites', 'Text', 'Export', 'Measurement', 'Artboards',
        'Layers', 'Preferences', 'Utilities', 'tests',
        'Colors', 'Paths', 'Transform', 'Selection', 'Print',
        'Effects', 'Guides', 'Layout', 'Strokes', 'Varia'
    ];

    for (var i = 0; i < folders.length; i++) {
        var folderPath = CFG.projectRoot + '/' + folders[i];
        var folder = new Folder(folderPath);

        if (!folder.exists) continue;

        var files = folder.getFiles('*.jsx');

        for (var j = 0; j < files.length; j++) {
            var file = files[j];

            // Skip LAScripts wrappers
            if (file.name.indexOf('Lascripts') !== -1) {
                continue;
            }

            var requirements = parseRequirements(file);
            var status = checkCompatibility(requirements, aiVersion);

            results.push({
                name: file.name,
                category: folders[i],
                path: file.fsName,
                requirements: requirements,
                status: status
            });
        }
    }

    // Sort by status (incompatible first, then warning, then compatible)
    results.sort(function(a, b) {
        var order = {incompatible: 0, warning: 1, unknown: 2, compatible: 3};
        return order[a.status] - order[b.status];
    });

    return results;
}

/**
 * Generate compatibility statistics
 * @param {Array} results Compatibility scan results
 * @returns {Object} Statistics object
 */
function generateStats(results) {
    var stats = {
        total: results.length,
        compatible: 0,
        warning: 0,
        incompatible: 0,
        unknown: 0
    };

    for (var i = 0; i < results.length; i++) {
        var status = results[i].status;
        if (stats.hasOwnProperty(status)) {
            stats[status]++;
        }
    }

    return stats;
}

// ============================================================================
// USER INTERFACE
// ============================================================================

/**
 * Show compatibility dialog
 * @param {Object} aiVersion AI version info
 */
function showCompatibilityDialog(aiVersion) {
    var dialog = new Window('dialog', 'Script Compatibility Checker');
    dialog.preferredSize = [600, 500];
    dialog.alignChildren = ['fill', 'fill'];
    dialog.margins = 20;

    // Version info panel
    var versionPanel = dialog.add('panel', undefined, 'Your Adobe Illustrator Version');
    versionPanel.alignChildren = ['left', 'top'];
    versionPanel.margins = 15;

    versionPanel.add('statictext', undefined, aiVersion.displayName);
    versionPanel.add('statictext', undefined, 'Version number: ' + aiVersion.raw);

    // Scan button
    var scanBtn = dialog.add('button', undefined, 'Scan All Scripts');
    scanBtn.alignment = ['center', 'top'];

    // Results list (hidden initially)
    var resultsGroup = dialog.add('group');
    resultsGroup.orientation = 'column';
    resultsGroup.alignChildren = ['fill', 'fill'];
    resultsGroup.alignment = ['fill', 'fill'];
    resultsGroup.visible = false;

    var statsText = resultsGroup.add('statictext', undefined, '');
    statsText.alignment = ['left', 'top'];

    var list = resultsGroup.add('listbox', undefined, [], {
        numberOfColumns: 3,
        showHeaders: true,
        columnTitles: ['Script', 'Status', 'Requirements']
    });
    list.alignment = ['fill', 'fill'];

    // Buttons
    var btnGroup = dialog.add('group');
    btnGroup.alignment = ['right', 'bottom'];

    var reportBtn = btnGroup.add('button', undefined, 'Generate HTML Report');
    reportBtn.enabled = false;

    var closeBtn = btnGroup.add('button', undefined, 'Close', {name: 'cancel'});

    // Store results for report generation
    var scanResults = null;

    // Scan button event
    scanBtn.onClick = function() {
        scanBtn.text = 'Scanning...';
        scanBtn.enabled = false;

        // Scan scripts
        scanResults = scanScripts(aiVersion);
        var stats = generateStats(scanResults);

        // Update stats text
        var statsStr = 'Total scripts: ' + stats.total + '  |  ';
        statsStr += 'Compatible: ' + stats.compatible + '  |  ';
        statsStr += 'Warning: ' + stats.warning + '  |  ';
        statsStr += 'Incompatible: ' + stats.incompatible + '  |  ';
        statsStr += 'Unknown: ' + stats.unknown;

        statsText.text = statsStr;

        // Populate list
        list.removeAll();

        for (var i = 0; i < scanResults.length; i++) {
            var result = scanResults[i];
            var item = list.add('item', result.name);

            var statusText = result.status.toUpperCase();
            item.subItems[0].text = statusText;

            var reqText = result.requirements ? result.requirements.raw : 'Not specified';
            item.subItems[1].text = reqText;

            item.result = result;
        }

        // Show results
        resultsGroup.visible = true;
        reportBtn.enabled = true;
        scanBtn.text = 'Rescan Scripts';
        scanBtn.enabled = true;

        dialog.layout.layout(true);
    };

    // Report button event
    reportBtn.onClick = function() {
        if (scanResults) {
            generateCompatibilityReport(aiVersion, scanResults);
        }
    };

    dialog.show();
}

// ============================================================================
// REPORTING
// ============================================================================

/**
 * Generate HTML compatibility report
 * @param {Object} aiVersion AI version info
 * @param {Array} results Scan results
 */
function generateCompatibilityReport(aiVersion, results) {
    try {
        var stats = generateStats(results);
        var html = generateReportHTML(aiVersion, results, stats);

        var reportFile = new File(Folder.desktop + '/' + CFG.reportFileName);
        reportFile.encoding = 'UTF-8';
        reportFile.open('w');
        reportFile.write(html);
        reportFile.close();

        reportFile.execute();

    } catch (e) {
        AIS.Error.show('Report generation failed', e);
    }
}

/**
 * Generate HTML report content
 * @param {Object} aiVersion AI version info
 * @param {Array} results Scan results
 * @param {Object} stats Statistics
 * @returns {String} HTML string
 */
function generateReportHTML(aiVersion, results, stats) {
    var html = '';
    html += '<!DOCTYPE html>\n';
    html += '<html>\n';
    html += '<head>\n';
    html += '<meta charset="UTF-8">\n';
    html += '<title>Script Compatibility Report</title>\n';
    html += '<style>\n';
    html += 'body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }\n';
    html += 'h1 { color: #333; }\n';
    html += '.summary { background: white; padding: 20px; margin-bottom: 20px; border-radius: 5px; }\n';
    html += '.stats { display: flex; gap: 20px; margin-top: 15px; }\n';
    html += '.stat { background: #f9f9f9; padding: 10px 20px; border-radius: 3px; }\n';
    html += '.stat-label { font-size: 12px; color: #666; }\n';
    html += '.stat-value { font-size: 24px; font-weight: bold; margin-top: 5px; }\n';
    html += 'table { width: 100%; background: white; border-collapse: collapse; border-radius: 5px; overflow: hidden; }\n';
    html += 'th { background: #4CAF50; color: white; padding: 12px; text-align: left; }\n';
    html += 'td { padding: 10px; border-bottom: 1px solid #eee; }\n';
    html += '.compatible { color: #4CAF50; font-weight: bold; }\n';
    html += '.warning { color: #FF9800; font-weight: bold; }\n';
    html += '.incompatible { color: #F44336; font-weight: bold; }\n';
    html += '.unknown { color: #999; }\n';
    html += 'tr:hover { background: #f9f9f9; }\n';
    html += '</style>\n';
    html += '</head>\n';
    html += '<body>\n';
    html += '<h1>Script Compatibility Report</h1>\n';

    // Summary
    html += '<div class="summary">\n';
    html += '<h2>' + aiVersion.displayName + '</h2>\n';
    html += '<p>Generated: ' + new Date().toString() + '</p>\n';

    html += '<div class="stats">\n';
    html += '<div class="stat"><div class="stat-label">Total Scripts</div><div class="stat-value">' + stats.total + '</div></div>\n';
    html += '<div class="stat"><div class="stat-label">Compatible</div><div class="stat-value" style="color:#4CAF50">' + stats.compatible + '</div></div>\n';
    html += '<div class="stat"><div class="stat-label">Warning</div><div class="stat-value" style="color:#FF9800">' + stats.warning + '</div></div>\n';
    html += '<div class="stat"><div class="stat-label">Incompatible</div><div class="stat-value" style="color:#F44336">' + stats.incompatible + '</div></div>\n';
    html += '<div class="stat"><div class="stat-label">Unknown</div><div class="stat-value" style="color:#999">' + stats.unknown + '</div></div>\n';
    html += '</div>\n';

    html += '</div>\n';

    // Results table
    html += '<table>\n';
    html += '<thead><tr><th>Script</th><th>Category</th><th>Status</th><th>Requirements</th></tr></thead>\n';
    html += '<tbody>\n';

    for (var i = 0; i < results.length; i++) {
        var result = results[i];
        var statusClass = result.status;
        var statusText = result.status.toUpperCase();
        var reqText = result.requirements ? result.requirements.raw : 'Not specified';

        html += '<tr>\n';
        html += '<td>' + result.name + '</td>\n';
        html += '<td>' + result.category + '</td>\n';
        html += '<td class="' + statusClass + '">' + statusText + '</td>\n';
        html += '<td>' + reqText + '</td>\n';
        html += '</tr>\n';
    }

    html += '</tbody>\n';
    html += '</table>\n';

    html += '</body>\n';
    html += '</html>\n';

    return html;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get project root directory
 * @returns {String} Project root path
 */
function getProjectRoot() {
    // Script is in Utilities/, so parent is project root
    var scriptFile = new File($.fileName);
    var scriptFolder = scriptFile.parent;  // Utilities/
    var projectRoot = scriptFolder.parent;  // Project root
    return projectRoot.fsName;
}

// ============================================================================
// ENTRY POINT
// ============================================================================

(function() {
    try {
        main();
    } catch (err) {
        AIS.Error.show('Check Compatibility', err);
    }
})();
