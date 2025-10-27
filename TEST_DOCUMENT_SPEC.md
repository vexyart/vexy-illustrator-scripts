# Test Document Specification

**File:** `test-document.ai`
**Purpose:** Standard test environment for manual validation of all scripts
**Created:** 2025-10-27
**Version:** 1.0.0

---

## Overview

This document specifies the exact contents and structure of the test-document.ai file used for manual script testing. This standardized environment ensures consistent, repeatable testing across all 426 scripts.

---

## Document Setup

### Document Properties
- **Color Mode:** RGB
- **Ruler Units:** Millimeters (mm)
- **Artboard Count:** 3
- **Layer Count:** 5 (+ 1 hidden layer)
- **Total Objects:** 25+

### Artboards Configuration

#### Artboard 1: "A4 Portrait"
- **Dimensions:** 210mm × 297mm (A4)
- **Position:** X: 0, Y: 0
- **Name:** "A4 Portrait"
- **Purpose:** Standard document size testing

#### Artboard 2: "Letter Landscape"
- **Dimensions:** 279.4mm × 215.9mm (Letter, rotated)
- **Position:** X: 250mm, Y: 0
- **Name:** "Letter Landscape"
- **Purpose:** US paper size, landscape orientation

#### Artboard 3: "Square Canvas"
- **Dimensions:** 500px × 500px (keep in pixels)
- **Position:** X: 600mm, Y: 0
- **Name:** "Square Canvas"
- **Purpose:** Square format, pixel-based testing

---

## Layer Structure

### Layer 1: "Shapes" (Visible, Unlocked)
**Contents:** Basic geometric shapes
- Rectangle (100×50mm, red fill, no stroke)
- Circle (diameter 60mm, blue fill, 2pt black stroke)
- Triangle (equilateral, 70mm sides, yellow fill, 3pt red stroke)
- Star (5-pointed, 80mm outer radius, green fill, no stroke)

**Position:** All objects on Artboard 1 (A4 Portrait)
**Arrangement:** Evenly spaced horizontally

### Layer 2: "Text" (Visible, Unlocked)
**Contents:** Various text types
1. **Point Text:** "The quick brown fox jumps over the lazy dog"
   - Font: Arial, 18pt, black
   - Position: Top center of Artboard 1
2. **Area Text:** Lorem ipsum paragraph (5 lines)
   - Font: Helvetica, 12pt, black
   - Text box: 150×80mm
   - Position: Center of Artboard 1
3. **Vertical Text:** "Vertical"
   - Font: Arial, 24pt, red
   - Position: Left side of Artboard 1
4. **Outlined Text:** "OUTLINED" (converted to outlines/paths)
   - Original font: Arial Bold, 36pt
   - Position: Bottom of Artboard 1

**Total text objects:** 4

### Layer 3: "Groups & Symbols" (Visible, Unlocked)
**Contents:** Grouped objects and symbols
1. **Simple Group:** 3 circles grouped together
   - Sizes: 20mm, 30mm, 40mm diameter
   - Colors: RGB red, green, blue
   - Position: Top-left of Artboard 2
2. **Nested Group:** Group containing 2 sub-groups
   - Sub-group 1: 2 rectangles
   - Sub-group 2: 2 ellipses
   - Position: Center of Artboard 2
3. **Symbol Instance:** Custom symbol (star shape)
   - Symbol name: "TestStar"
   - Instances: 3 copies with different sizes
   - Position: Artboard 2, spaced evenly

**Total group objects:** 3

### Layer 4: "Complex Paths" (Visible, Unlocked)
**Contents:** Advanced path types
1. **Compound Path:** Donut shape (outer circle - inner circle)
   - Outer: 80mm diameter
   - Inner: 50mm diameter
   - Fill: Gradient (linear, black to white)
   - Position: Top of Artboard 3
2. **Open Path:** Bezier curve with multiple anchor points
   - Points: 6 anchors with mixed smooth/corner points
   - Stroke: 5pt, dashed line (10pt dash, 5pt gap)
   - Position: Center of Artboard 3
3. **Clipping Mask:** Image placeholder with circular mask
   - Rectangle with diagonal gradient (masked)
   - Circular clipping path (60mm diameter)
   - Position: Bottom-left of Artboard 3

**Total path objects:** 3

### Layer 5: "Locked Elements" (Visible, LOCKED)
**Contents:** Objects for testing lock/unlock functionality
- Rectangle: 100×100mm, gray fill
- Text frame: "This layer is locked"
- Circle: 50mm diameter, no fill, 2pt stroke

**Position:** Bottom-right of Artboard 3
**Purpose:** Test scripts that need to unlock layers

### Layer 6: "Hidden Layer" (HIDDEN, Unlocked)
**Contents:** Objects for testing visibility toggle
- Small square: 30×30mm, orange fill
- Text: "Hidden object"

**Position:** Off-artboard (X: -100mm, Y: -100mm)
**Purpose:** Test scripts that need to show hidden layers

---

## Color Swatches

### Document Swatches (RGB)
Add the following to Swatches panel:
1. **Primary Red:** R:255, G:0, B:0
2. **Primary Green:** R:0, G:255, B:0
3. **Primary Blue:** R:0, G:0, B:255
4. **Custom Orange:** R:255, G:128, B:0
5. **Custom Purple:** R:128, G:0, B:255

### CMYK Swatches
Add for CMYK testing:
1. **CMYK Red:** C:0, M:100, Y:100, K:0
2. **CMYK Blue:** C:100, M:100, Y:0, K:0
3. **CMYK Green:** C:100, M:0, Y:100, K:0

