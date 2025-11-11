
# Adobe Illustrator Scripting Essentials 

This document is a practical, modern guide to automating Adobe Illustrator. It prioritizes production‑ready ExtendScript (ES3) while preparing you for CEP panels, Python/COM, and the eventual UXP future.

Contents
1. The Landscape: Illustrator Automation Today — TLDR: ExtendScript is king; CEP for panels; Python COM on Windows; monitor UXP.
2. Environment Setup: Editors, Debugging, and Structure — TLDR: VS Code + ExtendedScript Debugger; reproducible folders; safe run patterns.
3. ExtendScript Fundamentals (ES3) — TLDR: ES3 syntax only; portability; patterns for JSON, arrays, errors.
4. The Illustrator Object Model (DOM) — TLDR: `app → documents → layers → pageItems`; selections, bounds, units.
5. Geometry and Path Operations — TLDR: create/measure/transform paths; precision with points; safe iteration.
6. Working with Text and Typography — TLDR: text frames, ranges, fonts, attributes; batch edits.
7. Colors, Swatches, and Appearance — TLDR: RGB/CMYK/Gray, graphic styles; appearance caveats.
8. Layers, Groups, and Artboards — TLDR: structure, visibility/locks; artboard API; document presets.
9. Import, Export, and Batch Processing — TLDR: `exportFile()` families; batch patterns; file safety.
10. User Interfaces: ScriptUI and CEP Panels — TLDR: dialogs vs panels; when to choose which; glue code.
11. Python and External Automation (COM/JXA) — TLDR: Windows COM parity; macOS via AppleScript/JXA; orchestration.
12. Beyond Scripts: UXP, Patterns, and Creative Algorithms — TLDR: UXP status; algorithmic drawing (circle packing, noise), maintainability.

Chapter TLDRs
- 01: Choose ExtendScript for reliability; wrap scripts with guards and actionable errors; keep to ES3.
- 02: Use VS Code; define launch configs; isolate run harness; add a standard header for safety.
- 03: Replace modern JS features with ES3 equivalents; centralize shims; avoid surprises.
- 04: Master collections, bounds, units; always validate selection and active document.
- 05: Understand Bezier vs polyline; transforms; coordinate system; predictable geometry.
- 06: Target `TextFrame` vs `TextRange`; fonts and attributes; batch replace safely.
- 07: Convert/assign colors correctly; mind appearance stacks; swatch hygiene.
- 08: Leverage layers for organization; manage locks/visibility; artboard utilities.
- 09: Use the right export options; file I/O safety; iterative batch sequences.
- 10: ScriptUI for quick tools; CEP for rich panels; wire `evalScript` cleanly.
- 11: Python COM mirrors DOM; JXA bridge on macOS; log and recover.
- 12: Design for maintainability; annotate algorithms; prepare for UXP migration.


------------------------------------------------------------


# 1. The Landscape: Illustrator Automation Today

Adobe Illustrator can be automated through three primary avenues:

- ExtendScript (JSX): mature, cross‑platform, deepest coverage; ES3 syntax.
- CEP panels: HTML/CSS/JS UI packaged as an extension; calls ExtendScript behind the scenes.
- Python via COM (Windows): external orchestration that mirrors the DOM.

UXP (Unified Extensibility Platform) is Adobe’s modern path, but Illustrator’s public UXP support trails Photoshop’s. Plan migrations, but build production flows on ExtendScript/CEP today.

Strengths and trade‑offs
- ExtendScript: fast to deploy; ships as a single `.jsx`; constrained language; ScriptUI is basic but capable.
- CEP: rich UI/UX and UX flow; requires manifest and debug config; bridge to ExtendScript adds complexity.
- Python/COM: superb for batch pipelines and integrations; Windows only; limited introspection.

Decision rubric
- Single‑shot automation (menus, batch): ExtendScript.
- Persistent panels/rich UI: CEP.
- External orchestration (watch folders, pipelines): Python/COM.

Safety baseline for all approaches
- Validate app/document/selection; fail with helpful messages.
- Keep geometry predictable (units, bounds types).
- Log steps in a consistent, minimal format.


------------------------------------------------------------


# 2. Environment Setup: Editors, Debugging, and Structure

Use modern tooling to replace ExtendScript Toolkit.

Recommended stack
- VS Code with “Extended Script Debugger”.
- Optional: typings for Illustrator to improve IntelliSense.
- Structured folders and a run harness.

Baseline project layout
```
scripts/
  common/
    json.jsx            # JSON shim if needed
    util.jsx            # guards, logging, selection helpers
  examples/
    hello.jsx
  main.jsx
```

Launch configurations (concept)
- Current file run
- Attach to host (Illustrator) and step through

Safe run harness (ES3)
```javascript
//@target illustrator
(function main(){
  if (app.documents.length === 0) app.documents.add();
  try {
    run();
  } catch (e) {
    alert('Script error:\n' + e);
  }
})();

function run(){
  var doc = app.activeDocument;
  // ... implementation ...
}
```

Repeatability
- Keep scripts idempotent where possible.
- Log key actions for later debugging (e.g., created paths count, export targets).


------------------------------------------------------------


# 3. ExtendScript Fundamentals (ES3)

ExtendScript adheres to ES3 (1999). That implies:
- Only `var` (no `let/const`).
- No arrow functions; only `function () {}`.
- No Promises/async/await.
- Array helpers like `map/filter/forEach` are absent.
- JSON may require a shim depending on host.

Practical patterns
```javascript
// Array iteration
for (var i = 0; i < arr.length; i++) {
  var item = arr[i];
}

// JSON (if missing)
if (!this.JSON || !JSON.parse) {
  //@include 'common/json.jsx' // provide safe polyfill
}

// Object extend (shallow)
function extend(t, s){
  for (var k in s) if (s.hasOwnProperty(k)) t[k] = s[k];
  return t;
}
```

Preprocessor directives
- `//@target illustrator` to ensure correct host.
- `//@include 'path/to/file.jsx'` for shared utilities.

Error handling
```javascript
try { /* risky code */ }
catch (e) { alert('Error: ' + e); }
```

String and number hygiene
- Use `Number()` when parsing dialog inputs.
- Validate ranges and units before geometry operations.


------------------------------------------------------------


# 4. The Illustrator Object Model (DOM)

Hierarchy
- `app` (Application) → `documents` → `Document` → `layers` → `pageItems` (paths, groups, text, etc.).

Core accessors
```javascript
var appRef = app;
var docs = appRef.documents;
var doc = appRef.activeDocument;
var layer = doc.layers[0];
var items = doc.pageItems; // group, path, text, etc.
```

