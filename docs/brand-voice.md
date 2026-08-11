# Veklom Brand Voice Pack

This document outlines the canonical brand voice, tone calibration, forbidden claims, terminology, and copy examples for the Veklom project.

## 1. Four Voice Principles

1. **Precise over Promotional**
   * **DO:** State exact capabilities, supported protocols, and measurable outcomes.
   * **DON'T:** Use hyperbole, vague marketing jargon, or unquantifiable claims.

2. **Sovereign over Servile**
   * **DO:** Position Veklom as an authoritative, governed runtime for AI agents.
   * **DON'T:** Present the system as a subservient chatbot or mere assistant.

3. **Evidence over Assertion**
   * **DO:** Provide verifiable proof and cryptographically signed governance evidence.
   * **DON'T:** Make trust-based claims without backing them up with data or cryptographic proof.

4. **Open Standard over Proprietary Stack**
   * **DO:** Emphasize interoperability, standard protocols (MCP, x402, PGL), and ecosystem integration.
   * **DON'T:** Frame Veklom as a walled garden or proprietary lock-in solution.

## 2. Tone Calibration Table

| Context | Tone Calibration |
| :--- | :--- |
| **Machine discovery surface** (agent.json, llms.txt, mcp.json) | Highly structured, unambiguous, machine-readable. Focus on schemas, endpoints, and exact capabilities. |
| **Technical docs** | Clear, prescriptive, instructional. Emphasize architecture, configuration, and verifiable behavior. |
| **API error messages** | Direct, actionable, precise. State what failed, why, and how to resolve it or where to find evidence. |
| **Marketing landing pages** | Authoritative, compelling, evidence-backed. Focus on governance, monetization, and interoperability. |
| **Security incident communications** | Transparent, factual, calm. Detail the timeline, impact, and verifiable mitigation steps. |
| **Standards / specification documents** | Rigorous, formal, definitive. Define protocols, data structures, and cryptographic requirements clearly. |

## 3. Forbidden Claims

* **DO NOT** claim "Satisfies [regulation]" (e.g., EU AI Act / HIPAA / OSFI) without verified validation mapping. Veklom is DESIGNED TO SUPPORT controls/evidence relevant to regulatory frameworks, but jurisdiction-specific legal claims require external validation across deployments.
* **DO NOT** use the term "Signed legal artifact". Instead, say **"cryptographically signed governance evidence"**.
* **DO NOT** use "Immutable" for hash-chained storage without external finality. Say "tamper-evident hash-chained storage".
* **DO NOT** claim "Compliant with EU AI Act / HIPAA" without verified mapping.
* **DO NOT** make any price/volume claims without citation. For example, use real Coinbase April 2026 data: *165M+ x402 transactions, $50M+ volume, 480K+ transacting agents*.

## 4. Official Terminology Guide

* **CAPPO** (not 'cAPI Engine' or 'Cappo')
* **GnomLedger / PGL** (GnomLedger is the product, PGL is the specification)
* **Execution Identity / EI** (not 'session token' or 'execution token')
* **Governance Evidence / Evidence Envelope** (not 'receipt' alone — use 'governance receipt' or 'PGL evidence envelope')
* **Commercial Admission vs Governance Admission** (these are separate concepts and must be distinguished)
* **LAW 0** (not 'law zero' — always caps)

## 5. Copy Examples by Surface

| Surface | Before (Incorrect) | After (Correct) |
| :--- | :--- | :--- |
| **Landing Page** | "Veklom is fully compliant with the EU AI Act and HIPAA." | "Veklom is designed to support controls and evidence relevant to regulatory frameworks like the EU AI Act and HIPAA, subject to deployment-specific validation." |
| **API Docs** | "The API returns a receipt for your agent's action." | "The API returns cryptographically signed governance evidence for the Execution Identity." |
| **Agent Payload** | "Session token: 12345" | "Execution Identity (EI): 12345" |
| **Marketing Copy** | "Cappo handles all your API needs." | "CAPPO enforces nine-phase governance on every action." |
| **Security Log** | "Saved an immutable record." | "Anchored a tamper-evident record via GnomLedger." |
