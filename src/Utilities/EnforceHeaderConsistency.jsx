/**
 * Enforce Header Consistency
 * @version 1.0.0
 * @description Automatically fix malformed or missing JSDoc headers across all scripts
 *
 * @category Utilities
 * @author Vexy Team
 * @license MIT
 *
 * @features
 * - Scan all .jsx files for header issues
 * - Auto-fix missing @version, @description, @category, @author, @license tags
 * - Interactive mode with preview before applying changes
 * - Batch mode for automated fixing
 * - Backup original files before modification
 * - Generate detailed change report
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
    scriptName: 'EnforceHeaderConsistency',
    version: '1.0.0',
    backupFolder: Folder.myDocuments + '/Adobe Scripts/Backups/Headers/',

    // Folders to scan (relative to project root)
    scanFolders: [
        'Favorites',
        'Text',
        'Export',
        'Measurement',
        'Utilities',
        'tests',
        'Artboards',
        'Colors',
        'Layers',
        'Paths',
        'Transform',
        'Selection',
        'Print',
        'Effects',
        'Guides',
        'Layout',
        'Strokes',
        'Preferences',
        'Varia'
    ],

    // Default values for missing tags
    defaults: {
        version: '1.0.0',
        author: 'Vexy Team',
        license: 'MIT',
        category: 'Utilities'  // Will be overridden by folder name
    },

    // Required header tags
    requiredTags: [
        '@version',
        '@description',
        '@category',
        '@author',
        '@license'
    ]
};

// ============================================================================
// MAIN FUNCTION
// ============================================================================

function main() {
    try {
        var result = showDialog();
        if (!result) return;  // User cancelled

        var mode = result.mode;  // 'interactive' or 'batch'
        var folders = getSelectedFolders(result.folders);

        if (folders.length === 0) {
            alert('No folders selected\nPlease select at least one folder to scan');
            return;
        }

        // Scan files
        var files = scanFiles(folders);
        if (files.length === 0) {
            alert('No .jsx files found\nCheck that folders exist and contain scripts');
            return;
        }

        // Analyze headers
        var issues = analyzeHeaders(files);
        if (issues.length === 0) {
            alert('No issues found\nAll headers are properly formatted!');
            return;
        }

        // Show preview if interactive mode
        if (mode === 'interactive') {
            var proceed = showPreview(issues);
            if (!proceed) return;  // User cancelled
        }

        // Create backup
        var backupPath = createBackup(issues);

        // Fix headers
        var fixed = fixHeaders(issues);

        // Generate report
        var reportPath = generateReport(fixed, backupPath);

        // Show success dialog
        showSuccess(fixed.length, reportPath);

    } catch (err) {
        AIS.Error.show('Failed to enforce header consistency', err);
    }
}

// ============================================================================
// CORE LOGIC
// ============================================================================

/**
 * Scan folders for .jsx files
 */
function scanFiles(folders) {
    var files = [];
    var projectRoot = getProjectRoot();

    for (var i = 0; i < folders.length; i++) {
        var folderPath = projectRoot + '/' + folders[i];
        var folder = new Folder(folderPath);

        if (!folder.exists) continue;

        var jsxFiles = folder.getFiles('*.jsx');
        for (var j = 0; j < jsxFiles.length; j++) {
            if (jsxFiles[j] instanceof File) {
                files.push({
                    file: jsxFiles[j],
                    folder: folders[i],
                    name: jsxFiles[j].name
                });
            }
        }
    }

    return files;
}

/**
 * Analyze headers for issues
 */
function analyzeHeaders(files) {
    var issues = [];

    for (var i = 0; i < files.length; i++) {
        var fileInfo = files[i];
        var content = readFile(fileInfo.file);
        if (!content) continue;

        var header = extractHeader(content);
        var problems = findProblems(header, fileInfo.folder);

        if (problems.length > 0) {
            issues.push({
                file: fileInfo.file,
                folder: fileInfo.folder,
                name: fileInfo.name,
                content: content,
                header: header,
                problems: problems
            });
        }
    }

    return issues;
}

/**
 * Extract JSDoc header from file content
 */
