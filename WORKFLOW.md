# 学术博客项目工作流文档

> 供其他 AI 或协作者参考，了解项目结构、约定和操作流程。

## 一、项目概览

- **框架**: Astro 5.x（静态输出模式 `output: 'static'`）
- **部署**: GitHub Pages（GitHub Actions 自动构建部署）
- **仓库**: `Zhekson0517/Zhekson0517.github.io`
- **线上地址**: <https://zhekson0517.github.io>
- **本地开发**: `npm install && npm run dev` → <http://localhost:4321>

## 二、技术栈

| 模块   | 技术                                    | 版本                  |
| ---- | ------------------------------------- | ------------------- |
| 核心框架 | Astro                                 | ^5.0.0              |
| 内容格式 | MDX                                   | @astrojs/mdx ^4.0.0 |
| 数学公式 | remark-math + rehype-katex            | ^6.0.0 / ^7.0.0     |
| 站点地图 | @astrojs/sitemap                      | ^3.2.0              |
| RSS  | @astrojs/rss                          | ^4.0.0              |
| 代码高亮 | Shiki 双主题（github-light / github-dark） | Astro 内置            |
| 中文字体 | Noto Serif SC (Google Fonts)          | —                   |

## 三、目录结构

```
src/
├── content.config.ts          # Content Collections 类型定义（全局唯一）
├── content/
│   └── notes/                 # 所有笔记 MDX 文件存放于此
│       ├── linear-algebra.mdx
│       ├── probability-statistics.mdx
│       ├── calculus-optimization.mdx
│       ├── linear-regression.mdx
│       ├── logistic-regression.mdx
│       ├── gradient-descent.mdx
│       ├── regularization.mdx
│       ├── decision-trees-ensemble.mdx
│       ├── svm.mdx
│       ├── model-evaluation.mdx
│       ├── neural-networks.mdx
│       ├── cnn.mdx
│       ├── rnn-lstm.mdx
│       └── transformer-attention.mdx
├── layouts/
│   ├── BaseLayout.astro       # 全局基础布局（导航+页脚+样式+暗模式+字体CDN）
│   └── NoteLayout.astro       # 笔记详情页布局（TOC+摘要+上下篇）
├── components/
│   ├── Header.astro           # 导航栏（含 Machine Learning 链接）
│   ├── Footer.astro           # 页脚
│   ├── NoteCard.astro         # 笔记卡片（列表页用）
│   ├── TOC.astro              # 目录侧边栏（滚动跟随高亮）
│   └── ThemeToggle.astro      # 明暗主题切换按钮
├── pages/
│   ├── index.astro            # 首页（个人学术主页）
│   ├── about.astro            # 关于页
│   ├── archive.astro          # 归档页（时间线）
│   ├── tags.astro             # 标签聚合页
│   ├── categories.astro       # 分类聚合页
│   ├── 404.astro              # 404 页
│   ├── rss.xml.js             # RSS 订阅
│   └── ml/
│       ├── index.astro        # ML 章节总览页（按分类分组展示）
│       └── [slug].astro       # 章节详情页（动态路由，slug 来自 frontmatter）
└── styles/
    ├── global.css             # 全局样式（字体+排版+动画+暗模式+打印）
    └── latex-theme.css        # LaTeX 风格专属样式
```

## 四、新增笔记操作流程

### 1. 创建 MDX 文件

在 `src/content/notes/` 下新建 `.mdx` 文件，文件名建议与 slug 保持一致。

**示例**: 新增 Ch15 → 创建 `src/content/notes/generative-models.mdx`

### 2. Frontmatter 规范（必填，严格遵循）

```yaml
---
title: "Ch15. Generative Models"             # 必须以 ChN. 开头
chapter: 15                                   # 章节编号，整数
slug: "ch15-generative-models"                # URL 标识，格式 chN-名称
publishedAt: "2026-04-12"                     # 发布日期 YYYY-MM-DD
updatedAt: "2026-04-12"                       # 更新日期 YYYY-MM-DD
category: "Deep Learning"                     # 分类（现有：Mathematics / Machine Learning / Deep Learning）
tags: ["generative models", "VAE", "GAN", "deep learning"]  # 标签数组
abstract: "A comprehensive study of generative models covering VAE, GAN, and diffusion models."  # 摘要
keywords: ["VAE", "GAN", "diffusion", "generative"]  # 关键词
---
```

