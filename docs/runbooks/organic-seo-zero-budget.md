# Zero-dollar organic marketing and SEO

Owner runbook for finding Finely Cred without ads. Ordinary people, especially Haitian Americans looking for credit or debt help, plus business-credit and credit-specialist searches.

Checked against the live site on **26 Sep 2026**. This file is the plan. The small on-page edits in the same pull request are **not live** until the owner asks for a Bluehost deploy.

**Overnight work is soft placements only.** Profiles, directories you fill in by hand, and Haitian community boards. Every link is a URL already on the live sitemap. The default three are `/haitian`, `/kreyol`, and `/free-kreyol-guide`.

The wider placement wave — more boards, more citations, metro URLs, and indexing requests across the full set — waits until those URLs are stable after the Bluehost refresh. That wave is still manual and still zero-dollar. It is not a directory blast, a bought-link campaign, or a copy-paste across groups.

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

Cold Haitian CSV rows stay `consent=false`. Organic visitors become leads only when they opt in on a funnel (usually `/free-kreyol-guide`).

Public contact in the product is `partnersupport@finelycred.com`. The phone on the debt summons **sample** (`(305) 555-0148`) is a mock document, not the business number. Do not put it on Google, a flyer, or a directory.

## What is live right now

`https://finelycred.com/sitemap.xml` already lists these URLs (112 total on 26 Sep 2026). Soft placements tonight use this list. Prefer the first three rows unless a person asked about a different live page.

| Job | URL to share |
|-----|----------------|
| Haitian desk | https://finelycred.com/haitian |
| Short Kreyòl link (same desk) | https://finelycred.com/kreyol |
| Free kits (the opt-in) | https://finelycred.com/free-kreyol-guide |
| Kit: what credit is | https://finelycred.com/free-kreyol-guide/what-is-credit |
| Kit: what the letter says | https://finelycred.com/free-kreyol-guide/letter-meaning |
| Kit: person helping the family | https://finelycred.com/free-kreyol-guide/helper |
| Church flyer kit | https://finelycred.com/free-kreyol-guide/community-flyer |
| Debt / summons offer | https://finelycred.com/pricing/debt-legal |
| Summons education article | https://finelycred.com/resources/debt-defense-summons-answer |
| Free debt guide | https://finelycred.com/free-debt-guide |
| Personal restore | https://finelycred.com/pricing/personal-credit-restore |
| Restore one-sheet | https://finelycred.com/resources/personal-credit-restore-sheet |
| Business credit guide | https://finelycred.com/free-business-guide |
| Business credit one-sheets | https://finelycred.com/resources/business-credit-one-sheets |
| Business credit tier article | https://finelycred.com/resources/business-credit-tier-matrix |
| Credit specialist offer | https://finelycred.com/credit-specialist |
| Specialist guide | https://finelycred.com/credit-specialist-guide |
| Resources hub | https://finelycred.com/resources |

Also open these in a normal browser before you share them. They are real app routes. They were **missing from the live sitemap** on 26 Sep 2026 (this pull request adds them for the next deploy):

- https://finelycred.com/start-here
- https://finelycred.com/pricing/business-credit
- https://finelycred.com/resources/one-sheets (partner sheet hub; confirm it renders)

**Do not promote metro URLs yet** (`/haitian/miami`, `/haitian/brooklyn`, and the other eight). They are in this branch’s sitemap and are not in the sitemap Google can fetch today. Same for treating `/credit/miami-fl` as the Haitian page. Those English city stubs are a different page. Haitian posts go to `/haitian` or `/kreyol`.

### What Google sees before JavaScript

A fetch of the live HTML (no browser) returns the **same** title and description on `/`, `/haitian`, `/pricing/debt-legal`, and the rest:

- Title: `Finely Cred — Credit Restore, Disputes & Partner Portal`
- Description: `Finely Cred — credit restore, dispute letters, business credit, debt OS, and partner portal.`
- No canonical link in the raw HTML

