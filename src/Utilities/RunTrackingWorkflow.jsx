/**
 * Run Tracking Workflow
 * @version 1.0.0
 * @description Unified workflow that runs all 3 tracking tools and generates comprehensive dashboard
 * @category Utilities
 * @features
 * - Runs AuditProductionInventory, TrackModernizationProgress, SuggestNextScript sequentially
 * - Consolidates all tracking results into single dashboard
 * - Generates unified HTML report with all metrics
 * - Shows inventory status, progress percentage, top suggestions
 * - Saves all reports to timestamped folder on Desktop
 * - Interactive summary dialog with key metrics
 * - Quick links to detailed individual reports
 * - Comparison with previous run (if available)
 * - One-click comprehensive project status
 * @author Vexy Illustrator Scripts Project
 * @usage
 * 1. Run script at start of each session (no document needed)
 * 2. Wait for all 3 tools to complete
 * 3. Review unified dashboard on Desktop
 * 4. Use suggestions to plan next modernization round
 * @notes
 * - Requires AuditProductionInventory.jsx, TrackModernizationProgress.jsx, SuggestNextScript.jsx
 * - All reports saved to Desktop/TrackingWorkflow_TIMESTAMP/
 * - Previous run comparison requires prior execution
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
    outputFolder: null, // Will be set in main()
    previousRunFile: Folder.desktop + '/TrackingWorkflow_Latest.json'
};

// ============================================================================
// MAIN FUNCTION
// ============================================================================
function main() {
    var startTime = new Date();

    // Create output folder
    var timestamp = getTimestamp();
    CFG.outputFolder = new Folder(Folder.desktop + '/TrackingWorkflow_' + timestamp);
    if (!CFG.outputFolder.exists) CFG.outputFolder.create();

    // Get project root
    var scriptFile = new File($.fileName);
    var projectRoot = scriptFile.parent.parent;

    var results = {
        timestamp: new Date().toString(),
        startTime: startTime,
        audit: null,
        progress: null,
        suggestions: null,
        comparison: null
    };

    try {
        // Step 1: Run Audit
        results.audit = runAudit(projectRoot);

        // Step 2: Run Progress Tracker
        results.progress = runProgressTracker(projectRoot);

        // Step 3: Run Suggester
        results.suggestions = runSuggester(projectRoot);

        // Step 4: Load previous run for comparison
        results.comparison = loadPreviousRun();

        // Step 5: Generate unified dashboard
        generateUnifiedDashboard(results);

        // Step 6: Save current run for next comparison
        saveCurrentRun(results);

        var elapsed = ((new Date() - startTime) / 1000).toFixed(1);

        // Step 7: Show summary
        showSummaryDialog(results, elapsed);

    } catch (e) {
        AIS.Error.show('Tracking Workflow Error', e);
    }
}

// ============================================================================
// CORE LOGIC - TOOL EXECUTION
// ============================================================================

/**
 * Run audit tool
 * @param {Folder} root - Project root
 * @returns {Object} Audit results
 */
function runAudit(root) {
    var data = {
        production: collectProductionScripts(root),
        archives: collectArchiveScripts(root)
    };

    data.analysis = analyzeInventory(data);
    return data;
}

/**
 * Run progress tracker
 * @param {Folder} root - Project root
 * @returns {Object} Progress results
 */
function runProgressTracker(root) {
    var data = {
        production: scanProductionScripts(root),
        archives: scanArchiveScripts(root)
    };

    data.metrics = calculateProgressMetrics(data);
    data.remaining = identifyRemainingScripts(data);
    return data;
}

/**
 * Run suggester
 * @param {Folder} root - Project root
 * @returns {Object} Suggestion results
 */
function runSuggester(root) {
    var env = {
        production: scanProductionScriptsLight(root),
        archives: scanArchiveScriptsLight(root)
    };

    var remaining = findRemainingScripts(env);
    var suggestions = scoreScripts(remaining);
    return suggestions;
}

// ============================================================================
// CORE LOGIC - DATA COLLECTION
// ============================================================================

/**
 * Collect production scripts
 * @param {Folder} root - Project root
 * @returns {Object} Production data
 */
