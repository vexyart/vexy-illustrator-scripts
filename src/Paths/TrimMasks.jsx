/**
 * Trim Masks
 * @version 1.0.0
 * @description Automatically trims all clipping groups using Pathfinder Crop
 * @category Paths
 * @features
 * - Trims all clipping groups in document automatically
 * - Uses Pathfinder > Crop for clean trimming
 * - Optionally saves filled mask paths (preserves original masks)
 * - Handles nested clipping groups recursively
 * - Fixes even-odd fill rule issues before cropping
 * - Preserves opacity and blending modes
 * - Outlines live text in clipping groups
 * - Normalizes compound paths created from grouped paths
 * - Full-screen mode for large operations (>10 clip groups)
 * - Generates temporary action for Pathfinder Crop command
 * @author Original: Sergey Osokin (hi@sergosokin.ru)
 * @credits Compound path normalization by Alexander Ladygin (https://github.com/alexander-ladygin)
 * @usage
 * 1. Open document with clipping groups
 * 2. Run script (no selection needed - processes all clip groups)
 * 3. All clipping groups will be trimmed using Pathfinder > Crop
 * @notes
 * - WARNING: Don't put in action slot for quick run (will freeze Illustrator)
 * - Set isSaveMask to true to preserve filled mask paths
 * - Full-screen mode activates when >10 clip groups detected
 * - Action files created temporarily in ~/Documents/Adobe Scripts/
 * - Restores screen mode and interaction level after completion
 * @compatibility Adobe Illustrator CS6+ (version 16+)
 */




//@target illustrator
var c=File(Folder.myDocuments+"/Adobe Scripts/vexy-ville.ini");if(c.exists){c.open('r');var p=c.read();c.close();var l=File(p+".lib/core.jsx");if(l.exists)$.evalFile(l.fsName);}
app.preferences.setBooleanPreference('ShowExternalJSXWarning', false);

$.localize = true;



// ============================================================================
// CONFIGURATION
// ============================================================================
var CFG = {
    aiVers: parseInt(app.version),
    actionSet: 'Trim-Mask',
    actionName: 'Trim-Mask',
    actionPath: Folder.myDocuments + '/Adobe Scripts/',
    saveMask: true,         // Save filled mask path when trimming
    fullScreenThreshold: 10 // Enable full-screen mode when clip groups > this
};

var ITEM_ATTR = {
    mOpacity: 100,
    mBlending: BlendModes.NORMAL
};

// ============================================================================
// MAIN FUNCTION
// ============================================================================
function main() {
    var doc = app.activeDocument;
    var userView = doc.views[0].screenMode;
    var userInteraction = app.userInteractionLevel;

    // Suppress dialogs during processing
    app.userInteractionLevel = UserInteractionLevel.DONTDISPLAYALERTS;

    // Create action folder if needed
    var folder = new Folder(CFG.actionPath);
    if (!folder.exists) folder.create();

    // Generate Pathfinder Crop action
    var actionStr = buildPathfinderCropAction();
    createAction(actionStr, CFG.actionSet, CFG.actionPath);

    // Collect clipping groups
    if (selection.length === 0) {
        app.executeMenuCommand('selectall');
    }

    var groups = collectGroups(selection);
    var clipCount = countClipGroups(groups);

    // Enable full-screen for large operations
    if (clipCount > CFG.fullScreenThreshold) {
        doc.views[0].screenMode = ScreenMode.FULLSCREEN;
    }

    // Process all clipping groups
    try {
        processGroups(groups, ITEM_ATTR, CFG.saveMask, CFG.actionSet, CFG.actionName);
    } catch (e) {
        // Silently handle processing errors
    }

    // Cleanup
    app.unloadAction(CFG.actionSet, '');
    deselectAll();
    doc.views[0].screenMode = userView;
    app.userInteractionLevel = userInteraction;
}

// ============================================================================
// CORE LOGIC
// ============================================================================

/**
 * Build Pathfinder Crop action string
 * @returns {String} Action file content
 */
