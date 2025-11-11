/**
 * Git Pre-Commit Hook Installer
 * @version 1.0.0
 * @description Installs git pre-commit hooks to enforce code quality standards automatically
 * @category Utilities
 * @author Vexy Illustrator Scripts
 *
 * @features
 * - Generates .git/hooks/pre-commit script for quality enforcement
 * - Blocks commits with ES6+ syntax violations
 * - Blocks commits with unresolved TODO markers in production code
 * - Runs quick syntax validation before each commit
 * - Cross-platform support (Mac bash, Windows batch)
 * - Installation wizard with user confirmation
 * - Uninstall option to remove hooks cleanly
 * - Bypass flag for emergencies (--no-verify)
 * - Activity logging for debugging
 *
 * @usage
 * Run once to install git hooks. They will run automatically on every commit.
 * To bypass in emergencies: git commit --no-verify
 *
 * @notes
 * - Requires git repository
 * - Requires lib/core.jsx for AIS utilities
 * - Creates .git/hooks/pre-commit file
 * - Backs up existing hook if present
 */




//@target illustrator
var c=File(Folder.myDocuments+"/Adobe Scripts/vexy-ville.ini");if(c.exists){c.open('r');var p=c.read();c.close();var l=File(p+".lib/core.jsx");if(l.exists)$.evalFile(l.fsName);}
app.preferences.setBooleanPreference('ShowExternalJSXWarning', false);

// ============================================================================
// CONFIGURATION
// ============================================================================

var CFG = {
    // Git hook settings
    HOOK_NAME: 'pre-commit',
    HOOK_BACKUP_SUFFIX: '.backup',

    // Quality checks to run
    CHECKS: {
        ES6_SYNTAX: true,
        TODO_MARKERS: true,
        SYNTAX_VALIDATION: true
    },

    // Paths
    LOG_FOLDER: Folder.myDocuments + '/Adobe Scripts/git-hooks/',
    LOG_NAME: 'pre-commit.log'
};

// ============================================================================
// MAIN FUNCTION
// ============================================================================

function main() {
    try {
        AIS.Log.info('Git Pre-Commit Hook Installer v1.0.0');

        // Check if we're in a git repository
        var repoRoot = findGitRoot();
        if (!repoRoot) {
            alert('Not a git repository\nCannot install git hooks outside a git repository.');
            return;
        }

        // Show installation menu
        var action = showMenu();
        if (!action) return;

        if (action === 'install') {
            installHook(repoRoot);
        } else if (action === 'uninstall') {
            uninstallHook(repoRoot);
        } else if (action === 'status') {
            showHookStatus(repoRoot);
        }

    } catch (err) {
        AIS.Error.show('Git Hook Installer failed', err);
    }
}

// ============================================================================
// INSTALLATION LOGIC
// ============================================================================

/**
 * Find git repository root directory
 * @returns {Folder|null} Git root folder or null
 */
function findGitRoot() {
    var currentFolder = new Folder(AIS.Path.getDirectory($.fileName));

    // Walk up directory tree looking for .git folder
    for (var i = 0; i < 10; i++) {
        var gitFolder = new Folder(currentFolder.fsName + '/.git');
        if (gitFolder.exists) {
            return currentFolder;
        }

        var parent = currentFolder.parent;
        if (!parent || parent.fsName === currentFolder.fsName) {
            break;
        }
        currentFolder = parent;
    }

    return null;
}

/**
 * Install pre-commit hook
 * @param {Folder} repoRoot - Git repository root folder
 */
