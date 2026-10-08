# Eva Production AI Architecture

This design applies the six production principles in AWS's "6 steps to fast-track generative AI from prototype to production" to Aridon while remaining cloud- and model-independent.

## Control flow

User/Objectives -> Eva Orchestrator -> Sentinel Pre-Execution Gate -> Model Router / Specialist Agent -> Aridon Knowledge Core + Tools -> Sentinel Verification -> Approval Engine -> Action Fabric -> Outcome/Evaluation -> Memory

## 1. Model Router
Route by workload instead of one-model-for-everything.

Required routing dimensions:
- task type: reasoning, research, extraction, coding, multimodal, drafting, tool use
- sensitivity and consequence
- latency target
- cost ceiling
- context requirement
- modality
- fallback health

Policy:
- use the least expensive model that satisfies the quality target
- escalate when confidence/evaluation fails
- keep providers replaceable
- log provider/model, latency, token usage, estimated cost and outcome

## 2. Optimization Layer
Implement:
- semantic/prompt caching for safe reusable results
- routing tiers: fast / standard / deep
- context trimming and retrieval before long-context calls
- batching where appropriate
- distillation/specialized small models when workloads justify it
- retry/fallback without duplicate external actions

## 3. Aridon Knowledge Core
Tenant-scoped retrieval over:
- projects and missions
- Knowledge Vault
- files and approved documents
- contacts/organizations
- prior agent outcomes
- decisions
- campus/engineering research
- Business OS, Farm OS, Sentinel and infrastructure data

Every retrieved fact should retain source/provenance and access scope. Retrieval must respect Supabase RLS/tenant boundaries.

## 4. Sentinel AI Control Plane
Sentinel sits before consequential execution and again before final action.

Check:
- prompt injection / malicious trajectory
- data exfiltration
- unauthorized tool or scope
- sensitive information
- unsupported high-consequence factual claims
- irreversible or high-dollar actions
- recipient/domain mismatch
- duplicate/replayed action
- suspicious cross-tenant access

Output: ALLOW, ALLOW_WITH_LIMITS, NEEDS_APPROVAL, BLOCK with machine-readable reasons and audit evidence.

## 5. Security
- least-privilege tool credentials
- secrets only in environment/secret storage
- tenant RLS
- encrypted transport/storage through platform services
- signed webhooks
- idempotency keys for side effects
- immutable action/audit records
- emergency stop
- explicit approval for consequential actions
- never expose provider secrets to the browser

## 6. Agent Runtime
Eva receives an objective and:
1. decomposes it into workstreams
2. assigns specialist agents
3. retrieves relevant tenant knowledge
4. chooses model/tool path
5. runs work in cloud workers
6. compares/criticizes candidate outputs when useful
7. sends consequential actions through Sentinel + Approval Engine
8. executes approved actions through Action Fabric
9. verifies outcome
10. stores result, evidence and lessons

Specialist lanes:
- Capital / Finance
- Partnerships / Outreach
- Sales / Growth
- Research
- Water / AWG
- Energy / Grid
- Agriculture / Farm OS
- Campus / Infrastructure
- Engineering / R&D
- Acquisitions
- Operations
- Sentinel Security

## Production telemetry
Each run should record:
- mission/run/step IDs
- tenant/user
- agent
- model/provider
- routing reason
- retrieval sources
- tools invoked
- Sentinel decision
- approval status
- latency
- cost estimate
- outcome
- evaluation score
- failure/retry metadata

## Approval classes
A0: read/research/analyze
A1: reversible internal updates
A2: ordinary outbound actions under established policy
A3: consequential external commitments, money, contracts, legal/regulated actions, destructive actions

A3 always requires explicit authorized human approval. A2 can be tenant-policy configurable.

## Definition of done
Eva is production-ready when a mission can run from objective to verified outcome with:
- model routing
- tenant-scoped retrieval
- persistent workers/checkpoints
- Sentinel gating
- approval enforcement
- idempotent execution
- evaluation
- auditable cost/latency/outcome telemetry
- provider fallback
- no secret exposure or cross-tenant leakage
