#!/usr/bin/env python3
"""End-to-end smoke demo for the final CMO ML + Site Watch pack."""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
TMP = ROOT / "tmp_cmo_demo"


def run(cmd: list[str]) -> None:
    print("$", " ".join(cmd))
    subprocess.run(cmd, check=True, cwd=ROOT)


def main() -> int:
    TMP.mkdir(exist_ok=True)
    sample_src = TMP / "SamplePage.tsx"
    sample_src.write_text(
        """
        export function SamplePage() {
          return <section className=\"fc-panel grid md:grid-cols-2 gap-4\">
            <div className=\"fc-card\"><h1>Business credit funding readiness</h1><a className=\"fc-button-brand\">Book Consultation</a></div>
            <button className=\"fc-button-soft\">Watch Shorts</button>
          </section>
        }
        """,
        encoding="utf-8",
    )
    events = TMP / "growth_events.json"
    events.write_text(
        json.dumps(
            [
                {"type": "lead_created", "channel": "shorts", "value": 1},
                {"type": "lead_created", "channel": "affiliate", "value": 1},
                {"type": "call_booked", "channel": "shorts", "value": 1},
                {"type": "revenue_recorded", "channel": "shorts", "value": 1500},
                {"type": "post_published", "channel": "linkedin", "value": 800},
            ],
            indent=2,
        ),
        encoding="utf-8",
    )

    run([sys.executable, "scripts/cmo/cmo_feature_factory.py", "--out", str(TMP / "features.json")])
    run([sys.executable, "scripts/cmo/growth_ml_trainer.py", str(events), "--out", str(TMP / "model.json")])
    run([sys.executable, "scripts/cmo/ui_beauty_audit.py", str(TMP), "--json-out", str(TMP / "ui.json"), "--fail-under", "60"])
    run([sys.executable, "scripts/cmo/site_change_watch.py", str(TMP), "--snapshot", str(TMP / "snapshot.json"), "--report", str(TMP / "changes.json")])
    print("Final CMO demo passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
