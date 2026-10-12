# 迭代37 QA 检查报告

日期：2026-10-12  
基线：迭代36（独立复制开发，未覆盖迭代35/36）

## 本轮修改

1. **模型选择恢复为可配置**
   - DeepSeek 服务商仍预填官方地址 `https://api.deepseek.com`。
   - `deepseek-flash` 仅为默认预填模型；模型输入框明确允许玩家填写服务商账号支持的其他模型。
   - DeepSeek 请求的关闭思考模式设置独立于模型名称，不会把模型强制锁定为 Flash。
   - API 请求仍使用玩家填写的 `model` 字段，不会在请求阶段强制替换为默认值。

2. **再次提高输出上限**
   - 精简：1,500 tokens。
   - 标准：4,000 tokens。
   - 长篇：8,000 tokens。
   - 请求超时维持 120 秒。实际输出仍受服务商模型上限、上下文窗口、账号额度与网络情况影响；提高 `max_tokens` 不等于保证输出完整或更快。

3. **构建与缓存**
   - Service Worker 缓存版本更新至 `honmaru-sim-v40`。
   - 重新构建 `standalone.html`，大小 13,053,010 bytes；内联 JS 4,193,524 字符。

## 自动化检查

- `node tests.js`：**130 passed / 0 failed**。
- JavaScript 语法检查：`app.js`、`tests.js` 与 standalone 内联脚本通过。
- **10/10 runtime smoke 通过**，包含 API 多服务商流式模拟、非流式回退、DeepSeek 请求参数、上下文预算、音乐播放策略等。
- API 模拟测试确认：DeepSeek 默认模型可为 `deepseek-flash`，也可以通过同一请求函数传入 `deepseek-v4-pro` 等自定义模型名；标准模式 `max_tokens=4000`。
- ZIP CRC/完整性检查在打包后执行。

## 真实 API 测试边界

- 已尝试由当前运行环境直接请求 `https://api.deepseek.com/chat/completions`，但环境 DNS 解析失败，报错为 `Temporary failure in name resolution`。请求未能建立到 DeepSeek 的网络连接，因此无法验证真实 HTTP 状态、密钥鉴权、实际模型可用性、首 token 延迟、实际 SSE 输出或多轮角色扮演质量。
- 这不是 DeepSeek 返回的 API 错误，也不能据此判断密钥有效或无效。
- API Key 已在聊天中以明文形式出现，建议立即在 DeepSeek 官方平台撤销该密钥并创建新密钥。新密钥不要发进聊天，也不要放进源码、存档、QA 报告或 ZIP。
- 真实 API 验收仍需在具备网络连接的本地浏览器环境完成；本次报告不把模拟测试描述成真实服务商验收。
- 未完成真实 Chrome 页面交互和 Android 真机验收。
