#!/usr/bin/env python3
"""Generate 21-day Finely sales pack files (emails, SMS, HTML one-sheets)."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EMAIL_DIR = ROOT / "21-day" / "emails"
SMS_DIR = ROOT / "21-day" / "sms"
HTML_DIR = ROOT / "html-one-sheets"

FOOTER = """
---
**Score literacy:** Model + bureau + purpose + soft/hard — never a naked number. Apps often show VantageScore 3.0; mortgage paths may use Beacon 5.0 / FICO 2 / FICO 4 (middle score varies). Never teach "FICO 5.8" as real. "FICO 5.4" is unverified jargon — use Beacon 5.0 on Equifax.

**Finely boundary:** Educational restore & file accuracy — no guaranteed scores, deletions, or loan approvals. Debt may remain. Nora/lender decisions are separate.

*Educational only. Not legal advice.*
"""

LOGO_IMG = "../../../../public/brand/finely-cred-logo-dark.png"

DAYS = [
    {
        "n": 1,
        "vertical": "general",
        "subject": "Welcome to Finely Cred — your restore lane starts here",
        "email": """Hi {{first_name}},

You raised your hand for something better than hype. **Finely Cred** is a restore and **file accuracy** wealth tool — we document, dispute with evidence, and teach literacy. We are not a "credit repair" billboard and we do not sell miracle deletions.

**Today:** open your intake checklist and upload reports to the vault (redact SSN if mailing PDFs). **This week:** note any collector contact or court dates before any bureau round.

**Inquiry CTA:** Reply **READY** and we'll confirm your lane — or book: https://finelycred.com/consultation

We will never promise a score, an approval, or that debt disappears. We will help you understand *which* score matters for *which* goal.""",
        "sms": "Finely Cred: Day 1 — upload reports to your vault. Reply READY for intake. Educational restore only — no score guarantees. finelycred.com/consultation",
        "caption": "Day 1 with Finely Cred: stop chasing the wrong number. File accuracy first. Book an educational session — link in bio. #RestoreNotHype",
        "html": None,
    },
    {
        "n": 2,
        "vertical": "tax",
        "subject": "Tax season & your credit file — what actually links",
        "email": """Hi {{first_name}},

**Tax partners:** your clients don't need a lecture on FICO — they need **file accuracy** before a lien, levy, or payment plan shows up wrong on a bureau.

Finely teaches: IRS transcripts and identity mismatches are **documentation** problems first. We don't file taxes; we help partners spot when a tradeline or public record doesn't match reality — then evidence, then dispute rounds with honesty.

**Debt honesty:** A payment plan may remain on the report even after restore work. No guaranteed removal.

