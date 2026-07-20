<p align="center">
  <h1 align="center">🛡️ Sentinel AI CLI</h1>
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
  <b>AI-Powered Security Auditor that understands your codebase before attacking it.</b>
</p>

---

# ⚡ Why Sentinel?

> Most security scanners look for known patterns.

> Sentinel first understands **how your application actually works**, then thinks like an attacker.

Instead of simply grepping for vulnerabilities, Sentinel:

✅ Maps your routes

✅ Finds secrets

✅ Understands dependencies

✅ Detects frameworks

✅ Builds an attack surface

✅ Uses Gemini to perform an intelligent penetration review

This produces reports that are much closer to what a security engineer would write than a traditional static analyzer.

## Features

* 🔍 **AI-Powered Security Analysis**

  * Uses Gemini to inspect your project like a real attacker.
  * Produces detailed vulnerability reports with explanations and fixes.

* 🗺️ **Codebase Understanding**

  * Detects frameworks and project structure.
  * Maps files and folders.
  * Understands project architecture before analysis.

* 🌐 **Route Discovery**

  * Detects API endpoints.
  * Finds HTTP methods (GET, POST, PUT, DELETE, etc.).
  * Maps routes to source files.

* 📦 **Dependency Analysis**

  * Reads `package.json`.
  * Identifies production and development dependencies.
  * Uses dependency information to improve attack context.

* 🔐 **Secret Detection**

  * Scans the repository for exposed secrets.
  * Detects common API keys, tokens, credentials, and sensitive values.
  * Looks beyond `.env` files to identify accidentally committed secrets.

* 🤖 **LLM Guided Pentesting**

  * Sends a structured summary of your application to Gemini.
  * Generates realistic attack scenarios.
  * Reports vulnerabilities, severity, exploitation path, and recommended fixes.

* 🎨 Beautiful CLI Output

  * Clean terminal UI.
  * Color coded findings.
  * Easy-to-read reports.

---

# Installation

~~Install globally using npm~~
**Will work after hackathon as code changes required, took permission from admin to do README update so i can update the situation -:**
insteal of the package name, locally install the zip and use npm commands to: 
- `npm run start -- attack`
- `npm run start -- set-key`
- `npm run start -- attack [path to folder]`

```bash
npm install -g sentinel-ai-cli
```

---

# Setup

Sentinel requires a Google Gemini API key.

Get one from:

https://aistudio.google.com/apikey

Then configure it:

```bash
sentinel config
```

Paste your API key once and Sentinel stores it locally.

---

# Usage

Analyze the current project:

```bash
sentinel attack
```

Analyze a specific folder:

```bash
sentinel attack ./my-project
```

---

# Example Workflow

```text
$ sentinel attack .

✔ Detecting project...

✔ Finding routes...

✔ Scanning secrets...

✔ Reading dependencies...

✔ Building attack surface...

✔ Asking Gemini...

═══════════════════════════════════════════════

🚨 Critical Vulnerability

Authentication Bypass

Severity:
Critical

Affected File:
src/auth/login.ts

Description:
...

Impact:
...

Attack Scenario:
...

Recommended Fix:
...
```

---

# How Sentinel Works

Instead of blindly prompting an LLM with your entire project, Sentinel first builds context.

Pipeline:

```
Project
   │
   ▼
Project Analysis
   │
   ▼
Route Detection
   │
   ▼
Dependency Analysis
   │
   ▼
Secret Detection
   │
   ▼
Attack Surface Generation
   │
   ▼
Gemini Security Audit
   │
   ▼
Human Friendly Report
```

This approach provides significantly better security reports than simply asking an LLM to "find vulnerabilities."

# Tech Stack

* TypeScript
* Node.js
* Gemini API
* ts-morph
* fast-glob
* Chalk

---

# Contributing

Contributions are welcome.

If you'd like to improve Sentinel, feel free to open an issue or submit a pull request.

---

# Development Timeline

## CLI tool for scanning repositories and reporting vulnerabilities

---

### Cyber - 1

**Hack Yourself First - Sentinel**

**Problem:** Developers often discover security issues only after an attack.

**Solution:** A CLI tool that inspects and tests a codebase before attackers do.

---

## Updates

### Prompt Enhancements

https://github.com/Drix10/sentinal/commit/2c9d3e119109bb41b6397b1e7b067724a4e75e4f

* Improved AI system prompt
* Enhanced vulnerability rendering with Chalk

---

### Prompt File Setup & Targeted Attack System

https://github.com/Drix10/sentinal/commit/97504cf1994b06123bbc2bd6b2fd620054e6ed41

* Started writing the attack prompt
* Added project path targeting

---

### LLM Implementation

https://github.com/Drix10/sentinal/commit/0bb5805a51df52cc50f6093e634452ecd645fc99

* Gemini integration
* Config system
* API key management

---

### Fixed "Sentinal" → "Sentinel"

* Corrected project naming
* Cleaned unused files

---

### Secret Detection

https://github.com/Drix10/sentinal/commit/46f833ffc11504c8c007899a6a0e8c8cdaa9ff0f

* Regex-based secret scanner
* Improved CLI animations

---

### Dependency Analysis

https://github.com/Drix10/sentinal/commit/54ce6dcdcd0bb8184f0bbeb8f3f94e7296d5c345

* Parsed dependencies from package.json

---

### Route Detection Engine

https://github.com/Drix10/sentinal/commit/8228a1d2cd3edacca743b8ae85e40eb959d1a6b9

* Implemented fast-glob
* Implemented ts-morph
* Route detection integrated into orchestration

---

### Route Tracing Improvements

https://github.com/Drix10/sentinal/commit/165561fd058406954ad275155fae57260a70866c

* Detect HTTP methods
* Store route paths

---

### Project Tracing System

https://github.com/Drix10/sentinal/commit/cfae39d220527a744486512ae71249ca8906e844

* Detect frameworks
* Docker
* Git
* Languages
* Project technologies

---

### Initial Project Analysis

https://github.com/Drix10/sentinal/commit/d520e91568375a01fbac9baedb6e3829911afc76

* Designed project analysis architecture

---

### CLI Input Validation

https://github.com/Drix10/sentinal/commit/b3c4411a32dff88b20635b28a1fa9bd601b5bd71

* Added path validation
* Support for current directory and custom paths

---

### Base CLI Working

https://github.com/Drix10/sentinal/commit/744990187428ff9d0f9588c645b96b83e8ab9720

* Initial attack command working

---

### CLI Bootstrap

https://github.com/Drix10/sentinal/commit/744990187428ff9d0f9588c645b96b83e8ab9720

* Initial project setup

---

### Project Structure

https://github.com/Drix10/sentinal/commit/1b8f187717026eb24c61154a3aa0b56ffff42cda

* Created project architecture

---

### First Commit

https://github.com/Drix10/sentinal/commit/e25e73a015be53f421eb220fa34410a83c766a53

* Repository initialized

---

## Planning

Excalidraw Design:

https://excalidraw.com/#json=kq_rwMbVvmfWpQSZq_WgP,IRqJiWOEifxpliKZP8KB8g

---

## License

MIT

---

Made with ❤️ to help developers **hack themselves first**.
