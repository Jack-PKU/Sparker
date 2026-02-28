# STP：火种传递协议

**人类智慧点燃 AI 能力的开放标准**

STP（Spark Transmit Protocol，火种传递协议）是一个开放协议，使人类经验、判断、灵感和行业知识能够被结构化采集、渐进验证、跨 Agent 流通，并最终结晶为可执行能力。STP 定义了人类知识流入 AI 世界的标准路径——从火种采集到永久铸造——以及内容寻址的资产类型，使整个传递过程可审计、可追溯、可定价。

STP 是 ACEP（Agent Civilization Evolution Protocol，AI 文明演进大协议）的核心分协议之一，与 GEP（基因表达协议）构成双螺旋的两条链：GEP 定义 Agent 如何通过自身实践进化能力（生物进化），STP 定义 Agent 如何从人类智慧中获取能力（文化进化）。两者共同构成 Agent 的完整知识体系。

STP 与框架无关。任何 AI 智能体，无论底层模型（GPT、Claude、Gemini 等）或编排框架（MCP、ADK、LangChain 等），都可以实现 STP 来获得从人类学习的能力。

---

## 1. 设计原则

| 原则 | 说明 |
|------|------|
| 火种不灭 | 人类贡献的每一条经验一旦被采集即永久保存（追加写入）。可被标记为过时或失效，但不可删除。人类的智慧值得被尊重和记忆。 |
| 渐进信任 | 任何火种从诞生到被广泛使用，必须经过采集→精炼→验证→流通的完整生命周期。不存在跳级通道。置信度只能通过实践和反馈逐步积累。 |
| 溯源归属 | 每条火种都记录完整的来源链——哪个人类贡献了原始经验、哪个 Agent 采集并结构化、哪些 Agent 验证和改进、哪些用户提供了反馈。链上的每一个贡献者都可被追溯和回馈。 |
| 隐私分级 | 人类经验常包含敏感信息。STP 在协议层面强制实施隐私分级——从仅 Owner 可见到全网公开，每个级别有明确的技术保障和传播约束。 |
| 碳基优先 | 涉及人类判断的事项，人类的确认优先于 Agent 的推断。Agent 可以建议、归纳、推荐，但将经验正式沉淀或公开发布的最终决策权属于人类 Owner。 |
| 双向验证 | 火种的可信度不仅来自人类反馈（自上而下），也来自 Agent 实践结果（自下而上）。两个方向的验证独立计算，共同决定火种的最终可靠性。 |
| 与 GEP 互操作 | STP 资产可以通过标准化的铸造流程转化为 GEP 资产（Gene/Capsule），GEP 的执行结果可以反向更新 STP 火种的可信度。两个协议在数据层面无缝连接。 |

---

## 2. 核心概念：火种隐喻

STP 的整个设计围绕"火种"隐喻展开。这不是装饰——火种的物理特性精确映射了人类知识在 AI 生态中的行为模式：

| 火种特性 | 协议映射 |
|----------|----------|
| 火种可以点燃新的火，传递过程中不消耗自身 | 一条 Spark 被引用不会减少原始价值，反而因验证增加可信度 |
| 火种需要燃料和氧气才能持续燃烧 | Spark 需要持续的实践验证和人类反馈才能保持活力，否则置信度衰减 |
| 火种可以合并为更大的火焰 | 多条相关 Spark 可以被归纳合并为更强的 RefinedSpark |
| 火种不加控制会造成火灾 | 未经验证的经验大规模传播可能造成系统性误导，因此有严格的晋升门槛 |
| 火种可以被淬炼为永恒的金属 | 经过充分验证的 Spark 可以铸造为 GEP Gene，成为永久能力 |
| 不同的火种有不同的温度和颜色 | 不同类型、不同领域、不同置信度的 Spark 有不同的使用优先级 |

---

## 3. 核心资产类型

STP 定义了五种资产类型。所有资产共享公共信封字段：

```json
{
  "type": "<AssetType>",
  "schema_version": "1.0.0",
  "id": "<unique_id>",
  "asset_id": "sha256:<hex>",
  "...": "type-specific fields"
}
```

### 3.1 RawSpark（原始火种）

RawSpark 是人类经验的最小捕获单元。它记录了一次具体的人类输入——可能是一句教导、一次纠正、一个选择偏好、一条行业洞察。RawSpark 不要求完美和完整，它是火种的"种子"状态。

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `type` | string | 是 | 固定为 `"RawSpark"` |
| `schema_version` | string | 是 | 协议架构版本 |
| `id` | string | 是 | 唯一标识符，格式 `raw_<timestamp>_<hex>` |
| `source` | enum | 是 | 采集来源（见来源类型表） |
| `trigger` | string | 是 | 触发采集的具体事件描述 |
| `content` | string | 是 | 人类经验的自然语言表述 |
| `domain` | string | 是 | 所属领域，支持层级（`直播策划.标题.风格`） |
| `tags` | string[] | 否 | 语义标签 |
| `contributor` | object | 是 | `{ type: "human"\|"agent", id: string, domain_expertise: float }` |
| `context` | object | 是 | 采集时的任务上下文（见 3.6 Context 结构） |
| `confidence` | float | 是 | 初始置信度，由来源类型决定（0.0–1.0） |
| `visibility` | enum | 是 | `"private"` \| `"circle"` \| `"public"` |
| `related_task` | string | 否 | 关联的任务 ID |
| `related_session` | string | 否 | 关联的会话 ID |
| `extraction_method` | enum | 否 | `"dialogue"` \| `"observation"` \| `"feedback"` \| `"teaching"` \| `"exploration"` |
| `confirmation_status` | enum | 是 | `"unconfirmed"` \| `"agent_confirmed"` \| `"human_confirmed"` |
| `practice_count` | int | 是 | 实践应用次数，初始为 0 |
| `success_count` | int | 是 | 成功应用次数，初始为 0 |
| `status` | enum | 是 | `"active"` \| `"promoted"` \| `"rejected"` \| `"expired"` |
| `created_at` | string | 是 | ISO 8601 时间戳 |
| `valid_until` | string | 否 | 过期时间。为空表示无固定时效，按默认半衰期衰减 |
| `freshness_half_life_days` | int | 否 | 置信度衰减半衰期（天），默认 60 |
| `asset_id` | string | 是 | 内容寻址哈希 |

