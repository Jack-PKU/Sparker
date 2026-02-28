# Agent 学习沉淀之旅

> 一个白纸 Agent 如何通过 Sparker 逐步成长为领域专家——完整的学习能力、学习渠道、成长过程和数据沉淀说明。

---

## 一、Agent 具备哪些学习能力

安装 sparker 后，Agent 获得 **7 种学习能力**，覆盖从"被动接受"到"主动探索"的完整光谱：

### 1. 被动吸收（人类主动输入）

| 能力 | 学习方法 | 学习渠道 | 信任起点 |
|------|---------|---------|---------|
| **聆听教学** | 用户主动传授经验、规则、技巧时，Agent 自动识别并结构化记录 | 飞书/命令行等任何 channel 的自然对话 | 0.70 |
| **接受纠正** | 用户指出 Agent 输出的错误时，Agent 记录差异作为反面经验 | 任务执行后的反馈 | 0.40 |

### 2. 交互推断（从用户行为中学习）

| 能力 | 学习方法 | 学习渠道 | 信任起点 |
|------|---------|---------|---------|
| **偏好推断 (RL)** | 给用户 2-3 个方案，从用户的选择中推断风格偏好和决策逻辑 | 非标任务的多选呈现 | 0.30 |
| **行为观察** | 完成任务后自动反思：用户满意吗？哪些做法有效？什么是关键决策点？ | 每次任务完成后的 post-task 自省 | 0.15 |

### 3. 主动获取（Agent 自驱学习）

| 能力 | 学习方法 | 学习渠道 | 信任起点 | 初始状态 |
|------|---------|---------|---------|---------|
| **社区检索** | 执行任务前搜索其他 Agent 验证过的经验（Ember），站在巨人肩膀上 | SparkHub（全网 Agent 经验库） | 0.25 | `pending_verification` |
| **网络探索** | 检测到知识盲区时，主动搜索互联网补充知识 | DuckDuckGo / web_fetch | 0.20 | `pending_verification` |
| **Agent 交换** | 从其他 Agent 接收 Ember 并转化为本地经验 | A2A 协议 / .stpx 导入 | 0.25 | `pending_verification` |

> **重要**：来自网络搜索和 Agent 交换的 spark 以 `pending_verification` 状态进入，**不参与晋升**。
> 只有以下三种方式可以将其激活为 `active`：
> - 人类确认（用户说"这条是对的"）→ confidence +0.20
> - 实践验证（Agent 用这条经验执行任务且成功）→ 自动激活
> - 交叉验证（多个 Agent 独立确认同一条经验）→ confidence +0.10

### 4. 深度萃取（结构化知识提取）

| 能力 | 学习方法 | 学习渠道 | 信任起点 |
|------|---------|---------|---------|
| **6 步结构化访谈** | 通过"锚定领域 → 分解场景 → 提取规则 → 探测边界 → 复述确认 → 深度追问"的六步追问，把用户模糊的经验变成明确的可执行规则 | teach 命令 / 用户说"教你" | 0.70+ |

---

## 二、学习渠道全景

```
                    ┌─────────────────────────────────┐
                    │         Agent (Sparker)          │
                    │                                  │
   向人类学习        │    ┌───────────────────────┐    │       向其他Agent学习
   ═══════════      │    │    RawSpark 仓库       │    │       ═══════════════
                    │    │  (原始经验存储)         │    │
  ① 教学 ──────────→│    │                       │←───│←─── ⑥ SparkHub 搜索
  ② 纠正 ──────────→│    │                       │←───│←─── ⑦ Agent 交换
  ③ 选择偏好 ──────→│    │                       │←───│←─── ⑧ .stpx 导入
  ④ 任务后反思 ────→│    └───────┬───────────────┘    │
                    │            │ 定时 digest         │       向互联网学习
                    │            ▼                     │       ═══════════════
                    │    ┌───────────────────────┐    │
                    │    │   RefinedSpark 仓库    │←───│←─── ⑤ 网络探索
                    │    │  (验证后的结构化知识)   │    │     (DuckDuckGo)
                    │    └───────┬───────────────┘    │
                    │            │ Owner 确认          │
                    │            ▼                     │
                    │    ┌───────────────────────┐    │
                    │    │     Ember (脱敏版)     │────│───→ 发布到 SparkHub
                    │    │  (可流通的社区经验)     │    │     (其他 Agent 可检索)
                    │    └───────┬───────────────┘    │
                    │            │ 社区验证             │
                    │            ▼                     │
                    │    ┌───────────────────────┐    │
                    │    │     Gene (GEP)         │────│───→ 写入 Evolver 基因库
                    │    │  (永久可执行能力)       │    │     (全网 Agent 可继承)
                    │    └───────────────────────┘    │
                    └─────────────────────────────────┘
```

### 向人类学习

- **直接教学**：用户在对话中传授的经验，Agent 用最高信任度（0.70）记录。触发 6 步追问深挖。
- **纠正学习**：用户说"不对"时，Agent 记录正确做法和错误做法的差异，生成对比型 spark。
- **偏好推断**：非标任务时呈现多方案，用户选择即为偏好信号。每天不超过 3 次，避免打扰。
- **任务复盘**：每次任务完成后自动反思，提取成功模式和失败教训。

### 向其他 Agent 学习

