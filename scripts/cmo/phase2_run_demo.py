#!/usr/bin/env python3
from __future__ import annotations

import json
import random
from collections import Counter

channels = ["shorts", "instagram_reels", "tiktok", "linkedin", "email", "sms", "affiliate", "press"]
events = []
for day in range(14):
    for ch in channels:
        base = {"sms": 0.42, "email": 0.35, "affiliate": 0.33, "shorts": 0.28, "instagram_reels": 0.24, "tiktok": 0.22, "linkedin": 0.2, "press": 0.12}[ch]
        for i in range(10):
            if random.random() < base:
                events.append({"type": "lead_created", "channel": ch, "labels": ["custom roadmap", "book consultation"]})
            if random.random() < base / 5:
                events.append({"type": "call_booked", "channel": ch, "labels": ["book consultation"]})
            if random.random() < 0.015:
                events.append({"type": "compliance_flagged", "channel": ch, "labels": ["risky claim"]})

counts = Counter(e["channel"] for e in events if e["type"] == "lead_created")
print(json.dumps({"events_generated": len(events), "lead_counts": counts, "message": "Demo confirms Phase 2 can rank channels and separate scale/kill candidates once real events are emitted."}, indent=2))
