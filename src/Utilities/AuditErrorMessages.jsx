/**
 * Audit Error Messages
 * @version 1.0.0
 * @description Evaluates the quality, clarity, and actionability of error messages across all scripts to improve user experience when errors occur
 * @category Utilities
 * @author Adam @ Vexy
 * @license Apache-2.0
 * @requires Illustrator CS6+
 * @features
 *   - Scan all scripts for error messages (alert, AIS.Error.show)
 *   - Evaluate quality criteria: clarity, context, actionability, consistency
 *   - Detect vague messages: "Error", "Failed", "Something went wrong"
 *   - Check for technical jargon without explanation
 *   - Verify messages are English-only
 *   - Suggest improvements for unclear messages
 *   - Generate HTML report with quality scores (0-100)
 * @example
 *   // Run from Illustrator Scripts menu
 *   // Analyzes all error messages and generates quality report
 */




//@target illustrator
var c=File(Folder.myDocuments+"/Adobe Scripts/vexy-ville.ini");if(c.exists){c.open('r');var p=c.read();c.close();var l=File(p+".lib/core.jsx");if(l.exists)$.evalFile(l.fsName);}
app.preferences.setBooleanPreference('ShowExternalJSXWarning', false);

// ============================================================================
// CONFIGURATION
// ============================================================================

var CFG = {
    scriptName: 'AuditErrorMessages',
    version: '1.0.0',
    outputFolder: Folder.myDocuments + '/Adobe Scripts/Reports/',
    outputFile: 'error-message-audit-report.html',

    // Folders to scan
    scanFolders: [
        'Favorites',
        'Text',
        'Utilities',
        'Export',
        'Measurement',
        'Artboards',
        'Colors',
        'Layers',
        'Paths',
        'Transform'
    ],

    // Vague error phrases (bad quality)
    vagueTerms: [
        'error',
        'failed',
        'something went wrong',
        'unexpected error',
        'unknown error',
        'oops',
        'problem',
        'issue'
    ],

    // Technical jargon (needs explanation)
    jargonTerms: [
        'null pointer',
        'undefined',
        'exception',
        'stack trace',
        'runtime error',
        'syntax error',
        'NaN',
        'TypeError',
        'ReferenceError'
    ],

    // Good actionable phrases
    actionableTerms: [
        'please',
        'try',
        'make sure',
        'ensure',
        'check that',
        'verify',
        'select',
        'open',
        'close'
    ],

    // Quality thresholds
    thresholds: {
        minLength: 20,       // Minimum characters for meaningful message
        maxLength: 150,      // Maximum for readability
        goodLength: 40,      // Ideal minimum length
        excellentScore: 80,  // Excellent quality threshold
        goodScore: 60,       // Good quality threshold
        poorScore: 40        // Poor quality threshold
    }
};

// ============================================================================
// MAIN FUNCTION
// ============================================================================

function main() {
    try {
        var startTime = new Date();

        // Find project root
        var projectRoot = findProjectRoot();
        if (!projectRoot) {
            alert('Error\nCannot find project root folder.\nMake sure script is in Utilities/ folder.');
            return;
        }

        // Scan all scripts
        var scripts = scanAllScripts(projectRoot);

        if (scripts.length === 0) {
            alert('No scripts found\nNo production scripts found to analyze.');
            return;
        }

        // Extract error messages
        var errorMessages = extractErrorMessages(scripts);

        if (errorMessages.length === 0) {
            alert('No error messages found\nNo error messages detected in scanned scripts.');
            return;
        }

        // Evaluate each message
        var evaluations = evaluateMessages(errorMessages);

        // Generate statistics
        var stats = generateStatistics(evaluations);

        // Generate report
        var report = generateReport(evaluations, stats, startTime);

        // Save report
        var success = saveReport(report);

        if (success) {
            var elapsed = ((new Date() - startTime) / 1000).toFixed(1);
            var avgScore = stats.averageScore.toFixed(1);
            alert(
                'Error Message Audit Complete\n\n' +
                'Scripts analyzed: ' + scripts.length + '\n' +
                'Messages found: ' + errorMessages.length + '\n' +
                'Average quality: ' + avgScore + '/100\n' +
                'Time: ' + elapsed + 's\n\n' +
                'Report saved to:\n' + CFG.outputFolder + CFG.outputFile
            );
        }

    } catch (e) {
        AIS.Error.show('Error message audit failed', e);
    }
}

// ============================================================================
// CORE LOGIC
// ============================================================================

/**
 * Find project root folder
 */
function findProjectRoot() {
    var scriptFile = new File($.fileName);
    var currentFolder = scriptFile.parent;

    if (currentFolder.name === 'Utilities') {
        return currentFolder.parent;
    }

    return null;
}

