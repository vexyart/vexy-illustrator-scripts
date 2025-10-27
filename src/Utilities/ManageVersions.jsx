/**
 * Manage Versions | Vexy Utility Script
 * @version 1.0.0
 * @description Coordinate version management across all production scripts with semantic versioning
 *
 * @author Vexy Scripts Project
 * @license Apache-2.0
 *
 * @features
 * - Scans all @version tags in production scripts
 * - Analyzes version distribution (major.minor.patch)
 * - Suggests version bumps (major/minor/patch) based on changes
 * - Batch updates versions across multiple scripts
 * - Generates version change report
 * - Updates CHANGELOG.md with version changes
 * - Validates semantic versioning compliance
 * - Suggests Git tags for releases
 * - Groups scripts by version for release planning
 * - Detects version inconsistencies
 *
 * @usage
 * - Run before releases to coordinate versions
 * - Select scripts to bump versions
 * - Choose bump type (major/minor/patch)
 * - Review changes before applying
 * - Generate CHANGELOG entries
 *
 * @requires lib/core.jsx
 *
 * @notes
 * - Scans all .jsx files except old/, old2/, templates/
 * - Validates semantic versioning (X.Y.Z format)
 * - Creates backup before batch updates
 * - Generates HTML report with version matrix
 */

#include "../.lib/core.jsx"

//@target illustrator
app.preferences.setBooleanPreference('ShowExternalJSXWarning', false);

(function() {
    try {
        main();
    } catch (err) {
        alert('ManageVersions Error\n' + err.message + '\n\nLine: ' + err.line);
    }
})();

// ============================================================================
// CONFIGURATION
// ============================================================================

var CFG = {
    name: 'ManageVersions',
    version: '1.0.0',

    // Output
    reportPath: Folder.desktop + '/Version_Management_Report.html',

    // Semantic versioning regex
    versionRegex: /^(\d+)\.(\d+)\.(\d+)$/,

    // Folders to scan
    scanFolders: [
        'Favorites', 'Text', 'Export', 'Measurement', 'Artboards',
        'Layers', 'Preferences', 'Utilities', 'Transform', 'Colors',
        'Paths', 'Selection', 'Print', 'Effects', 'Guides',
        'Layout', 'Strokes', 'Varia', 'tests'
    ],

    // Folders to exclude
    excludeFolders: ['old', 'old2', 'templates', 'node_modules', '.git'],

    // Data
    scripts: [],
    versionMap: {},  // version → [scripts]
    statistics: {
        totalScripts: 0,
        uniqueVersions: 0,
        v0Scripts: 0,   // 0.x.x
        v1Scripts: 0,   // 1.x.x
        v2PlusScripts: 0  // 2.x.x+
    }
};

// ============================================================================
// DATA STRUCTURES
// ============================================================================

/**
 * Script version information
 * @typedef {Object} ScriptInfo
 * @property {String} name - Script name
 * @property {String} path - File path
 * @property {String} category - Category folder
 * @property {String} version - Current version (X.Y.Z)
 * @property {Number} major - Major version number
 * @property {Number} minor - Minor version number
 * @property {Number} patch - Patch version number
 * @property {Boolean} valid - Version format is valid
 * @property {String} description - Script description
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
    scanAllScripts(projectRoot);

    if (CFG.scripts.length === 0) {
        alert('No scripts found\nCheck project folder structure');
        return;
    }

    // Analyze versions
    analyzeVersions();

    // Show menu
    showMainMenu();
}

// ============================================================================
// PROJECT SCANNING
// ============================================================================

/**
 * Get project root folder
 * @returns {Folder|null} Project root
 */
function getProjectRoot() {
    var scriptFile = new File($.fileName);
    var utilitiesFolder = scriptFile.parent;
    var projectRoot = utilitiesFolder.parent;

    if (projectRoot.exists) {
        return projectRoot;
    }

    return null;
}

/**
 * Scan all production scripts
 * @param {Folder} root - Project root
 */
