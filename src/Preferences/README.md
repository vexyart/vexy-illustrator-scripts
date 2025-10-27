# Preferences Category

**Purpose:** Scripts for managing Adobe Illustrator application preferences and settings.

**Script Count:** 1 production script

## Featured Scripts

### ChangeUnits.jsx (279 lines)

**Description:** Quickly change ruler units, stroke units, and text units in Adobe Illustrator preferences.

**Features:**
- Batch change multiple unit types simultaneously
- Supports 4 unit systems: Millimeters, Points, Inches, Pixels
- Optional text units (defaults to points)
- Auto-opens Document Setup dialog for confirmation
- Simple dropdown interface

**Use Cases:**
- Switch between metric and imperial systems
- Standardize units across multiple documents
- Quick preference updates for different workflows
- Regional unit preference changes (mm for Europe, inches for US)

**Supported Units:**
- **Millimeters (mm)** - Metric standard
- **Points (pt)** - Typography standard (72 pt = 1 inch)
- **Inches (in)** - Imperial standard
- **Pixels (px)** - Screen/web design

**How It Works:**

1. **Select Unit:** Choose from dropdown (mm, pt, in, px)
2. **Text Units:** Optionally apply to text (unchecked = text stays in points)
3. **Apply:** Changes ruler units, stroke units, and optionally text units
4. **Confirm:** Document Setup dialog opens for final review

**Technical Details:**

**Preference Changes:**
- `rulerType` - Document ruler units
- `strokeUnits` - Stroke weight units
- `text/units` - Text size units (optional)

**Action Generation:**
The script uses Adobe Illustrator's action system to programmatically open the Document Setup dialog:
- Creates temporary .aia file with action definition
- Executes action to open Document Setup
- Removes temporary action file
- Provides visual confirmation of changes

**Unit Values (Internal):**
- Inches: 0
- Points: 2
- Millimeters: 3
- Pixels: 6

## Technical Notes

### Why This Script Exists

Adobe Illustrator requires changing units in multiple locations:
- Edit → Preferences → Units
- File → Document Setup → Units

This script **consolidates all unit changes** into one dialog, saving time when switching between workflows.

### Text Units Behavior

**Checkbox Unchecked (Default):**
- Ruler units: Changed
- Stroke units: Changed
- Text units: **Always points** (typography standard)

**Checkbox Checked:**
- Ruler units: Changed
- Stroke units: Changed
- Text units: **Matches selected unit**

**Recommendation:** Keep text in points (unchecked) to maintain typography standards, even when working in mm or pixels.

### Document Setup Dialog

After applying changes, the Document Setup dialog opens automatically to:
- Verify changes were applied
- Modify document-specific settings
- Adjust artboard dimensions if needed

If the action fails, you can manually access: **File → Document Setup** (Cmd/Ctrl+Alt+P)

## Modernization Status

- ✅ ES3 Compliance: 100%
- ✅ AIS Framework Integration: Yes (error handling)
- ✅ Original Functionality: 100% preserved
- ✅ Code Quality: Clean, well-documented

**Original Author:** Christian Condamine
**Modernized:** 2025 for AIS framework

## Related Categories

- **Documents/** - Document creation and management
- **Utilities/** - General utility scripts

## Common Workflows

### Web Design → Print Design
```
1. Open web design (pixels)
2. Run ChangeUnits.jsx
3. Select: mm or in
4. Uncheck "Include text units"
5. OK → Text stays in points, everything else converts
```

### US → European Workflow
```
1. Open document (inches)
2. Run ChangeUnits.jsx
3. Select: mm
4. Uncheck "Include text units"
5. OK → Metric measurements, typography intact
```

### Development → Production
```
1. Working in pixels (screen)
2. Run ChangeUnits.jsx
3. Select: pt or mm
4. Uncheck "Include text units"
5. OK → Print-ready units
```

## Requirements

- **Illustrator Version:** CS4 or higher
- **Platform:** macOS and Windows
- **Document:** Not required (changes global preferences)

## See Also

- **AGENTS.md** - Modernization methodology
- **lib/core.jsx** - AIS library error handling
- **CONTRIBUTING.md** - ES3 compliance rules
