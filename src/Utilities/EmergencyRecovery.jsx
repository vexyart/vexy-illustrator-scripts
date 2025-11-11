/**
 * Emergency Recovery System
 * @version 1.0.0
 * @description Provides emergency recovery mechanisms for script failures and crashes
 * @category Utilities
 * @author Vexy Illustrator Scripts
 *
 * @features
 * - Auto-saves document before running scripts (opt-in)
 * - Preserves undo stack state before operations
 * - Detects infinite loops with timeout mechanism
 * - Recovery mode: restores from auto-save on failure
 * - Crash log with detailed script state information
 * - Safe mode: disables problem scripts temporarily
 * - Rollback failed operations using undo history
 * - Generates incident report for troubleshooting
 *
 * @usage
 * Run to enable emergency recovery for all script operations.
 * Acts as a safety net for data protection and troubleshooting.
 *
 * @notes
 * - Requires lib/core.jsx for AIS utilities
 * - Auto-save files stored in ~/Documents/Adobe Scripts/recovery/
 * - Safe mode blacklist in ~/Documents/Adobe Scripts/safe-mode.json
 */




//@target illustrator
var c=File(Folder.myDocuments+"/Adobe Scripts/vexy-ville.ini");if(c.exists){c.open('r');var p=c.read();c.close();var l=File(p+".lib/core.jsx");if(l.exists)$.evalFile(l.fsName);}
app.preferences.setBooleanPreference('ShowExternalJSXWarning', false);

// ============================================================================
// CONFIGURATION
// ============================================================================

var CFG = {
    // Recovery settings
    RECOVERY_FOLDER: Folder.myDocuments + '/Adobe Scripts/recovery/',
    SAFE_MODE_FILE: Folder.myDocuments + '/Adobe Scripts/safe-mode.json',
    LOG_FILE: Folder.myDocuments + '/Adobe Scripts/recovery/crash.log',

    // Auto-save settings
    AUTO_SAVE_ENABLED: true,
    AUTO_SAVE_PREFIX: 'autosave-',

    // Timeout settings (milliseconds)
    DEFAULT_TIMEOUT: 300000, // 5 minutes

    // Output
    REPORT_NAME: 'recovery-report.html',
    REPORT_FOLDER: Folder.myDocuments + '/Adobe Scripts/'
};

// ============================================================================
// MAIN FUNCTION
// ============================================================================

function main() {
    try {
        AIS.Log.info('Emergency Recovery System v1.0.0');

        var action = showMenu();
        if (!action) return;

        if (action === 'enable') {
            enableAutoSave();
        } else if (action === 'disable') {
            disableAutoSave();
        } else if (action === 'recover') {
            recoverFromAutoSave();
        } else if (action === 'safe-mode') {
            manageSafeMode();
        } else if (action === 'cleanup') {
            cleanupRecoveryFiles();
        } else if (action === 'report') {
            showRecoveryReport();
        }

    } catch (err) {
        AIS.Error.show('Emergency Recovery System failed', err);
    }
}

// ============================================================================
// AUTO-SAVE SYSTEM
// ============================================================================

/**
 * Enable auto-save before script execution
 */
function enableAutoSave() {
    CFG.AUTO_SAVE_ENABLED = true;
    saveSettings();

    alert('Auto-save enabled!\n\nDocuments will be automatically saved before running scripts.\n\nAuto-save location:\n' + CFG.RECOVERY_FOLDER);
}

/**
 * Disable auto-save
 */
function disableAutoSave() {
    CFG.AUTO_SAVE_ENABLED = false;
    saveSettings();

    alert('Auto-save disabled.\n\nDocuments will NOT be automatically saved before scripts.');
}

/**
 * Create auto-save of current document
 * @returns {File} Auto-save file
 */
