#!/usr/bin/env python3
"""Pure-Python growth model trainer for exported CMO events.
Input: JSON file containing either {"events": [...]} or a list of event dicts.
Output: transparent channel stats, confidence, and scale/kill recommendations.
"""
from __future__ import annotations

import json
import math
import sys
from collections import defaultdict
from pathlib import Path

POSITIVE = {"lead_created", "lead_qualified", "call_booked", "deal_closed", "revenue_recorded"}
NEGATIVE = {"compliance_flagged", "ui_regression_flagged"}


def load_events(path: Path):
    data = json.loads(path.read_text())
    if isinstance(data, dict):
        return data.get("events", [])
    return data if isinstance(data, list) else []


def train(events):
    stats = defaultdict(lambda: {"alpha": 1.0, "beta": 1.0, "events": 0, "leads": 0, "booked": 0, "revenue": 0.0, "score": 0.0})
    hooks = defaultdict(float)
    for e in events:
        ch = e.get("channel") or "unknown"
        typ = e.get("type") or "unknown"
        stats[ch]["events"] += 1
        if typ in POSITIVE:
            stats[ch]["alpha"] += 1
            if typ == "lead_created":
                stats[ch]["leads"] += 1
            if typ == "call_booked":
                stats[ch]["booked"] += 1
            if typ == "revenue_recorded":
                stats[ch]["revenue"] += float(e.get("value") or 0)
            for label in e.get("labels") or []:
                hooks[str(label).lower().strip()] += 1
        if typ in NEGATIVE:
            stats[ch]["beta"] += 1.5
            for label in e.get("labels") or []:
                hooks[str(label).lower().strip()] -= 2
    rows = []
    for ch, s in stats.items():
        confidence = s["alpha"] / (s["alpha"] + s["beta"])
        volume = math.log10(1 + s["events"])
        score = confidence * 100 + volume * 10 + s["booked"] * 3 + min(20, s["revenue"] / 1000)
        s["confidence"] = round(confidence, 4)
        s["score"] = round(score, 2)
        rows.append({"channel": ch, **s})
    rows.sort(key=lambda x: x["score"], reverse=True)
    return {
        "channels": rows,
        "scale": rows[:5],
        "watch_or_kill": [r for r in rows if r["confidence"] < 0.42 or r["score"] < 45],
        "winning_labels": sorted(({"label": k, "weight": v} for k, v in hooks.items() if k), key=lambda x: x["weight"], reverse=True)[:20],
    }


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: phase2_train_model.py exported_cmo_events.json", file=sys.stderr)
        sys.exit(2)
    print(json.dumps(train(load_events(Path(sys.argv[1]))), indent=2))
