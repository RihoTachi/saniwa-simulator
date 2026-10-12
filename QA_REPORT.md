# 迭代 24 QA 报告

## 自动化回归
- `node --check app.js`：通过。
- `node --check tests.js`：通过。
- `node tests.js`：80 项通过，0 项失败。
- `node runtime_smoke.js`：动态执行锻刀弹窗确认处理器，测试两组配方；成功创建锻刀队列、按 20/180 分钟记录时长并正确扣除资源，无运行错误。
- `build_single.py`：成功生成单文件 HTML。
- 从单文件 HTML 提取内联脚本后 `node --check /tmp/standalone24.js`：通过。
- ZIP 完整性由 `zipfile.testzip()` 检查。

## 迭代 24 改动
- 常规开局增加灵力测试场景，狐之助会根据审神者的灵力类型和具象化特征夸赞，并让玩家选择测试感受；相关事实进入狐之助专属记忆、本丸记忆和活动记录。后续本地对话与 API 提示词均可调用这段记忆。
- 刀剑男士显示独立的本丸显现顺序：常规开局初始刀固定第 1 振，后续显现依次递增；资深/随机开局先打乱初始阵容，再依随机后的顺序编号，后续显现继续递增。
- 加入缩放友好 CSS：限制横向溢出、改进小屏弹窗可滚动性，不通过缩放动作重建游戏状态。
- 资深回归任务选择后建立部门剧情线；后续随机事件继续推进该部门任务。
- 主页功能栏后加入「自由剧情设计」，可保存最多 5000 字的剧情设定；事件系统据此开启剧情线并根据选择触发后续。
- 新增本地/API 剧情生成模式。API 模式要求已配置可用 API；扩写失败自动回退本地模板，选项仍由程序状态机处理。
- 随机事件支持多阶段剧情标记，避免仅显示一次弹窗即结束。

## 测试边界
- 以上为源码回归、Node VM 动态处理器测试及单文件脚本语法检查。
- 当前运行环境无法可靠完成完整真实浏览器交互测试；不能据此宣称 Android 实机或真实 API 端到端测试已通过。
- API 扩写需要玩家自己的有效端点、模型、密钥和网络环境，本次未实际调用外部 API。


## Iteration 25 — Character-aware custom-story response
- Added keyword-aware involvement for Fox之助 when custom story content mentions Fox之助/狐狸/管狐 and suggests concealment, lies, altered records, secrets, incidents, or similar wrongdoing.
- The event includes Fox之助 as a participant, a visibly nervous opening reaction, choice-dependent response, and persistent memory. The follow-up carries the previous choice and can involve Fox之助 again.
- Added a local dialogue reaction when the player confronts Fox之助 about a custom story that involves the character. A separate smoke test confirms the guilt response triggers in a relevant context and does not trigger in an unrelated conversation.
- `node --check app.js`: PASS; `node --check tests.js`: PASS; `node tests.js`: 89 PASS / 0 FAIL; `node runtime_story_smoke.js`: PASS; `node runtime_smoke.js`: PASS; standalone embedded JS syntax: PASS.
- Browser end-to-end and real API integration were not verified in this run. Keyword rules are a deterministic local heuristic; complex implied guilt without explicit clues may still require API mode or more explicit story text.
