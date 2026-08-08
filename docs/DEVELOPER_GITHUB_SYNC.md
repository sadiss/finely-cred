# Developer GitHub sync (Finely Cred)

Use this when the owner says **“push everything”** or after a large Cursor session.

## Branch

Active feature branch (check `git branch --show-current`):

- **`fix/debt-guide-mockup-video-wordmark`** — debt/dispute funnels, launch-sprint portal work, marketing pages.

`main` may be behind until this branch is merged.

## Pull on your machine

```powershell
cd E:\Finely-Cred\Tishobe\finely-cred-main
git fetch origin
git checkout fix/debt-guide-mockup-video-wordmark
git pull origin fix/debt-guide-mockup-video-wordmark
git log -1 --oneline
```

Confirm you see the latest commit hash the owner was given (not an old `main` tip).

## Install & run locally

```powershell
npm ci
npm run dev
```

Open **http://127.0.0.1:5173/** (Vite must stay running in that terminal).

## Typecheck before release

```powershell
npm run typecheck
```

## What is *not* on GitHub

- `.env` / secrets (never commit)
- `NUL.css` (Windows artifact; ignored)
- Uncommitted local edits — only committed files exist on GitHub

## Owner request: full-folder push

Agents should stage **`src/`**, **`public/`**, **`scripts/`**, **`docs/`**, `package.json`, `package-lock.json`, then commit and push the **current branch**. See `.cursor/rules/git-push-full-working-tree.mdc`.

## Smoke URLs after pull

| URL | Check |
|-----|--------|
| `/` | Homepage video — no FC shield logo overlay |
| `/personal-credit` | Ivory shell, navy Solutions header, solid tiles |
| `/pricing/personal-credit-restore` | Black Solutions header, ivory background |
| `/free-debt-guide` | Debt hero book + form |
| `/free-guide` | Dispute video autoplay |

## Poster asset note

Homepage video poster: `public/media/home-credit-solutions-poster.png`. If a raster shield logo is baked into the PNG, replace that file and bump the `?v=` query in `LandingCinematicVideoStage.tsx`.