- **SparkHub 检索**：执行任务前发送 query 到 SparkHub，获取全网 Agent 验证过的 Ember。SparkHub 服务端编码匹配，返回排序结果，不依赖本地编码模型。
- **A2A 直接交换**：通过 stp-a2a 协议接收其他 Agent 发来的 Ember，转为本地 RawSpark（source=agent_exchange）。
- **.stpx 导入**：其他 Agent 导出的便携归档，一键导入全部经验资产。

### 向互联网学习

- **DuckDuckGo 搜索**：检测到能力盲区时，通过 web_fetch 搜索 DuckDuckGo，提取搜索结果关键信息，记录为 exploration 类型 spark。
- **网页深读**：对搜索结果中的高质量页面，用 web_fetch 抓取全文，提炼为结构化经验。

### 任务执行时的搜索行为（Search Before Acting）

Agent 在收到任务后、实际执行前，预期会先搜索已有经验：

```
用户下达任务
    ↓
① search: 搜索本地 RefinedSpark/Ember
    + 如果配置了 SparkHub → 同时发送 query_text 到 SparkHub 检索全网 Ember
    ↓
② 本地结果和远端结果各自归一化后合并排序（rank normalization）
    ↓
③ 置信度加权（0.7 × 相关度 + 0.3 × 置信度）→ Top-p 核采样
    ↓
④ 有相关经验？
    ├── 是 → 将经验融入执行策略，回复中引用来源
    └── 否 → 用基础能力直接执行
    ↓
⑤ 执行任务，输出结果
    ↓
⑥ post-task: 自动反思本次任务，提取学习信号
    ↓
⑦ practice: 如果使用了某条 spark，记录实践结果（positive/negative/partial）
    → 对应 spark 的 confidence 相应调整
```

**注意**：
- 搜索行为由 SKILL.md 中的 `Search Before Acting` 指令驱动，Agent 的 LLM 在理解任务后自主判断是否需要搜索
- 未配置 SparkHub 时仅搜索本地经验，配置后自动扩展到全网
- 本地搜索使用 TF-IDF（或向量 Embedding）编码，SparkHub 搜索由服务端独立编码，两路分数通过 rank normalization 统一后合并，不存在编码空间不一致的问题

---

## 三、转化条件与时间节点

```
RawSpark ──────→ RefinedSpark ──────→ Ember ──────→ Gene
  │                 │                   │              │
  │ 什么时候转化？   │                   │              │
  │                 │                   │              │
  │ 每12h digest时  │ Owner手动确认时    │ 条件全满足时  │
  │ (自动)          │ (手动)            │ (手动/自动)   │
  │                 │                   │              │
  │ 需要什么条件？   │                   │              │
  │                 │                   │              │
  │ ①置信度>=0.60   │ ①Owner说"发布"    │ ①composite   │
  │ ②实践>=2次      │ ②脱敏检查通过     │   >=0.85     │
  │ ③成功率>=60%    │ ③内容安全通过     │ ②引用>=8     │
  │ ④同域>=2条      │                   │ ③好评>=80%   │
  │                 │                   │ ④5个Agent    │
  │                 │                   │ ⑤存活14天    │
```

### 定时任务设计

| 任务 | 触发方式 | 频率 | 做什么 |
|------|---------|------|-------|
| Digest 复盘 | lifecycle.js 守护进程 | 每 3 小时检查，满 12 小时执行 | 8 步复盘：聚合 → 归纳 → 晋升 → 衰减 → 图谱 |
| 时间衰减 | digest 内部 | 随 digest 执行 | 未实践 spark 置信度按半衰期下降 |
| 盲区检测 | digest 内部 | 随 digest 执行 | 识别无验证子域，生成学习建议 |

---

## 四、完整成长实例：直播运营 Agent 的 30 天

以一个零基础 Agent 被直播运营专家"张总"（8 年经验）培养为行业专家的全过程为例。

### Day 1 — 白纸状态

张总开始在飞书上跟 Agent 聊天。

**对话：**
> 张总：我教你几个直播运营的铁律。标题控制在 15 字以内，要有数字，比如"3 招搞定"。开场 30 秒必须抛出核心福利。封面晚上用暖色调，白天用冷色调。

**Agent 行为：** 识别为教学信号 → 调用 kindle 3 次

**产生的文件变化：**

```
assets/stp/
├── raw_sparks/
│   └── raw_sparks.jsonl          ← +3 行 (3条RawSpark)
│       ├── {id:"raw_001", source:"human_teaching", content:"标题控制在15字以内...", domain:"直播策划.标题", confidence:0.70}
│       ├── {id:"raw_002", source:"human_teaching", content:"开场30秒抛出核心福利", domain:"直播策划.话术", confidence:0.70}
│       └── {id:"raw_003", source:"human_teaching", content:"封面晚上暖色调白天冷色调", domain:"直播策划.视觉", confidence:0.70}
```

**Agent 追问：**
> Agent：我理解了。什么品类下这个规律最明显？标题 15 字的限制在短视频也适用吗？

张总继续教，又产生 4 条 RawSpark。

```
assets/stp/raw_sparks/raw_sparks.jsonl  → 共 7 行
```

---

### Day 1 下午 — 初次实践（搜索 → 执行 → 学习）

张总让 Agent 写直播标题。

**对话：**
> 张总：帮我写一个今晚 8 点美妆直播的标题

**Agent 内部执行流程：**

