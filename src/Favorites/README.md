# Favorites Category

**Purpose:** The highest-quality, most frequently used scripts in the collection. These 7 Quality-5 scripts provide exceptional value and are recommended for all Illustrator users.

---

## Scripts

### FitArtboardsToArtwork.jsx (883 lines)

**Description:** Automatically resize artboards to fit artwork with customizable margins and options.

**Features:**
- Resize individual or all artboards to fit artwork bounds
- Customizable margins (top, bottom, left, right) with per-artboard or global settings
- Multiple sizing modes: tight fit, percentage margin, fixed padding
- Live preview with undo support
- Batch processing for multiple artboards
- Settings persistence (saves user preferences)
- Safe bounds calculation that respects document limits

**Usage:**
1. Open document with artboards and artwork
2. Run script via File → Scripts → FitArtboardsToArtwork
3. Choose artboard selection mode (current, all, or custom)
4. Set margin preferences (uniform or individual)
5. Preview changes before applying
6. Click "Apply" to resize artboards

**Common Workflows:**
- **Quick fit:** Current artboard → uniform 10mm margin → Apply
- **Batch processing:** All artboards → individual margins → Preview → Apply
- **Tight fit:** Select objects → 0mm margin → individual artboard mode

---

### BatchRenamer.jsx (1,727 lines)

**Description:** Advanced batch renaming tool with regex support, find/replace, numbering, and comprehensive preview.

**Features:**
- Rename layers, artboards, or selected objects
- Find and replace with case sensitivity options
- Regular expression support for advanced patterns
- Sequential numbering with custom start, increment, padding
- Prefix/suffix additions
- Case transformation (upper, lower, title, sentence)
- Remove characters (leading/trailing spaces, numbers, special chars)
- Live preview showing before/after names
- Undo support for safe experimentation
- Settings persistence across sessions

**Usage:**
1. Select objects, layers, or artboards to rename
2. Run script
3. Choose rename operations from dialog:
   - Find/Replace tab: Text substitution
   - Numbering tab: Add sequential numbers
   - Transform tab: Change case, remove characters
   - Advanced tab: Regex patterns
4. Preview changes in scrolling list
5. Apply when satisfied

**Common Workflows:**
- **Sequential numbering:** Objects → Numbering tab → Start: 1, Increment: 1, Padding: 3 → "Object_001", "Object_002"...
- **Find/Replace:** Layers → "old_name" → "new_name" → Apply
- **Case conversion:** Artboards → Transform tab → Title Case → Apply
- **Regex cleanup:** Objects → Advanced → Pattern: `\s+` → Replace: `_` (spaces to underscores)

---

### ExportAsPDF.jsx (908 lines)

**Description:** Batch export artboards to PDF with customizable presets, crop marks, and file naming options.

**Features:**
- Export individual or all artboards as separate PDFs
- PDF preset management (save/load custom settings)
- Crop marks and bleed settings
- Compression options (ZIP, JPEG quality)
- Font embedding controls
- Custom file naming with tokens ({name}, {number}, {date})
- Batch processing with progress indicator
- Export summaryreport
- Settings persistence

**Usage:**
1. Open document with artboards
2. Run script
3. Choose export settings:
   - Artboard selection (current, all, range)
   - PDF preset (print, web, custom)
   - File naming pattern
   - Output folder
4. Click "Export" to process
5. Review summary report

**Common Workflows:**
- **Print-ready PDFs:** All artboards → Print preset → Crop marks + bleed → Export
- **Web PDFs:** Current artboard → Web preset → No crop marks → Optimized file size
- **Custom naming:** Range (1-10) → Pattern: "{name}_v{number}" → Export

---

### StepAndRepeat.jsx (578 lines)

**Description:** Duplicate and arrange objects in grid patterns with customizable spacing, offset, and transformation options.

**Features:**
- Grid duplication (rows × columns)
- Linear duplication (horizontal or vertical)
- Circular/radial duplication around a center point
- Customizable spacing (horizontal, vertical, or angular)
- Offset options (staggered rows, alternating columns)
- Transformation per duplicate (scale, rotate, opacity fade)
- Live preview with undo
- Copy or instance mode
- Stroke scaling option
- Settings persistence

**Usage:**
1. Select object(s) to duplicate
2. Run script
3. Choose duplication mode:
   - **Grid:** Rows + Columns + Spacing
   - **Linear:** Count + Direction + Spacing
   - **Radial:** Count + Angle + Radius
4. Adjust transformation options
5. Preview live changes
6. Click "Apply"

**Common Workflows:**
- **Grid layout:** Object → 5 rows × 3 columns → 10mm horizontal, 15mm vertical spacing
- **Linear sequence:** Object → 10 copies → horizontal → 20mm spacing → scale 95% per copy
- **Circular pattern:** Object → 12 copies → radial → 360° → rotate to follow circle

