# French Q4 Scripts - Completion Plan

**Goal:** Modernize remaining 10/15 French Quality 4 scripts
**Timeline:** 4 weeks (35-45 hours estimated)
**Strategy:** Small → Medium → Large → Very Large (build momentum)

---

## Completed (5/15) ✅

1. **AddMargins.jsx** (Marges.jsx) - 600 lines ✅
2. **ChangeUnits.jsx** (ChangerUnites.jsx) - 200 lines ✅
3. **ChangeLayerColors.jsx** (Couleur_Calques.jsx) - 100 lines ✅
4. **RenumberLayersAndArtboards.jsx** (Renum_Calques_PlansW.jsx) - 250 lines ✅
5. **VectorsToText.jsx** (Vecteurs_Vers_Texte.jsx) - 140 lines ✅

**Total completed:** 1,290 lines

---

## Week 1: Small Scripts (3 scripts, ~6 hours)

### 1. Remove Small Objects
- **Original:** `old/supprPetitsObjets.jsx`
- **New:** `Utilities/RemoveSmallObjects.jsx`
- **Size:** ~100-150 lines
- **Time:** 1-2 hours
- **Complexity:** Low

**Features:**
- Remove objects smaller than threshold
- Size options: width, height, or area
- Unit support (mm, px, in)
- Preview before deletion
- Undo support

**Translation notes:**
- "Supprimer petits objets" → "Remove Small Objects"
- "Seuil" → "Threshold"
- "Largeur/Hauteur" → "Width/Height"

**Implementation plan:**
1. Read original (15 min)
2. Create structure (15 min)
3. Build UI dialog (20 min)
4. Implement core logic (30 min)
5. Add validation & error handling (15 min)
6. Test (15 min)
7. Document (10 min)

---

### 2. Text Height Tool
- **Original:** `old/Hauteur_Texte.jsx`
- **New:** `Text/TextHeightTool.jsx`
- **Size:** ~150-200 lines
- **Time:** 1-2 hours
- **Complexity:** Low-Medium

**Features:**
- Adjust text frame height to content
- Options: exact fit, add padding, proportional
- Batch process multiple text frames
- Preserve text properties

**Translation notes:**
- "Hauteur du texte" → "Text Height"
- "Ajuster" → "Adjust"
- "Marge" → "Padding"

**Implementation plan:**
1. Read original (15 min)
2. Create structure (15 min)
3. Build UI dialog (25 min)
4. Implement text measurement (30 min)
5. Implement height adjustment (20 min)
6. Add validation & error handling (15 min)
7. Test (15 min)
8. Document (10 min)

---

### 3. Character Code Tool
- **Original:** `old/CodeCharacter.jsx`
- **New:** `Text/CharacterCodeTool.jsx`
- **Size:** ~150-200 lines
- **Time:** 1-2 hours
- **Complexity:** Low-Medium

**Features:**
- Show Unicode code point for selected character
- Convert code point to character
- Display character info (name, category)
- Insert character by code

**Translation notes:**
- "Code caractère" → "Character Code"
- "Point de code" → "Code Point"
- "Insérer" → "Insert"

**Implementation plan:**
1. Read original (15 min)
2. Create structure (15 min)
3. Build UI dialog (25 min)
4. Implement code point display (20 min)
5. Implement code point insertion (20 min)
6. Add character database lookup (30 min)
7. Add validation & error handling (15 min)
8. Test (15 min)
9. Document (10 min)

---

## Week 2: Medium Scripts (3 scripts, ~9 hours)

### 4. Special Characters
- **Original:** `old/Caracteres_Speciaux.jsx`
- **New:** `Text/SpecialCharacters.jsx`
- **Size:** ~250-350 lines
- **Time:** 2-3 hours
- **Complexity:** Medium

**Features:**
- Insert special characters from categories
- Categories: math, currency, arrows, symbols
- Search by name or code
- Recent/favorites list
- Preview glyphs

**Translation notes:**
- "Caractères spéciaux" → "Special Characters"
- "Symboles" → "Symbols"
- "Rechercher" → "Search"

**Implementation plan:**
1. Read original (20 min)
2. Create structure (20 min)
3. Build character database (40 min)
4. Build UI with categories (45 min)
5. Implement search (30 min)
6. Implement insertion (20 min)
7. Add favorites system (25 min)
8. Add validation & error handling (15 min)
9. Test (20 min)
10. Document (15 min)

---

### 5. Export with DPI
- **Original:** `old/ExportChoixdpi.jsx`
- **New:** `Export/ExportWithDPI.jsx`
- **Size:** ~300-400 lines
- **Time:** 2-4 hours
- **Complexity:** Medium

**Features:**
- Export artboards at custom DPI
- Format options: PNG, JPG, TIFF
- DPI presets: 72, 150, 300, 600
- Custom DPI input
- Batch export all artboards
- Filename templates

**Translation notes:**
- "Exporter avec DPI" → "Export with DPI"
- "Résolution" → "Resolution"
- "Format" → "Format"

