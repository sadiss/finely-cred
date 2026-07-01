from __future__ import annotations
import argparse, json, subprocess, sys
from pathlib import Path

PHASES = [
  'overnight/phase1_intel_swarm.py', 'overnight/phase2_revival_wave.py', 'overnight/phase3_seo_drop.py',
  'overnight/phase4_content_queue.py', 'overnight/phase5_community_capture.py', 'overnight/phase6_paid_micro.py',
  'overnight/phase7_morning_brief.py'
]

def main():
    p = argparse.ArgumentParser()
    p.add_argument('--dry-run', action='store_true')
    p.add_argument('--json-out', default='.cmo-out')
    args = p.parse_args()
    root = Path(__file__).parent
    results = []
    for rel in PHASES:
        cmd = [sys.executable, str(root / rel), '--json-out', args.json_out]
        if args.dry_run: cmd.append('--dry-run')
        proc = subprocess.run(cmd, text=True, capture_output=True)
        results.append({'phase': rel, 'code': proc.returncode, 'stdout': proc.stdout[-500:], 'stderr': proc.stderr[-500:]})
    print(json.dumps({'ok': all(r['code'] == 0 for r in results), 'results': results}, indent=2))
    raise SystemExit(0 if all(r['code'] == 0 for r in results) else 1)
if __name__ == '__main__': main()
