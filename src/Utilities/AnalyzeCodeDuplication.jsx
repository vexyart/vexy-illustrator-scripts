/**
 * Analyze Code Duplication
 * @version 1.0.0
 * @description Scans all production scripts for code duplication and suggests opportunities for library extraction to reduce technical debt
 * @category Utilities
 * @author Adam @ Vexy
 * @license Apache-2.0
 * @requires Illustrator CS6+
 * @features
 *   - Scan all production scripts for repeated code blocks (>10 lines identical)
 *   - Detect similar function signatures and patterns
 *   - Calculate duplication percentage per script and globally
 *   - Suggest candidates for library extraction
 *   - Compare against existing AIS library functions
 *   - Generate HTML report with code snippets and recommendations
 *   - Priority ranking by duplication frequency
 * @example
 *   // Run from Illustrator Scripts menu
 *   // Analyzes all scripts and generates HTML report
 */




//@target illustrator
var c=File(Folder.myDocuments+"/Adobe Scripts/vexy-ville.ini");if(c.exists){c.open('r');var p=c.read();c.close();var l=File(p+".lib/core.jsx");if(l.exists)$.evalFile(l.fsName);}
app.preferences.setBooleanPreference('ShowExternalJSXWarning', false);

// ============================================================================
// CONFIGURATION
// ============================================================================

var CFG = {
    scriptName: 'AnalyzeCodeDuplication',
    version: '1.0.0',
    minBlockSize: 10,  // Minimum lines for duplication detection
    minSimilarityScore: 0.85,  // 85% similarity threshold
    outputFolder: Folder.myDocuments + '/Adobe Scripts/Reports/',
    outputFile: 'code-duplication-report.html',

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

    // Patterns to ignore (comments, whitespace, common boilerplate)
    ignorePatterns: [
        /^\s*\/\//,           // Single-line comments
        /^\s*\/\*/,           // Multi-line comment start
        /^\s*\*\//,           // Multi-line comment end
        /^\s*\*/,             // Multi-line comment middle
        /^\s*$/,              // Empty lines
        /^#include/,          // Include statements
        /^\/\/@target/,       // Target directive
        /^app\.preferences/   // Preferences statements
    ]
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

        // Show progress dialog
        var progressWin = showProgressDialog();

        // Scan all scripts
        updateProgress(progressWin, 'Scanning scripts...', 10);
        var scripts = scanAllScripts(projectRoot);

        if (scripts.length === 0) {
            alert('No scripts found\nNo production scripts found to analyze.');
            progressWin.close();
            return;
        }

        // Extract code blocks from each script
        updateProgress(progressWin, 'Extracting code blocks...', 30);
        var codeBlocks = extractCodeBlocks(scripts);

        // Find duplications
        updateProgress(progressWin, 'Detecting duplications...', 50);
        var duplications = findDuplications(codeBlocks);

        // Analyze patterns
        updateProgress(progressWin, 'Analyzing patterns...', 70);
        var patterns = analyzePatterns(scripts);

        // Check against AIS library
        updateProgress(progressWin, 'Checking library coverage...', 85);
        var libraryCoverage = checkLibraryCoverage(duplications, projectRoot);

        // Generate report
        updateProgress(progressWin, 'Generating report...', 95);
        var report = generateReport(scripts, duplications, patterns, libraryCoverage, startTime);

        // Save report
        var success = saveReport(report);

        progressWin.close();

        if (success) {
            var elapsed = ((new Date() - startTime) / 1000).toFixed(1);
            alert(
                'Code Duplication Analysis Complete\n\n' +
                'Scripts analyzed: ' + scripts.length + '\n' +
                'Duplications found: ' + duplications.length + '\n' +
                'Time: ' + elapsed + 's\n\n' +
                'Report saved to:\n' + CFG.outputFolder + CFG.outputFile
            );
        }

    } catch (e) {
        AIS.Error.show('Code duplication analysis failed', e);
    }
}

// ============================================================================
// CORE LOGIC
// ============================================================================

