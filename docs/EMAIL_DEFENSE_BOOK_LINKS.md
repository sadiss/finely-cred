# Partner defense pages — email-ready links

Static HTML hosted under `public/resources/` (served as-is by Vite / Vercel — no login).

Educational · not legal advice.

## Production (send these to the partner)

After deploy picks up the push to `preview/sitewide-ux-pack-merge` (or production):

1. **Partner Defensebook**  
   https://finelycred.com/resources/defensebook.html

2. **Post-Defense Operations**  
   https://finelycred.com/resources/post-defense-ops.html

If this branch is only on a Vercel preview, use that host the same way:  
`https://<preview-host>/resources/defensebook.html`  
`https://<preview-host>/resources/post-defense-ops.html`

## Local (owner machine only)

1. http://127.0.0.1:5173/resources/defensebook.html  
2. http://127.0.0.1:5173/resources/post-defense-ops.html  

Do **not** email local or `file://` links — the partner cannot open them.

## Ready-to-paste email blurb

```
Hi —

Here are your Finely Cred courtroom prep pages (open in a browser; no download needed):

1) Partner Defensebook
https://finelycred.com/resources/defensebook.html

2) Post-Defense Operations
https://finelycred.com/resources/post-defense-ops.html

Work through them in order. Educational guidance only — not legal advice.

— Finely Cred
```

## Repo paths

- `public/resources/defensebook.html`
- `public/resources/post-defense-ops.html`
