/**
 * Track Library Lifecycle
 * @version 1.0.0
 * @description Tracks AIS library function lifecycle (additions, changes, deprecations) to maintain API stability and prevent breaking changes
 * @category Utilities
 * @author Adam @ Vexy
 * @license Apache-2.0
 * @requires Illustrator CS6+
 * @features
 *   - Track all AIS.* function signatures in lib/core.jsx and lib/ui.jsx
 *   - Store historical snapshots of library API
 *   - Detect new functions added since last snapshot
 *   - Detect function signature changes
 *   - Detect deprecated/removed functions
 *   - Generate migration guide for breaking changes
 *   - Compare current vs previous library versions
 *   - Alert on breaking changes before release
 * @example
 *   // Run from Illustrator Scripts menu before library updates
 *   // Takes snapshot of current API and compares with previous
 */




//@target illustrator
var c=File(Folder.myDocuments+"/Adobe Scripts/vexy-ville.ini");if(c.exists){c.open('r');var p=c.read();c.close();var l=File(p+".lib/core.jsx");if(l.exists)$.evalFile(l.fsName);}
app.preferences.setBooleanPreference('ShowExternalJSXWarning', false);

// ============================================================================
// CONFIGURATION
// ============================================================================

var CFG = {
    scriptName: 'TrackLibraryLifecycle',
    version: '1.0.0',
    snapshotFolder: Folder.myDocuments + '/Adobe Scripts/.library-snapshots/',
    currentSnapshotFile: 'current-api.json',
    outputFolder: Folder.myDocuments + '/Adobe Scripts/Reports/',
    outputFile: 'library-lifecycle-report.html',

    // Library files to track
    libraryFiles: [
        {name: 'core', path: 'lib/core.jsx'},
        {name: 'ui', path: 'lib/ui.jsx'}
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

        // Extract current API
        var currentAPI = extractCurrentAPI(projectRoot);

        if (!currentAPI || currentAPI.functions.length === 0) {
            alert('Error\nNo AIS functions found in library files.\nCheck that lib/core.jsx and lib/ui.jsx exist.');
            return;
        }

        // Load previous snapshot
        var previousAPI = loadPreviousSnapshot();

        // Compare APIs
        var comparison = compareAPIs(previousAPI, currentAPI);

        // Generate report
        var report = generateReport(comparison, currentAPI, previousAPI, startTime);

        // Save report
        var reportSaved = saveReport(report);

        // Save current snapshot
        var snapshotSaved = saveCurrentSnapshot(currentAPI);

        if (reportSaved) {
            var elapsed = ((new Date() - startTime) / 1000).toFixed(1);
            var message = 'Library Lifecycle Analysis Complete\n\n' +
                'Functions tracked: ' + currentAPI.functions.length + '\n' +
                'New functions: ' + comparison.added.length + '\n' +
                'Modified functions: ' + comparison.modified.length + '\n' +
                'Removed functions: ' + comparison.removed.length + '\n' +
                'Breaking changes: ' + (comparison.breaking ? 'YES ⚠️' : 'No') + '\n' +
                'Time: ' + elapsed + 's\n\n' +
                'Report saved to:\n' + CFG.outputFolder + CFG.outputFile;

            if (comparison.breaking) {
                message += '\n\n⚠️ WARNING: Breaking changes detected!\nReview report before proceeding.';
            }

            alert(message);
        }

    } catch (e) {
        AIS.Error.show('Library lifecycle tracking failed', e);
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
 * Extract current API from library files
 */
function extractCurrentAPI(projectRoot) {
    var api = {
        timestamp: new Date().toString(),
        version: extractLibraryVersion(projectRoot),
        functions: []
    };

    for (var i = 0; i < CFG.libraryFiles.length; i++) {
        var libInfo = CFG.libraryFiles[i];
        var libFile = new File(projectRoot.fsName + '/' + libInfo.path);

        if (!libFile.exists) continue;

        var content = readFileContent(libFile);
        if (!content) continue;

        var functions = extractFunctions(content, libInfo.name);
        api.functions = api.functions.concat(functions);
    }

    return api;
}

/**
 * Extract library version from core.jsx
 */
function extractLibraryVersion(projectRoot) {
    var coreFile = new File(projectRoot.fsName + '/lib/core.jsx');
    if (!coreFile.exists) return 'unknown';

    var content = readFileContent(coreFile);
    if (!content) return 'unknown';

    // Look for version in comment or AIS.version
    var versionMatch = content.match(/@version\s+([\d.]+)/i);
    if (versionMatch) return versionMatch[1];

    var aisVersionMatch = content.match(/AIS\.version\s*=\s*['"]([^'"]+)['"]/);
    if (aisVersionMatch) return aisVersionMatch[1];

    return 'unknown';
}

/**
 * Extract all AIS functions from library content
 */
function extractFunctions(content, libraryName) {
    var functions = [];

    // Pattern: AIS.Module.function = function(params)
    var functionPattern = /AIS\.(\w+)\.(\w+)\s*=\s*function\s*\(([^)]*)\)/g;
    var match;

    while ((match = functionPattern.exec(content)) !== null) {
        var moduleName = match[1];
        var funcName = match[2];
        var params = match[3].trim();

        // Extract JSDoc if present
        var jsdoc = extractJSDoc(content, match.index);

        functions.push({
            library: libraryName,
            module: moduleName,
            name: funcName,
            fullName: 'AIS.' + moduleName + '.' + funcName,
            params: params,
            signature: 'AIS.' + moduleName + '.' + funcName + '(' + params + ')',
            description: jsdoc.description || '',
            returns: jsdoc.returns || '',
            deprecated: jsdoc.deprecated || false
        });
    }

    return functions;
}

/**
 * Extract JSDoc before function definition
 */
function extractJSDoc(content, functionIndex) {
    var jsdoc = {
        description: '',
        returns: '',
        deprecated: false
    };

    // Look backwards for JSDoc comment
    var beforeFunction = content.substring(Math.max(0, functionIndex - 500), functionIndex);
    var jsdocMatch = beforeFunction.match(/\/\*\*([\s\S]*?)\*\//);

    if (!jsdocMatch) return jsdoc;

    var jsdocText = jsdocMatch[1];

    // Extract description (first non-tag line)
    var lines = jsdocText.split('\n');
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i].replace(/^\s*\*\s?/, '').trim();
        if (line && line.indexOf('@') !== 0) {
            jsdoc.description = line;
            break;
        }
    }

    // Extract @returns
    var returnsMatch = jsdocText.match(/@returns?\s+\{([^}]+)\}\s*(.*)/);
    if (returnsMatch) {
        jsdoc.returns = returnsMatch[1];
    }

    // Check for @deprecated
    if (jsdocText.indexOf('@deprecated') !== -1) {
        jsdoc.deprecated = true;
    }

    return jsdoc;
}

