#!/usr/bin/env python3
from __future__ import annotations

import json
from dataclasses import dataclass, asdict
from datetime import datetime, timezone

RISKY = ("guaranteed approval", "guaranteed deletion", "instant funding", "wipe your credit", "100% approval")

@dataclass
class QueueDecision:
    asset_id: str
    status: str
    score: int
    reasons: list[str]
    next_action: str


def gate_caption(asset_id: str, caption: str) -> QueueDecision:
    low = caption.lower()
    reasons: list[str] = []
    score = 100
    for phrase in RISKY:
        if phrase in low:
            score -= 35
            reasons.append(f"Risky claim: {phrase}")
    if not any(word in low for word in ("book", "apply", "join", "download", "schedule", "comment", "message")):
        score -= 10
        reasons.append("Missing CTA")
    if len(caption) < 80:
        score -= 8
        reasons.append("Caption likely too thin")
    status = "approved_manual_queue" if score >= 75 else "needs_rewrite" if score >= 45 else "blocked"
    next_action = "Create manual publishing card" if status == "approved_manual_queue" else "Rewrite before publishing"
    return QueueDecision(asset_id, status, max(score, 0), reasons, next_action)


def main() -> int:
    captions = {
        "asset_good": "Business owners: stop guessing about funding. Get a funding-readiness roadmap before you apply. Book your Finely Cred consultation today.",
        "asset_bad": "Guaranteed approval and instant funding for everyone. Apply now.",
    }
    decisions = [gate_caption(asset_id, caption) for asset_id, caption in captions.items()]
    print(json.dumps({"generated_at": datetime.now(timezone.utc).isoformat(), "decisions": [asdict(d) for d in decisions]}, indent=2))
    return 0 if all(d.status != "blocked" for d in decisions[:1]) else 1

if __name__ == "__main__":
    raise SystemExit(main())
