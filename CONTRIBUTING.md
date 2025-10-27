# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **phased modernization project** transforming 426 legacy Adobe Illustrator scripts into a unified, professional library. The project uses a custom framework called **AIS (Adobe Illustrator Scripts)** to provide consistent utilities across all scripts.

**Current Status:** 18/426 scripts modernized (4.2%) | Favorites category 100% complete

**Key Constraint:** ExtendScript (Adobe's JavaScript engine) only supports ES3 - no `const`, `let`, arrow functions, classes, or modern syntax.

## Architecture

### Three-Layer System

```
┌─────────────────────────────────────┐
│ AIS Library (lib/)                  │
│ - core.jsx: Utilities, error        │
│ - ui.jsx: Dialog components         │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│ Production Scripts (17 categories)  │
│ Each uses #include "../lib/core.jsx"│
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│ Legacy Archives (old/, old2/)       │
│ READ-ONLY reference material        │
└─────────────────────────────────────┘
```

### Critical Files

| File | Purpose |
|------|---------|
| `lib/core.jsx` | AIS framework - shared utilities (units, JSON, error handling, etc.) |
| `lib/ui.jsx` | UI components and dialog builders |
| `scripts.toml` | Master catalog of all 426 scripts with quality ratings (1-5) |
| `CONTRIBUTING.md` | Detailed modernization methodology (43KB guide) |
| `TODO.md` | Current task list |
| `WORK.md` | Session notes and progress |

### Folder Organization

**Production folders** (organized by function):
- `Favorites/` - 7 top-tier scripts (100% complete)
- `Artboards/`, `Text/`, `Layers/`, `Colors/`, `Paths/`, `Transform/`, etc. (16 more categories)

**Archive folders** (READ-ONLY):
- `old/` - 351 original scripts (mixed languages, various sources)
- `old2/` - 75 LAScripts framework scripts (different framework, needs re-implementation)

## AIS Library Quick Reference

All scripts include `#include "../lib/core.jsx"` and use the `AIS` namespace:

```javascript
// Units
AIS.Units.get()                        // Get current doc units ('px', 'pt', 'mm', etc.)
AIS.Units.convert(72, 'pt', 'mm')      // Convert between units → 25.4

// JSON
AIS.JSON.stringify(obj)                // Safe JSON serialization
AIS.JSON.parse(str)                    // Safe JSON parsing

// System
AIS.System.isMac()                     // Platform detection
AIS.System.openURL(url)                // Open URL in browser

// Error Handling
AIS.Error.show('Message', error)       // Formatted error dialog

// Document
AIS.Document.hasDocument()             // Check if document exists
AIS.Document.hasSelection()            // Check if selection exists
AIS.Document.getActive()               // Get active document
```

## Standard Script Structure

Every modernized script follows this pattern:

```javascript
/**
 * Script Name
 * @version 1.0.0
 * @description What it does
 * @category CategoryName
 */

#include "../lib/core.jsx"

//@target illustrator
app.preferences.setBooleanPreference('ShowExternalJSXWarning', false);

(function() {
    // Validation wrapper
    if (!AIS.Document.hasDocument()) {
        alert('No document\nOpen a document and try again');
        return;
    }

    main();
})();

// ============================================================================
// CONFIGURATION
// ============================================================================
var CFG = {
    // Hard-coded defaults
};

// ============================================================================
// MAIN FUNCTION
// ============================================================================
function main() {
    // Entry point
}

// ============================================================================
// CORE LOGIC
// ============================================================================
// Business logic functions

// ============================================================================
// USER INTERFACE
// ============================================================================
// Dialog creation and event handlers

// ============================================================================
// UTILITIES
// ============================================================================
// Helper functions
```

## Common Development Commands

### Testing Scripts in Illustrator

No automated test runner for ExtendScript - all testing is manual:

1. Open Adobe Illustrator
2. File → Scripts → Other Script
3. Select the `.jsx` file
4. Test functionality manually

### Code Quality Checks

```bash
# Check for ES6+ syntax (not allowed in ExtendScript)
grep -E "(const |let |=>|class |`)" ScriptName.jsx