### Gradient Swatches
1. **Linear Gradient:** Black to White (0° angle)
2. **Radial Gradient:** Red (center) to Blue (edge)

---

## Stroke Styles

### Stroke Width Variations
Objects should use these stroke widths:
- 0.5pt (hairline)
- 1pt (thin)
- 2pt (normal)
- 5pt (thick)
- 10pt (very thick)

### Stroke Styles
- Solid
- Dashed (10pt dash, 5pt gap)
- Dotted (1pt dash, 3pt gap)

---

## Edge Cases & Special Objects

### Objects Outside Artboards
- 1 rectangle positioned completely outside all artboards
  - Position: X: 1000mm, Y: 1000mm (far right)
  - Size: 50×50mm, magenta fill
  - Purpose: Test artboard boundary detection

### Very Small Objects
- 3 tiny circles: 1mm, 2mm, 3mm diameter
  - Position: Artboard 1, bottom-right corner
  - Purpose: Test "remove small objects" scripts

### Very Large Objects
- 1 rectangle spanning multiple artboards
  - Size: 800mm × 400mm
  - Position: X: -100mm, Y: -50mm (overlaps all 3 artboards)
  - Fill: Semi-transparent gray (50% opacity)
  - Purpose: Test multi-artboard operations

### Rotated Objects
- Square rotated 45° (diamond orientation)
  - Size: 60×60mm, yellow fill
  - Position: Artboard 2, center
  - Purpose: Test rotation/transform scripts

### Objects with Effects
- Circle with Drop Shadow effect
  - Diameter: 70mm, light blue fill
  - Effect: Drop Shadow (5mm offset, 3mm blur)
  - Position: Artboard 3, center-right
  - Purpose: Test effect handling

---

## Testing Checklist

When using test-document.ai, verify:

### Document State
- [ ] Document has 3 artboards (A4, Letter, Square)
- [ ] Document has 6 layers (5 visible, 1 hidden)
- [ ] Total objects: 25+ items
- [ ] Color mode: RGB
- [ ] Ruler units: Millimeters

### Selection Tests
- [ ] Can select individual objects
- [ ] Can select grouped objects
- [ ] Can select text frames
- [ ] Can select all objects on layer
- [ ] Can select objects across layers

### Layer Tests
- [ ] Can lock/unlock layers
- [ ] Can show/hide layers
- [ ] Can rename layers
- [ ] Can reorder layers
- [ ] Can delete empty layers

### Artboard Tests
- [ ] Can resize artboards
- [ ] Can rename artboards
- [ ] Can fit artboards to artwork
- [ ] Can navigate between artboards
- [ ] Can export individual artboards

### Object Tests
- [ ] Can apply fills and strokes
- [ ] Can transform (scale, rotate, move)
- [ ] Can group/ungroup
- [ ] Can create outlines from text
- [ ] Can apply effects

### Edge Case Tests
- [ ] Scripts handle locked layers gracefully
- [ ] Scripts handle hidden objects gracefully
- [ ] Scripts handle objects outside artboards
- [ ] Scripts handle very small objects
- [ ] Scripts handle very large objects
- [ ] Scripts handle empty selections
- [ ] Scripts handle no document open

---

## Usage Instructions

### Creating test-document.ai

1. **In Adobe Illustrator:**
   - File → New
   - Create artboards as specified above
   - Create layers in exact order
   - Add all objects per layer specifications
   - Add color swatches
   - Save as `test-document.ai` in project root

2. **Verification:**
   - Check layer count: Should be 6
   - Check artboard count: Should be 3
   - Check object count: Should be 25+
   - Verify one locked layer exists
   - Verify one hidden layer exists

3. **Backup:**
   - Save a copy as `test-document-backup.ai`
   - Keep original untouched for reference
   - Use working copy for actual testing

### Using for Script Testing

1. **Before testing any script:**
   - Open `test-document.ai`
   - Verify document is in expected state
   - Save a copy if script will modify document

2. **During testing:**
   - Follow script-specific test scenarios
   - Check console for errors (Window → Info)
   - Verify undo works (Cmd+Z / Ctrl+Z)
   - Check artboard panel, layers panel

3. **After testing:**
   - Close without saving (revert to clean state)
   - Document any issues found
   - Update test results in WORK.md

4. **Common test scenarios:**
   - **No selection:** Run script with nothing selected
   - **Single object:** Select one shape
   - **Multiple objects:** Select 2-5 objects
   - **Locked objects:** Try to modify locked layer
   - **Hidden objects:** Test visibility handling
   - **All artboards:** Test artboard range "*"
   - **Custom range:** Test "1,3" or "1-2" ranges
   - **Invalid input:** Test with empty/null values
   - **Boundary values:** Test min/max values
   - **Cancel action:** Click Cancel in dialog

---

## Maintenance

### When to Update

Update test-document.ai when:
- New edge case discovered during testing
- New object type needed (e.g., raster images, brushes)
- New script category requires specific test objects
- Bugs found that could have been caught with better test coverage

### Version History

**v1.0.0 (2025-10-27):**
- Initial specification
- 3 artboards, 6 layers, 25+ objects
- RGB color mode, mm units
- Comprehensive edge case coverage

---

## Notes

- This is a **specification document**, not the actual .ai file
- The actual test-document.ai must be created manually in Adobe Illustrator
- Keep test-document.ai in project root (`.gitignore` it - binary files)
- This spec can be version-controlled for consistency
- Update this spec when test document requirements change

---

**Created by:** Vexy Illustrator Scripts project
**Last Updated:** 2025-10-27
**Status:** Ready for implementation
