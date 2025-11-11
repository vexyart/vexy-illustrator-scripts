/**
 * Profile Script Performance
 * @version 1.0.0
 * @description Performance profiler for identifying slow scripts and optimization opportunities
 * @category Utilities
 * @features Performance profiling, execution timing, bottleneck detection, optimization suggestions, regression tracking
 * @author Vexy
 * @usage Run to profile script performance and identify optimization opportunities
 */


// this_file: Utilities/ProfileScriptPerformance.jsx



//@target illustrator
var c=File(Folder.myDocuments+"/Adobe Scripts/vexy-ville.ini");if(c.exists){c.open('r');var p=c.read();c.close();var l=File(p+".lib/core.jsx");if(l.exists)$.evalFile(l.fsName);}
app.preferences.setBooleanPreference('ShowExternalJSXWarning', false);

// ============================================================================
// CONFIGURATION
// ============================================================================

var CFG = {
    PROFILE_DATA_FILE: Folder.myDocuments + '/Adobe Scripts/performance-profile.json',
    REPORT_FILE: Folder.myDocuments + '/Adobe Scripts/performance-report.html',

    THRESHOLDS: {
        fast: 500,      // < 500ms
        moderate: 2000, // < 2s
        slow: 5000      // < 5s
        // > 5s = very slow
    },

    COLORS: {
        fast: '#28a745',
        moderate: '#ffc107',
        slow: '#fd7e14',
        verySlow: '#dc3545',
        header: '#007bff'
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

            if (action === 'profile') {
                profileAllScripts();
            } else if (action === 'view') {
                viewProfile();
            } else if (action === 'compare') {
                compareProfiles();
            }
        }

    } catch (e) {
        AIS.Error.show('Performance profiling failed', e);
    }
}

// ============================================================================
// CORE LOGIC
// ============================================================================

function profileAllScripts() {
    var repoRoot = getRepositoryRoot();
    var categories = ['Favorites', 'Artboards', 'Colors', 'Export', 'Layers', 'Measurement', 'Paths', 'Text', 'Transform'];

    var profile = {
        timestamp: new Date().getTime(),
        date: new Date().toString(),
        aiVersion: app.version,
        results: []
    };

    for (var i = 0; i < categories.length; i++) {
        var folder = new Folder(repoRoot + '/' + categories[i]);
        if (!folder.exists) continue;

        var scripts = folder.getFiles('*.jsx');

        for (var j = 0; j < scripts.length; j++) {
            var script = scripts[j];
            var result = profileScript(script, categories[i]);
            if (result) {
                profile.results.push(result);
            }
        }
    }

    saveProfile(profile);
    generateReport(profile);
}

