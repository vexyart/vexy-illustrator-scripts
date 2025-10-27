/**
 * Justify Content Space Between
 * @version 1.0.0
 * @description CSS flexbox-like spacing - aligns point text objects with edges at ends
 * @category Transform
 * @author sky-chaser-high (github.com/sky-chaser-high)
 * @license MIT
 * @modernized 2025 - Adapted for AIS framework
 * @features
 *   - Adjusts tracking to align text at both ends
 *   - Supports horizontal and vertical text
 *   - Works with point text only
 *   - Can use path as reference width/height
 *   - Multi-line text support
 *   - Automatic reference detection (longest object)
 * @usage
 *   1. Select point text objects (and optionally a reference path)
 *   2. Run the script
 *   3. Text tracking will adjust to match the reference width/height
 * @notes
 *   Different font sizes within a single line may not work well
 *   Text position does not change
 *   Longest object is used as reference
 *   In rare cases, may need to restart Illustrator
 */

#include "../.lib/core.jsx"

//@target illustrator
app.preferences.setBooleanPreference('ShowExternalJSXWarning', false);

(function() {
    if (!AIS.Document.hasDocument()) {
        alert('No documents\nOpen a document and try again');
        return;
    }
    if (!AIS.Document.hasSelection()) {
        alert('No selection\nSelect point text objects and try again');
        return;
    }
    main();
})();

// ============================================================================
// MAIN FUNCTION
// ============================================================================
function main() {
    try {
        var items = app.activeDocument.selection;
        var texts = getTextFrames(items);

        if (!texts.length) {
            alert('No point text\nSelect point text objects and try again');
            return;
        }

        var orientation = texts[0].orientation;
        var target = getTargetItem(texts, orientation);
        var shapes = getPathItems(items);

        if (shapes.length) {
            target = getTargetItem(shapes, orientation);
        }

        var ref = getTargetLength(target, orientation);

        for (var i = 0; i < texts.length; i++) {
            var text = texts[i];
            var lines = text.lines;

            if (lines.length > 1) {
                justifyMultiLine(lines, ref);
                continue;
            }

            if (text === target) continue;
            justifySingleLine(text, ref);
        }
    } catch (err) {
        AIS.Error.show('Failed to justify content', err);
    }
}

// ============================================================================
// CORE LOGIC
// ============================================================================

/**
 * Justify single-line text
 * @param {TextFrame} text - Text frame to justify
 * @param {number} target - Target width/height
 */
function justifySingleLine(text, target) {
    text.textRange.characterAttributes.kerningMethod = AutoKernType.NOAUTOKERN;
    text.textRange.kerning = 0;

    var em = getTrackingValue(text, target);
    text.textRange.characterAttributes.tracking = em;

    var ranges = text.textRanges;
    var end = ranges.length - 1;
    ranges[end].characterAttributes.tracking = 0;
}

/**
 * Justify multi-line text
 * @param {Array} texts - Array of text lines
 * @param {number} target - Target width/height
 */
function justifyMultiLine(texts, target) {
    var start = 0;

    for (var i = 0; i < texts.length; i++) {
        var text = texts[i];
        var temp = app.activeDocument.activeLayer.textFrames.add();
        var range = temp.textRange;
        text.duplicate(range);

        var orientation = temp.orientation;
        var length = getTargetLength(temp, orientation);

        if (length != target) {
            range.characterAttributes.kerningMethod = AutoKernType.NOAUTOKERN;
            range.kerning = 0;
            var em = getTrackingValue(temp, target);
            text.characterAttributes.kerningMethod = AutoKernType.NOAUTOKERN;
            text.kerning = 0;
            text.characterAttributes.tracking = em;
        }

        var ranges = text.textRanges;
        var end = start + ranges.length - 1;
        ranges[end].characterAttributes.kerningMethod = AutoKernType.NOAUTOKERN;
        ranges[end].characterAttributes.tracking = 0;

        start += ranges.length + 1;
        temp.remove();
    }
}

/**
 * Calculate tracking value needed
 * @param {TextFrame} text - Text frame
 * @param {number} target - Target width/height
 * @returns {number} - Tracking value in em units
 */
function getTrackingValue(text, target) {
    var delta = getDelta(text, target);
    var scale = getCharacterScale(text);
    var fontsize = text.textRange.characterAttributes.size;
    var count = text.contents.length - 1;

    // Formula: length(pt) = em * fontsize(pt) / 1000
    var em = (delta / scale) * 1000 / fontsize;
    var tracking = em / count;
    return tracking;
}

