# Developer merge handoff — lean warm-partner pilot

**Audience:** Sanz’s human developer (manual merge + Bluehost deploy).  
**Policy:** Partner outbound stays **HOLD** until warm capture pages are live. Do not bulk-email partner CSVs from this doc.

**Verified:** 2026-09-20 (open PRs on `sadiss/finely-cred` via `gh`).

---

## Where production code lives

| Branch | Role |
|--------|------|
| `launch/ready-sovereign-supreme` | **Deploy this** for the live marketing site (lead magnets, `/haitian`, admin). ~193 commits ahead of `main`. |
| `main` | Stabilization spine; **not** what Bluehost is running today for full magnet UX. |

Pilot PRs **#21–#26** all target **`launch/ready-sovereign-supreme`**, not `main`.

---

## Open PR inventory (mergeability)

| PR | Title | Base | Mergeable | CI | Pilot |
|----|-------|------|-----------|-----|-------|
| [#26](https://github.com/sadiss/finely-cred/pull/26) | Enterprise SEO: prerender + unique head + JSON-LD | launch | Yes | `ci-check` fail (pre-existing e2e/smoke on branch) | **Merge 1st** |
| [#25](https://github.com/sadiss/finely-cred/pull/25) | Design-convert guide funnels (wealth lane + keep DIY `/free-guide`) | launch | Yes | Same CI pattern | **Merge 2nd** |
| [#23](https://github.com/sadiss/finely-cred/pull/23) | `/partners/refer` warm capture + call SLA | launch | Yes | Same CI pattern | **Merge 3rd** (unblocks outreach) |
| [#24](https://github.com/sadiss/finely-cred/pull/24) | Admin ebook conversion + partner library | launch | Yes | Same CI pattern | **Merge 4th** (nice-to-have) |
| [#21](https://github.com/sadiss/finely-cred/pull/21) | Restore Kreyòl `/free-kreyol-guide` funnel | launch | Yes | Same CI pattern | **Skip if #26 merges** (same fix, folded into #26) |
| [#22](https://github.com/sadiss/finely-cred/pull/22) | Partner Prospector (admin agents) | **main** | Yes | No checks | **Do not merge for pilot** (wrong base; author marked hold) |
| [#4](https://github.com/sadiss/finely-cred/pull/4) | [WIP] Fix GitHub Actions `copilot` job | main | Yes | N/A | **Ignore** until WIP cleared |

GitHub shows `mergeStateStatus: UNSTABLE` on #21–#26 because CI is red; merges are still **allowed** if you accept manual QA.

---

## Recommended merge order (checklist)

Work on **`launch/ready-sovereign-supreme`**. After each merge, rebase or update downstream PR branches if GitHub reports conflicts (expect touch points in `src/App.tsx`, `publicSeoCatalog.ts`, lead-magnet shell files).

### 1. PR #26 — SEO crawlability (merge first)

- [ ] Merge [#26](https://github.com/sadiss/finely-cred/pull/26).
- [ ] Close or skip [#21](https://github.com/sadiss/finely-cred/pull/21) (redundant Kreyòl routing).
- [ ] Local: `npm run seo:check` then `npm run launch:bundle` (or `npm run build` + prerender steps from that branch).
- [ ] Deploy **entire** `dist/` to Bluehost: prerendered folders, `.htaccess`, `404.html`, `spa-fallback.html`, `sitemap.xml`, `_redirects`.
- [ ] Smoke: `curl -sI https://finelycred.com/learn` → **404**; `curl -sI https://www.finelycred.com/` → **301** apex; `/free-kreyol-guide` → **200** (not redirect to `/haitian`).

### 2. PR #25 — Funnel clarity by mindset lane

- [ ] Merge [#25](https://github.com/sadiss/finely-cred/pull/25) on top of #26.
- [ ] Confirm `/free-guide` still = DIY dispute lane (not overwritten by wealth creative).
- [ ] New public URL: **`/free-restore-wealth`** (wealth/funding lane only).
- [ ] Redeploy `dist/`.

### 3. PR #23 — Warm partner referral capture (gate for outreach)

- [ ] Merge [#23](https://github.com/sadiss/finely-cred/pull/23).
- [ ] Verify **`/partners/refer`** (alias `/partner-refer`): phone required, `partner_id` / `ref` query preserved, **no auto-email to partner**.
- [ ] Thank-you copy: “call within 1 business day” (+ optional hours in Admin → Settings).
- [ ] **Only after this ships:** resume warm partner links with `?partner_id=` / UTM (still no CSV blast).

### 4. PR #24 — Admin visibility (optional for pilot)

- [ ] Merge [#24](https://github.com/sadiss/finely-cred/pull/24) when #23 is in (shared SLA / funnel surfaces).
- [ ] `/admin/ebook-conversions` and `/admin/partner-library` — read-only ops; no CSV download required for day-one pilot.

---

## Unsafe / defer

- **#22** — Built against `main`; duplicates prospector work not needed for “pages live + capture.” PR body: “Do not merge from this agent.”
- **#4** — WIP CI fix; unrelated to pilot pages.
- **Do not** merge pilot PRs into `main` alone expecting Bluehost to match production UX.

---

## Outbound URLs (what is safe to share)

Use **https://finelycred.com** (apex). Until each PR deploys, stay on the **Today** column.

| Audience / use | Today (live now) | After deploy |
|----------------|------------------|--------------|
| Haitian desk / corridor warm intro | `/haitian` | Same; add soft CTA to `/free-kreyol-guide` after **#26** |
| Kreyòl kit unlock (SEO deep links) | Prefer `/haitian` only (funnel may bounce today) | **`/free-kreyol-guide`** (+ kit slugs) after **#26** |
| English DIY dispute guide | **`/free-guide`** | Same; conversion polish after **#25** |
| Wealth / funding mindset | Do **not** promote a dedicated wealth LP yet | **`/free-restore-wealth`** after **#25** |
| Partner warm referral (`ref`, `partner_id`) | **HOLD** — no `/partners/refer` | **`/partners/refer?...`** after **#23** |
| Homepage / general | **`/`** | Same |
| Generic lead magnet | **`/free-guide`** | Same |

**Never** use for pilot outbound until live: `/partners/refer`, `/free-restore-wealth`, `/free-kreyol-guide` (until #26/#25/#23 respectively).

---

## Deploy commands (launch branch)

```bash
git checkout launch/ready-sovereign-supreme
git pull origin launch/ready-sovereign-supreme
# merge PRs in order 26 → 25 → 23 → (24)
npm run deploy:host-guide -- any   # env + host notes
npm run launch:bundle               # preferred full artifact on launch branch
npm run post-deploy:verify -- https://finelycred.com
```

Supabase: public lead capture still uses existing `submitLeadCapture` / `lead_captures`; no new edge deploy required for #23–#24 unless you enable optional prospector tables (#22 — not in pilot).

---

## Pilot “done” definition

1. Crawlers see real titles/H1s on key public URLs (#26).  
2. Three magnet lanes are distinct: DIY `/free-guide`, wealth `/free-restore-wealth`, Kreyòl `/free-kreyol-guide` (#25 + #26).  
3. **`/partners/refer`** captures phone + attribution (#23).  
4. Ops can see conversions in admin without CSV (#24 optional).  
5. Partner outreach **un-HOLD** only after step 3 is verified in production.

Questions / PR links: see table above or `gh pr list --repo sadiss/finely-cred --state open`.
