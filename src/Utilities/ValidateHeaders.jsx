/**
 * Validate Headers | Vexy Utility Script
 * @version 1.0.0
 * @description Validates JSDoc headers across all production scripts to ensure consistent metadata
 *
 * @author Vexy Scripts Project
 * @license MIT
 *
 * @features
 * - Validates @version format (X.Y.Z semantic versioning)
 * - Checks @description exists and is meaningful (>20 characters)
 * - Verifies @category matches folder location
 * - Ensures @author exists
 * - Validates @features has at least 3 items
 * - Checks for @requires dependencies
 * - Generates HTML report with validation results
 * - Auto-suggests fixes for common issues
 * - Color-coded results (green=pass, yellow=warning, red=error)
 *
 * @usage
 * Run before releases or after creating new scripts to ensure header consistency
 *
 * @notes
 * - Scans all .jsx files except old/, old2/, templates/
 * - Checks for proper JSDoc formatting
 * - Validates metadata accuracy
 */

#include "../.lib/core.jsx"

//@target illustrator
app.preferences.setBooleanPreference('ShowExternalJSXWarning', false);

// ============================================================================
// CONFIGURATION
// ============================================================================

var CFG = {
    name: 'ValidateHeaders',
    version: '1.0.0',

    // Folders to scan
    scanFolders: [
        'Favorites', 'Text', 'Export', 'Measurement', 'Artboards',
        'Layers', 'Preferences', 'Utilities', 'Transform', 'Colors',
        'Paths', 'Selection', 'Print', 'Effects', 'Guides',
        'Layout', 'Strokes', 'Varia'
    ],

    // Folders to exclude
    excludeFolders: ['old', 'old2', 'templates', 'node_modules', '.git'],

    // Required header fields
    requiredFields: ['@version', '@description', '@author'],

    // Recommended header fields
    recommendedFields: ['@features', '@usage', '@category'],

    // Validation rules
    rules: {
        versionFormat: /^\d+\.\d+\.\d+$/, // X.Y.Z
        descriptionMinLength: 20,
        featuresMinCount: 3
    }
};

// ============================================================================
// DATA STRUCTURES
// ============================================================================

/**
 * Validation result for a single script
 * @typedef {Object} ValidationResult
 * @property {String} file - File path
 * @property {String} category - Category folder
 * @property {Boolean} hasHeader - Has JSDoc header block
 * @property {Array} errors - Critical issues
 * @property {Array} warnings - Non-critical issues
 * @property {Array} suggestions - Improvement suggestions
 * @property {Object} metadata - Extracted metadata
 */

// ============================================================================
// MAIN FUNCTION
// ============================================================================

function main() {
    var projectRoot = getProjectRoot();
    if (!projectRoot) {
        alert('Error\nCould not determine project root folder');
        return;
    }

    // Scan all production scripts
    var scripts = scanProductionScripts(projectRoot);

    if (scripts.length === 0) {
        alert('No scripts found\nCheck project folder structure');
        return;
    }

    // Validate each script
    var results = [];
    for (var i = 0; i < scripts.length; i++) {
        var result = validateScript(scripts[i]);
        results.push(result);
    }

    // Generate summary statistics
    var summary = generateSummary(results);

    // Generate HTML report
    var reportPath = generateHTMLReport(projectRoot, results, summary);

    // Open report in browser
    if (reportPath) {
        AIS.System.openURL('file://' + reportPath);
        alert('Validation complete\n\n' +
              'Files scanned: ' + results.length + '\n' +
              'Passed: ' + summary.passed + '\n' +
              'Warnings: ' + summary.warnings + '\n' +
              'Errors: ' + summary.errors + '\n\n' +
              'Report opened in browser');
    }
}

// ============================================================================
// SCRIPT SCANNING
// ============================================================================

/**
 * Get project root folder
 * @returns {Folder} Project root folder
 */
function getProjectRoot() {
    var scriptFile = new File($.fileName);
    var scriptFolder = scriptFile.parent; // Utilities/
    var projectRoot = scriptFolder.parent; // Project root
    return projectRoot;
}

