#!/usr/bin/env python3
# this_file: .lib/normalize_jsx_structure.py

import os
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent  # src directory


def read_text(p: Path) -> str:
    return p.read_text(encoding="utf-8", errors="ignore")


def write_text(p: Path, s: str) -> None:
    p.write_text(s, encoding="utf-8")


LOADER_IIFE_RE = re.compile(
    r"\(function\(\)\{\s*var c=File\(Folder\.myDocuments\+\"/Adobe Scripts/vexy-ville\.ini\"\);"
    r"if\(c\.exists\)\{c\.open\('r'\);var p=c\.read\(\);c\.close\(\);var l=File\(p\+\"\.lib/core\.jsx\"\);"
    r"if\(l\.exists\)\$\.evalFile\(l\.fsName\);\}\s*\}\)\(\);",
    re.S,
)


LOADER_STANDALONE = (
    "var c=File(Folder.myDocuments+\"/Adobe Scripts/vexy-ville.ini\");"
    "if(c.exists){c.open('r');var p=c.read();c.close();var l=File(p+\".lib/core.jsx\");if(l.exists)$.evalFile(l.fsName);}"
)


def ensure_target_and_loader(text: str) -> str:
    """Ensure //@target, loader (standalone), and preference ordering.
    Canonical order after header: //@target illustrator, loader, app.preferences line.
    """
    original = text

    # Strip loader IIFE and any standalone loader occurrences
    text = LOADER_IIFE_RE.sub("", text)
    text = text.replace(LOADER_STANDALONE + "\n", "")
    text = text.replace("\n" + LOADER_STANDALONE, "")

    has_target = re.search(r"^//@target illustrator\s*$", text, re.M) is not None
    has_pref = re.search(r"^app\.preferences\.setBooleanPreference\('ShowExternalJSXWarning',[^\n]*\)\s*;?\s*$", text, re.M) is not None

    # If we have an existing target and pref, replace the block from target..pref with canonical trio
    mt = re.search(r"^//@target illustrator\s*$", text, re.M)
    mpref = re.search(r"^app\.preferences\.setBooleanPreference\('ShowExternalJSXWarning',[^\n]*\)\s*;?\s*$", text, re.M)
    if mt and mpref:
        start = mt.start()
        end = mpref.end()
        text = (
            text[:start]
            + "//@target illustrator\n"
            + LOADER_STANDALONE
            + "\n"
            + "app.preferences.setBooleanPreference('ShowExternalJSXWarning', false);\n"
            + text[end:]
        )
        return text

    # Otherwise, insert canonical trio after the header block
    m_header = re.search(r"^/\*\*[\s\S]*?\*/\s*", text)
    insert_pos = m_header.end() if m_header else 0
    insert_lines = []
    if not has_target:
        insert_lines.append("//@target illustrator")
    else:
        # If target exists but pref missing, we'll still insert target again to ensure order
        insert_lines.append("//@target illustrator")
    insert_lines.append(LOADER_STANDALONE)
    if not has_pref:
        insert_lines.append("app.preferences.setBooleanPreference('ShowExternalJSXWarning', false);")

    block = "\n" + "\n".join(insert_lines) + "\n"
    text = text[:insert_pos] + block + text[insert_pos:]
    return text if text != original else original


def extract_cfg_script_name(text: str) -> str:
    m = re.search(r"scriptName\s*:\s*([\'\"])(.*?)\1", text)
    return m.group(2) + " error" if m else "Script error"


