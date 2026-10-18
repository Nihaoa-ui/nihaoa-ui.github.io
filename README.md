# 风尽起长歌 · 本地源码

站点标题：**风尽起长歌**。源码最初从线上 `https://nihaoa-ui.github.io` 反向还原，现已换成自建的「索引卡」版式。
生成结果已与线上逐字节比对：首页、4 篇文章、归档/分类/标签/友链页、404、搜索索引全部一致。

- Hexo `7.3.0`
- 主题：自建 `themes/paper`（墨色首屏 + 波浪落纸 + 索引卡 + 文章目录；Fluid `1.9.9` 仍装着，把 `_config.yml` 的 `theme` 改成 `fluid` 可切回）
- 时区 `Asia/Shanghai`
- 部署目标：`https://github.com/Nihaoa-ui/nihaoa-ui.github.io.git` 的 `main` 分支

## 目录

```
blog/
├── _config.yml          # 站点配置（标题、网址、部署）
├── _config.fluid.yml    # Fluid 主题配置（备用）
├── themes/paper/        # 当前主题：模板 + CSS 都在这里
├── source/_posts/       # ← 文章都写在这里
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
想让某篇文章上首页大标题，在 front-matter 加 `featured: true`（不加则默认取最新一篇）。

## 本地预览

```bash
./hexo server        # http://localhost:4000
```

## 发布

```bash
./hexo clean && ./hexo generate && ./hexo deploy
```

这台 Mac 的 GitHub 凭据已经存在钥匙串里，可以直接推；如果哪天提示认证失败，再跑：

```bash
gh auth login && gh auth setup-git
```

发布是整站覆盖：`main` 分支会被 `public/` 的内容强制替换。
所以**不要**在 GitHub 网页上直接改 `main` 里的 HTML，也不要在旧电脑的另一个
Hexo 项目里发布——两边会互相覆盖，以后统一在这台机器上写。

## 备份源码

`source` 分支已经推到 GitHub，源码有备份了。以后写完文章：

```bash
git add . && git commit -m "post: xxx" && git push
```

源码在 `source` 分支，页面在 `main` 分支，互不影响。换电脑时 `git clone -b source` 就能找回全部源码。