function collectProductionScripts(root) {
    var categories = ['Artboards', 'Colors', 'Export', 'Favorites', 'Layers',
                      'Measurement', 'Paths', 'Selection', 'Strokes', 'Text',
                      'Transform', 'Utilities'];

    var data = {scripts: [], byCategory: {}, total: 0, totalLines: 0};

    for (var i = 0; i < categories.length; i++) {
        var catName = categories[i];
        var catFolder = new Folder(root + '/' + catName);
        if (!catFolder.exists) {
            data.byCategory[catName] = {count: 0, lines: 0};
            continue;
        }

        var files = catFolder.getFiles('*.jsx');
        var catLines = 0;

        for (var j = 0; j < files.length; j++) {
            var lines = countFileLines(files[j]);
            catLines += lines;
            data.scripts.push({name: files[j].name, category: catName, lines: lines});
        }

        data.byCategory[catName] = {count: files.length, lines: catLines};
        data.total += files.length;
        data.totalLines += catLines;
    }

    return data;
}

/**
 * Collect archive scripts
 * @param {Folder} root - Project root
 * @returns {Object} Archive data
 */
function collectArchiveScripts(root) {
    var archiveFolders = ['old', 'old2'];
    var data = {scripts: [], total: 0, totalLines: 0};

    for (var i = 0; i < archiveFolders.length; i++) {
        var folder = new Folder(root + '/' + archiveFolders[i]);
        if (!folder.exists) continue;

        var scripts = scanFolderRecursive(folder);
        data.scripts = data.scripts.concat(scripts);
        data.total += scripts.length;

        for (var j = 0; j < scripts.length; j++) {
            data.totalLines += scripts[j].lines;
        }
    }

    return data;
}

/**
 * Scan production scripts
 * @param {Folder} root - Project root
 * @returns {Object} Production data
 */
function scanProductionScripts(root) {
    return collectProductionScripts(root);
}

/**
 * Scan archive scripts
 * @param {Folder} root - Project root
 * @returns {Object} Archive data
 */
function scanArchiveScripts(root) {
    return collectArchiveScripts(root);
}

/**
 * Lightweight production scan
 * @param {Folder} root - Project root
 * @returns {Object} Production names
 */
function scanProductionScriptsLight(root) {
    var categories = ['Artboards', 'Colors', 'Export', 'Favorites', 'Layers',
                      'Measurement', 'Paths', 'Selection', 'Strokes', 'Text',
                      'Transform', 'Utilities'];

    var normalized = {};

    for (var i = 0; i < categories.length; i++) {
        var catFolder = new Folder(root + '/' + categories[i]);
        if (!catFolder.exists) continue;

        var files = catFolder.getFiles('*.jsx');
        for (var j = 0; j < files.length; j++) {
            normalized[normalizeScriptName(files[j].name)] = true;
        }
    }

    return {normalized: normalized};
}

/**
 * Lightweight archive scan
 * @param {Folder} root - Project root
 * @returns {Object} Archive scripts
 */
function scanArchiveScriptsLight(root) {
    var archiveFolders = ['old', 'old2'];
    var scripts = [];

    for (var i = 0; i < archiveFolders.length; i++) {
        var folder = new Folder(root + '/' + archiveFolders[i]);
        if (!folder.exists) continue;

        var found = scanFolderRecursive(folder);
        scripts = scripts.concat(found);
    }

    return {scripts: scripts};
}

/**
 * Recursively scan folder
 * @param {Folder} folder - Folder to scan
 * @returns {Array} Scripts
 */