Selections
```javascript
var sel = doc.selection;
if (!sel || sel.length === 0) { alert('Select something'); }
``;

Bounds and coordinates
- Points are the default units.
- `geometricBounds` vs `visibleBounds`: geometric excludes effects; visible includes stroke/effects.

Rectangles and coordinates
```javascript
// rectangle(top, left, width, height)
var rect = doc.pathItems.rectangle(700, 50, 100, 100);
```

Collections
```javascript
for (var i = 0; i < doc.layers.length; i++) {
  var lyr = doc.layers[i];
}
```

Common classes to learn
- `PathItem`, `PathPoint`, `TextFrame`, `CharacterAttributes`, `RGBColor`, `CMYKColor`, `Swatch`, `ExportOptions*`.

Units utility (simple)
```javascript
// Points to mm (1 in = 72 pt; 25.4 mm in)
function pt2mm(pt){ return pt * 25.4 / 72; }
```


------------------------------------------------------------


# 5. Geometry and Path Operations

Creating shapes
```javascript
var layer = app.activeDocument.layers[0];
var rect = layer.pathItems.rectangle(700, 50, 100, 100);
var circ = layer.pathItems.ellipse(700, 50, 100, 100);
```

PathItem basics
- `stroked` / `filled`, `strokeColor` / `fillColor`, `opacity`.
- `translate`, `rotate`, `resize` affect geometry.

Bezier vs polyline
- Use `pathPoints` to read/write anchors and handles.
```javascript
var p = rect.pathPoints[0];
p.anchor = [0,0]; p.leftDirection = [0,0]; p.rightDirection = [0,0]; p.pointType = PointType.CORNER;
```

Transforms
```javascript
rect.rotate(30, true, true, true, true, Transformation.CENTER);
rect.resize(120, 120); // percent
rect.translate(10, -20);
```

Iteration patterns
```javascript
var i, it;
for (i = 0; i < app.activeDocument.pathItems.length; i++) {
  it = app.activeDocument.pathItems[i];
  // guard types; skip guides/clipping as needed
}
```

Precision
- Keep a small epsilon when comparing coordinates.
- Prefer integer rounding for exported dimensions when appropriate.


------------------------------------------------------------


# 6. Working with Text and Typography

Creating text
```javascript
var doc = app.activeDocument;
var rect = doc.pathItems.rectangle(700, 50, 200, 100);
var tf = doc.textFrames.areaText(rect);
tf.contents = 'Hello Typography';
```

Attributes
```javascript
var attrs = tf.textRange.characterAttributes;
attrs.size = 12;              // pt
attrs.strokeColor = new RGBColor();
attrs.strokeColor.red = 0; attrs.strokeColor.green = 0; attrs.strokeColor.blue = 0;
attrs.fillColor = new RGBColor();
attrs.fillColor.red = 255; attrs.fillColor.green = 0; attrs.fillColor.blue = 0;
```

Fonts
```javascript
// Inspect selected text frame
var t = app.selection[0];
var a = t.textRange.characterAttributes;
var font = a.textFont; // family/style
```

Ranges and replacement
```javascript
// Replace in multiple frames (simplified)
var sel = app.activeDocument.selection;
for (var i = 0; i < sel.length; i++) {
  if (sel[i].typename === 'TextFrame') {
    sel[i].contents = sel[i].contents.replace(/foo/g, 'bar');
  }
}
```

Threaded frames
- Multi-frame text uses `nextFrame` / `previousFrame`; operate through chains with care.

Best practices
- Validate selection types; avoid partially formatted surprises; document unit assumptions for sizes/leading.


------------------------------------------------------------


# 7. Colors, Swatches, and Appearance

Color models
- `RGBColor`, `CMYKColor`, `GrayColor` classes assignable to `fillColor` / `strokeColor`.

Examples
```javascript
function rgb(r,g,b){ var c = new RGBColor(); c.red=r; c.green=g; c.blue=b; return c; }
var path = app.activeDocument.pathItems.rectangle(700, 50, 100, 100);
path.filled = true; path.fillColor = rgb(255,0,0);
```

Swatches and styles
- Access existing swatches via `document.swatches`; apply with consistency.
- Graphic styles can encapsulate appearance stacks; some scripts (like Outliner) choose to bypass complex appearances.

Appearance caveats
- Visible bounds vs geometric bounds differ with stroke/effects.
- CMYK vs RGB differences show up when crossing environments (CEP canvas, Paper.js).

Opacity and blending
```javascript
path.opacity = 60; // percent
```

Best practices
- Normalize palette usage; avoid duplicated swatches; document color-space assumptions for export.


------------------------------------------------------------


# 8. Layers, Groups, and Artboards

Layers
```javascript
var doc = app.activeDocument;
var lyr = doc.layers.add();
lyr.name = 'Generated';
```

Locking and visibility
```javascript
lyr.locked = false; lyr.visible = true;
```

Groups
```javascript
var g = doc.groupItems.add();
// move path into group
path.move(g, ElementPlacement.PLACEATBEGINNING);
```

Artboards
```javascript
var abs = doc.artboards;
var ab = abs[abs.getActiveArtboardIndex()];
var rect = ab.artboardRect; // [left, top, right, bottom]
```

Document presets
- Use `DocumentPreset` to standardize sizes/units for batch creation.

Organization patterns
- Name layers/groups predictably; mirror input structure; avoid colliding z-order unless intentional.


------------------------------------------------------------


# 9. Import, Export, and Batch Processing

Export overview
- Call `document.exportFile(File(path), ExportType.<FORMAT>, options)` where options is the matching `ExportOptions*` object.

PNG example
```javascript
var f = new File(Folder.desktop + '/out.png');
var opt = new ExportOptionsPNG24();
opt.transparency = true; opt.artBoardClipping = true;
app.activeDocument.exportFile(f, ExportType.PNG24, opt);
```

JPEG, SVG, TIFF
- Create `ExportOptionsJPEG` / `ExportOptionsSVG` / `ExportOptionsTIFF` and set appropriate fields (`qualitySetting`, `embedRasterImages`, `resolution` …).

Batch pattern
```javascript
var files = Folder('~/input').getFiles('*.ai');
for (var i=0; i<files.length; i++) {
  var d = app.open(files[i]);
  try { /* transform/export */ }
  finally { d.close(SaveOptions.DONOTSAVECHANGES); }
}
```

Safety
- Guard file existence and permissions; avoid overwriting without explicit intent; log outcomes.


------------------------------------------------------------


# 10. User Interfaces: ScriptUI and CEP Panels

ScriptUI (ExtendScript dialogs)
- Build modal dialogs quickly; perfect for parameter input and simple previews.
```javascript
var w = new Window('dialog', 'My Tool');
w.add('statictext', undefined, 'Size (pt)');
var s = w.add('edittext', undefined, '12'); s.characters = 6;
var ok = w.add('button', undefined, 'OK');
if (w.show() === 1) {
  var size = Number(s.text);
}
```

CEP panels (HTML/CSS/JS)
- Use `CSXS/manifest.xml` + `CSInterface.js` to bridge UI → `evalScript()` → `.jsx`.
- Pros: rich UI/UX, persistent panels, ecosystem of web libs.
- Trade‑offs: packaging, debug flags, bridge complexity.

When to choose which
- ScriptUI for quick tools without installation.
- CEP for extensions that need persistent UI, theming, and advanced interactions.

Glue example (CEP → JSX concept)
```javascript
// JS (client)
new CSInterface().evalScript('doWork(' + JSON.stringify(payload) + ')');
// JSX (host)
function doWork(json){ var cfg = JSON.parse(json); /* ... */ }
```


------------------------------------------------------------


# 11. Python and External Automation (COM/JXA)

Windows (COM)
```python
from win32com.client import Dispatch
app = Dispatch('Illustrator.Application')
doc = app.Documents.Add()
rect = doc.PathItems.Rectangle(700, 50, 100, 100)
doc.TextFrames.AreaText(rect).Contents = 'Automated by Python'
```

Patterns
- DOM closely mirrors ExtendScript; capitalization differs.
- Ideal for batch orchestration, conversions, and cross‑app workflows.

macOS (AppleScript/JXA bridge)
- Call AppleScript/JXA from Python (`subprocess` + `osascript`) to run JavaScript in Illustrator.

Reliability
- Detect host availability; catch COM exceptions; log failures with file paths and action names.


------------------------------------------------------------


# 12. Beyond Scripts: UXP, Patterns, and Creative Algorithms

UXP status
- Illustrator’s public UXP support lags Photoshop; monitor announcements, but don’t block production on it.

Migration mindset
- Isolate business logic from host APIs; design adapters; document assumptions; keep UI separable.

Creative algorithms
- Circle packing: triangulation, incircle tangency, iterative convergence — demonstrates geometry pipelines.
- Noise-driven transforms: Perlin/Simplex noise to drive color, rotation, scale — shows random-but-controlled variation.
- Outliner: explicit anchor/handle rendering — illustrates advanced traversal, naming, and z-ordering.

Maintainability patterns
- Small, single-purpose functions; guard preconditions; explain bounds and units; prefer readable geometry to cleverness.
- Add preview modes that undo cleanly; never leave documents in an unexpected state on error.

Preparing for the future
- Keep code ES3-compatible until UXP is first-class; plan CEP-to-UXP transitions; maintain script collections with clear headers and usage docs.

---


This guide is licensed by Adobe and protected by copyright. It may not be reproduced without Adobe's written permission.

The content is for informational purposes only, is subject to change, and Adobe is not liable for any errors or inaccuracies. Respect the copyright of other artists and obtain permission before using their work. Company names in any samples are fictional and for demonstration purposes only.

Adobe, the Adobe logo, Acrobat, Illustrator, Macromedia, and Photoshop are trademarks of Adobe Incorporated. JavaScript and all Java-related marks are trademarks of Sun Microsystems. All other trademarks belong to their respective owners.

**Adobe Incorporated**
345 Park Avenue, San Jose, California 95110, USA

For U.S. Government end users, the software is licensed as a "Commercial Item" with only the rights granted to all other end users. Adobe complies with all applicable equal opportunity laws, including Executive Order 11246, the Vietnam Era Veterans Readjustment Assistance Act of 1974, and the Rehabilitation Act of 1973.

---

# Contents

- **1 JavaScript Object Reference**
  - `Application`
  - `Artboard`
  - `Artboards`
  - `Brush`
  - `Brushes`
  - `CharacterAttributes`
  - `Characters`
  - `Characterstyle`
  - `Characterstyles`
  - `CMYKColor`
  - `Color`
  - `Com pound Path Item`
  - `Com pound Path Items`
  - `Dataset`
  - `Datasets`
  - `Document`
  - `Documentpreset`
  - `Documents`
  - `EPSSaveOptions`
  - `ExportForScreens`
  - `ExportOptionsAutoCAD`
  - `ExportOptionsGIF`
  - `ExportOptionsJPEG`
  - `ExportOptionsPhotoshop`
  - `ExportOptionsPNG8`
  - `ExportOptionsPNG24`
  - `ExportOptionsSVG`
  - `ExportOptionsTIFF`
  - `ExportOptionsWebP`
  - `FXGSaveOptions`
  - `Gradient`
  - `Gradientcolor`
  - `Gradients`
  - `Gradientstop`
  - `Gradientstops`
  - `Graphicstyle`
  - `Graphicstyles`
  - `Graphitem`
  - `Graphitems`
  - `GrayColor`
  - `GridRepeatConfig`
  - `GridRepeatltem`
  - `GridRepeatltems`
  - `GridRepeatUpdate`
  - `Groupltem`
  - `Groupltems`
  - `IllustratorSaveOptions`
  - `ImageCaptureOptions`
  - `Ink`
  - `Inkinfo`
  - `InsertionPoint`
  - `InsertionPoints`
  - `LabColor`
  - `Layer`
  - `Layers`
  - `LegacyTextltem`
  - `LegacyTextltems`
  - `Lines`
  - `Matrix`
  - `Mesh Item`
  - `Mesh Items`
  - `NoColor`
  - `NonNativeitem`
  - `NonNativeitems`
  - `OpenOptions`
  - `OpenOptionsAutoCAD`
  - `OpenOptionsFreeHand`
  - `OpenOptionsPhotoshop`
  - `Pageltem`
  - `Pageltems`
  - `Paper`
  - `Paperinfo`
  - `ParagraphAttributes`
  - `Paragraphs`
  - `Paragraphstyle`
  - `Paragraphstyles`
  - `Pathitem`
  - `Pathitems`
  - `PathPoint`
  - `PathPoints`
  - `Pattern`
  - `PatternColor`
  - `Patterns`
  - `PDFFileOptions`
  - `PDFSaveOptions`
  - `PhotoshopFileOptions`
  - `Placed Item`
  - `Placed Items`
  - `Pluginitem`
  - `Pluginitems`
  - `PPDFile`
  - `PPDFilelnfo`
  - `Preferences`
  - `PrintColorManagementOptions`
  - `PrintColorSeparationOptions`
  - `PrintCoordinateOptions`
  - `Printer`
  - `Printerinfo`
  - `PrintFlattenerOptions`
  - `PrintFontOptions`
  - `PrintJobOptions`
  - `PrintOptions`
  - `PrintPageMarksOptions`
  - `PrintPaperOptions`

  - `Tags`
  - `TextFont`
  - `TextFonts`
  - `TextFrameltem`
  - `TextFrameltems`
  - `TextPath`
  - `TextRange`
  - `TextRanges`
  - `Tracingobject`
  - `TracingOptions`
  - `Variable`
  - `Variables`
  - `View`
  - `Views`
  - `Words`
- [2 Scripting Constants](#bookmark684)

# JavaScript Object Reference

This section details all object classes. Each class listing includes its properties, methods, notes, and sample code. Examples demonstrate syntax, not necessarily best practices.

## Application

The global `app` object, representing the Illustrator application.

### Application properties

| Property | Value type | Description |
| --- | --- | --- |
| activeDocument | Document | The frontmost document. |
| browserAvailable | boolean | R/O: True if a web browser is available. |
| buildNumber | string | R/O: The application's build number. |
| colorSettingsList | object | R/O: List of available color-settings files. |
| coordinateSystem | coordinatesystem | The current coordinate system (document or artboard). |
| defaultColorSettings | File | R/O: The default color-settings file for the current locale. |
| documents | Documents | R/O: The collection of open documents. |
| flattenerPresetList | object | R/O: List of available flattener preset names. |
| freeMemory | number (long) | R/O: Unused memory in bytes within the Illustrator partition. |
| HomeScreenVisible | boolean | R/O: True if the Home screen is visible. |
| locale | string | R/O: The application's locale. |
| name | string | R/O: The application's name. |
| pasteRememberLayers | boolean | R/O: True if paste maintains layer structure. |
| path | File | R/O: The file path to the application. |
| PDFPresetsList | object | R/O: List of available PDF preset names. |
| PPDFileList | object | R/O: List of available PPD files. |
| preferences | Preferences | The application's preference settings. |
| printerList | array of Printer | R/O: The list of installed printers. |
| printPresetsList | object | R/O: List of available print preset names. |
| scriptingVersion | string | R/O: The version of the Scripting plug-in. |
| selection | array of Objects | All selected objects in the active document. |
| startupPresetsList | object | R/O: List of presets for creating a new document. |
| textFonts | TextFonts | R/O: The installed fonts. |
| tracingPresetList | array of string | R/O: List of available tracing preset names. |
| typename | string | R/O: The class name of the object. |
| userInteractionLevel | UserInteractionLevel | The allowed level of user interaction during script execution. |
| version | string | R/O: The application's version. |
| visible | boolean | R/O: True if the application is visible. |

### Application methods

| Method | Parameters | Returns | Description |
| --- | --- | --- | --- |
| beep() | | nothing | Alerts the user. |
| concatenateMatrix(matrix, secondMatrix) | Matrix, Matrix | Matrix | Joins two matrices. |
| concatenateRotationMatrix(matrix, angle) | Matrix, number (double) | Matrix | Joins a rotation to a matrix. |
| concatenateScaleMatrix(matrix [,scaleX] [,scaleY]) | Matrix, number (double), number (double) | Matrix | Concatenates a scale to a matrix. |
| concatenateTranslationMatrix(matrix [,deltaX] [,deltaY]) | Matrix, number (double), number (double) | Matrix | Joins a translation to a matrix. |
| convertSampleColor(...) | | array of Colorcomponents | Converts a sample color from one color space to another. |
| copy() | | nothing | Copies selection to the clipboard. |
| cut() | | nothing | Cuts selection to the clipboard. |
| deleteWorkspace(workspaceName) | string | Boolean | Deletes an existing workspace. |
| getIdentityMatrix() | | Matrix | Returns an identity matrix. |
| getPPDFileInfo(name) | string | PPDFileInfo | Gets information for a specified PPD file. |
| getPresetFileOfType(presetType) | DocumentPresetType | File | Returns the path to the default document profile for a preset type. |
| getPresetSettings(preset) | string | DocumentPreset | Retrieves tracing-option settings from a preset name. |
| getRotationMatrix([angle]) | number (double) | Matrix | Returns a rotation matrix (angle in degrees). |
| getScaleMatrix([scaleX] [,scaleY]) | number (double), number (double) | Matrix | Returns a scale matrix (values in percentage). |
| getScriptableHelpGroup() | | variant | Gets the scriptable help group object. |
| getTranslationMatrix([deltaX] [,deltaY]) | number (double), number (double) | Matrix | Returns a translation matrix (values in points). |
| invertMatrix(matrix) | Matrix | Matrix | Inverts a matrix. |
| isEqualMatrix(matrix, secondMatrix) | Matrix, Matrix | boolean | Checks if two matrices are equal. |
| isSingularMatrix(Matrix) | Matrix | boolean | Checks if a matrix is singular (cannot be inverted). |
| loadColorSettings(fileSpec) | File | nothing | Loads color settings from a file. |
| open(file [, documentColorSpace] [, options]) | File, DocumentColorSpace, anything | Document | Opens a document. |
| OpenCloudDocument(cloudPath) | string | Document | Opens a cloud document. |
| paste() | | nothing | Pastes clipboard content. |
| quit() | | nothing | Quits Illustrator. |
| redo() | | nothing | Redoes the last undone transaction. |
| redraw() | | nothing | Forces Illustrator to redraw all windows. |
| resetWorkspace() | | Boolean | Resets the current workspace. |
| saveWorkspace(workspaceName) | string | Boolean | Saves a new workspace. |
| sendScriptMessage(...) | | string | Sends a command message to a plug-in. |
| showPresets(fileSpec) | File | printPresetList | Gets presets from a file. |
| switchWorkspace(workspaceName) | string | Boolean | Switches to a specified workspace. |
| translatePlaceholderText(text) | string | string | Translates placeholder text to regular text. |
| undo() | | nothing | Undoes the most recent transaction. |

#### Duplicating the active document

```javascript
// Duplicates any selected items from
// the active document into a new document.
var newItem;
var docSelected = app.activeDocument.selection;
if ( docSelected.length > 0 ) {
    var newDoc = app.documents.add();
    if ( docSelected.length > 0 ) {
        for ( i = 0; i < docSelected.length; i++ ) {
            docSelected [i] .selected = false;
            newItem = docSelected [i] .duplicate ( newDoc, Elementplacement.PLACEATEND );
        }
    }
    else {
        docSelected.selected = false;
        newItem = docSelected.parent.duplicate ( newDoc, Elementplacement.PLACEATEND );
    }
}
else {
    alert( "Please select one or more art objects" );
}
```

## Artboard

Represents a single artboard in a document (1 to 100 per document).

### Artboard properties

| Property | Value type | Description |
| --- | --- | --- |
| artboardRect | rect | Size and position of the artboard. |
| name | string | The unique name of the artboard. |
| parent | Document | R/O: The parent document. |
| rulerOrigin | Point | Ruler origin relative to the artboard's top-left corner. |
| rulerPAR | number (double) | Pixel aspect ratio for ruler visualization (range 0.1-10.0). |
| showCenter | boolean | Show center mark. |
| showCrossHairs | boolean | Show cross hairs. |
| showSafeAreas | boolean | Show title and action safe areas (for video). |
| typename | string | R/O: The class name of the object. |

### Artboards methods

| Method | Parameters | Returns | Description |
| --- | --- | --- | --- |
| remove() | | Nothing | Deletes this artboard. You cannot remove the last one. |

## Artboards

A collection of Artboard objects.

### Artboards properties

| Property | Value type | Description |
| --- | --- | --- |
| length | number | R/O: Number of artboards in the collection. |
| parent | Document | R/O: The parent document. |
| typename | string | R/O: The class name of the object. |

### Artboards methods

| Method | Parameters | Returns | Description |
| --- | --- | --- | --- |
| add(artboardRect) | rect | Artboard | Creates a new Artboard. |
| getActiveArtboardIndex() | | number (long) | Retrieves the 0-based index of the active artboard. |
| getByName(name) | string | Artboard | Gets the first artboard with the specified name. |
| Insert(artboardRect, index) | rect, number (long) | Nothing | Creates a new Artboard at the specified index. |
| remove(index) | number (long) | Nothing | Deletes the artboard at the specified index. |
| setActiveArtboardIndex(index) | number (long) | Nothing | Makes the artboard at the index active. |

## Brush

A brush in a document. Brushes can be accessed but not created via script.

### Brush properties

| Property | Value type | Description |
| --- | --- | --- |
| name | string | The name of the brush. |
| parent | Document | R/O: The document containing this brush. |
| typename | string | R/O: The class name of the object. |

### Brush methods

| Method | Parameters | Returns | Description |
| --- | --- | --- | --- |
| applyTo(artitem) | PageItem | Nothing | Applies the brush to an art item. |

#### Applying a brush

```javascript
// Duplicates and groups all items in the current selection,
// then applies the same brush to each item in the group
if ( app.documents.length > 0 ) {
    docSelection = app.activeDocument.selection;
    if ( docSelection.length > 0 ) {
        newGroup = app.activeDocument.groupItems.add();
        for ( i = 0; i < docSelection.length; i++ ) {
            newItem = docSelection[i].duplicate();
            newItem.moveToBeginning( newGroup );
        }
        brush4 = app.activeDocument.brushes[1];
        brush4.applyTo( newGroup );
    }
}
```

## Brushes

A collection of Brush objects in a document.

### Brushes properties

| Property | Value type | Description |
| --- | --- | --- |
| length | number | R/O: Number of brushes in the collection. |
| parent | Document | R/O: The document containing this collection. |
| typename | string | R/O: The class name of the object. |

### Brushes methods

| Method | Parameters | Returns | Description |
| --- | --- | --- | --- |
| getByName(name) | string | Brush | Gets the first brush with the specified name. |
| index(itemKey) | string, number | Brush | Gets an element from the collection. |

#### Counting brushes

```javascript
// Counts all brushes in the active document
if ( app.documents.length > 0 ) {
    numberOfBrushes = app.activeDocument.brushes.length;
}
```

## CharacterAttributes

Specifies text character properties. A `CharacterStyle` object associates these attributes with a text range.

Note: Character attributes are undefined until explicitly set.

### CharacterAttributes properties

| Property | Value type | Description |
| --- | --- | --- |
| akiLeft | number (double) | Inter-character spacing added to the left of a character (in thousandths of an em). |
| akiRight | number (double) | Inter-character spacing added to the right of a character (in thousandths of an em). |
| alignment | StyleRunAlignmentType | The character alignment type. |
| alternateGlyphs | AlternateGlyphsForm | The alternate glyphs form. |
| autoLeading | boolean | True if automatic leading is used. |
| baselineDirection | BaselineDirectionType | The Japanese text baseline direction. |
| baselinePosition | FontBaselineOption | The baseline position of text. |
| baselineShift | number (double) | Text baseline shift in points. |
| capitalization | FontCapsOption | The case of the text. |
| connectionForms | boolean | True if OpenType connection forms are used. |
| contextualLigature | boolean | True if contextual ligature is used. |
| discretionaryLigature | boolean | True if discretionary ligature is used. |
| figureStyle | FigureStyleType | The number style in an OpenType font. |
| fillColor | Color | The text fill color. |
| fractions | boolean | True if OpenType fractions are used. |
| horizontalScale | number (double) | Character horizontal scaling as a percentage (100 = 100%). |
| italics | boolean | True if the Japanese OpenType font supports italics. |
| kerningMethod | AutoKernType | The automatic kerning method. |
| language | LanguageType | The language of the text. |
| leading | number (double) | Space between lines of text in points. |
| ligature | boolean | True if ligature is used. |
| noBreak | boolean | True if line breaks are not allowed. |
| openTypePosition | FontOpenTypePositionOption | The OpenType baseline position. |
| ordinals | boolean | True if OpenType ordinals are used. |
| ornaments | boolean | True if OpenType ornaments are used. |
| overprintFill | boolean | True if the text fill should be overprinted. |
| overprintStroke | boolean | True if the text stroke should be overprinted. |
| parent | object | R/O: The object's container. |
| proportionalMetrics | boolean | True if the Japanese OpenType font supports proportional glyphs. |
| rotation | number (double) | Character rotation angle in degrees. |
| size | number (double) | Font size in points. |
| strikeThrough | boolean | True if characters use strike-through style. |
| strokeColor | Color | The text stroke color. |
| strokeWeight | number (double) | Line width of the stroke. |
| stylisticAlternates | boolean | True if OpenType stylistic alternates are used. |
| swash | boolean | True if OpenType swash is used. |
| tateChuYokoHorizontal | number (long) | Tate-Chu-Yoko horizontal adjustment in points. |
| tateChuYokoVertical | number (long) | Tate-Chu-Yoko vertical adjustment in points. |
| textFont | TextFont | The text font. |
| titling | boolean | True if OpenType titling alternates are used. |
| tracking | number (long) | Tracking or range kerning in thousandths of an em. |
| Tsume | number (double) | Percentage of space reduction around a Japanese character. |
| typename | string | R/O: The class name of the object. |
| underline | boolean | True if characters are underlined. |
| verticalScale | number (double) | Character vertical scaling as a percentage (100 = 100%). |
| wariChuCharactersAfterBreak | number (long) | How Wari-Chu text characters are divided after a break. |
| wariChuCharactersBeforeBreak | number (long) | How Wari-Chu text characters are divided before a break. |
| wariChuEnabled | boolean | True if Wari-Chu is enabled. |
| warichuJustification | WariChuJustificationType | The Wari-Chu justification. |
| wariChuLineGap | number (long) | The Wari-Chu line gap. |
| wariChuLines | number (long) | The number of Wari-Chu lines. |
| wariChuScale | number (double) | The Wari-Chu scale. |

#### Setting character attributes

```javascript
// Creates a new document, adds a simple text item
// then incrementally increases the horizontal and
// vertical scale attributes of each character
var docRef = documents.add () ;
var textRef = docRef.textFrames.add();
textRef.contents = "I Love Scripting!";
textRef.top = 400;
textRef.left = 100;
// incrementally increase the scale of each character
var charCount = textRef.textRange.characters.length;
var size = 100;
for(i=0; i<charCount; i++, size *= 1.2) {
    textRef.textRange.characters[i].characterAttributes.horizontalScale = size;
    textRef.textRange.characters[i].characterAttributes.verticalScale = size;
}
```

## Characters

A collection of TextRange objects (each of length 1). Access elements by index.

### Characters properties

| Property | Value type | Description |
| --- | --- | --- |
| length | number | R/O: Number of characters in the collection. |
| parent | object | R/O: The text art item containing this character. |
| typename | string | R/O: The class name of the object. |

### Characters methods

| Method | Parameters | Returns | Description |
| --- | --- | --- | --- |
| add(contents [,relativeObject] [,insertionLocation]) | string, TextFrameItem, ElementPlacement | TextRange | Adds a new character. |
| addBefore(contents) | string | TextRange | Adds a character before the selection. |
| Index(itemKey) | number | TextRange | Gets an element by index. |
| removeAll() | | Nothing | Deletes all elements. |

#### Counting characters

```javascript
// Counts all characters in the active document,
// including whitespace, and stores in numChars
if ( app.documents.length > 0 ) {
    var doc = app.activeDocument;
    var numChars = 0 ;
    for ( i = 0; i < doc.textFrames.length; i++ ) {
        textArtRange = doc.textFrames[i].contents;
        numChars += textArtRange.length;
    }
}
```

## CharacterStyle

Associates a set of character attributes with text.

### CharacterStyle properties

| Property | Value type | Description |
| --- | --- | --- |
| characterAttributes | CharacterAttributes | R/O: The character properties for the style. |
| name | string | The character style's name. |
| parent | object | R/O: The object's container. |
| typename | string | R/O: The class name of the object. |

### CharacterStyle methods

| Method | Parameters | Returns | Description |
| --- | --- | --- | --- |
| applyTo(textItem [,clearingOverrides]) | object, boolean | Nothing | Applies the style to a text object. |
| remove() | | Nothing | Deletes the style. |

## CharacterStyles

A collection of CharacterStyle objects.

### CharacterStyles properties

| Property | Value type | Description |
| --- | --- | --- |
| length | number | R/O: Number of styles in the collection. |
| parent | object | R/O: The object's container. |
| typename | string | R/O: The class name of the object. |

### CharacterStyles methods

| Method | Parameters | Returns | Description |
| --- | --- | --- | --- |
| add(name) | string | CharacterStyle | Creates a new named character style. |
| getByName(name) | string | CharacterStyle | Gets the first style with the specified name. |
| Index(itemKey) | string, number | CharacterStyle | Gets an element from the collection. |
| removeAll() | | Nothing | Deletes all styles. |

#### Using character styles

```javascript
// Creates 3 text frames in a new document then creates
// a character style and applies it to each text frame.
var docRef = documents.add () ;
var textRef1 = docRef.textFrames.add();
textRef1.contents = "Scripting is fun!";
textRef1.top = 700;
textRef1.left = 50;
var textRef2 = docRef.textFrames.add();
textRef2.contents = "Scripting is easy!";
textRef2.top = 625;
textRef2.left = 100;
var textRef3 = docRef.textFrames.add();
textRef3.contents = "Everyone should script!";
textRef3.top = 550;
textRef3.left = 150;
redraw();
// Create a new character style
var charStyle = docRef.characterStyles.add("BigRed");
// set character attributes
var charAttr = charStyle.characterAttributes;
charAttr.size = 40;
charAttr.tracking = -50;
charAttr.capitalization = FontCapsOption.ALLCAPS;
var redColor = new RGBColor();
redColor.red = 255;
redColor.green = 0;
redColor.blue = 0;
charAttr.fillColor = redColor;
// apply to each textFrame in the document
charStyle.applyTo(textRef1.textRange);
charStyle.applyTo(textRef2.textRange);
charStyle.applyTo(textRef3.textRange);
```

## CMYKColor

A CMYK color specification. Illustrator translates between CMYK and RGB as needed, which can lose information.

### CMYKColor properties

| Property | Value type | Description |
| --- | --- | --- |
| black | number (double) | Black value (0.0-100.0). Default: 0.0 |
| cyan | number (double) | Cyan value (0.0-100.0). Default: 0.0 |
| magenta | number (double) | Magenta value (0.0-100.0). Default: 0.0 |
| typename | string | R/O: The class name of the object. |
| yellow | number (double) | Yellow value (0.0-100.0). Default: 0.0 |

#### Setting a CMYK color

```javascript
// Sets the fill color of the frontmost path item in
// the current document to a light purple CMYK color
if ( app.documents.length > 0 && app.activeDocument.pathItems.length >0) {
    frontPath = app.activeDocument.pathItems[0];
    // Set color values for the CMYK object
    newCMYKColor = new CMYKColor();
    newCMYKColor.black = 0;
    newCMYKColor.cyan = 30.4;
    newCMYKColor.magenta = 32;
    newCMYKColor.yellow = 0 ;
    // Use the color object in the path item
    frontPath.filled = true;
    frontPath.fillColor = newCMYKColor;
}
```

## Color

Abstract parent class for all color classes: CMYKColor, GradientColor, GrayColor, LabColor, NoColor, PatternColor, RGBColor, SpotColor.

## CompoundPathItem

A compound path, composed of multiple paths. Component paths share property values.

Note: When a script requests paths from a document, paths in a compound path are returned individually. However, they are not returned when requesting paths from a layer containing the compound path.

### CompoundPathItem properties

| Property | Value type | Description |
| --- | --- | --- |
| artworkKnockout | KnockoutState | If this object creates a knockout. |
| blendingMode | BlendModes | The compositing mode. |
| controlBounds | array of 4 numbers | R/O: Bounds including stroke width and controls. |
| editable | boolean | R/O: True if the item is editable. |
| geometricBounds | array of 4 numbers | R/O: Bounds excluding stroke width. |
| height | number (double) | Height excluding stroke width. |
| hidden | boolean | True if the item is hidden. |
| isIsolated | boolean | True if the object is isolated. |
| layer | Layer | R/O: The layer to which this item belongs. |
| left | number (double) | Position of the left side (in points). |
| locked | boolean | True if the item is locked. |
| name | string | The name of the item. |
| note | string | The note assigned to the item. |
| opacity | number (double) | Opacity (0.0 to 100.0). |
| parent | Layer or GroupItem | R/O: The parent of this object. |
| pathItems | PathItems | R/O: The path art items in this compound path. |
| position | array of 2 numbers | Position of the top-left corner [x, y], excluding stroke. |
| selected | boolean | True if the item is selected. |
| sliced | boolean | True if the item is sliced. |
| tags | Tags | R/O: The tags contained in this object. |
| top | number (double) | Position of the top (in points). |
| typename | string | R/O: The class name of the object. |
| uRL | string | The value of the Adobe URL tag. |
| visibilityVariable | Variant | The visibility variable bound to the item. |
| visibleBounds | array of 4 numbers | R/O: Visible bounds including stroke width. |
| width | number (double) | Width excluding stroke width. |
| wrapInside | boolean | True if text should be wrapped inside this object. |
| wrapOffset | number (double) | Offset for wrapping text around this object. |
| wrapped | boolean | True if text frames are wrapped around this object. |
| zOrderPosition | number (long) | R/O: The item's position in the stacking order. |

### CompoundPathItem methods

| Method | Parameters | Returns | Description |
| --- | --- | --- | --- |
| duplicate([relativeObject] [,insertionLocation]) | object, ElementPlacement | CompoundPathItem | Creates a duplicate. |
| move(relativeObject, insertionLocation) | object, ElementPlacement | Nothing | Moves the object. |
| remove() | | Nothing | Deletes the object. |
| resize(...) | | Nothing | Scales the art item. |
| rotate(...) | | Nothing | Rotates the art item. |
| transform(...) | | Nothing | Transforms the art item with a matrix. |
| translate(...) | | Nothing | Repositions the art item. |
| zOrder(zOrderCmd) | ZOrderMethod | Nothing | Changes the item's position in the stacking order. |

#### Selecting paths in a document

```javascript
// Selects all paths not part of a compound path
if ( app.documents.length > 0 ) {
    doc = app.activeDocument;
    count = 0 ;
    if ( doc.pathItems.length > 0 ) {
        thePaths = doc.pathItems;
        numPaths = thePaths.length;
        for ( i = 0; i < doc.pathItems.length; i++ ) {
            pathArt = doc.pathItems[i];
            if ( pathArt.parent.typename != "CompoundPathItem" ) {
                pathArt.selected = true;
                count++;
            }
        }
    }
}
```

#### Creating and modifying a compound path item

```javascript
// Creates a new compound path item containing 3 path
// items, then sets the width and the color of the stroke
// to all items in the compound path
if ( app.documents.length > 0 ) {
    doc = app.activeDocument;
    newCompoundPath = doc.activeLayer.compoundPathItems.add();
    // Create the path items
    newPath = newCompoundPath.pathItems.add();
    newPath.setEntirePath( Array( Array(30, 50), Array(30, 100) ) );
    newPath = newCompoundPath.pathItems.add();
    newPath.setEntirePath( Array( Array(40, 100), Array(100, 100) ) );
    newPath = newCompoundPath.pathItems.add();
    newPath.setEntirePath( Array( Array(100, 110), Array(100, 300) ) );
    // Set stroke and width properties of the compound path
    newPath.stroked = true;
    newPath.strokeWidth = 3.5;
    newPath.strokeColor = app.activeDocument.swatches[3].color;
}
```

## CompoundPathItems

A collection of CompoundPathItem objects.

### CompoundPathItems properties

| Property | Value type | Description |
| --- | --- | --- |
| length | number | R/O: Number of objects in the collection. |
| parent | Layer or GroupItem | R/O: The parent of this collection. |
| typename | string | R/O: The class name of the object. |

### CompoundPathItems methods

| Method | Parameters | Returns | Description |
| --- | --- | --- | --- |
| add() | | CompoundPathItem | Creates a new CompoundPathItem. |
| getByName(name) | string | CompoundPathItem | Gets the first element with the specified name. |
| Index(itemKey) | string, number | CompoundPathItem | Gets an element from the collection. |
| removeAll() | | Nothing | Deletes all elements. |

#### Counting compound paths

```javascript
// Counts all compound path items in layer 1 of the current document
if ( app.documents.length > 0 ) {
    doc = app.activeDocument;
    numCompoundPaths = doc.layers[0].compoundPathItems.length;
}
```

## Dataset

A set of data for dynamic publishing, containing variables and their data. At least one variable must be bound to an art item to create a dataset.

### Dataset properties

| Property | Value type | Description |
| --- | --- | --- |
| name | string | The name of the dataset. |
| parent | Document | R/O: The document that contains this dataset. |
| typename | string | R/O: The class name of the object. |

### Dataset methods

| Method | Parameters | Returns | Description |
| --- | --- | --- | --- |
| display() | | Nothing | Displays the dataset. |
| remove() | | Nothing | Deletes the dataset. |
| update() | | Nothing | Updates the dataset with current variable values. |

#### Using variables and datasets

```javascript
// Creates two variables, 1 visibility and 1 text,
// creates two datasets each with different values
// for the variables, then displays both datasets
var docRef = documents.add () ;
// Create visibility variable
var itemRef = docRef.pathItems.rectangle(600, 200, 150, 150);
var colorRef = new RGBColor;
colorRef.red = 255;
itemRef.fillColor = colorRef;
var visibilityVar = docRef.variables.add();
visibilityVar.kind = VariableKind.VISIBILITY;
itemRef.visibilityVariable = visibilityVar;
// Create text variable
var textRef = docRef.textFrames.add();
textRef.contents = "Text Variable, dataset 1";
textRef.top = 400;
textRef.left = 200;
var textVar = docRef.variables.add();
textVar.kind = VariableKind.TEXTUAL;
textRef.contentVariable = textVar;
redraw();
// Create dataset 1
var ds1 = docRef.dataSets.add();
// Change variable values and create dataset 2
itemRef.hidden = true;
textRef.contents = "Text Variable, dataset 2";
redraw();
var ds2 = docRef.dataSets.add();
// display each dataset
ds1.display();
redraw();
ds2.display();
redraw();
```

## Datasets

A collection of Dataset objects.

### Datasets properties

| Property | Value type | Description |
| --- | --- | --- |
| length | number | R/O: Number of datasets in the collection. |
| parent | Document | R/O: The document that contains this collection. |
| typename | string | R/O: The class name of the object. |

### Datasets methods

| Method | Parameters | Returns | Description |
| --- | --- | --- | --- |
| add() | | Dataset | Creates a new dataset. |
| getByName(name) | string | Dataset | Gets the first dataset with the specified name. |
| Index(itemKey) | string, number | Dataset | Gets an element from the collection. |
| removeAll() | | Nothing | Removes all datasets. |
```javascript
// Exports current document to dest as a GIF file with specified
// options, dest contains the full path including the file name
function exportToGIFFile(dest) {
    if ( app.documents.length > 0 ) {
        var exportOptions = new ExportOptionsGIF();
        var type = ExportType.GIF;
        var fileSpec = new File(dest) ;
        exportoptions.antiAliasing = false;
        exportoptions.colorCount = 64;
        exportoptions.colorDither = ColorDitherMethod.DIFFUSION;
        app.activeDocument.exportFile( fileSpec, type, exportoptions );
    }
}
```

## Document

An Illustrator document.

### Document properties

| Property | Value type | Description |
| --- | --- | --- |
| activeDataset | Dataset | The currently opened dataset. |
| activeLayer | Layer | The active layer in the document. |
| activeView | View | R/O: The document's current view. |
| artboards | Artboards | R/O: All artboards in the document. |
| brushes | Brushes | R/O: The brushes contained in the document. |
| characterStyles | CharacterStyles | R/O: The list of character styles in this document. |
| CloudPath | string | R/O: The asset reference string of the document. |
| compoundPathItems | CompoundPathItems | R/O: The compound path items contained in the document. |
| cropBox | array of 4 numbers | The boundary of the document's crop box for output, or null if not set. |
| cropStyle | CropOptions | The style of the document's crop box. |
| dataSets | Datasets | R/O: The datasets contained in the document. |
| defaultFillColor | Color | The default fill color for new paths. |
| defaultFilled | boolean | If true, new paths are filled. |
| defaultFillOverprint | boolean | If true, art beneath filled objects is overprinted by default. |
| defaultStrokeCap | StrokeCap | Default line cap type for new paths. |
| defaultStrokeColor | Color | The default stroke color for new paths. |
| defaultStroked | boolean | If true, new paths are stroked. |
| defaultStrokeDashes | object | Default dash and gap lengths for dashed lines. Set to {} for solid lines. |
| defaultStrokeDashOffset | number (double) | Default distance into the dash pattern to start for new paths. |
| defaultStrokeJoin | StrokeJoin | Default joint type for new paths. |
| defaultStrokeMiterLimit | number (double) | When stroke join is mitered, specifies when to convert to bevel. Range: 1 to 500. |
| defaultStrokeOverprint | boolean | If true, art beneath stroked objects is overprinted by default. |
| defaultStrokeWidth | number (double) | Default stroke width for new paths. |
| documentColorSpace | DocumentColorSpace | R/O: The document's color space. |
| fullName | File | R/O: The file associated with the document, including the full path. |
| geometricBounds | array of 4 numbers | R/O: The bounds of the illustration excluding stroke widths. |
| gradients | Gradients | R/O: The gradients contained in the document. |
| graphicStyles | GraphicStyles | R/O: The graphic styles defined in this document. |
| graphItems | GraphItems | R/O: The graph art items in this document. |
| groupItems | GroupItems | R/O: The group items contained in the document. |
| height | number (double) | R/O: The height of the document. |
| inkList | object | R/O: The list of inks in this document. |
| isCloudDocument | boolean | R/O: True if the document is saved on the cloud. |
| kinsokuSet | object | R/O: The Kinsoku set of characters that cannot begin or end a line of Japanese text. |
| layers | Layers | R/O: The layers contained in the document. |
| legacyTextItems | LegacyTextItems | R/O: The legacy text items in the document. |
| meshItems | MeshItems | R/O: The mesh art items contained in the document. |
| mojikumiSet | object | R/O: A list of names of predefined Mojikumi sets for Japanese text spacing. |
| name | string | R/O: The document's name. |
| nonNativeItems | NonNativeItems | R/O: The non-native art items in this document. |
| outputResolution | number (double) | R/O: The current output resolution in dots per inch (dpi). |
| pageItems | PageItems | R/O: The page items (all art item classes) in the document. |
| pageOrigin | array of 2 numbers | The zero-point of the page relative to the overall height and width. |
| paragraphStyles | ParagraphStyles | R/O: The list of paragraph styles in this document. |
| parent | Application | R/O: The application that contains this document. |
| path | File | R/O: The file associated with the document, including the full path. |
| pathItems | PathItems | R/O: The path items contained in this document. |
| patterns | Patterns | R/O: The patterns contained in this document. |
| placedItems | PlacedItems | R/O: The placed items contained in this document. |
| pluginItems | PluginItems | R/O: The plug-in items contained in this document. |
| printTiles | boolean | R/O: If true, this document should be printed as tiled output. |
| rasterEffectSettings | RasterEffectOptions | The document's raster effect settings. |
| rasterItems | RasterItems | R/O: The raster items contained in this document. |
| rulerOrigin | array of 2 numbers | The zero-point of the rulers relative to the bottom left of the document. |
| rulerUnits | RulerUnits | R/O: The default measurement units for the rulers. |
| saved | boolean | If true, the document has not been changed since last saved. |
| selection | array of objects | References to the objects in the current selection, or null. |
| showPlacedImages | boolean | R/O: If true, placed images are displayed in the document. |
| splitLongPaths | boolean | R/O: If true, long paths are split when printing. |
| spots | Spots | R/O: The spot colors contained in this document. |
| stationery | boolean | R/O: If true, the file is a stationery file. |
| stories | Stories | R/O: The story items in this document. |
| swatches | Swatches | R/O: The swatches in this document. |
| swatchGroups | SwatchGroups | R/O: The swatch groups in this document. |
| symbolItems | SymbolItems | R/O: The art items linked to symbols. |
| symbols | Symbols | R/O: The symbols in this document. |
| tags | Tags | R/O: The tags in this document. |
| textFrames | TextFrameItems | R/O: The text frames in this document. |
| tileFullPages | boolean | R/O: If true, full pages are tiled when printing. |
| typename | string | R/O: The class name of the object. |
| useDefaultScreen | boolean | R/O: If true, the printer's default screen is used when printing. |
| variables | Variables | R/O: The variables defined in this document. |
| variablesLocked | boolean | If true, the variables are locked. |
| views | Views | R/O: The views contained in this document. |
| visibleBounds | array of 4 numbers | R/O: The visible bounds of the document, including stroke widths. |
| width | number (double) | R/O: The width of this document. |
| XMPString | string | The XMP metadata packet associated with this document. |

### Document methods

| Method | Parameters | Returns | Description |
| --- | --- | --- | --- |
| activate() | | Nothing | Brings the document's window to the front. |
| arrange([layoutStyle]) | DocumentLayoutStyle | Boolean | Arranges documents in the specified layout style. |
| close([saveOptions]) | SaveOptions | Nothing | Closes the document with specified save options. |
| convertCoordinate(coordinate, source, destination) | Point, CoordinateSystem, CoordinateSystem | Point | Converts a point between coordinate systems. |
| exportFile(exportFile, exportFormat [,options]) | File, ExportType, variant | Nothing | Exports the document to a file in the specified format. The appropriate file extension is appended automatically. |
| exportPDFPreset(file) | File | Nothing | Exports the current PDF preset values to a file. |
| exportPerspectiveGridPreset(file) | File | Nothing | Exports the current perspective grid preset values to a file. |
| exportPrintPreset(file) | File | Nothing | Exports the current print preset values to a file. |
| exportVariables(fileSpec) | File | Nothing | Saves datasets into an XML library. |
| fitArtboardToSelectedArt([index]) | number (long) | boolean | Resizes the artboard at the given index to fit selected art. |
| getPerspectiveActivePlane() | | PerspectiveGridPlaneType | Retrieves the active plane of the active perspective grid. |
| getScreenMode() | | ScreenMode | The mode of display for this view. |
| getViewMode() | | ViewMode | The view mode for this view. |
| hidePerspectiveGrid() | | boolean | Hides the current active perspective grid. |
| imageCapture(imageFile, [clipBounds], [options]) | File, Rect, ImageCaptureOptions | Nothing | Captures artwork content as a raster image. |
| importCharacterStyles(fileSpec) | File | Nothing | Loads character styles from an Illustrator file. |
| importParagraphStyles(fileSpec) | File | Nothing | Loads paragraph styles from an Illustrator file. |
| importPDFPreset(fileSpec [, replacingPreset]) | File, boolean | Nothing | Loads all PDF presets from a file. |
| importPerspectiveGridPreset(fileSpec [, perspectivePreset]) | File, String | Nothing | Loads a specified perspective grid preset, or all presets. |
| importPrintPreset(printPreset, fileSpec) | string, File | Nothing | Loads the named print preset from a file. |
| importVariables(fileSpec) | File | Nothing | Imports a library of datasets and variables, overwriting existing ones. |
| isRulerVisible() | | boolean | If true, the ruler is visible. |
| isTransparencyGridVisible() | | boolean | If true, the transparency grid is visible. |
| print([options]) | PrintOptions | Nothing | Prints the document. |
| rasterize(sourceArt [, clipBounds] [, options]) | variant, Rect, RasterizeOptions | RasterItem | Rasterizes the source art(s) within specified clip bounds. |
| rearrangeArtboards([artboardLayout, artboardRowsOrCols, artboardSpacing, artboardMoveArtwork]) | DocumentArtboardLayout, integer, Number, boolean | boolean | Rearranges artboards in the document. |
| save() | | Nothing | Saves the document in its current location. |
| saveAs(saveIn [, options]) | File, SaveOptions | Nothing | Saves the document to a specified file. |
| saveToCloud(cloudPath) | string | Nothing | Saves the document at the specified cloud path. |
| selectObjectsOnActiveArtboard() | | boolean | Selects the objects on the currently active artboard. |
| setActivePlane(gridPlane) | PerspectiveGridPlaneType | boolean | Sets the active plane of the active perspective grid. |
| selectPerspectivePreset(gridType, presetName) | PerspectiveGridType, string | boolean | Selects a predefined preset to define the grid. |
| showPerspectiveGrid() | | boolean | Shows the current active perspective grid, or the default grid. |
| windowCapture(imageFile, windowSize) | File, array of 2 numbers | Nothing | Captures the current document window to a TIFF image file. |
| writeAsLibrary(File, libraryType) | File, LibraryType | Nothing | Writes the document to a file as a library of the specified type. |

#### Deselecting all objects in the current document

```javascript
var docRef = activeDocument;
docRef.selection = null;
```

#### Closing a document

```javascript
if ( app.documents.length > 0 ) {
    aiDocument = app.activeDocument;
    aiDocument.close( SaveOptions.DONOTSAVECHANGES );
    aiDocument = null;
}
```

#### Creating a document with defaults

```javascript
if ( app.documents.length == 0 ) {
    doc = app.documents.add();
}
else {
    doc = app.activeDocument;
}
doc.defaultFilled = true;
doc.defaultStroked = true;
```

## DocumentPreset

A preset document template for creating a new document.

### DocumentPreset properties

| Property | Value type | Description |
| --- | --- | --- |
| artboardLayout | DocumentArtboardLayout | Layout of artboards. Default: GridByRow |
| artboardRowsOrCols | number (long) | Number of rows or columns. Range: 1 to (numArtboards - 1), or 1 for single layouts. Default: 1 |
| artboardSpacing | number (double) | Spacing between artboards. Default: 20.0 |
| colorMode | DocumentColorSpace | The color space for the new document. |
| height | number (double) | The height in points. Default: 792.0 |
| numArtboards | number (long) | Number of artboards. Range: 1 to 100. Default: 1 |
| previewMode | DocumentPreviewMode | The preview mode for the new document. |
| rasterResolution | DocumentRasterResolution | The raster resolution for the new document. |
| title | string | The document title. |
| transparencyGrid | DocumentTransparencyGrid | The transparency grid color for the new document. |
| typename | string | R/O: The class name of the object. |
| units | RulerUnits | The ruler units for the new document. |
| width | number (double) | The width in points. Default: 612.0 |

## Documents

A collection of Document objects.

### Documents properties

| Property | Value type | Description |
| --- | --- | --- |
| length | number | R/O: Number of objects in the collection. |
| parent | object | R/O: The parent object. |
| typename | string | R/O: The class name of the object. |

### Documents methods

| Method | Parameters | Returns | Description |
| --- | --- | --- | --- |
| add([documentColorSpace] [, width] [, height] [, numArtBoards] [, artboardLayout] [, artboardSpacing] [, artboardRowsOrCols]) | DocumentColorSpace, number (double), number (double), number (long), DocumentArtboardLayout, number (double), number (long) | Document | Creates a new document using optional parameters. |
| addDocument(startupPreset [, presetSettings] [, showOptionsDialog]) | string, DocumentPreset, boolean | Document | Creates a document from a preset, optionally replacing settings. |
| getByName(name) | string | Document | Gets the first element in the collection with the specified name. |
| Index(itemKey) | string, number | Document | Gets an element from the collection. |

#### Creating a new document

```javascript
app.documents.add( DocumentColorSpace.RGB );
```

## EPSSaveOptions

Options for saving a document as an Illustrator EPS file, used with the saveAs method.

### EPSSaveOptions properties

| Property | Value type | Description |
| --- | --- | --- |
| artboardRange | string | If saveMultipleArtboards is true, the artboard range to export. Default: empty string |
| cmykPostScript | boolean | If true, use CMYK PostScript. |
| compatibility | Compatibility | EPS file format version. Default: ILLUSTRATOR17 |
| compatibleGradientPrinting | boolean | If true, create a raster item of gradients for PostScript Level 2 printers. Default: false |
| embedAllFonts | boolean | If true, all fonts are embedded in the saved file. Default: false |
| embedLinkedFiles | boolean | If true, linked image files are included in the saved document. |
| flattenOutput | OutputFlattening | How transparency is flattened for file formats older than Illustrator 9. |
| includeDocumentThumbnails | boolean | If true, includes a thumbnail image of the EPS artwork. |
| overprint | PDFOverprint | Whether to preserve, discard, or simulate overprint. Default: PRESERVEPDFOVERPRINT |
| postscript | EPSPostScriptLevelEnum | PostScript Language Level. Default: LEVEL2 |
| preview | EPSPreview | The format for the EPS preview image. |
| saveMultipleArtboards | boolean | If true, all artboards or a range are saved. Default: false |
| typename | string | R/O: The class name of the object. |

#### Exporting to EPS format

```javascript
function exportFileAsEPS (destFile) {
    var newFile = new File(destFile);
    var saveDoc;
    if ( app.documents.length == 0 )
        saveDoc = app. documents . add () ;
    else
        saveDoc = app.activeDocument;
    var saveOpts = new EPSSaveOptions () ;
    saveOpts.cmykPostScript = true;
    saveOpts. embedAllFonts = true;
    saveDoc.saveAs ( newFile, saveOpts );
}
```

## ExportForScreens

Options for exporting a document, assets, or artboards.

| Property | Value type | Description |
| --- | --- | --- |
| toFolder | File path | The folder where exported items are saved. |
| se\_jpeg100/se\_jpeg20/se\_jpeg50/se\_jpeg80/se\_pdf/se\_png24/se\_png8/se\_svg | File type | The file type for export. |
| withOptions | Any | Options for the specified file type. |
| itemToExport | Item to export | The item to export (e.g., document, artboard, asset). |
| filenamePrefix | String | String prepended to each file name. |

## ExportOptionsAutoCAD

Options for exporting a document as an AutoCAD file, used with the exportFile method.

### ExportOptionsAutoCAD properties

| Property | Value type | Description |
| --- | --- | --- |
| alterPathsForAppearance | boolean | If true, alters paths to maintain appearance. Default: false |
| colors | AutoCADColors | The colors exported into the AutoCAD file. |
| convertTextToOutlines | boolean | If true, converts text to vector paths. Default: false |
| exportFileFormat | AutoCADExportFileFormat | The export file format. Default: DWG |
| exportOption | AutoCADExportOption | Preserve appearance or editability. Default: MaximizeEditability |
| exportSelectedArtOnly | boolean | If true, only selected artwork is exported. Default: false |
| rasterFormat | AutoCADRasterFormat | The format for exported raster art. |
| scaleLineweights | boolean | If true, scales line weights with the drawing. Default: false |
| typename | string | R/O: The class name of the object. |
| unit | AutoCADUnit | The measurement units from which to map. |
| unitScaleRatio | number (double) | The output scaling ratio as a percentage. Range: 0 to 1000 |
| version | AutoCADCompatibility | The AutoCAD release for the exported file. Default: Release24 |

## ExportOptionsGIF

Options for exporting a document as a GIF file, used with the exportFile method.

### ExportOptionsGIF properties

| Property | Value type | Description |
| --- | --- | --- |
| antiAliasing | boolean | If true, the exported image is anti-aliased. Default: true |
| artBoardClipping | boolean | If true, the exported image is clipped to the artboard. Default: false |
| colorCount | number (long) | Number of colors in the exported image's color table. Range: 2 to 256. Default: 128 |
| colorDither | ColorDitherMethod | The method used to dither colors. Default: DIFFUSION |
| colorReduction | ColorReductionMethod | The method used to reduce colors. Default: SELECTIVE |
| ditherPercent | number (long) | How much colors are dithered, as a percentage. |
| horizontalScale | number (double) | Horizontal scaling factor, where 100.0 is 100%. Default: 100.0 |
| infoLossPercent | number (long) | The level of information loss allowed during compression. |
| interlaced | boolean | If true, the exported image is interlaced. Default: false |
| matte | boolean | If true, the artboard is matted with a color. Default: true |
| matteColor | RGBColor | The color to use for matting. Default: white |
| saveAsHTML | boolean | If true, saves an accompanying HTML file. Default: false |
| transparency | boolean | If true, the exported image uses transparency. Default: true |
| typename | string | R/O: The class name of the object. |
| verticalScale | number (double) | Vertical scaling factor, where 100.0 is 100%. Default: 100.0 |
| webSnap | number (long) | How much the color table is changed to match the web palette. Default: 0 |

#### Exporting to GIF format

```javascript
function exportToGIFFile(dest) {
    if ( app.documents.length > 0 ) {
        var exportOptions = new ExportOptionsGIF();
        var type = ExportType.GIF;
        var fileSpec = new File(dest) ;
        exportoptions.antiAliasing = false;
        exportoptions.colorCount = 64;
        exportoptions.colorDither = ColorDitherMethod.DIFFUSION;
        app.activeDocument.exportFile( fileSpec, type, exportoptions );
    }
}
```

## ExportOptionsJPEG

Options for exporting a document as a JPEG file, used with the exportFile method.

### ExportOptionsJPEG properties

| Property | Value type | Description |
| --- | --- | --- |
| antiAliasing | boolean | If true, the exported image is anti-aliased. Default: true |
| artBoardClipping | boolean | If true, the exported image is clipped to the artboard. |
| blurAmount | number (double) | Amount of blur to apply. Range: 0.0 to 2.0. Default: 0.0 |
| horizontalScale | number (double) | Horizontal scaling factor, where 100.0 is 100%. Default: 100.0 |
| matte | boolean | If true, the artboard is matted with a color. Default: true |
| matteColor | RGBColor | The color to use for matting. Default: white |
| optimization | boolean | If true, optimizes the image for web viewing. Default: true |
| qualitySetting | number (long) | Quality of the exported image. Range: 0 to 100. Default: 30 |
| saveAsHTML | boolean | If true, saves an accompanying HTML file. Default: false |
| typename | string | R/O: The class name of the object. |
| verticalScale | number (double) | Vertical scaling factor. Range: 0.0 to 776.19. Default: 100.0 |

#### Exporting to JPEG format

```javascript
function exportFileToJPEG (dest) {
    if ( app.documents.length > 0 ) {
        var exportOptions = new ExportOptionsJPEG();
        var type = ExportType. JPEG ;
        var fileSpec = new File(dest) ;
        exportoptions.antiAliasing = false;
        exportoptions.qualitysetting = 70;
        app.activeDocument.exportFile( fileSpec, type, exportoptions );
    }
}
```

## ExportOptionsPhotoshop

Options for exporting a document as a Photoshop file, used with the exportFile method.

### ExportOptionsPhotoshop properties

| Property | Value type | Description |
| --- | --- | --- |
| antiAliasing | boolean | If true, the exported image is anti-aliased. Default: true |
| artboardRange | string | If saveMultipleArtboards is true, the artboard range to export. Default: empty string |
| editableText | boolean | If true, text is exported as editable layers. Default: true |
| embedICCProfile | boolean | If true, an ICC profile is embedded. Default: false |
| imageColorSpace | ImageColorSpace | The color space of the exported file. Default: RGB |
| maximumEditability | boolean | Preserve as much of the document's structure as possible. Default: true |
| resolution | number (double) | Resolution in dots per inch (dpi). Range: 72.0 to 2400.0. Default: 150.0 |
| saveMultipleArtboards | boolean | If true, all artboards or a range are saved. Default: false |
| typename | string | R/O: The class name of the object. |
| warnings | boolean | If true, displays a warning dialog for export setting conflicts. Default: true |
| writeLayers | boolean | If true, document layers are presented in the exported file. Default: true |

#### Exporting to Photoshop format

```javascript
function exportFileToPSD (dest) {
    if ( app.documents.length > 0 ) {
        var exportOptions = new ExportOptionsPhotoshop();
        var type = ExportType.PHOTOSHOP;
        var fileSpec = new File(dest);
        exportoptions.resolution = 150;
        app.activeDocument.exportFile( fileSpec, type, exportoptions );
    }
}
```

## ExportOptionsPNG8

Options for exporting a document as an 8-bit PNG file, used with the exportFile method.

### ExportOptionsPNG8 properties

| Property | Value type | Description |
| --- | --- | --- |
| antiAliasing | boolean | If true, the exported image is anti-aliased. Default: true |
| artBoardClipping | boolean | If true, the exported image is clipped to the artboard. Default: false |
| colorCount | number (long) | Number of colors in the color table. Range: 2 to 256. Default: 128 |
| colorDither | ColorDitherMethod | The method used to dither colors. Default: Diffusion |
| colorReduction | ColorReductionMethod | The method used to reduce colors. Default: SELECTIVE |
| ditherPercent | number (long) | Amount colors are dithered, as a percentage. Range: 0 to 100. Default: 88 |
| horizontalScale | number (double) | Horizontal scaling factor, where 100.0 is 100%. Default: 100.0 |
| interlaced | boolean | If true, the exported image is interlaced. Default: false |
| matte | boolean | If true, the artboard is matted with a color. Default: true |
| matteColor | RGBColor | The color to use for matting. Default: white |
| saveAsHTML | boolean | If true, saves an accompanying HTML file. Default: false |
| transparency | boolean | If true, the exported image uses transparency. Default: true |
| typename | string | R/O: The class name of the object. |
| verticalScale | number (double) | Vertical scaling factor, where 100.0 is 100%. Default: 100.0 |
| webSnap | number (long) | How much the color table is changed to match the web palette. Default: 0 |

#### Exporting to PNG8 format

```javascript
function exportFileToPNG8 (dest) {
    if ( app.documents.length > 0 ) {
        var exportOptions = new Export0ptionsPNG8();
        var type = ExportType. PNG8 ;
        var fileSpec = new File(dest) ;
        exportoptions.colorCount = 8;
        exportoptions.transparency = false;
        app.activeDocument.exportFile( fileSpec, type, exportoptions );
    }
}
```

## ExportOptionsPNG24

Options for exporting a document as a 24-bit PNG file, used with the exportFile method.

### ExportOptionsPNG24 properties

| Property | Value type | Description |
| --- | --- | --- |
| antiAliasing | boolean | If true, the exported image is anti-aliased. Default: true |
| artBoardClipping | boolean | If true, the exported image is clipped to the artboard. Default: false |
| horizontalScale | number (double) | Horizontal scaling factor, where 100.0 is 100%. Default: 100.0 |
| matte | boolean | If true, the artboard is matted with a color. Default: true |
| matteColor | RGBColor | The color to use for matting. Default: white |
| saveAsHTML | boolean | If true, saves an accompanying HTML file. Default: false |
| transparency | boolean | If true, the exported image uses transparency. Default: true |
| typename | string | R/O: The class name of the object. |
| verticalScale | number (double) | Vertical scaling factor, where 100.0 is 100%. Default: 100.0 |

#### Exporting to PNG24 format

```javascript
function exportFileToPNG24 (dest) {
    if ( app.documents.length > 0 ) {
        var exportoptions = new Export0ptionsPNG24();
        var type = ExportType.PNG24;
        var fileSpec = new File(dest) ;
        exportoptions.antiAliasing = false;
        exportoptions.transparency = false;
        exportoptions.saveAsHTML = true;
        app.activeDocument.exportFile( fileSpec, type, exportoptions );
    }
}
```

## ExportOptionsSVG

Options for exporting a document as an SVG file, used with the exportFile method.

### ExportOptionsSVG properties

| Property | Value type | Description |
| --- | --- | --- |
| artboardRange | string | A range of artboards to save if saveMultipleArtboards is true. Default: empty string |
| compressed | boolean | If true, the exported file is compressed. Default: false |
| coordinatePrecision | number (long) | Decimal precision for element coordinate values. Range: 1 to 7. Default: 3 |
| cssProperties | SVGCSSPropertyLocation | How
## Inkinfo

Contains ink properties for printing.

### Properties

| Property | Value type | Description |
| --- | --- | --- |
| angle | number (double) | Screen angle in degrees. Range: -360 to 360 |
| customcolor | Color | The custom ink color. |
| density | number (double) | Neutral density. Minimum: 0.0 |
| dotshape | string | The dot shape name. |
| frequency | number (double) | The ink's frequency. Range: 0.0 to 1000.0 |
| kind | InkType | The ink type. |
| printingstatus | InkPrintStatus | The ink printing status. |
| trapping | TrappingType | The trapping type. |
| trappingorder | number (long) | Trapping order for the ink. Range: 1 to 4 for CMYK |
| typename | string | Read-only. The object's class name. |

#### Getting ink information

```javascript
// Displays the current document's inks in a text frame
var docRef = documents.add();
var textRef = docRef.textFrames.add();
var inks = "";
var iLength = activeDocument.inkList.length;
for(var i = 0; i < iLength; i++) {
    inks += docRef.inkList[i].name;
    inks += "\r\t";
    inks += "Frequency = " + docRef.inkList[i].inkinfo.frequency;
    inks += "\r\t";
    inks += "Density = " + docRef.inkList[i].inkinfo.density;
    inks += "\r";
}
textRef.contents = inks;
textRef.top = 600;
textRef.left = 200;
redraw();
```

## InsertionPoint

Represents a text insertion point between characters. Contained in an `InsertionPoints` collection.

### Properties

| Property | Value type | Description |
| --- | --- | --- |
| characters | Characters | Read-only. All characters in this text range. |
| lines | Lines | Read-only. All lines in this text range. |
| paragraphs | Paragraphs | Read-only. All paragraphs in this text range. |
| parent | TextRange | Read-only. The object's container. |
| story | Story | Read-only. The story containing this text range. |
| textRanges | TextRanges | Read-only. All text in this text range. |
| typename | string | Read-only. The object's class name. |
| words | Words | Read-only. All words in this text range. |

## InsertionPoints

A collection of `InsertionPoint` objects.

### Properties

| Property | Value type | Description |
| --- | --- | --- |
| length | number | Read-only. Number of elements in the collection. |
| parent | object | Read-only. The object's container. |
| typename | string | Read-only. The object's class name. |

### Methods

| Method | Parameter type | Returns | Description |
| --- | --- | --- | --- |
| Index(itemKey) | string, number | InsertionPoint | Gets an element from the collection. |

#### Using insertion points to add spaces

```javascript
// Adds a space between each character using insertion points
var docRef = documents.add();
var textRef = docRef.textFrames.add();
textRef.contents = "Wouldn't you rather be scripting?";
textRef.top = 400;
textRef.left = 100;
textRef.textRange.characterAttributes.size = 20;
redraw();
var ip;
for(var i = 0; i < textRef.insertionpoints.length; i += 2) {
    ip = textRef.insertionpoints[i];
    ip.characters.add(" ");
}
```

## LabColor

A CIE Lab color specification.

### Properties

| Property | Value type | Description |
| --- | --- | --- |
| a | number (double) | The a (red-green) value. Range: -128.0 to 128.0. Default: 0.0 |
| b | number (double) | The b (yellow-blue) value. Range: -128.0 to 128.0. Default: 0.0 |
| l | number (double) | The l (lightness) value. Range: 0.0 to 100.0. Default: 0.0 |

## Layer

A document layer, which can contain sublayers. A layer's page items are accessible as elements of that layer or the entire document.

### Properties

| Property | Value type | Description |
| --- | --- | --- |
| artworkKnockout | KnockoutState | Knockout setting for the object. Cannot be set to `KnockoutState.Unknown`. |
| blendingMode | BlendModes | Compositing blend mode. |
| color | RGBColor | The layer's selection color in the UI. |
| compoundPathItems | CompoundPathItems | Read-only. Compound path items in this layer. |
| dimPlacedImages | boolean | If true, dims placed images in this layer. |
| graphItems | GraphItems | Read-only. Graph items in this layer. |
| groupItems | GroupItems | Read-only. Group items in this layer. |
| hasSelectedArtwork | boolean | True if an object in this layer is selected; set to false to deselect all. |
| isIsolated | boolean | True if this object is isolated. |
| layers | Layers | Read-only. Layers contained in this layer. |
| legacyTextItems | LegacyTextItems | Read-only. Legacy text items in this layer. |
| locked | boolean | True if the layer is locked; set to false to make it editable. |
| meshItems | MeshItems | Read-only. Mesh items in this layer. |
| name | string | The layer's name. |
| nonNativeItems | NonNativeItems | Non-native art items in this layer. |
| opacity | number (double) | Opacity. Range: 0.0 to 100.0 |
| pageItems | PageItems | Read-only. All page items in this layer. |
| parent | Document or Layer | Read-only. The document or layer that contains this layer. |
| pathItems | PathItems | Read-only. Path items in this layer. |
| placedItems | PlacedItems | Read-only. Placed items in this layer. |
| pluginItems | PluginItems | Read-only. Plugin items in this layer. |
| preview | boolean | True to display the layer in preview mode. |
| printable | boolean | True if the layer should be printed. |
| rasterItems | RasterItems | Read-only. Raster items in this layer. |
| sliced | boolean | True if the layer is sliced. Default: false |
| symbolItems | SymbolItems | Read-only. Symbol items in this layer. |
| textFrames | TextFrames | Read-only. Text frames in this layer. |
| typename | string | Read-only. The object's class name. |
| visible | boolean | True if the layer is visible. |
| zOrderPosition | number (long) | Read-only. Stacking order position of the layer. |

### Methods

| Method | Parameter type | Returns | Description |
| --- | --- | --- | --- |
| move(relativeObject, insertionLocation) | object, ElementPlacement | Layer | Moves the layer. |
| remove() | | Nothing | Deletes the layer. |
| zOrder(zOrderCmd) | ZOrderMethod | Nothing | Changes the layer's stacking order. |

#### Bringing a layer to the front

```javascript
// Moves the bottom layer to the top
if (documents.length > 0) {
    var countOfLayers = activeDocument.layers.length;
    if (countOfLayers > 1) {
        var bottomLayer = activeDocument.layers[countOfLayers - 1];
        bottomLayer.zOrder(ZOrderMethod.BRINGTOFRONT);
    } else {
        alert("The active document only has 1 layer");
    }
}
```

## Layers

The collection of layers in a document.

### Properties

| Property | Value type | Description |
| --- | --- | --- |
| length | number | Read-only. Number of objects in the collection. |
| parent | object | Read-only. The parent of this object. |
| typename | string | Read-only. The object's class name. |

### Methods

| Method | Parameter type | Returns | Description |
| --- | --- | --- | --- |
| add() | | Layer | Creates a new layer. |
| getByName(name) | string | Layer | Gets the first element with the specified name. |
| Index(itemKey) | string, number | Layer | Gets an element from the collection. |
| removeAll() | | Nothing | Deletes all layers in the collection. |

#### Finding and deleting layers

```javascript
// Deletes all layers whose name begins with "Temp" in all open documents
var layersDeleted = 0;
for (var i = 0; i < app.documents.length; i++) {
    var targetDocument = app.documents[i];
    var layerCount = targetDocument.layers.length;
    for (var ii = layerCount - 1; ii >= 0; ii--) {
        var targetLayer = targetDocument.layers[ii];
        if (targetLayer.name.indexOf("Temp") == 0) {
            targetLayer.remove();
            layersDeleted++;
        }
    }
}
```

## LegacyTextItem

Text from Illustrator CS (v10) or earlier, uneditable until converted with `convertToNative()`. Legacy text is marked with an 'x' when selected.

### Properties

| Property | Value type | Description |
| --- | --- | --- |
| artworkKnockout | KnockoutState | Knockout setting for the object. |
| blendingMode | BlendModes | Compositing blend mode. |
| controlBounds | array of 4 numbers | Read-only. Bounds including stroke width and controls. |
| converted | boolean | Read-only. True if the legacy text has been converted to a native text frame. |
| editable | boolean | Read-only. True if this item is editable. |
| geometricBounds | array of 4 numbers | Read-only. Bounds excluding stroke width. |
| height | number (double) | The height of the item. |
| hidden | boolean | True if this item is hidden. |
| isIsolated | boolean | True if this object is isolated. |
| layer | Layer | Read-only. The layer containing this item. |
| left | number (double) | Position of the left side (in points from the page left). |
| locked | boolean | True if this item is locked. |
| name | string | The item's name. |
| note | string | The note assigned to this item. |
| opacity | number (double) | Opacity. Range: 0.0 to 100.0 |
| parent | Layer or GroupItem | Read-only. The parent of this object. |
| position | array of 2 numbers | Position of the top left corner [x, y] (in points), excluding stroke. |
| selected | boolean | True if this item is selected. |
| sliced | boolean | True if the item is sliced. Default: false |
| tags | Tags | Read-only. Tags contained in this item. |
| top | number (double) | Position of the top (in points from the page bottom). |
| typename | string | Read-only. The object's class name. |
| uRL | string | The value of the Adobe URL tag assigned to this item. |
| visibilityVariable | Variable | The visibility variable bound to the item. |
| visibleBounds | array of 4 numbers | Read-only. Visible bounds including stroke width. |
| width | number (double) | The width of the item. |
| wrapInside | boolean | True if text frames should wrap inside this object. |
| wrapOffset | number (double) | Offset for wrapping text around this object. |
| wrapped | boolean | True if text frames should wrap around this object. |
| zOrderPosition | number (long) | Read-only. Stacking order position of the item. |

### Methods

| Method | Parameter type | Returns | Description |
| --- | --- | --- | --- |
| convertToNative() | | GroupItem | Converts to a text frame and deletes the original. |
| duplicate([relativeObject] [,insertionLocation]) | object, ElementPlacement | LegacyTextItem | Duplicates the object. |
| move(relativeObject, insertionLocation) | object, ElementPlacement | LegacyTextItem | Moves the object. |
| remove() | | Nothing | Deletes the object. |
| resize(scaleX, scaleY, [...]) | number (double), number (double), [...] | Nothing | Scales the art item. |
| rotate(angle, [...]) | number (double), [...] | Nothing | Rotates the art item. |
| transform(transformationMatrix, [...]) | Matrix, [...] | Nothing | Transforms the art item using a matrix. |
| translate([deltaX] [,deltaY] [...]) | number (double), number (double), [...] | Nothing | Repositions the art item. |
| zOrder(zOrderCmd) | ZOrderMethod | Nothing | Changes the item's stacking order. |

## LegacyTextItems

A collection of `LegacyTextItem` objects.

### Properties

| Property | Value type | Description |
| --- | --- | --- |
| length | number | Read-only. Number of elements in the collection. |
| parent | object | Read-only. The object's container. |
| typename | string | Read-only. The object's class name. |

### Methods

| Method | Parameter type | Returns | Description |
| --- | --- | --- | --- |
| convertToNative() | | boolean | Converts all legacy text to text frames. Returns true on success. |
| getByName(name) | string | LegacyTextItem | Gets the first element with the specified name. |
| Index(itemKey) | string, number | LegacyTextItem | Gets an element from the collection. |
| removeAll() | | Nothing | Deletes all elements in this collection. |

## Lines

A collection of `TextRange` objects representing lines of text.

### Properties

| Property | Value type | Description |
| --- | --- | --- |
| length | number | Read-only. Number of elements in the collection. |
| parent | object | Read-only. The object's container. |
| typename | string | Read-only. The object's class name. |

### Methods

| Method | Parameter type | Returns | Description |
| --- | --- | --- | --- |
| Index(itemKey) | number | TextRange | Gets an element from the collection. |
| removeAll() | | Nothing | Deletes all elements in this collection. |

## Matrix

A specification for transforming object geometry. A matrix is a record of values, not an object reference. Matrix-generating commands return a new, modified matrix; the original is unchanged.

### Properties

| Property | Value type | Description |
| --- | --- | --- |
| mValueA | number (double) | Matrix property a. |
| mValueB | number (double) | Matrix property b. |
| mValueC | number (double) | Matrix property c. |
| mValueD | number (double) | Matrix property d. |
| mValueTX | number (double) | Matrix property tx. |
| mValueTY | number (double) | Matrix property ty. |
| typename | string | Read-only. The object's class name. |

#### Combining matrices to apply multiple transformations

```javascript
// Transforms all art in a document using translation and rotation matrices
if (app.documents.length > 0) {
    var moveMatrix = app.getTranslationMatrix(0.5, 1.5);
    // Add a 10 degree counter-clockwise rotation
    var totalMatrix = app.concatenateRotationMatrix(moveMatrix, 10);
    // Apply the transformation
    var doc = app.activeDocument;
    for (var i = 0; i < doc.pageItems.length; i++) {
        doc.pageItems[i].transform(totalMatrix);
    }
}
```

## MeshItem

A gradient mesh art item. Cannot be created via script, but can be duplicated.

### Properties

| Property | Value type | Description |
| --- | --- | --- |
| artworkKnockout | KnockoutState | Knockout setting for the object. |
| blendingMode | BlendModes | Compositing blend mode. |
| controlBounds | array of 4 numbers | Read-only. Bounds including stroke width and controls. |
| editable | boolean | Read-only. True if this item is editable. |
| geometricBounds | array of 4 numbers | Read-only. Bounds excluding stroke width. |
| height | number (double) | The height of the item. |
| hidden | boolean | True if this item is hidden. |
| isIsolated | boolean | True if this object is isolated. |
| layer | Layer | Read-only. The layer containing this item. |
| left | number (double) | Position of the left side (in points from the page left). |
| locked | boolean | True if this item is locked. |
| name | string | The item's name. |
| note | string | The note assigned to this item. |
| opacity | number (double) | Opacity. Range: 0.0 to 100.0 |
| parent | Layer or GroupItem | Read-only. The parent of this object. |
| position | array of 2 numbers | Position of the top left corner [x, y] (in points), excluding stroke. |
| selected | boolean | True if this item is selected. |
| sliced | boolean | True if the item is sliced. Default: false |
| tags | Tags | Read-only. Tags contained in this item. |
| top | number (double) | Position of the top (in points from the page bottom). |
| typename | string | Read-only. The object's class name. |
| uRL | string | The value of the Adobe URL tag assigned to this item. |
| visibilityVariable | Variable | The visibility variable bound to the item. |
| visibleBounds | array of 4 numbers | Read-only. Visible bounds including stroke width. |
| width | number (double) | The width of the item. |
| wrapInside | boolean | True if text frames should wrap inside this object. |
| wrapOffset | number (double) | Offset for wrapping text around this object. |
| wrapped | boolean | True if text frames should wrap around this object. |
| zOrderPosition | number (long) | Read-only. Stacking order position of the item. |

### Methods

| Method | Parameter type | Returns | Description |
| --- | --- | --- | --- |
| duplicate([relativeObject] [,insertionLocation]) | object, ElementPlacement | MeshItem | Duplicates the object. |
| move(relativeObject, insertionLocation) | object, ElementPlacement | MeshItem | Moves the object. |
| remove() | | Nothing | Deletes the object. |
| resize(scaleX, scaleY, [...]) | number (double), number (double), [...] | Nothing | Scales the art item. |
| rotate(angle, [...]) | number (double), [...] | Nothing | Rotates the art item. |
| transform(transformationMatrix, [...]) | Matrix, [...] | Nothing | Transforms the art item using a matrix. |
| translate([deltaX] [,deltaY] [...]) | number (double), number (double), [...] | Nothing | Repositions the art item. |
| zOrder(zOrderCmd) | ZOrderMethod | Nothing | Changes the item's stacking order. |

#### Finding and locking mesh items

```javascript
// Locks all mesh items in the current document
if (app.documents.length > 0) {
    var doc = app.activeDocument;
    for (var i = 0; i < doc.meshItems.length; i++) {
        doc.meshItems[i].locked = true;
    }
}
```

## MeshItems

A collection of `MeshItem` objects.

### Properties

| Property | Value type | Description |
| --- | --- | --- |
| length | number | Read-only. Number of objects in the collection. |
| parent | object | Read-only. The parent of this object. |
| typename | string | Read-only. The object's class name. |

### Methods

| Method | Parameter type | Returns | Description |
| --- | --- | --- | --- |
| getByName(name) | string | MeshItem | Gets the first element with the specified name. |
| Index(itemKey) | string, number | MeshItem | Gets an element from the collection. |
| removeAll() | | Nothing | Deletes all elements in this collection. |

#### Copying mesh items to another document

```javascript
// Copies all mesh items from one document to a new one
if (app.documents.length > 0) {
    var srcDoc = documents[0];
    var locationOffset = 0;
    var targetDoc = documents.add();
    for (var i = 0; i < srcDoc.meshItems.length; i++) {
        var srcItem = srcDoc.meshItems[i];
        var dupItem = srcItem.duplicate(targetDoc, ElementPlacement.PLACEATEND);
        dupItem.position = Array(100, 50 + locationOffset);
        locationOffset += 50;
    }
}
```

## NoColor

Represents the absence of color. Assigning a `NoColor` object to a `fillColor` or `strokeColor` is equivalent to setting `filled` or `stroked` to `false`.

### Properties

| Property | Value type | Description |
| --- | --- | --- |
| typename | string | Read-only. The object's class name. |

#### Using NoColor to remove a fill color

```javascript
// Creates 2 overlapping objects. Assigns the top object a NoColor fill.
var docRef = documents.add();
var itemRef1 = docRef.pathItems.rectangle(500, 200, 200, 100);
var itemRef2 = docRef.pathItems.rectangle(550, 150, 200, 200);
var rgbColor = new RGBColor();
rgbColor.red = 255;
itemRef2.fillColor = rgbColor;
rgbColor.blue = 255;
rgbColor.red = 0;
itemRef1.fillColor = rgbColor;
redraw();
var noColor = new NoColor();
itemRef2.fillColor = noColor;
redraw();
```

## NonNativeItem

A non-native artwork item. Inherits all `PageItem` properties.

### Properties

| Property | Value type | Description |
| --- | --- | --- |
| (inherits all properties from PageItem) | | |

### Methods

| Method | Parameter type | Returns | Description |
| --- | --- | --- | --- |
| duplicate([relativeObject] [,insertionLocation]) | object, ElementPlacement | NonNativeItem | Duplicates the object. |
| move(relativeObject, insertionLocation) | object, ElementPlacement | NonNativeItem | Moves the object. |
| remove() | | Nothing | Deletes the object. |
| removeAll() | | Nothing | Deletes all elements in this collection. |
| resize(scaleX, scaleY, [...]) | number (double), number (double), [...] | Nothing | Scales the art item. |
| rotate(angle, [...]) | number (double), [...] | Nothing | Rotates the art item. |
| transform(transformationMatrix, [...]) | Matrix, [...] | Nothing | Transforms the art item using a matrix. |
| translate([deltaX] [,deltaY] [...]) | number (double), number (double), [...] | Nothing | Repositions the art item. |
| zOrder(zOrderCmd) | ZOrderMethod | Nothing | Changes the item's stacking order. |

## NonNativeItems

A collection of `NonNativeItem` objects.

### Properties

| Property | Value type | Description |
| --- | --- | --- |
| length | number | Read-only. Number of objects in the collection. |
| parent | object | Read-only. The parent of this object. |
| typename | string | Read-only. The object's class name. |

### Methods

| Method | Parameter type | Returns | Description |
| --- | --- | --- | --- |
| getByName(name) | string | NonNativeItem | Gets the first element with the specified name. |
| Index(itemKey) | string, number | NonNativeItem | Gets an element from the collection. |

## OpenOptions

Options for opening a document, used with the `open` method.

### Properties

| Property | Value type | Description |
| --- | --- | --- |
| convertCropAreaToArtboard | boolean | Convert crop areas to artboards for legacy documents. Default: true. |
| convertTilesToArtboard | boolean | Convert print tiles to artboards for legacy documents. Default: false. |
| createArtboardWithArtworkBoundingBox | boolean | Create an artboard sized to the artwork's bounding box for legacy documents. Default: false. |
| openAs | LibraryType | Open the file as a library of this type. Default: `LibraryType.IllustratorArtwork`. |
| preserveLegacyArtboard | boolean | Preserve legacy artboards for legacy documents. Default: true. |
| updateLegacyGradientMesh | boolean | Preserve spot colors in legacy gradient meshes. Default: true. |
| updateLegacyText | boolean | Update all legacy text items. Default: false. |

#### Automatically updating legacy text on open

```javascript
// Opens a file with legacy text, updating it automatically.
var fileRef = filePath;
if (fileRef != null) {
    var optRef = new OpenOptions();
    optRef.updateLegacyText = true;
    var docRef = open(fileRef, DocumentColorSpace.RGB, optRef);
}
```

## OpenOptionsAutoCAD

Options for opening an AutoCAD drawing.

### Properties

| Property | Value type | Description |
| --- | --- | --- |
| centerArtwork | boolean | Center the artwork on the artboard. Default: true. |
| globalScaleOption | AutoCADGlobalScaleOption | How to scale the drawing on import. Default: `FitArtboard`. |
| globalScalePercent | double | Scale percentage when `globalScaleOption` is `ScaleByValue`. Range: 0.0 to 100.0. Default: 100.0. |
| mergeLayers | boolean | Merge the artwork's layers. Default: false. |
| parent | object | Read-only. The object's container. |
| scaleLineweights | boolean | Scale line weights with the rest of the drawing. Default: false. |
| selectedLayoutName | string | The name of the layout to import. |
| typename | string | Read-only. The object's class name. |
| unit | AutoCADUnit | The unit to map to. Default: `Millimeters`. |
| unitScaleRatio | double | The scale ratio for mapping units. Default: 1.0. |

## OpenOptionsFreeHand

Options for opening a FreeHand file.

### Properties

| Property | Value type | Description |
| --- | --- | --- |
| convertTextToOutlines | boolean | Convert all text to vector paths. Default: false. |
| importSinglePage | boolean | Import only the page specified in `pageToOpen`. Default: true. |
| pageToOpen | long | The page number to import. Valid only if `importSinglePage` is true. |
| parent | object | Read-only. The parent of this object. |
| typename | string | Read-only. The object's class name. |

## OpenOptionsPhotoshop

Options for opening a Photoshop document.

### Properties

| Property | Value type | Description |
| --- | --- | --- |
| layerComp | string | The name of the layer comp to use. |
| preserveHiddenLayers | boolean | Preserve hidden layers. Default: false. |
| preserveImageMaps | boolean | Preserve image maps. Default: true. |
| preserveLayers | boolean | Preserve layers. Default: true. |
| preserveSlices | boolean | Preserve slices. Default: true. |
| typename | string | Read-only. The object's class name. |
## PageItem

Any art item in a document, layer, or group. The superclass for all artwork objects, from which properties are inherited. Cannot be created directly; use a subclass like `PathItem`.

### Properties

| Property | Value type | Description |
| --- | --- | --- |
| artworkKnockout | KnockoutState | If the object is used to create a knockout. |
| blendingMode | BlendModes | The compositing mode, used when opacity is less than 100.0%. |
| controlBounds | rect | Read-only. The bounds of the object including stroke width and controls. |
| editable | boolean | Read-only. If true, this page item is editable. |
| geometricBounds | rect | Read-only. The object's bounds, excluding stroke width. |
| height | real | The height of the page item. Range: 0.0 to 16348.0 |
| hidden | boolean | If true, this page item is hidden. |
| isIsolated | boolean | If true, this object is isolated. |
| layer | Layer | Read-only. The layer to which this page item belongs. |
| left | number (double) The left position of the art item. |
| locked | boolean | If true, this page item is locked. |
| name | string | The name of this page item. |
| note | string | The note assigned to this item. |
| opacity | real | The opacity of this object (0.0 to 100.0). |
| parent | object | Read-only. The parent of this object. |
| pixelAligned | boolean | If true, this item is aligned to the pixel grid. |
| position | point | The position of the top left corner of the item {x, y}. |
| selected | boolean | If true, this object is selected. |
| sliced | boolean | If true, preserve slices. |
| tags | Tags | The collection of tags associated with this page item. |
| top | number (double) | The top position of the art item. |
| typename | string | Read-only. The class name of the object. |
| URL | string | The value of the Adobe URL tag assigned to this page item. |
| visibilityVariable | anything | The visibility variable to which this page item path is bound. |
| visibleBounds | rect | Read-only. The object's visible bounds, including stroke width. |
| width | real | The width of the page item. Range: 0.0 to 16348.0 |
| wrapInside | boolean | If true, text frame objects should be wrapped inside this object. |
| wrapOffset | number (double) | The offset to use when wrapping text around this object. |
| wrapped | boolean | If true, wrap text frame objects around this object. |
| zOrderPosition | number (long) | Read-only. The drawing order of the art within its group or layer. |

### Methods

| Method | Parameter type | Returns | Description |
| --- | --- | --- | --- |
| bringInPerspective(posX, posY, perspectiveGridPlane) | number, number, PerspectiveGridPlaneType | Nothing | Places the art object in a perspective grid. |
| resize(scaleX, scaleY [,changePositions] [,changeFillPatterns] [,changeFillGradients] [,changeStrokePattern] [,changeLineWidths] [,scaleAbout]) | number (double), number (double), boolean, boolean, boolean, boolean, number (double), Transformation | Nothing | Scales the art object. |
| rotate(angle [,changePositions] [,changeFillPatterns] [,changeFillGradients] [,changeStrokePattern] [,rotateAbout]) | number (double), boolean, boolean, boolean, boolean, Transformation | Nothing | Rotates the art object. |
| transform(transformationMatrix [,changePositions] [,changeFillPatterns] [,changeFillGradients] [,changeStrokePattern] [,changeLineWidth] [,transformAbout]) | Matrix, boolean, boolean, boolean, boolean, number (double), Transformation | Nothing | Transforms the art object using a transformation matrix. |
| translate([deltaX] [,deltaY] [,transformObjects] [,transformFillPatterns] [,transformFillGradients] [,transformStrokePattern]) | number (double), number (double), boolean, boolean, boolean, boolean | Nothing | Repositions the art object. |
| zOrder(zOrderCmd) | ZOrderMethod | Nothing | Arranges the art relative to other art in the group or layer. |

## PageItems

A collection of all art items in a document.

### Properties

| Property | Value type | Description |
| --- | --- | --- |
| length | number | Read-only. The number of objects in the collection. |
| parent | object | Read-only. The parent of this object. |
| typename | string | Read-only. The class name of the referenced object. |

### Methods

| Method | Parameter type | Returns | Description |
| --- | --- | --- | --- |
| getByName(name) | string | PageItem | Gets the first element in the collection with the specified name. |
| Index(itemKey) | string, number | PageItem | Gets an element from the collection. |
| removeAll() | | Nothing | Deletes all elements in this collection. |

## Paper

Associates paper information with a paper name. Used by `Printer` objects.

### Properties

| Property | Value type | Description |
| --- | --- | --- |
| name | string | The paper name. |
| paperInfo | PaperInfo | The paper information. |
| typename | string | Read-only. The class name of the object. |

## PaperInfo

Paper information for use in printing documents.

### Properties

| Property | Value type | Description |
| --- | --- | --- |
| customPaper | boolean | If true, it is a custom paper. |
| height | number (double) | The paper's height in points. |
| imageableArea | array of 4 numbers | The imageable area. |
| typename | string | Read-only. The class name of the object. |
| width | number (double) | The paper's width in points. |

## ParagraphAttributes

Specifies the properties and attributes of a paragraph in a text frame. Attributes are undefined until explicitly set.

### Properties

| Property | Value type | Description |
| --- | --- | --- |
| autoLeadingAmount | number (double) | Auto leading amount as a percentage. |
| bunriKinshi | boolean | If true, BunriKinshi is enabled. |
| burasagariType | BurasagariTypeEnum | The Burasagari type. |
| desiredGlyphScaling | number (double) | Desired glyph scaling as a percentage (50.0 to 200.0). |
| desiredLetterSpacing | number (double) | Desired letter spacing as a percentage (-100.0 to 500.0). |
| desiredWordSpacing | number (double) | Desired word spacing as a percentage (0.0 to 1000.0). |
| everyLineComposer | boolean | If true, the Every-line Composer is enabled. |
| firstLineIndent | number (double) | First line left indent in points. |
| hyphenateCapitalizedWords | boolean | If true, hyphenation is enabled for capitalized words. |
| hyphenation | boolean | If true, hyphenation is enabled for the paragraph. |
| hyphenationPreference | number (double) | Hyphenation preference for better spacing (0) or fewer hyphens (1). Range: 0.0 to 1.0. |
| hyphenationZone | number (double) | The distance from the right edge of the paragraph where hyphenation is not allowed. |
| justification | Justification | Paragraph justification. |
| kinsoku | string | The Kinsoku Shori name. |
| kinsokuOrder | KinsokuOrderEnum | The preferred Kinsoku order. |
| kurikaeshiMojiShori | boolean | If true, KurikaeshiMojiShori is enabled. |
| leadingType | AutoLeadingType | Auto leading type. |
| leftIndent | number (double) | The left indent of margin in points. |
| maximumConsecutiveHyphens | number (long) | Maximum number of consecutive hyphenated lines. |
| maximumGlyphScaling | number (double) | Maximum glyph scaling as a percentage (50.0 to 200.0). |
| maximumLetterSpacing | number (double) | Maximum letter spacing as a percentage (-100.0 to 500.0). |
| maximumWordSpacing | number (double) | Maximum word spacing as a percentage (0.0 to 1000.0). |
| minimumAfterHyphen | number (long) | Minimum number of characters after a hyphen. |
| minimumBeforeHyphen | number (long) | Minimum number of characters before a hyphen. |
| minimumGlyphScaling | number (double) | Minimum glyph scaling as a percentage (50.0 to 200.0). |
| minimumHyphenatedWordSize | number (long) | Minimum number of characters for a word to be hyphenated. |
| minimumLetterSpacing | number (double) | Minimum letter spacing as a percentage (-100.0 to 500.0). |
| minimumWordSpacing | number (double) | Minimum word spacing as a percentage (0.0 to 1000.0). |
| mojikumi | string | The Mojikumi name. |
| parent | object | Read-only. The object's container. |
| rightIndent | number (double) | Right indent of margin in points. |
| romanHanging | boolean | If true, Roman hanging punctuation is enabled. |
| singleWordJustification | Justification | Single word justification. |
| spaceAfter | number (double) | Spacing after paragraph in points. |
| spaceBefore | number (double) | Spacing before paragraph in points. |
| tabStops | TabStopInfo | Tab stop settings. |
| typename | string | Read-only. The class name of the object. |

## Paragraphs

A collection of `TextRange` objects, each representing a paragraph.

### Properties

| Property | Value type | Description |
| --- | --- | --- |
| length | number | Read-only. The number of objects in the collection. |
| parent | object | Read-only. The parent of this object. |
| typename | string | Read-only. The class name of the referenced object. |

### Methods

| Method | Parameter type | Returns | Description |
| --- | --- | --- | --- |
| add(contents [,relativeObject] [,insertionLocation]) | string, TextFrameItem, ElementPlacement | TextRange | Adds a new paragraph with specified text. |
| addBefore(contents) | string | TextRange | Adds a new paragraph before the current selection. |
| Index(itemKey) | number | TextRange | Gets an element from the collection. |
| removeAll() | | Nothing | Deletes all elements in this collection. |

## ParagraphStyle

Associates character and paragraph attributes with a style name.

### Properties

| Property | Value type | Description |
| --- | --- | --- |
| characterAttributes | CharacterAttributes | Read-only. The character properties for the text range. |
| name | string | The paragraph style's name. |
| paragraphAttributes | ParagraphAttributes | Read-only. The paragraph properties for the text range. |
| parent | object | Read-only. The object's container. |
| typename | string | Read-only. The class name of the object. |

### Methods

| Method | Parameter type | Returns | Description |
| --- | --- | --- | --- |
| applyTo(textItem [,clearingOverrides]) | object, boolean | Nothing | Applies this paragraph style to the specified text item. |
| remove() | | Nothing | Deletes the object. |

## ParagraphStyles

A collection of `ParagraphStyle` objects.

### Properties

| Property | Value type | Description |
| --- | --- | --- |
| length | number | Read-only. Number of elements in the collection. |
| parent | object | Read-only. The object's container. |
| typename | String | Read-only. The class name of the object. |

### Methods

| Method | Parameter type | Returns | Description |
| --- | --- | --- | --- |
| add(name) | string | ParagraphStyle | Creates a named paragraph style. |
| getByName(name) | string | ParagraphStyle | Gets the first element in the collection with the provided name. |
| Index(itemKey) | string, number | ParagraphStyle | Gets an element from the collection. |
| removeAll | | Nothing | Deletes all elements in the collection. |

## PathItem

A path, which contains `PathPoint` objects that define its geometry.

### Properties

| Property | Value type | Description |
| --- | --- | --- |
| area | number (double) | Read-only. The area of this path in square points. |
| artworkKnockout | KnockoutState | If the object is used to create a knockout. |
| blendingMode | BlendModes | The blend mode used when compositing an object. |
| clipping | boolean | If true, this path should be used as a clipping path. |
| closed | boolean | If true, this path is closed. |
| controlBounds | array of 4 numbers | Read-only. The bounds of the object including stroke width and controls. |
| editable | boolean | Read-only. If true, this item is editable. |
| evenodd | boolean | If true, the even-odd rule should be used to determine "insideness." |
| fillColor | Color | The fill color of the path. |
| filled | boolean | If true, the path is filled. |
| fillOverprint | boolean | If true, the art beneath a filled object should be overprinted. |
| geometricBounds | array of 4 numbers | Read-only. The bounds of the object excluding stroke width. |
| guides | boolean | If true, this path is a guide object. |
| height | number (double) | The height of the group item. |
| hidden | boolean | If true, this item is hidden. |
| isIsolated | boolean | If true, this object is isolated. |
| layer | Layer | Read-only. The layer to which this item belongs. |
| left | number (double) | The position of the left side of the item. |
| length | number (double) | The length of this path in points. |
| locked | boolean | If true, this item is locked. |
| name | string | The name of this item. |
| note | string | The note text assigned to the path. |
| opacity | number (double) | The opacity of the object (0.0 to 100.0). |
| parent | Layer or GroupItem | Read-only. The parent of this object. |
| pathPoints | PathPoints | Read-only. The path points contained in this path item. |
| pixelAligned | boolean | If true, this item is aligned to the pixel grid. |
| polarity | PolarityValues | The polarity of the path. |
| position | array of 2 numbers | The position of the top left corner of the pathItem object [x, y]. |
| resolution | number (double) | The resolution of the path in dots per inch (dpi). |
| selected | boolean | If true, this item is selected. |
| selectedPathPoints | PathPoints | Read-only. All of the selected path points in the path. |
| sliced | boolean | If true, the item is sliced. Default: false. |
| strokeCap | StrokeCap | The type of line capping. |
| strokeColor | Color | The stroke color for the path. |
| stroked | boolean | If true, the path should be stroked. |
| strokeDashes | object | Dash lengths. Set to an empty object, {}, for a solid line. |
| strokeDashOffset | number (double) | The distance into the dash pattern at which to start. |
| strokeJoin | StrokeJoin | Type of joints for the path. |
| strokeMiterLimit | number (double) | When a stroke join is mitered, specifies when to convert to beveled. Range: 1 to 500. Default: 4. |
| strokeOverprint | boolean | If true, the art beneath a stroked object should be overprinted. |
| strokeWidth | number (double) | The width of the stroke in points. |
| tags | Tags | Read-only. The tags contained in this item. |
| top | number (double) | The position of the top of the item. |
| typename | string | Read-only. The class name of the referenced object. |
| URL | string | The value of the Adobe URL tag assigned to this item. |
| visibilityVariable | Variable | The visibility variable bound to the item. |
| visibleBounds | array of 4 numbers | Read-only. The visible bounds of the item including stroke width. |
| width | number (double) | The width of the item. |
| wrapInside | boolean | If true, text frame objects should be wrapped inside this object. |
| wrapOffset | number (double) | The offset to use when wrapping text around this object. |
| wrapped | boolean | If true, wrap text frame objects around this object. |
| zOrderPosition | number (long) | Read-only. The position of this item within the stacking order. |

### Methods

| Method | Parameter type | Returns | Description |
| --- | --- | --- | --- |
| duplicate([relativeObject] [,insertionLocation]) | object, ElementPlacement | PathItem | Creates a duplicate of the selected object. |
| move(relativeObject, insertionLocation) | object, ElementPlacement | PathItem | Moves the object. |
| remove() | | Nothing | Deletes this object. |
| resize(scaleX, scaleY [,changePositions] [,changeFillPatterns] [,changeFillGradients] [,changeStrokePattern] [,changeLineWidths] [,scaleAbout]) | number (double), number (double), boolean, boolean, boolean, boolean, number (double), Transformation | Nothing | Scales the art item. |
| rotate(angle [,changePositions] [,changeFillPatterns] [,changeFillGradients] [,changeStrokePattern] [,rotateAbout]) | number (double), boolean, boolean, boolean, boolean, Transformation | Nothing | Rotates the art item. |
| setEntirePath(pathPoints) | array of [x, y] coordinate pairs | Nothing | Sets the path using an array of points. |
| transform(transformationMatrix [,changePositions] [,changeFillPatterns] [,changeFillGradients] [,changeStrokePattern] [,changeLineWidths] [,transformAbout]) | Matrix, boolean, boolean, boolean, boolean, number (double), Transformation | Nothing | Transforms the art item by applying a transformation matrix. |
| translate([deltaX] [,deltaY] [,transformObjects] [,transformFillPatterns] [,transformFillGradients] [,transformStrokePatterns]) | number (double), number (double), boolean, boolean, boolean, boolean | Nothing | Repositions the art item. |
| zOrder(zOrderCmd) | ZOrderMethod | Nothing | Arranges the art item's position in the stacking order. |

## PathItems

A collection of `PathItem` objects.

### Properties

| Property | Value type | Description |
| --- | --- | --- |
| length | number | Read-only. The number of objects in the collection. |
| parent | object | Read-only. The parent of this object. |
| typename | string | Read-only. The class name of the referenced object. |

### Methods

| Method | Parameter type | Returns | Description |
| --- | --- | --- | --- |
| add() | | PathItem | Creates a new object. |
| ellipse([top] [,left] [,width] [,height] [,reversed] [,inscribed]) | number (double), number (double), number (double), number (double), boolean, boolean | PathItem | Creates a new ellipse path item. |
| getByName(name) | string | PathItem | Gets the first element in the collection with the specified name. |
| Index(itemKey) | string, number | PathItem | Gets an element from the collection. |
| polygon([centerX] [,centerY] [,radius] [,sides] [,reversed]) | number (double), number (double), number (double), number (long), boolean | PathItem | Creates a new polygon path item. |
| rectangle(top, left, width, height [,reversed]) | number (double), number (double), number (double), number (double), boolean | PathItem | Creates a new rectangle path item. |
| removeAll() | | Nothing | Deletes all elements in this collection. |
| roundedRectangle(top, left, width, height [,horizontalRadius] [,verticalRadius] [,reversed]) | number (double), number (double), number (double), number (double), number (double), number (double), boolean | PathItem | Creates a new rounded rectangle path item. |
| star([centerX] [,centerY] [,radius] [,innerRadius] [,points] [,reversed]) | number (double), number (double), number (double), number (double), number (long), boolean | PathItem | Creates a new star path item. |

## PathPoint

A point on a path, consisting of an anchor point and a pair of direction handles.

### Properties

| Property | Value type | Description |
| --- | --- | --- |
| anchor | array of 2 numbers | The position of this point's anchor point. |
| leftDirection | array of 2 numbers | The position of this path point's in control point. |
| parent | PathItem | Read-only. The path item that contains this path point. |
| pointType | PointType | The type of path point (curve or corner). |
| rightDirection | array of 2 numbers | The position of this path point's out control point. |
| selected | PathPointSelection | The selection state of the path point. |
| typename | string | Read-only. The class name of the referenced object. |

### Methods

| Method | Parameter type | Returns | Description |
| --- | --- | --- | --- |
| remove() | | Nothing | Removes the referenced point from the path. |

## PathPoints

A collection of `PathPoint` objects in a specific path.

### Properties

| Property | Value type | Description |
| --- | --- | --- |
| length | number | Read-only. The number of objects in the collection. |
| parent | object | Read-only. The parent of this object. |
| typename | string | Read-only. The class name of the referenced object. |

### Methods

| Method | Parameter type | Returns | Description |
| --- | --- | --- | --- |
| add() | | PathPoint | Creates a new PathPoint object. |
| Index(itemKey) | number | PathPoint | Gets an element from the collection. |
| removeAll() | | Nothing | Deletes all elements in this collection. |

## Pattern

An Illustrator pattern definition contained in a document, shown in the Swatches palette.

### Properties

| Property | Value type | Description |
| --- | --- | --- |
| name | string | The pattern name. |
| parent | Document | Read-only. The document that contains this pattern. |
| typename | string | Read-only. The class name of the referenced object. |

### Methods

| Method | Parameter type | Returns | Description |
| --- | --- | --- | --- |
| remove() | | Nothing | Removes the referenced pattern from the document. |
| toString() | | string | Returns the object type and name. |

## PatternColor

A pattern color specification. Can be used in any property that takes a color object.

### Properties

| Property | Value type | Description |
| --- | --- | --- |
| matrix | Matrix | Additional transformation arising from manipulating the path. |
| pattern | Pattern | The pattern object that defines the pattern to use. |
| reflect | boolean | If true, the prototype should be reflected before filling. Default: false. |
| reflectAngle | number (double) | The axis around which to reflect, in points. Default: 0.0. |
| rotation | number (double) | The angle in radians to rotate the prototype pattern. Default: 0.0. |
| scaleFactor | array of 2 numbers | The horizontal and vertical scaling percentages. |
| shearAngle | number (double) | The angle in radians by which to slant the shear. Default: 0.0. |
| shearAxis | number (double) | The axis to shear with respect to, in points. Default: 0.0. |
| shiftAngle | number (double) | The angle in radians to translate the unsealed prototype pattern. Default: 0.0. |
| shiftDistance | number (double) | The distance in points to translate the unsealed prototype pattern. Default: 0.0. |
| typename | string | Read-only. The class name of the referenced object. |

## Patterns

A collection of `Pattern` objects in a document.

### Properties

| Property | Value type | Description |
| --- | --- | --- |
| length | number | Read-only. The number of objects in the collection. |
| parent | object | Read-only. The parent of this object. |
| typename | string | Read-only. The class name of the referenced object. |

### Methods

| Method | Parameter type | Returns | Description |
| --- | --- | --- | --- |
| add() | | Pattern | Creates a new object. |
| getByName(name) | string | Pattern | Gets the first element in the collection with the provided name. |
| Index(itemKey) | string, number | Pattern | Gets an element from the collection. |
| removeAll() | | Nothing | Deletes all elements in this collection. |
```javascript
// Deletes the last pattern from the current document.
if ( app.documents.length > 0 ) {
    var lastIndex = app.activeDocument.patterns.length - 1;
    var patternToRemove = app.activeDocument.patterns[lastIndex];
    patternToRemove.remove();
    // Set the variable referencing the removed object to null.
    patternToRemove = null;
}
```

## PDFFileOptions

Options for opening a PDF file with the `open` method. All properties are optional.

### Properties

| Property | Value type | Description |
| --- | --- | --- |
| pageToOpen | number (long) | The page to open in a multipage document. Default: 1 |
| parent | object | Read-only. The parent of this object. |
| pDFCropToBox | PDFBoxType | The box to use when placing a multipage document. Default: `PDFBoxType.PDFMediaBox` |
| typename | string | Read-only. The class name of the referenced object. |

#### Opening a PDF with options

```javascript
// Opens a PDF file with specified options
var pdfOptions = app.preferences.PDFFileOptions;
pdfOptions.pDFCropToBox = PDFBoxType.PDFBOUNDINGBOX;
pdfOptions.pageToOpen = 2;
// Open a file using these preferences
var fileRef = filePath;
if (fileRef != null) {
    var docRef = open(fileRef, DocumentColorSpace.RGB);
}
```

## PDFSaveOptions

Options for saving a document as a PDF file with the `saveAs` method. All properties are optional.

### Properties

| Property | Value type | Description |
| --- | --- | --- |
| acrobatLayers | boolean | Create Acrobat layers from top-level layers. Acrobat 6 and later. Default: `false` |
| artboardRange | string | Specifies an artboard range for multi-asset extraction. An empty string extracts all artboards. Default: `""` |
| bleedLink | boolean | Link all 4 bleed values. Default: `true` |
| bleedOffsetRect | array of 4 numbers | The bleed offset rectangle. |
| colorBars | boolean | Draw color bars. Default: `false` |
| colorCompression | CompressionQuality | The color bitmap compression type. Default: `CompressionQuality.None` |
| colorConversionID | ColorConversion | The PDF color conversion policy. Default: `ColorConversion.None` |
| colorDestinationID | ColorDestination | The conversion target for color conversion. Default: `ColorDestination.None` |
| colorDownsampling | number (double) | The color downsampling resolution in DPI. 0 means no downsampling. Default: 150.0 |
| colorDownsamplingImageThreshold | number (double) | Downsample if the image's resolution is above this value (DPI). Default: 225.0 |
| colorDownsamplingMethod | DownsampleMethod | How to resample color bitmap images. Default: `DownsampleMethod.NODOWNSAMPLE` |
| colorProfileID | ColorProfile | The color profile to include. Default: `ColorProfile.None` |
| colorTileSize | number (long) | Tile size when compressing with JPEG2000. Default: 256 |
| compatibility | PDFCompatibility | The Acrobat file format version. Default: `PDFCompatibility.ACROBAT5` |
| compressArt | boolean | Compress line art and text. Default: `true` |
| documentPassword | string | A password to open the document. Default: none |
| enableAccess | boolean | Enable accessing for 128-bit encryption. Default: `true` |
| enableCopy | boolean | Enable copying of text for 128-bit encryption. Default: `true` |
| enableCopyAccess | boolean | Enable copying and accessing for 40-bit encryption. Default: `true` |
| enablePlainText | boolean | Enable plaintext metadata for 128-bit encryption (Acrobat 6+). Default: `false` |
| flattenerOptions | PrintFlattenerOptions | The printing flattener options. |
| flattenerPreset | string | The transparency flattener preset name. |
| fontSubsetThreshold | number (double) | Include a subset of fonts when less than this percentage of characters is used (Illustrator 9 format). Range: 0.0 to 100.0. Default: 100.0 |
| generateThumbnails | boolean | Generate thumbnail images with the saved file. Default: `true` |
| grayscaleCompression | CompressionQuality | The grayscale bitmap compression quality. Default: `None` |
| grayscaleDownsampling | number (double) | The grayscale downsampling resolution in DPI. 0 means no downsampling. Default: 150.0 |
| grayscaleDownsamplingImageThreshold | number (double) | Downsample if the image's resolution is above this value (DPI). Default: 225.0 |
| grayscaleDownsamplingMethod | DownsampleMethod | How to resample grayscale bitmap images. Default: `DownsampleMethod.NODOWNSAMPLE` |
| grayscaleTileSize | number (long) | Tile size when compressing with JPEG2000. Default: 256 |
| monochromeCompression | MonochromeCompression | The monochrome bitmap compression type. Default: `MonochromeCompression.None` |
| monochromeDownsampling | number (double) | The monochrome downsampling resolution in DPI. 0 means no downsampling. Default: 300 |
| monochromeDownsamplingImageThreshold | number (double) | Downsample if the image's resolution is above this value (DPI). Default: 450.0 |
| monochromeDownsamplingMethod | DownsampleMethod | How to resample monochrome bitmap images. Default: `DownsampleMethod.NODOWNSAMPLE` |
| offset | number (double) | Custom offset in points for custom paper. Default: 0.0 |
| optimization | boolean | Optimize the PDF for fast web viewing. Default: `false` |
| outputCondition | string | A comment describing the intended printing condition. Default: none |
| outputConditionID | string | The name of a registered printing condition. Default: none |
| pageInformation | boolean | Include raw page information. Default: `false` |
| pageMarksType | PageMarksTypes | The page marks style. Default: `PageMarksType.Roman` |
| pdfAllowPrinting | PDFPrintAllowedEnum | PDF security printing permission. Default: `PDFPrintAllowedEnum.PRINT128HIGHRESOLUTION` |
| pdfChangesAllowed | PDFChangesAllowedEnum | Security changes allowed. Default: `PDFChangesAllowedEnum.CHANGE128ANYCHANGES` |
| pdfPreset | string | Name of the PDF preset to use. |
| pdfXStandard | PDFXStandard | The PDF standard to which the document complies. Default: `PDFXStandard.PDFXNONE` |
| pdfXStandardDescription | string | A description of the PDF standard from the selected preset. |
| permissionPassword | string | A password to restrict editing security settings. Default: none |
| preserveEditability | boolean | Preserve Illustrator editing capabilities. Default: `true` |
| printerResolution | number (double) | Flattening printer resolution. Default: 800.0 |
| registrationMarks | boolean | Draw registration marks. Default: `false` |
| requireDocumentPassword | boolean | Require a password to open the document. Default: `false` |
| requirePermissionPassword | boolean | Use a password to restrict editing security settings. Default: `false` |
| trapped | boolean | Manual trapping has been prepared for the document. Default: `false` |
| trimMarks | boolean | Draw trim marks. Default: `false` |
| trimMarkWeight | PDFTrimMarkWeight | The trim mark weight. Default: `PDFTrimMarkWeight.TRIMMARKWEIGHT0125` |
| typename | string | Read-only. The class name of the referenced object. |
| viewAfterSaving | boolean | View the PDF after saving. Default: `false` |

#### Saving to PDF format

```javascript
// Saves the current document as PDF to dest with specified options
function saveFileToPDF (dest) {
    var doc = app.activeDocument;
    if ( app.documents.length > 0 ) {
        var saveName = new File ( dest );
        var saveOpts = new PDFSaveOptions();
        saveOpts.compatibility = PDFCompatibility.ACROBAT5;
        saveOpts.generateThumbnails = true;
        saveOpts.preserveEditability = true;
        doc.saveAs( saveName, saveOpts );
    }
}
```

## PhotoshopFileOptions

Options for opening a Photoshop file with the `open` method. All properties are optional.

### Properties

| Property | Value type | Description |
| --- | --- | --- |
| parent | object | Read-only. The parent of this object. |
| pixelAspectRatioCorrection | boolean | Adjust imported images with non-square pixel aspect ratios. |
| preserveImageMaps | boolean | Preserve image maps when converting the document. Default: `true` |
| preserveLayers | boolean | Preserve layers when converting the document. Default: `true` |
| preserveSlices | boolean | Preserve slices when converting the document. Default: `true` |
| typename | string | Read-only. The class name of the referenced object. |

#### Opening a Photoshop file

```javascript
// Opens a Photoshop file with preferences set to preserve layers
var psdOptions = preferences.PhotoshopFileOptions;
psdOptions.preserveLayers = true;
psdOptions.pixelAspectRatioCorrection = false;
// Open a file using these preferences
var fileRef = File ( psdFilePath );
if (fileRef != null) {
    var docRef = open(fileRef, DocumentColorSpace.RGB);
}
```

## PlacedItem

An artwork item placed in a document as a linked file.

### Properties

| Property | Value type | Description |
| --- | --- | --- |
| artworkKnockout | KnockoutState | The knockout type for this object. |
| blendingMode | BlendModes | The blend mode used when compositing. |
| boundingBox | array of 4 numbers | Read-only. The dimensions of the placed art, excluding transformations. |
| contentVariable | Variable | The content variable bound to the item. |
| controlBounds | array of 4 numbers | Read-only. The bounds including stroke width and control points. |
| editable | boolean | Read-only. `true` if this item is editable. |
| file | File | The linked file containing the artwork. |
| geometricBounds | array of 4 numbers | Read-only. The bounds excluding stroke width. |
| height | number (double) | The height of the placed item. |
| hidden | boolean | `true` if this item is hidden. |
| isIsolated | boolean | `true` if this object is isolated. |
| layer | Layer | Read-only. The layer to which this item belongs. |
| left | number (double) | The position of the left side of the item (in points). |
| locked | boolean | `true` if this item is locked. |
| matrix | Matrix | The transformation matrix of the placed artwork. |
| name | string | The name of this item. |
| note | string | The note assigned to this item. |
| opacity | number (double) | The opacity of the object. Range: 0.0 to 100.0. |
| parent | Layer or GroupItem | Read-only. The parent of this object. |
| position | array of 2 numbers | The position [x, y] of the top left corner in points. Excludes stroke weight. |
| selected | boolean | `true` if this item is selected. |
| sliced | boolean | `true` if the item is sliced. Default: `false` |
| tags | Tags | Read-only. The tags contained in this item. |
| top | number (double) | The position of the top of the item (in points). |
| typename | string | Read-only. The class name of the referenced object. |
| url | string | The value of the Adobe URL tag assigned to this item. |
| visibilityVariable | Variable | The visibility variable bound to the item. |
| visibleBounds | array of 4 numbers | Read-only. The visible bounds including stroke width. |
| width | number (double) | The width of the placed item. |
| wrapInside | boolean | Wrap text inside this object. Default: `false` |
| wrapOffset | number (double) | The offset for wrapping text around this object. |
| wrapped | boolean | Wrap text around this object. Default: `false` |
| zOrderPosition | number (long) | Read-only. The position of this item in the stacking order. |

### Methods

| Method | Parameter type | Returns | Description |
| --- | --- | --- | --- |
| duplicate([relativeObject] [,insertionLocation]) | object, ElementPlacement | PlacedItem | Creates a duplicate of this object. |
| embed() | | Nothing | Embeds the linked art, converting it to standard art objects and deleting this `PlacedItem`. |
| move(relativeObject, insertionLocation) | object, ElementPlacement | PlacedItem | Moves the object. |
| relink(linkFile) | File object | Nothing | Relinks the art object to a different file. |
| remove() | | Nothing | Deletes this object. |
| resize(scaleX, scaleY [, ...]) | number, number, ... | Nothing | Scales the art item. `scaleX` and `scaleY` are factors (100.0 = 100%). |
| rotate(angle [, ...]) | number, ... | Nothing | Rotates the art item. Positive angles are counter-clockwise. |
| trace() | | PluginItem | Converts raster art to vector art, creating a `PluginItem` containing a `TracingObject`. |
| transform(transformationMatrix [, ...]) | Matrix, ... | Nothing | Transforms the art item using a matrix. |
| translate([deltaX, deltaY, ...]) | number, number, ... | Nothing | Repositions the art item. `deltaX` and `deltaY` are offsets. |
| zOrder(zOrderCmd) | ZOrderMethod | Nothing | Changes the item's position in the stacking order. |

#### Changing the selection state of placed items

```javascript
// Toggles the selection state of all placed items.
if ( app.documents.length > 0 ) {
    for ( i = 0; i < app.activeDocument.placedItems.length; i++ ) {
        placedArt = app.activeDocument.placedItems[i];
        placedArt.selected = !placedArt.selected;
    }
}
```

## PlacedItems

A collection of `PlacedItem` objects in the document.

### Properties

| Property | Value type | Description |
| --- | --- | --- |
| length | number | Read-only. The number of objects in the collection. |
| parent | object | Read-only. The parent of this object. |
| typename | string | Read-only. The class name of the referenced object. |

### Methods

| Method | Parameter type | Returns | Description |
| --- | --- | --- | --- |
| add() | | PlacedItem | Creates a new `PlacedItem`. Use the `file` property to link the artwork. |
| getByName(name) | string | PlacedItem | Gets the first element with the specified name. |
| Index(itemKey) | string, number | PlacedItem | Gets an element from the collection. |
| removeAll() | | Nothing | Deletes all elements in this collection. |

## PluginItem

An art item created by an Illustrator plug-in. Can be created by tracing a `PlacedItem` or `RasterItem`, or by duplicating an existing `PluginItem`.

### Properties

| Property | Value type | Description |
| --- | --- | --- |
| artworkKnockout | KnockoutState | The knockout type for this object. |
| blendingMode | BlendModes | The blend mode used when compositing. |
| controlBounds | array of 4 numbers | Read-only. The bounds including stroke width and control points. |
| editable | boolean | Read-only. `true` if this item is editable. |
| geometricBounds | array of 4 numbers | Read-only. The bounds excluding stroke width. |
| height | number (double) | The height of the plugin item. |
| hidden | boolean | `true` if this item is hidden. |
| isIsolated | boolean | `true` if this object is isolated. |
| isTracing | boolean | `true` if this item was created by tracing raster art. |
| layer | Layer | Read-only. The layer to which this item belongs. |
| left | number (double) | The position of the left side of the item (in points). |
| locked | boolean | `true` if this item is locked. |
| name | string | The name of this item. |
| note | string | The note assigned to this item. |
| opacity | number (double) | The opacity of the object. Range: 0.0 to 100.0. |
| parent | Layer or GroupItem | Read-only. The parent of this object. |
| position | array of 2 numbers | The position [x, y] of the top left corner in points. Excludes stroke weight. |
| selected | boolean | `true` if this item is selected. |
| sliced | boolean | `true` if the item is sliced. Default: `false` |
| tags | Tags | Read-only. The tags contained in this item. |
| top | number (double) | The position of the top of the item (in points). |
| tracing | TracingObject | The `TracingObject` associated with this item (if `isTracing` is `true`). |
| typename | string | Read-only. The class name of the referenced object. |
| url | string | The value of the Adobe URL tag assigned to this item. |
| visibilityVariable | Variable | The visibility variable bound to the item. |
| visibleBounds | array of 4 numbers | Read-only. The visible bounds including stroke width. |
| width | number (double) | The width of the plugin item. |
| wrapInside | boolean | Wrap text inside this object. Default: `false` |
| wrapOffset | number (double) | The offset for wrapping text around this object. |
| wrapped | boolean | Wrap text around this object. Default: `false` |
| zOrderPosition | number | Read-only. The position of this item in the stacking order. |

### Methods

| Method | Parameter type | Returns | Description |
| --- | --- | --- | --- |
| duplicate([relativeObject] [,insertionLocation]) | object, ElementPlacement | PluginItem | Creates a duplicate of this object. |
| move(relativeObject, insertionLocation) | object, ElementPlacement | PluginItem | Moves the object. |
| remove() | | Nothing | Deletes this object. |
| resize(scaleX, scaleY [, ...]) | number, number, ... | Nothing | Scales the art item. `scaleX` and `scaleY` are factors (100.0 = 100%). |
| rotate(angle [, ...]) | number, ... | Nothing | Rotates the art item. Positive angles are counter-clockwise. |
| transform(transformationMatrix [, ...]) | Matrix, ... | Nothing | Transforms the art item using a matrix. |
| translate([deltaX, deltaY, ...]) | number, number, ... | Nothing | Repositions the art item. `deltaX` and `deltaY` are offsets. |
| zOrder(zOrderCmd) | ZOrderMethod | Nothing | Changes the item's position in the stacking order. |

#### Copying a plug-in item

```javascript
// Creates new plug-in art by copying an existing plug-in art item
if ( app.documents.length > 0 && app.activeDocument.pluginItems.length > 0 ) {
    var doc = app.activeDocument;
    var pluginArt = doc.pluginItems[0];
    pluginArt.duplicate(pluginArt.parent, ElementPlacement.PLACEATBEGINNING);
}
```

## PluginItems

A collection of `PluginItem` objects in a document.

### Properties

| Property | Value type | Description |
| --- | --- | --- |
| length | number | Read-only. The number of objects in the collection. |
| parent | object | Read-only. The parent of this object. |
| typename | string | Read-only. The class name of the referenced object. |

### Methods

| Method | Parameter type | Returns | Description |
| --- | --- | --- | --- |
| getByName(name) | string | PluginItem | Gets the first element with the specified name. |
| Index(itemKey) | string, number | PluginItem | Gets an element from the collection. |
| removeAll() | | Nothing | Deletes all objects in this collection. |

## PPDFile

Associates file information with a PostScript Printer Description (PPD) file.

### Properties

| Property | Value type | Description |
| --- | --- | --- |
| name | string | The PPD model name. |
| PPDInfo | PPDFileInfo | The PPD file information. |
| typename | string | Read-only. The class name of the object. |

## PPDFileInfo

Information about a PostScript Printer Description (PPD) file.

### Properties

| Property | Value type | Description |
| --- | --- | --- |
| languageLevel | string | The PostScript language level. |
| PPDFilePath | File | Path specification for the PPD file. |
| screenList | array of Screen | List of color separation screens. |
| screenSpotFunctionList | array of ScreenSpotFunction | List of color separation screen spot functions. |

#### Displaying PPD file properties

```javascript
// Displays postscript level and path for each PPD file in a new text frame
var docRef = documents.add();
var textRef = docRef.textFrames.add();
textRef.contents = "Printers...\r";
for( var i=0; i < PPDFileList.length; i++ ) {
    var ppdRef = PPDFileList[i];
    textRef.contents += ppdRef.name + "\r\t";
    var ppdInfoRef = ppdRef.PPDInfo;
    textRef.contents += "PS Level " + ppdInfoRef.languageLevel + "\r\t";
    textRef.contents += "Path: " + ppdInfoRef.PPDFilePath + "\r";
}
textRef.top = 600;
textRef.left = 200;
redraw();
```

## Preferences

Specifies the preferred options for opening or placing AutoCAD, FreeHand, PDF, and Photoshop files.

### Properties

| Property | Value type | Description |
| --- | --- | --- |
| AutoCADFileOptions | OpenOptionsAutoCAD | Read-only. Options for opening AutoCAD files. |
| FreeHandFileOptions | OpenOptionsFreeHand | Read-only. Options for opening FreeHand files. |
| parent | object | Read-only. The parent of this object. |
| PDFFileOptions | PDFFileOptions | Read-only. Options for opening PDF files. |
| PhotoshopFileOptions | PhotoshopFileOptions | Read-only. Options for opening Photoshop files. |
| typename | string | Read-only. The class name of the referenced object. |

### Methods

| Method | Parameter type | Returns | Description |
| --- | --- | --- | --- |
| getBooleanPreference(key) | string | boolean | Gets the boolean value for an application preference key. |
| getIntegerPreference(key) | string | integer | Gets the integer value for an application preference key. |
| getRealPreference(key) | string | double | Gets the real-number value for an application preference key. |
| getStringPreference(key) | string | string | Gets the string value for an application preference key. |
| removePreference(key) | string | Nothing | Deletes an application preference. |
| setBooleanPreference(key, value) | string, boolean | Nothing | Sets the boolean value for an application preference key. |
| setIntegerPreference(key, value) | string, integer | Nothing | Sets the integer value for an application preference key. |
| setRealPreference(key, value) | string, double | Nothing | Sets the real-number value for an application preference key. |
| setStringPreference(key, value) | string, string | Nothing | Sets the string value for an application preference key. |

## PrintColorManagementOptions

Color management settings for printing the document.

### Properties

| Property | Value type | Description |
| --- | --- | --- |
| colorProfileMode | PrintColorProfile | The color management profile mode. Default: `PrintColorProfile.SOURCEPROFILE` |
| Intent | PrintColorIntent | The color management intent type. Default: `PrintColorIntent.RELATIVE
### SwatchGroup
A group of swatch objects.

