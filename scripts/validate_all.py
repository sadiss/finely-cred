from __future__ import annotations
import argparse, json, py_compile, subprocess, sys
from pathlib import Path

CURATED = [
    'lead_intel/swarm_enqueue.py',
    'lead_intel/worker_tick.py',
    'cmo/micro_budget_optimizer.py',
    'overnight/phase1_intel_swarm.py',
    'overnight/phase7_morning_brief.py',
    'compliance/lint_all_copy.py',
]

def main():
    p = argparse.ArgumentParser()
    p.add_argument('--dry-run', action='store_true')
    args = p.parse_args()
    root = Path(__file__).parent
    scripts = sorted([x for x in root.rglob('*.py') if '_shared' not in str(x)])
    compiled = []
    for script in scripts:
        py_compile.compile(str(script), doraise=True)
        compiled.append(str(script.relative_to(root)))
    dry_runs = []
    if args.dry_run:
        for rel in CURATED:
            cmd = [sys.executable, str(root / rel), '--json-out', str(root.parent / '.cmo-out'), '--dry-run']
            proc = subprocess.run(cmd, text=True, capture_output=True, timeout=20)
            dry_runs.append({'script': rel, 'code': proc.returncode})
    ok = all(r['code'] == 0 for r in dry_runs)
    print(json.dumps({'ok': ok, 'compiled': len(compiled), 'dryRuns': dry_runs}, indent=2))
    raise SystemExit(0 if ok else 1)
if __name__ == '__main__': main()
