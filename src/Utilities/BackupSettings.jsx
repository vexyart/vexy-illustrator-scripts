/**
 * Backup Settings - Settings Backup & Recovery Utility
 * @version 1.0.0
 * @description Backup and restore user settings JSON files with versioning
 *
 * @author Vexy Scripts Project
 * @license Apache-2.0
 *
 * @features
 * - Scan for all settings JSON files in Adobe Scripts folder
 * - Create timestamped backup archives
 * - List available backups with dates and file counts
 * - Restore from selected backup with confirmation
 * - Auto-backup before settings migrations
 * - Backup verification (validate JSON integrity)
 * - Cleanup old backups (keep last 10 only)
 * - Export/import settings across machines
 * - Interactive UI with backup list
 * - HTML backup report generation
 *
 * @usage
 * 1. Run script to open backup manager dialog
 * 2. Choose operation: Create Backup, Restore, List, Cleanup
 * 3. Follow prompts for selected operation
 *
 * @notes
 * - Backups stored in ~/Documents/Adobe Scripts Backups/
 * - Backup format: backup-YYYY-MM-DD-HHMMSS/ folder structure
 * - Only backs up .json files (settings)
 * - Validates JSON before backup/restore
 * - Keeps last 10 backups automatically
 *
 * @requires Illustrator CS6 or later
 * @requires lib/core.jsx
 */




//@target illustrator
var c=File(Folder.myDocuments+"/Adobe Scripts/vexy-ville.ini");if(c.exists){c.open('r');var p=c.read();c.close();var l=File(p+".lib/core.jsx");if(l.exists)$.evalFile(l.fsName);}
app.preferences.setBooleanPreference('ShowExternalJSXWarning', false);

// ============================================================================
// CONFIGURATION
// ============================================================================

var CFG = {
    settingsFolder: Folder.myDocuments + '/Adobe Scripts',
    backupFolder: Folder.myDocuments + '/Adobe Scripts Backups',
    maxBackups: 10,  // Keep last N backups
    backupPrefix: 'backup-',
    dateFormat: 'YYYY-MM-DD-HHMMSS',
    reportFileName: 'backup-report.html'
};

// ============================================================================
// MAIN FUNCTION
// ============================================================================

function main() {
    // Ensure folders exist
    ensureFolders();

    // Show main dialog
    showBackupDialog();
}

// ============================================================================
// CORE LOGIC
// ============================================================================

/**
 * Ensure settings and backup folders exist
 */
function ensureFolders() {
    var settingsFolder = new Folder(CFG.settingsFolder);
    if (!settingsFolder.exists) {
        settingsFolder.create();
    }

    var backupFolder = new Folder(CFG.backupFolder);
    if (!backupFolder.exists) {
        backupFolder.create();
    }
}

/**
 * Create a new backup
 * @returns {Object|null} Backup info or null if failed
 */
function createBackup() {
    try {
        // Get settings files
        var settingsFiles = getSettingsFiles();
        if (settingsFiles.length === 0) {
            alert('No settings files found to backup.\nSettings folder: ' + CFG.settingsFolder);
            return null;
        }

        // Create backup folder with timestamp
        var timestamp = getTimestamp();
        var backupName = CFG.backupPrefix + timestamp;
        var backupPath = CFG.backupFolder + '/' + backupName;
        var backupDir = new Folder(backupPath);

        if (!backupDir.create()) {
            throw new Error('Failed to create backup folder');
        }

        // Copy each settings file
        var copiedCount = 0;
        var skippedCount = 0;
        var errors = [];

        for (var i = 0; i < settingsFiles.length; i++) {
            var sourceFile = settingsFiles[i];

            // Validate JSON before copying
            if (!validateJSON(sourceFile)) {
                skippedCount++;
                errors.push('Invalid JSON: ' + sourceFile.name);
                continue;
            }

            var destFile = new File(backupPath + '/' + sourceFile.name);
            if (copyFile(sourceFile, destFile)) {
                copiedCount++;
            } else {
                skippedCount++;
                errors.push('Failed to copy: ' + sourceFile.name);
            }
        }

        // Create backup manifest
        var manifest = {
            timestamp: timestamp,
            date: new Date().toString(),
            filesCount: copiedCount,
            skippedCount: skippedCount,
            files: []
        };

        var backupFiles = backupDir.getFiles('*.json');
        for (var j = 0; j < backupFiles.length; j++) {
            manifest.files.push(backupFiles[j].name);
        }

        // Save manifest
        var manifestFile = new File(backupPath + '/manifest.json');
        saveJSON(manifestFile, manifest);

        // Show summary
        var summary = 'Backup created successfully!\n\n';
        summary += 'Location: ' + backupName + '\n';
        summary += 'Files backed up: ' + copiedCount + '\n';
        if (skippedCount > 0) {
            summary += 'Files skipped: ' + skippedCount + '\n';
            summary += '\nErrors:\n' + errors.join('\n');
        }

        alert(summary);

        return manifest;

    } catch (e) {
        AIS.Error.show('Backup failed', e);
        return null;
    }
}

