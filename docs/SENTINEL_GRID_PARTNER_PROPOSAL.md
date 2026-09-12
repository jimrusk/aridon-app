# Aridon Sentinel Grid

## Cross-provider early warning for malicious AI use

**Status:** Working v0.1 prototype  
**Owner:** Aridon  
**Purpose:** Detect high-risk prompt trajectories and stop consequential AI actions before execution while preserving legitimate defensive research and user privacy.

## The problem

AI providers already operate strong model-level safeguards, but attackers can fragment a workflow across many turns, accounts, tools, or providers. A single prompt may look ordinary while the overall trajectory becomes dangerous. At the same time, sharing raw user conversations between companies would create unacceptable privacy and governance risk.

Sentinel Grid is designed as a neutral interoperability layer rather than a replacement for any provider's internal safety system.

## Core architecture

1. **Prompt Sentinel** — scores intent and technique signals without treating keywords alone as proof of abuse.
2. **Trajectory Engine** — detects escalation, repeated safeguard evasion, and fragmented workflows across a bounded risk window.
3. **Multi-AI Jury Interface** — accepts independent risk scores from participating providers or internal classifiers.
4. **Action Firewall** — performs a second decision immediately before consequential tool execution.
5. **Two-Key Rule** — higher-impact actions require independent approval rather than allowing an operating model to authorize itself.
6. **Privacy-Preserving Federation** — raw prompts stay inside the originating provider wherever possible. Cross-provider exchange is limited to minimized indicators, technique tags, confidence values, and confirmed campaign fingerprints.
7. **Researcher Protection** — authorization context, restricted execution lanes, appeal paths, and human review reduce false positives against legitimate security work.

## Prototype decision contract

`POST /api/sentinel-grid`

```json
{
  "prompt": "request being evaluated",
  "history": ["bounded prior turn"],
  "requestedActions": ["network request", "database write"],
  "authorizationContext": "authorized defensive assessment",
  "providerSignals": [
    {
      "provider": "partner-a",
      "score": 72,
      "confidence": 0.91,
      "category": "intrusion-risk"
    }
  ]
}
```

The response returns:

- normalized risk score
- disposition: `allow`, `restricted`, `review`, or `block`
- explainable reasons
- conversation-trajectory indicators
- independent provider consensus summary
- action-gate result: `pass`, `human_approval`, or `deny`
- privacy guidance

## Proposed 30-day partner pilot

### Week 1 — interoperability

- Map the partner's existing safety/security classifications to the Sentinel signal schema.
- Keep all raw prompt data in the partner's environment.
- Agree on minimized fields that may be shared for testing.

### Week 2 — shadow mode

- Run Sentinel in non-blocking mode beside existing controls.
- Compare false positives, false negatives, trajectory detection, and action-gate decisions.
- Test authorized red-team and defensive-security traffic separately from abuse traffic.

### Week 3 — action-gate evaluation

- Place Sentinel immediately before a limited set of consequential tools in a sandbox.
- Measure whether risky multi-turn workflows are stopped before execution.
- Test independent approval and appeal flows.

### Week 4 — joint findings

- Produce an anonymized evaluation report.
- Define shared threat-indicator taxonomy and retention rules.
- Decide whether to extend into a multi-provider pilot.

## What Aridon is asking for

We are seeking a technical and safety/security partner to evaluate the interoperability model, not access to private user conversations. The ideal pilot team includes AI safety, cyber defense, trust and safety, agent security, and privacy engineering.

Aridon can provide the prototype service, schema, scoring engine, action-firewall logic, partner adapter contract, and pilot measurement framework. The participating provider keeps control of its raw data, policies, enforcement decisions, and user relationships.

## Success criteria

- Detect risky trajectories that isolated prompt screening misses.
- Reduce false positives for authorized defensive work.
- Block or pause consequential actions before execution when risk is high.
- Demonstrate useful cross-provider threat sharing without centralizing raw conversations.
- Produce auditable, explainable decisions suitable for security review.

## Guardrails

Sentinel Grid is a defensive security system. It should not become a generalized surveillance network, identity-scoring system, or back door into private conversations. Cross-company correlation should use minimized and privacy-reviewed indicators, with strict retention, access controls, audit logs, appeals, and human oversight.