**Properties**
| Property | Value type | Description |
| --- | --- | --- |
| name | string | The group's name. |
| parent | object | Read-only. The container object. |
| typename | string | Read-only. The object's class name. |

**Methods**
| Method | Parameter type | Returns | Description |
| --- | --- | --- | --- |
| addSpot | Spot | Nothing | Adds a spot swatch. |
| addSwatch | Swatch | Nothing | Adds a swatch. |
| getAHSwatches | | List of Swatch | Returns all swatches in the group. |
| remove | | Nothing | Deletes the object. |
| removeAll | | Nothing | Deletes all elements in the collection. |

### SwatchGroups
A collection of SwatchGroup objects.

**Properties**
| Property | Value type | Description |
| --- | --- | --- |
| length | number | Read-only. Number of objects in the collection. |
| parent | object | Read-only. The object's parent. |
| typename | string | Read-only. The object's class name. |

**Methods**
| Method | Parameter type | Returns | Description |
| --- | --- | --- | --- |
| add | | SwatchGroup | Creates a new swatch group. |
| getByName | name: string | SwatchGroup | Returns the first element with a matching name. |
| removeAll | | Nothing | Deletes all elements in the collection. |

### Symbol
A reusable art item stored in the Symbols palette. Symbol instances are `SymbolItem` objects.