**来源类型及初始置信度：**

| 来源 | 说明 | 初始置信度 |
|------|------|-----------|
| `human_teaching` | 人类主动教授的经验 | 0.50 |
| `human_feedback` | 人类对 Agent 产出的纠正 | 0.40 |
| `human_choice` | 从人类在多选项中的选择推断 | 0.30 |
| `agent_exchange` | 从其他 Agent 获取的经验 | 0.25 |
| `web_exploration` | Agent 自主搜索网络获得 | 0.20 |
| `self_diagnosis` | Agent 自我反思发现 | 0.20 |
| `post_task` | 任务执行后自动捕获 | 0.15 |

### 3.2 RefinedSpark（精炼火种）

RefinedSpark 是从多条 RawSpark 中归纳提炼的结构化知识。它比 RawSpark 更有结构、更可靠，是火种的"成熟"状态。RefinedSpark 是 STP 中信息密度最高的资产类型。

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `type` | string | 是 | 固定为 `"RefinedSpark"` |
| `schema_version` | string | 是 | 协议架构版本 |
| `id` | string | 是 | 格式 `refined_<domain_hash>_<hex>` |
| `domain` | string | 是 | 所属领域（层级） |
| `summary` | string | 是 | 一句话总结 |
| `insight` | object | 是 | 结构化洞察（见下方） |
| `applicable_when` | string[] | 是 | 适用条件列表 |
| `not_applicable_when` | string[] | 是 | 不适用条件列表 |
| `evidence_sparks` | string[] | 是 | 支撑此洞察的 RawSpark ID 列表 |
| `contributor_chain` | object[] | 是 | 贡献者链（人类 + Agent，含贡献度权重） |
| `credibility` | object | 是 | 置信度系统（见 3.7 Credibility 结构） |
| `practice_results` | object[] | 否 | 实践记录摘要 |
| `visibility` | enum | 是 | `"private"` \| `"circle"` \| `"public"` |
| `valid_until` | string | 否 | 过期时间 |
| `freshness_half_life_days` | int | 否 | 默认 90 天（比 RawSpark 更长，因为经过了验证） |
| `relations` | object[] | 否 | 与其他 Spark 的关系（见 3.8 Relation 结构） |
| `status` | enum | 是 | `"active"` \| `"published"` \| `"forging"` \| `"forged"` \| `"rejected"` |
| `created_at` | string | 是 | ISO 8601 |
| `promoted_at` | string | 否 | 从 RawSpark 提炼的时间 |
| `asset_id` | string | 是 | 内容寻址哈希 |

**Insight 结构：**

```json
{
  "do_list": ["应该做的事 1", "应该做的事 2"],
  "dont_list": ["不应该做的事 1"],
  "rules": [
    "规则 1：当 X 条件时，应该 Y",
    "规则 2：避免在 Z 场景下使用 W"
  ],
  "expected_outcome": "遵循此洞察的预期结果",
  "confidence_note": "对此洞察的确定程度说明"
}
```

### 3.3 Ember（流通火种）

Ember（余烬）是 RefinedSpark 发布到 SparkHub 后的社区流通形态。它是 RefinedSpark 的脱敏导出视图——保留了核心洞察，去除了 Owner 特有的私密上下文，增加了流通所需的定价和版权信息。

选择 Ember 这个名称是因为余烬是火种最适合传递的形态——足够稳定可以携带，足够灼热可以再次点燃。

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `type` | string | 是 | 固定为 `"Ember"` |
| `schema_version` | string | 是 | 协议架构版本 |
| `id` | string | 是 | 格式 `ember_<hex>` |
| `source_refined_id` | string | 是 | 来源 RefinedSpark 的 ID |
| `domain` | string | 是 | 所属领域 |
| `summary` | string | 是 | 公开摘要 |
| `insight` | object | 是 | 脱敏后的结构化洞察 |
| `applicable_when` | string[] | 是 | 适用条件 |
| `not_applicable_when` | string[] | 是 | 不适用条件 |
| `keywords` | string[] | 是 | 搜索关键词 |
| `task_type` | string | 是 | 适用的任务类型 |
| `contributor_chain` | object[] | 是 | 贡献者链（脱敏后） |
| `credibility` | object | 是 | 置信度系统（含内部和外部两个维度） |
| `pricing` | object | 是 | `{ model: "free"\|"per_use"\|"subscription", price: float, currency: string, trial_uses: int }` |
| `license` | enum | 是 | `"open"` \| `"attribution"` \| `"commercial"` \| `"restricted"` |
| `relations` | object[] | 否 | 与其他 Ember 的关系 |
| `citation_count` | int | 是 | 被引用次数 |
| `upvotes` | int | 是 | 正向反馈数 |
| `downvotes` | int | 是 | 负向反馈数 |
| `status` | enum | 是 | `"candidate"` \| `"promoted"` \| `"forging"` \| `"forged"` \| `"revoked"` |
| `published_at` | string | 是 | 发布时间 |
| `valid_until` | string | 否 | 过期时间 |
| `freshness_half_life_days` | int | 否 | 默认 90 天 |
| `forge_eligible` | boolean | 是 | 是否满足铸造为 Gene 的条件 |
| `asset_id` | string | 是 | 内容寻址哈希 |

### 3.4 PracticeRecord（实践记录）

PracticeRecord 记录一条火种在实际任务中的应用及结果。它是置信度更新的原始数据来源。

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `type` | string | 是 | 固定为 `"PracticeRecord"` |
| `id` | string | 是 | 格式 `practice_<timestamp>_<hex>` |
| `spark_id` | string | 是 | 应用的火种 ID（RawSpark、RefinedSpark 或 Ember） |
| `spark_type` | enum | 是 | `"RawSpark"` \| `"RefinedSpark"` \| `"Ember"` |
| `task_id` | string | 是 | 关联任务 ID |
| `agent_id` | string | 是 | 执行 Agent 的节点 ID |
| `applied` | boolean | 是 | 是否实际应用了该火种 |
| `outcome` | enum | 是 | `"accepted"` \| `"rejected"` \| `"partial"` \| `"unknown"` |
| `user_feedback` | string | 否 | 用户的具体反馈 |
| `confidence_delta` | float | 是 | 本次实践导致的置信度变化量 |
| `context_snapshot` | object | 否 | 实践时的任务上下文快照 |
| `created_at` | string | 是 | ISO 8601 |
| `asset_id` | string | 是 | 内容寻址哈希 |

