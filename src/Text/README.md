# Text Category

**Purpose:** Scripts for text manipulation, character analysis, text conversion, and typography tools in Adobe Illustrator.

---

## Production Scripts

### CharacterCodeTool.jsx (370 lines)

**Description:** Display Unicode character codes, HTML entities, and character information for selected text.

**Features:**
- Show Unicode code points (U+0000 format)
- Display HTML entities (&#00; and &name;)
- Character name lookup (Unicode character database)
- Decimal and hexadecimal values
- Copy codes to clipboard
- Batch analysis for multiple characters
- Special character detection (combining marks, control chars)
- Export character information table
- Settings persistence

**Usage:**
1. Select text frame or specific characters
2. Run script
3. View character codes and information
4. Copy codes for HTML/CSS/code use
5. Export report if needed

**Common Workflows:**
- **Web development:** Select text → Get HTML entities → Copy to code
- **Unicode lookup:** Special character → View code point → Reference documentation
- **Typography analysis:** Text with diacritics → View combining marks → Understand composition
- **Font debugging:** Missing glyph? → Check Unicode value → Verify font support

---

### SpecialCharacters.jsx (311 lines)

**Description:** Insert special characters, symbols, and Unicode characters not available on keyboard.

**Features:**
- 200+ common special characters organized by category:
  - Typography (em dash, en dash, ellipsis, quotes)
  - Currency (€, £, ¥, ₹, ₽, ₿)
  - Math (×, ÷, ±, ≈, ≤, ≥, ∞)
  - Symbols (©, ®, ™, §, ¶, †, ‡)
  - Arrows (→, ←, ↑, ↓, ⇒, ⇐)
  - Diacritics (á, é, í, ó, ú, à, è, ñ)
  - Greek letters (α, β, γ, δ, π, Σ)
- Search by name or category
- Recent characters history
- Favorites system
- Insert at cursor or replace selection
- Unicode hex input for any character
- Preview with current font
- Keyboard shortcuts for frequent characters

**Usage:**
1. Place text cursor or select text to replace
2. Run script
3. Browse categories or search for character
4. Click character to insert
5. Mark favorites for quick access

**Common Workflows:**
- **Typography:** Insert em dash (—) between clauses
- **Copyright:** Insert © symbol → "Copyright © 2025"
- **Math:** Insert × for multiplication → "3 × 4 = 12"
- **Foreign languages:** Insert accented characters → "café", "naïve"
- **Custom Unicode:** Enter hex code → U+2665 → ♥ inserted

---

### TextHeightTool.jsx (364 lines)

**Description:** Analyze and adjust text frame heights, measure line heights, and ensure consistent text sizing.

**Features:**
- Measure actual text frame height vs. content height
- Calculate line height (leading) statistics
- Detect overflow text (text not fitting in frame)
- Adjust frame to fit content exactly
- Standardize line heights across multiple frames
- Show cap height, x-height, baseline measurements
- Grid-based height adjustment
- Batch processing for multiple text frames
- Export measurement report
- Settings persistence

**Usage:**
1. Select text frame(s)
2. Run script
3. View height measurements
4. Choose operation:
   - Fit frame to content
   - Standardize line heights
   - Adjust to grid
   - Export measurements
5. Apply changes

**Common Workflows:**
- **Layout consistency:** Select all body text → Standardize line height to 14pt
- **Overflow detection:** Text frame → Check if content overflows → Resize or edit
- **Grid alignment:** Text frames → Adjust heights to 8pt baseline grid
- **Typography analysis:** Measure cap height, x-height → Compare fonts → Choose best

---

### VectorsToText.jsx (140 lines)

**Description:** Convert outlined text (vector paths) back to editable text frames.

**Features:**
- Recognize common fonts from outlined text
- Reconstruct text content from path shapes
- Maintain font size, tracking, leading approximations
- Handle single or multiple outlined text objects
- Character recognition with machine learning patterns
- Fallback to manual text input if recognition fails
- Preserve positioning and alignment
- Batch processing
- Undo support

**Usage:**
1. Select outlined text paths (created with Type → Create Outlines)
2. Run script
3. Script analyzes path shapes
4. Reconstructs text frame with best-match font
5. Manual adjustment if recognition incomplete

**Common Workflows:**
- **File recovery:** Received outlined text → Convert back → Edit text
- **Template modification:** Logo with outlined text → Convert → Change wording
- **Font matching:** Outlined text → Script suggests font → Install font → Perfect match

**Limitations:**
- Recognition accuracy depends on font complexity
- Works best with simple, unmodified outlined text
- Complex distortions may require manual reconstruction
- Custom/decorative fonts may not be recognized

---

## LAScripts Framework Scripts (Phase 5 - Requires Reimplementation)

The following scripts are placeholders requiring full reimplementation:

- `DivideTextLascripts.jsx` - Split text frames into multiple frames
- `JoinTextLascripts.jsx` - Merge multiple text frames into one
- `TextAllConvertToOutlineLascripts.jsx` - Batch outline all text
- `TextConvertAreaToPointLascripts.jsx` - Convert area text to point text
- `TextConvertPointToAreaLascripts.jsx` - Convert point text to area text
- `TextToTextLascripts.jsx` - Advanced text-to-text conversion

**Status:** Scheduled for Phase 5 (LAScripts framework replacement needed)

---

## Requirements

- Adobe Illustrator CS6 or later
- All production scripts use AIS library framework
- Active document with text frames required

## Common Workflows

**Typography Project Setup:**
1. SpecialCharacters → Insert special characters in text
2. TextHeightTool → Standardize line heights
3. CharacterCodeTool → Verify Unicode for web export

**Text Editing Workflow:**
1. VectorsToText → Convert outlined text back
2. Edit text content
3. SpecialCharacters → Add special symbols
4. TextHeightTool → Ensure consistent sizing

**Web Export Preparation:**
1. CharacterCodeTool → Get HTML entities for special characters
2. Export character codes
3. Use in HTML/CSS code

**Font Management:**
1. VectorsToText → Identify fonts from outlined text
2. CharacterCodeTool → Verify character coverage
3. SpecialCharacters → Test character availability in font

---

## Tips

- **SpecialCharacters:** Pin frequently-used characters to favorites
- **CharacterCodeTool:** Use for troubleshooting missing glyphs
- **TextHeightTool:** Essential for maintaining baseline grids
- **VectorsToText:** Works best on unmodified outlined text
- Combine with GoToLine.jsx (Favorites) for text navigation
- Use with BatchRenamer (Favorites) to rename text frame layer names

## Upcoming Features (Phase 5)

When LAScripts reimplementation completes:
- Advanced text splitting and merging
- Batch text type conversion (point/area/path)
- Text frame threading tools
- Advanced text manipulation utilities

---

**License:** Apache 2.0 | See individual script headers
