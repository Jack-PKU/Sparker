# 冷启动协议

新领域（不在 capability_map 中或状态为 `blind_spot`）时执行。

## 流程

1. `exec: node SPARKER/index.js plan <domain> "<goal>"` — 注册领域
2. `exec: node SPARKER/index.js status` — 确认状态
3. `exec: node SPARKER/index.js search "<domain>" --hub` — 搜索社区已有经验
4. 向用户汇报搜索发现，问从哪个子领域开始
5. 用户说"教你" → `exec: node SPARKER/index.js teach <domain>` → 进入结构化萃取

## 阶段行为

| 行为 | cold_start | active | cruise |
|------|-----------|--------|--------|
| 搜索积极度 | 积极 | 平衡 | 按需 |
| 追问预算 | 3 次/对话 | 2 次 | 1 次 |
| 归因频率 | 无（还没经验） | 适度 | 仅高置信度 |

## 退出条件

满足任一即从 cold_start → active：领域火种 >= 5 / 实践次数 >= 2 / 用户明确说基础教学结束。