function buildPathfinderCropAction() {
    return [
        '   /version 3',
        '/name [' + CFG.actionSet.length + ' ' + stringToHex(CFG.actionSet) + ']',
        '/actionCount 1',
        '/action-1 {',
        '/name [' + CFG.actionName.length + ' ' + stringToHex(CFG.actionName) + ']',
        '  /keyIndex 0',
        '  /colorIndex 0',
        '  /isOpen 1',
        '  /eventCount 1',
        '  /event-1 {',
        '    /useRulersIn1stQuadrant 0',
        '    /internalName (ai_plugin_pathfinder)',
        '    /localizedName [ 10',
        '      5061746866696e646572',
        '    ]',
        '   /isOpen 0',
        '    /isOn 1',
        '    /hasDialog 0',
        '    /parameterCount 1',
        '    /parameter-1 {',
        '      /key 1851878757',
        '      /showInPalette 4294967295',
        '      /type (enumerated)',
        '      /name [ 4',
        '        43726f70',
        '      ]',
        '      /value 9',
        '    }',
        '  }',
        '}'
    ].join('');
}

/**
 * Create and load action from string
 * @param {String} str - Action content
 * @param {String} set - Action set name
 * @param {String} path - Action folder path
 */
function createAction(str, set, path) {
    var file = new File(path + '/' + set + '.aia');
    file.open('w');
    file.write(str);
    file.close();
    app.loadAction(file);
    file.remove();
}

/**
 * Convert string to hex for action file
 * @param {String} str - String to convert
 * @returns {String} Hex representation
 */
function stringToHex(str) {
    return str.replace(/./g, function(char) {
        return char.charCodeAt(0).toString(16);
    });
}

/**
 * Collect all groups from items
 * @param {Object} items - Collection to search
 * @returns {Array} Array of group items
 */
function collectGroups(items) {
    var groups = [];

    for (var i = 0; i < items.length; i++) {
        var item = items[i];
        if (item.typename === 'GroupItem') {
            groups.push(item);
        }
    }

    return groups;
}

/**
 * Count all clipping groups recursively
 * @param {Array} items - Array of items to count
 * @returns {Number} Total clip group count
 */
function countClipGroups(items) {
    var counter = 0;

    for (var i = 0; i < items.length; i++) {
        var item = items[i];
        if (item.typename === 'GroupItem') {
            if (item.clipped) {
                counter++;
            } else {
                counter += countClipGroups(item.pageItems);
            }
        }
    }

    return counter;
}

/**
 * Process all groups, trimming clipping groups
 * @param {Array} items - Array of items to process
 * @param {Object} attr - Item attributes to preserve
 * @param {Boolean} saveMask - Whether to save mask paths
 * @param {String} actionSet - Action set name
 * @param {String} actionName - Action name
 */
function processGroups(items, attr, saveMask, actionSet, actionName) {
    for (var i = 0; i < items.length; i++) {
        deselectAll();
        var item = items[i];

        if (item.typename === 'GroupItem') {
            if (item.clipped) {
                fixEvenOddFillRule(item);
                trimClipGroup(item, attr, saveMask, actionSet, actionName);
            } else {
                // Handle single nested group
                if (item.pageItems.length === 1 && item.pageItems[0].typename === 'GroupItem') {
                    var singleItem = item.pageItems[0];
                    singleItem.moveBefore(item);
                    trimClipGroup(singleItem, attr, saveMask, actionSet, actionName);
                } else {
                    processGroups(item.pageItems, attr, saveMask, actionSet, actionName);
                }
            }
        }
    }
}

/**
 * Fix even-odd fill rule to avoid incorrect Pathfinder results
 * @param {GroupItem} item - Group to fix
 */
function fixEvenOddFillRule(item) {
    for (var i = 0; i < item.pageItems.length; i++) {
        var currItem = item.pageItems[i];

        if (currItem.typename === 'GroupItem') {
            fixEvenOddFillRule(currItem);
        } else if (currItem.typename === 'CompoundPathItem') {
            currItem = currItem.pathItems[0];
            currItem.evenodd = false;
        } else if (currItem.typename === 'PathItem') {
            currItem.evenodd = false;
        }
    }
}

/**
 * Trim clipping group using Pathfinder Crop
 * @param {GroupItem} item - Clipping group to trim
 * @param {Object} attr - Attributes to preserve
 * @param {Boolean} saveMask - Save filled mask
 * @param {String} actionSet - Action set name
 * @param {String} actionName - Action name
 */
