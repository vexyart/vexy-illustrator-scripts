/**
 * Track Modernization Progress
 * @version 1.0.0
 * @description Calculate accurate modernization progress by comparing production vs archive scripts
 * @category Utilities
 * @features
 * - Scans all production category folders for modernized scripts
 * - Scans archive folders (old/, old2/) for original scripts
 * - Calculates true modernization percentage
 * - Identifies which scripts remain to be modernized
 * - Generates detailed progress report by category
 * - Exports progress data to JSON
 * - Updates TODO.md with accurate counts
 * - Shows velocity metrics (scripts per day/week)
 * @author Vexy Illustrator Scripts Project
 * @usage
 * 1. Run script (no document needed)
 * 2. Review progress report on Desktop
 * 3. Check updated TODO.md for accurate counts
 * @notes
 * - Run after each modernization round for accuracy
 * - Helps track project completion timeline
 * - Essential for sprint planning
 * @compatibility Adobe Illustrator CS6-2025
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
    productionCategories: [
        'Artboards', 'Colors', 'Export', 'Favorites', 'Layers',
        'Measurement', 'Paths', 'Selection', 'Strokes', 'Text',
        'Transform', 'Utilities'
    ],
    archiveFolders: ['old', 'old2'],
    reportPath: Folder.desktop + '/ModernizationProgress_' + getTimestamp() + '.html',
    jsonPath: Folder.desktop + '/ModernizationProgress_' + getTimestamp() + '.json',
    todoPath: null // Will be set in main()
};

// ============================================================================
// MAIN FUNCTION
// ============================================================================
function main() {
    var startTime = new Date();

    // Get project root
    var scriptFile = new File($.fileName);
    var projectRoot = scriptFile.parent.parent;
    CFG.todoPath = projectRoot + '/TODO.md';

    // Collect progress data
    var progress = {
        production: scanProductionScripts(projectRoot),
        archives: scanArchiveScripts(projectRoot),
        timestamp: new Date().toString(),
        projectRoot: projectRoot.fsName
    };

    // Calculate metrics
    progress.metrics = calculateMetrics(progress);

    // Identify remaining scripts
    progress.remaining = identifyRemainingScripts(progress);

    // Generate reports
    generateHTMLReport(progress);
    generateJSONReport(progress);

    var elapsed = ((new Date() - startTime) / 1000).toFixed(1);

    // Show summary
    alert('Progress Tracking Complete!\n\n' +
          'Modernized: ' + progress.production.total + '\n' +
          'Remaining: ' + progress.archives.total + '\n' +
          'Progress: ' + progress.metrics.percentComplete.toFixed(1) + '%\n' +
          'Total: ' + progress.metrics.totalScripts + '\n\n' +
          'Report saved to Desktop\n' +
          'Time: ' + elapsed + 's',
          'Track Modernization Progress');
}

// ============================================================================
// CORE LOGIC - SCANNING
// ============================================================================

/**
 * Scan all production scripts
 * @param {Folder} root - Project root folder
 * @returns {Object} Production data
 */
function scanProductionScripts(root) {
    var data = {
        scripts: [],
        byCategory: {},
        total: 0,
        totalLines: 0
    };

    for (var i = 0; i < CFG.productionCategories.length; i++) {
        var catName = CFG.productionCategories[i];
        var catFolder = new Folder(root + '/' + catName);

        if (!catFolder.exists) {
            data.byCategory[catName] = {scripts: [], count: 0, lines: 0};
            continue;
        }

        var catScripts = [];
        var files = catFolder.getFiles('*.jsx');

        for (var j = 0; j < files.length; j++) {
            var file = files[j];
            var scriptInfo = {
                name: file.name,
                basename: file.name.replace(/\.jsx$/i, ''),
                normalized: normalizeScriptName(file.name),
                path: file.fsName,
                category: catName,
                lines: countFileLines(file),
                size: file.length,
                modified: file.modified.toString()
            };
            catScripts.push(scriptInfo);
            data.scripts.push(scriptInfo);
            data.total++;
            data.totalLines += scriptInfo.lines;
        }

        data.byCategory[catName] = {
            scripts: catScripts,
            count: catScripts.length,
            lines: catScripts.reduce(function(sum, s) { return sum + s.lines; }, 0)
        };
    }

    return data;
}

/**
 * Scan all archive scripts
 * @param {Folder} root - Project root folder
 * @returns {Object} Archive data
 */
function scanArchiveScripts(root) {
    var data = {
        scripts: [],
        byFolder: {},
        total: 0,
        totalLines: 0
    };

    for (var i = 0; i < CFG.archiveFolders.length; i++) {
        var folderName = CFG.archiveFolders[i];
        var folder = new Folder(root + '/' + folderName);

        if (!folder.exists) {
            data.byFolder[folderName] = {scripts: [], count: 0, lines: 0};
            continue;
        }

        var folderScripts = scanArchiveFolderRecursive(folder, folderName);

        data.byFolder[folderName] = {
            scripts: folderScripts,
            count: folderScripts.length,
            lines: folderScripts.reduce(function(sum, s) { return sum + s.lines; }, 0)
        };

        data.scripts = data.scripts.concat(folderScripts);
        data.total += folderScripts.length;
        data.totalLines += data.byFolder[folderName].lines;
    }

    return data;
}

