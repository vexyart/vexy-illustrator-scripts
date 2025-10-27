/**
 * Adobe Illustrator Scripts - UI Library
 * @version 1.0.0
 * @description Common UI components and dialog utilities
 * @requires core.jsx
 * @license MIT
 */

#include "core.jsx"

// ============================================================================
// UI NAMESPACE
// ============================================================================

AIS.UI = AIS.UI || {};

AIS.UI.version = '1.0.0';

// ============================================================================
// CONSTANTS
// ============================================================================

AIS.UI.Constants = {
    // Standard dimensions
    BUTTON_WIDTH: 90,
    BUTTON_HEIGHT: 30,
    INPUT_HEIGHT: 25,
    LABEL_WIDTH: 80,
    INPUT_WIDTH: 150,
    DIALOG_MARGIN: 16,
    GROUP_SPACING: 10,

    // Standard sizes
    DIALOG_SMALL: { width: 300, height: 200 },
    DIALOG_MEDIUM: { width: 400, height: 300 },
    DIALOG_LARGE: { width: 600, height: 400 }
};

// ============================================================================
// DIALOG BUILDER
// ============================================================================

/**
 * Dialog builder for consistent dialog creation
 */
AIS.UI.DialogBuilder = function(title, size) {
    this.title = title || 'Dialog';
    this.size = size || AIS.UI.Constants.DIALOG_MEDIUM;
    this.dialog = new Window('dialog', this.title);
    this.dialog.orientation = 'column';
    this.dialog.alignChildren = ['fill', 'top'];
    this.dialog.spacing = AIS.UI.Constants.GROUP_SPACING;
    this.dialog.margins = AIS.UI.Constants.DIALOG_MARGIN;

    return this;
};

/**
 * Add a panel to dialog
 * @param {String} title - Panel title
 * @returns {Group} Panel group
 */
AIS.UI.DialogBuilder.prototype.addPanel = function(title) {
    var panel = this.dialog.add('panel', undefined, title);
    panel.orientation = 'column';
    panel.alignChildren = ['fill', 'top'];
    panel.spacing = AIS.UI.Constants.GROUP_SPACING;
    panel.margins = 10;
    return panel;
};

/**
 * Add a group to dialog
 * @param {Object} parent - Parent container (optional, defaults to dialog)
 * @param {String} orientation - Orientation ('row' or 'column')
 * @returns {Group} New group
 */
AIS.UI.DialogBuilder.prototype.addGroup = function(parent, orientation) {
    parent = parent || this.dialog;
    orientation = orientation || 'column';

    var group = parent.add('group');
    group.orientation = orientation;
    group.alignChildren = ['fill', 'center'];
    group.spacing = AIS.UI.Constants.GROUP_SPACING;
    return group;
};

/**
 * Add labeled input field
 * @param {Object} parent - Parent container
 * @param {String} label - Label text
 * @param {String} defaultValue - Default value
 * @param {Object} options - Options {helpTip, width}
 * @returns {EditText} Input field
 */
AIS.UI.DialogBuilder.prototype.addInput = function(parent, label, defaultValue, options) {
    options = options || {};

    var group = this.addGroup(parent, 'row');

    var labelCtrl = group.add('statictext', undefined, label);
    labelCtrl.preferredSize.width = options.labelWidth || AIS.UI.Constants.LABEL_WIDTH;
    labelCtrl.justify = 'right';

    var input = group.add('edittext', undefined, defaultValue || '');
    input.preferredSize.width = options.width || AIS.UI.Constants.INPUT_WIDTH;
    input.preferredSize.height = AIS.UI.Constants.INPUT_HEIGHT;

    if (options.helpTip) {
        input.helpTip = options.helpTip;
    }

    if (options.active) {
        input.active = true;
    }

    return input;
};

/**
 * Add checkbox
 * @param {Object} parent - Parent container
 * @param {String} label - Label text
 * @param {Boolean} defaultValue - Default checked state
 * @param {Object} options - Options {helpTip}
 * @returns {Checkbox} Checkbox control
 */
AIS.UI.DialogBuilder.prototype.addCheckbox = function(parent, label, defaultValue, options) {
    options = options || {};

    var checkbox = parent.add('checkbox', undefined, label);
    checkbox.value = defaultValue || false;

    if (options.helpTip) {
        checkbox.helpTip = options.helpTip;
    }

    return checkbox;
};