**CTA:** Send us one anonymized tri-merge (educational review) — reply **TAX-DESK** or https://finelycred.com/consultation?interest=tax_partner""",
        "sms": "Finely Day 2/Tax: File accuracy before funding talk. Reply TAX-DESK for partner desk. No deletion promises. finelycred.com/consultation",
        "caption": "Tax pros: your client's app score ≠ mortgage tri-merge. Model + bureau + purpose. Partner with Finely for restore documentation — not hype.",
        "html": "vertical-tax-partners",
        "html_title": "Tax & credit file accuracy",
        "html_kicker": "Partner vertical · Tax",
        "html_body": "<p><strong>For tax professionals:</strong> Help clients fix <em>report accuracy</em> before liens and identity mismatches become funding blockers.</p><ul><li>Evidence-first disputes — not mass template spam</li><li>Score literacy: Vantage app ≠ Beacon 5.0 mortgage pull</li><li>Debt may remain — we document, we don't guarantee deletion</li></ul>",
        "html_cta": "TAX-DESK inquiry",
        "html_cta_href": "https://finelycred.com/consultation?interest=tax_partner",
    },
    {
        "n": 3,
        "vertical": "bhph",
        "subject": "BHPH & auto credit — industry scores, not app vanity",
        "email": """Hi {{first_name}},

**Buy-here-pay-here partners:** dealers see **FICO Auto** and bankcard scores that never match the free app in the customer's pocket. Teach the lot team one line: *model, bureau, purpose, soft or hard.*

Finely restores **file accuracy** on repossession, deficiency, and duplicate tradelines — with validation when collectors are in play. We don't promise repo deletes or instant 700s.

**BHPH truth:** Some negative history stays until statutory timelines run. Our job is accurate reporting and consumer education — not "repair" slogans.

**CTA:** Reply **LOT-DESK** for BHPH partner packet — https://finelycred.com/consultation?interest=bhph""",
        "sms": "Finely Day 3/BHPH: FICO Auto ≠ app Vantage. Reply LOT-DESK. Restore accuracy — no repo-delete hype. finelycred.com/consultation",
        "caption": "BHPH dealers: industry scores differ by product. Finely = file accuracy + debt honesty. Partner desk open.",
        "html": "vertical-bhph-partners",
        "html_title": "BHPH & auto file accuracy",
        "html_kicker": "Partner vertical · BHPH",
        "html_body": "<p>Train your lot: <strong>FICO Auto</strong> is purpose-built — not the Vantage number on a free app.</p><p>Finely documents repossession errors, duplicates, and collector validation paths. <strong>No guaranteed deletions.</strong></p>",
        "html_cta": "LOT-DESK inquiry",
        "html_cta_href": "https://finelycred.com/consultation?interest=bhph",
    },
    {
        "n": 4,
        "vertical": "realtor",
        "subject": "Realtors: pre-approval starts with the right score conversation",
        "email": """Hi {{first_name}},

**Realtor partners:** stop losing weeks when buyers brag about a Credit Karma number that isn't the **mortgage tri-merge**. Educate early: Equifax Beacon **5.0**, Experian **FICO 2**, TransUnion **FICO 4** — middle score *often* matters (underwriting varies).

Finely is the **restore → readiness** lane before Nora/lenders stack. We don't issue pre-approvals; we clean file accuracy and debt gates (SOP-08–15).

**No guarantees** on score jumps or closings. Yes to documentation, letters, and honest timelines.

**CTA:** Reply **REALTOR-PLUS** — co-marketing one-sheet, no Nora logo on Finely art: https://finelycred.com/consultation?interest=realtor""",
        "sms": "Finely Day 4/Realtor: Mortgage scores ≠ free apps. Reply REALTOR-PLUS. Restore lane for buyers — no approval promises.",
        "caption": "Realtors: teach tri-merge literacy before showings. Finely restore desk — partner packet ready.",
        "html": "vertical-realtor-partners",
        "html_title": "Buyer readiness — score literacy",
        "html_kicker": "Partner vertical · Realtor",
        "html_body": "<p>Give buyers the <strong>model + bureau + purpose</strong> talk before they fall in love with a listing.</p><p>Finely: restore evidence, debt gates, vault — lender decides funding separately.</p>",
        "html_cta": "REALTOR-PLUS",
        "html_cta_href": "https://finelycred.com/consultation?interest=realtor",
    },
    {
        "n": 5,
        "vertical": "mortgage",
        "subject": "Mortgage LO allies — middle score myths, real files",
        "email": """Hi {{first_name}},

**Mortgage partners:** you already know adoption varies on FICO 8/9/10/10T. Your borrowers need Finely when **tradelines are wrong**, collections need validation, or old charge-offs are duplicated — not when they want a magic 40-point week.

We teach **middle score** as educational shorthand, not a promise. Never cite **FICO 5.8**; clarify **Beacon 5.0** vs random "5.4" forum jargon.

**Debt honesty:** Paying a collection doesn't always remove it; disputes must be factual.

**CTA:** Reply **LO-ALLY** for restore handoff checklist — https://finelycred.com/consultation?interest=mortgage""",
        "sms": "Finely Day 5/Mortgage: Beacon 5.0 / FICO 2/4 literacy. Reply LO-ALLY. File accuracy — no score guarantees.",
        "caption": "LO partners: Finely fixes files before you pull tri-merge again. Educational restore — debt may remain.",
        "html": "vertical-mortgage-partners",
        "html_title": "Mortgage tri-merge literacy",
        "html_kicker": "Partner vertical · Mortgage",
        "html_body": "<p>Classic mortgage pulls: <strong>Beacon 5.0</strong>, <strong>FICO 2</strong>, <strong>FICO 4</strong>. Middle score concept — underwriting varies.</p><p>Never teach FICO 5.8. Finely restores accuracy — you underwrite.</p>",
        "html_cta": "LO-ALLY",
        "html_cta_href": "https://finelycred.com/consultation?interest=mortgage",
    },
    {
        "n": 6,
        "vertical": "haitian",
        "subject": "Haitian desk — Kreyòl clarity, English bureau letters",
        "email": """Hi {{first_name}},

**Immigration & Haitian community partners:** families need **Kreyòl explanations** and **English bureau letters** when citing templates. Finely Cred Haitian desk explains collectors, summons risk, and restore rounds without "credit repair" fear tactics.

**Free Kreyòl kit:** https://finelycred.com/free-kreyol-guide — unlock stays on that page; live chat at /haitian?lang=ht.

We don't promise visas, scores, or deletions. We document and educate. Debt may remain.

**CTA:** Reply **KREYOL-DESK** for community workshop outline — https://finelycred.com/haitian?lang=ht""",
        "sms": "Finely Day 6: Kreyòl kit + desk — /free-kreyol-guide Pa pwomès nòt. Reply KREYOL-DESK.",
        "caption": "Haitian American families: Kreyòl credit literacy + English letters when needed. Finely Haitian desk — educational only.",
        "html": "vertical-haitian-immigration",
        "html_title": "Haitian desk & immigration literacy",
        "html_kicker": "Community · Kreyòl",
        "html_body": "<p>Explain credit in <strong>Kreyòl</strong>; cite bureaus in <strong>English</strong> when required.</p><p><a href=\"https://finelycred.com/free-kreyol-guide\">Free Kreyòl kit</a> · <a href=\"https://finelycred.com/haitian?lang=ht\">Live desk</a></p><p>No score or visa guarantees.</p>",
        "html_cta": "KREYOL-DESK",
        "html_cta_href": "https://finelycred.com/haitian?lang=ht",
    },
    {
        "n": 7,
        "vertical": "church",
        "subject": "Church & community — wealth tool night, not repair circus",
        "email": """Hi {{first_name}},

**Church / community leaders:** host a **wealth tool** night, not a "700 in 30 days" circus. Finely teaches budgeting gates, debt honesty, and **file accuracy** — with compliant footers on every flyer.

Use our gold-brand one-sheet (official medallion logo only — no shield marks). No Nora branding on Finely-primary flyers.

**CTA:** Reply **FAITH-DESK** for a 45-minute educational outline — https://finelycred.com/consultation?interest=church""",
        "sms": "Finely Day 7/Church: Wealth tool night — restore literacy. Reply FAITH-DESK. No miracle score promises.",
        "caption": "Pastors & community captains: Finely = debt honesty + file accuracy. Workshop packet available.",
        "html": "vertical-church-community",
        "html_title": "Church & community wealth tool night",
        "html_kicker": "Community · Faith",
        "html_body": "<p>45-minute <strong>educational</strong> outline: debt gates, vault uploads, score model literacy.</p><p>Official Finely brand only on flyers. Nora handoff = separate conversation.</p>",
        "html_cta": "FAITH-DESK",
        "html_cta_href": "https://finelycred.com/consultation?interest=church",
    },
    {
        "n": 8,
        "vertical": "general",
        "subject": "Day 8 — the score on your phone is probably the wrong model",
        "email": """Hi {{first_name}},

Quick literacy win for your audience: **VantageScore 3.0** on free apps is useful for *trends* — not a mortgage approval promise. FICO **8/9/10/10T** adoption varies by lender. Mortgage classics: **Beacon 5.0**, **FICO 2**, **FICO 4**.

If a guru says **FICO 5.8**, correct them — it's a 5+8 mashup, not a product.

**CTA:** Reply **SCORE-ASK** with one screenshot (redact account numbers) for educational commentary — https://finelycred.com/consultation""",
        "sms": "Finely Day 8: App score ≠ lender pull. Reply SCORE-ASK. Never FICO 5.8 hype. Educational only.",
        "caption": "Model + bureau + purpose + soft/hard. Finely Track I score intelligence for partners.",
        "html": "day-08-score-literacy-consumer",
        "html_title": "Your app score isn't their underwriting score",
        "html_kicker": "Day 8 · Score literacy",
        "html_body": "<p>Free apps: mostly <strong>Vantage 3.0</strong>. Mortgages: older FICO generations per bureau.</p><p>Finely teaches — we don't sell naked numbers.</p>",
        "html_cta": "SCORE-ASK",
        "html_cta_href": "https://finelycred.com/consultation",
    },
    {
        "n": 9,
        "vertical": "tax",
        "subject": "Tax transcript mismatches — partner alert",
        "email": """Hi {{first_name}},

**Tax vertical (day 9):** when a client's name/SSN variant hits a bureau tradeline, funding dies early. Finely triages **identity + file accuracy** before Round 1 spam.

Partners: don't promise IRS problem resolution — refer to their CPA. We handle **credit reporting accuracy** with evidence.

**CTA:** **TAX-FILE** — https://finelycred.com/consultation?interest=tax_partner""",
        "sms": "Finely Day 9/Tax: Identity mismatch on bureau? Reply TAX-FILE. Documentation first.",
        "caption": "Tax + credit: separate lanes, one accurate file. Finely partner desk.",
        "html": None,
    },
    {
        "n": 10,
        "vertical": "bhph",
        "subject": "Repo reporting — validation before deletion talk",
        "email": """Hi {{first_name}},

**BHPH day 10:** repossession and deficiency balances need **validation** when collectors are involved (educational FDCPA framing). Finely pauses blind bureau blasts when summons risk exists.

Industry **FICO Auto** may still be low after accurate reporting — that's honesty, not failure.

**CTA:** Reply **REPO-ASK** — https://finelycred.com/consultation?interest=bhph""",
        "sms": "Finely Day 10/BHPH: Repo on report? Validation path first. Reply REPO-ASK. No delete guarantees.",
        "caption": "BHPH: accurate repo reporting + consumer education. Finely restore lane.",
        "html": "debt-honesty-repossession",
        "html_title": "Repossession & debt honesty",
        "html_kicker": "BHPH · Debt honesty",
        "html_body": "<p>Validation when collectors call. Summons = pause spam rounds.</p><p><strong>Debt may remain.</strong> No miracle deletion ads.</p>",
        "html_cta": "REPO-ASK",
        "html_cta_href": "https://finelycred.com/consultation?interest=bhph",
    },
    {
        "n": 11,
        "vertical": "realtor",
        "subject": "Listing season — pre-qualify the file, not the fantasy",
        "email": """Hi {{first_name}},

**Realtor day 11:** before showings, ask buyers if disputes are **evidence-backed** or template farms. Finely vault stores proofs per tradeline — lenders love documentation.

Score talk: middle mortgage score education only — no rate guarantees.

**CTA:** **SHOW-READY** — https://finelycred.com/consultation?interest=realtor""",
        "sms": "Finely Day 11/Realtor: Evidence-backed disputes only. Reply SHOW-READY.",
        "caption": "Listings move faster with accurate files. Finely vault + restore.",
        "html": None,
    },
    {
        "n": 12,
        "vertical": "mortgage",
        "subject": "FICO 10T trended data — don't over-promise adoption",
        "email": """Hi {{first_name}},

**Mortgage day 12:** **FICO 10T** uses balance trends — not every investor uses it yet. Teach borrowers that paying down cards helps *generally*, but we won't promise a 10T-specific jump.

Classic files still matter: **Beacon 5.0 / FICO 2 / FICO 4**.

**CTA:** **TRI-MERGE-EDU** — https://finelycred.com/consultation?interest=mortgage""",
        "sms": "Finely Day 12: 10T adoption varies. Classic mortgage FICO still matters. Reply TRI-MERGE-EDU.",
        "caption": "Mortgage literacy: trended models ≠ universal. Finely partner training.",
        "html": "fico-10t-adoption-honesty",
        "html_title": "FICO 10T — adoption varies",
        "html_kicker": "Mortgage · Honesty",
        "html_body": "<p><strong>FICO 10T</strong> = trended balances. Not every lender uses it.</p><p>Teach classic tri-merge models alongside. No FICO 5.8 fiction.</p>",
        "html_cta": "TRI-MERGE-EDU",
        "html_cta_href": "https://finelycred.com/consultation?interest=mortgage",
    },
    {
        "n": 13,
        "vertical": "haitian",
        "subject": "Remittance families — joint files & authorized user honesty",
        "email": """Hi {{first_name}},

**Haitian desk day 13:** AU tradelines and family cards need **honest** coaching — may help sometimes, not a black-card guarantee. Explain in Kreyòl; keep bureau letter English when citing Metro-2/factual disputes.

Link kit: /free-kreyol-guide

**CTA:** **FAMILY-FILE** — https://finelycred.com/haitian?lang=ht""",
        "sms": "Finely Day 13: AU honesty in Kreyòl. Reply FAMILY-FILE. /free-kreyol-guide",
        "caption": "Family credit: no AU magic promises. Finely Haitian desk.",
        "html": None,
    },
    {
        "n": 14,
        "vertical": "church",
        "subject": "Community referral circle — compliant partner intros",
        "email": """Hi {{first_name}},

**Church day 14:** build a referral circle that uses **Finely restore** first, **Nora/lender** second — never mixed logos on the same flyer.

Debt honesty sermon snippet: "Accurate files + on-time payments beat hype."

**CTA:** **CIRCLE-START** — https://finelycred.com/consultation?interest=church""",
        "sms": "Finely Day 14/Church: Referral circle — restore then funding handoff. Reply CIRCLE-START.",
        "caption": "Community referrals done compliantly. Finely brand kit on all flyers.",
        "html": "community-referral-circle",
        "html_title": "Compliant referral circle",
        "html_kicker": "Church · Partners",
        "html_body": "<p>Finely restore documentation first. Funding partners second — text handoff only.</p>",
        "html_cta": "CIRCLE-START",
        "html_cta_href": "https://finelycred.com/consultation?interest=church",
    },
    {
        "n": 15,
        "vertical": "general",
        "subject": "Funding-readiness — when to soft-hand (SOP-15)",
        "email": """Hi {{first_name}},

**Day 15 — funding-readiness:** Finely completes **SOP-15 gates** (documentation, debt triage, restore rounds where appropriate). Then a **text-only** handoff to Nora or the lender — no Nora logo on Finely emails.

We do not approve loans. We do not promise funding at a score.

**CTA:** Reply **READY-15** for checklist PDF path — https://finelycred.com/consultation?interest=funding_readiness""",
        "sms": "Finely Day 15: SOP-15 gates before funding talk. Reply READY-15. No loan promises.",
        "caption": "Restore → readiness → lender decides. Finely SOP-15 discipline.",
        "html": "day-15-funding-readiness",
        "html_title": "Funding-readiness handoff",
        "html_kicker": "Day 15 · SOP-15",
        "html_body": "<p>Checklist complete → soft handoff. <strong>Nora logo not on Finely cold creatives.</strong></p><p>Score literacy footer on every touch.</p>",
        "html_cta": "READY-15",
        "html_cta_href": "https://finelycred.com/consultation?interest=funding_readiness",
    },
    {
        "n": 16,
        "vertical": "general",
        "subject": "Evidence vault — one screenshot is not a case",
        "email": """Hi {{first_name}},

**Day 16:** every dispute needs **tradeline-specific** evidence in the vault — not one blurry screenshot for seven accounts. Finely specialists vary Round 2 openings (SOP-13).

Consumers: debt may remain even when reporting is corrected.

**CTA:** **VAULT-START** — https://finelycred.com/consultation""",
        "sms": "Finely Day 16: One evidence set per tradeline. Reply VAULT-START.",
        "caption": "Vault discipline wins disputes. Finely restore methodology.",
        "html": "file-accuracy-evidence-vault",
        "html_title": "Evidence vault discipline",
        "html_kicker": "Restore · Vault",
        "html_body": "<p>Per-tradeline proofs. Round 2 variation. No cookie-cutter spam.</p>",
        "html_cta": "VAULT-START",
        "html_cta_href": "https://finelycred.com/consultation",
    },
    {
        "n": 17,
        "vertical": "tax",
        "subject": "Self-employed borrowers — separate business & personal reporting",
        "email": """Hi {{first_name}},

**Tax day 17:** self-employed partners need clean **personal** files even when business credit is a separate lane. Finely doesn't build your LLC credit here — we restore personal report accuracy for mortgage readiness.

**CTA:** **SEMPRENEUR** — https://finelycred.com/consultation?interest=tax_partner""",
        "sms": "Finely Day 17/Tax: Personal file accuracy for SE borrowers. Reply SEMPRENEUR.",
        "caption": "Self-employed: personal tri-merge still matters. Finely restore.",
        "html": None,
    },
    {
        "n": 18,
        "vertical": "bhph",
        "subject": "Second-chance buyers — utilization coaching without hype",
        "email": """Hi {{first_name}},

**BHPH day 18:** teach utilization on **revolving** tradelines (~30% bucket in classic education) without promising FICO 8 points in 7 days. Pair with on-time payment history (~35% educational weight).

Finely = wealth tool literacy, not "repair."

**CTA:** **SECOND-CHANCE** — https://finelycred.com/consultation?interest=bhph""",
        "sms": "Finely Day 18/BHPH: Utilization education — no 7-day score hype. Reply SECOND-CHANCE.",
        "caption": "Second-chance buyers deserve honesty. Finely BHPH partner lane.",
        "html": "bhph-second-chance-utilization",
        "html_title": "Second-chance buyer literacy",
        "html_kicker": "BHPH · BUILD",
        "html_body": "<p>On-time payments + utilization awareness — model-dependent.</p><p>No guaranteed score targets.</p>",
        "html_cta": "SECOND-CHANCE",
        "html_cta_href": "https://finelycred.com/consultation?interest=bhph",
    },
    {
        "n": 19,
        "vertical": "realtor",
        "subject": "Partner co-marketing — brand-locked Finely flyers only",
        "email": """Hi {{first_name}},

**Realtor day 19:** download HTML one-sheets with **official medallion logo** (`finely-brand.css`). Primary `#fbbf24`, shell `#0b1110` — never neon green marketing primary.

Co-market restore; hand off funding separately.

**CTA:** **BRAND-PACK** — https://finelycred.com/consultation?interest=realtor""",
        "sms": "Finely Day 19: Brand-locked co-marketing pack. Reply BRAND-PACK.",
        "caption": "Realtors: gold-brand Finely flyers only. Partner pack ready.",
        "html": "partner-brand-co-marketing",
        "html_title": "Brand-locked co-marketing",
        "html_kicker": "Realtor · Brand kit",
        "html_body": "<p>Official logo + <code>finely-brand.css</code>. No shield-F. No #39ff14 primary.</p>",
        "html_cta": "BRAND-PACK",
        "html_cta_href": "https://finelycred.com/consultation?interest=realtor",
    },
    {
        "n": 20,
        "vertical": "mortgage",
        "subject": "UltraFICO opt-in — optional, not a Finely promise",
        "email": """Hi {{first_name}},

**Mortgage day 20:** **UltraFICO** is opt-in deposit behavior — not default, not a Finely upsell guarantee. Teach alongside classic FICO generations.

Middle score shorthand again: educational only.

**CTA:** **ULTRA-EDU** — https://finelycred.com/consultation?interest=mortgage""",
        "sms": "Finely Day 20: UltraFICO = opt-in only. Reply ULTRA-EDU. No magic funding.",
        "caption": "UltraFICO literacy for LO partners. Finely educational lane.",
        "html": "ultrafico-opt-in-honesty",
        "html_title": "UltraFICO — opt-in honesty",
        "html_kicker": "Mortgage · UltraFICO",
        "html_body": "<p>Optional program — not universal. Finely doesn't promise UltraFICO outcomes.</p>",
        "html_cta": "ULTRA-EDU",
        "html_cta_href": "https://finelycred.com/consultation?interest=mortgage",
    },
    {
        "n": 21,
        "vertical": "church",
        "subject": "Day 21 — close the loop: inquiry + community CTA",
        "email": """Hi {{first_name}},

**Day 21 — finale:** you now have 3 weeks of **restore, literacy, and debt honesty** — not repair circus. Pick your next move:

1. **Partner inquiry** — reply **FINELY-21** with your vertical (tax, BHPH, realtor, mortgage, Haitian desk, church).
2. **Community session** — book educational workshop.
3. **Consumer path** — /free-kreyol-guide or consultation.

Thank you for leading with accuracy. Lenders decide funding; we document the file.

**CTA:** https://finelycred.com/consultation — subject line **FINELY-21**""",
        "sms": "Finely Day 21: Reply FINELY-21 + your vertical. 21 days of restore literacy — no guarantees. Book now.",
        "caption": "21 days done: file accuracy wins. Partner with Finely Cred — inquiry FINELY-21.",
        "html": "day-21-partner-finale",
        "html_title": "21-day partner finale",
        "html_kicker": "Day 21 · Inquiry",
        "html_body": "<p><strong>Reply FINELY-21</strong> with your vertical. Tax · BHPH · Realtor · Mortgage · Haitian · Church · General.</p><p>Restore wealth tool — not credit repair hype.</p>",
        "html_cta": "FINELY-21 inquiry",
        "html_cta_href": "https://finelycred.com/consultation",
    },
]


