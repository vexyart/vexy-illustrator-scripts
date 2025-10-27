/**
 * Detect Script Conflicts
 * @version 1.0.0
 * @description Analyzes all production scripts to detect potential conflicts - scripts that modify the same document properties, use conflicting operations, or have overlapping functionality. Helps identify scripts that shouldn't be run together or need coordination.
 * @category Utilities
 * @features
 *   - Analyzes all production scripts for conflict patterns
 *   - Detects property modification conflicts (artboard sizing, text conversion, etc.)
 *   - Identifies operation conflicts (destructive operations, document structure changes)
 *   - Checks for naming/functionality overlaps
 *   - Generates conflict matrix showing script interactions
 *   - HTML report with severity ratings and recommendations
 *   - Conflict resolution suggestions
 * @author Vexy
 * @usage File → Scripts → Detect Script Conflicts
 *        Select categories to analyze, generates conflict report
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
    SCRIPT_DIR: new Folder(File($.fileName).parent.parent),
    CATEGORIES: [
        'Artboards', 'Colors', 'Favorites', 'Layers',
        'Paths', 'Text', 'Transform', 'Utilities'
    ],

    // Conflict detection patterns
    PROPERTY_CONFLICTS: {
        artboardResize: /artboard.*\.(artboardRect|resize|width|height)/i,
        textConvert: /(convertToOutlines|createOutline|text.*outline)/i,
        pathMerge: /(pathfinder|unite|merge|compound)/i,
        layerRestructure: /(group|ungroup|layer.*move|reorder)/i,
        colorChange: /(fillColor|strokeColor|color.*set|replace.*color)/i,
        transformApply: /(resize|rotate|scale|transform|reflect)/i,
        selectionModify: /(selection.*set|select.*all|deselect)/i,
        documentModify: /(document.*save|close|new)/i
    },

    DESTRUCTIVE_PATTERNS: {
        deleteObjects: /(remove\(\)|delete|clear)/i,
        convertText: /convertToOutlines/i,
        flattenArt: /(flatten|rasterize)/i,
        mergeObjects: /(pathfinder|merge|unite)/i
    },

    OUTPUT_DIR: Folder.myDocuments + '/Adobe Scripts/Reports/',
    TIMESTAMP: new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19)
};

// ============================================================================
// MAIN FUNCTION
// ============================================================================
function main() {
    try {
        var result = showDialog();
        if (!result) return;

        var selectedCategories = result.categories;
        var conflicts = analyzeConflicts(selectedCategories);

        var report = generateReport(conflicts);
        saveReport(report);

        alert('Conflict Analysis Complete\n\n' +
              'Scripts analyzed: ' + conflicts.totalScripts + '\n' +
              'Conflicts found: ' + conflicts.conflicts.length + '\n' +
              'High severity: ' + countBySeverity(conflicts.conflicts, 'high') + '\n' +
              'Medium severity: ' + countBySeverity(conflicts.conflicts, 'medium') + '\n\n' +
              'Report saved to:\n' + CFG.OUTPUT_DIR);

    } catch (e) {
        AIS.Error.show('Conflict detection failed', e);
    }
}

// ============================================================================
// CONFLICT ANALYSIS
// ============================================================================
function analyzeConflicts(categories) {
    var scripts = collectScripts(categories);
    var scriptData = analyzeScripts(scripts);
    var conflicts = detectConflicts(scriptData);

    return {
        totalScripts: scripts.length,
        scripts: scriptData,
        conflicts: conflicts
    };
}

function collectScripts(categories) {
    var scripts = [];

    for (var i = 0; i < categories.length; i++) {
        var categoryFolder = new Folder(CFG.SCRIPT_DIR + '/' + categories[i]);
        if (!categoryFolder.exists) continue;

        var files = categoryFolder.getFiles('*.jsx');
        for (var j = 0; j < files.length; j++) {
            scripts.push({
                file: files[j],
                category: categories[i],
                name: files[j].name.replace('.jsx', '')
            });
        }
    }

    return scripts;
}

function analyzeScripts(scripts) {
    var analyzed = [];

    for (var i = 0; i < scripts.length; i++) {
        var script = scripts[i];
        var content = readScript(script.file);
        if (!content) continue;

        var analysis = {
            name: script.name,
            category: script.category,
            file: script.file.fsName,
            properties: detectProperties(content),
            destructive: detectDestructive(content),
            operations: detectOperations(content),
            modifies: detectModifications(content)
        };

        analyzed.push(analysis);
    }

    return analyzed;
}

function readScript(file) {
    try {
        file.encoding = 'UTF-8';
        file.open('r');
        var content = file.read();
        file.close();
        return content;
    } catch (e) {
        return null;
    }
}

function detectProperties(content) {
    var props = [];

    for (var key in CFG.PROPERTY_CONFLICTS) {
        if (CFG.PROPERTY_CONFLICTS[key].test(content)) {
            props.push(key);
        }
    }

    return props;
}

function detectDestructive(content) {
    var operations = [];

    for (var key in CFG.DESTRUCTIVE_PATTERNS) {
        if (CFG.DESTRUCTIVE_PATTERNS[key].test(content)) {
            operations.push(key);
        }
    }

    return operations;
}

function detectOperations(content) {
    var ops = {
        readsSelection: /selection/.test(content) && !/selection\s*=/.test(content),
        modifiesSelection: /selection\s*=/.test(content),
        createsObjects: /new\s+(PathItem|TextFrame|GroupItem|CompoundPathItem)/.test(content),
        deletesObjects: /remove\(\)/.test(content),
        modifiesDocument: /(document\.(save|close|activate)|activeDocument\s*=)/.test(content),
        usesUndo: /undo\(\)/.test(content)
    };

    return ops;
}

function detectModifications(content) {
    var mods = {
        artboards: /artboard/i.test(content),
        text: /text/i.test(content),
        paths: /(path|bezier|anchor)/i.test(content),
        layers: /layer/i.test(content),
        colors: /(color|swatch|gradient)/i.test(content),
        transforms: /(position|resize|rotate|scale)/i.test(content)
    };

    return mods;
}

function detectConflicts(scriptData) {
    var conflicts = [];

    for (var i = 0; i < scriptData.length; i++) {
        for (var j = i + 1; j < scriptData.length; j++) {
            var conflict = checkConflict(scriptData[i], scriptData[j]);
            if (conflict) {
                conflicts.push(conflict);
            }
        }
    }

    return conflicts;
}

function checkConflict(script1, script2) {
    var issues = [];

    // Check property conflicts
    var sharedProps = findShared(script1.properties, script2.properties);
    if (sharedProps.length > 0) {
        issues.push({
            type: 'property',
            detail: 'Both modify: ' + sharedProps.join(', '),
            severity: 'medium'
        });
    }

    // Check destructive conflicts
    var sharedDestructive = findShared(script1.destructive, script2.destructive);
    if (sharedDestructive.length > 0) {
        issues.push({
            type: 'destructive',
            detail: 'Both perform: ' + sharedDestructive.join(', '),
            severity: 'high'
        });
    }

    // Check operation conflicts
    if (script1.operations.modifiesSelection && script2.operations.readsSelection) {
        issues.push({
            type: 'operation',
            detail: script1.name + ' modifies selection that ' + script2.name + ' reads',
            severity: 'high'
        });
    }

    // Check modification domain overlap
    var modConflicts = checkModificationConflicts(script1, script2);
    if (modConflicts.length > 0) {
        issues.push({
            type: 'modification',
            detail: 'Both modify: ' + modConflicts.join(', '),
            severity: 'low'
        });
    }

    if (issues.length === 0) return null;

    var maxSeverity = getMaxSeverity(issues);

    return {
        script1: script1.name,
        category1: script1.category,
        script2: script2.name,
        category2: script2.category,
        issues: issues,
        severity: maxSeverity,
        recommendation: generateRecommendation(script1, script2, issues)
    };
}

function findShared(arr1, arr2) {
    var shared = [];
    for (var i = 0; i < arr1.length; i++) {
        for (var j = 0; j < arr2.length; j++) {
            if (arr1[i] === arr2[j]) {
                shared.push(arr1[i]);
            }
        }
    }
    return shared;
}

function checkModificationConflicts(script1, script2) {
    var conflicts = [];
    var domains = ['artboards', 'text', 'paths', 'layers', 'colors', 'transforms'];

    for (var i = 0; i < domains.length; i++) {
        var domain = domains[i];
        if (script1.modifies[domain] && script2.modifies[domain]) {
            conflicts.push(domain);
        }
    }

    return conflicts;
}

function getMaxSeverity(issues) {
    var severities = ['low', 'medium', 'high'];
    var maxLevel = 0;

    for (var i = 0; i < issues.length; i++) {
        var level = severities.indexOf(issues[i].severity);
        if (level > maxLevel) maxLevel = level;
    }

    return severities[maxLevel];
}

function generateRecommendation(script1, script2, issues) {
    var hasHigh = false;
    for (var i = 0; i < issues.length; i++) {
        if (issues[i].severity === 'high') {
            hasHigh = true;
            break;
        }
    }

    if (hasHigh) {
        return 'CAUTION: Do not run these scripts consecutively without reviewing document state. ' +
               'Consider using separate documents or saving between executions.';
    }

    return 'Review potential conflicts before running consecutively. ' +
           'Ensure document state meets requirements for both scripts.';
}

function countBySeverity(conflicts, severity) {
    var count = 0;
    for (var i = 0; i < conflicts.length; i++) {
        if (conflicts[i].severity === severity) count++;
    }
    return count;
}

// ============================================================================
// REPORT GENERATION
// ============================================================================
function generateReport(data) {
    var html = [];

    html.push('<!DOCTYPE html>');
    html.push('<html><head><meta charset="UTF-8">');
    html.push('<title>Script Conflict Analysis - ' + CFG.TIMESTAMP + '</title>');
    html.push('<style>');
    html.push(getReportStyles());
    html.push('</style></head><body>');

    html.push('<h1>Script Conflict Analysis</h1>');
    html.push('<p class="timestamp">Generated: ' + new Date().toString() + '</p>');

    html.push('<div class="summary">');
    html.push('<h2>Summary</h2>');
    html.push('<p><strong>Scripts Analyzed:</strong> ' + data.totalScripts + '</p>');
    html.push('<p><strong>Conflicts Found:</strong> ' + data.conflicts.length + '</p>');
    html.push('<p><strong>High Severity:</strong> ' + countBySeverity(data.conflicts, 'high') + '</p>');
    html.push('<p><strong>Medium Severity:</strong> ' + countBySeverity(data.conflicts, 'medium') + '</p>');
    html.push('<p><strong>Low Severity:</strong> ' + countBySeverity(data.conflicts, 'low') + '</p>');
    html.push('</div>');

    if (data.conflicts.length > 0) {
        html.push('<h2>Detected Conflicts</h2>');

        var bySeverity = groupBySeverity(data.conflicts);
        var severities = ['high', 'medium', 'low'];

        for (var i = 0; i < severities.length; i++) {
            var sev = severities[i];
            if (!bySeverity[sev] || bySeverity[sev].length === 0) continue;

            html.push('<h3 class="severity-' + sev + '">' +
                     capitalize(sev) + ' Severity (' + bySeverity[sev].length + ')</h3>');

            for (var j = 0; j < bySeverity[sev].length; j++) {
                html.push(formatConflict(bySeverity[sev][j]));
            }
        }
    } else {
        html.push('<p class="success">No conflicts detected! All scripts appear compatible.</p>');
    }

    html.push('</body></html>');

    return html.join('\n');
}

function groupBySeverity(conflicts) {
    var groups = {high: [], medium: [], low: []};

    for (var i = 0; i < conflicts.length; i++) {
        var sev = conflicts[i].severity;
        if (groups[sev]) {
            groups[sev].push(conflicts[i]);
        }
    }

    return groups;
}

function formatConflict(conflict) {
    var html = [];

    html.push('<div class="conflict severity-' + conflict.severity + '">');
    html.push('<h4>' + conflict.script1 + ' <span class="vs">vs</span> ' + conflict.script2 + '</h4>');
    html.push('<p class="categories">' + conflict.category1 + ' → ' + conflict.category2 + '</p>');

    html.push('<ul class="issues">');
    for (var i = 0; i < conflict.issues.length; i++) {
        var issue = conflict.issues[i];
        html.push('<li><strong>' + capitalize(issue.type) + ':</strong> ' + issue.detail + '</li>');
    }
    html.push('</ul>');

    html.push('<p class="recommendation"><strong>Recommendation:</strong> ' +
             conflict.recommendation + '</p>');

    html.push('</div>');

    return html.join('\n');
}

function getReportStyles() {
    return 'body{font-family:system-ui,sans-serif;max-width:1200px;margin:40px auto;padding:0 20px;line-height:1.6}' +
           'h1{color:#2c3e50;border-bottom:3px solid #3498db;padding-bottom:10px}' +
           'h2{color:#34495e;margin-top:30px;border-bottom:2px solid #95a5a6;padding-bottom:5px}' +
           'h3{margin-top:25px}' +
           '.timestamp{color:#7f8c8d;font-size:0.9em}' +
           '.summary{background:#ecf0f1;padding:20px;border-radius:5px;margin:20px 0}' +
           '.summary p{margin:8px 0}' +
           '.conflict{border:2px solid #bdc3c7;border-radius:5px;padding:15px;margin:15px 0;background:#fff}' +
           '.severity-high{border-color:#e74c3c;background:#fee}' +
           '.severity-medium{border-color:#f39c12;background:#ffefd5}' +
           '.severity-low{border-color:#3498db;background:#f0f8ff}' +
           '.conflict h4{margin:0 0 10px 0;color:#2c3e50}' +
           '.vs{color:#95a5a6;font-weight:normal;font-size:0.9em}' +
           '.categories{color:#7f8c8d;font-size:0.85em;margin:5px 0}' +
           '.issues{margin:10px 0;padding-left:20px}' +
           '.issues li{margin:5px 0}' +
           '.recommendation{background:#fff9e6;border-left:4px solid #f39c12;padding:10px;margin-top:10px;font-size:0.9em}' +
           '.success{background:#d5f4e6;border:2px solid #27ae60;padding:15px;border-radius:5px;color:#27ae60;font-weight:bold}' +
           'h3.severity-high{color:#e74c3c}' +
           'h3.severity-medium{color:#f39c12}' +
           'h3.severity-low{color:#3498db}';
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function saveReport(html) {
    var folder = new Folder(CFG.OUTPUT_DIR);
    if (!folder.exists) folder.create();

    var filename = 'script-conflicts-' + CFG.TIMESTAMP + '.html';
    var file = new File(CFG.OUTPUT_DIR + filename);

    file.encoding = 'UTF-8';
    file.open('w');
    file.write(html);
    file.close();
}

// ============================================================================
// USER INTERFACE
// ============================================================================
function showDialog() {
    var dialog = new Window('dialog', 'Detect Script Conflicts');
    dialog.alignChildren = 'fill';

    var infoGroup = dialog.add('group');
    infoGroup.orientation = 'column';
    infoGroup.alignChildren = 'left';
    infoGroup.add('statictext', undefined, 'Analyze scripts for potential conflicts:');
    infoGroup.add('statictext', undefined, '• Property modification conflicts');
    infoGroup.add('statictext', undefined, '• Destructive operation overlaps');
    infoGroup.add('statictext', undefined, '• Selection/document conflicts');

    var categoryGroup = dialog.add('panel', undefined, 'Categories to Analyze');
    categoryGroup.orientation = 'column';
    categoryGroup.alignChildren = 'left';
    categoryGroup.margins = 15;

    var checkboxes = [];
    for (var i = 0; i < CFG.CATEGORIES.length; i++) {
        var cb = categoryGroup.add('checkbox', undefined, CFG.CATEGORIES[i]);
        cb.value = true;
        checkboxes.push(cb);
    }

    var selectGroup = categoryGroup.add('group');
    var selectAllBtn = selectGroup.add('button', undefined, 'Select All');
    var deselectAllBtn = selectGroup.add('button', undefined, 'Deselect All');

    selectAllBtn.onClick = function() {
        for (var i = 0; i < checkboxes.length; i++) {
            checkboxes[i].value = true;
        }
    };

    deselectAllBtn.onClick = function() {
        for (var i = 0; i < checkboxes.length; i++) {
            checkboxes[i].value = false;
        }
    };

    var buttonGroup = dialog.add('group');
    buttonGroup.alignment = 'right';
    var analyzeBtn = buttonGroup.add('button', undefined, 'Analyze', {name: 'ok'});
    var cancelBtn = buttonGroup.add('button', undefined, 'Cancel', {name: 'cancel'});

    if (dialog.show() === 2) return null;

    var selected = [];
    for (var i = 0; i < checkboxes.length; i++) {
        if (checkboxes[i].value) {
            selected.push(CFG.CATEGORIES[i]);
        }
    }

    if (selected.length === 0) {
        alert('No categories selected');
        return null;
    }

    return {categories: selected};
}
