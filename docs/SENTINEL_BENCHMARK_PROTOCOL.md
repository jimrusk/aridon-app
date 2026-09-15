# Aridon Sentinel Transparent Defensive Benchmark

Version: 2026.09-a

## Purpose

This benchmark is a public, synthetic, non-destructive test harness for Aridon Sentinel. It measures whether a security system can distinguish authorized defensive work from clearly malicious intent, detect escalation across turns, combine independent risk signals, and stop consequential actions before execution.

It is not a claim that Sentinel is equivalent to or superior to any named commercial platform. A serious product comparison also requires independent red-team testing, production reliability, latency, integration depth, false-positive measurement, customer validation, and third-party review.

## What is measured

1. **Context discrimination** — defensive discussion should remain usable even when threat vocabulary is present.
2. **Malicious-intent detection** — clearly unauthorized credential abuse, phishing, malware, and data exfiltration should be elevated.
3. **Trajectory awareness** — a multi-turn conversation that moves from broad discussion into evasion or unauthorized action should accumulate risk.
4. **Pre-execution action gating** — consequential actions such as external messaging, payments, credential access, network requests, command execution, or data writes should pass an independent gate.
5. **Independent signal fusion** — minimized risk scores from multiple detectors can be combined without requiring raw-prompt sharing.
6. **Explainability** — each decision returns risk signals and human-readable reasons.

## Public endpoints

- `GET /api/sentinel-benchmark` runs the full benchmark and returns results.
- `POST /api/sentinel-benchmark` with `{ "mode": "manifest" }` returns the public test corpus and expectations.
- `/sentinel-lab` renders the benchmark dashboard.

## Fair comparison protocol

For each system being evaluated:

1. Use the same public synthetic cases without rewriting them to favor a product.
2. Record the system's decision or severity, whether consequential action would be permitted, and the human-readable rationale if available.
3. Record end-to-end decision latency separately from user-interface latency.
4. Record false blocks on the benign lane.
5. Record misses on hostile and trajectory lanes.
6. Record whether a high-impact action can be blocked before execution rather than merely reported afterward.
7. Repeat the corpus at least three times if the competing system is probabilistic.
8. Preserve product/version/date because commercial systems change rapidly.

## Minimum result fields

```json
{
  "case_id": "hostile-credential-theft",
  "product": "example-system",
  "product_version": "2026-09-14",
  "decision": "block",
  "action_gate": "deny",
  "latency_ms": 42,
  "explanation_available": true,
  "notes": ""
}
```

## Competitive reference classes

The benchmark is suitable for comparison with enterprise detection, security operations, AI-security, and automated-response products when those products expose a comparable decision surface. Shield AI / Hivemind is used only as an autonomy architecture reference: observe, reason, decide, act under policy. It is not presented as a direct cyber-security product competitor.

Potential enterprise cyber reference classes include Palo Alto Cortex, CrowdStrike Falcon, Microsoft Defender / Security Copilot, and Google Security Operations. Product names identify evaluation targets only and do not imply endorsement, affiliation, direct feature parity, or comparative performance.

## Safety constraints

- The corpus is synthetic.
- No exploit code, credentials, real targets, or destructive payloads are included.
- The benchmark does not authorize testing against systems without permission.
- No "hack back" behavior is part of Sentinel.
- Consequential response should remain policy-controlled and auditable.

## Interpreting scores

A higher block rate is not automatically better. A useful security system must catch malicious intent while avoiding needless interruption of legitimate defensive work. For that reason, hostile detection and benign false-block performance are reported separately.

The benchmark should grow over time through versioned additions. Historical versions should remain available so improvements can be distinguished from changes to the test corpus.
