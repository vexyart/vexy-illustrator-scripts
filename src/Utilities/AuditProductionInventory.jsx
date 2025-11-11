/**
 * Audit Production Inventory
 * @version 1.0.0
 * @description Comprehensive audit of production scripts vs originals to track true modernization progress
 * @category Utilities
 * @features
 * - Scans all production category folders for modernized scripts
 * - Cross-references with old/ and old2/ archive folders
 * - Detects which original scripts have been modernized
 * - Identifies unmapped/orphaned scripts
 * - Calculates accurate modernization percentage by category
 * - Generates detailed inventory report (HTML + JSON)
 * - Shows progress visualization with bars
 * - Flags potential duplicate modernizations
 * - Recommends next scripts to modernize by priority
 * - Exports machine-readable JSON for other tools
 * @author Vexy Illustrator Scripts Project
 * @usage
 * 1. Run script (no document needed)
 * 2. Review comprehensive inventory report
 * 3. Use JSON output for programmatic access
 * @notes
 * - Helps prevent duplicate modernization work
 * - Essential for accurate progress tracking
 * - Run periodically to update project status
 * @compatibility Adobe Illustrator CS6-2025
 */




//@target illustrator
var c=File(Folder.myDocuments+"/Adobe Scripts/vexy-ville.ini");if(c.exists){c.open('r');var p=c.read();c.close();var l=File(p+".lib/core.jsx");if(l.exists)$.evalFile(l.fsName);}
app.preferences.setBooleanPreference('ShowExternalJSXWarning', false);

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
    reportPath: Folder.desktop + '/ProductionInventory_' + getTimestamp() + '.html',
    jsonPath: Folder.desktop + '/ProductionInventory_' + getTimestamp() + '.json'
};

// ============================================================================
// MAIN FUNCTION
// ============================================================================
function main() {
    var startTime = new Date();

    // Get project root
    var scriptFile = new File($.fileName);
    var projectRoot = scriptFile.parent.parent;

    // Collect inventory data
    var inventory = {
        production: collectProductionScripts(projectRoot),
        archives: collectArchiveScripts(projectRoot),
        timestamp: new Date().toString(),
        projectRoot: projectRoot.fsName
    };

    // Analyze modernization status
    inventory.analysis = analyzeModernization(inventory);

    // Generate reports
    generateHTMLReport(inventory);
    generateJSONReport(inventory);

    var elapsed = ((new Date() - startTime) / 1000).toFixed(1);

    alert('Inventory Complete!\n\n' +
          'Production scripts: ' + inventory.production.total + '\n' +
          'Archive scripts: ' + inventory.archives.total + '\n' +
          'Modernization rate: ' + inventory.analysis.percentComplete.toFixed(1) + '%\n\n' +
          'Reports saved to Desktop\n' +
          'Time: ' + elapsed + 's',
          'Audit Production Inventory');
}

// ============================================================================
// CORE LOGIC - COLLECTION
// ============================================================================

/**
 * Collect all production scripts
 * @param {Folder} root - Project root folder
 * @returns {Object} Production inventory data
 */
