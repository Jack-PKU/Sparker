const crypto = require('crypto');

const STP_SCHEMA_VERSION = '2.0.0';
const STP_SCHEMA_VERSION_LEGACY = '1.0.0';

function canonicalize(obj) {
  if (obj === null || obj === undefined) return 'null';
  if (typeof obj === 'boolean') return obj ? 'true' : 'false';
  if (typeof obj === 'number') {
    if (!Number.isFinite(obj)) return 'null';
    return String(obj);
  }
  if (typeof obj === 'string') return JSON.stringify(obj);
  if (Array.isArray(obj)) {
    return '[' + obj.map(canonicalize).join(',') + ']';
  }
  if (typeof obj === 'object') {
    var keys = Object.keys(obj).sort();
    var pairs = [];
    for (var i = 0; i < keys.length; i++) {
      pairs.push(JSON.stringify(keys[i]) + ':' + canonicalize(obj[keys[i]]));
    }
    return '{' + pairs.join(',') + '}';
  }
  return 'null';
}

function computeAssetId(obj, excludeFields) {
  if (!obj || typeof obj !== 'object') return null;

  // V2: use when.trigger + how.summary as hash input for content-addressed ID
  if (obj.when && obj.when.trigger && obj.how && obj.how.summary) {
    var coreText = String(obj.when.trigger) + '|' + String(obj.how.summary);
    var coreHash = crypto.createHash('sha256').update(coreText, 'utf8').digest('hex');
    return 'sha256:' + coreHash;
  }

  // V1 fallback: hash entire object (minus excluded fields)
  var exclude = new Set(Array.isArray(excludeFields) ? excludeFields : ['asset_id']);
  var clean = {};
  for (var k of Object.keys(obj)) {
    if (exclude.has(k)) continue;
    clean[k] = obj[k];
  }
  var canonical = canonicalize(clean);
  var hash = crypto.createHash('sha256').update(canonical, 'utf8').digest('hex');
  return 'sha256:' + hash;
}

function verifyAssetId(obj) {
  if (!obj || typeof obj !== 'object') return false;
  var claimed = obj.asset_id;
  if (!claimed || typeof claimed !== 'string') return false;
  return claimed === computeAssetId(obj);
}

function generateId(prefix) {
  return prefix + '_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex');
}

function getNodeId() {
  if (process.env.STP_NODE_ID) return String(process.env.STP_NODE_ID);

  // Read persisted node_id from config — avoids instability when cwd changes between sessions
  var configPath = require('path').join(
    process.env.HOME || process.env.USERPROFILE || '/root',
    '.openclaw', 'sparkhub.json'
  );
  try {
    var cfg = JSON.parse(require('fs').readFileSync(configPath, 'utf8'));
    if (cfg.node_id) return cfg.node_id;
  } catch (e) { /* first run or missing config */ }

  // Generate stable node_id from skill root (dirname of this file is always the same)
  var skillRoot = require('path').resolve(__dirname, '..', '..');
  var raw = (process.env.AGENT_NAME || 'default') + '|' + skillRoot;
  var nodeId = 'node_' + crypto.createHash('sha256').update(raw).digest('hex').slice(0, 12);

  // Persist it so it never changes
  try {
    var dir = require('path').dirname(configPath);
    if (!require('fs').existsSync(dir)) require('fs').mkdirSync(dir, { recursive: true });
    var existing = {};
    try { existing = JSON.parse(require('fs').readFileSync(configPath, 'utf8')); } catch (e) {}
    existing.node_id = nodeId;
    require('fs').writeFileSync(configPath, JSON.stringify(existing, null, 2), 'utf8');
  } catch (e) { /* best-effort */ }

  return nodeId;
}

module.exports = {
  STP_SCHEMA_VERSION,
  STP_SCHEMA_VERSION_LEGACY,
  canonicalize,
  computeAssetId,
  verifyAssetId,
  generateId,
  getNodeId,
};