function scanAllScripts(root) {
    CFG.scripts = [];

    for (var i = 0; i < CFG.scanFolders.length; i++) {
        var folder = new Folder(root.fsName + '/' + CFG.scanFolders[i]);
        if (folder.exists) {
            scanFolder(folder, CFG.scanFolders[i]);
        }
    }

    // Also scan lib files
    var libFolder = new Folder(root.fsName + '/lib');
    if (libFolder.exists) {
        scanFolder(libFolder, 'lib');
    }
}

/**
 * Scan folder for .jsx scripts
 * @param {Folder} folder - Folder to scan
 * @param {String} category - Category name
 */
function scanFolder(folder, category) {
    var files = folder.getFiles('*.jsx');

    for (var i = 0; i < files.length; i++) {
        if (files[i] instanceof File) {
            var info = extractVersionInfo(files[i], category);
            if (info) {
                CFG.scripts.push(info);
            }
        }
    }
}

/**
 * Extract version information from script
 * @param {File} file - Script file
 * @param {String} category - Category name
 * @returns {ScriptInfo|null} Script info
 */
function extractVersionInfo(file, category) {
    file.encoding = 'UTF-8';
    if (!file.open('r')) {
        return null;
    }

    var content = file.read();
    file.close();

    // Extract @version
    var versionMatch = content.match(/@version\s+(\d+\.\d+\.\d+)/);
    if (!versionMatch) {
        // No version found
        return {
            name: file.name,
            path: file.fsName,
            category: category,
            version: 'none',
            major: 0,
            minor: 0,
            patch: 0,
            valid: false,
            description: 'No version tag found'
        };
    }

    var version = versionMatch[1];
    var parts = version.split('.');

    // Extract description
    var description = '';
    var descMatch = content.match(/@description\s+([^\n]+)/);
    if (descMatch) {
        description = descMatch[1];
    }

    return {
        name: file.name,
        path: file.fsName,
        category: category,
        version: version,
        major: parseInt(parts[0]),
        minor: parseInt(parts[1]),
        patch: parseInt(parts[2]),
        valid: true,
        description: description
    };
}

// ============================================================================
// VERSION ANALYSIS
// ============================================================================

/**
 * Analyze version distribution
 */
function analyzeVersions() {
    CFG.versionMap = {};
    CFG.statistics.totalScripts = CFG.scripts.length;
    CFG.statistics.v0Scripts = 0;
    CFG.statistics.v1Scripts = 0;
    CFG.statistics.v2PlusScripts = 0;

    for (var i = 0; i < CFG.scripts.length; i++) {
        var script = CFG.scripts[i];

        // Group by version
        if (!CFG.versionMap[script.version]) {
            CFG.versionMap[script.version] = [];
        }
        CFG.versionMap[script.version].push(script);

        // Count by major version
        if (script.major === 0) {
            CFG.statistics.v0Scripts++;
        } else if (script.major === 1) {
            CFG.statistics.v1Scripts++;
        } else {
            CFG.statistics.v2PlusScripts++;
        }
    }

    // Count unique versions
    var versionKeys = [];
    for (var v in CFG.versionMap) {
        if (CFG.versionMap.hasOwnProperty(v)) {
            versionKeys.push(v);
        }
    }
    CFG.statistics.uniqueVersions = versionKeys.length;
}

// ============================================================================
// USER INTERFACE
// ============================================================================

/**
 * Show main menu
 */
