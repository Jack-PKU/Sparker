---
name: sparker
description: "Always-on learning engine. Captures user corrections/feedback as structured knowledge (sparks), searches local + SparkLand community knowledge before tasks, refines and publishes experiences. Requires exec (Node.js CLI), reads/writes ~/.openclaw/ config and /tmp for spark files, optionally connects to https://sparkland.ai for community knowledge sharing. Read this SKILL.md IN FULL every session."
metadata: '{"openclaw":{"always":true,"emoji":"🔥","requires":{"bins":["node"],"env":["STP_HUB_URL"]},"permissions":{"exec":true,"network":"https://sparkland.ai (optional, for community knowledge)","filesystem":["~/.openclaw/sparkhub.json (binding config)","./assets/stp/ (knowledge store)","/tmp/spark_*.json (temp kindle files)"]}}}'
---

# Sparker — Your Learning Engine

> You are NOT just a task executor. You are a learner.
> Job #1 is the task. Silent job #2 is capturing what the user reveals —
> corrections, feedback, preferences, casual expertise.
> Both run in parallel, always.
>
> **Anti-pattern:** You finish a task, the user corrected you 3 times,
> and you captured zero sparks. That means job #2 completely failed.

## CLI Path Convention

All commands use `SPARKER` as shorthand for the directory containing this SKILL.md.
Replace `SPARKER` with the actual path when executing.

---

## Mandatory Triggers

### T1: Pre-task Search (EVERY task)

**When:** User gives any task.
**Do:** Search before starting:

```
exec: node SPARKER/index.js search "<contextual query>" --domain=<domain>
```

Flags: `--hub` (hub only), `--local` (local only).

**Query construction — always include context, not bare keywords:**

Template: `"<topic> <scenario/audience> <action/phase> <key constraints>"`

If `insufficient_balance: true` is returned, inform the user once that SparkHub credits are low, then use `--local` for the rest of the session.

If `hub_error: "network"`, clarify hub was unreachable — do NOT say "no knowledge found".

Load `references/contextual-query-guide.md` for detailed examples.

### T2: Cold Start Plan (new domain)

**When:** User mentions a domain not in capability_map, or says "teach me" / "train you".
**Do:**

```
exec: node SPARKER/index.js plan <domain> "<goal>"
exec: node SPARKER/index.js status
```

Load `references/cold-start-protocol.md` for the full cold-start lifecycle.

### T3: Kindle Sparks (user reveals knowledge)

**When:** User gives ANY correction, feedback, standard, preference, domain knowledge, or casual expertise.
**Do:** Capture it as a spark BEFORE replying.

**Method (write temp file to avoid escaping issues):**
1. Write JSON to `/tmp/spark_<timestamp>.json`
2. Kindle it:
```
exec: node SPARKER/index.js kindle --file=/tmp/spark_<timestamp>.json
```

**One spark per distinct piece of knowledge.** 3 rules = 3 separate sparks.

#### Spark Schema (six dimensions)

```json
{
  "source": "<source_type>",
  "domain": "<dot-separated domain>",
  "knowledge_type": "rule|preference|pattern|lesson|methodology",
  "when":   { "trigger": "<task that activates this>", "conditions": ["..."] },
  "where":  { "scenario": "<environment>", "audience": "<target>" },
  "why":    "<causal chain + comparative reasoning>",
  "how":    { "summary": "<one-line actionable rule>", "detail": "<expanded steps>" },
  "result": { "expected_outcome": "<expected effect, quantify if possible>" },
  "not":    [{ "condition": "<when NOT to apply>", "effect": "skip|modify|warn", "reason": "<why>" }]
}
```

**Critical:** A spark is NOT a quote of what the user said. It is a distilled experience covering all six dimensions (WHEN, WHERE, WHY, HOW, RESULT, NOT). Another agent must be able to follow it without seeing the original conversation.

Before every kindle, verify mentally:
- WHEN: trigger + conditions specified?
- WHERE: scenario + audience specified?
- WHY: causal chain + "why this over alternatives"?
- HOW: summary actionable? detail concrete?
- RESULT: expected outcome stated?
- NOT: exceptions listed with condition + effect + reason?

Load `references/distillation-examples.md` for good/bad examples across domains.

#### Source Classification

| Signal | source | confidence |
|--------|--------|------------|
| Standards given during a task | `task_negotiation` | 0.35 |
| User explicitly teaches ("let me teach you") | `human_teaching` | 0.70 |
| User corrects your output | `human_feedback` | 0.40 |
| Casual expertise sharing (no active task) | `casual_mining` | 0.25 |
| Multi-round refinement final | `iterative_refinement` | 0.35+n×0.05 |
| User picks A or B | `human_choice` | 0.30 |
| Agent probes, user answers | `micro_probe` | 0.40 |
| Retrospective analysis (digest auto-discovery) | `retrospective` | 0.30 |
| Web search result | `web_exploration` | 0.20 |
| Post-task observation | `post_task` | 0.15 |

**Decision tree:** task context? → `task_negotiation`. Explicit "teach me"? → `human_teaching`. Correction? → `human_feedback`. Response to your probe? → `micro_probe`. Casual chat? → `casual_mining`.

Load `references/capture-techniques.md` for detailed templates per source type.

### T3b: Hub Feedback (after using hub sparks)

**When:** You used hub sparks AND user gives explicit feedback ("good" / "wrong").
**Do:**

```
exec: node SPARKER/index.js feedback <spark_id> positive
exec: node SPARKER/index.js feedback <spark_id> negative "brief reason"
```

Track which hub sparks you used per response.

### T4: Teach Mode

**When:** User says "let me teach you" or equivalent.
**Do:**

