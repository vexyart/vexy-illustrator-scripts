/**
 * Adobe Illustrator Scripts - Core Library
 * @version 1.0.5
 * @description Core utilities and foundation for all AIS scripts
 * @namespace AIS
 * @license MIT
 *
 * Changelog:
 * - v1.0.5 (2025-10-27): Added JSDoc examples to 13 functions + enhanced AIS.JSON.stringify() validation
 * - v1.0.4 (2025-10-27): CRITICAL FIX: AIS.String.toNumber() default value (1→0) + null checks + JSDoc examples
 * - v1.0.3 (2025-10-27): Enhanced AIS.Units.convert() with unit validation + isValidUnit() helper
 * - v1.0.2 (2025-10-27): Security fix (HTTPS default in openURL) + JSDoc @example tags
 * - v1.0.1 (2025-10-27): Enhanced error recovery and defensive programming
 * - v1.0.0 (2025-10-26): Initial release
 */

// ============================================================================
// NAMESPACE
// ============================================================================

/**
 * Adobe Illustrator Scripts global namespace
 * All script utilities live under this namespace to avoid global pollution
 */
var AIS = AIS || {};

// ============================================================================
// VERSION & METADATA
// ============================================================================

AIS.Core = {
    version: '1.0.5',
    name: 'AIS Core Library',
    minIllustratorVersion: 16, // CC 2012

    /**
     * Get version information
     * @returns {Object} Version details
     */
    getVersion: function() {
        return {
            library: this.version,
            illustrator: parseInt(app.version),
            extendscript: $.version
        };
    },

    /**
     * Check if current Illustrator version meets minimum requirement
     * @returns {Boolean} True if version is sufficient
     */
    checkVersion: function() {
        var current = parseInt(app.version);
        return current >= this.minIllustratorVersion;
    }
};

// ============================================================================
// ERROR HANDLING
// ============================================================================

/**
 * Error handling utilities
 */
AIS.Error = {
    /**
     * Create a formatted error message
     * @param {String} message - Error message
     * @param {Error} err - Original error object (optional)
     * @returns {String} Formatted error message
     * @example
     * // Format simple error
     * var msg = AIS.Error.format('Failed to process selection');
     * @example
     * // Format error with exception
     * try { /* ... */ } catch (e) {
     *     var msg = AIS.Error.format('Operation failed', e);
     * }
     */
    format: function(message, err) {
        var msg = 'Error: ' + message;
        if (err) {
            msg += '\nDetails: ' + err.message;
            if (err.line) {
                msg += '\nLine: ' + err.line;
            }
        }
        return msg;
    },

    /**
     * Show error dialog to user
     * @param {String} message - Error message
     * @param {Error} err - Original error object (optional)
     */
    show: function(message, err) {
        alert(this.format(message, err));
    },

    /**
     * Log error to file
     * @param {String} scriptName - Name of script
     * @param {String} message - Error message
     * @param {Error} err - Original error object (optional)
     * @example
     * // Log error to temp folder
     * AIS.Error.log('MyScript', 'Failed to save file', error);
     */
    log: function(scriptName, message, err) {
        try {
            var logFile = new File(Folder.temp + '/AIS_errors.log');
            logFile.open('a');
            var timestamp = new Date().toString();
            var entry = '\n[' + timestamp + '] ' + scriptName + ': ' + message;
            if (err) {
                entry += ' | ' + err.message;
                if (err.line) entry += ' (line ' + err.line + ')';
            }
            logFile.writeln(entry);
            logFile.close();
        } catch (e) {
            // Silent fail on logging errors
        }
    }
};

// ============================================================================
// LOGGING
// ============================================================================

/**
 * Logging utilities
 */