/**
 * Add radio button group
 * @param {Object} parent - Parent container
 * @param {Array} options - Array of {label, value} objects
 * @param {Number} defaultIndex - Default selected index
 * @returns {Object} Object with {group, buttons, getValue}
 */
AIS.UI.DialogBuilder.prototype.addRadioGroup = function(parent, options, defaultIndex) {
    var group = this.addGroup(parent, 'column');
    var buttons = [];

    for (var i = 0; i < options.length; i++) {
        var radio = group.add('radiobutton', undefined, options[i].label);
        radio.value = (i === (defaultIndex || 0));
        radio._radioValue = options[i].value;
        buttons.push(radio);
    }

    return {
        group: group,
        buttons: buttons,
        getValue: function() {
            for (var i = 0; i < buttons.length; i++) {
                if (buttons[i].value) {
                    return buttons[i]._radioValue;
                }
            }
            return null;
        }
    };
};

/**
 * Add dropdown list
 * @param {Object} parent - Parent container
 * @param {String} label - Label text
 * @param {Array} items - Array of strings or {text, value} objects
 * @param {Number} defaultIndex - Default selected index
 * @param {Object} options - Options {labelWidth, width, helpTip}
 * @returns {DropDownList} Dropdown control
 */
AIS.UI.DialogBuilder.prototype.addDropdown = function(parent, label, items, defaultIndex, options) {
    options = options || {};

    var group = this.addGroup(parent, 'row');

    if (label) {
        var labelCtrl = group.add('statictext', undefined, label);
        labelCtrl.preferredSize.width = options.labelWidth || AIS.UI.Constants.LABEL_WIDTH;
        labelCtrl.justify = 'right';
    }

    var dropdown = group.add('dropdownlist');
    dropdown.preferredSize.width = options.width || AIS.UI.Constants.INPUT_WIDTH;

    // Add items
    for (var i = 0; i < items.length; i++) {
        var item = items[i];
        var text = typeof item === 'string' ? item : item.text;
        var value = typeof item === 'string' ? item : item.value;

        var ddItem = dropdown.add('item', text);
        ddItem._value = value;
    }

    dropdown.selection = defaultIndex || 0;

    if (options.helpTip) {
        dropdown.helpTip = options.helpTip;
    }

    // Add getValue helper
    dropdown.getValue = function() {
        return this.selection ? this.selection._value : null;
    };

    return dropdown;
};

/**
 * Add standard OK/Cancel buttons
 * @param {Object} options - Options {okText, cancelText, onOk, onCancel}
 * @returns {Object} Object with {ok, cancel} buttons
 */
AIS.UI.DialogBuilder.prototype.addButtons = function(options) {
    options = options || {};

    var buttonGroup = this.addGroup(this.dialog, 'row');
    buttonGroup.alignment = ['right', 'bottom'];

    var ok = buttonGroup.add('button', undefined, options.okText || 'OK');
    ok.preferredSize.width = AIS.UI.Constants.BUTTON_WIDTH;
    ok.preferredSize.height = AIS.UI.Constants.BUTTON_HEIGHT;

    var cancel = buttonGroup.add('button', undefined, options.cancelText || 'Cancel');
    cancel.preferredSize.width = AIS.UI.Constants.BUTTON_WIDTH;
    cancel.preferredSize.height = AIS.UI.Constants.BUTTON_HEIGHT;

    // Set up event handlers
    if (options.onOk) {
        ok.onClick = function() {
            if (options.onOk()) {
                this.parent.parent.close(1);
            }
        };
    } else {
        ok.onClick = function() {
            this.parent.parent.close(1);
        };
    }

    if (options.onCancel) {
        cancel.onClick = function() {
            options.onCancel();
            this.parent.parent.close(0);
        };
    } else {
        cancel.onClick = function() {
            this.parent.parent.close(0);
        };
    }

    return { ok: ok, cancel: cancel };
};

/**
 * Show the dialog
 * @returns {Number} Result (1 for OK, 0 for Cancel)
 */
AIS.UI.DialogBuilder.prototype.show = function() {
    this.dialog.center();
    return this.dialog.show();
};

/**
 * Get the dialog window
 * @returns {Window} Dialog window
 */
AIS.UI.DialogBuilder.prototype.getDialog = function() {
    return this.dialog;
};

// ============================================================================
// SIMPLE DIALOGS
// ============================================================================

/**
 * Show a simple message dialog
 * @param {String} title - Dialog title
 * @param {String} message - Message text
 * @param {String} buttonText - Button text (default: OK)
 */