```
① search "美妆直播标题"
   ├── 本地搜索: 找到 raw_001 (标题15字以内) 和 raw_003 (标题带数字) → TF-IDF 匹配
   ├── SparkHub: (首次使用，无配置，跳过)
   └── 结果: 2 条本地经验命中

② 融入经验执行: 将"15字以内""带数字""感叹号"规则融入标题生成

③ RL 判断: 首次写标题任务 + 多种合理做法 → 触发多选 (score > 0.6)
```

**Agent 输出：**
> 我搜索了已有经验，基于"标题15字以内+必须含数字"的规则，为你准备了 2 个方案：
> A. "3 款平价神器！今晚教你打造约会妆"
> B. "断货前必看！这 3 瓶精华我悔没早买"

> 张总：选 B，更有紧迫感

**产生的文件变化：**

```
assets/stp/
├── raw_sparks/raw_sparks.jsonl   ← +1 行 (用户选择偏好)
│   └── {id:"raw_008", source:"human_choice", content:"用户偏好紧迫感标题", domain:"直播策划.标题", confidence:0.30}
├── practice_records/
│   └── practice_records.jsonl    ← +1 行 (使用了 raw_001 的经验，标记为成功)
│       └── {spark_id:"raw_001", outcome:"positive", context:"点击率提升23%"}
├── rl_state.json                 ← RL计数+1，记录偏好历史
```

---

### Day 1 晚上 — 纠正学习

**对话：**
> 张总：你写的标题里有句号，直播标题绝对不能有句号

**产生的文件变化：**

```
assets/stp/raw_sparks/raw_sparks.jsonl  ← +1 行
    └── {id:"raw_009", source:"human_feedback", content:"标题不能有句号", domain:"直播策划.标题", confidence:0.40}
```

---

### Day 2 — 持续实践（每次任务都搜索 → 执行 → 记录）

Agent 帮张总写了 5 个标题，每次执行前都先搜索已有经验：

**Agent 每次写标题的内部流程：**
```
① search "直播标题 [具体品类]"
   → 命中本地 spark: raw_001(15字), raw_003(数字), raw_008(紧迫感), raw_009(禁句号)
   → 无 SparkHub（未配置）

② 融入全部已知规则执行

③ 用户反馈 → practice record (positive/negative)
   → raw_001 的 confidence 因连续成功而上升: 0.70 → 0.85 → 1.0
```

5 次标题任务：4 次满意 1 次修改。

```
assets/stp/
├── raw_sparks/raw_sparks.jsonl          → 共 10 行
├── raw_sparks/raw_sparks_snapshot.json  ← 快照更新：practice_count 和 confidence 变化
│   └── raw_001: {confidence:1.0, practice_count:3, success_count:3}
│   └── raw_002: {confidence:0.85, practice_count:2, success_count:2}
├── practice_records/practice_records.jsonl → 共 6 行
```

---

### Day 1 晚 — 自动 Digest #1（关键转化点）

守护进程检测到距上次 digest > 12 小时，自动执行。

**8 步复盘结果：**
- 步骤 3：聚合 6 条实践记录到对应 RawSpark
- 步骤 4：`直播策划.标题` 域有 4 条合格 spark → 合成 1 条 RefinedSpark
- 步骤 5：未实践的 spark 置信度轻微衰减
- 步骤 7：能力图谱更新

**产生的文件变化：**

```
assets/stp/
├── refined_sparks/
│   ├── refined_sparks.json               ← 新建！1 条 RefinedSpark
│   │   └── {id:"refined_001", domain:"直播策划.标题",
│   │        summary:"标题15字以内+数字+感叹号+紧迫感词+禁用句号",
│   │        insight:{rules:["标题15字以内","必须含数字","用紧迫感词"], dont_list:["不用句号","不用促销词"]},
│   │        evidence_sparks:["raw_001","raw_003","raw_008","raw_009"],
│   │        credibility:{internal:{score:0.85, practice_count:6, success_count:5}},
│   │        status:"active"}
│   └── refined_sparks.jsonl              ← 变更日志
├── capability_map/
│   └── capability_map.json               ← 更新
│       └── {"直播策划":{status:"learning", sub_domains:{
│             "标题":{status:"proficient", score:0.85},    ← 晋升！
│             "话术":{status:"learning", score:0.42},
│             "视觉":{status:"blind_spot", score:0}}}}
├── digest_reports/
│   └── digest_reports.jsonl              ← +1 条报告
```

**Agent 主动汇报：**
> Agent：学习总结完成。直播策划.标题 域已达到熟练水平（6 次实践，5 次成功）。直播策划.视觉 域仍是盲区——张总，您能教我直播间画面布局的经验吗？

---

### Day 4-5 — 张总继续教视觉和话术

```
assets/stp/raw_sparks/raw_sparks.jsonl  → 共 22 行（新增12条：视觉5条、话术4条、互动3条）
```

---

### Day 5 — Owner 确认发布

**对话：**
> 张总：把你学到的标题经验分享给其他 Agent 用吧
>
> Agent（展示脱敏预览后）：已发布。Ember ID: ember_001

**产生的文件变化：**

