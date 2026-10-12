# 迭代36 QA 检查报告

日期：2026-10-12  
基线：迭代35（独立复制开发，未覆盖旧版）

## 本轮修改

1. **DeepSeek 官方 API 适配**
   - DeepSeek 服务商选项自动填入官方端点 `https://api.deepseek.com` 与指定模型 `deepseek-flash`。
   - DeepSeek 请求设置 `thinking: { type: "disabled" }` 和 `reasoning_effort: "none"`，以即时聊天回复为目标，不主动生成思考模式内容。
   - API 生成长度提高：精简 1,200、标准 2,800、长篇 5,000 tokens；请求超时由 90 秒调整为 120 秒。
   - OpenAI 兼容、Claude、Gemini 的原有流式适配和上下文/世界书检索逻辑保留。

2. **聊天风格与标点**
   - 系统提示强调聊天优先、通常 1—4 句、动作/心理描写点到为止；除非玩家要求长篇剧情，不要扩写成小说段落。
   - 强调正常中文标点，限制连续堆叠的感叹号/问号和无意义省略号；输出整理会收敛明显重复的标点。
   - 保留直接对话与书信文本的引号区分。

3. **构建与缓存**
   - Service Worker 缓存版本更新为 `honmaru-sim-v39`。
   - 重新构建单文件 `standalone.html`，文件大小约 13.05 MB；内联 JavaScript 通过 `node --check`。

## 自动化测试

- `node tests.js`：**130 passed / 0 failed**。
- `node --check app.js`、`tests.js`、API smoke、音乐 smoke 与单文件内联脚本：通过。
- **10/10 runtime smoke 通过**：锻刀、剧情反应、连续性、点击特效、移动端结束一天、人物目录重排、人物自主互动、记忆检索、API 性能与流式、BGM 自动播放策略。
- API smoke 使用模拟响应，已核对 DeepSeek 请求地址、`deepseek-flash` 模型名、关闭思考模式和标准长度 `max_tokens=2800`；并回归检查 OpenAI 兼容、Claude、Gemini 的 SSE 流式解析与不支持流式时的回退。

## 真实接口测试边界（请注意）

- **本轮没有向 DeepSeek 发送真实请求，也没有使用聊天中贴出的密钥。** 密钥已在聊天中暴露，建议先在 DeepSeek 官方平台撤销，再新建测试密钥。
- 当前结果验证的是客户端请求构造与模拟 SSE 行为，不代表真实账号鉴权、模型可用额度、CORS、服务端实际首 token 延迟或完整角色扮演质量已验收。
- 使用新密钥进行真实验收时，请在本地游戏的 API 配置弹窗内填写，不要把密钥写进项目源码、存档、QA 文件或 ZIP；测试后撤销临时密钥。
- 未完成真实 Chrome 页面交互和 Android 真机验收。
- API Key 在浏览器直连时仍可能被本机调试环境读取；公开部署应考虑服务端代理、限流与访问控制。