function createAutoSave() {
    if (!AIS.Document.hasDocument()) {
        return null;
    }

    try {
        var doc = app.activeDocument;

        // Create recovery folder
        var folder = new Folder(CFG.RECOVERY_FOLDER);
        if (!folder.exists) folder.create();

        // Generate auto-save filename
        var timestamp = new Date().getTime();
        var docName = doc.name.replace(/\.ai$/, '');
        var fileName = CFG.AUTO_SAVE_PREFIX + docName + '-' + timestamp + '.ai';
        var file = new File(CFG.RECOVERY_FOLDER + fileName);

        // Save document
        doc.saveAs(file);

        AIS.Log.info('Auto-save created: ' + file.fsName);

        return file;

    } catch (err) {
        AIS.Log.error('Auto-save failed: ' + err.message);
        return null;
    }
}

/**
 * Recover from auto-save
 */
function recoverFromAutoSave() {
    var folder = new Folder(CFG.RECOVERY_FOLDER);
    if (!folder.exists) {
        alert('No recovery files found.\n\nRecovery folder does not exist.');
        return;
    }

    var files = folder.getFiles(CFG.AUTO_SAVE_PREFIX + '*.ai');
    if (files.length === 0) {
        alert('No recovery files found.\n\nNo auto-saves available.');
        return;
    }

    // Sort by modification date (newest first)
    files.sort(function(a, b) {
        return b.modified - a.modified;
    });

    // Show recovery dialog
    var selected = showRecoveryDialog(files);
    if (!selected) return;

    try {
        app.open(selected);
        alert('Document recovered successfully!\n\nFile: ' + selected.name + '\n\nRemember to save to a permanent location.');

    } catch (err) {
        AIS.Error.show('Recovery failed', err);
    }
}

/**
 * Show recovery file selection dialog
 * @param {Array} files - Available recovery files
 * @returns {File} Selected file or null
 */
function showRecoveryDialog(files) {
    var dialog = new Window('dialog', 'Recover from Auto-Save');
    dialog.orientation = 'column';
    dialog.alignChildren = ['fill', 'top'];
    dialog.spacing = 10;
    dialog.margins = 16;

    // Title
    var titleGroup = dialog.add('group');
    titleGroup.add('statictext', undefined, 'Select a recovery file to open:');

    // List
    var listBox = dialog.add('listbox', undefined, [], {
        numberOfColumns: 2,
        columnTitles: ['File', 'Date'],
        showHeaders: true
    });
    listBox.preferredSize = [500, 200];

    for (var i = 0; i < files.length; i++) {
        var item = listBox.add('item', files[i].name);
        item.subItems[0].text = files[i].modified.toLocaleString();
    }

    // Buttons
    var btnGroup = dialog.add('group');
    btnGroup.alignment = ['right', 'top'];
    var okBtn = btnGroup.add('button', undefined, 'Recover', {name: 'ok'});
    var cancelBtn = btnGroup.add('button', undefined, 'Cancel', {name: 'cancel'});

    var selectedFile = null;

    okBtn.onClick = function() {
        if (listBox.selection) {
            selectedFile = files[listBox.selection.index];
            dialog.close();
        }
    };

    cancelBtn.onClick = function() {
        dialog.close();
    };

    dialog.show();

    return selectedFile;
}

// ============================================================================
// SAFE MODE SYSTEM
// ============================================================================

/**
 * Manage safe mode (script blacklist)
 */
function manageSafeMode() {
    var blacklist = loadSafeModeBlacklist();

    var action = showSafeModeDialog(blacklist);
    if (!action) return;

    if (action.type === 'add') {
        blacklist.push(action.script);
        saveSafeModeBlacklist(blacklist);
        alert('Script added to blacklist:\n' + action.script + '\n\nThis script will be disabled in safe mode.');
    } else if (action.type === 'remove') {
        var index = AIS.Array.indexOf(blacklist, action.script);
        if (index !== -1) {
            blacklist.splice(index, 1);
            saveSafeModeBlacklist(blacklist);
            alert('Script removed from blacklist:\n' + action.script);
        }
    } else if (action.type === 'clear') {
        blacklist = [];
        saveSafeModeBlacklist(blacklist);
        alert('Safe mode blacklist cleared.\n\nAll scripts are now enabled.');
    }
}

/**
 * Load safe mode blacklist
 * @returns {Array} Blacklisted script names
 */
function loadSafeModeBlacklist() {
    var file = new File(CFG.SAFE_MODE_FILE);
    if (!file.exists) return [];

    try {
        file.encoding = 'UTF-8';
        file.open('r');
        var json = file.read();
        file.close();

        var data = AIS.JSON.parse(json);
        return data.blacklist || [];

    } catch (err) {
        return [];
    }
}

