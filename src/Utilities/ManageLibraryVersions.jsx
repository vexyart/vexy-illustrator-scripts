/**
 * Manage Library Versions
 * @version 1.0.0
 * @description Library version control system with snapshots, rollback, and breaking change detection
 * @category Utilities
 * @features Version snapshots, rollback capability, diff viewer, breaking change detection, automated backups
 * @author Vexy
 * @usage Run to manage AIS library versions, create snapshots, or rollback to previous versions
 */

// this_file: Utilities/ManageLibraryVersions.jsx

#include "../.lib/core.jsx"

//@target illustrator
app.preferences.setBooleanPreference('ShowExternalJSXWarning', false);

// ============================================================================
// CONFIGURATION
// ============================================================================

var CFG = {
    // Version storage
    VERSION_FOLDER: Folder.myDocuments + '/Adobe Scripts/Library Versions/',
    SNAPSHOT_PREFIX: 'ais-lib-',
    CURRENT_MARKER: 'CURRENT.txt',

    // Library files to track
    LIBRARY_FILES: [
        'lib/core.jsx',
        'lib/ui.jsx'
    ],

    // Report settings
    REPORT_FILE: 'library-version-report.html',
    REPORT_TITLE: 'AIS Library Version Management Report',

    // Breaking change patterns
    BREAKING_PATTERNS: [
        /function\s+(\w+)\s*\(/g,           // Function signatures
        /var\s+(\w+)\s*=\s*\{/g,            // Object definitions
        /\.prototype\.(\w+)/g,              // Prototype methods
        /@param\s+\{([^}]+)\}/g,            // Parameter types
        /@returns?\s+\{([^}]+)\}/g          // Return types
        /@deprecated/g                       // Deprecated markers
    ],

    // Version metadata
    VERSION_KEYS: ['timestamp', 'author', 'description', 'fileHashes', 'lineCount', 'functionCount'],

    // Diff settings
    CONTEXT_LINES: 3,
    MAX_DIFF_LINES: 1000,

    // Colors for HTML report
    COLORS: {
        added: '#d4edda',
        removed: '#f8d7da',
        modified: '#fff3cd',
        header: '#007bff',
        warning: '#dc3545',
        success: '#28a745'
    }
};

// ============================================================================
// MAIN FUNCTION
// ============================================================================

function main() {
    try {
        var dialog = createDialog();

        if (dialog.show() === 1) {
            var action = getSelectedAction(dialog);

            if (action === 'snapshot') {
                createSnapshot(dialog);
            } else if (action === 'rollback') {
                rollbackToVersion(dialog);
            } else if (action === 'diff') {
                showDiffReport(dialog);
            } else if (action === 'list') {
                listVersions();
            } else if (action === 'analyze') {
                analyzeBreakingChanges();
            }
        }

    } catch (e) {
        AIS.Error.show('Library version management failed', e);
    }
}

// ============================================================================
// CORE LOGIC
// ============================================================================

/**
 * Create a new version snapshot
 * @param {Object} dialog - The dialog object
 */