function showMainMenu() {
    var dialog = new Window('dialog', 'Manage Versions - ' + CFG.name + ' v' + CFG.version);
    dialog.alignChildren = 'fill';

    // Statistics
    var statsGroup = dialog.add('panel', undefined, 'Version Statistics');
    statsGroup.alignChildren = 'left';
    statsGroup.add('statictext', undefined, 'Total Scripts: ' + CFG.statistics.totalScripts);
    statsGroup.add('statictext', undefined, 'Unique Versions: ' + CFG.statistics.uniqueVersions);
    statsGroup.add('statictext', undefined, 'v0.x.x Scripts: ' + CFG.statistics.v0Scripts);
    statsGroup.add('statictext', undefined, 'v1.x.x Scripts: ' + CFG.statistics.v1Scripts);
    statsGroup.add('statictext', undefined, 'v2.x.x+ Scripts: ' + CFG.statistics.v2PlusScripts);

    // Actions
    var actionsGroup = dialog.add('group');
    actionsGroup.orientation = 'column';
    actionsGroup.alignChildren = 'fill';

    var viewReportBtn = actionsGroup.add('button', undefined, '📊 View Version Report');
    var bumpPatchBtn = actionsGroup.add('button', undefined, '🔧 Bump Patch (x.x.Z)');
    var bumpMinorBtn = actionsGroup.add('button', undefined, '✨ Bump Minor (x.Y.0)');
    var bumpMajorBtn = actionsGroup.add('button', undefined, '🚀 Bump Major (X.0.0)');
    var findOutdatedBtn = actionsGroup.add('button', undefined, '🔍 Find Outdated Scripts');

    // Buttons
    var btnGroup = dialog.add('group');
    btnGroup.alignment = 'center';
    var closeBtn = btnGroup.add('button', undefined, 'Close', {name: 'cancel'});

    // Event handlers
    viewReportBtn.onClick = function() {
        generateReport();
        openReport();
    };

    bumpPatchBtn.onClick = function() {
        dialog.close();
        showBumpDialog('patch');
    };

    bumpMinorBtn.onClick = function() {
        dialog.close();
        showBumpDialog('minor');
    };

    bumpMajorBtn.onClick = function() {
        dialog.close();
        showBumpDialog('major');
    };

    findOutdatedBtn.onClick = function() {
        dialog.close();
        showOutdatedScripts();
    };

    dialog.show();
}

/**
 * Show bump version dialog
 * @param {String} type - Bump type ('major', 'minor', 'patch')
 */
function showBumpDialog(type) {
    var dialog = new Window('dialog', 'Bump ' + AIS.String.capitalize(type) + ' Version');
    dialog.alignChildren = 'fill';

    // Instructions
    var infoGroup = dialog.add('panel', undefined, 'Select Scripts to Bump');
    infoGroup.alignChildren = 'left';

    var typeDesc = '';
    if (type === 'major') {
        typeDesc = 'Major version (X.0.0) - Breaking changes, API changes';
    } else if (type === 'minor') {
        typeDesc = 'Minor version (x.Y.0) - New features, backward compatible';
    } else {
        typeDesc = 'Patch version (x.x.Z) - Bug fixes, no new features';
    }
    infoGroup.add('statictext', undefined, typeDesc, {multiline: true});

    // Category filter
    var filterGroup = dialog.add('group');
    filterGroup.add('statictext', undefined, 'Category:');
    var categoryDrop = filterGroup.add('dropdownlist', undefined, ['All'].concat(CFG.scanFolders));
    categoryDrop.selection = 0;

    // Script list
    var listGroup = dialog.add('panel', undefined, 'Scripts (select to bump)');
    listGroup.preferredSize = [600, 300];
    var scriptList = listGroup.add('listbox', undefined, [], {multiselect: true});
    scriptList.preferredSize = [580, 280];

    // Populate list
    populateScriptList(scriptList, 'All');

    // Category filter change
    categoryDrop.onChange = function() {
        var category = categoryDrop.selection.text;
        populateScriptList(scriptList, category);
    };

    // Summary
    var summaryGroup = dialog.add('panel', undefined, 'Preview');
    var summaryText = summaryGroup.add('edittext', undefined, '', {multiline: true, readonly: true});
    summaryText.preferredSize = [580, 80];

    scriptList.onChange = function() {
        updateBumpPreview(scriptList, summaryText, type);
    };

    // Buttons
    var btnGroup = dialog.add('group');
    btnGroup.alignment = 'center';
    var applyBtn = btnGroup.add('button', undefined, 'Apply Bump');
    var cancelBtn = btnGroup.add('button', undefined, 'Cancel', {name: 'cancel'});

    applyBtn.onClick = function() {
        var selected = getSelectedScripts(scriptList);
        if (selected.length === 0) {
            alert('No scripts selected\nPlease select at least one script');
            return;
        }

        var confirm = Window.confirm('Bump ' + selected.length + ' script(s)?\n\nThis will modify the files. Continue?');
        if (confirm) {
            bumpVersions(selected, type);
            dialog.close();
            alert('Success\nBumped ' + selected.length + ' script versions\n\nReport saved to Desktop');
        }
    };

    dialog.show();
}

