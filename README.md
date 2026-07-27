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
    <img src="https://img.shields.io/github/license/Drix10/sentinal?style=for-the-badge" />
</p>

<p align="center">
  <b>Application Security Platform combining Deterministic AST Parsing, Knowledge/Attack Graphs, Security Context Building, and Gemini 3.5 Flash AI Reasoning.</b>
</p>

---

## ⚡ Why Sentinel?

> Traditional security tools rely solely on regex pattern matching or unguided text prompts that trigger high false-positive rates.

> **Sentinel first compiles your code into Sentinel IR, maps your application topology into a Knowledge Graph, synthesizes multi-hop Attack Graphs, ranks evidence via a Security Context Builder, and performs CISO-grade reasoning powered by Gemini 3.5 Flash.**

```
Polyglot Source Code ──► Sentinel IR ──► Security Knowledge Graph ──► Attack Graph ──► Security Context Builder ──► Verified AI Reasoning (Gemini 3.5 Flash) ──► Actionable Remediation
```

---

## ✨ Codebase Subsystems & Architecture

Sentinel is organized cleanly under `src/` into decoupled domain modules:

```
src/
├── index.ts               # CLI Shebang Entrypoint (Commander command registrations)
├── types.ts               # Shared Data Models (ProjectInfo, RouteInfo, DependencyInfo, SecretFinding)
├── ai/
│   ├── contextBuilder.ts  # Security Context Builder (Evidence Ranker & Context Payload Generator)
│   ├── llm.ts             # Structured Gemini AI Client (Gemini 3.5 Flash with 3.0 Flash fallback)
│   └── prompts.ts         # CISO-Grade System Prompts & Gemini JSON Response Schemas
├── commands/
│   ├── attack.ts          # Action handler for 'sentinel attack [target]'
│   ├── explain.ts         # Action handler for 'sentinel explain <findingId>'
│   ├── fix.ts             # Action handler for 'sentinel fix <findingId>'
│   ├── ignore.ts          # Action handler for 'sentinel ignore <findingId>'
│   └── set-key.ts         # Action handler for 'sentinel set-key'
├── core/
│   ├── config.ts          # Configuration & API Key storage (~/.sentinel/config.json)
│   └── orchestrator.ts    # Pipeline Orchestrator (Coordinates IR, Events, Graph, Context & UI)
├── events/
│   └── eventBus.ts        # Typed SentinelEventBus for real-time telemetry streaming
├── findings/
│   └── findingStore.ts    # Finding Lifecycle Store with disk persistence (.sentinel/findings.json)
├── graph/
│   ├── knowledgeGraph.ts  # Topology Fact Store (Routes, Secrets, Dependencies)
│   └── attackGraph.ts     # BFS Multi-Hop Attack Graph Exploit Path Generator
├── ir/
│   └── types.ts           # Sentinel Intermediate Representation Spec (IRProject, IRFile, IRRoute)
├── plugins/
│   └── typescript.ts      # Polyglot Language AST Compiler (@sentinel/plugin-typescript)
├── rules/
│   ├── project.ts         # Project metadata & framework detector
│   ├── dependencies.ts    # SCA Dependency Scanner
│   ├── routeParser.ts     # Shared AST Route Expression Extractor
│   ├── routes.ts          # API Route Finder
│   └── secrets.ts         # Regex Secret Scanner with Masking (AIza****X9Z)
├── ui/
│   └── render.ts          # High-Contrast Terminal UI (ANSI length fixing, Score Badges, Matrix Cards, Diffs)
└── utils/
    └── path.ts            # OS Path Normalization (Windows backslashes to POSIX forward slashes)
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

### 1. Execute Security Scan & Attack Graph Synthesis

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

### 3. Generate Autonomous AI Patch (`sentinel fix`)

Generate a drop-in secure code diff patch and automatically update finding status to `FIXED`:
```bash
sentinel fix FINDING-100
```

### 4. Ignore Finding (`sentinel ignore`)

Mark a finding as ignored with an optional developer justification reason:
```bash
sentinel ignore FINDING-100 --reason "Mitigated by upstream Cloudflare WAF rule"
```

---

## 📊 Example Terminal Output

```text
 ╔══════════════════════════════════════════════════════════════════════╗
 ║  🛡️   S E N T I N E L   A I   S E C U R I T Y   P L A T F O R M   ║
 ║      Deterministic Program Analysis • Attack Graph • AI Reasoning    ║
 ╚══════════════════════════════════════════════════════════════════════╝

 ⚡ [EVENT BUS] project:indexed -> Parsed 14 source AST files
 ┌── 🧩 SENTINEL IR COMPILER METRICS (@sentinel/plugin-typescript) ──┐
 │  IR Project Compilation: Successful                              │
 │  AST Source Files Parsed: 14                                      │
 │  Extracted API Routes: 14                                         │
 └───────────────────────────────────────────────────────────────────┘

 ⚡ [EVENT BUS] graph:knowledge_updated -> Nodes: 11, Edges: 2
 ┌── 🕸️ KNOWLEDGE GRAPH & ATTACK GRAPH ENGINE MATRIX ───────────────┐
 │  Knowledge Graph Nodes: 11 (Routes, Secrets, Dependencies)         │
 │  Topology Edges: 2 (USES_DEPENDENCY, READS_SECRET)                │
 │  Synthesized Exploit Paths: 1 Attack Graph Vectors                │
 └───────────────────────────────────────────────────────────────────┘

 ┌──────────────────────────────────────────────────────────────────────┐
 │  SECURITY RISK SCORE: 85/100   [█████████████████████████░░░░]     │
 │  STATUS: GOOD SECURITY POSTURE                                      │
 └──────────────────────────────────────────────────────────────────────┘

 📋 FINDING LIFECYCLE STORE SUMMARY
 ┌─────────┬───────────────┬──────────┬─────────────────────────────┬──────────────┬────────────┬────────┐
 │ (index) │ ID            │ Severity │ Title                       │ Location     │ Confidence │ Status │
 ├─────────┼───────────────┼──────────┼─────────────────────────────┼──────────────┼────────────┼────────┤
 │ 0       │ 'FINDING-100' │ 'HIGH'   │ 'Potential Command Inject'  │ 'index.ts:1' │ '95%'      │ 'OPEN' │
 └─────────┴───────────────┴──────────┴─────────────────────────────┴──────────────┴────────────┴────────┘
 Findings persisted to: .sentinel/findings.json

 💡 Developer Workflow Hints:
   sentinel explain FINDING-100    (View deep OWASP analysis & code evidence)
   sentinel fix FINDING-100        (Generate AI remediation patch)
   sentinel ignore FINDING-100     (Mark finding as ignored)
