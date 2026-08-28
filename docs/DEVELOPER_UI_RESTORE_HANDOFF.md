# Developer handoff — UI restore + chat (since `0a5bc16`)

This is everything that changed **after** the last GitHub push:

`0a5bc16` — *Ship the sell-ready sweep: public guide routing, partner invite and grant, and role dashboards.*

That sell-ready work is already on origin. **This commit is the visual + chat layer on top of it.** Do not undo invite/grant, `/free-guide` CTAs, or letters nav.

---

## 1. Pull this branch (same branch — no new ones)

```powershell
cd E:\Finely-Cred\Tishobe\finely-cred-main
git fetch origin
git checkout launch/ready-sovereign-supreme
git pull origin launch/ready-sovereign-supreme
git log -1 --oneline
```

Confirm the hash matches what the owner was given. **`main` is not the live working branch.**

---

## 2. Run locally

```powershell
npm ci
npm run dev
```

Open **http://127.0.0.1:5173/**  
Vite must stay running in that terminal. Do not open the GitHub folder URL.

| Mode | Needs | Works |
|------|--------|--------|
| Marketing | nothing extra | Homepage, pricing, restore preview, resources, chat widget |
| Full app | `.env.local` with `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` | Login, portal, admin, dashboard chat |

Copy `.env.example` → `.env.local` if you do not have keys. Never commit `.env` / `.env.local`.

```powershell
npm run typecheck
```

---

## 3. What visitors should see (homepage)

Live reference: **https://finelycred.com/** — restore the *feel*, not a pixel clone.

| # | Section | Look | Do not change |
|---|---------|------|----------------|
| 1 | Hero | Same Unsplash skyline (`photo-1486406146926-c627a92ad1ab`). Image is **visible** again (dark overlays were crushing it). | Do not swap the photo. |
| 2 | Law ticker | `ViolationLiveFeed` under the hero. Gold-edge bar. Scrolls **back and forth**. | Keep it moving. |
| 3 | Proof strip | Condensed trust strip under the ticker. | |
| 4 | Path chooser + video | Unchanged product stage. | |
| 5 | DIY / Done-For-You | **Gray/silver plate + champagne (goldish) boxes.** Navy ink titles so text does not vanish. | Do not put colored catalog cards here. |
| 6 | Debt & summons | **Navy / blue — leave it.** | Do not platinum this band. |
| 7 | Authorized user | Unchanged. | |
| 8 | Payment plans | Same family as DIY: **platinum gray + champagne boxes** (was navy). | Colored boxes belong elsewhere. |
| 9 | Mastery OS + free guide | Free guide CTA still goes to **`/free-guide`**. | |
| 10 | Materials | Three previews: Dispute Letter Guide · Business Credit Fundability Roadmap · **Personal Credit Build 2-Sheet** (`/resources/personal-credit-build-sheet`). | Not two business one-sheets. |
| 11 | Partner success | Luxury **dossiers** (gold / **silver in the middle** / bronze). Numbers and “5-month turnaround” must stay unclipped. | No dark jewelry tray behind the cards. |
| 12 | Proven results | **Colored** catalog cards (emerald → violet → sky → rose) with big result pills. | Do not clone champagne boxes here. |
| 13 | Final CTA | Dark close. | |

**Removed from the homepage:** Finely Cred Edge / wow strip and the public command-strip “Edge” block. Do not put it back under the hero.

---

## 4. Theme (public vs dashboard)

Public marketing pages force **`data-fc-theme="dark"`** so visitors always get the luxury dark site.

- Logic: `shouldForcePublicDarkTheme()` in `src/lib/finelySiteTheme.ts`
- Paths: `src/lib/publicSitePaths.ts` (includes `/personal-credit`)
- Provider: `src/features/os/FinelySiteThemeProvider.tsx` — does **not** overwrite the stored workspace Light/Dark preference
- FOUC guard: `index.html`

Dashboard / portal / admin still honor the user’s saved theme.

---

## 5. Other pages in this batch

| Route | What changed |
|-------|----------------|
| `/pricing/personal-credit-restore` | Dark shell, nav isolation so ivory ink does not paint the public nav. |
| `/pricing` | Platinum compare band uses `fc-sell` + navy titles so white type does not wash out on silver. |
| `/personal-credit` | Treated as a public marketing path (dark theme). |