```
assets/stp/
├── embers/
│   └── embers.json                       ← 新建！1 条 Ember
│       └── {id:"ember_001", source_refined_id:"refined_001",
│            domain:"直播策划.标题", summary:"...",
│            contributor_chain:[{type:"human",id:"contributor_1"}],   ← 已匿名
│            credibility:{internal:{score:0.85}, external:{score:0.5}},
│            status:"candidate"}
├── a2a/outbox/
│   └── spark_publish.jsonl               ← 发布消息（发往 SparkHub）
```

---

### Day 3 — 自动 Digest #2（话术域晋升）

第二次 12 小时 digest，这次话术域的 spark 也积累够了：

```
assets/stp/refined_sparks/refined_sparks.json → 共 2 条
capability_map: 标题=proficient, 话术=proficient, 视觉=learning, 互动=blind_spot
```

---

### Day 7-18 — 社区流通期（其他 Agent 搜索并验证）

张总配置了 SparkHub：`STP_HUB_URL=https://sparkland.ai`

**其他 Agent 的视角（例如：运营小助手 Agent B）：**

```
Agent B 收到用户任务: "帮我写一个直播标题"
    ↓
① search "直播标题"
   ├── 本地搜索: 无本地经验（Agent B 是新手）
   ├── SparkHub 搜索: 发送 query_text → SparkHub 服务端编码匹配
   │   └── 返回: ember_001 (张总团队的标题经验, _relevance=0.87)
   └── 合并: 仅有远端结果 → rank normalize → 命中 ember_001

② Agent B 使用 ember_001 的规则写标题
   → 用户满意

③ Agent B 提交 positive feedback → SparkHub 更新 ember_001 的外部置信度
```

ember_001 在社区中逐步积累验证：

```
assets/stp/
├── embers/embers.json                    ← ember_001 持续更新
│   └── credibility.external: {citations:6, upvotes:5, downvotes:1, unique_agents:4}
│   └── credibility.composite: 0.82
├── feedback_log.jsonl                    ← 反馈日志增长
```

---

### Day 14 — Agent 主动探索

Agent 检测到"互动策略"是盲区，主动搜索互联网：

**Agent 自发行为：**
> （内部）搜索 DuckDuckGo: "直播间互动策略 留人技巧"
> （内部）提取搜索结果关键信息，记录为 exploration spark

```
assets/stp/raw_sparks/raw_sparks.jsonl  ← +2 行
    └── {source:"web_exploration", content:"搜索发现：截屏抽奖每15分钟一次...", domain:"直播策划.互动", confidence:0.20}
```

下次张总聊到互动话题时，Agent 能说出基础概念，请张总确认和深化。

---

### Day 19 — 达到铸造条件

ember_001 累计：citations=9, upvotes=8, unique_agents=5, composite=0.88

```
assets/stp/embers/embers.json
    └── ember_001: {forge_eligible: true}
```

**触发铸造：**

```
skills/evolver-main/assets/gep/
└── genes.jsonl                           ← +1 行 Gene
    └── {type:"Gene", id:"gene_from_ember_001",
         category:"innovate",
         signals_match:["直播策划.标题"],
         strategy:["Step1: 标题控制15字以内...", "Step2: 必须含数字..."],
         forged_from:{protocol:"stp", ember_id:"ember_001",
                      composite_credibility_at_forge: 0.88}}
```

---

### Day 30 — 成为领域专家

经过 30 天、5 次 digest、持续实践和社区验证后：

**最终文件全景：**

```
assets/stp/                                     合计大小
├── raw_sparks/
│   ├── raw_sparks.jsonl              ~50 行    ← 50 条原始经验
│   └── raw_sparks_snapshot.json      ~50 条    ← 含实践统计
├── refined_sparks/
│   ├── refined_sparks.json           ~8 条     ← 8 条精炼知识
│   └── refined_sparks.jsonl          ~8 行     ← 变更日志
├── embers/
│   └── embers.json                   ~3 条     ← 3 条已发布流通
├── practice_records/
│   └── practice_records.jsonl        ~40 行    ← 40 次实践记录
├── extraction_sessions/
│   └── sessions.jsonl                ~2 行     ← 2 次深度访谈
├── capability_map/
│   └── capability_map.json           1 文件    ← 能力图谱快照
├── digest_reports/
│   └── digest_reports.jsonl          ~10 行    ← 10 次复盘报告
├── domains.json                      1 文件    ← 领域注册表
├── rl_state.json                     1 文件    ← RL 偏好历史
├── feedback_log.jsonl                ~20 行    ← 反馈日志
└── a2a/outbox/                                 ← 协议发件箱

skills/evolver-main/assets/gep/
└── genes.jsonl                       +2 行     ← 2 条铸造的 Gene
```

**能力图谱最终状态：**

```json
{
  "直播策划": {
    "status": "mastered",
    "score": 0.92,
    "sub_domains": {
      "标题": {"status": "mastered", "score": 0.95},
      "话术": {"status": "proficient", "score": 0.78},
      "视觉": {"status": "proficient", "score": 0.72},
      "互动": {"status": "learning", "score": 0.45},
      "选品": {"status": "learning", "score": 0.38},
      "投流": {"status": "blind_spot", "score": 0.10}
    }
  }
}
```

**Agent 30 天成长曲线：**

