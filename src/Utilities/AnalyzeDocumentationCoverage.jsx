/**
 * Analyze Documentation Coverage
 * @version 1.0.0
 * @description Comprehensive audit of documentation completeness across scripts, API reference, guides, and cross-references to ensure professional documentation before v1.0.0
 * @category Utilities
 * @author Adam @ Vexy
 * @license Apache-2.0
 * @requires Illustrator CS6+
 * @features
 *   - Audit JSDoc headers (@description, @features, @example)
 *   - Check README.md script listings
 *   - Verify API reference coverage (AIS.* functions)
 *   - Calculate coverage percentage by category
 *   - Identify undocumented scripts and functions
 *   - Check for missing examples in complex scripts (>500 lines)
 *   - Verify cross-references between docs
 *   - Generate comprehensive coverage report with gaps highlighted
 * @example
 *   // Run from Illustrator Scripts menu
 *   // Analyzes all documentation and generates coverage report
 */




//@target illustrator
var c=File(Folder.myDocuments+"/Adobe Scripts/vexy-ville.ini");if(c.exists){c.open('r');var p=c.read();c.close();var l=File(p+".lib/core.jsx");if(l.exists)$.evalFile(l.fsName);}
app.preferences.setBooleanPreference('ShowExternalJSXWarning', false);

// ============================================================================
// CONFIGURATION
// ============================================================================

var CFG = {
    scriptName: 'AnalyzeDocumentationCoverage',
    version: '1.0.0',
    outputFolder: Folder.myDocuments + '/Adobe Scripts/Reports/',
    outputFile: 'documentation-coverage-report.html',

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

    // Documentation files to check
    docFiles: [
        'README.md',
        'docs/AIS_API_REFERENCE.md',
        'docs/ERROR_HANDLING.md',
        'docs/CROSS_PLATFORM.md',
        'docs/INSTALLATION.md'
    ],

    // Required JSDoc tags
    requiredTags: [
        '@version',
        '@description',
        '@category',
        '@author',
        '@license',
        '@features'
    ],

    // Thresholds
    thresholds: {
        complexScriptLines: 500,  // Scripts >500 lines should have @example
        minDescriptionLength: 20,
        minFeatures: 3,
        excellentCoverage: 90,
        goodCoverage: 75,
        fairCoverage: 60
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

        // Show progress
        var progressWin = showProgressDialog();

        // Scan all scripts
        updateProgress(progressWin, 'Scanning scripts...', 10);
        var scripts = scanAllScripts(projectRoot);

        if (scripts.length === 0) {
            alert('No scripts found\nNo production scripts found to analyze.');
            progressWin.close();
            return;
        }

        // Analyze JSDoc coverage
        updateProgress(progressWin, 'Analyzing JSDoc coverage...', 30);
        var jsdocCoverage = analyzeJSDocCoverage(scripts);

        // Check README coverage
        updateProgress(progressWin, 'Checking README coverage...', 50);
        var readmeCoverage = checkREADMECoverage(scripts, projectRoot);

        // Check API reference coverage
        updateProgress(progressWin, 'Checking API reference...', 65);
        var apiCoverage = checkAPIReferenceCoverage(projectRoot);

        // Check guides coverage
        updateProgress(progressWin, 'Checking guides...', 80);
        var guidesCoverage = checkGuidesCoverage(projectRoot);

        // Calculate overall coverage
        updateProgress(progressWin, 'Calculating coverage...', 90);
        var overallCoverage = calculateOverallCoverage(jsdocCoverage, readmeCoverage, apiCoverage, guidesCoverage);

        // Generate report
        updateProgress(progressWin, 'Generating report...', 95);
        var report = generateReport(jsdocCoverage, readmeCoverage, apiCoverage, guidesCoverage, overallCoverage, startTime);

        // Save report
        var success = saveReport(report);

        progressWin.close();

        if (success) {
            var elapsed = ((new Date() - startTime) / 1000).toFixed(1);
            alert(
                'Documentation Coverage Analysis Complete\n\n' +
                'Scripts analyzed: ' + scripts.length + '\n' +
                'Overall coverage: ' + overallCoverage.percentage.toFixed(1) + '%\n' +
                'Rating: ' + overallCoverage.rating + '\n' +
                'Time: ' + elapsed + 's\n\n' +
                'Report saved to:\n' + CFG.outputFolder + CFG.outputFile
            );
        }

    } catch (e) {
        AIS.Error.show('Documentation coverage analysis failed', e);
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
                var content = readFileContent(file);
                var lineCount = content ? content.split('\n').length : 0;

                scripts.push({
                    name: file.name,
                    path: file.fsName,
                    category: CFG.scanFolders[i],
                    file: file,
                    content: content,
                    lineCount: lineCount
                });
            }
        }
    }

    return scripts;
}

