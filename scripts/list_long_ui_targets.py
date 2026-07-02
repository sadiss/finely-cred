#!/usr/bin/env python3
from pathlib import Path
patterns = ['space-y-2 max-h', 'grid lg:grid-cols-12', '<details', 'slice(0, 250)', 'overflow-auto']
root = Path('src')
rows = []
for p in root.rglob('*.tsx'):
    text = p.read_text(errors='ignore')
    hits = [x for x in patterns if x in text]
    if hits:
        rows.append({'path': str(p), 'hits': hits})
print('\n'.join(f"{r['path']}: {', '.join(r['hits'])}" for r in rows[:200]))
