# Sentinel Codebase

## CLI tool for scanning repositories and reporting vulnerabilities

---

Cyber - 1

Hack Yourself First - Sentinel

Problem: Devs find issues after attacks
Fix: CLI tool which inspects and tests codebase

---

Updates:
[Prompt file setup and targeted attack system](https://github.com/Drix10/sentinal/commit/97504cf1994b06123bbc2bd6b2fd620054e6ed41)
- Started writing the prompt to power this system and added target folder path analysis fixes

[LLM implementation](https://github.com/Drix10/sentinal/commit/0bb5805a51df52cc50f6093e634452ecd645fc99)
- Implemented Config System, Command to set Gemini API key, Implemented the base LLM setup with Gemini flash 3.5

[Fix spelling Sentinal -> Sentinel]()
- Fixed Spelling mistake, Started working on Gemini Key input system & removed unused files

[Used different Regex codes to find secrets outside the env in the codebase and implemented it](https://github.com/Drix10/sentinal/commit/46f833ffc11504c8c007899a6a0e8c8cdaa9ff0f)
- Added Delays for better UI UX in the console and did the Secret finding system

[Finished dependency finding system and integrated it](https://github.com/Drix10/sentinal/commit/54ce6dcdcd0bb8184f0bbeb8f3f94e7296d5c345)
- Parse Package.json for all dev and normal dependencies

[Finished Routing system and implemented in Orchestation service](https://github.com/Drix10/sentinal/commit/8228a1d2cd3edacca743b8ae85e40eb959d1a6b9)
- Used fast-glob and ts-morph to go through codebases to find routes in codebase & implemented the system in our orchestrator

[Readme update + Route tracing system of codebase ongoing](https://github.com/Drix10/sentinal/commit/165561fd058406954ad275155fae57260a70866c)
- Find routes, their file path and method (GET, POST etc)

[Project Tracing system ready - Routes detection system ongoing](https://github.com/Drix10/sentinal/commit/cfae39d220527a744486512ae71249ca8906e844) 
- Explore the codebase to know what frameworks, language, docker files, git env etc get used

[project analysis system - incomplete](https://github.com/Drix10/sentinal/commit/d520e91568375a01fbac9baedb6e3829911afc76)
- Decide a type structure for the project analysis system

[Input validation and Project path asign](https://github.com/Drix10/sentinal/commit/b3c4411a32dff88b20635b28a1fa9bd601b5bd71)
- Added input validation to the attack command ".", or none or specific path

[Base CLI working now - Tested](https://github.com/Drix10/sentinal/commit/744990187428ff9d0f9588c645b96b83e8ab9720)
- Base CLI started working, attack command printed console.log messages

[Base setup of CLI agent (untested)](https://github.com/Drix10/sentinal/commit/744990187428ff9d0f9588c645b96b83e8ab9720)
- Base index.ts, package.json etc setup

[Project Structure Initialized](https://github.com/Drix10/sentinal/commit/1b8f187717026eb24c61154a3aa0b56ffff42cda)
- Made the project folder and file structure , commited empty files

[first commit](https://github.com/Drix10/sentinal/commit/e25e73a015be53f421eb220fa34410a83c766a53)
- Initialized repository

PLanning:
https://excalidraw.com/#json=kq_rwMbVvmfWpQSZq_WgP,IRqJiWOEifxpliKZP8KB8g

