# 严晨宇 · 个人网站

网站：<https://acharya-yan.github.io/>

仓库：<https://github.com/Acharya-Yan/Acharya-Yan.github.io>

正式网站位于 [chenyu-studio](chenyu-studio/README.md)，使用 Astro、React 和 TypeScript；[character-study](character-study/README.md) 为独立人物模型实验，仅保存源码与素材，不随网站部署。

## 本地开发

```sh
cd chenyu-studio
npm ci
npm run dev
```

首次克隆需要 Node.js 和 npm。项目内固定 Node.js 22.23.4；构建脚本使用项目内运行时，不修改系统 Node.js。

## 更新和发布

在仓库根目录执行：

```sh
git pull --ff-only
# 编辑网站后进行检查
cd chenyu-studio
npm run check
npm run build
cd ..
git status
git add <本次修改的文件>
git commit -m "描述这次修改"
git push origin main
```

推送 `main` 后，[GitHub Actions](https://github.com/Acharya-Yan/Acharya-Yan.github.io/actions) 自动安装锁定的依赖、进行类型检查、构建并部署 GitHub Pages。拉取请求只执行检查和构建；失败的检查不会发布。部署结果和历史可在 Actions 查看，也可以手动运行工作流重新部署。

`main` 是线上版本；较大改动可先创建分支，通过拉取请求合并。需要回退时使用 `git revert <提交编号>` 并推送，保留完整历史。

仓库为公开仓库。原始参考照片、`.env`、依赖、构建缓存和原 Sites 本地配置不提交。网站设计素材、字体许可证和模型实验随源码保留，访客站点只部署 `chenyu-studio/dist/`。

目前保留已有电脑端设计。手机适配及完整视觉、交互验收仍待后续处理。个人资料和联系方式的维护方式见 [内容指南](chenyu-studio/CONTENT_GUIDE.md)。
