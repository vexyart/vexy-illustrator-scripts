# Vexy Adobe Illustrator Scripts

A comprehensive, modernized collection of Adobe Illustrator scripts using the AIS (Adobe Illustrator Scripts) framework.

**Status:** v0.2.0 - Early Development
**Progress:** 18/426 scripts modernized (4.2%) | Favorites 100% complete
**License:** MIT (new code) + original licenses preserved

---

## Overview

This project is a complete reorganization and modernization of 426 Adobe Illustrator scripts from various sources, unified under a consistent framework with modern JavaScript patterns (within ExtendScript ES3 constraints), comprehensive error handling, and English-only interfaces.

### Key Features

- **AIS Library System** - Shared utilities for consistent behavior across all scripts
- **Quality-Focused** - Scripts organized by usefulness (Quality 1-5)
- **English-Only** - All UI, documentation, and code in English
- **Settings Persistence** - User preferences saved between sessions
- **Undo Support** - Proper undo/redo integration
- **Comprehensive Documentation** - Extensive guides and inline docs

---

## Quick Start

### Installation

1. Clone this repository
2. Copy scripts to your Illustrator Scripts folder:
   - **Mac:** `~/Library/Application Support/Adobe/Illustrator [VERSION]/Scripts/`
   - **Windows:** `C:\Program Files\Adobe\Adobe Illustrator [VERSION]\Presets\Scripts\`

### Usage

1. In Illustrator: **File → Scripts → [Script Name]**
2. For Favorites scripts, assign keyboard shortcuts via **Edit → Keyboard Shortcuts → Scripts**

---

## Featured Scripts (Favorites)

The **Favorites/** folder contains 7 top-tier scripts, fully modernized and tested:

### 🎨 **Batch Renamer** (1,727 lines)
Rename artboards, layers, and objects in batch with powerful features:
- Placeholders: `{n}`, `{date}`, `{layer}`, `{color}`
- Regex find & replace
- Case conversion
- Import/export naming templates
- Preview before applying

### 🌈 **Color Blind Simulator** (458 lines)
Simulate 8 types of color vision deficiency:
- Protanopia, Deuteranopia, Tritanopia
- WCAG-compliant algorithms
- Real-time preview

### ✅ **Contrast Checker** (728 lines)
WCAG 2.2 contrast compliance checker:
- AA/AAA level checking
- Live color adjustment with HSB sliders
- Foreground/background testing
- Accessibility recommendations

### 📄 **Export as PDF** (908 lines)
Batch PDF export with 5 built-in presets:
- Print (high quality)
- Screen (optimized)
- Web (smallest)
- Press (CMYK)
- Archive (PDF/A)
- Custom artboard ranges
- Folder batch processing

### 📐 **Fit Artboards to Artwork** (883 lines)
Automatically resize artboards to fit artwork:
- Absolute or relative margins
- Custom artboard ranges
- Live preview
- Maintains artboard order

### 📝 **Go to Line** (246 lines)
Navigate to specific line/character in text:
- Line or character mode
- Input validation
- Keyboard shortcuts
- Works with area and point text

### 🔄 **Step and Repeat** (578 lines)
Duplicate objects in patterns:
- Repeat mode (linear duplication)
- Grid mode (rows × columns)
- Custom spacing and offsets
- Live preview
- Unit support (mm, px, in)

---

## Project Structure

```
Scripts/
├── lib/                        # Shared AIS library
│   ├── core.jsx               # Core utilities (23KB)
│   └── ui.jsx                 # UI helpers (14KB)
│
├── Favorites/                  # Quality 5 (7 scripts) ✅
├── Artboards/                  # Artboard operations
├── Text/                       # Text manipulation
├── Colors/                     # Color utilities
├── Paths/                      # Path operations
├── Transform/                  # Transform tools
├── Layers/                     # Layer management
├── Selection/                  # Selection tools
├── Export/                     # Export utilities
├── Print/                      # Print production
├── Measurement/                # Measurement tools
├── Preferences/                # Preferences & settings
├── Effects/                    # Effects & filters
├── Guides/                     # Guide utilities
├── Layout/                     # Layout tools
├── Strokes/                    # Stroke operations
├── Utilities/                  # Miscellaneous utilities
├── Varia/                      # Lower-priority scripts
│
├── templates/                  # Script templates
├── old/                        # Original scripts (351)
├── old2/                       # LAScripts framework (75)
│
├── README.md                   # This file
├── CHANGELOG.md                # Version history
├── PLAN.md                     # Development plan
├── TODO.md                     # Task list
├── WORK.md                     # Progress tracking
├── CLAUDE.md                   # Contribution guide (43KB)
└── scripts.toml                # Script catalog (426 entries)
```

---

## Development Status

### Phase 1: Infrastructure ✅ COMPLETE
- [x] AIS library system (core.jsx, ui.jsx)
- [x] Script template
- [x] Folder structure
- [x] Documentation system

### Phase 2: Favorites (Quality 5) ✅ COMPLETE
- [x] 7/7 scripts modernized and tested
- [x] ~5,500 lines of production code

### Phase 3: French Q4 Scripts (IN PROGRESS)
- [x] 5/15 scripts complete
- [ ] 10 remaining (estimated 35-45 hours)

### Phase 4-8: Quality 4-1 Scripts (PLANNED)
- [ ] Quality 4: 52 scripts
- [ ] Quality 3: 162 scripts
- [ ] Quality 2: 114 scripts (triage)
- [ ] Quality 1: 16 scripts (archive)

### LAScripts Review (PENDING)
- [ ] 72 wrapper scripts need evaluation

See [PLAN.md](PLAN.md) for detailed roadmap and [TODO.md](TODO.md) for task breakdown.

---

## AIS Library

All modern scripts use the **AIS** (Adobe Illustrator Scripts) namespace for shared functionality:

### Core Utilities (`lib/core.jsx`)

```javascript
// Unit conversion
var ruler = AIS.Units.get();  // Get current document units
var mm = AIS.Units.convert(72, 'pt', 'mm');  // Convert points to mm