/**
 * Find project root folder (looks for lib/ subfolder)
 */
function findProjectRoot() {
    var scriptFile = new File($.fileName);
    var currentFolder = scriptFile.parent;

    // Go up one level from Utilities/
    if (currentFolder.name === 'Utilities') {
        return currentFolder.parent;
    }

    return null;
}

/**
 * Scan all production scripts in project
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
 * Extract code blocks from all scripts
 */
function extractCodeBlocks(scripts) {
    var allBlocks = [];

    for (var i = 0; i < scripts.length; i++) {
        var script = scripts[i];
        var content = readFileContent(script.file);

        if (!content) continue;

        var lines = content.split('\n');
        var cleanedLines = cleanLines(lines);

        // Extract blocks of minimum size
        for (var start = 0; start < cleanedLines.length - CFG.minBlockSize; start++) {
            for (var size = CFG.minBlockSize; size <= 50 && (start + size) <= cleanedLines.length; size++) {
                var block = cleanedLines.slice(start, start + size);
                var blockText = block.join('\n');

                // Skip empty or trivial blocks
                if (blockText.length < 100) continue;

                allBlocks.push({
                    script: script.name,
                    category: script.category,
                    startLine: start + 1,
                    endLine: start + size,
                    lines: block,
                    text: blockText,
                    hash: simpleHash(blockText)
                });
            }
        }
    }

    return allBlocks;
}

/**
 * Clean code lines (remove comments, whitespace, etc.)
 */
function cleanLines(lines) {
    var cleaned = [];

    for (var i = 0; i < lines.length; i++) {
        var line = lines[i];

        // Skip ignored patterns
        var skip = false;
        for (var j = 0; j < CFG.ignorePatterns.length; j++) {
            if (CFG.ignorePatterns[j].test(line)) {
                skip = true;
                break;
            }
        }

        if (!skip && line.length > 0) {
            // Normalize whitespace
            cleaned.push(line.replace(/^\s+/, '').replace(/\s+$/, ''));
        }
    }

    return cleaned;
}

/**
 * Find duplications among code blocks
 */
function findDuplications(codeBlocks) {
    var duplications = [];
    var seenHashes = {};

    // Group by hash
    for (var i = 0; i < codeBlocks.length; i++) {
        var block = codeBlocks[i];
        var hash = block.hash;

        if (!seenHashes[hash]) {
            seenHashes[hash] = [];
        }
        seenHashes[hash].push(block);
    }

    // Find duplicates (hash appears >1 time)
    for (var hash in seenHashes) {
        if (seenHashes[hash].length > 1) {
            var instances = seenHashes[hash];

            // Only count as duplication if in different scripts
            var scriptNames = {};
            for (var i = 0; i < instances.length; i++) {
                scriptNames[instances[i].script] = true;
            }

            if (AIS.Object.keys(scriptNames).length > 1) {
                duplications.push({
                    hash: hash,
                    instances: instances,
                    scriptCount: AIS.Object.keys(scriptNames).length,
                    totalInstances: instances.length,
                    lineCount: instances[0].lines.length,
                    codeSnippet: instances[0].text.substring(0, 200)
                });
            }
        }
    }

    // Sort by total instances (most duplicated first)
    duplications.sort(function(a, b) {
        return b.totalInstances - a.totalInstances;
    });

    return duplications;
}

/**
 * Analyze common patterns (function signatures, loops, etc.)
 */
