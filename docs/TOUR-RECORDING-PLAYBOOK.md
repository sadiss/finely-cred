# Tour recording playbook (Part B h6 / Part C)

Factory tours live in `public/tours/{tour-id}.mp4` and appear on **Resources → Videos** and **Watch how** on every hub.

## Regenerate all tours

```powershell
cd Tishobe/finely-cred-main
npm run dev   # port 5173 required for capture
npm run tour:capture -- --all
npm run tour:narration:export -- --all
npm run tour:assemble -- --all
```

## Add voiced narration (production)

Requires Supabase + Cartesia in `.env.local`:

```powershell
npm run tour:voice:prerender -- --all
npm run tour:assemble -- --all
```

## Manual MP4 upload (admin)

1. Open **Admin → Resources** or **Media Studio**
2. Upload MP4 to the public video library
3. Tag with `tour` if it replaces a factory walkthrough

Factory tours do **not** use blob storage — they are static files under `public/tours/`.

## QA

```powershell
npm run tour:capture:audit
npm run launch:check
```

Visit `/resources#videos` — every manifest tour should show a poster + **Watch tour** button.