**Properties**
| Property | Value type | Description |
| --- | --- | --- |
| name | string | The symbol's name. |
| parent | object | Read-only. The container object. |
| typename | string | Read-only. The object's class name. |

**Methods**
| Method | Parameter type | Returns | Description |
| --- | --- | --- | --- |
| duplicate | | Symbol | Creates a duplicate of the object. |
| remove | | Nothing | Deletes the object. |

### SymbolItem
An instance of a symbol in a document. Linked to its source `Symbol` object.

**Properties**
| Property | Value type | Description |
| --- | --- | --- |
| artworkKnockout | Knockout state | The object's knockout setting. |
| blendingMode | BlendModes | The blend mode used when compositing. |
| controlBounds | array of 4 numbers | Read-only. Bounds including stroke width and controls. |
| editable | boolean | Read-only. True if the item is editable. |
| geometricBounds | array of 4 numbers | Read-only. Bounds excluding stroke width. |
| height | number (double) | The item's height. |
| hidden | boolean | True if the item is hidden. |
| isIsolated | boolean | True if the object is isolated. |
| layer | Layer | Read-only. The layer containing the item. |
| left | number (double) | The position of the left side (in points). |
| locked | boolean | True if the item is locked. |
| name | string | The item's name. |
| note | string | The note assigned to the item. |
| opacity | number (double) | The object's opacity (0.0 to 100.0). |
| parent | Layer or GroupItem | Read-only. The object's parent. |
| position | array of 2 numbers | The top-left position [x, y] in points. |
| selected | boolean | True if the item is selected. |
| sliced | boolean | True if the item is sliced. |
| symbol | symbol | The symbol used to create this item. |
| tags | Tags | Read-only. The tags contained in the item. |
| top | number (double) | The position of the top (in points). |
| typename | string | Read-only. The object's class name. |
| uRL | string | The value of the Adobe URL tag. |
| visibilityVariable | Variable | The visibility variable bound to the item. |
| visibleBounds | array of 4 numbers | Read-only. The visible bounds including stroke width. |
| width | number (double) | The item's width. |
| wrapInside | boolean | True if text frames should be wrapped inside this object. |
| wrapOffset | number (double) | The offset for wrapping text around this object. |
| wrapped | boolean | True if text frames wrap around this object. |
| zOrderPosition | number | Read-only. The item's position in the stacking order. |