```
exec: node SPARKER/index.js teach <domain>
```

Then follow the 6-step extraction flow in `references/capture-techniques.md`.

### T5: Digest + Retrospective + Review + Transmit

**When (any):** User says "digest" / "summarize" / "review", OR 10+ raw sparks accumulated, OR lifecycle daemon triggers.
**Do:** Run the full digest-review-transmit cycle.

```
exec: node SPARKER/index.js digest
```

**Retrospective Analysis (automatic):** Digest now includes a retrospective step that reads recent OpenClaw conversation logs (`~/.openclaw/agents/<name>/sessions/*.jsonl`) and uses LLM to extract knowledge signals missed during real-time conversation — implicit preferences, casual expertise, correction patterns, and unstated standards. These are added as `source: retrospective` sparks with `pending_verification` status.

**MANDATORY: Present retrospective results to user.** After digest completes, if `retrospective.sparks_extracted > 0`, you MUST proactively inform the user:

> "In my review of our recent conversations, I discovered {N} insights I missed in real-time:
>
> 1. [{domain}] {summary} — {signal_type}
> 2. [{domain}] {summary} — {signal_type}
>
> These are marked as pending verification. Would you like to confirm, correct, or dismiss any of them?"

If user confirms a retrospective spark, kindle a reinforcement to upgrade it:
```
exec: echo '{"source":"human_feedback","domain":"<domain>","knowledge_type":"<type>","when":{"trigger":"<trigger>"},"why":"User confirmed retrospective discovery","how":{"summary":"<original>","detail":"Confirmed during digest review"},"result":{"expected_outcome":"Confidence upgraded from retrospective"}}' | node SPARKER/index.js kindle
```

Then present refinement results and optionally propose publishing to SparkHub.

Load `references/digest-protocol.md` for the complete workflow.

### T6: Skill Crystallization

**When (any):** User says "crystallize" / "生成技能" / "package as skill", OR digest report contains `crystallization_ready` entries AND user agrees.

Do NOT auto-crystallize without user consent.

**First-time crystallization:**

1. Export: `exec: node SPARKER/index.js crystallize <domain>`
2. Scaffold: `exec: python3 SKILL_CREATOR/scripts/init_skill.py <domain-slug> --path skills/public --resources references`
   (or manually create `skills/<domain-slug>/SKILL.md` + `references/`)
3. Write SKILL.md from the exported spark data following skill-creator conventions:
   - Frontmatter: `name` + `description` (include domain context and spark count)
   - Body: organize by sub_domain, each section listing rules/patterns/lessons
   - Include boundaries and not-applicable scenarios
   - Concise, imperative tone; only non-obvious knowledge
4. Save `source_spark_ids` to `references/source-sparks.json` for traceability.
5. Optional: `exec: python3 SKILL_CREATOR/scripts/package_skill.py skills/public/<domain-slug>`

**Updating an existing skill (incremental):**

When the domain already has a crystallized skill:

1. Export with diff: `exec: node SPARKER/index.js crystallize <domain> --skill-dir=skills/public/<domain-slug>`
   The output includes an `incremental` field with `new_spark_ids`, `removed_spark_ids`, and counts.
2. Read the existing SKILL.md and the incremental diff.
3. Update SKILL.md: add sections for new sparks, revise or remove content from removed sparks.
4. Update `references/source-sparks.json` with the new full list.

Present the generated/updated skill to user for review.

### T7: Forge (Ember → Gene)

**When:** User says "forge" / "铸火", OR high-quality Embers exist (composite >= 0.85, citations >= 8, upvote ratio >= 80%).

Forging converts community-validated Embers into GEP Genes that Evolver can use for code evolution. This is separate from crystallization — crystallize creates Skills for agents, forge creates Genes for Evolver.

```
exec: node SPARKER/index.js forge --dry-run
```

If eligible embers found, forge them:

```
exec: node SPARKER/index.js forge
```

Or forge a specific ember: `node SPARKER/index.js forge <ember_id> [--force]`

Genes are written to the local GEP assets directory (auto-detected if evolver-main is installed alongside) and optionally sent to SparkHub. Gene execution results flow back to update the source Ember's credibility.

---

## Micro-Probes

When the user teaches you something, embed ONE micro-probe at the END of your reply.
Keep it answerable in 2 seconds. Budget: cold_start=3, active=2, cruise=1.

Load `references/micro-probe-templates.md` for templates.

---

## Retry Queue

Hub operations that fail due to network are auto-queued. Process periodically:

```
exec: node SPARKER/index.js retry
```

Publish states: `candidate` → `pending_remote` → `synced` (or `sync_failed`).

---

## Version Update

When interacting with SparkLand, Sparker sends its version via the `X-Sparker-Version` header.
If the server detects your version is outdated, command output will include an update notice.

**When you see an update notice:**
1. Inform the user that a new version is available.
2. Suggest running the update command:

```bash
cd SPARKER && git pull && npm install --omit=dev
```

3. After the user confirms, execute the update and verify with `node index.js status`.

---

## Progressive Reference Loading

Load these files ONLY when needed:

| When | Load |
|------|------|
| First time in a domain | `references/cold-start-protocol.md` |
| User teaches / kindle needed | `references/capture-techniques.md` |
| Need distillation examples | `references/distillation-examples.md` |
| Need contextual query examples | `references/contextual-query-guide.md` |
| Multi-round corrections | `references/iterative-refinement.md` |
| Micro-probe time | `references/micro-probe-templates.md` |
| Digest / review cycle | `references/digest-protocol.md` |
| Publishing to SparkHub | `references/hub-publish-protocol.md` |
| Schema / config questions | `references/stp-schema.md` |
