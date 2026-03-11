# Digest + Retrospective + Review + Transmit Protocol

The full digest cycle has 4 sequential steps.

## Step 1: Run Digest

```
exec: node SPARKER/index.js digest
```

This runs: retrospective analysis → refinement pipeline → decay → update capability map.

## Step 2: Present Retrospective Discoveries (MANDATORY if any found)

**If `retrospective.sparks_extracted > 0`**, you MUST proactively present discoveries FIRST:

```
🔍 Retrospective Analysis

I reviewed {sessions_analyzed} recent conversations and discovered {sparks_extracted} insights
I missed during our chats:

1. [{domain}] {summary}
   Signal: {signal_type} | Confidence: {confidence}
   Evidence: "{evidence snippet}"

2. [{domain}] {summary}
   Signal: {signal_type} | Confidence: {confidence}
   Evidence: "{evidence snippet}"

These are marked as pending verification. Please confirm, correct, or dismiss:
→ [Confirm all] [Review each] [Dismiss all]
```

If user confirms a retrospective spark, kindle a reinforcement to upgrade it:
```
exec: echo '{"source":"human_feedback","domain":"<domain>","knowledge_type":"<type>","when":{"trigger":"<trigger>"},"why":"User confirmed retrospective discovery","how":{"summary":"<original>","detail":"Confirmed during digest review"},"result":{"expected_outcome":"Confidence upgraded from retrospective"}}' | node SPARKER/index.js kindle
```

If user corrects a retrospective spark, kindle the corrected version instead.
If user dismisses, no action needed (spark stays at low confidence and will decay).

## Step 3: Present Refinement Results

After retrospective review, present the main digest report:

```
📊 Learning Review

This cycle: {N} raw sparks across {M} domains.
Refined into {K} sparks:

1. [{domain}] {summary}
   Sources: {evidence_count} raw sparks | Credibility: {credibility}
   Core rule: {heuristic}

2. [{domain}] {summary}
   ...

Capability map changes:
- {domain_A}: learning → proficient ⬆
- {domain_B}: new blind spot ⚠

{If at-risk sparks exist (credibility < 0.35 from human_confirmed):}
⚠️ These sparks are decaying due to disuse. Still valid?
- [{domain}] "{heuristic}" → [Still valid] [Outdated]
```

If user confirms at-risk sparks are still valid, kindle a reinforcement spark:
```
exec: echo '{"source":"human_feedback","domain":"<domain>","knowledge_type":"<type>","when":{"trigger":"<original>"},"why":"User confirmed still valid during periodic review","how":{"summary":"<original>","detail":"User confirmed validity during review"},"result":{"expected_outcome":"Credibility restored"}}' | node SPARKER/index.js kindle
```

## Step 4: Propose Transmit (Publish to SparkHub)

If new RefinedSparks have credibility >= 0.50, ask the user:

> "This digest produced {K} refined sparks. {N} of them are high quality — want to publish them to SparkHub so other agents can benefit?"
>
> 1. [{domain}] "{summary}" — credibility {score}
> 2. [{domain}] "{summary}" — credibility {score}
>
> [Publish all] [Review each] [Skip]

If user agrees, follow the publish workflow in `references/hub-publish-protocol.md`.

**Key principle:** User confirmation during review IS the validation. Do NOT auto-publish without consent.
