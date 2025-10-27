# Adobe Illustrator Scripts Reorganization & Modernization Plan

## Project Overview

**Scope:** Complete reorganization and modernization of 351 Adobe Illustrator scripts
**Duration:** Phased approach, prioritizing high-value scripts
**Goal:** Create a unified, modern, English-language script system with consistent structure

## Phase 1: Foundation & Infrastructure (Priority: CRITICAL)

### 1.1 Shared Library System
Create a centralized library system that all scripts will use.

**Files to create:**
- `lib/core.jsx` - Core utilities (logging, error handling, versioning)
- `lib/ui.jsx` - Common UI components and dialogs
- `lib/validation.jsx` - Input validation and sanitization
- `lib/geometry.jsx` - Geometric calculations and conversions
- `lib/color.jsx` - Color manipulation utilities
- `lib/selection.jsx` - Selection management utilities
- `lib/artboard.jsx` - Artboard operations
- `lib/text.jsx` - Text manipulation utilities
- `lib/path.jsx` - Path operations
- `lib/file.jsx` - File I/O operations
- `lib/prefs.jsx` - Preferences management

**Technical decisions:**
- Use ES3-compatible JavaScript (Illustrator ExtendScript limitation)
- Implement namespace pattern to avoid global pollution
- Create consistent error handling and logging
- Version all library components
- Include inline JSDoc documentation

### 1.2 Script Template
Create standardized script template with:
- Consistent header structure
- Metadata (name, version, description, author, license)
- Library imports
- Main function pattern
- Error handling wrapper
- User preference saving/loading
- Localization structure (English-only initially)
- Undo support
- Version checking

### 1.3 Folder Structure
```
Scripts/
├── lib/                    # Shared libraries
│   ├── core.jsx
│   ├── ui.jsx
│   └── ...
├── Favorites/              # Quality 5 (7 scripts)
├── Artboards/              # 23 scripts
├── Text/                   # 41 scripts
├── Colors/                 # 42 scripts
├── Paths/                  # 45 scripts
├── Transform/              # 33 scripts
├── Selection/              # 19 scripts
├── Measurement/            # 10 scripts
├── Export/                 # 12 scripts
├── Print/                  # 9 scripts
├── Layers/                 # 15 scripts
├── Effects/                # 8 scripts
├── Guides/                 # 5 scripts
├── Layout/                 # 6 scripts
├── Strokes/                # 9 scripts
├── Utilities/              # 18 scripts
├── Preferences/            # 10 scripts
├── Varia/                  # Quality 2 (114 scripts)
├── old/                    # Original scripts (archive)
├── scripts.toml            # Catalogue
└── README.md               # User documentation
```

## Phase 2: Favorites (Priority: HIGH)

Process the 7 Quality 5 scripts first - these provide the most value.

### 2.1 Fit Artboards to Artwork
- Already modern, minimal changes needed
- Extract reusable functions to lib/artboard.jsx
- Ensure English-only strings
- Add comprehensive error handling
- Update to use shared UI library

### 2.2 Batch Renamer
- Already comprehensive and modern
- Extract renaming logic to lib/core.jsx for reuse
- Ensure all UI strings are in English
- Integrate with shared preferences system
- Add batch operation progress indicator

### 2.3 Export as PDF
- Modernize file selection dialogs
- Extract export logic to lib/file.jsx
- Add validation for export settings
- Improve error messages
- Add export templates/presets

### 2.4 Step and Repeat
- Already well-implemented
- Extract duplication logic to lib/core.jsx
- Ensure localization uses only English
- Add more grid patterns
- Integrate undo support

### 2.5 Go to Line in Text
- Modern implementation
- Extract text navigation to lib/text.jsx
- Add bookmark functionality
- Add column navigation
- Improve search performance

### 2.6 Color Blind Simulator
- Update to latest color vision deficiency research
- Add more CVD types
- Extract color algorithms to lib/color.jsx
- Add export simulation results
- Add WCAG integration