The app does set a unique title after it loads. Google often runs JavaScript, but it is slower and less reliable. Unique titles in the raw file need the prerender work in [PR #26](https://github.com/sadiss/finely-cred/pull/26), after the owner deploys. Until then, Search Console + the sitemap + off-site mentions are the levers that do not wait on Bluehost.

## 1. Overnight — soft placements only

Do these in order. One profile, one citation, one community board. Then stop. Save the wider wave for section 2, after Bluehost is serving a build you have clicked through.

Hold until that refresh, even if the route answers today:

- Metro desks (`/haitian/miami` and the other nine)
- `/start-here` and `/pricing/business-credit` (missing from the live sitemap on 26 Sep 2026)
- Requesting indexing on a stack of URLs
- Posting the same note in more than one group
- Any URL that is only in this pull request’s sitemap

### A. Search Console and Bing (first session, ~25 min)

1. Open [Google Search Console](https://search.google.com/search-console) with the Google account that should own the property long-term.
2. Add the **domain** property `finelycred.com` (DNS verification is the durable one). If DNS is annoying tonight, add the **URL-prefix** property `https://finelycred.com/` and verify by the method you can finish without a redeploy (DNS TXT, or an HTML file upload in Bluehost that does not require an app rebuild).
3. Submit the sitemap that is live now: `https://finelycred.com/sitemap.xml`.
4. Inspect **one** URL: `/haitian` or `/free-kreyol-guide`. Request indexing only if that one URL is missing. Leave the rest of the quota for after the refresh.
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

Website: `https://finelycred.com/haitian`

First Google post (after the profile is verified): link to `https://finelycred.com/free-kreyol-guide`.

Photos: logo and a real photo of you or the team. No stock “happy family with a 850 score” images. No before/after score graphics that name a result you cannot document.

Reviews: after a real session, you may send one personal note: “If the session was useful, a Google review helps other families find us. Please say what we actually did. Please don’t mention a score.” Never write the review for them. Never offer a discount for a review.

If you cannot verify an address this month, skip Google Business. Do Search Console instead. A half-finished profile with the mock summons phone is worse than no profile.

### C. Free citations (one listing tonight)

Use the **same** name, phone, and website on every listing. Website on every overnight listing: `https://finelycred.com/haitian` (or `https://finelycred.com/free-kreyol-guide` if the form is “where do people start”). If you do not have the phone and address yet, skip citations and do the community board instead.

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
| Haitian church or family helper | https://finelycred.com/free-kreyol-guide/community-flyer and https://finelycred.com/haitian |

Add this line under your signature when you forward a sheet:

> Results vary. Not legal advice. Funding is subject to underwriting. Families can start here: https://finelycred.com/haitian

QR codes, if you print the flyer kit:  
`https://finelycred.com/free-kreyol-guide?utm_source=church&utm_medium=qr&utm_campaign=kreyol`

UTM values to reuse (so you can see which post worked):

| Piece | Value |
|-------|--------|
| `utm_source` | `facebook`, `whatsapp`, `reddit`, `church`, `partner`, `gbp`, `youtube` |
| `utm_medium` | `organic`, `qr`, `onesheet` |
| `utm_campaign` | `kreyol`, `summons`, `business-credit`, `specialist` |

Example:  
`https://finelycred.com/pricing/debt-legal?utm_source=facebook&utm_medium=organic&utm_campaign=summons`

### E. One Haitian community board (you paste it)

One group you already belong to: a Haitian Facebook group, a church WhatsApp, or a community board. One post. Link only `/haitian`, `/kreyol`, or `/free-kreyol-guide`.

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

> Yon lèt koleksyon pa menm bagay ak yon konvokasyon tribinal. Peye yon kolektè souvan pa efase liy nan dosye kredi a. Si w vle lèt angle a eksplike an Kreyòl: https://finelycred.com/kreyol  
> Mwen travay ak Finely Cred. Rezilta yo varye. Sa a pa konsèy legal. Si w bezwen lajen, sa depann si yo apwouve w.

If someone in that same thread already showed a summons or asked about business credit, answer them and use the matching **live** URL from the table above. Do not go looking for those threads tonight. Templates for a later week are in section 2.

#### Reddit (profile only, tonight)

Subreddits that sometimes discuss this topic: `r/CRedit`, `r/personalfinance`, `r/smallbusiness`, `r/haiti`, and a city sub you actually live around. **Their rules win.** Most of them ban promotional links.

- Tonight: put `https://finelycred.com/haitian` in the bio of the account you already have. Do not post a link thread.
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

1. Open `/haitian`, `/kreyol`, `/free-kreyol-guide`, `/start-here`, `/pricing/debt-legal`, and `/pricing/business-credit` in a private window. Confirm the browser tab titles match the checklist below.
2. View the page source **or** Search Console’s rendered HTML. Until PR #26 (prerender) is also deployed, the raw source can still show the generic title. The rendered title is the one that matters for that check.
3. In Search Console, resubmit `https://finelycred.com/sitemap.xml`. The new file should include `/start-here`, `/pricing/business-credit`, and `/haitian/miami` (plus the other metro desks).
4. Request indexing for `/haitian`, `/free-kreyol-guide`, `/start-here`, `/pricing/business-credit`, `/pricing/debt-legal`, and **one** metro you will actually talk about that month. Add other metros in later weeks, not all ten in one day.
5. Confirm canonicals in the rendered head:
   - `/kreyol` → `https://finelycred.com/haitian` (share `/kreyol` in Kreyòl posts; Google should consolidate on `/haitian`)
   - `/services/debt-legal` → `https://finelycred.com/pricing/debt-legal`
   - `/services/business-credit` → `https://finelycred.com/pricing/business-credit`
6. Leave cold imports on `consent=false`. People who arrive from these posts opt in on `/free-kreyol-guide`.

### B. Wider citations and boards

After step A, add placements you skipped overnight:

- The rest of the five-listing list in section 1.C, if any are still empty, then at most one extra real directory per week (a chamber you belong to, Bing if Google was first). Each listing uses the same name, phone, and `https://finelycred.com/haitian`.
- One additional community you already belong to per week. Rotate the live URL to match the room: Kreyòl desk, summons page, business-credit guide, or specialist offer. Disclose that you work with Finely Cred.
- Metro URL only after that city’s page is in the sitemap you just resubmitted. Example: `https://finelycred.com/haitian/miami?utm_source=facebook&utm_medium=organic&utm_campaign=kreyol`.
- Partner one-sheets from section 1.D, one partner you know per week. Same rule: they share the sheet, they do not hand over a client list.

### C. Templates for the later weeks

Same disclosure and compliance lines as section 1.E.

Summons (when someone shows a court paper, or in one debt-topic group after the refresh):

> If the paper says “summons” or “you are commanded,” the deadline matters more than the phone number on the letter. This page is the map, not a lawyer: https://finelycred.com/pricing/debt-legal  
> I work with Finely Cred. Results vary. Not legal advice. Not a law firm. A licensed attorney files in court.

Business credit:

> Business credit is the company file (EIN, vendors that report, business bureaus), not your personal score with a new name. The free guide is here: https://finelycred.com/free-business-guide  
> I work with Finely Cred. Results vary. Funding is subject to underwriting.

Credit specialist career (career groups, not family credit groups):

> If you already sit with people on their credit files, this is the specialist path: you run the files, Finely supplies the method. No score promises in the pitch. https://finelycred.com/credit-specialist  
> I work with Finely Cred.

## 3. On-page checklist

Titles below are the **app** titles (what the browser tab should say after this pull request is deployed). “Live shell” means today’s raw HTML, which is still the generic Finely Cred title on every URL.

| URL | Gap found | What this PR does |
|-----|-----------|-------------------|
| `/haitian` | Tab title did not say Kreyòl. No links to the free kits or the summons desk. | Title `Kreyòl credit help for Haitian Americans`. Links to `/free-kreyol-guide`, `/pricing/debt-legal`, `/start-here`. Canonical path stays `/haitian`. |
| `/kreyol` | Same page as `/haitian`, short URL. Catalog title was 17 characters (“Haitian community”). | Catalog title aligned. Rendered canonical is `/haitian` so the two URLs do not compete. |
| `/free-kreyol-guide` | Title was “Credit kits — Haitian community” and the description was 177 characters (Google cuts near 160). | Title `Free Kreyòl credit kits`. Description shortened and still says results vary / not legal advice. |
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

Write the post for a person, not for a keyword list. Overnight, the Haitian board post uses `/haitian`, `/kreyol`, or `/free-kreyol-guide` only. The other rows are for section 2, after the refresh, and only when that URL is on the live sitemap. Metro URLs wait until then.

### Haitian credit help / Kreyòl

People searching: “haitian credit help”, “kreyol credit repair”, “èd kredi kreyòl”, “haitian credit counselor miami” (and the same for Brooklyn, Boston, and the other desks).

| Intent | Now | After metro pages are on the live sitemap |
|--------|-----|--------------------------------------------|
| Explain my letter in Kreyòl | `/haitian` or `/kreyol` | `/haitian` plus `/haitian/{city}` for that city |
| Send me the free kit | `/free-kreyol-guide` | same |
| I am helping my parent | `/free-kreyol-guide/helper` | same |

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
| The program | `/pricing/business-credit` (share after you confirm the page renders; it is missing from today’s live sitemap) |

Funding is subject to underwriting. Say that.

### Credit specialist careers

People searching: “credit repair business opportunity”, “how to start a credit repair business”, “credit specialist training”. This cluster is other practitioners, not families in crisis. Keep it off the church flyer.

| Intent | URL |
|--------|-----|
| The offer | `/credit-specialist` |
| The free playbook | `/credit-specialist-guide` |
| Apply | `/credit-specialist-apply` |

No income promises. The page already says the specialist runs partner files and Finely supplies the method.

## 5. Weekly owner checklist (30–60 minutes)

### Until the Bluehost refresh (soft)

| Min | Action |
|-----|--------|
| 5 | Search Console: is `/haitian` or `/free-kreyol-guide` indexed? Note it. Leave the other URLs alone. |
| 15 | One soft placement: a profile/directory from section 1.C **or** one Haitian board post from section 1.E. Link `/haitian`, `/kreyol`, or `/free-kreyol-guide`. |
| 10 | Reply only to people who answered that post. |
| 5 | Write down which live URL you used. |

### After URLs are stable (wider wave)

Pick one cluster per week. Rotate: Kreyòl → summons → business credit → specialist → Kreyòl. One placement, not a batch.

| Min | Action |
|-----|--------|
| 5 | Search Console: Coverage / Pages for the URLs you requested after the refresh. Note indexed vs not. |
| 10 | One original post in **one** community you belong to, using a template from section 1.E or 2.C. Disclose that you work with Finely Cred. Include the compliance line. |
| 10 | Reply to comments or messages from last week’s post. Invite them to the matching live URL. |
| 10 | One distribution asset: a one-sheet to one partner you know, **or** one Google Business post, **or** the next directory on the list if NAP is ready. |
| 5 | Write down the URL, the `utm_campaign`, and whether anyone opted in on `/free-kreyol-guide` (Leads OS, after you are in admin). |

Once a month, extra 15 minutes: read one of your own public pages on a phone (`/haitian`, `/pricing/debt-legal`, `/free-kreyol-guide`) and fix a broken link if you see one. File that as a note. Do not redesign the page.

## What we will not do

- Paid ads, including “just $5” boosts
- Fake reviews, review gating, or review incentives
- Directory submission software
- The same post pasted across groups
- New Reddit accounts
- Cold email or SMS to scraped leads or to the Haitian cold CSV
- Sending Haitian families to `/credit/miami-fl` style English stubs
- Promising a score, a deletion, or a court result
- A site redesign as an SEO project

## Owner order when you are back

1. Tonight, soft only: Search Console, Bing, and one profile or one Haitian board post to `/haitian`, `/kreyol`, or `/free-kreyol-guide`.
2. Google Business only after the real phone and address are chosen. The website field is `https://finelycred.com/haitian`.
3. Merge and deploy when you want the new titles, canonicals, `/start-here` sitemap row, and metro pages. This pull request is a draft until you say so.
4. After the Bluehost refresh, and only after you have clicked the new pages: section 2. Resubmit the sitemap, then one metro URL, then the wider placements one per week.
5. Prerender (PR #26) is the follow-up that puts those titles in the raw HTML crawlers download.
