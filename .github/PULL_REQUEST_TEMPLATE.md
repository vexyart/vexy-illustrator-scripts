<!-- this_file: .github/PULL_REQUEST_TEMPLATE.md -->

# Pull Request

## Description

**Summary:**
<!-- Provide a clear and concise description of your changes -->

**Related Issue:**
<!-- Link to the issue this PR addresses (e.g., Fixes #123) -->

## Type of Change

**What type of change is this?**
- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New script (adds a new script to the library)
- [ ] Enhancement (improves an existing script)
- [ ] AIS library update (modifies lib/core.jsx or lib/ui.jsx)
- [ ] Documentation update (README, category docs, etc.)
- [ ] Infrastructure (build, CI, project structure)
- [ ] Refactoring (code changes that neither fix bugs nor add features)

## Script Category

**If this PR adds or modifies scripts, which category?**
- [ ] Artboards
- [ ] Colors
- [ ] Documents
- [ ] Effects
- [ ] Export
- [ ] Favorites
- [ ] Guides
- [ ] Layers
- [ ] Measurement
- [ ] Paths
- [ ] Preferences
- [ ] Print
- [ ] Replace
- [ ] Selection
- [ ] Strokes
- [ ] Text
- [ ] Transform
- [ ] Utilities
- [ ] Varia

## Changes Made

**Detailed changes:**
<!-- List the specific changes made in this PR -->
-
-
-

**Files modified:**
<!-- List the files that were changed -->
-
-

**Files added:**
<!-- List any new files -->
-
-

## Testing Performed

**Manual Testing:**
<!-- Describe the testing you performed -->

**Test Environment:**
- Adobe Illustrator version: _______
- Operating System: _______
- Document type tested: _______

**Test Cases:**
<!-- List specific scenarios you tested -->
- [ ] Test case 1:
- [ ] Test case 2:
- [ ] Test case 3:

**Edge Cases Tested:**
- [ ] Empty document
- [ ] No selection (if applicable)
- [ ] Large document (100+ objects)
- [ ] Multiple artboards
- [ ] Different unit systems (px, pt, mm, cm, in)
- [ ] RGB vs CMYK color modes

## ES3 Compliance Checklist

**ExtendScript Compatibility:**
- [ ] No `const` declarations (use `var` only)
- [ ] No `let` declarations (use `var` only)
- [ ] No arrow functions (use `function() {}`)
- [ ] No classes (use function constructors)
- [ ] No template literals (use string concatenation)
- [ ] No spread operator (use Array.prototype methods)
- [ ] No destructuring (use explicit assignment)
- [ ] No async/await (ExtendScript is synchronous)
- [ ] No default parameters (handle undefined explicitly)

**Code verified ES3 compliant:**
```bash
# Command used to verify
grep -E "(const |let |=>|class |`)" [filename].jsx
# Result: No matches
```

## AIS Framework Integration

**AIS Library Usage:**
- [ ] Uses `#include "../lib/core.jsx"` at top of file
- [ ] Uses AIS namespace for utilities (AIS.Units, AIS.JSON, etc.)
- [ ] No duplicate implementations of AIS library functions
- [ ] Error handling uses `AIS.Error.show()`
- [ ] Document validation uses `AIS.Document.hasDocument()`

**AIS Functions Used:**
<!-- List which AIS functions your code uses -->
- `AIS.Units.convert()` - for unit conversions
- `AIS.JSON.stringify/parse()` - for settings persistence
- `AIS.Document.hasDocument()` - for validation
- Other: _______

## Code Quality

**Standards Followed:**
- [ ] Standard script structure (CONFIGURATION → MAIN → CORE LOGIC → UI → UTILITIES)
- [ ] JSDoc comments for functions
- [ ] Descriptive variable names
- [ ] Error handling with try/catch
- [ ] Input validation
- [ ] User-friendly error messages

**Code Review:**
- [ ] No hardcoded paths (uses `Folder.myDocuments`, etc.)
- [ ] No magic numbers (uses named constants)
- [ ] Proper indentation and formatting
- [ ] Removed debug code and console.log statements
- [ ] No commented-out code blocks

## Documentation

**Documentation Updated:**
- [ ] Script header includes @version, @description, @category
- [ ] Added/updated category README.md (if new script)
- [ ] Updated CHANGELOG.md with changes
- [ ] Updated TODO.md (removed completed tasks)
- [ ] Updated WORK.md with session notes (if applicable)

**Usage Documentation:**
<!-- Briefly describe how to use the new/modified functionality -->

## Screenshots

<!-- If applicable, add screenshots demonstrating the changes -->

**Before:**
<!-- Screenshot of old behavior (for bug fixes/enhancements) -->

**After:**
<!-- Screenshot of new behavior -->

## Breaking Changes

**Does this PR introduce breaking changes?**
- [ ] Yes (explain below)
- [ ] No

**If yes, what breaks and how should users adapt?**
<!-- Describe the breaking changes and migration path -->

## Dependencies

**Does this PR depend on other PRs or issues?**
- [ ] Yes (list below)
- [ ] No

**Dependencies:**
<!-- List any dependencies -->
-
-

## Contributor Checklist

**Before submitting:**
- [ ] I've read CONTRIBUTING.md
- [ ] I've tested the changes in Adobe Illustrator
- [ ] I've verified ES3 compliance
- [ ] I've updated relevant documentation
- [ ] I've checked for code duplication
- [ ] I've followed the project's naming conventions
- [ ] My commit messages are descriptive

**For new scripts:**
- [ ] Script follows standard structure
- [ ] Script is in the correct category folder
- [ ] Filename is PascalCase (e.g., ScriptName.jsx)
- [ ] Script includes validation wrapper
- [ ] Settings persistence implemented (if applicable)
- [ ] Error handling is comprehensive

**For AIS library changes:**
- [ ] Changes are backward compatible (or documented)
- [ ] Tested with multiple existing scripts
- [ ] Updated lib/README.md API documentation
- [ ] Considered impact on all 426 scripts

## Additional Context

<!-- Add any other context about the PR here -->

**Motivation:**
<!-- Why is this change needed? What problem does it solve? -->

**Alternatives Considered:**
<!-- What other approaches did you consider? Why did you choose this one? -->

---

**Thank you for contributing to Vexy Illustrator Scripts!**

Your contributions help modernize and improve the Adobe Illustrator scripting ecosystem.