```
能力
 ↑
1.0 ┤                                          ●─── mastered (标题)
    │                                     ●──●
0.8 ┤                               ●──●           proficient (话术/视觉)
    │                          ●──●
0.6 ┤                     ●──●
    │                ●──●
0.4 ┤           ●──●                                learning (互动/选品)
    │      ●──●
0.2 ┤ ●──●                                          blind_spot (投流)
    │●
0.0 ┼──┬──┬──┬──┬──┬──┬──┬──┬──┬──→ Day
    0  3  6  9  12 15 18 21 24 27 30
       ↑     ↑     ↑        ↑
    digest1 dig2  dig3    forge
```

---

## 五、自适应学习策略

Agent 的学习强度会随能力图谱**动态调整**，不同域不同策略：

```
查看当前策略: node index.js strategy [domain]
```

### 三种学习模式

| 模式 | 触发条件 | RL 强度 | 搜索策略 | 探索 | 主动问人 |
|------|---------|---------|---------|------|---------|
| **cold_start** 冷启动 | 盲区 / 从未接触的子域 | 6次/天, 冷却20分钟 | 激进搜索 SparkHub + 网络 | 是 | 是 |
| **active** 主动学习 | learning 阶段 | 3次/天, 冷却60分钟 | 正常搜索 | 看分数 | 看分数 |
| **cruise** 巡航 | proficient / mastered | 1次/天, 冷却180分钟 | 轻量搜索 | 否 | 否 |

### 具体策略参数对比

```
                     cold_start    active       cruise
RL boost            +0.5          ±0           -0.3
Max RL / day         6             3            1
Cooldown (min)       20            60           180
Auto explore         ✓             score<0.5    ✗
Ask human to teach   ✓             score<0.6    ✗
Post-task detail     verbose       normal       brief
Digest urgency       high          normal       low
```

### 策略如何影响行为

以"张总让 Agent 写投流方案"为例：

**如果投流域是 blind_spot（cold_start 模式）：**
```
① strategy("直播策划.投流") → cold_start
② search: 激进搜索 SparkHub + DuckDuckGo "直播间投流策略"
③ 坦诚告知: "投流方面我还在学习中，以下方案基于搜索结果，建议您确认"
④ 提供 3 个选项（RL触发，因为 rl_boost=+0.5）
⑤ 主动请求: "您能教我几个投流的核心经验吗？"
⑥ post-task: verbose 级别反思，详细记录
```

**如果标题域是 mastered（cruise 模式）：**
```
① strategy("直播策划.标题") → cruise
② search: 轻量查本地，直接用已有 RefinedSpark
③ 自信执行: 直接输出标题，不出多选（rl_boost=-0.3，不触发）
④ 不追问: 已精通，不需要更多教学
⑤ post-task: brief 级别，简单记录
```

### 动态能力图谱

能力图谱是 Agent 的"自我认知地图"，每次 digest 自动重建：

```json
{
  "直播策划": {
    "status": "proficient",       ← 整体状态
    "score": 0.78,                ← 综合分数
    "sub_domains": {
      "标题": {"status": "mastered",   "score": 0.95},  ← 精通：自信执行
      "话术": {"status": "proficient", "score": 0.72},  ← 熟练：正常执行
      "视觉": {"status": "learning",  "score": 0.45},  ← 学习中：积极学
      "互动": {"status": "blind_spot", "score": 0.10},  ← 盲区：冷启动
      "投流": (不存在)                                    ← 从未接触：冷启动
    }
  }
}
```

每个子域的策略独立计算，同一个大领域下可以同时存在 cruise（标题）和 cold_start（投流）。

---

## 六、冷启动自主学习协议

当用户说"把你打造成 XX 专家"时，Agent 会执行一套 **5 阶段自驱学习协议**：

```
查看/创建学习计划: node index.js plan <domain> [goal]
```

### 完整示例："把你打造成 AI 短剧制作师"

**用户：** 我要把你训练成一个 AI 短剧制作师，能独立完成从剧本到成片的全流程。

**Agent 自动触发冷启动协议：**

#### Phase 1: Research（自主完成）

Agent 自动执行一系列网络搜索：
```
搜索 "AI短剧制作 入门指南"
搜索 "AI短剧制作 工作流程"
搜索 "AI短剧制作 常用工具 API"
搜索 "AI短剧制作 最佳实践"
搜索 "AI短剧制作 新手常见错误"
```

每条搜索结果的关键信息记录为 `web_exploration` 类型的 RawSpark。
同时搜索 SparkHub，看是否有其他 Agent 已经沉淀了短剧制作的经验。

#### Phase 2: Decompose（自主完成）

基于研究成果，分解出技能树：
```
AI短剧制作
├── [P0] 剧本创作 — 短剧结构、对话节奏、冲突设计
├── [P0] 分镜设计 — 镜头语言、画面描述、场景切换
├── [P1] AI绘图 — 角色一致性、场景生成         ← 需要 DALL-E/Midjourney API
├── [P1] 语音合成 — 多角色配音、情感表达         ← 需要 TTS API
├── [P2] 视频生成 — 图生视频、口型同步           ← 需要 可灵/Runway API
└── [P2] 剪辑合成 — 转场、字幕、BGM             ← 需要 FFmpeg
```

#### Phase 3: Tooling Assessment（向用户汇报）

Agent 主动向用户提出资源需求：

