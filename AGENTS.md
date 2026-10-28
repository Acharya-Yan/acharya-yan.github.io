# 项目协作约定

- 正式网站源码位于 `chenyu-studio/`；`character-study/` 是独立人物模型实验，随仓库保存但不部署到网站。
- 使用私有 GitHub 仓库 `https://github.com/Acharya-Yan/personal-website` 做版本管理，默认分支为 `main`。
- 用户于 2026-10-28 明确选择“使用私有仓库，暂不公开”。推送 `main` 只执行 GitHub Actions 检查与构建，不发布网站。不要将仓库改为公开，也不要启用 Pages 或添加发布工作流，除非用户之后明确授权公开发布。
- 完成用户要求的修改后，先在 `chenyu-studio/` 运行 `npm run check` 和 `npm run build`，检查变更，再提交并推送到 GitHub。不要提交未通过验证的改动；遇到推送冲突时先检查远端变更，不使用强制推送。
- 本地参考照片、环境变量、依赖、构建产物和原 Sites 身份配置由 `.gitignore` 排除，不加入仓库。源码、漫画素材、制作提示词和人物模型保存在私有仓库。
- 用户已于 2026-10-24 停用并卸载 memmy-memory。不要使用、调用、安装或重新启用 memmy-memory，也不要连接 Memmy 服务。除非用户之后明确要求恢复，否则使用当前对话和普通本地文件保存上下文。
