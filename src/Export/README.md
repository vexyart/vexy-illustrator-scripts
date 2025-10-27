# Export Category

**Purpose:** Scripts for exporting Illustrator artwork to various formats with customizable options and batch processing.

---

## Production Scripts

### ExportWithDPI.jsx (504 lines)

**Description:** Batch export artboards to PNG/JPEG with custom DPI settings and color space control.

**Features:**
- Export to PNG, JPEG, or both formats
- Custom DPI selection (72, 150, 300, 600, custom)
- Color space options (RGB, CMYK)
- Anti-aliasing control (None, Art Optimized, Type Optimized)
- Transparency support (PNG)
- JPEG quality slider (0-100)
- Background color for non-transparent exports
- Individual or batch artboard export
- Custom file naming with tokens ({name}, {number}, {dpi})
- Output folder selection
- Progress indicator for batch operations
- Settings persistence

**Usage:**
1. Open document with artboards
2. Run script
3. Choose export settings:
   - Format: PNG, JPEG, or both
   - DPI: 72 (web), 150 (print draft), 300 (print), 600 (high-res)
   - Color space: RGB or CMYK
   - Quality options (JPEG quality, anti-aliasing)
4. Select artboards to export (current, all, or range)
5. Choose output folder
6. Set file naming pattern
7. Click "Export"

**Common Workflows:**
- **Web export:** PNG, 72 DPI, RGB, transparent → Optimized for web
- **Print proofs:** JPEG, 150 DPI, CMYK → Quick client review
- **Print-ready:** PNG, 300 DPI, CMYK → Professional printing
- **High-resolution:** Both formats, 600 DPI → Archive quality
- **Social media:** PNG, 72 DPI, RGB, specific dimensions → Platform optimization

**DPI Guide:**
- **72 DPI:** Web, screen display, email
- **150 DPI:** Draft prints, quick proofs
- **300 DPI:** Standard print quality (most commercial printing)
- **600 DPI:** High-end printing, fine art, large format

**File Naming Tokens:**
- `{name}` - Artboard name
- `{number}` - Artboard number (with zero-padding)
- `{dpi}` - Export DPI value
- `{format}` - File format (PNG/JPEG)
- Example: `{name}_{dpi}dpi` → "Logo_300dpi.png"

---

## Related Scripts

**Export tools in other categories:**
- **Favorites/ExportAsPDF.jsx** - Batch PDF export with presets
- **Measurement/PhotoDimensionTool.jsx** - Add dimension annotations before export

**Workflow Integration:**
1. Use FitArtboardsToArtwork (Favorites) to size artboards
2. Use AddMargins (Artboards) to add safety margins
3. Use ExportWithDPI or ExportAsPDF to export
4. Use BatchRenamer (Favorites) to organize exported files

---

## Requirements

- Adobe Illustrator CS6 or later
- Uses AIS library framework
- Active document with at least one artboard
- Write permissions for output folder

## Tips

- **Transparent backgrounds:** Use PNG with transparency enabled
- **Small file sizes:** Use JPEG with 80-90% quality for balance
- **Color accuracy:** Use CMYK color space for print exports
- **Batch efficiency:** Export all artboards at once, rename later if needed
- **Naming conventions:** Use consistent tokens for organized output
- **DPI vs resolution:** Higher DPI = larger file size and better quality
- **Anti-aliasing:** Art Optimized for graphics, Type Optimized for text-heavy designs

## Performance Notes

- Large artboards at high DPI may take several minutes per export
- Batch exports run faster than individual exports
- PNG with transparency takes longer than JPEG
- Complex artwork (many effects, gradients) increases export time

---

## Future Enhancements (Potential)

- SVG export support
- PDF export integration (or use ExportAsPDF from Favorites)
- Export presets (save/load common settings)
- Color profile embedding
- Metadata options (author, copyright)
- Crop marks and bleed for print exports
- Automatic file compression
- Export queue system

---

**License:** Apache 2.0 | See script header for details
