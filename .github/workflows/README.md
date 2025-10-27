<!-- this_file: .github/workflows/README.md -->

# GitHub Actions Workflows

This directory is reserved for future GitHub Actions CI/CD workflows for the Vexy Illustrator Scripts project.

## Current Status

**No automated workflows are currently active.** This is intentional because:

1. **ExtendScript Testing Limitation:** Adobe Illustrator scripts require manual testing in the actual Illustrator application
2. **No Automated Test Environment:** ExtendScript cannot be tested in Node.js, browser, or standard CI environments
3. **Manual Testing Required:** All scripts must be manually executed in Illustrator to verify functionality

## Future Workflow Opportunities

While automated script execution isn't feasible, the following workflows could improve project quality:

### 1. ES3 Compliance Checker

**Purpose:** Validate that all production scripts use only ES3 syntax

**Implementation:**
```yaml
name: ES3 Compliance Check
on: [push, pull_request]
jobs:
  check-es3:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Check for ES6+ syntax
        run: |
          # Search for const, let, arrow functions, classes
          if grep -rE "(^|[^/])(const |let |=>|class )" --include="*.jsx" Favorites/ Artboards/ Colors/ Text/ Layers/ Paths/ Transform/ Utilities/ Replace/ Documents/ Effects/ Export/ Guides/ Measurement/ Preferences/ Print/ Selection/ Strokes/ Varia/; then
            echo "ES6+ syntax found! ExtendScript only supports ES3."
            exit 1
          fi
          echo "All scripts are ES3 compliant."
```

**Benefits:**
- Prevents ES6+ syntax from entering production code
- Catches violations before manual testing
- Fast feedback in pull requests

### 2. Documentation Consistency Checker

**Purpose:** Ensure all scripts have proper headers and documentation

**Implementation:**
```yaml
name: Documentation Check
on: [push, pull_request]
jobs:
  check-docs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Verify script headers
        run: |
          # Check for required JSDoc tags
          for file in Favorites/*.jsx Artboards/*.jsx Colors/*.jsx Text/*.jsx Layers/*.jsx Paths/*.jsx Transform/*.jsx Utilities/*.jsx; do
            if ! grep -q "@version" "$file" || ! grep -q "@description" "$file" || ! grep -q "@category" "$file"; then
              echo "Missing required JSDoc tags in $file"
              exit 1
            fi
          done
          echo "All scripts have proper documentation."
```

**Benefits:**
- Enforces documentation standards
- Catches missing headers
- Maintains project quality

### 3. AIS Framework Integration Checker

**Purpose:** Verify all production scripts include the AIS library

**Implementation:**
```yaml
name: AIS Integration Check
on: [push, pull_request]
jobs:
  check-ais:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Verify AIS inclusion
        run: |
          # Check for #include "../lib/core.jsx"
          for file in Favorites/*.jsx Artboards/*.jsx Colors/*.jsx Text/*.jsx Layers/*.jsx Paths/*.jsx Transform/*.jsx Utilities/*.jsx Replace/*.jsx; do
            if ! grep -q '#include "../lib/core.jsx"' "$file"; then
              echo "Missing AIS library inclusion in $file"
              exit 1
            fi
          done
          echo "All scripts properly include AIS framework."
```

**Benefits:**
- Ensures consistent library usage
- Prevents scripts without AIS utilities
- Maintains architectural standards

### 4. File Naming Convention Checker

**Purpose:** Enforce PascalCase naming for script files

**Implementation:**
```yaml
name: Naming Convention Check
on: [push, pull_request]
jobs:
  check-naming:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Verify PascalCase filenames
        run: |
          # Check for non-PascalCase .jsx files
          if find Favorites/ Artboards/ Colors/ Text/ Layers/ Paths/ Transform/ Utilities/ Replace/ -name "*.jsx" | grep -E "(_|[a-z][A-Z])"; then
            echo "Non-PascalCase filenames found. Use PascalCase for all scripts."
            exit 1
          fi
          echo "All filenames follow PascalCase convention."
```

**Benefits:**
- Enforces project naming standards
- Prevents inconsistent file naming
- Maintains professional appearance

### 5. Documentation Line Count Reporter

**Purpose:** Track documentation growth over time