---

## 6. Chat — messages must stay visible

The owner could not see what they typed or the replies because **options sat on top of the thread**.

### Public widget (`PublicChatWidget.tsx`)

- Taller panel (`~760px` / viewport).
- Slim composer: 2-row textarea + **More / attach / emoji / Send**.
- Lanes = one horizontal pill row until a goal is picked.
- Language, suggested replies, and extra lanes live in **More** (sheet capped ~280px).
- Overlay is transparent so the thread stays readable.
- Message pane uses `flex-1 min-h-0` so it actually scrolls.

### Dashboard Communication Hub

- Compact floating hub now has a **real height** (`lg:h-[min(640px,calc(100vh-80px))]`).
- Composer no longer uses the 7rem “luxury” textarea — that was eating the thread.
- Language, topics, and extras live under **More**. Specialist roster / tool chips stay hidden in compact mode.
- Follow-ups / routing chips are a **single scroll row**.
- Team “past conversations” is behind **Show conversations** (not always open).
- Compose box is 2 rows, not a tall editor.
- Nudges collapse to one line.
- Partner messages page hides the hub’s inner tab strip so tabs are not duplicated.
- Theme listener no longer re-persists on every `finely:store` event (that could loop the dashboard).

---

## 7. Files in this push

```
index.html
src/App.tsx
src/index.css
src/lib/finelySiteTheme.ts
src/lib/publicSitePaths.ts
src/components/landing/index.tsx
src/components/landing/landingSellBands.css
src/components/landing/LandingSolutionsSnapshotSection.tsx
src/components/landing/LandingFinancingPreapprovalSection.tsx
src/components/landing/LandingMaterialsPreviewBand.tsx
src/features/os/FinelyOsPublicCommandStrip.tsx
src/features/os/FinelySiteThemeProvider.tsx
src/data/staffRoster.ts
src/features/os/FinelyOsAIChatPanel.tsx
src/features/os/FinelyOsCatalogBrowser.tsx
src/features/personalCredit/preview/personalCreditRestorePreview.css
src/pages/preview/PersonalCreditRestorePreviewPage.tsx
src/pages/PricingPage.tsx
src/components/chat/PublicChatWidget.tsx
src/components/chat/HubAiCoachPanel.tsx
src/components/chat/FinelyCommunicationHub.tsx
src/components/chat/HubTeamChatPanel.tsx
src/components/chat/FinelyChatComposeBox.tsx
src/components/comms/CommsProactiveNudges.tsx
src/pages/portal/PartnerMessagesPage.tsx
docs/DEVELOPER_UI_RESTORE_HANDOFF.md
docs/DEVELOPER_GITHUB_SYNC.md
```

Do **not** expect `.env`, `qa-shots/`, or local typecheck dump files on GitHub.

---

## 8. Smoke after pull

| URL | Check |
|-----|--------|
| `/` | Skyline visible. Ticker moves. No Finely Edge under hero. DIY + payment = silver/champagne. Debt stays navy. Silver dossier in the **middle**. Colored proven-results cards. |
| `/` chat | Open “Chat with …”. Type a line. **You can still see the thread.** More sheet does not eat the conversation. |
| `/pricing/personal-credit-restore` | Readable title, public nav not painted ivory. |
| `/pricing` | Package titles readable on platinum. |
| `/preview/workspace-light/portal/dashboard` | Open Chat / Ask Finely. Thread is the majority of the panel. Topics are a Show/Hide, not a permanent wall. |
| `/portal/messages` | One tab row (outer layout), not two stacked strips. |

---

## 9. Hard constraints (do not regress)

- Same git branch: **`launch/ready-sovereign-supreme`**
- Same hero image URL
- Debt band stays navy
- Public copy says **partner**, not client/customer
- Do not re-embed `PartnerDetailPage` as a product surface
- Luxury accents only: emerald, violet, sky, rose (champagne is for sell plates / dossiers only)
- One gold funnel CTA is allowed (`fc-sell-cta-gold`) — not card fills
- Sell-ready functions stay: invite/grant, `/free-guide`, letters nav

---

## 10. Already on origin (do not redo)

From `0a5bc16` (previous push):

- Public guide routing
- Partner invite and grant
- Role dashboards

This UI commit sits on top of that. Pull the new hash, then those plus this visual work are both present.
