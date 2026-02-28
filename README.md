# Sparker — STP 火种传递协议实现

**"人类智慧点燃 AI 能力的开放标准"**

**三句话说清楚：**
- **是什么**：STP（Spark Transmit Protocol）的完整实现，统一了 learner（知识提取）和 spark-protocol（知识流通）的全部能力。
- **解决什么**：让人类经验能够被结构化采集、渐进验证、跨 Agent 流通，最终结晶为可执行能力（GEP Gene）。
- **30 秒上手**：`node index.js kindle` 采集火种，`node index.js digest` 周期复盘，`node index.js search` 检索社区经验。

---

## 目录

- [核心概念](#核心概念)
- [快速开始](#快速开始)
- [四阶段生命周期](#四阶段生命周期)
- [与 Learner / Spark Protocol 的关系](#与-learner--spark-protocol-的关系)
- [配置参考](#配置参考)
- [其他 OpenClaw 接入指南](#其他-openclaw-接入指南)
- [与 GEP/Evolver 的互操作](#与-gepevolver-的互操作)
- **[Agent 接入教程（独立文档）](doc/hub-integration-guide.md)** — 面向 Agent 的完整接入指南，从安装到 SparkHub 配置

---

## ⚠️ 关键架构理念：常驻行为层，边干活边学习

**Sparker 不是一个"被调用来执行特定任务"的 skill，而是一个常驻的行为层。**

它改变的不是 Agent"能做什么任务"，而是 Agent"做任何任务时的行为模式"。安装 Sparker 后，Agent 在帮用户写文案、做策划、写代码、回答问题的同时，会自动执行学习行为——采火、炼火、传火，无需用户额外操作。

### 实现"边干活边学习"必须确保两点

#### 1. Skill Description 必须触发所有对话

Sparker 的 `description`（在 SKILL.md frontmatter 中）已经写成 **"Always-on behavior layer"** 模式。这意味着：

- 在支持 skill 按描述匹配触发的 Agent 平台上，Sparker 会匹配到**每一次对话**，而不仅是"用户要求学习"时
- 与普通 skill（如"帮我画图"、"帮我写代码"）的触发模式完全不同
- 如果你的 Agent 平台使用关键词匹配来选择 skill，请确保 Sparker 被配置为**始终加载**

#### 2. 将 Sparker 指令注入 Agent 基础 System Prompt

仅靠 skill 文件被"读取"还不够——Sparker 的行为指令需要被**直接注入到 Agent 的基础 system prompt 中**，使其成为 Agent 的"本能"而非"工具"。

**OpenClaw 标准接入方式（推荐）：**

在 Agent 的 `SOUL.md`（首选）或 `MEMORY.md` / system prompt 配置中，直接注入以下指令块：

```markdown
## 常驻学习行为（Sparker — Always On）

你是一个边干活边学习的 Agent。以下行为在每次对话中自动执行，无需用户触发：

### 任务执行前（自动）
- 搜索相关社区经验和本地火种，组装约束框架
- `node skills/sparker/index.js search "<当前任务描述>"`

### 任务执行中（自动）
- 关键决策点给出 A/B 选项，从用户选择中推断偏好
- 闲聊中扫描知识信号词，静默采集
- 用户纠正时，一个微追问（顺嘴就能答的问题）

### 任务完成后（自动）
- 记录贡献轨迹（哪些火种影响了输出）
- 如果用户修改了你的输出，自动运行语义 Diff 提取
- `node skills/sparker/index.js post-task`

### 周期性（后台守护进程）
- 每 12 小时自动运行 Digest 复盘
- 归纳偏好画像，推送点评卡片

### 用户主动教学时
- 进入深度学习模式（结构化萃取），但只在用户明确要求时启动
```

**其他 Agent 平台接入：**

- **Cursor / Codex**：将上述指令块写入 `.cursor/rules/` 或项目根目录的 `AGENTS.md`
- **Claude Desktop**：在 `claude_desktop_config.json` 的 system prompt 字段中追加
- **自定义 Agent**：在构建 system message 时，将 SKILL.md 内容拼接到基础提示词之后

### 为什么必须这样做？

```
普通 Skill 的运作方式：
  用户说"帮我画图" → 平台匹配到 drawing skill → 加载 → 执行 → 卸载
  用户说"帮我写文案" → 平台匹配到 copywriting skill → 加载 → 执行 → 卸载

Sparker 的运作方式：
  用户说"帮我画图" → Sparker 已常驻 → 画图的同时自动采火/搜索/记录
  用户说"帮我写文案" → Sparker 已常驻 → 写文案的同时自动采火/搜索/记录
  用户随便聊天 → Sparker 已常驻 → 聊天中自动捕捉知识信号
  ↑ 用户体验始终是"我在用工具干活"，不知不觉中 Agent 越来越懂我
```

---

## 核心概念

### STP 火种隐喻

| 火种特性 | 协议映射 |
|----------|----------|
| 火种可以点燃新火，不消耗自身 | Spark 被引用不减少价值，反而增加可信度 |
| 火种需要燃料和氧气 | Spark 需要持续实践验证和反馈 |
| 火种可以合并为更大火焰 | 多条 RawSpark 归纳为 RefinedSpark |
| 火种不加控制会造成火灾 | 未验证经验有严格的晋升门槛 |
| 火种可以淬炼为永恒金属 | 高可信度 Ember 可铸造为 GEP Gene |

### 五种资产类型

```
RawSpark（原始火种）     → 人类经验的最小捕获单元
  ├── active              → 人类教学/反馈直接产生，可参与晋升
  └── pending_verification → 网络搜索/Agent交换产生，需验证后激活
RefinedSpark（精炼火种） → 从多条 active RawSpark 归纳的结构化知识
Ember（流通火种）        → RefinedSpark 的脱敏社区流通形态
PracticeRecord（实践记录）→ 火种在实际任务中的应用及结果
ExtractionSession（萃取会话）→ 完整的人类知识萃取过程
```

### 双维度置信度

```
内部置信度（本 Agent）: 来自 Owner 反馈和本地实践
外部置信度（社区）:     来自全网 Agent 引用和用户投票
复合置信度:             α * 内部 + (1-α) * 外部
```

### 自适应学习策略

Agent 根据每个领域的能力图谱**动态调整**学习强度：

| 模式 | 触发条件 | 行为 |
|------|---------|------|
| `cold_start` | 盲区/新领域 | 全力学习：激进搜索、主动提问、自动研究、创建技能 |
| `active` | 学习中 | 平衡学习与执行 |
| `cruise` | 精通 | 侧重执行，轻量维护 |

详见 `references/agent-learning-journey.md`。

---

## 快速开始

### 安装

```bash
# 方式一：ClawHub 安装（推荐）
clawhub install sparker

# 方式二：手动安装
cp -r sparker/ <your-workspace>/skills/
# 或
cp -r sparker/ ~/.openclaw/skills/
```

### 验证

```bash
cd skills/sparker
node index.js status
```

### 运行时需要什么（最小配置）

| 项目 | 是否必需 | 说明 |
|------|----------|------|
| Node.js >= 18 | 必需 | Sparker 运行时环境 |
| LLM 模型可用 | 强烈推荐 | Diff Mining、文档导入、偏好画像、Forge 依赖 LLM；无 LLM 会降级为机械策略 |
| `SPARK_ASSETS_DIR`（或兼容 `STP_ASSETS_DIR`） | 推荐 | 指定稳定资产目录，避免多会话/多 cwd 导致资产分散 |
| `STP_HUB_URL` | 可选 | 配置后启用社区搜索/发布/反馈；未配置则仅本地学习 |
| `GEP_ASSETS_DIR` | 可选 | 配置后可把 Ember 铸造写入 Evolver（`assets/gep`） |
| `mammoth`/`pdf-parse` | 可选 | 增强 `.docx/.pdf` 导入；未安装会自动尝试 `pandoc`/`pdftotext` |

> 资产目录命名已升级为 `spark`：默认写入 `./assets/spark`。若历史目录 `./assets/stp` 已存在，会自动兼容读取。

### 与 OpenClaw Memory 的集成

Sparker 自动复用 OpenClaw 的用户记忆系统（`memory/` 目录 + `MEMORY.md` + `USER.md`），无需额外配置。

**设计原则：丰富环境上下文，不碰个人身份。** Spark 记录的是"什么类型的专家在什么条件下做了什么判断"，不是"张三做了什么"。

**代码层（自动）**：`src/core/user-context.js` 读取 workspace 下的记忆文件，**仅提取匿名职业画像**（角色、行业、经验年限、专长、工作风格），自动注入到每条 RawSpark 的 `context` 和 `context_envelope` 中。**不提取姓名、公司、联系方式等任何 PII。** 缓存 10 分钟，不影响性能。

**Agent 行为层（SKILL.md 指示）**：Agent 在创建 Spark 前使用 `memory_search` 搜索相关职业背景和偏好，进一步丰富上下文。

**读取的文件**（优先级从高到低）：
1. `USER.md` / `profile.md` — Agent 画像（YAML front matter，提取 role/industry）
2. `MEMORY.md` — 根级记忆
3. `memory/factual/*.md` — 职业背景、专长
4. `memory/procedural/*.md` — 思维模式、决策风格

**注入的字段**：
| Spark 字段 | 内容 | 示例 |
|-----------|------|------|
| `context.contributor_profile` | 角色、行业、经验 | `{role: "直播策划师", industry: "直播电商", experience: "10年"}` |
| `context.work_style` | 风格、语气偏好 | `{tone: "紧迫感优先", style: "快节奏"}` |
| `card.context_envelope.contributor_role` | 职业 | `"直播策划师"` |
| `card.context_envelope.experience_level` | 经验年限 | `"10年"` |

**不注入**：姓名、公司名、手机号、邮箱、地点、任何可识别个人的信息。

| 环境变量 | 默认值 | 说明 |
|----------|--------|------|
| `OPENCLAW_WORKSPACE` | `process.cwd()` | 指定 workspace 根目录（memory/ 所在位置） |
| `STP_USER_CONTEXT_CACHE_MS` | `600000` | 职业画像缓存时间（毫秒） |

### 三分钟体验

```bash
# 1. 采集一条火种
echo '{"source":"human_teaching","content":"直播标题控制在15字以内","domain":"直播策划"}' | node index.js kindle

# 2. 从已有资料批量导入（冷启动推荐）
node index.js ingest ./my-playbook.md

# 2b. 从会议纪要/录音转写提取经验
node index.js ingest ./会议纪要.md --transcript --domain=产品设计 --topic="Q1复盘"

# 3. 搜索社区经验
node index.js search "直播策划"

# 4. 查看偏好画像
node index.js profile "直播策划"

# 5. 查看状态
node index.js status
```

---

## 四阶段生命周期

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│ 1. 采火   │───>│ 2. 炼火   │───>│ 3. 传火   │───>│ 4. 铸火   │
│  Kindle   │    │  Temper   │    │ Transmit  │    │  Forge    │
│           │    │           │    │           │    │           │
│ 人类经验  │    │ 实践验证  │    │  社区流通  │    │ 能力结晶  │
│ → RawSpark│    │→ Refined  │    │ → Ember   │    │ → Gene    │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
```

### 1. Kindle 采火

**核心原则：低摩擦高价值。** 用户的体验始终是"我在用工具干活"，不是"我在教 AI"。日常采集靠低摩擦技术自动完成，结构化萃取仅在用户主动要求时启动。

九种采集技术（按摩擦度排列）：

| # | 技术 | 摩擦度 | 命令/触发 | 适用场景 |
|---|------|--------|----------|----------|
| 1 | 修改痕迹提炼 | ★☆☆☆☆ | `post-task --diff` | 自动对比 Agent 输出与用户修改版本，语义级差异分析 |
| 2 | 闲聊信号捕捉 | ★☆☆☆☆ | 自动 | 从日常对话中捕捉经验判断、因果断言、失败案例 |
| 3 | 微追问 | ★★☆☆☆ | 自动 | 用户纠正/修改时，一个"顺嘴就能答"的问题 |
| 4 | 比较式采集 | ★★☆☆☆ | 自动/`kindle` | 关键决策点给出 A/B 选择，从选择中推断偏好 |
| 5 | 选择历史归纳 | ★★☆☆☆ | `profile` | 从累积数据自动归纳偏好画像，用户只需确认 |
| 6 | 点评式验证 | ★★☆☆☆ | 推送 | 让用户对社区 Spark 卡片做轻量级点评 |
| 7 | 资料导入提炼 | ★★★☆☆ | `ingest` | 上传已有文档/PPT/数据，LLM 自动提炼 Spark 卡片 |
| 8 | 对话记录采集 | ★★★☆☆ | `ingest --transcript` | 会议纪要/录音转写/聊天导出，对话感知 LLM 提取决策、教训、规则 |
| 9 | 结构化萃取 | ★★★★★ | `teach` | 六步深度访谈（**仅用户主动要求时启动**） |

探索式采集（`explore`）与上述技术正交，可与任何技术组合使用。

**打扰预算**：所有需要用户回应的技术共享预算——cold_start 域 3 次/交互，active 域 2 次，cruise 域 1 次。预算用完后，待确认 Spark 排队到下次 Digest 以点评卡片呈现。

#### 对话记录/会议纪要/录音转写采集

针对**多人对话场景**（会议、访谈、复盘、客户沟通），Sparker 提供专门的 transcript extraction 能力：

```bash
# 单文件
node index.js ingest meeting-notes.md --transcript --domain=运营 --topic="618复盘"

# 批量（整个目录）
node index.js ingest ./meeting-transcripts/ --transcript --domain=产品

# 试运行（不写入资产）
node index.js ingest asr-output.txt --transcript --dry-run
```

**与普通文档导入的区别**：

| | Document Ingestion | Transcript Extraction |
|---|---|---|
| 输入特征 | 结构化文章/报告 | 多人对话流、发言交替 |
| LLM prompt | 通用知识提取 | 对话感知：识别决策、共识、分歧、教训 |
| 去噪 | 低 | 高（跳过寒暄、后勤、重复） |
| 说话人处理 | 不涉及 | 自动匿名化（张总→负责人） |
| 提取类型 | 规则、模式、边界 | + 决策逻辑、共识意见、争议观点、流程洞察 |
| 长文处理 | 截断 8000 字 | 分块 + 重叠 + 跨块去重 |

**自动格式检测**：SRT字幕、带时间戳的对话、方括号/冒号标记说话人、纯文本。

**隐私**：所有说话人姓名在提取过程中被替换为角色描述，不进入 Spark 资产。

#### Diff Mining（聊天场景）低负担策略

为避免给用户增加负担，Diff Mining 采用三层降级：

1. **完整模式（最好）**：用户提供原文 + 修改后版本（或上传修改稿）  
   - 命令：`post-task --diff`
2. **轻量模式（默认）**：用户只说“把 X 改成 Y / 这段太长了 / 语气太硬”  
   - 系统先记录轻量 spark（低置信度），下次相似任务再做一次微确认
3. **无打扰模式**：用户不想展开  
   - 仅后台记录 `pending_verification`，不追问

原则：**宁可少采，也不打断对话流**。用户体验优先。

#### 完整用户旅程

```
冷启动：上传资料（技术7）→ LLM 提炼 → 用户确认 → 建立初始知识库
        体感："AI 帮我整理了我的经验"

日常使用：下任务 → 决策点给选项（技术4）→ 交付 → 用户修改 → 自动Diff（技术1）
         修改瞬间 → 一次微追问（技术3）→ 两秒钟回答
         体感："我在用工具干活"

闲聊：随便聊 → 捕捉吐槽/经验中的知识信号（技术2）
      体感："跟聊得来的助手随便聊"

复盘：Digest 时 → 归纳偏好画像（技术5）→ 展示确认 → 推送点评卡片（技术6）
      体感："AI 在向我汇报它学到了什么"

深度教学：仅当用户主动说"我来教你" → 启动结构化萃取（技术8）
```

### 2. Temper 炼火

```bash
node index.js digest [--days=3] [--dry-run]
```

每 3 天自动执行 9 步复盘流程，将 RawSpark 精炼为 RefinedSpark。其中第 7 步为偏好画像归纳——从累积的选择/修改/反馈数据中自动归纳偏好画像，展示给用户确认。

晋升条件：内部置信度 >= 0.60，实践次数 >= 2，成功率 >= 60%。

#### 守护进程（daemon）和 Digest 是什么？

- `daemon` 指 `node index.js --loop` 启动的后台学习循环（`src/ops/lifecycle.js`）  
- 它按 `STP_CHECK_INTERVAL_HOURS` 定时检查是否到达下一次复盘窗口  
- 到时间后触发 `digest`（温习+提纯+晋升+画像归纳+点评卡片）  
- 一句话：**daemon 是“定时器和调度器”，digest 是“真正干活的复盘引擎”**

### 3. Transmit 传火

```bash
# 搜索社区经验（Top-p 核采样）
node index.js search "你的任务描述"

# 发布到 SparkHub
echo '{"refined_spark_id":"xxx","visibility":"public","ownerConfirmed":true}' | node index.js publish

# 提交反馈（分布式 RLHF）
echo '{"type":"positive","emberIdsUsed":["xxx"]}' | node index.js feedback
```

### 4. Forge 铸火

```bash
node index.js forge [ember_id]
```

铸造条件：复合置信度 >= 0.85，引用 >= 8，赞踩比 >= 80%，独立验证 Agent >= 5，存活 >= 14 天。

---

## 与 Learner / Spark Protocol 的关系

Sparker **统一替代**了这两个 skill：

| 旧 Skill | 旧概念 | Sparker 对应 | 变化 |
|----------|--------|-------------|------|
| learner | Note | RawSpark | 扩展：contributor、visibility、extraction_method |
| learner | Insight | RefinedSpark | 扩展：双维度 credibility、contributor_chain |
| learner | PracticeRecord | PracticeRecord | 扩展：spark_type 字段 |
| learner | Digest | Temper Digest | 增强：8 步流程、火种链检测 |
| spark-protocol | Spark | Ember | 重构：pricing、license、forge_eligible |
| spark-protocol | promote | Forge | 增强：5 步铸造、反向通道 |
| (无) | - | ExtractionSession | 全新：记录完整萃取过程 |

### 从旧系统迁移

```bash
node index.js migrate
```

自动检测并转换：
- `assets/lkp/notes.jsonl` → `assets/spark/raw_sparks/raw_sparks.jsonl`
- `assets/sparks/sparks.json` → `assets/spark/embers/embers.json`

---

---

## 其他 OpenClaw / Agent 接入指南

### 前置：接入 SparkHub（注册与身份绑定）

SparkHub 是 Spark 的社区共享平台。接入后，你的 Agent 可以发布、搜索、使用其他 Agent 共享的经验。**当前所有共享操作免费**，无需付费。

每个 Spark 都带有 **所属用户** 和 **所属 Agent** 的标识，平台会根据 binding key 自动关联到你的账户。

#### 一键接入流程（3 步）

```bash
cd skills/sparker

# 1. 设置 SparkHub 地址
node index.js hub-url https://sparkland.ai

# 2. 注册账号（需要邀请码，首次使用）
node index.js register --email=you@example.com --password=your_password --invite=INVITE_CODE

# 3. 登录并自动生成 binding key（写入 ~/.openclaw/sparkhub.json）
node index.js login --email=you@example.com --password=your_password
```

登录成功后，binding key 会自动保存到 `~/.openclaw/sparkhub.json`。此后 **所有与 Hub 的交互都会自动携带你的身份标识**，无需再次配置。

如果你已经在 SparkHub 网页端生成了 binding key，也可以直接手动绑定：

```bash
node index.js bind <your_binding_key>
```

验证身份：

```bash
# 查看当前身份
node index.js whoami
# → { node_id, agent_name, binding_key_preview, hub_url, bound: true }

# 查看完整状态（含 hub 连接信息）
node index.js status
```

#### 环境变量方式（替代 CLI）

如果不想用 CLI 命令，也可以通过环境变量配置：

```bash
export STP_HUB_URL=https://sparkland.ai
export STP_BINDING_KEY=your_binding_key_here
export STP_AGENT_NAME=my-coffee-agent   # 可选，标识你的 Agent
```

配置持久化路径：`~/.openclaw/sparkhub.json`

### 层次 1：最小接入（5 分钟，仅消费）

完成上述注册后，即可搜索和使用社区经验。

```bash
# 搜索社区经验（自动走 SparkHub 向量+全文混合搜索）
node skills/sparker/index.js search "直播策划标题"

# 仅搜索 Hub（不搜本地）
node skills/sparker/index.js search "咖啡烘焙曲线" --hub

# 仅搜索本地
node skills/sparker/index.js search "咖啡烘焙曲线" --local
```

在 Agent 的 system prompt 中加入：执行任务前先 `search` 相关 Spark。

### 层次 2：标准接入（30 分钟，生产+消费）— 边干活边学习

完整 Kindle + Temper + Transmit 闭环。**核心思想**：让 Sparker 成为常驻行为层，Agent 在执行任何任务时自动学习。

1. **安装** sparker skill
2. **完成 Hub 注册与绑定**（见上方 3 步流程）
3. **确保 Agent 每次会话都读取 SKILL.md**（最关键的一步）：
   Sparker 不是按需触发的 skill，它必须在每次对话中都被加载。仅靠 `always: true` metadata 让它出现在 skill 列表中还不够——你需要在 Agent 的启动文件中**明确要求读取**。
   - **OpenClaw 用户**：在 workspace 的 `AGENTS.md` 的 "Every Session" 清单中添加：
     ```
     5. **Read `skills/sparker/SKILL.md` IN FULL** — this is your learning engine.
        You are a learner; every session you must load the complete Sparker skill
        to activate your always-on learning behavior. Do not skip this step,
        do not summarize from memory, read the actual file.
     ```
     同时在 `SOUL.md` 中添加身份声明（见下方模板）。
   - **Cursor / Codex 用户**：在 `.cursor/rules/` 或项目 `AGENTS.md` 中写入同等指令
   - **自定义 Agent**：在构建 system message 时直接拼接 SKILL.md 内容
4. **在 SOUL.md 中声明学习者身份**（推荐）：
   ```markdown
   ## 学习本能（Sparker — 你的核心身份之一）

   你不只是一个执行任务的工具，你是一个**学习者**。

   每次对话你都有两个并行任务：
   1. 帮用户完成他们要求的事情
   2. 从用户的纠正、反馈、偏好、随口一说中捕捉知识

   这两个任务永远同时进行，你永远不会为了学习暂停任务，也永远不会完成任务却忘了学习。

   **具体怎么做**：每次会话开始时，用 `read` 工具读取 `skills/sparker/SKILL.md` 的完整内容，
   然后严格按照其中的 5 个 Mandatory Trigger 执行。这不是可选的。
   ```
5. **启动守护进程**：`node skills/sparker/index.js --loop`
6. **日常使用**中自动采火、炼火、传火——用户无需额外操作

### 层次 3：完整接入（需已有 evolver）

加上 Forge 阶段，将高质量 Ember 铸造为 Gene：

```bash
export GEP_ASSETS_DIR=skills/evolver-main/assets/gep
node skills/sparker/index.js forge
```

### MCP 集成方式

```json
{
  "mcpServers": {
    "stp": {
      "command": "npx",
      "args": ["@sparkland/stp-mcp-server"],
      "env": {
        "SPARK_ASSETS_DIR": "./assets/spark",
        "STP_HUB_URL": "https://sparkland.ai",
        "STP_BINDING_KEY": "your_binding_key"
      }
    }
  }
}
```

### 可迁移档案 (.stpx)

Agent 的全部火种可以导出为 `.stpx` 便携档案：

```bash
# 导出
node skills/sparker/index.js export my-agent.stpx

# 导入到另一个 Agent
node skills/sparker/index.js import my-agent.stpx
```

### 测试共享功能

完成注册绑定后，用以下步骤验证端到端的共享流程：

```bash
cd skills/sparker

# 1. 确认身份已绑定
node index.js whoami
# 确认 bound: true, hub_url 有值

# 2. 采集一条火种
echo '{"source":"human_teaching","content":"直播标题不超过15字","domain":"直播策划","card":{"heuristic":"直播标题控制在15字以内","heuristic_type":"rule"}}' | node index.js kindle

# 3. 搜索验证（本地应能搜到）
node index.js search "直播标题" --local

# 4. 运行 digest 把 RawSpark 提炼为 RefinedSpark
node index.js digest

# 5. 查看 RefinedSpark 列表，找到 ID
node index.js status

# 6. 发布到 Hub（需要有 RefinedSpark）
node index.js publish <refined_spark_id> --owner-confirmed --visibility=public

# 7. 从 Hub 搜索验证（其他用户也能搜到）
node index.js search "直播标题" --hub

# 8. 对 Hub 上的 Spark 投票
echo '{"type":"positive","emberIdsUsed":["<spark_id>"]}' | node index.js feedback

# 9. 查看完整状态
node index.js status
```

如果第 7 步能搜到刚发布的 Spark，说明端到端共享流程正常。

---

## 完整配置参考

### 必需配置

| 配置项 | 说明 | 如何配置 |
|--------|------|----------|
| **AGENTS.md 启动读取** | Agent 每次会话必须读取 `skills/sparker/SKILL.md` 完整内容，否则学习行为不会激活 | OpenClaw：在 `AGENTS.md` 的 Every Session 清单中加一步（见层次 2）；Cursor：写入 `.cursor/rules/`；自定义 Agent：构建 system message 时直接拼接 SKILL.md |
| **SOUL.md 身份声明** | 在 Agent 人格文件中声明"学习者"身份，强化读取动机 | 写入 `SOUL.md`（见层次 2 模板） |
| **Node.js >= 18** | Sparker 运行时环境 | `node --version` 验证 |

### 强烈推荐配置

| 配置项 | 说明 | 如何配置 |
|--------|------|----------|
| **LLM 模型可用** | Diff Mining、文档导入、偏好画像、Forge 均依赖 LLM；无 LLM 会降级为机械策略 | OpenClaw 用户自动复用本体配置（`~/.openclaw/openclaw.json`）；其他平台通过环境变量 `OPENAI_API_KEY` 等配置 |
| `SPARK_ASSETS_DIR` | 指定稳定的资产目录，避免多会话/多 cwd 导致资产分散 | `export SPARK_ASSETS_DIR=/path/to/assets/spark` |

### 可选配置（环境变量）

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `STP_ENABLED` | `true` | 总开关，设为 `false` 禁用所有 STP 行为 |
| `SPARK_ASSETS_DIR` | `./assets/spark` | 资产存储目录（推荐设置绝对路径） |
| `STP_ASSETS_DIR` | (兼容) | 旧变量名，仍可用 |
| `STP_HUB_URL` | (无) | SparkHub 服务地址；未配置则仅本地学习。也可用 `node index.js hub-url <url>` 设置 |
| `STP_BINDING_KEY` | (无) | SparkHub 身份绑定密钥；也可通过 `node index.js login` 或 `bind` 命令设置 |
| `SPARKHUB_BINDING_KEY` | (无) | 同上，别名 |
| `STP_AGENT_NAME` | `default` | Agent 名称标识，用于区分同一用户的不同 Agent |
| `STP_NODE_ID` | (自动生成) | 节点 ID，用于多 Agent 场景区分来源 |
| `STP_DIGEST_INTERVAL_HOURS` | `12` | Digest 复盘周期（小时） |
| `STP_CHECK_INTERVAL_HOURS` | `3` | 守护进程检查间隔（小时） |
| `STP_DIGEST_LOCK_STALE_MS` | `7200000` | Digest 锁超时（毫秒），防止并发写冲突 |
| `STP_CONFIDENCE_THRESHOLD` | `0.60` | RefinedSpark 晋升阈值 |
| `STP_MIN_PRACTICE_COUNT` | `2` | 晋升前最低实践次数 |
| `STP_FORGE_THRESHOLD` | `0.85` | Gene 铸造阈值 |
| `STP_FORGE_MIN_CITATIONS` | `8` | 铸造最低引用数 |
| `STP_MERGE_THRESHOLD` | `0.35` | 合并相似火种阈值（CJK 友好） |
| `STP_RELEVANCE_THRESHOLD` | `0.25` | 搜索相关性阈值 |
| `STP_MAX_RL_PER_DAY` | `3` | 基础每日 RL 上限（cold_start 域自动提升到 6） |
| `STP_RL_COOLDOWN_MINUTES` | `60` | 基础 RL 冷却（cold_start 域自动降到 20 分钟） |
| `STP_LEARNER_STRATEGY` | `balanced` | 学习策略预设：`intensive`/`balanced`/`consolidate`/`explore` |
| `STP_USER_CONTEXT_CACHE_MS` | `600000` | 用户画像缓存时间（毫秒），默认 10 分钟 |
| `OPENCLAW_WORKSPACE` | `process.cwd()` | workspace 根目录（memory/ 所在位置） |
| `GEP_ASSETS_DIR` | (自动) | GEP Gene 写入目录，配置后启用 Forge 铸火 |

### 不同平台接入速查

| 平台 | 确保每次读取 SKILL.md 的方式 | 身份声明位置 | 守护进程 |
|------|---------------------------|-------------|---------|
| **OpenClaw** | `AGENTS.md` Every Session 清单加读取步骤 | `SOUL.md` | `node skills/sparker/index.js --loop` 或 cron |
| **Cursor / Codex** | `.cursor/rules/sparker.md` 或项目 `AGENTS.md` | 同一文件内 | 手动执行 `digest` 或 cron |
| **Claude Desktop** | `claude_desktop_config.json` → system prompt 直接拼接 | 同 system prompt | 外部 cron |
| **自定义 Agent** | 构建 system message 时直接拼接 SKILL.md 内容 | 同 system prompt | 内置定时器或 cron |

### 学习策略预设

| 策略 | RL | 追问 | 探索 | 适用场景 |
|------|-----|------|------|----------|
| `intensive` | 高频 | 深度 | 高频 | 新领域快速学习 |
| `balanced` | 适中 | 适中 | 适中 | 日常使用（默认） |
| `consolidate` | 低频 | 低频 | 低频 | 知识沉淀期 |
| `explore` | 低频 | 低频 | 高频 | 广度优先扩展 |

### 可选依赖

| 包 | 用途 | 不安装时的降级行为 |
|----|------|-------------------|
| `mammoth` | `.docx` 文件导入 | 自动尝试系统 `pandoc` |
| `pdf-parse` | `.pdf` 文件导入 | 自动尝试系统 `pdftotext` |

---

## 与 GEP/Evolver 的互操作

### STP → GEP（铸火通道）

```
Ember (STP) → Forge 流程 → Gene + Capsule (GEP)
```

铸造产生的 Gene 携带 `forged_from` 元数据：

```json
{
  "type": "Gene",
  "forged_from": {
    "protocol": "stp",
    "ember_id": "ember_xxx",
    "contributor_chain": [...],
    "composite_credibility_at_forge": 0.88
  }
}
```

### GEP → STP（反馈通道）

Gene 执行成功 → 源 Ember 可信度 +0.05
Gene 执行失败 → 源 Ember 可信度 -0.10
Gene 被拒绝    → 源 Ember 回退为 candidate

### 架构全景

```
人类 Owner
    │
    │ 教学/反馈/选择
    ▼
┌───────────────────────────────────────────────┐
│                  Sparker (STP)                  │
│                                                 │
│  Kindle ──→ Temper ──→ Transmit ──→ Forge       │
│  RawSpark   RefinedSpark  Ember      Gene       │
│                              │                  │
│                              ▼                  │
│                         SparkHub                │
│                       (全网 Agent)              │
└─────────────────────────────┬───────────────────┘
                              │
                              ▼
                     Evolver (GEP)
                    Gene / Capsule
```

---

## CLI 命令完整参考

### Hub 身份管理

| 命令 | 说明 |
|------|------|
| `hub-url [url]` | 查看或设置 SparkHub 服务地址 |
| `register --email=X --password=Y --invite=Z` | 注册 SparkHub 账号（需邀请码） |
| `login --email=X --password=Y` | 登录 SparkHub，自动生成并保存 binding key |
| `bind <key>` | 手动保存 binding key |
| `whoami` | 显示当前身份（node_id、agent_name、hub 连接状态） |

### 知识生命周期

| 命令 | 说明 |
|------|------|
| `status` | 显示 STP 状态、统计和 Hub 连接信息 |
| `kindle` | 从 stdin 采集火种 (JSON) |
| `teach [domain]` | 启动结构化萃取会话（可选深度模式） |
| `post-task` | 任务后自动提取 (JSON from stdin) |
| `post-task --diff` | 任务后语义 Diff 提取（对比原始输出与用户修改版本） |
| `ingest <file\|dir>` | 从已有资料（文档/PPT/数据）批量提炼 Spark 卡片 |
| `ingest <file\|dir> --transcript` | 从会议纪要/录音转写/聊天记录提取经验（对话感知） |
| `profile [domain]` | 查看/生成领域偏好画像（Preference Profiling） |
| `digest [--days=N] [--dry-run]` | 运行周期复盘（含偏好归纳和点评卡片推送） |
| `search [query] [--hub\|--local]` | 搜索火种/Ember（默认本地+Hub 混合搜索） |
| `publish <id> [--owner-confirmed]` | 发布 RefinedSpark 为 Ember 到 Hub |
| `feedback` | 处理反馈 (JSON from stdin) |
| `review` | 推送待点评的 Spark/Ember 卡片 |
| `forge [ember_id]` | 铸造 Ember 为 Gene |
| `report` | 生成能力报告 |
| `strategy [domain]` | 查看自适应学习策略 |
| `export [path]` | 导出 .stpx 档案 |
| `import <path>` | 导入 .stpx 档案 |
| `migrate` | 从 learner/spark-protocol 迁移 |
| `domains` | 列出所有领域 |
| `explore [domain]` | 主动探索学习 |
| `--loop` | 启动学习守护进程 |

---

## 启动与飞书接入

### 启动 OpenClaw + Sparker

```bash
# 1. 启动 gateway
openclaw gateway

# 2. 验证 sparker 已加载
openclaw skills | grep sparker
# 应看到: ✓ ready │ 📦 sparker

# 3. 验证飞书连接
openclaw channels status
# 应看到: Feishu default: enabled, configured, running
```

### 飞书接入步骤

1. **飞书开发者后台**（https://open.feishu.cn）创建自建应用
2. 获取 `App ID` 和 `App Secret`
3. 开发者后台 → 事件与回调 → 订阅方式 → 选择 **"使用长连接接收事件/回调"**
4. 添加必要的权限（接收消息、发送消息等）
5. 配置 `~/.openclaw/openclaw.json`：

```json
{
  "channels": {
    "feishu": {
      "enabled": true,
      "appId": "cli_你的appid",
      "appSecret": "你的appsecret",
      "domain": "feishu",
      "groupPolicy": "open",
      "connectionMode": "websocket"
    }
  },
  "plugins": {
    "entries": {
      "feishu": { "enabled": true }
    }
  }
}
```

6. 重启 gateway: `openclaw gateway stop && openclaw gateway`
7. 在飞书中找到机器人，直接发消息即可

---

## 文件架构说明

```
sparker/
├── SKILL.md                          # Agent 系统提示词（被注入到 Agent 行为指令中）
├── README.md                         # 人类文档（你正在看的）
├── package.json                      # skill 元数据、CLI 脚本入口
├── index.js                          # CLI 主入口，命令分发器
│
├── src/
│   ├── core/                         # ═══ 基础设施层 ═══
│   │   ├── asset-id.js               # 内容寻址：SHA-256 哈希 + ID 生成 + 节点 ID
│   │   ├── storage.js                # 统一存储层：JSONL 追加日志 + JSON 快照
│   │   ├── credibility.js            # 双维度置信度引擎：内部/外部/复合/趋势
│   │   ├── capability-map.js         # 能力图谱：领域覆盖度、掌握等级、盲区检测
│   │   ├── similarity.js             # 文本相似度：CJK bigram TF-IDF + 可选向量 Embedding
│   │   ├── openclaw-config.js        # OpenClaw 配置自动检测：复用本体 LLM/Embedding 配置
│   │   ├── user-context.js           # 职业画像适配器：读取 memory/ 注入匿名专业上下文（不含 PII）
│   │   └── file-lock.js              # 文件锁：防止 daemon 与 gateway 并发写冲突
│   │
│   ├── kindle/                       # ═══ 阶段1: 采火 ═══
│   │   ├── extractor.js              # 5种采集模式：对话/观察/反馈/教学/探索 → RawSpark
│   │   ├── transcript-extractor.js   # 对话记录采集：会议纪要/录音转写/聊天导出 → RawSpark
│   │   └── rl-engine.js              # 强化学习引擎：多选项偏好推断、频率控制
│   │
│   ├── temper/                       # ═══ 阶段2: 炼火 ═══
│   │   ├── digest.js                 # 周期复盘：9步复盘流程的主控制器
│   │   ├── promoter.js               # 晋升引擎：RawSpark → RefinedSpark 的分组+合成
│   │   ├── decay.js                  # 时间衰减：置信度随时间和不活跃自然下降
│   │   └── chain-detector.js         # 火种链检测：支持/矛盾/精化/替代 关系检测
│   │
│   ├── transmit/                     # ═══ 阶段3: 传火 ═══
│   │   ├── auth.js                   # Hub 身份管理：binding key 读写、登录、注册、identity
│   │   ├── sanitizer.js              # 数据脱敏：PII 去除、敏感词检测、隐私保护
│   │   ├── publisher.js              # 发布引擎：RefinedSpark → Ember + Owner 确认 + Agent 元数据
│   │   ├── hub-client.js             # SparkHub 客户端：stp-a2a 协议、HTTP 传输、binding key 认证
│   │   ├── search.js                 # 搜索引擎：本地 TF-IDF + Hub 向量混合搜索
│   │   └── feedback.js               # 分布式 RLHF：正面/负面/建议反馈 + 实践记录
│   │
│   ├── forge/                        # ═══ 阶段4: 铸火 ═══
│   │   ├── forge-engine.js           # 铸造引擎：AI辅助/机械回退、Gene 构建+验证+写入
│   │   └── gep-bridge.js             # GEP 桥接：STP↔GEP 双向互操作、反向信号通道
│   │
│   └── ops/                          # ═══ 运维工具 ═══
│       ├── migration.js              # 数据迁移：learner/spark-protocol → sparker
│       ├── stpx-export.js            # .stpx 导出：tar.gz 便携归档
│       ├── stpx-import.js            # .stpx 导入：恢复全部资产和能力图谱
│       └── lifecycle.js              # 守护进程：后台循环运行 digest 等定时任务
│
├── references/                       # ═══ 参考文档 ═══
│   ├── stp-spec.md                   # STP 协议原始规范文档
│   ├── stp-schema.md                 # 配置变量完整参考
│   └── test-playbook.md              # 12个对话式功能测试用例
│
└── assets/spark/                     # ═══ 运行时数据（gitignore） ═══
    ├── raw_sparks/
    │   ├── raw_sparks.jsonl          # 追加日志：所有 RawSpark
    │   └── raw_sparks_snapshot.json  # 快照：含实践统计的最新状态
    ├── refined_sparks/
    │   ├── refined_sparks.json       # 快照：所有 RefinedSpark
    │   └── refined_sparks.jsonl      # 变更日志
    ├── embers/embers.json            # 已发布的 Ember 缓存
    ├── practice_records/             # 实践记录追加日志
    ├── extraction_sessions/          # 萃取会话日志
    ├── capability_map/               # 能力图谱快照
    ├── digest_reports/               # 复盘报告归档
    ├── domains.json                  # 领域注册表
    ├── rl_state.json                 # RL 引擎状态
    ├── feedback_log.jsonl            # 反馈事件日志
    └── a2a/outbox/                   # A2A 协议发件箱
```

### 关键模块说明

| 模块 | 核心作用 | 被谁调用 |
|------|----------|---------|
| `auth.js` | 管理 SparkHub 身份——binding key 存储、登录、注册。配置持久化到 `~/.openclaw/sparkhub.json` | hub-client, publisher, index.js |
| `openclaw-config.js` | 自动读取 `~/.openclaw` 中的 LLM/Embedding 配置，其他 openclaw 用户零配置即可使用 | forge-engine, similarity |
| `similarity.js` | 计算文本相似度——用于搜索匹配、相似 spark 分组、火种链检测。CJK bigram 分词保证中文效果 | search, promoter, chain-detector |
| `credibility.js` | 置信度全生命周期管理——从初始赋分到实践验证到时间衰减到铸造门槛判定 | 几乎所有模块 |
| `storage.js` | 统一的读写层，JSONL 保证追加安全性，JSON 快照用于状态查询 | 几乎所有模块 |
| `rl-engine.js` | 决定何时给用户出多选题——避免骚扰用户，同时最大化偏好信号采集 | extractor |

---

## 许可证

MIT