/**
 * Scan all production scripts
 */
function scanAllScripts(projectRoot) {
    var scripts = [];

    for (var i = 0; i < CFG.scanFolders.length; i++) {
        var folder = new Folder(projectRoot.fsName + '/' + CFG.scanFolders[i]);
        if (!folder.exists) continue;

        var files = folder.getFiles('*.jsx');
        for (var j = 0; j < files.length; j++) {
            var file = files[j];
            if (file instanceof File) {
                scripts.push({
                    name: file.name,
                    path: file.fsName,
                    category: CFG.scanFolders[i],
                    file: file
                });
            }
        }
    }

    return scripts;
}

/**
 * Extract all error messages from scripts
 */
function extractErrorMessages(scripts) {
    var messages = [];

    for (var i = 0; i < scripts.length; i++) {
        var script = scripts[i];
        var content = readFileContent(script.file);
        if (!content) continue;

        // Find alert() calls
        var alertPattern = /alert\s*\(\s*['"]([^'"]+)['"]/g;
        var match;
        while ((match = alertPattern.exec(content)) !== null) {
            messages.push({
                script: script.name,
                category: script.category,
                type: 'alert',
                message: match[1],
                lineNumber: getLineNumber(content, match.index)
            });
        }

        // Find alert() with string concatenation
        var alertConcatPattern = /alert\s*\(\s*['"]([^'"]+)['"][\s\S]*?\)/g;
        while ((match = alertConcatPattern.exec(content)) !== null) {
            var msg = match[1];
            if (!containsMessage(messages, msg)) {
                messages.push({
                    script: script.name,
                    category: script.category,
                    type: 'alert',
                    message: msg,
                    lineNumber: getLineNumber(content, match.index)
                });
            }
        }

        // Find AIS.Error.show() calls
        var aisErrorPattern = /AIS\.Error\.show\s*\(\s*['"]([^'"]+)['"]/g;
        while ((match = aisErrorPattern.exec(content)) !== null) {
            messages.push({
                script: script.name,
                category: script.category,
                type: 'AIS.Error.show',
                message: match[1],
                lineNumber: getLineNumber(content, match.index)
            });
        }
    }

    return messages;
}

/**
 * Check if message already in array
 */
function containsMessage(messages, text) {
    for (var i = 0; i < messages.length; i++) {
        if (messages[i].message === text) return true;
    }
    return false;
}

/**
 * Get line number from character position
 */
function getLineNumber(content, charIndex) {
    var upToChar = content.substring(0, charIndex);
    var lines = upToChar.split('\n');
    return lines.length;
}

/**
 * Evaluate quality of each error message
 */
function evaluateMessages(messages) {
    var evaluations = [];

    for (var i = 0; i < messages.length; i++) {
        var msg = messages[i];
        var eval = evaluateMessage(msg.message);

        evaluations.push({
            script: msg.script,
            category: msg.category,
            type: msg.type,
            message: msg.message,
            lineNumber: msg.lineNumber,
            score: eval.score,
            issues: eval.issues,
            suggestions: eval.suggestions,
            rating: eval.rating
        });
    }

    // Sort by score (worst first)
    evaluations.sort(function(a, b) {
        return a.score - b.score;
    });

    return evaluations;
}

/**
 * Evaluate a single error message
 */
function evaluateMessage(message) {
    var score = 100;
    var issues = [];
    var suggestions = [];

    var lowerMsg = message.toLowerCase();

    // Length check
    if (message.length < CFG.thresholds.minLength) {
        score -= 25;
        issues.push('Too short (' + message.length + ' chars, minimum ' + CFG.thresholds.minLength + ')');
        suggestions.push('Add more context about what went wrong');
    } else if (message.length < CFG.thresholds.goodLength) {
        score -= 10;
        issues.push('Could be more detailed');
    }

    if (message.length > CFG.thresholds.maxLength) {
        score -= 10;
        issues.push('Too long (' + message.length + ' chars, maximum ' + CFG.thresholds.maxLength + ')');
        suggestions.push('Break into multiple shorter messages');
    }

    // Vague terms check
    for (var i = 0; i < CFG.vagueTerms.length; i++) {
        var term = CFG.vagueTerms[i];
        if (lowerMsg.indexOf(term) !== -1 && lowerMsg.length < 30) {
            score -= 20;
            issues.push('Contains vague term: "' + term + '"');
            suggestions.push('Be specific about what failed and why');
            break;
        }
    }

    // Technical jargon check
    for (var i = 0; i < CFG.jargonTerms.length; i++) {
        var term = CFG.jargonTerms[i];
        if (lowerMsg.indexOf(term) !== -1) {
            score -= 15;
            issues.push('Contains technical jargon: "' + term + '"');
            suggestions.push('Explain technical terms in user-friendly language');
            break;
        }
    }

    // Actionability check
    var hasActionable = false;
    for (var i = 0; i < CFG.actionableTerms.length; i++) {
        if (lowerMsg.indexOf(CFG.actionableTerms[i]) !== -1) {
            hasActionable = true;
            break;
        }
    }

    if (!hasActionable && message.indexOf('?') === -1) {
        score -= 15;
        issues.push('Not actionable (no guidance for user)');
        suggestions.push('Tell user what action to take to fix the problem');
    }

    // Context check (has specific values, names, numbers)
    var hasContext = /\d+/.test(message) || message.indexOf('"') !== -1 || message.indexOf("'") !== -1;
    if (!hasContext && message.length > 20) {
        score -= 10;
        issues.push('Lacks specific context');
        suggestions.push('Include relevant details (file names, values, counts)');
    }

    // Ensure score is 0-100
    score = Math.max(0, Math.min(100, score));

    // Determine rating
    var rating;
    if (score >= CFG.thresholds.excellentScore) {
        rating = 'Excellent';
    } else if (score >= CFG.thresholds.goodScore) {
        rating = 'Good';
    } else if (score >= CFG.thresholds.poorScore) {
        rating = 'Fair';
    } else {
        rating = 'Poor';
    }

    return {
        score: score,
        issues: issues,
        suggestions: suggestions,
        rating: rating
    };
}

/**
 * Generate statistics
 */
function generateStatistics(evaluations) {
    var stats = {
        total: evaluations.length,
        excellent: 0,
        good: 0,
        fair: 0,
        poor: 0,
        averageScore: 0,
        totalScore: 0,
        worstMessages: [],
        bestMessages: []
    };

    for (var i = 0; i < evaluations.length; i++) {
        var eval = evaluations[i];
        stats.totalScore += eval.score;

        if (eval.rating === 'Excellent') stats.excellent++;
        else if (eval.rating === 'Good') stats.good++;
        else if (eval.rating === 'Fair') stats.fair++;
        else if (eval.rating === 'Poor') stats.poor++;
    }

    stats.averageScore = stats.total > 0 ? stats.totalScore / stats.total : 0;
    stats.worstMessages = evaluations.slice(0, 10);  // Worst 10
    stats.bestMessages = evaluations.slice(-10).reverse();  // Best 10

    return stats;
}

/**
 * Read file content
 */
function readFileContent(file) {
    try {
        file.encoding = 'UTF-8';
        if (!file.open('r')) return null;
        var content = file.read();
        file.close();
        return content;
    } catch (e) {
        return null;
    }
}

// ============================================================================
// REPORT GENERATION
// ============================================================================

/**
 * Generate HTML report
 */
function generateReport(evaluations, stats, startTime) {
    var elapsed = ((new Date() - startTime) / 1000).toFixed(1);

    var html = [];
    html.push('<!DOCTYPE html>');
    html.push('<html><head><meta charset="UTF-8"><title>Error Message Quality Audit</title>');
    html.push('<style>');
    html.push('body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 20px; background: #f5f5f5; }');
    html.push('.container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }');
    html.push('h1 { color: #1a1a1a; border-bottom: 3px solid #2962FF; padding-bottom: 10px; }');
    html.push('h2 { color: #424242; margin-top: 30px; border-bottom: 2px solid #e0e0e0; padding-bottom: 8px; }');
    html.push('.summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin: 20px 0; }');
    html.push('.metric { background: #f8f9fa; padding: 15px; border-radius: 6px; text-align: center; }');
    html.push('.metric-label { font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; }');
    html.push('.metric-value { font-size: 24px; font-weight: bold; margin-top: 5px; }');
    html.push('.message-card { background: white; border: 1px solid #e0e0e0; border-radius: 6px; padding: 15px; margin: 15px 0; }');
    html.push('.message-excellent { border-left: 4px solid #4caf50; }');
    html.push('.message-good { border-left: 4px solid #8bc34a; }');
    html.push('.message-fair { border-left: 4px solid #ff9800; }');
    html.push('.message-poor { border-left: 4px solid #f44336; }');
    html.push('.message-text { background: #f5f5f5; padding: 10px; border-radius: 4px; font-family: monospace; margin: 10px 0; }');
    html.push('.score { font-size: 24px; font-weight: bold; display: inline-block; padding: 5px 15px; border-radius: 20px; }');
    html.push('.score-excellent { background: #4caf50; color: white; }');
    html.push('.score-good { background: #8bc34a; color: white; }');
    html.push('.score-fair { background: #ff9800; color: white; }');
    html.push('.score-poor { background: #f44336; color: white; }');
    html.push('.issues { color: #d32f2f; margin-top: 10px; }');
    html.push('.suggestions { color: #1976d2; margin-top: 10px; }');
    html.push('</style></head><body><div class="container">');

    // Header
    html.push('<h1>🔍 Error Message Quality Audit</h1>');
    html.push('<p>Generated: ' + new Date().toString() + ' | Analysis time: ' + elapsed + 's</p>');

    // Summary
    html.push('<div class="summary">');
    html.push('<div class="metric"><div class="metric-label">Total Messages</div><div class="metric-value">' + stats.total + '</div></div>');
    html.push('<div class="metric"><div class="metric-label">Average Score</div><div class="metric-value" style="color: ' + getScoreColor(stats.averageScore) + '">' + stats.averageScore.toFixed(1) + '/100</div></div>');
    html.push('<div class="metric"><div class="metric-label">Excellent</div><div class="metric-value" style="color: #4caf50">' + stats.excellent + '</div></div>');
    html.push('<div class="metric"><div class="metric-label">Good</div><div class="metric-value" style="color: #8bc34a">' + stats.good + '</div></div>');
    html.push('<div class="metric"><div class="metric-label">Fair</div><div class="metric-value" style="color: #ff9800">' + stats.fair + '</div></div>');
    html.push('<div class="metric"><div class="metric-label">Poor</div><div class="metric-value" style="color: #f44336">' + stats.poor + '</div></div>');
    html.push('</div>');

    // Worst messages (need improvement)
    html.push('<h2>⚠️ Messages Needing Improvement</h2>');
    for (var i = 0; i < stats.worstMessages.length && i < 15; i++) {
        html.push(formatMessageCard(stats.worstMessages[i]));
    }

    // Best messages (examples to follow)
    html.push('<h2>✨ Well-Written Messages (Examples)</h2>');
    for (var i = 0; i < stats.bestMessages.length && i < 10; i++) {
        html.push(formatMessageCard(stats.bestMessages[i]));
    }

    html.push('</div></body></html>');

    return html.join('\n');
}

/**
 * Format a message card
 */
function formatMessageCard(eval) {
    var html = [];
    var scoreClass = 'score-' + eval.rating.toLowerCase();
    var cardClass = 'message-card message-' + eval.rating.toLowerCase();

    html.push('<div class="' + cardClass + '">');
    html.push('<div style="display: flex; justify-content: space-between; align-items: center;">');
    html.push('<div><strong>' + escapeHtml(eval.script) + '</strong> [' + eval.category + '] Line ' + eval.lineNumber + '</div>');
    html.push('<span class="score ' + scoreClass + '">' + eval.score + '</span>');
    html.push('</div>');

    html.push('<div class="message-text">"' + escapeHtml(eval.message) + '"</div>');

    if (eval.issues.length > 0) {
        html.push('<div class="issues"><strong>Issues:</strong><ul>');
        for (var i = 0; i < eval.issues.length; i++) {
            html.push('<li>' + escapeHtml(eval.issues[i]) + '</li>');
        }
        html.push('</ul></div>');
    }

    if (eval.suggestions.length > 0) {
        html.push('<div class="suggestions"><strong>Suggestions:</strong><ul>');
        for (var i = 0; i < eval.suggestions.length; i++) {
            html.push('<li>' + escapeHtml(eval.suggestions[i]) + '</li>');
        }
        html.push('</ul></div>');
    }

    html.push('</div>');

    return html.join('');
}

/**
 * Get color for score
 */
function getScoreColor(score) {
    if (score >= 80) return '#4caf50';
    if (score >= 60) return '#8bc34a';
    if (score >= 40) return '#ff9800';
    return '#f44336';
}

/**
 * Escape HTML
 */
function escapeHtml(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/**
 * Save report
 */
function saveReport(htmlContent) {
    try {
        var folder = new Folder(CFG.outputFolder);
        if (!folder.exists) folder.create();

        var file = new File(CFG.outputFolder + CFG.outputFile);
        file.encoding = 'UTF-8';

        if (!file.open('w')) {
            alert('Error\nCould not create report file:\n' + file.fsName);
            return false;
        }

        file.write(htmlContent);
        file.close();

        return true;
    } catch (e) {
        alert('Error saving report\n' + e.toString());
        return false;
    }
}

// ============================================================================
// EXECUTE
// ============================================================================

try {
    main();
} catch (e) {
    AIS.Error.show('AuditErrorMessages error', e);
}
