# Video Command — acceptance (manual)

Run after `npm run typecheck`. Canonical entry: **`/admin/content-studio?room=video`** (no separate video admin route).

## 1. Import

1. Open Content Studio → **Video** workroom (Upload tab default).
2. Upload a short MP4 (Google Labs export or any test file).
3. Confirm analysis summary appears and workflow step advances to **Understand**.

**Pass:** `VideoCommandRecord` row exists (local storage) linked to upload analysis id.

## 2. Destinations

1. On **Destinations**, route to **Resource library** (or equivalent).
2. Confirm resource video row created (private until publish).

**Pass:** No duplicate upload lists; one workflow stepper only.

## 3. Publish

1. Set title, mark **public** if offered, save.
2. Open `/resources/videos` → **Partner lessons** lane shows the video (not duplicated under tours).

**Pass:** Tour vs lesson lanes stay separate per `listPartnerLessonVideos`.

## 4. Promote

1. Complete **Promote** step → open Hannah (**Capture & Links**) with `videoId` / `utm_content=video:*` prefilled.
2. Copy link once.

**Pass:** Results → **Video signups (7d)** can increment when a test signup uses that UTM (optional smoke).

## 5. Agents (no duplicates)

- Miriam/Jordan: pillar strip or Content Studio deep link — not a second link builder.
- Caleb: **Suggest hunt from video topics** prefills Marketing Desk — does not auto-run Serper.

## Compliance

Results vary · not legal advice · funding subject to underwriting
