// Retrospective Analysis — extract missed knowledge from OpenClaw session logs.
//
// During real-time conversations, the agent captures high-signal events (corrections,
// teaching, explicit preferences) but inevitably misses subtle signals, cross-session
// patterns, and implicit preferences. This module runs during digest to:
//   1. Read recent OpenClaw session logs (JSONL)
//   2. Format them into readable conversation transcripts
//   3. Use LLM to identify knowledge signals missed by real-time kindle
//   4. Deduplicate against existing RawSparks
//   5. Append new sparks with source='retrospective'

var fs = require('fs');
var path = require('path');
var os = require('os');
var { createRawSpark } = require('./extractor');
var { appendRawSpark, readRawSparks, readJson, writeJson, getStpAssetsDir, ensureDir } = require('../core/storage');
var { resolveLLMConfig, callLLM } = require('../core/openclaw-config');

var AGENT_NAME = process.env.STP_AGENT_NAME || process.env.AGENT_NAME || 'main';

var RETROSPECTIVE_PROMPT = [
  'You are an expert knowledge extractor specializing in retrospective analysis of human-AI conversations.',
  'Below are recent conversation transcripts between a user and an AI agent.',
  '',
  'Your task: find knowledge signals that the agent likely MISSED during real-time conversation.',
  'Focus on these often-missed categories:',
  '',
  '1. **Implicit preferences**: User consistently chooses one style/approach without explicitly stating a rule',
  '2. **Casual expertise drops**: User mentions domain knowledge in passing, not as formal teaching',
  '3. **Correction patterns**: Same type of correction repeated across conversations (systemic gap)',
  '4. **Unstated standards**: User rejects output for reasons they never explicitly articulated',
  '5. **Workflow habits**: How the user structures their requests reveals their work process',
  '6. **Evaluation criteria**: What the user praises or criticizes reveals their quality bar',
  '7. **Domain terminology**: Specialized terms the user uses that reveal expertise',
  '8. **Boundary conditions**: Edge cases the user flags that define when rules apply or don\'t',
  '',
  'For EACH insight, output a JSON object with the **six-dimension structure**:',
  '',
  '  knowledge_type   — "rule" | "preference" | "pattern" | "lesson" | "methodology"',
  '  when             — { trigger: string, conditions: string[] }',
  '  where            — { domain: string, sub_domain: string, scenario: string, audience: string }',
  '  why              — string (causal reasoning)',
  '  how              — { summary: string (one-line actionable rule), detail: string }',
  '  result           — { expected_outcome: string }',
  '  not              — array of { condition: string, effect: "skip"|"modify"|"warn", reason: string }',
  '  signal_type      — "implicit_preference" | "casual_expertise" | "correction_pattern" |',
  '                     "unstated_standard" | "workflow_habit" | "evaluation_criteria" |',
  '                     "domain_terminology" | "boundary_condition"',
  '  evidence         — brief quote from the conversation (2-3 sentences max)',
  '  confidence_note  — why you believe this is real knowledge vs noise',
  '',
  'IMPORTANT:',
  '- Only extract knowledge that is UNLIKELY to have been captured in real-time',
  '- Skip obvious corrections/teaching that the agent would have caught',
  '- Focus on PATTERNS across multiple turns or subtle signals',
  '- Quality over quantity — 3 solid insights beat 10 weak ones',
  '- Return a JSON array. Only return JSON, no markdown fences.',
  '- If no extractable knowledge, return []',
  '',
  '{{existing_sparks_hint}}',
  '',
  '## Conversation Transcripts',
  '{{content}}',
].join('\n');

var STATE_FILE_NAME = 'retrospective_state.json';
var MAX_SESSIONS = 10;
var FULL_READ_THRESHOLD = 50000;
var SEGMENT_SIZE = 25000;
var MAX_SESSION_FORMATTED = 30000;
var MAX_TOTAL_FORMATTED = 150000;

function getSessionsDir() {
  var dir = process.env.STP_SESSIONS_DIR;
  if (dir) return path.resolve(dir);
  return path.join(os.homedir(), '.openclaw', 'agents', AGENT_NAME, 'sessions');
}

function getStateFilePath() {
  return path.join(getStpAssetsDir(), 'retrospective', STATE_FILE_NAME);
}