**⚠️ 关键规则**:

- `chapter` 必须是整数，且不能与现有章节重复
- `slug` 格式必须为 `chN-xxx`，这决定了 URL 路径 `/ml/chN-xxx/`
- `title` 必须以 `ChN.` 开头
- `category` 必须是 `Mathematics`、`Machine Learning` 或 `Deep Learning` 之一（或新增分类）

### 3. 正文结构规范

每篇笔记必须包含以下学术结构：

```mdx
## Introduction
（引言，说明主题和重要性）

## 理论基础 / Theoretical Foundations
（核心理论 + LaTeX 公式推导）

## 算法原理 / Algorithm Details
（算法细节 + 更多公式）

## Python Implementation
（完整可运行代码，基于 NumPy/scikit-learn/PyTorch）

## Experiments / Discussion
（实验说明或讨论）

## Summary
（要点总结，3-5 条）

## References
（学术引用列表，编号格式）
```

### 4. LaTeX 公式语法

- **行内公式**: `$E = mc^2$`
- **行间公式**:
  ```
  $$
  \mathcal{L}(\theta) = -\frac{1}{N}\sum_{i=1}^{N} y_i \log \hat{y}_i
  $$
  ```
- **多行对齐**:
  ```
  $$
  \begin{aligned}
  \nabla_\theta \mathcal{L} &= \frac{\partial \mathcal{L}}{\partial \theta} \\
  &= \frac{1}{N}\sum_{i=1}^{N} (\hat{y}_i - y_i) \mathbf{x}_i
  \end{aligned}
  $$
  ```

### 5. 代码块

使用标准 Markdown 代码块，标注语言：

````markdown
```python
import numpy as np
# 代码实现
```
````

### 6. 中文内容

项目支持中文内容。中文标题和正文会自动使用 Noto Serif SC 字体渲染。示例：Ch14「Transformer 与注意力机制」即为全中文笔记。

## 五、关键配置文件说明

### astro.config.mjs

```js
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import remarkMath from 'remark-math';       // 必须显式导入，不能用字符串
import rehypeKatex from 'rehype-katex';     // 同上

export default defineConfig({
  site: 'https://zhekson0517.github.io',   // GitHub Pages 地址
  base: '/',                                // 仓库名为 xxx.github.io 时为 '/'
  output: 'static',                         // 纯静态输出，禁止 SSR
  integrations: [mdx(), sitemap()],
  markdown: {
    remarkPlugins: [remarkMath],            // 数学公式解析
    rehypePlugins: [rehypeKatex],           // KaTeX 渲染
    shikiConfig: {
      themes: {
        light: 'github-light',              // 亮色主题
        dark: 'github-dark',                // 暗色主题
      },
      wrap: true,
    },
  },
});
```

**⚠️ 注意**:

- `remarkPlugins` 和 `rehypePlugins` 必须使用显式 `import` 导入，不能写字符串如 `'remark-math'`，否则 MDX 集成会报警告且公式不渲染
- Shiki 使用双主题模式，亮色用 inline `color` 样式，暗色用 `--shiki-dark` CSS 变量，通过 `[data-theme="dark"]` 选择器切换

### src/content.config.ts

```ts
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const notes = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/notes' }),
  schema: z.object({
    title: z.string(),
    chapter: z.number(),
    slug: z.string(),
    publishedAt: z.string(),
    updatedAt: z.string(),
    category: z.string(),
    tags: z.array(z.string()),
    abstract: z.string(),
    keywords: z.array(z.string()),
  }),
});

export const collections = { notes };
```

**⚠️ 注意**: 这是 Astro 5.x 的 Content Layer API，使用 `glob` loader。旧版的 `src/content/config.ts` 方式已废弃。

### .github/workflows/deploy.yml

- 触发条件: push 到 `main` 分支
- 流程: Node 20 → npm ci → npm run build → 部署到 GitHub Pages
- 权限: `contents: read`, `pages: write`, `id-token: write`
- 无需手动修改，fork 即用

## 六、样式约定

### 字体体系

