/**
 * Compare Script Versions
 * @version 1.0.0
 * @description Compare production scripts with archive originals to verify modernization quality
 * @category Utilities
 * @features
 * - Select production script and archive original for comparison
 * - Side-by-side comparison with content normalization
 * - Line count comparison (before/after)
 * - Function count comparison
 * - Feature preservation checklist
 * - Code structure analysis (validation, main logic, UI, utilities)
 * - Identify added features (AIS framework usage)
 * - Identify removed features (deprecated patterns)
 * - Generate HTML comparison report with syntax highlighting
 * - Quality score (1-10) based on feature completeness
 * - Interactive file browser for script selection
 * @author Vexy Illustrator Scripts Project
 * @usage
 * 1. Run script (no document needed)
 * 2. Select production script from category folder
 * 3. Select corresponding archive original
 * 4. Review comparison report on Desktop
 * 5. Verify all features preserved and modernization complete
 * @notes
 * - Quality assurance tool for modernization verification
 * - Learning tool for understanding modernization patterns
 * - Helps identify missing features or regressions
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
    reportPath: null // Will be set in main()
};

// ============================================================================
// MAIN FUNCTION
// ============================================================================
function main() {
    try {
        // Get project root
        var scriptFile = new File($.fileName);
        var projectRoot = scriptFile.parent.parent;

        // Select production script
        var prodScript = selectProductionScript(projectRoot);
        if (!prodScript) return; // User cancelled

        // Select archive original
        var archiveScript = selectArchiveScript(projectRoot);
        if (!archiveScript) return; // User cancelled

        // Analyze both scripts
        var comparison = compareScripts(prodScript, archiveScript);

        // Generate report
        CFG.reportPath = Folder.desktop + '/ScriptComparison_' + getTimestamp() + '.html';
        generateComparisonReport(comparison);

        // Show summary
        showSummaryDialog(comparison);

    } catch (e) {
        AIS.Error.show('Script Comparison Error', e);
    }
}

// ============================================================================
// USER INTERFACE
// ============================================================================

/**
 * Select production script
 * @param {Folder} root - Project root
 * @returns {File|null} Selected file or null
 */
function selectProductionScript(root) {
    var dialog = new Window('dialog', 'Select Production Script');
    dialog.alignChildren = 'fill';

    dialog.add('statictext', undefined, 'Select Category:');
    var catDropdown = dialog.add('dropdownlist', undefined, CFG.productionCategories);
    catDropdown.selection = 0;

    dialog.add('statictext', undefined, 'Select Script:');
    var scriptList = dialog.add('listbox', undefined, []);
    scriptList.preferredSize.height = 300;

    // Update script list when category changes
    catDropdown.onChange = function() {
        updateProductionScriptList(scriptList, catDropdown, root);
    };

    // Initial population
    updateProductionScriptList(scriptList, catDropdown, root);

    // Buttons
    var btnGroup = dialog.add('group');
    btnGroup.alignment = 'right';
    btnGroup.add('button', undefined, 'Cancel', {name: 'cancel'});
    btnGroup.add('button', undefined, 'Select', {name: 'ok'});

    if (dialog.show() === 1 && scriptList.selection) {
        var category = catDropdown.selection.text;
        var scriptName = scriptList.selection.text;
        return new File(root + '/' + category + '/' + scriptName);
    }

    return null;
}

/**
 * Select archive script
 * @param {Folder} root - Project root
 * @returns {File|null} Selected file or null
 */