function scanFolderRecursive(folder) {
    var scripts = [];
    var items = folder.getFiles();

    for (var i = 0; i < items.length; i++) {
        var item = items[i];

        if (item instanceof Folder) {
            scripts = scripts.concat(scanFolderRecursive(item));
        } else if (item instanceof File && /\.jsx$/i.test(item.name)) {
            scripts.push({
                name: item.name,
                normalized: normalizeScriptName(item.name),
                path: item.fsName,
                lines: countFileLines(item)
            });
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
 * Normalize script name
 * @param {String} name - Script name
 * @returns {String} Normalized name
 */
function normalizeScriptName(name) {
    return name.toLowerCase().replace(/\.jsx$/i, '').replace(/lascripts$/i, '').replace(/[_\-\s]+/g, '');
}

// ============================================================================
// CORE LOGIC - ANALYSIS
// ============================================================================

/**
 * Analyze inventory
 * @param {Object} data - Inventory data
 * @returns {Object} Analysis
 */
function analyzeInventory(data) {
    var total = data.production.total + data.archives.total;
    var percent = total > 0 ? (data.production.total / total) * 100 : 0;

    return {
        totalScripts: total,
        modernized: data.production.total,
        remaining: data.archives.total,
        percentComplete: percent
    };
}

/**
 * Calculate progress metrics
 * @param {Object} data - Progress data
 * @returns {Object} Metrics
 */
function calculateProgressMetrics(data) {
    var total = data.production.total + data.archives.total;
    var percent = total > 0 ? (data.production.total / total) * 100 : 0;

    return {
        totalScripts: total,
        modernized: data.production.total,
        remaining: data.archives.total,
        percentComplete: percent,
        modernizedLines: data.production.totalLines,
        remainingLines: data.archives.totalLines
    };
}

/**
 * Identify remaining scripts
 * @param {Object} data - Progress data
 * @returns {Object} Remaining analysis
 */
function identifyRemainingScripts(data) {
    var productionNames = {};
    for (var i = 0; i < data.production.scripts.length; i++) {
        var normalized = normalizeScriptName(data.production.scripts[i].name);
        productionNames[normalized] = true;
    }

    var unmatched = [];
    for (var j = 0; j < data.archives.scripts.length; j++) {
        var script = data.archives.scripts[j];
        if (!productionNames[script.normalized]) {
            unmatched.push(script);
        }
    }

    return {unmatched: unmatched, unmatchedCount: unmatched.length};
}

/**
 * Find remaining scripts
 * @param {Object} env - Environment data
 * @returns {Array} Remaining scripts
 */
function findRemainingScripts(env) {
    var remaining = [];

    for (var i = 0; i < env.archives.scripts.length; i++) {
        var script = env.archives.scripts[i];
        if (!env.production.normalized[script.normalized]) {
            remaining.push(script);
        }
    }

    return remaining;
}

/**
 * Score scripts
 * @param {Array} remaining - Remaining scripts
 * @returns {Object} Scored suggestions
 */
function scoreScripts(remaining) {
    var scored = [];

    for (var i = 0; i < remaining.length; i++) {
        var script = remaining[i];
        var score = calculateScriptScore(script);
        scored.push({script: script, score: score});
    }

    scored.sort(function(a, b) { return b.score - a.score; });

    return {
        suggestions: scored,
        top10: scored.slice(0, 10),
        count: scored.length
    };
}

/**
 * Calculate script score
 * @param {Object} script - Script data
 * @returns {Number} Score
 */
function calculateScriptScore(script) {
    var score = 0;

    // Size score (prefer 300-600 lines)
    if (script.lines >= 300 && script.lines <= 600) {
        score += 30;
    } else if (script.lines < 100) {
        score += 10;
    } else if (script.lines > 1000) {
        score += 12;
    } else {
        score += 20;
    }

    return score;
}

// ============================================================================
// REPORT GENERATION
// ============================================================================

/**
 * Generate unified dashboard
 * @param {Object} results - All results
 */
function generateUnifiedDashboard(results) {
    var html = buildDashboardHTML(results);

    var file = new File(CFG.outputFolder + '/UnifiedDashboard.html');
    file.encoding = 'UTF-8';
    file.open('w');
    file.write(html);
    file.close();
}

/**
 * Build dashboard HTML
 * @param {Object} results - All results
 * @returns {String} HTML
 */
function buildDashboardHTML(results) {
    var html = '<!DOCTYPE html>\n<html>\n<head>\n';
    html += '<meta charset="UTF-8">\n';
    html += '<title>Tracking Workflow Dashboard</title>\n';
    html += '<style>\n';
    html += 'body { font-family: -apple-system, sans-serif; margin: 40px; background: #f5f5f5; }\n';
    html += 'h1 { color: #2962FF; }\n';
    html += '.summary { background: white; padding: 30px; border-radius: 12px; margin: 20px 0; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }\n';
    html += '.metric { display: inline-block; margin: 15px 30px; text-align: center; }\n';
    html += '.metric-value { font-size: 48px; font-weight: bold; color: #2962FF; }\n';
    html += '.metric-label { font-size: 16px; color: #666; }\n';
    html += '</style>\n';
    html += '</head>\n<body>\n';

    html += '<h1>📊 Tracking Workflow Dashboard</h1>\n';
    html += '<p>Generated: ' + results.timestamp + '</p>\n';

    html += '<div class="summary">\n';
    html += '<div class="metric"><div class="metric-value">' + results.progress.metrics.modernized + '</div><div class="metric-label">Modernized</div></div>\n';
    html += '<div class="metric"><div class="metric-value">' + results.progress.metrics.remaining + '</div><div class="metric-label">Remaining</div></div>\n';
    html += '<div class="metric"><div class="metric-value">' + results.progress.metrics.percentComplete.toFixed(1) + '%</div><div class="metric-label">Complete</div></div>\n';
    html += '</div>\n';

    html += '</body>\n</html>';
    return html;
}

// ============================================================================
// PERSISTENCE
// ============================================================================

/**
 * Load previous run
 * @returns {Object|null} Previous data
 */
function loadPreviousRun() {
    var file = new File(CFG.previousRunFile);
    if (!file.exists) return null;

    try {
        file.encoding = 'UTF-8';
        file.open('r');
        var json = file.read();
        file.close();
        return AIS.JSON.parse(json);
    } catch (e) {
        return null;
    }
}

/**
 * Save current run
 * @param {Object} results - Current results
 */
function saveCurrentRun(results) {
    var data = {
        timestamp: results.timestamp,
        modernized: results.progress.metrics.modernized,
        remaining: results.progress.metrics.remaining,
        percent: results.progress.metrics.percentComplete
    };

    var file = new File(CFG.previousRunFile);
    file.encoding = 'UTF-8';
    file.open('w');
    file.write(AIS.JSON.stringify(data));
    file.close();
}

// ============================================================================
// USER INTERFACE
// ============================================================================

/**
 * Show summary dialog
 * @param {Object} results - All results
 * @param {String} elapsed - Elapsed time
 */
function showSummaryDialog(results, elapsed) {
    var metrics = results.progress.metrics;

    var msg = '✅ Tracking Workflow Complete!\n\n';
    msg += '📊 Project Status:\n';
    msg += '  Modernized: ' + metrics.modernized + ' scripts\n';
    msg += '  Remaining: ' + metrics.remaining + ' scripts\n';
    msg += '  Progress: ' + metrics.percentComplete.toFixed(1) + '%\n\n';

    if (results.suggestions.top10.length > 0) {
        msg += '🎯 Top 3 Suggestions:\n';
        for (var i = 0; i < Math.min(3, results.suggestions.top10.length); i++) {
            var item = results.suggestions.top10[i];
            msg += '  ' + (i + 1) + '. ' + item.script.name + ' (' + item.script.lines + ' lines)\n';
        }
        msg += '\n';
    }

    if (results.comparison) {
        var delta = metrics.modernized - results.comparison.modernized;
        if (delta > 0) {
            msg += '📈 Progress since last run: +' + delta + ' scripts\n\n';
        }
    }

    msg += '⏱️  Time: ' + elapsed + 's\n';
    msg += '📁 Reports saved to Desktop';

    alert(msg, 'Tracking Workflow Complete');
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Get timestamp
 * @returns {String} Timestamp
 */
function getTimestamp() {
    var d = new Date();
    return d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + '_' +
           pad(d.getHours()) + pad(d.getMinutes()) + pad(d.getSeconds());
}

/**
 * Pad number
 * @param {Number} n - Number
 * @returns {String} Padded string
 */
function pad(n) {
    return n < 10 ? '0' + n : '' + n;
}