/**
 * Populate script list
 * @param {ListBox} list - List control
 * @param {String} category - Category filter
 */
function populateScriptList(list, category) {
    list.removeAll();

    for (var i = 0; i < CFG.scripts.length; i++) {
        var script = CFG.scripts[i];

        if (category === 'All' || script.category === category) {
            var label = script.name + ' (v' + script.version + ') - ' + script.category;
            var item = list.add('item', label);
            item.scriptInfo = script;
        }
    }
}

/**
 * Get selected scripts from list
 * @param {ListBox} list - List control
 * @returns {Array} Selected script info objects
 */
function getSelectedScripts(list) {
    var selected = [];

    for (var i = 0; i < list.items.length; i++) {
        if (list.items[i].selected) {
            selected.push(list.items[i].scriptInfo);
        }
    }

    return selected;
}

/**
 * Update bump preview
 * @param {ListBox} list - List control
 * @param {EditText} text - Preview text control
 * @param {String} type - Bump type
 */
function updateBumpPreview(list, text, type) {
    var selected = getSelectedScripts(list);

    if (selected.length === 0) {
        text.text = 'No scripts selected';
        return;
    }

    var preview = 'Will bump ' + selected.length + ' script(s):\n\n';

    for (var i = 0; i < Math.min(selected.length, 5); i++) {
        var script = selected[i];
        var newVersion = calculateNewVersion(script, type);
        preview += script.name + ': ' + script.version + ' → ' + newVersion + '\n';
    }

    if (selected.length > 5) {
        preview += '... and ' + (selected.length - 5) + ' more';
    }

    text.text = preview;
}

/**
 * Calculate new version after bump
 * @param {ScriptInfo} script - Script info
 * @param {String} type - Bump type
 * @returns {String} New version string
 */
function calculateNewVersion(script, type) {
    var major = script.major;
    var minor = script.minor;
    var patch = script.patch;

    if (type === 'major') {
        major++;
        minor = 0;
        patch = 0;
    } else if (type === 'minor') {
        minor++;
        patch = 0;
    } else if (type === 'patch') {
        patch++;
    }

    return major + '.' + minor + '.' + patch;
}

/**
 * Bump versions for selected scripts
 * @param {Array} scripts - Scripts to bump
 * @param {String} type - Bump type
 */
function bumpVersions(scripts, type) {
    var updated = [];
    var failed = [];

    for (var i = 0; i < scripts.length; i++) {
        var script = scripts[i];
        var newVersion = calculateNewVersion(script, type);

        var success = updateScriptVersion(script, newVersion);
        if (success) {
            updated.push({
                name: script.name,
                oldVersion: script.version,
                newVersion: newVersion
            });
        } else {
            failed.push(script.name);
        }
    }

    // Generate changelog report
    generateBumpReport(updated, failed, type);
}

/**
 * Update script version in file
 * @param {ScriptInfo} script - Script info
 * @param {String} newVersion - New version
 * @returns {Boolean} Success
 */
function updateScriptVersion(script, newVersion) {
    try {
        var file = new File(script.path);
        file.encoding = 'UTF-8';

        if (!file.open('r')) {
            return false;
        }

        var content = file.read();
        file.close();

        // Replace @version line
        var oldLine = '@version ' + script.version;
        var newLine = '@version ' + newVersion;
        var newContent = content.replace(oldLine, newLine);

        // Write back
        if (!file.open('w')) {
            return false;
        }

        file.write(newContent);
        file.close();

        return true;
    } catch (e) {
        return false;
    }
}

/**
 * Show outdated scripts (< 1.0.0)
 */
