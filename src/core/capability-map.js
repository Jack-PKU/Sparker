// Capability Map — tracks agent's knowledge coverage across domains.
// Four levels: mastered > proficient > learning > blind_spot.

const { readJson, writeJson, PATHS } = require('./storage');

function createCapabilityMap() {
  return { domains: {}, updated_at: new Date().toISOString() };
}

function readCapabilityMap() {
  return readJson(PATHS.capabilityMap(), createCapabilityMap());
}

function writeCapabilityMap(map) {
  map.updated_at = new Date().toISOString();
  writeJson(PATHS.capabilityMap(), map);
}

function getStatus(score, practiceCount, hasRefined) {
  if (hasRefined && score >= 0.80 && practiceCount >= 5) return 'mastered';
  if (hasRefined && score >= 0.60) return 'proficient';
  if (score > 0 || practiceCount > 0) return 'learning';
  return 'blind_spot';
}

// Rebuild capability map from raw+refined sparks and practice records
function rebuildCapabilityMap(rawSparks, refinedSparks, practiceRecords) {
  var map = createCapabilityMap();
  var domainStats = {};

  function ensureDomain(domain) {
    if (!domainStats[domain]) {
      domainStats[domain] = {
        rawCount: 0,
        refinedCount: 0,
        totalScore: 0,
        practiceCount: 0,
        successCount: 0,
        hasRefined: false,
        lastActivity: null,
        subDomains: {},
      };
    }
    return domainStats[domain];
  }

  for (var i = 0; i < rawSparks.length; i++) {
    var rs = rawSparks[i];
    var domain = (rs.domain || 'general').split('.')[0];
    var sub = (rs.domain || '').includes('.') ? rs.domain.split('.').slice(1).join('.') : null;
    var ds = ensureDomain(domain);
    ds.rawCount++;
    ds.totalScore += rs.confidence || 0;
    if (rs.created_at && (!ds.lastActivity || rs.created_at > ds.lastActivity)) {
      ds.lastActivity = rs.created_at;
    }
    if (sub) {
      if (!ds.subDomains[sub]) ds.subDomains[sub] = { rawCount: 0, refinedCount: 0, score: 0 };
      ds.subDomains[sub].rawCount++;
    }
  }

  for (var j = 0; j < refinedSparks.length; j++) {
    var ref = refinedSparks[j];
    var rdomain = (ref.domain || 'general').split('.')[0];
    var rsub = (ref.domain || '').includes('.') ? ref.domain.split('.').slice(1).join('.') : null;
    var rds = ensureDomain(rdomain);
    rds.refinedCount++;
    rds.hasRefined = true;
    var refScore = ref.credibility ? ref.credibility.composite || ref.credibility.internal.score : 0;
    rds.totalScore += refScore;
    if (ref.created_at && (!rds.lastActivity || ref.created_at > rds.lastActivity)) {
      rds.lastActivity = ref.created_at;
    }
    if (rsub) {
      if (!rds.subDomains[rsub]) rds.subDomains[rsub] = { rawCount: 0, refinedCount: 0, score: 0 };
      rds.subDomains[rsub].refinedCount++;
      rds.subDomains[rsub].score = refScore;
    }
  }

  for (var k = 0; k < practiceRecords.length; k++) {
    var pr = practiceRecords[k];
    var sparkDomain = pr.domain || 'general';
    var pdomain = sparkDomain.split('.')[0];
    var pds = ensureDomain(pdomain);
    pds.practiceCount++;
    if (pr.outcome === 'accepted') pds.successCount++;
  }

  for (var d in domainStats) {
    var st = domainStats[d];
    var total = st.rawCount + st.refinedCount;
    var avgScore = total > 0 ? st.totalScore / total : 0;
    var status = getStatus(avgScore, st.practiceCount, st.hasRefined);

    var subDomains = {};
    for (var sd in st.subDomains) {
      var sds = st.subDomains[sd];
      subDomains[sd] = {
        status: getStatus(sds.score, 0, sds.refinedCount > 0),
        score: sds.score,
      };
    }

    map.domains[d] = {
      status: status,
      score: parseFloat(avgScore.toFixed(3)),
      sub_domains: subDomains,
      spark_count: st.rawCount,
      refined_count: st.refinedCount,
      practice_count: st.practiceCount,
      last_activity: st.lastActivity,
    };
  }

  return map;
}