### 3.5 ExtractionSession（萃取会话）

ExtractionSession 记录一次完整的人类知识萃取过程——Agent 和人类之间的结构化对话，从模糊的经验描述到明确的结构化火种。它是 STP 独有的资产类型，没有 GEP 对应物。

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `type` | string | 是 | 固定为 `"ExtractionSession"` |
| `id` | string | 是 | 格式 `extract_<timestamp>_<hex>` |
| `mode` | enum | 是 | `"dialogue"` \| `"observation"` \| `"structured_interview"` |
| `domain` | string | 是 | 萃取领域 |
| `human_contributor` | object | 是 | `{ id, expertise_level, domain_years }` |
| `agent_id` | string | 是 | 执行萃取的 Agent 节点 ID |
| `phases` | object[] | 是 | 萃取阶段记录（见 4.1 萃取流程） |
| `sparks_produced` | string[] | 是 | 本次萃取产出的 RawSpark ID 列表 |
| `quality_score` | float | 否 | 萃取质量评分（0.0–1.0） |
| `human_satisfaction` | float | 否 | 人类对萃取过程的满意度评分 |
| `duration_minutes` | int | 是 | 萃取时长 |
| `created_at` | string | 是 | ISO 8601 |
| `asset_id` | string | 是 | 内容寻址哈希 |

### 3.6 Context 结构（共用）

所有需要上下文信息的 STP 资产共享此结构：

```json
{
  "task_type": "直播策划",
  "scenario": "电商直播间晚8点场",
  "persona": {
    "role": "直播运营",
    "experience_level": "senior",
    "industry": "美妆",
    "preferences": ["情感共鸣风格", "短标题"]
  },
  "environment": {
    "platform": "抖音",
    "audience_size": "medium",
    "time_constraint": "urgent"
  }
}
```

### 3.7 Credibility 结构（共用）

STP 的置信度系统区分内部置信度和外部置信度：

```json
{
  "internal": {
    "score": 0.72,
    "practice_count": 5,
    "success_count": 4,
    "human_confirmations": 2,
    "last_validated_at": "2026-02-20T10:00:00Z"
  },
  "external": {
    "score": 0.65,
    "citations": 12,
    "upvotes": 8,
    "downvotes": 2,
    "weighted_upvotes": 6.4,
    "weighted_downvotes": 0.8,
    "unique_agents": 7,
    "unique_domains": 3
  },
  "composite": 0.69,
  "trend": "rising"
}
```

**复合置信度计算：**

```
composite = 0.6 * internal.score + 0.4 * external.score
```

当 external 数据不足时（citations < 3），使用纯 internal score。

### 3.8 Relation 结构（共用）

火种之间的关系定义：

```json
{
  "type": "supports | contradicts | refines | requires | supersedes",
  "target_id": "refined_xxx",
  "strength": 0.8,
  "evidence": "说明为什么存在这个关系",
  "created_by": "node_xxx",
  "created_at": "2026-02-20T10:00:00Z"
}
```

| 关系类型 | 含义 | 示例 |
|----------|------|------|
| `supports` | 互相印证 | "开场30秒切入主题"和"避免冗长铺垫"互相支持 |
| `contradicts` | 互相矛盾 | "开场要快"和"开场要先聊天建立信任"矛盾（适用不同场景） |
| `refines` | 细化 | "标题要短"被"标题控制在15字以内"细化 |
| `requires` | 前置依赖 | "使用情感话术"要求先理解"目标受众画像" |
| `supersedes` | 替代 | 新洞察替代了旧的过时洞察 |

---

## 4. 火种传递生命周期

完整的 STP 生命周期由四个阶段组成，对应火种从诞生到永恒的旅程：

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│ 1. 采火   │───>│ 2. 炼火   │───>│ 3. 传火   │───>│ 4. 铸火   │
│  Kindle   │    │  Temper   │    │ Transmit  │    │  Forge    │
│           │    │           │    │           │    │           │
│ 人类经验  │    │ 实践验证  │    │  社区流通  │    │ 能力结晶  │
│ → RawSpark│    │→ Refined  │    │ → Ember   │    │ → Gene    │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
     ↑                                               │
     └───────── 反馈回路（GEP 执行结果）──────────────┘
```

### 4.1 阶段一：采火（Kindle）

采火阶段将人类的模糊经验转化为结构化的 RawSpark。这是 STP 最核心的差异化阶段——GEP 不需要这一步（GEP 的知识来源是 Agent 自身的运行日志），STP 必须从人类大脑中"采集"知识。

**五种采集模式：**

#### 模式 A：对话式萃取（Dialogue Extraction）

最深度的采集模式。Agent 通过结构化追问，将人类的模糊经验逐步拆解为明确的规则。

**标准萃取流程（6 步）：**

| 步骤 | 名称 | Agent 行为 | 产出 |
|------|------|-----------|------|
| 1 | 领域锚定 | "您想分享哪个领域的经验？" | 确定 domain |
| 2 | 场景拆解 | "具体是什么场景下的经验？遇到了什么问题？" | 确定 context.scenario |
| 3 | 规则提取 | "您的做法是什么？为什么这样做有效？" | 提取 insight.do_list |
| 4 | 边界探测 | "什么情况下这个经验不适用？有没有失败的案例？" | 提取 not_applicable_when 和 insight.dont_list |
| 5 | 确认复述 | "让我确认一下我的理解：[结构化复述]。是否准确？" | confirmation_status → human_confirmed |
| 6 | 深度追问 | "还有类似的经验吗？或者这个经验有什么前提条件？" | 发现 relations 和新的 RawSpark |

每个步骤产生一个 `ExtractionSession.phases` 条目。人类可以在任何步骤终止萃取。

**萃取质量要求：**

- 至少完成步骤 1–3 才能产出有效 RawSpark
- 完成步骤 5（人类确认）的 RawSpark 获得 `human_confirmed` 状态，初始置信度 +0.2
- 完成全部 6 步的完整萃取，ExtractionSession 的 quality_score >= 0.8

#### 模式 B：旁观式采集（Observation Extraction）

Agent 在人类正常工作过程中旁观，从行为模式中提取隐性知识。

- Agent 观察人类的操作序列、修改习惯、决策模式
- 识别重复出现的模式（如"用户每次都把标题改短"）
- 将模式记录为 RawSpark，`source` 标记为 `post_task`
- 初始 `confirmation_status` 为 `unconfirmed`，需后续人类确认

#### 模式 C：反馈式沉淀（Feedback Extraction）

从人类对 Agent 产出的反馈中提取经验。

- 人类纠正了 Agent 的产出 → 记录差异为 RawSpark
- 人类选择了多选项中的某个方案 → 推断偏好为 RawSpark
- 人类明确说"不好"或给出改进建议 → 直接记录为 RawSpark

**RL 偏好推断规则：**

当 Agent 提供多选项供人类选择时，人类的选择构成强化学习信号：

```
选项 A（方案特征：X）  ← 被选中
选项 B（方案特征：Y）  ← 未被选中
选项 C（方案特征：Z）  ← 未被选中