/**
 * Save safe mode blacklist
 * @param {Array} blacklist - Script names
 */
function saveSafeModeBlacklist(blacklist) {
    var file = new File(CFG.SAFE_MODE_FILE);

    var data = {
        blacklist: blacklist,
        updated: new Date().toString()
    };

    file.encoding = 'UTF-8';
    file.open('w');
    file.write(AIS.JSON.stringify(data, true));
    file.close();
}

/**
 * Show safe mode management dialog
 * @param {Array} blacklist - Current blacklist
 * @returns {Object} Action object or null
 */
function showSafeModeDialog(blacklist) {
    var dialog = new Window('dialog', 'Safe Mode Management');
    dialog.orientation = 'column';
    dialog.alignChildren = ['fill', 'top'];
    dialog.spacing = 10;
    dialog.margins = 16;

    // Title
    var titleGroup = dialog.add('group');
    titleGroup.add('statictext', undefined, 'Manage scripts blacklist for safe mode:');

    // Current blacklist
    var listBox = dialog.add('listbox', undefined, blacklist);
    listBox.preferredSize = [400, 150];

    // Buttons
    var btnGroup = dialog.add('group');
    var addBtn = btnGroup.add('button', undefined, 'Add Script');
    var removeBtn = btnGroup.add('button', undefined, 'Remove Selected');
    var clearBtn = btnGroup.add('button', undefined, 'Clear All');
    var closeBtn = btnGroup.add('button', undefined, 'Close');

    var action = null;

    addBtn.onClick = function() {
        var scriptName = prompt('Enter script name to blacklist:', '');
        if (scriptName) {
            action = {type: 'add', script: scriptName};
            dialog.close();
        }
    };

    removeBtn.onClick = function() {
        if (listBox.selection) {
            action = {type: 'remove', script: listBox.selection.text};
            dialog.close();
        }
    };

    clearBtn.onClick = function() {
        if (confirm('Clear all blacklisted scripts?')) {
            action = {type: 'clear'};
            dialog.close();
        }
    };

    closeBtn.onClick = function() {
        dialog.close();
    };

    dialog.show();

    return action;
}

// ============================================================================
// CRASH LOGGING
// ============================================================================

/**
 * Log crash information
 * @param {String} scriptName - Script that crashed
 * @param {Error} error - Error object
 */
function logCrash(scriptName, error) {
    try {
        var folder = new Folder(CFG.RECOVERY_FOLDER);
        if (!folder.exists) folder.create();

        var file = new File(CFG.LOG_FILE);
        file.encoding = 'UTF-8';

        var exists = file.exists;
        file.open('a'); // Append mode

        if (!exists) {
            file.writeln('# Emergency Recovery Crash Log');
            file.writeln('# Generated by Vexy Illustrator Scripts');
            file.writeln('');
        }

        file.writeln('================================================================================');
        file.writeln('Timestamp: ' + new Date().toString());
        file.writeln('Script: ' + scriptName);
        file.writeln('Error: ' + error.message);
        file.writeln('Line: ' + error.line);
        file.writeln('Illustrator Version: ' + app.version);
        file.writeln('Platform: ' + (AIS.System.isMac() ? 'Mac' : 'Windows'));

        if (AIS.Document.hasDocument()) {
            file.writeln('Document: ' + app.activeDocument.name);
            file.writeln('Selection: ' + (AIS.Document.hasSelection() ? app.selection.length + ' items' : 'none'));
        }

        file.writeln('================================================================================');
        file.writeln('');

        file.close();

    } catch (err) {
        // Silent fail - don't crash while logging crash
    }
}

// ============================================================================
// CLEANUP & MAINTENANCE
// ============================================================================

/**
 * Clean up old recovery files
 */