**Implementation:**
```yaml
name: Documentation Stats
on: [push]
jobs:
  doc-stats:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Count documentation lines
        run: |
          echo "## Documentation Statistics" >> $GITHUB_STEP_SUMMARY
          echo "" >> $GITHUB_STEP_SUMMARY
          wc -l README.md CHANGELOG.md PLAN.md STATUS.md CONTRIBUTING.md SECURITY.md >> $GITHUB_STEP_SUMMARY
          echo "" >> $GITHUB_STEP_SUMMARY
          echo "### Category READMEs" >> $GITHUB_STEP_SUMMARY
          wc -l */README.md >> $GITHUB_STEP_SUMMARY
```

**Benefits:**
- Tracks documentation progress
- Celebrates documentation milestones
- Provides visibility into project health

### 6. Script Count Reporter

**Purpose:** Track modernization progress

**Implementation:**
```yaml
name: Modernization Progress
on: [push]
jobs:
  progress:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Count modernized scripts
        run: |
          TOTAL=426
          MODERNIZED=$(find Favorites/ Artboards/ Colors/ Text/ Layers/ Paths/ Transform/ Utilities/ Replace/ Documents/ Effects/ Export/ Guides/ Measurement/ Preferences/ Print/ Selection/ Strokes/ Varia/ -name "*.jsx" 2>/dev/null | wc -l | tr -d ' ')
          PERCENT=$((MODERNIZED * 100 / TOTAL))
          echo "## Modernization Progress" >> $GITHUB_STEP_SUMMARY
          echo "" >> $GITHUB_STEP_SUMMARY
          echo "**$MODERNIZED / $TOTAL scripts ($PERCENT%)**" >> $GITHUB_STEP_SUMMARY
```

**Benefits:**
- Visualizes project progress
- Motivates continued work
- Tracks velocity over time

## Why Not Full CI/CD?

**ExtendScript Reality:**
- ExtendScript is Adobe's proprietary JavaScript engine
- Only runs within Adobe applications (Illustrator, Photoshop, InDesign)
- No headless mode or command-line execution
- No npm packages or Node.js compatibility
- Manual testing is the only verification method

**What We Can't Automate:**
- Script execution and functionality testing
- UI dialog testing
- Illustrator document manipulation
- User interaction flows
- Performance testing
- Visual output verification

**What We CAN Automate:**
- Static code analysis (ES3 compliance)
- Documentation verification
- File naming conventions
- Code style consistency
- Project metrics and reporting

## Implementation Recommendations

### Phase 1: Start Simple
Begin with the ES3 Compliance Checker - it provides immediate value and prevents the most common errors.

### Phase 2: Add Documentation Checks
Once ES3 checks are working, add documentation and AIS integration checks.

### Phase 3: Add Reporting
Implement progress tracking and statistics reporting for visibility.

### Phase 4: Consider Advanced Checks
Add more sophisticated analysis as needed:
- JSDoc validation
- Code complexity metrics
- Duplicate code detection
- Security scanning

## Testing Workflows Locally

Before committing workflows, test them locally:

```bash
# ES3 Compliance Check
grep -rE "(^|[^/])(const |let |=>|class )" --include="*.jsx" Favorites/ Artboards/ Colors/ Text/

# Documentation Check
for file in Favorites/*.jsx; do
  grep -q "@version" "$file" && grep -q "@description" "$file" || echo "Missing docs: $file"
done

# AIS Integration Check
for file in Favorites/*.jsx; do
  grep -q '#include "../lib/core.jsx"' "$file" || echo "Missing AIS: $file"
done

# Script Count
find Favorites/ Artboards/ Colors/ Text/ Layers/ Paths/ Transform/ Utilities/ -name "*.jsx" | wc -l
```

## Workflow Best Practices

**Keep It Fast:**
- Static analysis should complete in under 30 seconds
- No external dependencies or downloads
- Use simple bash/grep commands when possible

**Make It Helpful:**
- Clear error messages that guide fixes
- Link to relevant documentation
- Show exactly which files have issues

**Make It Reliable:**
- Don't fail on false positives
- Handle edge cases gracefully
- Test workflows thoroughly before enabling

**Make It Visible:**
- Use GitHub Step Summaries for reports
- Add badges to README.md
- Celebrate milestones and progress

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Workflow Syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
- [ExtendScript Documentation](https://extendscript.docsforadobe.dev/)
- [Project CONTRIBUTING.md](../../CONTRIBUTING.md)

---

**Note:** This documentation serves as a reference for future CI/CD implementation. No workflows are currently active. When ready to implement, copy workflow examples above into `.yml` files in this directory.

**Last Updated:** 2025-10-27
**Status:** Documentation only - no active workflows
