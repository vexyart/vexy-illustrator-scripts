# Libs | Adobe Illustrator Scripts
For developers. Libraries of frequently used functions.

[![Download Libs.zip](https://img.shields.io/badge/Download-Libs.zip-e60012?style=flat-square)](https://github.com/sky-chaser-high/adobe-illustrator-scripts/releases/latest/download/Libs.zip)
- [Map.js](#Mapjs)
- [Matrix.js](#Matrixjs)
- [UI_Image_Encoder.js](#UI_Image_Encoderjs)
- [UI_ReferencePoint.js / UI_ReferencePoint_Large.js](#UI_ReferencePointjs--UI_ReferencePoint_Largejs) `New`
- [Vector.js](#Vectorjs)
- [XMP.js](#XMPjs)

## Usage
You can include this script or copy the function to use it.  
For example Map.js:
```javascript
// @include '/foo/bar/Map.js'
var num = 50;
var value = map(num, 0, 100, 0, 255);
```

## Requirements
Illustrator CS or higher

## License
All scripts are licensed under the MIT license.  
See the included LICENSE file for more details.



# <a name="Mapjs">Map.js</a>
<img src="https://img.shields.io/badge/version-1.1.0-e8e8e8?style=flat-square">

This script summarizes functions related to maps.

## Functions
- [constrain(n, low, high)](#constrainn-low-high)
- [lerp(start, stop, amt)](#lerpstart-stop-amt)
- [map(value, start1, stop1, start2, stop2)](#mapvalue-start1-stop1-start2-stop2)
- [norm(value, start, stop)](#normvalue-start-stop)

## <a name="constrainn-low-high">constrain(n, low, high)</a>
Constrains a value between a minimum and maximum value.

**Param**:
- `n` `<number>` Number to constrain.
- `low` `<number>` Minimum limit.
- `high` `<number>` Maximum limit.

**Returns**:
- `<number>` Constrained number.

```javascript
// @include '/foo/bar/Map.js'
var num = 10;
var value = constrain(num, 50, 100);
```

<div align="right">[ <a href="#Mapjs">↑ Back to Top ↑</a> ]</div>


## <a name="lerpstart-stop-amt">lerp(start, stop, amt)</a>
Calculates a number between two numbers at a specific increment.

**Param**:
- `start` `<number>` Start value.
- `stop` `<number>` Stop value.
- `amt` `<number>` The amount to interpolate between the two values.

**Returns**:
- `<number>` Lerped value.

```javascript
// @include '/foo/bar/Map.js'
var t = 0.5;
var value = lerp(0, 100, t);
```

<div align="right">[ <a href="#Mapjs">↑ Back to Top ↑</a> ]</div>


## <a name="mapvalue-start1-stop1-start2-stop2">map(value, start1, stop1, start2, stop2)</a>
Re-maps a number from one range to another.

**Param**:
- `value` `<number>` The incoming value to be converted.
- `start1` `<number>` Lower bound of the value's current range.
- `stop1` `<number>` Upper bound of the value's current range.
- `start2` `<number>` Lower bound of the value's target range.
- `stop2` `<number>` Upper bound of the value's target range.

**Returns**:
- `<number>` Remapped number.

```javascript
// @include '/foo/bar/Map.js'
var num = 50;
var value = map(num, 0, 100, 0, 255);
```

<div align="right">[ <a href="#Mapjs">↑ Back to Top ↑</a> ]</div>


## <a name="normvalue-start-stop">norm(value, start, stop)</a>
Normalizes a number from another range into a value between 0 and 1.

**Param**:
- `value` `<number>` Incoming value to be normalized.
- `start` `<number>` Lower bound of the value's current range.
- `stop` `<number>` Upper bound of the value's current range.

**Returns**:
- `<number>` Normalized number.

```javascript
// @include '/foo/bar/Map.js'
var num = 50;
var value = norm(num, 0, 100);
```

<div align="right">[ <a href="#Mapjs">↑ Back to Top ↑</a> ]</div>



# <a name="Matrixjs">Matrix.js</a>
<img src="https://img.shields.io/badge/version-1.0.0-e8e8e8?style=flat-square">

These functions get the object's scale, rotation, or shear value from the matrix.

## Functions
- [getHorizontalScale(matrix)](#getHorizontalScalematrix)
- [getRotation(item)](#getRotationitem)
- [getRotationX(matrix)](#getRotationXmatrix)
- [getRotationY(matrix)](#getRotationYmatrix)
- [getShear(matrix)](#getShearmatrix)
- [getVerticalScale(matrix)](#getVerticalScalematrix)
- [isReflectedX(matrix)](#isReflectedXmatrix)
- [isReflectedY(matrix)](#isReflectedYmatrix)

## <a name="getHorizontalScalematrix">getHorizontalScale(matrix)</a>
Get horizontal scale.

**Param**:
- `matrix` `<Matrix>` The transformation matrix object.

**Returns**:
- `<number>` Horizontal scale.

```javascript
// @include '/foo/bar/Matrix.js'
var matrix = app.activeDocument.selection[0].matrix;
var value = getHorizontalScale(matrix);
```

<div align="right">[ <a href="#Matrixjs">↑ Back to Top ↑</a> ]</div>

## <a name="getRotationitem">getRotation(item)</a>
Get rotation value.

**Param**:
- `item` `<Object>` Object with matrix property.

**Returns**:
- `<number>` Rotation value.

```javascript
// @include '/foo/bar/Matrix.js'
var item = app.activeDocument.selection[0];
var value = getRotation(item);
```

<div align="right">[ <a href="#Matrixjs">↑ Back to Top ↑</a> ]</div>

## <a name="getRotationXmatrix">getRotationX(matrix)</a>
Get rotation value.

**Param**:
- `matrix` `<Matrix>` The transformation matrix object.

**Returns**:
- `<number>` Rotation value.

```javascript
// @include '/foo/bar/Matrix.js'
var matrix = app.activeDocument.selection[0].matrix;
var value = getRotationX(matrix);
```

<div align="right">[ <a href="#Matrixjs">↑ Back to Top ↑</a> ]</div>

## <a name="getRotationYmatrix">getRotationY(matrix)</a>
Get rotation value.

**Param**:
- `matrix` `<Matrix>` The transformation matrix object.

**Returns**:
- `<number>` Rotation value.

```javascript
// @include '/foo/bar/Matrix.js'
var matrix = app.activeDocument.selection[0].matrix;
var value = getRotationY(matrix);
```

<div align="right">[ <a href="#Matrixjs">↑ Back to Top ↑</a> ]</div>

## <a name="getShearmatrix">getShear(matrix)</a>
Get shear value.

**Param**:
- `matrix` `<Matrix>` The transformation matrix object.

**Returns**:
- `<number>` Shear value.

```javascript
// @include '/foo/bar/Matrix.js'
var matrix = app.activeDocument.selection[0].matrix;
var value = getShear(matrix);
```

<div align="right">[ <a href="#Matrixjs">↑ Back to Top ↑</a> ]</div>

## <a name="getVerticalScalematrix">getVerticalScale(matrix)</a>
Get vertical scale.

**Param**:
- `matrix` `<Matrix>` The transformation matrix object.

**Returns**:
- `<number>` Vertical scale.

```javascript
// @include '/foo/bar/Matrix.js'
var matrix = app.activeDocument.selection[0].matrix;
var value = getVerticalScale(matrix);
```

<div align="right">[ <a href="#Matrixjs">↑ Back to Top ↑</a> ]</div>

## <a name="isReflectedXmatrix">isReflectedX(matrix)</a>
Determine the inversion in the x-axis direction.

**Param**:
- `matrix` `<Matrix>` The transformation matrix object.

**Returns**:
- `<boolean>` If true, it is inverted in the x-axis direction.

```javascript
// @include '/foo/bar/Matrix.js'
var matrix = app.activeDocument.selection[0].matrix;
var isReflected = isReflectedX(matrix);
```

<div align="right">[ <a href="#Matrixjs">↑ Back to Top ↑</a> ]</div>

## <a name="isReflectedYmatrix">isReflectedY(matrix)</a>
Determine the inversion in the y-axis direction.

**Param**:
- `matrix` `<Matrix>` The transformation matrix object.

**Returns**:
- `<boolean>` If true, it is inverted in the y-axis direction.

```javascript
// @include '/foo/bar/Matrix.js'
var matrix = app.activeDocument.selection[0].matrix;
var isReflected = isReflectedY(matrix);
```

<div align="right">[ <a href="#Matrixjs">↑ Back to Top ↑</a> ]</div>



# <a name="UI_Image_Encoderjs">UI_Image_Encoder.js</a>
<img src="https://img.shields.io/badge/version-1.1.0-e8e8e8?style=flat-square">

This script converts a image file to binary for use within the ScriptUI.

<img src="../images/UI_Image_Encoder.png" alt="UI Image Encoder" width="50%">

### Usage
1. Run this script.
2. Select an image file. Only JPEG and PNG format image files are supported.
3. Select the encoding method, either the Unicode or the Percent-encoding.
4. Select whether to escape quotation marks.
5. Click the Convert button.
6. Copy the string converted to binary and paste it into the code you are creating.  
   Escape quotation marks if necessary.

```javascript
var binary = '\u0089PNG\r\n\x1A\n\x00...';
var image = dialog.add('image', undefined, File.decode(binary));
```

> **Note**  
> Unicode has a smaller binary size than percent-encoding.

### Requirements
Illustrator CS4 or higher

<div align="right">[ <a href="#libs--adobe-illustrator-scripts">↑ Back to Top ↑</a> ]</div>



# <a name="UI_ReferencePointjs--UI_ReferencePoint_Largejs">UI_ReferencePoint.js / UI_ReferencePoint_Large.js</a>
<img src="https://img.shields.io/badge/version-1.0.0-e8e8e8?style=flat-square">

This script provides the Reference Point UI. Large size is the same size as InDesign.

<img src="../images/UI_ReferencePoint.png" alt="UI Reference Point" width="80%">

### Usage
```javascript
// @include '/foo/bar/UI_ReferencePoint.js'

// Get a current reference point
var key = 'plugin/Transform/AnchorPoint';
var position = app.preferences.getIntegerPreference(key);

// Get an icon of the current reference point
var icon = getReferencePoint(position);

// Add the reference point icon in the dialog
var referencePoint = dialog.add('image', undefined, icon);
referencePoint.addEventListener('click', changeReferencePoint);
```

> **Note**  
> If you want to include this script in your script, comment out or delete the main function in this script.  
> If you want to copy and paste this UI into your script, copy line 57 and following.  
> This UI supports all four types of brightness.  
> The changeReferencePoint function describes the behavior of switching icon.

### Requirements
Illustrator CC or higher

<div align="right">[ <a href="#libs--adobe-illustrator-scripts">↑ Back to Top ↑</a> ]</div>



# <a name="Vectorjs">Vector.js</a>
<img src="https://img.shields.io/badge/version-1.0.0-e8e8e8?style=flat-square">

This script summarizes functions related to vectors.

## Functions
- [vector(x, y)](#vectorx-y)
- [clone(v)](#clonev)
- [add(a, b)](#adda-b)
- [sub(a, b)](#suba-b)
- [mult(a, b)](#multa-b)
- [div(a, b)](#diva-b)
- [mag(v)](#magv)
- [normalize(v)](#normalizev)
- [setMag(v, len)](#setMagv-len)
- [limit(v, max)](#limitv-max)
- [heading(v)](#headingv)
- [dot(a, b)](#dota-b)
- [dist(a, b)](#dista-b)



# <a name="XMPjs">XMP.js</a>
<img src="https://img.shields.io/badge/version-2.1.0-e8e8e8?style=flat-square">

These functions get the font, color, or history properties used in the document from XMP.  
**See also:** [Adobe XMP Document](https://developer.adobe.com/xmp/docs/)

> **Note** XMP can also be used for linked files.
> ```javascript
> // @include '/foo/bar/XMP.js'
> var src = app.activeDocument.placedItems[0].file;
> var history = getHistory(src);
> ```

## Functions
- [getFonts(src)](#getFontssrc)
- [getHistory(src)](#getHistorysrc)
- [getLinkedFiles(src)](#getLinkedFilessrc)
- [getPlateNames(src)](#getPlateNamessrc)
- [getRulerUnits(src)](#getRulerUnitssrc) `New`
- [getSwatches(src)](#getSwatchessrc)

## <a name="getFontssrc">getFonts(src)</a>
Get font properties that are used in the document from XMP.  

**Param**: `src` `<File>`  
**Returns**: `Array<Object>` An unordered array of font properties.  
- `composite` `<boolean>` When true, this is a composite font.
- `face` `<string>` The font face name.
- `family` `<string>` The font family name.
- `filename` `<string>` The font file name. (not a complete path)
- `name` `<string>` PostScript name of the font.
- `type` `<string>` The font type, such as TrueType, Type 1, Open Type, and so on.
- `version` `<string>` The version string.

```javascript
// @include '/foo/bar/XMP.js'
var src = app.activeDocument.fullName;
var fonts = getFonts(src);
alert(fonts[0].face);
```

<div align="right">[ <a href="#XMPjs">↑ Back to Top ↑</a> ]</div>


## <a name="getHistorysrc">getHistory(src)</a>
Get history properties from XMP.

**Param**: `src` `<File>`  
**Returns**: `Array<Object>` An ordered array of user actions that resulted in the document.  
- `action` `<string>` The action that occurred.
- `parameter` `<string> | undefined` Additional description of the action.
- `software` `<string> | undefined` The software agent that performed the action.
- `when` `<Date> | undefined` Timestamp of when the action occurred.

```javascript
// @include '/foo/bar/XMP.js'
var src = app.activeDocument.fullName;
var history = getHistory(src);
var date = history[0].when;
alert(date.getFullYear());
```

<div align="right">[ <a href="#XMPjs">↑ Back to Top ↑</a> ]</div>


## <a name="getLinkedFilessrc">getLinkedFiles(src)</a>
Get linked file properties from XMP.

**Param**: `src` `<File>`  
**Returns**: `Array<Object>` References to resources that were incorporated, by inclusion or reference, into this resource.  
- `exists` `<boolean>` When true, the path name of this object refers to an existing file.
- `filePath` `<string>` The referenced resource's file path or URL.

```javascript
// @include '/foo/bar/XMP.js'
var src = app.activeDocument.fullName;
var files = getLinkedFiles(src);
alert(files[0].filePath);
```

<div align="right">[ <a href="#XMPjs">↑ Back to Top ↑</a> ]</div>


## <a name="getPlateNamessrc">getPlateNames(src)</a>
Get plate names that are used in the document from XMP.

**Param**: `src` `<File>`  
**Returns**: `Array<string>` An ordered array of plate names that are needed to print the document.  

```javascript
// @include '/foo/bar/XMP.js'
var src = app.activeDocument.fullName;
var platenames = getPlateNames(src);
alert(platenames[0]);
```

<div align="right">[ <a href="#XMPjs">↑ Back to Top ↑</a> ]</div>


## <a name="getRulerUnitssrc">getRulerUnits(src)</a>
Get ruler units that are used in the document from XMP.

**Param**: `src` `<File>`  
**Returns**: `<string>` Ruler units.  

```javascript
// @include '/foo/bar/XMP.js'
var src = app.activeDocument.fullName;
var units = getRulerUnits(src);
alert(units);
```

<div align="right">[ <a href="#XMPjs">↑ Back to Top ↑</a> ]</div>


## <a name="getSwatchessrc">getSwatches(src)</a>
Get swatch properties that are used in the document from XMP.

**Param**: `src` `<File>`  
**Returns**: `Array<Object>` A structure containing the characteristics of a colorant (swatch) used in the document.  
- `colorant` `<Object>` The color values.
    - `cyan` `<number>` Cyan color value when the mode is CMYK. Range 0-100.
    - `magenta` `<number>` Magenta color value when the mode is CMYK. Range 0-100.
    - `yellow` `<number>` Yellow color value when the mode is CMYK. Range 0-100.
    - `black` `<number>` Black color value when the mode is CMYK. Range 0-100.
    - `gray` `<number>` Gray color value when the mode is GRAY. Range 0-255.
    - `l` `<number>` L value when the mode is LAB. Range 0-100.
    - `a` `<number>` A value when the mode is LAB. Range -128 to 127.
    - `b` `<number>` B value when the mode is LAB. Range -128 to 127.
    - `red` `<number>` Red color value when the mode is RGB. Range 0-255.
    - `green` `<number>` Green color value when the mode is RGB. Range 0-255.
    - `blue` `<number>` Blue color value when the mode is RGB. Range 0-255.
- `mode` `<string>` The color space in which the color is defined.
- `name` `<string>` Name of the swatch.
- `swatch` `<swatch> | undefined` Swatch object.
- `tint` `<number>` The tint of the color.
- `type` `<string>` The type of color, one of PROCESS or SPOT.

```javascript
// @include '/foo/bar/XMP.js'
var src = app.activeDocument.fullName;
var swatches = getSwatches(src);
alert(swatches[0].colorant.cyan);
```

<div align="right">[ <a href="#XMPjs">↑ Back to Top ↑</a> ]</div>



# License
All scripts are licensed under the MIT license.  
See the included LICENSE file for more details.