AIS.Log = {
    enabled: false,

    /**
     * Enable logging
     */
    enable: function() {
        this.enabled = true;
    },

    /**
     * Disable logging
     */
    disable: function() {
        this.enabled = false;
    },

    /**
     * Write log entry
     * @param {String} message - Log message
     * @param {String} level - Log level (info, warn, error)
     */
    write: function(message, level) {
        if (!this.enabled) return;

        level = level || 'info';
        try {
            var logFile = new File(Folder.temp + '/AIS_debug.log');
            logFile.open('a');
            var timestamp = new Date().toString();
            var entry = '[' + timestamp + '] [' + level.toUpperCase() + '] ' + message;
            logFile.writeln(entry);
            logFile.close();
        } catch (e) {
            // Silent fail
        }
    },

    /**
     * Log info message
     * @param {String} message - Info message
     */
    info: function(message) {
        this.write(message, 'info');
    },

    /**
     * Log warning message
     * @param {String} message - Warning message
     */
    warn: function(message) {
        this.write(message, 'warn');
    },

    /**
     * Log error message
     * @param {String} message - Error message
     */
    error: function(message) {
        this.write(message, 'error');
    }
};

// ============================================================================
// STRING UTILITIES
// ============================================================================

/**
 * String manipulation utilities
 */
AIS.String = {
    /**
     * Check if string is empty or only whitespace
     * @param {String} str - String to check
     * @returns {Boolean} True if empty
     * @example
     * AIS.String.isEmpty(''); // true
     * AIS.String.isEmpty('  '); // true
     * AIS.String.isEmpty('text'); // false
     */
    isEmpty: function(str) {
        if (str === null || str === undefined) return true;
        return str.toString().replace(/\s/g, '').length === 0;
    },

    /**
     * Trim whitespace from string
     * @param {String} str - String to trim
     * @returns {String} Trimmed string
     * @example
     * AIS.String.trim('  hello  '); // 'hello'
     */
    trim: function(str) {
        if (!str) return '';
        return str.toString().replace(/^\s+|\s+$/g, '');
    },

    /**
     * Pad number with leading zeros
     * @param {Number} num - Number to pad
     * @param {Number} length - Total length
     * @returns {String} Padded string
     * @example
     * AIS.String.padZero(5, 3); // '005'
     * AIS.String.padZero(42, 5); // '00042'
     */
    padZero: function(num, length) {
        var str = '00000000000' + Math.abs(num);
        var sign = num < 0 ? '-' : '';
        return sign + str.slice(-length);
    },

    /**
     * Capitalize first letter
     * @param {String} str - String to capitalize
     * @returns {String} Capitalized string
     */
    capitalize: function(str) {
        if (!str) return '';
        str = str.toString();
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    },

    /**
     * Convert to title case
     * @param {String} str - String to convert
     * @returns {String} Title case string
     */
    toTitleCase: function(str) {
        if (!str) return '';
        var words = str.toString().split(' ');
        var result = [];
        for (var i = 0; i < words.length; i++) {
            result.push(this.capitalize(words[i]));
        }
        return result.join(' ');
    },

    /**
     * Format template string with values
     * @param {String} template - Template with {0}, {1} placeholders
     * @param {...*} values - Values to insert
     * @returns {String} Formatted string (returns template unchanged if invalid)
     */
    format: function(template) {
        // Defensive: check for null/undefined
        if (!template) return '';
        if (typeof template !== 'string') template = template.toString();

        var args = Array.prototype.slice.call(arguments, 1);
        return template.replace(/\{(\d+)\}/g, function(match, index) {
            var value = args[index];
            // Defensive: handle null/undefined values
            if (value === null || value === undefined) return match;
            return value.toString();
        });
    }
};

// ============================================================================
// ARRAY UTILITIES
// ============================================================================

/**
 * Array manipulation utilities
 */
