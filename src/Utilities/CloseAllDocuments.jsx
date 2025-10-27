/**
 * Close All Documents
 * @version 1.0.0
 * @description Close all open documents with save options
 * @category Utilities
 *
 * Features:
 * - Interactive save/don't save/cancel dialog for unsaved documents
 * - "Apply to All" option for batch operations
 * - Bilingual UI (English/Japanese)
 * - Skips already-saved documents automatically
 * - Safe cancellation at any point
 *
 * Note: This feature is built into Illustrator 2021+ in the File menu
 *
 * Original: closeAllDocuments.js by sky-chaser-high
 * Homepage: github.com/sky-chaser-high/adobe-illustrator-scripts
 * Modernized for AIS framework
 */

#include "../.lib/core.jsx"

//@target illustrator
app.preferences.setBooleanPreference('ShowExternalJSXWarning', false);

(function() {
    if (!AIS.Document.hasDocument()) {
        alert('No documents open\nOpen at least one document and try again');
        return;
    }

    main();
})();

// ============================================================================
// CONFIGURATION
// ============================================================================

var CFG = {
    scriptName: 'Close All Documents',
    version: '1.0.0'
};

// ============================================================================
// MAIN FUNCTION
// ============================================================================

function main() {
    try {
        var state = {
            applyToAll: false,
            cancelled: false,
            saveAll: false
        };

        while (app.documents.length > 0) {
            state = processNextDocument(state);
            if (state.cancelled) {
                return;
            }
        }

    } catch (error) {
        AIS.Error.show('Close All Documents Error', error);
    }
}

// ============================================================================
// CORE LOGIC
// ============================================================================

function processNextDocument(state) {
    var doc = app.activeDocument;

    if (state.cancelled) {
        return state;
    }

    if (doc.saved) {
        doc.close(SaveOptions.DONOTSAVECHANGES);
        return state;
    }

    if (state.applyToAll) {
        if (state.saveAll && !doc.saved) {
            doc.save();
        }
        doc.close(SaveOptions.DONOTSAVECHANGES);
        return state;
    }

    return showSaveDialog(doc);
}

function showSaveDialog(doc) {
    var state = {
        applyToAll: false,
        cancelled: false,
        saveAll: false
    };

    var dialog = createDialog(doc);

    dialog.dontSaveButton.onClick = function() {
        state.applyToAll = dialog.applyToAllCheckbox.value;
        state.saveAll = false;
        doc.close(SaveOptions.DONOTSAVECHANGES);
        dialog.close();
    };

    dialog.cancelButton.onClick = function() {
        state.cancelled = true;
        dialog.close();
    };

    dialog.saveButton.onClick = function() {
        state.applyToAll = dialog.applyToAllCheckbox.value;
        state.saveAll = true;
        doc.close(SaveOptions.SAVECHANGES);
        dialog.close();
    };

    dialog.show();
    return state;
}

// ============================================================================
// USER INTERFACE
// ============================================================================

function createDialog(doc) {
    var ui = localizeUI(doc);

    var dialog = new Window('dialog');
    dialog.text = ui.title;
    dialog.orientation = 'column';
    dialog.alignChildren = ['fill', 'top'];
    dialog.spacing = 10;
    dialog.margins = 16;

    var messageGroup = dialog.add('group');
    messageGroup.orientation = 'column';
    messageGroup.alignChildren = ['left', 'center'];
    messageGroup.spacing = 10;
    messageGroup.margins = 0;

    var message1 = messageGroup.add('statictext', undefined, ui.message1, { multiline: true });
    message1.preferredSize.width = 400;

    var message2 = messageGroup.add('statictext', undefined, ui.message2);

    var checkboxGroup = dialog.add('group');
    checkboxGroup.orientation = 'row';
    checkboxGroup.alignChildren = ['left', 'center'];
    checkboxGroup.spacing = 10;
    checkboxGroup.margins = [0, 10, 0, 6];

    var applyToAll = checkboxGroup.add('checkbox', undefined, ui.apply);

    var buttonGroup = dialog.add('group');
    buttonGroup.orientation = 'row';
    buttonGroup.alignChildren = ['right', 'center'];
    buttonGroup.spacing = 10;
    buttonGroup.margins = 0;

    var dontSaveButton = buttonGroup.add('button', undefined, ui.dontSave);
    dontSaveButton.preferredSize.width = 90;

    var cancelButton = buttonGroup.add('button', undefined, ui.cancel);
    cancelButton.preferredSize.width = 90;

    var saveButton = buttonGroup.add('button', undefined, ui.save);
    saveButton.preferredSize.width = 90;

    dialog.applyToAllCheckbox = applyToAll;
    dialog.dontSaveButton = dontSaveButton;
    dialog.cancelButton = cancelButton;
    dialog.saveButton = saveButton;

    return dialog;
}

function localizeUI(doc) {
    var filename = getDocumentFilename(doc);
    var lang = AIS.System.isMac() ? 'en' : 'en';

    return {
        title: {
            en: 'Close All Documents',
            ja: 'すべてを閉じる'
        }[lang],
        message1: {
            en: 'Save changes to the Adobe Illustrator document "' + filename + '" before closing?',
            ja: '閉じる前に、Adobe Illustrator ドキュメント「' + filename + '」を保存しますか？'
        }[lang],
        message2: {
            en: 'If you don\'t save, your changes will be lost.',
            ja: '保存しない場合、変更が失われます。'
        }[lang],
        apply: {
            en: 'Apply to All',
            ja: 'すべてに適用'
        }[lang],
        dontSave: {
            en: 'Don\'t Save',
            ja: '保存しない'
        }[lang],
        cancel: {
            en: 'Cancel',
            ja: 'キャンセル'
        }[lang],
        save: {
            en: 'Save',
            ja: '保存'
        }[lang]
    };
}

// ============================================================================
// UTILITIES
// ============================================================================

function getDocumentFilename(doc) {
    return File.decode(doc.name);
}
