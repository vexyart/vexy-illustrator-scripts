# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **phased modernization project** transforming 426 legacy Adobe Illustrator scripts into a unified, professional library. The project uses a custom framework called **AIS (Adobe Illustrator Scripts)** to provide consistent utilities across all scripts.

**Current Status:** 18/426 scripts modernized (4.2%) | Favorites category 100% complete

**Key Constraint:** ExtendScript (Adobe's JavaScript engine) only supports ES3 - no `const`, `let`, arrow functions, classes, or modern syntax.

## Architecture

### Three-Layer System

```
┌─────────────────────────────────────┐
│ AIS Library (lib/)                  │
│ - core.jsx: Utilities, error        │
│ - ui.jsx: Dialog components         │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│ Production Scripts (17 categories)  │
│ Each uses #include "../lib/core.jsx"│
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│ Legacy Archives (old/, old2/)       │
│ READ-ONLY reference material        │
└─────────────────────────────────────┘
```

### Critical Files

| File | Purpose |
|------|---------|
| `lib/core.jsx` | AIS framework - shared utilities (units, JSON, error handling, etc.) |
| `lib/ui.jsx` | UI components and dialog builders |
| `scripts.toml` | Master catalog of all 426 scripts with quality ratings (1-5) |
| `AGENTS.md` | Detailed modernization methodology (43KB guide) |
| `TODO.md` | Current task list |
| `WORK.md` | Session notes and progress |

### Folder Organization

**Production folders** (organized by function):
- `Favorites/` - 7 top-tier scripts (100% complete)
- `Artboards/`, `Text/`, `Layers/`, `Colors/`, `Paths/`, `Transform/`, etc. (16 more categories)

**Archive folders** (READ-ONLY):
- `old/` - 351 original scripts (mixed languages, various sources)
- `old2/` - 75 LAScripts framework scripts (different framework, needs re-implementation)

## AIS Library Quick Reference

All scripts include `#include "../lib/core.jsx"` and use the `AIS` namespace:

```javascript
// Units
AIS.Units.get()                        // Get current doc units ('px', 'pt', 'mm', etc.)
AIS.Units.convert(72, 'pt', 'mm')      // Convert between units → 25.4

// JSON
AIS.JSON.stringify(obj)                // Safe JSON serialization
AIS.JSON.parse(str)                    // Safe JSON parsing

// System
AIS.System.isMac()                     // Platform detection
AIS.System.openURL(url)                // Open URL in browser

// Error Handling
AIS.Error.show('Message', error)       // Formatted error dialog

// Document
AIS.Document.hasDocument()             // Check if document exists
AIS.Document.hasSelection()            // Check if selection exists
AIS.Document.getActive()               // Get active document
```

## Standard Script Structure

Every modernized script follows this pattern:

```javascript
/**
 * Script Name
 * @version 1.0.0
 * @description What it does
 * @category CategoryName
 */

#include "../lib/core.jsx"

//@target illustrator
app.preferences.setBooleanPreference('ShowExternalJSXWarning', false);

(function() {
    // Validation wrapper
    if (!AIS.Document.hasDocument()) {
        alert('No document\nOpen a document and try again');
        return;
    }

    main();
})();

// ============================================================================
// CONFIGURATION
// ============================================================================
var CFG = {
    // Hard-coded defaults
};

// ============================================================================
// MAIN FUNCTION
// ============================================================================
function main() {
    // Entry point
}

// ============================================================================
// CORE LOGIC
// ============================================================================
// Business logic functions

// ============================================================================
// USER INTERFACE
// ============================================================================
// Dialog creation and event handlers

// ============================================================================
// UTILITIES
// ============================================================================
// Helper functions
```

## Common Development Commands

### Testing Scripts in Illustrator

No automated test runner for ExtendScript - all testing is manual:

1. Open Adobe Illustrator
2. File → Scripts → Other Script
3. Select the `.jsx` file
4. Test functionality manually

### Code Quality Checks

```bash
# Check for ES6+ syntax (not allowed in ExtendScript)
grep -E "(const |let |=>|class |`)" ScriptName.jsx

