/**
 * Analyze Script Metadata Quality
 * @version 1.0.0
 * @description Evaluate the quality and completeness of JSDoc metadata across all scripts
 *
 * @category Utilities
 * @author Vexy Team
 * @license MIT
 *
 * @features
 * - Analyze @description quality (length, clarity, specificity)
 * - Check @features completeness (count, specificity)
 * - Verify @example presence in complex scripts
 * - Flag generic or vague descriptions
 * - Generate quality score per script (0-100)
 * - Show best and worst documented scripts
 * - Suggest specific improvements
 * - Generate comprehensive HTML report
 *
 * @requires lib/core.jsx
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
    scriptName: 'AnalyzeScriptMetadata',
    version: '1.0.0',

    // Folders to analyze
    scanFolders: [
        'Favorites', 'Text', 'Export', 'Measurement', 'Utilities',
        'Artboards', 'Colors', 'Layers', 'Paths', 'Transform',
        'Selection', 'Print', 'Effects', 'Guides', 'Layout',
        'Strokes', 'Preferences', 'Varia'
    ],

    // Quality thresholds
    thresholds: {
        descriptionMinLength: 20,        // Minimum chars for description
        descriptionGoodLength: 50,       // Good description length
        featuresMin: 3,                  // Minimum number of features
        featuresGood: 5,                 // Good number of features
        complexScriptLines: 500          // Scripts over this should have examples
    },

    // Generic terms to flag in descriptions
    genericTerms: [
        'does',
        'helps',
        'allows',
        'enables',
        'provides',
        'script for',
        'tool for',
        'utility for'
    ]
};

// ============================================================================
// MAIN FUNCTION
// ============================================================================

function main() {
    try {
        // Scan scripts
        var scripts = scanScripts();
        if (scripts.length === 0) {
            alert('No scripts found to analyze');
            return;
        }

        // Analyze each script
        var results = analyzeScripts(scripts);

        // Calculate statistics
        var stats = calculateStatistics(results);

        // Generate report
        var reportPath = generateReport(results, stats);

        // Show summary
        showSummary(stats, reportPath);

    } catch (err) {
        AIS.Error.show('Failed to analyze script metadata', err);
    }
}

// ============================================================================
// CORE LOGIC
// ============================================================================

/**
 * Scan all production scripts
 */
function scanScripts() {
    var scripts = [];
    var projectRoot = getProjectRoot();

    for (var i = 0; i < CFG.scanFolders.length; i++) {
        var folderPath = projectRoot + '/' + CFG.scanFolders[i];
        var folder = new Folder(folderPath);

        if (!folder.exists) continue;

        var files = folder.getFiles('*.jsx');
        for (var j = 0; j < files.length; j++) {
            if (files[j] instanceof File && files[j].name.indexOf('Lascripts') === -1) {
                scripts.push({
                    file: files[j],
                    folder: CFG.scanFolders[i],
                    name: files[j].name
                });
            }
        }
    }

    return scripts;
}

/**
 * Analyze all scripts
 */
function analyzeScripts(scripts) {
    var results = [];

    for (var i = 0; i < scripts.length; i++) {
        var script = scripts[i];
        var analysis = analyzeScript(script);
        if (analysis) {
            results.push(analysis);
        }
    }

    return results;
}

/**
 * Analyze single script metadata
 */
function analyzeScript(script) {
    // Read file
    script.file.encoding = 'UTF-8';
    script.file.open('r');
    var content = script.file.read();
    script.file.close();

    // Get line count
    var lineCount = content.split('\n').length;

    // Extract header
    var header = extractHeader(content);
    if (!header.raw) {
        return {
            script: script.name,
            folder: script.folder,
            score: 0,
            issues: ['No JSDoc header found'],
            lineCount: lineCount
        };
    }

    // Analyze metadata components
    var analysis = {
        script: script.name,
        folder: script.folder,
        lineCount: lineCount,
        description: analyzeDescription(header.tags.description),
        features: analyzeFeatures(header.tags.features, content),
        example: analyzeExample(header.tags.example, lineCount),
        completeness: analyzeCompleteness(header.tags),
        issues: [],
        suggestions: []
    };

    // Calculate overall score
    analysis.score = calculateScore(analysis);

    // Generate issues and suggestions
    generateFeedback(analysis);

    return analysis;
}

/**
 * Extract JSDoc header
 */
