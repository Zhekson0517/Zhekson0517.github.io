# Academic Blog — LaTeX Style with Astro 5.x

A personal academic blog built with Astro 5.x, featuring LaTeX-style typography with Computer Modern fonts, KaTeX math rendering, and 13 built-in machine learning notes organized as chapters. Deploy to GitHub Pages with zero configuration.

## Quick Start

```bash
npm install
npm run dev
npm run build
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
  site: 'https://yourusername.github.io',
  base: '/',
});
```

## Add New Notes

Create a `.mdx` file in `src/content/notes/`:

```mdx
---
title: "Ch14. Your Note Title"
chapter: 14
slug: "ch14-your-note-slug"
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
- **Fonts**: Computer Modern loaded via CDN in `src/styles/global.css`
- **Colors**: CSS custom properties in `src/styles/global.css`
- **Dark mode**: Toggle via ☾/☀ button, persisted in localStorage

## Tech Stack

| Module | Technology |
|---|---|
| Framework | Astro 5.x (static output) |
| Content | Content Collections + MDX |
| Fonts | Computer Modern (CDN + fallback) |
| Math | remark-math + rehype-katex |
| Code | Shiki dual-theme (github-light / github-dark) |
| Deploy | GitHub Actions → GitHub Pages |
| RSS | @astrojs/rss |
| Sitemap | @astrojs/sitemap |

## Site Structure

```
/                   Home page with hero + latest chapters
/ml                 Machine Learning chapter index (Ch1–Ch13)
/ml/ch1-...         Individual chapter detail pages
/archive            Timeline archive by year/month
/tags               Tag cloud with filtering
/categories         Category aggregation
/about              About page
/404                Custom 404 page
/rss.xml            RSS feed
```

## Chapter List

| Ch | Title | Category |
|---|---|---|
| 1 | Linear Algebra Foundations for Machine Learning | Mathematics |
| 2 | Probability and Statistics for Machine Learning | Mathematics |
| 3 | Calculus and Optimization for Machine Learning | Mathematics |
| 4 | Linear Regression: Theory and Practice | Machine Learning |
| 5 | Logistic Regression and Classification | Machine Learning |
| 6 | Gradient Descent and Optimization Algorithms | Machine Learning |
| 7 | Regularization Methods: Preventing Overfitting | Machine Learning |
| 8 | Decision Trees and Ensemble Methods | Machine Learning |
| 9 | Support Vector Machines | Machine Learning |
| 10 | Model Evaluation and Selection | Machine Learning |
| 11 | Neural Network Fundamentals | Deep Learning |
| 12 | Convolutional Neural Networks | Deep Learning |
| 13 | Recurrent Neural Networks and LSTM | Deep Learning |

## Troubleshooting

- **npm install slow in China**: Run `npm config set registry https://registry.npmmirror.com`
- **Fonts not loading**: Check CDN connectivity; Georgia/Times New Roman will be used as fallback
- **Build errors**: Ensure Node.js >= 18.14.1

## Changelog

### v1.2.0 (2026-04-12)

- Reorganized ML notes under `/ml/` with chapter numbering (Ch1–Ch13)
- Fixed code syntax highlighting in both light and dark modes
- Removed Giscus (not configured on repo)
- Updated navigation: "Notes" → "Machine Learning"
- Updated all internal links from `/notes/` to `/ml/`

### v1.1.0 (2026-04-12)

- Fixed dark mode code block readability with Shiki dual-theme support
- Switched from single `github-light` to `{ light: 'github-light', dark: 'github-dark' }`
- Added CSS variable switching for `.astro-code` theme transitions

### v1.0.0 (2026-04-12)

- Initial release
- Astro 5.x with static output, MDX content collections
- LaTeX academic paper aesthetic with Computer Modern fonts
- KaTeX math rendering (remark-math + rehype-katex)
- 13 machine learning notes covering foundations to deep learning
- Dark mode with smooth transitions
- GitHub Actions auto-deployment to GitHub Pages
- RSS feed, sitemap, archive, tags, categories pages