AIS.Array = {
    /**
     * Check if value exists in array
     * @param {Array} arr - Array to search
     * @param {*} value - Value to find
     * @returns {Boolean} True if found
     * @example
     * AIS.Array.contains([1, 2, 3], 2); // true
     * AIS.Array.contains(['a', 'b'], 'c'); // false
     */
    contains: function(arr, value) {
        for (var i = 0; i < arr.length; i++) {
            if (arr[i] === value) return true;
        }
        return false;
    },

    /**
     * Get unique values from array
     * @param {Array} arr - Input array
     * @returns {Array} Array with unique values
     * @example
     * AIS.Array.unique([1, 2, 2, 3, 1]); // [1, 2, 3]
     */
    unique: function(arr) {
        var result = [];
        for (var i = 0; i < arr.length; i++) {
            if (!this.contains(result, arr[i])) {
                result.push(arr[i]);
            }
        }
        return result;
    },

    /**
     * Filter array by predicate function
     * @param {Array} arr - Input array
     * @param {Function} predicate - Filter function
     * @returns {Array} Filtered array
     */
    filter: function(arr, predicate) {
        var result = [];
        for (var i = 0; i < arr.length; i++) {
            if (predicate(arr[i], i)) {
                result.push(arr[i]);
            }
        }
        return result;
    },

    /**
     * Map array to new values
     * @param {Array} arr - Input array
     * @param {Function} mapper - Mapping function
     * @returns {Array} Mapped array
     */
    map: function(arr, mapper) {
        var result = [];
        for (var i = 0; i < arr.length; i++) {
            result.push(mapper(arr[i], i));
        }
        return result;
    },

    /**
     * Sort array by comparator
     * @param {Array} arr - Input array
     * @param {Function} comparator - Comparison function
     * @returns {Array} Sorted array (modifies in place)
     */
    sort: function(arr, comparator) {
        return arr.sort(comparator);
    },

    /**
     * Shuffle array randomly
     * @param {Array} arr - Input array
     * @returns {Array} Shuffled array (modifies in place)
     */
    shuffle: function(arr) {
        for (var i = arr.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var temp = arr[i];
            arr[i] = arr[j];
            arr[j] = temp;
        }
        return arr;
    }
};

// ============================================================================
// OBJECT UTILITIES
// ============================================================================

/**
 * Object manipulation utilities
 */
AIS.Object = {
    /**
     * Extend target object with source properties
     * @param {Object} target - Target object
     * @param {Object} source - Source object
     * @returns {Object} Extended object
     * @example
     * var obj = {a: 1};
     * AIS.Object.extend(obj, {b: 2}); // {a: 1, b: 2}
     */
    extend: function(target, source) {
        for (var key in source) {
            if (source.hasOwnProperty(key)) {
                target[key] = source[key];
            }
        }
        return target;
    },

    /**
     * Create deep copy of object
     * @param {Object} obj - Object to clone
     * @returns {Object} Cloned object
     * @example
     * var original = {x: 1, y: {z: 2}};
     * var copy = AIS.Object.clone(original);
     */
    clone: function(obj) {
        if (obj === null || typeof obj !== 'object') return obj;

        var copy = obj.constructor();
        for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
                copy[key] = this.clone(obj[key]);
            }
        }
        return copy;
    },

    /**
     * Get object keys
     * @param {Object} obj - Input object
     * @returns {Array} Array of keys
     */
    keys: function(obj) {
        var keys = [];
        for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
                keys.push(key);
            }
        }
        return keys;
    },

    /**
     * Get object values
     * @param {Object} obj - Input object
     * @returns {Array} Array of values
     */
    values: function(obj) {
        var values = [];
        for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
                values.push(obj[key]);
            }
        }
        return values;
    }
};

// ============================================================================
// NUMBER UTILITIES
// ============================================================================

/**
 * Number manipulation utilities
 */
AIS.Number = {
    /**
     * Clamp number between min and max
     * @param {Number} value - Input value
     * @param {Number} min - Minimum value
     * @param {Number} max - Maximum value
     * @returns {Number} Clamped value (returns min if value is invalid)
     * @example
     * AIS.Number.clamp(150, 0, 100); // 100
     * AIS.Number.clamp(-50, 0, 100); // 0
     * AIS.Number.clamp(75, 0, 100); // 75
     */
    clamp: function(value, min, max) {
        // Defensive: convert to numbers
        value = Number(value);
        min = Number(min);
        max = Number(max);

        // Defensive: check for NaN
        if (isNaN(value)) return min;
        if (isNaN(min)) min = -Infinity;
        if (isNaN(max)) max = Infinity;

        // Defensive: swap if min > max
        if (min > max) {
            var temp = min;
            min = max;
            max = temp;
        }

        return Math.max(min, Math.min(max, value));
    },

    /**
     * Round to specified decimal places
     * @param {Number} value - Input value
     * @param {Number} decimals - Decimal places
     * @returns {Number} Rounded value
     * @example
     * AIS.Number.round(3.14159, 2); // 3.14
     * AIS.Number.round(2.5); // 3
     */
    round: function(value, decimals) {
        decimals = decimals || 0;
        var multiplier = Math.pow(10, decimals);
        return Math.round(value * multiplier) / multiplier;
    },

    /**
     * Check if value is in range
     * @param {Number} value - Value to check
     * @param {Number} min - Minimum value
     * @param {Number} max - Maximum value
     * @returns {Boolean} True if in range
     */
    inRange: function(value, min, max) {
        return value >= min && value <= max;
    },

    /**
     * Linear interpolation between two values
     * @param {Number} start - Start value
     * @param {Number} end - End value
     * @param {Number} t - Interpolation factor (0-1)
     * @returns {Number} Interpolated value
     */
    lerp: function(start, end, t) {
        return start + (end - start) * t;
    }
};

