# Personal Credit Restore — premium hero image brief

**Goal:** One **real photograph** (or photoreal AI) that feels **6-figure luxury**, not clip art. It lives in the **header / hero background** on `/personal-credit` and blends into the ivory page (fade + mesh), not a boxed stock rectangle.

**Reference mock:** See repo file after generation: `public/marketing/personal-credit-restore-hero-reference.png` (AI reference for Canva/stock matching).

---

## Recommended hero (pick one direction)

### **Option A — “Calm command” (recommended)**

| Field | Spec |
|--------|------|
| **Subject** | Partner-age professional (diverse casting), relaxed confidence — reviewing credit progress on tablet or laptop |
| **Setting** | Warm ivory home office or boutique financial lounge — brass, linen, soft plant, **no** cheesy handshake stock |
| **Light** | Golden hour from left; left third **soft / bright** for navy headline text |
| **Palette** | Champagne ivory `#f7f3ea`, navy `#0a1628`, gold accent `#b8860b`, touch emerald `#059669` |
| **Mood** | Restoration = **forward motion**, not shame |

**Canva / ChatGPT / Midjourney prompt (copy-paste):**

```text
Ultra-premium editorial photograph, photorealistic, 16:9. Confident professional woman late 30s, cream blazer, warm smile, seated at modern desk in sunlit luxury home office, champagne ivory walls, holding tablet with blurred financial dashboard UI, no logos no readable text. Shallow depth of field, 85mm cinematic, gold hour light from left, left third softly overexposed ivory negative space for website headline. Navy shadows, muted gold highlights, subtle emerald plant bokeh. Calm empowered mood, Vogue Business quality, not stock clip art.
```

**Canva Magic Media:** Photo · Widescreen 16:9 · Style “Photo” · avoid “Graphic” or “Cartoon”.

---

### **Option B — “Keys / doorway” (metaphor, still real photo)**

Real photo: close-up of hands receiving **house keys** or opening door to bright entryway; partner visible from shoulder down; same ivory/gold grade. Use for **funding path** tab or secondary band, not main hero if Option A is primary.

**Prompt snippet:** `Editorial real estate lifestyle photo, hands with brass house keys, soft ivory interior, golden light, shallow DOF, luxury not cheesy, 16:9, left fade for text`

---

### **Option C — “Three bureau calm” (abstract + real)**

Real macro photo: **three elegant paper folders** or envelopes on marble desk (no Equifax logos) + pen + glasses — suggests bureau correspondence without clip art shields. Strong for **process** tab.

---

## Where to buy (real photos)

Search these **exact phrases** (Adobe Stock / Canva Pro / Getty / Shutterstock / Unsplash+):

1. `financial wellness woman tablet home office golden hour`
2. `luxury home office professional woman cream interior`
3. `credit score lifestyle calm confident african american woman desk`
4. `champagne interior executive desk shallow depth of field`
5. `personal finance peace of mind warm light editorial`

**Avoid:** piggy banks, cartoon graphs, red “declined” stamps, panic faces, generic handshake, shield clip art.

**Unsplash (free, check license):** search `home office golden hour woman` + `financial planning calm` — pick **editorial** shots with **left-side negative space**.

**Adobe Stock:** filter **Photos only**, exclude **Generated** if you want strictly camera-origin.

---

## How it should sit on the page (implementation spec)

| Element | Treatment |
|---------|-----------|
| **Placement** | Full-width **behind** hero header (below nav), min-height ~420px desktop / ~320px mobile |
| **Blend** | `linear-gradient(to right, rgba(247,243,234,0.97) 0%, rgba(247,243,234,0.75) 42%, rgba(247,243,234,0.15) 100%)` over image so copy stays readable |
| **Bottom** | Soft fade to page ivory `fc-landing-wealthy-ivory` (no hard crop line) |
| **File** | WebP + JPG fallback, ~2400×1350, `<120KB` WebP target |
| **Upload path** | `public/marketing/personal-credit-hero.webp` (you upload; we wire in P1) |
| **Alt text** | `Partner reviewing credit restoration progress in a calm, sunlit workspace` |

**Do not:** float image as a small card with drop shadow — it should feel **part of the background**.

---

## What to send back

1. Final **16:9** asset (Canva export or stock license)  
2. Which option **A / B / C** (or mix: A hero + C process)  
3. Optional: crop preference (more face vs more desk)

Then we implement hero + image integration on `PersonalCreditPage` in one pass.
