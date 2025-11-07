# Vexy Illustrator Scripts - Refactoring & Modernization Plan
<!-- this_file: PLAN.md -->

**Version:** 2.0.0  
**Date:** 2025-10-27  
**Scope:** Transform the AIS framework into a Vexy-branded, modular library with installer, modern ES3 patterns, and Illustrator CC 2025 validation.

---

## Executive Summary

Modernize the Adobe Illustrator Scripts framework by migrating from the AIS namespace to the Vexy brand while expanding shared libraries, delivering an installer, and tightening quality standards without breaking ES3 compatibility.

**Current State:** 208/426 scripts modernized (48.8%) with two shared files (core.jsx 958 lines, ui.jsx 481 lines); AIS namespace and manual installation remain; ES3 compliance is 100%.  
**Target State:** 10+ modular libraries (~4,200 lines) under the Vexy namespace, a GUI installer, codified modern ES3 patterns, validated Adobe Illustrator CC 2025 support, and an improved developer experience.

---

## Quick Reference

Transform the AIS framework into the Vexy framework with expanded libraries, installer, and patterns.

### Timeline
```
Week 1-4   ████████░░░░░░░░ Phase 1: Library Expansion (13 files, 4.2k lines)
Week 5-6   ████░░░░░░░░░░░░ Phase 2: Vexy Branding (208 scripts)
Week 7-8   ████░░░░░░░░░░░░ Phase 3: Installer (800 lines GUI)
Week 9-10  ████░░░░░░░░░░░░ Phase 4: Modern Patterns (6 patterns)
Week 11    ██░░░░░░░░░░░░░░ Phase 5: AI 2025 Compat
Week 12    ██░░░░░░░░░░░░░░ Phase 6: Documentation
Week 13-14 ████░░░░░░░░░░░░ Phase 7: Testing
Week 15    ██░░░░░░░░░░░░░░ Phase 8: Release
═══════════════════════════════════════════════════════════
Total: 13-15 weeks (~3.5 months)
```

### Key Deliverables by Phase
| Phase | Input | Output | Critical Path |
|-------|-------|--------|---------------|
| **1** | 2 libs (1.4k) | 13 libs (4.2k) | Core APIs |
| **2** | AIS namespace | Vexy namespace | All 208 scripts |
| **3** | Manual install | GUI installer | Platform testing |
| **4** | Basic patterns | 6 modern patterns | ES3 compliance |
| **5** | Unknown compat | AI 2025 verified | Version detection |
| **6** | 20k docs | 25k docs | API reference |
| **7** | No tests | Multi-platform | Regression suite |
| **8** | Draft | v2.0.0 release | Go/no-go decision |

**Critical Dependencies:** Phase 1 → Phase 2 → Phase 3; Phase 4 runs alongside Phase 2; Phase 5 runs alongside Phase 4; Phase 6 follows Phases 1–5; Phase 7 requires prior phases; Phase 8 depends on Phase 7.  
**Parallelization Opportunities:** Run Phase 4 during Phase 2 and Phase 5 during Phase 4 when resources allow.

**Decision Tree:** Implementers run the Pre-Implementation Checklist then start Phase 1 Task 1.1; Testers jump to Phase 7; Documenters focus on Phase 6; Planners review the Executive Summary and this Quick Reference.

### Risk Snapshot
| Risk | Level | Mitigation |
|------|-------|------------|
| Namespace breaking changes | 🔴 HIGH | Regression testing plus compatibility layer |
| ES3 compliance violations | 🟡 MEDIUM | Automated grep checks and reviews |
| Installer platform issues | 🟡 MEDIUM | macOS/Windows testing matrix |
| Performance regression | 🟢 LOW | Benchmark before/after |

### Success Checklist (Must Have)
- [ ] Thirteen Vexy library modules built and verified
- [ ] All 208 scripts migrated from AIS → Vexy namespace
- [ ] GUI installer operational
- [ ] ES3 compliance maintained at 100%
- [ ] Illustrator CC 2025 tested (primary) plus back-compat spot checks
- [ ] Documentation refreshed with full coverage
- [ ] No behavioural regressions in existing scripts

