#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
import math
import sys
from dataclasses import dataclass, asdict
from pathlib import Path

@dataclass
class ChannelScore:
    channel: str
    leads: int
    qualified: int
    booked: int
    sales: int
    revenue: float
    cost: float
    quality_score: float
    decision: str


def sigmoid(x: float) -> float:
    return 1 / (1 + math.exp(-max(-20, min(20, x))))


def train(rows: list[dict[str, str]]) -> list[ChannelScore]:
    grouped: dict[str, dict[str, float]] = {}
    for row in rows:
        channel = row.get("channel", "unknown")
        event = row.get("event_type", "lead")
        grouped.setdefault(channel, {"leads": 0, "qualified": 0, "booked": 0, "sales": 0, "revenue": 0.0, "cost": 0.0})
        if event == "lead": grouped[channel]["leads"] += 1
        if event == "qualified_lead": grouped[channel]["qualified"] += 1
        if event == "booked_call": grouped[channel]["booked"] += 1
        if event == "sale": grouped[channel]["sales"] += 1
        grouped[channel]["revenue"] += float(row.get("revenue", 0) or 0)
        grouped[channel]["cost"] += float(row.get("cost", 0) or 0)
    scores = []
    for channel, data in grouped.items():
        leads = max(int(data["leads"]), 0)
        qualified = int(data["qualified"])
        booked = int(data["booked"])
        sales = int(data["sales"])
        revenue = data["revenue"]
        cost = data["cost"]
        signal = leads * 0.15 + qualified * 0.35 + booked * 0.65 + sales * 1.4 + (revenue - cost) / 1000
        quality = round(sigmoid(signal / 8) * 100, 2)
        decision = "scale" if quality >= 72 and leads >= 3 else "hold" if quality >= 50 else "fix" if leads >= 3 else "test_more"
        scores.append(ChannelScore(channel, leads, qualified, booked, sales, revenue, cost, quality, decision))
    return sorted(scores, key=lambda item: item.quality_score, reverse=True)


def demo_rows() -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    for channel, counts in {"shorts": (16, 6, 3, 0), "affiliate": (12, 8, 5, 2), "email": (18, 7, 4, 1), "press": (5, 4, 2, 1)}.items():
        leads, qualified, booked, sales = counts
        rows += [{"channel": channel, "event_type": "lead"} for _ in range(leads)]
        rows += [{"channel": channel, "event_type": "qualified_lead"} for _ in range(qualified)]
        rows += [{"channel": channel, "event_type": "booked_call"} for _ in range(booked)]
        rows += [{"channel": channel, "event_type": "sale", "revenue": "1500"} for _ in range(sales)]
    return rows


def main() -> int:
    if len(sys.argv) > 1 and Path(sys.argv[1]).exists():
        with Path(sys.argv[1]).open(newline="") as f:
            rows = list(csv.DictReader(f))
    else:
        rows = demo_rows()
    scores = train(rows)
    print(json.dumps({"channels": [asdict(s) for s in scores]}, indent=2))
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