function extractHeader(content) {
    var header = {
        raw: '',
        tags: {},
        startLine: -1,
        endLine: -1
    };

    // Find JSDoc block (/** ... */)
    var match = content.match(/^\/\*\*\s*\n([\s\S]*?)\n\s*\*\//m);
    if (!match) return header;

    header.raw = match[0];
    var lines = match[1].split('\n');

    // Extract tags
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i].replace(/^\s*\*\s?/, '');  // Remove leading * and space

        // Check for @tag
        var tagMatch = line.match(/^@(\w+)\s+(.*)$/);
        if (tagMatch) {
            var tagName = tagMatch[1];
            var tagValue = tagMatch[2];
            header.tags[tagName] = tagValue;
        }
    }

    return header;
}

/**
 * Find problems in header
 */
function findProblems(header, folder) {
    var problems = [];

    // Check for required tags
    for (var i = 0; i < CFG.requiredTags.length; i++) {
        var tag = CFG.requiredTags[i].substring(1);  // Remove @
        if (!header.tags[tag]) {
            problems.push({
                type: 'missing',
                tag: tag,
                fix: getDefaultValue(tag, folder)
            });
        }
    }

    // Check for empty descriptions
    if (header.tags.description && header.tags.description.length < 10) {
        problems.push({
            type: 'short_description',
            tag: 'description',
            fix: 'TODO: Add meaningful description (at least 10 characters)'
        });
    }

    // Check category matches folder
    if (header.tags.category && header.tags.category !== folder) {
        problems.push({
            type: 'wrong_category',
            tag: 'category',
            current: header.tags.category,
            fix: folder
        });
    }

    return problems;
}

/**
 * Get default value for a tag
 */
function getDefaultValue(tag, folder) {
    switch (tag) {
        case 'version':
            return CFG.defaults.version;
        case 'author':
            return CFG.defaults.author;
        case 'license':
            return CFG.defaults.license;
        case 'category':
            return folder || CFG.defaults.category;
        case 'description':
            return 'TODO: Add description';
        default:
            return 'TODO: Fill in ' + tag;
    }
}

/**
 * Create backup of files before modification
 */
function createBackup(issues) {
    var timestamp = new Date().getTime();
    var backupFolder = new Folder(CFG.backupFolder + timestamp);

    if (!backupFolder.exists) {
        backupFolder.create();
    }

    for (var i = 0; i < issues.length; i++) {
        var issue = issues[i];
        var sourceFile = issue.file;
        var backupFile = new File(backupFolder.fsName + '/' + issue.name);

        sourceFile.copy(backupFile);
    }

    return backupFolder.fsName;
}

/**
 * Fix headers in all issue files
 */
function fixHeaders(issues) {
    var fixed = [];

    for (var i = 0; i < issues.length; i++) {
        var issue = issues[i];
        var newContent = applyFixes(issue.content, issue.header, issue.problems);

        if (writeFile(issue.file, newContent)) {
            fixed.push({
                file: issue.name,
                folder: issue.folder,
                problems: issue.problems
            });
        }
    }

    return fixed;
}

/**
 * Apply fixes to file content
 */