function analyzePatterns(scripts) {
    var patterns = {
        functions: {},
        loops: {},
        conditionals: {},
        errorHandling: {}
    };

    for (var i = 0; i < scripts.length; i++) {
        var content = readFileContent(scripts[i].file);
        if (!content) continue;

        // Function patterns
        var funcMatches = content.match(/function\s+\w+\s*\([^)]*\)/g);
        if (funcMatches) {
            for (var j = 0; j < funcMatches.length; j++) {
                var func = funcMatches[j];
                if (!patterns.functions[func]) {
                    patterns.functions[func] = [];
                }
                patterns.functions[func].push(scripts[i].name);
            }
        }

        // Loop patterns
        var forLoops = content.match(/for\s*\([^)]+\)\s*\{/g);
        if (forLoops) {
            patterns.loops.forCount = (patterns.loops.forCount || 0) + forLoops.length;
        }

        var whileLoops = content.match(/while\s*\([^)]+\)\s*\{/g);
        if (whileLoops) {
            patterns.loops.whileCount = (patterns.loops.whileCount || 0) + whileLoops.length;
        }

        // Error handling patterns
        var tryCatch = content.match(/try\s*\{/g);
        if (tryCatch) {
            patterns.errorHandling.tryCount = (patterns.errorHandling.tryCount || 0) + tryCatch.length;
        }

        var aisError = content.match(/AIS\.Error\.show/g);
        if (aisError) {
            patterns.errorHandling.aisErrorCount = (patterns.errorHandling.aisErrorCount || 0) + aisError.length;
        }
    }

    return patterns;
}

/**
 * Check if duplications are already covered by AIS library
 */
function checkLibraryCoverage(duplications, projectRoot) {
    var libFile = new File(projectRoot.fsName + '/lib/core.jsx');
    if (!libFile.exists) return { covered: [], uncovered: duplications };

    var libContent = readFileContent(libFile);
    var covered = [];
    var uncovered = [];

    for (var i = 0; i < duplications.length; i++) {
        var dup = duplications[i];
        var snippet = dup.codeSnippet;

        // Check if similar code exists in library
        if (libContent.indexOf(snippet.substring(0, 50)) !== -1) {
            covered.push(dup);
        } else {
            uncovered.push(dup);
        }
    }

    return {
        covered: covered,
        uncovered: uncovered,
        coveragePercent: duplications.length > 0 ? Math.round((covered.length / duplications.length) * 100) : 0
    };
}

/**
 * Simple hash function for code blocks
 */