function readState() {
  return readJson(getStateFilePath(), {
    last_run_at: null,
    processed_sessions: {},
  });
}

function writeState(state) {
  var dir = path.dirname(getStateFilePath());
  ensureDir(dir);
  writeJson(getStateFilePath(), state);
}

function stripChannelMetadata(text) {
  text = text.replace(/Conversation info \(untrusted metadata\):\n```json\n[\s\S]*?```\n*/g, '');
  text = text.replace(/Sender \(untrusted metadata\):\n```json\n[\s\S]*?```\n*/g, '');
  text = text.replace(/\[System:[^\]]*\]/g, '');
  text = text.replace(/\[message_id:[^\]]*\]\n?/g, '');
  text = text.replace(/ou_[a-f0-9]+:\s*/g, '');
  text = text.replace(/\n{3,}/g, '\n').trim();
  return text;
}

function readSessionContent(filePath) {
  var stats;
  try { stats = fs.statSync(filePath); } catch (e) { return ''; }
  var size = stats.size;

  if (size <= FULL_READ_THRESHOLD) {
    try { return fs.readFileSync(filePath, 'utf8'); } catch (e) { return ''; }
  }

  var numSeg = Math.min(4, Math.max(2, Math.ceil(size / FULL_READ_THRESHOLD)));
  if (numSeg * SEGMENT_SIZE >= size * 0.8) {
    try { return fs.readFileSync(filePath, 'utf8'); } catch (e) { return ''; }
  }

  var fd;
  try { fd = fs.openSync(filePath, 'r'); } catch (e) { return ''; }

  var segments = [];
  for (var i = 0; i < numSeg; i++) {
    var pos = (numSeg === 1)
      ? Math.max(0, size - SEGMENT_SIZE)
      : Math.floor(i * (size - SEGMENT_SIZE) / (numSeg - 1));
    var readSize = Math.min(SEGMENT_SIZE, size - pos);
    var buf = Buffer.alloc(readSize);
    try { fs.readSync(fd, buf, 0, readSize, pos); } catch (e) { continue; }
    var text = buf.toString('utf8');

    if (pos > 0) {
      var nl = text.indexOf('\n');
      if (nl >= 0) text = text.slice(nl + 1);
    }
    if (pos + readSize < size) {
      var lastNl = text.lastIndexOf('\n');
      if (lastNl >= 0) text = text.slice(0, lastNl);
    }

    if (text.trim()) segments.push(text);
  }
  fs.closeSync(fd);

  return segments.join('\n');
}

function formatSessionLog(jsonlContent) {
  var result = [];
  var lines = jsonlContent.split('\n');

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];
    if (!line.trim()) continue;
    try {
      var data = JSON.parse(line);
      var entry = '';

      if (data.type === 'message' && data.message) {
        var role = (data.message.role || 'unknown').toUpperCase();
        if (role === 'TOOLRESULT') continue;
        var content = '';
        if (Array.isArray(data.message.content)) {
          content = data.message.content
            .map(function (c) {
              if (c.type === 'text') return c.text;
              if (c.type === 'toolCall') return '[TOOL: ' + c.name + ']';
              return '';
            })
            .join(' ');
        } else if (typeof data.message.content === 'string') {
          content = data.message.content;
        } else {
          content = JSON.stringify(data.message.content);
        }

        if (data.message.errorMessage) continue;
        if (content.trim() === 'HEARTBEAT_OK' || content.includes('NO_REPLY')) continue;

        if (role === 'USER') {
          content = stripChannelMetadata(content);
        }
        content = content.replace(/\n{3,}/g, '\n');
        content = content.slice(0, role === 'USER' ? 2000 : 800);
        if (!content.trim()) continue;
        entry = '**' + role + '**: ' + content;
      } else if (data.type === 'tool_result' || (data.message && data.message.role === 'toolResult')) {
        continue;
      }

      if (entry) {
        result.push(entry);
      }
    } catch (e) {
      continue;
    }
  }
  return result.join('\n');
}

