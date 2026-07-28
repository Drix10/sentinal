<p align="center">
  <h1 align="center">🛡️ Sentinel AI Security Platform</h1>
</p>

<p align="center">
    <em>Hack yourself before someone else does.</em>
</p>

<p align="center">
    <img src="https://img.shields.io/npm/v/sentinel-ai-cli?style=for-the-badge" />
    <img src="https://img.shields.io/npm/dm/sentinel-ai-cli?style=for-the-badge" />
    <img src="https://img.shields.io/badge/TypeScript-5.x-blue?style=for-the-badge" />
    <img src="https://img.shields.io/badge/AI-Gemini_3.5_Flash-orange?style=for-the-badge" />
    <img src="https://img.shields.io/badge/Security-AI%20Powered-red?style=for-the-badge" />
    <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" />
</p>

<p align="center">
  <b>Application Security Platform combining Deterministic AST Parsing, Knowledge/Attack Graphs, Multi-File Codebase Context, Gemini 3.5 Flash AI Reasoning, and Zero-Breakage Autonomous Patching.</b>
</p>

---

## ⚡ Why Sentinel?

> Traditional security tools rely solely on superficial regex pattern matching or unguided text prompts that trigger high false-positive rates and corrupt source files when attempting fixes.

> **Sentinel compiles your codebase into Sentinel IR, builds a Knowledge Graph, synthesizes multi-hop Attack Graphs, extracts deep multi-file codebase context (interfaces, exports, dependencies), performs CISO-grade reasoning powered by Gemini 3.5 Flash, and applies autonomous fixes backed by zero-breakage verification and snapshot rollback.**

```
Polyglot Source Code ──► Sentinel IR ──► Security Knowledge Graph ──► Attack Graph ──► Deep Multi-File Context ──► Gemini 3.5 Flash Reasoning ──► Autonomous Patching & Zero-Breakage Verification
```

---

## 🚀 Quick Start & Installation

### Option 1: Global npm Installation

```bash
npm install -g sentinel-ai-cli
```

### Option 2: Run directly via npx

```bash
npx sentinel-ai-cli attack .
```

### Option 3: Local Clone & Development

```bash
git clone https://github.com/Drix10/sentinal.git
cd sentinal
npm install
npm run build
npm run start -- attack .
```

---

## 🔑 Configuration & API Key Setup

