# Artboards Category

**Purpose:** Scripts for creating, resizing, organizing, and managing artboards in Adobe Illustrator.

---

## Production Scripts

### AddArtboardRects.jsx

**Description:** Create rectangle shapes matching artboard bounds for design reference or export masks.

**Features:**
- Generate rectangles for current or all artboards
- Optional stroke/fill customization
- Place on dedicated layer for organization
- Useful for print templates and export masks

**Usage:** Select artboard → Run script → Rectangles created matching artboard bounds

---

### AddMargins.jsx (600 lines)

**Description:** Add customizable margins to artboards with visual guides and measurement display.

**Features:**
- Individual or uniform margin settings (top, bottom, left, right)
- Visual margin guides (removable)
- Multiple units supported (mm, pt, px, in)
- Live preview with undo
- Batch processing for multiple artboards
- Settings persistence

**Usage:**
1. Select artboard(s)
2. Run script
3. Set margin values
4. Preview changes
5. Apply to resize artboards inward with margins

**Common Workflows:**
- **Print margins:** All artboards → 5mm uniform margin → Apply
- **Custom margins:** Individual artboard → Top: 10mm, Bottom: 15mm, Sides: 5mm
- **Safe zones:** Create margin guides for layout constraints

---

## LAScripts Framework Scripts (Phase 5 - Requires Reimplementation)

The following scripts are placeholders from the LAScripts framework migration and require full reimplementation in Phase 5:

- `ArtboardSetWidthAndHeightLascripts.jsx` - Set artboard dimensions programmatically
- `ArtboardSizeToSelectionLascripts.jsx` - Resize artboard to fit selected objects
- `CreateArtboardsFromSelectionLascripts.jsx` - Generate artboards for each selected object
- `CropArtboardLascripts.jsx` - Crop artboard to specific bounds

**Status:** Scheduled for Phase 5 modernization (requires LAScripts framework replacement)

---

## Requirements

- Adobe Illustrator CS6 or later
- All production scripts use AIS library framework
- Active document required

## Common Workflows

**Print Template Setup:**
1. Create artboards for print sizes
2. Run AddMargins.jsx to add 5mm safety margins
3. Use AddArtboardRects.jsx to create trim marks

**Export Preparation:**
1. Resize artboards with AddMargins.jsx
2. Create export masks with AddArtboardRects.jsx
3. Place artwork within margin guides

**Batch Organization:**
1. Select multiple artboards
2. Apply uniform margins
3. Generate reference rectangles
4. Lock margin guide layer

---

## Tips

- Use AddMargins.jsx with FitArtboardsToArtwork.jsx (Favorites) for intelligent resizing
- Margin guides can be moved to dedicated layer and locked
- AddArtboardRects useful for PDF export masks
- Combine with BatchRenamer.jsx to organize artboard names

## Upcoming Scripts (Phase 5)

When LAScripts framework is reimplemented, additional artboard tools will include:
- Programmatic artboard sizing
- Smart artboard creation from selection
- Advanced cropping and alignment tools
- Artboard distribution and spacing utilities

---

**License:** Apache 2.0 | See individual script headers