function findRecentSessions(cutoffMs) {
  var sessionsDir = getSessionsDir();
  if (!fs.existsSync(sessionsDir)) return [];

  var now = Date.now();
  var files;
  try {
    files = fs.readdirSync(sessionsDir)
      .filter(function (f) { return f.endsWith('.jsonl') && !f.includes('.lock'); })
      .map(function (f) {
        try {
          var st = fs.statSync(path.join(sessionsDir, f));
          return { name: f, time: st.mtime.getTime(), size: st.size };
        } catch (e) {
          return null;
        }
      })
      .filter(function (f) { return f && (now - f.time) < cutoffMs; })
      .sort(function (a, b) { return b.time - a.time; });
  } catch (e) {
    return [];
  }

  return files.slice(0, MAX_SESSIONS);
}

function buildExistingHint(rawSparks, hours) {
  var cutoff = Date.now() - hours * 60 * 60 * 1000;
  var recent = rawSparks.filter(function (s) {
    return new Date(s.created_at).getTime() >= cutoff;
  });
  if (recent.length === 0) return '';

  var summaries = recent.slice(0, 15).map(function (s) {
    var summary = (s.how && s.how.summary) || s.content || '';
    return '- [' + (s.domain || 'general') + '] ' + summary.slice(0, 80);
  });

  return '## Already Captured (skip these)\n' +
    'The agent already captured these sparks in real-time. Do NOT re-extract them:\n' +
    summaries.join('\n');
}

function buildRetrospectivePrompt(transcripts, existingHint) {
  var content = transcripts.slice(0, MAX_TOTAL_FORMATTED);
  return RETROSPECTIVE_PROMPT
    .replace('{{content}}', content)
    .replace('{{existing_sparks_hint}}', existingHint);
}

function parseRetrospectiveResponse(text) {
  if (!text) return [];
  var cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }
  try {
    var arr = JSON.parse(cleaned);
    if (!Array.isArray(arr)) return [];
    return arr.filter(function (item) {
      return item && ((item.how && item.how.summary) || item.knowledge_type);
    });
  } catch (e) {
    return [];
  }
}

function isDuplicate(insight, existingSparks) {
  var summary = ((insight.how && insight.how.summary) || '').toLowerCase().replace(/\s+/g, ' ').trim();
  if (!summary) return false;

  for (var i = 0; i < existingSparks.length; i++) {
    var existing = existingSparks[i];
    var existingSummary = ((existing.how && existing.how.summary) || existing.content || '')
      .toLowerCase().replace(/\s+/g, ' ').trim();
    if (!existingSummary) continue;

    if (summary === existingSummary) return true;
    if (summary.length > 20 && existingSummary.length > 20) {
      var shorter = summary.length < existingSummary.length ? summary : existingSummary;
      var longer = summary.length >= existingSummary.length ? summary : existingSummary;
      if (longer.indexOf(shorter) >= 0) return true;
    }
  }
  return false;
}

