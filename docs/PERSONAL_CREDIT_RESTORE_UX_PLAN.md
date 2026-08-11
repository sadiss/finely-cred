# Personal credit restoration — UX & visual plan (planning only)

**Status:** Planning · **No implementation until approved**  
**Primary URL:** `/personal-credit` (`PersonalCreditPage.tsx`)  
**Related:** Portal restore HUD, `/resources/*restore*` sheets, pricing catalog  

---

## 1. What feels “cheap / dull / lame” today (diagnosis)

| Issue | What we see in code |
|--------|---------------------|
| **Two visual languages on one page** | Full-bleed **ivory** `PageShell` + **dark navy hero** (`finelyOsRestoreLaneHeroShell`) + **dark-glass hub** (`FinelyUnifiedHubLayout` / `finelyOsCatalogCard`) → banding and “ pasted together ” feel. |
| **CSS fighting itself** | `[data-fc-personal-credit-lane="1"]` strips gradients/shadows to flat white → **luxury depth removed**, page reads flat and generic. |
| **Triple headline stack** | PageShell title + dark hero H1 + hub “Packages, process, and platform tools” → same promise repeated; no clear “one story.” |
| **Accent rainbow** | Amber / emerald / sky / violet tiles in one scroll (`finelyOsIvorySolidTile` per card) → busy, not premium. |
| **Wrong tokens on light** | Dark-theme text classes (`FINELY_OS_ENTITY_VALUE`, `text-sky-200`, emerald-300 chips) on **white tiles** → low contrast or accidental “portal dark” on marketing ivory. |
| **Structure overload** | Noticed strip + Now do this + hub KPIs + tabs + long footer CTAs + staff chat + sheets strip → many competing “start here” signals. |
| **No rhythm** | Docs say alternate **dark hero → ivory wealth → glass**; this page stacks ivory + flat white + dark hero without intentional alternation. |

**Scope question for you:** Is “credit restoration page” **only** `/personal-credit`, or also **portal restore** (dashboard, disputes, letters, reports dock)? This plan covers **public lane first**; portal is Phase 4.

---

## 2. North star (what “good” looks like)

1. **One obvious journey:** *Where am I?* Personal credit restore · *What matters now?* One primary CTA · *Next?* Packages OR intake OR portal — not all at once.  
2. **Wealthy ivory, not office white:** Champagne / warm ivory page ground; **navy ink** for type; **gold/amber** for primary actions; **one** secondary accent (emerald) for “restore progress / trust.”  
3. **Depth without noise:** Soft mesh or subtle gradient on page shell; cards use **champagne nested surfaces** (`fc-landing-ivory-card`), not pure `#fff` slabs with colored left bars everywhere.  
4. **Senior-simple tabs:** Five tabs stay, but each tab opens with **one hero block + one CTA**, not duplicate KPIs and CTAs on every tab.  
5. **Compliance visible once:** Footnote near stats/CTA, not repeated 4×.  

Partner terminology on public copy: **partner** where referring to product users; this page is mostly guest marketing — **you / your** is fine.

---

## 3. Information architecture (proposed)

### Page spine (top → bottom)

| Block | Purpose |
|--------|---------|
| **A. Restore command strip** (new, light) | Single line: lane badge · primary CTA · “Watch how” · compliance chip. Replaces redundant heroes. |
| **B. One hero** | Either ivory `finelyOsLightHeroPanel` **or** dark restore hero — **not both** + PageShell hero. Recommendation: **ivory hero** on ivory shell for cohesion; move dark drama to optional full-width **video/image band** below. |
| **C. Hub (tabs)** | Tabs only; **remove duplicate title** inside hub or demote to `eyebrow` only. |
| **D. Tab bodies** | See §4. |
| **E. Trust + sheets + footer** | One trust row, one final CTA, staff chat optional collapsed. |

### Tab content (simplify)

