#!/usr/bin/env python3
import argparse
import json
from pathlib import Path

AGENTS = [
    'Professor Apex','CMO Prime','Pipeline Titan','Scout Supreme','Night Owl Intel','Geo Commander',
    'Appointment Architect','Revenue Captain','Partner Recruiter','Affiliate Wrangler','PR Sentinel',
    'Liora Lifecycle','Goldframe','Shorts Factory','Switchboard','The Velvet Hammer','Analytics Beast',
    'Retarget Architect','Local News Radar','Inbox Triage','Fun Captain','Future Human Manager'
]

MISSIONS = [
    {'mission': 'deep_swarm', 'lead': 'Pipeline Titan', 'support': ['Scout Supreme','Switchboard'], 'output': 'action-ready lead cards'},
    {'mission': 'city_growth_sprint', 'lead': 'Geo Commander', 'support': ['Local News Radar','Analytics Beast'], 'output': 'city readiness board'},
    {'mission': 'appointment_blitz', 'lead': 'Appointment Architect', 'support': ['Liora Lifecycle','Revenue Captain'], 'output': 'booking handoff plan'},
]

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--dry-run', action='store_true')
    parser.add_argument('--json-out', default='.human-staff-out/sim.json')
    args = parser.parse_args()
    result = {
        'ok': True,
        'dryRun': args.dry_run,
        'staffCount': len(AGENTS),
        'missions': MISSIONS,
        'notificationsCreated': sum(len(m['support']) for m in MISSIONS),
        'note': 'Simulation only. External sends/publishes remain gated.'
    }
    path = Path(args.json_out)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(result, indent=2), encoding='utf-8')
    print(json.dumps(result, indent=2))

if __name__ == '__main__':
    main()
