# Script Modernization Automation Plan

## Strategy: Hybrid Approach

Combine batch automation for simple scripts with manual crafting for high-value complex scripts.

## Phase 1: Build Script Generator (Immediate)

Create a Python script that:
1. Reads `scripts.toml` to get all script metadata
2. Categorizes scripts as "simple" or "complex"
3. Auto-generates modernized versions for simple scripts
4. Outputs list of complex scripts for manual processing

### Simple Script Criteria

A script is "simple" if it:
- Is 1-30 lines long
- Has no UI dialogs
- Performs single, atomic operation
- Uses basic Illustrator API calls
- No complex logic or loops
- From old2/ LAScripts wrappers (most are simple)

### Simple Script Template

```javascript
/**
 * [Script Name]
 * @version 1.0.0
 * @description [Description from TOML]
 * @author Adobe Illustrator Scripts
 * @license MIT
 * @category [Category from TOML]
 */

#include "../lib/core.jsx"

var SCRIPT = {
    name: '[Name]',
    version: '1.0.0',
    description: '[Description]',
    category: '[Category]',
    requiresDocument: [true/false],
    requiresSelection: [true/false]
};

function main() {
    var doc = AIS.Document.getActive();
    if (!doc) return;

    try {
        // [GENERATED CODE BASED ON PATTERN]
    } catch (e) {
        AIS.Error.show('Error in [name]', e);
    }
}

function validateEnvironment() {
    if (SCRIPT.requiresDocument && !AIS.Document.hasDocument()) {
        return { valid: false, message: 'Please open a document first.' };
    }
    if (SCRIPT.requiresSelection && !AIS.Document.hasSelection()) {
        return { valid: false, message: 'Please select at least one object.' };
    }
    return { valid: true };
}

(function() {
    var validation = validateEnvironment();
    if (!validation.valid) {
        alert(SCRIPT.name + '\\n\\n' + validation.message);
        return;
    }
    try {
        main();
    } catch (err) {
        AIS.Error.show('Unexpected error occurred', err);
    }
})();
```

### Generator Implementation

**File:** `generate_scripts.py`

**Features:**
1. Parse scripts.toml
2. Read original script from old_path
3. Analyze complexity
4. For simple scripts:
   - Extract category, name, description
   - Determine target folder and filename
   - Generate PascalCase filename
   - Apply template with substitutions
   - Write to target location
5. For complex scripts:
   - Add to manual queue
6. Track statistics

**Output:**
- Generated scripts in category folders
- `generated_scripts.log` - What was created
- `manual_queue.txt` - Scripts needing manual work
- `generation_stats.json` - Statistics

## Phase 2: Manual High-Value Scripts (Priority Order)

### Tier 1: Favorites (7 scripts) - CRITICAL
Manual processing required, highest quality.

1. **FitArtboardsToArtwork.jsx** - Already modern, minimal changes
2. **BatchRenamer.jsx** - Complex UI, comprehensive features
3. **ExportAsPDF.jsx** - Multiple presets, batch processing
4. **StepAndRepeat.jsx** - Live preview, complex UI
5. **GoToLine.jsx** - Text navigation, list interface
6. **ColorBlindSimulator.jsx** - CVD algorithms, color processing
7. **ContrastChecker.jsx** - WCAG compliance, calculations

### Tier 2: French Quality 4 (15 scripts) - HIGH
Translate and modernize, well-documented.

1. Cotation.jsx → DimensionTool.jsx
2. Nettoyage.jsx → DocumentCleanup.jsx
3. Echelle.jsx → ScaleTool.jsx
4. Hachures.jsx → HatchingPatterns.jsx
5. ExportChoixdpi.jsx → ExportWithDPI.jsx
6. Caracteres_Speciaux.jsx → SpecialCharacters.jsx
7. CodeCharacter.jsx → CharacterCodeTool.jsx
8. supprPetitsObjets.jsx → RemoveSmallObjects.jsx
9. Hauteur_Texte.jsx → TextHeight.jsx
10. Marges.jsx → MarginsTool.jsx
11. ChangerUnites.jsx → ChangeUnits.jsx
12. CotationPhoto.jsx → PhotoDimension.jsx
13. Couleur_Calques.jsx → LayerColors.jsx
14. Renum_Calques_PlansW.jsx → RenumberLayers.jsx
15. Vecteurs_Vers_Texte.jsx → VectorsToText.jsx