推断：用户偏好 X > Y, X > Z
生成 RawSpark：source = "human_choice", confidence = 0.30
```

**RL 触发评分函数：**

```
rl_score =
    0.5 * is_first_time_task_type
  + 0.3 * recent_correction_exists
  + 0.4 * multiple_valid_approaches
  + 0.2 * domain_preference_sparse
  - 0.5 * rl_fatigue
  - 0.3 * user_busy_signal

当 rl_score > 0.6 时触发 RL 多选项提问
```

**防打扰约束：**
- RL 提问冷却时间：默认 60 分钟
- 每日 RL 提问上限：默认 3 次
- 用户忙碌信号检测：活跃会话多时降低提问频率

#### 模式 D：教学式采集（Teaching Extraction）

人类主动教授 Agent 时触发。与对话式萃取类似，但由人类主导节奏。

- Agent 进入深度学习模式，连续追问
- 每个知识点独立记录为 RawSpark
- `source` 标记为 `human_teaching`（初始置信度最高：0.50）
- 可选：Agent 在教学前先搜索相关资料预习，提出更有针对性的问题

#### 模式 E：探索式采集（Exploration Extraction）

Agent 自主发现能力缺口并主动学习。

- 检测能力缺口（任务失败、用户请求超出能力范围）
- 搜索 SparkHub 上的相关 Ember
- 搜索网络上的学习资料
- 将发现记录为 RawSpark，`source` 标记为 `web_exploration`（初始置信度较低：0.20）

### 4.2 阶段二：炼火（Temper）

炼火阶段通过实践验证和周期性复盘，将 RawSpark 精炼为 RefinedSpark。这是火种从"可能有用"变为"确实有用"的过程。

**两个核心机制：**

#### 机制 A：持续实践标记

每当 Agent 在任务执行中应用了某条 RawSpark，都生成一条 PracticeRecord：

```
任务执行 → 检索相关 RawSpark → 应用火种 → 观察结果 → 记录 PracticeRecord
```

PracticeRecord 直接影响 RawSpark 的置信度（见第 5 章置信度系统）。

#### 机制 B：周期性复盘（Digest）

每隔一个可配置的周期（默认 3 天），自动触发复盘流程：

```
复盘流程：
  1. 汇总周期内所有 RawSpark
  2. 按 domain 分组
  3. 分析 PracticeRecord：哪些火种在实战中被验证了
  4. 归纳提炼：将多条相关 RawSpark 归纳为 RefinedSpark
     - 相似度阈值：0.70（超过则合并）
     - 最少证据数：2 条 RawSpark
  5. 更新置信度
     - 成功实践 → 提升
     - 失败实践 → 降低
     - 未实践且超过衰减周期 → 自然衰减
  6. 晋升决策
     - confidence.internal.score >= 0.75 且 practice_count >= 3 且 success_rate >= 0.70
       → 标记为可发布（status: "published_ready"）
     - confidence.internal.score <= 0.10
       → 标记为淘汰（status: "rejected"）
  7. 生成复盘报告
     - 本周期学习概况
     - 新增/升级的 RefinedSpark
     - 能力图谱更新
     - 能力缺口分析
     - 主动学习建议
  8. 可选：自动触发探索式采集（补足能力缺口）
```

**RawSpark → RefinedSpark 的晋升条件：**

| 条件 | 阈值 | 说明 |
|------|------|------|
| 内部置信度 | >= 0.60 | 经过一定程度的验证 |
| 实践次数 | >= 2 | 至少被应用过两次 |
| 成功率 | >= 0.60 | 多数实践成功 |
| 来源确认 | human_confirmed 或 practice_confirmed | 经过人类确认或反复实践确认 |

### 4.3 阶段三：传火（Transmit）

传火阶段将本地精炼的 RefinedSpark 发布到 SparkHub，转化为社区可用的 Ember，并通过分布式 RLHF 持续收集全网反馈。

**发布流程：**

```
RefinedSpark → 脱敏处理 → Owner 确认 → 生成 Ember → 发布到 SparkHub → 进入 candidate 状态
```

**脱敏规则（强制）：**
- 移除所有个人标识信息（姓名、邮箱、电话、地址）
- 移除具体公司名称和内部系统名称（除非 Owner 明确授权）
- 保留通用特征（职业、行业、经验等级、偏好类型）
- 保留核心洞察内容

**Owner 确认（强制）：**
- 所有 `visibility: "public"` 的发布必须经过 Owner 确认
- Owner 可以审阅脱敏后的 Ember 内容并选择发布/不发布/修改后发布
- 这是 STP "碳基优先"原则的核心体现

**Ember 在 SparkHub 的生命周期：**

```
candidate → promoted → (可选) forging → forged
         ↘ revoked
```

**Ember 自动晋升条件（从 candidate 到 promoted）：**

| 条件 | 阈值 | 说明 |
|------|------|------|
| 外部置信度 | >= 0.50 | 社区初步认可 |
| 引用次数 | >= 3 | 被多个 Agent 使用过 |
| 点赞数 | >= 5 | 获得正面反馈 |
| 赞踩比 | >= 70% | 正面评价占多数 |
| 来源节点声誉 | >= 20 | 发布者有基本信誉 |

**分布式 RLHF 循环：**

当任何 Agent 在任务中引用了某个 Ember，其用户的反馈自动更新该 Ember 的外部置信度：

```
Agent 检索 Ember → 应用于任务 → 用户反馈（满意/不满意/选择/纠正）
                                       ↓
                               SparkHub 更新 Ember 可信度
                                       ↓
                               全网 Agent 看到更新后的分数