async function runRetrospective(opts) {
  var o = opts || {};
  var hours = o.hours || Number(process.env.STP_DIGEST_INTERVAL_HOURS) || 12;
  if (o.days) hours = o.days * 24;
  var cutoffMs = hours * 60 * 60 * 1000;

  var sessionsDir = getSessionsDir();
  if (!fs.existsSync(sessionsDir)) {
    return {
      ok: true,
      skipped: true,
      reason: 'no_sessions_dir',
      sessions_dir: sessionsDir,
      sparks_extracted: 0,
      sparks: [],
    };
  }

  var llmConfig = resolveLLMConfig();
  if (!llmConfig) {
    return {
      ok: true,
      skipped: true,
      reason: 'no_llm_config',
      sparks_extracted: 0,
      sparks: [],
    };
  }

  var state = readState();
  var recentSessions = findRecentSessions(cutoffMs);

  if (recentSessions.length === 0) {
    return {
      ok: true,
      skipped: true,
      reason: 'no_recent_sessions',
      sparks_extracted: 0,
      sparks: [],
    };
  }

  var sections = [];
  var totalFormatted = 0;
  var processedFiles = [];

  for (var i = 0; i < recentSessions.length && totalFormatted < MAX_TOTAL_FORMATTED; i++) {
    var f = recentSessions[i];
    var filePath = path.join(sessionsDir, f.name);

    var lastProcessedTime = state.processed_sessions[f.name];
    if (lastProcessedTime && f.time <= lastProcessedTime) continue;

    var raw = readSessionContent(filePath);
    var formatted = formatSessionLog(raw);

    if (formatted.length > MAX_SESSION_FORMATTED) {
      formatted = formatted.slice(0, MAX_SESSION_FORMATTED);
    }
    if (formatted.trim()) {
      sections.push('--- SESSION (' + f.name + ') ---\n' + formatted);
      totalFormatted += formatted.length;
      processedFiles.push(f);
    }
  }

  if (sections.length === 0) {
    return {
      ok: true,
      skipped: true,
      reason: 'no_new_sessions',
      sparks_extracted: 0,
      sparks: [],
    };
  }

  var transcripts = sections.join('\n\n');
  var existingSparks = readRawSparks();
  var existingHint = buildExistingHint(existingSparks, hours);
  var prompt = buildRetrospectivePrompt(transcripts, existingHint);

  var response;
  try {
    response = await callLLM(prompt, Object.assign({}, llmConfig, {
      max_tokens: 4000,
      temperature: 0.2,
    }));
  } catch (e) {
    return {
      ok: false,
      error: 'llm_call_failed: ' + (e.message || e),
      sparks_extracted: 0,
      sparks: [],
    };
  }

  var insights = parseRetrospectiveResponse(response);
  var newSparks = [];

  for (var j = 0; j < insights.length; j++) {
    var ins = insights[j];
    if (isDuplicate(ins, existingSparks)) continue;

    var insWhen = ins.when || {};
    var insWhere = ins.where || {};
    var insHow = ins.how || {};
    var insNot = ins.not || [];
    var insDomain = insWhere.domain || 'general';

    var spark = createRawSpark({
      source: 'retrospective',
      domain: insDomain,
      extraction_method: 'retrospective_analysis',
      confirmation_status: 'pending_verification',
      confidence: 0.30,
      knowledge_type: ins.knowledge_type || 'pattern',
      when: { trigger: insWhen.trigger || (insHow.summary || ''), conditions: insWhen.conditions || [] },
      where: {
        domain: insDomain,
        sub_domain: insWhere.sub_domain || '',
        scenario: insWhere.scenario || '',
        audience: insWhere.audience || '',
      },
      why: ins.why || '',
      how: { summary: insHow.summary || '', detail: insHow.detail || '' },
      result: { expected_outcome: (ins.result && ins.result.expected_outcome) || '' },
      not: insNot,
      tags: [
        'retrospective',
        ins.signal_type || null,
      ].filter(Boolean),
      context: {
        extraction_type: 'retrospective',
        signal_type: ins.signal_type || 'unknown',
        evidence: ins.evidence || null,
        confidence_note: ins.confidence_note || null,
      },
    });

    if (!o.dryRun) {
      appendRawSpark(spark);
    }
    newSparks.push(spark);
  }

  if (!o.dryRun) {
    for (var pi = 0; pi < processedFiles.length; pi++) {
      state.processed_sessions[processedFiles[pi].name] = processedFiles[pi].time;
    }

    var sessionNames = Object.keys(state.processed_sessions);
    var staleThreshold = Date.now() - 7 * 24 * 60 * 60 * 1000;
    for (var si = 0; si < sessionNames.length; si++) {
      if (state.processed_sessions[sessionNames[si]] < staleThreshold) {
        delete state.processed_sessions[sessionNames[si]];
      }
    }

    state.last_run_at = new Date().toISOString();
    writeState(state);
  }

  return {
    ok: true,
    sessions_analyzed: processedFiles.length,
    llm_insights_raw: insights.length,
    duplicates_skipped: insights.length - newSparks.length,
    sparks_extracted: newSparks.length,
    sparks: newSparks.map(function (s) {
      return {
        id: s.id,
        domain: s.domain,
        summary: (s.how && s.how.summary) || s.content || '',
        signal_type: s.context && s.context.signal_type || 'unknown',
        confidence: s.confidence,
      };
    }),
  };
}

module.exports = {
  runRetrospective: runRetrospective,
  findRecentSessions: findRecentSessions,
  formatSessionLog: formatSessionLog,
  stripChannelMetadata: stripChannelMetadata,
  readSessionContent: readSessionContent,
  getSessionsDir: getSessionsDir,
};
