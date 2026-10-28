# 严晨宇 · 线上工作室

白底黑色漫画工作室，Astro + React + TypeScript + Motion。当前保留电脑端实现，使用公开 GitHub 仓库做版本管理，通过 GitHub Pages 发布网站。

网站：<https://acharya-yan.github.io/>。仓库、更新步骤与发布说明见[根目录 README](../README.md)。

另有独立的 Three.js **360° 空间实验版**：`/space/`，原版 `/` 保留。支持完整环绕、相机和桌面视角、人物与屏幕点击、镜头靠近和详情侧栏。使用方式与实现边界见 [SPACE.md](SPACE.md)。

## 启动与构建

```sh
cd '/Users/acy/personal website/chenyu-studio'
npm install
npm run dev
```

开发地址由 Astro 输出。`npm run check` 执行类型检查，`npm run build` 生成 `dist/`，`npm run preview` 可在用户需要时查看构建产物。

项目在 devDependencies 内固定 Node 22.23.4，脚本使用项目内 Node，不修改系统运行时。第一次安装仍需要系统 npm。Astro 遥测在启动包装脚本中关闭。

## 已实现

- 首页的分层漫画工作室：人物、桌搭、相机、摄影灯四个独立图层；相机已升到人物视线附近。
- 人物眨眼与细微动态，鼠标小幅视差，离屏暂停、手动暂停与减少动态效果支持。
- 主屏幕 / 笔记本 / 人物 / 手机的语义导航热点，悬停或聚焦显示标签；控制栏可展开提示。
- 相机局部取景模式，返回按钮、Escape 退出和焦点恢复；不访问用户摄像头。
- 摄影灯开关、重置控制；加载失败时回退至完整插画，文字导航仍可用。
- `/work/` 作品目录与 `/work/online-studio/` 当前项目的真实制作说明。
- `/notes/` 文字目录及 Markdown 文章详情模板。尚无文章，显示空状态。
- `/about/` 自我介绍框架与可展开的桌搭说明。
- 联系区：未填邮箱时显示待补状态；填入邮箱后自动显示邮件链接和复制按钮。
- 404、基本分享信息、站点地图、键盘焦点样式、Astro 页面切换。

## 内容维护

详见 [CONTENT_GUIDE.md](CONTENT_GUIDE.md)。

- 个人信息与导航：`src/data/site.ts`
- 项目：`src/content/work/*.md`
- 文章：`src/content/notes/*.md`
- 字段约束：`src/content.config.ts`
- 场景行为：`src/components/Studio.tsx`
- 样式与桌面适配：`src/styles/global.css`
- 原始生成素材与完整提示词：`asset-sources/`、`concepts/`
- 实际网页图片与字体：`public/assets/`、`public/fonts/`

中文字体是本地生成的 349 字子集，新增内容中不包含的字符会使用系统中文字体。可运行 `scripts/subset-font.py` 在本地重新生成，脚本依赖 FontTools 和 Brotli，不发送内容到字体服务。

## 验证记录与当前边界

2026-10-23 的实现按用户要求仅覆盖电脑端，未进行浏览器视觉验收、交互验收和手机适配。此次 GitHub 部署继续保留这些待办。

2026-10-23：`npm run check` 通过（16 个文件，0 错误、0 警告、0 提示）；`npm run build` 成功生成 6 个页面及站点地图，产物位于 `dist/`。构建期间的 notes 集合为空提示对应尚未提供文章的正常空状态，不影响构建。依赖安装审计报告为 0 个已知漏洞。以上为编译结果，不代表浏览器视觉或交互验收。

2026-10-28：用户明确授权公开仓库并使用 GitHub Pages 发布，仓库改为 `Acharya-Yan/acharya-yan.github.io`。站点元数据和站点地图使用 `https://acharya-yan.github.io/`；自动检查与发布工作流位于根目录 `.github/workflows/check.yml`。`.openai/hosting.json` 仅在本地保留原 Sites 配置，不提交到 GitHub，也不用于当前发布。

作品、履历、文章和联系方式仍需真实内容。当前仅“我的线上工作室”这一正在制作的项目有内容，其状态明确标记为进行中。`site.showDrafts` 当前为 true；对外发布时可改成 false，并将需要展示的 Markdown 设置为 `draft: false`。

素材由内置 image_gen 工具根据用户提供的照片及批准稿生成，字体为 SIL OFL 授权，自托管许可证随资源保留。
