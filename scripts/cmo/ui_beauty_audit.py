#!/usr/bin/env python3
"""Finely Cred UI beauty and usability audit.

Scores source files for Finely Cred UI consistency, CTA clarity, responsive
layout signals, and risky claims. This is a guardrail, not a designer replacement.
"""
from __future__ import annotations

import argparse
import json
import re
from dataclasses import asdict, dataclass
from pathlib import Path

FC_RE = re.compile(r"\bfc-(panel|card|button-brand|button-soft|badge|input|shell)\b")
GENERIC_BAD_RE = re.compile(r"bg-blue-|text-blue-|from-blue-|to-blue-|rounded-md\b|shadow-sm\b")
CTA_RE = re.compile(r"\b(Book|Apply|Schedule|Join|Start|Consultation|Download|Watch|Claim|Call)\b")
RESPONSIVE_RE = re.compile(r"\b(sm:|md:|lg:|xl:|grid|flex|container|w-full)\b")
RISK_RE = re.compile(r"guaranteed approval|guaranteed deletion|100% approval|instant funding|wipe your credit|remove anything", re.I)

@dataclass
class UiAudit:
    path: str
    score: int
    issues: list[str]
    wins: list[str]
    fixes: list[str]


def audit_file(path: Path, root: Path) -> UiAudit:
    text = path.read_text(encoding="utf-8", errors="ignore")
    score = 100
    issues: list[str] = []
    wins: list[str] = []
    fixes: list[str] = []

    fc = len(FC_RE.findall(text))
    ctas = len(CTA_RE.findall(text))
    responsive = len(RESPONSIVE_RE.findall(text))
    generic = len(GENERIC_BAD_RE.findall(text))
    risk = len(RISK_RE.findall(text))

    if fc >= 3:
        wins.append(f"Finely UI tokens found: {fc}.")
    else:
        score -= 18
        issues.append("Low Finely Cred UI token usage.")
        fixes.append("Use fc-panel, fc-card, fc-button-brand, and fc-button-soft for premium continuity.")

    if ctas >= 2:
        wins.append(f"CTA language found: {ctas}.")
    else:
        score -= 15
        issues.append("Weak CTA presence.")
        fixes.append("Add direct CTA wording: Book Consultation, Apply, Schedule, Join, Watch, or Download.")

    if responsive >= 10:
        wins.append("Responsive layout signals are present.")
    else:
        score -= 12
        issues.append("Responsive layout signals look thin.")
        fixes.append("Add responsive grid/flex classes and mobile-first spacing.")

    if generic:
        score -= min(25, generic * 4)
        issues.append(f"Possible generic SaaS styling tokens: {generic}.")
        fixes.append("Replace generic blue/flat SaaS styling with Finely Cred dark/gold/platinum surfaces.")

    if risk:
        score -= min(40, risk * 12)
        issues.append(f"Risky credit/funding claim language found: {risk}.")
        fixes.append("Replace guarantees with compliant language: roadmap, review, readiness, strategy, results vary.")

    return UiAudit(str(path.relative_to(root)), max(0, min(100, score)), issues, wins, fixes)


def main() -> int:
    parser = argparse.ArgumentParser(description="Audit Finely Cred UI quality")
    parser.add_argument("paths", nargs="+", type=Path)
    parser.add_argument("--json-out", type=Path, default=Path("cmo_ui_beauty_audit.json"))
    parser.add_argument("--fail-under", type=int, default=70)
    args = parser.parse_args()

    root = Path.cwd()
    files: list[Path] = []
    for input_path in args.paths:
      if input_path.is_file():
        files.append(input_path)
      elif input_path.is_dir():
        files.extend(p for p in input_path.rglob("*.tsx") if "node_modules" not in p.parts and "dist" not in p.parts)

    audits = [audit_file(path, root) for path in files]
    args.json_out.write_text(json.dumps([asdict(a) for a in audits], indent=2), encoding="utf-8")
    failing = [audit for audit in audits if audit.score < args.fail_under]
    avg = round(sum(a.score for a in audits) / len(audits), 1) if audits else 0
    print(f"Audited {len(audits)} files. Avg score: {avg}. Failing: {len(failing)}. Report: {args.json_out}")
    for audit in failing[:10]:
        print(f"- {audit.path}: {audit.score} ({'; '.join(audit.issues)})")
    return 1 if failing else 0


if __name__ == "__main__":
    raise SystemExit(main())