function createSnapshot(dialog) {
    var description = dialog.descriptionField.text || 'Manual snapshot';
    var author = dialog.authorField.text || AIS.System.isMac() ? $.getenv('USER') : $.getenv('USERNAME');

    // Validate library files exist
    var repoRoot = getRepositoryRoot();
    if (!repoRoot) {
        alert('Error\nCannot find repository root');
        return;
    }

    var snapshot = {
        timestamp: new Date().getTime(),
        date: new Date().toString(),
        author: author,
        description: description,
        files: {},
        lineCount: 0,
        functionCount: 0
    };

    // Create snapshot folder
    var versionFolder = new Folder(CFG.VERSION_FOLDER);
    if (!versionFolder.exists) {
        versionFolder.create();
    }

    // Copy library files and calculate metadata
    var snapshotFolder = new Folder(CFG.VERSION_FOLDER + CFG.SNAPSHOT_PREFIX + snapshot.timestamp);
    if (!snapshotFolder.exists) {
        snapshotFolder.create();
    }

    for (var i = 0; i < CFG.LIBRARY_FILES.length; i++) {
        var libPath = CFG.LIBRARY_FILES[i];
        var sourceFile = new File(repoRoot + '/' + libPath);

        if (!sourceFile.exists) {
            alert('Error\nLibrary file not found: ' + libPath);
            return;
        }

        // Read source content
        sourceFile.encoding = 'UTF-8';
        sourceFile.open('r');
        var content = sourceFile.read();
        sourceFile.close();

        // Save to snapshot
        var fileName = libPath.replace(/\//g, '_');
        var snapshotFile = new File(snapshotFolder.fsName + '/' + fileName);
        snapshotFile.encoding = 'UTF-8';
        snapshotFile.open('w');
        snapshotFile.write(content);
        snapshotFile.close();

        // Calculate metadata
        var metadata = analyzeLibraryFile(content);
        snapshot.files[libPath] = {
            hash: hashString(content),
            lines: metadata.lines,
            functions: metadata.functions,
            size: content.length
        };

        snapshot.lineCount += metadata.lines;
        snapshot.functionCount += metadata.functions;
    }

    // Save snapshot metadata
    var metaFile = new File(snapshotFolder.fsName + '/metadata.json');
    metaFile.encoding = 'UTF-8';
    metaFile.open('w');
    metaFile.write(AIS.JSON.stringify(snapshot));
    metaFile.close();

    // Update current marker
    updateCurrentMarker(snapshot.timestamp);

    alert('Snapshot Created\n' +
          'Timestamp: ' + snapshot.timestamp + '\n' +
          'Files: ' + CFG.LIBRARY_FILES.length + '\n' +
          'Total Lines: ' + snapshot.lineCount + '\n' +
          'Total Functions: ' + snapshot.functionCount);
}

/**
 * Rollback to a previous version
 * @param {Object} dialog - The dialog object
 */
function rollbackToVersion(dialog) {
    var versions = getAvailableVersions();
    if (versions.length === 0) {
        alert('No Versions\nNo version snapshots found');
        return;
    }

    var selectedIdx = dialog.versionList.selection ? dialog.versionList.selection.index : -1;
    if (selectedIdx === -1) {
        alert('No Selection\nPlease select a version to rollback to');
        return;
    }

    var targetVersion = versions[selectedIdx];

    // Confirm rollback
    var confirmed = confirm('Rollback Confirmation\n' +
                           'Rollback to version: ' + formatTimestamp(targetVersion.timestamp) + '\n' +
                           'Description: ' + targetVersion.description + '\n\n' +
                           'Current library files will be backed up.\n' +
                           'Continue?');

    if (!confirmed) return;

    // Create backup of current state
    createSnapshot({
        descriptionField: {text: 'Auto-backup before rollback to ' + targetVersion.timestamp},
        authorField: {text: 'System'}
    });

    // Restore files from snapshot
    var repoRoot = getRepositoryRoot();
    var snapshotFolder = new Folder(CFG.VERSION_FOLDER + CFG.SNAPSHOT_PREFIX + targetVersion.timestamp);

    for (var i = 0; i < CFG.LIBRARY_FILES.length; i++) {
        var libPath = CFG.LIBRARY_FILES[i];
        var fileName = libPath.replace(/\//g, '_');
        var snapshotFile = new File(snapshotFolder.fsName + '/' + fileName);

        if (!snapshotFile.exists) {
            alert('Error\nSnapshot file missing: ' + fileName);
            return;
        }

        // Read snapshot content
        snapshotFile.encoding = 'UTF-8';
        snapshotFile.open('r');
        var content = snapshotFile.read();
        snapshotFile.close();

        // Write to library file
        var targetFile = new File(repoRoot + '/' + libPath);
        targetFile.encoding = 'UTF-8';
        targetFile.open('w');
        targetFile.write(content);
        targetFile.close();
    }

    // Update current marker
    updateCurrentMarker(targetVersion.timestamp);

    alert('Rollback Complete\n' +
          'Restored to version: ' + formatTimestamp(targetVersion.timestamp) + '\n' +
          'Files restored: ' + CFG.LIBRARY_FILES.length + '\n\n' +
          'Previous state backed up as snapshot.');
}

/**
 * Show diff report between versions
 * @param {Object} dialog - The dialog object
 */
function showDiffReport(dialog) {
    var versions = getAvailableVersions();
    if (versions.length < 2) {
        alert('Insufficient Versions\nNeed at least 2 versions to compare');
        return;
    }

    var fromIdx = dialog.versionList.selection ? dialog.versionList.selection.index : -1;
    var toIdx = dialog.compareList.selection ? dialog.compareList.selection.index : -1;

    if (fromIdx === -1 || toIdx === -1) {
        alert('No Selection\nPlease select two versions to compare');
        return;
    }

    var fromVersion = versions[fromIdx];
    var toVersion = versions[toIdx];

    generateDiffReport(fromVersion, toVersion);
}

/**
 * List all available versions
 */
function listVersions() {
    var versions = getAvailableVersions();

    if (versions.length === 0) {
        alert('No Versions\nNo version snapshots found');
        return;
    }

    var current = getCurrentVersion();
    var report = ['Available Library Versions', '=========================', ''];

    for (var i = 0; i < versions.length; i++) {
        var v = versions[i];
        var isCurrent = (current && v.timestamp === current);

        report.push((isCurrent ? '* ' : '  ') + formatTimestamp(v.timestamp));
        report.push('  Author: ' + v.author);
        report.push('  Description: ' + v.description);
        report.push('  Lines: ' + v.lineCount + ' | Functions: ' + v.functionCount);
        report.push('');
    }

    report.push('Total versions: ' + versions.length);
    report.push('* = Current version');

    alert(report.join('\n'));
}

/**
 * Analyze breaking changes between versions
 */
function analyzeBreakingChanges() {
    var versions = getAvailableVersions();
    if (versions.length < 2) {
        alert('Insufficient Versions\nNeed at least 2 versions to analyze');
        return;
    }

    var changes = [];

    for (var i = 1; i < versions.length; i++) {
        var prev = versions[i];
        var curr = versions[i - 1];

        var breaking = detectBreakingChanges(prev, curr);
        if (breaking.length > 0) {
            changes.push({
                from: prev.timestamp,
                to: curr.timestamp,
                breaking: breaking
            });
        }
    }

    generateBreakingChangesReport(changes);
}

/**
 * Detect breaking changes between two versions
 * @param {Object} fromVersion - Source version
 * @param {Object} toVersion - Target version
 * @returns {Array} Array of breaking changes
 */
function detectBreakingChanges(fromVersion, toVersion) {
    var changes = [];
    var snapshotFrom = new Folder(CFG.VERSION_FOLDER + CFG.SNAPSHOT_PREFIX + fromVersion.timestamp);
    var snapshotTo = new Folder(CFG.VERSION_FOLDER + CFG.SNAPSHOT_PREFIX + toVersion.timestamp);

    for (var i = 0; i < CFG.LIBRARY_FILES.length; i++) {
        var libPath = CFG.LIBRARY_FILES[i];
        var fileName = libPath.replace(/\//g, '_');

        var fileFrom = new File(snapshotFrom.fsName + '/' + fileName);
        var fileTo = new File(snapshotTo.fsName + '/' + fileName);

        if (!fileFrom.exists || !fileTo.exists) continue;

        fileFrom.encoding = 'UTF-8';
        fileFrom.open('r');
        var contentFrom = fileFrom.read();
        fileFrom.close();

        fileTo.encoding = 'UTF-8';
        fileTo.open('r');
        var contentTo = fileTo.read();
        fileTo.close();

        // Check each breaking pattern
        for (var j = 0; j < CFG.BREAKING_PATTERNS.length; j++) {
            var pattern = CFG.BREAKING_PATTERNS[j];
            var matchesFrom = extractMatches(contentFrom, pattern);
            var matchesTo = extractMatches(contentTo, pattern);

            // Find removed or modified items
            for (var k = 0; k < matchesFrom.length; k++) {
                if (AIS.Array.indexOf(matchesTo, matchesFrom[k]) === -1) {
                    changes.push({
                        file: libPath,
                        type: getPatternType(j),
                        item: matchesFrom[k],
                        action: 'removed'
                    });
                }
            }
        }
    }

    return changes;
}

// ============================================================================
// USER INTERFACE
// ============================================================================

/**
 * Create the main dialog
 * @returns {Window} The dialog window
 */
function createDialog() {
    var dialog = new Window('dialog', 'Manage Library Versions');
    dialog.alignChildren = ['fill', 'top'];
    dialog.spacing = 10;
    dialog.margins = 16;

    // Action selection
    var actionGroup = dialog.add('panel', undefined, 'Action');
    actionGroup.alignChildren = ['left', 'top'];
    actionGroup.spacing = 8;
    actionGroup.margins = 10;

    var snapshotRadio = actionGroup.add('radiobutton', undefined, 'Create Snapshot');
    var rollbackRadio = actionGroup.add('radiobutton', undefined, 'Rollback to Version');
    var diffRadio = actionGroup.add('radiobutton', undefined, 'Compare Versions (Diff)');
    var listRadio = actionGroup.add('radiobutton', undefined, 'List All Versions');
    var analyzeRadio = actionGroup.add('radiobutton', undefined, 'Analyze Breaking Changes');

    snapshotRadio.value = true;

    dialog.snapshotRadio = snapshotRadio;
    dialog.rollbackRadio = rollbackRadio;
    dialog.diffRadio = diffRadio;
    dialog.listRadio = listRadio;
    dialog.analyzeRadio = analyzeRadio;

    // Snapshot details panel
    var detailsPanel = dialog.add('panel', undefined, 'Snapshot Details');
    detailsPanel.alignChildren = ['fill', 'top'];
    detailsPanel.spacing = 8;
    detailsPanel.margins = 10;

    var authorGroup = detailsPanel.add('group');
    authorGroup.add('statictext', undefined, 'Author:');
    var authorField = authorGroup.add('edittext', undefined, AIS.System.isMac() ? $.getenv('USER') : $.getenv('USERNAME'));
    authorField.characters = 30;
    dialog.authorField = authorField;

    var descGroup = detailsPanel.add('group');
    descGroup.add('statictext', undefined, 'Description:');
    var descField = descGroup.add('edittext', undefined, '');
    descField.characters = 30;
    dialog.descriptionField = descField;

    // Version list panel
    var versionPanel = dialog.add('panel', undefined, 'Available Versions');
    versionPanel.alignChildren = ['fill', 'top'];
    versionPanel.spacing = 8;
    versionPanel.margins = 10;
    versionPanel.minimumSize = [500, 150];

    var versionList = versionPanel.add('listbox', undefined, [], {multiselect: false});
    versionList.minimumSize = [480, 120];
    dialog.versionList = versionList;

    var comparePanel = dialog.add('panel', undefined, 'Compare With');
    comparePanel.alignChildren = ['fill', 'top'];
    comparePanel.spacing = 8;
    comparePanel.margins = 10;
    comparePanel.minimumSize = [500, 150];
    comparePanel.visible = false;

    var compareList = comparePanel.add('listbox', undefined, [], {multiselect: false});
    compareList.minimumSize = [480, 120];
    dialog.compareList = compareList;
    dialog.comparePanel = comparePanel;

    // Populate version lists
    populateVersionLists(dialog);

    // Action radio button handlers
    snapshotRadio.onClick = function() {
        detailsPanel.visible = true;
        versionPanel.visible = false;
        comparePanel.visible = false;
    };

    rollbackRadio.onClick = function() {
        detailsPanel.visible = false;
        versionPanel.visible = true;
        comparePanel.visible = false;
    };

    diffRadio.onClick = function() {
        detailsPanel.visible = false;
        versionPanel.visible = true;
        comparePanel.visible = true;
    };

    listRadio.onClick = function() {
        detailsPanel.visible = false;
        versionPanel.visible = false;
        comparePanel.visible = false;
    };

    analyzeRadio.onClick = function() {
        detailsPanel.visible = false;
        versionPanel.visible = false;
        comparePanel.visible = false;
    };

    // Buttons
    var buttonGroup = dialog.add('group');
    buttonGroup.alignment = ['right', 'top'];
    var okBtn = buttonGroup.add('button', undefined, 'OK', {name: 'ok'});
    var cancelBtn = buttonGroup.add('button', undefined, 'Cancel', {name: 'cancel'});

    return dialog;
}

/**
 * Get selected action from dialog
 * @param {Object} dialog - The dialog object
 * @returns {String} The selected action
 */
function getSelectedAction(dialog) {
    if (dialog.snapshotRadio.value) return 'snapshot';
    if (dialog.rollbackRadio.value) return 'rollback';
    if (dialog.diffRadio.value) return 'diff';
    if (dialog.listRadio.value) return 'list';
    if (dialog.analyzeRadio.value) return 'analyze';
    return 'snapshot';
}

/**
 * Populate version list boxes
 * @param {Object} dialog - The dialog object
 */
function populateVersionLists(dialog) {
    var versions = getAvailableVersions();
    var current = getCurrentVersion();

    dialog.versionList.removeAll();
    dialog.compareList.removeAll();

    for (var i = 0; i < versions.length; i++) {
        var v = versions[i];
        var isCurrent = (current && v.timestamp === current);
        var label = formatTimestamp(v.timestamp) + ' - ' + v.description + (isCurrent ? ' (CURRENT)' : '');

        dialog.versionList.add('item', label);
        dialog.compareList.add('item', label);
    }

    if (versions.length > 0) {
        dialog.versionList.selection = 0;
        dialog.compareList.selection = versions.length > 1 ? 1 : 0;
    }
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Get repository root folder
 * @returns {String} Repository root path
 */
function getRepositoryRoot() {
    var scriptFile = new File($.fileName);
    var scriptFolder = scriptFile.parent;
    return scriptFolder.parent.fsName;
}

/**
 * Get all available versions
 * @returns {Array} Array of version metadata objects
 */
function getAvailableVersions() {
    var versionFolder = new Folder(CFG.VERSION_FOLDER);
    if (!versionFolder.exists) {
        return [];
    }

    var versions = [];
    var folders = versionFolder.getFiles(function(f) {
        return f instanceof Folder && f.name.indexOf(CFG.SNAPSHOT_PREFIX) === 0;
    });

    for (var i = 0; i < folders.length; i++) {
        var metaFile = new File(folders[i].fsName + '/metadata.json');
        if (metaFile.exists) {
            metaFile.encoding = 'UTF-8';
            metaFile.open('r');
            var metadata = AIS.JSON.parse(metaFile.read());
            metaFile.close();
            versions.push(metadata);
        }
    }

    // Sort by timestamp descending (newest first)
    versions.sort(function(a, b) {
        return b.timestamp - a.timestamp;
    });

    return versions;
}

/**
 * Get current version timestamp
 * @returns {Number} Current version timestamp or null
 */
function getCurrentVersion() {
    var markerFile = new File(CFG.VERSION_FOLDER + CFG.CURRENT_MARKER);
    if (!markerFile.exists) {
        return null;
    }

    markerFile.encoding = 'UTF-8';
    markerFile.open('r');
    var timestamp = parseInt(markerFile.read(), 10);
    markerFile.close();

    return timestamp;
}

/**
 * Update current version marker
 * @param {Number} timestamp - Version timestamp
 */
function updateCurrentMarker(timestamp) {
    var folder = new Folder(CFG.VERSION_FOLDER);
    if (!folder.exists) {
        folder.create();
    }

    var markerFile = new File(CFG.VERSION_FOLDER + CFG.CURRENT_MARKER);
    markerFile.encoding = 'UTF-8';
    markerFile.open('w');
    markerFile.write(timestamp.toString());
    markerFile.close();
}

/**
 * Analyze library file content
 * @param {String} content - File content
 * @returns {Object} Metadata object
 */
function analyzeLibraryFile(content) {
    var lines = content.split('\n');
    var functions = 0;

    for (var i = 0; i < lines.length; i++) {
        if (/function\s+\w+\s*\(/.test(lines[i])) {
            functions++;
        }
    }

    return {
        lines: lines.length,
        functions: functions
    };
}

/**
 * Simple string hash function
 * @param {String} str - String to hash
 * @returns {String} Hash string
 */
function hashString(str) {
    var hash = 0;
    for (var i = 0; i < str.length; i++) {
        var char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16);
}

/**
 * Format timestamp for display
 * @param {Number} timestamp - Unix timestamp
 * @returns {String} Formatted date string
 */
function formatTimestamp(timestamp) {
    var date = new Date(timestamp);
    var year = date.getFullYear();
    var month = padZero(date.getMonth() + 1);
    var day = padZero(date.getDate());
    var hours = padZero(date.getHours());
    var minutes = padZero(date.getMinutes());

    return year + '-' + month + '-' + day + ' ' + hours + ':' + minutes;
}

/**
 * Pad number with zero
 * @param {Number} num - Number to pad
 * @returns {String} Padded string
 */
function padZero(num) {
    return num < 10 ? '0' + num : num.toString();
}

/**
 * Extract pattern matches from content
 * @param {String} content - Content to search
 * @param {RegExp} pattern - Pattern to match
 * @returns {Array} Array of matches
 */
function extractMatches(content, pattern) {
    var matches = [];
    var match;

    // Reset regex state
    pattern.lastIndex = 0;

    while ((match = pattern.exec(content)) !== null) {
        if (match[1]) {
            matches.push(match[1]);
        }
    }

    return matches;
}

/**
 * Get pattern type description
 * @param {Number} index - Pattern index
 * @returns {String} Pattern type
 */
function getPatternType(index) {
    var types = ['function', 'object', 'method', 'param_type', 'return_type', 'deprecated'];
    return types[index] || 'unknown';
}

/**
 * Generate diff report between two versions
 * @param {Object} fromVersion - Source version
 * @param {Object} toVersion - Target version
 */
function generateDiffReport(fromVersion, toVersion) {
    var html = [];

    html.push('<!DOCTYPE html>');
    html.push('<html><head><meta charset="UTF-8">');
    html.push('<title>' + CFG.REPORT_TITLE + ' - Diff Report</title>');
    html.push('<style>');
    html.push('body { font-family: "Segoe UI", Arial, sans-serif; margin: 20px; background: #f5f5f5; }');
    html.push('h1 { color: ' + CFG.COLORS.header + '; border-bottom: 2px solid #ddd; padding-bottom: 10px; }');
    html.push('h2 { color: #333; margin-top: 30px; }');
    html.push('.diff-line { font-family: "Courier New", monospace; padding: 2px 8px; white-space: pre-wrap; }');
    html.push('.added { background: ' + CFG.COLORS.added + '; }');
    html.push('.removed { background: ' + CFG.COLORS.removed + '; }');
    html.push('.context { background: white; color: #666; }');
    html.push('.file-header { background: #eee; padding: 8px; margin-top: 20px; font-weight: bold; }');
    html.push('</style></head><body>');

    html.push('<h1>Library Version Diff Report</h1>');
    html.push('<p><strong>From:</strong> ' + formatTimestamp(fromVersion.timestamp) + ' - ' + fromVersion.description + '</p>');
    html.push('<p><strong>To:</strong> ' + formatTimestamp(toVersion.timestamp) + ' - ' + toVersion.description + '</p>');

    var snapshotFrom = new Folder(CFG.VERSION_FOLDER + CFG.SNAPSHOT_PREFIX + fromVersion.timestamp);
    var snapshotTo = new Folder(CFG.VERSION_FOLDER + CFG.SNAPSHOT_PREFIX + toVersion.timestamp);

    for (var i = 0; i < CFG.LIBRARY_FILES.length; i++) {
        var libPath = CFG.LIBRARY_FILES[i];
        var fileName = libPath.replace(/\//g, '_');

        var fileFrom = new File(snapshotFrom.fsName + '/' + fileName);
        var fileTo = new File(snapshotTo.fsName + '/' + fileName);

        if (!fileFrom.exists || !fileTo.exists) continue;

        fileFrom.encoding = 'UTF-8';
        fileFrom.open('r');
        var contentFrom = fileFrom.read();
        fileFrom.close();

        fileTo.encoding = 'UTF-8';
        fileTo.open('r');
        var contentTo = fileTo.read();
        fileTo.close();

        var diff = computeDiff(contentFrom.split('\n'), contentTo.split('\n'));

        html.push('<div class="file-header">' + libPath + '</div>');
        html.push('<div class="diff-container">');

        for (var j = 0; j < diff.length && j < CFG.MAX_DIFF_LINES; j++) {
            var line = diff[j];
            var cssClass = line.type === 'add' ? 'added' : (line.type === 'remove' ? 'removed' : 'context');
            var prefix = line.type === 'add' ? '+ ' : (line.type === 'remove' ? '- ' : '  ');
            html.push('<div class="diff-line ' + cssClass + '">' + escapeHtml(prefix + line.text) + '</div>');
        }

        if (diff.length > CFG.MAX_DIFF_LINES) {
            html.push('<p><em>... ' + (diff.length - CFG.MAX_DIFF_LINES) + ' more lines omitted</em></p>');
        }

        html.push('</div>');
    }

    html.push('</body></html>');

    var reportFile = new File(CFG.VERSION_FOLDER + CFG.REPORT_FILE);
    reportFile.encoding = 'UTF-8';
    reportFile.open('w');
    reportFile.write(html.join('\n'));
    reportFile.close();

    reportFile.execute();

    alert('Diff Report Generated\nReport opened in default browser');
}

/**
 * Compute diff between two arrays of lines
 * @param {Array} linesFrom - Source lines
 * @param {Array} linesTo - Target lines
 * @returns {Array} Array of diff objects
 */
function computeDiff(linesFrom, linesTo) {
    var diff = [];
    var i = 0;
    var j = 0;

    while (i < linesFrom.length || j < linesTo.length) {
        if (i >= linesFrom.length) {
            diff.push({type: 'add', text: linesTo[j]});
            j++;
        } else if (j >= linesTo.length) {
            diff.push({type: 'remove', text: linesFrom[i]});
            i++;
        } else if (linesFrom[i] === linesTo[j]) {
            diff.push({type: 'context', text: linesFrom[i]});
            i++;
            j++;
        } else {
            // Simple heuristic: check if next line matches
            if (i + 1 < linesFrom.length && linesFrom[i + 1] === linesTo[j]) {
                diff.push({type: 'remove', text: linesFrom[i]});
                i++;
            } else if (j + 1 < linesTo.length && linesFrom[i] === linesTo[j + 1]) {
                diff.push({type: 'add', text: linesTo[j]});
                j++;
            } else {
                diff.push({type: 'remove', text: linesFrom[i]});
                diff.push({type: 'add', text: linesTo[j]});
                i++;
                j++;
            }
        }
    }

    return diff;
}

/**
 * Generate breaking changes report
 * @param {Array} changes - Array of breaking changes
 */
function generateBreakingChangesReport(changes) {
    var html = [];

    html.push('<!DOCTYPE html>');
    html.push('<html><head><meta charset="UTF-8">');
    html.push('<title>' + CFG.REPORT_TITLE + ' - Breaking Changes</title>');
    html.push('<style>');
    html.push('body { font-family: "Segoe UI", Arial, sans-serif; margin: 20px; background: #f5f5f5; }');
    html.push('h1 { color: ' + CFG.COLORS.header + '; border-bottom: 2px solid #ddd; padding-bottom: 10px; }');
    html.push('.change-group { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid ' + CFG.COLORS.warning + '; }');
    html.push('.change-item { margin: 8px 0; padding: 8px; background: #f9f9f9; }');
    html.push('.warning { color: ' + CFG.COLORS.warning + '; font-weight: bold; }');
    html.push('</style></head><body>');

    html.push('<h1>Breaking Changes Analysis</h1>');

    if (changes.length === 0) {
        html.push('<p>No breaking changes detected between versions.</p>');
    } else {
        html.push('<p class="warning">Found ' + changes.length + ' version transitions with breaking changes:</p>');

        for (var i = 0; i < changes.length; i++) {
            var change = changes[i];
            html.push('<div class="change-group">');
            html.push('<h3>From ' + formatTimestamp(change.from) + ' to ' + formatTimestamp(change.to) + '</h3>');
            html.push('<p>Breaking changes: ' + change.breaking.length + '</p>');

            for (var j = 0; j < change.breaking.length; j++) {
                var item = change.breaking[j];
                html.push('<div class="change-item">');
                html.push('<strong>' + item.type + ':</strong> ' + item.item + ' (' + item.action + ')');
                html.push('<br><em>File: ' + item.file + '</em>');
                html.push('</div>');
            }

            html.push('</div>');
        }
    }

    html.push('</body></html>');

    var reportFile = new File(CFG.VERSION_FOLDER + 'breaking-changes-report.html');
    reportFile.encoding = 'UTF-8';
    reportFile.open('w');
    reportFile.write(html.join('\n'));
    reportFile.close();

    reportFile.execute();

    alert('Breaking Changes Report\n' +
          'Transitions analyzed: ' + changes.length + '\n' +
          'Report opened in default browser');
}

/**
 * Escape HTML special characters
 * @param {String} str - String to escape
 * @returns {String} Escaped string
 */
function escapeHtml(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// ============================================================================
// ENTRY POINT
// ============================================================================

main();