### Code Statistics at a Glance
| Metric | Current | Target | Change |
|--------|---------|--------|--------|
| Library files | 2 | 13 | +550% |
| Library lines | 1,439 | 4,200 | +192% |
| Script lines | ~66,000 | ~68,000 | +3% |
| Doc lines | 20,000 | 25,000 | +25% |
| **Total** | **~87,500** | **~98,000** | **+12%** |

### Getting Started (For Implementers)
1. Read Executive Summary (10 min), Phase 1 Library Expansion (20 min), and the Pre-Implementation Checklist (5 min).
2. Set up: `git checkout -b refactor/vexy-2.0`, back up the codebase, and review the ES3 compliance guide.
3. Start small: prototype `prefs.jsx`, test with one Favorites script, iterate and validate.
4. Reference: Phase 1.2 for APIs, Phase 4 for patterns, Phase 7 for validation.

### Key Contacts & Resources
- Master plan: PLAN.md (this file)
- Work log: WORK.md
- Active issues: TODO.md
- Change history: CHANGELOG.md
- Upcoming Phase 6 docs: VEXY_FRAMEWORK.md, LIBRARY_REFERENCE.md, MIGRATION_GUIDE.md, INSTALLER_GUIDE.md

---

## Pre-Implementation Checklist

Complete these tasks before starting Phase 1; total setup time ≈2.5 hours.

### 1. Project Setup (30 min)
- [ ] `git checkout -b refactor/vexy-2.0`; tag baseline with `git tag -a v1.0-pre-refactor -m "Baseline before Vexy refactoring"` and `git push origin v1.0-pre-refactor`.
- [ ] Back up repository: `tar -czf vexy-scripts-backup-$(date +%Y%m%d).tar.gz src/ *.md *.toml`.
- [ ] Back up settings: `cp -r ~/Documents/Adobe\ Scripts ~/Documents/Adobe\ Scripts.backup`.
- [ ] Capture current library versions: `grep "version:" src/.lib/*.jsx > lib-versions-baseline.txt`.

### 2. Environment Verification (15 min)
- Confirm Illustrator 2025 is installed, text editor supports ES3 linting, Git is configured with proper ignores, and a comparison tool (diff/meld) is available.
- Create `check-es3.sh` that prints “Checking for ES6+ syntax violations...” then runs `grep -rn "const \|let \|=>\|class \|\`" src/.lib/*.jsx src/Favorites/*.jsx || echo "✓ No violations found"`; `chmod +x check-es3.sh`; run `./check-es3.sh`.
- Prepare a Markdown library template with “Library Name”, “Version”, “Purpose”, “API Reference”, “Usage Examples”, and “Dependencies”.

### 3. Communication Plan (15 min)
- Notify stakeholders about the refactor start, circulate PLAN.md, schedule weekly status updates, and open a Slack/Discord/email channel.
- Create GitHub issues #1–#8 (Phase 1 Library Expansion, Phase 2 Vexy Branding, Phase 3 Installer Development, Phase 4 Modern Patterns, Phase 5 AI 2025 Compatibility, Phase 6 Documentation Updates, Phase 7 Testing & Validation, Phase 8 Release Preparation) and set up a project board or kanban.

### 4. Testing Infrastructure (30 min)
- Build an Illustrator test file containing rectangles, circles, text frames, paths, groups, 3–5 layers, three artboards, and RGB plus CMYK swatches; save as `test-document.ai`.
- Draft `TestLibraryName.jsx` with `#include "src/.lib/core.jsx"` and the target library, counters for passed/failed checks, and an alert summarising results.
- Create a benchmark script that records `new Date().getTime()` before/after operations, alerts `Execution time: Xms`, and log baselines to `performance-baseline.txt`.

### 5. Risk Mitigation (20 min)
- Document rollback: checkout `main`, restore `vexy-scripts-backup-[date].tar.gz`, copy `~/Documents/Adobe Scripts.backup` back into place, notify stakeholders, log lessons learned.
- Define contingency plans: Plan A full refactor (15 weeks), Plan B phased rollout (20 weeks, safer), Plan C library-only refactor (8 weeks); write decision criteria for switching.

