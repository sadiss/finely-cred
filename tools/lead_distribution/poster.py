#!/usr/bin/env python3
"""
Finely Lead Distribution CLI — Level 5 orchestration.

Posts approved jobs to configured webhooks; exports manual packs for social/directory channels.
Always run with --dry-run first. Never use to spam third-party sites without permission.

Usage:
  python poster.py --jobs export.json --dry-run
  python poster.py --jobs export.json --execute
"""

from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

try:
    import requests
except ImportError:
    requests = None  # type: ignore


def load_jobs(path: Path) -> dict[str, Any]:
    with path.open(encoding="utf-8") as f:
        return json.load(f)


def wisdom_header(job: dict[str, Any]) -> str:
    note = job.get("wisdomNote") or "Follow platform TOS and disclose affiliation."
    return f"# Finely Distribution Pack\n# Wisdom: {note}\n# Generated: {datetime.now(timezone.utc).isoformat()}\n\n"


def post_webhook(endpoint: str, payload: dict[str, Any], dry_run: bool) -> tuple[bool, str]:
    if dry_run:
        return True, f"[dry-run] would POST to {endpoint}"
    if requests is None:
        return False, "Install requests: pip install -r requirements.txt"
    try:
        res = requests.post(endpoint, json=payload, timeout=30)
        if res.status_code >= 400:
            return False, f"HTTP {res.status_code}: {res.text[:200]}"
        return True, f"Posted OK ({res.status_code})"
    except Exception as exc:  # noqa: BLE001
        return False, str(exc)


def export_manual_pack(job: dict[str, Any], out_dir: Path, dry_run: bool) -> tuple[bool, str]:
    channel = job.get("channel") or {}
    kind = channel.get("kind") or "manual"
    job_id = job.get("id") or "job"
    filename = out_dir / f"{kind}_{job_id}.txt"
    body = wisdom_header(job)
    body += f"URL: {job.get('url', '')}\n\n"
    body += f"Message:\n{job.get('message', '')}\n"
    if dry_run:
        return True, f"[dry-run] would write {filename}"
    out_dir.mkdir(parents=True, exist_ok=True)
    filename.write_text(body, encoding="utf-8")
    return True, f"Wrote {filename}"


def run(jobs_path: Path, execute: bool, out_dir: Path) -> int:
    dry_run = not execute
    data = load_jobs(jobs_path)
    jobs = data.get("jobs") or []
    if not jobs:
        print("No jobs in export.", file=sys.stderr)
        return 1

    ok_count = 0
    for job in jobs:
        status = job.get("status")
        if status not in ("approved", "queued", "posted"):
            print(f"Skip {job.get('id')}: status={status}")
            continue

        channel = job.get("channel") or {}
        kind = channel.get("kind")
        endpoint = channel.get("endpoint")

        if kind == "webhook" and endpoint:
            payload = {
                "source": "finely-lead-distribution-cli",
                "url": job.get("url"),
                "message": job.get("message"),
                "jobId": job.get("id"),
                "exportedAt": data.get("exportedAt"),
            }
            ok, msg = post_webhook(endpoint, payload, dry_run)
        else:
            ok, msg = export_manual_pack(job, out_dir, dry_run)

        print(f"{'OK' if ok else 'FAIL'} · {job.get('id')} · {msg}")
        if ok:
            ok_count += 1

    print(f"\nProcessed {ok_count}/{len(jobs)} jobs ({'EXECUTE' if execute else 'DRY-RUN'})")
    return 0 if ok_count else 1


def main() -> None:
    parser = argparse.ArgumentParser(description="Finely Lead Distribution poster")
    parser.add_argument("--jobs", required=True, type=Path, help="JSON export from Leads OS → Distribution → L5")
    parser.add_argument("--execute", action="store_true", help="Actually post/write (default is dry-run)")
    parser.add_argument("--out", type=Path, default=Path("dist_packs"), help="Manual pack output directory")
    args = parser.parse_args()
    sys.exit(run(args.jobs, args.execute, args.out))


if __name__ == "__main__":
    main()