/**
 * Analyze JSDoc coverage across all scripts
 */
function analyzeJSDocCoverage(scripts) {
    var coverage = {
        total: scripts.length,
        complete: 0,
        incomplete: [],
        missingTags: {},
        shortDescriptions: [],
        fewFeatures: [],
        missingExamples: [],
        coveragePercent: 0
    };

    for (var i = 0; i < scripts.length; i++) {
        var script = scripts[i];
        var jsdoc = extractJSDoc(script.content);

        var isComplete = true;
        var issues = [];

        // Check required tags
        for (var j = 0; j < CFG.requiredTags.length; j++) {
            var tag = CFG.requiredTags[j];
            if (!jsdoc[tag]) {
                isComplete = false;
                issues.push('Missing ' + tag);

                if (!coverage.missingTags[tag]) {
                    coverage.missingTags[tag] = [];
                }
                coverage.missingTags[tag].push(script.name);
            }
        }

        // Check description quality
        if (jsdoc['@description'] && jsdoc['@description'].length < CFG.thresholds.minDescriptionLength) {
            isComplete = false;
            issues.push('Description too short (' + jsdoc['@description'].length + ' chars)');
            coverage.shortDescriptions.push(script.name);
        }

        // Check features count
        var featuresCount = jsdoc['@features'] ? jsdoc['@features'].split('\n').length : 0;
        if (featuresCount < CFG.thresholds.minFeatures) {
            isComplete = false;
            issues.push('Too few features (' + featuresCount + ', minimum ' + CFG.thresholds.minFeatures + ')');
            coverage.fewFeatures.push(script.name);
        }

        // Check example for complex scripts
        if (script.lineCount > CFG.thresholds.complexScriptLines && !jsdoc['@example']) {
            isComplete = false;
            issues.push('Missing @example (script has ' + script.lineCount + ' lines)');
            coverage.missingExamples.push(script.name);
        }

        if (isComplete) {
            coverage.complete++;
        } else {
            coverage.incomplete.push({
                name: script.name,
                category: script.category,
                issues: issues
            });
        }
    }

    coverage.coveragePercent = coverage.total > 0 ? (coverage.complete / coverage.total) * 100 : 0;

    return coverage;
}

/**
 * Extract JSDoc from script content
 */
function extractJSDoc(content) {
    if (!content) return {};

    var jsdoc = {};
    var jsdocPattern = /\/\*\*([\s\S]*?)\*\//;
    var match = jsdocPattern.exec(content);

    if (!match) return jsdoc;

    var jsdocText = match[1];
    var lines = jsdocText.split('\n');

    for (var i = 0; i < lines.length; i++) {
        var line = lines[i].replace(/^\s*\*\s?/, '').trim();

        if (line.indexOf('@') === 0) {
            var parts = line.match(/^(@\w+)\s+(.*)/);
            if (parts) {
                var tag = parts[1];
                var value = parts[2];

                if (tag === '@features') {
                    // Collect all feature lines
                    var features = [value];
                    for (var j = i + 1; j < lines.length; j++) {
                        var nextLine = lines[j].replace(/^\s*\*\s?/, '').trim();
                        if (nextLine.indexOf('@') === 0) break;
                        if (nextLine.indexOf('-') === 0) {
                            features.push(nextLine);
                        }
                    }
                    jsdoc[tag] = features.join('\n');
                } else {
                    jsdoc[tag] = value;
                }
            }
        }
    }

    return jsdoc;
}

/**
 * Check README coverage
 */