**Implementation plan:**
1. Read original (25 min)
2. Create structure (20 min)
3. Build UI with format/DPI options (40 min)
4. Implement export logic (60 min)
5. Add filename template system (30 min)
6. Add batch processing (25 min)
7. Add validation & error handling (20 min)
8. Test (30 min)
9. Document (15 min)

---

### 6. Photo Dimension Tool
- **Original:** `old/CotationPhoto.jsx`
- **New:** `Measurement/PhotoDimensionTool.jsx`
- **Size:** ~300-500 lines
- **Time:** 2-4 hours
- **Complexity:** Medium-High

**Features:**
- Add dimension annotations to photos/images
- Arrow styles: single, double, extension lines
- Measurement modes: width, height, both
- Custom text formatting
- Scale factor support
- Unit conversion

**Translation notes:**
- "Cotation photo" → "Photo Dimension"
- "Flèches" → "Arrows"
- "Échelle" → "Scale"

**Implementation plan:**
1. Read original (30 min)
2. Create structure (25 min)
3. Build UI with dimension options (45 min)
4. Implement measurement logic (60 min)
5. Implement arrow drawing (40 min)
6. Add text annotation (30 min)
7. Add scale factor conversion (20 min)
8. Add validation & error handling (20 min)
9. Test (30 min)
10. Document (15 min)

---

## Week 3: Large Scripts (3 scripts, ~15 hours)

### 7. Scale Tool
- **Original:** `old/Echelle.jsx` (folder)
- **New:** `Transform/ScaleTool.jsx`
- **Size:** ~500-700 lines
- **Time:** 4-6 hours
- **Complexity:** High

**Features:**
- Scale objects with precise measurements
- Scale modes: uniform, non-uniform
- Reference point selection
- Scale by percentage or absolute size
- Preview before applying
- Batch scale multiple objects

**Translation notes:**
- "Échelle" → "Scale"
- "Proportionnel" → "Proportional"
- "Point de référence" → "Reference Point"

**Implementation plan:**
1. Read original (45 min)
2. Analyze folder structure (30 min)
3. Create unified structure (30 min)
4. Build UI with scale modes (60 min)
5. Implement uniform scaling (45 min)
6. Implement non-uniform scaling (45 min)
7. Add reference point selection (40 min)
8. Add preview functionality (45 min)
9. Add validation & error handling (30 min)
10. Test (45 min)
11. Document (20 min)

---

### 8. Hatching Patterns
- **Original:** `old/Hachures.jsx` (folder)
- **New:** `Effects/HatchingPatterns.jsx`
- **Size:** ~600-800 lines
- **Time:** 4-6 hours
- **Complexity:** High

**Features:**
- Apply hatching patterns to objects
- Pattern types: parallel, cross, diagonal
- Spacing and angle controls
- Line weight options
- Clipping to object bounds
- Pattern library

**Translation notes:**
- "Hachures" → "Hatching"
- "Espacement" → "Spacing"
- "Angle" → "Angle"

**Implementation plan:**
1. Read original (60 min)
2. Analyze folder structure (30 min)
3. Create unified structure (30 min)
4. Build UI with pattern options (60 min)
5. Implement parallel hatching (60 min)
6. Implement cross hatching (45 min)
7. Add angle/spacing controls (40 min)
8. Add clipping logic (45 min)
9. Add pattern presets (30 min)
10. Add validation & error handling (30 min)
11. Test (60 min)
12. Document (25 min)

---

### 9. Document Cleanup
- **Original:** `old/Nettoyage.jsx` (folder)
- **New:** `Utilities/DocumentCleanup.jsx`
- **Size:** ~700-900 lines
- **Time:** 4-6 hours
- **Complexity:** High

**Features:**
- Remove empty text frames
- Delete unused swatches
- Clean up unused layers
- Remove stray points
- Merge duplicate colors
- Report before/after statistics

**Translation notes:**
- "Nettoyage" → "Cleanup"
- "Objets vides" → "Empty Objects"
- "Couleurs inutilisées" → "Unused Colors"

**Implementation plan:**
1. Read original (60 min)
2. Analyze folder structure (30 min)
3. Create unified structure (30 min)
4. Build UI with cleanup options (60 min)
5. Implement empty text removal (30 min)
6. Implement swatch cleanup (45 min)
7. Implement layer cleanup (40 min)
8. Implement stray point removal (35 min)
9. Add statistics reporting (40 min)
10. Add preview/dry-run mode (45 min)
11. Add validation & error handling (30 min)
12. Test (60 min)
13. Document (25 min)

---

## Week 4: Very Large Script (1 script, ~10 hours)

### 10. Dimension Tool ⚠️ MOST COMPLEX
- **Original:** `old/Cotation.jsx`
- **New:** `Measurement/DimensionTool.jsx`
- **Size:** 1,227 lines → ~1,400-1,600 lines
- **Time:** 8-12 hours
- **Complexity:** Very High