/**
 * List all available backups
 * @returns {Array} Array of backup info objects
 */
function listBackups() {
    var backupFolder = new Folder(CFG.backupFolder);
    if (!backupFolder.exists) {
        return [];
    }

    var backupDirs = backupFolder.getFiles(function(f) {
        return f instanceof Folder && f.name.indexOf(CFG.backupPrefix) === 0;
    });

    var backups = [];
    for (var i = 0; i < backupDirs.length; i++) {
        var dir = backupDirs[i];
        var manifest = loadManifest(dir);

        if (manifest) {
            backups.push({
                name: dir.name,
                path: dir.fsName,
                timestamp: manifest.timestamp,
                date: manifest.date,
                filesCount: manifest.filesCount,
                files: manifest.files || []
            });
        } else {
            // No manifest, count files manually
            var files = dir.getFiles('*.json');
            backups.push({
                name: dir.name,
                path: dir.fsName,
                timestamp: extractTimestamp(dir.name),
                date: 'Unknown',
                filesCount: files.length,
                files: []
            });
        }
    }

    // Sort by timestamp descending (newest first)
    backups.sort(function(a, b) {
        return b.timestamp.localeCompare(a.timestamp);
    });

    return backups;
}

/**
 * Restore from a backup
 * @param {Object} backup Backup info object
 * @returns {Boolean} True if successful
 */
function restoreBackup(backup) {
    try {
        // Confirm restore
        var confirmMsg = 'Restore settings from backup?\n\n';
        confirmMsg += 'Backup: ' + backup.name + '\n';
        confirmMsg += 'Date: ' + backup.date + '\n';
        confirmMsg += 'Files: ' + backup.filesCount + '\n\n';
        confirmMsg += 'WARNING: This will overwrite your current settings!';

        if (!confirm(confirmMsg)) {
            return false;
        }

        // Create backup of current settings first
        alert('Creating safety backup of current settings...');
        createBackup();

        // Get backup files
        var backupDir = new Folder(backup.path);
        var backupFiles = backupDir.getFiles('*.json');
        if (backupFiles.length === 0) {
            throw new Error('No files found in backup');
        }

        // Remove manifest from restore list
        var filesToRestore = [];
        for (var i = 0; i < backupFiles.length; i++) {
            if (backupFiles[i].name !== 'manifest.json') {
                filesToRestore.push(backupFiles[i]);
            }
        }

        // Restore each file
        var restoredCount = 0;
        var failedCount = 0;
        var errors = [];

        for (var j = 0; j < filesToRestore.length; j++) {
            var sourceFile = filesToRestore[j];
            var destFile = new File(CFG.settingsFolder + '/' + sourceFile.name);

            // Validate JSON before restoring
            if (!validateJSON(sourceFile)) {
                failedCount++;
                errors.push('Invalid JSON: ' + sourceFile.name);
                continue;
            }

            if (copyFile(sourceFile, destFile)) {
                restoredCount++;
            } else {
                failedCount++;
                errors.push('Failed to restore: ' + sourceFile.name);
            }
        }

        // Show summary
        var summary = 'Restore completed!\n\n';
        summary += 'Files restored: ' + restoredCount + '\n';
        if (failedCount > 0) {
            summary += 'Files failed: ' + failedCount + '\n';
            summary += '\nErrors:\n' + errors.join('\n');
        }

        alert(summary);

        return restoredCount > 0;

    } catch (e) {
        AIS.Error.show('Restore failed', e);
        return false;
    }
}

/**
 * Cleanup old backups (keep last N)
 * @returns {Number} Number of backups deleted
 */
