# 迭代 27 QA 报告：移动浏览器兼容、关系图谱与记忆检索

## 本轮重点修复
- **结束当天不再依赖浏览器原生 `window.confirm()`**：改为游戏内确认弹窗。部分浏览器/嵌入环境可能忽略原生确认对话框，MDN 也说明在某些情况下 `confirm()` 可能不会显示或会直接返回 `false`。来源：https://developer.mozilla.org/zh-CN/docs/Web/API/Window/confirm
- 结算按钮有防重复触发保护；日课结算、时间推进、日课重置、训练进度、界面刷新与存档写入按顺序执行。
- 即使结算后的随机事件生成失败，也保留已经开始的新一天，并提示玩家继续游玩；不会让随机事件错误阻断结算。
- 新增跨回合关系图谱：记录同一世界中实际共同参与事件的人物关系边；不把“资料相关角色”或“共同参与事件”擅自解释为亲密/敌对关系。
- 新增按当前对话主题检索相关记忆，除了最近时间顺序的记忆，还会匹配与用户当前输入有关的事件记忆、已知事实和对话。
- 好感度变化新增历史记录，提示词会带入近期阶段变化与原因；旧存档自动补齐相关字段。
- Service Worker 缓存升级至 `honmaru-sim-v30`，避免旧缓存继续提供旧逻辑。

## 自动化测试
- `node --check app.js`：通过。
- `node --check tests.js`：通过。
- `node --check runtime_mobile_endday_smoke.js`：通过。
- `node --check runtime_continuity_smoke.js`：通过。
- 独立 HTML 内联脚本 `node --check standalone-check.js`：通过。
- `node tests.js`：97 项通过，0 项失败。
- `node runtime_mobile_endday_smoke.js`：通过；模拟游戏内确认、推进一天、时间重置为 07:00、资源奖励、日课重置，并确认流程不调用原生 `confirm()`。
- `node runtime_continuity_smoke.js`：通过；验证相关记忆检索、关系图谱提示词、事实不确定性约束及好感度变化历史。

## 尚未完成的验证
- 当前环境没有在真实 vivo 浏览器/Android 设备上直接操作的能力，因此不能声称已经完成 vivo 实机验证。
- 未使用真实 API Key 做端到端模型测试；提示词改善不能保证所有模型每次都严格遵守。
- 建议用户在 vivo 浏览器中重新打开更新版，先试一次“结束模拟当天”；若仍失败，提供弹窗文字或页面表现，以便针对具体异常继续定位。
