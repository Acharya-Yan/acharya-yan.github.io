# 严晨宇 · 个人网站

私有仓库：<https://github.com/Acharya-Yan/personal-website>

当前仅使用 GitHub 做私有版本管理，网站暂不公开发布。

正式网站位于 [chenyu-studio](chenyu-studio/README.md)，使用 Astro、React 和 TypeScript；[character-study](character-study/README.md) 为独立人物模型实验，仅保存源码与素材，不随网站部署。

## 本地开发

```sh
cd chenyu-studio
npm ci
npm run dev
```

首次克隆需要 Node.js 和 npm。项目内固定 Node.js 22.23.4；构建脚本使用项目内运行时，不修改系统 Node.js。

## 更新版本

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

推送 `main` 或创建拉取请求后，[GitHub Actions](https://github.com/Acharya-Yan/personal-website/actions) 自动安装锁定的依赖、进行类型检查并构建。检查结果和历史可在 Actions 查看，也可以手动运行工作流重新检查。

`main` 是主版本；较大改动可先创建分支，通过拉取请求合并。需要回退时使用 `git revert <提交编号>` 并推送，保留完整历史。

仓库为私有仓库。原始参考照片、`.env`、依赖、构建缓存和原 Sites 本地配置不提交。网站设计素材、字体许可证和模型实验随源码保存。

## 发布状态

`.github/workflows/check.yml` 仅包含检查和构建，不包含部署步骤；Pages 已关闭。后续仅在用户明确授权公开发布后，再配置托管和自动部署。

Astro 元数据与站点地图保留原有 Sites 域名配置，不代表网站已经上线。正式发布时，需要按最终托管地址更新 `chenyu-studio/astro.config.mjs` 和 `chenyu-studio/public/robots.txt`。

目前保留已有电脑端设计。手机适配及完整视觉、交互验收仍待后续处理。个人资料和联系方式的维护方式见 [内容指南](chenyu-studio/CONTENT_GUIDE.md)。
