# Varia Category

**Purpose:** Miscellaneous scripts and LAScripts framework wrapper stubs for specialized functionality.

**Script Count:** 13 production scripts

**Status:** All scripts are structural placeholders (TODO stubs) awaiting implementation from the legacy LAScripts framework.

## Category Overview

The Varia category contains scripts originally built for the **LAScripts framework** - a different scripting framework from `old2/`. These scripts have been structurally modernized with AIS framework integration, but their core functionality requires re-implementation since they depend on the LAScripts API which is not part of the current AIS library.

**Current State:**
- ✅ Structure modernized (ES3 compliant, AIS framework integrated)
- ⏳ Functionality pending (requires LAScripts API re-implementation)
- 📝 All scripts contain TODO comments with original file references

## Script Categories

### Alignment Scripts (9 scripts)

LAScripts wrappers for object alignment operations:

| Script | Description | Original |
|--------|-------------|----------|
| **AlignCenterLascripts.jsx** | Align selection center horizontally | `old2/Align Center.js` |
| **AlignMiddleLascripts.jsx** | Align selection middle vertically | `old2/Align Middle.js` |
| **AlignTopOutlineLascripts.jsx** | Align to top outline boundary | `old2/Align Top Outline.js` |
| **AlignBottomOutlineLascripts.jsx** | Align to bottom outline boundary | `old2/Align Bottom Outline.js` |
| **AlignLeftOutlineLascripts.jsx** | Align to left outline boundary | `old2/Align Left Outline.js` |
| **AlignRightOutlineLascripts.jsx** | Align to right outline boundary | `old2/Align Right Outline.js` |
| **AlignRightLeftOutlineLascripts.jsx** | Align right-left outline distribution | `old2/Align Right Left Outline.js` |
| **AlignTopBottomOutlineLascripts.jsx** | Align top-bottom outline distribution | `old2/Align Top Bottom Outline.js` |

**Expected Functionality:**
- Align objects to selection bounds
- Outline-based alignment (considering stroke width)
- Distribution across multiple objects

### Framework Scripts (4 scripts)

LAScripts framework utilities:

| Script | Description | Original |
|--------|-------------|----------|
| **ActionLascripts.jsx** | LAScripts action runner (`$.action().run()`) | `old2/Action.js` |
| **CreateSectionLascripts.jsx** | Create framework sections | `old2/Create section.js` |
| **ActivateSectionLascripts.jsx** | Activate framework sections | `old2/Activate section.js` |
| **SetMakerLascripts.jsx** | Set framework markers | `old2/Set Maker.js` |
| **ReloadExtensionLascripts.jsx** | Reload extension for development (`location.reload()`) | `old2/Reload extension.js` |

**Expected Functionality:**
- Run LAScripts actions by name
- Manage framework sections (UI organization)
- Development workflow utilities

## Technical Notes

### LAScripts Framework

The original scripts use the **LAScripts framework** API:
```javascript
// Original LAScripts API examples:
$.action().run('align > center')    // Run named action
location.reload()                    // Reload extension
```

These APIs are **not part of ExtendScript** and were specific to the LAScripts framework environment.

### Re-Implementation Requirements

To complete these scripts, choose one approach:

**Option 1: Native ExtendScript Implementation**
Replace LAScripts API calls with equivalent ExtendScript code:
```javascript
// Instead of: $.action().run('align > center')
// Use native:
var sel = doc.selection;
if (sel.length > 0) {
    var bounds = sel[0].geometricBounds;
    // Implement alignment logic
}
```

**Option 2: Remove Scripts**
If LAScripts-specific functionality (sections, markers) has no ExtendScript equivalent, remove scripts from production.

**Option 3: Defer Implementation**
Keep as structural stubs until LAScripts API re-implementation is prioritized.

## Modernization Status

- ✅ ES3 Compliance: 100% (13/13 scripts)
- ✅ AIS Framework Integration: 100% (13/13 scripts)
- ⏳ Functional Implementation: 0% (0/13 scripts)
- 📊 Code Coverage: 726 lines total

**Quality Rating:** ⚠️ Structural only (no functional implementation)

## Next Steps

1. **Audit Necessity:** Determine which scripts are actually needed
2. **API Mapping:** Map LAScripts API calls to ExtendScript equivalents
3. **Implement Core Logic:** Re-implement functionality without LAScripts dependency
4. **Test Thoroughly:** Manual testing in Illustrator CC 2019+
5. **Document Usage:** Add examples and use cases once functional

## Related Categories

- **Transform/** - Native alignment and distribution scripts (fully functional)
- **Utilities/** - Framework utilities and development tools
- **Selection/** - Object selection and filtering

## See Also

- **AGENTS.md** - Modernization methodology for LAScripts framework scripts
- **TODO.md** - Deferred re-implementation tasks for Varia category
- **lib/core.jsx** - AIS framework API reference