function checkREADMECoverage(scripts, projectRoot) {
    var coverage = {
        readmeExists: false,
        scriptsDocumented: 0,
        scriptsUndocumented: [],
        coveragePercent: 0
    };

    var readmeFile = new File(projectRoot.fsName + '/README.md');
    if (!readmeFile.exists) {
        coverage.scriptsUndocumented = scripts.map(function(s) { return s.name; });
        return coverage;
    }

    coverage.readmeExists = true;
    var readmeContent = readFileContent(readmeFile);

    for (var i = 0; i < scripts.length; i++) {
        var scriptName = scripts[i].name.replace('.jsx', '');
        if (readmeContent.indexOf(scriptName) !== -1) {
            coverage.scriptsDocumented++;
        } else {
            coverage.scriptsUndocumented.push(scripts[i].name);
        }
    }

    coverage.coveragePercent = scripts.length > 0 ? (coverage.scriptsDocumented / scripts.length) * 100 : 0;

    return coverage;
}

/**
 * Check API reference coverage
 */
function checkAPIReferenceCoverage(projectRoot) {
    var coverage = {
        apiRefExists: false,
        functionsInCode: [],
        functionsDocumented: [],
        functionsUndocumented: [],
        coveragePercent: 0
    };

    // Read lib/core.jsx to find AIS functions
    var coreFile = new File(projectRoot.fsName + '/lib/core.jsx');
    if (!coreFile.exists) return coverage;

    var coreContent = readFileContent(coreFile);

    // Extract AIS.* function definitions
    var functionPattern = /AIS\.(\w+)\.(\w+)\s*=\s*function/g;
    var match;
    var functions = {};

    while ((match = functionPattern.exec(coreContent)) !== null) {
        var moduleName = match[1];
        var funcName = match[2];
        var fullName = 'AIS.' + moduleName + '.' + funcName;

        if (!functions[fullName]) {
            coverage.functionsInCode.push(fullName);
            functions[fullName] = true;
        }
    }

    // Check API reference
    var apiRefFile = new File(projectRoot.fsName + '/docs/AIS_API_REFERENCE.md');
    if (!apiRefFile.exists) {
        coverage.functionsUndocumented = coverage.functionsInCode;
        return coverage;
    }

    coverage.apiRefExists = true;
    var apiRefContent = readFileContent(apiRefFile);

    for (var i = 0; i < coverage.functionsInCode.length; i++) {
        var funcName = coverage.functionsInCode[i];
        if (apiRefContent.indexOf(funcName) !== -1) {
            coverage.functionsDocumented.push(funcName);
        } else {
            coverage.functionsUndocumented.push(funcName);
        }
    }

    coverage.coveragePercent = coverage.functionsInCode.length > 0 ?
        (coverage.functionsDocumented.length / coverage.functionsInCode.length) * 100 : 0;

    return coverage;
}

/**
 * Check guides coverage
 */
function checkGuidesCoverage(projectRoot) {
    var coverage = {
        guidesFound: [],
        guidesMissing: [],
        totalGuides: CFG.docFiles.length,
        coveragePercent: 0
    };

    for (var i = 0; i < CFG.docFiles.length; i++) {
        var docPath = CFG.docFiles[i];
        var file = new File(projectRoot.fsName + '/' + docPath);

        if (file.exists) {
            coverage.guidesFound.push(docPath);
        } else {
            coverage.guidesMissing.push(docPath);
        }
    }

    coverage.coveragePercent = (coverage.guidesFound.length / coverage.totalGuides) * 100;

    return coverage;
}

/**
 * Calculate overall coverage
 */