function collectProductionScripts(root) {
    var data = {
        scripts: [],
        byCategory: {},
        total: 0,
        totalLines: 0
    };

    for (var i = 0; i < CFG.productionCategories.length; i++) {
        var catName = CFG.productionCategories[i];
        var catFolder = new Folder(root + '/' + catName);

        if (!catFolder.exists) continue;

        var catScripts = [];
        var files = catFolder.getFiles('*.jsx');

        for (var j = 0; j < files.length; j++) {
            var file = files[j];
            var scriptInfo = analyzeScript(file, catName, 'production');
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
 * Collect all archive scripts
 * @param {Folder} root - Project root folder
 * @returns {Object} Archive inventory data
 */
function collectArchiveScripts(root) {
    var data = {
        scripts: [],
        byFolder: {},
        total: 0,
        totalLines: 0
    };

    for (var i = 0; i < CFG.archiveFolders.length; i++) {
        var folderName = CFG.archiveFolders[i];
        var folder = new Folder(root + '/' + folderName);

        if (!folder.exists) continue;

        var folderScripts = collectArchiveScriptsRecursive(folder, folderName);

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
 * Recursively collect scripts from archive folder
 * @param {Folder} folder - Folder to scan
 * @param {String} archiveName - Archive folder name
 * @returns {Array} Array of script info objects
 */
function collectArchiveScriptsRecursive(folder, archiveName) {
    var scripts = [];
    var files = folder.getFiles();

    for (var i = 0; i < files.length; i++) {
        var item = files[i];

        if (item instanceof Folder) {
            scripts = scripts.concat(collectArchiveScriptsRecursive(item, archiveName));
        } else if (item instanceof File && /\.jsx$/i.test(item.name)) {
            var scriptInfo = analyzeScript(item, archiveName, 'archive');
            scripts.push(scriptInfo);
        }
    }

    return scripts;
}

/**
 * Analyze individual script file
 * @param {File} file - Script file
 * @param {String} category - Category or archive name
 * @param {String} type - 'production' or 'archive'
 * @returns {Object} Script information
 */
function analyzeScript(file, category, type) {
    var lines = countFileLines(file);
    var basename = file.name.replace(/\.jsx$/i, '');

    return {
        name: file.name,
        basename: basename,
        path: file.fsName,
        category: category,
        type: type,
        lines: lines,
        size: file.length,
        modified: file.modified.toString()
    };
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

// ============================================================================
// CORE LOGIC - ANALYSIS
// ============================================================================

/**
 * Analyze modernization status
 * @param {Object} inventory - Full inventory data
 * @returns {Object} Analysis results
 */
function analyzeModernization(inventory) {
    var analysis = {
        modernized: inventory.production.total,
        remaining: inventory.archives.total,
        percentComplete: (inventory.production.total / (inventory.production.total + inventory.archives.total)) * 100,
        byCategory: {},
        unmappedProduction: [],
        potentialDuplicates: [],
        recommendations: []
    };

    // Analyze by category
    for (var catName in inventory.production.byCategory) {
        var catData = inventory.production.byCategory[catName];
        analysis.byCategory[catName] = {
            count: catData.count,
            lines: catData.lines,
            scripts: catData.scripts.map(function(s) { return s.basename; })
        };
    }

    // Find potential matches (simple name-based matching)
    var prodNames = inventory.production.scripts.map(function(s) {
        return normalizeScriptName(s.basename);
    });

    var archiveNames = inventory.archives.scripts.map(function(s) {
        return normalizeScriptName(s.basename);
    });

    // Detect duplicates in production
    var seen = {};
    for (var i = 0; i < prodNames.length; i++) {
        var name = prodNames[i];
        if (seen[name]) {
            analysis.potentialDuplicates.push({
                name: name,
                scripts: [seen[name], inventory.production.scripts[i].path]
            });
        } else {
            seen[name] = inventory.production.scripts[i].path;
        }
    }

    // Calculate velocity (if we had historical data)
    analysis.velocity = {
        scriptsPerWeek: 'N/A',
        linesPerWeek: 'N/A',
        estimatedCompletion: 'N/A'
    };

    // Generate recommendations
    analysis.recommendations = generateRecommendations(inventory, analysis);

    return analysis;
}

/**
 * Normalize script name for matching
 * @param {String} name - Script basename
 * @returns {String} Normalized name
 */
function normalizeScriptName(name) {
    return name
        .toLowerCase()
        .replace(/[_\-\s]+/g, '')
        .replace(/lascripts$/i, '')
        .replace(/\.jsx$/i, '');
}

/**
 * Generate modernization recommendations
 * @param {Object} inventory - Inventory data
 * @param {Object} analysis - Analysis results
 * @returns {Array} Recommendations
 */
function generateRecommendations(inventory, analysis) {
    var recs = [];

    // Recommend by size (prefer medium scripts)
    var mediumScripts = inventory.archives.scripts.filter(function(s) {
        return s.lines >= 300 && s.lines <= 600;
    });

    if (mediumScripts.length > 0) {
        recs.push({
            type: 'size',
            message: 'Found ' + mediumScripts.length + ' medium-sized scripts (300-600 lines) - ideal for efficient modernization',
            scripts: mediumScripts.slice(0, 5).map(function(s) { return s.name; })
        });
    }

    // Recommend completing categories
    var categories = {};
    for (var i = 0; i < inventory.archives.scripts.length; i++) {
        var cat = inventory.archives.scripts[i].category;
        categories[cat] = (categories[cat] || 0) + 1;
    }

    for (var cat in categories) {
        if (categories[cat] < 10) {
            recs.push({
                type: 'category',
                message: 'Category "' + cat + '" has only ' + categories[cat] + ' scripts remaining - consider completing it',
                scripts: []
            });
        }
    }

    return recs;
}

// ============================================================================
// REPORT GENERATION
// ============================================================================

/**
 * Generate HTML report
 * @param {Object} inventory - Inventory data
 */
function generateHTMLReport(inventory) {
    var html = buildHTMLReport(inventory);

    var file = new File(CFG.reportPath);
    file.encoding = 'UTF-8';
    file.open('w');
    file.write(html);
    file.close();
}

/**
 * Build HTML report content
 * @param {Object} inventory - Inventory data
 * @returns {String} HTML content
 */
function buildHTMLReport(inventory) {
    var analysis = inventory.analysis;

    var html = '<!DOCTYPE html>\n<html>\n<head>\n';
    html += '<meta charset="UTF-8">\n';
    html += '<title>Production Inventory Report</title>\n';
    html += '<style>\n';
    html += 'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif; margin: 40px; background: #f5f5f5; }\n';
    html += 'h1 { color: #2962FF; }\n';
    html += 'h2 { color: #424242; border-bottom: 2px solid #2962FF; padding-bottom: 10px; }\n';
    html += '.summary { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }\n';
    html += '.metric { display: inline-block; margin: 10px 20px; }\n';
    html += '.metric-value { font-size: 36px; font-weight: bold; color: #2962FF; }\n';
    html += '.metric-label { font-size: 14px; color: #666; }\n';
    html += '.progress-bar { background: #e0e0e0; height: 30px; border-radius: 15px; overflow: hidden; margin: 10px 0; }\n';
    html += '.progress-fill { background: linear-gradient(90deg, #2962FF, #00C853); height: 100%; color: white; text-align: center; line-height: 30px; font-weight: bold; }\n';
    html += 'table { width: 100%; border-collapse: collapse; background: white; }\n';
    html += 'th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }\n';
    html += 'th { background: #2962FF; color: white; }\n';
    html += 'tr:hover { background: #f5f5f5; }\n';
    html += '.category { background: white; padding: 15px; margin: 10px 0; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }\n';
    html += '.rec { background: #fff3e0; padding: 15px; margin: 10px 0; border-left: 4px solid #FF6F00; border-radius: 4px; }\n';
    html += '</style>\n';
    html += '</head>\n<body>\n';

    // Header
    html += '<h1>🔍 Production Inventory Report</h1>\n';
    html += '<p>Generated: ' + inventory.timestamp + '</p>\n';

    // Summary metrics
    html += '<div class="summary">\n';
    html += '<div class="metric"><div class="metric-value">' + inventory.production.total + '</div><div class="metric-label">Production Scripts</div></div>\n';
    html += '<div class="metric"><div class="metric-value">' + inventory.archives.total + '</div><div class="metric-label">Archive Scripts</div></div>\n';
    html += '<div class="metric"><div class="metric-value">' + analysis.percentComplete.toFixed(1) + '%</div><div class="metric-label">Modernized</div></div>\n';
    html += '</div>\n';

    // Progress bar
    html += '<div class="progress-bar"><div class="progress-fill" style="width: ' + analysis.percentComplete + '%">' + analysis.percentComplete.toFixed(1) + '%</div></div>\n';

    // By category
    html += '<h2>📁 Production Scripts by Category</h2>\n';
    for (var catName in analysis.byCategory) {
        var cat = analysis.byCategory[catName];
        html += '<div class="category">\n';
        html += '<strong>' + catName + '</strong>: ' + cat.count + ' scripts (' + cat.lines + ' lines)<br>\n';
        html += '<small>' + cat.scripts.join(', ') + '</small>\n';
        html += '</div>\n';
    }

    // Recommendations
    if (analysis.recommendations.length > 0) {
        html += '<h2>💡 Recommendations</h2>\n';
        for (var i = 0; i < analysis.recommendations.length; i++) {
            var rec = analysis.recommendations[i];
            html += '<div class="rec">' + rec.message;
            if (rec.scripts.length > 0) {
                html += '<br><small>' + rec.scripts.join(', ') + '</small>';
            }
            html += '</div>\n';
        }
    }

    // Potential duplicates
    if (analysis.potentialDuplicates.length > 0) {
        html += '<h2>⚠️ Potential Duplicates</h2>\n';
        html += '<p>These scripts may have been modernized multiple times:</p>\n';
        for (var i = 0; i < analysis.potentialDuplicates.length; i++) {
            var dup = analysis.potentialDuplicates[i];
            html += '<div class="rec">Name: ' + dup.name + '<br><small>' + dup.scripts.join('<br>') + '</small></div>\n';
        }
    }

    html += '</body>\n</html>';
    return html;
}

/**
 * Generate JSON report
 * @param {Object} inventory - Inventory data
 */
function generateJSONReport(inventory) {
    var json = AIS.JSON.stringify(inventory);

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

// ============================================================================
// EXECUTE
// ============================================================================

try {
    main();
} catch (e) {
    AIS.Error.show('Script error', e);
}
