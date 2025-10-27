# Paths Category

**Purpose:** Scripts for working with paths, strokes, and vector operations in Adobe Illustrator.

**Script Count:** 13 production scripts

## Featured Scripts

### DrawCircumscribedCircle.jsx (259 lines) 🆕

**Description:** Draw a circumscribed circle through 2 or 3 anchor points using precise geometric calculations.

**Features:**
- True circumcircle for 3 points using Heron's formula
- Diameter mode for 2 points
- Supports paths, compound paths, and text paths
- Collinearity detection for invalid geometry

**Usage:** Select 2-3 anchor points with Direct Selection Tool and run.

---

### JoinOverlap.jsx (376 lines) 🆕

**Description:** Join open paths with overlapping anchor points within a user-defined tolerance.

**Features:**
- User-specified tolerance for overlap detection
- Isolated single-point path deletion
- Duplicate point merging on same path
- Clustering algorithm for multi-path joining
- Detailed operation report dialog

**Usage:** Select paths to join, specify tolerance (0 = exact match).

---

### HatchingPatterns.jsx (595 lines)

**Description:** Apply vector hatching patterns to selected paths with 10 different curve types and full customization.

**Features:**
- 10 hatching pattern types (A-J): straight lines to complex curves
- Adjustable spacing (mm): control line density
- Adjustable angle (degrees): rotate pattern orientation
- Adjustable thickness (mm): control line weight
- Live preview with undo-based updates
- Pathfinder clipping for clean results
- Optional color preservation from original object
- Settings persistence via JSON

**Hatching Patterns:**
- **A:** Straight lines (classic hatching)
- **B:** Curve right (gentle arc)
- **C:** Curve up (vertical arc)
- **D:** S-curve (wave pattern)
- **E:** Reverse S-curve (opposite wave)
- **F:** Double curve (symmetrical)
- **G:** Wave right (horizontal wave)
- **H:** Wave left (reverse horizontal)
- **I:** Diagonal wave (angled wave)
- **J:** Reverse diagonal (opposite diagonal)

**Usage:**
1. Select one or more closed paths
2. Run the script
3. Choose pattern type (A-J buttons)
4. Adjust spacing, angle, and thickness
5. Enable preview to see live results
6. Click OK to apply permanently

**Common Workflows:**
- **Technical drawings:** Pattern A (straight) with tight spacing (0.5-1mm)
- **Artistic shading:** Patterns D-F (curves) with variable spacing
- **Cross-hatching:** Run twice with different angles (0°, 90°)
- **Wood grain effect:** Pattern G/H with 2-3mm spacing

**Requirements:**
- Active document
- At least one selected closed path
- Works best with simple shapes (circles, rectangles, polygons)

**Installation:**
Copy to Illustrator Scripts folder. See [main README](../README.md) for installation instructions.

**Version:** 1.0.0
**Category:** Paths
**Author:** Original by Christian Condamine (Hachures.jsx), modernized for Vexy framework

---

## Complete Script List

### Anchor Point Manipulation

- **IncreaseAnchorPointsCCW.jsx** - Expand anchor point selection counterclockwise
- **ShiftSelectedAnchorPointsCCW.jsx** 🆕 - Shift selection counterclockwise along path
- **ShiftSelectedAnchorPointsCW.jsx** 🆕 - Shift selection clockwise along path

### Path Operations

- **ClippingMaskToArtboardLascripts.jsx** - Convert clipping masks to artboard bounds
- **CropByFrontSelectionLascripts.jsx** - Crop paths using frontmost object
- **DivideBottomPath.jsx** - Divide bottom path by overlapping shapes
- **JoinToAreaLascripts.jsx** - Join paths to create closed areas
- **SubtractTopPath.jsx** - Subtract top path from underlying paths
- **TrimMasks.jsx** - Remove excess artwork outside mask bounds

### Geometric Operations

- **DrawCircumscribedCircle.jsx** 🆕 - Create circumscribed circles (2-3 points)
- **JoinOverlap.jsx** 🆕 - Join paths with overlapping points (tolerance-based)

### Effects & Styling

- **HatchingPatterns.jsx** - Apply vector hatching (10 pattern types)
- **OpacityMaskClip.jsx** - Enable Clip checkbox for opacity masks

**Legend:** 🆕 = Added in Rounds 41-42 (2025-10-27)

---

**Total:** 13 path manipulation scripts covering anchor points, boolean operations, geometric construction, and visual effects.