---

### GoToLine.jsx (246 lines)

**Description:** Navigate to specific line numbers in text frames, with search, bookmark, and column navigation features.

**Features:**
- Jump to specific line number in text frames
- Find text and navigate to its line
- Bookmark frequently accessed lines
- Column-aware navigation (area text only)
- Line range selection (select lines 10-20)
- Show current line position
- Navigate forward/backward by lines
- Search results highlighting
- Settings persistence (bookmarks saved)

**Usage:**
1. Select text frame
2. Run script
3. Enter line number or search text
4. Script highlights and scrolls to target line
5. Use bookmarks for quick navigation

**Common Workflows:**
- **Quick navigation:** Select text → Enter line number (e.g., 150) → Jump
- **Search and find:** Select text → Enter search term → Navigate through results
- **Line selection:** Select text → Line range 10-20 → Select text for editing
- **Bookmarks:** Add bookmark at line 50 → Name "Important section" → Quick jump later

---

### ColorBlindSimulator.jsx (458 lines)

**Description:** Simulate color vision deficiencies (CVD) to ensure designs are accessible to colorblind users.

**Features:**
- 8 CVD simulation types:
  - Protanopia (red-blind)
  - Protanomaly (red-weak)
  - Deuteranopia (green-blind)
  - Deuteranomaly (green-weak)
  - Tritanopia (blue-blind)
  - Tritanomaly (blue-weak)
  - Achromatopsia (total colorblindness)
  - Achromatomaly (blue cone monochromacy)
- Apply to selection or entire document
- Preview mode (non-destructive, creates copy)
- Direct mode (modifies original colors)
- Undo support for easy comparison
- Export simulation results for review
- Settings persistence

**Usage:**
1. Select objects or choose document scope
2. Run script
3. Choose CVD type from dropdown
4. Select preview or direct mode
5. Click "Apply" to see simulation
6. Compare with original (use undo)
7. Adjust design colors if needed

**Common Workflows:**
- **Accessibility check:** Select design → Protanopia → Preview mode → Compare → Adjust colors
- **Multiple CVD tests:** Deuteranopia → Tritanopia → Achromatopsia (test all)
- **Client presentation:** Create simulation copies → Export as separate files → Show accessibility

---

### ContrastChecker.jsx (728 lines)

**Description:** Check WCAG 2.2 color contrast ratios to ensure text legibility and accessibility compliance.

**Features:**
- WCAG 2.2 compliance checking (AA and AAA levels)
- Contrast ratio calculation (1:1 to 21:1)
- Text size consideration (normal vs large text)
- Foreground/background color comparison
- Batch checking for multiple color pairs
- Fix suggestions for failing contrasts
- Integration with ColorBlindSimulator
- Report generation (HTML output)
- Color picker for testing custom colors
- Settings persistence

**Usage:**
1. Select text or objects to check contrast
2. Run script
3. View contrast ratios and WCAG compliance
4. See which combinations pass/fail
5. Get fix suggestions (lighten/darken)
6. Apply suggested fixes or adjust manually
7. Export report for documentation

**Common Workflows:**
- **Quick check:** Select text → View contrast ratio → Pass/Fail indicator
- **Batch testing:** Select multiple text frames → Check all → View report
- **Fix failing contrast:** Text on background → Ratio 3.2:1 (FAIL) → Suggested fix: darken text 15% → Apply
- **Documentation:** Run full check → Export HTML report → Attach to project deliverables

---

## Requirements

- Adobe Illustrator CS6 or later (tested through CC 2025)
- All scripts use the AIS library framework (`lib/core.jsx`)
- Some scripts require active document or selection

## Installation

1. Copy all `.jsx` files to your Illustrator Scripts folder:
   - **Mac:** `/Applications/Adobe Illustrator [version]/Presets/en_US/Scripts/`
   - **Windows:** `C:\Program Files\Adobe\Adobe Illustrator [version]\Presets\en_US\Scripts\`

2. Restart Illustrator or use File → Scripts → Other Script

3. Scripts appear in File → Scripts menu

## Tips

- **Undo support:** All Favorites scripts support Illustrator's undo (Cmd/Ctrl+Z)
- **Settings persistence:** Preferences are saved between sessions in `~/Documents/Adobe Scripts/`
- **Live preview:** Scripts with preview mode use non-destructive undo-based previews
- **Keyboard shortcuts:** Assign shortcuts via Edit → Keyboard Shortcuts → Menu Commands → File → Scripts

## Support

For issues, feature requests, or contributions, see the main project README.

**License:** Apache 2.0 (see individual script headers for details)
