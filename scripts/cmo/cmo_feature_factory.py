#!/usr/bin/env python3
"""Generate a 1000+ capability registry for CMO Prime."""
from __future__ import annotations

import argparse
import json
from pathlib import Path

CATEGORIES = [
    "site intelligence", "layout beauty", "copywriting", "offer strategy", "short-form video",
    "affiliate growth", "lead generation", "crm routing", "email automation", "sms automation",
    "media production", "press and interviews", "seo content", "webinars", "analytics",
    "machine learning", "comment replies", "dm triage", "compliance", "technical growth",
    "conversion optimization", "retargeting", "recruitment campaigns", "partner campaigns", "product launches",
]
VERBS = ["detect", "score", "rewrite", "route", "prioritize", "forecast", "test", "launch", "audit", "optimize", "summarize", "protect"]
MODULES = ["Growth OS", "Lead Intel", "CRM", "Comms Studio", "Media Studio", "Scheduler", "Inbox", "Analytics", "CMO Prime"]


def build_features() -> list[dict]:
    features: list[dict] = []
    for category in CATEGORIES:
        for verb in VERBS:
            for n in range(1, 6):
                features.append({
                    "id": f"cmo_{category.replace(' ', '_')}_{verb}_{n}",
                    "category": category,
                    "title": f"{verb.title()} {category} signal {n}",
                    "description": f"CMO Prime can {verb} {category} opportunities, produce a directive, and connect the next action across Finely Cred.",
                    "required_data": ["site signals", "growth events", "campaign data", "brand rules"],
                    "connected_modules": MODULES[n - 1:n + 3],
                    "automation_level": "approve_then_execute" if n % 3 == 0 else "draft_only",
                    "safe_growth_only": True,
                })
    return features


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate CMO capability registry")
    parser.add_argument("--out", type=Path, default=Path("cmo_capability_registry.json"))
    args = parser.parse_args()
    features = build_features()
    args.out.write_text(json.dumps(features, indent=2), encoding="utf-8")
    print(f"Generated {len(features)} CMO capabilities at {args.out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
