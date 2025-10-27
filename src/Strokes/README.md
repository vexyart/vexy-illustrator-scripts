# Strokes Category

**Purpose:** Scripts for stroke manipulation and print production trapping in Adobe Illustrator.

**Script Count:** 1 production script

## Featured Scripts

### MakeTrappingStroke.jsx (413 lines)

**Description:** Creates trapping strokes for print production by setting stroke colors to match fill colors with overprint enabled.

**Features:**
- **Automatic trapping stroke creation** - Matches stroke color to fill color
- **Overprint enabled** - Critical for proper prepress trapping
- **Live preview** - See results before applying with undo/redo
- **Configurable stroke weight** - Units in points (pt) or millimeters (mm)
- **Force add stroke option** - Add strokes to objects without them
- **Gradient support** - Interpolates averaged color from gradient stops
- **Multiple color types** - Supports RGB, CMYK, Grayscale, Spot, and Gradient fills
- **Keyboard shortcuts** - Up/Down arrows (+ Shift for 10x) to adjust weight
- **Round cap and corner** - Automatically applied for smooth trapping

## What is Print Trapping?

**Trapping** is a prepress technique that compensates for misregistration on printing presses:

- **Problem:** Printing plates may not align perfectly (0.1-0.5mm shift)
- **Result:** White gaps appear between adjacent colors
- **Solution:** Slightly overlap adjacent colors (trapping)

**How This Script Helps:**

Traditional trapping requires:
1. Manually add stroke to object
2. Match stroke color to fill
3. Enable overprint on stroke
4. Set appropriate stroke weight

This script **automates all 4 steps** for selected objects.

## Use Cases

### Print Production Trapping
```
1. Select objects requiring trapping (colored fills)
2. Run MakeTrappingStroke.jsx
3. Set weight: 0.2-0.5mm (typical trap width)
4. Enable Preview
5. Click OK
→ Strokes match fills with overprint enabled
```

### Adjacent Color Safety
```
Problem: Blue circle on yellow background
Risk: White gap if plates misalign

Solution:
1. Select blue circle
2. Run script with 0.25mm weight
3. Blue stroke overlaps yellow
4. Overprint prevents knockout
→ No white gaps on press
```

### Gradient Object Trapping
```
Challenge: Gradient fills need solid trapping strokes

Solution:
1. Select gradient-filled object
2. Run script
3. Script interpolates averaged color
4. Stroke uses solid averaged color
→ Smooth trapping even with gradients
```

## Technical Details

### Supported Fill Types

| Fill Type | Behavior | Notes |
|-----------|----------|-------|
| **RGBColor** | Direct copy to stroke | Full support |
| **CMYKColor** | Direct copy to stroke | Full support |
| **GrayColor** | Direct copy to stroke | Full support |
| **SpotColor** | Direct copy to stroke | Full support |
| **GradientColor** | Interpolated average | All stops averaged |
| **PatternColor** | ⚠️ Skipped | Not supported for trapping |
| **NoColor** | ⚠️ Skipped | Empty fills ignored |

### Gradient Interpolation

For gradient fills, the script uses **color channel averaging**:

```
Algorithm (by moody allen):
1. Collect all gradient stops
2. Sum each color channel (R/G/B or C/M/Y/K)
3. Divide by number of stops
4. Result: Averaged solid color

Example:
- Stop 1: RGB(255, 0, 0) - Red
- Stop 2: RGB(0, 0, 255) - Blue
→ Stroke: RGB(127, 0, 127) - Purple
```

This creates a **representative trapping color** for the entire gradient.

### Stroke Properties Applied

**Automatic Settings:**
- **Stroke Color:** Matches fill (or averaged gradient)
- **Stroke Overprint:** Enabled (critical for trapping)
- **Stroke Cap:** Round (smooth edges)
- **Stroke Join:** Round (smooth corners)
- **Stroke Width:** User-defined (pt or mm)

### Force Add Stroke Option

**When to Use:**
- Objects have no existing strokes
- Need to add strokes only for trapping

**How It Works:**
- Sets `item.stroked = true` before applying properties
- Creates new stroke matching fill

