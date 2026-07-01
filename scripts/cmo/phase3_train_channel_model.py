#!/usr/bin/env python3
import argparse
import csv
import json
from collections import defaultdict
from pathlib import Path


def train(path: Path):
    state = defaultdict(lambda: {'alpha': 2.0, 'beta': 8.0, 'revenue': 0.0, 'leads': 0.0})
    if path.exists():
        with path.open(newline='', encoding='utf-8') as f:
            for row in csv.DictReader(f):
                channel = row.get('channel', 'unknown')
                leads = float(row.get('leads') or 0)
                clicks = float(row.get('clicks') or 0)
                revenue = float(row.get('revenue') or 0)
                state[channel]['alpha'] += leads
                state[channel]['beta'] += max(0.0, clicks - leads)
                state[channel]['revenue'] += revenue
                state[channel]['leads'] += leads
    model = []
    for channel, values in state.items():
        alpha = values['alpha']
        beta = values['beta']
        leads = values['leads']
        model.append({
            'channel': channel,
            'confidence': round(alpha / (alpha + beta), 4),
            'alpha': round(alpha, 2),
            'beta': round(beta, 2),
            'average_lead_value': round(values['revenue'] / leads, 2) if leads else 0,
        })
    return sorted(model, key=lambda item: item['confidence'], reverse=True)

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--events', default='growth_events.csv')
    parser.add_argument('--out', default='phase3_channel_model.json')
    args = parser.parse_args()
    model = train(Path(args.events))
    Path(args.out).write_text(json.dumps(model, indent=2), encoding='utf-8')
    print(json.dumps({'channels': len(model), 'out': args.out, 'top': model[:5]}, indent=2))