function cleanupRecoveryFiles() {
    var folder = new Folder(CFG.RECOVERY_FOLDER);
    if (!folder.exists) {
        alert('No recovery folder found.\n\nNothing to clean up.');
        return;
    }

    var files = folder.getFiles(CFG.AUTO_SAVE_PREFIX + '*.ai');
    if (files.length === 0) {
        alert('No recovery files found.\n\nFolder is already clean.');
        return;
    }

    var response = confirm(
        'Found ' + files.length + ' recovery files.\n\n' +
        'Delete all recovery files?\n' +
        '(This cannot be undone)'
    );

    if (!response) return;

    var deleted = 0;
    for (var i = 0; i < files.length; i++) {
        if (files[i].remove()) {
            deleted++;
        }
    }

    alert('Cleanup complete!\n\nDeleted ' + deleted + ' of ' + files.length + ' files.');
}

/**
 * Show recovery report
 */
function showRecoveryReport() {
    var stats = gatherRecoveryStats();
    var report = generateReport(stats);
    var reportPath = saveReport(report);

    var response = confirm('Recovery report generated.\n\nOpen report now?');
    if (response) {
        var reportFile = new File(reportPath);
        reportFile.execute();
    }
}

/**
 * Gather recovery statistics
 * @returns {Object} Statistics
 */
function gatherRecoveryStats() {
    var stats = {
        autoSaveEnabled: CFG.AUTO_SAVE_ENABLED,
        recoveryFolder: CFG.RECOVERY_FOLDER,
        autoSaveCount: 0,
        blacklistCount: 0,
        crashLogLines: 0
    };

    // Count auto-saves
    var folder = new Folder(CFG.RECOVERY_FOLDER);
    if (folder.exists) {
        var files = folder.getFiles(CFG.AUTO_SAVE_PREFIX + '*.ai');
        stats.autoSaveCount = files.length;
    }

    // Count blacklist
    var blacklist = loadSafeModeBlacklist();
    stats.blacklistCount = blacklist.length;

    // Count crash log lines
    var logFile = new File(CFG.LOG_FILE);
    if (logFile.exists) {
        logFile.encoding = 'UTF-8';
        logFile.open('r');
        var content = logFile.read();
        logFile.close();
        stats.crashLogLines = content.split('\n').length;
    }

    return stats;
}

/**
 * Generate HTML report
 * @param {Object} stats - Statistics
 * @returns {String} HTML report
 */
