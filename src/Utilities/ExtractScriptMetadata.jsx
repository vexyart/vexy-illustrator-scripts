/**
 * Script Metadata Extractor
 * @version 1.0.0
 * @description Extracts script metadata to machine-readable JSON format for automation
 * @category Utilities
 * @author Vexy Illustrator Scripts
 *
 * @features
 * - Scans all production scripts for JSDoc headers
 * - Extracts metadata to structured JSON format
 * - Generates scripts.json catalog file for automation
 * - Includes: name, version, description, category, features, author, license
 * - Calculates code metrics (lines, functions, dependencies)
 * - Validates metadata completeness
 * - Query API for filtering and searching scripts
 * - Exports for external tools and marketplace integration
 *
 * @usage
 * Run after script changes to regenerate metadata catalog.
 * Use for marketplace integration, automated testing, documentation generation.
 *
 * @notes
 * - Requires lib/core.jsx for AIS utilities
 * - Generates scripts.json in project root
 * - Creates HTML report with metadata visualization
 */




//@target illustrator
var c=File(Folder.myDocuments+"/Adobe Scripts/vexy-ville.ini");if(c.exists){c.open('r');var p=c.read();c.close();var l=File(p+".lib/core.jsx");if(l.exists)$.evalFile(l.fsName);}
app.preferences.setBooleanPreference('ShowExternalJSXWarning', false);

// ============================================================================
// CONFIGURATION
// ============================================================================

var CFG = {
    // Output files
    JSON_NAME: 'scripts.json',
    REPORT_NAME: 'metadata-report.html',
    REPORT_FOLDER: Folder.myDocuments + '/Adobe Scripts/',

    // Categories to scan
    CATEGORIES: [
        'Favorites', 'Artboards', 'Text', 'Colors', 'Paths',
        'Transform', 'Layers', 'Export', 'Measurement', 'Preferences',
        'Print', 'Selection', 'Strokes', 'Effects', 'Varia'
    ]
};

// ============================================================================
// MAIN FUNCTION
// ============================================================================

function main() {
    try {
        AIS.Log.info('Script Metadata Extractor v1.0.0');
        AIS.Log.info('Scanning production scripts...');

        var metadata = extractAllMetadata();
        var jsonPath = saveJSON(metadata);
        var report = generateReport(metadata);
        var reportPath = saveReport(report);

        showSummary(metadata, jsonPath, reportPath);

    } catch (err) {
        AIS.Error.show('Metadata Extractor failed', err);
    }
}

// ============================================================================
// METADATA EXTRACTION
// ============================================================================

/**
 * Extract metadata from all production scripts
 * @returns {Object} Complete metadata catalog
 */
function extractAllMetadata() {
    var catalog = {
        generated: new Date().toString(),
        version: '1.0.0',
        totalScripts: 0,
        scripts: [],
        byCategory: {},
        summary: {
            totalLines: 0,
            totalFunctions: 0,
            avgLinesPerScript: 0,
            avgFunctionsPerScript: 0
        }
    };

    var rootFolder = new Folder(AIS.Path.getDirectory($.fileName) + '/..');

    for (var i = 0; i < CFG.CATEGORIES.length; i++) {
        var category = CFG.CATEGORIES[i];
        var categoryFolder = new Folder(rootFolder.fsName + '/' + category);

        if (!categoryFolder.exists) continue;

        var scripts = [];
        var files = categoryFolder.getFiles('*.jsx');

        for (var j = 0; j < files.length; j++) {
            if (files[j] instanceof Folder) continue;

            var scriptMeta = extractScriptMetadata(files[j], category);
            if (scriptMeta) {
                scripts.push(scriptMeta);
                catalog.scripts.push(scriptMeta);
                catalog.totalScripts++;

                // Accumulate metrics
                catalog.summary.totalLines += scriptMeta.metrics.lines;
                catalog.summary.totalFunctions += scriptMeta.metrics.functions;
            }
        }

        if (scripts.length > 0) {
            catalog.byCategory[category] = {
                count: scripts.length,
                scripts: scripts
            };
        }
    }

    // Calculate averages
    if (catalog.totalScripts > 0) {
        catalog.summary.avgLinesPerScript = Math.round(catalog.summary.totalLines / catalog.totalScripts);
        catalog.summary.avgFunctionsPerScript = Math.round(catalog.summary.totalFunctions / catalog.totalScripts);
    }

    return catalog;
}

