#!/usr/bin/env python3
"""Repo-wide CMO Phase 2 audit.
Checks whether CMO panels are wired, whether Finely Cred UI tokens are preserved,
and whether obvious CTA/link regressions or placeholder URLs exist.
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(sys.argv[1]) if len(sys.argv) > 1 else Path.cwd()
SRC = ROOT / "src"

UI_TOKENS = ("fc-panel", "fc-card", "fc-button-brand", "fc-button-soft", "fc-input")
GENERIC_BAD = ("bg-blue-", "text-blue-", "from-blue-", "to-blue-", "rounded-md shadow", "text-gray-900 bg-white")
MONEY_PATHS = ("consultation", "pricing", "affiliate", "agents", "bookstore", "contact", "checkout")
CMO_IMPORTS = ("CmoExecutiveBrief", "CmoStaffRoom", "CmoActionGate", "CmoPageInjectionPanel")


def read(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8", errors="ignore")
    except Exception:
        return ""


def find_files() -> list[Path]:
    if not SRC.exists():
        return []
    return [p for p in SRC.rglob("*.tsx") if "node_modules" not in p.parts]


def audit() -> dict:
    files = find_files()
    text_by_file = {str(p.relative_to(ROOT)): read(p) for p in files}
    all_text = "\n".join(text_by_file.values())
    wired = {name: name in all_text for name in CMO_IMPORTS}
    ui_counts = {token: all_text.count(token) for token in UI_TOKENS}
    bad_hits = {token: all_text.count(token) for token in GENERIC_BAD if token in all_text}
    placeholders = []
    money_missing = []
    for rel, text in text_by_file.items():
        if "replace-with" in text or "example.com" in text:
            placeholders.append(rel)
        if rel.startswith("src/pages/") and rel.endswith(".tsx"):
            lower = text.lower()
            if any(word in lower for word in ("book", "apply", "consult", "affiliate", "agent", "pricing")):
                if not any(path in lower for path in MONEY_PATHS):
                    money_missing.append(rel)
    score = 100
    score -= 16 * sum(1 for ok in wired.values() if not ok)
    score -= min(20, len(placeholders) * 4)
    score -= min(20, len(bad_hits) * 4)
    score -= min(20, len(money_missing) * 2)
    score += min(20, sum(ui_counts.values()) // 40)
    score = max(0, min(150, score))
    return {
        "score150": score,
        "cmo_panels_wired": wired,
        "finely_ui_token_counts": ui_counts,
        "generic_saas_drift_hits": bad_hits,
        "placeholder_files": placeholders[:40],
        "pages_with_possible_missing_money_path": money_missing[:40],
        "recommendations": recommendations(wired, bad_hits, placeholders, money_missing),
    }


def recommendations(wired, bad_hits, placeholders, money_missing):
    out = []
    if not all(wired.values()):
        out.append("Wire missing CMO panels into AdminDashboardPage, AdminLeadIntelPage, AdminCommsStudioPage, AdminMediaStudioPage, and/or AdminAnalyticsPage.")
    if bad_hits:
        out.append("Replace generic SaaS styling with fc-panel/fc-card/fc-button-brand/fc-button-soft tokens.")
    if placeholders:
        out.append("Replace placeholder Shorts/Reels/affiliate/booking URLs with real Finely Cred links.")
    if money_missing:
        out.append("Add a visible CTA money path to the flagged pages: consultation, affiliate, agents, pricing, or bookstore.")
    if not out:
        out.append("CMO Phase 2 wiring looks clean. Proceed to build and manual QA.")
    return out


if __name__ == "__main__":
    print(json.dumps(audit(), indent=2))
