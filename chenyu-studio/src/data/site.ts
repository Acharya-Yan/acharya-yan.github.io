export const site = {
  name: '严晨宇',
  romanName: 'Chenyu Yan',
  title: '严晨宇 · 线上工作室',
  description: '一张桌子，一个小小的线上空间。欢迎来看看严晨宇的工作室。',
  email: '', // 填入真实邮箱后，联系按钮自动启用。
  socials: [] as { label: string; url: string }[],
  showDrafts: true, // 对外发布时设为 false，隐藏尚未发布的内容。
  navigation: [
    { label: '工作室', href: '/' },
    { label: '作品', href: '/work/' },
    { label: '文字', href: '/notes/' },
    { label: '关于', href: '/about/' },
  ],
};

export const equipment = [
  { name: '主显示器与屏幕挂灯', description: '桌面中央，留给正在进行的事情。' },
  { name: '支架上的笔记本', description: '放在左手边，和主屏幕一起使用。' },
  { name: '键盘、平板与触控板', description: '白色桌面上的日常工具。' },
  { name: '双音箱与游戏主机', description: '按原来的位置，放在桌面两侧。' },
  { name: '相机与摄影灯', description: '转过身，镜头就在眼前。' },
];