### 6. Phase 1 Preparation (30 min)
- Prioritise libraries: `prefs.jsx` → `file.jsx` → `color.jsx` → `geometry.jsx` → `selection.jsx`/`artboard.jsx`/`path.jsx`/`text.jsx`/`layer.jsx`/`export.jsx`.
- Create stub files (e.g., `Vexy.Prefs.load(scriptName, defaults)`, `Vexy.Prefs.save(scriptName, settings)`) for every module, review signatures with the team, and secure approval before coding.

### 7. Final Verification (10 min)
- Confirm backups, branch push, environment checks, ES3 script execution, test assets, stakeholder notifications, benchmark baselines, rollback documentation, Phase 1 priorities, and API stubs.
- Record Go/No-Go approvals (project sponsor, technical lead, timeline, resources).
- Critical path items: version control, backups, ES3 validation, rollback plan, Go/No-Go signoff.
- Optional items (can slip into Phase 1): detailed performance benchmarking, full test harness build-out, project board automation.

---

## Phase 1: Library Expansion & Modularization

**Priority:** CRITICAL | **Estimate:** 3–4 weeks | **Status:** Planning

### 1.1 Core Library Enhancements (`src/.lib/core.jsx`)
- Current: 958 lines; target: 800 lines after extracting specialised utilities.
- Keep: Vexy namespace bootstrap, version management, error handling, logging, string/number/array helpers, system detection, document helpers.
- Extract to specialised libraries: settings → `prefs.jsx`; color → `color.jsx`; geometry → `geometry.jsx`; file I/O → `file.jsx`.
- Extend `Vexy.Core` with `version '2.0.0'`, `name 'Vexy Illustrator Scripts'`, `vendor 'Vexy.art'`, `minIllustratorVersion 16 (CS4 2012)`, `maxTestedVersion 29 (CC 2025)`, boolean `debugMode`, and methods `isCompatible(minVersion, maxVersion)`, `getVersionInfo()`, `toggleDebug()`, `registerScript(name, version, category)`.

