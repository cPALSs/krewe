# Little Saigon Krewe — public site

Live: [https://krewe.cpalss.com](https://krewe.cpalss.com)  
Repo: [cPALSs/krewe](https://github.com/cPALSs/krewe)

Static GitHub Pages landing for Little Saigon Krewe. First campaign: **Golden Harvest Parade**, Sat Oct 24, 2026.

## Edit / preview / publish

```bash
# From this folder (Operations/Sites/krewe)
python3 -m http.server 8765
# → http://127.0.0.1:8765

git add -A && git commit -m "Update Krewe site" && git push
```

Push to `main` deploys via `.github/workflows/deploy-pages.yml`.

## Content

| File | What to edit |
|------|----------------|
| `data/site.json` | Event copy, tribes, **wishlist**, **transit**, mailto templates |
| `data/participants.json` | Champion seats + marchers (`interested` / `confirmed`) |

**Fund the Krewe (`wishlist`):** gift cards with `amount`, `slots`, optional `slotsFilled`. Set `status` to `open` · `pledged` · `fulfilled`. Keep in sync with the GH sponsorship packet seed.  
**Transit:** Elk Grove → Capitol Mall SacRT how-to; agency / comped-fare exploration stays in `agencyNote` until confirmed.

CTAs are `mailto:krewe@cpalss.com` only — no forms. Sync roster from the Parades sheet when status changes; do not put private POC emails or phones in JSON.

## DNS

On the **cpalss.com** zone:

| Type | Name | Value |
|------|------|--------|
| CNAME | `krewe` | `cpalss.github.io` |

Then GitHub repo **Settings → Pages** → custom domain `krewe.cpalss.com` → Enforce HTTPS.

## Rules

Visitor pages must not link monorepo paths or private vault docs. See cPALSs `.cursor/rules/github-pages-public-sites.mdc`.