| Tab | Keep | Cut / merge |
|-----|------|-------------|
| **Overview** | One flagship package story + 2 CTAs | Remove second “browse packages” tile if tab exists; merge stats into hero strip only. |
| **Packages** | 3-up cards + catalog | Drop duplicate platinum block from overview when on packages. |
| **Process** | 4 steps | Use single accent; same typography as homepage process bands. |
| **The OS** | 6 capability tiles | Link each tile to `/resources/videos` or portal preview — interactive, not gray boxes. |
| **Funding path** | Nora / Wealth Builder band | Reuse `fc-landing-wealthy-ivory` band pattern from homepage. |

---

## 4. Visual system (restore lane tokens)

**Palette (lock for this lane):**

- Page: existing `fc-landing-wealthy-ivory` / `PageShell surface="ivory"`
- Ink: `#0a1628` + `/70` body
- Primary CTA: amber/gold (`FINELY_OS_PRIMARY_BTN` / platinum secondary)
- Trust: emerald border wash only (not four tile colors)
- Cards: `fc-landing-ivory-card` + **one** accent border per section max

**Engineering approach:**

1. Add **`PersonalCreditRestoreLayout`** (thin wrapper) — owns strip + hero + hub; keeps `PersonalCreditPage` as data only.  
2. Extend **`finelyOsLightUi`**: `FINELY_OS_RESTORE_IVORY_*` tokens (title, body, kpi) — **never** reuse `FINELY_OS_ENTITY_VALUE` on ivory marketing.  
3. **Retire or gate** personal-credit CSS that flattens tiles to plain white (`background-image: none`) — replace with controlled champagne shadow from `--fc-light-pop-shadow-*`.  
4. **`FinelyUnifiedHubLayout`**: prop `variant="ivoryMarketing"` — light shell, light KPIs, light tabs (no `finelyOsCatalogCard` dark glass).  

---

## 5. Phased delivery (after you approve)

| Phase | Work | Exit criteria |
|-------|------|----------------|
| **P0 — Approve** | Confirm scope (public vs portal), pick hero style (ivory vs dark band), approve palette | Written OK |
| **P1 — IA + strip** | One hero, command strip, dedupe headlines, compliance once | 5-second test: guest knows next click |
| **P2 — Visual pass** | Ivory tokens, hub variant, 2-accent cap, fix contrast bugs | Light theme: no white-on-white / dark text on dark |
| **P3 — Tab polish** | Overview/packages/process/OS/funding layouts per §4 | Each tab: one primary CTA |
| **P4 — Portal alignment** | Match ivory/readability on partner dashboard restore entry (optional) | Same lane colors on `PartnerCreditRestoreCommandStrip` |
| **P5 — QA** | `launch:senior:qa` path includes `/personal-credit`; visual snapshot | No regression on billing/portal ivory fixes |

**Out of scope unless you ask:** Pricing math, package copy rewrites, new routes, duplicate restore dashboards.

---

## 6. Decisions needed from you (before code)

1. **Hero style:** A) Full ivory luxury hero · B) Keep dark restore hero but **remove** ivory hub dark card · C) Split: dark top band + ivory content (homepage-like).  
2. **Primary CTA:** “Start free guide” vs “Start intake” vs “Choose package” — **one** wins above the fold.  
3. **Portal in same project:** Redesign logged-in restore hub now, or public page only first?  
4. **Reference:** Any page on the site that already feels “right” (homepage section, pricing, fundability)? Match that.  

---

## 7. Files touched (when we implement)

- `src/pages/PersonalCreditPage.tsx` — structure  
- New: `src/features/personalCredit/PersonalCreditRestoreLayout.tsx` (or similar)  
- `src/features/unified/FinelyUnifiedHubLayout.tsx` — ivory variant  
- `src/features/os/finelyOsLightUi.ts` — restore ivory tokens  
- `src/index.css` — replace flat-white overrides with champagne depth  
- Optional: `PartnerDashboardPage` / `PartnerCreditRestoreCommandStrip` for P4  

---

**Next step:** You answer §6 (four decisions). Then we implement **P1 → P2** in one focused pass — no scatter fixes.