### 2.7 Contrast Checker
- Update to WCAG 2.2 standards
- Extract contrast checking to lib/color.jsx
- Add batch checking for multiple color pairs
- Add fix suggestions
- Integrate with Color Blind Simulator

## Phase 3: Quality 4 Scripts (Priority: HIGH)

52 very useful scripts to modernize.

### 3.1 French Scripts Translation (Priority: IMMEDIATE)
15 French scripts with Quality 4 need English translation:

**Critical French Scripts:**
- Cotation.jsx → DimensionTool.jsx
- Nettoyage.jsx → DocumentCleanup.jsx
- Echelle.jsx → ScaleTool.jsx
- Hachures.jsx → HatchingPatterns.jsx
- ExportChoixdpi.jsx → ExportWithDPI.jsx
- Caracteres_Speciaux.jsx → SpecialCharacters.jsx
- CodeCharacter.jsx → CharacterCodeTool.jsx
- supprPetitsObjets.jsx → RemoveSmallObjects.jsx

**Translation approach:**
- Extract all French strings to English
- Preserve functionality exactly
- Maintain PDF documentation references
- Add English tooltips and help text
- Keep original comments for reference

### 3.2 Print Production Suite
9 high-quality print scripts:
- Saddle-stitch booklets
- Section-sewn binding
- Imposition layouts (1-up through 8-up)
- Trim marks
- Update to modern print standards
- Create unified imposition system

### 3.3 Measurement & Technical Drawing
10 professional tools:
- Consolidate measurement functions
- Create unified dimensioning system
- Add unit conversion helpers
- Standardize output formatting

## Phase 4: Quality 3 Scripts (Priority: MEDIUM)

162 useful scripts organized by category.

### Strategy:
- Process by category (Artboards, Text, Colors, etc.)
- Look for consolidation opportunities
- Modernize in batches of 10-15
- Extract common patterns to libraries
- Standardize UI across similar tools

### Categories to process:
1. Artboards (23 scripts)
2. Text (41 scripts)
3. Colors (42 scripts)
4. Paths (45 scripts)
5. Transform (33 scripts)
6. Selection (19 scripts)
7. Others (layers, effects, guides, layout, strokes)

## Phase 5: Quality 2 (Varia) Scripts (Priority: LOW)

114 miscellaneous scripts:
- Evaluate each for consolidation
- Many can be merged into multi-function tools
- Some may be obsolete
- Move to Varia/ folder as-is with minimal modernization
- Document which ones are candidates for removal

## Phase 6: Quality 1 Removal (Priority: IMMEDIATE)

16 scripts marked for removal:
- Verify each is truly redundant
- Document why each is being removed
- Create migration guide if needed
- Archive rather than delete

## Technical Standards

### Code Structure
Every script must follow this structure:

```javascript
/**
 * Script Name
 * @version 1.0.0
 * @description Brief description
 * @author Author name
 * @license MIT
 */

// ============================================================================
// IMPORTS
// ============================================================================

#include "lib/core.jsx"
#include "lib/ui.jsx"
// ... other includes

// ============================================================================
// CONSTANTS
// ============================================================================

var SCRIPT_NAME = 'ScriptName';
var SCRIPT_VERSION = '1.0.0';

// ============================================================================
// CONFIGURATION
// ============================================================================

var CONFIG = {
    // Configuration options
};

// ============================================================================
// MAIN FUNCTION
// ============================================================================

function main() {
    // Main logic
}

// ============================================================================
// UI FUNCTIONS
// ============================================================================

function showDialog() {
    // UI code
}

// ============================================================================
// BUSINESS LOGIC
// ============================================================================

function processItems() {
    // Core functionality
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function helperFunction() {
    // Helper code
}

// ============================================================================
// ENTRY POINT
// ============================================================================

(function() {
    if (!app.documents.length) {
        alert('No documents open');
        return;
    }

    try {
        main();
    } catch (err) {
        alert('Error: ' + err.message + '\nLine: ' + err.line);
    }
})();
```