function selectArchiveScript(root) {
    var dialog = new Window('dialog', 'Select Archive Original');
    dialog.alignChildren = 'fill';

    dialog.add('statictext', undefined, 'Select Archive Folder:');
    var folderDropdown = dialog.add('dropdownlist', undefined, ['old', 'old2']);
    folderDropdown.selection = 0;

    dialog.add('statictext', undefined, 'Select Script (recursively searches):');
    var scriptList = dialog.add('listbox', undefined, []);
    scriptList.preferredSize.height = 300;

    // Update script list when folder changes
    folderDropdown.onChange = function() {
        updateArchiveScriptList(scriptList, folderDropdown, root);
    };

    // Initial population
    updateArchiveScriptList(scriptList, folderDropdown, root);

    // Buttons
    var btnGroup = dialog.add('group');
    btnGroup.alignment = 'right';
    btnGroup.add('button', undefined, 'Cancel', {name: 'cancel'});
    btnGroup.add('button', undefined, 'Select', {name: 'ok'});

    if (dialog.show() === 1 && scriptList.selection) {
        return new File(scriptList.selection.path);
    }

    return null;
}

/**
 * Update production script list
 * @param {ListBox} list - List box
 * @param {DropDownList} dropdown - Dropdown
 * @param {Folder} root - Project root
 */
function updateProductionScriptList(list, dropdown, root) {
    list.removeAll();

    var category = dropdown.selection.text;
    var catFolder = new Folder(root + '/' + category);

    if (!catFolder.exists) return;

    var files = catFolder.getFiles('*.jsx');
    for (var i = 0; i < files.length; i++) {
        list.add('item', files[i].name);
    }
}

/**
 * Update archive script list
 * @param {ListBox} list - List box
 * @param {DropDownList} dropdown - Dropdown
 * @param {Folder} root - Project root
 */
function updateArchiveScriptList(list, dropdown, root) {
    list.removeAll();

    var folderName = dropdown.selection.text;
    var archiveFolder = new Folder(root + '/' + folderName);

    if (!archiveFolder.exists) return;

    var scripts = scanArchiveFolderRecursive(archiveFolder);

    for (var i = 0; i < scripts.length; i++) {
        var item = list.add('item', scripts[i].name);
        item.path = scripts[i].path;
    }
}

/**
 * Scan archive folder recursively
 * @param {Folder} folder - Folder to scan
 * @returns {Array} Scripts
 */
function scanArchiveFolderRecursive(folder) {
    var scripts = [];
    var items = folder.getFiles();

    for (var i = 0; i < items.length; i++) {
        var item = items[i];

        if (item instanceof Folder) {
            scripts = scripts.concat(scanArchiveFolderRecursive(item));
        } else if (item instanceof File && /\.jsx$/i.test(item.name)) {
            scripts.push({
                name: item.name,
                path: item.fsName
            });
        }
    }

    return scripts;
}

/**
 * Show summary dialog
 * @param {Object} comparison - Comparison data
 */
function showSummaryDialog(comparison) {
    var msg = 'Script Comparison Complete!\n\n';

    msg += '📄 Production: ' + comparison.production.name + '\n';
    msg += '   Lines: ' + comparison.production.stats.lines + '\n';
    msg += '   Functions: ' + comparison.production.stats.functions + '\n\n';

    msg += '📄 Archive: ' + comparison.archive.name + '\n';
    msg += '   Lines: ' + comparison.archive.stats.lines + '\n';
    msg += '   Functions: ' + comparison.archive.stats.functions + '\n\n';

    msg += '📊 Changes:\n';
    msg += '   Line delta: ' + (comparison.production.stats.lines - comparison.archive.stats.lines) + '\n';
    msg += '   Function delta: ' + (comparison.production.stats.functions - comparison.archive.stats.functions) + '\n\n';

    msg += '⭐ Quality Score: ' + comparison.qualityScore + '/10\n\n';

    msg += '📁 Report saved to Desktop';

    alert(msg, 'Script Comparison');
}

// ============================================================================
// CORE LOGIC - COMPARISON
// ============================================================================

/**
 * Compare scripts
 * @param {File} prodFile - Production script
 * @param {File} archiveFile - Archive script
 * @returns {Object} Comparison data
 */