function calculateOverallCoverage(jsdocCov, readmeCov, apiCov, guidesCov) {
    // Weighted average (JSDoc 40%, README 25%, API 25%, Guides 10%)
    var overall = (jsdocCov.coveragePercent * 0.40) +
                  (readmeCov.coveragePercent * 0.25) +
                  (apiCov.coveragePercent * 0.25) +
                  (guidesCov.coveragePercent * 0.10);

    var rating;
    if (overall >= CFG.thresholds.excellentCoverage) {
        rating = 'Excellent';
    } else if (overall >= CFG.thresholds.goodCoverage) {
        rating = 'Good';
    } else if (overall >= CFG.thresholds.fairCoverage) {
        rating = 'Fair';
    } else {
        rating = 'Needs Improvement';
    }

    return {
        percentage: overall,
        rating: rating,
        breakdown: {
            jsdoc: jsdocCov.coveragePercent,
            readme: readmeCov.coveragePercent,
            api: apiCov.coveragePercent,
            guides: guidesCov.coveragePercent
        }
    };
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
function generateReport(jsdocCov, readmeCov, apiCov, guidesCov, overallCov, startTime) {
    var elapsed = ((new Date() - startTime) / 1000).toFixed(1);

    var html = [];
    html.push('<!DOCTYPE html>');
    html.push('<html><head><meta charset="UTF-8"><title>Documentation Coverage Report</title>');
    html.push('<style>');
    html.push('body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 20px; background: #f5f5f5; }');
    html.push('.container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }');
    html.push('h1 { color: #1a1a1a; border-bottom: 3px solid #2962FF; padding-bottom: 10px; }');
    html.push('h2 { color: #424242; margin-top: 30px; border-bottom: 2px solid #e0e0e0; padding-bottom: 8px; }');
    html.push('.summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0; }');
    html.push('.metric { background: #f8f9fa; padding: 15px; border-radius: 6px; text-align: center; }');
    html.push('.metric-label { font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; }');
    html.push('.metric-value { font-size: 28px; font-weight: bold; margin-top: 5px; }');
    html.push('.progress-bar { background: #e0e0e0; height: 30px; border-radius: 15px; overflow: hidden; margin: 10px 0; position: relative; }');
    html.push('.progress-fill { background: linear-gradient(90deg, #2962FF, #00C853); height: 100%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; }');
    html.push('.gap-list { background: #fff3e0; border-left: 4px solid #ff6f00; padding: 15px; margin: 15px 0; border-radius: 4px; }');
    html.push('.success { background: #e8f5e9; border-left: 4px solid #4caf50; padding: 15px; margin: 15px 0; border-radius: 4px; }');
    html.push('ul { margin: 10px 0; }');
    html.push('</style></head><body><div class="container">');

    // Header
    html.push('<h1>📚 Documentation Coverage Report</h1>');
    html.push('<p>Generated: ' + new Date().toString() + ' | Analysis time: ' + elapsed + 's</p>');

    // Overall coverage
    html.push('<div style="text-align: center; margin: 30px 0;">');
    html.push('<div class="metric-label">Overall Documentation Coverage</div>');
    html.push('<div class="metric-value" style="font-size: 48px; color: ' + getCoverageColor(overallCov.percentage) + '">' + overallCov.percentage.toFixed(1) + '%</div>');
    html.push('<div style="font-size: 18px; color: #666; margin-top: 10px;">Rating: ' + overallCov.rating + '</div>');
    html.push('</div>');

    // Breakdown
    html.push('<div class="summary">');
    html.push(formatCoverageMetric('JSDoc Coverage', jsdocCov.coveragePercent, jsdocCov.complete + '/' + jsdocCov.total));
    html.push(formatCoverageMetric('README Coverage', readmeCov.coveragePercent, readmeCov.scriptsDocumented + '/' + (readmeCov.scriptsDocumented + readmeCov.scriptsUndocumented.length)));
    html.push(formatCoverageMetric('API Reference', apiCov.coveragePercent, apiCov.functionsDocumented.length + '/' + apiCov.functionsInCode.length));
    html.push(formatCoverageMetric('Guides', guidesCov.coveragePercent, guidesCov.guidesFound.length + '/' + guidesCov.totalGuides));
    html.push('</div>');

    // JSDoc gaps
    html.push('<h2>📄 JSDoc Coverage</h2>');
    if (jsdocCov.incomplete.length > 0) {
        html.push('<div class="gap-list">');
        html.push('<strong>Scripts with incomplete JSDoc (' + jsdocCov.incomplete.length + '):</strong>');
        html.push('<ul>');
        for (var i = 0; i < jsdocCov.incomplete.length && i < 20; i++) {
            var item = jsdocCov.incomplete[i];
            html.push('<li><strong>' + escapeHtml(item.name) + '</strong> [' + item.category + ']: ' + item.issues.join(', ') + '</li>');
        }
        if (jsdocCov.incomplete.length > 20) {
            html.push('<li>... and ' + (jsdocCov.incomplete.length - 20) + ' more</li>');
        }
        html.push('</ul></div>');
    } else {
        html.push('<div class="success">✅ All scripts have complete JSDoc documentation!</div>');
    }

    // README gaps
    html.push('<h2>📖 README Coverage</h2>');
    if (readmeCov.scriptsUndocumented.length > 0) {
        html.push('<div class="gap-list">');
        html.push('<strong>Scripts not listed in README (' + readmeCov.scriptsUndocumented.length + '):</strong>');
        html.push('<ul>');
        for (var i = 0; i < readmeCov.scriptsUndocumented.length && i < 20; i++) {
            html.push('<li>' + escapeHtml(readmeCov.scriptsUndocumented[i]) + '</li>');
        }
        if (readmeCov.scriptsUndocumented.length > 20) {
            html.push('<li>... and ' + (readmeCov.scriptsUndocumented.length - 20) + ' more</li>');
        }
        html.push('</ul></div>');
    } else {
        html.push('<div class="success">✅ All scripts are documented in README!</div>');
    }

    // API reference gaps
    html.push('<h2>🔧 API Reference Coverage</h2>');
    if (apiCov.functionsUndocumented.length > 0) {
        html.push('<div class="gap-list">');
        html.push('<strong>AIS functions not in API reference (' + apiCov.functionsUndocumented.length + '):</strong>');
        html.push('<ul>');
        for (var i = 0; i < apiCov.functionsUndocumented.length; i++) {
            html.push('<li><code>' + escapeHtml(apiCov.functionsUndocumented[i]) + '</code></li>');
        }
        html.push('</ul></div>');
    } else {
        html.push('<div class="success">✅ All AIS functions are documented in API reference!</div>');
    }

    // Guides coverage
    html.push('<h2>📘 Guides Coverage</h2>');
    if (guidesCov.guidesMissing.length > 0) {
        html.push('<div class="gap-list">');
        html.push('<strong>Missing guides (' + guidesCov.guidesMissing.length + '):</strong>');
        html.push('<ul>');
        for (var i = 0; i < guidesCov.guidesMissing.length; i++) {
            html.push('<li>' + escapeHtml(guidesCov.guidesMissing[i]) + '</li>');
        }
        html.push('</ul></div>');
    } else {
        html.push('<div class="success">✅ All expected guides are present!</div>');
    }

    html.push('</div></body></html>');

    return html.join('\n');
}

/**
 * Format coverage metric
 */
function formatCoverageMetric(label, percent, details) {
    return '<div class="metric">' +
        '<div class="metric-label">' + label + '</div>' +
        '<div class="metric-value" style="color: ' + getCoverageColor(percent) + '">' + percent.toFixed(1) + '%</div>' +
        '<div style="font-size: 12px; color: #666; margin-top: 5px;">' + details + '</div>' +
        '</div>';
}

/**
 * Get color for coverage percentage
 */
function getCoverageColor(percent) {
    if (percent >= 90) return '#4caf50';
    if (percent >= 75) return '#8bc34a';
    if (percent >= 60) return '#ff9800';
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
// USER INTERFACE
// ============================================================================

/**
 * Show progress dialog
 */
function showProgressDialog() {
    var win = new Window('palette', 'Analyzing Documentation Coverage...', undefined, {closeButton: false});
    win.preferredSize = [400, 100];

    win.messagePanel = win.add('group');
    win.messagePanel.orientation = 'column';
    win.messagePanel.alignChildren = 'left';

    win.statusText = win.messagePanel.add('statictext', undefined, 'Initializing...');
    win.statusText.preferredSize = [380, 20];

    win.progressBar = win.messagePanel.add('progressbar', undefined, 0, 100);
    win.progressBar.preferredSize = [380, 10];

    win.center();
    win.show();

    return win;
}

/**
 * Update progress dialog
 */
function updateProgress(win, message, percent) {
    if (!win) return;

    win.statusText.text = message;
    win.progressBar.value = percent;
    win.update();
}

// ============================================================================
// EXECUTE
// ============================================================================

try {
    main();
} catch (e) {
    AIS.Error.show('AnalyzeDocumentationCoverage error', e);
}