### 1.2 New Specialized Libraries
- **`prefs.jsx` (~250 lines):** Unified settings persistence; functions `getSettingsFolder()`, `ensureSettingsFolder()`, `load()`, `save()`, `exists()`, `reset()`, `exportSettings()`, `importSettings()`, `migrateFrom()`, plus `paths.settings = Folder.myDocuments + '/Vexy Scripts/Settings/'`, `paths.temp = Folder.temp + '/Vexy Scripts/'`, `paths.logs = Folder.myDocuments + '/Vexy Scripts/Logs/'`.
- **`color.jsx` (~300 lines):** Color conversions (`rgbToHex`, `hexToRgb`, `rgbToCmyk`, `cmykToRgb`, `rgbToHsl`, `hslToRgb`), utilities (`isGrayscale`, `getColorBrightness`, `invertColor`, `blendColors`), accessibility (`getContrastRatio`, `meetsWCAG_AA`, `meetsWCAG_AAA`, `suggestAccessibleColor`), simulations (`simulateProtanopia`, `simulateDeuteranopia`, `simulateTritanopia`), palette helpers (`generatePalette`, `extractColorsFromSelection`, `applyColorToSelection`).
- **`geometry.jsx` (~350 lines):** Point math (`distance`, `midpoint`, `angle`, `rotate`), bounds (`getBounds`, `getVisibleBounds`, `getGeometricBounds`, `centerOfBounds`), shapes (`circumcircle`, `inscribedCircle`, `polygonArea`), intersections (`linesIntersect`, `pointInPolygon`, `pathsOverlap`), alignment (`alignToGrid`, `snapToAngle`), transforms (`getTransformMatrix`, `applyMatrix`, `decomposeMatrix`).
- **`selection.jsx` (~280 lines):** Utilities (`get`, `set`, `add`, `remove`, `clear`), filters (`filterByType`, `filterByLayer`, `filterBySize`, `filterByColor`, `filterByName`), sorting (`sortByPosition`, `sortBySize`, `sortByZOrder`, `sortByName`), analysis (`getBounds`, `getCenter`, `getTypes`), batch operations (`lockAll`, `unlockAll`, `hideAll`, `showAll`), memory (`remember`, `recall`, `forgetAll`).
- **`artboard.jsx` (~320 lines):** Basics (`get`, `getActive`, `getAll`, `getCount`), creation (`create`, `duplicate`, `createFromSelection`, `createFromBounds`), modification (`resize`, `fitToArtwork`, `setMargins`), utilities (`getObjectsOnArtboard`, `moveObjectsToArtboard`, `centerInArtboard`), arrangement (`arrange`, `alignArtboards`, `distributeArtboards`), naming (`rename`, `renameAll`, `renumberAll`), export helpers (`getExportBounds`, `prepareForExport`).
- **`path.jsx` (~400 lines):** Creation (`createRectangle`, `createCircle`, `createPolygon`, `createLine`), modification (`simplify`, `smooth`, `reverse`, `offset`), Boolean ops (`unite`, `subtract`, `intersect`, `exclude`, `divide`), analysis (`getLength`, `getArea`, `isClosed`, `getDirection`), anchor ops (`addAnchor`, `removeAnchor`, `smoothAnchors`, `convertToCorner`), compound (`createCompound`, `releaseCompound`), clipping (`createMask`, `releaseMask`).
- **`text.jsx` (~350 lines):** Frame ops (`createFrame`, `createAreaFrame`, `createPathFrame`), utilities (`getContent`, `setContent`, `findText`, `replaceText`), character ops (`toUnicode`, `fromUnicode`, `getCharacterCode`), formatting (`applyCharacterStyle`, `applyParagraphStyle`), threading (`threadFrames`, `breakThread`, `getThreadedFrames`), conversion (`convertToOutlines`, `convertToArea`, `convertToPoint`), analysis (`countCharacters`, `countWords`, `countLines`, `getMissingFonts`), navigation (`goToLine`, `highlightRange`).
- **`layer.jsx` (~280 lines):** Basics (`get`, `getActive`, `getAll`, `create`), operations (`rename`, `duplicate`, `remove`, `merge`), visibility/locking (`show`, `hide`, `lock`, `unlock`, `toggleVisibility`), organisation (`moveToTop`, `moveToBottom`, `moveAbove`, `moveBelow`), utilities (`isEmpty`, `getItemCount`, `getAllItems`, `removeEmpty`), color coding (`setColor`, `getColor`), batch ops (`lockAll`, `unlockAll`, `showAll`, `hideAll`).
- **`export.jsx` (~320 lines):** Presets (`webPNG`, `printPDF`, `svgWeb`), operations (`exportPNG`, `exportJPEG`, `exportPDF`, `exportSVG`), artboard export (`exportArtboard`, `exportAllArtboards`, `exportSelectedArtboards`), batch operations (`batchExport`), helpers (`prepareForExport`, `cleanupAfterExport`, `generateFilename`), format utilities (`getSupportedFormats`, `getFormatOptions`, `validateOptions`).
- **`file.jsx` (~250 lines):** File ops (`read`, `write`, `append`, `exists`, `delete`), folder ops (`createFolder`, `ensureFolder`, `listFiles`, `listFolders`), path helpers (`join`, `dirname`, `basename`, `extension`, `normalize`), platform helpers (`getPathSeparator`, `toSystemPath`), JSON (`readJSON`, `writeJSON`), CSV (`readCSV`, `writeCSV`).

### 1.3 UI Library Enhancements (`src/.lib/ui.jsx`)
- Expand from 481 to ~650 lines.
- `Vexy.UI.version = '2.0.0'`; provide `DialogBuilder(title, size)`.
- Components: `createProgressBar`, `createColorPicker`, `createFileSelector`, `createTabPanel`, `createTree`, `createSplitter`, `createScrollPanel`.
- Utilities: `validateInput`, `addTooltip`, `addHelpButton`, `applyTheme` (light/dark).

### 1.4 Library Loading & Dependencies
- Create `src/.lib/vexy.jsx` as the loader: statically `#include "core.jsx"` and `#include "ui.jsx"`.
- Document static include requirements for specialised libraries (`#include ".lib/prefs.jsx"`, etc.); dynamic `#include` is unsupported in ExtendScript.
- Maintain `Vexy.version = '2.0.0'`, `Vexy.loaded = { core: true, ui: true }`, and `Vexy.require(module)` for tracking only.

---

## Phase 2: Vexy Branding Implementation

**Priority:** HIGH | **Estimate:** 1–2 weeks | **Status:** Planning