function simpleHash(str) {
    var hash = 0;
    for (var i = 0; i < str.length; i++) {
        var char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
}

/**
 * Read file content as string
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
function generateReport(scripts, duplications, patterns, libraryCoverage, startTime) {
    var elapsed = ((new Date() - startTime) / 1000).toFixed(1);
    var totalDupLines = 0;
    var totalCodeLines = 0;

    // Calculate total lines
    for (var i = 0; i < scripts.length; i++) {
        var content = readFileContent(scripts[i].file);
        if (content) {
            totalCodeLines += content.split('\n').length;
        }
    }

    for (var i = 0; i < duplications.length; i++) {
        totalDupLines += duplications[i].lineCount * (duplications[i].totalInstances - 1);
    }

    var dupPercent = totalCodeLines > 0 ? ((totalDupLines / totalCodeLines) * 100).toFixed(1) : 0;

    var html = [];
    html.push('<!DOCTYPE html>');
    html.push('<html><head><meta charset="UTF-8"><title>Code Duplication Analysis Report</title>');
    html.push('<style>');
    html.push('body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 20px; background: #f5f5f5; }');
    html.push('.container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }');
    html.push('h1 { color: #1a1a1a; border-bottom: 3px solid #2962FF; padding-bottom: 10px; }');
    html.push('h2 { color: #424242; margin-top: 30px; border-bottom: 2px solid #e0e0e0; padding-bottom: 8px; }');
    html.push('.summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0; }');
    html.push('.metric { background: #f8f9fa; padding: 15px; border-radius: 6px; border-left: 4px solid #2962FF; }');
    html.push('.metric-label { font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; }');
    html.push('.metric-value { font-size: 28px; font-weight: bold; color: #1a1a1a; margin-top: 5px; }');
    html.push('.duplication { background: #fff3e0; border-left: 4px solid #ff6f00; padding: 15px; margin: 15px 0; border-radius: 4px; }');
    html.push('.duplication-high { background: #ffebee; border-left-color: #d32f2f; }');
    html.push('.instance { background: white; padding: 10px; margin: 8px 0; border-radius: 4px; font-size: 13px; }');
    html.push('.code-snippet { background: #f5f5f5; padding: 12px; border-radius: 4px; font-family: "Monaco", "Courier New", monospace; font-size: 12px; overflow-x: auto; margin-top: 10px; }');
    html.push('.priority-high { color: #d32f2f; font-weight: bold; }');
    html.push('.priority-medium { color: #f57c00; font-weight: bold; }');
    html.push('.priority-low { color: #388e3c; }');
    html.push('</style></head><body><div class="container">');

    // Header
    html.push('<h1>📊 Code Duplication Analysis Report</h1>');
    html.push('<p>Generated: ' + new Date().toString() + ' | Analysis time: ' + elapsed + 's</p>');

    // Summary metrics
    html.push('<div class="summary">');
    html.push('<div class="metric"><div class="metric-label">Scripts Analyzed</div><div class="metric-value">' + scripts.length + '</div></div>');
    html.push('<div class="metric"><div class="metric-label">Duplications Found</div><div class="metric-value">' + duplications.length + '</div></div>');
    html.push('<div class="metric"><div class="metric-label">Duplication %</div><div class="metric-value">' + dupPercent + '%</div></div>');
    html.push('<div class="metric"><div class="metric-label">Library Coverage</div><div class="metric-value">' + libraryCoverage.coveragePercent + '%</div></div>');
    html.push('</div>');

    // Top duplications
    html.push('<h2>🔍 Top Code Duplications</h2>');
    html.push('<p>Code blocks repeated across multiple scripts (highest impact first):</p>');

    var topDups = duplications.slice(0, 20); // Top 20
    for (var i = 0; i < topDups.length; i++) {
        var dup = topDups[i];
        var priority = dup.totalInstances >= 5 ? 'high' : (dup.totalInstances >= 3 ? 'medium' : 'low');
        var dupClass = priority === 'high' ? 'duplication duplication-high' : 'duplication';

        html.push('<div class="' + dupClass + '">');
        html.push('<strong class="priority-' + priority + '">Priority: ' + priority.toUpperCase() + '</strong> ');
        html.push('| Instances: ' + dup.totalInstances + ' | Scripts: ' + dup.scriptCount + ' | Lines: ' + dup.lineCount);

        // List instances
        for (var j = 0; j < dup.instances.length && j < 5; j++) {
            var inst = dup.instances[j];
            html.push('<div class="instance">📄 ' + inst.script + ' (lines ' + inst.startLine + '-' + inst.endLine + ') [' + inst.category + ']</div>');
        }

        if (dup.instances.length > 5) {
            html.push('<div class="instance">... and ' + (dup.instances.length - 5) + ' more instances</div>');
        }

        // Code snippet
        html.push('<div class="code-snippet">' + escapeHtml(dup.codeSnippet) + '\n...</div>');
        html.push('</div>');
    }

    // Recommendations
    html.push('<h2>💡 Recommendations</h2>');
    html.push('<ul>');

    if (libraryCoverage.uncovered.length > 0) {
        html.push('<li><strong>High Priority:</strong> Extract ' + libraryCoverage.uncovered.length + ' duplicated code blocks to lib/core.jsx</li>');
    }

    if (dupPercent > 15) {
        html.push('<li><strong>Medium Priority:</strong> Duplication rate is ' + dupPercent + '% (target: <10%). Focus on refactoring high-frequency duplications.</li>');
    }

    if (duplications.length === 0) {
        html.push('<li><strong>Excellent:</strong> No significant code duplication detected! Codebase follows DRY principles well.</li>');
    }

    html.push('</ul>');

    html.push('</div></body></html>');

    return html.join('\n');
}

/**
 * Escape HTML special characters
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
 * Save report to file
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
    var win = new Window('palette', 'Analyzing Code Duplication...', undefined, {closeButton: false});
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
    AIS.Error.show('AnalyzeCodeDuplication error', e);
}
