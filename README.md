# Shreyash Wetal · Portfolio

My personal portfolio site: projects, experience, research and publications in
AI and computer vision.

**Live:** https://shreyashw32.github.io/shreyash_portfollio/

## Highlights

- An opening where small "agents" build the page as you scroll, with a skip button. It is off for visitors who ask their device for reduced motion.
- A moving background, depth on the photo and cards, and a floating section dock.
- Project filters (All, AI/LLM, Vision, Research), one-click copy for contact details and a CV download.
- Share previews for LinkedIn, X and Slack, structured data for search engines and a sitemap.

## Layout

| Path | What it is |
| --- | --- |
| `index.html`, `site/` | The built site that GitHub Pages serves |
| `og-image.jpg` | The 1200×630 image shown when the link is shared |
| `assets/Shreyash_Wetal_CV.pdf` | The CV behind the Résumé button |
| `sitemap.xml`, `robots.txt`, `.well-known/security.txt` | Files for crawlers and security contacts |
| `source/` | The React source (TanStack Start, Tailwind), made with Lovable |

## Run locally

```bash
python -m http.server 8000
# open http://localhost:8000/
```

## Tech

React 19, TanStack Start, Tailwind CSS and canvas animations. Hosted on GitHub Pages.