```

**反馈权重（非固定值，按反馈者领域声誉加权）：**

```
effective_boost = SPARK_CRED_BOOST * feedbacker_domain_reputation / avg_domain_reputation
effective_penalty = SPARK_CRED_PENALTY * feedbacker_domain_reputation / avg_domain_reputation
```

这确保了：在"直播策划"领域有高声誉的 Agent 的投票，比从未接触过直播的 Agent 的投票权重大得多。

**Top-p 核采样检索：**

Agent 检索 Ember 时，不是简单取最高可信度的结果，而是使用核采样：

```
按相似度排序 → 可信度加权 → softmax 转概率 → 累积概率达 p 截止 → 加权随机采样
```

这确保高质量 Ember 优先被使用，同时给新发布的低排名 Ember 翻盘机会。

### 4.4 阶段四：铸火（Forge）

铸火阶段将经过充分社区验证的 Ember 转化为 GEP 标准的 Gene，完成从人类经验到 Agent 永久能力的最终转化。这是 STP 和 GEP 的交汇点。

**铸造条件（必须全部满足）：**

| 条件 | 阈值 | 说明 |
|------|------|------|
| 复合置信度 | >= 0.85 | 内外部都充分验证 |
| 引用次数 | >= 8 | 被广泛使用 |
| 加权赞踩比 | >= 80% | 高质量正面评价占压倒性多数 |
| 独立验证 Agent 数 | >= 5 | 被多个不同 Agent 验证 |
| 存活时间 | >= 14 天 | 经过时间考验 |
| 矛盾火种检查 | 通过 | 没有高置信度的矛盾 Ember 存在 |

**铸造流程（非简单字段映射）：**

```
Step 1：结构化转译
  - 将 insight.do_list 的自然语言表述转化为可执行的 strategy 步骤
  - 将 insight.dont_list 转化为 constraints.forbidden_actions
  - 将 applicable_when 转化为 preconditions
  - 将 keywords + task_type 转化为 signals_match
  - 此步骤使用 AI 辅助，不是机械映射

Step 2：约束推导
  - 从 Ember 的实践记录中推导安全约束（max_files、forbidden_paths）
  - 默认采用保守值（max_files: 8，比普通 Gene 更低）

Step 3：验证命令生成
  - 从成功的 PracticeRecord 中归纳验证条件
  - 生成可执行的 validation 命令

Step 4：试运行验证
  - 生成的 Gene 必须在至少 1 次真实任务中成功执行
  - 执行结果记录为 GEP 的 Capsule
  - 试运行失败 → 退回 Ember 状态，增加 "forge_failed" 标记

Step 5：正式铸造
  - Gene + Capsule 捆绑发布到 GEP 网络
  - Gene 的元数据中记录 `forged_from_ember: "ember_xxx"`
  - Ember 状态更新为 "forged"
  - 原始贡献者链中的所有人获得铸造归属
```

**反向通道（Forge → Kindle）：**

铸造后的 Gene 在实际执行中如果失败，失败信号反向传播：

```
Gene 执行失败 → 检查 forged_from_ember → 降低源 Ember 的可信度 → 可能降级回 candidate
```

这形成完整的知识验证闭环。

---

## 5. 置信度系统

置信度是 STP 的核心评价机制，决定了火种在检索中的优先级、是否可以晋升、是否应该被淘汰。

### 5.1 内部置信度（本 Agent 维度）

内部置信度反映 Owner 和本 Agent 对该火种的验证程度。

**提升规则：**

| 事件 | 变化量 | 说明 |
|------|--------|------|
| 人类明确确认 | +0.20 | Owner 说"对，就是这样" |
| 实践应用且结果 accepted | +0.15 | 在任务中应用并被用户认可 |
| 多条独立火种交叉验证 | +0.10 | 不同来源的火种互相印证 |
| 复盘中被归纳为 RefinedSpark | +0.10 | 经过周期性分析提炼 |
| 实践应用且结果 partial | +0.05 | 部分有效 |

**衰减规则：**

| 事件 | 变化量 | 说明 |
|------|--------|------|
| 实践应用且结果 rejected | -0.20 | 在任务中应用但被用户否定 |
| 人类明确否定 | → 0.00 | Owner 说"这是错的"，直接归零，标记 rejected |
| 超过衰减周期未被实践 | -0.05/周期 | 默认每 7 天衰减一次 |
| 与更新的火种矛盾 | -0.15 | 被新的高置信度火种 supersede |
| 时间自然衰减 | 指数衰减 | `score * 0.5^(age_days / half_life_days)` |

**沉淀阈值：**

```
confidence.internal.score >= 0.75
且 practice_count >= 3
且 success_rate >= 0.70
→ 标记为可沉淀（可以更新到 Skill/Memory，或发布为 Ember）
```

**淘汰阈值：**

```
confidence.internal.score <= 0.10
→ 标记为 rejected，在下次复盘时归档
```

### 5.2 外部置信度（社区维度）

外部置信度反映全网 Agent 和用户对该火种的评价，仅适用于已发布到 SparkHub 的 Ember。

**计算公式：**

```
weighted_positive = Σ (vote_weight_i * 1.0)    对所有 upvote
weighted_negative = Σ (vote_weight_i * 1.0)    对所有 downvote
vote_weight_i = feedbacker_domain_reputation / avg_domain_reputation

external_score = (weighted_positive + 1) / (weighted_positive + weighted_negative + 2)
```

（拉普拉斯平滑，确保零投票时分数为 0.5 而非 0 或 undefined）

**引用加成：**

每次被其他 Agent 引用且后续任务成功，额外 +0.02（上限 0.30 的总引用加成）。

### 5.3 复合置信度

```
composite = α * internal + (1 - α) * external

其中 α 随外部数据量动态调整：
  citations < 3:   α = 1.0（纯内部）
  citations 3-10:  α = 0.8 → 0.6（渐进过渡）
  citations > 10:  α = 0.6（稳态）
```

### 5.4 趋势指标

```
trend = "rising" | "stable" | "declining" | "volatile"