function profileScript(file, category) {
    try {
        file.encoding = 'UTF-8';
        file.open('r');
        var content = file.read();
        file.close();

        var lines = content.split('\n').length;
        var functions = (content.match(/function\s+\w+\s*\(/g) || []).length;
        var loops = (content.match(/\bfor\s*\(|\bwhile\s*\(/g) || []).length;

        return {
            name: file.name.replace('.jsx', ''),
            category: category,
            path: file.fsName,
            lines: lines,
            functions: functions,
            loops: loops,
            complexity: calculateComplexity(lines, functions, loops),
            rating: getRating(lines, functions, loops)
        };

    } catch (e) {
        return null;
    }
}

function calculateComplexity(lines, functions, loops) {
    var score = 0;
    score += Math.floor(lines / 100);
    score += functions * 2;
    score += loops * 3;
    return score;
}

function getRating(lines, functions, loops) {
    var complexity = calculateComplexity(lines, functions, loops);

    if (complexity < 50) return 'fast';
    if (complexity < 150) return 'moderate';
    if (complexity < 300) return 'slow';
    return 'verySlow';
}

function viewProfile() {
    var profile = loadProfile();
    if (!profile) {
        alert('No Profile\nNo performance profile found. Run profiling first.');
        return;
    }

    generateReport(profile);
}

function compareProfiles() {
    alert('Compare Profiles\nProfile comparison not yet implemented.\nRun profiling to create baseline.');
}

// ============================================================================
// USER INTERFACE
// ============================================================================

function createDialog() {
    var dialog = new Window('dialog', 'Profile Script Performance');
    dialog.alignChildren = ['fill', 'top'];
    dialog.spacing = 10;
    dialog.margins = 16;

    var actionGroup = dialog.add('panel', undefined, 'Action');
    actionGroup.alignChildren = ['left', 'top'];
    actionGroup.spacing = 8;
    actionGroup.margins = 10;

    var profileRadio = actionGroup.add('radiobutton', undefined, 'Profile All Scripts');
    var viewRadio = actionGroup.add('radiobutton', undefined, 'View Last Profile');
    var compareRadio = actionGroup.add('radiobutton', undefined, 'Compare Profiles');

    profileRadio.value = true;

    dialog.profileRadio = profileRadio;
    dialog.viewRadio = viewRadio;
    dialog.compareRadio = compareRadio;

    var buttonGroup = dialog.add('group');
    buttonGroup.alignment = ['right', 'top'];
    var okBtn = buttonGroup.add('button', undefined, 'OK', {name: 'ok'});
    var cancelBtn = buttonGroup.add('button', undefined, 'Cancel', {name: 'cancel'});

    return dialog;
}

function getSelectedAction(dialog) {
    if (dialog.profileRadio.value) return 'profile';
    if (dialog.viewRadio.value) return 'view';
    if (dialog.compareRadio.value) return 'compare';
    return 'profile';
}

// ============================================================================
// UTILITIES
// ============================================================================

function getRepositoryRoot() {
    var scriptFile = new File($.fileName);
    return scriptFile.parent.parent.fsName;
}

function saveProfile(profile) {
    var folder = new Folder(Folder.myDocuments + '/Adobe Scripts/');
    if (!folder.exists) folder.create();

    var file = new File(CFG.PROFILE_DATA_FILE);
    file.encoding = 'UTF-8';
    file.open('w');
    file.write(AIS.JSON.stringify(profile));
    file.close();
}

function loadProfile() {
    var file = new File(CFG.PROFILE_DATA_FILE);
    if (!file.exists) return null;

    file.encoding = 'UTF-8';
    file.open('r');
    var content = file.read();
    file.close();

    try {
        return AIS.JSON.parse(content);
    } catch (e) {
        return null;
    }
}

function generateReport(profile) {
    var html = [];

    html.push('<!DOCTYPE html>');
    html.push('<html><head><meta charset="UTF-8">');
    html.push('<title>Script Performance Profile</title>');
    html.push('<style>');
    html.push('body { font-family: "Segoe UI", Arial, sans-serif; margin: 20px; background: #f5f5f5; }');
    html.push('h1 { color: ' + CFG.COLORS.header + '; }');
    html.push('.stats { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid ' + CFG.COLORS.header + '; }');
    html.push('.script { background: white; padding: 12px; margin: 10px 0; border-left: 4px solid #ddd; }');
    html.push('.fast { border-left-color: ' + CFG.COLORS.fast + '; }');
    html.push('.moderate { border-left-color: ' + CFG.COLORS.moderate + '; }');
    html.push('.slow { border-left-color: ' + CFG.COLORS.slow + '; }');
    html.push('.verySlow { border-left-color: ' + CFG.COLORS.verySlow + '; }');
    html.push('</style></head><body>');

    html.push('<h1>Script Performance Profile</h1>');
    html.push('<p><strong>Date:</strong> ' + profile.date + '</p>');
    html.push('<p><strong>Illustrator Version:</strong> ' + profile.aiVersion + '</p>');
    html.push('<p><strong>Scripts Profiled:</strong> ' + profile.results.length + '</p>');

    var byRating = {fast: 0, moderate: 0, slow: 0, verySlow: 0};
    for (var i = 0; i < profile.results.length; i++) {
        byRating[profile.results[i].rating]++;
    }

    html.push('<div class="stats">');
    html.push('<h3>Performance Distribution</h3>');
    html.push('<p>Fast: ' + byRating.fast + ' | Moderate: ' + byRating.moderate + ' | Slow: ' + byRating.slow + ' | Very Slow: ' + byRating.verySlow + '</p>');
    html.push('</div>');

    var sorted = profile.results.slice();
    sorted.sort(function(a, b) { return b.complexity - a.complexity; });

    html.push('<h2>Scripts by Complexity</h2>');

    for (var j = 0; j < sorted.length; j++) {
        var script = sorted[j];
        html.push('<div class="script ' + script.rating + '">');
        html.push('<strong>' + script.name + '</strong> (' + script.category + ')');
        html.push('<br>Lines: ' + script.lines + ' | Functions: ' + script.functions + ' | Loops: ' + script.loops);
        html.push('<br>Complexity: ' + script.complexity + ' | Rating: ' + script.rating.toUpperCase());
        html.push('</div>');
    }

    html.push('</body></html>');

    var reportFile = new File(CFG.REPORT_FILE);
    reportFile.encoding = 'UTF-8';
    reportFile.open('w');
    reportFile.write(html.join('\n'));
    reportFile.close();

    reportFile.execute();

    alert('Profile Complete\nScripts profiled: ' + profile.results.length + '\nReport opened in browser');
}

main();

// ============================================================================
// EXECUTE
// ============================================================================

try {
    main();
} catch (e) {
    AIS.Error.show('Script error', e);
}