### Tier 3: Complex Quality 4 (38 scripts) - HIGH
Complex logic or UI, high value.

**Print Production:**
- Impose Saddle-Stitch
- Impose Section-Sewn
- Add Trim Marks
- Pre-Flight

**Measurement:**
- Measure Distance
- Show Dimensions
- Object Area
- Path Length

**Other Complex Q4:**
- Named Items Finder
- Objects Counter
- Resize to Size
- Select by Swatches
- etc.

## Phase 3: Batch Generation Execution

### Step 1: Identify Simple Scripts

Scan all 426 scripts:
- Read each from old_path
- Count lines
- Check for UI keywords (Window, dialog, show)
- Check for complex patterns (loops, nested functions)
- Categorize as simple/complex

**Estimated breakdown:**
- Simple: ~150 scripts (35%)
- Complex: ~276 scripts (65%)

### Step 2: Generate Simple Scripts

Run generator for simple scripts:
- old2/ LAScripts wrappers (~40-50 simple ones)
- Basic toggles and utilities (~50-60)
- Simple path/color operations (~40-50)

### Step 3: Review Generated Scripts

Manual review of generated batch:
- Spot-check 10-20 random generated scripts
- Verify structure, imports, logic
- Fix any generation bugs
- Refine generator based on issues

## Phase 4: Manual Processing Queue

Process remaining complex scripts by priority:

**Week 1:** Favorites (7) + French Q4 (15) = 22 scripts
**Week 2:** Complex Q4 print/measurement (15-20 scripts)
**Week 3:** Complex Q4 remaining (15-20 scripts)
**Week 4:** Selected Q3 scripts (20-30 scripts)
**Week 5+:** Remaining Q3 as needed

## Implementation Steps (This Session)

### Step 1: Create Script Generator ✓
```python
generate_scripts.py:
- Parse TOML
- Analyze complexity
- Generate simple scripts
- Output manual queue
```

### Step 2: Run Generator on Simple Scripts ✓
- Target: ~150 simple scripts
- Output to category folders
- Log everything

### Step 3: Manual Processing - Tier 1 ✓
- Process all 7 Favorites
- Full testing and refinement

### Step 4: Manual Processing - Tier 2 (if time)
- Start French Q4 scripts
- Translate all strings to English

### Step 5: Review & Cleanup ✓
- Review generated scripts
- Update WORK.md with progress
- Document any issues

## Success Metrics

**By end of session:**
- ✓ Generator script created and tested
- ✓ ~150 simple scripts generated
- ✓ 7 Favorites manually processed
- ✓ 5-10 French Q4 scripts started
- Total: ~165-175 scripts modernized (40% complete)

**Quality checks:**
- All generated scripts use consistent structure
- All include proper error handling
- All have correct imports and metadata
- Manual scripts are fully tested

## Files to Create

1. `generate_scripts.py` - Main generator
2. `script_patterns.json` - Pattern matching rules
3. `generated_scripts.log` - Generation log
4. `manual_queue.txt` - Scripts needing manual work
5. `generation_stats.json` - Statistics

## Risk Mitigation

**Risk:** Generator creates buggy scripts
- **Mitigation:** Conservative simple detection, manual review

**Risk:** Time runs out before Favorites done
- **Mitigation:** Prioritize Favorites first, generator second

**Risk:** Complex pattern matching fails
- **Mitigation:** Flag as manual rather than generate incorrectly

## Decision Points

1. **If generator works well:** Expand simple criteria, generate more
2. **If generator has issues:** Reduce scope, focus on manual
3. **If time limited:** Skip Tier 3, focus on Favorites + generation

## Next Actions

1. Create generate_scripts.py
2. Test on 5-10 sample scripts
3. Refine and run on all simple scripts
4. Process Favorites manually
5. Review and document progress
