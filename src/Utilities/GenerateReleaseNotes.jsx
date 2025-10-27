/**
 * Generate Release Notes
 * @version 1.0.0
 * @description Parses CHANGELOG.md to generate formatted release notes for new versions. Creates both Markdown and HTML output with proper formatting, categorization, and version comparison. Simplifies the release process by automating release note generation.
 * @category Utilities
 * @features
 *   - Parses CHANGELOG.md for version entries
 *   - Extracts features, fixes, improvements by category
 *   - Generates formatted Markdown release notes
 *   - Creates styled HTML release notes
 *   - Version comparison (what's new since last release)
 *   - Customizable templates and styling
 *   - Automatic version detection
 * @author Vexy
 * @usage File → Scripts → Generate Release Notes
 *        Select version range, generates formatted notes
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
    PROJECT_DIR: new Folder(File($.fileName).parent.parent),
    CHANGELOG_PATH: File($.fileName).parent.parent + '/CHANGELOG.md',
    OUTPUT_DIR: Folder.myDocuments + '/Adobe Scripts/Releases/',
    TIMESTAMP: new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19),

    VERSION_PATTERN: /##\s+\[?(\d+\.\d+\.\d+)\]?\s+-\s+(.+)/,
    DATE_PATTERN: /\d{4}-\d{2}-\d{2}/,

    CATEGORIES: [
        'Added', 'Changed', 'Fixed', 'Removed',
        'Deprecated', 'Security', 'Performance'
    ]
};

// ============================================================================
// MAIN FUNCTION
// ============================================================================
function main() {
    try {
        if (!fileExists(CFG.CHANGELOG_PATH)) {
            alert('CHANGELOG.md not found\n\nExpected location:\n' + CFG.CHANGELOG_PATH);
            return;
        }

        var changelog = parseChangelog();
        if (changelog.versions.length === 0) {
            alert('No versions found in CHANGELOG.md');
            return;
        }

        var result = showDialog(changelog.versions);
        if (!result) return;

        var releaseNotes = generateReleaseNotes(changelog, result);
        saveReleaseNotes(releaseNotes, result);

        alert('Release Notes Generated\n\n' +
              'Version: ' + result.version + '\n' +
              'Format: ' + result.format + '\n\n' +
              'Saved to:\n' + CFG.OUTPUT_DIR);

    } catch (e) {
        AIS.Error.show('Release note generation failed', e);
    }
}

// ============================================================================
// CHANGELOG PARSING
// ============================================================================
function parseChangelog() {
    var file = new File(CFG.CHANGELOG_PATH);
    file.encoding = 'UTF-8';
    file.open('r');
    var content = file.read();
    file.close();

    var lines = content.split('\n');
    var versions = [];
    var currentVersion = null;
    var currentCategory = null;

    for (var i = 0; i < lines.length; i++) {
        var line = AIS.String.trim(lines[i]);

        var versionMatch = line.match(CFG.VERSION_PATTERN);
        if (versionMatch) {
            if (currentVersion) {
                versions.push(currentVersion);
            }

            currentVersion = {
                version: versionMatch[1],
                date: extractDate(versionMatch[2]),
                title: versionMatch[2],
                categories: {},
                raw: []
            };
            currentCategory = null;
            continue;
        }

        if (!currentVersion) continue;

        var categoryMatch = line.match(/^###\s+(.+)/);
        if (categoryMatch) {
            currentCategory = categoryMatch[1];
            if (!currentVersion.categories[currentCategory]) {
                currentVersion.categories[currentCategory] = [];
            }
            continue;
        }

        if (currentCategory && line.match(/^[-*]\s+/)) {
            var item = line.replace(/^[-*]\s+/, '');
            currentVersion.categories[currentCategory].push(item);
        }

        if (line) {
            currentVersion.raw.push(line);
        }
    }

    if (currentVersion) {
        versions.push(currentVersion);
    }

    return {
        versions: versions,
        latest: versions.length > 0 ? versions[0] : null
    };
}

function extractDate(text) {
    var match = text.match(CFG.DATE_PATTERN);
    return match ? match[0] : 'Unknown';
}

function fileExists(path) {
    var file = new File(path);
    return file.exists;
}

// ============================================================================
// RELEASE NOTES GENERATION
// ============================================================================
function generateReleaseNotes(changelog, config) {
    var version = findVersion(changelog.versions, config.version);
    if (!version) {
        throw new Error('Version not found: ' + config.version);
    }

    if (config.format === 'markdown') {
        return generateMarkdown(version, config);
    } else {
        return generateHTML(version, config);
    }
}

function findVersion(versions, versionNum) {
    for (var i = 0; i < versions.length; i++) {
        if (versions[i].version === versionNum) {
            return versions[i];
        }
    }
    return null;
}

function generateMarkdown(version, config) {
    var md = [];

    md.push('# Release Notes - Version ' + version.version);
    md.push('');
    md.push('**Release Date:** ' + version.date);
    md.push('');

    if (config.includeIntro) {
        md.push('## Overview');
        md.push('');
        md.push(generateOverview(version));
        md.push('');
    }

    for (var cat in version.categories) {
        if (!version.categories.hasOwnProperty(cat)) continue;
        if (version.categories[cat].length === 0) continue;

        md.push('## ' + cat);
        md.push('');

        var items = version.categories[cat];
        for (var i = 0; i < items.length; i++) {
            md.push('- ' + items[i]);
        }
        md.push('');
    }

    if (config.includeStats) {
        md.push('## Statistics');
        md.push('');
        md.push(generateStats(version));
        md.push('');
    }

    return md.join('\n');
}

function generateHTML(version, config) {
    var html = [];

    html.push('<!DOCTYPE html>');
    html.push('<html><head><meta charset="UTF-8">');
    html.push('<title>Release Notes - Version ' + version.version + '</title>');
    html.push('<style>');
    html.push(getReleaseStyles());
    html.push('</style></head><body>');

    html.push('<div class="container">');
    html.push('<header>');
    html.push('<h1>Release Notes</h1>');
    html.push('<div class="version-badge">Version ' + version.version + '</div>');
    html.push('<p class="release-date">Released: ' + version.date + '</p>');
    html.push('</header>');

    if (config.includeIntro) {
        html.push('<section class="overview">');
        html.push('<h2>Overview</h2>');
        html.push('<p>' + generateOverview(version) + '</p>');
        html.push('</section>');
    }

    for (var cat in version.categories) {
        if (!version.categories.hasOwnProperty(cat)) continue;
        if (version.categories[cat].length === 0) continue;

        var iconClass = getCategoryIcon(cat);
        html.push('<section class="category">');
        html.push('<h2><span class="icon ' + iconClass + '"></span>' + cat + '</h2>');
        html.push('<ul>');

        var items = version.categories[cat];
        for (var i = 0; i < items.length; i++) {
            html.push('<li>' + escapeHTML(items[i]) + '</li>');
        }

        html.push('</ul>');
        html.push('</section>');
    }

    if (config.includeStats) {
        html.push('<section class="stats">');
        html.push('<h2>Statistics</h2>');
        html.push(generateStatsHTML(version));
        html.push('</section>');
    }

    html.push('<footer>');
    html.push('<p>Generated: ' + new Date().toString() + '</p>');
    html.push('</footer>');

    html.push('</div></body></html>');

    return html.join('\n');
}

function generateOverview(version) {
    var totalChanges = 0;
    for (var cat in version.categories) {
        if (version.categories.hasOwnProperty(cat)) {
            totalChanges += version.categories[cat].length;
        }
    }

    var overview = 'Version ' + version.version + ' includes ' + totalChanges + ' change';
    if (totalChanges !== 1) overview += 's';
    overview += ' across ';

    var catCount = 0;
    for (var cat in version.categories) {
        if (version.categories.hasOwnProperty(cat) && version.categories[cat].length > 0) {
            catCount++;
        }
    }

    overview += catCount + ' categor';
    overview += (catCount === 1) ? 'y.' : 'ies.';

    return overview;
}

function generateStats(version) {
    var stats = [];

    stats.push('**Total Changes:** ' + countTotalChanges(version));

    for (var cat in version.categories) {
        if (!version.categories.hasOwnProperty(cat)) continue;
        if (version.categories[cat].length === 0) continue;

        stats.push('**' + cat + ':** ' + version.categories[cat].length);
    }

    return stats.join('\n');
}

function generateStatsHTML(version) {
    var html = [];

    html.push('<div class="stats-grid">');
    html.push('<div class="stat-item">');
    html.push('<div class="stat-value">' + countTotalChanges(version) + '</div>');
    html.push('<div class="stat-label">Total Changes</div>');
    html.push('</div>');

    for (var cat in version.categories) {
        if (!version.categories.hasOwnProperty(cat)) continue;
        if (version.categories[cat].length === 0) continue;

        html.push('<div class="stat-item">');
        html.push('<div class="stat-value">' + version.categories[cat].length + '</div>');
        html.push('<div class="stat-label">' + cat + '</div>');
        html.push('</div>');
    }

    html.push('</div>');

    return html.join('\n');
}

function countTotalChanges(version) {
    var count = 0;
    for (var cat in version.categories) {
        if (version.categories.hasOwnProperty(cat)) {
            count += version.categories[cat].length;
        }
    }
    return count;
}

function getCategoryIcon(category) {
    var icons = {
        'Added': 'icon-plus',
        'Changed': 'icon-edit',
        'Fixed': 'icon-wrench',
        'Removed': 'icon-minus',
        'Deprecated': 'icon-alert',
        'Security': 'icon-shield',
        'Performance': 'icon-speedometer'
    };

    return icons[category] || 'icon-default';
}

function escapeHTML(text) {
    return text.replace(/&/g, '&amp;')
               .replace(/</g, '&lt;')
               .replace(/>/g, '&gt;')
               .replace(/"/g, '&quot;')
               .replace(/'/g, '&#039;');
}

function getReleaseStyles() {
    return 'body{font-family:system-ui,-apple-system,sans-serif;background:#f5f7fa;margin:0;padding:20px;line-height:1.6}' +
           '.container{max-width:900px;margin:0 auto;background:#fff;border-radius:8px;box-shadow:0 2px 10px rgba(0,0,0,0.1);overflow:hidden}' +
           'header{background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:#fff;padding:40px;text-align:center}' +
           'header h1{margin:0;font-size:2.5em;font-weight:300}' +
           '.version-badge{display:inline-block;background:rgba(255,255,255,0.2);padding:8px 16px;border-radius:20px;margin:15px 0;font-size:1.1em;font-weight:500}' +
           '.release-date{margin:10px 0 0 0;opacity:0.9;font-size:0.95em}' +
           'section{padding:30px 40px;border-bottom:1px solid #e1e8ed}' +
           'section:last-of-type{border-bottom:none}' +
           'h2{color:#2c3e50;margin:0 0 20px 0;font-size:1.8em;font-weight:500;display:flex;align-items:center}' +
           '.icon{display:inline-block;width:30px;height:30px;margin-right:12px;border-radius:6px;background:#e1e8ed;position:relative}' +
           '.icon-plus{background:#10b981}' +
           '.icon-edit{background:#3b82f6}' +
           '.icon-wrench{background:#f59e0b}' +
           '.icon-minus{background:#ef4444}' +
           '.icon-alert{background:#f97316}' +
           '.icon-shield{background:#8b5cf6}' +
           '.icon-speedometer{background:#06b6d4}' +
           'ul{list-style:none;padding:0;margin:0}' +
           'li{padding:12px 0;border-bottom:1px solid #f1f3f5;position:relative;padding-left:20px}' +
           'li:last-child{border-bottom:none}' +
           'li:before{content:"";position:absolute;left:0;top:20px;width:8px;height:8px;background:#3b82f6;border-radius:50%}' +
           '.overview{background:#f8fafc}' +
           '.overview p{font-size:1.1em;color:#475569;margin:0;line-height:1.8}' +
           '.stats{background:#f8fafc}' +
           '.stats-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:20px}' +
           '.stat-item{text-align:center;padding:20px;background:#fff;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,0.1)}' +
           '.stat-value{font-size:2.5em;font-weight:700;color:#667eea;margin:0}' +
           '.stat-label{color:#64748b;margin-top:5px;font-size:0.9em}' +
           'footer{background:#f8fafc;padding:20px;text-align:center;color:#64748b;font-size:0.85em}' +
           'footer p{margin:0}';
}

function saveReleaseNotes(content, config) {
    var folder = new Folder(CFG.OUTPUT_DIR);
    if (!folder.exists) folder.create();

    var ext = config.format === 'markdown' ? 'md' : 'html';
    var filename = 'release-notes-v' + config.version + '-' + CFG.TIMESTAMP + '.' + ext;
    var file = new File(CFG.OUTPUT_DIR + filename);

    file.encoding = 'UTF-8';
    file.open('w');
    file.write(content);
    file.close();
}

// ============================================================================
// USER INTERFACE
// ============================================================================
function showDialog(versions) {
    var dialog = new Window('dialog', 'Generate Release Notes');
    dialog.alignChildren = 'fill';

    var versionGroup = dialog.add('panel', undefined, 'Version');
    versionGroup.orientation = 'row';
    versionGroup.alignChildren = ['left', 'center'];
    versionGroup.margins = 15;

    versionGroup.add('statictext', undefined, 'Select version:');
    var versionList = versionGroup.add('dropdownlist', undefined, getVersionStrings(versions));
    versionList.selection = 0;
    versionList.preferredSize.width = 250;

    var formatGroup = dialog.add('panel', undefined, 'Output Format');
    formatGroup.orientation = 'column';
    formatGroup.alignChildren = 'left';
    formatGroup.margins = 15;

    var markdownRadio = formatGroup.add('radiobutton', undefined, 'Markdown (.md)');
    var htmlRadio = formatGroup.add('radiobutton', undefined, 'HTML (.html)');
    markdownRadio.value = true;

    var optionsGroup = dialog.add('panel', undefined, 'Options');
    optionsGroup.orientation = 'column';
    optionsGroup.alignChildren = 'left';
    optionsGroup.margins = 15;

    var includeIntroCheck = optionsGroup.add('checkbox', undefined, 'Include overview section');
    var includeStatsCheck = optionsGroup.add('checkbox', undefined, 'Include statistics');
    includeIntroCheck.value = true;
    includeStatsCheck.value = true;

    var buttonGroup = dialog.add('group');
    buttonGroup.alignment = 'right';
    var generateBtn = buttonGroup.add('button', undefined, 'Generate', {name: 'ok'});
    var cancelBtn = buttonGroup.add('button', undefined, 'Cancel', {name: 'cancel'});

    if (dialog.show() === 2) return null;

    var selectedVersion = versions[versionList.selection.index];

    return {
        version: selectedVersion.version,
        format: markdownRadio.value ? 'markdown' : 'html',
        includeIntro: includeIntroCheck.value,
        includeStats: includeStatsCheck.value
    };
}

function getVersionStrings(versions) {
    var strings = [];
    for (var i = 0; i < versions.length; i++) {
        strings.push(versions[i].version + ' - ' + versions[i].date);
    }
    return strings;
}