Sentinel uses **Gemini 3.5 Flash** for deep security analysis. Get a free API key from [Google AI Studio](https://aistudio.google.com/apikey).

Configure your API key:

```bash
sentinel set-key
```

Sentinel validates the key and securely saves it locally to `~/.sentinel/config.json`.

---

## 💻 CLI Commands & Workflow

### 1. Execute Security Scan & Attack Graph Synthesis (`sentinel attack`)

Analyze current directory:
```bash
sentinel attack .
```

Analyze a target repository folder:
```bash
sentinel attack /path/to/target-repo
```

### 2. Deep Finding Explanation (`sentinel explain`)

View forensic root-cause analysis, exploit mechanics, CIA triad impact, OWASP details, and step-by-step developer remediation:
```bash
sentinel explain FINDING-100
```

### 3. Autonomous AI Patching & Verification (`sentinel fix`)

Synthesize a drop-in secure code patch with deep codebase awareness and run automated **zero-breakage verification** (AST diagnostics, `tsc` compilation, test runner execution, and detector re-scans) before finalizing the fix:

```bash
sentinel fix FINDING-100
```

#### Preview Diff Without Modifying Disk (`--dry-run`):
```bash
sentinel fix FINDING-100 --dry-run
```

#### Skip Compiler/Test Verification (`--no-verify`):
```bash
sentinel fix FINDING-100 --no-verify
```

> 🛡️ **Zero-Breakage Guarantee:** If a patch introduces compilation or test regressions, Sentinel automatically invokes AI self-correction retry, and restores the pre-patch snapshot from `.sentinel/backups/` if verification fails.

### 4. Ignore Finding (`sentinel ignore`)

Mark a finding as ignored with an optional developer justification reason:
```bash
sentinel ignore FINDING-100 --reason "Mitigated by upstream Cloudflare WAF rule"
```

---

## 📊 Example Terminal Output

```text
 ╔══════════════════════════════════════════════════════════════════════╗
 ║      S E N T I N E L   A I   S E C U R I T Y   P L A T F O R M       ║
 ║      Deterministic Program Analysis • Attack Graph • AI Reasoning    ║
 ╚══════════════════════════════════════════════════════════════════════╝

 Target: /path/to/target-repo

✔ Project Detected & Topology Analyzed

┌────────────────────────┬───────────────────────────────────────────────────┐
│ PROPERTY               │ VALUE / METADATA                                  │
├────────────────────────┼───────────────────────────────────────────────────┤
│ Project Name           │ my-app-backend                                    │
│ Framework              │ Express                                           │
│ Language               │ TypeScript                                        │
│ Package Manager        │ npm                                               │
│ Source Directory       │ src                                               │
│ Docker Configured      │ No                                                │
│ Env Configured         │ Yes                                               │
└────────────────────────┴───────────────────────────────────────────────────┘

┌── [+] SENTINEL IR COMPILER METRICS (@sentinel/plugin-typescript) ──────────┐
│ IR Project Compilation: Successful                                         │
│ AST Source Files Parsed: 32                                                │
│ Extracted API Routes: 32                                                   │
│ AST Node Processing: TypeScript Morph Plugin Active                        │
└────────────────────────────────────────────────────────────────────────────┘

✔ Discovered 44 HTTP API routes
┌────────┬──────────────────────────────────────┬────────────────────────────┐
│ METHOD │ ROUTE PATH                           │ SOURCE FILE                │
├────────┼──────────────────────────────────────┼────────────────────────────┤
│ GET    │ /health                              │ src/index.ts               │
│ POST   │ /analyze                             │ src/routes/ai-mrv.routes.ts│
│ POST   │ /login                               │ src/routes/auth.routes.ts  │
└────────┴──────────────────────────────────────┴────────────────────────────┘

✔ Found 43 package dependencies
┌──────────────────────────────────────┬──────────────────┬──────────────────┐
│ PACKAGE NAME                         │ VERSION          │ SCOPE            │
├──────────────────────────────────────┼──────────────────┼──────────────────┤
│ @google/generative-ai                │ 0.21.0           │ dependency       │
│ express                              │ 4.18.2           │ dependency       │
└──────────────────────────────────────┴──────────────────┴──────────────────┘

✔ Found 0 secret patterns
┌── [+] KNOWLEDGE GRAPH & ATTACK GRAPH ENGINE MATRIX ────────────────────────┐
│ Knowledge Graph Nodes: 112 (Routes, Secrets, Dependencies)                 │
│ Topology Edges: 2992 (USES_DEPENDENCY, READS_SECRET)                       │
│ Synthesized Exploit Paths: 0 Attack Graph Vectors                          │
└────────────────────────────────────────────────────────────────────────────┘

✔ Security Report Synthesized Successfully!

 ┌──────────────────────────────────────────────────────────────────────────┐
 │  SECURITY RISK SCORE: 95/100   [█████████████████████████████░]          │
 │  STATUS: GOOD SECURITY POSTURE                                           │
 └──────────────────────────────────────────────────────────────────────────┘

┌── [+] EXECUTIVE SUMMARY ───────────────────────────────────────────────────┐
│ The security assessment of the target project reveals a robust baseline    │
│ posture. Sentinel's engines detected zero active multi-hop attack graph    │
│ exploit vectors and no exposed hardcoded secrets.                          │
└────────────────────────────────────────────────────────────────────────────┘

┌── [+] ATTACK SURFACE DISCOVERED ───────────────────────────────────────────┐
│ 1. 44 HTTP API endpoints                                                   │
│ 2. 43 runtime dependencies                                                 │
└────────────────────────────────────────────────────────────────────────────┘

 [+] FINDING LIFECYCLE STORE SUMMARY
┌───────────────┬────────────┬─────────────────────────┬────────────┬────────┐
│ ID            │ SEVERITY   │ VULNERABILITY TITLE     │ LOCATION   │ CONF.  │
├───────────────┼────────────┼─────────────────────────┼────────────┼────────┤
│ FINDING-100   │ LOW        │ Outdated AWS SDK Maj... │ Depende... │ 90%    │
└───────────────┴────────────┴─────────────────────────┴────────────┴────────┘

┌── [+] NEXT STEPS & ACTION PLAN ────────────────────────────────────────────┐
│ DEVELOPER REMEDIATION WORKFLOW & NEXT STEPS:                               │
│                                                                            │
│  1. Examine OWASP Details & Source Evidence:                               │
│     sentinel explain FINDING-100                                           │
│                                                                            │
│  2. Synthesize Autonomous AI Security Patch:                               │
│     sentinel fix FINDING-100                                               │
│                                                                            │
│  3. Triage False Positives or Accept Risk:                                 │
│     sentinel ignore FINDING-100 --reason "Reviewed by AppSec team"         │
│                                                                            │
│  4. Re-verify Code Base After Remediation:                                 │
│     sentinel attack .                                                      │
│                                                                            │
│  Findings persisted to: .sentinel/findings.json                            │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Technology Stack

- **Core Runtime**: TypeScript 5.x, Node.js (ES2022)
- **AST Compiler & IR**: `ts-morph`, `fast-glob`
- **AI Reasoning Engine**: `@google/generative-ai` (`gemini-3.5-flash` with `gemini-3.0-flash` fallback)
- **CLI Framework & UI**: `commander`, `chalk`, `ora`

---

## 📄 License

[MIT License](LICENSE)

---

Made with ❤️ to help developers **hack themselves first**.