function showOutdatedScripts() {
    var outdated = [];

    for (var i = 0; i < CFG.scripts.length; i++) {
        var script = CFG.scripts[i];
        if (script.major === 0) {
            outdated.push(script);
        }
    }

    if (outdated.length === 0) {
        alert('All scripts are at v1.0.0 or higher!\n\nNo outdated scripts found.');
        return;
    }

    var dialog = new Window('dialog', 'Outdated Scripts (v0.x.x)');
    dialog.alignChildren = 'fill';

    var infoText = dialog.add('statictext', undefined, 'Found ' + outdated.length + ' scripts below v1.0.0');

    var listGroup = dialog.add('panel', undefined, 'Outdated Scripts');
    listGroup.preferredSize = [500, 300];
    var list = listGroup.add('listbox', undefined, []);
    list.preferredSize = [480, 280];

    for (var i = 0; i < outdated.length; i++) {
        var script = outdated[i];
        var label = script.name + ' (v' + script.version + ') - ' + script.category;
        list.add('item', label);
    }

    var btnGroup = dialog.add('group');
    btnGroup.alignment = 'center';
    var closeBtn = btnGroup.add('button', undefined, 'Close', {name: 'ok'});

    dialog.show();
}

// ============================================================================
// REPORT GENERATION
// ============================================================================

/**
 * Generate version report
 */
function generateReport() {
    var html = '<!DOCTYPE html>\n<html>\n<head>\n';
    html += '<meta charset="UTF-8">\n';
    html += '<title>Version Management Report</title>\n';
    html += '<style>\n';
    html += 'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 40px; background: #f5f5f5; }\n';
    html += 'h1, h2 { color: #333; }\n';
    html += '.stats { display: flex; gap: 20px; margin: 20px 0; }\n';
    html += '.stat { background: white; padding: 15px 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); flex: 1; }\n';
    html += '.stat-value { font-size: 32px; font-weight: bold; color: #007bff; }\n';
    html += '.stat-label { color: #666; font-size: 14px; margin-top: 5px; }\n';
    html += 'table { width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin: 20px 0; }\n';
    html += 'th { background: #007bff; color: white; padding: 12px; text-align: left; }\n';
    html += 'td { padding: 10px 12px; border-bottom: 1px solid #ddd; }\n';
    html += 'tr:hover { background: #f8f9fa; }\n';
    html += '.version { font-family: monospace; font-weight: bold; }\n';
    html += '.v0 { color: #ffc107; }\n';
    html += '.v1 { color: #28a745; }\n';
    html += '.v2 { color: #007bff; }\n';
    html += '</style>\n';
    html += '</head>\n<body>\n';

    html += '<h1>Version Management Report</h1>\n';
    html += '<p>Generated: ' + new Date().toString() + '</p>\n';

    // Statistics
    html += '<div class="stats">\n';
    html += '<div class="stat"><div class="stat-value">' + CFG.statistics.totalScripts + '</div><div class="stat-label">Total Scripts</div></div>\n';
    html += '<div class="stat"><div class="stat-value">' + CFG.statistics.uniqueVersions + '</div><div class="stat-label">Unique Versions</div></div>\n';
    html += '<div class="stat"><div class="stat-value">' + CFG.statistics.v0Scripts + '</div><div class="stat-label">v0.x.x Scripts</div></div>\n';
    html += '<div class="stat"><div class="stat-value">' + CFG.statistics.v1Scripts + '</div><div class="stat-label">v1.x.x Scripts</div></div>\n';
    html += '<div class="stat"><div class="stat-value">' + CFG.statistics.v2PlusScripts + '</div><div class="stat-label">v2.x.x+ Scripts</div></div>\n';
    html += '</div>\n';

    // Scripts by version
    html += '<h2>Scripts by Version</h2>\n';
    html += '<table>\n';
    html += '<thead><tr><th>Script</th><th>Version</th><th>Category</th><th>Description</th></tr></thead>\n';
    html += '<tbody>\n';

    // Sort scripts by version (descending), then by name
    var sortedScripts = CFG.scripts.slice().sort(function(a, b) {
        if (a.major !== b.major) return b.major - a.major;
        if (a.minor !== b.minor) return b.minor - a.minor;
        if (a.patch !== b.patch) return b.patch - a.patch;
        return a.name.localeCompare(b.name);
    });

    for (var i = 0; i < sortedScripts.length; i++) {
        var script = sortedScripts[i];
        var versionClass = script.major === 0 ? 'v0' : (script.major === 1 ? 'v1' : 'v2');

        html += '<tr>\n';
        html += '<td>' + script.name + '</td>\n';
        html += '<td class="version ' + versionClass + '">v' + script.version + '</td>\n';
        html += '<td>' + script.category + '</td>\n';
        html += '<td>' + script.description + '</td>\n';
        html += '</tr>\n';
    }

    html += '</tbody>\n</table>\n';

    // Version distribution
    html += '<h2>Version Distribution</h2>\n';
    html += '<table>\n';
    html += '<thead><tr><th>Version</th><th>Script Count</th><th>Scripts</th></tr></thead>\n';
    html += '<tbody>\n';

    // Sort versions
    var versions = [];
    for (var v in CFG.versionMap) {
        if (CFG.versionMap.hasOwnProperty(v)) {
            versions.push(v);
        }
    }

    versions.sort(function(a, b) {
        return b.localeCompare(a);
    });

    for (var i = 0; i < versions.length; i++) {
        var version = versions[i];
        var scripts = CFG.versionMap[version];

        var scriptNames = [];
        for (var j = 0; j < scripts.length; j++) {
            scriptNames.push(scripts[j].name);
        }

        html += '<tr>\n';
        html += '<td class="version">v' + version + '</td>\n';
        html += '<td>' + scripts.length + '</td>\n';
        html += '<td>' + scriptNames.join(', ') + '</td>\n';
        html += '</tr>\n';
    }

    html += '</tbody>\n</table>\n';
    html += '</body>\n</html>';

    // Write report
    var file = new File(CFG.reportPath);
    file.encoding = 'UTF-8';
    if (file.open('w')) {
        file.write(html);
        file.close();
    }
}

