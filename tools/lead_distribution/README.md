# Finely Lead Distribution CLI

Level 5 orchestration for the Lead Growth OS. Works with exports from **Admin → Leads OS → Distribution → L5**.

## Wisdom model

| Level | Mode |
|-------|------|
| L1 | Link library — copy tracked URLs |
| L2 | Campaign builder — UTM + message templates |
| L3 | Queue — human approval before post |
| L4 | Webhook automation — Zapier / Make / n8n endpoints you own |
| L5 | This CLI — batch webhook posts + manual channel packs |

## Setup

```bash
cd tools/lead_distribution
pip install -r requirements.txt
cp config.example.json config.json
```

## Commands

Build a tracked URL:

```bash
python link_builder.py --path /free-guide --ref my-code
```

Dry-run job pack (always do this first):

```bash
python poster.py --jobs ../../path/to/finely-distribution.json --dry-run
```

Execute webhook posts + write manual packs:

```bash
python poster.py --jobs ../../path/to/finely-distribution.json --execute --out dist_packs
```

## Compliance

- Post only to channels you control or where you have explicit permission.
- Respect CAN-SPAM, TCPA, and each platform's terms.
- Directory and social jobs export copy-paste packs — they are **not** auto-spammed to random websites.
