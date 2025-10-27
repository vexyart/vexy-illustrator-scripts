# Transform Category

**Purpose:** Scripts for transforming, scaling, and repositioning objects in Adobe Illustrator.

**Script Count:** 22 production scripts

## Featured Scripts

### BigBang.jsx (377 lines) 🆕

**Description:** Scatter objects away from a center point with adjustable offset and force parameters.

**Features:**
- Offset slider control (-300 to +300)
- Delta force parameter for variation
- Key object mode (scatter from specific object)
- Distance-based force calculation
- Live preview with undo support
- Settings persistence

**Usage:** Select 2+ objects, adjust offset/delta sliders, enable preview to see results.

---

### RoundCoordinates.jsx (295 lines) 🆕

**Description:** Round object coordinates to grid subdivisions or custom step based on 9 reference points.

**Features:**
- 9 reference points (Transform panel alignment)
- Grid subdivision or custom step rounding
- Global or artboard ruler coordinate systems
- Respects "Include Stroke in Bounds" preference
- Large canvas mode compensation
- XMP metadata parsing for special units (ft, yd, m)

**Usage:** Select objects, confirm ruler mode (global/artboard), script rounds coordinates automatically.

---

### ScaleTool.jsx (542 lines)

**Description:** Compare 2 objects to calculate width/height scale ratios, then apply to other selected objects.

**Features:**
- Dimension comparison between 2 reference objects
- 4 ratio options: width 1→2, width 2→1, height 1→2, height 2→1
- Live preview with undo-based system
- Individual vs group transformation modes
- Optional stroke/effect scaling
- Settings persistence

**Usage:**
1. Select exactly 2 objects to compare dimensions
2. Run the script
3. View calculated dimensions (mm) and ratios (%)
4. Choose ratio option via radio buttons with preview
5. Select additional objects to scale
6. Click "Apply" to scale selected objects by chosen ratio

**Common Workflows:**
- **Scale to match width:** Select reference objects → choose w1→2 or w2→1 → select target objects → apply
- **Scale to match height:** Select reference objects → choose h1→2 or h2→1 → select target objects → apply
- **Proportional scaling:** Choose group mode to scale all objects as a unit

**Requirements:**
- Active document
- Minimum 2 objects to compare
- Works with paths, text, groups, symbols

**Installation:**
Copy to Illustrator Scripts folder. See [main README](../README.md) for installation instructions.

**Version:** 1.0.0
**Category:** Transform
**Author:** Original by unknown, modernized for Vexy framework