/**
 * Get difference between current and target length
 * @param {TextFrame} text - Text frame
 * @param {number} target - Target length
 * @returns {number} - Delta in points
 */
function getDelta(text, target) {
    text.textRange.characterAttributes.tracking = 0;
    var length = getTargetLength(text, text.orientation);
    return target - length;
}

/**
 * Get character scale (horizontal or vertical)
 * @param {TextFrame} text - Text frame
 * @returns {number} - Scale factor (0-1)
 */
function getCharacterScale(text) {
    var attributes = text.textRange.characterAttributes;
    if (text.orientation == TextOrientation.VERTICAL) {
        return attributes.verticalScale / 100;
    }
    return attributes.horizontalScale / 100;
}

/**
 * Get target length based on orientation
 * @param {Object} target - Text frame or path item
 * @param {Orientation} orientation - Text orientation
 * @returns {number} - Width or height in points
 */
function getTargetLength(target, orientation) {
    if (orientation == TextOrientation.VERTICAL) {
        return getHeight(target);
    }
    return getWidth(target);
}

/**
 * Get width considering descender and arc of stem
 * @param {Object} item - Text frame or path item
 * @returns {number} - Width in points
 */
function getWidth(item) {
    if (item.typename != 'TextFrame') return item.width;

    var justification = item.textRange.paragraphAttributes.justification;
    var position = item.position;

    align(item, Justification.LEFT);
    var width = item.width;
    var x1 = item.anchor[0];
    var x2 = item.geometricBounds[0];
    var left = Math.abs(x2 - x1);

    align(item, Justification.RIGHT);
    var x3 = item.anchor[0];
    var x4 = item.geometricBounds[2];
    var right = Math.abs(x4 - x3);

    align(item, justification);
    item.position = position;
    return width - left - right;
}

/**
 * Get height considering descender and arc of stem
 * @param {Object} item - Text frame or path item
 * @returns {number} - Height in points
 */
function getHeight(item) {
    if (item.typename != 'TextFrame') return item.height;

    var justification = item.textRange.paragraphAttributes.justification;
    var position = item.position;

    align(item, Justification.LEFT);
    var height = item.height;
    var y1 = item.anchor[1];
    var y2 = item.geometricBounds[1];
    var top = Math.abs(y2 - y1);

    align(item, Justification.RIGHT);
    var y3 = item.anchor[1];
    var y4 = item.geometricBounds[3];
    var bottom = Math.abs(y4 - y3);

    align(item, justification);
    item.position = position;
    return height - top - bottom;
}

/**
 * Align text (workaround for Illustrator bug)
 * @param {TextFrame} text - Text frame
 * @param {Justification} justification - Alignment mode
 */
function align(text, justification) {
    // Workaround for bug:
    // community.adobe.com/t5/illustrator-discussions/trouble-assigning-textframe-to-justification-left/m-p/4211277
    var shrink = 80;
    var expand = (1 / shrink) * 10000;

    text.resize(shrink, shrink);
    text.textRange.paragraphAttributes.justification = justification;
    text.resize(expand, expand);
}

/**
 * Get longest item (reference for spacing)
 * @param {Array} items - Array of items
 * @param {Orientation} orientation - Text orientation
 * @returns {Object} - Longest item
 */
function getTargetItem(items, orientation) {
    var target = items[0];
    for (var i = 1; i < items.length; i++) {
        var item = items[i];
        if (orientation == TextOrientation.HORIZONTAL) {
            if (target.width < item.width) target = item;
        } else {
            if (target.height < item.height) target = item;
        }
    }
    return target;
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Get all point text frames from selection
 * @param {Array} items - Selection items
 * @returns {Array} - Array of point text frames
 */
function getTextFrames(items) {
    var texts = [];
    for (var i = 0; i < items.length; i++) {
        var item = items[i];
        if (item.typename == 'TextFrame' && item.kind == TextType.POINTTEXT) {
            texts.push(item);
        }
        if (item.typename == 'GroupItem') {
            texts = texts.concat(getTextFrames(item.pageItems));
        }
    }
    return texts;
}

/**
 * Get all path items from selection
 * @param {Array} items - Selection items
 * @returns {Array} - Array of path items
 */
function getPathItems(items) {
    var shapes = [];
    for (var i = 0; i < items.length; i++) {
        var item = items[i];
        if (item.typename == 'PathItem' || item.typename == 'CompoundPathItem') {
            shapes.push(item);
        }
        if (item.typename == 'GroupItem') {
            shapes = shapes.concat(getPathItems(item.pageItems));
        }
    }
    return shapes;
}
