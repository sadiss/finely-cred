#!/usr/bin/env python3
from __future__ import annotations

import json
import re
import sys
from dataclasses import dataclass, asdict
from pathlib import Path

TRUSTED = ("finelycred.com", "youtube.com", "youtu.be", "instagram.com", "tiktok.com", "linkedin.com", "facebook.com", "calendly.com")
RISKY = ("guaranteed approval", "guaranteed deletion", "instant funding", "wipe your credit", "100% approval")

@dataclass
class AuditFinding:
    path: str
    severity: str
    message: str


def scan_file(path: Path) -> list[AuditFinding]:
    text = path.read_text(errors="ignore")
    findings: list[AuditFinding] = []
    low = text.lower()
    for phrase in RISKY:
        if phrase in low:
            findings.append(AuditFinding(str(path), "high", f"Risky marketing claim: {phrase}"))
    for url in re.findall(r"https?://[^\s'\")<>]+", text):
        if not any(host in url for host in TRUSTED):
            findings.append(AuditFinding(str(path), "medium", f"Review non-registry URL: {url[:120]}"))
    if "fc-panel" not in text and path.suffix in {".tsx", ".jsx"} and "Admin" in path.name:
        findings.append(AuditFinding(str(path), "low", "Admin UI may be missing Finely Cred panel styling."))
    return findings


def main() -> int:
    root = Path(sys.argv[1] if len(sys.argv) > 1 else "src")
    files = [p for p in root.rglob("*") if p.suffix in {".tsx", ".ts", ".jsx", ".js", ".md"} and "node_modules" not in p.parts]
    findings: list[AuditFinding] = []
    for file in files:
        findings.extend(scan_file(file))
    print(json.dumps({"checked_files": len(files), "findings": [asdict(f) for f in findings]}, indent=2))
    return 1 if any(f.severity == "high" for f in findings) else 0

if __name__ == "__main__":
    raise SystemExit(main())
