# cooparobla.github.io

Personal developer site for **coopa** (cooparobla), home of
[toyengine](https://github.com/cooparobla/toyengine).

Plain static HTML, CSS and JS with no build step:

```
index.html        the page (icons are an inline SVG sprite at the top)
style.css         palette taken from toyengine's logo (toyengine/core/branding.h)
main.js           hero wave grid (canvas), scroll reveals, lightbox, copy button
assets/img/       toyengine screenshots and icon (copied from toyengine/docs/images)
assets/favicon.svg
.nojekyll         serve files as-is on GitHub Pages
```

## Run locally

```bash
python3 -m http.server 8000   # then open http://localhost:8000
```

## Deploy

GitHub Pages: push to `main` on `cooparobla/cooparobla.github.io`, then under
**Settings → Pages** choose *Deploy from a branch*, `main`, `/ (root)`. The site
appears at `https://cooparobla.github.io`.

Moving to a custom domain later: add a `CNAME` file containing the domain and point
DNS at GitHub Pages. Because everything is relative paths, the same files also work
unchanged on Netlify, Cloudflare Pages or any static host.

## Updating screenshots

```bash
cp ../toyengine/docs/images/*.jpg assets/img/
```
