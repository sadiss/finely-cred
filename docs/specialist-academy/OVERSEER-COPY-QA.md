# Overseer copy QA — prompt-speak sweep (PR #28)

User-facing strings only. **Before → After.**

| Location | Before | After |
| --- | --- | --- |
| `AcademyHub.tsx` (EN subtitle) | Full prose, annotated product walkthroughs (demo data only)… so Sanz answers only advanced questions. | Full lessons, product walkthroughs, examples, and quizzes — build restore and consumer-law literacy before you own live files. |
| `AcademyHub.tsx` (HT subtitle) | …Sanz pa bezwen repete debaz yo. | Leson konplè… pou w konprann restore ak dwa konsomatè anvan w pale ak kliyan. |
| `AdminSpecialistLoungePage.tsx` subtitle | Discord-energy, Finely brand — announce… Not partner prospecting. | Announcements, huddles, wins, and meeting lobby for Finely specialists — internal team space. |
| `AcademyCoachChat.tsx` opener (EN) | …product clicks. Educational only. | …where to click in the portal. Educational only — not legal advice. |
| `AcademyCoachChat.tsx` opener (HT) | …klik pwodwi… | …etap pwodwi… pa konsèy legal. |
| `AcademyCoachChat.tsx` header | Academy Coach (KB-grounded) / Academy Coach (KB) | Academy Coach / Coach Akademi |
| `PublicChatWidget.tsx` launcher title | Chat with Finely AI | Chat with Finely Cred |
| `PublicChatWidget.tsx` launcher label | FINELY AI / Get routed fast | FINELY / Questions? Start here |
| `PublicChatWidget.tsx` panel header | Finely AI / Guided routing • Session capture • Workflow suggestions | Finely Cred / We'll point you to the right lane and help you book a session |
| `PublicChatWidget.tsx` bot copy | …confirmation reference.) / Supabase not connected… | …confirmation reference. / Request received. We'll follow up… |
| `PublicChatWidget.tsx` submitted UI | (remote: not_configured) | Removed — reference only |
| `PortalChatWidget.tsx` header | Finely Chat / Ask for next actions… | Portal assistant / Uploads, evidence, letters, and timelines |
| `PortalChatWidget.tsx` launcher title | Open portal assistant | Open Finely portal assistant |
| `HaitianCompanionPublicPage.tsx` | chat widget / Capture inquiry (chat / form) | site chat / Contact us (form) |
| `HaitianCompanionPublicPage.tsx` (HT) | chat anba a | chat la |
| `AdminLeadIntelPage.tsx` | Sanz ICP / deferred per Sanz | qualified contact filter / when no search API key is configured |
| `AdminLeadIntelPage.tsx` templates | Credit repair… queries | Credit restore… queries (search templates) |
| `AdminLeadIntelPage.tsx` title / CTA | Lead Intelligence Agent / Run lead agent | Lead intelligence / Run search |
| `AdminCrmPage.tsx` leads footer | remote: {status} | Showing X of Y leads · sync issue / local cache |
| `PartnerCommunityWaitlistPage.tsx` | not built in this release / blueprint… | opening soon / Join the waitlist… |
| `AcademyMaterialPackSender.tsx` | not partner prospecting / pa outreach patnè | trainee-focused copy (EN+HT) |
| `AdminSettingsPage.tsx` | Public Chat Widget / AI concierge… | Public site chat / Finely Cred chat launcher… |
| `AdminSettingsPage.tsx` | Portal Chat / AI chat widget… | Portal assistant / in-portal assistant… |
| `AdminSettingsPage.tsx` trainee emails | Not partner prospecting. Requires commsDelivery… | Requires outbound email… queue in academy outbox |
| `AdminSettingsPage.tsx` Lead Intel toggle | qualified prospecting | lead discovery and public-page contact enrichment |
| `PersonalCreditPage.tsx` subtitle | Professional credit restoration… | Educational credit restore with evidence-backed disputes… |
| `academyCatalog.ts` | Overseer QA | Launch QA checklist (+ HT title) |
| `academyWalkthroughs.ts` blurbEn | demo data only | Step-by-step portal walkthrough… |
| `AcademyQuizPanel.tsx` | Shows `(HT)` stub prompts | Falls back to EN when HT is placeholder |

## Not changed (intentional)

- Academy quizzes referencing **Sanz doctrine** (internal training curriculum term).
- FAQ educational definition of “credit repair” (`FaqPage.tsx`).
- Code comments (e.g. `{/* Composer */}`) — not user-visible.

*Educational only. Not legal advice.*
