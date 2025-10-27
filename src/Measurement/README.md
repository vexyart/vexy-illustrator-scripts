# Measurement Category

**Purpose:** Scripts for measuring, dimensioning, and annotating technical drawings and designs in Adobe Illustrator.

---

## Production Scripts

### PhotoDimensionTool.jsx (667 lines)

**Description:** Add dimension annotations to photos and artwork with customizable arrow styles, units, and precision.

**Features:**
- Dimension line creation with automatic measurement
- 4 measurement types:
  - **Horizontal:** Measure width between two points
  - **Vertical:** Measure height between two points
  - **Linear:** Straight-line distance between points
  - **Aligned:** Distance following object alignment
- Arrow head styles (5 options):
  - Standard arrows
  - Architectural arrows
  - Mechanical dimension lines
  - Simple lines (no arrows)
  - Dots/circles
- Unit support:
  - Millimeters (mm)
  - Centimeters (cm)
  - Inches (in)
  - Points (pt)
  - Pixels (px)
- Precision control (0-3 decimal places)
- Text formatting options:
  - Font family and size
  - Text position (above, below, centered)
  - Text offset from dimension line
  - Prefix/suffix support (e.g., "Width: 10mm")
- Visual customization:
  - Line thickness
  - Arrow size
  - Color selection
  - Extension line options
- Layer organization (all dimensions on dedicated layer)
- Snap to objects and guides
- Live update mode
- Settings persistence

**Usage:**
1. Select objects or points to measure
2. Run script
3. Choose measurement type (horizontal, vertical, linear, aligned)
4. Click two points to define dimension
5. Adjust settings in dialog:
   - Arrow style
   - Units and precision
   - Text formatting
   - Visual appearance
6. Click "Create" to add dimension annotation
7. Repeat for additional measurements

**Common Workflows:**
- **Technical drawings:** Linear dimensions → Architectural arrows → mm units → 1 decimal
- **Product photography:** Horizontal/vertical → Simple arrows → cm units → 0 decimals
- **Web design mockups:** Pixels → Clean lines → No decimals → Color-coded by type
- **Print specifications:** All types → Professional arrows → mm/in → 2 decimals
- **Packaging designs:** Aligned dimensions → Extension lines → mm → Assembly instructions

**Measurement Types Explained:**
- **Horizontal:** Always measures X-axis distance (ignores Y)
- **Vertical:** Always measures Y-axis distance (ignores X)
- **Linear:** Direct point-to-point distance (diagonal OK)
- **Aligned:** Follows object edges or alignment guides

**Arrow Styles:**
- **Standard:** Classic arrows (general purpose)
- **Architectural:** Open arrows, 45° angle (building plans)
- **Mechanical:** Filled arrows, perpendicular (engineering)
- **Simple:** Plain lines (minimal, clean look)
- **Dots:** Circular endpoints (modern, simplified)

---

## Related Scripts

**Measurement tools in other categories:**
- None currently in production

**Planned measurement scripts (Phase 4 - Quality 4):**
- Measure Distance (point-to-point quick measurement)
- Show Dimensions (automatic dimension detection)
- Object Area (calculate and display area)
- Path Length (measure path/curve length)

**Workflow Integration:**
1. Create artwork or import photo
2. Use PhotoDimensionTool to add measurements
3. Use BatchRenamer (Favorites) to organize dimension layers
4. Use ExportWithDPI (Export) or ExportAsPDF (Favorites) for output

---

## Requirements

- Adobe Illustrator CS6 or later
- Uses AIS library framework
- Active document required
- Objects or points to measure

## Tips

- **Precision:** Higher decimal places for technical accuracy
- **Readability:** Larger fonts for printed documents, smaller for screen
- **Consistency:** Use same arrow style throughout document
- **Organization:** All dimensions on dedicated layer for easy editing
- **Color coding:** Different colors for different measurement types
- **Extension lines:** Use for offset dimensions (common in CAD)
- **Snap to guides:** Enable for accurate placement
- **Prefix/suffix:** Add "Width:", "Length:", etc. for clarity

## Best Practices

**Technical Drawings:**
- Use architectural or mechanical arrow styles
- 1-2 decimal places precision
- Millimeters or inches (depending on region)
- Consistent line thickness (0.5-1pt)
- Dark gray or black color
- Extension lines for offset dimensions

**Product Photography:**
- Simple or dot arrow styles
- 0-1 decimal places
- Centimeters or inches (customer-friendly)
- Slightly thicker lines (1-2pt)
- High-contrast color
- Clear, readable font (minimum 10pt)

**Web/UI Mockups:**
- Pixels as units
- 0 decimal places
- Simple lines or no arrows
- Thin lines (0.5pt)
- Color-coded by element type
- Small font (8-10pt)

---

## Future Enhancements (Potential)

- Automatic dimension detection from selected objects
- Angular measurements (degrees)
- Area calculations with annotation
- Perimeter measurements
- Dimension chains (multiple connected dimensions)
- Tolerance annotations (+/- values)
- Export dimensions to CSV/Excel
- Dimension styles library (save/load presets)
- Real-time updates when objects move
- Batch dimensioning for multiple objects

---

**License:** Apache 2.0 | See script header for details