// ============================================================================
// FILE PATH UTILITIES
// ============================================================================

/**
 * File path manipulation utilities
 */
AIS.Path = {
    /**
     * Get file name from path
     * @param {String} path - File path
     * @returns {String} File name (empty string if path is invalid)
     */
    getFileName: function(path) {
        // Defensive: check for null/undefined
        if (!path || typeof path !== 'string') return '';
        return path.replace(/^.*[\\\/]/, '');
    },

    /**
     * Get file extension
     * @param {String} path - File path
     * @returns {String} File extension (without dot, empty string if none)
     */
    getExtension: function(path) {
        // Defensive: check for null/undefined
        if (!path || typeof path !== 'string') return '';
        var match = path.match(/\.([^.]+)$/);
        return match ? match[1] : '';
    },

    /**
     * Get file name without extension
     * @param {String} path - File path
     * @returns {String} File name without extension
     */
    getBaseName: function(path) {
        var name = this.getFileName(path);
        return name.replace(/\.[^.]+$/, '');
    },

    /**
     * Get directory path
     * @param {String} path - File path
     * @returns {String} Directory path
     */
    getDirectory: function(path) {
        return path.replace(/[^\\\/]+$/, '');
    },

    /**
     * Join path components
     * @param {...String} components - Path components
     * @returns {String} Joined path
     */
    join: function() {
        var separator = $.os.match(/windows/i) ? '\\' : '/';
        var parts = Array.prototype.slice.call(arguments);
        var result = parts.join(separator);
        // Clean up multiple separators
        return result.replace(/[\\\/]+/g, separator);
    }
};

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

/**
 * Input validation utilities
 */
AIS.Validate = {
    /**
     * Check if value is a number
     * @param {*} value - Value to check
     * @returns {Boolean} True if number
     * @example
     * AIS.Validate.isNumber(42); // true
     * AIS.Validate.isNumber('42'); // false
     * AIS.Validate.isNumber(NaN); // false
     */
    isNumber: function(value) {
        return typeof value === 'number' && !isNaN(value) && isFinite(value);
    },

    /**
     * Check if value is a positive number
     * @param {*} value - Value to check
     * @returns {Boolean} True if positive number
     */
    isPositive: function(value) {
        return this.isNumber(value) && value > 0;
    },

    /**
     * Check if value is a non-negative number
     * @param {*} value - Value to check
     * @returns {Boolean} True if non-negative number
     */
    isNonNegative: function(value) {
        return this.isNumber(value) && value >= 0;
    },

    /**
     * Check if value is an integer
     * @param {*} value - Value to check
     * @returns {Boolean} True if integer
     */
    isInteger: function(value) {
        return this.isNumber(value) && value === Math.floor(value);
    },

    /**
     * Parse number from string with validation
     * @param {String} str - String to parse
     * @param {Number} defaultValue - Default value if invalid
     * @returns {Number} Parsed number
     */
    parseNumber: function(str, defaultValue) {
        var num = parseFloat(str);
        return this.isNumber(num) ? num : (defaultValue || 0);
    },

    /**
     * Parse integer from string with validation
     * @param {String} str - String to parse
     * @param {Number} defaultValue - Default value if invalid
     * @returns {Number} Parsed integer
     */
    parseInt: function(str, defaultValue) {
        var num = parseInt(str, 10);
        return this.isInteger(num) ? num : (defaultValue || 0);
    }
};

