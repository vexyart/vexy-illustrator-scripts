/**
 * Watch Library Changes
 * @version 1.0.0
 * @description Auto-detect library file changes and update API documentation automatically
 *
 * @category Utilities
 * @author Vexy Team
 * @license MIT
 *
 * @features
 * - Track modification times of lib/core.jsx and lib/ui.jsx
 * - Detect when library files have changed since last check
 * - Auto-run GenerateAPIReference when changes detected
 * - Update timestamp tracker file
 * - Show notification when docs auto-updated
 * - Manual check mode or automatic on-startup mode
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
    scriptName: 'WatchLibraryChanges',
    version: '1.0.0',

    // Tracker file location
    trackerFile: Folder.myDocuments + '/Adobe Scripts/.lib_timestamps.json',

    // Libraries to watch
    libraries: [
        {name: 'core', path: 'lib/core.jsx'},
        {name: 'ui', path: 'lib/ui.jsx'}
    ],

    // API generator script
    apiGeneratorScript: 'Utilities/GenerateAPIReference.jsx'
};

// ============================================================================
// MAIN FUNCTION
// ============================================================================

function main() {
    try {
        // Get project root
        var projectRoot = getProjectRoot();

        // Check library files
        var libInfo = checkLibraryFiles(projectRoot);
        if (!libInfo.success) {
            alert('Error checking library files\n' + libInfo.error);
            return;
        }

        // Load last known timestamps
        var lastTimestamps = loadTimestamps();

        // Compare timestamps
        var changes = detectChanges(libInfo.files, lastTimestamps);

        // Show dialog
        var result = showDialog(changes, libInfo.files);
        if (!result) return;  // User cancelled

        if (result.action === 'update' && changes.hasChanges) {
            // Update API docs
            var success = updateAPIDocs(projectRoot);

            if (success) {
                // Save new timestamps
                saveTimestamps(libInfo.files);

                // Show success
                alert('Success!\n\nAPI documentation has been updated.\n\nCheck docs/AIS_API_REFERENCE.md for the latest changes.');
            } else {
                alert('Failed to update API documentation\n\nPlease run GenerateAPIReference.jsx manually.');
            }
        } else if (result.action === 'check') {
            // Just show status
            var status = formatChangeStatus(changes);
            alert('Library Status\n\n' + status);
        }

    } catch (err) {
        AIS.Error.show('Failed to watch library changes', err);
    }
}

// ============================================================================
// CORE LOGIC
// ============================================================================

/**
 * Check library files and get modification times
 */
function checkLibraryFiles(projectRoot) {
    var files = [];

    for (var i = 0; i < CFG.libraries.length; i++) {
        var lib = CFG.libraries[i];
        var libPath = projectRoot + '/' + lib.path;
        var libFile = new File(libPath);

        if (!libFile.exists) {
            return {
                success: false,
                error: 'Library file not found: ' + lib.path
            };
        }

        files.push({
            name: lib.name,
            path: lib.path,
            file: libFile,
            modified: libFile.modified.getTime()
        });
    }

    return {
        success: true,
        files: files
    };
}

/**
 * Load last known timestamps from tracker file
 */
function loadTimestamps() {
    var file = new File(CFG.trackerFile);
    if (!file.exists) {
        return {};  // No previous timestamps
    }

    try {
        file.encoding = 'UTF-8';
        file.open('r');
        var json = file.read();
        file.close();

        return AIS.JSON.parse(json);
    } catch (err) {
        return {};  // Error reading timestamps
    }
}

/**
 * Save current timestamps to tracker file
 */
function saveTimestamps(files) {
    var timestamps = {};

    for (var i = 0; i < files.length; i++) {
        timestamps[files[i].name] = files[i].modified;
    }

    // Ensure folder exists
    var trackerFolder = new Folder(Folder.myDocuments + '/Adobe Scripts/');
    if (!trackerFolder.exists) {
        trackerFolder.create();
    }

    var file = new File(CFG.trackerFile);
    file.encoding = 'UTF-8';
    file.open('w');
    file.write(AIS.JSON.stringify(timestamps));
    file.close();
}

/**
 * Detect changes between current and last timestamps
 */
function detectChanges(currentFiles, lastTimestamps) {
    var changes = {
        hasChanges: false,
        newFiles: [],
        modifiedFiles: [],
        unchangedFiles: []
    };

    for (var i = 0; i < currentFiles.length; i++) {
        var file = currentFiles[i];
        var lastModified = lastTimestamps[file.name];

        if (!lastModified) {
            // First time seeing this file
            changes.newFiles.push(file.name);
            changes.hasChanges = true;
        } else if (file.modified > lastModified) {
            // File has been modified
            changes.modifiedFiles.push({
                name: file.name,
                lastModified: new Date(lastModified),
                currentModified: new Date(file.modified)
            });
            changes.hasChanges = true;
        } else {
            // File unchanged
            changes.unchangedFiles.push(file.name);
        }
    }

    return changes;
}

/**
 * Update API documentation by running GenerateAPIReference
 */