AIS.UI.message = function(title, message, buttonText) {
    var dialog = new Window('dialog', title || 'Message');
    dialog.add('statictext', undefined, message, { multiline: true });

    var button = dialog.add('button', undefined, buttonText || 'OK');
    button.onClick = function() {
        dialog.close();
    };

    dialog.center();
    dialog.show();
};

/**
 * Show a confirmation dialog
 * @param {String} title - Dialog title
 * @param {String} message - Message text
 * @param {String} yesText - Yes button text (default: Yes)
 * @param {String} noText - No button text (default: No)
 * @returns {Boolean} True if Yes clicked
 */
AIS.UI.confirm = function(title, message, yesText, noText) {
    var dialog = new Window('dialog', title || 'Confirm');
    dialog.add('statictext', undefined, message, { multiline: true });

    var buttonGroup = dialog.add('group');
    buttonGroup.orientation = 'row';

    var yes = buttonGroup.add('button', undefined, yesText || 'Yes');
    var no = buttonGroup.add('button', undefined, noText || 'No');

    var result = false;

    yes.onClick = function() {
        result = true;
        dialog.close();
    };

    no.onClick = function() {
        result = false;
        dialog.close();
    };

    dialog.center();
    dialog.show();

    return result;
};

/**
 * Show progress bar dialog
 * @param {String} title - Dialog title
 * @param {Number} maxValue - Maximum value
 * @returns {Object} Progress dialog controller
 */
AIS.UI.progress = function(title, maxValue) {
    var dialog = new Window('palette', title || 'Progress');
    dialog.orientation = 'column';
    dialog.alignChildren = ['fill', 'top'];

    var messageText = dialog.add('statictext', undefined, 'Processing...');
    messageText.preferredSize.width = 300;

    var progressBar = dialog.add('progressbar', undefined, 0, maxValue || 100);
    progressBar.preferredSize.width = 300;

    var cancelBtn = dialog.add('button', undefined, 'Cancel');
    var cancelled = false;

    cancelBtn.onClick = function() {
        cancelled = true;
        dialog.close();
    };

    dialog.center();
    dialog.show();

    return {
        dialog: dialog,
        update: function(value, message) {
            progressBar.value = value;
            if (message) {
                messageText.text = message;
            }
            dialog.update();
            return !cancelled;
        },
        close: function() {
            dialog.close();
        },
        isCancelled: function() {
            return cancelled;
        }
    };
};

// ============================================================================
// INPUT VALIDATION UI
// ============================================================================

/**
 * Add numeric input validation
 * @param {EditText} input - Input field
 * @param {Object} options - Options {min, max, decimals, defaultValue}
 */
AIS.UI.validateNumeric = function(input, options) {
    options = options || {};

    input.onChanging = function() {
        var value = AIS.Validate.parseNumber(this.text, options.defaultValue);

        // Apply constraints
        if (options.min !== undefined && value < options.min) {
            value = options.min;
        }
        if (options.max !== undefined && value > options.max) {
            value = options.max;
        }

        // Apply decimal places
        if (options.decimals !== undefined) {
            value = AIS.Number.round(value, options.decimals);
        }

        this.text = value.toString();
    };

    // Add keyboard support for increment/decrement
    input.addEventListener('keydown', function(event) {
        var currentValue = AIS.Validate.parseNumber(this.text, options.defaultValue);
        var step = event.shiftKey ? 10 : 1;

        if (event.keyName === 'Up') {
            currentValue += step;
            if (options.max !== undefined) {
                currentValue = Math.min(currentValue, options.max);
            }
            this.text = currentValue.toString();
            event.preventDefault();
        } else if (event.keyName === 'Down') {
            currentValue -= step;
            if (options.min !== undefined) {
                currentValue = Math.max(currentValue, options.min);
            }
            this.text = currentValue.toString();
            event.preventDefault();
        }
    });
};

// ============================================================================
// HELPER UTILITIES
// ============================================================================

/**
 * Center window on screen
 * @param {Window} window - Window to center
 */
AIS.UI.center = function(window) {
    window.center();
};

/**
 * Make window draggable (for palettes)
 * @param {Window} window - Window to make draggable
 */
AIS.UI.makeDraggable = function(window) {
    // ExtendScript windows are draggable by default
    // This is a placeholder for potential future enhancements
};

/**
 * Add tooltip to element
 * @param {Object} element - UI element
 * @param {String} text - Tooltip text
 */
AIS.UI.setTooltip = function(element, text) {
    element.helpTip = text;
};

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AIS.UI;
}
