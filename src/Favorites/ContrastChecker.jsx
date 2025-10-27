/**
 * Contrast Checker
 * @version 1.0.0
 * @description Checks contrast ratio of text/graphics to background for WCAG 2.2 compliance
 * @author Sergey Osokin (modernized for AIS)
 * @license MIT
 * @category Favorites
 * @requires Illustrator CS6 or higher
 *
 * WCAG 2.2 Compliance Standards:
 * - Normal text (AA): 4.5:1 contrast ratio
 * - Normal text (AAA): 7:1 contrast ratio
 * - Large text (AA): 3:1 contrast ratio (18pt/24px or 14pt/19px bold+)
 * - Large text (AAA): 4.5:1 contrast ratio
 * - Non-text content/Graphics (AA): 3:1 contrast ratio
 *
 * Original: https://github.com/creold/illustrator-scripts
 * Modernized to use AIS library while preserving all functionality
 */

#include "../.lib/core.jsx"

//@target illustrator
app.preferences.setBooleanPreference('ShowExternalJSXWarning', false);

// Main function
function main() {
  var SCRIPT = {
        name: 'Contrast Checker',
        version: 'v1.0.0'
      },
      CFG = {
        defRatio: 3, // Set ratio value for autocorrection
        pass: 'Pass',
        fail: 'Fail',
        isDarkUI: app.preferences.getRealPreference('uiBrightness') <= .5,
      };

  CFG.passRgb = CFG.isDarkUI ? [0.2, 0.73, 0.52] : [0.0, 0.56, 0.36]; // Green text color
  CFG.failRgb = CFG.isDarkUI ? [0.98, 0.39, 0.3] : [0.83, 0.08, 0.06]; // Red text color
  if (CFG.defRatio > 21) CFG.defRatio = 21;
  if (CFG.defRatio < 1) CFG.defRatio = 1;

  if (!isCorrectEnv()) return;

  var items = getItems(selection);
  if (items.length < 2) {
    alert('Please select two filled objects', 'Script Error');
    return;
  }

  var obj1 = isType(items[1], 'text') ? items[1].textRange.characterAttributes : items[1];
  var obj2 = isType(items[0], 'text') ? items[0].textRange.characterAttributes : items[0];

  var c1 = isType(obj1, 'character') || obj1.filled ? getRgbValues(obj1.fillColor) : []; // Background rgb array
  var c2 = isType(obj2, 'character') || obj2.filled ? getRgbValues(obj2.fillColor) : []; // Foreground rgb array

  if (!c1.length) {
    alert('Background object has no solid filll', 'Script Error');
    return;
  }

  if (!c2.length) {
    alert('Foreground object has no solid fill', 'Script Error');
    return;
  }

  invokeUI(SCRIPT, CFG, obj1, obj2, c1, c2);
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Check the script environment
 * @returns {Boolean} True if environment is correct
 */
function isCorrectEnv() {
  var args = ['app', 'document'];
  args.push.apply(args, arguments);

  for (var i = 0; i < args.length; i++) {
    var arg = args[i].toString().toLowerCase();
    switch (true) {
      case /app/g.test(arg):
        if (!/illustrator/i.test(app.name)) {
          alert('Wrong application\nRun script from Adobe Illustrator', 'Script error');
          return false;
        }
        break;
      case /version/g.test(arg):
        var rqdVers = parseFloat(arg.split(':')[1]);
        if (parseFloat(app.version) < rqdVers) {
          alert('Wrong app version\nSorry, script only works in Illustrator v.' + rqdVers + ' and later', 'Script error');
          return false;
        }
        break;
      case /document/g.test(arg):
        if (!documents.length) {
          alert('No documents\nOpen a document and try again', 'Script error');
          return false;
        }
        break;
      case /selection/g.test(arg):
        if (!selection.length || selection.typename === 'TextRange') {
          alert('Few objects are selected\nPlease, select two objects and try again', 'Script error');
          return false;
        }
        break;
    }
  }

  return true;
}

// ============================================================================
// ITEM PROCESSING
// ============================================================================

/**
 * Get single items from selection
 * @param {Array} coll - Collection of items
 * @returns {Array} Flattened array of items
 */
function getItems(coll) {
  var out = [];

  for (var i = 0, len = coll.length; i < len; i++) {
    var item = coll[i];
    if (item.pageItems && item.pageItems.length) {
      out = [].concat(out, getItems(item.pageItems));
    } else if (/compound/i.test(item.typename) && item.pathItems.length) {
      out = [].concat(out, item.pathItems[0]);
    } else if (/pathitem|text/i.test(item.typename)) {
      out.push(item);
    }
  }

  return out;
}

/**
 * Check the item typename by short name
 * @param {Object} item - Item to check
 * @param {String} type - Type name to match
 * @returns {Boolean} True if types match
 */
function isType(item, type) {
  var regexp = new RegExp(type, 'i');
  return regexp.test(item.typename);
}

// ============================================================================
// COLOR CONVERSION
// ============================================================================

/**
 * Get an array of RGB values from any color type
 * @param {Object} c - Color object
 * @returns {Array} RGB color array [r, g, b]
 */
function getRgbValues(c) {
  var out = [];
  if (c.typename) {
    switch (c.typename) {
      case 'CMYKColor':
        var rgb = cmyk2rgb([c.cyan, c.magenta, c.yellow, c.black]);
        out = rgb;
        break;
      case 'RGBColor':
        out = [c.red, c.green, c.blue];
        break;
      case 'GrayColor':
        var rgb = gray2rgb([c.gray]);
        out = rgb;
        break;
      case 'LabColor':
        var rgb = lab2rgb([c.l, c.a, c.b]);
        out = rgb;
        break;
      case 'SpotColor':
        out = [].concat(out, getRgbValues(c.spot.color));
        if (c.tint < 100) {
          out = lerp(out, [255, 255, 255], 1 - c.tint / 100);
        }
        break;
    }
  }
  return out;
}

/**
 * Convert CMYK to RGB color space
 * @param {Array} cmyk - CMYK color array
 * @returns {Array} RGB color array
 */
function cmyk2rgb(cmyk) {
  return convertColor('CMYK', 'RGB', cmyk);
}

/**
 * Convert GrayScale to RGB color space
 * @param {Array} gray - Gray value array
 * @returns {Array} RGB color array
 */
function gray2rgb(gray) {
  return convertColor('GrayScale', 'RGB', gray);
}

/**
 * Convert LAB to RGB color space
 * @param {Array} lab - LAB color array
 * @returns {Array} RGB color array
 */
function lab2rgb(lab) {
  return convertColor('LAB', 'RGB', lab);
}

/**
 * Convert RGB to CMYK color space
 * @param {Array} rgb - RGB color array
 * @returns {Array} CMYK color array
 */
function rgb2cmyk(rgb) {
  return convertColor('RGB', 'CMYK', rgb);
}

/**
 * Convert color via native converter
 * @param {String} src - Source color space
 * @param {String} dest - Destination color space
 * @param {Array} srcColor - Source color array
 * @returns {Array} Converted color array
 */
function convertColor(src, dest, srcColor) {
  return app.convertSampleColor(ImageColorSpace[src], srcColor, ImageColorSpace[dest], ColorConvertPurpose.defaultpurpose);
}

/**
 * Convert RGB to HSB color space
 * @param {Array} rgb - RGB color array [r, g, b]
 * @returns {Array} HSB color array [h, s, b]
 */
function rgb2hsb(rgb) {
  var r = rgb[0] / 255;
  var g = rgb[1] / 255;
  var b = rgb[2] / 255;

  var max = Math.max(r, g, b);
  var min = Math.min(r, g, b);
  var delta = max - min;

  var h, s, b;

  if (delta === 0) {
    h = 0; // achromatic
  } else {
    if (max === r) {
      h = ((g - b) / delta) % 6;
    } else if (max === g) {
      h = (b - r) / delta + 2;
    } else {
      h = (r - g) / delta + 4;
    }

    h *= 60;

    if (h < 0) h += 360;
  }

  b = max;
  s = (max === 0) ? 0 : delta / max;

  return [Math.round(h), Math.round(s * 100), Math.round(b * 100)];
}

/**
 * Convert HSB to RGB color space
 * @param {Array} hsb - HSB color array [h, s, b]
 * @returns {Array} RGB color array [r, g, b]
 */
function hsb2rgb(hsb) {
  var h = hsb[0] / 60;
  var s = hsb[1] / 100;
  var b = hsb[2] / 100;

  var i = Math.floor(h);
  var f = h - i;
  var p = b * (1 - s);
  var q = b * (1 - (s * f));
  var t = b * (1 - (s * (1 - f)));

  var rgb;

  switch (i) {
    case 0:
      rgb = [b, t, p];
      break;
    case 1:
      rgb = [q, b, p];
      break;
    case 2:
      rgb = [p, b, t];
      break;
    case 3:
      rgb = [p, q, b];
      break;
    case 4:
      rgb = [t, p, b];
      break;
    default:
      rgb = [b, p, q];
      break;
  }

  return [Math.round(rgb[0] * 255), Math.round(rgb[1] * 255), Math.round(rgb[2] * 255)];
}

/**
 * Linear interpolation
 * @param {Array} from - Starting values
 * @param {Array} to - Ending values
 * @param {Number} value - Interpolation factor (0-1)
 * @returns {Array} Interpolated values
 */
function lerp(from, to, value) {
  var out = [];
  for (var i = 0; i < from.length; i++) {
    out.push(from[i] + (to[i] - from[i]) * value);
  }
  return out;
}

/**
 * Mute bright RGB for CMYK color mode
 * @param {Array} c - RGB color array
 * @param {Boolean} isRgb - True if document is RGB
 * @returns {Array} Processed RGB array
 */
function fadeColor(c, isRgb) {
  return isRgb ? c : cmyk2rgb(rgb2cmyk(c));
}

// ============================================================================
// WCAG CONTRAST CALCULATIONS
// ============================================================================

/**
 * Calculate color contrast ratio per WCAG 2.2
 * @param {Array} c1 - First RGB color array
 * @param {Array} c2 - Second RGB color array
 * @returns {String} Contrast ratio (e.g., "4.52")
 */
function getContrastRatio(c1, c2) {
  var l1 = calcLuminance(c1);
  var l2 = calcLuminance(c2);
  var contRatio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  return contRatio.toFixed(2);
}

/**
 * Calculate relative luminance for color per WCAG 2.2
 * @param {Array} c - RGB color array
 * @returns {Number} Relative luminance value
 */
function calcLuminance(c) {
  var r = c[0] / 255;
  var g = c[1] / 255;
  var b = c[2] / 255;

  r = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
  g = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
  b = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Normalize RGB to 0-1 range
 * @param {Number} n - RGB value (0-255)
 * @returns {Number} Normalized value (0-1)
 */
function scale01(n) {
 return (n / 255).toFixed(2) * 1;
}

/**
 * Adjust color to meet a minimum contrast ratio
 * @param {Array} c1 - Background RGB color
 * @param {Array} c2 - Foreground RGB color
 * @param {Number} cstmRatio - Target contrast ratio
 * @param {Boolean} isRgb - True if document is RGB
 * @returns {Object} Object with adjusted c1 and c2 colors
 */
function adjustColor(c1, c2, cstmRatio, isRgb) {
  var l1 = calcLuminance(c1);
  var l2 = calcLuminance(c2);
  var isDarken = l1 < l2;

  var tmpC1 = c1.slice();
  var tmpC2 = c2.slice();
  var currRatio = getContrastRatio(tmpC1, tmpC2);

  var hsb1 = rgb2hsb(c1);
  var hsb2 = rgb2hsb(c2);
  var s1 = hsb1[1];
  var b1 = hsb1[2];
  var s2 = hsb2[1];
  var b2 = hsb2[2];

  var maxIterations = 1000;

  if (currRatio < cstmRatio) {
    for (var i = 0; i < maxIterations && currRatio < cstmRatio; i++) {
      if ((isDarken && b1 > 1) || (!isDarken && b1 < 99)) {
        b1 = isDarken ? b1 - 1 : b1 + 1;
      } else {
        b1 = isDarken ? 0 : 100;
      }

      if ((isDarken && b2 < 99) || (!isDarken && b2 > 1)) {
        isDarken ? b2++ : b2--;
      } else {
        b2 = isDarken ? 100 : 0;
      }

      if (s1 >= 0.1) s1 -= 0.1;
      if (s2 >= 0.1) s2 -= 0.1;

      tmpC1 = fadeColor(hsb2rgb([hsb1[0], s1, b1]), isRgb);
      tmpC2 = fadeColor(hsb2rgb([hsb2[0], s2, b2]), isRgb);

      currRatio = getContrastRatio(tmpC1, tmpC2);
    }
  } else if (currRatio > cstmRatio) {
    for (var i = 0; i < maxIterations && currRatio > cstmRatio; i++) {
      if ((isDarken && b1 < 99) || (!isDarken && b1 > 1)) {
        isDarken ? b1++ : b1--;
      } else {
        b1 = isDarken ? 100 : 0;
      }

      if ((isDarken && b2 > 1) || (!isDarken && b2 < 99)) {
        isDarken ? b2-- : b2++;
      } else {
        b2 = isDarken ? 0 : 100;
      }

      if (s1 <= 0.9) s1 += 0.1;
      if (s2 <= 0.9) s2 += 0.1;

      tmpC1 = fadeColor(hsb2rgb([hsb1[0], s1, b1]), isRgb);
      tmpC2 = fadeColor(hsb2rgb([hsb2[0], s2, b2]), isRgb);

      currRatio = getContrastRatio(tmpC1, tmpC2);
    }
  }

  return {
    c1: tmpC1,
    c2: tmpC2
  };
}

// ============================================================================
// USER INTERFACE
// ============================================================================

/**
 * Show contrast checker UI with live adjustment
 * @param {Object} title - Script title and version
 * @param {Object} cfg - Configuration object
 * @param {Object} obj1 - Background object
 * @param {Object} obj2 - Foreground object
 * @param {Array} c1 - Background RGB color
 * @param {Array} c2 - Foreground RGB color
 */
function invokeUI(title, cfg, obj1, obj2, c1, c2) {
  var isRgb = /rgb/i.test(app.activeDocument.documentColorSpace);
  var contRatio = getContrastRatio(c1, c2);
  var tmpC1 = c1.slice();
  var tmpC2 = c2.slice();
  var hsb1 = rgb2hsb(tmpC1);
  var hsb2 = rgb2hsb(tmpC2);

  var isUndoC1 = false;
  var isUndoC2 = false;

  var win = new Window('dialog', title.name + ' ' + title.version);
      win.orientation = 'column';
      win.alignChildren = ['fill', 'top'];

  var pnl = win.add('panel');
      pnl.preferredSize.height = 30;

  // Sliders wrapper
  var sliderGrp = win.add('group');
      sliderGrp.spacing = 20;
      sliderGrp.alignChildren = ['fill', 'center'];

  // Background sliders
  var bgGrp = sliderGrp.add('group');
      bgGrp.orientation = 'column';
      bgGrp.alignChildren = ['fill', 'center'];

  bgGrp.add('statictext', undefined, 'Background');

  // Background: Hue slider
  var bgHueGrp = bgGrp.add('group');
      bgHueGrp.add('statictext', undefined, 'H');
  var bgHue = bgHueGrp.add('slider', undefined, hsb1[0], 0, 360, {name: 'bgHue'});
      bgHue.helpTip = 'Hue 0-360\u00B0';
      bgHue.preferredSize.width = 120;

  // Background: Saturation slider
  var bgSatGrp = bgGrp.add('group');
  bgSatGrp.add('statictext', undefined, 'S');
  var bgSat = bgSatGrp.add('slider', undefined, hsb1[1], 0, 100, {name: 'bgSat'});
      bgSat.helpTip = 'Saturation 0-100%';
      bgSat.preferredSize.width = 120;

  // Background: Brightness slider
  var bgBrtGrp = bgGrp.add('group');
  bgBrtGrp.add('statictext', undefined, 'B');
  var bgBrt = bgBrtGrp.add('slider', undefined, hsb1[2], 0, 100, {name: 'bgBrt'});
      bgBrt.helpTip = 'Brightness 0-100%';
      bgBrt.preferredSize.width = 120;

  // Foreground sliders
  var fgGrp = sliderGrp.add('group');
      fgGrp.orientation = 'column';
      fgGrp.alignChildren = ['fill', 'center'];

  fgGrp.add("statictext", undefined, 'Foreground');

  // Foreground: Hue slider
  var fgHueGrp = fgGrp.add('group');
  fgHueGrp.add('statictext', undefined, 'H');
  var fgHue = fgHueGrp.add('slider', undefined, hsb2[0], 0, 360, {name: 'fgBrt'});
      fgHue.helpTip = 'Hue 0-360\u00B0';
      fgHue.preferredSize.width = 120;

  // Foreground: Saturation slider
  var fgSatGrp = fgGrp.add('group');
  fgSatGrp.add('statictext', undefined, 'S');
  var fgSat = fgSatGrp.add('slider', undefined, hsb2[1], 0, 100, {name: 'fgBrt'});
      fgSat.helpTip = 'Saturation 0-100%';
      fgSat.preferredSize.width = 120;

  // Foreground: Brightness slider
  var fgBrtGrp = fgGrp.add('group');
  fgBrtGrp.add('statictext', undefined, 'B');
  var fgBrt = fgBrtGrp.add('slider', undefined, hsb2[2], 0, 100, {name: 'fgBrt'});
      fgBrt.helpTip = 'Brightness 0-100%';
      fgBrt.preferredSize.width = 120;

  var wrapper = win.add('group');
      wrapper.alignChildren = ['fill', 'top'];

  // Contrast ratio wrapper
  var infoGrp = wrapper.add('group');
      infoGrp.alignChildren = ['left', 'top'];

  // Info labels
  var infoLbl = infoGrp.add('group');
      infoLbl.orientation = 'column';
      infoLbl.alignChildren = ['left', 'top'];

  infoLbl.add('statictext', undefined, 'WCAG 2.2 Contrast');
  infoLbl.add('statictext', undefined, 'Normal Text (AA)');
  infoLbl.add('statictext', undefined, 'Normal Text (AAA)');
  infoLbl.add('statictext', undefined, 'Large Text (AA)');
  infoLbl.add('statictext', undefined, 'Large Text (AAA)');
  infoLbl.add('statictext', undefined, 'Graphics (AA)');

  // Pass ratios
  var ratioRefs = infoGrp.add('group');
      ratioRefs.orientation = 'column';
      ratioRefs.alignChildren = 'right';
      ratioRefs.minimumSize.width = 30;

  var curRatio = ratioRefs.add('statictext', undefined, contRatio + ':1');
      curRatio.characters = 6;
      curRatio.justify = 'right';
  ratioRefs.add('statictext', undefined, '4.5:1');
  ratioRefs.add('statictext', undefined, '7:1');
  ratioRefs.add('statictext', undefined, '3:1');
  ratioRefs.add('statictext', undefined, '4.5:1');
  ratioRefs.add('statictext', undefined, '3:1');

  // Info results
  var infoVal = infoGrp.add('group');
      infoVal.orientation = 'column';
      infoVal.alignChildren = ['left', 'top'];

  infoVal.add('statictext', undefined, '');

  var mdAA = infoVal.add('statictext', undefined, '');
      mdAA.characters = 5;
  verifyContrastRatio(mdAA, contRatio, 4.5);

  var mdAAA = infoVal.add('statictext', undefined, '');
      mdAAA.characters = 5;
  verifyContrastRatio(mdAAA, contRatio, 7);

  var lgAA = infoVal.add('statictext', undefined, '');
      lgAA.characters = 5;
  verifyContrastRatio(lgAA, contRatio, 3);

  var lgAAA = infoVal.add('statictext', undefined, '');
      lgAAA.characters = 5;
  verifyContrastRatio(lgAAA, contRatio, 4.5);

  var gfxAA = infoVal.add('statictext', undefined, '');
      gfxAA.characters = 5;
  verifyContrastRatio(gfxAA, contRatio, 3);

  // Buttons
  var btns = wrapper.add('group');
      btns.orientation = 'column';
      btns.alignChildren = ['fill', 'top'];

  var resetBtn = btns.add('button', undefined, 'Reset', { name: 'reset' });
      resetBtn.helpTip = 'Restore original values';
  var customBtn = btns.add('button', undefined, 'Custom', { name: 'custom' });
      customBtn.helpTip = 'Set custom contrast ratio';
  var cancelBtn = btns.add('button', undefined, 'Cancel', { name: 'cancel' });
  var applyBtn = btns.add('button', undefined, 'Apply', { name: 'ok' });

  var copyright = win.add('statictext', undefined, '\u00A9 Sergey Osokin. Visit Github');
      copyright.justify = 'center';

  copyright.addEventListener('mousedown', function () {
    AIS.System.openURL('https://github.com/creold/');
  });

  pnl.onDraw = function() {
    drawColorPreview(tmpC1, tmpC2, this);
  };

  // Interactive sliders
  bgHue.onChanging = bgSat.onChanging = bgBrt.onChanging = function() {
    hsb1 = [bgHue.value, bgSat.value, bgBrt.value];
    tmpC1 = hsb2rgb(hsb1);
    tmpC1 = fadeColor(tmpC1, isRgb);

    isUndoC1 = true;
    uiUpdate(false);
  }

  fgHue.onChanging = fgSat.onChanging = fgBrt.onChanging = function() {
    hsb2 = [fgHue.value, fgSat.value, fgBrt.value];
    tmpC2 = hsb2rgb(hsb2);
    tmpC2 = fadeColor(tmpC2, isRgb);

    isUndoC2 = true;
    uiUpdate(false);
  }

  cancelBtn.onClick = win.close;

  resetBtn.onClick = function () {
    if (!isUndoC1 && !isUndoC2) return;

    tmpC1 = c1.slice();
    tmpC2 = c2.slice();

    uiUpdate(true);

    isUndoC1 = false;
    isUndoC2 = false;
  }

  customBtn.onClick = function() {
    var cstmInput = prompt('Enter custom contrast value from 1.0 to 21.0', cfg.defRatio);
    if (cstmInput === null) return;

    var cstmRatio = parseFloat(cstmInput.replace(/,/g, '.').split(':')[0]);
    if (isNaN(cstmRatio)) return;

    tmpC1 = c1.slice();
    tmpC2 = c2.slice();

    var data = adjustColor(tmpC1, tmpC2, cstmRatio, isRgb);
    tmpC1 = data.c1.slice();
    tmpC2 = data.c2.slice();

    isUndoC1 = true;
    isUndoC2 = true;

    uiUpdate(true);
  }

  applyBtn.onClick = function () {
    if (isUndoC1) {
      obj1.fillColor = isRgb ? setRGBColor(tmpC1) : setCMYKColor(rgb2cmyk(tmpC1));
    }

    if (isUndoC2) {
      obj2.fillColor = isRgb ? setRGBColor(tmpC2) : setCMYKColor(rgb2cmyk(tmpC2));
    }

    win.close();
  }

  // Change text labels
  function verifyContrastRatio(lbl, r1, r2) {
    lbl.text = r1 >= r2 ? cfg.pass : cfg.fail;
    lbl.graphics.foregroundColor = lbl.graphics.newPen(win.graphics.PenType.SOLID_COLOR, (r1 >= r2 ? cfg.passRgb : cfg.failRgb), 1);
  }

  function drawColorPreview(c1, c2, cnvsArea) {
    var canvas = cnvsArea.graphics;
    var yPos = 0;
    var xPos = 0;
    var w = cnvsArea.size[0] * 0.5;
    var h = cnvsArea.size[1];

    var rgb = [].concat(c1);
    rgb[0] = scale01(rgb[0]);
    rgb[1] = scale01(rgb[1]);
    rgb[2] = scale01(rgb[2]);

    canvas.newPath();
    canvas.rectPath(xPos, yPos, w, h);
    var brush = canvas.newBrush(canvas.BrushType.SOLID_COLOR, rgb);
    canvas.fillPath(brush);
    canvas.closePath();
    xPos += w;

    rgb = [].concat(c2);
    rgb[0] = scale01(rgb[0]);
    rgb[1] = scale01(rgb[1]);
    rgb[2] = scale01(rgb[2]);

    canvas.newPath();
    canvas.rectPath(xPos, yPos, w, h);
    brush = canvas.newBrush(canvas.BrushType.SOLID_COLOR, rgb);
    canvas.fillPath(brush);
    canvas.closePath();
  }

  // Update preview
  function uiUpdate(isChngSlider) {
    if (isChngSlider) {
      hsb1 = rgb2hsb(tmpC1);
      hsb2 = rgb2hsb(tmpC2);

      bgHue.value = hsb1[0];
      bgSat.value = hsb1[1];
      bgBrt.value = hsb1[2];

      fgHue.value = hsb2[0];
      fgSat.value = hsb2[1];
      fgBrt.value = hsb2[2];
    }

    contRatio = getContrastRatio(tmpC1, tmpC2);
    curRatio.text = contRatio + ':1';
    verifyContrastRatio(mdAA, contRatio, 4.5);
    verifyContrastRatio(mdAAA, contRatio, 7);
    verifyContrastRatio(lgAA, contRatio, 3);
    verifyContrastRatio(lgAAA, contRatio, 4.5);
    verifyContrastRatio(gfxAA, contRatio, 3);

    pnl.hide();
    pnl.show();
    win.layout.layout(true);
  }

  win.center();
  win.show();
}

// ============================================================================
// COLOR GENERATION
// ============================================================================

/**
 * Generate solid RGB color
 * @param {Number|Array} r - Red value or RGB array
 * @param {Number} g - Green value
 * @param {Number} b - Blue value
 * @returns {RGBColor} RGB color object
 */
function setRGBColor(r, g, b) {
  if (r instanceof Array) {
    b = r[2];
    g = r[1];
    r = r[0];
  }
  var rgb = new RGBColor();
  rgb.red = parseInt(r);
  rgb.green = parseInt(g);
  rgb.blue = parseInt(b);
  return rgb;
}

/**
 * Generate solid CMYK color
 * @param {Number|Array} c - Cyan value or CMYK array
 * @param {Number} m - Magenta value
 * @param {Number} y - Yellow value
 * @param {Number} k - Black value
 * @returns {CMYKColor} CMYK color object
 */
function setCMYKColor(c, m, y, k) {
  if (c instanceof Array) {
    k = c[3];
    y = c[2];
    m = c[1];
    c = c[0];
  }
  var cmyk = new CMYKColor();
  cmyk.cyan = parseInt(c);
  cmyk.magenta = parseInt(m);
  cmyk.yellow = parseInt(y);
  cmyk.black = parseInt(k);
  return cmyk;
}

// ============================================================================
// ENTRY POINT
// ============================================================================

try {
  main();
} catch (e) {
  AIS.Error.show('Unexpected error occurred', e);
}
