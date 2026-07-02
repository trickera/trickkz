# Deploy — trickkz.com (Cloudflare Pages)

Static site, no framework. Deployed as a **clean, minified `dist/`** (dev files never published).
Project: **trickkz** · account: <your-cloudflare-account> (`<CF_ACCOUNT_ID>`).
Live: **https://trickkz.pages.dev**

## Build the dist + deploy
Auth once: `npx wrangler login`. Then:

```bash
# 1. build clean minified dist  (DIST = a temp folder OUTSIDE the project)
mkdir -p dist/assets/fonts
cp index.html 404.html styles.css script.js fonts.css _headers dist/
cp assets/foto.jpg assets/Patrick_Ferreira-DevOps.pdf assets/Patrick_Ferreira-DevOps-EN.pdf dist/assets/
cp assets/fonts/*.woff2 dist/assets/fonts/
npx -y esbuild dist/styles.css --minify --allow-overwrite --outfile=dist/styles.css
npx -y esbuild dist/script.js  --minify --allow-overwrite --outfile=dist/script.js
npx -y esbuild dist/fonts.css  --minify --allow-overwrite --outfile=dist/fonts.css

# 2. deploy
export CLOUDFLARE_ACCOUNT_ID=<CF_ACCOUNT_ID>
npx -y wrangler pages deploy dist --project-name=trickkz --branch=main --commit-dirty=true
```

> Only the dist is uploaded, keeping development-only files out of production.
> If you edit css/js, bump `?v=N` in index.html (+ 404.html) so browsers refetch.

## Custom domain (trickkz.com — already on Cloudflare)
Dashboard → **Workers & Pages → trickkz → Custom domains → Set up a custom domain → `trickkz.com`** → Activate.
DNS + HTTPS are created automatically (zone is on Cloudflare). Repeat for `www.trickkz.com` if desired.

## Security posture
- `_headers`: strict CSP (no `unsafe-inline`/`unsafe-eval`, all same-origin), HSTS, X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy.
- Fonts self-hosted (`assets/fonts/`) — zero third-party requests.
- Email assembled at runtime (not plain text in HTML). Phone not in source.
- `404.html` → unknown paths return a real branded 404 (no soft-404).
- Deployed JS/CSS are **minified** (not casually readable; not true obfuscation — see note).

## Note on "hiding the code"
Client-side HTML/CSS/JS is always viewable (F12 / view-source / curl) — that's how browsers work, and there are **no secrets** in it. Minification makes it dense and unpleasant to read, but anyone can "pretty-print" it. The real risk (publishing dev/tooling files) is solved by the dist pipeline above.

## Post-deploy checklist
- [ ] securityheaders.com on the domain → A/A+
- [ ] DevTools → Network: only trickkz.com requests
- [ ] `/anything-random` → branded 404
- [ ] Confirm the CV PDF doesn't mention the removed company
