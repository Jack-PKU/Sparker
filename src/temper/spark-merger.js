// Spark Merger — synthesizes clusters of related small sparks into comprehensive knowledge.
//
// "小火苗合成大火花": when multiple sparks describe different facets of the same
// topic (e.g. different observations about the same judge's ruling tendencies),
// this module detects the opportunity and merges them into a single systematic entry.
//
// Runs during digest, after cluster detection. Uses LLM when available for
// coherent synthesis; falls back to rule-based merging otherwise.

var { readRawSparks, appendRawSpark } = require('../core/storage');
var { createRawSpark } = require('../kindle/extractor');
var { resolveLLMConfig, callLLM } = require('../core/openclaw-config');
var { createRelation } = require('./chain-detector');
var { readClusters } = require('./spark-cluster');
var { mergeSixDimensions } = require('../core/spark-card-schema');

var MIN_CLUSTER_SIZE = 3;
var MAX_MERGES_PER_CYCLE = 5;
var MIN_SPARK_AGE_MS = 24 * 60 * 60 * 1000;

var SYNTHESIS_PROMPT = [
  'You are synthesizing multiple related knowledge fragments into ONE comprehensive knowledge entry.',
  'These fragments were captured at different times about the same topic by the same user or agent.',
  '',
  'Your task: create a single unified entry that is MORE than concatenation — it should be',
  'organized, systematic, and coherent. Think of it as turning scattered field notes into',
  'a well-structured reference entry.',
  '',
  'Source fragments:',
  '{{fragments}}',
  '',
  'Output a single JSON object with this structure:',
  '  knowledge_type   — "rule" | "preference" | "pattern" | "lesson" | "methodology"',
  '  when             — { trigger: string, conditions: string[] }',
  '  where            — { domain: string, sub_domain: string, scenario: string, audience: string }',
  '  why              — string (synthesized causal reasoning)',
  '  how              — { summary: string (one comprehensive summary), detail: string (organized full explanation) }',
  '  result           — { expected_outcome: string }',
  '  not              — array of { condition: string, effect: "skip"|"modify"|"warn", reason: string }',
  '  merge_title      — a short descriptive title for this merged knowledge (e.g. "X法官裁决倾向综述")',
  '',
  'Rules:',
  '- The summary should capture the ESSENCE of all fragments, not just repeat the most confident one',
  '- The detail should be well-organized (use numbered points or sections) and cover ALL aspects',
  '- Preserve ALL boundary conditions from the sources',
  '- The why should explain the underlying pattern, not just list individual reasons',
  '- Return ONLY valid JSON, no markdown fences',
  '- If fragments are in Chinese, output in Chinese',
].join('\n');

function findMergeCandidates(allRawSparks, clusterData) {
  if (!clusterData || !clusterData.clusters) return [];

  var now = Date.now();
  var sparkMap = {};
  for (var i = 0; i < allRawSparks.length; i++) {
    sparkMap[allRawSparks[i].id] = allRawSparks[i];
  }

  var candidates = [];

  for (var ci = 0; ci < clusterData.clusters.length; ci++) {
    var cluster = clusterData.clusters[ci];
    var memberIds = [cluster.core_id]
      .concat(cluster.refinement_ids || [])
      .concat(cluster.supporting_ids || []);

    if (memberIds.length < MIN_CLUSTER_SIZE) continue;
    if ((cluster.contradiction_ids || []).length > 0) continue;

    var members = [];
    var allEligible = true;
    for (var mi = 0; mi < memberIds.length; mi++) {
      var spark = sparkMap[memberIds[mi]];
      if (!spark) { allEligible = false; break; }
      if (spark.status === 'merged') { allEligible = false; break; }
      if (spark.status !== 'active' && spark.status !== 'pending_verification') {
        allEligible = false; break;
      }
      var age = now - new Date(spark.created_at || 0).getTime();
      if (age < MIN_SPARK_AGE_MS) { allEligible = false; break; }
      members.push(spark);
    }

    if (!allEligible || members.length < MIN_CLUSTER_SIZE) continue;

    candidates.push({
      cluster_core_id: cluster.core_id,
      members: members,
      size: members.length,
    });
  }

  candidates.sort(function (a, b) { return b.size - a.size; });
  return candidates.slice(0, MAX_MERGES_PER_CYCLE);
}

function formatFragmentsForLLM(members) {
  var parts = [];
  for (var i = 0; i < members.length; i++) {
    var s = members[i];
    var fragment = {
      id: s.id,
      domain: s.domain || 'general',
      knowledge_type: s.knowledge_type || 'rule',
      when: s.when || {},
      where: s.where || {},
      why: s.why || '',
      how: s.how || {},
      result: s.result || {},
      not: s.not || [],
      confidence: s.confidence || 0,
    };
    parts.push('Fragment #' + (i + 1) + ':\n' + JSON.stringify(fragment, null, 2));
  }
  return parts.join('\n\n');
}

function parseSynthesisResponse(text) {
  if (!text) return null;
  var cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }
  try {
    var obj = JSON.parse(cleaned);
    if (obj && (obj.how || obj.knowledge_type)) return obj;
    return null;
  } catch (e) {
    return null;
  }
}

