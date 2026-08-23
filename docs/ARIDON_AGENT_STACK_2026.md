# Aridon Agent Stack — August 2026

This release turns several existing Aridon capabilities into one explicit operating layer.

## Added in this release

- Automatic best-model routing across OpenAI, Claude, Gemini, Grok, DeepSeek and an optional local OpenAI-compatible endpoint.
- Task classification for live research, social intelligence, coding, multilingual work, long-context work, creative/presentation work, private-local work and general executive work.
- Provider fallback with latency and attempt tracking.
- Aridon Agent Supervisor: bounded plan, specialist delegation, independent quality judging, one retry for weak work, final synthesis and approval queue.
- Semantic Company Brain retrieval using pgvector embeddings with text-search fallback.
- Presentation Studio capable of producing PPTX or PDF presentation files from a title, purpose, audience and source material.
- Optional Slack and Telegram interface routes that can hand work into the Aridon stack when their server-side credentials are configured.
- Facebook Page Launch Center with Aridon page identity, copy-ready bio/About copy, launch posts, 30-day content themes, group-distribution guidance and the Aridon revenue funnel.
- Model Router control page and Agent Supervisor control room.

## Existing Aridon architecture reused rather than duplicated

The production database already included customer executive memories/reflections, action queues, approval policies, connectors, audit events, usage events and enterprise rate limits. This release builds on those controls instead of creating parallel systems.

## Approval boundary

Research, analysis, drafting, retrieval, planning and presentation generation may run without an external-action approval. Sending messages, publishing externally, spending money, signing, deleting, changing external systems or other consequential actions remain approval-gated.

## Facebook / Meta limitation

The Aridon Facebook Page package is ready inside the app, but the actual Facebook Page must still be created and published through a Meta account until a Meta/Facebook connector is available. Meta monetization is never guaranteed and depends on Meta eligibility and current platform policies.