### 2.1 Namespace Migration
- Replace `AIS` with `Vexy`, update `AIS.` references, rename “Adobe Illustrator Scripts” → “Vexy Illustrator Scripts”, and “AIS Library” → “Vexy Framework”.
- Update all JSDoc annotations (`@namespace Vexy`) across the 13 libraries, 208 production scripts, documentation, tests, and templates.

### 2.2 Branding Elements
- Implement `Vexy.UI.Branding.addHeader(dialog)` with ASCII logo:
  ```
  _   _
 | | | | ___ __  __ _   _
 | | | |/ _ \ \/ /| | | |
 | |_| |  __/ >  < | |_| |
  \___/ \___|/_/\_\\__, |
                    |___/
  ```
- Implement `addFooter(dialog, scriptName, version)` producing a 50-character `'━'` separator via a loop (ES3 has no `.repeat`) and displaying `scriptName + ' v' + version + ' | Vexy.art'`.
- Provide `showAbout(scriptName, version, description)` to surface branded information.

### 2.3 Settings & Logs Directory Structure
- New tree under `~/Documents/Vexy Scripts/`:
  - `Settings/` with JSON files (e.g., StepAndRepeat.json, BatchRenamer.json)
  - `Logs/` with `errors.log`, `debug.log`, `install.log`
  - `Temp/` for scratch files
  - `Backups/` for archived settings
- `Vexy.Migration.migrateSettings()` copies files from `~/Documents/Adobe Scripts/` to the new structure, updates JSON paths, and logs the migration outcome.

---

## Phase 3: Installer Development

**Priority:** HIGH | **Estimate:** 2 weeks | **Status:** Planning

### 3.1 Installer Script (`Install-Vexy.jsx`)
- Features: GUI installer, macOS/Windows platform detection (`$.os`), Illustrator version detection, scripts folder discovery, installation modes (All = 208 scripts, Favorites = 7 scripts, Custom per category), AIS settings migration, installation verification, uninstaller.
- `INSTALLER` object: `version '2.0.0'`, `name 'Vexy Illustrator Scripts Installer'`, booleans `isMac`, `isWindows`, `getScriptsFolder()` returning `/Presets.localized/en_US/Scripts/Vexy/` (macOS) or `/Presets/en_US/Scripts/Vexy/` (Windows), `sourceFolder`, `targetFolder`, `options` `{ installAll, installFavorites, installCategories, createMenus, migrateSettings }`.
- Dialog layout: welcome panel, system info (Illustrator version, platform), source selector with Browse (sets `INSTALLER.sourceFolder` and enables Install), options radio buttons (“Install All Scripts (208 scripts)”, “Install Favorites Only (7 essential scripts)”, “Custom Installation (select categories)”), category checkboxes (`Artboards`, `Colors`, `Documents`, `Effects`, `Export`, `Guides`, `Layers`, `Measurement`, `Paths`, `Preferences`, `Selection`, `Strokes`, `Text`, `Transform`, `Utilities`), `migrateCheck` (default true), `menuCheck` (default true), target path display, hidden progress panel that becomes visible during install, Install/Cancel buttons with event handlers.
- `runInstallation(targetRoot, logCallback)` handles folder creation, optional cleanup of existing `Vexy` directories, branch between All/Favorites/Custom modes, optional settings migration and menu shortcut logging, and writes results via `writeInstallLog(result)`.
- `installAllScripts` iterates category folders (including `Favorites` and `Varia`), mirrors directory structure, copies `.jsx` files, logs per-category counts, and returns total scripts installed.
- `installFavorites` copies all Favorites scripts into `target/Favorites`.
- `installCustom` iterates `INSTALLER.options.installCategories` to copy selected categories.
- `copyFile(source, target)` uses `open('r')`/`read`/`write` to replicate files.
- `migrateAISSettings` copies `.json` files from `~/Documents/Adobe Scripts/` to `~/Documents/Vexy Scripts/`, logging “✓ Migrated X settings files” or “• No AIS settings found (skipped)”.
- `createMenuShortcuts` logs that menu shortcuts need manual configuration.
- `writeInstallLog(result)` writes date, installer version, platform, Illustrator version, scripts installed, success/failed status, and any error message to `~/Documents/Vexy Scripts/Logs/install.log`.
- `showUninstaller()` confirms removal, deletes the Vexy scripts folder, and preserves settings in `~/Documents/Vexy Scripts/`.
- `main()` prompts install vs uninstall with `confirm`, then runs the corresponding flow.

