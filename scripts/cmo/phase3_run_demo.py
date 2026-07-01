#!/usr/bin/env python3
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def run(cmd):
    result = subprocess.run(cmd, cwd=ROOT, text=True, capture_output=True)
    print('$', ' '.join(cmd))
    print(result.stdout.strip())
    if result.stderr.strip():
        print(result.stderr.strip(), file=sys.stderr)
    if result.returncode != 0:
        raise SystemExit(result.returncode)

if __name__ == '__main__':
    run([sys.executable, 'scripts/cmo/phase3_generate_playbook_matrix.py'])
    matrix = json.loads(Path('phase3_cmo_capability_matrix.json').read_text())
    print(json.dumps({'phase3_status': 'ok', 'generated_capabilities': len(matrix)}, indent=2))
