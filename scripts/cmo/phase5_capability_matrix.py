#!/usr/bin/env python3
from __future__ import annotations

import json
from itertools import product

CATEGORIES = ["account_ops", "publishing", "inbox", "lead_quota", "budget", "affiliate", "shorts", "press", "crm", "comms", "media", "experiments", "site_watch", "seo", "partner", "events", "webinars", "proof", "retention", "reactivation"]
VERBS = ["detect", "score", "prioritize", "draft", "schedule", "approve", "route", "forecast", "allocate", "warn", "rewrite", "compare", "recommend", "summarize", "archive"]
OBJECTS = ["campaign", "account", "asset", "lead", "comment", "dm", "sequence", "offer", "hook", "cta", "link", "audience", "budget", "post", "playbook"]


def main() -> int:
    features = [f"{verb}_{obj}_for_{cat}" for cat, verb, obj in product(CATEGORIES, VERBS, OBJECTS)]
    print(json.dumps({"count": len(features), "sample": features[:50]}, indent=2))
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
