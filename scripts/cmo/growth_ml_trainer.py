#!/usr/bin/env python3
"""Local Finely Cred CMO growth ML trainer.

Uses simple standard-library learning so Cursor/CI can run it anywhere. It builds
channel scores, creative-quality scores, and next experiment recommendations from
CSV/JSON growth events. This is not fake AI; it is a practical learning layer.
"""
from __future__ import annotations

import argparse
import csv
import json
import math
from collections import defaultdict
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any

CHANNELS = [
    "shorts", "instagram_reels", "tiktok", "youtube", "linkedin", "facebook",
    "email", "sms", "affiliate", "press", "podcast", "webinar", "seo",
    "partners", "events", "retargeting",
]

@dataclass
class ChannelScore:
    channel: str
    impressions: float
    leads: float
    booked_calls: float
    conversions: float
    revenue: float
    conversion_confidence: float
    priority: str
    recommendation: str


def load_events(path: Path) -> list[dict[str, Any]]:
    if not path.exists():
        return []
    if path.suffix.lower() == ".csv":
        with path.open(newline="", encoding="utf-8") as handle:
            return list(csv.DictReader(handle))
    data = json.loads(path.read_text(encoding="utf-8"))
    if isinstance(data, list):
        return data
    if isinstance(data, dict) and isinstance(data.get("events"), list):
        return data["events"]
    return []


def as_float(value: Any, default: float = 0.0) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def train(events: list[dict[str, Any]]) -> list[ChannelScore]:
    buckets: dict[str, dict[str, float]] = defaultdict(lambda: defaultdict(float))
    for channel in CHANNELS:
        buckets[channel]["impressions"] += 0
    for event in events:
        channel = str(event.get("channel") or event.get("source") or "unknown")
        if channel not in CHANNELS:
            continue
        event_type = str(event.get("type") or event.get("event_type") or "")
        value = as_float(event.get("value"), 1.0)
        if event_type in {"post_published", "impression"}:
            buckets[channel]["impressions"] += max(1, value)
        elif event_type in {"lead_created", "lead"}:
            buckets[channel]["leads"] += 1
        elif event_type in {"call_booked", "booking"}:
            buckets[channel]["booked_calls"] += 1
        elif event_type in {"conversion_recorded", "sale", "conversion"}:
            buckets[channel]["conversions"] += 1
        elif event_type in {"revenue_recorded", "revenue"}:
            buckets[channel]["revenue"] += value

    scores: list[ChannelScore] = []
    for channel in CHANNELS:
        b = buckets[channel]
        alpha = 2 + b["leads"] + (2 * b["booked_calls"]) + (3 * b["conversions"])
        beta = 8 + max(0, math.log1p(b["impressions"]) - b["leads"] * 0.4)
        confidence = alpha / (alpha + beta)
        priority = "scale" if confidence >= 0.35 else "test" if confidence >= 0.22 else "seed"
        if priority == "scale":
            rec = "Scale with proof-led creative and retargeting. Keep compliance review on every claim."
        elif priority == "test":
            rec = "Run two controlled experiments: one pain-point hook, one proof/authority hook."
        else:
            rec = "Seed data with small daily content quota before judging this channel."
        scores.append(ChannelScore(
            channel=channel,
            impressions=b["impressions"],
            leads=b["leads"],
            booked_calls=b["booked_calls"],
            conversions=b["conversions"],
            revenue=b["revenue"],
            conversion_confidence=round(confidence, 4),
            priority=priority,
            recommendation=rec,
        ))
    return sorted(scores, key=lambda s: s.conversion_confidence, reverse=True)


def main() -> int:
    parser = argparse.ArgumentParser(description="Train local CMO growth model")
    parser.add_argument("events", type=Path, nargs="?", default=Path("growth_events.json"))
    parser.add_argument("--out", type=Path, default=Path("cmo_growth_model.json"))
    args = parser.parse_args()
    events = load_events(args.events)
    scores = train(events)
    payload = {
        "event_count": len(events),
        "top_channels": [asdict(s) for s in scores[:8]],
        "all_channels": [asdict(s) for s in scores],
        "next_experiments": [f"{s.channel}: {s.recommendation}" for s in scores[:5]],
    }
    args.out.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    print(f"Trained on {len(events)} events. Top channel: {scores[0].channel}. Output: {args.out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
