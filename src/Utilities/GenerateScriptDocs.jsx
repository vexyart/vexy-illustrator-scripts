/**
 * Generate Script Documentation
 * @version 1.0.0
 * @description Auto-generate README.md from script JSDoc headers
 * @author Adam (2025)
 * @license MIT
 * @category Utilities
 * @requires Illustrator CS4 or higher
 *
 * Features:
 * - Parse all production scripts for JSDoc headers
 * - Extract @description, @version, features, requirements
 * - Generate README.md with categorized script listings
 * - Create table of contents
 * - Include usage instructions and installation guide
 * - Support Markdown formatting
 * - Auto-update capability
 *
 * Usage:
 * - Run after adding new scripts
 * - Run before releases to update documentation
 * - Keeps documentation in sync with code
 */

#include "../.lib/core.jsx"

//@target illustrator
app.preferences.setBooleanPreference('ShowExternalJSXWarning', false);

// ============================================================================
// ENTRY POINT
// ============================================================================

(function() {
    try {
        main();
    } catch (err) {
        AIS.Error.show('Generate Script Documentation', err);
    }
})();

// ============================================================================
// CONFIGURATION
// ============================================================================

var CFG = {
    scriptName: 'Generate Script Documentation',
    scriptVersion: '1.0.0',
    excludedPaths: ['old', 'old2', 'templates', 'node_modules', '.git', 'lib'],
    categories: [
        'Favorites',
        'Artboards',
        'Layers',
        'Text',
        'Colors',
        'Paths',
        'Transform',
        'Selection',
        'Export',
        'Print',
        'Measurement',
        'Preferences',
        'Strokes',
        'Effects',
        'Guides',
        'Documents',
        'Utilities',
        'Varia'
    ]
};

// ============================================================================
// MAIN FUNCTION
// ============================================================================

function main() {
    var scriptPath = getScriptPath();
    var projectRoot = scriptPath.parent.parent;

    // Scan for all production scripts
    var scripts = scanForScripts(projectRoot);

    if (scripts.length === 0) {
        alert('No scripts found\nCheck project structure and try again');
        return;
    }

    // Parse script metadata
    var scriptData = parseAllScripts(scripts);

    // Group by category
    var categorized = categorizeScripts(scriptData);

    // Generate README.md content
    var readmeContent = generateREADME(categorized);

    // Save README.md
    var readmePath = saveREADME(projectRoot, readmeContent);

    // Show success message
    alert('Documentation Generated!\n\n' +
          'Total scripts: ' + scripts.length + '\n' +
          'Categories: ' + Object.keys(categorized).length + '\n\n' +
          'Saved to: ' + readmePath);
}

// ============================================================================
// SCRIPT SCANNING
// ============================================================================

/**
 * Get the folder containing this script
 * @returns {Folder} Script folder
 */
function getScriptPath() {
    try {
        return new File($.fileName).parent;
    } catch (e) {
        return Folder.myDocuments;
    }
}

/**
 * Scan project for all production .jsx files
 * @param {Folder} folder - Root folder to scan
 * @returns {Array} Array of File objects
 */
function scanForScripts(folder) {
    var scripts = [];
    scanFolderRecursive(folder, scripts);
    return scripts;
}

/**
 * Recursively scan folder for .jsx files
 * @param {Folder} folder - Folder to scan
 * @param {Array} results - Array to collect results
 */
function scanFolderRecursive(folder, results) {
    var files = folder.getFiles();

    for (var i = 0; i < files.length; i++) {
        var item = files[i];

        // Skip excluded paths
        if (isExcludedPath(item.fsName)) {
            continue;
        }

        if (item instanceof Folder) {
            // Recurse into subfolder
            scanFolderRecursive(item, results);
        } else if (item instanceof File && item.name.match(/\.jsx$/i)) {
            results.push(item);
        }
    }
}

/**
 * Check if path should be excluded
 * @param {String} path - File system path
 * @returns {Boolean} True if should be excluded
 */
function isExcludedPath(path) {
    for (var i = 0; i < CFG.excludedPaths.length; i++) {
        if (path.indexOf('/' + CFG.excludedPaths[i] + '/') !== -1 ||
            path.indexOf('\\' + CFG.excludedPaths[i] + '\\') !== -1) {
            return true;
        }
    }
    return false;
}

// ============================================================================
// METADATA PARSING
// ============================================================================

/**
 * Parse all scripts for metadata
 * @param {Array} scripts - Array of File objects
 * @returns {Array} Array of script metadata objects
 */
function parseAllScripts(scripts) {
    var results = [];

    for (var i = 0; i < scripts.length; i++) {
        var metadata = parseScript(scripts[i]);
        if (metadata) {
            results.push(metadata);
        }
    }

    return results;
}

