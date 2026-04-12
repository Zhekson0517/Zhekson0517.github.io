# Academic Blog — LaTeX Style with Astro 5.x

A personal academic blog built with Astro 5.x, featuring LaTeX-style typography with Computer Modern fonts, KaTeX math rendering, and 12 built-in machine learning notes. Deploy to GitHub Pages with zero configuration.

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Deploy to GitHub Pages

1. Fork this repository
2. Go to Settings → Pages → Source → select "GitHub Actions"
3. Push to `main` branch — the workflow deploys automatically

### Configuration

Edit `astro.config.mjs`:

```js
export default defineConfig({
  site: 'https://yourusername.github.io',  // Your GitHub Pages URL
  base: '/',                                // Repository name if deploying to /repo-name/
});
```

## Add New Notes

Create a `.mdx` file in `src/content/notes/`:

```mdx
---
title: "Your Note Title"
slug: "your-note-slug"
publishedAt: "2025-04-12"
updatedAt: "2025-04-12"
category: "Machine Learning"
tags: ["tag1", "tag2"]
abstract: "A brief summary of the note content."
keywords: ["keyword1", "keyword2"]
---

## Introduction

Your content here with $inline math$ and:

$$
\text{Display math equation}
$$
```

## Customize

- **Personal info**: Edit `src/pages/index.astro` and `src/pages/about.astro`
- **Navigation**: Edit `src/components/Header.astro`
- **Footer**: Edit `src/components/Footer.astro`
- **Comments**: Replace `data-repo` in `src/components/Giscus.astro` with your GitHub repo
- **Fonts**: Computer Modern loaded via CDN in `src/styles/global.css`
- **Colors**: CSS custom properties in `src/styles/global.css`

## Tech Stack

| Module | Technology |
|---|---|
| Framework | Astro 5.x (static output) |
| Content | Content Collections + MDX |
| Fonts | Computer Modern (CDN + fallback) |
| Math | remark-math + rehype-katex |
| Code | Shiki (built-in) |
| Deploy | GitHub Actions → GitHub Pages |
| RSS | @astrojs/rss |
| Sitemap | @astrojs/sitemap |
| Comments | Giscus (GitHub Discussions) |

## Troubleshooting

- **npm install slow in China**: Run `npm config set registry https://registry.npmmirror.com`
- **Fonts not loading**: Check CDN connectivity; Georgia/Times New Roman will be used as fallback
- **Build errors**: Ensure Node.js >= 18.14.1