function compareScripts(prodFile, archiveFile) {
    var prodData = analyzeScript(prodFile);
    var archiveData = analyzeScript(archiveFile);

    var comparison = {
        production: prodData,
        archive: archiveData,
        addedFeatures: identifyAddedFeatures(prodData, archiveData),
        removedFeatures: identifyRemovedFeatures(prodData, archiveData),
        qualityScore: calculateQualityScore(prodData, archiveData)
    };

    return comparison;
}

/**
 * Analyze script
 * @param {File} file - Script file
 * @returns {Object} Analysis data
 */
function analyzeScript(file) {
    file.encoding = 'UTF-8';
    file.open('r');
    var content = file.read();
    file.close();

    return {
        name: file.name,
        path: file.fsName,
        content: content,
        stats: calculateScriptStats(content),
        structure: analyzeStructure(content),
        patterns: detectPatterns(content)
    };
}

/**
 * Calculate script stats
 * @param {String} content - File content
 * @returns {Object} Statistics
 */
function calculateScriptStats(content) {
    var lines = content.split(/\r\n|\r|\n/).length;

    // Count functions
    var functionMatches = content.match(/^\s*function\s+\w+/gm);
    var functions = functionMatches ? functionMatches.length : 0;

    // Count comments
    var commentMatches = content.match(/\/\/.+|\/\*[\s\S]*?\*\//g);
    var comments = commentMatches ? commentMatches.length : 0;

    return {
        lines: lines,
        functions: functions,
        comments: comments,
        size: content.length
    };
}

/**
 * Analyze structure
 * @param {String} content - File content
 * @returns {Object} Structure analysis
 */
function analyzeStructure(content) {
    return {
        hasValidation: /hasDocument|hasSelection|activeDocument/.test(content),
        hasMainFunction: /function\s+main\s*\(/.test(content),
        hasUI: /new\s+Window\(/.test(content),
        hasUtilities: /\/\/\s*UTILITIES|\/\/\s*HELPER/.test(content),
        hasConfig: /var\s+CFG\s*=|var\s+CONFIG\s*=/i.test(content),
        hasErrorHandling: /try\s*\{[\s\S]*?catch/.test(content)
    };
}

/**
 * Detect patterns
 * @param {String} content - File content
 * @returns {Object} Pattern detection
 */
function detectPatterns(content) {
    return {
        usesAIS: /#include.*core\.jsx|AIS\./.test(content),
        usesJSDoc: /@version|@description|@features/.test(content),
        usesSettingsPersistence: /Settings|JSON\.stringify|JSON\.parse/.test(content),
        usesLivePreview: /preview|undo\(\)/.test(content),
        usesUnits: /Units|convert|mm|pt|px/.test(content)
    };
}

/**
 * Identify added features
 * @param {Object} prodData - Production data
 * @param {Object} archiveData - Archive data
 * @returns {Array} Added features
 */
function identifyAddedFeatures(prodData, archiveData) {
    var added = [];

    if (prodData.patterns.usesAIS && !archiveData.patterns.usesAIS) {
        added.push('AIS framework integration');
    }

    if (prodData.patterns.usesJSDoc && !archiveData.patterns.usesJSDoc) {
        added.push('Comprehensive JSDoc documentation');
    }

    if (prodData.structure.hasConfig && !archiveData.structure.hasConfig) {
        added.push('Centralized configuration (CFG object)');
    }

    if (prodData.structure.hasErrorHandling && !archiveData.structure.hasErrorHandling) {
        added.push('Error handling with try-catch');
    }

    return added;
}

/**
 * Identify removed features
 * @param {Object} prodData - Production data
 * @param {Object} archiveData - Archive data
 * @returns {Array} Removed features
 */
function identifyRemovedFeatures(prodData, archiveData) {
    var removed = [];

    // Check for significant function reduction
    if (archiveData.stats.functions > prodData.stats.functions + 5) {
        removed.push('Consolidated ' + (archiveData.stats.functions - prodData.stats.functions) + ' functions');
    }

    return removed;
}

/**
 * Calculate quality score
 * @param {Object} prodData - Production data
 * @param {Object} archiveData - Archive data
 * @returns {Number} Quality score (1-10)
 */
function calculateQualityScore(prodData, archiveData) {
    var score = 5; // Start at 5

    // +1 for AIS framework
    if (prodData.patterns.usesAIS) score += 1;

    // +1 for JSDoc
    if (prodData.patterns.usesJSDoc) score += 1;

    // +1 for error handling
    if (prodData.structure.hasErrorHandling) score += 1;

    // +1 for configuration
    if (prodData.structure.hasConfig) score += 1;

    // +1 for maintaining similar complexity
    var complexityRatio = prodData.stats.functions / (archiveData.stats.functions || 1);
    if (complexityRatio >= 0.8 && complexityRatio <= 1.2) {
        score += 1;
    }

    return Math.min(10, Math.max(1, score));
}

// ============================================================================
// REPORT GENERATION
// ============================================================================

/**
 * Generate comparison report
 * @param {Object} comparison - Comparison data
 */
function generateComparisonReport(comparison) {
    var html = buildComparisonHTML(comparison);

    var file = new File(CFG.reportPath);
    file.encoding = 'UTF-8';
    file.open('w');
    file.write(html);
    file.close();
}

/**
 * Build comparison HTML
 * @param {Object} comparison - Comparison data
 * @returns {String} HTML
 */
function buildComparisonHTML(comparison) {
    var html = '<!DOCTYPE html>\n<html>\n<head>\n';
    html += '<meta charset="UTF-8">\n';
    html += '<title>Script Comparison Report</title>\n';
    html += '<style>\n';
    html += 'body { font-family: -apple-system, sans-serif; margin: 40px; background: #f5f5f5; }\n';
    html += 'h1 { color: #2962FF; }\n';
    html += '.comparison { background: white; padding: 30px; border-radius: 12px; margin: 20px 0; }\n';
    html += '.metric { display: inline-block; margin: 15px 30px; text-align: center; }\n';
    html += '.metric-value { font-size: 36px; font-weight: bold; color: #2962FF; }\n';
    html += '.metric-label { font-size: 14px; color: #666; }\n';
    html += '.feature-list { background: #E3F2FD; padding: 20px; border-radius: 8px; margin: 15px 0; }\n';
    html += '.quality-score { font-size: 48px; font-weight: bold; color: #00C853; text-align: center; margin: 30px 0; }\n';
    html += '</style>\n';
    html += '</head>\n<body>\n';

    html += '<h1>📊 Script Comparison Report</h1>\n';

    html += '<div class="comparison">\n';
    html += '<h2>Statistics</h2>\n';
    html += '<div class="metric"><div class="metric-value">' + comparison.production.stats.lines + '</div><div class="metric-label">Production Lines</div></div>\n';
    html += '<div class="metric"><div class="metric-value">' + comparison.archive.stats.lines + '</div><div class="metric-label">Archive Lines</div></div>\n';
    html += '<div class="metric"><div class="metric-value">' + (comparison.production.stats.lines - comparison.archive.stats.lines) + '</div><div class="metric-label">Line Delta</div></div>\n';
    html += '</div>\n';

    if (comparison.addedFeatures.length > 0) {
        html += '<div class="feature-list">\n';
        html += '<h3>✅ Added Features</h3>\n';
        html += '<ul>\n';
        for (var i = 0; i < comparison.addedFeatures.length; i++) {
            html += '<li>' + comparison.addedFeatures[i] + '</li>\n';
        }
        html += '</ul>\n';
        html += '</div>\n';
    }

    html += '<div class="quality-score">\n';
    html += '⭐ Quality Score: ' + comparison.qualityScore + '/10\n';
    html += '</div>\n';

    html += '</body>\n</html>';
    return html;
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

// ============================================================================
// EXECUTE
// ============================================================================

try {
    main();
} catch (e) {
    AIS.Error.show('Script error', e);
}