**Methods**
| Method | Parameter type | Returns | Description |
| --- | --- | --- | --- |
| duplicate | relativeObject: object, insertionLocation: ElementPlacement | SymbolItem | Duplicates the object. |
| move | relativeObject: object, insertionLocation: ElementPlacement | SymbolItem | Moves the object. |
| remove | | Nothing | Deletes the object. |
| resize | scaleX: number, scaleY: number, [changePositions: boolean, ...] | Nothing | Scales the art item. 100.0 = 100%. |
| rotate | angle: number, [changePositions: boolean, ...] | Nothing | Rotates the art item (counter-clockwise is positive). |
| transform | transformationMatrix: Matrix, [changePositions: boolean, ...] | Nothing | Transforms the art item using a matrix. |
| translate | [deltaX: number, deltaY: number, ...] | Nothing | Repositions the art item relative to its current position. |
| zOrder | zOrderCmd: ZOrderMethod | Nothing | Changes the item's stacking order. |

### SymbolItems
A collection of symbol item objects in the document.

**Properties**
| Property | Value type | Description |
| --- | --- | --- |
| length | number | Read-only. Number of objects in the collection. |
| parent | object | Read-only. The object's parent. |
| typename | string | Read-only. The object's class name. |

**Methods**
| Method | Parameter type | Returns | Description |
| --- | --- | --- | --- |
| add | symbol: Symbol | SymbolItem | Creates an instance of the specified symbol. |
| getByName | name: string | SymbolItem | Returns the first element with a matching name. |
| Index | itemKey: string, number | SymbolItem | Gets an element from the collection. |
| removeAll | | Nothing | Deletes all elements in the collection. |

