#!/usr/bin/env python3
from __future__ import annotations

import json
from datetime import datetime, timezone

CHANNEL_PLAN = {
    "shorts": {"volume": 9, "leads": 45, "order": "Publish 9 short-form clips across Shorts/Reels/TikTok."},
    "affiliate": {"volume": 80, "leads": 40, "order": "Activate affiliate and partner outreach."},
    "email": {"volume": 500, "leads": 30, "order": "Send segmented warm-lead sequence."},
    "sms": {"volume": 150, "leads": 20, "order": "Send consent-based appointment nudges."},
    "linkedin": {"volume": 35, "leads": 25, "order": "Run authority + B2B outreach."},
    "press": {"volume": 20, "leads": 15, "order": "Pitch interviews and features."},
    "partner": {"volume": 30, "leads": 25, "order": "Open partner channel conversations."},
}


def main() -> int:
    target = 200
    projected = sum(item["leads"] for item in CHANNEL_PLAN.values())
    result = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "target_daily_leads": target,
        "projected_daily_leads": projected,
        "gap": target - projected,
        "orders": CHANNEL_PLAN,
        "safety": [
            "No platform bypassing.",
            "No spam outreach.",
            "No fake engagement.",
            "Human approval before external publishing or outbound Comms.",
        ],
    }
    print(json.dumps(result, indent=2))
    return 0 if projected >= target else 1

if __name__ == "__main__":
    raise SystemExit(main())
