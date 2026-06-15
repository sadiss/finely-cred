# GitHub upload reference

Use this when pushing Finely Cred to GitHub.

| Item | Value |
|------|--------|
| **Repository** | https://github.com/sadiss/finely-cred |
| **Remote** | `origin` → `https://github.com/sadiss/finely-cred.git` |
| **Launch branch** | `launch/ready-sovereign-supreme` |
| **Default branch** | `main` |

## Upload workflow

```bash
git status
git add -A
git commit -m "Your message"
git push origin launch/ready-sovereign-supreme
```

To merge into `main`, open a PR:

https://github.com/sadiss/finely-cred/compare/main...launch/ready-sovereign-supreme

## Do not commit

- `.env.local`
- `node_modules/`
- `dist/`
- `test-results/`