# Find all scripts in a category
ls -lh Favorites/*.jsx

# Count remaining scripts by size
find old -name "*.jsx" -exec wc -l {} \; | awk '$1 > 500' | sort -n

# Check for French text (should be English-only)
grep -i "marge\|echelle\|cotation" Text/*.jsx
```

### File Operations

```bash
# Count completion progress
find Favorites -name "*.jsx" | wc -l    # Should be 7
find Artboards -name "*.jsx" | wc -l    # Track progress
find Text -name "*.jsx" | wc -l         # Track progress

# Line counts
wc -l lib/core.jsx                      # 922 lines
wc -l Favorites/*.jsx | tail -1         # Total Favorites code
```

## Quality Tiers (scripts.toml)

Scripts are rated 1-5 based on usefulness:

- **Quality 5 (Favorites):** 7 scripts - highest priority, **100% complete**
- **Quality 4:** 52 scripts - very useful, next priority
- **Quality 3:** 162 scripts - useful tools
- **Quality 2 (Varia):** 114 scripts - miscellaneous
- **Quality 1:** 16 scripts - archive/remove

## Key Patterns & Standards

### Unit Conversion

```javascript
// ❌ WRONG: Manual conversion
var mmToPt = 2.834645;
var widthMM = widthPt / mmToPt;

// ✅ RIGHT: Use AIS library
var widthMM = AIS.Units.convert(widthPt, 'pt', 'mm');
```

### Settings Persistence

```javascript
// Standard pattern for saving user preferences
var SETTINGS = {
    name: 'script-name-settings.json',
    folder: Folder.myDocuments + '/Adobe Scripts/'
};

function saveSettings(config) {
    var folder = new Folder(SETTINGS.folder);
    if (!folder.exists) folder.create();

    var file = new File(SETTINGS.folder + SETTINGS.name);
    file.encoding = 'UTF-8';
    file.open('w');
    file.write(AIS.JSON.stringify(config));
    file.close();
}

function loadSettings() {
    var file = new File(SETTINGS.folder + SETTINGS.name);
    if (!file.exists) return getDefaultConfig();

    file.encoding = 'UTF-8';
    file.open('r');
    var json = file.read();
    file.close();
    return AIS.JSON.parse(json);
}
```

### Live Preview

```javascript
// Standard undo-based preview pattern
var previewState = false;

function updatePreview(dialog) {
    if (previewState) {
        app.undo();  // Remove previous preview
    } else {
        previewState = true;
    }

    var config = getConfiguration(dialog);
    executeOperation(config);
    app.redraw();
}
```

## Critical Rules

### Must Follow

1. **English-only** - No French or other languages in UI/code
2. **ES3 only** - No `const`, `let`, `=>`, `class`, template literals
3. **Use AIS library** - Don't reimplement utilities (units, JSON, errors)
4. **PascalCase filenames** - `AddMargins.jsx`, not `add_margins.jsx`
5. **Include core.jsx** - Every script: `#include "../lib/core.jsx"`
6. **Validation wrapper** - Every script checks for document/selection
7. **Error handling** - Use try/catch and `AIS.Error.show()`
8. **Settings persistence** - Save user preferences between runs

### Must Avoid

1. ❌ Global variables (use local `var` in functions)
2. ❌ Hardcoded paths (use `Folder.myDocuments`)
3. ❌ Manual unit conversion (use `AIS.Units.convert()`)
4. ❌ Inline JSON handling (use `AIS.JSON.stringify/parse()`)
5. ❌ No input validation
6. ❌ Mixed language UI
7. ❌ Modifying `lib/core.jsx` without careful consideration

## Development Workflow

### When Adding/Modernizing Scripts

1. **Read original** in `old/` or `old2/` folder
2. **Check CONTRIBUTING.md** for detailed methodology
3. **Follow standard structure** (see above)
4. **Use AIS library** for common operations
5. **Test manually** in Illustrator
6. **Update TODO.md** to track progress
7. **Update WORK.md** with session notes

### When Modifying AIS Library

`lib/core.jsx` is **shared infrastructure** - changes affect all 426 scripts:

1. Make changes carefully
2. Test with multiple existing scripts
3. Document all changes thoroughly
4. Consider backward compatibility

## Documentation Files

- **README.md** - User-facing overview, installation, featured scripts
- **CONTRIBUTING.md** - 43KB detailed modernization methodology
- **PLAN.md** - 8-phase project roadmap with time estimates
- **TODO.md** - Flat task list (updated frequently)
- **WORK.md** - Session notes, test results, progress tracking
- **CHANGELOG.md** - Release notes

## Example Scripts to Reference

When modernizing new scripts, reference these completed examples:

**Simple script (< 300 lines):**
- `Favorites/GoToLine.jsx` (246 lines) - Text navigation

**Medium script (300-600 lines):**
- `Favorites/StepAndRepeat.jsx` (578 lines) - Duplication with preview
- `Text/VectorsToText.jsx` (140 lines) - Convert outlined text

**Complex script (600-1000 lines):**
- `Favorites/FitArtboardsToArtwork.jsx` (883 lines) - Artboard resizing
- `Favorites/ExportAsPDF.jsx` (908 lines) - Batch export with presets

**Very complex script (1000+ lines):**
- `Favorites/BatchRenamer.jsx` (1,727 lines) - Advanced renaming with regex

## Current Phase

**Phase 3:** Completing French Q4 scripts (8/15 done)

Next scripts to modernize are in `old/french/` folder - requires translation to English.

## Getting Help

**For architecture questions:** Read this file + README.md + PLAN.md
**For modernization process:** Read CONTRIBUTING.md (detailed 43KB guide)
**For current tasks:** Check TODO.md
**For example code:** Look at `Favorites/` scripts
**For AIS API details:** Read `lib/core.jsx` comments (922 lines, well-documented)

## Repository Path

Absolute path: `/Users/adam/Developer/vcs/github.vexyart/vexy-illustrator-scripts`
