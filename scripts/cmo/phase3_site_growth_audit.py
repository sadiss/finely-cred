#!/usr/bin/env python3
import argparse
import json
import re
from pathlib import Path

CTA_RE = re.compile(r'(book|apply|schedule|join|start|get|download|call|consultation|demo)', re.I)
RISK_RE = re.compile(r'(guaranteed approval|guaranteed deletion|instant funding|wipe your credit|100% approval|hack|bypass rate limit|captcha)', re.I)
GENERIC_UI_RE = re.compile(r'(bg-blue-|text-blue-|from-blue-|to-blue-|rounded-lg shadow-lg bg-white text-gray)', re.I)
FC_UI_RE = re.compile(r'(fc-panel|fc-card|fc-button-brand|fc-button-soft|text-amber|border-amber|bg-slate|text-slate)', re.I)


def scan_file(path: Path):
    text = path.read_text(errors='ignore')
    return {
        'file': str(path),
        'cta_hits': len(CTA_RE.findall(text)),
        'risk_hits': sorted(set(m.group(0) for m in RISK_RE.finditer(text))),
        'generic_ui_hits': len(GENERIC_UI_RE.findall(text)),
        'fc_ui_hits': len(FC_UI_RE.findall(text)),
    }


def audit(root: Path):
    files = [p for p in root.rglob('*') if p.suffix in {'.tsx', '.ts', '.jsx', '.js', '.html'} and 'node_modules' not in str(p)]
    rows = [scan_file(p) for p in files]
    risk_files = [r for r in rows if r['risk_hits']]
    generic_files = [r for r in rows if r['generic_ui_hits'] > r['fc_ui_hits'] and r['generic_ui_hits'] > 0]
    no_cta = [r for r in rows if r['cta_hits'] == 0 and ('pages' in r['file'] or 'components' in r['file'])]
    return {
        'files_scanned': len(rows),
        'risk_files': risk_files[:50],
        'generic_ui_drift_files': generic_files[:50],
        'possible_missing_cta_files': no_cta[:50],
        'passed': not risk_files and len(generic_files) < 5,
    }

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('root', nargs='?', default='.')
    parser.add_argument('--out', default='phase3_site_growth_audit.json')
    args = parser.parse_args()
    result = audit(Path(args.root))
    Path(args.out).write_text(json.dumps(result, indent=2), encoding='utf-8')
    print(json.dumps(result, indent=2))
    raise SystemExit(0 if result['passed'] else 1)
