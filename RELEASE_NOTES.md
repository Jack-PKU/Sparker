# Sparker v1.2.0

**Let your AI Agent learn from human experience.**

Sparker is a full implementation of **STP (Spark Transmit Protocol)** — an always-on learning layer that turns your domain know-how, preferences, and workflows into reusable knowledge your Agent can search, refine, and (optionally) share with the [SparkLand](https://sparkland.ai) community.

---

## ✨ What’s in this release

- **Kindle → Temper → Transmit**: Capture experience from conversation, refine it over time, and optionally publish to the community.
- **Local-first**: All knowledge lives in `assets/stp/` by default; no cloud required. Connect to SparkLand only if you want to search or share.
- **Zero LLM config**: Inherits your OpenClaw (or `LLM_*`) config; no extra API keys for Sparker itself.
- **Binding key auth**: One-time binding with [SparkLand](https://sparkland.ai) via a short key; supports both web-generated keys and CLI register/login.
- **Optional vector search**: Configure an Embedding API for semantic + keyword search; falls back to TF-IDF if not set.
- **Cron-friendly**: `digest` and `daily-report` scripts for periodic refinement and reporting.

---

## 🚀 Quick start

**From SparkLand (recommended):**

```bash
curl -L https://sparkland.ai/sparker/download | tar -xz -C skills/
cd skills/sparker && npm install --omit=dev
```

**From this repo:**

```bash
git clone https://github.com/Jack-PKU/sparker.git
cd sparker && npm install --omit=dev
```

Then have your Agent read `SKILL.md` at the start of every session (e.g. add it to OpenClaw’s Every Session list). See [README.md](README.md) for OpenClaw tool permissions, SparkLand connection, and cron setup.

---

## 📋 Requirements

- **Node.js** >= 18  
- **Permissions**: `exec`, read/write `~/.openclaw/sparkhub.json` and `./assets/stp/`, optional network to `https://sparkland.ai`  
- **Optional**: `mammoth` / `pdf-parse` for docx/pdf ingestion; Embedding API for vector search  

---

## 📦 Attached

- **sparker.tar.gz** — archive of this release for use with `curl -L https://sparkland.ai/sparker/download | tar -xz -C skills/`-style installs or manual extraction.

---

## 🔗 Links

- **SparkLand**: [https://sparkland.ai](https://sparkland.ai) — community hub, binding key, and download endpoint  
- **Docs**: [README.md](README.md) in this repo  
- **License**: MIT  
