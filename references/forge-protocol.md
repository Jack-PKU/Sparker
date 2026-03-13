# 铸火协议（Ember → Gene）

将社区验证过的高质量 Ember 转化为 GEP Gene，供 Evolver 用于代码进化。

**与结晶的区别**：结晶生成 Skill 给 Agent 用，铸火生成 Gene 给 Evolver 用。两者独立。

## 铸造条件

复合置信度 >= 0.85，引用 >= 8，好评率 >= 80%，独立 Agent >= 5。

## 执行

```bash
node SPARKER/index.js forge --dry-run    # 查看可铸造的 Ember
node SPARKER/index.js forge              # 执行铸造
node SPARKER/index.js forge <ember_id>   # 铸造指定 Ember
```

Gene 写入 GEP 资产目录（自动检测 `evolver-main/assets/gep`），同时发送到 SparkHub。
Gene 执行结果通过 `gep-bridge.js` 反向更新源 Ember 置信度（成功 +0.05，失败 -0.10）。