function updateAPIDocs(projectRoot) {
    try {
        // Path to API generator script
        var generatorPath = projectRoot + '/' + CFG.apiGeneratorScript;
        var generatorFile = new File(generatorPath);

        if (!generatorFile.exists) {
            alert('API generator not found\n' + CFG.apiGeneratorScript + '\n\nPlease ensure the file exists.');
            return false;
        }

        // Load and execute the generator script
        generatorFile.encoding = 'UTF-8';
        generatorFile.open('r');
        var scriptContent = generatorFile.read();
        generatorFile.close();

        // Execute the script
        eval(scriptContent);

        return true;
    } catch (err) {
        AIS.Error.show('Failed to execute GenerateAPIReference', err);
        return false;
    }
}

/**
 * Format change status for display
 */
function formatChangeStatus(changes) {
    var lines = [];

    if (!changes.hasChanges) {
        lines.push('No library changes detected.');
        lines.push('API documentation is up to date.');
        return lines.join('\n');
    }

    if (changes.newFiles.length > 0) {
        lines.push('New libraries: ' + changes.newFiles.join(', '));
    }

    if (changes.modifiedFiles.length > 0) {
        lines.push('\nModified libraries:');
        for (var i = 0; i < changes.modifiedFiles.length; i++) {
            var mod = changes.modifiedFiles[i];
            lines.push('  - ' + mod.name);
            lines.push('    Last: ' + formatDate(mod.lastModified));
            lines.push('    Now:  ' + formatDate(mod.currentModified));
        }
    }

    lines.push('\nAPI documentation needs updating.');

    return lines.join('\n');
}

/**
 * Format date for display
 */
function formatDate(date) {
    var year = date.getFullYear();
    var month = ('0' + (date.getMonth() + 1)).slice(-2);
    var day = ('0' + date.getDate()).slice(-2);
    var hours = ('0' + date.getHours()).slice(-2);
    var minutes = ('0' + date.getMinutes()).slice(-2);

    return year + '-' + month + '-' + day + ' ' + hours + ':' + minutes;
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
 * Show main dialog
 */
function showDialog(changes, files) {
    var dialog = new Window('dialog', 'Watch Library Changes');
    dialog.alignChildren = ['fill', 'top'];
    dialog.spacing = 10;
    dialog.margins = 15;

    // Status panel
    var statusPanel = dialog.add('panel', undefined, 'Library Status');
    statusPanel.alignChildren = ['fill', 'top'];
    statusPanel.margins = 15;

    // Show change status
    var statusText = statusPanel.add('statictext', undefined, formatChangeStatus(changes), {multiline: true});
    statusText.preferredSize.width = 400;

    // Files list panel
    var filesPanel = dialog.add('panel', undefined, 'Tracked Libraries');
    filesPanel.alignChildren = ['fill', 'top'];
    filesPanel.margins = 15;

    var filesList = filesPanel.add('group');
    filesList.orientation = 'column';
    filesList.alignChildren = ['fill', 'top'];
    filesList.spacing = 5;

    for (var i = 0; i < files.length; i++) {
        var file = files[i];
        var fileGroup = filesList.add('group');
        fileGroup.orientation = 'row';
        fileGroup.spacing = 10;

        var nameText = fileGroup.add('statictext', undefined, file.name + ':');
        nameText.preferredSize.width = 80;

        var modText = fileGroup.add('statictext', undefined, formatDate(new Date(file.modified)));
        modText.preferredSize.width = 150;

        // Status indicator
        var status = 'OK';
        if (changes.newFiles.indexOf(file.name) > -1) {
            status = 'NEW';
        } else if (findModified(changes.modifiedFiles, file.name)) {
            status = 'MODIFIED';
        }

        var statusText = fileGroup.add('statictext', undefined, status);
        statusText.preferredSize.width = 80;
        if (status !== 'OK') {
            statusText.graphics.foregroundColor = statusText.graphics.newPen(
                statusText.graphics.PenType.SOLID_COLOR,
                [0.8, 0.4, 0.0],
                1
            );
        }
    }

    // Options
    var optionsPanel = dialog.add('panel', undefined, 'Options');
    optionsPanel.alignChildren = ['left', 'top'];
    optionsPanel.margins = 15;

    var autoUpdateCheck = optionsPanel.add('checkbox', undefined, 'Auto-update API docs when changes detected');
    autoUpdateCheck.value = changes.hasChanges;
    autoUpdateCheck.enabled = changes.hasChanges;

    // Buttons
    var buttonGroup = dialog.add('group');
    buttonGroup.alignment = ['right', 'top'];

    var cancelBtn = buttonGroup.add('button', undefined, 'Cancel', {name: 'cancel'});

    var checkBtn = buttonGroup.add('button', undefined, 'Check Only');
    checkBtn.onClick = function() {
        dialog.close();
        return {action: 'check'};
    };

    var updateBtn = buttonGroup.add('button', undefined, changes.hasChanges ? 'Update Docs' : 'OK', {name: 'ok'});
    updateBtn.onClick = function() {
        dialog.close();
    };

    if (dialog.show() === 1) {
        return {
            action: autoUpdateCheck.value ? 'update' : 'check'
        };
    }

    return null;
}

/**
 * Find modified file in list
 */
function findModified(modifiedFiles, name) {
    for (var i = 0; i < modifiedFiles.length; i++) {
        if (modifiedFiles[i].name === name) {
            return modifiedFiles[i];
        }
    }
    return null;
}

// ============================================================================
// EXECUTE
// ============================================================================

try {
    main();
} catch (e) {
    AIS.Error.show('WatchLibraryChanges error', e);
}
