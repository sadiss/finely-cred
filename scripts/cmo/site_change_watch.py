#!/usr/bin/env python3
"""Finely Cred CMO site-change watcher.

Creates and compares source snapshots so the CMO can report when routes, copy,
CTAs, or design tokens changed. This is safe for local/Cursor/CI use and does
not scrape external sites.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Iterable

TEXT_EXTENSIONS = {".tsx", ".ts", ".jsx", ".js", ".html", ".md", ".css"}
CTA_RE = re.compile(r"\b(book|apply|schedule|join|start|consultation|download|watch|claim|call)\b", re.I)
FC_CLASS_RE = re.compile(r"\bfc-(panel|card|button-brand|button-soft|input|badge|shell)\b")
RISK_RE = re.compile(r"guaranteed approval|guaranteed deletion|100% approval|instant funding|wipe your credit|remove anything", re.I)


@dataclass
class FileSignal:
    path: str
    sha: str
    cta_count: int
    fc_class_count: int
    risk_count: int
    line_count: int


@dataclass
class ChangeReport:
    path: str
    change_type: str
    severity: str
    summary: str
    recommended_action: str


def iter_files(root: Path) -> Iterable[Path]:
    for path in root.rglob("*"):
        if path.is_file() and path.suffix in TEXT_EXTENSIONS:
            if any(part in {"node_modules", ".git", "dist", ".next"} for part in path.parts):
                continue
            yield path


def file_signal(root: Path, path: Path) -> FileSignal:
    text = path.read_text(encoding="utf-8", errors="ignore")
    rel = str(path.relative_to(root))
    return FileSignal(
        path=rel,
        sha=hashlib.sha256(text.encode("utf-8")).hexdigest()[:16],
        cta_count=len(CTA_RE.findall(text)),
        fc_class_count=len(FC_CLASS_RE.findall(text)),
        risk_count=len(RISK_RE.findall(text)),
        line_count=text.count("\n") + 1,
    )


def build_snapshot(root: Path) -> dict[str, dict]:
    return {signal.path: asdict(signal) for signal in (file_signal(root, p) for p in iter_files(root))}


def compare_snapshots(previous: dict[str, dict], current: dict[str, dict]) -> list[ChangeReport]:
    reports: list[ChangeReport] = []
    previous_paths = set(previous)
    current_paths = set(current)
    for path in sorted(current_paths - previous_paths):
        signal = current[path]
        reports.append(ChangeReport(
            path=path,
            change_type="new_file",
            severity="medium",
            summary=f"New file with {signal['cta_count']} CTA signals and {signal['fc_class_count']} Finely UI tokens.",
            recommended_action="Review for Finely Cred styling, visible CTAs, and safe claims before shipping.",
        ))
    for path in sorted(previous_paths - current_paths):
        reports.append(ChangeReport(
            path=path,
            change_type="removed_file",
            severity="high",
            summary="File removed since previous snapshot.",
            recommended_action="Confirm no route, CTA, media, affiliate, or lead path was removed accidentally.",
        ))
    for path in sorted(previous_paths & current_paths):
        old = previous[path]
        new = current[path]
        if old["sha"] == new["sha"]:
            continue
        severity = "medium"
        notes: list[str] = []
        if new["risk_count"] > old["risk_count"]:
            severity = "critical"
            notes.append("risk wording increased")
        if new["cta_count"] < old["cta_count"]:
            severity = "high" if severity != "critical" else severity
            notes.append("CTA count decreased")
        if new["fc_class_count"] < old["fc_class_count"]:
            severity = "high" if severity != "critical" else severity
            notes.append("Finely UI token usage decreased")
        reports.append(ChangeReport(
            path=path,
            change_type="modified_file",
            severity=severity,
            summary=", ".join(notes) or "Source changed.",
            recommended_action="Run the CMO UI/CTA/compliance audit and confirm the page still looks premium and converts.",
        ))
    return reports


def main() -> int:
    parser = argparse.ArgumentParser(description="CMO site-change watcher")
    parser.add_argument("root", type=Path, nargs="?", default=Path("."))
    parser.add_argument("--snapshot", type=Path, default=Path(".cmo_site_snapshot.json"))
    parser.add_argument("--report", type=Path, default=Path("cmo_site_change_report.json"))
    args = parser.parse_args()

    root = args.root.resolve()
    current = build_snapshot(root)
    previous = json.loads(args.snapshot.read_text()) if args.snapshot.exists() else {}
    reports = compare_snapshots(previous, current)
    args.snapshot.write_text(json.dumps(current, indent=2), encoding="utf-8")
    args.report.write_text(json.dumps([asdict(r) for r in reports], indent=2), encoding="utf-8")

    print(f"Scanned {len(current)} files. Found {len(reports)} changes. Report: {args.report}")
    critical = [r for r in reports if r.severity == "critical"]
    if critical:
        print(f"Critical CMO findings: {len(critical)}")
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