### Naming Conventions
- **Files:** PascalCase.jsx (e.g., FitArtboardsToArtwork.jsx)
- **Functions:** camelCase (e.g., getSelectedItems)
- **Constants:** UPPER_SNAKE_CASE (e.g., SCRIPT_VERSION)
- **Variables:** camelCase (e.g., currentDocument)
- **Private functions:** _camelCase with underscore prefix

### UI Standards
- Consistent dialog sizing
- Standard button placement (OK/Cancel)
- Keyboard shortcuts (Enter = OK, Esc = Cancel)
- Preview functionality where applicable
- Help buttons linking to documentation
- Progress bars for long operations
- Consistent error messages

### Error Handling
- Try-catch around all main functions
- User-friendly error messages
- Error logging to file for debugging
- Graceful degradation
- Undo support where possible

### Documentation
- JSDoc comments for all functions
- Inline comments for complex logic
- README.md for each major category
- User guide for Favorites
- Migration guide from old scripts

## Testing Strategy

### Manual Testing
- Test each modernized script in Illustrator
- Verify functionality matches original
- Test edge cases (no selection, locked objects, etc.)
- Test with different document states
- Test undo functionality

### Test Checklist (per script)
- [ ] Loads without errors
- [ ] UI displays correctly
- [ ] Functionality works as expected
- [ ] Handles edge cases gracefully
- [ ] Error messages are clear
- [ ] Undo works properly
- [ ] Performance is acceptable
- [ ] Help/documentation accessible

## Success Criteria

1. **Completeness:** All Quality 3+ scripts modernized and reorganized
2. **Consistency:** All scripts follow template structure
3. **English-only:** No French or other language strings remain
4. **Library system:** Shared code extracted and reusable
5. **Documentation:** README for each category
6. **Testing:** All Favorites and Quality 4 scripts tested
7. **Performance:** No regressions in script performance
8. **User experience:** Improved UI consistency

## Risk Assessment

### High Risk
- Breaking existing workflows users depend on
- Data loss from buggy modernization
- Performance regressions

**Mitigation:**
- Keep old/ folder intact
- Extensive testing before release
- Gradual rollout starting with Favorites

### Medium Risk
- Translation errors in French scripts
- Missing edge cases in modernization
- Library dependencies causing issues

**Mitigation:**
- Test French scripts with native speakers
- Comprehensive edge case testing
- Careful library versioning

### Low Risk
- User resistance to new organization
- Documentation gaps
- Minor UI inconsistencies

**Mitigation:**
- Migration guide
- Comprehensive documentation
- UI review process

## Timeline Estimate

### Phase 1: Foundation (Week 1)
- Library system: 2-3 days
- Script template: 1 day
- Folder structure: 1 day
- Documentation: 1 day

### Phase 2: Favorites (Week 2)
- 7 scripts @ 1 day each
- Testing: 1 day

### Phase 3: Quality 4 (Weeks 3-4)
- French scripts: 1 week
- Print production: 2-3 days
- Other Quality 4: 4-5 days

### Phase 4: Quality 3 (Weeks 5-8)
- Process in batches
- ~40 scripts per week
- 162 scripts total

### Phase 5-6: Cleanup (Week 9)
- Varia organization
- Removal documentation
- Final testing

**Total estimated time:** 9-10 weeks for complete modernization

## Immediate Next Steps

1. Create lib/ folder and core.jsx
2. Create script template
3. Start with one Favorites script as proof-of-concept
4. Test library import system
5. Refine approach based on learnings
6. Scale to remaining scripts

## Notes

- Prioritize quality over speed
- Test thoroughly at each phase
- Keep old scripts for reference
- Document all major changes
- Seek user feedback after Favorites complete
