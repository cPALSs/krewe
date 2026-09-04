# Little Saigon Krewe — public site

Live: [https://krewe.cpalss.com](https://krewe.cpalss.com)  
Repo: [cPALSs/krewe](https://github.com/cPALSs/krewe)

Static GitHub Pages site. Four surfaces:

| Path | Audience |
|------|----------|
| [`/`](https://krewe.cpalss.com/) | Story — what LSK is, recent photo carousel, journey |
| [`/history/`](https://krewe.cpalss.com/history/) | Parade history — **host** a Tết parade vs **march** as a unit |
| [`/golden-harvest/`](https://krewe.cpalss.com/golden-harvest/) | Group officers — timeline, FAQ, transit, [portal.cpalss.com](https://portal.cpalss.com) participant waivers |
| [`/fund/`](https://krewe.cpalss.com/fund/) | Sponsors — Fund the Krewe gifts |

`/media/` redirects to `/history/`. `#history` and `#media` on the homepage do too.

First campaign: **Golden Harvest Parade**, Sat Oct 24, 2026.

## Edit / preview / publish

```bash
# From this folder (Operations/Sites/krewe)
python3 -m http.server 8765
# → http://127.0.0.1:8765
#    http://127.0.0.1:8765/history/
#    http://127.0.0.1:8765/golden-harvest/
#    http://127.0.0.1:8765/fund/

git add -A && git commit -m "Update Krewe site" && git push
```

Push to `main` deploys via `.github/workflows/deploy-pages.yml`.

## Content

| File | What to edit |
|------|----------------|
| `data/site.json` | Brand, **hero.slides**, **story** chapters, event, officer pitch, **portal**, timeline, tribes, **joining.groups** (`interested` / `confirmed`), **wishlist**, transit, mailto templates |
| `data/history.json` | Host vs march entries, YouTube ids, public links |
| `data/participants.json` | Champion seats (up to **3** filled rows per tribe) |
| `assets/` | Compressed parade stills for the home carousel and story chapters |

**Fund the Krewe (`wishlist`):** gift cards with `amount`, `slots`, optional `slotsFilled`. Set `status` to `open` · `pledged` · `fulfilled`. Keep in sync with the GH sponsorship packet seed.  
**Waivers:** public door is `portalUrl` (`https://portal.cpalss.com`). Do not hardcode per-club `/j/{token}` join links.  
**Transit:** Elk Grove → Capitol Mall SacRT how-to; agency / comped-fare exploration stays in `agencyNote` until confirmed.

CTAs are `mailto:krewe@cpalss.com` plus the Portal link — no forms on this site. Sync roster from Community Graph when status changes; do not put private POC emails or phones in JSON.

Visitor pages must not link monorepo paths or private vault docs.

**Story beat (home, chapter 1):** **2012** is the branded Little Saigon Tết parade weekend — community-hosted, **not a krewe**. Tell **2010-02-13** as story (designation weekend, Tết march on Stockton). Do **not** call 2012 Sacramento’s first Tết parade. Do **not** put a 2010-vs-2012 correction footnote, or any “not Board policy” / “community story” disclaimer, on public pages. EGLNY 2026 tried hosting again; Bao’s read is that it showed how thin Vietnamese parade participation had become. LSK is the rebuild (krewe **train** on civic routes), not a rerun of 2012 as “we already have a parade.” History page: [`/history/`](https://krewe.cpalss.com/history/).

### Student names on this site

| Who | Public listing |
|-----|----------------|
| **High school** | **First name only** (+ optional `role`). No last names. |
| **College** / adults | Full name OK (+ optional `role`). |

Org/club name is fine either way. Full HS names stay on internal sheets only (vault: Little Saigon Krewe → Working with local VSAs → Public student names).

## DNS

On the **cpalss.com** zone:

| Type | Name | Value |
|------|------|--------|
| CNAME | `krewe` | `cpalss.github.io` |

Then GitHub repo **Settings → Pages** → custom domain `krewe.cpalss.com` → Enforce HTTPS.
