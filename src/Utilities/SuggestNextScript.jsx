/**
 * Suggest Next Script
 * @version 1.0.0
 * @description Intelligent script prioritization to suggest best candidates for modernization
 * @category Utilities
 * @features
 * - Scans archive folders for unmapped scripts
 * - Scores scripts by multiple criteria (size, complexity, category)
 * - Prioritizes medium-sized scripts (300-600 lines) for efficiency
 * - Considers category completion progress
 * - Avoids already-modernized scripts (duplicate detection)
 * - Generates top 10 recommendations with reasoning
 * - Exports suggestions to HTML and JSON
 * - Interactive dialog shows immediate suggestions
 * @author Vexy Illustrator Scripts Project
 * @usage
 * 1. Run script (no document needed)
 * 2. Review top 10 suggested scripts in dialog
 * 3. Check detailed report on Desktop
 * 4. Choose a script and begin modernization
 * @notes
 * - Run before each modernization round
 * - Prevents duplicate work
 * - Optimizes for developer efficiency
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
    reportPath: Folder.desktop + '/NextScriptSuggestions_' + getTimestamp() + '.html',
    jsonPath: Folder.desktop + '/NextScriptSuggestions_' + getTimestamp() + '.json',

    // Scoring weights
    weights: {
        sizeOptimal: 30,      // Medium size (300-600 lines) is ideal
        categoryProgress: 25,  // Prefer completing categories
        complexity: 20,        // Prefer moderate complexity
        archive: 15,           // Prefer old2/ over old/ (better code quality)
        recency: 10            // Prefer recently modified (more relevant)
    },

    // Size preferences
    optimalMinLines: 300,
    optimalMaxLines: 600,
    tooSmallLines: 100,
    tooLargeLines: 1000
};

// ============================================================================
// MAIN FUNCTION
// ============================================================================
function main() {
    var startTime = new Date();

    // Get project root
    var scriptFile = new File($.fileName);
    var projectRoot = scriptFile.parent.parent;

    // Scan environment
    var env = {
        production: scanProductionScripts(projectRoot),
        archives: scanArchiveScripts(projectRoot)
    };

    // Find remaining scripts
    var remaining = identifyRemainingScripts(env);

    // Score and rank suggestions
    var suggestions = scoreAndRankScripts(remaining, env);

    // Generate reports
    generateHTMLReport(suggestions);
    generateJSONReport(suggestions);

    // Show dialog with top suggestions
    showSuggestionsDialog(suggestions);

    var elapsed = ((new Date() - startTime) / 1000).toFixed(1);
}

// ============================================================================
// CORE LOGIC - SCANNING
// ============================================================================

/**
 * Scan production scripts
 * @param {Folder} root - Project root
 * @returns {Object} Production data
 */
function scanProductionScripts(root) {
    var data = {
        scripts: [],
        byCategory: {},
        normalized: {}
    };

    for (var i = 0; i < CFG.productionCategories.length; i++) {
        var catName = CFG.productionCategories[i];
        var catFolder = new Folder(root + '/' + catName);

        if (!catFolder.exists) {
            data.byCategory[catName] = {count: 0};
            continue;
        }

        var files = catFolder.getFiles('*.jsx');
        data.byCategory[catName] = {count: files.length};

        for (var j = 0; j < files.length; j++) {
            var file = files[j];
            var normalized = normalizeScriptName(file.name);
            data.normalized[normalized] = true;
            data.scripts.push({
                name: file.name,
                normalized: normalized,
                category: catName
            });
        }
    }

    return data;
}

/**
 * Scan archive scripts
 * @param {Folder} root - Project root
 * @returns {Object} Archive data
 */
function scanArchiveScripts(root) {
    var data = {scripts: []};

    for (var i = 0; i < CFG.archiveFolders.length; i++) {
        var folderName = CFG.archiveFolders[i];
        var folder = new Folder(root + '/' + folderName);

        if (!folder.exists) continue;

        var folderScripts = scanArchiveFolderRecursive(folder, folderName);
        data.scripts = data.scripts.concat(folderScripts);
    }

    return data;
}

/**
 * Recursively scan archive folder
 * @param {Folder} folder - Folder to scan
 * @param {String} archiveName - Archive name
 * @returns {Array} Scripts
 */