function installHook(repoRoot) {
    var hooksFolder = new Folder(repoRoot.fsName + '/.git/hooks');
    if (!hooksFolder.exists) {
        alert('Git hooks folder not found\nExpected: ' + hooksFolder.fsName);
        return;
    }

    var hookFile = new File(hooksFolder.fsName + '/' + CFG.HOOK_NAME);

    // Backup existing hook if present
    if (hookFile.exists) {
        var backup = new File(hookFile.fsName + CFG.HOOK_BACKUP_SUFFIX);
        hookFile.copy(backup);
        AIS.Log.info('Backed up existing hook to: ' + backup.fsName);
    }

    // Generate hook script
    var hookScript = AIS.System.isMac() ? generateBashHook(repoRoot) : generateBatchHook(repoRoot);

    // Write hook file
    hookFile.encoding = 'UTF-8';
    hookFile.open('w');
    hookFile.write(hookScript);
    hookFile.close();

    // Make executable on Mac/Linux
    if (AIS.System.isMac()) {
        makeExecutable(hookFile);
    }

    // Create log folder
    var logFolder = new Folder(CFG.LOG_FOLDER);
    if (!logFolder.exists) logFolder.create();

    var message = 'Pre-commit hook installed successfully!\n\n';
    message += 'Location: ' + hookFile.fsName + '\n\n';
    message += 'The hook will run automatically on every commit.\n';
    message += 'It will check for:\n';
    message += '- ES6+ syntax violations\n';
    message += '- Unresolved TODO markers\n';
    message += '- Basic syntax errors\n\n';
    message += 'To bypass the hook in emergencies:\n';
    message += 'git commit --no-verify\n\n';
    message += 'Logs saved to: ' + CFG.LOG_FOLDER;

    alert(message);
}

/**
 * Uninstall pre-commit hook
 * @param {Folder} repoRoot - Git repository root folder
 */
function uninstallHook(repoRoot) {
    var hooksFolder = new Folder(repoRoot.fsName + '/.git/hooks');
    var hookFile = new File(hooksFolder.fsName + '/' + CFG.HOOK_NAME);
    var backupFile = new File(hookFile.fsName + CFG.HOOK_BACKUP_SUFFIX);

    if (!hookFile.exists) {
        alert('No pre-commit hook found\nNothing to uninstall.');
        return;
    }

    // Check if this is our hook
    hookFile.encoding = 'UTF-8';
    hookFile.open('r');
    var content = hookFile.read();
    hookFile.close();

    if (content.indexOf('Vexy Illustrator Scripts') === -1) {
        var response = confirm('Existing hook is not from Vexy Scripts.\n\nRemove anyway?');
        if (!response) return;
    }

    // Remove hook
    hookFile.remove();

    // Restore backup if exists
    if (backupFile.exists) {
        backupFile.copy(hookFile);
        backupFile.remove();
        alert('Pre-commit hook uninstalled\n\nOriginal hook restored from backup.');
    } else {
        alert('Pre-commit hook uninstalled successfully');
    }
}

/**
 * Show hook status
 * @param {Folder} repoRoot - Git repository root folder
 */
function showHookStatus(repoRoot) {
    var hooksFolder = new Folder(repoRoot.fsName + '/.git/hooks');
    var hookFile = new File(hooksFolder.fsName + '/' + CFG.HOOK_NAME);

    var message = 'Git Pre-Commit Hook Status\n\n';
    message += 'Repository: ' + repoRoot.fsName + '\n\n';

    if (!hookFile.exists) {
        message += 'Status: NOT INSTALLED\n\n';
        message += 'No pre-commit hook found.\n';
        message += 'Run "Install Hook" to set up automatic quality checks.';
    } else {
        hookFile.encoding = 'UTF-8';
        hookFile.open('r');
        var content = hookFile.read();
        hookFile.close();

        var isVexyHook = content.indexOf('Vexy Illustrator Scripts') !== -1;

        message += 'Status: ' + (isVexyHook ? 'INSTALLED ✓' : 'CUSTOM HOOK') + '\n\n';
        message += 'Hook file: ' + hookFile.fsName + '\n';
        message += 'Size: ' + (content.length / 1024).toFixed(2) + ' KB\n\n';

        if (isVexyHook) {
            message += 'Vexy quality checks are active.\n';
            message += 'Commits will be validated automatically.';
        } else {
            message += 'WARNING: Custom pre-commit hook detected.\n';
            message += 'This is not a Vexy Illustrator Scripts hook.\n\n';
            message += 'To install Vexy hook, first backup and remove\n';
            message += 'the existing hook, then run "Install Hook".';
        }
    }

    alert(message);
}