function trimClipGroup(item, attr, saveMask, actionSet, actionName) {
    // Save opacity and blending mode
    if (item.opacity < 100) attr.mOpacity = item.opacity;
    if (item.blendingMode !== BlendModes.NORMAL) attr.mBlending = item.blendingMode;

    // Outline any live text in clip group
    outlineTextInGroup(item);

    // Normalize compound paths (trick for compound paths from grouped paths)
    item.selected = true;
    normalizeCompoundPaths(selection);

    // Duplicate filled mask if needed
    if (saveMask) {
        duplicateFilledMask(item, attr.mOpacity, attr.mBlending);
    }

    // Run Pathfinder Crop
    item.selected = true;
    if (saveMask) {
        selection = selection[0]; // Because duplicate mask is selected behind
    }
    app.doScript(actionName, actionSet);

    // Restore attributes
    if (selection.length > 0) {
        if (attr.mOpacity < 100) {
            selection[0].opacity = attr.mOpacity;
        }
        if (attr.mBlending !== BlendModes.NORMAL) {
            selection[0].blendingMode = attr.mBlending;
        }
    }

    // Reset attributes
    attr.mOpacity = 100;
    attr.mBlending = BlendModes.NORMAL;
}

/**
 * Outline text frames in group
 * @param {GroupItem} group - Group to process
 */
function outlineTextInGroup(group) {
    try {
        for (var i = 0; i < group.pageItems.length; i++) {
            var item = group.pageItems[i];

            if (item.typename === 'TextFrame') {
                var textColor = item.textRange.fillColor;
                item.selected = true;
                app.executeMenuCommand('outline');

                // Restore fill color after outlining
                for (var j = 0; j < selection.length; j++) {
                    if (selection[j].typename === 'PathItem') {
                        selection[j].fillColor = textColor;
                    } else if (selection[j].typename === 'CompoundPathItem') {
                        // Trick for compound path from grouped paths
                        if (selection[j].pathItems.length === 0) {
                            var tempPath = selection[j].pathItems.add();
                        }
                        selection[j].pathItems[0].fillColor = textColor;
                        if (tempPath) tempPath.remove();
                    }
                }
                deselectAll();
            } else if (item.typename === 'GroupItem') {
                outlineTextInGroup(item);
            }
        }
    } catch (e) {
        // Silently handle outlining errors
    }
}

/**
 * Ungroup items
 * @param {Array} items - Items to ungroup
 */
function ungroupItems(items) {
    for (var i = 0; i < items.length; i++) {
        if (items[i].typename === 'GroupItem') {
            var j = items[i].pageItems.length;
            while (j--) {
                items[i].pageItems[0].locked = false;
                items[i].pageItems[0].hidden = false;
                items[i].pageItems[0].moveBefore(items[i]);
            }
            items[i].remove();
        }
    }
}

/**
 * Fix compound path created from groups of paths
 * @param {CompoundPathItem} item - Compound path to fix
 */
function fixCompoundPath(item) {
    selection = [item];
    app.executeMenuCommand('noCompoundPath');
    ungroupItems(selection);
    app.executeMenuCommand('compoundPath');
    deselectAll();
}

/**
 * Normalize all compound paths in items
 * Algorithm by Alexander Ladygin (https://github.com/alexander-ladygin)
 * @param {Array} items - Items to normalize
 */
function normalizeCompoundPaths(items) {
    var i = items.length;
    while (i--) {
        if (items[i].typename === 'GroupItem') {
            normalizeCompoundPaths(items[i].pageItems);
        } else if (items[i].typename === 'CompoundPathItem') {
            fixCompoundPath(items[i]);
        }
    }
}

/**
 * Duplicate filled mask paths
 * @param {GroupItem} group - Clipping group
 * @param {Number} opacity - Opacity to restore
 * @param {BlendMode} blending - Blending mode to restore
 */
function duplicateFilledMask(group, opacity, blending) {
    try {
        for (var i = 0; i < group.pageItems.length; i++) {
            var item = group.pageItems[i];
            var itemType = item.typename;
            var zeroPath = (itemType === 'CompoundPathItem') ? item.pathItems[0] : item;

            // Check if this is a filled clipping mask
            if ((itemType === 'PathItem' || itemType === 'CompoundPathItem') &&
                zeroPath.clipping && zeroPath.filled) {
                var maskClone = item.duplicate(group, ElementPlacement.PLACEAFTER);

                // Restore opacity
                if (opacity < 100) {
                    maskClone.opacity = opacity;
                }

                // Restore blending mode
                if (blending !== BlendModes.NORMAL) {
                    maskClone.blendingMode = blending;
                }
            }
        }
        app.redraw();
    } catch (e) {
        // Silently handle duplication errors
    }
}

/**
 * Deselect all items
 */
function deselectAll() {
    selection = null;
    app.redraw();
}

// ============================================================================
// EXECUTE
// ============================================================================

if (!AIS.Document.hasDocument()) {
    alert('No document\nOpen a document and try again');
} else {
    try {
        main();
    } catch (e) {
        AIS.Error.show('Script error', e);
    }
}