/**
 * Scan all production scripts in project
 * @param {Folder} projectRoot - Project root folder
 * @returns {Array<File>} Array of script files
 */
function scanProductionScripts(projectRoot) {
    var scripts = [];

    for (var i = 0; i < CFG.scanFolders.length; i++) {
        var categoryName = CFG.scanFolders[i];
        var categoryFolder = new Folder(projectRoot.fsName + '/' + categoryName);

        if (!categoryFolder.exists) continue;

        var files = categoryFolder.getFiles('*.jsx');
        for (var j = 0; j < files.length; j++) {
            scripts.push(files[j]);
        }
    }

    // Also scan lib/ folder
    var libFolder = new Folder(projectRoot.fsName + '/lib');
    if (libFolder.exists) {
        var libFiles = libFolder.getFiles('*.jsx');
        for (var k = 0; k < libFiles.length; k++) {
            scripts.push(libFiles[k]);
        }
    }

    return scripts;
}

// ============================================================================
// VALIDATION LOGIC
// ============================================================================

/**
 * Validate a single script file
 * @param {File} file - Script file to validate
 * @returns {ValidationResult} Validation result
 */
function validateScript(file) {
    var result = {
        file: file.fsName,
        fileName: file.name,
        category: getCategoryFromPath(file.fsName),
        hasHeader: false,
        errors: [],
        warnings: [],
        suggestions: [],
        metadata: {}
    };

    // Read file contents
    file.encoding = 'UTF-8';
    if (!file.open('r')) {
        result.errors.push('Failed to open file for reading');
        return result;
    }

    var content = file.read();
    file.close();

    // Extract JSDoc header
    var header = extractJSDocHeader(content);
    if (!header) {
        result.errors.push('No JSDoc header found (expected /** ... */ at top of file)');
        return result;
    }

    result.hasHeader = true;

    // Parse metadata from header
    result.metadata = parseMetadata(header);

    // Run validation checks
    validateVersion(result);
    validateDescription(result);
    validateAuthor(result);
    validateCategory(result);
    validateFeatures(result);
    validateRequires(result);

    return result;
}

/**
 * Get category name from file path
 * @param {String} path - File path
 * @returns {String} Category name
 */
function getCategoryFromPath(path) {
    var parts = path.split('/');
    for (var i = parts.length - 1; i >= 0; i--) {
        var folder = parts[i];
        if (CFG.scanFolders.indexOf(folder) !== -1 || folder === 'lib') {
            return folder;
        }
    }
    return 'Unknown';
}

/**
 * Extract JSDoc header block from file content
 * @param {String} content - File content
 * @returns {String|null} JSDoc header or null if not found
 */
