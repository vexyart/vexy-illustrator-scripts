# Replace Category

**Purpose:** Scripts for advanced text replacement and manipulation beyond Adobe Illustrator's native Find & Replace functionality.

**Script Count:** 1 production script

## Featured Scripts

### ReplaceFormattedText.jsx (220 lines) 🆕

**Description:** Paste text from the clipboard into selected text frames while preserving the original paragraph character formatting.

**Features:**
- Paste clipboard text without formatting
- Preserve original paragraph character styles
- Recursive group processing for nested text frames
- Apply first paragraph style to all text if insufficient styles
- Works with multiple selected text frames
- Smart character attribute copying

**Usage:** 
1. Copy desired text to clipboard
2. Select one or more text frames in Illustrator
3. Run script
4. Clipboard text replaces content while keeping original formatting

**Technical Details:**
- Extracts character attributes from first character of each non-empty paragraph
- Replaces text content
- Reapplies saved character attributes to new paragraphs
- Handles empty paragraphs gracefully
- Special handling for empty stroke colors (Illustrator bug workaround)

**Original:** ReplaceFormattedText.jsx by Sergey Osokin
**Source:** https://github.com/creold

**Use Cases:**
- Update text content while maintaining design formatting
- Batch text replacement across multiple frames
- Preserve typography while changing copy
- Maintain character-level formatting (font, size, color, etc.)

---

## Category Overview

The Replace category focuses on advanced text manipulation that goes beyond simple find-and-replace operations. Scripts here provide intelligent formatting preservation, batch operations, and sophisticated text processing capabilities.

**Modernization Status:**
- ✅ 1/1 scripts modernized (100%)
- ES3 compliance: 100%
- AIS framework integration: 100%