### 3.2 Alternative Installation Methods
- **Download & Run:** Place `Install-Vexy.jsx`, open Illustrator, run via File → Scripts → Other Script.
- **Git Clone:** `git clone https://github.com/vexyart/vexy-illustrator-scripts.git` then run `Install-Vexy.jsx` from Illustrator.
- **Manual Install:** macOS `cp -r src/* "/Applications/Adobe Illustrator 2025/Presets.localized/en_US/Scripts/Vexy/"`; Windows `xcopy src\* "C:\Program Files\Adobe\Adobe Illustrator 2025\Presets\en_US\Scripts\Vexy\" /E /I`.

---

## Phase 4: Modern Code Patterns (ES3 Compliant)

**Priority:** MEDIUM | **Estimate:** 2 weeks | **Status:** Planning

### 4.1 Enhanced Error Handling
- `safeOperation(callback, { scriptName, operation, userMessage })` wraps logic with try/catch, logs via `Vexy.Error.log` and alerts via `Vexy.Error.show`.
- `processItem(item)` checks for null/undefined, missing `typename`, locked or hidden state, and performs safe undo on failure.

### 4.2 Settings Patterns
- `getSettings()` defines defaults `{ mode: 'grid', rows: 5, columns: 5, spacing: 10, unit: 'pt' }`, loads via `Vexy.Prefs.load`, merges missing keys.
- `validateSettings(settings)` enforces numeric `rows`, range 1–100, and `mode` within `['grid', 'linear', 'radial']`, throwing aggregated errors.

### 4.3 Preview Patterns
- `PreviewManager` maintains `active` flag and `undoStack`, with methods `start()`, `update(callback)` (calls `app.undo()` then `app.redraw()`), `commit()`, `cancel()`.
- Dialog usage: preview checkbox toggles `PreviewManager.start()`/`PreviewManager.cancel()`, OK button commits preview or runs `applyOperation(config)`.

### 4.4 Progress Reporting
- `batchProcess(items, operation, progressCallback)` tracks totals, increments `completed`/`failed`, logs failures via `Vexy.Log.error`, and emits `{ current, total, percent, completed, failed }` to update UI (e.g., progress text and `dialog.update()`).

### 4.5 Keyboard Shortcuts
- Attach `dialog.addEventListener('keydown', handler)` to support arrow adjustments via `adjustValue`, Shift ±10, Ctrl+Enter to confirm, Escape to cancel.
- `adjustValue(input, delta)` parses floats and writes updated values as strings.

---

## Phase 5: Adobe Illustrator 2025 Compatibility

**Priority:** HIGH | **Estimate:** 1 week | **Status:** Planning

### 5.1 Version Detection & Features
- `Vexy.Illustrator.version = parseInt(app.version)`.
- Helpers: `isCS4OrHigher()`, `isCS6OrHigher()`, `isCCOrHigher()`, `isCC2019OrHigher()`, `isCC2025OrHigher()`.
- `hasFeature(feature)` mapping: `multipleArtboards` ≥14, `perspectiveGrid` ≥15, `gradientOnStrokes` ≥15, `shapeBuilder` ≥15, `touchWorkspace` ≥17, `cloudDocuments` ≥24, `aiAssistant` ≥28.
- `getVersionName()` maps 14→CS4, 15→CS5, 16→CS6, 17→CC, 18→CC 2014, 19→CC 2015, 20→CC 2015.3, 21→CC 2017, 22→CC 2018, 23→CC 2019, 24→CC 2020, 25→CC 2021, 26→CC 2022, 27→CC 2023, 28→CC 2024, 29→CC 2025.

### 5.2 Compatibility Testing Matrix
| Feature | CS4-CS6 | CC-CC2018 | CC2019+ | CC2025 | Notes |
|---------|---------|-----------|---------|--------|-------|
| Multiple Artboards | ✓ | ✓ | ✓ | ✓ | |
| Gradient on Strokes | CS5+ | ✓ | ✓ | ✓ | |
| Touch Workspace | ✗ | ✓ | ✓ | ✓ | |
| Cloud Documents | ✗ | ✗ | CC2020+ | ✓ | |
| ExtendScript ES3 | ✓ | ✓ | ✓ | ✓ | Universal |

