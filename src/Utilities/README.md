# Utilities Category

**Purpose:** Production utilities and quality/testing tools for Illustrator scripts development and document management.

## Production Utilities (2 scripts)

### DocumentCleanup.jsx (834 lines)

**Description:** Comprehensive document cleanup with 16 operations organized in 6 categories.

**Features:**
- **Clipping Masks:** Ignore, release, or delete modes
- **Symbols:** Expand symbol instances to break links
- **Styles:** Remove graphic styles from objects
- **Expand Operations:** Gradients, live paint, envelopes, appearance
- **Palette Cleaning:** Remove unused swatches, symbols, brushes
- **Images:** Embed linked images, reduce resolution (72-600 DPI)
- **Guides:** Delete all or move to dedicated layer
- **Cleanup:** Remove empty layers, empty text, dots (0pt paths), invisible objects
- Selection or document-wide scope
- Live preview counter showing affected items
- Settings persistence

**Usage:**
1. Open document to clean
2. Optionally select specific objects (or work document-wide)
3. Run script and choose scope (Selection/Document)
4. Check desired cleanup operations
5. Click OK to apply all checked operations

**Common Workflows:**
- **Pre-export cleanup:** Expand all, clean palettes, embed images
- **File size reduction:** Clean unused palettes, reduce image DPI
- **Simplify artwork:** Expand symbols/gradients, remove styles

### RemoveSmallObjects.jsx (472 lines)

**Description:** Delete objects smaller than specified dimensions with AND/OR logic.

**Features:**
- Width and height thresholds (mm)
- AND/OR logic for size criteria
- Selection or document-wide processing
- Live preview counter
- Undo support

## Quality & Testing Tools (30 scripts)

**Testing Infrastructure:**
- **TestAISLibrary.jsx** - Unit tests for AIS library (10 test suites)
- **RunAllTests.jsx** - Automated script loading validation
- **SmokeTests.jsx** - Fast regression testing (< 10 seconds)
- **GenerateTestDocument.jsx** - Create standardized test.ai file
- **BenchmarkPerformance.jsx** - Performance timing and profiling

**Validation Tools:**
- **PreFlightCheck.jsx** - ES6+ syntax, TODO markers, French strings, paths
- **ValidateHeaders.jsx** - JSDoc metadata completeness
- **CheckCompatibility.jsx** - AI version compatibility matrix
- **CheckScriptConsistency.jsx** - Pattern consistency across scripts
- **ValidateScriptCategories.jsx** - Category organization validation
- **CheckSettingsCompatibility.jsx** - Settings format validation

**Analysis Tools:**
- **AnalyzeCoverage.jsx** - Code coverage for AIS functions
- **AnalyzeLibraryUsage.jsx** - AIS function usage statistics
- **AnalyzeCodeDuplication.jsx** - Find repeated code blocks
- **AnalyzeScriptMetadata.jsx** - Metadata quality scoring
- **AnalyzeDocumentationCoverage.jsx** - Doc completeness audit
- **MapDependencies.jsx** - Visualize script dependencies
- **AuditErrorMessages.jsx** - Error message quality review

**Automation Tools:**
- **ReleaseChecklist.jsx** - Pre-release validation workflow
- **UpdateScriptCatalog.jsx** - Sync scripts.toml catalog
- **GenerateScriptDocs.jsx** - Auto-generate README.md
- **GenerateAPIReference.jsx** - Generate AIS API documentation
- **GenerateScriptFromTemplate.jsx** - Interactive script wizard
- **EnforceHeaderConsistency.jsx** - Auto-fix JSDoc headers
- **ManageVersions.jsx** - Version management utility

**Monitoring Tools:**
- **TrackLibraryLifecycle.jsx** - Track AIS API changes over time
- **WatchLibraryChanges.jsx** - Auto-detect library modifications
- **TrackScriptUsage.jsx** - Usage analytics (opt-in)
- **AggregateErrorLogs.jsx** - Error pattern analysis

**User Tools:**
- **BackupSettings.jsx** - Backup and restore script settings
- **MigrateSettings.jsx** - Migrate settings from old scripts

## Installation

Copy desired scripts to Illustrator Scripts folder:
- **Mac:** `/Applications/Adobe Illustrator [version]/Presets.localized/en_US/Scripts/`
- **Windows:** `C:\Program Files\Adobe\Adobe Illustrator [version]\Presets\en_US\Scripts\`

See [main README](../README.md) for detailed installation instructions.

## Usage Notes

**For Developers:**
- Run PreFlightCheck.jsx before commits
- Run ReleaseChecklist.jsx before releases
- Use GenerateScriptFromTemplate.jsx for new scripts
- Monitor library changes with WatchLibraryChanges.jsx

**For Users:**
- DocumentCleanup.jsx: General document maintenance
- RemoveSmallObjects.jsx: Clean up stray pixels/tiny objects
- BackupSettings.jsx: Protect your preferences

## Requirements

All scripts require:
- Adobe Illustrator CS6 or later
- Active document (for document-specific operations)
- AIS library framework (lib/core.jsx, lib/ui.jsx)

## Version

Most utilities: 1.0.0
See individual script headers for specific versions.

## License

Apache 2.0 - See LICENSE file in repository root.