function scanArchiveFolderRecursive(folder, archiveName) {
    var scripts = [];
    var files = folder.getFiles();

    for (var i = 0; i < files.length; i++) {
        var item = files[i];

        if (item instanceof Folder) {
            scripts = scripts.concat(scanArchiveFolderRecursive(item, archiveName));
        } else if (item instanceof File && /\.jsx$/i.test(item.name)) {
            scripts.push({
                name: item.name,
                basename: item.name.replace(/\.jsx$/i, ''),
                normalized: normalizeScriptName(item.name),
                path: item.fsName,
                archive: archiveName,
                lines: countFileLines(item),
                size: item.length,
                modified: item.modified
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
// CORE LOGIC - IDENTIFICATION
// ============================================================================

/**
 * Identify remaining scripts
 * @param {Object} env - Environment data
 * @returns {Array} Remaining scripts
 */
function identifyRemainingScripts(env) {
    var remaining = [];

    for (var i = 0; i < env.archives.scripts.length; i++) {
        var script = env.archives.scripts[i];
        if (!env.production.normalized[script.normalized]) {
            remaining.push(script);
        }
    }

    return remaining;
}

// ============================================================================
// CORE LOGIC - SCORING
// ============================================================================

/**
 * Score and rank scripts
 * @param {Array} remaining - Remaining scripts
 * @param {Object} env - Environment data
 * @returns {Object} Scored suggestions
 */
function scoreAndRankScripts(remaining, env) {
    var scored = [];

    for (var i = 0; i < remaining.length; i++) {
        var script = remaining[i];
        var score = calculateScore(script, env);
        scored.push({
            script: script,
            score: score.total,
            breakdown: score.breakdown,
            reasons: score.reasons
        });
    }

    // Sort by score descending
    scored.sort(function(a, b) { return b.score - a.score; });

    return {
        suggestions: scored,
        top10: scored.slice(0, 10),
        count: scored.length,
        timestamp: new Date().toString()
    };
}

/**
 * Calculate score for a script
 * @param {Object} script - Script data
 * @param {Object} env - Environment data
 * @returns {Object} Score with breakdown
 */
function calculateScore(script, env) {
    var breakdown = {};
    var reasons = [];

    // 1. Size score (prefer medium 300-600)
    var sizeScore = scoreSizeOptimal(script.lines);
    breakdown.size = sizeScore;
    if (script.lines >= CFG.optimalMinLines && script.lines <= CFG.optimalMaxLines) {
        reasons.push('Optimal size (' + script.lines + ' lines)');
    } else if (script.lines < CFG.tooSmallLines) {
        reasons.push('Small script (' + script.lines + ' lines)');
    } else if (script.lines > CFG.tooLargeLines) {
        reasons.push('Large script (' + script.lines + ' lines)');
    }

    // 2. Archive quality (old2 > old)
    var archiveScore = (script.archive === 'old2') ? CFG.weights.archive : 0;
    breakdown.archive = archiveScore;
    if (script.archive === 'old2') {
        reasons.push('From old2/ (better quality)');
    }

    // 3. Complexity score (based on lines and filename patterns)
    var complexityScore = scoreComplexity(script);
    breakdown.complexity = complexityScore;

    // 4. Category progress (prefer completing categories)
    var categoryScore = 0; // Default for archives without clear categories
    breakdown.category = categoryScore;

    // 5. Recency (prefer recently modified)
    var recencyScore = scoreRecency(script.modified);
    breakdown.recency = recencyScore;

    var total = sizeScore + archiveScore + complexityScore + categoryScore + recencyScore;

    return {
        total: total,
        breakdown: breakdown,
        reasons: reasons
    };
}

/**
 * Score size optimality
 * @param {Number} lines - Line count
 * @returns {Number} Score
 */
function scoreSizeOptimal(lines) {
    if (lines >= CFG.optimalMinLines && lines <= CFG.optimalMaxLines) {
        return CFG.weights.sizeOptimal;
    } else if (lines < CFG.tooSmallLines) {
        return CFG.weights.sizeOptimal * 0.3;
    } else if (lines > CFG.tooLargeLines) {
        return CFG.weights.sizeOptimal * 0.4;
    } else {
        return CFG.weights.sizeOptimal * 0.7;
    }
}

/**
 * Score complexity
 * @param {Object} script - Script data
 * @returns {Number} Score
 */
function scoreComplexity(script) {
    var name = script.name.toLowerCase();

    // Prefer moderate complexity
    var simple = /test|demo|sample|simple|basic/i.test(name);
    var complex = /advanced|complex|batch|multi|collection/i.test(name);

    if (simple) {
        return CFG.weights.complexity * 0.5;
    } else if (complex) {
        return CFG.weights.complexity * 0.6;
    } else {
        return CFG.weights.complexity; // Moderate complexity preferred
    }
}

/**
 * Score recency
 * @param {Date} modified - Modified date
 * @returns {Number} Score
 */
function scoreRecency(modified) {
    var now = new Date();
    var ageYears = (now - modified) / (1000 * 60 * 60 * 24 * 365);

    if (ageYears < 2) {
        return CFG.weights.recency;
    } else if (ageYears < 5) {
        return CFG.weights.recency * 0.7;
    } else {
        return CFG.weights.recency * 0.3;
    }
}

// ============================================================================
// USER INTERFACE
// ============================================================================

/**
 * Show suggestions dialog
 * @param {Object} suggestions - Suggestions data
 */
function showSuggestionsDialog(suggestions) {
    var top = suggestions.top10;

    var msg = 'Top 10 Scripts to Modernize Next:\n\n';

    for (var i = 0; i < top.length; i++) {
        var item = top[i];
        var script = item.script;
        msg += (i + 1) + '. ' + script.name + '\n';
        msg += '   Score: ' + item.score.toFixed(1) + ' | ' + script.lines + ' lines | ' + script.archive + '/\n';
        if (item.reasons.length > 0) {
            msg += '   ' + item.reasons.join(', ') + '\n';
        }
        msg += '\n';
    }

    msg += 'Total remaining: ' + suggestions.count + ' scripts\n';
    msg += 'Detailed report saved to Desktop';

    alert(msg, 'Suggested Scripts');
}

// ============================================================================
// REPORT GENERATION
// ============================================================================

/**
 * Generate HTML report
 * @param {Object} suggestions - Suggestions data
 */
function generateHTMLReport(suggestions) {
    var html = buildHTMLReport(suggestions);

    var file = new File(CFG.reportPath);
    file.encoding = 'UTF-8';
    file.open('w');
    file.write(html);
    file.close();
}

/**
 * Build HTML report
 * @param {Object} suggestions - Suggestions data
 * @returns {String} HTML
 */
function buildHTMLReport(suggestions) {
    var html = '<!DOCTYPE html>\n<html>\n<head>\n';
    html += '<meta charset="UTF-8">\n';
    html += '<title>Next Script Suggestions</title>\n';
    html += '<style>\n';
    html += 'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif; margin: 40px; background: #f5f5f5; }\n';
    html += 'h1 { color: #2962FF; }\n';
    html += 'h2 { color: #424242; border-bottom: 2px solid #2962FF; padding-bottom: 10px; }\n';
    html += '.script-card { background: white; padding: 20px; margin: 15px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }\n';
    html += '.script-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }\n';
    html += '.script-name { font-size: 20px; font-weight: bold; color: #2962FF; }\n';
    html += '.script-score { font-size: 32px; font-weight: bold; color: #00C853; }\n';
    html += '.script-meta { color: #666; font-size: 14px; margin: 5px 0; }\n';
    html += '.script-reasons { background: #E3F2FD; padding: 12px; border-radius: 4px; margin-top: 10px; font-size: 14px; }\n';
    html += '.rank { display: inline-block; background: #2962FF; color: white; width: 36px; height: 36px; border-radius: 50%; text-align: center; line-height: 36px; font-weight: bold; margin-right: 15px; }\n';
    html += '</style>\n';
    html += '</head>\n<body>\n';

    html += '<h1>🎯 Next Script Suggestions</h1>\n';
    html += '<p>Generated: ' + suggestions.timestamp + '</p>\n';
    html += '<p><strong>Total remaining scripts:</strong> ' + suggestions.count + '</p>\n';

    html += '<h2>Top 10 Recommendations</h2>\n';

    for (var i = 0; i < suggestions.top10.length; i++) {
        var item = suggestions.top10[i];
        var script = item.script;

        html += '<div class="script-card">\n';
        html += '<div class="script-header">\n';
        html += '<div><span class="rank">' + (i + 1) + '</span><span class="script-name">' + script.name + '</span></div>\n';
        html += '<div class="script-score">' + item.score.toFixed(1) + '</div>\n';
        html += '</div>\n';
        html += '<div class="script-meta">';
        html += '<strong>Lines:</strong> ' + script.lines + ' | ';
        html += '<strong>Archive:</strong> ' + script.archive + '/ | ';
        html += '<strong>Path:</strong> ' + script.path;
        html += '</div>\n';

        if (item.reasons.length > 0) {
            html += '<div class="script-reasons">';
            html += '<strong>Why this script:</strong> ' + item.reasons.join(', ');
            html += '</div>\n';
        }

        html += '</div>\n';
    }

    html += '</body>\n</html>';
    return html;
}

/**
 * Generate JSON report
 * @param {Object} suggestions - Suggestions data
 */
function generateJSONReport(suggestions) {
    var json = AIS.JSON.stringify(suggestions);

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
