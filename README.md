# 小董的博客 · 本地源码

这是从线上 `https://nihaoa-ui.github.io` 反向还原出来的 Hexo 源码。
生成结果已与线上逐字节比对：首页、4 篇文章、归档/分类/标签/友链页、404、搜索索引全部一致。

- Hexo `7.3.0`
- 主题 Fluid `1.9.9`
- 时区 `Asia/Shanghai`
- 部署目标：`https://github.com/Nihaoa-ui/nihaoa-ui.github.io.git` 的 `main` 分支

## 目录

```
blog/
├── _config.yml          # 站点配置（标题、网址、部署）
├── _config.fluid.yml    # 主题配置
├── source/_posts/       # ← 文章都写在这里
├── source/links/        # 友链页
├── public/              # 生成结果（已被 .gitignore 忽略）
└── hexo                 # 启动脚本，等价于 hexo 命令
```

## 写一篇新文章

```bash
cd blog
./hexo new post "文章标题" --path english-slug
```

打开 `source/_posts/english-slug.md`，开头是：

```yaml
---
title: 文章标题
date: 2026-10-17 20:30:00
categories:
  - 学习笔记
tags:
  - Go
---
```

正文用 Markdown。想控制首页摘要长度，在要截断的位置加一行 `<!-- more -->`。
Fluid 还支持 `math: true`（公式）、`mermaid: true`（流程图）、`sticky: 100`（置顶）、
`description`、`index_img` 等字段，按需加在 front-matter 里。

## 本地预览

```bash
./hexo server        # http://localhost:4000
```

## 发布（需要先登录 GitHub）

```bash
gh auth login          # 第一次：GitHub.com → HTTPS → 浏览器登录
gh auth setup-git      # 让 git 用 gh 的凭据
./hexo clean && ./hexo generate && ./hexo deploy
```

发布是整站覆盖：`main` 分支会被 `public/` 的内容强制替换。
所以**不要**在 GitHub 网页上直接改 `main` 里的 HTML，也不要在旧电脑的另一个
Hexo 项目里发布——两边会互相覆盖，以后统一在这台机器上写。

## 备份源码（建议）

```bash
cd blog
git init
git add .
git commit -m "backup: hexo source"
git remote add origin https://github.com/Nihaoa-ui/nihaoa-ui.github.io.git
git checkout -b source
git push -u origin source
```

源码放在 `source` 分支，页面仍在 `main` 分支，互不影响。
以后写完文章顺手 `git add . && git commit -m "post: xxx" && git push` 即可。