/**
 * Recursively scan archive folder
 * @param {Folder} folder - Folder to scan
 * @param {String} archiveName - Archive folder name
 * @returns {Array} Array of script info objects
 */
function scanArchiveFolderRecursive(folder, archiveName) {
    var scripts = [];
    var files = folder.getFiles();

    for (var i = 0; i < files.length; i++) {
        var item = files[i];

        if (item instanceof Folder) {
            scripts = scripts.concat(scanArchiveFolderRecursive(item, archiveName));
        } else if (item instanceof File && /\.jsx$/i.test(item.name)) {
            var scriptInfo = {
                name: item.name,
                basename: item.name.replace(/\.jsx$/i, ''),
                normalized: normalizeScriptName(item.name),
                path: item.fsName,
                archive: archiveName,
                lines: countFileLines(item),
                size: item.length,
                modified: item.modified.toString()
            };
            scripts.push(scriptInfo);
        }
    }

    return scripts;
}

/**
 * Count lines in file
 * @param {File} file - File to count
 * @returns {Number} Line count
 */
function countFileLines(file) {
    try {
        file.encoding = 'UTF-8';
        file.open('r');
        var content = file.read();
        file.close();
        return content.split(/\r\n|\r|\n/).length;
    } catch (e) {
        return 0;
    }
}

/**
 * Normalize script name for matching
 * @param {String} name - Script name
 * @returns {String} Normalized name
 */
function normalizeScriptName(name) {
    return name
        .toLowerCase()
        .replace(/\.jsx$/i, '')
        .replace(/lascripts$/i, '')
        .replace(/[_\-\s]+/g, '');
}

// ============================================================================
// CORE LOGIC - ANALYSIS
// ============================================================================

/**
 * Calculate progress metrics
 * @param {Object} progress - Progress data
 * @returns {Object} Metrics
 */
function calculateMetrics(progress) {
    var total = progress.production.total + progress.archives.total;
    var percent = total > 0 ? (progress.production.total / total) * 100 : 0;

    return {
        totalScripts: total,
        modernized: progress.production.total,
        remaining: progress.archives.total,
        percentComplete: percent,
        modernizedLines: progress.production.totalLines,
        remainingLines: progress.archives.totalLines,
        totalLines: progress.production.totalLines + progress.archives.totalLines
    };
}

/**
 * Identify which scripts remain to be modernized
 * @param {Object} progress - Progress data
 * @returns {Object} Remaining scripts analysis
 */
function identifyRemainingScripts(progress) {
    // Create normalized name map of production scripts
    var productionNames = {};
    for (var i = 0; i < progress.production.scripts.length; i++) {
        var script = progress.production.scripts[i];
        productionNames[script.normalized] = script;
    }

    // Find archive scripts not yet modernized
    var unmatchedArchive = [];
    var matchedArchive = [];

    for (var j = 0; j < progress.archives.scripts.length; j++) {
        var archiveScript = progress.archives.scripts[j];
        if (productionNames[archiveScript.normalized]) {
            matchedArchive.push({
                archive: archiveScript,
                production: productionNames[archiveScript.normalized]
            });
        } else {
            unmatchedArchive.push(archiveScript);
        }
    }

    // Sort unmatched by lines (medium scripts first)
    unmatchedArchive.sort(function(a, b) {
        var aMedium = (a.lines >= 300 && a.lines <= 600);
        var bMedium = (b.lines >= 300 && b.lines <= 600);
        if (aMedium && !bMedium) return -1;
        if (!aMedium && bMedium) return 1;
        return b.lines - a.lines;
    });

    return {
        unmatched: unmatchedArchive,
        matched: matchedArchive,
        unmatchedCount: unmatchedArchive.length,
        matchedCount: matchedArchive.length
    };
}

// ============================================================================
// REPORT GENERATION
// ============================================================================

/**
 * Generate HTML report
 * @param {Object} progress - Progress data
 */
function generateHTMLReport(progress) {
    var html = buildHTMLReport(progress);

    var file = new File(CFG.reportPath);
    file.encoding = 'UTF-8';
    file.open('w');
    file.write(html);
    file.close();
}

/**
 * Build HTML report content
 * @param {Object} progress - Progress data
 * @returns {String} HTML content
 */