### 5.3 Testing Requirements
- Minimum tested version: CS4 (14); maximum: CC 2025 (29); primary: CC 2025.
- For each script: validate core behaviour on CC 2025, run edge cases on CC 2025, spot-check backward compatibility on CC 2019, confirm forward compatibility paths.

---

## Phase 6: Documentation Updates

**Priority:** MEDIUM | **Estimate:** 1 week | **Status:** Planning

### 6.1 Files to Update
- Refresh README.md (branding + installer), CLAUDE.md (Vexy references), INSTALLATION.md (installer steps), CONTRIBUTING.md (namespace changes), API_REFERENCE.md (new modules).
- Create new guides: VEXY_FRAMEWORK.md, LIBRARY_REFERENCE.md, MIGRATION_GUIDE.md, INSTALLER_GUIDE.md.

### 6.2 JSDoc Generation
- Extract JSDoc from all library files, generate HTML documentation, publish into `docs/`.

---

## Phase 7: Testing & Validation

**Priority:** CRITICAL | **Estimate:** 2 weeks | **Status:** Planning

### 7.1 Library Testing
- Perform manual unit tests, integration checks, performance runs, and ES3 compliance validation for every library module.

### 7.2 Script Testing
- Exercise all seven Favorites scripts plus 2–3 scripts per category, focusing on Vexy namespace usage and CC 2025 behaviour.

### 7.3 Installer Testing
- Scenarios: fresh install (no AIS), upgrade (AIS→Vexy), reinstall (Vexy→Vexy), uninstall, custom install, Favorites-only install.
- Platforms: macOS Sonoma (Intel), macOS Sonoma (Apple Silicon), Windows 10, Windows 11.

---

## Phase 8: Release Preparation

**Priority:** HIGH | **Estimate:** 1 week | **Status:** Planning

### 8.1 Version Tagging
- Update library versions to 2.0.0, script metadata to note Vexy compatibility, installer to 2.0.0, documentation to v2.0.0.

### 8.2 Release Notes
- Produce `RELEASE_NOTES_2.0.md` covering highlights, breaking namespace changes, migration guide, installation instructions, known issues, roadmap.

### 8.3 Distribution
- Publish GitHub release (v2.0.0), provide installer download, update documentation site, and write announcement blog post.

---

## Timeline & Milestones

| Phase | Duration | Start | End | Completion |
|-------|----------|-------|-----|------------|
| Phase 1: Library Expansion | 3-4 weeks | Week 1 | Week 4 | 0% |
| Phase 2: Vexy Branding | 1-2 weeks | Week 5 | Week 6 | 0% |
| Phase 3: Installer | 2 weeks | Week 7 | Week 8 | 0% |
| Phase 4: Modern Patterns | 2 weeks | Week 9 | Week 10 | 0% |
| Phase 5: AI 2025 Compat | 1 week | Week 11 | Week 11 | 0% |
| Phase 6: Documentation | 1 week | Week 12 | Week 12 | 0% |
| Phase 7: Testing | 2 weeks | Week 13 | Week 14 | 0% |
| Phase 8: Release Prep | 1 week | Week 15 | Week 15 | 0% |
| **Total** | **13-15 weeks** | | | **~3.5 months** |

---

## Success Criteria

### Must Have (v2.0.0 Release)
- ✓ All 10 library modules created and tested
- ✓ Complete AIS → Vexy namespace migration (208 scripts)
- ✓ Working installer with GUI
- ✓ ES3 compliance: 100%
- ✓ Adobe Illustrator 2025 tested and compatible
- ✓ Documentation updated (100% coverage)
- ✓ No regressions in existing scripts

### Should Have
- ✓ Settings migration from AIS
- ✓ Enhanced error handling in all scripts
- ✓ Progress reporting in batch scripts
- ✓ Keyboard shortcuts in dialogs
- ✓ Unit tests for libraries
- ✓ Generated API documentation

### Nice to Have
- ◯ Menu shortcuts installer
- ◯ Auto-update mechanism
- ◯ Telemetry (opt-in)
- ◯ Script marketplace integration

---

