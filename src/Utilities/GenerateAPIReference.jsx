/**
 * Generate API Reference Documentation
 * @version 1.0.0
 * @description Parse AIS library and generate comprehensive API reference documentation
 *
 * @category Utilities
 * @author Vexy Team
 * @license MIT
 *
 * @features
 * - Parse lib/core.jsx and lib/ui.jsx for JSDoc comments
 * - Extract all AIS.* functions with signatures and parameters
 * - Generate docs/AIS_API_REFERENCE.md with table of contents
 * - Create HTML version with syntax highlighting
 * - Show which scripts use each library function
 * - Alphabetical index for quick reference
 * - Module-based organization (Units, JSON, String, etc.)
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
    scriptName: 'GenerateAPIReference',
    version: '1.0.0',

    // Libraries to document
    libraries: [
        {name: 'core', path: 'lib/core.jsx', namespace: 'AIS'},
        {name: 'ui', path: 'lib/ui.jsx', namespace: 'AIS.UI'}
    ],

    // Output paths
    outputMD: 'docs/AIS_API_REFERENCE.md',
    outputHTML: 'docs/AIS_API_REFERENCE.html',

    // Folders to scan for usage
    scanFolders: [
        'Favorites', 'Text', 'Export', 'Measurement', 'Utilities',
        'Artboards', 'Colors', 'Layers', 'Paths', 'Transform',
        'Selection', 'Print', 'Effects', 'Guides', 'Layout',
        'Strokes', 'Preferences', 'Varia', 'tests'
    ]
};

// ============================================================================
// MAIN FUNCTION
// ============================================================================

function main() {
    try {
        // Parse libraries
        var apiData = parseLibraries();
        if (!apiData || apiData.functions.length === 0) {
            alert('No API functions found\nCheck that lib/core.jsx exists');
            return;
        }

        // Analyze usage in scripts
        var usage = analyzeUsage(apiData.functions);

        // Merge usage data
        mergeUsageData(apiData.functions, usage);

        // Generate Markdown documentation
        var mdPath = generateMarkdownDoc(apiData);

        // Generate HTML documentation
        var htmlPath = generateHTMLDoc(apiData);

        // Show success
        showSuccess(mdPath, htmlPath, apiData.functions.length);

    } catch (err) {
        AIS.Error.show('Failed to generate API reference', err);
    }
}

// ============================================================================
// CORE LOGIC
// ============================================================================

/**
 * Parse all libraries and extract API functions
 */
function parseLibraries() {
    var projectRoot = getProjectRoot();
    var allFunctions = [];
    var modules = {};

    for (var i = 0; i < CFG.libraries.length; i++) {
        var lib = CFG.libraries[i];
        var libPath = projectRoot + '/' + lib.path;
        var libFile = new File(libPath);

        if (!libFile.exists) continue;

        // Read library file
        libFile.encoding = 'UTF-8';
        libFile.open('r');
        var content = libFile.read();
        libFile.close();

        // Parse functions
        var functions = parseFunctions(content, lib.namespace);
        allFunctions = allFunctions.concat(functions);

        // Group by module
        for (var j = 0; j < functions.length; j++) {
            var func = functions[j];
            if (!modules[func.module]) {
                modules[func.module] = [];
            }
            modules[func.module].push(func);
        }
    }

    return {
        functions: allFunctions,
        modules: modules
    };
}

/**
 * Parse functions from library content
 */
function parseFunctions(content, namespace) {
    var functions = [];
    var lines = content.split('\n');

    for (var i = 0; i < lines.length; i++) {
        var line = lines[i];

        // Look for function definitions in object literal pattern
        // Example: AIS.Units = { convert: function(...) { ... } }
        var funcMatch = line.match(/(\w+):\s*function\s*\(([^)]*)\)/);
        if (funcMatch) {
            var funcName = funcMatch[1];
            var params = funcMatch[2];

            // Find JSDoc comment above (search backwards)
            var jsdoc = extractJSDoc(lines, i);

            // Determine module (look for pattern: AIS.ModuleName = {)
            var module = findModule(lines, i);

            functions.push({
                name: funcName,
                params: parseParams(params),
                module: module || 'Core',
                fullName: module ? namespace + '.' + module + '.' + funcName : namespace + '.' + funcName,
                description: jsdoc.description,
                returns: jsdoc.returns,
                example: jsdoc.example,
                usedBy: []
            });
        }
    }

    return functions;
}

/**
 * Extract JSDoc comment above a function
 */