**Mac OS Warning:**
- May not work correctly on macOS (Illustrator limitation)
- Manually add strokes if needed: Object → Path → Offset Path (0pt)

## Recommended Trap Widths

Industry standard trap widths:

| Print Type | Trap Width | Units |
|------------|-----------|-------|
| **Commercial Offset** | 0.25-0.3mm | 0.7-0.85pt |
| **Newspaper** | 0.3-0.5mm | 0.85-1.4pt |
| **Large Format** | 0.5-1.0mm | 1.4-2.8pt |
| **Fine Art Prints** | 0.1-0.2mm | 0.3-0.6pt |

**Rule of Thumb:** Consult your print shop for specific requirements.

## Dialog Reference

### Weight Input
- **Range:** 0.001 - 1000 (in selected units)
- **Keyboard:** Up/Down arrows adjust (+Shift for 10x increment)
- **Default:** 1 (in selected units)

### Units Selection
- **pt (Points):** Typography standard (72pt = 1 inch)
- **mm (Millimeters):** Metric standard (default)

### Force Add Stroke
- **Checked:** Add strokes to objects without them
- **Unchecked:** Only modify existing strokes
- **Mac OS:** May not work reliably

### Preview
- **Checked:** Live preview with undo/redo
- **Unchecked:** Apply only on OK

## Workflow Example

### Typical Print Production Workflow

**Step 1: Identify Objects Needing Trapping**
- Adjacent colored objects
- Text on colored backgrounds
- Shapes with thin gaps between them

**Step 2: Select Objects**
- Select all objects requiring trapping
- Can include groups and compound paths

**Step 3: Run Script**
- File → Scripts → Other Script → MakeTrappingStroke.jsx
- Or install in Scripts folder for quick access

**Step 4: Configure Settings**
```
Weight: 0.25 mm
Units: mm
Force add stroke: [unchecked if objects have strokes]
Preview: [checked]
```

**Step 5: Verify**
- Check stroke colors match fills
- Verify overprint is enabled (Window → Attributes → Overprint Stroke)
- Adjust weight if needed using Up/Down arrows

**Step 6: Apply**
- Click OK to finalize
- Script handles undo state automatically

## Overprint Verification

After applying trapping strokes, verify overprint is enabled:

**Method 1: Attributes Panel**
1. Window → Attributes
2. Select object with trapping stroke
3. Check "Overprint Stroke" is enabled

**Method 2: Overprint Preview**
1. View → Overprint Preview (Cmd/Ctrl+Alt+Shift+Y)
2. Strokes should **not** knockout underlying colors
3. Should see color mixing at overlap areas

## Limitations

**Skipped Items:**
- Pattern fills (not supported)
- Empty fills (no color)
- Objects without fills

**Mac OS Issue:**
- "Force add stroke" may fail on macOS
- Workaround: Manually add strokes first (Object → Path → Offset Path at 0pt)

**Gradient Approximation:**
- Gradient fills use averaged color
- May not perfectly represent complex gradients
- Review visually before sending to print

## Modernization Status

- ✅ ES3 Compliance: 100%
- ✅ AIS Framework Integration: Yes (error handling, units, system detection)
- ✅ Original Functionality: 100% preserved
- ✅ Code Quality: Clean, well-documented (413 lines)

**Original Author:** Sergey Osokin (hi@sergosokin.ru)
**GitHub:** https://github.com/creold/
**Modernized:** 2025 for AIS framework

## Related Categories

- **Colors/** - Color manipulation and management
- **Paths/** - Path operations and clipping
- **Export/** - Export for print production

## Requirements

- **Illustrator Version:** CC 2019-2025
- **Platform:** macOS and Windows
- **Document:** Required with selection
- **Selection:** At least one path with a fill

## See Also

- **AGENTS.md** - Modernization methodology
- **lib/core.jsx** - AIS library utilities (Units, System, Error)
- **CONTRIBUTING.md** - ES3 compliance rules

## Further Reading

**Print Production Resources:**
- Adobe: "Trapping" in Illustrator Help
- Print Industry Standards: ISO 12647 (Process control)
- Color Management: ICC profiles for CMYK output

**Trapping Techniques:**
- Choke vs. Spread trapping
- Rich black trapping
- Spot color trapping considerations
