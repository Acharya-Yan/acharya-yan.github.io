# 后续内容怎么填

## 简介、联系方式

编辑 `src/data/site.ts`。`email` 为空时不会生成假的联系链接；填入真实邮箱后自动启用邮件和复制功能。

```ts
email: '你的真实邮箱',
socials: [
  { label: '平台名称', url: 'https://你的真实链接' },
],
```

关于页正文位于 `src/pages/about.astro`。目前没有预设职业、学校、公司或工作履历。

## 添加作品

在 `src/content/work/` 新建一个 Markdown 文件，文件名就是链接的一部分。

```md
---
title: 项目名称
summary: 一句话说明这个项目
date: 2026-10-23
category: 项目类别
role: 你实际负责的事情
cover: /assets/你的封面.webp
coverAlt: 封面的文字描述
draft: true
featured: true
---

## 背景

写下项目的真实背景。

## 过程

介绍你的工作和选择。

## 结果

补充实际成果、截图和链接。
```

`featured: true` 会加入首页精选区；`draft: true` 明确显示进行中，并使详情页不被搜索引擎收录。`url` 可选，用于外部项目链接。

## 添加文章

在 `src/content/notes/` 新建 Markdown：

```md
---
title: 文章标题
summary: 一句话摘要
date: 2026-10-23
category: 随记
draft: false
---

正文从这里开始。

## 一个小标题

继续写作。
```

列表按日期倒序排列；二级标题自动形成文章目录。`/notes/文件名/` 是该文章的地址。补充完内容后重新运行 `npm run build`。

## 图像与字体

新图片放入 `public/assets/`。不要把身份证明、未经清理的个人照片或原始 RAW 文件直接放到公开资源目录。

原始桌搭照片保留在 `references/`，不被 Git 跟踪，也不会进入 `dist/`。

当前人物动作来自独立透明素材，人物图层替换时应保持 1448 × 1086 画布及相同位置，避免热点错位。相机图层已抬高，不能直接换回旧概念图的相机图层。
