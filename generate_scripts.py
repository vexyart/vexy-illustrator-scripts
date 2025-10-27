#!/usr/bin/env python
"""
Script Generator for Adobe Illustrator Scripts
Automatically generates modernized versions of simple scripts
"""

import os
import re
import json
from pathlib import Path
from typing import Dict, List, Tuple

# Configuration
SCRIPTS_DIR = Path(__file__).parent
OLD_DIR = SCRIPTS_DIR / "old"
OLD2_DIR = SCRIPTS_DIR / "old2"
TOML_FILE = SCRIPTS_DIR / "scripts.toml"
LIB_DIR = SCRIPTS_DIR / "lib"

# Output files
LOG_FILE = SCRIPTS_DIR / "generated_scripts.log"
MANUAL_QUEUE = SCRIPTS_DIR / "manual_queue.txt"
STATS_FILE = SCRIPTS_DIR / "generation_stats.json"

# Simple script detection
COMPLEX_KEYWORDS = [
    'Window', 'dialog', r'\.show\(\)', 'panel',
    r'for\s*\(', r'while\s*\(', r'do\s*\{',
    r'function.*function',  # Nested functions
    'switch', 'case',
]

SIMPLE_MAX_LINES = 30

class ScriptInfo:
    def __init__(self, section, data):
        self.section = section
        self.name = section.split('.')[-1].strip('"')
        self.old_path = data.get('old_path', '').strip('"')
        self.desc = data.get('desc', '').strip('"')
        self.refactor = data.get('refactor', '').strip('"')
        self.quality = data.get('quality', 0)
        self.category = section.split('.')[0].strip('[')

    def get_target_filename(self):
        """Convert name to PascalCase filename"""
        # Remove special suffixes
        name = re.sub(r'\s*\(LAScripts\)$', '', self.name)
        name = re.sub(r'\s*\(FR\)$', '', self.name)
        name = re.sub(r'\s*\(Folder\)$', '', self.name)

        # Convert to PascalCase
        words = re.findall(r'[A-Za-z0-9]+', name)
        pascal = ''.join(word.capitalize() for word in words)
        return f"{pascal}.jsx"

    def get_target_path(self):
        """Get full target path for script"""
        filename = self.get_target_filename()
        return SCRIPTS_DIR / self.category / filename

