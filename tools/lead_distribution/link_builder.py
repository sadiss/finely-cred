#!/usr/bin/env python3
"""Build tracked Finely marketing URLs with UTM + referral parameters."""

from __future__ import annotations

import argparse
from urllib.parse import urlencode


def build_url(
    origin: str,
    path: str,
    *,
    ref: str | None = None,
    utm_source: str = "cli",
    utm_medium: str = "link",
    utm_campaign: str = "finely_growth",
    guide: str | None = None,
) -> str:
    params: dict[str, str] = {}
    if ref:
        params["ref"] = ref
    if guide:
        params["guide"] = guide
    params["utm_source"] = utm_source
    params["utm_medium"] = utm_medium
    params["utm_campaign"] = utm_campaign
    base = origin.rstrip("/") + path
    return f"{base}?{urlencode(params)}"


def main() -> None:
    p = argparse.ArgumentParser(description="Finely UTM link builder")
    p.add_argument("--origin", default="https://finelycred.com")
    p.add_argument("--path", default="/free-guide")
    p.add_argument("--ref", default="finely-growth")
    p.add_argument("--utm-source", default="social")
    p.add_argument("--utm-medium", default="post")
    p.add_argument("--utm-campaign", default="lead_magnet_guide")
    p.add_argument("--guide", default="credit-dispute-letter-guide")
    args = p.parse_args()
    print(
        build_url(
            args.origin,
            args.path,
            ref=args.ref,
            utm_source=args.utm_source,
            utm_medium=args.utm_medium,
            utm_campaign=args.utm_campaign,
            guide=args.guide,
        )
    )


if __name__ == "__main__":
    main()
