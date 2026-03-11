// Forge Engine — converts high-quality Embers into GEP Genes.
// Dual channel: local (write to GEP assets) + Hub (send forge request).
//
// Gene structure follows GEP spec:
//   { type, id, category, signals_match, preconditions, strategy, constraints, source_ember_id }
//
// The reverse channel (Gene execution → Ember credibility update) lives in gep-bridge.js.

var fs = require('fs');
var path = require('path');
var { readEmbers, updateEmber, readPracticeRecords } = require('../core/storage');
var { meetsForgeThreshold, computeContextDiversity } = require('../core/credibility');
var { generateId } = require('../core/asset-id');

function getGepAssetsDir() {
  if (process.env.GEP_ASSETS_DIR) return path.resolve(process.env.GEP_ASSETS_DIR);
  var skillRoot = path.resolve(__dirname, '..', '..');
  var candidates = [
    path.resolve(skillRoot, '..', 'evolver-main', 'assets', 'gep'),
    path.resolve(skillRoot, '..', 'evolver', 'assets', 'gep'),
  ];
  for (var i = 0; i < candidates.length; i++) {
    if (fs.existsSync(candidates[i])) return candidates[i];
  }
  return null;
}

function mapEmberToGene(ember) {
  var when = ember.when || {};
  var how = ember.how || {};
  var where = ember.where || {};
  var not = ember.not || [];

  var signalsMatch = [];
  if (when.trigger) signalsMatch.push(when.trigger);
  if (when.conditions) {
    for (var i = 0; i < when.conditions.length; i++) {
      signalsMatch.push(when.conditions[i]);
    }
  }
  if (where.scenario) signalsMatch.push(where.scenario);
  if (ember.keywords) {
    for (var j = 0; j < ember.keywords.length && signalsMatch.length < 10; j++) {
      if (signalsMatch.indexOf(ember.keywords[j]) === -1) {
        signalsMatch.push(ember.keywords[j]);
      }
    }
  }

  var strategy = [];
  if (how.summary) strategy.push(how.summary);
  if (how.detail) {
    var details = how.detail.split('\n').filter(function (l) { return l.trim(); });
    for (var k = 0; k < details.length; k++) {
      strategy.push(details[k].replace(/^\d+\.\s*/, '').trim());
    }
  }
  if (strategy.length === 0) {
    strategy.push(ember.summary || 'Apply domain knowledge');
  }

  var constraints = {};
  if (not.length > 0) {
    constraints.not_applicable = not.map(function (n) {
      return {
        condition: n.condition || '',
        effect: n.effect || 'skip',
        reason: n.reason || '',
      };
    });
  }
  if (where.audience) constraints.audience = where.audience;

  var category = ember.knowledge_type || 'rule';
  if (category === 'lesson') category = 'insight';

  return {
    type: 'Gene',
    id: generateId('gene'),
    category: category,
    domain: ember.domain || '',
    signals_match: signalsMatch,
    preconditions: [
      where.domain ? 'Domain: ' + where.domain : null,
      where.sub_domain ? 'Sub-domain: ' + where.sub_domain : null,
      where.scenario ? 'Scenario: ' + where.scenario : null,
    ].filter(Boolean),
    strategy: strategy,
    constraints: constraints,
    source_ember_id: ember.id,
    source_refined_id: ember.source_refined_id || null,
    confidence: ember.credibility ? ember.credibility.composite : 0,
    created_at: new Date().toISOString(),
  };
}

function writeGeneToLocal(gene) {
  var gepDir = getGepAssetsDir();
  if (!gepDir) {
    return { ok: false, error: 'GEP assets directory not found. Set GEP_ASSETS_DIR or install evolver-main alongside sparker.' };
  }
  var jsonlPath = path.join(gepDir, 'genes.jsonl');
  if (!fs.existsSync(gepDir)) {
    fs.mkdirSync(gepDir, { recursive: true });
  }
  fs.appendFileSync(jsonlPath, JSON.stringify(gene) + '\n', 'utf8');
  return { ok: true, path: jsonlPath };
}

async function sendForgeRequestToHub(emberId) {
  try {
    var { buildForgeRequestMessage, sendToHub, getHubUrl } = require('../transmit/hub-client');
    if (!getHubUrl()) {
      return { ok: false, error: 'Hub not configured' };
    }
    var message = buildForgeRequestMessage(emberId);
    var result = await sendToHub(message);
    return result;
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

function findForgeEligibleEmbers() {
  var embers = readEmbers();
  var practiceRecords = readPracticeRecords();
  var eligible = [];
  for (var i = 0; i < embers.length; i++) {
    var e = embers[i];
    if (!e.credibility) continue;
    if (e.forge_eligible) continue;
    if (e.status === 'rejected') continue;
    var diversity = computeContextDiversity(practiceRecords, e.source_refined_id || e.id);
    if (meetsForgeThreshold(e.credibility, diversity)) {
      eligible.push(e);
    }
  }
  return eligible;
}

async function forgeEmber(emberId, opts) {
  var o = opts || {};
  var embers = readEmbers();
  var ember = null;
  for (var i = 0; i < embers.length; i++) {
    if (embers[i].id === emberId) { ember = embers[i]; break; }
  }
  if (!ember) return { ok: false, error: 'Ember not found: ' + emberId };
  if (!ember.credibility) return { ok: false, error: 'Ember has no credibility data' };

  var practiceRecords = readPracticeRecords();
  var diversity = computeContextDiversity(practiceRecords, ember.source_refined_id || ember.id);
  if (!o.force && !meetsForgeThreshold(ember.credibility, diversity)) {
    return {
      ok: false,
      error: 'Ember does not meet forge threshold',
      composite: ember.credibility.composite,
      citations: (ember.credibility.external || {}).citations || 0,
    };
  }

  var gene = mapEmberToGene(ember);
  var results = { ok: true, gene: gene, local: null, hub: null };

  if (o.dryRun) {
    return results;
  }

  var localResult = writeGeneToLocal(gene);
  results.local = localResult;

  var hubResult = await sendForgeRequestToHub(emberId);
  results.hub = hubResult;

  if (localResult.ok || (hubResult && hubResult.ok)) {
    updateEmber(emberId, { forge_eligible: true, forged_gene_id: gene.id, forged_at: new Date().toISOString() });
  }

  return results;
}

async function forgeAll(opts) {
  var o = opts || {};
  var eligible = findForgeEligibleEmbers();
  if (eligible.length === 0) {
    return { ok: true, forged: 0, eligible: 0, results: [], message: 'No embers meet forge threshold' };
  }

  if (o.dryRun) {
    return {
      ok: true,
      forged: 0,
      eligible: eligible.length,
      candidates: eligible.map(function (e) {
        return { id: e.id, domain: e.domain, composite: e.credibility.composite };
      }),
    };
  }

  var results = [];
  var forged = 0;
  for (var i = 0; i < eligible.length; i++) {
    var result = await forgeEmber(eligible[i].id, { force: true });
    results.push(result);
    if (result.ok) forged++;
  }

  return { ok: true, forged: forged, eligible: eligible.length, results: results };
}

module.exports = {
  mapEmberToGene: mapEmberToGene,
  writeGeneToLocal: writeGeneToLocal,
  sendForgeRequestToHub: sendForgeRequestToHub,
  findForgeEligibleEmbers: findForgeEligibleEmbers,
  forgeEmber: forgeEmber,
  forgeAll: forgeAll,
  getGepAssetsDir: getGepAssetsDir,
};
