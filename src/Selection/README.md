# Selection Category

**Purpose:** Scripts for selecting, filtering, and managing object selections in Adobe Illustrator.

**Script Count:** 6 production scripts

## Featured Scripts

### RandomSelection.jsx (228 lines) 🆕

**Description:** Randomly select objects by percentage (1-100%) or exact count using Fischer-Yates shuffle algorithm.

**Features:**
- True randomization using Fischer-Yates shuffle
- Percentage mode (1-100%) or exact count mode
- Optimized selection/deselection strategy (60% threshold)
- Live preview with Apply button
- Works with any selected objects
- Professional-grade randomization

**Usage:**
1. Select objects you want to randomize
2. Run the script
3. Choose percentage or enter exact count
4. Enable preview to see selection
5. Click Apply to finalize

**Common Workflows:**
- **Design variation:** Randomly select elements for color changes
- **Pattern creation:** Select random objects for repositioning
- **Data visualization:** Random sampling of visual elements
- **Testing:** Quick random selection for design experiments

---

### RememberSelectionLayers.jsx (232 lines) 🆕

**Description:** Save and restore selection positions across layers using tag-based memory system.

**Features:**
- Tag-based data persistence (lyrParent, lyrIdx)
- Handles multiple layers with same name
- Preserves layer visibility/lock state
- Two-step workflow: save → work → restore
- Layer index tracking for disambiguation

**Usage:**
1. Select objects you want to remember
2. Run script → Choose "Save"
3. Work on other tasks (objects can be moved/modified)
4. Run script again → Choose "Restore"
5. Objects return to original layers

**Common Workflows:**
- **Multi-layer editing:** Move objects temporarily, restore later
- **Complex reorganization:** Track original positions during restructure
- **Collaborative work:** Remember layer assignments for team workflows

---

## All Scripts

### Random Selection

- **RandomSelection.jsx** 🆕 (228 lines) - Random selection by percentage or count

### Layer-Based Selection

- **RememberSelectionLayers.jsx** 🆕 (232 lines) - Save/restore selection layer positions

### Object-Based Selection

- **SelectArtboardObjects.jsx** - Select all objects on specific artboard
- **SelectBySwatches.jsx** - Select objects by swatch color
- **SelectLink.jsx** - Select linked/placed objects
- **SelectPointsByType.jsx** - Select anchor points by type (corner/smooth)

---

**Total:** 6 selection scripts covering random, layer-based, and object-based selection.

**Legend:** 🆕 = Added in Rounds 39-40 (2025-10-27)

**Note:** These scripts complement Illustrator's native selection tools (Select menu) with advanced filtering and memory capabilities.