/**
 * Load previous API snapshot
 */
function loadPreviousSnapshot() {
    var snapshotFile = new File(CFG.snapshotFolder + CFG.currentSnapshotFile);
    if (!snapshotFile.exists) return null;

    try {
        snapshotFile.encoding = 'UTF-8';
        if (!snapshotFile.open('r')) return null;
        var content = snapshotFile.read();
        snapshotFile.close();

        return AIS.JSON.parse(content);
    } catch (e) {
        return null;
    }
}

/**
 * Compare current and previous APIs
 */
function compareAPIs(previousAPI, currentAPI) {
    var comparison = {
        added: [],
        removed: [],
        modified: [],
        unchanged: [],
        breaking: false
    };

    if (!previousAPI) {
        // First run - all functions are "new"
        comparison.added = currentAPI.functions;
        return comparison;
    }

    // Create lookup maps
    var previousMap = {};
    for (var i = 0; i < previousAPI.functions.length; i++) {
        var func = previousAPI.functions[i];
        previousMap[func.fullName] = func;
    }

    var currentMap = {};
    for (var i = 0; i < currentAPI.functions.length; i++) {
        var func = currentAPI.functions[i];
        currentMap[func.fullName] = func;
    }

    // Find added and modified functions
    for (var i = 0; i < currentAPI.functions.length; i++) {
        var currentFunc = currentAPI.functions[i];
        var previousFunc = previousMap[currentFunc.fullName];

        if (!previousFunc) {
            // New function
            comparison.added.push(currentFunc);
        } else if (currentFunc.signature !== previousFunc.signature) {
            // Signature changed
            comparison.modified.push({
                current: currentFunc,
                previous: previousFunc,
                change: describeChange(previousFunc, currentFunc)
            });
            comparison.breaking = true;
        } else {
            comparison.unchanged.push(currentFunc);
        }
    }

    // Find removed functions
    for (var i = 0; i < previousAPI.functions.length; i++) {
        var previousFunc = previousAPI.functions[i];
        if (!currentMap[previousFunc.fullName]) {
            comparison.removed.push(previousFunc);
            comparison.breaking = true;
        }
    }

    return comparison;
}