def write_email(day):
    n = day["n"]
    path = EMAIL_DIR / f"day-{n:02d}.md"
    body = f"# Day {n} — {day['vertical'].title()} partner email\n\n"
    body += f"**Subject:** {day['subject']}\n\n"
    body += day["email"].strip() + "\n"
    body += FOOTER
    path.write_text(body, encoding="utf-8")


def write_sms(day):
    n = day["n"]
    path = SMS_DIR / f"day-{n:02d}.txt"
    text = f"SMS ({len(day['sms'])} chars):\n{day['sms']}\n\n"
    text += f"Social caption:\n{day['caption']}\n"
    path.write_text(text, encoding="utf-8")


def html_shell(slug, title, kicker, body_html, cta, cta_href):
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Finely Cred — {title}</title>
  <link rel="stylesheet" href="../_brand/finely-brand.css" />
</head>
<body class="fc-brand">
  <article class="fc-sheet">
    <header class="fc-logo">
      <img src="{LOGO_IMG}" alt="Finely Cred" height="48" />
    </header>
    <p class="fc-kicker">{kicker}</p>
    <h1 class="fc-h1">{title}</h1>
    <div class="fc-card">{body_html}</div>
    <a class="fc-cta" href="{cta_href}">{cta}</a>
    <footer class="fc-footer">
      Score literacy: model + bureau + purpose + soft/hard. Never FICO 5.8. Beacon 5.0 on Equifax — not unverified 5.4 jargon.
      Educational restore only — no guaranteed scores, deletions, or approvals. Debt may remain.
    </footer>
  </article>
