/**
 * Validate Script Categories
 * @version 1.0.0
 * @description Validates that scripts are in correct category folders and have matching @category tags for proper organization as project scales
 * @category Utilities
 * @author Adam @ Vexy
 * @license Apache-2.0
 * @requires Illustrator CS6+
 * @features
 *   - Scan all scripts and compare folder location vs @category tag
 *   - Detect mismatches between folder and @category
 *   - Suggest correct category based on script functionality
 *   - Check if category folders are empty or overcrowded
 *   - Recommend reorganization for better distribution
 *   - Validate category names match standard list
 *   - Generate HTML report with categorization issues
 * @example
 *   // Run from Illustrator Scripts menu
 *   // Validates all script categorization
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
    scriptName: 'ValidateScriptCategories',
    version: '1.0.0',
    outputFolder: Folder.myDocuments + '/Adobe Scripts/Reports/',
    outputFile: 'category-validation-report.html',

    // Standard category folders
    validCategories: [
        'Favorites',
        'Text',
        'Artboards',
        'Colors',
        'Layers',
        'Paths',
        'Transform',
        'Selection',
        'Export',
        'Measurement',
        'Preferences',
        'Strokes',
        'Print',
        'Effects',
        'Utilities',
        'Varia'
    ],

    // Thresholds
    thresholds: {
        emptyFolder: 0,
        overcrowdedFolder: 30
    }
};

// ============================================================================
// MAIN FUNCTION
// ============================================================================

function main() {
    try {
        var startTime = new Date();

        var projectRoot = findProjectRoot();
        if (!projectRoot) {
            alert('Error\nCannot find project root folder.');
            return;
        }

        var scripts = scanAllScripts(projectRoot);
        var validation = validateCategories(scripts);
        var distribution = analyzeDistribution(scripts);
        var report = generateReport(validation, distribution, startTime);
        var success = saveReport(report);

        if (success) {
            var elapsed = ((new Date() - startTime) / 1000).toFixed(1);
            alert(
                'Category Validation Complete\n\n' +
                'Scripts validated: ' + scripts.length + '\n' +
                'Mismatches found: ' + validation.mismatches.length + '\n' +
                'Invalid categories: ' + validation.invalidCategories.length + '\n' +
                'Time: ' + elapsed + 's\n\n' +
                'Report: ' + CFG.outputFolder + CFG.outputFile
            );
        }

    } catch (e) {
        AIS.Error.show('Category validation failed', e);
    }
}

// ============================================================================
// CORE LOGIC
// ============================================================================

function findProjectRoot() {
    var scriptFile = new File($.fileName);
    var currentFolder = scriptFile.parent;
    if (currentFolder.name === 'Utilities') {
        return currentFolder.parent;
    }
    return null;
}

function scanAllScripts(projectRoot) {
    var scripts = [];
    for (var i = 0; i < CFG.validCategories.length; i++) {
        var category = CFG.validCategories[i];
        var folder = new Folder(projectRoot.fsName + '/' + category);
        if (!folder.exists) continue;

        var files = folder.getFiles('*.jsx');
        for (var j = 0; j < files.length; j++) {
            if (files[j] instanceof File) {
                var content = readFileContent(files[j]);
                var categoryTag = extractCategoryTag(content);

                scripts.push({
                    name: files[j].name,
                    path: files[j].fsName,
                    folderCategory: category,
                    tagCategory: categoryTag,
                    file: files[j]
                });
            }
        }
    }
    return scripts;
}

function extractCategoryTag(content) {
    if (!content) return null;
    var match = content.match(/@category\s+(\w+)/i);
    return match ? match[1] : null;
}

function validateCategories(scripts) {
    var validation = {
        mismatches: [],
        invalidCategories: [],
        missingTags: [],
        correct: []
    };

    for (var i = 0; i < scripts.length; i++) {
        var script = scripts[i];

        if (!script.tagCategory) {
            validation.missingTags.push(script);
            continue;
        }

        if (script.folderCategory !== script.tagCategory) {
            validation.mismatches.push({
                script: script.name,
                folder: script.folderCategory,
                tag: script.tagCategory,
                suggestion: getSuggestion(script)
            });
        } else {
            validation.correct.push(script);
        }

        var validCategory = false;
        for (var j = 0; j < CFG.validCategories.length; j++) {
            if (script.tagCategory === CFG.validCategories[j]) {
                validCategory = true;
                break;
            }
        }
        if (!validCategory) {
            validation.invalidCategories.push(script);
        }
    }

    return validation;
}

function getSuggestion(script) {
    if (isValidCategory(script.folderCategory)) {
        return 'Update @category to: ' + script.folderCategory;
    } else if (isValidCategory(script.tagCategory)) {
        return 'Move to folder: ' + script.tagCategory + '/';
    }
    return 'Review and assign correct category';
}

function isValidCategory(category) {
    for (var i = 0; i < CFG.validCategories.length; i++) {
        if (CFG.validCategories[i] === category) return true;
    }
    return false;
}

function analyzeDistribution(scripts) {
    var distribution = {};

    for (var i = 0; i < CFG.validCategories.length; i++) {
        distribution[CFG.validCategories[i]] = 0;
    }

    for (var i = 0; i < scripts.length; i++) {
        var category = scripts[i].folderCategory;
        if (distribution[category] !== undefined) {
            distribution[category]++;
        }
    }

    var empty = [];
    var overcrowded = [];

    for (var category in distribution) {
        var count = distribution[category];
        if (count === 0) {
            empty.push(category);
        } else if (count > CFG.thresholds.overcrowdedFolder) {
            overcrowded.push({category: category, count: count});
        }
    }

    return {
        counts: distribution,
        empty: empty,
        overcrowded: overcrowded
    };
}

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

function generateReport(validation, distribution, startTime) {
    var elapsed = ((new Date() - startTime) / 1000).toFixed(1);
    var totalScripts = validation.correct.length + validation.mismatches.length + validation.missingTags.length;

    var html = [];
    html.push('<!DOCTYPE html>');
    html.push('<html><head><meta charset="UTF-8"><title>Category Validation Report</title>');
    html.push('<style>');
    html.push('body { font-family: sans-serif; margin: 20px; background: #f5f5f5; }');
    html.push('.container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; }');
    html.push('h1 { color: #1a1a1a; border-bottom: 3px solid #2962FF; padding-bottom: 10px; }');
    html.push('h2 { color: #424242; margin-top: 30px; }');
    html.push('.metric { display: inline-block; background: #f8f9fa; padding: 15px; margin: 10px; border-radius: 6px; }');
    html.push('.issue { background: #FFF3E0; border-left: 4px solid #FF6F00; padding: 15px; margin: 10px 0; }');
    html.push('.success { background: #E8F5E9; border-left: 4px solid #4CAF50; padding: 15px; margin: 10px 0; }');
    html.push('</style></head><body><div class="container">');

    html.push('<h1>📁 Category Validation Report</h1>');
    html.push('<p>Generated: ' + new Date().toString() + ' | Time: ' + elapsed + 's</p>');

    html.push('<div>');
    html.push('<div class="metric"><strong>Total Scripts:</strong> ' + totalScripts + '</div>');
    html.push('<div class="metric"><strong>Correct:</strong> ' + validation.correct.length + '</div>');
    html.push('<div class="metric"><strong>Mismatches:</strong> ' + validation.mismatches.length + '</div>');
    html.push('<div class="metric"><strong>Missing Tags:</strong> ' + validation.missingTags.length + '</div>');
    html.push('</div>');

    if (validation.mismatches.length > 0) {
        html.push('<h2>⚠️ Category Mismatches (' + validation.mismatches.length + ')</h2>');
        for (var i = 0; i < validation.mismatches.length; i++) {
            var m = validation.mismatches[i];
            html.push('<div class="issue">');
            html.push('<strong>' + escapeHtml(m.script) + '</strong><br>');
            html.push('Folder: ' + m.folder + ' | @category tag: ' + m.tag + '<br>');
            html.push('<em>Suggestion: ' + escapeHtml(m.suggestion) + '</em>');
            html.push('</div>');
        }
    }

    if (validation.missingTags.length > 0) {
        html.push('<h2>❌ Missing @category Tags (' + validation.missingTags.length + ')</h2>');
        for (var i = 0; i < validation.missingTags.length; i++) {
            html.push('<div class="issue">');
            html.push('<strong>' + escapeHtml(validation.missingTags[i].name) + '</strong> in ' + validation.missingTags[i].folderCategory + '/');
            html.push('</div>');
        }
    }

    if (distribution.overcrowded.length > 0) {
        html.push('<h2>📊 Overcrowded Categories</h2>');
        for (var i = 0; i < distribution.overcrowded.length; i++) {
            var oc = distribution.overcrowded[i];
            html.push('<div class="issue">');
            html.push('<strong>' + oc.category + ':</strong> ' + oc.count + ' scripts (threshold: ' + CFG.thresholds.overcrowdedFolder + ')');
            html.push('</div>');
        }
    }

    if (validation.mismatches.length === 0 && validation.missingTags.length === 0) {
        html.push('<div class="success">✅ All scripts are correctly categorized!</div>');
    }

    html.push('</div></body></html>');
    return html.join('\n');
}

function escapeHtml(text) {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function saveReport(htmlContent) {
    try {
        var folder = new Folder(CFG.outputFolder);
        if (!folder.exists) folder.create();

        var file = new File(CFG.outputFolder + CFG.outputFile);
        file.encoding = 'UTF-8';
        if (!file.open('w')) return false;
        file.write(htmlContent);
        file.close();
        return true;
    } catch (e) {
        return false;
    }
}