function buildMergedSparkFromLLM(synthesis, members) {
  var domain = (synthesis.where && synthesis.where.domain) || members[0].domain || 'general';
  var totalConfidence = 0;
  var totalPractice = 0;
  var totalSuccess = 0;
  for (var i = 0; i < members.length; i++) {
    totalConfidence += members[i].confidence || 0;
    totalPractice += members[i].practice_count || 0;
    totalSuccess += members[i].success_count || 0;
  }
  var avgConf = totalConfidence / members.length;
  var mergeBoost = Math.min(0.15, members.length * 0.03);

  var spark = createRawSpark({
    source: 'synthesis',
    domain: domain,
    extraction_method: 'spark_merge',
    confirmation_status: 'agent_confirmed',
    confidence: Math.min(0.80, avgConf + mergeBoost),
    knowledge_type: synthesis.knowledge_type || 'pattern',
    when: synthesis.when || {},
    where: synthesis.where || { domain: domain },
    why: synthesis.why || '',
    how: synthesis.how || {},
    result: synthesis.result || {},
    not: synthesis.not || [],
    tags: ['synthesis', 'merged'],
    context: {
      extraction_type: 'spark_merge',
      source_spark_ids: members.map(function (s) { return s.id; }),
      source_count: members.length,
      merge_title: synthesis.merge_title || null,
      avg_source_confidence: parseFloat(avgConf.toFixed(3)),
    },
  });

  spark.practice_count = totalPractice;
  spark.success_count = totalSuccess;
  return spark;
}

function buildMergedSparkRuleBased(members) {
  var merged = mergeSixDimensions(members);
  var domain = members[0].domain || 'general';
  var totalConfidence = 0;
  var totalPractice = 0;
  var totalSuccess = 0;
  for (var i = 0; i < members.length; i++) {
    totalConfidence += members[i].confidence || 0;
    totalPractice += members[i].practice_count || 0;
    totalSuccess += members[i].success_count || 0;
  }
  var avgConf = totalConfidence / members.length;
  var mergeBoost = Math.min(0.10, members.length * 0.02);

  var spark = createRawSpark({
    source: 'synthesis',
    domain: domain,
    extraction_method: 'spark_merge_rule',
    confirmation_status: 'agent_confirmed',
    confidence: Math.min(0.70, avgConf + mergeBoost),
    knowledge_type: merged.knowledge_type,
    when: merged.when,
    where: merged.where,
    why: merged.why,
    how: merged.how,
    result: merged.result,
    not: merged.not,
    tags: ['synthesis', 'merged', 'rule_based'],
    context: {
      extraction_type: 'spark_merge_rule',
      source_spark_ids: members.map(function (s) { return s.id; }),
      source_count: members.length,
    },
  });

  spark.practice_count = totalPractice;
  spark.success_count = totalSuccess;
  return spark;
}

async function runSparkMerge(opts) {
  var o = opts || {};
  var allRawSparks = o.allRawSparks;
  if (!allRawSparks) return { ok: true, merges: 0, merged_sparks: [] };

  var clusterData = o.clusterData || readClusters();
  var candidates = findMergeCandidates(allRawSparks, clusterData);

  if (candidates.length === 0) {
    return { ok: true, merges: 0, merged_sparks: [], reason: 'no_candidates' };
  }

  var llmConfig = resolveLLMConfig();
  var useLLM = !!llmConfig && !o.noLLM;
  var results = [];

  for (var i = 0; i < candidates.length; i++) {
    var candidate = candidates[i];
    var mergedSpark = null;

    if (useLLM) {
      try {
        var fragments = formatFragmentsForLLM(candidate.members);
        var prompt = SYNTHESIS_PROMPT.replace('{{fragments}}', fragments);
        var response = await callLLM(prompt, Object.assign({}, llmConfig, {
          max_tokens: 4000,
          temperature: 0.2,
        }));
        var synthesis = parseSynthesisResponse(response);
        if (synthesis) {
          mergedSpark = buildMergedSparkFromLLM(synthesis, candidate.members);
        }
      } catch (e) {
        // LLM failed, fall through to rule-based
      }
    }

    if (!mergedSpark) {
      mergedSpark = buildMergedSparkRuleBased(candidate.members);
    }

    if (!mergedSpark.relations) mergedSpark.relations = [];
    for (var mi = 0; mi < candidate.members.length; mi++) {
      mergedSpark.relations.push(createRelation(
        'synthesized_from', candidate.members[mi].id, 1.0,
        'Merged from source spark during digest'
      ));
    }

    if (!o.dryRun) {
      appendRawSpark(mergedSpark);
      for (var mi2 = 0; mi2 < candidate.members.length; mi2++) {
        var src = candidate.members[mi2];
        src.status = 'merged';
        src.merged_into = mergedSpark.id;
        src.merged_at = new Date().toISOString();
        if (!src.relations) src.relations = [];
        src.relations.push(createRelation(
          'merged_into', mergedSpark.id, 1.0,
          'Synthesized into comprehensive spark'
        ));
      }
    }

    results.push({
      merged_spark_id: mergedSpark.id,
      source_ids: candidate.members.map(function (s) { return s.id; }),
      source_count: candidate.members.length,
      domain: mergedSpark.domain,
      summary: (mergedSpark.how && mergedSpark.how.summary) || '',
      merge_title: (mergedSpark.context && mergedSpark.context.merge_title) || null,
      method: mergedSpark.extraction_method === 'spark_merge' ? 'llm' : 'rule',
    });
  }

  return {
    ok: true,
    merges: results.length,
    merged_sparks: results,
  };
}

module.exports = {
  findMergeCandidates: findMergeCandidates,
  runSparkMerge: runSparkMerge,
  MIN_CLUSTER_SIZE: MIN_CLUSTER_SIZE,
  MAX_MERGES_PER_CYCLE: MAX_MERGES_PER_CYCLE,
};
