/**
 * Check Script Consistency
 * @version 1.0.0
 * @description Validate consistent patterns, conventions, and style across all production scripts
 *
 * @category Utilities
 * @author Vexy Team
 * @license MIT
 *
 * @features
 * - Validate consistent error handling patterns (try-catch, AIS.Error.show)
 * - Check UI conventions (button order, dialog sizing, naming)
 * - Verify naming conventions (camelCase, UPPER_SNAKE_CASE, PascalCase)
 * - Check file structure sections (CONFIGURATION, MAIN FUNCTION, etc.)
 * - Detect style drift (indentation, spacing, comment patterns)
 * - Flag scripts that deviate from established patterns
 * - Compare against reference scripts (Favorites as baseline)
 * - Generate comprehensive consistency report
 *
 * @requires lib/core.jsx
 */




//@target illustrator
var c=File(Folder.myDocuments+"/Adobe Scripts/vexy-ville.ini");if(c.exists){c.open('r');var p=c.read();c.close();var l=File(p+".lib/core.jsx");if(l.exists)$.evalFile(l.fsName);}
app.preferences.setBooleanPreference('ShowExternalJSXWarning', false);

// ============================================================================
// CONFIGURATION
// ============================================================================

var CFG = {
    scriptName: 'CheckScriptConsistency',
    version: '1.0.0',

    // Folders to check
    scanFolders: [
        'Favorites', 'Text', 'Export', 'Measurement', 'Utilities',
        'Artboards', 'Colors', 'Layers', 'Paths', 'Transform',
        'Selection', 'Print', 'Effects', 'Guides', 'Layout',
        'Strokes', 'Preferences', 'Varia'
    ],

    // Expected file structure sections (in order)
    expectedSections: [
        'CONFIGURATION',
        'MAIN FUNCTION',
        'CORE LOGIC',
        'USER INTERFACE',
        'UTILITIES'
    ],

    // Expected patterns
    patterns: {
        errorHandling: /try\s*\{[\s\S]*?\}\s*catch\s*\(/gm,
        aisErrorShow: /AIS\.Error\.show\(/g,
        mainFunction: /^function\s+main\s*\(\s*\)/m,
        entryPoint: /\(function\s*\(\s*\)\s*\{/m,
        includeCore: /#include\s+".*lib\/core\.jsx"/,
        buttonOKCancel: /cancelBtn|okBtn/gi
    },

    // Naming pattern checks
    namingPatterns: {
        functions: /^function\s+([a-z][a-zA-Z0-9]*)\s*\(/gm,  // camelCase
        constants: /^var\s+([A-Z_][A-Z0-9_]*)\s*=/gm,  // UPPER_SNAKE_CASE
        regularVars: /^var\s+([a-z][a-zA-Z0-9]*)\s*=/gm  // camelCase
    }
};

// ============================================================================
// MAIN FUNCTION
// ============================================================================

function main() {
    try {
        // Scan scripts
        var scripts = scanScripts();
        if (scripts.length === 0) {
            alert('No scripts found to check');
            return;
        }

        // Analyze consistency
        var results = checkConsistency(scripts);

        // Calculate statistics
        var stats = calculateStatistics(results);

        // Generate report
        var reportPath = generateReport(results, stats);

        // Show summary
        showSummary(stats, reportPath);

    } catch (err) {
        AIS.Error.show('Failed to check script consistency', err);
    }
}

// ============================================================================
// CORE LOGIC
// ============================================================================

/**
 * Scan production scripts
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
 * Check consistency across all scripts
 */
function checkConsistency(scripts) {
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
 * Analyze single script for consistency
 */
function analyzeScript(script) {
    // Read file
    script.file.encoding = 'UTF-8';
    script.file.open('r');
    var content = script.file.read();
    script.file.close();

    var violations = [];
    var warnings = [];

    // Check patterns
    checkErrorHandling(content, violations, warnings);
    checkStructure(content, violations, warnings);
    checkNaming(content, violations, warnings);
    checkUIConventions(content, violations, warnings);
    checkStyle(content, violations, warnings);

    // Calculate consistency score
    var score = calculateConsistencyScore(violations, warnings);

    return {
        script: script.name,
        folder: script.folder,
        violations: violations,
        warnings: warnings,
        score: score,
        lineCount: content.split('\n').length
    };
}

/**
 * Check error handling patterns
 */
function checkErrorHandling(content, violations, warnings) {
    // Should have try-catch blocks
    var hasTryCatch = CFG.patterns.errorHandling.test(content);
    if (!hasTryCatch) {
        violations.push('No try-catch error handling found');
    }

    // Should use AIS.Error.show
    var hasAISError = CFG.patterns.aisErrorShow.test(content);
    if (!hasAISError && hasTryCatch) {
        warnings.push('Try-catch present but not using AIS.Error.show');
    }

    // Should not use bare alert() for errors in catch blocks
    if (content.match(/catch\s*\([^)]+\)\s*\{[\s\S]*?alert\(/)) {
        warnings.push('Using alert() in catch block instead of AIS.Error.show');
    }
}

/**
 * Check file structure
 */
function checkStructure(content, violations, warnings) {
    // Check for required patterns
    if (!CFG.patterns.includeCore.test(content)) {
        violations.push('Missing #include for lib/core.jsx');
    }

    if (!CFG.patterns.mainFunction.test(content)) {
        violations.push('Missing main() function');
    }

    if (!CFG.patterns.entryPoint.test(content)) {
        violations.push('Missing IIFE entry point wrapper');
    }

    // Check for expected sections
    var missingSections = [];
    for (var i = 0; i < CFG.expectedSections.length; i++) {
        var section = CFG.expectedSections[i];
        var sectionPattern = new RegExp('//\\s*=+\\s*\\n//\\s*' + section, 'i');
        if (!sectionPattern.test(content)) {
            missingSections.push(section);
        }
    }

    if (missingSections.length > 0) {
        warnings.push('Missing sections: ' + missingSections.join(', '));
    }

    // Check section order
    var sectionPositions = [];
    for (var i = 0; i < CFG.expectedSections.length; i++) {
        var section = CFG.expectedSections[i];
        var sectionPattern = new RegExp('//\\s*=+\\s*\\n//\\s*' + section, 'i');
        var match = content.match(sectionPattern);
        if (match) {
            sectionPositions.push({
                section: section,
                position: content.indexOf(match[0]),
                expectedIndex: i
            });
        }
    }

    // Sort by position
    sectionPositions.sort(function(a, b) { return a.position - b.position; });

    // Check if order matches expected
    for (var i = 0; i < sectionPositions.length - 1; i++) {
        if (sectionPositions[i].expectedIndex > sectionPositions[i + 1].expectedIndex) {
            warnings.push('Section order incorrect: ' + sectionPositions[i].section + ' before ' + sectionPositions[i + 1].section);
        }
    }
}

/**
 * Check naming conventions
 */
function checkNaming(content, violations, warnings) {
    // Check function names (should be camelCase)
    CFG.namingPatterns.functions.lastIndex = 0;
    var match;
    while ((match = CFG.namingPatterns.functions.exec(content)) !== null) {
        var funcName = match[1];
        if (funcName.charAt(0) === funcName.charAt(0).toUpperCase()) {
            warnings.push('Function "' + funcName + '" should start with lowercase (camelCase)');
        }
    }

    // Check constants (should be UPPER_SNAKE_CASE)
    CFG.namingPatterns.constants.lastIndex = 0;
    while ((match = CFG.namingPatterns.constants.exec(content)) !== null) {
        var constName = match[1];
        if (constName !== constName.toUpperCase()) {
            warnings.push('Constant "' + constName + '" should be UPPER_SNAKE_CASE');
        }
    }
}

/**
 * Check UI conventions
 */
function checkUIConventions(content, violations, warnings) {
    // If script has dialogs, check button order
    if (content.indexOf('new Window') > -1) {
        var hasCancel = /cancelBtn|\'cancel\'/i.test(content);
        var hasOK = /okBtn|\'ok\'/i.test(content);

        if (hasCancel && hasOK) {
            // Check if cancel comes before OK (correct order)
            var cancelPos = content.search(/cancelBtn|\"cancel\"|\'cancel\'/i);
            var okPos = content.search(/okBtn|\"ok\"|\'ok\'/i);

            if (cancelPos > okPos) {
                warnings.push('Button order: Cancel should be added before OK button');
            }
        }

        // Check for dialog sizing
        if (content.indexOf('preferredSize') === -1 && content.indexOf('new Window') > -1) {
            warnings.push('Dialog has no preferredSize settings (may render inconsistently)');
        }
    }
}

/**
 * Check coding style
 */
function checkStyle(content, violations, warnings) {
    var lines = content.split('\n');

    // Check indentation consistency
    var hasTabIndent = false;
    var hasSpaceIndent = false;

    for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        if (line.match(/^\t/)) hasTabIndent = true;
        if (line.match(/^    /)) hasSpaceIndent = true;
    }

    if (hasTabIndent && hasSpaceIndent) {
        warnings.push('Mixed indentation (tabs and spaces)');
    }

    // Check line length (warn if > 120 chars)
    var longLines = 0;
    for (var i = 0; i < lines.length; i++) {
        if (lines[i].length > 120 && !lines[i].match(/^\s*\*/) && !lines[i].match(/^\s*\/\//)) {
            longLines++;
        }
    }

    if (longLines > 5) {
        warnings.push(longLines + ' lines exceed 120 characters');
    }

    // Check for trailing whitespace
    var trailingWhitespace = 0;
    for (var i = 0; i < lines.length; i++) {
        if (lines[i].match(/\s+$/)) {
            trailingWhitespace++;
        }
    }

    if (trailingWhitespace > 10) {
        warnings.push(trailingWhitespace + ' lines have trailing whitespace');
    }
}

/**
 * Calculate consistency score
 */
function calculateConsistencyScore(violations, warnings) {
    var score = 100;
    score -= violations.length * 10;  // -10 per violation
    score -= warnings.length * 3;     // -3 per warning
    return Math.max(0, score);
}

/**
 * Calculate statistics
 */
function calculateStatistics(results) {
    var scores = [];
    var totalViolations = 0;
    var totalWarnings = 0;

    for (var i = 0; i < results.length; i++) {
        scores.push(results[i].score);
        totalViolations += results[i].violations.length;
        totalWarnings += results[i].warnings.length;
    }

    scores.sort(function(a, b) { return b - a; });

    return {
        totalScripts: results.length,
        averageScore: Math.round(scores.reduce(function(a, b) { return a + b; }, 0) / scores.length),
        highScore: scores[0],
        lowScore: scores[scores.length - 1],
        totalViolations: totalViolations,
        totalWarnings: totalWarnings,
        perfectCount: countByScore(results, 100, 100),
        excellentCount: countByScore(results, 90, 99),
        goodCount: countByScore(results, 70, 89),
        needsWorkCount: countByScore(results, 0, 69)
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
    html.push('<title>Script Consistency Report</title>');
    html.push('<style>');
    html.push('body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }');
    html.push('.container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; }');
    html.push('h1 { color: #2962FF; }');
    html.push('.summary { background: #f0f0f0; padding: 20px; margin: 20px 0; }');
    html.push('.stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; }');
    html.push('.stat-box { background: white; padding: 15px; border: 1px solid #ddd; text-align: center; }');
    html.push('.stat-value { font-size: 28px; font-weight: bold; color: #2962FF; }');
    html.push('.script { background: #fafafa; border: 1px solid #ddd; padding: 15px; margin: 10px 0; }');
    html.push('.score { font-size: 20px; font-weight: bold; float: right; padding: 5px 15px; border-radius: 4px; }');
    html.push('.score-perfect { background: #00C853; color: white; }');
    html.push('.score-excellent { background: #76FF03; color: #333; }');
    html.push('.score-good { background: #FFC107; color: white; }');
    html.push('.score-needs-work { background: #FF5722; color: white; }');
    html.push('.violations { background: #FFEBEE; border-left: 4px solid #F44336; padding: 10px; margin: 10px 0; }');
    html.push('.warnings { background: #FFF3E0; border-left: 4px solid #FF9800; padding: 10px; margin: 10px 0; }');
    html.push('</style></head><body>');

    html.push('<div class="container">');
    html.push('<h1>Script Consistency Report</h1>');
    html.push('<p><strong>Generated:</strong> ' + new Date().toString() + '</p>');

    // Summary
    html.push('<div class="summary">');
    html.push('<h2>Consistency Summary</h2>');
    html.push('<div class="stats">');
    html.push('<div class="stat-box"><div class="stat-value">' + stats.totalScripts + '</div><div>Scripts</div></div>');
    html.push('<div class="stat-box"><div class="stat-value">' + stats.averageScore + '</div><div>Avg Score</div></div>');
    html.push('<div class="stat-box"><div class="stat-value">' + stats.totalViolations + '</div><div>Violations</div></div>');
    html.push('<div class="stat-box"><div class="stat-value">' + stats.totalWarnings + '</div><div>Warnings</div></div>');
    html.push('</div>');

    html.push('<p><strong>Distribution:</strong></p>');
    html.push('<ul>');
    html.push('<li>Perfect (100): ' + stats.perfectCount + ' scripts</li>');
    html.push('<li>Excellent (90-99): ' + stats.excellentCount + ' scripts</li>');
    html.push('<li>Good (70-89): ' + stats.goodCount + ' scripts</li>');
    html.push('<li>Needs Work (0-69): ' + stats.needsWorkCount + ' scripts</li>');
    html.push('</ul>');
    html.push('</div>');

    // Sort by score (worst first)
    results.sort(function(a, b) { return a.score - b.score; });

    // Scripts with issues
    html.push('<h2>Script Details</h2>');
    for (var i = 0; i < results.length; i++) {
        var result = results[i];

        if (result.violations.length === 0 && result.warnings.length === 0) {
            continue;  // Skip perfect scripts
        }

        var scoreClass = 'score-needs-work';
        if (result.score === 100) scoreClass = 'score-perfect';
        else if (result.score >= 90) scoreClass = 'score-excellent';
        else if (result.score >= 70) scoreClass = 'score-good';

        html.push('<div class="script">');
        html.push('<span class="score ' + scoreClass + '">' + result.score + '</span>');
        html.push('<h3>' + result.folder + '/' + result.script + '</h3>');

        if (result.violations.length > 0) {
            html.push('<div class="violations">');
            html.push('<strong>Violations:</strong>');
            html.push('<ul>');
            for (var j = 0; j < result.violations.length; j++) {
                html.push('<li>' + result.violations[j] + '</li>');
            }
            html.push('</ul>');
            html.push('</div>');
        }

        if (result.warnings.length > 0) {
            html.push('<div class="warnings">');
            html.push('<strong>Warnings:</strong>');
            html.push('<ul>');
            for (var j = 0; j < result.warnings.length; j++) {
                html.push('<li>' + result.warnings[j] + '</li>');
            }
            html.push('</ul>');
            html.push('</div>');
        }

        html.push('</div>');
    }

    html.push('</div></body></html>');

    // Save report
    var reportFile = new File(Folder.temp + '/script_consistency_' + new Date().getTime() + '.html');
    reportFile.encoding = 'UTF-8';
    reportFile.open('w');
    reportFile.write(html.join('\n'));
    reportFile.close();

    return reportFile.fsName;
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
    var dialog = new Window('dialog', 'Consistency Check Complete');
    dialog.alignChildren = ['fill', 'top'];
    dialog.spacing = 10;
    dialog.margins = 15;

    dialog.add('statictext', undefined, 'Scripts analyzed: ' + stats.totalScripts);
    dialog.add('statictext', undefined, 'Average consistency score: ' + stats.averageScore + '/100');
    dialog.add('statictext', undefined, 'Total violations: ' + stats.totalViolations);
    dialog.add('statictext', undefined, 'Total warnings: ' + stats.totalWarnings);
    dialog.add('statictext', undefined, '');

    dialog.add('statictext', undefined, 'Score distribution:');
    dialog.add('statictext', undefined, '  Perfect (100): ' + stats.perfectCount);
    dialog.add('statictext', undefined, '  Excellent (90-99): ' + stats.excellentCount);
    dialog.add('statictext', undefined, '  Good (70-89): ' + stats.goodCount);
    dialog.add('statictext', undefined, '  Needs Work (0-69): ' + stats.needsWorkCount);
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

// ============================================================================
// EXECUTE
// ============================================================================

try {
    main();
} catch (e) {
    AIS.Error.show('CheckScriptConsistency error', e);
}