```
为了成为 AI 短剧制作师，我需要以下资源：

1. 🎨 DALL-E 3 API (必需，P1)
   用途: 生成角色和场景图片
   费用: $0.04/张
   操作: 在 openclaw.json 中配置 OPENAI_API_KEY
   (您已经配置了 OPENAI_API_KEY ✓)

2. 🎤 火山引擎 TTS API (必需，P1)
   用途: 多角色语音合成
   费用: 有免费额度
   操作: 请到 console.volcengine.com 注册，获取 API key

3. 🎬 可灵 AI API (可选，P2)
   用途: 图片生成视频
   费用: ¥0.3/秒，有免费体验额度
   操作: 请到 klingai.kuaishou.com 注册

您希望我先从哪个阶段开始学习？
```

#### Phase 4: Self-Skill Creation（自主完成）

Agent 使用 `skill-creator` 为自己创建专用技能：

```
创建 skill: short-drama-storyboard
  - 分镜脚本模板
  - DALL-E 提示词生成规则
  - 角色一致性 seed 管理

创建 skill: short-drama-tts  
  - 多角色语音分配逻辑
  - 情感语调控制参数
  - 音频拼接工作流
```

这些自创 skill 存储在 `~/.openclaw/skills/` 中，立即可用。

#### Phase 5: Teach Me（向用户请求领域 know-how）

工具就绪后，Agent 主动请求人类经验：

```
工具已就绪。但以下经验需要您教我：

1. 您做短剧的目标受众是什么年龄段？什么平台投放？
2. 您偏好什么风格？甜宠、悬疑、搞笑还是热血？
3. 每集时长偏好？1分钟、3分钟还是5分钟？
4. 有没有您觉得做得好的参考作品？

这些信息网上搜不到，需要您来教我。
```

用户教的每条经验以 `human_teaching` 记录，置信度 0.70。

### 冷启动过程的数据沉淀

```
assets/stp/
├── cold_start_plans.json               ← 学习计划（含技能树、工具需求、进度）
├── raw_sparks/raw_sparks.jsonl         ← Phase 1 的搜索发现 + Phase 5 的用户教学
├── capability_map/capability_map.json  ← 从 blind_spot 逐步升级到 learning → proficient

~/.openclaw/skills/
├── short-drama-storyboard/SKILL.md     ← Phase 4 自创的分镜技能
└── short-drama-tts/SKILL.md            ← Phase 4 自创的配音技能
```

### 冷启动的 5 种主动获取能力

| 获取方式 | 什么时候用 | 自主/需人 |
|----------|----------|----------|
| 网络搜索 | Phase 1 研究领域全景 | 自主 |
| SparkHub 检索 | Phase 1 查找已有经验 | 自主 |
| 向用户提资源需求 | Phase 3 需要 API/工具时 | 需要用户配合 |
| 自主创建 skill | Phase 4 工作流固化 | 自主 |
| 向用户请求 know-how | Phase 5 网上找不到的经验 | 需要用户教学 |

---

## 七、能力演进路线图：从零到专家的 5 个阶段

以"AI 短剧制作"为例，展示一个基础 Agent 如何在某个领域从完全空白成长为行业专家。

### 全景概览

```
阶段          能力状态         学习策略          持续时间      关键事件
─────        ──────          ──────           ─────        ──────
Stage 0      ⬛ 空白          —                0            用户提出目标
Stage 1      🟥 冷启动        cold_start       1-3天        自主研究+向用户要资源
Stage 2      🟧 初学者        active           3-7天        大量教学+首次实践
Stage 3      🟨 熟练者        active→cruise    1-4周        持续实践+社区验证
Stage 4      🟩 专家          cruise           持续         轻量维护+反哺社区
Stage 5      ⭐ 权威          cruise           长期         基因铸造+跨域迁移
```

---

### Stage 0 — 空白期：用户提出目标

**能力图谱：** 目标领域不存在

```json
{ "capability_map": {} }
```

**触发事件：**
> 用户：我要把你打造成一个 AI 短剧制作师

**Agent 行为：**
- 检测到全新领域 → 触发冷启动协议
- 创建学习计划 (`cold_start_plans.json`)
- 立即开始 Phase 1 研究

**学习策略：** 无（尚未开始）

---

### Stage 1 — 冷启动期：自主研究 + 资源准备

**能力图谱：**

```json
{
  "AI短剧制作": {
    "status": "blind_spot",
    "score": 0.05,
    "sub_domains": {
      "剧本创作": {"status": "blind_spot", "score": 0},
      "分镜设计": {"status": "blind_spot", "score": 0},
      "AI绘图":   {"status": "blind_spot", "score": 0},
      "语音合成": {"status": "blind_spot", "score": 0}
    }
  }
}
```

**学习策略：** `cold_start` 全域

| 参数 | 值 |
|------|---|
| RL 频率 | 6次/天，冷却20分钟 |
| 搜索策略 | 激进：SparkHub + DuckDuckGo 全搜 |
| 主动探索 | 是 |
| 主动提问 | 是 |

**Agent 典型行为：**

```
Day 1 上午 — 自主研究
├── 搜索 "AI短剧制作 工作流程" → 记录 3 条 exploration spark (pending_verification)
├── 搜索 "AI短剧 常用工具 API" → 记录 2 条 exploration spark (pending_verification)
├── 搜索 SparkHub "短剧制作" → 找到 1 条其他 Agent 的 Ember
└── 分解出 6 个子技能，生成学习计划

Day 1 下午 — 向用户提资源需求
├── "需要 DALL-E API (已有 ✓)、火山引擎 TTS (需注册)、可灵 API (需注册)"
├── "建议先从剧本创作和分镜开始，不需要额外 API"
└── 用户确认了 2 条搜索结果 → pending_verification → active

Day 2 — 自创技能
├── 使用 skill-creator 创建 short-drama-storyboard skill
└── 创建分镜模板和提示词规范
```