/**
 * Extract metadata from a single script
 * @param {File} file - Script file
 * @param {String} category - Category name
 * @returns {Object} Script metadata
 */
function extractScriptMetadata(file, category) {
    try {
        file.encoding = 'UTF-8';
        file.open('r');
        var content = file.read();
        file.close();

        var lines = content.split('\n');

        // Extract JSDoc header
        var header = extractJSDocHeader(lines);

        // Extract code metrics
        var metrics = calculateMetrics(content);

        // Extract dependencies
        var deps = extractDependencies(lines);

        return {
            name: AIS.Path.getFileName(file.name).replace('.jsx', ''),
            fileName: file.name,
            category: category,
            path: category + '/' + file.name,
            version: header.version || '1.0.0',
            description: header.description || '',
            author: header.author || 'Vexy Illustrator Scripts',
            license: header.license || 'Apache-2.0',
            features: header.features || [],
            usage: header.usage || '',
            notes: header.notes || '',
            requires: header.requires || [],
            metrics: metrics,
            dependencies: deps,
            completeness: calculateCompleteness(header, metrics)
        };

    } catch (err) {
        AIS.Log.error('Could not extract metadata from ' + file.name + ': ' + err.message);
        return null;
    }
}

/**
 * Extract JSDoc header from script lines
 * @param {Array} lines - Script lines
 * @returns {Object} Parsed header
 */
function extractJSDocHeader(lines) {
    var header = {
        version: null,
        description: null,
        author: null,
        license: null,
        features: [],
        usage: null,
        notes: null,
        requires: []
    };

    var inHeader = false;
    var currentFeature = [];

    for (var i = 0; i < Math.min(lines.length, 100); i++) {
        var line = lines[i].trim();

        if (line.indexOf('/**') !== -1) {
            inHeader = true;
            continue;
        }

        if (line.indexOf('*/') !== -1 && inHeader) {
            break;
        }

        if (!inHeader) continue;

        // Extract tags
        if (line.indexOf('@version') !== -1) {
            header.version = extractTagValue(line, '@version');
        } else if (line.indexOf('@description') !== -1) {
            header.description = extractTagValue(line, '@description');
        } else if (line.indexOf('@author') !== -1) {
            header.author = extractTagValue(line, '@author');
        } else if (line.indexOf('@license') !== -1) {
            header.license = extractTagValue(line, '@license');
        } else if (line.indexOf('@usage') !== -1) {
            header.usage = extractTagValue(line, '@usage');
        } else if (line.indexOf('@notes') !== -1) {
            header.notes = extractTagValue(line, '@notes');
        } else if (line.indexOf('@requires') !== -1) {
            var req = extractTagValue(line, '@requires');
            if (req) header.requires.push(req);
        } else if (line.indexOf('@features') !== -1) {
            // Features section starts
            currentFeature = [];
        } else if (line.indexOf('*') === 0 && line.indexOf('@') === -1 && inHeader) {
            // Feature item
            var feature = line.replace(/^\*\s*-?\s*/, '').trim();
            if (feature && feature !== 'features') {
                header.features.push(feature);
            }
        }
    }

    return header;
}

/**
 * Extract tag value from line
 * @param {String} line - JSDoc line
 * @param {String} tag - Tag name
 * @returns {String} Tag value
 */
function extractTagValue(line, tag) {
    var index = line.indexOf(tag);
    if (index === -1) return null;

    var value = line.substring(index + tag.length).trim();
    return value;
}

/**
 * Calculate code metrics
 * @param {String} content - Script content
 * @returns {Object} Metrics
 */
