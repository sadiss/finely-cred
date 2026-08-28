# Developer GitHub sync (Finely Cred)

Use this when the owner says **“push everything”** or after a large Cursor session.

## Branch

Active feature branch (check `git branch --show-current`):

- **`launch/ready-sovereign-supreme`** — sell-ready sweep + homepage UI restore + chat layout.

`main` may be behind until this branch is merged. **Do not create a new branch.**

## Pull on your machine

```powershell
cd E:\Finely-Cred\Tishobe\finely-cred-main
git fetch origin
git checkout launch/ready-sovereign-supreme
git pull origin launch/ready-sovereign-supreme
git log -1 --oneline
```

Confirm you see the latest commit hash the owner was given (not an old `main` tip).

## Install & run locally

```powershell
npm ci
npm run dev
```

Open **http://127.0.0.1:5173/** (Vite must stay running in that terminal).

Full visual + chat notes since the last push: [`DEVELOPER_UI_RESTORE_HANDOFF.md`](./DEVELOPER_UI_RESTORE_HANDOFF.md).

## Typecheck before release

```powershell
npm run typecheck
```

## What is *not* on GitHub

- `.env` / secrets (never commit)
- `NUL.css` (Windows artifact; ignored)
- `qa-shots/` local screenshots
- Uncommitted local edits — only committed files exist on GitHub

## Owner request: full-folder push

Agents should stage **`src/`**, **`public/`**, **`scripts/`**, **`docs/`**, `package.json`, `package-lock.json`, then commit and push the **current branch**. See `.cursor/rules/git-push-full-working-tree.mdc`.

## Smoke URLs after pull

| URL | Check |
|-----|--------|
| `/` | Skyline visible · law ticker moves · DIY/payment champagne on silver · debt navy · silver review card in the middle |
| `/` chat | Thread stays visible while typing; options live under **More** |
| `/personal-credit` | Public dark theme; restore pricing lives at `/pricing/personal-credit-restore` |
| `/pricing/personal-credit-restore` | Readable restore page, public nav not ivory |
| `/free-guide` | Dispute video / guide |
| `/preview/workspace-light/portal/dashboard` | Hub chat shows the conversation, not a wall of options |

## Poster asset note

Homepage video poster: `public/media/home-credit-solutions-poster.png`. If a raster shield logo is baked into the PNG, replace that file and bump the `?v=` query in `LandingCinematicVideoStage.tsx`.
