import { SchemaType, type ResponseSchema } from "@google/generative-ai";
import type { Finding } from "../findings/findingStore";
import { buildSecurityContext } from "./contextBuilder";

// ==========================================
// GEMINI STRUCTURED OUTPUT SCHEMAS
// ==========================================

export const securityReportSchema: ResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    securityScore: { type: SchemaType.NUMBER },
    executiveSummary: { type: SchemaType.STRING },
    attackSurface: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
    },
    findings: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          severity: { type: SchemaType.STRING },
          title: { type: SchemaType.STRING },
          evidence: { type: SchemaType.STRING },
          whyDangerous: { type: SchemaType.STRING },
          attackScenario: { type: SchemaType.STRING },
          recommendation: { type: SchemaType.STRING },
          owaspCategory: { type: SchemaType.STRING },
          cweId: { type: SchemaType.STRING },
          confidence: { type: SchemaType.NUMBER },
        },
        required: [
          "severity",
          "title",
          "whyDangerous",
          "attackScenario",
          "recommendation",
          "owaspCategory",
        ],
      },
    },
    strengths: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
    },
    recommendations: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
    },
  },
  required: [
    "securityScore",
    "executiveSummary",
    "attackSurface",
    "findings",
    "strengths",
    "recommendations",
  ],
};

export const explainFindingSchema: ResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    summary: { type: SchemaType.STRING },
    rootCause: { type: SchemaType.STRING },
    exploitMechanism: { type: SchemaType.STRING },
    impactAnalysis: { type: SchemaType.STRING },
    owaspDetails: { type: SchemaType.STRING },
    cweDetails: { type: SchemaType.STRING },
    stepByStepRemediation: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
    },
  },
  required: [
    "summary",
    "rootCause",
    "exploitMechanism",
    "impactAnalysis",
    "owaspDetails",
    "stepByStepRemediation",
  ],
};

export const fixPatchSchema: ResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    patchTitle: { type: SchemaType.STRING },
    rootCause: { type: SchemaType.STRING },
    originalCodeSnippet: { type: SchemaType.STRING },
    fixedCodeSnippet: { type: SchemaType.STRING },
    diffSummary: { type: SchemaType.STRING },
    securityAssurance: { type: SchemaType.STRING },
  },
  required: [
    "patchTitle",
    "rootCause",
    "originalCodeSnippet",
    "fixedCodeSnippet",
    "diffSummary",
    "securityAssurance",
  ],
};

// ==========================================
// SYSTEM PROMPTS (OFFENSIVE & DEFENSIVE APPSEC)
// ==========================================

export function buildSecurityPrompt(analysis: any): string {
  const context = buildSecurityContext(analysis);

  return `
You are Sentinel AI, acting as a Principal Application Security Engineer, Lead Offensive Security Architect, and Principal Penetration Tester.

Your assessment criteria are grounded in industry-standard security frameworks:
• OWASP Top 10 (2021) & OWASP API Security Top 10 (2023)
• OWASP Application Security Verification Standard (ASVS 4.0) Level 2 & 3
• PTES (Penetration Testing Execution Standard)
• STRIDE Threat Modeling & MITRE ATT&CK Software Mapping
• SANS Top 25 Most Dangerous Software Errors

STRICT ANALYSIS RULES & ANTI-HALLUCINATION CONSTRAINTS:
1. FACT-BASED REASONING ONLY:
   The security context payload below contains ranked facts, AST topology, HTTP endpoints, dependencies, secrets, and Attack Graph exploit paths derived by Sentinel's deterministic engines.
   - NEVER invent or hallucinate unmentioned files, functions, routes, packages, or secrets.
   - If evidence is insufficient for a finding, omit it or state explicit evidence bounds.

2. MULTI-HOP ATTACK CHAIN SYNTHESIS:
   - Think like an advanced adversary during PTES Threat Modeling.
   - Correlate entrypoint routes with missing auth middleware, tainted inputs, database queries, and exposed secrets to synthesize realistic exploit paths.
   - Assess blast radiuses and systemic risk across trust boundaries.

3. RISK SCORING METHODOLOGY:
   - Calculate 'securityScore' (0 to 100) using a risk-density formula:
     - Base score: 100.
     - Deduct 25 points for each CRITICAL exploit chain or unauthenticated secret access.
     - Deduct 15 points for each HIGH severity vulnerability or exposed credential.
     - Deduct 8 points for each MEDIUM risk misconfiguration or outdated dependency.
     - Deduct 3 points for LOW risk findings.
     - Minimum score is 0.

4. SEVERITY CLASSIFICATION:
   - CRITICAL: Direct Remote Code Execution (RCE), unauthenticated secret leak, SQL injection in public routes, pre-auth admin compromise.
   - HIGH: Hardcoded API keys/private keys, broken object-level authorization (BOLA), unauthenticated data modification.
   - MEDIUM: Missing rate limiting, insecure CORS, vulnerable dependencies with known CVEs, unhandled exceptions revealing stack traces.
   - LOW / INFO: Informational hygiene, minor version deprecation, missing security headers.

5. OUTPUT REQUIREMENTS:
   - Your output MUST strictly follow the JSON schema provided to Gemini.
   - Write professional, technical, CISO-grade prose for the executive summary and findings.

${context.formattedContextPrompt}
`;
}