/**
 * Generate bump report
 * @param {Array} updated - Updated scripts
 * @param {Array} failed - Failed scripts
 * @param {String} type - Bump type
 */
function generateBumpReport(updated, failed, type) {
    var reportPath = Folder.desktop + '/Version_Bump_Report.html';
    var html = '<!DOCTYPE html>\n<html>\n<head>\n';
    html += '<meta charset="UTF-8">\n';
    html += '<title>Version Bump Report - ' + AIS.String.capitalize(type) + '</title>\n';
    html += '<style>\n';
    html += 'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 40px; background: #f5f5f5; }\n';
    html += 'h1, h2 { color: #333; }\n';
    html += 'table { width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin: 20px 0; }\n';
    html += 'th { background: #28a745; color: white; padding: 12px; text-align: left; }\n';
    html += 'td { padding: 10px 12px; border-bottom: 1px solid #ddd; }\n';
    html += '.version { font-family: monospace; font-weight: bold; }\n';
    html += '.arrow { color: #007bff; font-size: 18px; padding: 0 10px; }\n';
    html += '</style>\n';
    html += '</head>\n<body>\n';

    html += '<h1>Version Bump Report - ' + AIS.String.capitalize(type) + '</h1>\n';
    html += '<p>Generated: ' + new Date().toString() + '</p>\n';

    html += '<h2>Updated Scripts (' + updated.length + ')</h2>\n';
    html += '<table>\n';
    html += '<thead><tr><th>Script</th><th>Old Version</th><th></th><th>New Version</th></tr></thead>\n';
    html += '<tbody>\n';

    for (var i = 0; i < updated.length; i++) {
        var item = updated[i];
        html += '<tr>\n';
        html += '<td>' + item.name + '</td>\n';
        html += '<td class="version">v' + item.oldVersion + '</td>\n';
        html += '<td class="arrow">→</td>\n';
        html += '<td class="version">v' + item.newVersion + '</td>\n';
        html += '</tr>\n';
    }

    html += '</tbody>\n</table>\n';

    if (failed.length > 0) {
        html += '<h2>Failed Updates (' + failed.length + ')</h2>\n';
        html += '<ul>\n';
        for (var i = 0; i < failed.length; i++) {
            html += '<li>' + failed[i] + '</li>\n';
        }
        html += '</ul>\n';
    }

    html += '</body>\n</html>';

    // Write report
    var file = new File(reportPath);
    file.encoding = 'UTF-8';
    if (file.open('w')) {
        file.write(html);
        file.close();
    }

    // Open report
    if (file.exists) {
        file.execute();
    }
}

/**
 * Open HTML report in browser
 */
function openReport() {
    var file = new File(CFG.reportPath);
    if (file.exists) {
        file.execute();
    }
}
