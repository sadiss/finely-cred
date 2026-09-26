# Zero-dollar organic marketing and SEO

Owner runbook for finding Finely Cred without ads. Ordinary people, especially Haitian Americans looking for credit or debt help, plus business-credit and credit-specialist searches.

Checked against the live site on **26 Sep 2026**. This file is the plan. The small on-page edits in the same pull request are **not live** until the owner asks for a Bluehost deploy.

**Hold.** Do not submit a directory, a Google Business post, or a public community link yet. QA on the dead-link fix has passed. The live site has not.

1. [PR #39](https://github.com/sadiss/finely-cred/pull/39) is the fix (`e37875c`). Grok Bot recorded **PASS** on [PR #35](https://github.com/sadiss/finely-cred/pull/35) for that commit.
2. Jireh still has to **merge #39**.
3. Bluehost still has to **serve that build**. `finelycred.com` still has the old leaks.

Until both 2 and 3 are done, this document is research and a draft placement plan only. Do not place a public link.

When that live build is up, and you have clicked the allowlist URLs on `finelycred.com`, overnight work is still soft placements only: profiles, directories you fill in by hand, and one community board. Every link comes from the reconciled allowlist below. `/haitian` is for organic posts only. `/credit-specialist` is warm only.

The wider placement wave — more boards, more citations, metro URLs, and indexing requests across the full safe set — waits until those URLs are stable after the Bluehost refresh. That wave is still manual and still zero-dollar. It is not a directory blast, a bought-link campaign, or a copy-paste across groups.

Related: [lead-acquisition-enterprise.md](./lead-acquisition-enterprise.md) (consent and cold CSV rules). This plan does **not** use the paid Meta ads step in that runbook.

## Rules

| Do | Do not |
|----|--------|
| Post as yourself, in communities you already belong to | Buy ads, boosts, or “SEO packages” |
| One helpful post, then stop | Copy the same post into ten groups |
| Link to a page that answers the question | Drop a link with no explanation |
| Ask a real client for an honest review after real work | Fake reviews, review swaps, or paid reviews |
| List the business where you will keep the profile updated | Mass directory blasts, citation bots, Fiverr listing packs |
| Email or text someone who opted in on the site | Cold email or SMS to a scraped or imported list |
| Say results vary and this is not legal advice | Promise a score, a deletion, or a court outcome |

Cold Haitian CSV rows stay `consent=false`. Do not send those rows a link. After #39 is live, a person who finds you on their own can opt in at `/free-kreyol-guide`. Do not cite that URL before Bluehost serves the merge. Today's live site still has the old leaks.

Public contact in the product is `partnersupport@finelycred.com`. The phone on the debt summons **sample** (`(305) 555-0148`) is a mock document, not the business number. Do not put it on Google, a flyer, or a directory.

## Promote-safe URLs

Mastermind and this plan agree on one allowlist. Use it only after the gate above opens. Anything not in the table stays off posts, directories, and profile website fields.

| Job | URL | Where it may go |
|-----|-----|-----------------|
| Free debt guide | https://finelycred.com/free-debt-guide | Posts and directories |
| Debt / summons pricing | https://finelycred.com/pricing/debt-legal | Posts and directories |
| Free dispute guide | https://finelycred.com/free-guide | Posts and directories. Default website field on a profile. |
| Free business-credit guide | https://finelycred.com/free-business-guide | Posts and directories |
| Haitian desk | https://finelycred.com/haitian | **Organic posts only.** Not a directory website. |
| Free Kreyòl guide | https://finelycred.com/free-kreyol-guide | **After #39 is live on Bluehost.** QA confirmed this build mounts the Kreyòl funnel. It does not bounce to `/haitian`. Posts and directories. Not before that deploy. |
| Personal restore pricing | https://finelycred.com/pricing/personal-credit-restore | Posts and directories |
| Credit specialist offer | https://finelycred.com/credit-specialist | **Warm only.** Someone already asked about joining. |
| Affiliate toolkit | https://finelycred.com/affiliate-toolkit | People who already want a referral kit. |

`/credit-specialist` stays off church flyers, family WhatsApp, and Haitian community boards.

### Avoid

Do not cite these, including after the gate:

| URL | Why |
|-----|-----|
| `/` | Homepage is not a placement target. Directory and profile website fields use `/free-guide`. |
| `/start-here` | Off the promote list. |
| `/free-kreyol-guide` on today's live site | The old build can still bounce. Do not cite it until Jireh merges #39 and Bluehost serves it. After that deploy it moves onto the allowlist above. Kit subpaths (`/what-is-credit`, `/letter-meaning`, `/helper`, `/community-flyer`) stay off posts until you have opened each one on that live build. |
| `/kreyol` | Not on the reconciled list. Organic Haitian posts use `/haitian`. |
| `/portal` and anything under it | App login. QA still records `/portal` as no route. |
| `/bookstore` | Empty public catalog. |
| `/pricing` (bare index only) | Home bounce on the live base. Lane pages such as `/pricing/debt-legal` stay on the allowlist. |
| `/dispute`, `/funding`, `/partners`, `/restore`, `/letters` | 404 aliases on live `finelycred.com` until #39 is merged and Bluehost serves it. QA passed the fix at `e37875c`; the live site has not. |
| `/solutions`, `/careers`, `/dispute-guide`, `/strategy-call`, `/membership` | 404 on the live site today. #39 aliases them. Cite them only after you have opened each one on the deployed site. |
| `/services` (the index) | Home bounce on the live base. |
| `/resources/funding/tx`, `/resources/funding/ca`, and `/resources/funding` | Broken funding pages. |
| `/haitian/miami` and the other metro desks | Not on the live sitemap yet. Section 2, after the refresh and a QA pass. |
| `/credit/miami-fl` and the other English `/credit/:city` stubs | Wrong page for Haitian posts. |

`https://finelycred.com/sitemap.xml` listed 112 URLs on 26 Sep 2026. A URL in that file is not automatically promote-safe. The exclude table wins.

The reconciled list is closed. One-sheets, metro desks, `/kreyol`, `/enlightenment-session`, other pricing lanes, and `/credit-specialist-guide` are not placement URLs. This pull request still adds `/start-here` to the repo sitemap for a later deploy. `/start-here` stays off the promote list.

### What Google sees before JavaScript

A fetch of the live HTML (no browser) returns the **same** title and description on `/`, `/haitian`, `/pricing/debt-legal`, and the rest:

- Title: `Finely Cred — Credit Restore, Disputes & Partner Portal`
- Description: `Finely Cred — credit restore, dispute letters, business credit, debt OS, and partner portal.`
- No canonical link in the raw HTML

The app does set a unique title after it loads. Google often runs JavaScript, but it is slower and less reliable. Unique titles in the raw file need the prerender work in [PR #26](https://github.com/sadiss/finely-cred/pull/26), after the owner deploys. Search Console and off-site mentions wait on the dead-link QA pass, not only on Bluehost.

## 1. Draft placement plan (do not submit yet)

The steps in this section are the plan for after Jireh merges PR #39 and Bluehost is serving it. QA already passed at `e37875c`. That is not permission to post. Live `finelycred.com` still has the old leaks. No directory form, no Google Business post, no community link, no sitemap ping, until you have opened the allowlist pages on the new live build.

When that build is live, do these in order. One profile, one citation, one community board. Then stop. Save the wider wave for section 2.

Still hold until that refresh, even after the dead-link QA passes:

- `/free-kreyol-guide` until Bluehost is serving merged #39 (then it is allowlisted)
- Metro desks (`/haitian/miami` and the other nine)
- `/`, `/start-here`, `/portal`, `/bookstore`, and bare `/pricing`
- `/resources/funding/tx`, `/resources/funding/ca`
- The 404 aliases in the avoid table
- Requesting indexing on a stack of URLs
- Posting the same note in more than one group

### A. Search Console and Bing (first session, ~25 min)

1. Open [Google Search Console](https://search.google.com/search-console) with the Google account that should own the property long-term.
2. Add the **domain** property `finelycred.com` (DNS verification is the durable one). If DNS is annoying tonight, add the **URL-prefix** property `https://finelycred.com/` and verify by the method you can finish without a redeploy (DNS TXT, or an HTML file upload in Bluehost that does not require an app rebuild).
3. Submit the sitemap that is live now: `https://finelycred.com/sitemap.xml`.
4. Inspect **one** allowlist URL, `/free-guide` or `/free-debt-guide`. Request indexing only if that one URL is missing. Leave `/free-kreyol-guide` until the new build is the one Google fetches.
5. Repeat the sitemap submit in [Bing Webmaster Tools](https://www.bing.com/webmasters). Bing can import a verified Search Console property.

Check back in a week. Indexing is not instant. A “Discovered – currently not indexed” note is normal for a JavaScript site. It is not a reason to buy links.

### B. Google Business Profile — only if you can verify a real business

Create a profile when **all** of these are true:

- You have a business name you will use everywhere: **Finely Cred**
- You have a phone you will answer
- You have an address Google can mail or otherwise verify
- You will hide the address if clients do not visit a storefront (service-area business)

Service areas to enter, in this order: Miami–Fort Lauderdale, Brooklyn / New York, Boston, Houston, Atlanta, Washington DC, Chicago, Philadelphia, Jacksonville, Newark–Elizabeth–Jersey City. That matches the Haitian desks. Do not add 50 cities.

Suggested primary category: **Credit repair service**, if you are comfortable with that public label. Alternate: **Financial consultant**. Do not pick “lawyer” or “law firm”.

Business description (paste, then trim if the form is shorter):

> Finely Cred helps people read credit reports, collection letters, and business credit files. Haitian Americans can start in English with a Kreyòl explanation. We also teach debt-letter workflows and business credit sequencing. Educational services. Results vary. Not legal advice. Not a law firm.

Website: `https://finelycred.com/free-guide`

First Google post (after the profile is verified): link to `https://finelycred.com/free-guide`. Haitian community posts, not this profile, use `https://finelycred.com/haitian`.

Photos: logo and a real photo of you or the team. No stock “happy family with a 850 score” images. No before/after score graphics that name a result you cannot document.

Reviews: after a real session, you may send one personal note: “If the session was useful, a Google review helps other families find us. Please say what we actually did. Please don’t mention a score.” Never write the review for them. Never offer a discount for a review.

If you cannot verify an address this month, skip Google Business. Do Search Console instead. A half-finished profile with the mock summons phone is worse than no profile.

### C. Free citations (one listing tonight)

Use the **same** name, phone, and website on every listing. Website on every listing: `https://finelycred.com/free-guide`. If you do not have the phone and address yet, skip citations. Community posts are separate and may use `/haitian`.

Finish these yourself, in this order, **one per week** until the refresh. Skip any site that wants a fee or a package of “500 directories”.

1. Google Business Profile (section B)
2. Bing Places
3. Apple Business Connect
4. The Facebook Page **About** section (this is not an ad)
5. One association or chamber you **already** belong to

That is the overnight list. Five accurate listings beat fifty abandoned ones. More directories are section 2, and only if you will maintain them.

### D. One partner handoff (optional, still soft)

One person you already know. One live URL from this menu. They do not give you their client list. The wider partner pass is section 2.

| Who | Link |
|-----|------|
| Business owner / tax preparer | https://finelycred.com/resources/business-credit-one-sheets |
| Someone with a bureau file | https://finelycred.com/resources/personal-credit-restore-sheet |
| Someone with a collector letter | https://finelycred.com/free-debt-guide |
| Haitian church or family helper | https://finelycred.com/haitian |

Add this line under your signature when you forward a sheet:

> Results vary. Not legal advice. Funding is subject to underwriting. Families can start here: https://finelycred.com/haitian

QR codes, if you print the flyer kit:  
`https://finelycred.com/haitian?utm_source=church&utm_medium=qr&utm_campaign=kreyol`

UTM values to reuse (so you can see which post worked):

| Piece | Value |
|-------|--------|
| `utm_source` | `facebook`, `whatsapp`, `reddit`, `church`, `partner`, `gbp`, `youtube` |
| `utm_medium` | `organic`, `qr`, `onesheet` |
| `utm_campaign` | `kreyol`, `summons`, `business-credit`, `specialist` |

Example:  
`https://finelycred.com/pricing/debt-legal?utm_source=facebook&utm_medium=organic&utm_campaign=summons`

### E. One Haitian community board (you paste it)

One group you already belong to: a Haitian Facebook group, a church WhatsApp, or a community board. One post. The Haitian link is `/haitian` only.

Disclosure on every post: **“I work with Finely Cred.”**

Compliance line, English: **Results vary. Not legal advice. Not a law firm.**

Compliance line, Kreyòl (already used on the site): **Rezilta yo varye. Sa a pa konsèy legal. Si w bezwen lajen, sa depann si yo apwouve w.**

#### Facebook groups and WhatsApp groups you are already in

Rules:

- Read the group rules. If links are banned, do not post a link. Answer the question and stop.
- Be a member who comments before you post a link. Three helpful comments, then at most **one** link post per group per month.
- Do not join a group only to drop the link.
- Do not message members who did not ask.
- WhatsApp: only groups you are already in. No broadcast to a purchased list.

English:

> A collection letter is not the same thing as a court summons, and paying a collector often does not remove the line from the credit file. If you want the English line explained in Kreyòl, start here: https://finelycred.com/haitian  
> I work with Finely Cred. Results vary. Not legal advice. Not a law firm.

Kreyòl:

> Yon lèt koleksyon pa menm bagay ak yon konvokasyon tribinal. Peye yon kolektè souvan pa efase liy nan dosye kredi a. Si w vle lèt angle a eksplike an Kreyòl: https://finelycred.com/haitian  
> Mwen travay ak Finely Cred. Rezilta yo varye. Sa a pa konsèy legal. Si w bezwen lajen, sa depann si yo apwouve w.

If someone in that same thread already showed a summons or asked about business credit, answer them and use the matching **live** URL from the table above. Do not go looking for those threads tonight. Templates for a later week are in section 2.

#### Reddit (profile only, tonight)

Subreddits that sometimes discuss this topic: `r/CRedit`, `r/personalfinance`, `r/smallbusiness`, `r/haiti`, and a city sub you actually live around. **Their rules win.** Most of them ban promotional links.

- Do not edit the bio yet. After #39 is merged and Bluehost is live, the bio may use `https://finelycred.com/haitian` (organic) or `https://finelycred.com/free-guide`. Do not post a link thread.
- Later, if you answer someone: explain the step in the comment. A link in the comment only when that subreddit’s rules allow it and you disclosed that you work with Finely Cred.
- One account you already have. New accounts and the same paragraph in more than one subreddit stay off the plan.

#### YouTube or TikTok you already run

Tonight, if a video is already published, add one line. A second link waits for section 2.

> Kreyòl credit help: https://finelycred.com/haitian  
> Results vary. Not legal advice.

The weekly video rhythm in `docs/GROWTH_WEEKLY_RHYTHM.md` still applies: you export and post it yourself.

## 2. After the Bluehost refresh — wider placement wave

This is the push that waits. Start it only when the owner has deployed PR #34, this pull request, and the UI fixes they want, and you have opened the new pages on `finelycred.com` yourself. URLs have to be the ones Google will keep.

Still zero-dollar. Still you, posting and listing by hand. Still one board at a time, one listing at a time, and only URLs that are on the sitemap after the refresh. No paid ads, no bought links, no directory-submission software, no copied post across ten groups, no fake reviews.

### A. Confirm the build, then tell Google

1. Open each allowlist URL in a private window, including `/free-kreyol-guide`. On the #39 build QA saw the Kreyòl funnel, not a bounce to `/haitian`. If the deployed page still bounces, leave it off posts and say so.
2. View the page source **or** Search Console’s rendered HTML. Until PR #26 (prerender) is also deployed, the raw source can still show the generic title. The rendered title is the one that matters for that check.
3. In Search Console, resubmit `https://finelycred.com/sitemap.xml`. The new file should include `/start-here`, `/pricing/business-credit`, and `/haitian/miami` (plus the other metro desks).
4. Request indexing only for allowlist URLs, a few per week: `/free-guide`, `/free-debt-guide`, `/free-business-guide`, `/free-kreyol-guide`, `/pricing/debt-legal`, `/pricing/personal-credit-restore`, `/haitian`, `/affiliate-toolkit`. Skip `/`, `/start-here`, `/bookstore`, bare `/pricing`, and metro URLs.
5. Confirm canonicals in the rendered head:
   - `/kreyol` → `https://finelycred.com/haitian` (do not share `/kreyol`; organic posts use `/haitian`)
   - `/services/debt-legal` → `https://finelycred.com/pricing/debt-legal`
   - `/services/business-credit` → `https://finelycred.com/pricing/business-credit`
6. Leave cold imports on `consent=false`. Do not email those rows. After the new build is live, public posts may link `/free-kreyol-guide` for people who choose it.

### B. Wider citations and boards

After step A, add placements you skipped overnight:

- The rest of the five-listing list in section 1.C, if any are still empty, then at most one extra real directory per week (a chamber you belong to, Bing if Google was first). Each listing uses the same name, phone, and `https://finelycred.com/free-guide`.
- One additional community you already belong to per week. The link is one allowlist URL: debt guide, debt pricing, dispute guide, business guide, `/haitian` for an organic Haitian post, restore pricing, or `/affiliate-toolkit` for someone who already wants a referral kit. `/credit-specialist` only if they already asked. Disclose that you work with Finely Cred.
- No metro URLs. They are not on the reconciled list.
- Partner one-sheets from section 1.D, one partner you know per week. Same rule: they share the sheet, they do not hand over a client list.

### C. Templates for the later weeks

Same disclosure and compliance lines as section 1.E.

Summons (when someone shows a court paper, or in one debt-topic group after the refresh):

> If the paper says “summons” or “you are commanded,” the deadline matters more than the phone number on the letter. This page is the map, not a lawyer: https://finelycred.com/pricing/debt-legal  
> I work with Finely Cred. Results vary. Not legal advice. Not a law firm. A licensed attorney files in court.

Business credit:

> Business credit is the company file (EIN, vendors that report, business bureaus), not your personal score with a new name. The free guide is here: https://finelycred.com/free-business-guide  
> I work with Finely Cred. Results vary. Funding is subject to underwriting.

Credit specialist (warm only — someone already asked about joining; not a church or family board):

> If you already sit with people on their credit files, this is the specialist path: you run the files, Finely supplies the method. No score promises in the pitch. https://finelycred.com/credit-specialist  
> I work with Finely Cred.

## 3. On-page checklist

Titles below are the **app** titles (what the browser tab should say after this pull request is deployed). “Live shell” means today’s raw HTML, which is still the generic Finely Cred title on every URL.

| URL | Gap found | What this PR does |
|-----|-----------|-------------------|
| `/haitian` | Tab title did not say Kreyòl. No links to the free kits or the summons desk. | Title `Kreyòl credit help for Haitian Americans`. Links to `/free-kreyol-guide`, `/pricing/debt-legal`, `/start-here`. Canonical path stays `/haitian`. |
| `/kreyol` | Same page as `/haitian`, short URL. Catalog title was 17 characters (“Haitian community”). | Catalog title aligned. Rendered canonical is `/haitian` so the two URLs do not compete. |
| `/free-kreyol-guide` | Older live HTML sent guests to `/haitian`. QA on #39 at `e37875c` says this build mounts the Kreyòl funnel instead. | Promote only after that build is on Bluehost. Title in this SEO branch is `Free Kreyòl credit kits`. |
| `/haitian/:metro` | Titles did not say Kreyòl. No link to the kit or the summons desk. Not on the **live** sitemap yet. | Title pattern `{City} Kreyòl credit help` for Miami, Brooklyn, Boston, Houston, Atlanta, Washington, Chicago, Philadelphia, Jacksonville, New Jersey. Next-step links added. Ships when this branch is deployed. |
| `/start-here` | Title was “Start here”. Missing from `publicSeoCatalog` and from the live sitemap. | Title `Start here: credit, debt, or Kreyòl`. Added to the catalog and `public/sitemap.xml`. |
| `/pricing/debt-legal` | Title did not say summons. No link to the summons article. | Title `Debt summons and collections \| Finely Cred`. Exit link to `/resources/debt-defense-summons-answer`. |
| `/pricing/business-credit` | Page exists and sets a title. It was missing from the catalog and the live sitemap. | Catalog + sitemap entry. Title left as `Business credit \| Finely Cred` (already contains the query). |
| `/resources/debt-defense-summons-answer` | Already in the live sitemap with a specific title. | No copy change. It is the article to link and to request indexing. |
| `/credit-specialist` | Already in the live sitemap. Page title is specific. | No change. Catalog row `Credit specialists` (the plural URL) is 18 characters — trim in a later pass, not required to launch posts. |
| `/pricing/personal-credit-building` | Catalog title “Credit building” is 15 characters. | Document only. The page is already in the live sitemap. |
| Every public URL | Raw HTML has no `<link rel="canonical">`. | `usePublicSeoMeta` now writes a canonical from the page path. It appears after JavaScript (and in prerender, once PR #26 ships). |
| `/credit/:city` English stubs | Easy to promote by mistake. | Do not use them for Haitian posts. |

Internal links that were already in good shape and were left alone: `/start-here` already points at `/haitian` and `/free-kreyol-guide`. The Haitian desk already links the four service offers. The debt page already links `/free-debt-guide` and personal restore.

## 4. Keyword clusters

Write the post for a person, not for a keyword list. After the gate, every link is one row from the allowlist. Haitian organic posts use `/haitian` only.

### Haitian credit help / Kreyòl

People searching: “haitian credit help”, “kreyol credit repair”, “èd kredi kreyòl”, “haitian credit counselor miami” (and the same for Brooklyn, Boston, and the other desks).

| Intent | Now | After metro pages are on the live sitemap |
|--------|-----|--------------------------------------------|
| Explain my letter in Kreyòl | `/haitian` (organic post) | same — no metro URL, no `/kreyol` |
| The Kreyòl guide, after #39 is live | `/free-kreyol-guide` | same |
| Dispute letters, not the Kreyòl kit | `/free-guide` | same |

Say “credit help” and “Kreyòl”. Do not say “guaranteed 100-point increase”.

### Debt summons

People searching: “debt collection summons what to do”, “answered a summons credit card lawsuit”, “validation letter vs summons”.

| Intent | URL |
|--------|-----|
| I was served | `/pricing/debt-legal` and `/resources/debt-defense-summons-answer` |
| I only have a collection letter | `/free-debt-guide` and `/resources/debt-defense-validation-letters` |
| They froze my bank / garnished wages | `/resources/debt-defense-post-judgment` |

The page is education and a workflow. Court filing stays with a licensed attorney. The copy already says that. Do not soften it in a Facebook post.

### Business credit

People searching: “build business credit”, “EIN credit file”, “net 30 vendors that report”, “business credit vs personal credit”.

| Intent | URL |
|--------|-----|
| Free map | `/free-business-guide` |
| Offer / one-sheet for a partner | `/resources/business-credit-one-sheets` |
| Tier explanation | `/resources/business-credit-tier-matrix` |
| The free map on the allowlist | `/free-business-guide` |

Funding is subject to underwriting. Say that.

### Credit specialist careers

People searching: “credit repair business opportunity”, “how to start a credit repair business”, “credit specialist training”. This cluster is other practitioners, not families in crisis. Keep it off the church flyer.

| Intent | URL |
|--------|-----|
| The offer (warm only) | `/credit-specialist` |
| Playbook and apply | Leave `/credit-specialist-guide` and `/credit-specialist-apply` off public boards |

No income promises. The page already says the specialist runs partner files and Finely supplies the method.

## 5. Weekly owner checklist (30–60 minutes)

### Until #39 is merged and Bluehost is live

QA on PR #39 passed at `e37875c`. Placements still wait. Live `finelycred.com` still has the old leaks.

| Min | Action |
|-----|--------|
| 10 | Confirm PR #39 is merged and the live site is the new build. If either is still pending, make no public submission. |
| 10 | Recheck the promote-safe table against the avoid table. Drop any URL that still 404s or bounces home on `finelycred.com`. |
| 0 | Directories, Google Business posts, and community links stay unsent. |

### After Bluehost is serving the merged #39 build (soft)

| Min | Action |
|-----|--------|
| 5 | Search Console: is `/free-guide` or `/free-debt-guide` indexed? Note it. Leave `/free-kreyol-guide` alone. |
| 15 | One soft placement: a directory from section 1.C pointing at `/free-guide`, **or** one organic post. Haitian boards link `/haitian`. Other rooms use another allowlist URL. |
| 10 | Reply only to people who answered that post. |
| 5 | Write down which promote-safe URL you used. |

### After URLs are stable (wider wave)

Pick one cluster per week. Rotate: Kreyòl → summons → business credit → specialist → Kreyòl. One placement, not a batch.

| Min | Action |
|-----|--------|
| 5 | Search Console: Coverage / Pages for the URLs you requested after the refresh. Note indexed vs not. |
| 10 | One original post in **one** community you belong to, using a template from section 1.E or 2.C. Disclose that you work with Finely Cred. Include the compliance line. |
| 10 | Reply to comments or messages from last week’s post. Invite them to the matching live URL. |
| 10 | One distribution asset: a one-sheet to one partner you know, **or** one Google Business post, **or** the next directory on the list if NAP is ready. |
| 5 | Write down the allowlist URL and the `utm_campaign`. |

Once a month, extra 15 minutes: read `/haitian`, `/free-kreyol-guide`, `/free-debt-guide`, and `/pricing/debt-legal` on a phone. If `/free-kreyol-guide` bounces to `/haitian`, stop citing it. File a note. Do not redesign the page.

## What we will not do

- Paid ads, including “just $5” boosts
- Fake reviews, review gating, or review incentives
- Directory submission software
- The same post pasted across groups
- New Reddit accounts
- Cold email or SMS to scraped leads or to the Haitian cold CSV
- Sending Haitian families to `/credit/miami-fl` style English stubs
- Citing `/`, `/start-here`, `/portal`, `/bookstore`, bare `/pricing`, `/kreyol`, the 404 aliases, or `/resources/funding/tx` and `/resources/funding/ca`
- Citing `/free-kreyol-guide` before #39 is merged and Bluehost is serving it
- Putting `/credit-specialist` on a church flyer, a family chat, or any cold board
- Any directory submission or public post before PR #39 is merged and Bluehost is serving that build
- Promising a score, a deletion, or a court result
- A site redesign as an SEO project

## Owner order when you are back

1. Tonight: nothing public. QA passed PR #39 at `e37875c`. Live `finelycred.com` still has the old leaks. No directories, no posts, no profile links.
2. Merge #39, then deploy it on Bluehost. Click the allowlist URLs on the live site before anyone cites them.
3. After that live build: one soft placement from the allowlist. Directories use `https://finelycred.com/free-guide`. An organic Haitian post may use `https://finelycred.com/haitian` or `https://finelycred.com/free-kreyol-guide` (the funnel QA confirmed on #39). Google Business only after the real phone and address are chosen.
4. This SEO pull request stays a draft until you ask to merge it. It is separate from #39.
5. After the new build has been up long enough that those URLs stay put: section 2, one placement a week. Still skip `/bookstore`, funding TX/CA, `/`, `/start-here`, `/portal`, and bare `/pricing`.
6. Prerender (PR #26) is the follow-up that puts those titles in the raw HTML crawlers download.
