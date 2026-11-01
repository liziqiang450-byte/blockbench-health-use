# 健康使用 Blockbench / Health Use Blockbench

一个把「健康使用手机」搬到 Blockbench 的本地优先使用统计插件：按项目记录建模 / 贴图 / 动画时长，提供可视化面板、使用日历、每日时长曲线、趣味时长评级与人工费计算器。界面支持 **简体中文 / 繁體中文 / English**，数据只保存在本机。

> 插件版本：v1.5.0 ｜ 适用：Blockbench 5.1+ 桌面版（含 Blockbench-Community 5.3.x）｜ 作者：圣起司

---

## 功能

- **四类时长统计**：按当前模式自动分桶（建模 / 贴图绘画 / 动画制作 / 其它），挂机时间单独统计
- **使用趋势**：最近 7 天堆叠柱 / 月历视图（每天时长 + 四类占比）/ 自安装日以来的每日曲线
- **健康评级**：7 档玩梗称号（摸鱼新星 → … → 另类上班 → 通宵预备役）+ 严肃健康提示，附久坐警告 / 夜猫子 / 明日请假标签；点徽章看完整标准
- **人工费计算**：全局时薪 + 项目覆盖 + 分类费率，支持取整与最低收费，一键复制报价单
- **项目视图**：当前项目、项目排行、模型标识符、每项目时薪覆盖
- **数据可迁移**：JSON 导出 / 导入（合并语义）；纯本地，不联网
- **三语界面**：简体中文 / 繁體中文 / English，跟随 Blockbench 语言或手动切换

## 安装

1. 下载 Release 里的 `health_use_blockbench.js`
2. Blockbench → **File → Plugins → Load Plugin from File**
3. 选中文件，确认；之后在 **Tools** 菜单打开「健康使用 Blockbench」

升级：覆盖 `health_use_blockbench.js` → Plugins 窗口点该插件的 **Reload**（或重启 Blockbench），数据保留。

## 反馈与联系

- 点子提供者 / 反馈：**哔哩哔哩 @圣起司** → <https://space.bilibili.com/18095414>
- GitHub Issues：本仓库的 Issue 区（bug / 建议都欢迎）
- 请附上：Blockbench 版本、系统、插件版本、复现步骤；有控制台报错最好一并贴上

## 隐私

所有统计数据保存在本机 `localStorage`，插件不发起任何网络请求，不上传任何信息。

## 开发

```
发布/health_use_blockbench.js   插件本体（单文件）
测试/harness.js                 Node 逻辑测试（node "测试/harness.js"）
文档/                           需求与实现状态
调研/                           技术调研与代码评审
```

测试需要 Node.js 18+；不需要安装依赖。

## License

MIT（见 `LICENSE`）。

---

## English summary

A local-first Blockbench usage tracker: per-project modeling / texturing / animation time, dashboard, calendar, daily curve, fun rating and labor-cost calculator. UI in Simplified Chinese, Traditional Chinese and English. All data stays local. Install via **File → Plugins → Load Plugin from File**.