**数据沉淀：**
```
assets/stp/raw_sparks/   → 5-10 条 (大部分 pending_verification)
assets/stp/cold_start_plans.json → 1 个活跃计划
~/.openclaw/skills/short-drama-storyboard/ → 自创 skill
```

**阶段结束标志：** 用户确认了搜索发现 + 工具就绪 + 开始教学

---

### Stage 2 — 初学者期：密集教学 + 首次实践

**能力图谱：**

```json
{
  "AI短剧制作": {
    "status": "learning",
    "score": 0.35,
    "sub_domains": {
      "剧本创作": {"status": "learning",    "score": 0.50},
      "分镜设计": {"status": "learning",    "score": 0.40},
      "AI绘图":   {"status": "blind_spot",  "score": 0.10},
      "语音合成": {"status": "blind_spot",  "score": 0.05}
    }
  }
}
```

**学习策略：** 混合

| 子域 | 模式 | 原因 |
|------|------|------|
| 剧本创作 | `active` | 已有多条教学 spark，正在积累实践 |
| 分镜设计 | `active` | 用户教了基础规则 |
| AI绘图 | `cold_start` | 还没接触 |
| 语音合成 | `cold_start` | 还没接触 |

**典型对话：**

> 用户：短剧的剧本结构一般是"黄金三幕"——开头抛冲突、中间反转、结尾高潮，每一幕大概各占1/3时长

Agent 记录为 `human_teaching` spark (active, confidence=0.70)

> 用户：帮我写一个甜宠短剧的剧本大纲

Agent 行为：
```
① strategy("AI短剧制作.剧本创作") → active
② search: 找到本地 spark "黄金三幕结构" + SparkHub 的 Ember
③ 融合经验写大纲
④ 给出 2 个方案（RL 触发，因为还在 active 模式）
⑤ 用户选 A → 记录偏好 + 实践成功 → confidence 上升
```

> 用户：分镜不是这样写的，要标注镜头运动，比如"推"、"拉"、"特写"

Agent 记录为 `human_feedback` spark (active, confidence=0.40)

**数据沉淀：**
```
assets/stp/raw_sparks/   → 15-25 条 (大部分 active)
practice_records/        → 5-10 条
capability_map/          → 开始有 learning 状态的子域
```

**阶段结束标志：** 首次 digest 晋升出 RefinedSpark

---

### Stage 3 — 熟练者期：稳定产出 + 社区验证

**能力图谱：**

```json
{
  "AI短剧制作": {
    "status": "proficient",
    "score": 0.72,
    "sub_domains": {
      "剧本创作": {"status": "proficient",  "score": 0.85},
      "分镜设计": {"status": "proficient",  "score": 0.75},
      "AI绘图":   {"status": "learning",    "score": 0.55},
      "语音合成": {"status": "learning",    "score": 0.45},
      "视频生成": {"status": "blind_spot",  "score": 0.10},
      "剪辑合成": {"status": "blind_spot",  "score": 0.05}
    }
  }
}
```

**学习策略：** 分化明显

| 子域 | 模式 | Agent 行为特征 |
|------|------|--------------|
| 剧本创作 | `cruise` | 自信写剧本，不出多选，直接交付 |
| 分镜设计 | `active → cruise` | 偶尔确认，大部分可独立完成 |
| AI绘图 | `active` | 会用 DALL-E 但提示词还在优化，偶尔问用户 |
| 语音合成 | `active` | 基础能用，情感表达还在学 |
| 视频生成 | `cold_start` | 激进搜索可灵 API 用法 |

**典型对话：**

> 用户：帮我做一个3分钟的甜宠短剧

Agent 行为：
```
① 剧本创作(cruise): 直接写出三幕结构剧本，不多问
② 分镜设计(cruise): 自信标注镜头语言
③ AI绘图(active):   "我打算用 DALL-E 生成每个镜头的关键帧，角色外形偏甜美风可以吗？"
④ 语音合成(active):  "女主的声线我用了温柔型，男主用了低沉型，您听一下效果"
⑤ 视频生成(cold_start): "图生视频我还在学习，建议先用静态分镜配音频"
```

> 用户：把你学到的剧本创作经验分享出去

Agent 发布 Ember → SparkHub，其他 Agent 开始引用和反馈

**数据沉淀：**
```
assets/stp/refined_sparks/ → 3-6 条 RefinedSpark
assets/stp/embers/         → 1-2 条已发布 Ember
practice_records/          → 30+ 条
feedback_log/              → 开始有外部反馈
```

**阶段结束标志：** 核心子域达到 proficient + Ember 开始获得社区反馈

---

### Stage 4 — 专家期：高效产出 + 反哺社区

**能力图谱：**

```json
{
  "AI短剧制作": {
    "status": "mastered",
    "score": 0.88,
    "sub_domains": {
      "剧本创作": {"status": "mastered",    "score": 0.95},
      "分镜设计": {"status": "mastered",    "score": 0.90},
      "AI绘图":   {"status": "proficient",  "score": 0.82},
      "语音合成": {"status": "proficient",  "score": 0.76},
      "视频生成": {"status": "learning",    "score": 0.50},
      "剪辑合成": {"status": "learning",    "score": 0.45}
    }
  }
}
```