function extractJSDoc(lines, functionLineIndex) {
    var jsdoc = {
        description: '',
        params: [],
        returns: '',
        example: ''
    };

    var inJSDoc = false;
    var jsdocLines = [];

    // Search backwards from function line
    for (var i = functionLineIndex - 1; i >= 0 && i >= functionLineIndex - 20; i--) {
        var line = lines[i];

        if (line.match(/\*\//)) {
            inJSDoc = true;
            continue;
        }

        if (inJSDoc) {
            if (line.match(/\/\*\*/)) {
                break;  // Found start of JSDoc
            }
            jsdocLines.unshift(line);
        }
    }

    // Parse JSDoc lines
    var currentSection = 'description';
    var descLines = [];

    for (var i = 0; i < jsdocLines.length; i++) {
        var line = jsdocLines[i].replace(/^\s*\*\s?/, '');  // Remove leading * and space

        if (line.match(/^@param/)) {
            currentSection = 'params';
            var paramMatch = line.match(/@param\s+\{([^}]+)\}\s+(\w+)\s*-?\s*(.*)/);
            if (paramMatch) {
                jsdoc.params.push({
                    type: paramMatch[1],
                    name: paramMatch[2],
                    description: paramMatch[3]
                });
            }
        } else if (line.match(/^@returns?/)) {
            currentSection = 'returns';
            var returnMatch = line.match(/@returns?\s+\{([^}]+)\}\s*(.*)/);
            if (returnMatch) {
                jsdoc.returns = returnMatch[2] || returnMatch[1];
            }
        } else if (line.match(/^@example/)) {
            currentSection = 'example';
        } else {
            if (currentSection === 'description' && line) {
                descLines.push(line);
            } else if (currentSection === 'example' && line) {
                jsdoc.example += (jsdoc.example ? '\n' : '') + line;
            }
        }
    }

    jsdoc.description = descLines.join(' ');

    return jsdoc;
}

/**
 * Find module name for a function
 */
