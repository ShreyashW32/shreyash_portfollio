# Shreyash Wetal · Portfolio

My personal portfolio site: projects, experience, research and publications in
AI and computer vision.

**Live:** https://shreyashw32.github.io/shreyash_portfollio/

## Highlights

- An opening where small "agents" build the page as you scroll, with a skip button. It is off for visitors who ask their device for reduced motion.
- A giant outlined wordmark, a moving op-art background, depth on the photo and cards, and a floating navigation pill that tracks the section in view.
- Flagship Deployments led by **Eva**, my AI phone agent for Australian trades ([heareva.com](https://heareva.com)), with a clickable 7-layer call stack.
- The Systems Matrix: every other project, with filters.
- One-click email copy, a CV download, share previews for LinkedIn, X and Slack, structured data for search engines and a sitemap.

## Layout

| Path | What it is |
| --- | --- |
| `index.html`, `site/` | The built site that GitHub Pages serves |
| `og-image.jpg` | The 1200×630 image shown when the link is shared |
| `assets/Shreyash_Wetal_CV.pdf` | The CV behind the Résumé button |
| `sitemap.xml`, `robots.txt`, `.well-known/security.txt` | Files for crawlers and security contacts |
| `source/` | The React source (TanStack Start, Tailwind), made with Lovable |
| `build-static/` | Builds `source/` into the static site at the root |

Page content (projects, Eva, experience) lives in `source/src/data/profile.ts`; the layout is in `source/src/components/home.tsx`.

## Rebuild after editing the source

```bash
cd build-static
npm install      # first time only
npm run build    # writes index.html and site/ at the repo root
```

## Run locally

```bash
python -m http.server 8000
# open http://localhost:8000/
```

## Tech

React 19, TanStack Start, Tailwind CSS and canvas animations. Hosted on GitHub Pages.