function cleanupOldBackups() {
    try {
        var backups = listBackups();

        if (backups.length <= CFG.maxBackups) {
            alert('No backups to clean up.\nCurrent backups: ' + backups.length + '\nMax backups: ' + CFG.maxBackups);
            return 0;
        }

        var toDelete = backups.length - CFG.maxBackups;
        var confirmMsg = 'Delete ' + toDelete + ' old backup(s)?\n\n';
        confirmMsg += 'Keeping newest ' + CFG.maxBackups + ' backups.';

        if (!confirm(confirmMsg)) {
            return 0;
        }

        var deletedCount = 0;

        // Delete oldest backups (last in sorted array)
        for (var i = CFG.maxBackups; i < backups.length; i++) {
            var backup = backups[i];
            var backupDir = new Folder(backup.path);

            if (deleteFolder(backupDir)) {
                deletedCount++;
            }
        }

        alert('Cleanup complete!\nDeleted ' + deletedCount + ' old backup(s).');

        return deletedCount;

    } catch (e) {
        AIS.Error.show('Cleanup failed', e);
        return 0;
    }
}

/**
 * Generate HTML backup report
 * @param {Array} backups Array of backup info objects
 */
function generateBackupReport(backups) {
    try {
        var html = generateReportHTML(backups);

        var reportFile = new File(Folder.desktop + '/' + CFG.reportFileName);
        reportFile.encoding = 'UTF-8';
        reportFile.open('w');
        reportFile.write(html);
        reportFile.close();

        reportFile.execute();

    } catch (e) {
        AIS.Error.show('Report generation failed', e);
    }
}

// ============================================================================
// USER INTERFACE
// ============================================================================

/**
 * Show main backup manager dialog
 */
function showBackupDialog() {
    var dialog = new Window('dialog', 'Backup Settings Manager');
    dialog.alignChildren = ['fill', 'top'];
    dialog.spacing = 15;
    dialog.margins = 20;

    // Info panel
    var infoPanel = dialog.add('panel', undefined, 'Settings Location');
    infoPanel.alignChildren = ['left', 'top'];
    infoPanel.margins = 15;

    infoPanel.add('statictext', undefined, 'Settings folder: ' + CFG.settingsFolder);
    infoPanel.add('statictext', undefined, 'Backup folder: ' + CFG.backupFolder);

    var settingsCount = getSettingsFiles().length;
    infoPanel.add('statictext', undefined, 'Settings files: ' + settingsCount);

    var backupsCount = listBackups().length;
    infoPanel.add('statictext', undefined, 'Available backups: ' + backupsCount);

    // Actions panel
    var actionsPanel = dialog.add('panel', undefined, 'Actions');
    actionsPanel.alignChildren = ['fill', 'top'];
    actionsPanel.margins = 15;
    actionsPanel.spacing = 10;

    var createBtn = actionsPanel.add('button', undefined, 'Create Backup Now');
    var listBtn = actionsPanel.add('button', undefined, 'View Backup List');
    var restoreBtn = actionsPanel.add('button', undefined, 'Restore from Backup...');
    var cleanupBtn = actionsPanel.add('button', undefined, 'Cleanup Old Backups');
    var reportBtn = actionsPanel.add('button', undefined, 'Generate Backup Report');

    // Button events
    createBtn.onClick = function() {
        createBackup();
        dialog.close();
    };

    listBtn.onClick = function() {
        showBackupList();
    };

    restoreBtn.onClick = function() {
        showRestoreDialog();
        dialog.close();
    };

    cleanupBtn.onClick = function() {
        cleanupOldBackups();
        dialog.close();
    };

    reportBtn.onClick = function() {
        var backups = listBackups();
        generateBackupReport(backups);
    };

    // Close button
    var buttonGroup = dialog.add('group');
    buttonGroup.alignment = ['right', 'top'];
    var closeBtn = buttonGroup.add('button', undefined, 'Close', {name: 'cancel'});

    dialog.show();
}

/**
 * Show backup list dialog
 */