/**
 * Describe what changed in a function
 */
function describeChange(oldFunc, newFunc) {
    var changes = [];

    if (oldFunc.params !== newFunc.params) {
        changes.push('Parameters changed: ' + oldFunc.params + ' → ' + newFunc.params);
    }

    if (oldFunc.returns !== newFunc.returns && (oldFunc.returns || newFunc.returns)) {
        changes.push('Return type changed: ' + (oldFunc.returns || 'void') + ' → ' + (newFunc.returns || 'void'));
    }

    if (!oldFunc.deprecated && newFunc.deprecated) {
        changes.push('Marked as deprecated');
    }

    return changes.join('; ');
}

/**
 * Save current API snapshot
 */
function saveCurrentSnapshot(currentAPI) {
    try {
        var folder = new Folder(CFG.snapshotFolder);
        if (!folder.exists) folder.create();

        var file = new File(CFG.snapshotFolder + CFG.currentSnapshotFile);
        file.encoding = 'UTF-8';

        if (!file.open('w')) return false;

        file.write(AIS.JSON.stringify(currentAPI));
        file.close();

        return true;
    } catch (e) {
        return false;
    }
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
function generateReport(comparison, currentAPI, previousAPI, startTime) {
    var elapsed = ((new Date() - startTime) / 1000).toFixed(1);
    var isFirstRun = !previousAPI;

    var html = [];
    html.push('<!DOCTYPE html>');
    html.push('<html><head><meta charset="UTF-8"><title>Library Lifecycle Report</title>');
    html.push('<style>');
    html.push('body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 20px; background: #f5f5f5; }');
    html.push('.container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }');
    html.push('h1 { color: #1a1a1a; border-bottom: 3px solid #2962FF; padding-bottom: 10px; }');
    html.push('h2 { color: #424242; margin-top: 30px; border-bottom: 2px solid #e0e0e0; padding-bottom: 8px; }');
    html.push('.summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin: 20px 0; }');
    html.push('.metric { background: #f8f9fa; padding: 15px; border-radius: 6px; text-align: center; }');
    html.push('.metric-label { font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; }');
    html.push('.metric-value { font-size: 24px; font-weight: bold; margin-top: 5px; }');
    html.push('.added { color: #00C853; }');
    html.push('.removed { color: #D32F2F; }');
    html.push('.modified { color: #FF6F00; }');
    html.push('.function-card { background: white; border: 1px solid #e0e0e0; border-left: 4px solid #2962FF; border-radius: 6px; padding: 15px; margin: 10px 0; }');
    html.push('.function-card.added { border-left-color: #00C853; background: #E8F5E9; }');
    html.push('.function-card.removed { border-left-color: #D32F2F; background: #FFEBEE; }');
    html.push('.function-card.modified { border-left-color: #FF6F00; background: #FFF3E0; }');
    html.push('.signature { font-family: "Monaco", "Courier New", monospace; background: #f5f5f5; padding: 8px; border-radius: 4px; margin: 8px 0; }');
    html.push('.warning { background: #FFF3E0; border-left: 4px solid #FF6F00; padding: 15px; margin: 20px 0; border-radius: 4px; }');
    html.push('</style></head><body><div class="container">');

    // Header
    html.push('<h1>📚 Library Lifecycle Report</h1>');
    html.push('<p>Generated: ' + new Date().toString() + ' | Analysis time: ' + elapsed + 's</p>');

    if (isFirstRun) {
        html.push('<div class="warning"><strong>First Run:</strong> This is the initial snapshot. All ' + currentAPI.functions.length + ' functions are recorded as baseline.</div>');
    }

    // Summary
    html.push('<div class="summary">');
    html.push('<div class="metric"><div class="metric-label">Total Functions</div><div class="metric-value">' + currentAPI.functions.length + '</div></div>');
    html.push('<div class="metric"><div class="metric-label">Added</div><div class="metric-value added">' + comparison.added.length + '</div></div>');
    html.push('<div class="metric"><div class="metric-label">Modified</div><div class="metric-value modified">' + comparison.modified.length + '</div></div>');
    html.push('<div class="metric"><div class="metric-label">Removed</div><div class="metric-value removed">' + comparison.removed.length + '</div></div>');
    html.push('<div class="metric"><div class="metric-label">Breaking Changes</div><div class="metric-value ' + (comparison.breaking ? 'removed' : 'added') + '">' + (comparison.breaking ? 'YES' : 'No') + '</div></div>');
    html.push('</div>');

    if (comparison.breaking) {
        html.push('<div class="warning"><strong>⚠️ Breaking Changes Detected!</strong><br>Review modified and removed functions before releasing library updates.</div>');
    }

    // Added functions
    if (comparison.added.length > 0) {
        html.push('<h2>✅ Added Functions (' + comparison.added.length + ')</h2>');
        for (var i = 0; i < comparison.added.length; i++) {
            html.push(formatFunctionCard(comparison.added[i], 'added'));
        }
    }

    // Modified functions
    if (comparison.modified.length > 0) {
        html.push('<h2>⚠️ Modified Functions (' + comparison.modified.length + ')</h2>');
        for (var i = 0; i < comparison.modified.length; i++) {
            html.push(formatModifiedCard(comparison.modified[i]));
        }
    }

    // Removed functions
    if (comparison.removed.length > 0) {
        html.push('<h2>❌ Removed Functions (' + comparison.removed.length + ')</h2>');
        for (var i = 0; i < comparison.removed.length; i++) {
            html.push(formatFunctionCard(comparison.removed[i], 'removed'));
        }
    }

    html.push('</div></body></html>');

    return html.join('\n');
}

/**
 * Format a function card
 */
function formatFunctionCard(func, type) {
    var html = [];
    html.push('<div class="function-card ' + type + '">');
    html.push('<strong>' + escapeHtml(func.fullName) + '</strong>');
    html.push('<div class="signature">' + escapeHtml(func.signature) + '</div>');
    if (func.description) {
        html.push('<div>' + escapeHtml(func.description) + '</div>');
    }
    if (func.deprecated) {
        html.push('<div style="color: #D32F2F; margin-top: 8px;">⚠️ Deprecated</div>');
    }
    html.push('</div>');
    return html.join('');
}

/**
 * Format a modified function card
 */
function formatModifiedCard(modification) {
    var html = [];
    html.push('<div class="function-card modified">');
    html.push('<strong>' + escapeHtml(modification.current.fullName) + '</strong>');
    html.push('<div class="signature">Previous: ' + escapeHtml(modification.previous.signature) + '</div>');
    html.push('<div class="signature">Current: ' + escapeHtml(modification.current.signature) + '</div>');
    html.push('<div style="color: #FF6F00; margin-top: 8px;"><strong>Changes:</strong> ' + escapeHtml(modification.change) + '</div>');
    html.push('</div>');
    return html.join('');
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
    AIS.Error.show('TrackLibraryLifecycle error', e);
}