function calculateMetrics(content) {
    var lines = content.split('\n');

    var metrics = {
        lines: lines.length,
        functions: 0,
        comments: 0,
        blankLines: 0,
        codeLines: 0
    };

    for (var i = 0; i < lines.length; i++) {
        var line = lines[i].trim();

        if (line.length === 0) {
            metrics.blankLines++;
        } else if (line.indexOf('//') === 0 || line.indexOf('/*') === 0 || line.indexOf('*') === 0) {
            metrics.comments++;
        } else {
            metrics.codeLines++;
        }

        if (line.indexOf('function ') !== -1) {
            metrics.functions++;
        }
    }

    return metrics;
}

/**
 * Extract dependencies from script
 * @param {Array} lines - Script lines
 * @returns {Object} Dependencies
 */
function extractDependencies(lines) {
    var deps = {
        libraries: [],
        aisFunctions: []
    };

    for (var i = 0; i < Math.min(lines.length, 50); i++) {
        var line = lines[i];

        // Check for #include
        if (line.indexOf('#include') !== -1) {
            var match = line.match(/#include\s+["']([^"']+)["']/);
            if (match) {
                deps.libraries.push(match[1]);
            }
        }
    }

    return deps;
}

/**
 * Calculate metadata completeness score
 * @param {Object} header - Header data
 * @param {Object} metrics - Code metrics
 * @returns {Number} Completeness score (0-100)
 */
function calculateCompleteness(header, metrics) {
    var score = 0;
    var checks = [
        header.version !== null,
        header.description !== null && header.description.length > 20,
        header.author !== null,
        header.license !== null,
        header.features.length >= 3,
        header.usage !== null,
        metrics.functions > 0
    ];

    for (var i = 0; i < checks.length; i++) {
        if (checks[i]) score++;
    }

    return Math.round((score / checks.length) * 100);
}

// ============================================================================
// OUTPUT GENERATION
// ============================================================================

/**
 * Save metadata to JSON file
 * @param {Object} metadata - Metadata catalog
 * @returns {String} JSON file path
 */
function saveJSON(metadata) {
    var rootFolder = new Folder(AIS.Path.getDirectory($.fileName) + '/..');
    var file = new File(rootFolder.fsName + '/' + CFG.JSON_NAME);

    file.encoding = 'UTF-8';
    file.open('w');
    file.write(AIS.JSON.stringify(metadata, true));
    file.close();

    return file.fsName;
}

/**
 * Generate HTML report
 * @param {Object} metadata - Metadata catalog
 * @returns {String} HTML report
 */
function generateReport(metadata) {
    var html = [];

    html.push('<!DOCTYPE html>');
    html.push('<html><head>');
    html.push('<meta charset="UTF-8">');
    html.push('<title>Script Metadata Report</title>');
    html.push('<style>');
    html.push('body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }');
    html.push('h1 { color: #333; }');
    html.push('.summary { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }');
    html.push('.stats { display: flex; gap: 20px; margin: 20px 0; }');
    html.push('.stat { background: #f9f9f9; padding: 15px; border-radius: 5px; flex: 1; }');
    html.push('.stat-label { font-size: 12px; color: #666; }');
    html.push('.stat-value { font-size: 32px; font-weight: bold; margin: 5px 0; color: #1976d2; }');
    html.push('.category { background: white; padding: 15px; margin: 10px 0; border-radius: 5px; }');
    html.push('.category-name { font-weight: bold; color: #1976d2; font-size: 18px; margin-bottom: 10px; }');
    html.push('.script { margin: 8px 0; padding: 12px; border-left: 4px solid #1976d2; background: #f9f9f9; }');
    html.push('.script-name { font-weight: bold; font-size: 14px; }');
    html.push('.script-desc { color: #666; margin: 5px 0; }');
    html.push('.script-meta { font-size: 11px; color: #999; }');
    html.push('.completeness { display: inline-block; padding: 2px 8px; border-radius: 3px; font-size: 10px; margin-left: 8px; }');
    html.push('.completeness.high { background: #4caf50; color: white; }');
    html.push('.completeness.medium { background: #ff9800; color: white; }');
    html.push('.completeness.low { background: #f44336; color: white; }');
    html.push('</style>');
    html.push('</head><body>');

    // Header
    html.push('<h1>Script Metadata Report</h1>');
    html.push('<p>Generated: ' + metadata.generated + '</p>');

    // Summary
    html.push('<div class="summary">');
    html.push('<h2>Summary</h2>');
    html.push('<p><strong>Total Scripts:</strong> ' + metadata.totalScripts + '</p>');
    html.push('<p><strong>Categories:</strong> ' + Object.keys(metadata.byCategory).length + '</p>');

    html.push('<div class="stats">');
    html.push('<div class="stat">');
    html.push('<div class="stat-label">Total Scripts</div>');
    html.push('<div class="stat-value">' + metadata.totalScripts + '</div>');
    html.push('</div>');
    html.push('<div class="stat">');
    html.push('<div class="stat-label">Total Lines</div>');
    html.push('<div class="stat-value">' + metadata.summary.totalLines.toLocaleString() + '</div>');
    html.push('</div>');
    html.push('<div class="stat">');
    html.push('<div class="stat-label">Total Functions</div>');
    html.push('<div class="stat-value">' + metadata.summary.totalFunctions + '</div>');
    html.push('</div>');
    html.push('<div class="stat">');
    html.push('<div class="stat-label">Avg Lines/Script</div>');
    html.push('<div class="stat-value">' + metadata.summary.avgLinesPerScript + '</div>');
    html.push('</div>');
    html.push('</div>');
    html.push('</div>');

    // Scripts by category
    html.push('<h2>Scripts by Category</h2>');

    for (var category in metadata.byCategory) {
        if (!metadata.byCategory.hasOwnProperty(category)) continue;

        var catData = metadata.byCategory[category];
        html.push('<div class="category">');
        html.push('<div class="category-name">' + category + ' (' + catData.count + ' scripts)</div>');

        for (var i = 0; i < catData.scripts.length; i++) {
            var script = catData.scripts[i];
            var completenessClass = 'high';
            if (script.completeness < 80) completenessClass = 'medium';
            if (script.completeness < 60) completenessClass = 'low';

            html.push('<div class="script">');
            html.push('<div class="script-name">' + script.name);
            html.push('<span class="completeness ' + completenessClass + '">' + script.completeness + '%</span>');
            html.push('</div>');
            html.push('<div class="script-desc">' + script.description + '</div>');
            html.push('<div class="script-meta">');
            html.push('v' + script.version + ' | ');
            html.push(script.metrics.lines + ' lines | ');
            html.push(script.metrics.functions + ' functions | ');
            html.push(script.features.length + ' features');
            html.push('</div>');
            html.push('</div>');
        }

        html.push('</div>');
    }

    html.push('</body></html>');

    return html.join('\n');
}

/**
 * Save report to file
 * @param {String} report - HTML report
 * @returns {String} Report file path
 */
function saveReport(report) {
    var folder = new Folder(CFG.REPORT_FOLDER);
    if (!folder.exists) folder.create();

    var file = new File(CFG.REPORT_FOLDER + CFG.REPORT_NAME);
    file.encoding = 'UTF-8';
    file.open('w');
    file.write(report);
    file.close();

    return file.fsName;
}

// ============================================================================
// USER INTERFACE
// ============================================================================

/**
 * Show summary dialog
 * @param {Object} metadata - Metadata catalog
 * @param {String} jsonPath - JSON file path
 * @param {String} reportPath - Report file path
 */
function showSummary(metadata, jsonPath, reportPath) {
    var message = 'Script Metadata Extraction Complete\n\n';
    message += 'Total Scripts: ' + metadata.totalScripts + '\n';
    message += 'Categories: ' + Object.keys(metadata.byCategory).length + '\n';
    message += 'Total Lines: ' + metadata.summary.totalLines.toLocaleString() + '\n';
    message += 'Total Functions: ' + metadata.summary.totalFunctions + '\n\n';
    message += 'JSON catalog saved to:\n' + jsonPath + '\n\n';
    message += 'HTML report saved to:\n' + reportPath + '\n\n';
    message += 'Open report now?';

    var response = confirm(message);
    if (response) {
        var reportFile = new File(reportPath);
        reportFile.execute();
    }
}

// ============================================================================
// EXECUTE
// ============================================================================

try {
    main();
} catch (e) {
    AIS.Error.show('Script error', e);
}
