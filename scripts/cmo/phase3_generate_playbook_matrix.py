#!/usr/bin/env python3
import json
from pathlib import Path

OBJECTIVES = [
    'book consultations', 'recruit affiliates', 'book interviews', 'sell education product',
    'promote funding readiness', 'promote credit repair education', 'reactivate cold leads',
    'grow referral partners', 'increase short-form followers', 'capture comments as leads'
]
CHANNELS = [
    'lead_intel', 'email', 'sms', 'affiliate', 'partner_outreach', 'youtube_shorts',
    'instagram_reels', 'tiktok', 'linkedin', 'press_pr', 'interviews_podcasts', 'webinar', 'seo_content'
]
ANGLES = [
    'authority', 'proof', 'objection handling', 'mistake avoidance', 'readiness',
    'storytelling', 'humor', 'education', 'urgency', 'partner enablement'
]
ACTIONS = [
    'create copy', 'create media', 'create sequence', 'create scheduler posts', 'classify replies',
    'create CRM tasks', 'score compliance', 'run experiment', 'generate brief', 'update channel model'
]

def build_matrix():
    rows = []
    i = 1
    for objective in OBJECTIVES:
        for channel in CHANNELS:
            for angle in ANGLES:
                for action in ACTIONS:
                    rows.append({
                        'id': f'phase3_capability_{i:05d}',
                        'objective': objective,
                        'channel': channel,
                        'angle': angle,
                        'action': action,
                        'description': f'{action.title()} for {objective} using {angle} on {channel}.',
                        'implemented_as': 'playbook taxon; wire to execution bridge for full automation',
                    })
                    i += 1
    return rows

if __name__ == '__main__':
    out = Path('phase3_cmo_capability_matrix.json')
    rows = build_matrix()
    out.write_text(json.dumps(rows, indent=2), encoding='utf-8')
    print(json.dumps({'capabilities': len(rows), 'file': str(out)}, indent=2))