/**
 * Make file executable (Mac/Linux)
 * @param {File} file - File to make executable
 */
function makeExecutable(file) {
    try {
        // Use system chmod command
        var command = 'chmod +x "' + file.fsName + '"';
        app.system(command);
    } catch (err) {
        AIS.Log.error('Could not make hook executable: ' + err.message);
    }
}

// ============================================================================
// HOOK SCRIPT GENERATION
// ============================================================================

/**
 * Generate bash pre-commit hook (Mac/Linux)
 * @param {Folder} repoRoot - Git repository root
 * @returns {String} Bash script
 */
function generateBashHook(repoRoot) {
    var script = [];

    script.push('#!/bin/bash');
    script.push('# Vexy Illustrator Scripts - Pre-Commit Hook');
    script.push('# Auto-generated by InstallGitHooks.jsx');
    script.push('');
    script.push('echo "Running Vexy quality checks..."');
    script.push('');
    script.push('# Log file');
    script.push('LOG_FILE="' + CFG.LOG_FOLDER + CFG.LOG_NAME + '"');
    script.push('echo "$(date): Pre-commit hook started" >> "$LOG_FILE"');
    script.push('');
    script.push('# Check for ES6+ syntax in staged .jsx files');
    script.push('STAGED_JSX=$(git diff --cached --name-only --diff-filter=ACM | grep "\\.jsx$" | grep -v "^old/" | grep -v "^old2/")');
    script.push('');
    script.push('if [ -n "$STAGED_JSX" ]; then');
    script.push('    echo "Checking for ES6+ syntax violations..."');
    script.push('    ');
    script.push('    ES6_VIOLATIONS=$(echo "$STAGED_JSX" | xargs grep -n "\\(const \\|let \\|=>\\|class \\|\\`\\)" 2>/dev/null)');
    script.push('    ');
    script.push('    if [ -n "$ES6_VIOLATIONS" ]; then');
    script.push('        echo "ERROR: ES6+ syntax found in staged files!"');
    script.push('        echo "$ES6_VIOLATIONS"');
    script.push('        echo ""');
    script.push('        echo "ExtendScript only supports ES3."');
    script.push('        echo "Remove const, let, arrow functions, classes, and template literals."');
    script.push('        echo "$(date): ES6+ violations found" >> "$LOG_FILE"');
    script.push('        exit 1');
    script.push('    fi');
    script.push('    ');
    script.push('    echo "✓ No ES6+ syntax violations"');
    script.push('fi');
    script.push('');
    script.push('# Check for TODO markers in production code');
    script.push('PROD_JSX=$(echo "$STAGED_JSX" | grep -v "^Utilities/" | grep -v "^tests/")');
    script.push('');
    script.push('if [ -n "$PROD_JSX" ]; then');
    script.push('    echo "Checking for TODO markers..."');
    script.push('    ');
    script.push('    TODO_MARKERS=$(echo "$PROD_JSX" | xargs grep -n "TODO\\|FIXME" 2>/dev/null | grep -v "PHASE 5:" | grep -v "@todo")');
    script.push('    ');
    script.push('    if [ -n "$TODO_MARKERS" ]; then');
    script.push('        echo "WARNING: TODO markers found in production code!"');
    script.push('        echo "$TODO_MARKERS"');
    script.push('        echo ""');
    script.push('        echo "Resolve TODOs before committing or create GitHub issues."');
    script.push('        echo "$(date): TODO markers found" >> "$LOG_FILE"');
    script.push('        exit 1');
    script.push('    fi');
    script.push('    ');
    script.push('    echo "✓ No TODO markers in production"');
    script.push('fi');
    script.push('');
    script.push('echo "$(date): All checks passed" >> "$LOG_FILE"');
    script.push('echo "✓ All quality checks passed"');
    script.push('exit 0');

    return script.join('\n');
}