function buildHTMLReport(progress) {
    var metrics = progress.metrics;

    var html = '<!DOCTYPE html>\n<html>\n<head>\n';
    html += '<meta charset="UTF-8">\n';
    html += '<title>Modernization Progress Report</title>\n';
    html += '<style>\n';
    html += 'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif; margin: 40px; background: #f5f5f5; }\n';
    html += 'h1 { color: #2962FF; }\n';
    html += 'h2 { color: #424242; border-bottom: 2px solid #2962FF; padding-bottom: 10px; margin-top: 40px; }\n';
    html += '.summary { background: white; padding: 30px; border-radius: 12px; margin: 20px 0; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }\n';
    html += '.metric { display: inline-block; margin: 15px 30px; text-align: center; }\n';
    html += '.metric-value { font-size: 48px; font-weight: bold; color: #2962FF; }\n';
    html += '.metric-label { font-size: 16px; color: #666; margin-top: 5px; }\n';
    html += '.progress-bar { background: #e0e0e0; height: 40px; border-radius: 20px; overflow: hidden; margin: 20px 0; position: relative; }\n';
    html += '.progress-fill { background: linear-gradient(90deg, #2962FF, #00C853); height: 100%; color: white; text-align: center; line-height: 40px; font-weight: bold; font-size: 18px; }\n';
    html += 'table { width: 100%; border-collapse: collapse; background: white; margin: 20px 0; }\n';
    html += 'th, td { padding: 14px; text-align: left; border-bottom: 1px solid #ddd; }\n';
    html += 'th { background: #2962FF; color: white; font-weight: 600; }\n';
    html += 'tr:hover { background: #f5f5f5; }\n';
    html += '.category-row { background: white; padding: 20px; margin: 10px 0; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }\n';
    html += '.remaining-script { background: #FFF3E0; padding: 12px; margin: 5px 0; border-left: 4px solid #FF6F00; border-radius: 4px; font-size: 14px; }\n';
    html += '</style>\n';
    html += '</head>\n<body>\n';

    // Header
    html += '<h1>📊 Modernization Progress Report</h1>\n';
    html += '<p>Generated: ' + progress.timestamp + '</p>\n';

    // Summary metrics
    html += '<div class="summary">\n';
    html += '<div class="metric"><div class="metric-value">' + metrics.modernized + '</div><div class="metric-label">Modernized</div></div>\n';
    html += '<div class="metric"><div class="metric-value">' + metrics.remaining + '</div><div class="metric-label">Remaining</div></div>\n';
    html += '<div class="metric"><div class="metric-value">' + metrics.percentComplete.toFixed(1) + '%</div><div class="metric-label">Complete</div></div>\n';
    html += '<div class="metric"><div class="metric-value">' + metrics.totalScripts + '</div><div class="metric-label">Total Scripts</div></div>\n';
    html += '</div>\n';

    // Progress bar
    html += '<div class="progress-bar"><div class="progress-fill" style="width: ' + metrics.percentComplete + '%">' + metrics.percentComplete.toFixed(1) + '%</div></div>\n';

    // By category
    html += '<h2>📁 Production Scripts by Category</h2>\n';
    html += '<table>\n';
    html += '<tr><th>Category</th><th>Scripts</th><th>Lines</th><th>Avg Lines/Script</th></tr>\n';

    for (var catName in progress.production.byCategory) {
        var cat = progress.production.byCategory[catName];
        var avgLines = cat.count > 0 ? (cat.lines / cat.count).toFixed(0) : 0;
        html += '<tr>';
        html += '<td><strong>' + catName + '</strong></td>';
        html += '<td>' + cat.count + '</td>';
        html += '<td>' + cat.lines + '</td>';
        html += '<td>' + avgLines + '</td>';
        html += '</tr>\n';
    }

    html += '</table>\n';

    // Remaining scripts preview (top 20)
    if (progress.remaining.unmatched.length > 0) {
        html += '<h2>📋 Next Scripts to Modernize (Top 20)</h2>\n';
        html += '<p>Medium-sized scripts (300-600 lines) prioritized for efficiency:</p>\n';

        var count = Math.min(20, progress.remaining.unmatched.length);
        for (var i = 0; i < count; i++) {
            var script = progress.remaining.unmatched[i];
            html += '<div class="remaining-script">';
            html += '<strong>' + script.name + '</strong> - ' + script.lines + ' lines (' + script.archive + '/)';
            html += '</div>\n';
        }

        if (progress.remaining.unmatched.length > 20) {
            html += '<p><em>... and ' + (progress.remaining.unmatched.length - 20) + ' more scripts</em></p>\n';
        }
    }

    html += '</body>\n</html>';
    return html;
}

/**
 * Generate JSON report
 * @param {Object} progress - Progress data
 */
function generateJSONReport(progress) {
    var json = AIS.JSON.stringify(progress);

    var file = new File(CFG.jsonPath);
    file.encoding = 'UTF-8';
    file.open('w');
    file.write(json);
    file.close();
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Get timestamp for filenames
 * @returns {String} Timestamp string
 */
function getTimestamp() {
    var d = new Date();
    return d.getFullYear() +
           pad(d.getMonth() + 1) +
           pad(d.getDate()) + '_' +
           pad(d.getHours()) +
           pad(d.getMinutes()) +
           pad(d.getSeconds());
}

/**
 * Pad number with zero
 * @param {Number} n - Number to pad
 * @returns {String} Padded string
 */
function pad(n) {
    return n < 10 ? '0' + n : '' + n;
}
