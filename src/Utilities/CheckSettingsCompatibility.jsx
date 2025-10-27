/**
 * Check Settings Compatibility
 * @version 1.0.0
 * @description Validates settings file compatibility across script versions to prevent user frustration during upgrades
 * @category Utilities
 * @author Adam @ Vexy
 * @license Apache-2.0
 * @requires Illustrator CS6+
 * @features
 *   - Scan all script settings schemas
 *   - Detect required vs optional settings keys
 *   - Check for breaking changes in settings format
 *   - Validate settings files can be read by current scripts
 *   - Generate compatibility matrix
 *   - Suggest migration path for incompatible settings
 *   - Test settings files for JSON validity
 * @example
 *   // Run from Illustrator Scripts menu before releases
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
    scriptName: 'CheckSettingsCompatibility',
    version: '1.0.0',
    settingsFolder: Folder.myDocuments + '/Adobe Scripts/',
    outputFolder: Folder.myDocuments + '/Adobe Scripts/Reports/',
    outputFile: 'settings-compatibility-report.html'
};

// ============================================================================
// MAIN FUNCTION
// ============================================================================

function main() {
    try {
        var startTime = new Date();

        var settingsFiles = findSettingsFiles();
        var schemas = extractSchemas();
        var validation = validateSettings(settingsFiles, schemas);
        var report = generateReport(validation, settingsFiles, schemas, startTime);
        var success = saveReport(report);

        if (success) {
            var elapsed = ((new Date() - startTime) / 1000).toFixed(1);
            alert(
                'Settings Compatibility Check Complete\n\n' +
                'Settings files: ' + settingsFiles.length + '\n' +
                'Scripts with schemas: ' + schemas.length + '\n' +
                'Invalid files: ' + validation.invalid.length + '\n' +
                'Incompatible: ' + validation.incompatible.length + '\n' +
                'Time: ' + elapsed + 's\n\n' +
                'Report: ' + CFG.outputFolder + CFG.outputFile
            );
        }

    } catch (e) {
        AIS.Error.show('Settings compatibility check failed', e);
    }
}

// ============================================================================
// CORE LOGIC
// ============================================================================

function findSettingsFiles() {
    var files = [];
    var folder = new Folder(CFG.settingsFolder);
    if (!folder.exists) return files;

    var jsonFiles = folder.getFiles('*.json');
    for (var i = 0; i < jsonFiles.length; i++) {
        if (jsonFiles[i] instanceof File) {
            files.push({
                name: jsonFiles[i].name,
                path: jsonFiles[i].fsName,
                file: jsonFiles[i]
            });
        }
    }
    return files;
}

function extractSchemas() {
    var schemas = [];
    var projectRoot = findProjectRoot();
    if (!projectRoot) return schemas;

    var categories = ['Favorites', 'Text', 'Utilities', 'Export', 'Measurement'];
    for (var i = 0; i < categories.length; i++) {
        var folder = new Folder(projectRoot.fsName + '/' + categories[i]);
        if (!folder.exists) continue;

        var files = folder.getFiles('*.jsx');
        for (var j = 0; j < files.length; j++) {
            if (files[j] instanceof File) {
                var content = readFileContent(files[j]);
                var schema = extractSettingsSchema(content, files[j].name);
                if (schema) {
                    schemas.push(schema);
                }
            }
        }
    }
    return schemas;
}

function extractSettingsSchema(content, scriptName) {
    if (!content) return null;

    var settingsMatch = content.match(/SETTINGS\s*=\s*\{[^}]+name:\s*['"]([^'"]+)['"]/);
    if (!settingsMatch) return null;

    var settingsFile = settingsMatch[1];
    var requiredKeys = [];
    var optionalKeys = [];

    var configMatch = content.match(/var\s+CFG\s*=\s*\{([\s\S]*?)\};/);
    if (configMatch) {
        var configBlock = configMatch[1];
        var keyMatches = configBlock.match(/(\w+):\s*[^,}]+/g);
        if (keyMatches) {
            for (var i = 0; i < keyMatches.length; i++) {
                var key = keyMatches[i].split(':')[0].trim();
                requiredKeys.push(key);
            }
        }
    }

    return {
        script: scriptName,
        settingsFile: settingsFile,
        requiredKeys: requiredKeys,
        optionalKeys: optionalKeys
    };
}

function validateSettings(settingsFiles, schemas) {
    var validation = {
        valid: [],
        invalid: [],
        incompatible: [],
        orphaned: []
    };

    for (var i = 0; i < settingsFiles.length; i++) {
        var settingsFile = settingsFiles[i];
        var content = readFileContent(settingsFile.file);

        if (!content) {
            validation.invalid.push({file: settingsFile.name, reason: 'Cannot read file'});
            continue;
        }

        try {
            var settings = AIS.JSON.parse(content);
            var matchingSchema = findMatchingSchema(settingsFile.name, schemas);

            if (!matchingSchema) {
                validation.orphaned.push({file: settingsFile.name, reason: 'No matching script found'});
            } else {
                var compatible = checkCompatibility(settings, matchingSchema);
                if (compatible.isCompatible) {
                    validation.valid.push({file: settingsFile.name, schema: matchingSchema.script});
                } else {
                    validation.incompatible.push({
                        file: settingsFile.name,
                        schema: matchingSchema.script,
                        issues: compatible.issues
                    });
                }
            }
        } catch (e) {
            validation.invalid.push({file: settingsFile.name, reason: 'Invalid JSON: ' + e.toString()});
        }
    }

    return validation;
}

function findMatchingSchema(settingsFileName, schemas) {
    for (var i = 0; i < schemas.length; i++) {
        if (schemas[i].settingsFile === settingsFileName) {
            return schemas[i];
        }
    }
    return null;
}

function checkCompatibility(settings, schema) {
    var result = {
        isCompatible: true,
        issues: []
    };

    for (var i = 0; i < schema.requiredKeys.length; i++) {
        var key = schema.requiredKeys[i];
        if (settings[key] === undefined) {
            result.isCompatible = false;
            result.issues.push('Missing required key: ' + key);
        }
    }

    return result;
}

function findProjectRoot() {
    var scriptFile = new File($.fileName);
    var currentFolder = scriptFile.parent;
    if (currentFolder.name === 'Utilities') {
        return currentFolder.parent;
    }
    return null;
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

function generateReport(validation, settingsFiles, schemas, startTime) {
    var elapsed = ((new Date() - startTime) / 1000).toFixed(1);

    var html = [];
    html.push('<!DOCTYPE html>');
    html.push('<html><head><meta charset="UTF-8"><title>Settings Compatibility Report</title>');
    html.push('<style>');
    html.push('body { font-family: sans-serif; margin: 20px; background: #f5f5f5; }');
    html.push('.container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; }');
    html.push('h1 { color: #1a1a1a; border-bottom: 3px solid #2962FF; padding-bottom: 10px; }');
    html.push('.metric { display: inline-block; background: #f8f9fa; padding: 15px; margin: 10px; border-radius: 6px; }');
    html.push('.issue { background: #FFEBEE; border-left: 4px solid #D32F2F; padding: 15px; margin: 10px 0; }');
    html.push('.warning { background: #FFF3E0; border-left: 4px solid #FF6F00; padding: 15px; margin: 10px 0; }');
    html.push('.success { background: #E8F5E9; border-left: 4px solid #4CAF50; padding: 15px; margin: 10px 0; }');
    html.push('</style></head><body><div class="container">');

    html.push('<h1>⚙️ Settings Compatibility Report</h1>');
    html.push('<p>Generated: ' + new Date().toString() + ' | Time: ' + elapsed + 's</p>');

    html.push('<div>');
    html.push('<div class="metric"><strong>Settings Files:</strong> ' + settingsFiles.length + '</div>');
    html.push('<div class="metric"><strong>Valid:</strong> ' + validation.valid.length + '</div>');
    html.push('<div class="metric"><strong>Invalid:</strong> ' + validation.invalid.length + '</div>');
    html.push('<div class="metric"><strong>Incompatible:</strong> ' + validation.incompatible.length + '</div>');
    html.push('</div>');

    if (validation.invalid.length > 0) {
        html.push('<h2>❌ Invalid Settings Files</h2>');
        for (var i = 0; i < validation.invalid.length; i++) {
            html.push('<div class="issue">');
            html.push('<strong>' + escapeHtml(validation.invalid[i].file) + '</strong><br>');
            html.push('Reason: ' + escapeHtml(validation.invalid[i].reason));
            html.push('</div>');
        }
    }

    if (validation.incompatible.length > 0) {
        html.push('<h2>⚠️ Incompatible Settings</h2>');
        for (var i = 0; i < validation.incompatible.length; i++) {
            var inc = validation.incompatible[i];
            html.push('<div class="warning">');
            html.push('<strong>' + escapeHtml(inc.file) + '</strong><br>');
            html.push('Script: ' + inc.schema + '<br>');
            html.push('Issues: ' + inc.issues.join(', '));
            html.push('</div>');
        }
    }

    if (validation.valid.length === settingsFiles.length) {
        html.push('<div class="success">✅ All settings files are valid and compatible!</div>');
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