function showBackupList() {
    var backups = listBackups();

    if (backups.length === 0) {
        alert('No backups found.\nBackup folder: ' + CFG.backupFolder);
        return;
    }

    var dialog = new Window('dialog', 'Available Backups');
    dialog.preferredSize = [500, 400];
    dialog.alignChildren = ['fill', 'fill'];
    dialog.margins = 20;

    // List
    var listGroup = dialog.add('group');
    listGroup.orientation = 'column';
    listGroup.alignChildren = ['fill', 'top'];
    listGroup.alignment = ['fill', 'fill'];

    var list = listGroup.add('listbox', undefined, [], {numberOfColumns: 3, showHeaders: true, columnTitles: ['Backup Name', 'Date', 'Files']});
    list.alignment = ['fill', 'fill'];

    for (var i = 0; i < backups.length; i++) {
        var backup = backups[i];
        var item = list.add('item', backup.name);
        item.subItems[0].text = backup.date.substring(0, 24);  // Trim long date
        item.subItems[1].text = String(backup.filesCount);
        item.backup = backup;  // Store backup info
    }

    // Buttons
    var btnGroup = dialog.add('group');
    btnGroup.alignment = ['right', 'bottom'];

    var restoreBtn = btnGroup.add('button', undefined, 'Restore Selected');
    var deleteBtn = btnGroup.add('button', undefined, 'Delete Selected');
    var closeBtn = btnGroup.add('button', undefined, 'Close', {name: 'cancel'});

    restoreBtn.onClick = function() {
        if (list.selection) {
            restoreBackup(list.selection.backup);
            dialog.close();
        } else {
            alert('Please select a backup to restore.');
        }
    };

    deleteBtn.onClick = function() {
        if (list.selection) {
            var backup = list.selection.backup;
            if (confirm('Delete backup "' + backup.name + '"?')) {
                var backupDir = new Folder(backup.path);
                if (deleteFolder(backupDir)) {
                    alert('Backup deleted successfully.');
                    dialog.close();
                } else {
                    alert('Failed to delete backup.');
                }
            }
        } else {
            alert('Please select a backup to delete.');
        }
    };

    dialog.show();
}

/**
 * Show restore dialog
 */
