# Guides Category

**Purpose:** Scripts for creating, managing, and organizing guides in Adobe Illustrator.

**Script Count:** 14 production scripts

## Featured Scripts

### MoveGuides.jsx (230 lines) 🆕

**Description:** Move all guide objects to a specific layer, frontmost, or backmost position.

**Features:**
- Move guides to named layer (creates if doesn't exist)
- Bring guides to front of each layer
- Send guides to back of each layer
- Custom layer naming
- Menu command detection for guide identification
- Works with unlocked and visible layers only

**Usage:** Run script, choose destination (Layer/Front/Back), optionally rename target layer.

**Note:** Guides in locked or hidden layers are not processed.

---

## Guide Creation

### Center Guides
- **AddHorizontalCenterGuide.jsx** - Add horizontal center guide to artboard
- **AddVerticalCenterGuide.jsx** - Add vertical center guide to artboard
- **GuideHorizontalCenterLascripts.jsx** - Horizontal center guide (LAScripts version)
- **GuideVerticalCenterLascripts.jsx** - Vertical center guide (LAScripts version)

### Grid Systems
- **BootstrapGridLascripts.jsx** - Bootstrap responsive grid (12-column)
- **GridderLascripts.jsx** - Custom grid system creator
- **Susy2GridLascripts.jsx** - Susy 2 grid framework
- **ColumnsLascripts.jsx** - Column-based layout guides

### Margin & Layout
- **GuideMarginsLascripts.jsx** - Margin guide creation
- **FastGuidesLascripts.jsx** - Quick guide placement

## Guide Management

### Cleanup
- **ClearGuides.jsx** - Remove all guides from document
- **ClearGuidesLascripts.jsx** - Clear guides (LAScripts version)
- **GuidesClearLascripts2.jsx** - Alternative guide clearing

### Organization
- **MoveGuides.jsx** 🆕 - Organize guides by layer or z-order

---

**Total:** 14 guide scripts covering creation, grid systems, and management.

**Legend:** 🆕 = Added in Round 41 (2025-10-27)

**Common Workflows:**
- **Responsive layout:** BootstrapGridLascripts → create 12-column grid
- **Custom grids:** GridderLascripts → define rows/columns/gutters
- **Centering:** Add horizontal + vertical center guides
- **Organization:** MoveGuides → consolidate to dedicated layer
- **Cleanup:** ClearGuides → remove all guides when done