function applyFixes(content, header, problems) {
    var newHeader = header.raw;

    // If no header exists, create one
    if (!newHeader) {
        newHeader = createNewHeader(problems);
        // Prepend to content
        return newHeader + '\n\n' + content;
    }

    // Modify existing header
    for (var i = 0; i < problems.length; i++) {
        var problem = problems[i];

        if (problem.type === 'missing') {
            // Add missing tag before closing */
            var tagLine = ' * @' + problem.tag + ' ' + problem.fix + '\n';
            newHeader = newHeader.replace(/\n\s*\*\//, '\n' + tagLine + ' */');
        } else if (problem.type === 'short_description') {
            // Replace short description
            newHeader = newHeader.replace(
                /@description\s+.*/,
                '@description ' + problem.fix
            );
        } else if (problem.type === 'wrong_category') {
            // Fix category
            newHeader = newHeader.replace(
                /@category\s+.*/,
                '@category ' + problem.fix
            );
        }
    }

    // Replace old header with new one
    return content.replace(header.raw, newHeader);
}

/**
 * Create new header from scratch
 */
function createNewHeader(problems) {
    var lines = [];
    lines.push('/**');
    lines.push(' * Script Name');

    for (var i = 0; i < problems.length; i++) {
        var problem = problems[i];
        if (problem.type === 'missing') {
            lines.push(' * @' + problem.tag + ' ' + problem.fix);
        }
    }

    lines.push(' */');
    return lines.join('\n');
}

/**
 * Get project root folder
 */
function getProjectRoot() {
    // Assuming this script is in Utilities/
    var scriptFile = new File($.fileName);
    var utilitiesFolder = scriptFile.parent;
    var projectRoot = utilitiesFolder.parent;
    return projectRoot.fsName;
}

/**
 * Read file content
 */
function readFile(file) {
    file.encoding = 'UTF-8';
    if (!file.open('r')) return '';
    var content = file.read();
    file.close();
    return content;
}

/**
 * Write file content
 */
function writeFile(file, content) {
    file.encoding = 'UTF-8';
    if (!file.open('w')) return false;
    file.write(content);
    file.close();
    return true;
}

/**
 * Generate HTML report
 */
function generateReport(fixed, backupPath) {
    var timestamp = new Date().toString();
    var html = [];

    html.push('<!DOCTYPE html>');
    html.push('<html><head><meta charset="UTF-8">');
    html.push('<title>Header Consistency Report</title>');
    html.push('<style>');
    html.push('body { font-family: Arial, sans-serif; margin: 20px; }');
    html.push('h1 { color: #2962FF; }');
    html.push('.summary { background: #f0f0f0; padding: 15px; margin: 20px 0; }');
    html.push('.file { background: white; border: 1px solid #ddd; margin: 10px 0; padding: 15px; }');
    html.push('.problem { background: #fff3cd; border-left: 4px solid #ffc107; padding: 10px; margin: 5px 0; }');
    html.push('.success { color: #00C853; font-weight: bold; }');
    html.push('</style></head><body>');

    html.push('<h1>Header Consistency Enforcement Report</h1>');
    html.push('<div class="summary">');
    html.push('<p><strong>Date:</strong> ' + timestamp + '</p>');
    html.push('<p><strong>Files Fixed:</strong> <span class="success">' + fixed.length + '</span></p>');
    html.push('<p><strong>Backup Location:</strong> ' + backupPath + '</p>');
    html.push('</div>');

    html.push('<h2>Fixed Files</h2>');
    for (var i = 0; i < fixed.length; i++) {
        var item = fixed[i];
        html.push('<div class="file">');
        html.push('<h3>' + item.folder + '/' + item.file + '</h3>');
        html.push('<p><strong>Problems fixed:</strong></p>');
        html.push('<ul>');
        for (var j = 0; j < item.problems.length; j++) {
            var problem = item.problems[j];
            var desc = formatProblemDescription(problem);
            html.push('<li>' + desc + '</li>');
        }
        html.push('</ul>');
        html.push('</div>');
    }

    html.push('</body></html>');

    var reportFile = new File(Folder.temp + '/header_consistency_report_' + new Date().getTime() + '.html');
    reportFile.encoding = 'UTF-8';
    reportFile.open('w');
    reportFile.write(html.join('\n'));
    reportFile.close();

    return reportFile.fsName;
}

/**
 * Format problem description for report
 */
function formatProblemDescription(problem) {
    switch (problem.type) {
        case 'missing':
            return 'Added missing @' + problem.tag + ': <code>' + problem.fix + '</code>';
        case 'short_description':
            return 'Fixed short description: <code>' + problem.fix + '</code>';
        case 'wrong_category':
            return 'Corrected @category from "' + problem.current + '" to "' + problem.fix + '"';
        default:
            return 'Fixed ' + problem.type;
    }
}

// ============================================================================
// USER INTERFACE
// ============================================================================

/**
 * Show main configuration dialog
 */
function showDialog() {
    var dialog = new Window('dialog', 'Enforce Header Consistency');
    dialog.alignChildren = ['fill', 'top'];
    dialog.spacing = 10;
    dialog.margins = 15;

    // Header
    var headerPanel = dialog.add('panel', undefined, 'Configuration');
    headerPanel.alignChildren = ['fill', 'top'];
    headerPanel.margins = 15;

    var infoText = headerPanel.add('statictext', undefined,
        'Automatically fix malformed or missing JSDoc headers in your scripts.',
        {multiline: true});
    infoText.preferredSize.width = 400;

    // Mode selection
    var modeGroup = headerPanel.add('group');
    modeGroup.orientation = 'column';
    modeGroup.alignChildren = ['left', 'top'];
    modeGroup.spacing = 5;

    modeGroup.add('statictext', undefined, 'Mode:');
    var interactiveRadio = modeGroup.add('radiobutton', undefined, 'Interactive (preview changes before applying)');
    var batchRadio = modeGroup.add('radiobutton', undefined, 'Batch (fix all automatically)');
    interactiveRadio.value = true;

    // Folder selection
    var folderPanel = dialog.add('panel', undefined, 'Folders to Scan');
    folderPanel.alignChildren = ['fill', 'top'];
    folderPanel.margins = 15;

    var folderGroup = folderPanel.add('group');
    folderGroup.orientation = 'column';
    folderGroup.alignChildren = ['left', 'top'];
    folderGroup.spacing = 2;

    var checkboxes = {};
    var categories = ['Favorites', 'Text', 'Export', 'Measurement', 'Utilities', 'tests', 'All others'];

    for (var i = 0; i < categories.length; i++) {
        checkboxes[categories[i]] = folderGroup.add('checkbox', undefined, categories[i]);
        checkboxes[categories[i]].value = (categories[i] === 'Utilities');  // Default to Utilities
    }

    // Buttons
    var buttonGroup = dialog.add('group');
    buttonGroup.alignment = ['right', 'top'];

    var cancelBtn = buttonGroup.add('button', undefined, 'Cancel', {name: 'cancel'});
    var okBtn = buttonGroup.add('button', undefined, 'Start', {name: 'ok'});

    if (dialog.show() === 1) {
        var selectedFolders = [];
        for (var key in checkboxes) {
            if (checkboxes[key].value) {
                if (key === 'All others') {
                    // Add all remaining folders
                    selectedFolders = selectedFolders.concat([
                        'Artboards', 'Colors', 'Layers', 'Paths', 'Transform',
                        'Selection', 'Print', 'Effects', 'Guides', 'Layout',
                        'Strokes', 'Preferences', 'Varia'
                    ]);
                } else {
                    selectedFolders.push(key);
                }
            }
        }

        return {
            mode: interactiveRadio.value ? 'interactive' : 'batch',
            folders: selectedFolders
        };
    }

    return null;
}

/**
 * Get selected folders based on user choices
 */
function getSelectedFolders(folderNames) {
    var folders = [];
    for (var i = 0; i < folderNames.length; i++) {
        folders.push(folderNames[i]);
    }
    return folders;
}

/**
 * Show preview of changes before applying
 */
function showPreview(issues) {
    var dialog = new Window('dialog', 'Preview Changes');
    dialog.alignChildren = ['fill', 'fill'];
    dialog.spacing = 10;
    dialog.margins = 15;

    var infoText = dialog.add('statictext', undefined,
        'Found ' + issues.length + ' file(s) with header issues. Review below:',
        {multiline: true});
    infoText.preferredSize.width = 500;

    var listPanel = dialog.add('panel', undefined, 'Issues Found');
    listPanel.alignChildren = ['fill', 'fill'];
    listPanel.margins = 15;
    listPanel.preferredSize = [500, 300];

    var list = listPanel.add('edittext', undefined, '', {multiline: true, readonly: true, scrolling: true});
    list.preferredSize = [480, 280];

    var listText = [];
    for (var i = 0; i < Math.min(issues.length, 50); i++) {  // Show first 50
        var issue = issues[i];
        listText.push(issue.folder + '/' + issue.name);
        for (var j = 0; j < issue.problems.length; j++) {
            var problem = issue.problems[j];
            listText.push('  - ' + formatProblemDescription(problem));
        }
        listText.push('');
    }
    if (issues.length > 50) {
        listText.push('... and ' + (issues.length - 50) + ' more files');
    }
    list.text = listText.join('\n');

    var buttonGroup = dialog.add('group');
    buttonGroup.alignment = ['right', 'top'];

    var cancelBtn = buttonGroup.add('button', undefined, 'Cancel', {name: 'cancel'});
    var okBtn = buttonGroup.add('button', undefined, 'Apply Fixes', {name: 'ok'});

    return dialog.show() === 1;
}

/**
 * Show success dialog
 */
function showSuccess(count, reportPath) {
    var dialog = new Window('dialog', 'Success!');
    dialog.alignChildren = ['fill', 'top'];
    dialog.spacing = 10;
    dialog.margins = 15;

    dialog.add('statictext', undefined, 'Header consistency enforced successfully!');
    dialog.add('statictext', undefined, 'Files fixed: ' + count);
    dialog.add('statictext', undefined, 'Report saved to:');

    var pathText = dialog.add('edittext', undefined, reportPath, {readonly: true});
    pathText.preferredSize.width = 400;

    var openReportBtn = dialog.add('button', undefined, 'Open Report');
    openReportBtn.onClick = function() {
        var reportFile = new File(reportPath);
        reportFile.execute();
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
    AIS.Error.show('EnforceHeaderConsistency error', e);
}