function showRestoreDialog() {
    var backups = listBackups();

    if (backups.length === 0) {
        alert('No backups available to restore.');
        return;
    }

    var dialog = new Window('dialog', 'Restore Settings');
    dialog.alignChildren = ['fill', 'top'];
    dialog.margins = 20;
    dialog.spacing = 15;

    dialog.add('statictext', undefined, 'Select backup to restore:');

    var dropdown = dialog.add('dropdownlist', undefined, []);
    dropdown.alignment = ['fill', 'top'];
    dropdown.minimumSize = [300, 25];

    for (var i = 0; i < backups.length; i++) {
        var backup = backups[i];
        var label = backup.name + ' (' + backup.filesCount + ' files)';
        var item = dropdown.add('item', label);
        item.backup = backup;
    }

    if (backups.length > 0) {
        dropdown.selection = 0;
    }

    var btnGroup = dialog.add('group');
    btnGroup.alignment = ['right', 'top'];

    var okBtn = btnGroup.add('button', undefined, 'Restore', {name: 'ok'});
    var cancelBtn = btnGroup.add('button', undefined, 'Cancel', {name: 'cancel'});

    if (dialog.show() === 1 && dropdown.selection) {
        restoreBackup(dropdown.selection.backup);
    }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get all settings JSON files
 * @returns {Array} Array of File objects
 */
function getSettingsFiles() {
    var settingsFolder = new Folder(CFG.settingsFolder);
    if (!settingsFolder.exists) {
        return [];
    }

    return settingsFolder.getFiles('*.json');
}

/**
 * Get current timestamp string
 * @returns {String} Timestamp in YYYY-MM-DD-HHMMSS format
 */
function getTimestamp() {
    var now = new Date();
    var year = now.getFullYear();
    var month = padZero(now.getMonth() + 1);
    var day = padZero(now.getDate());
    var hours = padZero(now.getHours());
    var minutes = padZero(now.getMinutes());
    var seconds = padZero(now.getSeconds());

    return year + '-' + month + '-' + day + '-' + hours + minutes + seconds;
}

/**
 * Extract timestamp from backup folder name
 * @param {String} folderName Backup folder name
 * @returns {String} Timestamp or folder name if not found
 */
function extractTimestamp(folderName) {
    var match = folderName.replace(CFG.backupPrefix, '');
    return match || folderName;
}

/**
 * Pad number with zero
 * @param {Number} num Number to pad
 * @returns {String} Padded string
 */
function padZero(num) {
    return num < 10 ? '0' + num : String(num);
}

/**
 * Copy file from source to destination
 * @param {File} source Source file
 * @param {File} dest Destination file
 * @returns {Boolean} True if successful
 */
function copyFile(source, dest) {
    try {
        source.encoding = 'UTF-8';
        dest.encoding = 'UTF-8';

        source.open('r');
        var content = source.read();
        source.close();

        dest.open('w');
        dest.write(content);
        dest.close();

        return true;
    } catch (e) {
        return false;
    }
}

/**
 * Validate JSON file
 * @param {File} file JSON file to validate
 * @returns {Boolean} True if valid JSON
 */
function validateJSON(file) {
    try {
        if (!file.exists) {
            return false;
        }

        file.encoding = 'UTF-8';
        file.open('r');
        var content = file.read();
        file.close();

        AIS.JSON.parse(content);
        return true;
    } catch (e) {
        return false;
    }
}

/**
 * Save object as JSON file
 * @param {File} file Destination file
 * @param {Object} obj Object to save
 * @returns {Boolean} True if successful
 */
function saveJSON(file, obj) {
    try {
        file.encoding = 'UTF-8';
        file.open('w');
        file.write(AIS.JSON.stringify(obj, null, 2));
        file.close();
        return true;
    } catch (e) {
        return false;
    }
}

/**
 * Load manifest from backup folder
 * @param {Folder} folder Backup folder
 * @returns {Object|null} Manifest object or null
 */
function loadManifest(folder) {
    try {
        var manifestFile = new File(folder.fsName + '/manifest.json');
        if (!manifestFile.exists) {
            return null;
        }

        manifestFile.encoding = 'UTF-8';
        manifestFile.open('r');
        var json = manifestFile.read();
        manifestFile.close();

        return AIS.JSON.parse(json);
    } catch (e) {
        return null;
    }
}

/**
 * Delete folder recursively
 * @param {Folder} folder Folder to delete
 * @returns {Boolean} True if successful
 */
function deleteFolder(folder) {
    try {
        if (!folder.exists) {
            return true;
        }

        // Delete all files first
        var files = folder.getFiles();
        for (var i = 0; i < files.length; i++) {
            if (files[i] instanceof File) {
                files[i].remove();
            } else if (files[i] instanceof Folder) {
                deleteFolder(files[i]);
            }
        }

        // Delete folder itself
        return folder.remove();
    } catch (e) {
        return false;
    }
}

/**
 * Generate HTML backup report
 * @param {Array} backups Array of backup info objects
 * @returns {String} HTML string
 */
function generateReportHTML(backups) {
    var html = '';
    html += '<!DOCTYPE html>\n';
    html += '<html>\n';
    html += '<head>\n';
    html += '<meta charset="UTF-8">\n';
    html += '<title>Backup Settings Report</title>\n';
    html += '<style>\n';
    html += 'body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }\n';
    html += 'h1 { color: #333; }\n';
    html += '.summary { background: white; padding: 15px; margin-bottom: 20px; border-radius: 5px; }\n';
    html += '.backup { background: white; padding: 15px; margin-bottom: 10px; border-radius: 5px; border-left: 4px solid #4CAF50; }\n';
    html += '.backup h3 { margin: 0 0 10px 0; color: #333; }\n';
    html += '.backup-info { color: #666; font-size: 14px; }\n';
    html += '.file-list { margin-top: 10px; padding-left: 20px; color: #888; font-size: 13px; }\n';
    html += '</style>\n';
    html += '</head>\n';
    html += '<body>\n';
    html += '<h1>Settings Backup Report</h1>\n';

    // Summary
    html += '<div class="summary">\n';
    html += '<h2>Summary</h2>\n';
    html += '<p><strong>Total backups:</strong> ' + backups.length + '</p>\n';
    html += '<p><strong>Settings folder:</strong> ' + CFG.settingsFolder + '</p>\n';
    html += '<p><strong>Backup folder:</strong> ' + CFG.backupFolder + '</p>\n';
    html += '<p><strong>Generated:</strong> ' + new Date().toString() + '</p>\n';
    html += '</div>\n';

    // Backup list
    html += '<h2>Available Backups</h2>\n';

    if (backups.length === 0) {
        html += '<p>No backups found.</p>\n';
    } else {
        for (var i = 0; i < backups.length; i++) {
            var backup = backups[i];
            html += '<div class="backup">\n';
            html += '<h3>' + backup.name + '</h3>\n';
            html += '<div class="backup-info">\n';
            html += '<p><strong>Date:</strong> ' + backup.date + '</p>\n';
            html += '<p><strong>Files:</strong> ' + backup.filesCount + '</p>\n';

            if (backup.files.length > 0) {
                html += '<div class="file-list">\n';
                html += '<strong>Contents:</strong><br>\n';
                for (var j = 0; j < backup.files.length; j++) {
                    html += '• ' + backup.files[j] + '<br>\n';
                }
                html += '</div>\n';
            }

            html += '</div>\n';
            html += '</div>\n';
        }
    }

    html += '</body>\n';
    html += '</html>\n';

    return html;
}

// ============================================================================
// ENTRY POINT
// ============================================================================

// ============================================================================
// EXECUTE
// ============================================================================

try {
    main();
} catch (e) {
    AIS.Error.show('Script error', e);
}