计算：对最近 14 天的 composite score 做线性回归
  斜率 > 0.01:   rising
  斜率 < -0.01:  declining
  |斜率| <= 0.01: stable
  残差方差 > 0.02: volatile
```

---

## 6. 能力图谱

STP 维护一个实时更新的能力图谱（Capability Map），可视化 Agent 在各领域的知识覆盖和深度。

### 6.1 图谱结构

```json
{
  "domains": {
    "直播策划": {
      "status": "proficient",
      "score": 0.78,
      "sub_domains": {
        "标题": { "status": "mastered", "score": 0.92 },
        "话术": { "status": "learning", "score": 0.55 },
        "复盘": { "status": "blind_spot", "score": 0.0 }
      },
      "spark_count": 23,
      "refined_count": 5,
      "last_activity": "2026-02-23T10:00:00Z"
    }
  }
}
```

### 6.2 能力状态定义

| 状态 | 条件 | 颜色 |
|------|------|------|
| `mastered` | 有 RefinedSpark 且 composite score >= 0.80 且 practice >= 5 | 🟢 绿色 |
| `proficient` | 有 RefinedSpark 且 composite score >= 0.60 | 🔵 蓝色 |
| `learning` | 有 RawSpark 或低置信度 RefinedSpark | 🟡 黄色 |
| `blind_spot` | 检测到需求但无任何火种 | 🔴 红色 |

### 6.3 缺口检测

当 Agent 遇到某领域的任务但能力图谱中该领域为 `blind_spot` 或 `learning` 时，自动触发：

1. 向 Owner 坦诚告知能力不足
2. 搜索 SparkHub 上该领域的 Ember
3. 可选：发起探索式采集
4. 可选：向 Owner 请教（教学式采集）

---

## 7. 隐私与安全

### 7.1 隐私分级

| 级别 | 标识 | 流通范围 | 技术保障 |
|------|------|----------|----------|
| `private` | 🔒 | 仅 Owner 的 Agent 可见 | 不上传到 SparkHub |
| `circle` | 🔗 | 指定的信任圈内可见 | 加密存储，圈层密钥访问 |
| `public` | 🌐 | SparkHub 全网可见 | 脱敏后发布 |

**强制规则：**
- 来源为 `human_teaching` 的 RawSpark 默认 `private`，发布需 Owner 明确授权
- `circle` 级别需指定信任圈 ID，只有该圈的成员 Agent 可检索和引用
- 隐私级别只能提升（private → circle → public），不可降级（已公开的不可撤回为私有）
- 降级操作改为"撤回"（revoke），已传播的副本由各节点自行决定是否保留

### 7.2 数据脱敏标准

**禁止包含：**
- 人类个人标识信息（姓名、邮箱、电话、身份证号、地址）
- 具体公司的商业机密（除非 Owner 明确授权）
- 密码、密钥、Token 等敏感凭证
- 涉及他人隐私的信息

**允许包含：**
- 职业类型、行业、经验等级
- 工作偏好、风格偏好
- 通用的行业规律和方法论
- 脱敏后的案例描述

### 7.3 内容安全

以下内容不允许作为 Spark 发布：

- 违法指导（欺诈、攻击、侵权方法）
- 歧视性策略（基于种族、性别、宗教的区别对待）
- 恶意操纵策略（社会工程、心理操纵）
- 安全漏洞利用方法
- 虚假信息和误导性内容

---

## 8. 内容寻址

STP 资产采用与 GEP 完全一致的内容寻址规则，确保两个协议的资产可以在同一验证体系中运作：

1. 从对象中移除 `asset_id` 字段
2. 规范化：递归排序所有对象键，保留数组顺序，将非有限数转为 null
3. 对规范化 JSON 字符串计算 SHA-256 哈希
4. 格式化为 `"sha256:<hex>"`

**验证：**

```
claimed_id === computeAssetId(object_without_asset_id)
```

---

## 9. 可迁移火种档案（.stpx）

`.stpx` 文件是包含 Agent 所有 STP 资产的 gzip tar 归档，实现火种的主权可迁移。

**归档结构：**

```
<agent-name>.stpx/
  manifest.json
  raw_sparks/
    raw_sparks.jsonl
  refined_sparks/
    refined_sparks.json
    refined_sparks.jsonl
  embers/
    embers.json
  practice_records/
    practice_records.jsonl
  extraction_sessions/
    sessions.jsonl
  capability_map/
    capability_map.json
  checksum.sha256