function extractHeader(content) {
    var header = {
        raw: '',
        tags: {}
    };

    var match = content.match(/^\/\*\*\s*\n([\s\S]*?)\n\s*\*\//m);
    if (!match) return header;

    header.raw = match[0];
    var lines = match[1].split('\n');

    for (var i = 0; i < lines.length; i++) {
        var line = lines[i].replace(/^\s*\*\s?/, '');

        // Single-line tags
        var tagMatch = line.match(/^@(\w+)\s+(.*)$/);
        if (tagMatch) {
            var tagName = tagMatch[1];
            var tagValue = tagMatch[2];
            header.tags[tagName] = tagValue;
        }

        // Multi-line tags (features, example)
        if (line.match(/^@features/)) {
            var featureLines = [];
            for (var j = i + 1; j < lines.length; j++) {
                var featureLine = lines[j].replace(/^\s*\*\s?/, '');
                if (featureLine.match(/^@/)) break;
                if (featureLine.match(/^-\s+(.+)/)) {
                    featureLines.push(RegExp.$1);
                }
            }
            header.tags.features = featureLines;
        }
    }

    return header;
}

/**
 * Analyze description quality
 */
function analyzeDescription(description) {
    if (!description) {
        return {
            exists: false,
            length: 0,
            score: 0,
            isGeneric: false
        };
    }

    var length = description.length;
    var wordCount = description.split(/\s+/).length;

    // Check for generic terms
    var isGeneric = false;
    var genericFound = [];
    for (var i = 0; i < CFG.genericTerms.length; i++) {
        if (description.toLowerCase().indexOf(CFG.genericTerms[i]) > -1) {
            isGeneric = true;
            genericFound.push(CFG.genericTerms[i]);
        }
    }

    // Score description
    var score = 0;
    if (length >= CFG.thresholds.descriptionMinLength) score += 25;
    if (length >= CFG.thresholds.descriptionGoodLength) score += 25;
    if (wordCount >= 5) score += 25;
    if (!isGeneric) score += 25;

    return {
        exists: true,
        text: description,
        length: length,
        wordCount: wordCount,
        score: score,
        isGeneric: isGeneric,
        genericTerms: genericFound
    };
}

/**
 * Analyze features list
 */
function analyzeFeatures(features, content) {
    if (!features || !features.length) {
        return {
            exists: false,
            count: 0,
            score: 0
        };
    }

    var count = features.length;

    // Check if features are specific (not too short)
    var specificCount = 0;
    for (var i = 0; i < features.length; i++) {
        if (features[i].length > 20) {  // Specific features are descriptive
            specificCount++;
        }
    }

    // Score features
    var score = 0;
    if (count >= CFG.thresholds.featuresMin) score += 30;
    if (count >= CFG.thresholds.featuresGood) score += 20;
    if (specificCount >= count * 0.6) score += 30;  // At least 60% specific
    if (specificCount === count) score += 20;  // All specific

    return {
        exists: true,
        count: count,
        specificCount: specificCount,
        score: score,
        items: features
    };
}

/**
 * Analyze example presence
 */
function analyzeExample(example, lineCount) {
    var hasExample = !!example;
    var isComplex = lineCount > CFG.thresholds.complexScriptLines;

    var score = 0;
    if (hasExample) score += 50;
    if (hasExample && isComplex) score += 50;

    return {
        exists: hasExample,
        isComplex: isComplex,
        shouldHaveExample: isComplex,
        score: isComplex ? score : 100  // Simple scripts don't need examples
    };
}

/**
 * Analyze header completeness
 */
function analyzeCompleteness(tags) {
    var required = ['version', 'description', 'category', 'author', 'license'];
    var missing = [];

    for (var i = 0; i < required.length; i++) {
        if (!tags[required[i]]) {
            missing.push(required[i]);
        }
    }

    var score = ((required.length - missing.length) / required.length) * 100;

    return {
        missing: missing,
        score: score
    };
}

/**
 * Calculate overall quality score
 */
function calculateScore(analysis) {
    // Weighted average
    var descScore = analysis.description.score * 0.30;      // 30%
    var featScore = analysis.features.score * 0.30;         // 30%
    var exampleScore = analysis.example.score * 0.20;       // 20%
    var completeScore = analysis.completeness.score * 0.20; // 20%

    return Math.round(descScore + featScore + exampleScore + completeScore);
}

/**
 * Generate issues and suggestions
 */
function generateFeedback(analysis) {
    // Description issues
    if (!analysis.description.exists) {
        analysis.issues.push('Missing @description');
        analysis.suggestions.push('Add a detailed description (50+ characters)');
    } else if (analysis.description.length < CFG.thresholds.descriptionMinLength) {
        analysis.issues.push('Description too short (' + analysis.description.length + ' chars)');
        analysis.suggestions.push('Expand description to at least ' + CFG.thresholds.descriptionMinLength + ' characters');
    } else if (analysis.description.isGeneric) {
        analysis.issues.push('Generic description: uses "' + analysis.description.genericTerms.join('", "') + '"');
        analysis.suggestions.push('Make description more specific: explain *what* and *how*, not just *that it does X*');
    }

    // Features issues
    if (!analysis.features.exists) {
        analysis.issues.push('Missing @features');
        analysis.suggestions.push('Add @features list with 3+ specific items');
    } else if (analysis.features.count < CFG.thresholds.featuresMin) {
        analysis.issues.push('Too few features (' + analysis.features.count + ')');
        analysis.suggestions.push('Add more features (aim for ' + CFG.thresholds.featuresMin + '+)');
    } else if (analysis.features.specificCount < analysis.features.count * 0.6) {
        analysis.issues.push('Features not specific enough');
        analysis.suggestions.push('Make features more descriptive (20+ characters each)');
    }

    // Example issues
    if (analysis.example.shouldHaveExample && !analysis.example.exists) {
        analysis.issues.push('Complex script (' + analysis.lineCount + ' lines) lacks @example');
        analysis.suggestions.push('Add usage example for complex scripts');
    }

    // Completeness issues
    if (analysis.completeness.missing.length > 0) {
        analysis.issues.push('Missing tags: @' + analysis.completeness.missing.join(', @'));
        analysis.suggestions.push('Add missing required tags');
    }
}

/**
 * Calculate statistics
 */
function calculateStatistics(results) {
    var scores = [];
    var issueCount = 0;

    for (var i = 0; i < results.length; i++) {
        scores.push(results[i].score);
        issueCount += results[i].issues.length;
    }

    scores.sort(function(a, b) { return b - a; });

    return {
        totalScripts: results.length,
        averageScore: Math.round(scores.reduce(function(a, b) { return a + b; }, 0) / scores.length),
        medianScore: scores[Math.floor(scores.length / 2)],
        highScore: scores[0],
        lowScore: scores[scores.length - 1],
        totalIssues: issueCount,
        excellentCount: countByScore(results, 90, 100),
        goodCount: countByScore(results, 70, 89),
        fairCount: countByScore(results, 50, 69),
        poorCount: countByScore(results, 0, 49)
    };
}

/**
 * Count scripts by score range
 */
function countByScore(results, min, max) {
    var count = 0;
    for (var i = 0; i < results.length; i++) {
        if (results[i].score >= min && results[i].score <= max) {
            count++;
        }
    }
    return count;
}

/**
 * Generate HTML report
 */
function generateReport(results, stats) {
    var html = [];

    html.push('<!DOCTYPE html>');
    html.push('<html><head><meta charset="UTF-8">');
    html.push('<title>Script Metadata Quality Report</title>');
    html.push('<style>');
    html.push('body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }');
    html.push('.container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; }');
    html.push('h1 { color: #2962FF; }');
    html.push('.summary { background: #f0f0f0; padding: 20px; margin: 20px 0; border-radius: 8px; }');
    html.push('.stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin: 20px 0; }');
    html.push('.stat-box { background: white; padding: 15px; border: 1px solid #ddd; border-radius: 4px; text-align: center; }');
    html.push('.stat-value { font-size: 32px; font-weight: bold; color: #2962FF; }');
    html.push('.stat-label { font-size: 12px; color: #666; margin-top: 5px; }');
    html.push('.script { background: #fafafa; border: 1px solid #ddd; padding: 15px; margin: 10px 0; border-radius: 4px; }');
    html.push('.score { font-size: 24px; font-weight: bold; float: right; padding: 5px 15px; border-radius: 4px; }');
    html.push('.score-excellent { background: #00C853; color: white; }');
    html.push('.score-good { background: #FFC107; color: white; }');
    html.push('.score-fair { background: #FF9800; color: white; }');
    html.push('.score-poor { background: #F44336; color: white; }');
    html.push('.issues { background: #FFF3CD; border-left: 4px solid #FFC107; padding: 10px; margin: 10px 0; }');
    html.push('.suggestions { background: #E3F2FD; border-left: 4px solid #2962FF; padding: 10px; margin: 10px 0; }');
    html.push('</style></head><body>');

    html.push('<div class="container">');
    html.push('<h1>Script Metadata Quality Report</h1>');
    html.push('<p><strong>Generated:</strong> ' + new Date().toString() + '</p>');

    // Summary stats
    html.push('<div class="summary">');
    html.push('<h2>Quality Summary</h2>');
    html.push('<div class="stats">');
    html.push('<div class="stat-box"><div class="stat-value">' + stats.totalScripts + '</div><div class="stat-label">Scripts Analyzed</div></div>');
    html.push('<div class="stat-box"><div class="stat-value">' + stats.averageScore + '</div><div class="stat-label">Average Score</div></div>');
    html.push('<div class="stat-box"><div class="stat-value">' + stats.highScore + '</div><div class="stat-label">Highest Score</div></div>');
    html.push('<div class="stat-box"><div class="stat-value">' + stats.totalIssues + '</div><div class="stat-label">Total Issues</div></div>');
    html.push('</div>');

    html.push('<p><strong>Score Distribution:</strong></p>');
    html.push('<ul>');
    html.push('<li>Excellent (90-100): ' + stats.excellentCount + ' scripts</li>');
    html.push('<li>Good (70-89): ' + stats.goodCount + ' scripts</li>');
    html.push('<li>Fair (50-69): ' + stats.fairCount + ' scripts</li>');
    html.push('<li>Poor (0-49): ' + stats.poorCount + ' scripts</li>');
    html.push('</ul>');
    html.push('</div>');

    // Sort results by score (worst first)
    results.sort(function(a, b) { return a.score - b.score; });

    // Individual scripts
    html.push('<h2>Script Details</h2>');

    for (var i = 0; i < results.length; i++) {
        var result = results[i];
        var scoreClass = getScoreClass(result.score);

        html.push('<div class="script">');
        html.push('<span class="score ' + scoreClass + '">' + result.score + '</span>');
        html.push('<h3>' + result.folder + '/' + result.script + '</h3>');
        html.push('<p><strong>Lines:</strong> ' + result.lineCount + '</p>');

        if (result.issues.length > 0) {
            html.push('<div class="issues">');
            html.push('<strong>Issues:</strong>');
            html.push('<ul>');
            for (var j = 0; j < result.issues.length; j++) {
                html.push('<li>' + result.issues[j] + '</li>');
            }
            html.push('</ul>');
            html.push('</div>');
        }

        if (result.suggestions.length > 0) {
            html.push('<div class="suggestions">');
            html.push('<strong>Suggestions:</strong>');
            html.push('<ul>');
            for (var j = 0; j < result.suggestions.length; j++) {
                html.push('<li>' + result.suggestions[j] + '</li>');
            }
            html.push('</ul>');
            html.push('</div>');
        }

        html.push('</div>');
    }

    html.push('</div></body></html>');

    // Save report
    var reportFile = new File(Folder.temp + '/script_metadata_quality_' + new Date().getTime() + '.html');
    reportFile.encoding = 'UTF-8';
    reportFile.open('w');
    reportFile.write(html.join('\n'));
    reportFile.close();

    return reportFile.fsName;
}

/**
 * Get CSS class for score
 */
function getScoreClass(score) {
    if (score >= 90) return 'score-excellent';
    if (score >= 70) return 'score-good';
    if (score >= 50) return 'score-fair';
    return 'score-poor';
}

/**
 * Get project root folder
 */
function getProjectRoot() {
    var scriptFile = new File($.fileName);
    var utilitiesFolder = scriptFile.parent;
    var projectRoot = utilitiesFolder.parent;
    return projectRoot.fsName;
}

// ============================================================================
// USER INTERFACE
// ============================================================================

/**
 * Show summary dialog
 */
function showSummary(stats, reportPath) {
    var dialog = new Window('dialog', 'Metadata Quality Analysis Complete');
    dialog.alignChildren = ['fill', 'top'];
    dialog.spacing = 10;
    dialog.margins = 15;

    dialog.add('statictext', undefined, 'Scripts analyzed: ' + stats.totalScripts);
    dialog.add('statictext', undefined, 'Average quality score: ' + stats.averageScore + '/100');
    dialog.add('statictext', undefined, 'Total issues found: ' + stats.totalIssues);
    dialog.add('statictext', undefined, '');

    dialog.add('statictext', undefined, 'Score distribution:');
    dialog.add('statictext', undefined, '  Excellent (90-100): ' + stats.excellentCount);
    dialog.add('statictext', undefined, '  Good (70-89): ' + stats.goodCount);
    dialog.add('statictext', undefined, '  Fair (50-69): ' + stats.fairCount);
    dialog.add('statictext', undefined, '  Poor (0-49): ' + stats.poorCount);
    dialog.add('statictext', undefined, '');

    dialog.add('statictext', undefined, 'Report saved to:');
    var pathText = dialog.add('edittext', undefined, reportPath, {readonly: true});
    pathText.preferredSize.width = 450;

    var openBtn = dialog.add('button', undefined, 'Open Report');
    openBtn.onClick = function() {
        var reportFile = new File(reportPath);
        reportFile.execute();
        dialog.close();
    };

    var okBtn = dialog.add('button', undefined, 'OK', {name: 'ok'});

    dialog.show();
}
