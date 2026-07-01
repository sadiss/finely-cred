from __future__ import annotations
from pathlib import Path
import sys
sys.path.append(str(Path(__file__).resolve().parents[1] / '_shared'))
from overnight_common import parser, write_result, simulated_items

NAME = 'cmo.city_angle_builder'

def main():
    args = parser(NAME).parse_args()
    payload = {
        'dryRun': args.dry_run,
        'city': args.city,
        'limit': args.limit,
        'items': simulated_items(min(args.limit, 12), NAME.replace('.', '_')),
        'notes': 'Compliant dry-run worker. External APIs require credentials and production wiring.',
    }
    write_result(args, NAME.replace('.', '_'), payload)

if __name__ == '__main__':
    main()