</body>
</html>
"""


def write_html_for_day(day):
    if not day.get("html"):
        return None
    slug = day["html"]
    path = HTML_DIR / f"{slug}.html"
    path.write_text(
        html_shell(
            slug,
            day["html_title"],
            day["html_kicker"],
            day["html_body"],
            day["html_cta"],
            day["html_cta_href"],
        ),
        encoding="utf-8",
    )
    return path.relative_to(ROOT).as_posix()


def main():
    EMAIL_DIR.mkdir(parents=True, exist_ok=True)
    SMS_DIR.mkdir(parents=True, exist_ok=True)
    HTML_DIR.mkdir(parents=True, exist_ok=True)

    manifest_rows = []
    html_paths = set()

    for day in DAYS:
        write_email(day)
        write_sms(day)
        em = f"21-day/emails/day-{day['n']:02d}.md"
        sm = f"21-day/sms/day-{day['n']:02d}.txt"
        hp = write_html_for_day(day)
        if hp:
            html_paths.add(hp)
        manifest_rows.append((day["n"], day["vertical"], em, sm, hp or "—"))

    # Ensure day-01 html linked
    html_paths.add("html-one-sheets/day-01-welcome.html")
    html_paths.add("html-one-sheets/restore-to-funding-readiness.html")
    html_paths.add("html-one-sheets/score-literacy-partner.html")

    manifest = ["# Finely 21-day nurture — SHIPPED\n", "All days **SHIPPED** on PR #28. Brand: [BRAND-KIT-LOCK.md](../BRAND-KIT-LOCK.md).\n", "| Day | Vertical | Email | SMS + caption | HTML one-sheet |", "| --- | --- | --- | --- | --- |"]
    for n, vert, em, sm, hp in manifest_rows:
        manifest.append(f"| {n} | {vert} | [{em}]({em}) | [{sm}]({sm}) | {hp} |")

    manifest.append(f"\n**HTML one-sheets count:** {len(html_paths)} (minimum 14 required).\n")
    for p in sorted(html_paths):
        manifest.append(f"- [{p}](../{p})")

    (ROOT / "21-day" / "MANIFEST.md").write_text("\n".join(manifest) + "\n", encoding="utf-8")
    print(f"Wrote {len(DAYS)} emails, {len(DAYS)} SMS files, {len(html_paths)} HTML one-sheets")


if __name__ == "__main__":
    main()