/**
 * Parse a single script for metadata
 * @param {File} scriptFile - Script to parse
 * @returns {Object} Metadata object
 */
function parseScript(scriptFile) {
    try {
        scriptFile.encoding = 'UTF-8';
        scriptFile.open('r');
        var content = scriptFile.read();
        scriptFile.close();

        // Extract JSDoc header (first comment block)
        var headerMatch = content.match(/\/\*\*([\s\S]*?)\*\//);
        if (!headerMatch) {
            return null;
        }

        var header = headerMatch[1];

        // Parse metadata from header
        var metadata = {
            name: scriptFile.name.replace('.jsx', ''),
            file: scriptFile.name,
            path: scriptFile.fsName,
            category: scriptFile.parent.name,
            version: extractTag(header, '@version'),
            description: extractTag(header, '@description'),
            author: extractTag(header, '@author'),
            license: extractTag(header, '@license'),
            requires: extractTag(header, '@requires'),
            features: extractFeatures(header)
        };

        return metadata;

    } catch (e) {
        return null;
    }
}

/**
 * Extract a JSDoc tag value
 * @param {String} header - Header text
 * @param {String} tag - Tag name (e.g., '@version')
 * @returns {String} Tag value or empty string
 */
function extractTag(header, tag) {
    var regex = new RegExp(tag + '\\s+([^\\n]+)', 'i');
    var match = header.match(regex);
    return match ? match[1].trim() : '';
}

/**
 * Extract features list from header
 * @param {String} header - Header text
 * @returns {Array} Array of feature strings
 */
function extractFeatures(header) {
    var features = [];

    // Look for "Features:" section
    var featuresMatch = header.match(/Features:\s*([\s\S]*?)(?:\*\s*@|\*\s*$)/i);
    if (!featuresMatch) {
        return features;
    }

    var featuresText = featuresMatch[1];

    // Extract bullet points
    var lines = featuresText.split('\n');
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i].trim();
        // Match lines like "* - Feature description"
        if (line.match(/^\*\s*-\s*.+/)) {
            var feature = line.replace(/^\*\s*-\s*/, '').trim();
            if (feature) {
                features.push(feature);
            }
        }
    }

    return features;
}

// ============================================================================
// CATEGORIZATION
// ============================================================================

/**
 * Group scripts by category
 * @param {Array} scripts - Array of script metadata
 * @returns {Object} Object with category keys and script arrays
 */
function categorizeScripts(scripts) {
    var categorized = {};

    for (var i = 0; i < scripts.length; i++) {
        var script = scripts[i];
        var category = script.category;

        if (!categorized[category]) {
            categorized[category] = [];
        }

        categorized[category].push(script);
    }

    // Sort scripts within each category by name
    for (var cat in categorized) {
        if (categorized.hasOwnProperty(cat)) {
            categorized[cat].sort(function(a, b) {
                return a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1;
            });
        }
    }

    return categorized;
}

// ============================================================================
// README GENERATION
// ============================================================================

/**
 * Generate README.md content
 * @param {Object} categorized - Categorized scripts
 * @returns {String} Markdown content
 */