// ============================================================================
// DOCUMENT UTILITIES
// ============================================================================

/**
 * Document utilities
 */
AIS.Document = {
    /**
     * Check if document is open
     * @returns {Boolean} True if document is open
     */
    hasDocument: function() {
        return app.documents.length > 0;
    },

    /**
     * Get active document safely
     * @returns {Document|null} Active document or null
     */
    getActive: function() {
        return this.hasDocument() ? app.activeDocument : null;
    },

    /**
     * Check if selection exists
     * @returns {Boolean} True if items are selected
     * @example
     * // Validate before processing selection
     * if (!AIS.Document.hasSelection()) {
     *     alert('Please select at least one object');
     *     return;
     * }
     * // Process selection...
     */
    hasSelection: function() {
        var doc = this.getActive();
        return doc && doc.selection.length > 0;
    },

    /**
     * Get selected items
     * @returns {Array} Array of selected items
     */
    getSelection: function() {
        var doc = this.getActive();
        return doc ? doc.selection : [];
    },

    /**
     * Begin undo group
     * @param {String} name - Undo group name
     */
    beginUndo: function(name) {
        var doc = this.getActive();
        if (doc) {
            try {
                doc.swatches.add().remove(); // Trigger undo
                app.undo();
            } catch (e) {}
        }
    },

    /**
     * Redraw document
     */
    redraw: function() {
        var doc = this.getActive();
        if (doc) {
            app.redraw();
        }
    }
};

// ============================================================================
// UNITS UTILITIES
// ============================================================================

/**
 * Unit conversion and management utilities
 */
AIS.Units = {
    /**
     * Get active document ruler units
     * @returns {String} Shortened units (px, pt, mm, etc.)
     */
    get: function() {
        if (!app.documents.length) return '';
        var key = app.activeDocument.rulerUnits.toString().replace('RulerUnits.', '');
        switch (key) {
            case 'Pixels': return 'px';
            case 'Points': return 'pt';
            case 'Picas': return 'pc';
            case 'Inches': return 'in';
            case 'Millimeters': return 'mm';
            case 'Centimeters': return 'cm';
            case 'Meters': return 'm';
            case 'Feet': return 'ft';
            case 'FeetInches': return 'ft';
            case 'Yards': return 'yd';
            case 'Unknown':
                var xmp = app.activeDocument.XMPString;
                if (/stDim:unit/i.test(xmp)) {
                    var units = /<stDim:unit>(.*?)<\/stDim:unit>/g.exec(xmp)[1];
                    if (units == 'Meters') return 'm';
                    if (units == 'Feet') return 'ft';
                    if (units == 'FeetInches') return 'ft';
                    if (units == 'Yards') return 'yd';
                    return 'px';
                }
                break;
            default: return 'px';
        }
    },

    /**
     * Valid unit abbreviations supported by ExtendScript UnitValue
     */
    validUnits: ['px', 'pt', 'pc', 'in', 'mm', 'cm', 'm', 'ft', 'yd'],

    /**
     * Check if unit name is valid
     * @param {String} unit - Unit abbreviation to check
     * @returns {Boolean} True if valid unit
     * @example
     * AIS.Units.isValidUnit('mm'); // Returns true
     * AIS.Units.isValidUnit('xyz'); // Returns false
     */
    isValidUnit: function(unit) {
        if (!unit || typeof unit !== 'string') return false;
        return AIS.Array.contains(this.validUnits, unit.toLowerCase());
    },

    /**
     * Convert value from one unit to another
     * @param {Number} value - Numeric value to convert
     * @param {String} fromUnits - Current units (e.g., 'in', 'mm', 'pt')
     * @param {String} toUnits - Target units (e.g., 'in', 'mm', 'pt')
     * @returns {Number} Converted value (returns 0 on error)
     * @example
     * // Convert 72 points to millimeters
     * var mm = AIS.Units.convert(72, 'pt', 'mm'); // Returns 25.4
     *
     * @example
     * // Convert inches to points
     * var pts = AIS.Units.convert(1, 'in', 'pt'); // Returns 72
     *
     * @example
     * // Use with object dimensions
     * var widthMM = AIS.Units.convert(item.width, 'pt', 'mm');
     *
     * @example
     * // Handles invalid inputs gracefully
     * AIS.Units.convert(NaN, 'pt', 'mm'); // Returns 0
     * AIS.Units.convert(100, 'invalid', 'mm'); // Returns 100 (original value)
     * AIS.Units.convert(Infinity, 'pt', 'mm'); // Returns 0 (clamped)
     */
    convert: function(value, fromUnits, toUnits) {
        // Defensive: check for null/undefined
        if (value == null || value === undefined) return 0;
        if (!fromUnits || !toUnits) return Number(value) || 0;

        // Defensive: handle non-numeric values
        var numValue = Number(value);
        if (isNaN(numValue)) return 0;

        // Defensive: handle Infinity
        if (!isFinite(numValue)) return 0;

        // Defensive: validate unit names (warn in console if invalid)
        if (!this.isValidUnit(fromUnits)) {
            $.writeln('Warning: Invalid source unit "' + fromUnits + '". Returning original value.');
            return numValue;
        }
        if (!this.isValidUnit(toUnits)) {
            $.writeln('Warning: Invalid target unit "' + toUnits + '". Returning original value.');
            return numValue;
        }

        try {
            return UnitValue(numValue, fromUnits).as(toUnits);
        } catch (e) {
            // Graceful degradation: return original value on conversion error
            $.writeln('Warning: Unit conversion failed (' + fromUnits + ' -> ' + toUnits + '). ' + e.message);
            return numValue;
        }
    }
};

