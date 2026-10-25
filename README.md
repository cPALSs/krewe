# Little Saigon Krewe — public site

Live: [https://krewe.cpalss.com](https://krewe.cpalss.com)  
Repo: [cPALSs/krewe](https://github.com/cPALSs/krewe)

Static GitHub Pages site. Surfaces:

| Path | Audience |
|------|----------|
| [`/`](https://krewe.cpalss.com/) | Story — what LSK is, recent photo/video carousel, journey |
| [`/history/`](https://krewe.cpalss.com/history/) | Parade history — year TOC (newest first), host + march events |
| [`/media/`](https://krewe.cpalss.com/media/) | Media archive hub |
| [`/media/golden-harvest-2026/`](https://krewe.cpalss.com/media/golden-harvest-2026/) | Golden Harvest 2026 media archive (lightbox) |
| [`/golden-harvest/`](https://krewe.cpalss.com/golden-harvest/) | Group officers — timeline, FAQ, transit, [portal.cpalss.com](https://portal.cpalss.com) participant waivers |
| [`/fund/`](https://krewe.cpalss.com/fund/) | Sponsors — Fund the Krewe gifts |

Homepage `#media` → `/media/`; `#history` → `/history/`.

Last parade campaign: **Golden Harvest Parade**, Sat Oct 24, 2026.

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
| `data/site.json` | Brand, **hero.slides** (optional `type: "video"`), **story** chapters, event, officer pitch, **portal**, timeline, tribes, **joining.groups**, **wishlist**, transit, mailto templates |
| `data/history.json` | `years[]` → entries (YouTube / up to 4 stills / links) |
| `data/media/golden-harvest-2026.json` | Media archive list (`src`, `thumb`, `alt`) |
| `data/participants.json` | Champion seats (up to **3** filled rows per tribe) |
| `assets/` · `assets/golden-harvest-2026/` | Home carousel, history stills, GH 2026 gallery |

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

Org/club name is fine either way. Full HS names stay on internal sheets only (vault: Little Saigon Krewe → Working with local VSAs → Public student names). Agent skill: [`.cursor/skills/public-student-names`](../../../.cursor/skills/public-student-names/SKILL.md).

## DNS

On the **cpalss.com** zone:

| Type | Name | Value |
|------|------|--------|
| CNAME | `krewe` | `cpalss.github.io` |

Then GitHub repo **Settings → Pages** → custom domain `krewe.cpalss.com` → Enforce HTTPS.
