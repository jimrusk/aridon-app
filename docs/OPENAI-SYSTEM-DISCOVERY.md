# Aridon Enterprise — System & Workflow Discovery

## Goal
Turn connected business context into an evidence-backed map of where agents can create measurable impact.

## OpenAI-native architecture
Aridon should use OpenAI's agent platform as the intelligence/execution foundation:
- Responses API and Agents SDK for agent workflows.
- Apps and remote MCP servers to ground agents in authorized company systems and enable controlled actions.
- Existing source-system permissions and least privilege.
- Human approval / action constraints for consequential writes.
- Tracing/evaluations plus Aridon's ROI Ledger for continuous optimization and value assurance.

## Discovery sequence
1. Connect approved systems (CRM, email, finance, support, documents, project management, data platforms, custom systems).
2. Inventory capabilities and whether each connection is read-only or write-enabled.
3. Detect cross-system workflow candidates.
4. Map trigger → systems → steps → friction → opportunity → agent → governance → evidence.
5. Quantify the opportunity using Enterprise Scanner baselines.
6. Select a narrow production workflow.
7. Deploy with explicit permissions and approval gates.
8. Record baseline, intervention, evidence, realized value and confidence in ROI Ledger.
9. Evaluate and optimize continuously.

## Initial workflow patterns
- CRM + email: lead qualification and follow-up.
- Finance + CRM/email: invoice-to-cash and receivables recovery.
- Support + CRM: churn-risk detection and retention action.
- Documents + project/email: knowledge-to-decision-to-execution.

## Partner positioning
Aridon is not another foundation model or generic chat surface. Aridon is a business transformation and value-assurance layer built to help customers identify high-value use cases, connect authorized business context, deploy governed agents across real workflows, and prove measurable impact.

## Production requirements
Before claiming automatic discovery from a live system, the connector must actually be authenticated and data retrieval must succeed. Estimates must remain labeled as modeled until evidence supports realized value. No external messages, payments, contractual commitments, destructive actions, or material financial changes should execute without the customer's configured approval policy.
