# cooparobla.github.io

Developer site for **coopa** (cooparobla): render and game engine engineering.

Plain static HTML, CSS and JS with no build step:

```
index.html                    home: hero, projects, principles
projects/toyengine/index.html toyengine project page
projects/mapcoopa/index.html  mapcoopa project page
style.css                     shared styles (dark greys, violet accents)
main.js                       hero wave grid (canvas), scroll reveals, lightbox, copy buttons
assets/icons.svg              shared icon sprite: <svg><use href="…/assets/icons.svg#i-name"/></svg>
assets/img/<project>/         screenshots, copied from each project's docs/images
assets/favicon.svg
.nojekyll                     serve files as-is on GitHub Pages
```

All paths are relative, so the site works at a domain root or under a sub-path.

## Adding a project

1. Copy `projects/mapcoopa/` to `projects/<name>/` and rewrite its content.
2. Put screenshots in `assets/img/<name>/`.
3. Add a card to the `.projects` grid in `index.html`.
4. Add a `nav-proj` link to the nav on every page, and update the pager links at the
   bottom of the neighbouring project pages.

## Docs

`docs/` holds the API references for toyengine and its libraries, generated with
[coopadocs](https://github.com/cooparobla/coopadocs). `docs/index.html` is the hand-written hub
page; `docs/<repo>/` folders are generated and committed.

Prerequisites: `coopadocs` and `toyengine` (with submodules) cloned next to this repo (override
with `COOPADOCS_DIR` / `TOYENGINE_DIR`), Doxygen (`brew install doxygen`) and Python 3.12+ from
python.org or Homebrew. The script makes its own venv in `.venv-docs/` on first run.

```bash
scripts/build-docs.sh                 # rebuild every reference
scripts/build-docs.sh mapcoopa caml   # rebuild only these
git add docs && git commit -m "Update API docs"
```

## Run locally

Serve the folder with any static file server (the icon sprite doesn't load over `file://`),
for example `python3 -m http.server 8000`, then open http://localhost:8000.

## Deploy

GitHub Pages: push to `main` on `cooparobla/cooparobla.github.io`, then under
**Settings → Pages** choose *Deploy from a branch*, `main`, `/ (root)`. The site
appears at `https://cooparobla.github.io`.

For a custom domain later, add a `CNAME` file containing the domain and point DNS at
GitHub Pages. The same files also work unchanged on Netlify, Cloudflare Pages or any
static host.
