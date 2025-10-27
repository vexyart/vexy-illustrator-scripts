# Documents Category

**Purpose:** Scripts for document management, creation, and color mode operations in Adobe Illustrator.

**Script Count:** 7 production scripts

## Featured Scripts

### ToggleColorMode.jsx

**Description:** Toggle document color mode between RGB and CMYK.

**Features:**
- Quick toggle between RGB ↔ CMYK color modes
- One-click color space switching
- Preserves document state
- Useful for print/web workflow transitions

**Usage:** Run script to instantly toggle current document's color mode.

---

## Document Management Scripts

All scripts in this category handle document-level operations:

### Core Operations
- **AddDocumentLascripts.jsx** - Create new documents
- **NewDocumentLascripts.jsx** - Document creation with presets
- **CloseDocumentsLascripts.jsx** - Close documents with save options

### Color Mode Management  
- **ToggleColorMode.jsx** - Toggle RGB ↔ CMYK
- **DocumentColorModeSetLascripts.jsx** - Set specific color mode
- **DocumentColorModeToggleLascripts.jsx** - Toggle color modes

### Application Control
- **AppQuitLascripts.jsx** - Quit Illustrator with cleanup

---

## Use Cases

**Print Workflow:**
- Switch to CMYK before sending to print
- Create new documents with print presets

**Web Workflow:**
- Switch to RGB for screen display
- Toggle between color spaces for testing

**Batch Operations:**
- Close multiple documents efficiently
- Manage document lifecycle

---

## Technical Notes

**Color Mode Conversion:**
- RGB → CMYK: Colors may shift (gamut differences)
- CMYK → RGB: Generally safe conversion
- Spot colors preserved during conversion
- Gradients and effects update automatically

**Document State:**
- Scripts work on active document
- Some require document to be open
- Check for unsaved changes where applicable

---

## Category Overview

The Documents category provides essential document lifecycle management - creation, color mode switching, and cleanup operations. These scripts streamline common document-level tasks that would otherwise require multiple menu navigations.

**Modernization Status:**
- ✅ 7/7 scripts modernized (100%)
- ES3 compliance: 100%
- AIS framework integration: 100%

**Related Categories:**
- **Export** - Document output and saving
- **Preferences** - Application-level settings
- **Utilities** - Cross-document operations
