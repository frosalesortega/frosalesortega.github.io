# Personal academic website

Static site built with [Astro](https://astro.build) 5. All content lives in plain text files under `src/data/` and `src/content/`; the layout code never needs editing for routine updates.

## 1. Requirements and first run

Install Node.js 22 or newer (https://nodejs.org), then in this folder:

```bash
npm install      # once
npm run dev      # live preview at http://localhost:4321
npm run build    # production build into dist/
npm run preview  # serve the built site locally
npm run check    # verify publication keys, then every internal link in dist/ and dist-inst/ (build both first)
```

## 2. Configuration

| Setting | Where | Default |
|---|---|---|
| Public address of the site | environment variable `SITE_URL` | `https://frosalesortega.github.io` (production address) |
| Path prefix | environment variable `SITE_BASE` | `/` |
| Name, position, statement, email, address, profile links, menu | `src/data/site.yaml` | |

Internal links never contain a hard-coded path: they are built from `SITE_BASE`, so the same source works at the root of a domain and under `/~frosales/`.

## 3. Deployment

### A. Institutional server (static upload, under /~frosales/)

```bash
npm run build:institutional     # writes dist-inst/ for https://calmecac.inaoep.mx/~frosales/
```

Upload the **contents** of `dist-inst/` to the `~frosales` directory on the server. If the server lists directory indexes differently, make sure `index.html` files in sub-folders are served for URLs ending in `/`.

### B. GitHub Pages (main host)

The site is published at `https://frosalesortega.github.io/` from the repository `frosalesortega/frosalesortega.github.io` (Settings > Pages > Source: "GitHub Actions"). `.github/workflows/pages.yml` builds and publishes on every push to `main`, with `SITE_BASE=/` (user site served from the root). `SITE_URL` defaults to this address in `astro.config.mjs`; if the address ever changes (for example, a custom domain), edit it there and in the workflow.

### C. Institutional redirect

`deploy/institutional-redirect/index.html` (upload as `index.html` in `~frosales`) and `deploy/institutional-redirect/htaccess.txt` (upload as `.htaccess`) send the old address `https://calmecac.inaoep.mx/~frosales/` to the new site; the PINGS pages under `~frosales/pings/` are not redirected.

`netlify.toml` is kept only in case the site is ever hosted on Netlify again.

## 4. Updating content

**Publications.** `src/data/publications.bib` is the BibTeX export of the NASA-SciX (formerly ADS) library (library > Export > BibTeX), used as is. The "SciX" link of each entry is built from its bibcode (`https://scixplorer.org/abs/<bibcode>/abstract`); the `adsurl` field of the .bib is ignored. To update the list, export again and replace the file; entry keys are ADS bibcodes. The parser handles the ADS-style BibTeX format: braced surnames, journal macros such as `\mnras` and `\aap`, LaTeX accents, authors lists truncated with `et al.`, and `@INPROCEEDINGS` entries (shown under the "Conference proceedings" filter). Papers whose bibcode contains `.tmp.` are shown as "in press". Authors are shown as initials plus surname, your name in bold; lists longer than 8 names are shortened to the first three plus "et al.". Then edit `src/data/publications.yaml`:
- `selected`: list of keys marked with a star on the publications page and listed on the CV, in that order;
- `tags`: `key: [DESIRED, CALIFA]` to enable tag filters and show papers on project pages (a paper appears on a project page when its tag equals the project acronym, or when its key is in the project's `bibkeys`);
- `students`: surnames to mark with a dagger.
The list is sorted by year and month automatically. Keys used in `publications.yaml`, in `bibkeys` (projects), `paper` (software) and `related` (news) must exist in the `.bib` file: run `npm run check`, which fails and names any missing key (for example after a bibcode changes when a paper moves from `.tmp.` to its final bibcode).

**Home page text.** The intro paragraph is `intro` in `src/data/site.yaml` (the only source; `[text](/path/)` makes an internal link). The old About page is gone: `/about/` is a redirect to the home page, and research interests and affiliations are sections of `cv.yaml`.

**CV.** Edit `src/data/cv.yaml`. Each section has an `id`, a `title` and `items` with optional `label` (left column, e.g. years), `title`, `body` (simple HTML such as `<em>` and `<a>` allowed), `url`, and `slug` (a project page, e.g. `betis`). Add a new section by adding a new block; no code change is needed. `cv.yaml` mirrors `CV_Anthropic.tex` (final version, 20 November 2026). Update `metrics` (`total`, `refereed`, `firstAuthorRefereed`, citations, h-index, source, date) when you refresh the numbers: they feed the one-sentence metrics line shown at the top of /cv/ and /publications/. The list-specific counts on /publications/ (articles and proceedings in the library) are computed from the `.bib`. The owner's display name comes from `name` and `fullName` in `site.yaml` ("Rosales Ortega", no hyphen); author names inside publication entries are taken from the .bib and are not changed. Replace the downloadable PDF at `public/cv/CV_Rosales-Ortega.pdf`.

**News.** Copy `src/content/news/_TEMPLATE.md.txt` to `src/content/news/YYYY-MM-DD-short-slug.md` and fill in the header. Required: `date`, `title`, `category`, `summary`. Use `datePrecision: month` or `year` when the exact day is unknown. The home page shows the six most recent items. A thumbnail is optional (see Images).

**Projects.** One Markdown file per project in `src/content/projects/`; an optional `press:` list in the header (date, datePrecision, outlet, title, url, lang, kind) adds a "Press coverage" section to the project page; the file name becomes the URL (`desired.md` is `/research/desired/`). `status: active` places it under "Current"; `featured: true` shows it on the home page (first four by `order`); `blurb` is the short line on project cards (falls back to `summary`).

**Research themes.** `src/content/themes/` (title, order, summary, short text).

**Software.** One file per item in `src/content/software/`; list extra repositories under `otherRepos` in `site.yaml`.

**Outreach and science policy.** The Science Policy page is in Spanish and is edited through `src/data/policy.yaml` (including the `method` note under the charts). `src/data/outreach.yaml` and `src/data/policy.yaml` (`policy.yaml` has `intro`, `project.description`, `method`, `resources`, `threads` and `disclaimer`. Each thread takes `url`, an optional `archiveUrl` shown as "copia archivada", and an optional `note`). Extra personal-interest pages go in `src/content/pages/` (e.g. `zodiac.md` becomes `/outreach/zodiac/`); 

Anything not yet known should be written as `TO COMPLETE`; it is rendered in a muted style so it is easy to spot.

## 5. Images

All images are optional and found by file name; a missing file never breaks the build. Put files in `src/assets/`:

| What | File | Recommended size |
|---|---|---|
| Hero band on the home page | `src/assets/hero.jpg` | 2400 x 900 px JPEG, landscape, subject centred; darker images work best because the name is white text over a 35% dark overlay. Without the file the band is flat dark blue. |
| Project card and project-page banner | `src/assets/projects/<slug>.jpg` (e.g. `betis.jpg`) | 1200 x 800 px (3:2). Without it the card shows the acronym on a tinted block. |
| News thumbnail | `src/assets/news/<news-file-name-without-.md>.jpg` | 600 x 400 px |
| Portrait (home page and social preview) | `src/assets/portrait.jpg` | 900 x 1100 px, or square of at least 800 px. Shown uncropped. |
| Science-policy charts | `src/assets/policy/<name>.png` | any size; captions in `policy.yaml` under `gallery: [{file, caption}]` |

`.png`, `.jpeg` and `.webp` also work. A frontmatter `image: "../../assets/name.jpg"` (projects, news) wins over the file-name convention; `imageAlt` sets the alt text (default: "<Project> — image").

Credits: `heroCredit` in `src/data/site.yaml` (small caption at the bottom right of the hero) and `imageCredit` in a project's frontmatter (caption under the project banner).

## 6. Layout of the project

```
src/data/        site.yaml, cv.yaml, publications.bib/.yaml, outreach.yaml, policy.yaml
src/content/     news/, projects/, themes/, software/, pages/
src/pages/       one file per route
src/components/  Header, Footer, ProjectCard, PublicationItem, NewsItem, ...
src/lib/         url helper, BibTeX parser, data loaders
src/styles/      global.css (design tokens at the top)
scripts/         check-keys.mjs, check-links.mjs
```

The site makes no external requests (fonts are bundled) and has no analytics.