function generateREADME(categorized) {
    var lines = [];

    // Header
    lines.push('# Adobe Illustrator Scripts');
    lines.push('');
    lines.push('A modern, well-organized collection of Adobe Illustrator scripts built with the AIS (Adobe Illustrator Scripts) framework.');
    lines.push('');
    lines.push('**Status:** In active development');
    lines.push('**Total Scripts:** ' + countScripts(categorized));
    lines.push('**Categories:** ' + Object.keys(categorized).length);
    lines.push('');

    // Installation
    lines.push('## Installation');
    lines.push('');
    lines.push('1. Clone or download this repository');
    lines.push('2. Copy the script folders to your Adobe Illustrator Scripts folder:');
    lines.push('   - **macOS:** `/Applications/Adobe Illustrator [version]/Presets/[language]/Scripts/`');
    lines.push('   - **Windows:** `C:\\Program Files\\Adobe\\Adobe Illustrator [version]\\Presets\\[language]\\Scripts\\`');
    lines.push('3. Restart Adobe Illustrator');
    lines.push('4. Access scripts via **File → Scripts**');
    lines.push('');

    // Quick Start
    lines.push('## Quick Start');
    lines.push('');
    lines.push('### Recommended Scripts for New Users');
    lines.push('');
    lines.push('If you\'re new to this collection, start with these high-quality scripts:');
    lines.push('');
    if (categorized['Favorites']) {
        for (var i = 0; i < categorized['Favorites'].length; i++) {
            var script = categorized['Favorites'][i];
            lines.push('- **' + script.name + '** - ' + script.description);
        }
    }
    lines.push('');

    // Table of Contents
    lines.push('## Table of Contents');
    lines.push('');
    var sortedCategories = getSortedCategories(categorized);
    for (var i = 0; i < sortedCategories.length; i++) {
        var cat = sortedCategories[i];
        var count = categorized[cat].length;
        lines.push('- [' + cat + '](#' + cat.toLowerCase() + ') (' + count + ' script' + (count !== 1 ? 's' : '') + ')');
    }
    lines.push('');

    // Script Listings by Category
    lines.push('## Scripts by Category');
    lines.push('');

    for (var i = 0; i < sortedCategories.length; i++) {
        var cat = sortedCategories[i];
        var scripts = categorized[cat];

        lines.push('### ' + cat);
        lines.push('');

        for (var j = 0; j < scripts.length; j++) {
            var script = scripts[j];

            lines.push('#### ' + script.name);
            if (script.version) {
                lines.push('**Version:** ' + script.version + '  ');
            }
            if (script.description) {
                lines.push('**Description:** ' + script.description + '  ');
            }
            if (script.requires) {
                lines.push('**Requires:** ' + script.requires + '  ');
            }

            if (script.features && script.features.length > 0) {
                lines.push('');
                lines.push('**Features:**');
                for (var k = 0; k < script.features.length; k++) {
                    lines.push('- ' + script.features[k]);
                }
            }

            lines.push('');
            lines.push('---');
            lines.push('');
        }
    }

    // Usage Guide
    lines.push('## Usage');
    lines.push('');
    lines.push('All scripts in this collection:');
    lines.push('- Are compatible with Adobe Illustrator CS4 or higher');
    lines.push('- Use the AIS library for consistent behavior');
    lines.push('- Feature English-only UI');
    lines.push('- Include comprehensive error handling');
    lines.push('- Save settings between sessions');
    lines.push('');

    // Development
    lines.push('## Development');
    lines.push('');
    lines.push('### AIS Framework');
    lines.push('');
    lines.push('All scripts use the AIS (Adobe Illustrator Scripts) framework, located in `lib/core.jsx`. This provides:');
    lines.push('');
    lines.push('- **Unit conversion:** Handle all Illustrator units (px, pt, mm, cm, in, pc)');
    lines.push('- **Error handling:** Consistent error reporting and logging');
    lines.push('- **JSON support:** Save/load settings and data');
    lines.push('- **System utilities:** Cross-platform file operations');
    lines.push('- **Document helpers:** Common document and selection operations');
    lines.push('');

    lines.push('### Testing');
    lines.push('');
    lines.push('Use the included testing utilities:');
    lines.push('');
    lines.push('- **PreFlightCheck.jsx** - Validate all scripts for common errors');
    lines.push('- **RunAllTests.jsx** - Run automated tests on all scripts');
    lines.push('');

    // Contributing
    lines.push('## Contributing');
    lines.push('');
    lines.push('See `CLAUDE.md` for contribution guidelines and modernization methodology.');
    lines.push('');

    // License
    lines.push('## License');
    lines.push('');
    lines.push('MIT License - See individual script headers for author credits.');
    lines.push('');

    // Footer
    lines.push('---');
    lines.push('');
    lines.push('*Documentation auto-generated by GenerateScriptDocs.jsx on ' + new Date().toISOString().split('T')[0] + '*');

    return lines.join('\n');
}

/**
 * Count total scripts
 * @param {Object} categorized - Categorized scripts
 * @returns {Number} Total count
 */
function countScripts(categorized) {
    var count = 0;
    for (var cat in categorized) {
        if (categorized.hasOwnProperty(cat)) {
            count += categorized[cat].length;
        }
    }
    return count;
}

/**
 * Get sorted category names
 * @param {Object} categorized - Categorized scripts
 * @returns {Array} Sorted category names
 */
function getSortedCategories(categorized) {
    var categories = [];
    for (var cat in categorized) {
        if (categorized.hasOwnProperty(cat)) {
            categories.push(cat);
        }
    }

    // Sort with Favorites first, then alphabetically
    categories.sort(function(a, b) {
        if (a === 'Favorites') return -1;
        if (b === 'Favorites') return 1;
        return a < b ? -1 : 1;
    });

    return categories;
}

// ============================================================================
// FILE SAVING
// ============================================================================

/**
 * Save README.md to project root
 * @param {Folder} projectRoot - Project root folder
 * @param {String} content - Markdown content
 * @returns {String} Path to saved file
 */
function saveREADME(projectRoot, content) {
    var readmeFile = new File(projectRoot.fsName + '/README.md');
    readmeFile.encoding = 'UTF-8';
    readmeFile.open('w');
    readmeFile.write(content);
    readmeFile.close();

    return readmeFile.fsName;
}
