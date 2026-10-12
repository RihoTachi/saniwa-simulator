# QA 报告：迭代 29

## 本轮变更
- 改进话题相关记忆检索：支持中文短语片段匹配；加入长期记忆摘要；检索结果标注匹配线索。
- 重要修正：时间新近度仅用于打破分数相近的排序，不再让所有近期对话都被误判为与当前话题相关。
- 无精确匹配时，只提供有限且明确标注为“背景参考”的事件/摘要；空查询仅回顾最多 3 条近期记录。
- 在角色扮演提示中明确记忆匹配不等于事实，优先参考更具体的原始事件记录，避免将背景线索当作确定事实。
- Service Worker 缓存升级至 `honmaru-sim-v32`。

## 测试结果
- `node --check app.js`：通过。
- `node --check tests.js`：通过。
- `node --check runtime_memory_retrieval_smoke.js`：通过。
- 话题记忆检索运行烟测：5 项通过，覆盖中文话题命中、排除无关近期记忆、显示匹配来源、未命中降级标注、空查询限制。
- `node tests.js`：103 项通过，0 项失败。
- `runtime_continuity_smoke.js`：通过，确认连续性提示、参与者、选择记忆、信息不确定性规则、话题检索、关系图谱及好感历史。
- `runtime_mobile_endday_smoke.js`：通过，确认游戏内确认、恰好推进一天、07:00 重置、奖励与日课重置。
- `runtime_smoke.js`：通过，锻刀资源扣除与队列运行烟测通过。
- `runtime_story_smoke.js`：通过。
- `node --check standalone-check-iter29.js`：通过。

## 未覆盖项
- 未使用真实 API Key 进行各服务商端到端调用。
- 未在真实 Android/vivo 浏览器设备上进行手工交互测试；运行烟测不是实机测试。