| 用途    | 字体                                                                | CSS 变量         |
| ----- | ----------------------------------------------------------------- | -------------- |
| 正文    | Computer Modern Roman → Noto Serif SC → Georgia → Times New Roman | `--font-serif` |
| 标题/导航 | Computer Modern Sans → Noto Serif SC → Helvetica → Arial          | `--font-sans`  |
| 代码    | Computer Modern Typewriter → Courier New                          | `--font-mono`  |

**中文字体说明**: Noto Serif SC（思源宋体）通过 Google Fonts CDN 加载，在 `BaseLayout.astro` 中引入。当 Computer Modern 字体不包含中文字符时，浏览器自动回退到 Noto Serif SC，确保中文标题和正文均使用宋体渲染，符合中文学术排版规范。

### 配色

| 元素   | 明模式       | 暗模式       |
| ---- | --------- | --------- |
| 背景   | `#ffffff` | `#121212` |
| 正文   | `#121212` | `#f0f0f0` |
| 标题   | `#000000` | `#ffffff` |
| 强调色  | `#003366` | `#6699cc` |
| 代码背景 | `#f5f5f5` | `#1a1a1a` |

### 排版规范

- 正文 12pt，行高 1.6
- 内容区最大宽度 960px
- 段首缩进 2em（CSS 变量 `--indent-paragraph`）
- 摘要区使用 `.abstract` 类（居中、缩进、Abstract 标签）

### 代码高亮

- Shiki 双主题：亮色 `github-light`，暗色 `github-dark`
- 亮色模式：Shiki 直接输出 inline `color` 样式，无需 CSS 覆盖
- 暗色模式：通过 `[data-theme="dark"] .astro-code span { color: var(--shiki-dark) !important; }` 切换
- **⚠️ 不要使用** **`--shiki-light`** **CSS 变量**，Shiki 双主题输出中不存在此变量，使用会导致高亮丢失

## 七、部署流程

```bash
# 1. 本地验证
npm run build   # 确保零错误

# 2. 提交推送
git add .
git commit -m "Add new note: ch15-generative-models"
git push origin main

# 3. GitHub Actions 自动构建部署（约 1-2 分钟）
# 查看进度: https://github.com/Zhekson0517/Zhekson0517.github.io/actions
```

## 八、常见问题

| 问题            | 原因                                     | 解决                                                       |
| ------------- | -------------------------------------- | -------------------------------------------------------- |
| MDX 中公式不渲染    | 插件用字符串导入                               | 改为 `import remarkMath from 'remark-math'` 显式导入           |
| RSS 构建报错      | `.js` 文件中用了 TS 语法                      | `rss.xml.js` 中不能用 `import type` 或类型注解                    |
| 新笔记不显示        | frontmatter 字段缺失/类型错误                  | 对照 `content.config.ts` 的 schema 检查                       |
| npm install 慢 | 国内网络                                   | `npm config set registry https://registry.npmmirror.com` |
| SSL 证书错误      | 代理/网络问题                                | 用 SSH 方式: `git remote set-url origin git@github.com:...` |
| 暗模式代码块不适配     | Shiki 主题固定                             | 需要在 `[data-theme="dark"]` 下覆盖 `.astro-code` 样式           |
| 代码高亮全部丢失      | CSS 使用了不存在的 `--shiki-light` 变量         | 亮色模式不要覆盖，让 Shiki inline 样式生效                             |
| 中文标题字体丑       | Computer Modern Sans 无中文，回退到 Helvetica | 已添加 Noto Serif SC 到字体栈                                   |
| Giscus 报错     | 未在仓库安装 Giscus                          | 已移除 Giscus 组件，如需评论功能需重新配置                                |

## 九、个人信息修改清单

需要修改个人信息时，编辑以下文件：

| 信息        | 文件                                                           |
| --------- | ------------------------------------------------------------ |
| 姓名/身份/简介  | `src/pages/index.astro`                                      |
| 学术背景/联系方式 | `src/pages/about.astro`                                      |
| 导航栏标题     | `src/components/Header.astro`                                |
| 页脚版权      | `src/components/Footer.astro`                                |
| GitHub 链接 | `Header.astro`, `Footer.astro`, `about.astro`, `index.astro` |
| RSS 标题/描述 | `src/pages/rss.xml.js`                                       |
| 站点 URL    | `astro.config.mjs` 的 `site` 字段                               |

