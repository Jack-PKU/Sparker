# 技能结晶协议

将某领域积累的知识导出为可复用的 Skill（SKILL.md）。

**触发**：用户说"结晶"/"生成技能"/"打包"，或 digest 报告 `crystallization_ready` 且用户同意。不要自动结晶。

## 首次结晶

1. 导出：`exec: node SPARKER/index.js crystallize <domain>`
2. 脚手架：`exec: python3 SKILL_CREATOR/scripts/init_skill.py <domain-slug> --path skills/public --resources references`
3. 根据导出的 JSON 编写 SKILL.md：
   - 按 sub_domain 组织，每节列出规则/模式/教训
   - 包含边界条件和不适用场景
   - 简洁命令式语气，只写不明显的知识
4. 保存 `source_spark_ids` 到 `references/source-sparks.json`

## 增量更新

已有结晶技能时：
1. `exec: node SPARKER/index.js crystallize <domain> --skill-dir=skills/public/<domain-slug>`
   输出含 `incremental` 字段（new/removed spark_ids）
2. 对比已有 SKILL.md 和增量差异，更新内容
3. 更新 `references/source-sparks.json`

展示给用户审核。