def parse_toml_simple(toml_path: Path) -> List[ScriptInfo]:
    """Simple TOML parser for our specific format"""
    scripts = []
    current_section = None
    current_data = {}

    with open(toml_path, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()

            # Section header
            if line.startswith('[') and ']' in line and not line.startswith('#'):
                if current_section and current_data:
                    scripts.append(ScriptInfo(current_section, current_data))
                current_section = line
                current_data = {}

            # Key-value pair
            elif '=' in line and not line.startswith('#'):
                key, value = line.split('=', 1)
                current_data[key.strip()] = value.strip()

        # Don't forget last section
        if current_section and current_data:
            scripts.append(ScriptInfo(current_section, current_data))

    return scripts

def is_simple_script(script_path: Path) -> Tuple[bool, str]:
    """Determine if script is simple enough for automation"""
    if not script_path.exists():
        return False, "File not found"

    try:
        content = script_path.read_text(encoding='utf-8', errors='ignore')
    except Exception as e:
        return False, f"Read error: {e}"

    lines = [l for l in content.split('\n') if l.strip() and not l.strip().startswith('//')]

    # Check line count
    if len(lines) > SIMPLE_MAX_LINES:
        return False, f"Too many lines ({len(lines)})"

    # Check for complex keywords
    for keyword in COMPLEX_KEYWORDS:
        if re.search(keyword, content, re.IGNORECASE):
            return False, f"Contains complex keyword: {keyword}"

    # Check for complex nesting
    if content.count('{') > 5:
        return False, "Too many code blocks"

    return True, "Simple"

def generate_script_content(info: ScriptInfo, original_content: str) -> str:
    """Generate modernized script content"""

    # Determine requirements
    requires_doc = True
    requires_sel = 'selection' in original_content.lower()

    # Relative path to lib
    depth = 0 if info.category == 'lib' else 1
    lib_path = '../' * depth + 'lib/core.jsx'

    template = f'''/**
 * {info.name}
 * @version 1.0.0
 * @description {info.desc}
 * @author Adobe Illustrator Scripts
 * @license MIT
 * @category {info.category}
 */

#include "{lib_path}"

var SCRIPT = {{
    name: '{info.name}',
    version: '1.0.0',
    description: '{info.desc}',
    category: '{info.category}',
    requiresDocument: {str(requires_doc).lower()},
    requiresSelection: {str(requires_sel).lower()}
}};

function main() {{
    var doc = AIS.Document.getActive();
    if (!doc) return;

    try {{
        // TODO: Implement functionality
        // Original script: {info.old_path}
        {generate_main_logic(original_content, info)}
    }} catch (e) {{
        AIS.Error.show('Error in {info.name}', e);
    }}
}}

function validateEnvironment() {{
    if (SCRIPT.requiresDocument && !AIS.Document.hasDocument()) {{
        return {{ valid: false, message: 'Please open a document first.' }};
    }}
    if (SCRIPT.requiresSelection && !AIS.Document.hasSelection()) {{
        return {{ valid: false, message: 'Please select at least one object.' }};
    }}
    return {{ valid: true }};
}}

(function() {{
    var validation = validateEnvironment();
    if (!validation.valid) {{
        alert(SCRIPT.name + '\\n\\n' + validation.message);
        return;
    }}
    try {{
        main();
    }} catch (err) {{
        AIS.Error.show('Unexpected error occurred', err);
    }}
}})();
'''

    return template

def generate_main_logic(original: str, info: ScriptInfo) -> str:
    """Generate main logic based on original script patterns"""

    # For very simple scripts, try to preserve logic
    lines = original.strip().split('\n')

    # Remove LAScripts framework calls
    cleaned = []
    for line in lines:
        # Skip framework-specific lines
        if 'lascripts' in line.lower():
            continue
        if '--lascripts-event-' in line:
            continue
        if line.strip().startswith('//'):
            continue
        if not line.strip():
            continue

        cleaned.append(line)

    if cleaned and len(cleaned) <= 5:
        return '\n        '.join(cleaned)
    else:
        return f"// Original: {info.old_path}\n        // Needs manual implementation"

def generate_scripts():
    """Main generation function"""
    print("=" * 60)
    print("Adobe Illustrator Script Generator")
    print("=" * 60)

    # Parse TOML
    print(f"\nParsing {TOML_FILE}...")
    scripts = parse_toml_simple(TOML_FILE)
    print(f"Found {len(scripts)} scripts in TOML")

    # Analyze all scripts
    simple_scripts = []
    complex_scripts = []
    missing_scripts = []

    print("\nAnalyzing scripts...")
    for script in scripts:
        # Get full path to original
        old_path = SCRIPTS_DIR / script.old_path

        if not old_path.exists():
            missing_scripts.append(script)
            continue

        is_simple, reason = is_simple_script(old_path)

        if is_simple:
            simple_scripts.append(script)
        else:
            complex_scripts.append((script, reason))

    # Print statistics
    print(f"\nAnalysis Results:")
    print(f"  Simple scripts:  {len(simple_scripts)}")
    print(f"  Complex scripts: {len(complex_scripts)}")
    print(f"  Missing files:   {len(missing_scripts)}")

    # Generate simple scripts
    print(f"\nGenerating {len(simple_scripts)} simple scripts...")

    generated = []
    failed = []

    for script in simple_scripts:
        try:
            # Read original
            old_path = SCRIPTS_DIR / script.old_path
            original = old_path.read_text(encoding='utf-8', errors='ignore')

            # Generate content
            content = generate_script_content(script, original)

            # Write to target
            target_path = script.get_target_path()
            target_path.parent.mkdir(parents=True, exist_ok=True)
            target_path.write_text(content, encoding='utf-8')

            generated.append(script)
            print(f"  ✓ {script.category}/{script.get_target_filename()}")

        except Exception as e:
            failed.append((script, str(e)))
            print(f"  ✗ {script.name}: {e}")

    # Write logs
    with open(LOG_FILE, 'w', encoding='utf-8') as f:
        f.write("Generated Scripts Log\n")
        f.write("=" * 60 + "\n\n")
        for script in generated:
            f.write(f"{script.category}/{script.get_target_filename()}\n")
            f.write(f"  Original: {script.old_path}\n")
            f.write(f"  Quality: {script.quality}\n")
            f.write(f"  Description: {script.desc}\n\n")

    with open(MANUAL_QUEUE, 'w', encoding='utf-8') as f:
        f.write("Scripts Requiring Manual Processing\n")
        f.write("=" * 60 + "\n\n")

        f.write("COMPLEX SCRIPTS:\n")
        for script, reason in complex_scripts:
            f.write(f"\n{script.name}\n")
            f.write(f"  File: {script.old_path}\n")
            f.write(f"  Quality: {script.quality}\n")
            f.write(f"  Reason: {reason}\n")
            f.write(f"  Category: {script.category}\n")

        f.write("\n\nFAILED GENERATION:\n")
        for script, error in failed:
            f.write(f"\n{script.name}\n")
            f.write(f"  File: {script.old_path}\n")
            f.write(f"  Error: {error}\n")

    stats = {
        'total_scripts': len(scripts),
        'simple_generated': len(generated),
        'complex_manual': len(complex_scripts),
        'failed': len(failed),
        'missing': len(missing_scripts)
    }

    with open(STATS_FILE, 'w', encoding='utf-8') as f:
        json.dump(stats, f, indent=2)

    # Final summary
    print("\n" + "=" * 60)
    print("Generation Complete!")
    print("=" * 60)
    print(f"  Generated:  {len(generated)} scripts")
    print(f"  Failed:     {len(failed)} scripts")
    print(f"  Manual:     {len(complex_scripts)} scripts")
    print(f"  Missing:    {len(missing_scripts)} files")
    print(f"\nLogs written to:")
    print(f"  {LOG_FILE}")
    print(f"  {MANUAL_QUEUE}")
    print(f"  {STATS_FILE}")

if __name__ == '__main__':
    generate_scripts()