#### Creating symbol items
```javascript
var docRef = documents.add();
var y = 750, x = 25;
var 1Count = docRef.symbols.length;
for(var 1=0; i<1Count; i++) {
    symbolRef = docRef.symbols[i];
    symbolItemRef1 = docRef.symbolltems.add(symbolRef);
    symbolItemRef1.top = y;
    symbolItemRef1.left = x;
    y-=(symbolItemRef1.height + 20);
    if( (y) <= 60 ) {
        y = 750;
        x+= 190;
    }
}
```

### Symbols
The collection of symbol objects in the document.

**Properties**
| Property | Value type | Description |
| --- | --- | --- |
| length | number | Read-only. Number of objects in the collection. |
| parent | object | Read-only. The object's parent. |
| typename | string | Read-only. The object's class name. |

**Methods**
| Method | Parameter type | Returns | Description |
| --- | --- | --- | --- |
| add | sourceArt: PageItem, [registrationpoint: SymbolRegistrationPoint] | Symbol | Creates a symbol from a source art item. |
| Index | itemKey: string, number | Symbol | Gets an element from the collection. |
| getByName | name: string | Symbol | Returns the first element with a matching name. |
| removeAll | | Nothing | Deletes all elements in the collection. |

#### Creating a symbol
```javascript
var docRef = documents.add();
var y = 750, x =25;
var iCount = docRef.graphicstyles.length;
for(var i=0; i<1Count; i++) {
    var pathRef = docRef .pathitems.rectangle ( y, x, 20, 20 );
    docRef.graphicstyles[i].applyTo(pathRef);
    if( (y-=60) <= 60 ) {
        y = 750;
        x+= 200
    }
    redraw();
    docRef.symbols.add(pathRef);
}
```

