# 纸上工作室

运行 `npm run dev`，访问 http://127.0.0.1:4321/space/ 。原版首页仍在 `/`。

这是 2.5D 分层插画空间，不是完整房间模型。左右拖动（±12°）、轻微上下（±3°）、滚轮缩放，或用底部全景/相机/桌面按钮切换。人物、主屏和笔记本可以点击；侧栏关闭或 Esc 返回。

实现：`src/lib/space/illustrated.ts`。界面：`src/components/SpaceExperience.tsx`。样式：`src/styles/space.css`。图层沿用 `public/assets/{desk,avatar,camera,lamp}.webp`。

旧 `src/lib/space/scene.ts` 和模型模块只作实验存档，新页面没有导入它们。更多设计决策见 PLAN.md。