**Features:**
- Linear dimensioning
- Aligned dimensioning
- Diameter/radius dimensioning
- Angular dimensioning
- Custom arrowhead styles
- Text positioning options
- Scale factor support
- Live preview
- Symbol library
- Decimal precision control
- Unit conversion

**Translation notes:**
- "Cotation" → "Dimension"
- "Linéaire/Alignée" → "Linear/Aligned"
- "Diamètre/Rayon" → "Diameter/Radius"
- "Flèche" → "Arrow"
- "Symbole" → "Symbol"

**Implementation plan:**
This is a 2-3 day dedicated effort:

**Day 1: Analysis & Structure (3-4 hours)**
1. Read entire original (90 min)
2. Map all features (60 min)
3. Create comprehensive structure (60 min)
4. Document complex algorithms (30 min)

**Day 2: UI & Core Logic (4-5 hours)**
5. Build main dialog (90 min)
6. Implement dimension modes selection (45 min)
7. Implement linear dimensioning (90 min)
8. Implement aligned dimensioning (60 min)

**Day 3: Advanced Features (3-4 hours)**
9. Implement diameter/radius dimensioning (60 min)
10. Implement angular dimensioning (60 min)
11. Add arrowhead system (45 min)
12. Add text positioning (45 min)

**Day 4: Preview & Polish (2-3 hours)**
13. Implement live preview (90 min)
14. Add scale factor conversion (30 min)
15. Add validation & error handling (45 min)

**Day 5: Testing & Documentation (1-2 hours)**
16. Comprehensive testing (60 min)
17. Edge case testing (30 min)
18. Documentation (30 min)

---

## General Modernization Checklist

For each script, ensure:

### Code Quality
- [ ] All French → English (UI, variables, comments)
- [ ] Uses `#include "../lib/core.jsx"`
- [ ] Follows ScriptTemplate.jsx structure
- [ ] Section separators (80-char `=` lines)
- [ ] JSDoc comments for all functions
- [ ] Consistent naming (camelCase vars, UPPER_CASE constants)
- [ ] No hardcoded paths (use `Folder.myDocuments`)
- [ ] ES3-compatible (no const, let, arrow functions)

### Functionality
- [ ] Settings persistence via JSON
- [ ] Uses `AIS.Units` for conversions
- [ ] Uses `AIS.JSON` for serialization
- [ ] Error handling with `AIS.Error.show()`
- [ ] Input validation
- [ ] Undo/redo support
- [ ] Preview functionality (if applicable)
- [ ] Progress indicators for long operations

### Testing
- [ ] Loads without syntax errors
- [ ] UI displays correctly
- [ ] All features work as expected
- [ ] Edge cases handled gracefully
- [ ] Settings save/load correctly
- [ ] Preview updates in real-time (if applicable)
- [ ] Cancel restores state
- [ ] No console errors

### Documentation
- [ ] File header complete with JSDoc
- [ ] Version number
- [ ] Description accurate
- [ ] Features listed
- [ ] Category specified
- [ ] Requirements noted
- [ ] Original author credited
- [ ] No TODO/FIXME markers

---

## Progress Tracking

After each script completion:

1. **Update WORK.md:**
   ```markdown
   ### Script X Complete (YYYY-MM-DD)
   - **Original:** old/OriginalName.jsx
   - **New:** Category/NewName.jsx
   - **Lines:** XXX → YYY
   - **Time spent:** X hours
   - **Issues encountered:** [notes]
   - **Testing notes:** [results]
   ```

2. **Update TODO.md:**
   - Check off completed script
   - Update progress percentage

3. **Update CHANGELOG.md (weekly):**
   - Add completed scripts to v0.3.0 section
   - Update statistics

4. **Git commit:**
   ```bash
   git add Category/NewName.jsx
   git commit -m "Add modernized NewName script"
   ```

---

## Estimated Timeline

**Week 1 (Hours 1-6):**
- Mon-Tue: Remove Small Objects
- Wed-Thu: Text Height Tool
- Fri: Character Code Tool

**Week 2 (Hours 7-16):**
- Mon-Tue: Special Characters
- Wed-Thu: Export with DPI
- Fri-Sat: Photo Dimension Tool

**Week 3 (Hours 17-31):**
- Mon-Wed: Scale Tool
- Thu-Fri: Hatching Patterns
- Sat-Sun: Document Cleanup

**Week 4 (Hours 32-45):**
- Mon-Wed: Dimension Tool (dedicated sprint)
- Thu: Final testing & documentation
- Fri: CHANGELOG update, release v0.3.0

---

## Success Criteria

French Q4 phase is complete when:
- [ ] All 15 scripts modernized (10 remaining)
- [ ] All scripts tested in Illustrator
- [ ] No French text in UI or code
- [ ] All use AIS library
- [ ] Settings persist correctly
- [ ] Documentation complete
- [ ] CHANGELOG.md updated
- [ ] Ready for Quality 4 English scripts

**Target completion:** 4 weeks from start date
**Expected result:** v0.3.0 release with 23 fully modernized scripts

---

**Last Updated:** 2025-10-27