### SymmetryRepeatConfig
Specifies symmetry repeat art configuration options.

**Properties**
| Property | Value type | Description |
| --- | --- | --- |
| AxlsRotatlonAngleInRadians | number(double) | Symmetry axis rotation angle wrt x-axis. Default: 1.57 |

### SymmetryRepeatltem
Specifies a symmetry repeat item.

**Properties**
| Property | Value type | Description |
| --- | --- | --- |
| parent | object | Read-only. The object's container. |
| SymmetryConfig | SymmetryRepeatConfig | Read-only. The repeat's configuration. |
| typename | String | Read-only. The object's class name. |

**Methods**
| Method | Parameter type | Returns | Description |
| --- | --- | --- | --- |
| duplicate | relativeObject: object, insertionLocation: ElementPlacement | SymmetryRepeatItem | Duplicates the object. |
| move | relativeObject: object, insertionLocation: ElementPlacement | SymmetryRepeatItem | Moves the object. |
| remove | | Nothing | Deletes the object. |
| setSymmetryConfiguration | config: SymmetryRepeatConfig, state: SymmetryRepeatUpdate | Nothing | Updates properties of the symmetry repeat. |

### SymmetryRepeatltems
A collection of symmetry repeat items.

**Properties**
| Property | Value type | Description |
| --- | --- | --- |
| length | integer | Read-only. Number of elements in the collection. |
| parent | object | Read-only. The object's container. |
| typename | string | Read-only. The object's class name. |

**Methods**
| Method | Parameter type | Returns | Description |
| --- | --- | --- | --- |
| removeAll | | nothing | Deletes all elements. |
| getByName | name: string | SymmetryRepeatItem | Returns the first element with a matching name. |
| add | object: object, config: SymmetryRepeatConfig | SymmetryRepeatItem | Creates a symmetry repeat object. |

### Symmetry RepeatUpdate
Represents which property of a symmetry repeat to update.

**Properties**
| Property | Value type | Description |
| --- | --- | --- |
| AXISROTATION | integer | Updates axis rotation angle. |
| SYMMETRYALL | integer | Updates all properties. |

### TabStopInfo
Information about a tab stop in a `ParagraphAttributes` object.

**Properties**
| Property | Value type | Description |
| --- | --- | --- |
| alignment | TabStopAlignment | The tab stop's alignment. Default: Left |
| decimalcharacter | string | The character for decimal tab stops. Default: . |
| leader | string | The leader dot character. |
| position | number (double) | The position of the tab stop in points. Default: 0.0 |
| typename | string | Read-only. The object's class name. |

#### Displaying tab stop information
```javascript
docRef = app.activeDocument;
var tabRef;
var sData = "Tab Stops Found \rTabStop Leader\t\tTabStop Positioner" ;
var textRef = docRef.textFrames;
for ( var i = 0 ; i < textRef. length; i++ ) {
    paraRef = textRef [i] .paragraphs;
    for ( p=0 ; p < paraRef. length ; p++ ) {
        attrRef = paraRef [p] .paragraphAttributes;
        tabRef = attrRef.tabstops;
        if ( tabRef.length > 0 ) {
            for(var t=0; t<tabRef.length; t++){
                sData += "\t" + tabRef [t] .leader + "\t\t";
                sData += "\t\t" + tabRef [t] .position + "\r";
            }
        }
    }
}
var newTF = docRef.textFrames.add();
newTF.contents = sData;
newTF.top = 400;
newTF.left = 100;
redraw();
```

### Tag
A label (key-value pair) associated with a piece of artwork.

**Properties**
| Property | Value type | Description |
| --- | --- | --- |
| name | string | The tag's name. |
| parent | object | Read-only. The container object. |
| typename | string | Read-only. The object's class name. |
| value | string | The data stored in the tag. |

**Methods**
| Method | Parameter type | Returns | Description |
| --- | --- | --- | --- |
| remove | | Nothing | Deletes the object. |

#### Using tags
```javascript
if ( app.documents.length > 0 ) {
    doc = app.activeDocument;
    if ( doc.selection.length > 0 ) {
        for ( i = 0; i < selection.length; i++ ) {
            selectedArt = selection [0];
            tagList = selectedArt.tags;
            if (tagList.length == 0) {
                var tempTag = tagList.add();
                tempTag.name = "OneWord";
                tempTag.value = "anything you want";
            }
            reportDocument = app.documents.add();
            top_offset = 400;
            for ( i = 0; i < tagList.length; i++ ) {
                tagText = tagList [i] .value;
                newltem = reportDocument.textFrames.add();
                newltem.contents = "Tag: (" + tagList[i].name + " , " + tagText + ") ";
                newltem.position = Array(100, top_offset);
                newltem.textRange.size = 24;
                top_offset = top_offset - 20;
            }
        }
    }
}
```

### Tags
A collection of `Tag` objects.

**Properties**
| Property | Value type | Description |
| --- | --- | --- |
| length | number | Read-only. Number of objects in the collection. |
| parent | object | Read-only. The object's parent. |
| typename | string | Read-only. The object's class name. |

**Methods**
| Method | Parameter type | Returns | Description |
| --- | --- | --- | --- |
| add | | Tag | Creates a new Tag object. |
| getByName | name: string | Tag | Returns the first element with a matching name. |
| Index | itemkey: string, number | Tag | Gets an element from the collection. |
| removeAll | | Nothing | Deletes all elements in the collection. |

#### Setting tag values
```javascript
if ( app.documents.length > 0 ) {
    doc = app.activeDocument;
    if ( doc.placedltems.length + doc.rasteritems.length > 0 ) {
        for ( i = 0; i < doc.pageltems.length; i++ ) {
            imageArt = doc.pageltems[i];
            if ( imageArt.typename == "Placedltem" || imageArt.typename == "Rasteritem") {
                urlTAG = imageArt.tags.add();
                urlTAG.name = "AdobeWebSite";
                urlTAG.value = "<http://www.adobe.com/>";
            }
        }
    }
    else {
        alert ( "No placed or raster items in the document" );
    }
}
```

### Text Font
Information about a font in a document.

**Properties**
| Property | Value type | Description |
| --- | --- | --- |
| family | string | Read-only. The font's family name. |
| name | string | Read-only. The font's full name. |
| parent | object | Read-only. The object's container. |
| style | string | Read-only. The font's style name. |
| typename | string | Read-only. The object's class name. |

#### Setting the font of text
```javascript
if ( app.documents.length > 0 ) {
    for ( i = 0; i< app.activeDocument.textFrames.length; i++) {
        textArtRange = app.activeDocument.textFrames[i].textRange;
        textArtRange.characterAttributes.textFont = app.textFonts [0];
    }
}
```

### Text Fonts
A collection of `TextFont` objects.

**Properties**
| Property | Value type | Description |
| --- | --- | --- |
| length | number | Read-only. Number of elements in the collection. |
| parent | object | Read-only. The object's container. |
| typename | string | Read-only. The object's class name. |

**Methods**
| Method | Parameter type | Returns | Description |
| --- | --- | --- | --- |
| Index | itemKey: string, number | TextFont | Gets an element from the collection. |
| getByName | name: string | TextFont | Returns the first element with a matching name. |

#### Finding fonts
```javascript
var edgeSpacing = 10, columnspacing = 230;
var docPreset = new DocumentPreset;
docPreset.width = 1191.0;
docPreset.height = 842.0
var docRef = documents.addDocument(DocumentColorSpace.CMYK, docPreset);
var sFontNames = " ";
var x = edgeSpacing, y = (docRef.height - edgeSpacing);
var iCount = textFonts.length;
for(var i=0; i<1Count; i++) {
    sFontName = textFonts [i] .name;
    sFontName += " ";
    sFontNames = sFontName + textFonts[i].style;
    var textRef = docRef.textFrames.add();
    textRef.textRange.characterAttributes.size = 10;
    textRef.contents = sFontNames;
    textRef.top = y;
    textRef.left = x;
    if ((x + textRef.width)> docRef.width){
        textRef.remove();
        iCount = i;
        break;
    }
    else{
        textRef.textRange.characterAttributes.textFont = textFonts.getByName(textFonts[i].name);
        redraw();
        if ( (y-=(textRef.height)) <= 20 ) {
            y = (docRef.height - edgeSpacing);
            x += columnspacing;
        }
    }
}
```

### TextFrameltem
An art item for displaying text (point, path, or area type). Linked frames share a `Story` object.

**Properties**
| Property | Value type | Description |
| --- | --- | --- |
| anchor | array of 2 numbers | The anchor point position for point text. |
| antialias | TextAntialias | The anti-aliasing type. |
| characters | Characters | Read-only. All characters in the text frame. |
| columnCount | number (long) | The column count (area text only). |
| columnGutter | number (double) | The column gutter (area text only). |
| contents | string | The text string. |
| contentvariable | Variable | The content variable bound to this frame. |
| endTValue | number (double) | End position of text on a path (path text only). |
| flowLinksHorizontally | boolean | True to flow text horizontally first (area text). |
| insertionpoints | Insertionpoints | Read-only. All insertion points in the text range. |
| kind | TextType | Read-only. The text frame type (area, path, point). |
| lines | Lines | Read-only. All lines in the text frame. |
| matrix | Matrix | Read-only. The transformation matrix. |
| nextFrame | TextFrameltem | The next linked text frame. |
| opticalAlignment | boolean | True if optical alignment is active. |
| orientation | TextOrientation | The text orientation. |
| paragraphs | Paragraphs | Read-only. All paragraphs in the text frame. |
| parent | Layer or GroupItern | Read-only. The object's parent. |
| previousFrame | TextFrameltem | The previous linked text frame. |
| rowCount | number (long) | The row count (area text only). |
| rowGutter | number (double) | The row gutter (area text only). |
| spacing | number (double) | The amount of spacing. |
| startTValue | number (double) | Start position of text on a path (path text only). |
| story | Story | Read-only. The story containing the text frame. |
| textPath | TextPath | The associated path item (area or path text). |
| textRange | TextRange | Read-only. The text range of the frame. |
| textRanges | TextRanges | Read-only. All text in the frame. |
| textselection | array of TextRange | Read-only. The selected text ranges. |
| typename | string | Read-only. The object's class name. |
| words | Words | Read-only. All words in the text frame. |