```

---

## 🛠️ Technology Stack

- **Core Runtime**: TypeScript 5.x, Node.js (ES2022)
- **AST Compiler & IR**: `ts-morph`, `fast-glob`
- **AI Reasoning Engine**: `@google/generative-ai` (`gemini-3.5-flash` with `gemini-3.0-flash` fallback)
- **CLI Framework & UI**: `commander`, `chalk`, `ora`

---

## 📅 Development Timeline & Hackathon Changelog

### Cyber - 1
**Hack Yourself First - Sentinel**
- **Problem:** Developers often discover critical security vulnerabilities only after an exploit occurs in production.
- **Solution:** An intelligent CLI application security platform that compiles code topology into IR, indexes Knowledge & Attack Graphs, and applies AI reasoning to fix vulnerabilities before release.

### Commits & Architecture Milestones

- **Shebang & Executable Binary Fix (`v1.0.3`)**: Added `#!/usr/bin/env node` executable shebang header for global npm CLI execution across OS environments.
- **Security Context Builder**: [`src/ai/contextBuilder.ts`](file:///c:/Users/ggdri/Downloads/NYC-R2-Sentinal/src/ai/contextBuilder.ts) for evidence ranking, risk density scoring, and token-optimized prompt synthesis.
- **Gemini 3.5 Flash Structured AI Outputs**: Gemini `ResponseSchema` integration for `securityReportSchema`, `explainFindingSchema`, and `fixPatchSchema`.
- **Finding Store & Disk Persistence**: [commit 8228a1d] Persistent `.sentinel/findings.json` finding IDs (`FINDING-100`).
- **Knowledge & Attack Graph Engine**: [commit cfae39d] BFS graph traversal for multi-hop exploit paths.
- **Typed Event Bus**: [commit 97504cf] `SentinelEventBus` real-time telemetry stream.
- **Regex Secret Detection**: [commit 46f833f] Secret scanner with string masking (`AIza****X9Z`).
- **Dependency Analysis**: [commit 54ce6dc] Package dependencies scanner.
- **TypeScript Plugin & IR**: [commit 8228a1d] `ts-morph` AST parser to Sentinel IR.

---

## 🎨 Planning & Design Architecture

- **Architecture Design Board**: [Excalidraw Design Diagram](https://excalidraw.com/#json=kq_rwMbVvmfWpQSZq_WgP,IRqJiWOEifxpliKZP8KB8g)
- **Engineering Blueprint**: [`plan.md`](file:///c:/Users/ggdri/Downloads/NYC-R2-Sentinal/plan.md)

---

## 📄 License

[MIT License](LICENSE)

---

Made with ❤️ to help developers **hack themselves first**.