def build_execute_block(doc_check: str | None, sel_check: str | None, error_title: str, validate_block: str | None) -> str:
    lines = []
    lines.append("\n// ============================================================================")
    lines.append("// EXECUTE")
    lines.append("// ============================================================================\n")

    if validate_block:
        # Use validation pattern (SCRIPT/validateEnvironment)
        lines.append("var validation = validateEnvironment();")
        lines.append("if (!validation.valid) {")
        # Keep alert from validate_block if available, else a sane default
        m_alert = re.search(r"alert\((.*?)\);", validate_block, re.S)
        if m_alert:
            lines.append("    alert(" + m_alert.group(1).strip() + ");")
        else:
            lines.append("    alert('Validation failed.');")
        lines.append("} else {")
        lines.append("    try {")
        lines.append("        main();")
        lines.append("    } catch (e) {")
        lines.append("        AIS.Error.show('" + error_title + "', e);")
        lines.append("    }")
        lines.append("}")
        return "\n".join(lines) + "\n"

    # Non-validation paths: use document/selection checks if present
    if doc_check and sel_check:
        lines.append("if (!AIS.Document.hasDocument()) {")
        lines.append("    " + doc_check)
        lines.append("} else if (!AIS.Document.hasSelection()) {")
        lines.append("    " + sel_check)
        lines.append("} else {")
    elif doc_check:
        lines.append("if (!AIS.Document.hasDocument()) {")
        lines.append("    " + doc_check)
        lines.append("} else {")
    elif sel_check:
        lines.append("if (!AIS.Document.hasSelection()) {")
        lines.append("    " + sel_check)
        lines.append("} else {")
    else:
        # No checks, just execute
        lines.append("try {")
        lines.append("    main();")
        lines.append("} catch (e) {")
        lines.append("    AIS.Error.show('" + error_title + "', e);")
        lines.append("}")
        return "\n".join(lines) + "\n"

    lines.append("    try {")
    lines.append("        main();")
    lines.append("    } catch (e) {")
    lines.append("        AIS.Error.show('" + error_title + "', e);")
    lines.append("    }")
    lines.append("}")

    return "\n".join(lines) + "\n"


def strip_returns(s: str) -> str:
    # Remove any 'return;' from a block that will be moved to top-level
    return re.sub(r"\breturn\s*;", "", s)


def remove_wrapper_and_build_execute(text: str) -> tuple[str, bool]:
    """Find an IIFE that contains guards and main() call, remove it, and append EXECUTE block.
    Returns (new_text, changed).
    """
    original = text

    # Find any IIFE that calls main()
    all_iifes = list(re.finditer(r"\(function\(\)\s*\{([\s\S]*?)\}\)\(\);", text))
    if not all_iifes:
        return original, False

    chosen = None
    for mm in all_iifes:
        if re.search(r"\bmain\s*\(\s*\)\s*;", mm.group(1)):
            chosen = mm
            break
    if chosen is None:
        # fallback to first IIFE
        chosen = all_iifes[0]

    content = chosen.group(1)

    # Detect validation-based wrappers
    validate_block = None
    if re.search(r"validateEnvironment\s*\(\s*\)", content):
        validate_block = content

    # Extract doc/select alert blocks if present
    doc_check = None
    sel_check = None

    m_doc = re.search(r"if\s*\(\s*!\s*AIS\.Document\.hasDocument\(\)\s*\)\s*\{([\s\S]*?)\}", content)
    if m_doc:
        alert_doc = re.search(r"alert\((.*?)\)\s*;", m_doc.group(1), re.S)
        if alert_doc:
            doc_check = strip_returns("alert(" + alert_doc.group(1).strip() + ");")

    m_sel = re.search(r"if\s*\(\s*!\s*AIS\.Document\.hasSelection\(\)\s*\)\s*\{([\s\S]*?)\}", content)
    if m_sel:
        alert_sel = re.search(r"alert\((.*?)\)\s*;", m_sel.group(1), re.S)
        if alert_sel:
            sel_check = strip_returns("alert(" + alert_sel.group(1).strip() + ");")

    # Remove the chosen IIFE from text
    start, end = chosen.span()
    text = text[:start] + text[end:]

    # Determine error title
    error_title = extract_cfg_script_name(text)

    # Append EXECUTE block
    exec_block = build_execute_block(doc_check, sel_check, error_title, validate_block)
    text = text.rstrip() + "\n" + exec_block

    return text, text != original


def process_jsx_file(p: Path) -> bool:
    text = read_text(p)
    changed = False

    # Step 1: target/loader/pref ordering
    new_text = ensure_target_and_loader(text)
    if new_text != text:
        text = new_text
        changed = True

    # Step 2: remove validation wrapper IIFE and append EXECUTE block
    text2, changed2 = remove_wrapper_and_build_execute(text)
    if changed2:
        text = text2
        changed = True

    if changed:
        write_text(p, text)
    return changed


def main():
    count = 0
    files = 0
    for root, _, filenames in os.walk(ROOT):
        for fn in filenames:
            if fn.endswith('.jsx'):
                files += 1
                p = Path(root) / fn
                if process_jsx_file(p):
                    count += 1
    print(f"Processed {files} .jsx files; modified {count}.")


if __name__ == "__main__":
    main()