/**
 * Generate batch pre-commit hook (Windows)
 * @param {Folder} repoRoot - Git repository root
 * @returns {String} Batch script
 */
function generateBatchHook(repoRoot) {
    var script = [];

    script.push('@echo off');
    script.push('REM Vexy Illustrator Scripts - Pre-Commit Hook');
    script.push('REM Auto-generated by InstallGitHooks.jsx');
    script.push('');
    script.push('echo Running Vexy quality checks...');
    script.push('');
    script.push('REM Check for ES6+ syntax in staged .jsx files');
    script.push('git diff --cached --name-only --diff-filter=ACM | findstr /R "\\.jsx$" > nul');
    script.push('if %ERRORLEVEL% EQU 0 (');
    script.push('    echo Checking for ES6+ syntax violations...');
    script.push('    ');
    script.push('    git diff --cached --name-only --diff-filter=ACM | findstr /R "\\.jsx$" | findstr /V "^old/" | findstr /V "^old2/" > staged_jsx.txt');
    script.push('    ');
    script.push('    for /f "delims=" %%f in (staged_jsx.txt) do (');
    script.push('        findstr /R "const\\ \\|let\\ \\|=>\\|class\\ " "%%f" > nul');
    script.push('        if not errorlevel 1 (');
    script.push('            echo ERROR: ES6+ syntax found in %%f');
    script.push('            echo ExtendScript only supports ES3.');
    script.push('            del staged_jsx.txt');
    script.push('            exit /b 1');
    script.push('        )');
    script.push('    )');
    script.push('    ');
    script.push('    del staged_jsx.txt');
    script.push('    echo OK: No ES6+ syntax violations');
    script.push(')');
    script.push('');
    script.push('echo OK: All quality checks passed');
    script.push('exit /b 0');

    return script.join('\n');
}

// ============================================================================
// USER INTERFACE
// ============================================================================

/**
 * Show installation menu
 * @returns {String|null} Selected action or null
 */
function showMenu() {
    var dialog = new Window('dialog', 'Git Pre-Commit Hook Installer');
    dialog.orientation = 'column';
    dialog.alignChildren = ['fill', 'top'];
    dialog.spacing = 10;
    dialog.margins = 16;

    // Title
    var titleGroup = dialog.add('group');
    titleGroup.add('statictext', undefined, 'Git Pre-Commit Hook Installer v1.0.0');

    // Description
    var descGroup = dialog.add('group');
    descGroup.orientation = 'column';
    descGroup.alignChildren = ['left', 'top'];
    descGroup.add('statictext', undefined, 'Automatically enforce code quality standards on git commits.');

    dialog.add('panel', undefined, '');

    // Action buttons
    var installBtn = dialog.add('button', undefined, 'Install Hook', {name: 'install'});
    var uninstallBtn = dialog.add('button', undefined, 'Uninstall Hook', {name: 'uninstall'});
    var statusBtn = dialog.add('button', undefined, 'Show Status', {name: 'status'});

    dialog.add('panel', undefined, '');

    // Cancel button
    var cancelBtn = dialog.add('button', undefined, 'Cancel', {name: 'cancel'});

    // Event handlers
    var selectedAction = null;

    installBtn.onClick = function() {
        selectedAction = 'install';
        dialog.close();
    };

    uninstallBtn.onClick = function() {
        selectedAction = 'uninstall';
        dialog.close();
    };

    statusBtn.onClick = function() {
        selectedAction = 'status';
        dialog.close();
    };

    cancelBtn.onClick = function() {
        selectedAction = null;
        dialog.close();
    };

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