function extractJSDocHeader(content) {
    // Match /** ... */ at start of file
    var match = content.match(/^\/\*\*([\s\S]*?)\*\//);
    if (match) {
        return match[1];
    }
    return null;
}

/**
 * Parse metadata tags from JSDoc header
 * @param {String} header - JSDoc header content
 * @returns {Object} Metadata object
 */
function parseMetadata(header) {
    var metadata = {
        version: null,
        description: null,
        author: null,
        category: null,
        features: [],
        requires: [],
        usage: null,
        notes: null
    };

    var lines = header.split('\n');
    var currentTag = null;
    var currentContent = '';

    for (var i = 0; i < lines.length; i++) {
        var line = lines[i].replace(/^\s*\*\s?/, ''); // Remove leading * and whitespace

        // Check if line starts with @tag
        if (line.match(/^@\w+/)) {
            // Save previous tag content
            if (currentTag) {
                saveTagContent(metadata, currentTag, currentContent.trim());
            }

            // Parse new tag
            var tagMatch = line.match(/^@(\w+)\s*(.*)/);
            if (tagMatch) {
                currentTag = tagMatch[1];
                currentContent = tagMatch[2];
            }
        } else if (currentTag) {
            // Continuation of current tag
            currentContent += ' ' + line;
        } else if (!metadata.description && line.length > 0) {
            // First non-empty line without tag is description
            metadata.description = line;
        }
    }

    // Save last tag
    if (currentTag) {
        saveTagContent(metadata, currentTag, currentContent.trim());
    }

    return metadata;
}

/**
 * Save tag content to metadata object
 * @param {Object} metadata - Metadata object
 * @param {String} tag - Tag name
 * @param {String} content - Tag content
 */
function saveTagContent(metadata, tag, content) {
    switch (tag) {
        case 'version':
            metadata.version = content;
            break;
        case 'description':
            metadata.description = content;
            break;
        case 'author':
            metadata.author = content;
            break;
        case 'category':
            metadata.category = content;
            break;
        case 'features':
            // Features are typically bullet points, extract them
            var features = content.split(/[-•]\s+/);
            for (var i = 0; i < features.length; i++) {
                var feature = features[i].trim();
                if (feature.length > 0) {
                    metadata.features.push(feature);
                }
            }
            break;
        case 'requires':
            metadata.requires.push(content);
            break;
        case 'usage':
            metadata.usage = content;
            break;
        case 'notes':
            metadata.notes = content;
            break;
    }
}

// ============================================================================
// VALIDATION RULES
// ============================================================================

/**
 * Validate @version format
 * @param {ValidationResult} result - Validation result
 */
function validateVersion(result) {
    if (!result.metadata.version) {
        result.errors.push('@version tag is missing');
        result.suggestions.push('Add @version tag (e.g., @version 1.0.0)');
        return;
    }

    if (!CFG.rules.versionFormat.test(result.metadata.version)) {
        result.errors.push('@version format is invalid: "' + result.metadata.version + '" (expected X.Y.Z)');
        result.suggestions.push('Use semantic versioning format (e.g., 1.0.0, 2.3.1)');
    }
}

/**
 * Validate @description
 * @param {ValidationResult} result - Validation result
 */
function validateDescription(result) {
    if (!result.metadata.description) {
        result.errors.push('@description tag is missing');
        result.suggestions.push('Add meaningful description of what the script does');
        return;
    }

    if (result.metadata.description.length < CFG.rules.descriptionMinLength) {
        result.warnings.push('@description is too short (' + result.metadata.description.length + ' chars, min ' + CFG.rules.descriptionMinLength + ')');
        result.suggestions.push('Expand description to be more informative');
    }
}

/**
 * Validate @author
 * @param {ValidationResult} result - Validation result
 */
function validateAuthor(result) {
    if (!result.metadata.author) {
        result.warnings.push('@author tag is missing');
        result.suggestions.push('Add @author tag to credit original author');
    }
}

/**
 * Validate @category matches folder location
 * @param {ValidationResult} result - Validation result
 */
function validateCategory(result) {
    if (!result.metadata.category) {
        result.warnings.push('@category tag is missing');
        result.suggestions.push('Add @category tag: ' + result.category);
        return;
    }

    if (result.metadata.category !== result.category) {
        result.warnings.push('@category mismatch: header says "' + result.metadata.category + '", but file is in "' + result.category + '" folder');
        result.suggestions.push('Update @category to match folder: ' + result.category);
    }
}

/**
 * Validate @features
 * @param {ValidationResult} result - Validation result
 */
function validateFeatures(result) {
    if (result.metadata.features.length === 0) {
        result.warnings.push('@features tag is missing or empty');
        result.suggestions.push('Add @features section with bullet list of key features');
        return;
    }

    if (result.metadata.features.length < CFG.rules.featuresMinCount) {
        result.warnings.push('@features has only ' + result.metadata.features.length + ' items (recommended min ' + CFG.rules.featuresMinCount + ')');
        result.suggestions.push('Add more feature descriptions for better documentation');
    }
}

/**
 * Validate @requires dependencies
 * @param {ValidationResult} result - Validation result
 */
function validateRequires(result) {
    // Check if script includes lib/core.jsx (most scripts should)
    var file = new File(result.file);
    file.encoding = 'UTF-8';
    if (file.open('r')) {
        var content = file.read();
        file.close();

        if (content.indexOf('#include') !== -1 && result.metadata.requires.length === 0) {
            result.suggestions.push('Script uses #include but @requires tag is missing - document dependencies');
        }
    }
}

// ============================================================================
// SUMMARY & REPORTING
// ============================================================================

/**
 * Generate summary statistics
 * @param {Array<ValidationResult>} results - All validation results
 * @returns {Object} Summary statistics
 */
function generateSummary(results) {
    var summary = {
        total: results.length,
        passed: 0,
        warnings: 0,
        errors: 0,
        noHeader: 0
    };

    for (var i = 0; i < results.length; i++) {
        var result = results[i];

        if (!result.hasHeader) {
            summary.noHeader++;
            summary.errors++;
        } else if (result.errors.length > 0) {
            summary.errors++;
        } else if (result.warnings.length > 0) {
            summary.warnings++;
        } else {
            summary.passed++;
        }
    }

    return summary;
}

/**
 * Generate HTML validation report
 * @param {Folder} projectRoot - Project root folder
 * @param {Array<ValidationResult>} results - All validation results
 * @param {Object} summary - Summary statistics
 * @returns {String} Report file path
 */
function generateHTMLReport(projectRoot, results, summary) {
    var html = generateHTMLHeader(summary);
    html += generateHTMLSummary(summary);
    html += generateHTMLResults(results);
    html += generateHTMLFooter();

    // Save report
    var reportFile = new File(projectRoot.fsName + '/header-validation-report.html');
    reportFile.encoding = 'UTF-8';

    if (!reportFile.open('w')) {
        alert('Error\nFailed to create report file');
        return null;
    }

    reportFile.write(html);
    reportFile.close();

    return reportFile.fsName;
}

/**
 * Generate HTML header
 * @param {Object} summary - Summary statistics
 * @returns {String} HTML header
 */
function generateHTMLHeader(summary) {
    var passRate = summary.total > 0 ? Math.round((summary.passed / summary.total) * 100) : 0;

    return '<!DOCTYPE html>\n' +
        '<html>\n' +
        '<head>\n' +
        '<meta charset="UTF-8">\n' +
        '<title>Header Validation Report - Vexy Scripts</title>\n' +
        '<style>\n' +
        'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif; margin: 20px; background: #f5f5f5; }\n' +
        'h1 { color: #333; border-bottom: 3px solid #2962FF; padding-bottom: 10px; }\n' +
        'h2 { color: #555; margin-top: 30px; }\n' +
        '.summary { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }\n' +
        '.stat { display: inline-block; margin: 10px 20px 10px 0; padding: 10px 15px; border-radius: 5px; }\n' +
        '.stat-label { font-size: 12px; color: #666; display: block; }\n' +
        '.stat-value { font-size: 24px; font-weight: bold; display: block; }\n' +
        '.stat-total { background: #E3F2FD; color: #1976D2; }\n' +
        '.stat-passed { background: #E8F5E9; color: #388E3C; }\n' +
        '.stat-warnings { background: #FFF3E0; color: #F57C00; }\n' +
        '.stat-errors { background: #FFEBEE; color: #D32F2F; }\n' +
        '.result { background: white; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #ddd; }\n' +
        '.result-pass { border-left-color: #4CAF50; }\n' +
        '.result-warning { border-left-color: #FF9800; }\n' +
        '.result-error { border-left-color: #F44336; }\n' +
        '.file-name { font-weight: bold; color: #333; font-size: 14px; }\n' +
        '.category { display: inline-block; background: #E0E0E0; padding: 2px 8px; border-radius: 3px; font-size: 11px; margin-left: 10px; }\n' +
        '.issue { margin: 5px 0; padding: 5px 10px; border-radius: 3px; font-size: 13px; }\n' +
        '.error { background: #FFEBEE; color: #C62828; }\n' +
        '.warning { background: #FFF3E0; color: #EF6C00; }\n' +
        '.suggestion { background: #E3F2FD; color: #1565C0; }\n' +
        '.timestamp { color: #999; font-size: 12px; }\n' +
        '</style>\n' +
        '</head>\n' +
        '<body>\n' +
        '<h1>📋 Header Validation Report</h1>\n' +
        '<div class="timestamp">Generated: ' + new Date().toString() + '</div>\n';
}

/**
 * Generate HTML summary section
 * @param {Object} summary - Summary statistics
 * @returns {String} HTML summary
 */
function generateHTMLSummary(summary) {
    var passRate = summary.total > 0 ? Math.round((summary.passed / summary.total) * 100) : 0;

    return '<div class="summary">\n' +
        '<h2>Summary</h2>\n' +
        '<div class="stat stat-total">\n' +
        '<span class="stat-label">Total Scripts</span>\n' +
        '<span class="stat-value">' + summary.total + '</span>\n' +
        '</div>\n' +
        '<div class="stat stat-passed">\n' +
        '<span class="stat-label">✓ Passed</span>\n' +
        '<span class="stat-value">' + summary.passed + '</span>\n' +
        '</div>\n' +
        '<div class="stat stat-warnings">\n' +
        '<span class="stat-label">⚠ Warnings</span>\n' +
        '<span class="stat-value">' + summary.warnings + '</span>\n' +
        '</div>\n' +
        '<div class="stat stat-errors">\n' +
        '<span class="stat-label">✗ Errors</span>\n' +
        '<span class="stat-value">' + summary.errors + '</span>\n' +
        '</div>\n' +
        '<div style="margin-top: 20px; font-size: 14px; color: #666;">\n' +
        'Pass Rate: <strong>' + passRate + '%</strong>\n' +
        '</div>\n' +
        '</div>\n';
}

/**
 * Generate HTML results section
 * @param {Array<ValidationResult>} results - All validation results
 * @returns {String} HTML results
 */
function generateHTMLResults(results) {
    var html = '<h2>Validation Results</h2>\n';

    // Sort results: errors first, then warnings, then passed
    results.sort(function(a, b) {
        if (a.errors.length > 0 && b.errors.length === 0) return -1;
        if (a.errors.length === 0 && b.errors.length > 0) return 1;
        if (a.warnings.length > 0 && b.warnings.length === 0) return -1;
        if (a.warnings.length === 0 && b.warnings.length > 0) return 1;
        return 0;
    });

    for (var i = 0; i < results.length; i++) {
        html += generateResultHTML(results[i]);
    }

    return html;
}

/**
 * Generate HTML for single result
 * @param {ValidationResult} result - Validation result
 * @returns {String} HTML for result
 */
function generateResultHTML(result) {
    var statusClass = 'result-pass';
    var statusIcon = '✓';

    if (result.errors.length > 0) {
        statusClass = 'result-error';
        statusIcon = '✗';
    } else if (result.warnings.length > 0) {
        statusClass = 'result-warning';
        statusIcon = '⚠';
    }

    var html = '<div class="result ' + statusClass + '">\n';
    html += '<div class="file-name">' + statusIcon + ' ' + result.fileName + ' <span class="category">' + result.category + '</span></div>\n';

    // Show errors
    for (var i = 0; i < result.errors.length; i++) {
        html += '<div class="issue error">✗ Error: ' + result.errors[i] + '</div>\n';
    }

    // Show warnings
    for (var j = 0; j < result.warnings.length; j++) {
        html += '<div class="issue warning">⚠ Warning: ' + result.warnings[j] + '</div>\n';
    }

    // Show suggestions
    for (var k = 0; k < result.suggestions.length; k++) {
        html += '<div class="issue suggestion">💡 Suggestion: ' + result.suggestions[k] + '</div>\n';
    }

    // If passed with no issues, show success message
    if (result.errors.length === 0 && result.warnings.length === 0 && result.suggestions.length === 0) {
        html += '<div style="color: #4CAF50; font-size: 12px;">All header validations passed</div>\n';
    }

    html += '</div>\n';

    return html;
}

/**
 * Generate HTML footer
 * @returns {String} HTML footer
 */
function generateHTMLFooter() {
    return '</body>\n</html>';
}

// ============================================================================
// ENTRY POINT
// ============================================================================

(function() {
    try {
        main();
    } catch (err) {
        alert('Error in ValidateHeaders\n\n' +
              err.message + '\n' +
              'Line: ' + err.line);
    }
})();