// JSON serialization
var json = AIS.JSON.stringify(object);
var object = AIS.JSON.parse(json);

// System detection
if (AIS.System.isMac()) { /* Mac-specific code */ }
AIS.System.openURL('https://example.com');

// Error handling
AIS.Error.show('Operation failed', error);

// String utilities
var num = AIS.String.toNumber('12.5', 0);  // Parse with fallback
var trimmed = AIS.String.trim('  text  ');

// Document helpers
if (AIS.Document.hasDocument()) { /* ... */ }
if (AIS.Document.hasSelection()) { /* ... */ }
```

### UI Utilities (`lib/ui.jsx`)

```javascript
// Simple dialogs
AIS.UI.message('Operation complete');
var confirmed = AIS.UI.confirm('Delete 10 items?');
var input = AIS.UI.prompt('Enter name:', 'Default');

// Progress bars
var progress = AIS.UI.progress('Processing...', 100);
progress.update(50, 'Halfway there...');
progress.close();

// DialogBuilder (advanced)
var builder = new AIS.DialogBuilder('Script Name');
builder.addPanel('Settings')
       .addInput('margin', 'Margin:', '10')
       .addCheckbox('preview', 'Live Preview', true);
var dialog = builder.build();
```

---

## Contributing

This is a personal modernization project, but suggestions and bug reports are welcome!

### Guidelines

1. **Follow the template** - Use `templates/ScriptTemplate.jsx` for new scripts
2. **Use AIS library** - Leverage shared utilities, don't reinvent
3. **English only** - All UI, comments, and variable names in English
4. **Document thoroughly** - JSDoc for all functions
5. **Test in Illustrator** - Manual testing required before commit

See [CLAUDE.md](CLAUDE.md) for comprehensive contribution guide (43KB).

---

## Roadmap

### Short-term (Next Month)
- Complete all 15 French Q4 scripts
- Begin Quality 4 English scripts
- Evaluate LAScripts wrappers

### Medium-term (3 Months)
- Complete Quality 4 scripts (52 total)
- Begin Quality 3 scripts by category
- Build specialized libraries (geometry, color, text)

### Long-term (6 Months)
- Complete all Quality 3 scripts (162 total)
- Triage Quality 2 scripts
- Archive Quality 1 scripts
- Release v1.0.0

---

## Statistics

**Code Written:**
- Library code: ~1,100 lines
- Modernized scripts: ~8,100 lines
- Total: ~9,200 lines

**Documentation:**
- CLAUDE.md: 43KB (1,300+ lines)
- PLAN.md: 12KB
- TODO.md: 6KB
- WORK.md: 4KB
- CHANGELOG.md: 15KB
- Total: ~80KB

**Time Investment:**
- Infrastructure: ~8 hours
- Favorites: ~12 hours
- French Q4 (5/15): ~6 hours
- Documentation: ~10 hours
- Total: ~39 hours

---

## Credits

### Original Authors

This collection includes scripts from:
- Christian Condamine (French Q4 scripts)
- MulaRahul (margin/padding scripts)
- LAScripts framework creators
- 50+ individual contributors

All original licenses and attributions are preserved.

### Modernization

- **Project Lead:** Adam (2025-present)
- **AIS Library:** Custom framework for script consistency
- **Methodology:** See CLAUDE.md for detailed process

---

## License

- **New Code** (AIS library, modernized scripts): MIT License
- **Original Scripts:** Original licenses preserved where specified

See individual script headers for specific attribution.

---

## Support

**Documentation:**
- [PLAN.md](PLAN.md) - Overall development plan
- [TODO.md](TODO.md) - Detailed task list
- [WORK.md](WORK.md) - Progress tracking
- [CLAUDE.md](CLAUDE.md) - Comprehensive contribution guide
- [CHANGELOG.md](CHANGELOG.md) - Version history

**Issues:**
File bug reports or feature requests via GitHub Issues.

---

**Last Updated:** 2025-10-27
**Version:** 0.2.0
**Status:** Active Development
