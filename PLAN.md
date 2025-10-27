
## Phase 1: Foundation & Infrastructure (Priority: CRITICAL)

### 1.1 Shared Library System
Create a centralized library system that all scripts will use.

**Files to create:**
- `src/.lib/core.jsx` - Core utilities (logging, error handling, versioning)
- `src/.lib/ui.jsx` - Common UI components and dialogs
- `src/.lib/validation.jsx` - Input validation and sanitization
- `src/.lib/geometry.jsx` - Geometric calculations and conversions
- `src/.lib/color.jsx` - Color manipulation utilities
- `src/.lib/selection.jsx` - Selection management utilities
- `src/.lib/artboard.jsx` - Artboard operations
- `src/.lib/text.jsx` - Text manipulation utilities
- `src/.lib/path.jsx` - Path operations
- `src/.lib/file.jsx` - File I/O operations
- `src/.lib/prefs.jsx` - Preferences management

### 1.3 Folder Structure

```
src/
├── .lib/                   # Shared libraries
│   ├── core.jsx
│   ├── ui.jsx
│   └── ...
├── Favorites/              # Quality 5 (7 scripts)
├── Artboards/              # 23 scripts
├── Text/                   # 41 scripts
├── Colors/                 # 42 scripts
├── Paths/                  # 45 scripts
├── Transform/              # 33 scripts
├── Selection/              # 19 scripts
├── Measurement/            # 10 scripts
├── Export/                 # 12 scripts
├── Print/                  # 9 scripts
├── Layers/                 # 15 scripts
├── Effects/                # 8 scripts
├── Guides/                 # 5 scripts
├── Layout/                 # 6 scripts
├── Strokes/                # 9 scripts
├── Utilities/              # 18 scripts
├── Preferences/            # 10 scripts
├── Varia/                  # Quality 2 (114 scripts)
├── old/                    # Original scripts (archive)
├── scripts.toml            # Catalogue
└── README.md               # User documentation
```