# Find all scripts in a category
ls -lh Favorites/*.jsx

# Count remaining scripts by size
find old -name "*.jsx" -exec wc -l {} \; | awk '$1 > 500' | sort -n

# Check for French text (should be English-only)
grep -i "marge\|echelle\|cotation" Text/*.jsx
```

### File Operations

```bash
# Count completion progress
find Favorites -name "*.jsx" | wc -l    # Should be 7
find Artboards -name "*.jsx" | wc -l    # Track progress
find Text -name "*.jsx" | wc -l         # Track progress

# Line counts
wc -l lib/core.jsx                      # 922 lines
wc -l Favorites/*.jsx | tail -1         # Total Favorites code
```

## Quality Tiers (scripts.toml)

Scripts are rated 1-5 based on usefulness:

- **Quality 5 (Favorites):** 7 scripts - highest priority, **100% complete**
- **Quality 4:** 52 scripts - very useful, next priority
- **Quality 3:** 162 scripts - useful tools
- **Quality 2 (Varia):** 114 scripts - miscellaneous
- **Quality 1:** 16 scripts - archive/remove

## Key Patterns & Standards

### Unit Conversion

```javascript
// ❌ WRONG: Manual conversion
var mmToPt = 2.834645;
var widthMM = widthPt / mmToPt;

// ✅ RIGHT: Use AIS library
var widthMM = AIS.Units.convert(widthPt, 'pt', 'mm');
```

### Settings Persistence

```javascript
// Standard pattern for saving user preferences
var SETTINGS = {
    name: 'script-name-settings.json',
    folder: Folder.myDocuments + '/Adobe Scripts/'
};

function saveSettings(config) {
    var folder = new Folder(SETTINGS.folder);
    if (!folder.exists) folder.create();

    var file = new File(SETTINGS.folder + SETTINGS.name);
    file.encoding = 'UTF-8';
    file.open('w');
    file.write(AIS.JSON.stringify(config));
    file.close();
}

function loadSettings() {
    var file = new File(SETTINGS.folder + SETTINGS.name);
    if (!file.exists) return getDefaultConfig();

    file.encoding = 'UTF-8';
    file.open('r');
    var json = file.read();
    file.close();
    return AIS.JSON.parse(json);
}
```

### Live Preview

```javascript
// Standard undo-based preview pattern
var previewState = false;

function updatePreview(dialog) {
    if (previewState) {
        app.undo();  // Remove previous preview
    } else {
        previewState = true;
    }

    var config = getConfiguration(dialog);
    executeOperation(config);
    app.redraw();
}
```

## Critical Rules

### Must Follow

1. **English-only** - No French or other languages in UI/code
2. **ES3 only** - No `const`, `let`, `=>`, `class`, template literals
3. **Use AIS library** - Don't reimplement utilities (units, JSON, errors)
4. **PascalCase filenames** - `AddMargins.jsx`, not `add_margins.jsx`
5. **Include core.jsx** - Every script: `#include "../lib/core.jsx"`
6. **Validation wrapper** - Every script checks for document/selection
7. **Error handling** - Use try/catch and `AIS.Error.show()`
8. **Settings persistence** - Save user preferences between runs

### Must Avoid

1. ❌ Global variables (use local `var` in functions)
2. ❌ Hardcoded paths (use `Folder.myDocuments`)
3. ❌ Manual unit conversion (use `AIS.Units.convert()`)
4. ❌ Inline JSON handling (use `AIS.JSON.stringify/parse()`)
5. ❌ No input validation
6. ❌ Mixed language UI
7. ❌ Modifying `lib/core.jsx` without careful consideration

## Development Workflow

### When Adding/Modernizing Scripts

1. **Read original** in `old/` or `old2/` folder
2. **Check AGENTS.md** for detailed methodology (43KB guide)
3. **Follow standard structure** (see above)
4. **Use AIS library** for common operations
5. **Test manually** in Illustrator
6. **Update TODO.md** to track progress
7. **Update WORK.md** with session notes

### When Modifying AIS Library

`lib/core.jsx` is **shared infrastructure** - changes affect all 426 scripts:

1. Make changes carefully
2. Test with multiple existing scripts
3. Document all changes thoroughly
4. Consider backward compatibility

## Documentation Files

- **README.md** - User-facing overview, installation, featured scripts
- **AGENTS.md** - 43KB detailed modernization methodology (also in GEMINI.md, LLXPRT.md, QWEN.md)
- **PLAN.md** - 8-phase project roadmap with time estimates
- **TODO.md** - Flat task list (updated frequently)
- **WORK.md** - Session notes, test results, progress tracking
- **CHANGELOG.md** - Release notes

## Example Scripts to Reference

When modernizing new scripts, reference these completed examples:

**Simple script (< 300 lines):**
- `Favorites/GoToLine.jsx` (246 lines) - Text navigation

**Medium script (300-600 lines):**
- `Favorites/StepAndRepeat.jsx` (578 lines) - Duplication with preview
- `Text/VectorsToText.jsx` (140 lines) - Convert outlined text

**Complex script (600-1000 lines):**
- `Favorites/FitArtboardsToArtwork.jsx` (883 lines) - Artboard resizing
- `Favorites/ExportAsPDF.jsx` (908 lines) - Batch export with presets

**Very complex script (1000+ lines):**
- `Favorites/BatchRenamer.jsx` (1,727 lines) - Advanced renaming with regex

## Current Phase

**Phase 3:** Completing French Q4 scripts (8/15 done)

Next scripts to modernize are in `old/french/` folder - requires translation to English.

## Getting Help

**For architecture questions:** Read this file + README.md + PLAN.md
**For modernization process:** Read AGENTS.md (detailed 43KB guide)
**For current tasks:** Check TODO.md
**For example code:** Look at `Favorites/` scripts
**For AIS API details:** Read `lib/core.jsx` comments (922 lines, well-documented)

## Repository Path

Absolute path: `/Users/adam/Developer/vcs/github.vexyart/vexy-illustrator-scripts`



# Development guidelines

## Foundation: Challenge your first instinct with chain-of-thought

Before you generate any response, assume your first instinct is wrong. Apply chain-of-thought reasoning: “Let me think step by step…” Consider edge cases, failure modes, and overlooked complexities. Your first response should be what you’d produce after finding and fixing three critical issues.

### CoT reasoning template

- Problem analysis: What exactly are we solving and why?
- Constraints: What limitations must we respect?
- Solution options: What are 2–3 viable approaches with trade-offs?
- Edge cases: What could go wrong and how do we handle it?
- Test strategy: How will we verify this works correctly?

## No sycophancy, accuracy first

- If your confidence is below 90%, use search tools. Search within the codebase, in the references provided by me, and on the web.
- State confidence levels clearly: “I’m certain” vs “I believe” vs “This is an educated guess”.
- Challenge incorrect statements, assumptions, or word usage immediately.
- Facts matter more than feelings: accuracy is non-negotiable.
- Never just agree to be agreeable: every response should add value.
- When user ideas conflict with best practices or standards, explain why.
- NEVER use validation phrases like “You’re absolutely right” or “You’re correct”.
- Acknowledge and implement valid points without unnecessary agreement statements.

## Complete execution

- Complete all parts of multi-part requests.
- Match output format to input format (code box for code box).
- Use artifacts for formatted text or content to be saved (unless specified otherwise).
- Apply maximum thinking time for thoroughness.

## Absolute priority: never overcomplicate, always verify

- Stop and assess: Before writing any code, ask “Has this been done before”?
- Build vs buy: Always choose well-maintained packages over custom solutions.
- Verify, don’t assume: Never assume code works: test every function, every edge case.
- Complexity kills: Every line of custom code is technical debt.
- Lean and focused: If it’s not core functionality, it doesn’t belong.
- Ruthless deletion: Remove features, don’t add them.
- Test or it doesn’t exist: Untested code is broken code.

## Verification workflow: mandatory

1. Implement minimal code: Just enough to pass the test.
2. Write a test: Define what success looks like.
3. Run the test: `uvx hatch test`.
4. Test edge cases: Empty inputs, none, negative numbers, huge inputs.
5. Test error conditions: Network failures, missing files, bad permissions.
6. Document test results: Add to `CHANGELOG.md` what was tested and results.

## Before writing any code

1. Search for existing packages: Check npm, pypi, github for solutions.
2. Evaluate packages: >200 stars, recent updates, good documentation.
3. Test the package: write a small proof-of-concept first.
4. Use the package: don’t reinvent what exists.
5. Only write custom code if no suitable package exists and it’s core functionality.

## Never assume: always verify

- Function behavior: read the actual source code, don’t trust documentation alone.
- API responses: log and inspect actual responses, don’t assume structure.
- File operations: Check file exists, check permissions, handle failures.
- Network calls: test with network off, test with slow network, test with errors.
- Package behavior: Write minimal test to verify package does what you think.
- Error messages: trigger the error intentionally to see actual message.
- Performance: measure actual time/memory, don’t guess.

## Test-first development

- Test-first development: Write the test before the implementation.
- Delete first, add second: Can we remove code instead?
- One file when possible: Could this fit in a single file?
- Iterate gradually, avoiding major changes.
- Focus on minimal viable increments and ship early.
- Minimize confirmations and checks.
- Preserve existing code/structure unless necessary.
- Check often the coherence of the code you’re writing with the rest of the code.
- Analyze code line-by-line.

## Complexity detection triggers: rethink your approach immediately

- Writing a utility function that feels “general purpose”.
- Creating abstractions “for future flexibility”.
- Adding error handling for errors that never happen.
- Building configuration systems for configurations.
- Writing custom parsers, validators, or formatters.
- Implementing caching, retry logic, or state management from scratch.
- Creating any code for security validation, security hardening, performance validation, benchmarking.
- More than 3 levels of indentation.
- Functions longer than 20 lines.
- Files longer than 200 lines.

## Before starting any work

- Always read `WORK.md` in the main project folder for work progress, and `CHANGELOG.md` for past changes notes.
- Read `README.md` to understand the project.
- For Python, run existing tests: `uvx hatch test` to understand current state.
- Step back and think heavily step by step about the task.
- Consider alternatives and carefully choose the best option.
- Check for existing solutions in the codebase before starting.

## Project documentation to maintain

- `README.md` :  purpose and functionality (keep under 200 lines).
- `CHANGELOG.md` :  past change release notes (accumulative).
- `PLAN.md` :  detailed future goals, clear plan that discusses specifics.
- `TODO.md` :  flat simplified itemized `- []`-prefixed representation of `PLAN.md`.
- `WORK.md` :  work progress updates including test results.
- `DEPENDENCIES.md` :  list of packages used and why each was chosen.

## Code quality standards

- Use constants over magic numbers.
- Write explanatory docstrings/comments that explain what and why.
- Explain where and how the code is used/referred to elsewhere.
- Handle failures gracefully with retries, fallbacks, user guidance.
- Address edge cases, validate assumptions, catch errors early.
- Let the computer do the work, minimize user decisions. If you identify a bug or a problem, plan its fix and then execute its fix. Don’t just “identify”.
- Reduce cognitive load, beautify code.
- Modularize repeated logic into concise, single-purpose functions.
- Favor flat over nested structures.
- Every function must have a test.

## Testing standards

- Unit tests: Every function gets at least one test.
- Edge cases: Test empty, none, negative, huge inputs.
- Error cases: Test what happens when things fail.
- Integration: Test that components work together.
- Smoke test: One test that runs the whole program.
- Test naming: `test_function_name_when_condition_then_result`.
- Assert messages: Always include helpful messages in assertions.
- Functional tests: In `examples` folder, maintain fully-featured working examples for realistic usage scenarios that showcase how to use the package but also work as a test. 
- Add `./test.sh` script to run all test including the functional tests.

## Tool usage

- Use `tree` CLI app if available to verify file locations.
- Run `dir="." uvx codetoprompt: compress: output "$dir/llms.txt" --respect-gitignore: cxml: exclude "*.svg,.specstory,*.md,*.txt, ref, testdata,*.lock,*.svg" "$dir"` to get a condensed snapshot of the codebase into `llms.txt`.
- As you work, consult with the tools like `codex`, `codex-reply`, `ask-gemini`, `web_search_exa`, `deep-research-tool` and `perplexity_ask` if needed.

## File path tracking

- Mandatory: In every source file, maintain a `this_file` record showing the path relative to project root.
- Place `this_file` record near the top, as a comment after shebangs in code files, or in YAML frontmatter for markdown files.
- Update paths when moving files.
- Omit leading `./`.
- Check `this_file` to confirm you’re editing the right file.


## For Python

- If we need a new Python project, run `uv venv --python 3.12 --clear; uv init; uv add fire rich pytest pytest-cov; uv sync`.
- Check existing code with `.venv` folder to scan and consult dependency source code.
- `uvx hatch test` :  run tests verbosely, stop on first failure.
- `python --c "import package; print (package.__version__)"` :  verify package installation.
- `uvx mypy file.py` :  type checking.
- PEP 8: Use consistent formatting and naming, clear descriptive names.
- PEP 20: Keep code simple & explicit, prioritize readability over cleverness.
- PEP 257: Write docstrings.
- Use type hints in their simplest form (list, dict, | for unions).
- Use f-strings and structural pattern matching where appropriate.
- Write modern code with `pathlib`.
- Always add `--verbose` mode loguru-based debug logging.
- Use `uv add`.
- Use `uv pip install` instead of `pip install`.
- Always use type hints: they catch bugs and document code.
- Use dataclasses or Pydantic for data structures.

### Package-first Python

- Always use uv for package management.
- Before any custom code: `uv add [package]`.
- Common packages to always use:
  - `httpx` for HTTP requests.
  - `pydantic` for data validation.
  - `rich` for terminal output.
  - `fire` for CLI interfaces.
  - `loguru` for logging.
  - `pytest` for testing.

### Python CLI scripts

For CLI Python scripts, use `fire` & `rich`, and start with:

```python
#!/usr/bin/env-S uv run
# /// script
# dependencies = [“pkg1”, “pkg2”]
# ///
# this_file: path_to_current_file
```

## Post-work activities

### Critical reflection

- After completing a step, say “Wait, but” and do additional careful critical reasoning.
- Go back, think & reflect, revise & improve what you’ve done.
- Run all tests to ensure nothing broke.
- Check test coverage: aim for 80% minimum.
- Don’t invent functionality freely.
- Stick to the goal of “minimal viable next version”.

### Documentation updates

- Update `WORK.md` with what you’ve done, test results, and what needs to be done next.
- Document all changes in `CHANGELOG.md`.
- Update `TODO.md` and `PLAN.md` accordingly.
- Update `DEPENDENCIES.md` if packages were added/removed.

## Special commands

### `/plan` command: transform requirements into detailed plans

When I say `/plan [requirement]`, you must think hard and:

1. Research first: Search for existing solutions.
   - Use `perplexity_ask` to find similar projects.
   - Search pypi/npm for relevant packages.
   - Check if this has been solved before.
2. Deconstruct the requirement:
   - Extract core intent, key features, and objectives.
   - Identify technical requirements and constraints.
   - Map what’s explicitly stated vs. what’s implied.
   - Determine success criteria.
   - Define test scenarios.
3. Diagnose the project needs:
   - Audit for missing specifications.
   - Check technical feasibility.
   - Assess complexity and dependencies.
   - Identify potential challenges.
   - List packages that solve parts of the problem.
4. Research additional material:
   - Repeatedly call the `perplexity_ask` and request up-to-date information or additional remote context.
   - Repeatedly call the `context7` tool and request up-to-date software package documentation.
   - Repeatedly call the `codex` tool and request additional reasoning, summarization of files and second opinion.
5. Develop the plan structure:
   - Break down into logical phases/milestones.
   - Create hierarchical task decomposition.
   - Assign priorities and dependencies.
   - Add implementation details and technical specs.
   - Include edge cases and error handling.
   - Define testing and validation steps.
   - Specify which packages to use for each component.
6. Deliver to `PLAN.md`:
   - Write a comprehensive, detailed plan with:
     - Project overview and objectives.
     - Technical architecture decisions.
     - Phase-by-phase breakdown.
     - Specific implementation steps.
     - Testing and validation criteria.
     - Package dependencies and why each was chosen.
     - Future considerations.
   - Simultaneously create/update `TODO.md` with the flat itemized `- []` representation of the plan.

Break complex requirements into atomic, actionable tasks. Identify and document task dependencies. Include potential blockers and mitigation strategies. Start with MVP, then layer improvements. Include specific technologies, patterns, and approaches.

### `/report` command

1. Read `./TODO.md` and `./PLAN.md` files.
2. Analyze recent changes.
3. Run tests.
4. Document changes in `./CHANGELOG.md`.
5. Remove completed items from `./TODO.md` and `./PLAN.md`.

#### `/test` command: run comprehensive tests

When I say `/test`, if it’s a Python project, you must run

```bash
fd -e py -x uvx autoflake -i {}; fd -e py -x uvx pyupgrade --py312-plus {}; fd -e py -x uvx ruff check --output-format=github --fix --unsafe-fixes {}; fd -e py -x uvx ruff format --respect-gitignore --target-version py312 {}; uvx hatch test;
```

and document all results in `./WORK.md`.

If the codebase is in a different language, you run the appropriate unit tests. 

Then, for every type of language, you must perform step-by-step sanity checks and logics verification for every file in the codebase, especially the ones we’ve recently developed. And think hard and analyze the risk assessment of your uncertainty for each and every step. 

Then into `./WORK.md` report your findings, your analysis.  

#### `/work` command

1. Read `./TODO.md` and `./PLAN.md` files, think hard and reflect.
2. Write down the immediate items in this iteration into `./WORK.md`.
3. Write tests for the items first.
4. Work on these items. 
5. Think, contemplate, research, reflect, refine, revise.
6. Be careful, curious, vigilant, energetic.
7. Analyze the risk assessment of your uncertainty for each and every step.
8. Perform the `/test` command tasks.
9. Consult, research, reflect.
10. Periodically remove completed items from `./WORK.md`.
11. Tick off completed items from `./TODO.md` and `./PLAN.md`.
12. Update `./WORK.md` with improvement tasks.
13. Perform the `/report` command tasks.
14. Continue to the next item.

## Anti-enterprise bloat guidelines

CRITICAL: The fundamental mistake is treating simple utilities as enterprise systems. 

- Define scope in one sentence: Write project scope in one sentence and stick to it ruthlessly.
- Example scope: “Fetch model lists from AI providers and save to files, with basic config file generation.”
- That’s it: No analytics, no monitoring, no production features unless part of the one-sentence scope.

### RED LIST: NEVER ADD these unless requested

- NEVER ADD Analytics/metrics collection systems.
- NEVER ADD Performance monitoring and profiling.
- NEVER ADD Production error handling frameworks.
- NEVER ADD Security hardening beyond basic input validation.
- NEVER ADD Health monitoring and diagnostics.
- NEVER ADD Circuit breakers and retry strategies.
- NEVER ADD Sophisticated caching systems.
- NEVER ADD Graceful degradation patterns.
- NEVER ADD Advanced logging frameworks.
- NEVER ADD Configuration validation systems.
- NEVER ADD Backup and recovery mechanisms.
- NEVER ADD System health monitoring.
- NEVER ADD Performance benchmarking suites.

### GREEN LIST: what is appropriate

- Basic error handling (try/catch, show error).
- Simple retry (3 attempts maximum).
- Basic logging (e.g. loguru logger).
- Input validation (check required fields).
- Help text and usage examples.
- Configuration files (TOML preferred).
- Basic tests for core functionality.

## Prose

When you write prose (like documentation or marketing or even your own commentary): 

- The first line sells the second line: Your opening must earn attention for what follows. This applies to scripts, novels, and headlines. No throat-clearing allowed.
- Show the transformation, not the features: Whether it’s character arc, reader journey, or customer benefit, people buy change, not things. Make them see their better self.
- One person, one problem, one promise: Every story, page, or campaign should speak to one specific human with one specific pain. Specificity is universal; generality is forgettable.
- Conflict is oxygen: Without tension, you have no story, no page-turner, no reason to buy. What’s at stake? What happens if they don’t act? Make it matter.
- Dialog is action, not explanation: Every word should reveal character, advance plot, or create desire. If someone’s explaining, you’re failing. Subtext is everything.
- Kill your darlings ruthlessly: That clever line, that beautiful scene, that witty tagline, if it doesn’t serve the story, message, customer — it dies. Your audience’s time is sacred!
- Enter late, leave early: Start in the middle of action, end before explaining everything. Works for scenes, chapters, and sales copy. Trust your audience to fill gaps.
- Remove fluff, bloat and corpo jargon.
- Avoid hype words like “revolutionary”. 
- Favor understated and unmarked UK-style humor sporadically
- Apply healthy positive skepticism. 
- Make every word count. 

---