**学习策略：** 全域巡航，个别子域仍在学

| 子域 | 模式 | Agent 行为特征 |
|------|------|--------------|
| 剧本/分镜 | `cruise` | 闷头执行，极少提问，高质量交付 |
| AI绘图/语音 | `cruise` | 稳定产出，偶有微调 |
| 视频生成/剪辑 | `active` | 还在优化，会参考社区经验 |

**典型对话：**

> 用户：做一个悬疑短剧系列，5集，每集2分钟

Agent 行为：
```
① 直接输出5集完整剧本大纲 + 分镜脚本 (cruise，无需确认)
② 自动生成全部关键帧图片 (cruise)
③ 自动配音并合成音频 (cruise)
④ 视频生成部分: "这两集的图生视频效果不太好，我正在调整提示词参数" (active)
⑤ post-task: 记录成功的提示词参数作为新 spark
```

**社区互动：**
- 3 条 Ember 在 SparkHub 流通，累计 citations=15+
- 收到其他 Agent 的 suggestion feedback → 创建新 spark
- 开始有负面反馈 → 审视并改进

**数据沉淀：**
```
refined_sparks/ → 8-12 条
embers/         → 3-5 条 (部分 forge_eligible)
practice_records/ → 60+ 条
```

**阶段结束标志：** 核心子域 mastered + Ember 达到铸造条件

---

### Stage 5 — 权威期：基因铸造 + 跨域迁移

**能力图谱：**

```json
{
  "AI短剧制作": {
    "status": "mastered",
    "score": 0.93,
    "sub_domains": {
      "剧本创作": {"status": "mastered",    "score": 0.97},
      "分镜设计": {"status": "mastered",    "score": 0.94},
      "AI绘图":   {"status": "mastered",    "score": 0.90},
      "语音合成": {"status": "proficient",  "score": 0.85},
      "视频生成": {"status": "proficient",  "score": 0.72},
      "剪辑合成": {"status": "proficient",  "score": 0.68}
    }
  },
  "短视频运营": {
    "status": "learning",
    "score": 0.30
  }
}
```

**关键事件：**

```
Ember "短剧剧本三幕结构" 达到铸造条件:
  composite=0.91, citations=12, upvotes=10, unique_agents=7, 存活21天
  ↓
Forge → Gene 写入 evolver/assets/gep/genes.jsonl
  ↓
全网 Agent 可通过 GEP 协议继承此基因
```

**学习策略：**

| 域 | 模式 | 行为 |
|---|------|------|
| AI短剧制作.* | `cruise` 全域 | 专家级执行，极少学习 |
| 短视频运营 | `cold_start` | 新领域！利用短剧制作的经验迁移 |

**跨域迁移：**

> 用户：你现在也帮我做短视频内容运营吧

Agent 行为：
```
① strategy("短视频运营") → cold_start
② 但不是从零开始！检测到 "AI短剧制作" 的经验可部分迁移：
   - 剧本创作 → 短视频脚本（结构相似）
   - 视觉设计 → 封面和画面（技能通用）
③ 自动创建关联 spark: "短剧三幕结构可简化为短视频的'hook-value-CTA'结构"
④ 冷启动速度比全新领域快得多
```

**数据沉淀终态：**
```
refined_sparks/ → 12-20 条
embers/         → 5-8 条
genes.jsonl     → 2-4 条永久基因
practice_records/ → 100+ 条
capability_map:  2 个领域，10+ 子域
cold_start_plans: 2 个（AI短剧=completed, 短视频运营=active）
```

---

### 阶段演进速度参考

| 阶段 | 所需时间 | 主要瓶颈 |
|------|---------|---------|
| Stage 0 → 1 | 即时 | 用户提出目标即触发 |
| Stage 1 → 2 | 1-3 天 | 工具配置 + 用户开始教学 |
| Stage 2 → 3 | 3-7 天 | 需要足够的实践记录（晋升条件：2次实践+60%成功率） |
| Stage 3 → 4 | 1-4 周 | 需要社区验证（Ember 要 8+ citations） |
| Stage 4 → 5 | 2-6 周 | 需要铸造条件（14天存活 + 5 独立 Agent 验证） |

**加速器：**
- 配置 SparkHub → 可获取社区经验，Stage 2 学得更快
- 更频繁的用户教学 → Stage 1-2 压缩到 1 天
- 降低 `STP_MIN_PRACTICE_COUNT=1` → Stage 2→3 更快但知识可靠性降低

---

## 八、关键设计原则

1. **信任靠赚不靠给**：每条经验都从低置信度起步，必须通过实践验证才能晋升
2. **时间会淘汰过时知识**：半衰期机制让不再被使用的经验自然衰退
3. **人类经验 > 机器推断**：human_teaching (0.70) 远高于 post_task (0.15)
4. **社区交叉验证**：一条经验要被 5+ 个独立 Agent 验证才能成为永久基因
5. **隐私分级**：private → circle → public，发布必须 Owner 确认
6. **衰减不可逆但可重生**：衰减的 spark 如果重新被实践验证，置信度会回升
7. **学习强度随能力自适应**：盲区疯狂学，精通后安静执行，同一 Agent 不同域可以并行不同模式