function findModule(lines, functionLineIndex) {
    // Search backwards for pattern: AIS.ModuleName = {
    for (var i = functionLineIndex; i >= 0 && i >= functionLineIndex - 50; i--) {
        var line = lines[i];
        var moduleMatch = line.match(/AIS\.(\w+)\s*=\s*\{/);
        if (moduleMatch) {
            return moduleMatch[1];
        }
    }
    return null;
}

/**
 * Parse function parameters
 */
function parseParams(paramString) {
    if (!paramString || !paramString.trim()) return [];

    var params = paramString.split(',');
    var result = [];

    for (var i = 0; i < params.length; i++) {
        var param = params[i].trim();
        if (param) {
            result.push({name: param});
        }
    }

    return result;
}

/**
 * Analyze which scripts use which library functions
 */
function analyzeUsage(functions) {
    var usage = {};  // {functionName: [scriptFile1, scriptFile2, ...]}

    for (var i = 0; i < functions.length; i++) {
        usage[functions[i].fullName] = [];
    }

    var projectRoot = getProjectRoot();

    for (var i = 0; i < CFG.scanFolders.length; i++) {
        var folderPath = projectRoot + '/' + CFG.scanFolders[i];
        var folder = new Folder(folderPath);

        if (!folder.exists) continue;

        var files = folder.getFiles('*.jsx');
        for (var j = 0; j < files.length; j++) {
            if (!(files[j] instanceof File)) continue;

            var file = files[j];
            file.encoding = 'UTF-8';
            file.open('r');
            var content = file.read();
            file.close();

            // Check for each function usage
            for (var k = 0; k < functions.length; k++) {
                var func = functions[k];
                if (content.indexOf(func.fullName) > -1) {
                    usage[func.fullName].push(CFG.scanFolders[i] + '/' + file.name);
                }
            }
        }
    }

    return usage;
}

/**
 * Merge usage data into functions array
 */
function mergeUsageData(functions, usage) {
    for (var i = 0; i < functions.length; i++) {
        var func = functions[i];
        func.usedBy = usage[func.fullName] || [];
    }
}

/**
 * Generate Markdown documentation
 */
function generateMarkdownDoc(apiData) {
    var lines = [];

    // Title
    lines.push('# AIS Library API Reference');
    lines.push('');
    lines.push('**Generated:** ' + new Date().toString());
    lines.push('');
    lines.push('**Version:** ' + (AIS.Core && AIS.Core.version ? AIS.Core.version : '1.0.0'));
    lines.push('');

    // Introduction
    lines.push('## Introduction');
    lines.push('');
    lines.push('The AIS (Adobe Illustrator Scripts) library provides a comprehensive set of utilities');
    lines.push('for developing scripts in Adobe Illustrator. All functions are organized under the');
    lines.push('`AIS` namespace to avoid global pollution.');
    lines.push('');

    // Table of Contents
    lines.push('## Table of Contents');
    lines.push('');
    var moduleNames = [];
    for (var moduleName in apiData.modules) {
        moduleNames.push(moduleName);
    }
    moduleNames.sort();

    for (var i = 0; i < moduleNames.length; i++) {
        var moduleName = moduleNames[i];
        var anchor = moduleName.toLowerCase().replace(/\s+/g, '-');
        lines.push('- [AIS.' + moduleName + '](#' + anchor + ')');
    }
    lines.push('');

    // Function reference by module
    lines.push('## Function Reference');
    lines.push('');

    for (var i = 0; i < moduleNames.length; i++) {
        var moduleName = moduleNames[i];
        var functions = apiData.modules[moduleName];

        lines.push('### AIS.' + moduleName);
        lines.push('');

        for (var j = 0; j < functions.length; j++) {
            var func = functions[j];

            // Function signature
            var signature = func.fullName + '(';
            var paramNames = [];
            for (var k = 0; k < func.params.length; k++) {
                paramNames.push(func.params[k].name);
            }
            signature += paramNames.join(', ') + ')';

            lines.push('#### `' + signature + '`');
            lines.push('');

            if (func.description) {
                lines.push(func.description);
                lines.push('');
            }

            // Parameters
            if (func.params.length > 0) {
                lines.push('**Parameters:**');
                lines.push('');
                for (var k = 0; k < func.params.length; k++) {
                    var param = func.params[k];
                    lines.push('- `' + param.name + '` ― ' + (param.description || ''));
                }
                lines.push('');
            }

            // Returns
            if (func.returns) {
                lines.push('**Returns:** ' + func.returns);
                lines.push('');
            }

            // Example
            if (func.example) {
                lines.push('**Example:**');
                lines.push('');
                lines.push('```javascript');
                lines.push(func.example);
                lines.push('```');
                lines.push('');
            }

            // Used by
            if (func.usedBy.length > 0) {
                lines.push('**Used by:** ' + func.usedBy.length + ' script(s)');
                lines.push('');
                var displayCount = Math.min(func.usedBy.length, 5);
                for (var k = 0; k < displayCount; k++) {
                    lines.push('- ' + func.usedBy[k]);
                }
                if (func.usedBy.length > 5) {
                    lines.push('- ... and ' + (func.usedBy.length - 5) + ' more');
                }
                lines.push('');
            }

            lines.push('---');
            lines.push('');
        }
    }

    // Alphabetical index
    lines.push('## Alphabetical Index');
    lines.push('');

    var allFunctions = apiData.functions.slice();
    allFunctions.sort(function(a, b) {
        return a.name < b.name ? -1 : 1;
    });

    for (var i = 0; i < allFunctions.length; i++) {
        var func = allFunctions[i];
        lines.push('- [`' + func.fullName + '()`](#' + func.name.toLowerCase() + ')');
    }
    lines.push('');

    // Save Markdown file
    var projectRoot = getProjectRoot();
    var mdFile = new File(projectRoot + '/' + CFG.outputMD);
    mdFile.encoding = 'UTF-8';
    mdFile.open('w');
    mdFile.write(lines.join('\n'));
    mdFile.close();

    return mdFile.fsName;
}

/**
 * Generate HTML documentation
 */
function generateHTMLDoc(apiData) {
    var html = [];

    html.push('<!DOCTYPE html>');
    html.push('<html><head><meta charset="UTF-8">');
    html.push('<title>AIS Library API Reference</title>');
    html.push('<style>');
    html.push('body { font-family: "Segoe UI", Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }');
    html.push('.container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }');
    html.push('h1 { color: #2962FF; border-bottom: 3px solid #2962FF; padding-bottom: 10px; }');
    html.push('h2 { color: #424242; border-bottom: 1px solid #ddd; padding-bottom: 8px; margin-top: 40px; }');
    html.push('h3 { color: #2962FF; margin-top: 30px; }');
    html.push('h4 { color: #424242; margin-top: 20px; }');
    html.push('code { background: #f0f0f0; padding: 2px 6px; border-radius: 3px; font-family: "Courier New", monospace; }');
    html.push('pre { background: #f5f5f5; border-left: 4px solid #2962FF; padding: 15px; overflow-x: auto; }');
    html.push('pre code { background: none; padding: 0; }');
    html.push('.function { background: #fafafa; border: 1px solid #e0e0e0; padding: 20px; margin: 20px 0; border-radius: 4px; }');
    html.push('.params { background: #fff; padding: 10px; margin: 10px 0; }');
    html.push('.param { margin: 8px 0; }');
    html.push('.used-by { background: #e3f2fd; padding: 10px; border-radius: 4px; margin: 10px 0; }');
    html.push('.toc { background: #f0f0f0; padding: 20px; border-radius: 4px; margin: 20px 0; }');
    html.push('.toc ul { column-count: 2; }');
    html.push('</style></head><body>');

    html.push('<div class="container">');

    // Title
    html.push('<h1>AIS Library API Reference</h1>');
    html.push('<p><strong>Generated:</strong> ' + new Date().toString() + '</p>');
    html.push('<p><strong>Total Functions:</strong> ' + apiData.functions.length + '</p>');

    // TOC
    html.push('<div class="toc">');
    html.push('<h2>Modules</h2>');
    html.push('<ul>');
    var moduleNames = [];
    for (var moduleName in apiData.modules) {
        moduleNames.push(moduleName);
    }
    moduleNames.sort();

    for (var i = 0; i < moduleNames.length; i++) {
        var moduleName = moduleNames[i];
        var count = apiData.modules[moduleName].length;
        html.push('<li><a href="#' + moduleName + '">AIS.' + moduleName + '</a> (' + count + ' functions)</li>');
    }
    html.push('</ul>');
    html.push('</div>');

    // Function reference
    for (var i = 0; i < moduleNames.length; i++) {
        var moduleName = moduleNames[i];
        var functions = apiData.modules[moduleName];

        html.push('<h2 id="' + moduleName + '">AIS.' + moduleName + '</h2>');

        for (var j = 0; j < functions.length; j++) {
            var func = functions[j];

            html.push('<div class="function">');

            var signature = func.fullName + '(';
            var paramNames = [];
            for (var k = 0; k < func.params.length; k++) {
                paramNames.push(func.params[k].name);
            }
            signature += paramNames.join(', ') + ')';

            html.push('<h4><code>' + signature + '</code></h4>');

            if (func.description) {
                html.push('<p>' + func.description + '</p>');
            }

            if (func.params.length > 0) {
                html.push('<div class="params">');
                html.push('<strong>Parameters:</strong>');
                for (var k = 0; k < func.params.length; k++) {
                    var param = func.params[k];
                    html.push('<div class="param">');
                    html.push('<code>' + param.name + '</code> ― ' + (param.description || ''));
                    html.push('</div>');
                }
                html.push('</div>');
            }

            if (func.returns) {
                html.push('<p><strong>Returns:</strong> ' + func.returns + '</p>');
            }

            if (func.example) {
                html.push('<p><strong>Example:</strong></p>');
                html.push('<pre><code>' + func.example + '</code></pre>');
            }

            if (func.usedBy.length > 0) {
                html.push('<div class="used-by">');
                html.push('<strong>Used by ' + func.usedBy.length + ' script(s):</strong> ');
                var displayCount = Math.min(func.usedBy.length, 5);
                var scripts = [];
                for (var k = 0; k < displayCount; k++) {
                    scripts.push(func.usedBy[k]);
                }
                html.push(scripts.join(', '));
                if (func.usedBy.length > 5) {
                    html.push(' <em>(and ' + (func.usedBy.length - 5) + ' more)</em>');
                }
                html.push('</div>');
            }

            html.push('</div>');  // .function
        }
    }

    html.push('</div>');  // .container
    html.push('</body></html>');

    // Save HTML file
    var projectRoot = getProjectRoot();
    var htmlFile = new File(projectRoot + '/' + CFG.outputHTML);
    htmlFile.encoding = 'UTF-8';
    htmlFile.open('w');
    htmlFile.write(html.join('\n'));
    htmlFile.close();

    return htmlFile.fsName;
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
 * Show success dialog
 */
function showSuccess(mdPath, htmlPath, functionCount) {
    var dialog = new Window('dialog', 'API Documentation Generated!');
    dialog.alignChildren = ['fill', 'top'];
    dialog.spacing = 10;
    dialog.margins = 15;

    dialog.add('statictext', undefined, 'API reference documentation generated successfully!');
    dialog.add('statictext', undefined, 'Total functions documented: ' + functionCount);
    dialog.add('statictext', undefined, '');

    dialog.add('statictext', undefined, 'Markdown file:');
    var mdText = dialog.add('edittext', undefined, mdPath, {readonly: true});
    mdText.preferredSize.width = 450;

    dialog.add('statictext', undefined, 'HTML file:');
    var htmlText = dialog.add('edittext', undefined, htmlPath, {readonly: true});
    htmlText.preferredSize.width = 450;

    var openHTMLBtn = dialog.add('button', undefined, 'Open HTML in Browser');
    openHTMLBtn.onClick = function() {
        var htmlFile = new File(htmlPath);
        htmlFile.execute();
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
    AIS.Error.show('GenerateAPIReference error', e);
}
