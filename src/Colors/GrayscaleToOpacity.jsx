/**
 * Grayscale To Opacity
 * @version 1.0.0
 * @description Converts selection colors to grayscale and sets opacity based on gray value
 * @category Colors
 *
 * @author Sergey Osokin (https://github.com/creold)
 * @license MIT
 * @modernized 2025 - Adapted for AIS framework
 *
 * @features
 *   - Converts all fill colors to grayscale
 *   - Sets opacity equal to grayscale value (0-100%)
 *   - Processes paths, compound paths, and groups recursively
 *   - Useful for creating transparency masks from grayscale artwork
 *   - Deselects non-path objects automatically
 *
 * @usage
 *   1. Select objects with colored fills
 *   2. Run the script
 *   3. Colors convert to grayscale and opacity matches gray value
 *
 * @notes
 *   - Only affects objects with fill colors
 *   - Grayscale value (0-100) becomes opacity percentage
 *   - Black (0%) = 0% opacity (fully transparent)
 *   - White (100%) = 100% opacity (fully opaque)
 *   - Uses Illustrator's built-in grayscale conversion
 */




//@target illustrator
var c=File(Folder.myDocuments+"/Adobe Scripts/vexy-ville.ini");if(c.exists){c.open('r');var p=c.read();c.close();var l=File(p+".lib/core.jsx");if(l.exists)$.evalFile(l.fsName);}
app.preferences.setBooleanPreference('ShowExternalJSXWarning', false);

// ============================================================================
// MAIN FUNCTION
// ============================================================================

function main() {
    try {
        // Convert to grayscale first
        app.executeMenuCommand('Colors7');

        var selArray = [];
        getPaths(app.selection, selArray);

        if (selArray.length === 0) {
            alert('No paths in selection\nSelect at least one path object');
            return;
        }

        // Apply gray value as opacity
        for (var i = 0; i < selArray.length; i++) {
            var value = selArray[i].fillColor.gray;
            selArray[i].opacity = Math.round(value);
        }
    } catch (err) {
        AIS.Error.show('Failed to convert grayscale to opacity', err);
    }
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Get all path items from selection recursively
 */
function getPaths(item, arr) {
    for (var i = 0; i < item.length; i++) {
        var currItem = item[i];
        try {
            switch (currItem.typename) {
                case 'GroupItem':
                    getPaths(currItem.pageItems, arr);
                    break;
                case 'PathItem':
                    arr.push(currItem);
                    break;
                case 'CompoundPathItem':
                    getPaths(currItem.pathItems, arr);
                    break;
                default:
                    currItem.selected = false;
                    break;
            }
        } catch (e) {}
    }
}

// ============================================================================
// EXECUTE
// ============================================================================

if (!AIS.Document.hasDocument()) {
    alert('No documents\nOpen a document and try again');
} else if (!AIS.Document.hasSelection()) {
    alert('No selection\nSelect at least one object and try again');
} else {
    try {
        main();
    } catch (e) {
        AIS.Error.show('Script error', e);
    }
}