// ============================================================================
// JSON UTILITIES
// ============================================================================

/**
 * JSON serialization utilities (ExtendScript doesn't have native JSON)
 */
AIS.JSON = {
    /**
     * Stringify object to JSON-like string
     * @param {Object} obj - Object to serialize
     * @returns {String} JSON-like string (returns '{}' on error)
     * @example
     * // Save script settings
     * var config = {width: 100, height: 200, unit: 'mm'};
     * var jsonStr = AIS.JSON.stringify(config);
     * // Returns: '{"width":"100","height":"200","unit":"mm"}'
     *
     * @example
     * // Handles null/undefined values gracefully
     * AIS.JSON.stringify({a: null, b: 'text'}); // '{"a":"null","b":"text"}'
     * AIS.JSON.stringify(null); // '{}'
     *
     * @note Does not handle circular references - avoid DOM objects
     */
    stringify: function(obj) {
        // Defensive: check for null/undefined
        if (obj == null || obj === undefined) return '{}';

        // Defensive: check for non-object types
        if (typeof obj !== 'object') return '{}';

        try {
            var json = [];
            for (var key in obj) {
                if (obj.hasOwnProperty(key)) {
                    var value = obj[key];

                    // Defensive: handle null/undefined values
                    if (value == null || value === undefined) {
                        value = 'null';
                    } else {
                        // Safe toString conversion
                        try {
                            value = value.toString();
                        } catch (e) {
                            value = 'null';
                        }
                    }

                    // Escape special characters
                    value = value
                        .replace(/\t/g, "\\t")
                        .replace(/\r/g, "\\r")
                        .replace(/\n/g, "\\n")
                        .replace(/"/g, '\\"');

                    json.push('"' + key + '":"' + value + '"');
                }
            }
            return '{' + json.join(',') + '}';
        } catch (e) {
            // Defensive: return empty object on any error
            return '{}';
        }
    },

    /**
     * Parse JSON-like string to object
     * @param {String} str - JSON string
     * @returns {Object} Parsed object or null (returns null on error)
     * @example
     * // Load script settings
     * var jsonStr = '{"width":"100","height":"200","unit":"mm"}';
     * var config = AIS.JSON.parse(jsonStr);
     * // Returns: {width: '100', height: '200', unit: 'mm'}
     */
    parse: function(str) {
        // Defensive: check for null/undefined/empty
        if (!str || str === '' || str === 'null' || str === 'undefined') {
            return null;
        }

        // Defensive: check string type
        if (typeof str !== 'string') {
            try {
                str = str.toString();
            } catch (e) {
                return null;
            }
        }

        // Defensive: trim whitespace
        str = str.replace(/^\s+|\s+$/g, '');

        try {
            return new Function('return (' + str + ')')();
        } catch (err) {
            // Enhanced error reporting in dev mode
            if (typeof console !== 'undefined' && console.log) {
                console.log('AIS.JSON.parse error: ' + err.message + ' | Input: ' + str.substring(0, 100));
            }
            return null;
        }
    }
};

// ============================================================================
// SYSTEM UTILITIES
// ============================================================================

/**
 * System-level utilities
 */
AIS.System = {
    /**
     * Check if running on Mac
     * @returns {Boolean} True if Mac
     */
    isMac: function() {
        return /mac/i.test($.os);
    },

    /**
     * Check if running on Windows
     * @returns {Boolean} True if Windows
     */
    isWindows: function() {
        return /windows/i.test($.os);
    },

    /**
     * Open URL in default browser
     * @param {String} url - URL to open
     * @returns {Boolean} True if successful, false on error
     * @example
     * // Open website (protocol auto-added)
     * AIS.System.openURL('www.vexy.art');
     *
     * @example
     * // Open with full URL
     * AIS.System.openURL('https://github.com/example');
     */
    openURL: function(url) {
        // Defensive: check for null/undefined/empty
        if (!url || typeof url !== 'string' || url === '') {
            return false;
        }

        // Defensive: basic URL validation
        if (!/^https?:\/\//i.test(url)) {
            // Auto-prepend https:// if missing (secure by default)
            url = 'https://' + url;
        }

        try {
            var html = new File(Folder.temp.absoluteURI + '/aisLink.html');
            html.open('w');
            var htmlBody = '<html><head><META HTTP-EQUIV=Refresh CONTENT="0; URL=' + url + '"></head><body> <p></body></html>';
            html.write(htmlBody);
            html.close();
            html.execute();
            return true;
        } catch (e) {
            // Graceful degradation: fail silently
            return false;
        }
    }
};

// ============================================================================
// STRING PARSING UTILITIES (Extended)
// ============================================================================

/**
 * Enhanced string to number conversion (more robust than parseFloat)
 * @param {String|Number} str - String or number to convert
 * @param {Number} defaultValue - Default value if invalid (default: 0)
 * @returns {Number} Converted number
 * @example
 * // Basic usage
 * AIS.String.toNumber('42'); // Returns 42
 * AIS.String.toNumber('3.14'); // Returns 3.14
 *
 * @example
 * // With default value
 * AIS.String.toNumber('invalid', 100); // Returns 100
 * AIS.String.toNumber('', 50); // Returns 50
 *
 * @example
 * // Edge cases (defensive)
 * AIS.String.toNumber(null); // Returns 0
 * AIS.String.toNumber(undefined); // Returns 0
 * AIS.String.toNumber(42); // Returns 42 (accepts numbers)
 */
AIS.String.toNumber = function(str, defaultValue) {
    // Defensive: set default to 0 (not 1!)
    if (arguments.length == 1 || defaultValue == undefined) defaultValue = 0;

    // Defensive: handle null/undefined
    if (str == null || str === undefined) return defaultValue;

    // Defensive: if already a number, return it
    if (typeof str === 'number') {
        return isNaN(str) || !isFinite(str) ? defaultValue : str;
    }

    // Defensive: convert to string if not already
    str = String(str);

    // Parse string to number
    str = str.replace(/,/g, '.').replace(/[^\d.-]/g, '');
    str = str.split('.');
    str = str[0] ? str[0] + '.' + str.slice(1).join('') : '';
    str = str.substr(0, 1) + str.substr(1).replace(/-/g, '');

    // Return parsed value or default
    if (isNaN(str) || !str.length) return parseFloat(defaultValue);
    else return parseFloat(str);
};

// ============================================================================
// INITIALIZATION CHECK
// ============================================================================

// Check Illustrator version on load
if (!AIS.Core.checkVersion()) {
    AIS.Error.show(
        'This script requires Adobe Illustrator CC 2012 or higher.\n' +
        'Current version: ' + app.version
    );
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AIS;
}
