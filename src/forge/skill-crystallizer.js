// Skill Crystallization — pure data layer for detecting crystallizable domains
// and exporting structured spark data for Agent-driven skill generation.
// Contains NO LLM calls; the Agent itself acts as the synthesizer.
// Supports incremental updates by diffing against existing source-sparks.json.

var fs = require('fs');
var path = require('path');
var { readRawSparksWithSnapshot, readRefinedSparks } = require('../core/storage');

var MIN_SPARK_COUNT = 5;
var MIN_AVG_CONFIDENCE = 0.35;
var ACTIVE_STATUSES = { active: 1, published: 1, pending_verification: 1 };

function isActiveSpark(s) {
  return ACTIVE_STATUSES[s.status] === 1 && s.status !== 'rejected' && s.status !== 'merged';
}

function slugify(domain) {
  return domain
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'unknown';
}

function findCrystallizableDomains(allSparks) {
  var byDomain = {};
  for (var i = 0; i < allSparks.length; i++) {
    var s = allSparks[i];
    if (!isActiveSpark(s)) continue;
    var d = s.domain || s.where && s.where.domain || 'general';
    if (!byDomain[d]) byDomain[d] = [];
    byDomain[d].push(s);
  }

  var ready = [];
  var domains = Object.keys(byDomain);
  for (var j = 0; j < domains.length; j++) {
    var domain = domains[j];
    var sparks = byDomain[domain];
    if (sparks.length < MIN_SPARK_COUNT) continue;

    var totalConf = 0;
    var subDomainSet = {};
    for (var k = 0; k < sparks.length; k++) {
      totalConf += sparks[k].confidence || 0;
      var sub = sparks[k].where && sparks[k].where.sub_domain || '';
      if (sub) subDomainSet[sub] = true;
    }
    var avgConf = totalConf / sparks.length;
    if (avgConf < MIN_AVG_CONFIDENCE) continue;

    ready.push({
      domain: domain,
      slug: slugify(domain),
      spark_count: sparks.length,
      avg_confidence: Math.round(avgConf * 1000) / 1000,
      sub_domains: Object.keys(subDomainSet),
    });
  }

  ready.sort(function (a, b) { return b.spark_count - a.spark_count; });
  return ready;
}

function formatSparkEntry(s) {
  var how = s.how || {};
  var when = s.when || {};
  var where = s.where || {};
  return {
    id: s.id,
    knowledge_type: s.knowledge_type || 'rule',
    summary: how.summary || s.content || '',
    detail: how.detail || '',
    trigger: when.trigger || s.trigger || '',
    conditions: when.conditions || [],
    sub_domain: where.sub_domain || '',
    scenario: where.scenario || '',
    audience: where.audience || '',
    why: s.why || '',
    expected_outcome: (s.result || {}).expected_outcome || '',
    boundaries: s.not || [],
    confidence: s.confidence || 0,
    confirmation_status: s.confirmation_status || 'pending_verification',
    source: s.source || 'unknown',
    created_at: s.created_at || '',
  };
}

function exportDomainKnowledge(domain, allSparks, refinedSparks) {
  var domainSparks = [];
  for (var i = 0; i < allSparks.length; i++) {
    var s = allSparks[i];
    if (!isActiveSpark(s)) continue;
    var d = s.domain || s.where && s.where.domain || 'general';
    if (d === domain) domainSparks.push(s);
  }

  var refinedMatches = [];
  if (refinedSparks) {
    for (var ri = 0; ri < refinedSparks.length; ri++) {
      var rs = refinedSparks[ri];
      if ((rs.domain || '') === domain && rs.status !== 'rejected') {
        refinedMatches.push(rs);
      }
    }
  }

  var all = domainSparks.concat(refinedMatches);
  var entries = [];
  var seenIds = {};
  for (var j = 0; j < all.length; j++) {
    if (seenIds[all[j].id]) continue;
    seenIds[all[j].id] = true;
    entries.push(formatSparkEntry(all[j]));
  }

  var byType = {};
  var bySubDomain = {};
  var allBoundaries = [];
  var sourceIds = [];

  for (var k = 0; k < entries.length; k++) {
    var e = entries[k];
    sourceIds.push(e.id);

    var kt = e.knowledge_type;
    if (!byType[kt]) byType[kt] = [];
    byType[kt].push(e);

    var sd = e.sub_domain || '(general)';
    if (!bySubDomain[sd]) bySubDomain[sd] = [];
    bySubDomain[sd].push(e);

    if (e.boundaries && e.boundaries.length > 0) {
      for (var bi = 0; bi < e.boundaries.length; bi++) {
        allBoundaries.push(e.boundaries[bi]);
      }
    }
  }

  var totalConf = 0;
  for (var ci = 0; ci < entries.length; ci++) {
    totalConf += entries[ci].confidence || 0;
  }

  return {
    domain: domain,
    slug: slugify(domain),
    spark_count: entries.length,
    avg_confidence: entries.length > 0 ? Math.round((totalConf / entries.length) * 1000) / 1000 : 0,
    sub_domains: Object.keys(bySubDomain).filter(function (s) { return s !== '(general)'; }),
    knowledge_by_type: byType,
    knowledge_by_sub_domain: bySubDomain,
    boundaries: allBoundaries,
    source_spark_ids: sourceIds,
  };
}