// Detect blind spots: domains mentioned in tasks but absent from map
function detectBlindSpots(taskDomains, capabilityMap) {
  var blindSpots = [];
  for (var i = 0; i < taskDomains.length; i++) {
    var d = taskDomains[i];
    var entry = capabilityMap.domains[d];
    if (!entry || entry.status === 'blind_spot' || entry.status === 'learning') {
      blindSpots.push({ domain: d, status: entry ? entry.status : 'blind_spot' });
    }
  }
  return blindSpots;
}

// --- Rich text formatter for capability map ---

function displayWidth(str) {
  var w = 0;
  for (var i = 0; i < str.length; i++) {
    var code = str.charCodeAt(i);
    if ((code >= 0x4E00 && code <= 0x9FFF) ||
        (code >= 0x3000 && code <= 0x303F) ||
        (code >= 0xFF00 && code <= 0xFFEF) ||
        (code >= 0x3400 && code <= 0x4DBF) ||
        (code >= 0xF900 && code <= 0xFAFF)) {
      w += 2;
    } else {
      w += 1;
    }
  }
  return w;
}

function padEnd(str, targetWidth) {
  var w = displayWidth(str);
  while (w < targetWidth) { str += ' '; w++; }
  return str;
}

function padStart(str, targetWidth) {
  var w = displayWidth(str);
  var pad = '';
  while (pad.length + w < targetWidth) pad += ' ';
  return pad + str;
}

function makeBar(score, width) {
  width = width || 20;
  var filled = Math.round(score * width);
  var bar = '';
  for (var i = 0; i < width; i++) bar += i < filled ? '\u2588' : '\u2591';
  return bar;
}

function formatPercentage(score) {
  return padStart(Math.round(score * 100) + '%', 4);
}

function formatCapabilityReport(capMap) {
  var domains = capMap.domains || {};
  var names = Object.keys(domains);

  if (names.length === 0) {
    return '\uD83E\uDDE0 \u80FD\u529B\u56FE\u8C31\n\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n\u8FD8\u6CA1\u6709\u4EFB\u4F55\u9886\u57DF\u7ECF\u9A8C\uFF0C\u5F00\u59CB\u548C\u6211\u804A\u5929\u5427\uFF01';
  }

  var items = [];
  for (var i = 0; i < names.length; i++) {
    var d = domains[names[i]];
    var sparkCount = (d.spark_count || 0) + (d.refined_count || 0);
    items.push({ name: names[i], count: sparkCount });
  }
  items.sort(function(a, b) { return b.count - a.count; });

  var maxNameWidth = 0;
  var maxCount = 0;
  for (var ni = 0; ni < items.length; ni++) {
    var w = displayWidth(items[ni].name);
    if (w > maxNameWidth) maxNameWidth = w;
    if (items[ni].count > maxCount) maxCount = items[ni].count;
  }
  var COL = Math.max(maxNameWidth, 6) + 2;
  var BAR_W = 20;

  var lines = [];
  for (var ii = 0; ii < items.length; ii++) {
    var item = items[ii];
    var ratio = maxCount > 0 ? item.count / maxCount : 0;
    var bar = makeBar(ratio, BAR_W);
    lines.push('  ' + padEnd(item.name, COL) + bar + ' ' + item.count + ' \u6761');
  }

  return lines.join('\n');
}

module.exports = {
  createCapabilityMap,
  readCapabilityMap,
  writeCapabilityMap,
  getStatus,
  rebuildCapabilityMap,
  detectBlindSpots,
  formatCapabilityReport,
};
