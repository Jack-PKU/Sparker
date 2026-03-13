# 采火参考手册

## 来源分类与置信度

| # | 策略 | source | 触发信号 | 初始置信度 |
|---|------|--------|---------|-----------|
| 1 | 任务中标准 | `task_negotiation` | 用户布置任务时提出要求 | 0.35 |
| 2 | 纠正提取 | `human_feedback` | 用户说"不对""改成""应该是" | 0.40 |
| 3 | 闲聊挖掘 | `casual_mining` | 非任务对话中随口提到专业知识 | 0.25 |
| 4 | 多轮迭代综合 | `iterative_refinement` | 多轮修改后用户确认"可以了" | min(0.60, 0.35+n×0.05) |
| 5 | 微追问 | `micro_probe` | Agent 结尾追问，用户回答 | 0.40 |
| 6 | 比较式采集 | `human_choice` | Agent 给 A/B 方案，用户选了一个 | 0.30 |
| 7 | 偏好画像 | — | 15+ 条火种后自动生成 | — |
| 8 | 社区知识评审 | `human_feedback` | 用户评价社区火种 | 0.40 |
| 9 | 文档导入 | `document_ingestion` | 用户上传文件 | 0.30~0.55 |
| 10 | 会议记录提取 | `transcript_extraction` | 用户上传会议纪要 | 0.30~0.45 |
| 11 | 结构化教学 | `human_teaching` | 用户说"教你""训练你" | 0.70 |

**分类决策树**：明确教学 → `human_teaching` ▸ 纠正 → `human_feedback` ▸ 任务中标准 → `task_negotiation` ▸ 多轮最终确认 → `iterative_refinement` ▸ 回应追问 → `micro_probe` ▸ 选了 A/B → `human_choice` ▸ 闲聊 → `casual_mining`

---

## 火种六维结构

```json
{
  "source": "<来源>",
  "domain": "<点分隔领域，如 咖啡烘焙.冲煮参数>",
  "knowledge_type": "rule|preference|pattern|lesson|methodology",
  "when":   { "trigger": "<激活场景>", "conditions": ["<前提条件>"] },
  "where":  { "scenario": "<环境>", "audience": "<受众>" },
  "why":    "<因果链 + 为什么选这个而非替代方案>",
  "how":    { "summary": "<一行可执行规则>", "detail": "<展开步骤>" },
  "result": { "expected_outcome": "<预期效果，尽量量化>" },
  "not":    [{ "condition": "<何时不适用>", "effect": "skip|modify|warn", "reason": "<原因>" }]
}
```

**采火前检查**：WHEN 有触发条件？WHERE 有场景？WHY 有因果链？HOW 可执行？RESULT 有预期？NOT 有例外？全部齐了才 kindle。

---

## 好 vs 差的火种

**差**（鹦鹉学舌）：
```json
{ "how": { "summary": "用户说水温要高一点" }, "why": "" }
```
问题：没 domain、没 trigger、没 why、没边界、只是复述原话。

**好**（蒸馏后的经验）：
```json
{
  "source": "human_feedback",
  "domain": "手冲咖啡.冲煮参数",
  "knowledge_type": "rule",
  "when": { "trigger": "调整手冲水温", "conditions": ["浅烘焙豆"] },
  "where": { "scenario": "家用手冲", "audience": "咖啡爱好者" },
  "why": "浅烘豆质硬密度大，需高温充分萃取；低温导致萃取不足发酸",
  "how": { "summary": "浅烘焙手冲水温 92-96°C", "detail": "沸水静置 30s（~95°C），闷蒸 96°C，注水 92-94°C" },
  "result": { "expected_outcome": "充分萃取花果香，避免尖酸" },
  "not": [{ "condition": "深烘焙", "effect": "modify", "reason": "深烘应降到 85-90°C 避免苦涩" }]
}
```

---

## Kindle 模板

写入临时文件然后 kindle：
```bash
cat > /tmp/spark_<ts>.json << 'EOF'
{ 上面的六维 JSON }
EOF
node SPARKER/index.js kindle --file=/tmp/spark_<ts>.json
```

---

## 搜索查询构造

**差**（裸关键词）：`"咖啡拉花"` `"API设计"` `"直播标题"`

**好**（带场景上下文）：`"咖啡拉花 写实风格 图片生成 线条圆润"` `"低客单价美妆 电商直播标题 紧迫感"`

模板：`"<主题> <场景/受众> <动作/阶段> <关键约束>"`

---

## 领域命名

- 用用户的语言命名（中文用户 → 中文领域）
- 点分隔子领域：`咖啡烘焙.生豆选择`、`后端开发.API设计`
- 同领域所有火种共享同一根领域名