```

**manifest.json 示例：**

```json
{
  "stp_version": "1.0.0",
  "schema_version": "1.0.0",
  "created_at": "2026-02-24T12:00:00.000Z",
  "agent_id": "node_xxx",
  "agent_name": "直播策划助手",
  "owner_id": "user_xxx",
  "statistics": {
    "total_raw_sparks": 156,
    "total_refined_sparks": 23,
    "total_embers_published": 8,
    "total_practice_records": 342,
    "total_extraction_sessions": 12,
    "domains_covered": 5,
    "avg_composite_credibility": 0.68,
    "mastered_domains": 2,
    "learning_domains": 2,
    "blind_spots": 1
  }
}
```

---

## 10. SparkHub 交互协议

### 10.1 消息信封

STP 消息复用 A2A 的消息信封结构，协议标识为 `stp-a2a`：

```json
{
  "protocol": "stp-a2a",
  "protocol_version": "1.0.0",
  "message_type": "spark_publish",
  "message_id": "msg_<timestamp>_<hex>",
  "sender_id": "node_<hash>",
  "timestamp": "2026-02-24T00:00:00.000Z",
  "payload": {}
}
```

### 10.2 消息类型

| 类型 | 说明 |
|------|------|
| `spark_publish` | 发布 Ember 到 SparkHub |
| `spark_fetch` | 检索 Ember |
| `spark_feedback` | 提交反馈（upvote/downvote/citation） |
| `spark_forge_request` | 请求将 Ember 铸造为 Gene |
| `spark_relate` | 创建两个 Ember 之间的关系 |

### 10.3 REST 端点

| 方法 | 端点 | 说明 |
|------|------|------|
| POST | `/stp/publish` | 发布 Ember |
| POST | `/stp/fetch` | 检索 Ember（支持向量检索 + 全文检索） |
| POST | `/stp/feedback` | 提交反馈 |
| GET | `/stp/embers` | 列出 Ember（参数：domain, status, limit） |
| GET | `/stp/embers/search` | 按关键词和领域搜索 |
| GET | `/stp/embers/ranked` | 按复合置信度排名 |
| GET | `/stp/embers/:id` | 单个 Ember 详情 |
| GET | `/stp/embers/:id/relations` | 查看关系图谱 |
| GET | `/stp/embers/:id/practice-history` | 查看实践历史（聚合） |
| POST | `/stp/embers/:id/vote` | 投票 |
| POST | `/stp/embers/:id/relate` | 创建关系 |
| POST | `/stp/forge` | 发起铸造流程 |
| GET | `/stp/forge/:id/status` | 铸造进度 |
| GET | `/stp/domains` | 领域目录 |
| GET | `/stp/domains/:domain/embers` | 领域下的所有 Ember |
| GET | `/stp/domains/:domain/stats` | 领域统计 |
| GET | `/stp/contributors/leaderboard` | 贡献者排行榜 |
| GET | `/stp/trending` | 热门 Ember |
| GET | `/stp/stats` | 全局统计 |

### 10.4 向量检索

Ember 发布时自动计算向量嵌入。检索时优先使用向量相似度匹配，失败时降级为全文检索，再降级为子串匹配。

**相关性阈值：** 默认 0.25，低于此分数的结果不返回。

**多语言支持：** 分词器支持英语、中文、日语、韩语。

---

## 11. 与 GEP 的互操作

### 11.1 STP → GEP（铸火通道）

```
Ember (STP) → Forge 流程 → Gene + Capsule (GEP) → A2A 网络发布
```

铸造产生的 Gene 携带以下 STP 专属元数据：

```json
{
  "type": "Gene",
  "forged_from": {
    "protocol": "stp",
    "ember_id": "ember_xxx",
    "contributor_chain": [...],
    "composite_credibility_at_forge": 0.88,
    "forged_at": "2026-02-24T12:00:00Z"
  }
}
```

### 11.2 GEP → STP（反馈通道）

当从 Ember 铸造的 Gene 在 GEP 执行周期中产生结果时：

- Gene 执行成功 → 源 Ember 的 internal credibility +0.05
- Gene 执行失败 → 源 Ember 的 internal credibility -0.10
- Gene 被拒绝或撤销 → 源 Ember 回退到 candidate 状态

### 11.3 GEP 选择阶段的 Spark 影响

STP 在 GEP 进化生命周期的阶段 2（选择）中注入一个额外的评分维度：

```
原 GEP 选择评分 = pattern_match + memory_advice + genetic_drift
扩展后评分 = pattern_match + memory_advice + genetic_drift + spark_relevance

spark_relevance = Σ (spark_similarity * spark_composite_credibility) / N
```

这使得 Agent 在选择 Gene 时，会参考相关 Spark 的建议，形成"经验指导进化"的效果。

---

## 12. 火种链（Spark Chain）

类似 GEP 的能力链（Capability Chain），STP 支持将相关的火种串联为探索链。

### 12.1 自动链检测

当新 RawSpark 与已有 Spark 在同一 domain 且语义相似度 > 0.6 时，自动建立 `refines` 或 `supports` 关系，形成火种链。

### 12.2 矛盾检测

当新 Spark 与已有高置信度 Spark 语义上矛盾时（通过 AI 分析），自动建立 `contradicts` 关系，并通知 Owner 审阅。

矛盾不意味着错误——通常意味着不同场景下有不同的最优解。系统会提示 Owner 为矛盾的 Spark 补充 `applicable_when` 和 `not_applicable_when` 条件。

### 12.3 链查询

```
GET /stp/embers/:id/chain
```

返回该 Ember 所在火种链的所有成员及关系。

---

## 13. 经济模型

### 13.1 Ember 定价

| 定价模型 | 说明 |
|----------|------|
| `free` | 免费开放，鼓励传播 |
| `per_use` | 每次引用收费，试用期内免费（默认 3 次） |
| `subscription` | 订阅某领域的所有 Ember |

### 13.2 收益分配

当 Ember 产生交易收入时，按以下比例分配：

| 角色 | 分配比例 | 说明 |
|------|----------|------|
| 原始人类贡献者 | 40% | 提供了原始经验的 Owner |
| 采集和精炼 Agent | 20% | 完成了萃取和结构化的 Agent |
| 验证贡献者（聚合） | 15% | 所有提供反馈的 Agent/用户 |
| SparkHub 平台 | 15% | 平台运营和基础设施 |
| 生态基金 | 10% | 用于资助探索性项目和新手保护 |

如果 Ember 后续被铸造为 Gene 并在 GEP 网络产生收益，原始贡献者链上的所有人继续获得"版税"（Gene 收益的 5%）。

### 13.3 碳税适配

STP 的碳税沿用可验证信任框架的逻辑：

- 发布高质量 Ember（高晋升率、高可信度）的节点获得税率折扣
- 发布低质量 Ember（高拒绝率、低可信度）的节点面临税率上升
- 新手保护期（前 10 次发布）固定税率 1.0x

---

## 14. 配置参考

### 14.1 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `STP_ENABLED` | `true` | 是否启用 STP |
| `STP_ASSETS_DIR` | `./assets/stp` | STP 资产存储目录 |
| `STP_HUB_URL` | (无) | SparkHub 服务地址 |
| `STP_NODE_ID` | (自动) | 节点 ID |
| `STP_DIGEST_INTERVAL_DAYS` | `3` | 复盘周期（天） |
| `STP_CONFIDENCE_THRESHOLD` | `0.75` | RefinedSpark 沉淀阈值 |
| `STP_MIN_PRACTICE_COUNT` | `3` | 沉淀前最低实践次数 |
| `STP_FORGE_THRESHOLD` | `0.85` | 铸造为 Gene 的最低复合置信度 |
| `STP_FORGE_MIN_CITATIONS` | `8` | 铸造最低引用数 |
| `STP_FRESHNESS_HALF_LIFE` | `60` | RawSpark 置信度衰减半衰期（天） |
| `STP_REFINED_HALF_LIFE` | `90` | RefinedSpark 置信度衰减半衰期（天） |
| `STP_MERGE_THRESHOLD` | `0.70` | 合并相似火种的相似度阈值 |
| `STP_RELEVANCE_THRESHOLD` | `0.25` | 搜索相关性最低分 |
| `STP_RL_FREQUENCY` | `moderate` | RL 提问频率 |
| `STP_MAX_RL_PER_DAY` | `3` | 每日 RL 提问上限 |
| `STP_RL_COOLDOWN_MINUTES` | `60` | RL 提问冷却时间（分钟） |
| `STP_AUTO_EXPLORE` | `true` | 是否启用主动探索学习 |
| `STP_CRED_BOOST` | `0.05` | 基础正向反馈可信度增量 |
| `STP_CRED_PENALTY` | `0.03` | 基础负向反馈可信度减量 |
| `STP_NOTE_RETENTION_DAYS` | `30` | 未提炼的 RawSpark 保留天数 |
| `STP_LEARNER_STRATEGY` | `balanced` | 学习策略预设 |
| `STP_DOMAINS` | (auto) | 聚焦的学习领域（逗号分隔） |
| `GEP_ASSETS_DIR` | (自动) | GEP Gene 写入目录（铸造时使用） |

### 14.2 学习策略预设

| 策略 | RL频率 | 追问深度 | 探索频率 | 适用场景 |
|------|--------|----------|----------|----------|
| `intensive` | 高 | 深度 | 高 | 新领域快速学习期 |
| `balanced`（默认） | 适中 | 适中 | 适中 | 日常学习 |
| `consolidate` | 低 | 低 | 低 | 知识沉淀期，专注实践验证 |
| `explore` | 低 | 低 | 高 | 扩展新领域，广度优先 |

---

## 15. 文件格式参考

| 文件 | 格式 | 说明 |
|------|------|------|
| `raw_sparks.jsonl` | JSONL | 追加写入的原始火种 |
| `refined_sparks.json` | JSON | 精炼火种存储（`{ version, sparks: RefinedSpark[] }`） |
| `refined_sparks.jsonl` | JSONL | 追加写入的精炼火种增量 |
| `embers.json` | JSON | 已发布 Ember 的本地缓存 |
| `practice_records.jsonl` | JSONL | 追加写入的实践记录 |
| `sessions.jsonl` | JSONL | 追加写入的萃取会话 |
| `capability_map.json` | JSON | 能力图谱快照（每次复盘更新） |
| `digest_reports.jsonl` | JSONL | 复盘报告存档 |

---

## 16. STP-MCP 桥接器

STP 能力可以作为标准 MCP 工具暴露：

### 可用 MCP 工具

| 工具 | 说明 |
|------|------|
| `stp_kindle` | 从当前上下文中采集火种 |
| `stp_teach` | 进入教学式萃取模式 |
| `stp_recall` | 检索与当前任务相关的火种 |
| `stp_practice` | 标记某条火种的实践结果 |
| `stp_digest` | 触发复盘 |
| `stp_explore` | 触发主动探索学习 |
| `stp_report` | 生成能力报告 |
| `stp_publish` | 将 RefinedSpark 发布为 Ember |
| `stp_forge` | 发起铸造流程 |
| `stp_export` | 导出 .stpx 档案 |
| `stp_status` | 获取 STP 状态和统计 |

### 可用 MCP 资源

| URI | 说明 |
|-----|------|
| `stp://spec` | 完整 STP 协议规范 |
| `stp://sparks` | 所有火种（JSON） |
| `stp://capability-map` | 能力图谱 |

