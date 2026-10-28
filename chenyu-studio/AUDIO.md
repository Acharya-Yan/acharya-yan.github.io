# 收藏墙音乐

收藏墙已接入一个共享的原生音频播放器：点击封面播放，再次点击暂停；切换歌曲停止上一首。支持进度、结束、加载失败与重试。音乐不改变观看视角。

## 当前状态

三首歌的音频尚未取得。2026-10-28 尝试搜索官方音源、读取 Apple 音乐目录及芒果 TV 节目页时，网络工具连接失败，浏览器访问的自动权限审批超时。因此 `public/audio/tracks.json` 中三项保留 `null`，页面会明确提示暂时无法播放，并提供此前核对过的官方收听页面；不使用虚假的播放进度或用其他版本代替。

## 接入音频

将可用于网站的音频放入 `public/audio/`，或者使用允许网页直接播放的稳定 HTTPS 音频链接，在 `public/audio/tracks.json` 配置。例如：

```json
{
  "cai-er-shi-san": { "src": "/audio/cai-er-shi-san.mp3" },
  "hua-hai": { "src": "/audio/hua-hai-live.mp3" },
  "skinny-love": { "src": "/audio/skinny-love.mp3" }
}
```

`src` 必须指向实际音频文件，不能使用歌曲网页、需要登录的链接或临时签名链接。如果使用官方试听片段，应补充 `"label": "试听片段"`，页面会显示这一标记。播放器只在点击后开始播放，不在加载页面时播放。

## 版本及官方页面

- 方大同《才二十三》：[Apple Music](https://music.apple.com/us/album/1762980605)。
- 龚琳娜／美依礼芽《花海》：《乘风 2023》现场版本，[芒果 TV 节目页](https://w.mgtv.com/b/542234/18873338.html?lang=zh-cn)。
- 丁世光《瘦子（Skinny Love）》：[Apple Music](https://music.apple.com/cn/album/1733590258)。

不通过公开仓库存储访问凭证。运行检查和构建后再提交音源配置。
