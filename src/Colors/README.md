# Colors Category

**Purpose:** Scripts for color manipulation, fill/stroke operations, swatch management, and gradient control in Adobe Illustrator.

**Script Count:** 18 production scripts

## Featured Scripts

### MatchGradientStops.jsx (215 lines) 🆕

**Description:** Match gradient stop locations and midpoints across multiple gradient swatches.

**Features:**
- Copy rampPoint positions between gradients
- Copy midPoint positions for smooth transitions
- Works with swatches panel selections
- Preserves colors while matching positions
- Bilingual UI (English/Japanese)

**Usage:** Select 2+ gradient swatches, run script to match stop positions from first to others.

---

## Gradient Operations

### Stop Management
- **MatchGradientStops.jsx** 🆕 (215 lines) - Match stop locations across gradients
- **DistributeGradientStops.jsx** - Evenly space gradient stops
- **ReverseGradientColor.jsx** - Reverse gradient color order

### Swatch Management

- **ImportCSVtoSwatch.jsx** - Import colors from CSV file to swatches
- **ExportColorValuesToCSV.jsx** - Export swatch colors to CSV
- **SyncGlobalColorsNames.jsx** - Sync global color names

### Color Conversion

- **ConvertToGlobalColor.jsx** - Convert colors to global swatches
- **ConvertToSpotColor.jsx** - Convert colors to spot colors
- **GrayscaleToOpacity.jsx** - Convert grayscale values to opacity

### Color Replacement

- **ColorGroupReplacer.jsx** - Replace entire color groups
- **ReplaceColorLascripts.jsx** - Replace colors (LAScripts framework)
- **ReplaceColorFastLascripts.jsx** - Fast color replacement

### Fill & Stroke Operations

- **FillLascripts.jsx** - Batch fill operations
- **FillColorRandomLascripts.jsx** - Random fill colors
- **StrokeLascripts.jsx** - Batch stroke operations
- **StrokeColorRandomLascripts.jsx** - Random stroke colors

### Color Utilities

- **GetColorLascripts.jsx** - Extract/sample colors from objects
- **SetColorLascripts.jsx** - Set specific colors to objects

---

**Total:** 18 color scripts covering gradients, swatches, conversion, and replacement.

**Legend:** 🆕 = Added in Round 39 (2025-10-27)

**Common Workflows:**
- **Gradient matching:** Select gradient swatches → MatchGradientStops → Uniform positioning
- **Color import:** ImportCSVtoSwatch → Load brand colors → Apply to artwork
- **Color conversion:** ConvertToGlobalColor → Make colors editable globally
- **Random variation:** Select objects → FillColorRandom → Artistic diversity

**Note:** Some scripts use LAScripts framework and may have wrapper-only functionality. Core gradient and swatch scripts are fully modernized.
