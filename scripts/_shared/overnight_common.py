from __future__ import annotations
import argparse, json, os, random, time
from pathlib import Path

def parser(description: str):
    p = argparse.ArgumentParser(description=description)
    p.add_argument('--dry-run', action='store_true', help='Do not call external services; write a local JSON result.')
    p.add_argument('--json-out', default='.cmo-out', help='Output directory for run artifacts.')
    p.add_argument('--city', default=os.getenv('OVERNIGHT50_CITY', 'Dallas'))
    p.add_argument('--limit', type=int, default=25)
    return p

def write_result(args, name: str, payload: dict):
    out = Path(args.json_out)
    out.mkdir(parents=True, exist_ok=True)
    path = out / f'{name}.json'
    path.write_text(json.dumps(payload, indent=2), encoding='utf-8')
    print(json.dumps({'ok': True, 'script': name, 'path': str(path), **payload}, indent=2))

def simulated_items(limit: int, prefix: str):
    return [{'id': f'{prefix}_{i}', 'score': 35 + (i * 7) % 65} for i in range(max(1, limit))]