export function buildExplainPrompt(
  finding: Finding,
  fileContent: string,
  deepContextText?: string,
): string {
  return `
You are Sentinel AI Explainer, acting as a Senior Vulnerability Researcher and OWASP Specialist.

Your task is to perform an in-depth, forensic security analysis of a specific finding discovered in the target repository.

VULNERABILITY METADATA & CONTEXT:
• Finding ID:          ${finding.id}
• Rule Identifier:     ${finding.ruleId}
• Title:               ${finding.title}
• Severity:            ${finding.severity}
• OWASP Category:      ${finding.owaspCategory}
• CWE Identification:  ${finding.cweId ?? "CWE-Unknown"}
• Target Location:      ${finding.evidence.file}:${finding.evidence.line}
• Finding Summary:     ${finding.description}
• Core Guidance:       ${finding.recommendation}

${deepContextText ? `DEEP REPOSITORY & MULTI-FILE CODEBASE CONTEXT:\n${deepContextText}\n` : ""}

TARGET SOURCE CODE CONTEXT:
\`\`\`ts
${fileContent}
\`\`\`

ANALYTICAL INSTRUCTIONS:
1. SUMMARY: Provide a clear, authoritative 2-3 sentence overview of the vulnerability, explaining why it poses a threat to the application.
2. ROOT CAUSE: Analyze the specific lines of code in the provided source file. Explain the underlying flaw (e.g. missing input sanitization, insecure direct object reference, unencrypted secret storage, missing authentication middleware).
3. EXPLOIT MECHANISM: Step-by-step technical breakdown of how a malicious actor exploits this vulnerability. Describe the payload structure, HTTP request manipulation, or attack vector.
4. IMPACT ANALYSIS: Detailed evaluation of the Confidentiality, Integrity, and Availability (CIA triad) impact. Detail potential data exposure, privilege escalation, or compliance impact (GDPR, PCI-DSS, SOC 2).
5. OWASP DETAILS: Explain the specific OWASP Top 10 or API Top 10 requirement violated and why adhering to this standard is critical for secure architecture.
6. CWE DETAILS: Explain the Common Weakness Enumeration entry, its structural classification, and historical prevalence.
7. STEP-BY-STEP REMEDIATION: Provide a numbered, highly specific developer guide detailing exactly how to remediate the code, implement defensive validation, and add regression unit tests.

Return a JSON object conforming strictly to the required schema.
`;
}

export function buildFixPrompt(
  finding: Finding,
  fileContent: string,
  deepContextText?: string,
  errorFeedback?: string,
): string {
  return `
You are Sentinel AI Autonomous Patch Generator, acting as a Lead Secure Software Architect.

Your goal is to engineer a production-grade, minimal, robust, drop-in secure code patch that remediates the vulnerability without introducing regressions, syntax errors, or side-effects.

TARGET VULNERABILITY DETAILS:
• Finding ID:       ${finding.id}
• Title:            ${finding.title}
• OWASP Category:   ${finding.owaspCategory}
• Target File:      ${finding.evidence.file}
• Vulnerable Line:  ${finding.evidence.line}
• Issue Summary:    ${finding.description}
• Security Target:  ${finding.recommendation}

${deepContextText ? `DEEP REPOSITORY & MULTI-FILE CODEBASE CONTEXT:\n${deepContextText}\n` : ""}
${
  errorFeedback
    ? `⚠️ PREVIOUS PATCH VERIFICATION ATTEMPT FAILED WITH THE FOLLOWING COMPILER / TEST ERROR:
${errorFeedback}
You MUST fix your patch so that it compiles cleanly and passes tests without this error!
`
    : ""
}

COMPLETE SOURCE CODE FILE:
\`\`\`ts
${fileContent}
\`\`\`

PATCH GENERATION REQUIREMENTS:
1. PATCH TITLE: Concise, descriptive title for the security pull request / patch.
2. ROOT CAUSE SUMMARY: Brief explanation of what code change was necessary to secure the file.
3. ORIGINAL CODE SNIPPET: Extract the EXACT original vulnerable lines of code from the source file. Ensure exact indentation and character matching.
4. FIXED CODE SNIPPET: Write the drop-in secure code replacement incorporating defensive coding best practices (e.g. parameterized queries, input validation, secure environment variable loading, authentication guards, or safe crypto operations). Do NOT add uninstalled third-party package imports.
5. DIFF SUMMARY: Concise line-by-line breakdown of additions, deletions, and modifications.
6. SECURITY ASSURANCE: Technical proof explaining why this patch mitigates the vulnerability and verifies zero functional regression.

Return a JSON object conforming strictly to the required schema.
`;
}