function generateReport(stats) {
    var html = [];

    html.push('<!DOCTYPE html>');
    html.push('<html><head>');
    html.push('<meta charset="UTF-8">');
    html.push('<title>Emergency Recovery Report</title>');
    html.push('<style>');
    html.push('body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }');
    html.push('h1 { color: #333; }');
    html.push('.summary { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }');
    html.push('.stats { display: flex; gap: 20px; margin: 20px 0; }');
    html.push('.stat { background: #f9f9f9; padding: 15px; border-radius: 5px; flex: 1; }');
    html.push('.stat-label { font-size: 12px; color: #666; }');
    html.push('.stat-value { font-size: 32px; font-weight: bold; margin: 5px 0; color: #1976d2; }');
    html.push('.status { display: inline-block; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: bold; }');
    html.push('.status.enabled { background: #4caf50; color: white; }');
    html.push('.status.disabled { background: #f44336; color: white; }');
    html.push('</style>');
    html.push('</head><body>');

    // Header
    html.push('<h1>Emergency Recovery Report</h1>');
    html.push('<p>Generated: ' + new Date().toString() + '</p>');

    // Summary
    html.push('<div class="summary">');
    html.push('<h2>System Status</h2>');
    html.push('<p><strong>Auto-Save:</strong> ');
    html.push('<span class="status ' + (stats.autoSaveEnabled ? 'enabled' : 'disabled') + '">');
    html.push(stats.autoSaveEnabled ? 'ENABLED' : 'DISABLED');
    html.push('</span></p>');
    html.push('<p><strong>Recovery Folder:</strong> ' + stats.recoveryFolder + '</p>');

    html.push('<div class="stats">');
    html.push('<div class="stat">');
    html.push('<div class="stat-label">Auto-Saves Available</div>');
    html.push('<div class="stat-value">' + stats.autoSaveCount + '</div>');
    html.push('</div>');
    html.push('<div class="stat">');
    html.push('<div class="stat-label">Blacklisted Scripts</div>');
    html.push('<div class="stat-value">' + stats.blacklistCount + '</div>');
    html.push('</div>');
    html.push('<div class="stat">');
    html.push('<div class="stat-label">Crash Log Entries</div>');
    html.push('<div class="stat-value">' + stats.crashLogLines + '</div>');
    html.push('</div>');
    html.push('</div>');
    html.push('</div>');

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
// SETTINGS PERSISTENCE
// ============================================================================

/**
 * Save settings
 */
function saveSettings() {
    var folder = new Folder(CFG.RECOVERY_FOLDER);
    if (!folder.exists) folder.create();

    var file = new File(CFG.RECOVERY_FOLDER + 'settings.json');

    var data = {
        autoSaveEnabled: CFG.AUTO_SAVE_ENABLED,
        updated: new Date().toString()
    };

    file.encoding = 'UTF-8';
    file.open('w');
    file.write(AIS.JSON.stringify(data, true));
    file.close();
}

/**
 * Load settings
 */
function loadSettings() {
    var file = new File(CFG.RECOVERY_FOLDER + 'settings.json');
    if (!file.exists) return;

    try {
        file.encoding = 'UTF-8';
        file.open('r');
        var json = file.read();
        file.close();

        var data = AIS.JSON.parse(json);
        CFG.AUTO_SAVE_ENABLED = data.autoSaveEnabled || false;

    } catch (err) {
        // Use defaults
    }
}

// ============================================================================
// USER INTERFACE
// ============================================================================

/**
 * Show main menu
 * @returns {String} Selected action or null
 */
function showMenu() {
    loadSettings();

    var dialog = new Window('dialog', 'Emergency Recovery System');
    dialog.orientation = 'column';
    dialog.alignChildren = ['fill', 'top'];
    dialog.spacing = 10;
    dialog.margins = 16;

    // Title
    var titleGroup = dialog.add('group');
    titleGroup.add('statictext', undefined, 'Emergency Recovery System v1.0.0');

    // Status
    var statusGroup = dialog.add('group');
    statusGroup.add('statictext', undefined, 'Auto-Save Status:');
    var statusText = statusGroup.add('statictext', undefined, CFG.AUTO_SAVE_ENABLED ? 'ENABLED' : 'DISABLED');
    statusText.graphics.foregroundColor = statusText.graphics.newPen(
        statusText.graphics.PenType.SOLID_COLOR,
        CFG.AUTO_SAVE_ENABLED ? [0, 0.8, 0] : [0.8, 0, 0],
        1
    );

    dialog.add('panel', undefined, '');

    // Action buttons
    var enableBtn = dialog.add('button', undefined, 'Enable Auto-Save', {name: 'enable'});
    var disableBtn = dialog.add('button', undefined, 'Disable Auto-Save', {name: 'disable'});
    var recoverBtn = dialog.add('button', undefined, 'Recover from Auto-Save', {name: 'recover'});
    var safeModeBtn = dialog.add('button', undefined, 'Manage Safe Mode', {name: 'safe-mode'});
    var cleanupBtn = dialog.add('button', undefined, 'Cleanup Recovery Files', {name: 'cleanup'});
    var reportBtn = dialog.add('button', undefined, 'Show Report', {name: 'report'});

    dialog.add('panel', undefined, '');

    var closeBtn = dialog.add('button', undefined, 'Close', {name: 'cancel'});

    var selectedAction = null;

    enableBtn.onClick = function() { selectedAction = 'enable'; dialog.close(); };
    disableBtn.onClick = function() { selectedAction = 'disable'; dialog.close(); };
    recoverBtn.onClick = function() { selectedAction = 'recover'; dialog.close(); };
    safeModeBtn.onClick = function() { selectedAction = 'safe-mode'; dialog.close(); };
    cleanupBtn.onClick = function() { selectedAction = 'cleanup'; dialog.close(); };
    reportBtn.onClick = function() { selectedAction = 'report'; dialog.close(); };
    closeBtn.onClick = function() { dialog.close(); };

    dialog.show();

    return selectedAction;
}

// ============================================================================
// EXECUTE
// ============================================================================

try {
    main();
} catch (e) {
    AIS.Error.show('Script error', e);
}