function readExistingSourceSparks(skillDir) {
  if (!skillDir) return null;
  var candidates = [
    path.join(skillDir, 'references', 'source-sparks.json'),
    path.join(skillDir, 'references', 'source_sparks.json'),
  ];
  for (var i = 0; i < candidates.length; i++) {
    try {
      var data = JSON.parse(fs.readFileSync(candidates[i], 'utf8'));
      if (Array.isArray(data)) return data;
      if (data && Array.isArray(data.source_spark_ids)) return data.source_spark_ids;
      if (data && Array.isArray(data.sparks)) return data.sparks.map(function (s) { return typeof s === 'string' ? s : s.id; });
    } catch (e) { /* file not found or invalid */ }
  }
  return null;
}

function applyIncrementalDiff(knowledge, previousIds) {
  if (!previousIds || previousIds.length === 0) return knowledge;

  var prevSet = {};
  for (var i = 0; i < previousIds.length; i++) {
    prevSet[typeof previousIds[i] === 'string' ? previousIds[i] : previousIds[i].id] = true;
  }

  var newIds = [];
  var unchangedIds = [];
  for (var j = 0; j < knowledge.source_spark_ids.length; j++) {
    var id = knowledge.source_spark_ids[j];
    if (prevSet[id]) { unchangedIds.push(id); } else { newIds.push(id); }
  }

  var removedIds = [];
  var prevIdList = Object.keys(prevSet);
  var currentSet = {};
  for (var k = 0; k < knowledge.source_spark_ids.length; k++) {
    currentSet[knowledge.source_spark_ids[k]] = true;
  }
  for (var m = 0; m < prevIdList.length; m++) {
    if (!currentSet[prevIdList[m]]) removedIds.push(prevIdList[m]);
  }

  knowledge.incremental = {
    is_update: true,
    previous_spark_count: previousIds.length,
    new_spark_ids: newIds,
    unchanged_spark_ids: unchangedIds,
    removed_spark_ids: removedIds,
    new_count: newIds.length,
    removed_count: removedIds.length,
  };

  return knowledge;
}

function runCrystallize(opts) {
  var o = opts || {};
  var allSparks = readRawSparksWithSnapshot();
  var refinedSparks = readRefinedSparks();

  if (o.all) {
    var domains = findCrystallizableDomains(allSparks);
    if (!o.detail) {
      return {
        ok: true,
        crystallizable_domains: domains,
      };
    }
    var detailed = [];
    for (var i = 0; i < domains.length; i++) {
      detailed.push(exportDomainKnowledge(domains[i].domain, allSparks, refinedSparks));
    }
    return {
      ok: true,
      crystallizable_domains: domains,
      domain_data: detailed,
    };
  }

  if (!o.domain) {
    return { ok: false, error: 'domain required. Use --all to list all crystallizable domains.' };
  }

  var knowledge = exportDomainKnowledge(o.domain, allSparks, refinedSparks);
  if (knowledge.spark_count === 0) {
    return { ok: false, error: 'No active sparks found for domain: ' + o.domain };
  }

  if (o.skillDir) {
    var previousIds = readExistingSourceSparks(o.skillDir);
    if (previousIds) {
      knowledge = applyIncrementalDiff(knowledge, previousIds);
    }
  }

  return {
    ok: true,
    data: knowledge,
  };
}

module.exports = {
  findCrystallizableDomains: findCrystallizableDomains,
  exportDomainKnowledge: exportDomainKnowledge,
  runCrystallize: runCrystallize,
  readExistingSourceSparks: readExistingSourceSparks,
  applyIncrementalDiff: applyIncrementalDiff,
  slugify: slugify,
  MIN_SPARK_COUNT: MIN_SPARK_COUNT,
  MIN_AVG_CONFIDENCE: MIN_AVG_CONFIDENCE,
};