**Methods**
| Method | Parameter type | Returns | Description |
| --- | --- | --- | --- |
| convertAreaObjectToPointObject | | TextFrame Item | Converts an area text frame to a point text frame. |
| convertPointObjectToAreaObject | | TextFrame Item | Converts a point text frame to an area text frame. |
| createOutline | | GroupItern | Converts text to outlines. |
| duplicate | relativeObject: object, insertionLocation: ElementPlacement | TextRange | Duplicates the object. |
| move | relativeObject: object, insertionLocation: ElementPlacement | TextRange | Moves the object. |
| remove | | Nothing | Deletes the object. |
| resize | scaleX: number, scaleY: number, [changePositions: boolean, ...] | Nothing | Scales the art item. 100.0 = 100%. |
| rotate | angle: number, [changePositions: boolean, ...] | Nothing | Rotates the art item (counter-clockwise is positive). |
| transform | transformationMatrix: Matrix, [changePositions: boolean, ...] | Nothing | Transforms the art item using a matrix. |
| translate | [deltaX: number, deltaY: number, ...] | Nothing | Repositions the art item. |
| zOrder | zOrderCmd: ZOrderMethod | Nothing | Changes the item's stacking order. |

#### Rotate a text art item
```javascript
if ( app.documents.length > 0 ) {
    selectedltems = app.activeDocument.selection;
    if ( selectedltems.length > 0 ) {
        if ( selectedltems[0].typename == "TextFrame" ) {
            dupSrc = selectedltems [0];
            textcontainer = dupSrc.parent;
            for ( i = 1; i <= 5; i++ ) {
                dupText = dupSrc.duplicate ( textContainer, Elementplacement.PLACEATEND );
                dupText.rotate(180 * i/6);
            }
        }
    }
}
```

### TextFrameltems
A collection of `TextFrameltem` objects.

**Properties**
| Property | Value type | Description |
| --- | --- | --- |
| length | number | Read-only. Number of elements in the collection. |
| parent | object | Read-only. The object's container. |
| typename | string | Read-only. The object's class name. |

**Methods**
| Method | Parameter type | Returns | Description |
| --- | --- | --- | --- |
| add | | TextFrame Item | Creates a point text frame. |
| areaText | textPath: PathItem, [orientation: TextOrientation, ...] | TextFrame Item | Creates an area text frame. |
| getByName | name: string | TextFrame Item | Returns the first element with a matching name. |
| Index | itemKey: string, number | TextFrame Item | Gets an element from the collection. |
| pathText | textPath: PathItem, [startTValue: number, ...] | TextFrame Item | Creates an on-path text frame. |
| pointText | anchor: array, [orientation: TextOrientation] | TextFrame Item | Creates a point text frame. |
| removeAll | | Nothing | Deletes all elements in the collection. |

#### Creating and modifying text frames
```javascript
var docRef = documents.add();
var rectRef = docRef .pathitems.rectangle(700, 50, 100, 100);
var areaTextRef = docRef.textFrames.areaText(rectRef);
areaTextRef.contents = "TextFrame #1";
areaTextRef.selected = true;
var lineRef = docRef.pathitems.add();
lineRef.setEntirePath( Array(Array(200, 700), Array(300, 550) ) );
var pathTextRef = docRef.textFrames.pathText(lineRef);
pathTextRef.contents = "TextFrame #2";
pathTextRef.selected = true;
var pointTextRef = docRef.textFrames.add();
pointTextRef.contents = "TextFrame #3";
pointTextRef.top = 700;
pointTextRef.left = 400;
pointTextRef.selected = true;
redraw();
var iCount = docRef.textFrames.length;
var sText = "There are " + iCount + " TextFrames.\r"
sText += "Changing contents of each TextFrame.";
docRef.textFrames [0] .contents = "Area TextFrame.";
docRef.textFrames[1].contents = "Path TextFrame.";
docRef.textFrames[2] .contents = "Point TextFrame.";
redraw();
docRef.textFrames[1] .remove();
redraw();
var iCount = docRef.textFrames.length;
```

### TextPath
A path for area or path text.

**Properties**
| Property | Value type | Description |
| --- | --- | --- |
| area | number (double) | Read-only. The path's area in square points. |
| blendlngMode | BlendModes | The blend mode used when compositing. |
| clipping | boolean | True if the path is a clipping path. |
| closed | boolean | True if the path is closed. |
| editable | boolean | Read-only. True if the item is editable. |
| evenodd | boolean | True if the even-odd rule determines insideness. |
| flllColor | Color | The fill color. |
| filled | boolean | True if the path is filled. |
| flllOverprlnt | boolean | True if art beneath a filled object is overprinted. |
| guides | boolean | True if the path is a guide object. |
| height | number (double) | The item's height. |
| left | number (double) | The position of the left side (in points). |
| note | string | The note assigned to the path. |
| opacity | number (double) | The object's opacity (0.0 to 100.0). |
| parent | Layer or GroupItern | Read-only. The object's parent. |
| pathPolnts | PathPoints | Read-only. The path points in the path. |
| polarity | PolarityValues | The path's polarity. |
| position | array of 2 numbers | The top-left position [x, y] in points. |
| resolution | number (double) | The path's resolution in dots per inch (dpi). |
| selectedPathPoints | PathPoints | Read-only. The selected path points. |
| strokeCap | StrokeCap | The line capping type. |
| strokecolor | Color | The stroke color. |
| stroked | boolean | True if the path is stroked. |
| strokeDashes | object | Dash lengths; empty object `{}` for a solid line. |
| strokeDashOffset | number (double) | The distance into the dash pattern to start. |
| strokejoin | Strokejoin | The path's joint type. |
| strokeMlterLlmlt | number (double) | When a miter join converts to bevel. Range: 1-500. |
| strokeOverprlnt | boolean | True if art beneath a stroked object is overprinted. |
| strokewidth | number (double) | The stroke width. |
| top | number (double) | The position of the top (in points). |
| typename | string | Read-only. The object's class name. |
| width | number (double) | The item's width. |

**Methods**
| Method | Parameter type | Returns | Description |
| --- | --- | --- | --- |
| setEntirePath | pathPoints: array of [x, y] | Nothing | Sets the path using an array of [x, y] points. |

### TextRange
A range of text within a text art item.

**Properties**
| Property | Value type | Description |
| --- | --- | --- |
| characterAttributes | characterAttributes | Read-only. The character properties for the range. |
| characteroffset | number (long) | Offset of the first character. |
| characters | Characters | Read-only. All characters in the range. |
| characterstyles | Characterstyles | Read-only. All referenced character styles. |
| contents | string | The text string. |
| InsertionPolnts | InsertionPolnts | Read-only. All insertion points in the range. |
| kerning | number (long) | Spacing between two characters (in thousandths of an em). |
| length | number (long) | The length in characters. Minimum: 0. |
| lines | Lines | Read-only. All lines in the range. |
| paragraphAttributes | ParagraphAttributes | Read-only. The paragraph properties for the range. |
| paragraphs | Paragraphs | Read-only. All paragraphs in the range. |
| paragraphstyles | Paragraphstyles | Read-only. All referenced paragraph styles. |
| parent | TextRange | Read-only. The object's container. |
| story | story | Read-only. The story containing the range. |
| textRanges | TextRanges | Read-only. All text in the range. |
| textselection | array of TextRange | Read-only. The selected text ranges. |
| typename | string | Read-only. The object's class name. |
| words | words | Read-only. All words in the range. |

**Methods**
| Method | Parameter Type | Returns | Description |
| --- | --- | --- | --- |
| changeCaseTo | type: CaseChangeType | Nothing | Changes the capitalization of text. |
| deSelect | | Nothing | Deselects the text range. |
| duplicate | relativeObject: object, insertionLocation: ElementPlacement | TextRange | Duplicates the object. |
| move | relativeObject: object, insertionLocation: ElementPlacement | TextRange | Moves the object. |
| remove | | Nothing | Deletes the object. |
| select | addToDocument: boolean | Nothing | Selects the text range. |

#### Manipulating text
```javascript
if ( app.documents.length > 0 ) {
    for ( i = 0; i < app.activeDocument.textFrames.length; i++ ) {
        text = app.activeDocument.textFrames[i].textRange;
        for ( j = 0 ; j < text.words.length; j++ ) {
            textword = text.words[j];
            firstChars = textword.characters [0];
            firstChars.size = firstChars.size * 1.5;
        }
    }
}
```

### TextRanges
A collection of `TextRange` objects.

**Properties**
| Property | Value type | Description |
| --- | --- | --- |
| length | number | Read-only. Number of elements in the collection. |
| parent | object | Read-only. The object's container. |
| typename | string | Read-only. The object's class name. |

**Methods**
| Method | Parameter type | Returns | Description |
| --- | --- | --- | --- |
| Index | itemKey: string, number | TextRange | Gets an element from the collection. |
| removeAll | | Nothing | Deletes all elements in the collection. |
### TracingObject
A tracing object links a source raster art item with the vector `PluginItem` group created by tracing. Scripts can initiate tracing using `PlacedItem.trace()` or `RasterItem.trace()`. The resulting `PluginItem` contains this `TracingObject` in its `tracing` property.

Tracing is asynchronous. Use `app.redraw()` after initiating tracing to force the operation before accessing properties or expanding the result. Read-only result properties are valid only after the first tracing completes; a value of 0 indicates incompletion.

**Properties**
| Property | Value type | Description |
| --- | --- | --- |
| anchorCount | number (long) | Read-only. The number of anchors in the tracing result. |
| areaCount | number (long) | Read-only. The number of areas in the tracing result. |
| imageResolution | number (real) | Read-only. The resolution of the source image in pixels per inch. |
| parent | object | Read-only. The object's container. |
| pathCount | number (long) | Read-only. The number of paths in the tracing result. |
| sourceArt | PlacedItem or RasterItem | The source raster art for the tracing. |
| tracingOptions | TracingOptions | The tracing options. |
| typename | string | Read-only. The object's class name. |
| usedColorCount | number (long) | Read-only. The number of colors used in the tracing result. |

**Methods**
| Method | Parameter type | Returns | Description |
| --- | --- | --- | --- |
| expandTracing | [viewed]: boolean | GroupItem | Converts the traced vector art into a new `GroupItem`, replacing the `PluginItem`. If `viewed` is `true`, retains viewing-mode information. Deletes this `TracingObject` and its `PluginItem`. |
| releaseTracing | | PlacedItem or RasterItem | Reverts to the original source raster art, removing the traced vector. Returns the original `PlacedItem` or `RasterItem` and deletes this `TracingObject` and its `PluginItem`. |

### TracingOptions
Options for converting raster art to vector art.

**Properties**
| Property | Value type | Description |
| --- | --- | --- |
| cornerAngle | number (double) | The angle in degrees considered a corner. Range: 0 to 180. |
| fills | boolean | `true` to trace with fills. Requires `fills` or `strokes` to be `true`. |
| ignoreWhite | boolean | If `true`, ignores white fill color. |
| livePaintOutput | boolean | If `true`, the result is Live Paint art; otherwise, classic art. |
| maxColors | number (long) | The maximum number of colors for automatic palette generation. Used only if `tracingMode` is `Color` or `Grayscale`. Range: 2 to 256. |
| maxStrokeWeight | number (double) | The maximum stroke weight, when `strokes` is `true`. Range: 0.01 to 100.0. |
| minArea | number (long) | The smallest feature in square pixels that is traced. |
| minStrokeLength | number (double) | The minimum length in pixels of features to be stroked, when `strokes` is `true`. Range: 0.0 to 200.0. |
| outputToSwatches | boolean | If `true`, generates named swatches for each new color. Used only if `tracingMode` is `Color` or `Grayscale`. |
| palette | string | The name of a color palette to use. An empty string uses the automatic palette. Used only if `tracingMode` is `Color` or `Grayscale`. |
| parent | object | Read-only. The object's container. |
| pathFitting | number (double) | The distance between the traced shape and the original pixel shape. Lower values create a tighter fit. Range: 0.0 to 10.0. |
| preprocessBlur | number (double) | The amount of blur in pixels used during preprocessing. Range: 0.0 to 2.0. |
| preset | string | Read-only. The name of the preset file containing these options. |
| resample | boolean | If `true`, resamples when tracing. Always `true` for placed or linked raster art. |
| resampleResolution | number (double) | The resolution in ppi to use when resampling. |
| strokes | boolean | `true` to trace with strokes. Requires `fills` or `strokes` to be `true`. Used only if `tracingMode` is `BlackAndWhite`. |
| threshold | number (long) | The threshold value for black-and-white tracing. Used only if `tracingMode` is `BlackAndWhite`. Range: 0 to 255. |
| tracingMode | TracingModeType | The color mode for tracing. |
| typename | string | Read-only. The object's class name. |
| viewRaster | ViewRasterType | The preview view for the raster image. |
| viewVector | ViewVectorType | The preview view for the vector result. |

**Methods**
| Method | Parameter type | Returns | Description |
| --- | --- | --- | --- |
| loadFromPreset | presetName: string | boolean | Loads options from a preset in `app.tracingPresetList`. |
| storeToPreset | presetName: string | boolean | Saves options to a preset in `app.tracingPresetList`. Overwrites unlocked presets. Returns `false` if the preset is locked. |

### Variable
A document variable that can be imported or exported. A dynamic object for data-driven graphics, accessed via the Variables palette.

**Properties**
| Property | Value type | Description |
| --- | --- | --- |
| kind | VariableKind | The variable's type. |
| name | string | The name of the variable. |
| pageItems | PageItems | Read-only. All of the artwork in the variable. |
| parent | object | Read-only. The object that contains the variable. |
| typename | string | Read-only. The class name of the referenced object. |

**Methods**
| Method | Parameter type | Returns | Description |
| --- | --- | --- | --- |
| remove | | Nothing | Removes the variable from the collection. |

### Variables
The collection of `Variable` objects in the document.

**Properties**
| Property | Value type | Description |
| --- | --- | --- |
| length | number | Read-only. The number of variables in the document. |
| parent | object | Read-only. The object that contains the collection. |
| typename | string | Read-only. The class name of the referenced object. |

**Methods**
| Method | Parameter type | Returns | Description |
| --- | --- | --- | --- |
| add | | Variable | Adds a new variable to the collection. |
| getByName | name: string | Variable | Gets the first element with the specified name. |
| index | itemKey: string, number | Variable | Gets an element from the collection. |
| removeAll | | Nothing | Deletes all elements in the collection. |

### View
A window view onto a document. Scripts can modify existing views but not create new ones.

**Properties**
| Property | Value type | Description |
| --- | --- | --- |
| bounds | array of 4 numbers | Read-only. The bounding rectangle of this view relative to the document's bounds. |
| centerPoint | array of 2 numbers | The center point of this view relative to the document's bounds. |
| rotateAngle | number | The rotation angle of this view. |
| parent | Document | Read-only. The document that contains this view. |
| screenMode | ScreenMode | The display mode for this view. |
| typename | string | Read-only. The class name of the referenced object. |
| zoom | number (double) | The zoom factor, where 100.0 is 100%. |

#### Setting a view to full screen
```javascript
if ( app.documents.length > 0 ) {
    app.documents[0].views[0].screenMode = ScreenMode.FULLSCREEN;
}
```

### Views
A collection of `View` objects in a document.

**Properties**
| Property | Value type | Description |
| --- | --- | --- |
| length | number | Read-only. The number of objects in the collection. |
| parent | object | Read-only. The parent of this object. |
| typename | string | Read-only. The class name of the referenced object. |

**Methods**
| Method | Parameter type | Returns | Description |
| --- | --- | --- | --- |
| index | itemKey: string, number | View | Gets an element from the collection. |

### Words
A collection of `TextRange` words in a text item, accessed by index.

**Properties**
| Property | Value type | Description |
| --- | --- | --- |
| length | number | Read-only. The number of objects in the collection. |
| parent | object | Read-only. The parent of this object. |
| typename | string | Read-only. The class name of the object. |

**Methods**
| Method | Parameter type | Returns | Description |
| --- | --- | --- | --- |
| add | contents: string [, relativeObject: TextFrameItem] [, insertionLocation: ElementPlacement] | TextRange | Adds a word at the specified location. If no location is specified, adds it after the current selection or insertion point. |
| addBefore | contents: string | TextRange | Adds a word before the current selection or insertion point. |
| index | itemKey: number | TextRange | Gets an element from the collection. |
| removeAll | | Nothing | Deletes all elements in this collection. |

#### Counting words
```javascript
if ( app.documents.length > 0 ) {
    numWords = 0 ;
    for ( i = 0; i < app.activeDocument.textFrames.length; i++) {
        numWords += app.activeDocument.textFrames[i].words.length;
    }
}
```

#### Applying attributes to words
```javascript
if ( app.documents.length > 0 && app.activeDocument.textFrames.length > 0 ) {
    wordColor = new RGBColor();
    wordColor.red = 255;
    wordColor.green = 0;
    wordColor.blue = 255;
    searchWord1 = "the";
    searchWord2 = "The";
    searchWord3 = "THE";
    for ( i = 0; i < app.activeDocument.textFrames.length; i++ ) {
        textArt = activeDocument.textFrames[i];
        for ( j =0; j < textArt.words.length; j++) {
            word = textArt.words[j];
            if ( word.contents == searchWord1 || word.contents == searchWord2 || word.contents == searchWord3 ) {
                word.filled = true;
                word.fillColor = wordColor;
            }
        }
    }
}
```

# 2 Scripting Constants
Enumerations for use with Illustrator JavaScript properties and methods.

| Constant Type | Values | Description |
| --- | --- | --- |
| AlternateGlyphsForm | DEFAULTFORM, TRADITIONAL, EXPERT, JIS78FORM, JIS83FORM, HALFWIDTH, THIRDWIDTH, QUARTERWIDTH, FULLWIDTH, PROPORTIONALWIDTH, JIS90FORM, JIS04FORM | |
| AntiAliasingMethod | None, ARTOPTIMIZED, TYPEOPTIMIZED | The antialiasing method used for rasterization. |
| ArtClippingOption | OUTPUTARTBOUNDS, OUTPUTARTBOARDBOUNDS, OUTPUTCROPRECTBOUNDS | How the art should be clipped during output. |
| AutoCADColors | Max8Colors, Max16Colors, Max256Colors, TrueColors | |
| AutoCADCompatibility | AutoCADRelease13, AutoCADRelease18, AutoCADRelease14, AutoCADRelease21, AutoCADRelease15, AutoCADRelease24 | |
| AutoCADExportFileFormat | DXF, DWG | |
| AutoCADExportOption | PreserveAppearance, MaximizeEditability | |
| AutoCADGlobalScaleOption | Originalsize, FitArtboard, ScaleByValue | |
| AutoCADRasterFormat | PNG, JPEG | |
| AutoCADUnit | Points, Millimeters, Picas, Centimeters, Inches, Pixels | |
| AutoKernType | NOAUTOKERN, OPTICAL, AUTO, METRICSROMANONLY | |
| AutoLeadingType | BOTTOMTOBOTTOM, TOPTOTOP | |
| BaselineDirectionType | Standard, TateChuYoko, VerticalRotated | |
| BlendAnimationType | INBUILD, NOBLENDANIMATION, INSEQUENCE | |
| BlendModes | COLORBLEND, COLORBURN, COLORDODGE, LUMINOSITY, MULTIPLY, DARKEN, NORMAL, DIFFERENCE, OVERLAY, EXCLUSION, SATURATIONBLEND, HARDLIGHT, SCREEN, HUE, SOFTLIGHT | The compositing blend mode for an object. |
| BlendsExpandPolicy | AUTOMATICALLYCONVERTBLENDS, RASTERIZEBLENDS | Policy used by FXG file format to expand blends. |
| BurasagariTypeEnum | Forced, None, Standard | |
| CaseChangeType | LOWERCASE, SENTENCECASE, TITLECASE, UPPERCASE | |
| ColorConversion | COLORCONVERSIONREPURPOSE, COLORCONVERSIONTODEST, None | |
| ColorConvertPurpose | defaultpurpose, previewpurpose, exportpurpose, dummypurpose | The purpose of color conversion using `Application.convertSampleColor()`. |
| ColorDestination | COLORDESTINATIONDOCCMYK, COLORDESTINATIONDOCRGB, COLORDESTINATIONPROFILE, COLORDESTINATIONWORKINGCMYK, COLORDESTINATIONWORKINGRGB, None | |
| ColorDitherMethod | DIFFUSION, NOISE, NOREDUCTION, PATTERNDITHER | The method used to dither colors in exported GIF and PNG8 images. |
| ColorModel | PROCESS, REGISTRATION, SPOT | |
| ColorProfile | INCLUDEALLPROFILE, INCLUDEDESTPROFILE, INCLUDERGBPROFILE, LEAVEPROFILEUNCHANGED, None | |
| ColorReductionMethod | ADAPTIVE, PERCEPTUAL, SELECTIVE, WEB | The method used to reduce colors in exported GIF and PNG8 images. |
| ColorType | CMYK, PATTERN, GRADIENT, RGB, GRAY, SPOT, NONE | The color specification for an individual color. |
| Compatibility | ILLUSTR