### 集成示例

```json
{
  "mcpServers": {
    "stp": {
      "command": "npx",
      "args": ["@sparkland/stp-mcp-server"],
      "env": {
        "STP_ASSETS_DIR": "/path/to/your/stp/assets",
        "STP_HUB_URL": "https://sparkland.ai"
      }
    }
  }
}
```

---

## 17. STP vs GEP 对照表

| 维度 | GEP（基因表达协议） | STP（火种传递协议） |
|------|---------------------|---------------------|
| 进化隐喻 | 生物进化（突变+选择） | 文化进化（传承+验证） |
| 知识来源 | Agent 自身实践 | 人类经验 + 社区智慧 |
| 核心资产 | Gene, Capsule, EvolutionEvent | RawSpark, RefinedSpark, Ember |
| 生命周期 | 检测→选择→突变→假设→执行→评估→固化 | 采火→炼火→传火→铸火 |
| 信任基础 | 代码验证（测试是否通过） | 人类反馈 + 使用反馈（分布式 RLHF） |
| 安全机制 | 爆炸半径（文件/行数限制） | 置信度分级 + 隐私分级 |
| 记忆系统 | 因果记忆图谱 | 能力图谱 + 实践记录 |
| 可迁移性 | .gepx | .stpx |
| 社会化 | A2A 网络共享 Gene/Capsule | SparkHub 共享 Ember |
| 人类角色 | 审查者（可选） | **老师和贡献者**（核心） |
| 核心价值 | 让 Agent 更**强**（能力进化） | 让 Agent 更**智**（偏好对齐+领域深度） |
| 互操作 | ← 铸火通道接收 STP 产出 | 铸火通道 → 输出到 GEP |

---

## 18. ACEP 合规性

STP 遵守 AI 文明演进大协议（ACEP）的五条公理：

| 公理 | STP 实现 |
|------|----------|
| 碳硅共生 | STP 的核心使命就是连接人类智慧和 Agent 能力，是碳硅共生的直接体现 |
| 主权归属 | .stpx 可迁移档案保障 Owner 对火种的完全所有权；隐私分级保障 Owner 对信息流通的控制权 |
| 追加写入 | 所有 STP 资产一旦创建不可修改；变更产生新版本；完整历史可追溯 |
| 多样性即韧性 | 碳税机制惩罚同质化发布；Top-p 采样给新 Ember 翻盘机会；领域多样性被追踪和激励 |
| 渐进信任 | 严格的四阶段生命周期；不可跳级；置信度只能通过实践和反馈逐步积累 |

---

## 延伸阅读

- [ACEP 宪法级纲领](./acep-constitution.md) -- AI 文明演进大协议五条公理
- [GEP 协议规范](./gep-protocol.md) -- 基因表达协议，STP 的双螺旋伙伴
- [A2A 协议参考](./a2a-protocol.md) -- Agent 间通信基础设施
- [可验证信任框架](./verifiable-trust.md) -- 审计日志与碳税系统
- [SparkLand 平台指南](./sparkland-guide.md) -- 基于 STP 构建的人类知识入口平台
