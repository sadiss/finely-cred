## View links (local, LAN, staging)

### Local (this machine only)

Run:

```bash
npm run dev
```

Open:
- `http://127.0.0.1:5173/`

### LAN (view on phone/tablet on same Wi‑Fi)

Run:

```bash
npm run dev:host
```

Vite will print a “Network” URL. Open that URL on your phone/tablet, or use:
- `http://<YOUR-PC-IP>:5173/`

Notes:
- Your phone/tablet must be on the **same Wi‑Fi** as your computer.
- If Windows Firewall blocks it, allow Node/Vite on private networks.

### Staging (shareable public link)

Recommended: **Vercel** (static build).

Build command:

```bash
npm run build
```

Output folder:
- `dist/`

If you want Supabase-backed features in staging, set env vars:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

