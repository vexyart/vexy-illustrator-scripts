# Layers Category

**Purpose:** Scripts for organizing, managing, and manipulating layers and sublayers in Adobe Illustrator.

---

## Production Scripts

### ChangeLayerColors.jsx (100 lines)

**Description:** Batch change layer selection colors for better visual organization.

**Features:**
- Change colors for single or multiple layers
- Predefined color palette (20 standard colors)
- Custom color picker for specific needs
- Apply to layers or sublayers
- Preview before applying
- Undo support

**Usage:**
1. Select layer(s) in Layers panel
2. Run script
3. Choose color from palette or custom picker
4. Apply to change layer selection color

**Common Workflows:**
- **Color coding:** Assign colors by layer type (red for guides, blue for text, green for shapes)
- **Project organization:** Use consistent colors across related documents
- **Team collaboration:** Standardize layer colors for shared files

---

### RenumberLayersAndArtboards.jsx (250 lines)

**Description:** Sequentially renumber layers and artboards with customizable patterns and padding.

**Features:**
- Renumber layers, artboards, or both
- Custom numbering start value
- Increment step control
- Zero-padding options (01, 001, 0001)
- Prefix/suffix support
- Preserve existing names with number injection
- Batch processing
- Preview before applying
- Settings persistence

**Usage:**
1. Run script
2. Choose target: layers, artboards, or both
3. Set numbering options:
   - Start number (e.g., 1)
   - Increment (e.g., 1, 5, 10)
   - Padding (e.g., 3 digits → 001)
   - Pattern (e.g., "Layer_{number}")
4. Preview changes
5. Apply

**Common Workflows:**
- **Sequential layers:** Layers → Start: 1, Increment: 1, Padding: 2 → "Layer 01", "Layer 02"...
- **Artboard pages:** Artboards → Start: 1, Pattern: "Page_{number}" → "Page_001", "Page_002"...
- **Skip numbering:** Layers → Increment: 5 → "Layer 005", "Layer 010", "Layer 015"...

---

### UnlockAllLayers.jsx

**Description:** Quickly unlock all locked layers and sublayers in the active document.

**Features:**
- Unlock all layers recursively
- Includes nested sublayers
- Fast batch operation
- No dialog (instant execution)
- Undo support

**Usage:** Run script → All layers unlocked instantly

**Common Workflows:**
- **File handoff:** Unlock all layers before sending to client/team
- **Editing locked files:** Received locked file → unlock all → begin editing
- **Template modification:** Unlock template layers for customization

---

## LAScripts Framework Scripts (Phase 5 - Requires Reimplementation)

The following scripts are placeholders requiring full reimplementation:

- `LayersRemoveEmptyLascripts.jsx` - Delete layers with no contents
- `SubLayersRemoveEmptyLascripts.jsx` - Remove empty sublayers recursively
- `ToggleVisibilityLascripts.jsx` - Toggle layer visibility in batch
- `UnlockAllLascripts.jsx` - LAScripts version of unlock functionality

**Status:** Scheduled for Phase 5 (LAScripts framework replacement needed)

---

## Requirements

- Adobe Illustrator CS6 or later
- All production scripts use AIS library framework
- Active document required

## Common Workflows

**Project Organization:**
1. RenumberLayersAndArtboards → Sequential numbering
2. ChangeLayerColors → Color code by category
3. Use BatchRenamer (Favorites) for complex naming patterns

**File Cleanup:**
1. UnlockAllLayers → unlock everything
2. Delete unnecessary layers manually
3. RenumberLayersAndArtboards → renumber remaining
4. ChangeLayerColors → standardize colors

**Template Setup:**
1. Create layer structure
2. RenumberLayersAndArtboards → consistent naming
3. ChangeLayerColors → visual coding
4. Lock template layers → save as template

---

## Tips

- Combine RenumberLayersAndArtboards with BatchRenamer for advanced patterns
- Use ChangeLayerColors for visual project management (traffic light system)
- UnlockAllLayers pairs well with global edit operations
- Layer colors appear in Layers panel and selection outlines
- Zero-padding ensures alphabetical sort matches numerical order

## Upcoming Features (Phase 5)

When LAScripts reimplementation completes:
- Automated empty layer removal
- Sublayer organization tools
- Advanced visibility management
- Layer merging and consolidation utilities

---

**License:** Apache 2.0 | See individual script headers