## Risk Assessment

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Breaking changes in namespace migration | HIGH | MEDIUM | Thorough testing, backward compatibility layer |
| ES3 compliance issues | HIGH | LOW | Automated checks, careful review |
| Installer platform issues | MEDIUM | MEDIUM | Multi-platform testing, fallback to manual |
| Performance regression | MEDIUM | LOW | Benchmarking, optimization |
| Adobe Illustrator API changes | LOW | LOW | Version detection, feature checks |

---

## Dependencies & Blockers

- Phase 2 depends on Phase 1 (libraries first).
- Phase 3 depends on Phase 1 (installer requires library layout).
- Phase 4 can run parallel to Phase 2.
- Phase 5 can run parallel to Phase 4.
- Phase 6 requires completion of Phases 1–5.
- Phase 7 depends on all previous phases.
- Phase 8 depends on Phase 7.
- Potential blockers: Illustrator CC 2025 API changes, OS-specific installer quirks, AIS→Vexy migration complexity.
- External dependencies: none (ExtendScript only).

---

## Post-Release Roadmap (v2.1+)

- **Version 2.1 (Q1 2026):** Menu shortcuts automation, dark-mode UI themes, expanded color utilities (gradients/harmonies), performance tuning.
- **Version 2.2 (Q2 2026):** Auto-update mechanism, script marketplace integration, cloud settings sync, collaboration features.
- **Version 3.0 (Q3 2026):** Finish remaining 218 scripts (100% modernization), advanced AI integration, plugin architecture, web-based configuration.

---

## Appendix A: File Structure (Post-Refactoring)

- `src/.lib/`: vexy.jsx (loader, 50 lines), core.jsx (800), ui.jsx (650), prefs.jsx (250), color.jsx (300), geometry.jsx (350), selection.jsx (280), artboard.jsx (320), path.jsx (400), text.jsx (350), layer.jsx (280), export.jsx (320), file.jsx (250), README.md.
- `src/` categories: Favorites (7 scripts, 100% complete), Artboards (12), Colors (17), Documents (7), Effects (3), Export (2), Guides (14), Layers (8), Measurement (6), Paths (13), Preferences (1), Replace (1), Selection (6), Strokes (1), Text (16), Transform (22), Utilities (62), Varia (13).
- Root scripts: Install-Vexy.jsx (interactive installer), Uninstall-Vexy.jsx (uninstaller).
- `docs/`: API_REFERENCE.md, INSTALLATION.md, VEXY_FRAMEWORK.md, LIBRARY_REFERENCE.md, MIGRATION_GUIDE.md.
- `tests/`: TestVexyLibrary.jsx, SmokeTests.jsx.
- Repo metadata: .github/, .editorconfig, .gitattributes, .gitignore, LICENSE, README.md, CHANGELOG.md, CLAUDE.md, PLAN.md, TODO.md, WORK.md.

---

## Appendix B: Code Statistics (Projected)

- Current (AIS v1.0): library 1,439 lines (2 files), scripts ~66,000 lines (208 scripts), documentation ~20,000 lines, total ~87,500 lines.
- Projected (Vexy v2.0): library ~4,200 lines (13 files, +192%), scripts ~68,000 lines (namespace updates), installer ~800 lines (2 files), documentation ~25,000 lines (+25%), total ~98,000 lines (+12%).
- Library breakdown: core.jsx 800 (-158), ui.jsx 650 (+169), prefs.jsx 250, color.jsx 300, geometry.jsx 350, selection.jsx 280, artboard.jsx 320, path.jsx 400, text.jsx 350, layer.jsx 280, export.jsx 320, file.jsx 250, vexy.jsx 50.

---

## Appendix C: Vexy Brand Guidelines

- **Naming:** Framework = “Vexy Illustrator Scripts” / “Vexy Framework”; namespace = `Vexy`; website = vexy.art; GitHub = vexyart/vexy-illustrator-scripts; settings folder = `~/Documents/Vexy Scripts/`.
- **Visual Identity:** professional colour palette, ASCII dialog logo (see Phase 2.2), clean typography.
- **Voice & Tone:** professional yet approachable, precise, helpful error messages, no marketing fluff.

---

**Document Version:** 2.0.0  
**Last Updated:** 2025-10-27  
**Status:** Draft – Awaiting Review
