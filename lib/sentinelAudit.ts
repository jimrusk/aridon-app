// Aridon Sentinel — tamper-evident append-only audit log.
//
// Every consequential Sentinel decision (allow / restrict / review / block),
// human approval, override, policy change, and incident event lands here as a
// hash-chained entry. Each entry commits to the previous entry's hash, so any
// insertion, deletion, or edit anywhere in the history breaks the chain and
// verify() catches it. That's what auditors want to see (SOC 2, ISO 27001,
// IRAP): decision records nobody can quietly rewrite after the fact.
//
// Server-side only: imports node:crypto. Do not import from client components.

import { createHash } from 'node:crypto';

export type SentinelAuditEventType =
  | 'decision'
  | 'approval'
  | 'override'
  | 'policy_change'
  | 'incident'
  | 'pentest_run'
  | 'chain_verification';

export type SentinelAuditEntry = {
  seq: number;
  ts: string; // ISO-8601 timestamp
  tenantId: string;
  actor: string; // user, agent, or harness identity that caused the event
  eventType: SentinelAuditEventType;
  summary: string;
  details: Record<string, unknown>;
  prevHash: string;
  hash: string;
};

export type SentinelAuditAppendInput = {
  tenantId: string;
  actor: string;
  eventType: SentinelAuditEventType;
  summary: string;
  details?: Record<string, unknown>;
};

export const SENTINEL_AUDIT_GENESIS_HASH = '0'.repeat(64);

type HashableEntry = Omit<SentinelAuditEntry, 'hash'>;

function canonicalJson(entry: HashableEntry): string {
  // Fixed key order so the hash is deterministic.
  return JSON.stringify({
    seq: entry.seq,
    ts: entry.ts,
    tenantId: entry.tenantId,
    actor: entry.actor,
    eventType: entry.eventType,
    summary: entry.summary,
    details: entry.details,
    prevHash: entry.prevHash,
  });
}

export function hashAuditEntry(entry: HashableEntry): string {
  return createHash('sha256').update(canonicalJson(entry), 'utf8').digest('hex');
}

export type AuditVerification = {
  ok: boolean;
  checked: number;
  brokenAtSeq?: number;
  reason?: string;
  tipHash?: string;
};

export class SentinelAuditLog {
  private entries: SentinelAuditEntry[] = [];

  get size(): number {
    return this.entries.length;
  }

  append(input: SentinelAuditAppendInput): SentinelAuditEntry {
    const prev = this.entries.length > 0 ? this.entries[this.entries.length - 1] : null;
    const base: HashableEntry = {
      seq: this.entries.length + 1,
      ts: new Date().toISOString(),
      tenantId: input.tenantId,
      actor: input.actor,
      eventType: input.eventType,
      summary: input.summary,
      details: input.details ?? {},
      prevHash: prev ? prev.hash : SENTINEL_AUDIT_GENESIS_HASH,
    };
    const entry: SentinelAuditEntry = { ...base, hash: hashAuditEntry(base) };
    this.entries.push(entry);
    return entry;
  }

  /** Recompute every link in the chain. Any tampering breaks verification. */
  verify(): AuditVerification {
    let prevHash = SENTINEL_AUDIT_GENESIS_HASH;
    for (const entry of this.entries) {
      if (entry.prevHash !== prevHash) {
        return {
          ok: false,
          checked: this.entries.length,
          brokenAtSeq: entry.seq,
          reason: `prevHash mismatch at seq ${entry.seq}: chain link broken`,
        };
      }
      const { hash: _ignored, ...rest } = entry;
      void _ignored;
      const recomputed = hashAuditEntry(rest as HashableEntry);
      if (recomputed !== entry.hash) {
        return {
          ok: false,
          checked: this.entries.length,
          brokenAtSeq: entry.seq,
          reason: `hash mismatch at seq ${entry.seq}: entry content was altered`,
        };
      }
      prevHash = entry.hash;
    }
    return {
      ok: true,
      checked: this.entries.length,
      tipHash: this.entries.length > 0 ? this.entries[this.entries.length - 1].hash : SENTINEL_AUDIT_GENESIS_HASH,
    };
  }

  /** Record a verification pass itself, so audits of the audit trail are visible. */
  recordVerification(tenantId: string, actor: string): { entry: SentinelAuditEntry; verification: AuditVerification } {
    const verification = this.verify();
    const entry = this.append({
      tenantId,
      actor,
      eventType: 'chain_verification',
      summary: verification.ok
        ? `Audit chain verified: ${verification.checked} entries intact`
        : `Audit chain verification FAILED at seq ${verification.brokenAtSeq}`,
      details: { verification },
    });
    return { entry, verification };
  }

  list(): readonly SentinelAuditEntry[] {
    return this.entries;
  }

  exportJson(): string {
    return JSON.stringify({ exportedAt: new Date().toISOString(), entries: this.entries }, null, 2);
  }
}

/** Process-local default log. For durable deployments, persist entries to the
 *  sentinel_audit_log table (see supabase migration) and re-verify on read. */
export const sentinelAuditLog = new SentinelAuditLog();
