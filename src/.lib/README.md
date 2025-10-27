# AIS Library - Adobe Illustrator Scripts Framework

**Version:** 1.0.1  
**License:** MIT

The AIS (Adobe Illustrator Scripts) library provides a unified framework for all production scripts in this repository. It ensures consistent behavior, error handling, and utility functions across 200+ scripts.

## Quick Start

Include the library in your script:

```javascript
#include "../lib/core.jsx"

// Now use AIS namespace functions
if (!AIS.Document.hasDocument()) {
    alert('No document open');
    return;
}
```

## Library Files

- **`core.jsx`** (922 lines) - Core utilities, error handling, units, JSON, document checks
- **`ui.jsx`** (477 lines) - UI components and dialog builders

## API Reference

### AIS.Core

Version and metadata management.

```javascript
AIS.Core.version                    // '1.0.1'
AIS.Core.getVersion()               // {library: '1.0.1', illustrator: 25, extendscript: '4.5.7'}
AIS.Core.checkVersion()             // true if Illustrator CC 2012+
```

### AIS.Error

Error handling and user feedback.

```javascript
AIS.Error.format(message, err)      // Format error with details
AIS.Error.show(message, err)        // Show error dialog
AIS.Error.log(scriptName, msg, err) // Log to temp file
```

**Example:**
```javascript
try {
    // Your code
} catch (err) {
    AIS.Error.show('Operation failed', err);
}
```

### AIS.Document

Document state checks.

```javascript
AIS.Document.hasDocument()          // Check if document is open
AIS.Document.hasSelection()         // Check if selection exists
AIS.Document.getActive()            // Get active document (null-safe)
```

**Example:**
```javascript
if (!AIS.Document.hasDocument()) {
    alert('No document\nOpen a document and try again');
    return;
}
```

### AIS.Units

Unit conversion utilities.

```javascript
AIS.Units.get()                     // Get current document units ('px', 'pt', 'mm', 'cm', 'in')
AIS.Units.convert(value, from, to)  // Convert between units
```

**Supported Units:**
- `px` - Pixels (72 DPI)
- `pt` - Points
- `mm` - Millimeters
- `cm` - Centimeters
- `in` - Inches

**Example:**
```javascript
var mm = AIS.Units.convert(72, 'pt', 'mm');  // 25.4
var pt = AIS.Units.convert(1, 'in', 'pt');   // 72
var units = AIS.Units.get();                  // 'mm'
```

**Conversion Factors:**
- 1 inch = 72 points
- 1 inch = 25.4 mm
- 1 inch = 2.54 cm
- 1 mm = 2.834645 points

### AIS.JSON

Safe JSON handling for ExtendScript.

```javascript
AIS.JSON.stringify(obj)             // Serialize object to JSON string
AIS.JSON.parse(str)                 // Parse JSON string to object
```

**Example:**
```javascript
var config = {width: 100, height: 200};
var json = AIS.JSON.stringify(config);     // '{"width":100,"height":200}'
var obj = AIS.JSON.parse(json);            // {width: 100, height: 200}
```

**Features:**
- Handles all JavaScript primitives
- Supports nested objects and arrays
- Safe error handling with try-catch
- Compatible with ExtendScript's limited JSON support

### AIS.System

System and platform utilities.

```javascript
AIS.System.isMac()                  // true on macOS
AIS.System.isWindows()              // true on Windows
AIS.System.openURL(url)             // Open URL in browser
```

**Example:**
```javascript
if (AIS.System.isMac()) {
    // Mac-specific code
}

AIS.System.openURL('https://example.com');
```

### AIS.String

String manipulation utilities.

```javascript
AIS.String.trim(str)                // Remove whitespace from ends
AIS.String.pad(str, length, char)   // Pad string to length
```

**Example:**
```javascript
var clean = AIS.String.trim('  hello  ');     // 'hello'
var padded = AIS.String.pad('5', 3, '0');     // '005'
```

### AIS.Number

Number formatting and validation.

```javascript
AIS.Number.format(num, decimals)    // Format with decimal places
AIS.Number.isValid(value)           // Check if valid number
```

**Example:**
```javascript
var formatted = AIS.Number.format(3.14159, 2);  // '3.14'
var valid = AIS.Number.isValid('123');          // true
```

## Usage Patterns

### Document Validation

```javascript
(function() {
    if (!AIS.Document.hasDocument()) {
        alert('No document\nOpen a document and try again');
        return;
    }
    
    if (!AIS.Document.hasSelection()) {
        alert('No selection\nSelect objects and try again');
        return;
    }
    
    main();
})();
```

### Settings Persistence

```javascript
var SETTINGS = {
    name: 'my-script-settings.json',
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

### Unit Conversion

```javascript
// Get user input in mm, convert to points for Illustrator
var widthMM = 100;
var widthPt = AIS.Units.convert(widthMM, 'mm', 'pt');  // 283.46

// Respect document units
var units = AIS.Units.get();  // 'mm'
var displayValue = AIS.Units.convert(widthPt, 'pt', units);
```

### Error Handling

```javascript
function main() {
    try {
        var doc = AIS.Document.getActive();
        if (!doc) {
            alert('No active document');
            return;
        }
        
        // Your code here
        
    } catch (err) {
        AIS.Error.show('Script failed', err);
    }
}
```

## Design Principles

1. **Namespace Pollution Prevention:** All functions under `AIS` namespace
2. **ES3 Compliance:** No ES6+ syntax (const, let, arrow functions, classes)
3. **Null Safety:** Defensive checks for undefined/null values
4. **User Feedback:** Clear error messages with actionable guidance
5. **Cross-Platform:** Works on Mac and Windows
6. **Backward Compatible:** Supports Illustrator CC 2012+

## Extending the Library

When adding new utilities:

1. **Add to existing namespace** (AIS.Units, AIS.String, etc.)
2. **Follow ES3 syntax** strictly
3. **Document with JSDoc** comments
4. **Test on Illustrator** CC 2019+
5. **Update this README** with new API

## Version History

- **v1.0.1** (2025-10-27): Enhanced error recovery, defensive programming
- **v1.0.0** (2025-10-26): Initial release with 208 production scripts

## See Also

- **[CLAUDE.md](../CLAUDE.md)** - Development guidelines and script structure
- **[AGENTS.md](../AGENTS.md)** - Modernization methodology (43KB guide)
- **[README.md](../README.md)** - Project overview and script catalog
- **[CONTRIBUTING.md](../CONTRIBUTING.md)** - Contribution guidelines

---

**Questions?** Check the 200+ production scripts in this repository for real-world usage examples.
