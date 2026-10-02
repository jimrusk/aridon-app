// Sentinel phone runner — Termux on Android (no root).
//
// What it does: watches this phone's network connections (wifi/cellular),
// flags unknown external senders, and writes every flag into Sentinel's
// tamper-evident audit log. Phone notifications fire when the Termux:API
// app is installed; otherwise flags print to the console and the log file.
//
// Honest limits on stock (non-rooted) Android:
// - MONITOR ONLY. Blocking connections needs root, which this phone doesn't
//   have. Sentinel watches and alerts; it does not stop traffic here.
// - The firewall stop-until-approved enforcement runs on your computers and
//   servers (Linux + root), not on the phone.

import { NetMonitor, SentinelAuditLog } from '@aridon/sentinel';
import { execFile } from 'node:child_process';
import { appendFile } from 'node:fs/promises';

const LOG = new URL('./sentinel-phone.log', import.meta.url).pathname;
const audit = new SentinelAuditLog({ tenantId: 'jim-phone' });

function notify(title, body) {
  return new Promise((resolve) => {
    execFile(
      'termux-notification',
      ['--title', title, '--content', String(body).slice(0, 400)],
      (err) => {
        if (err) console.log(`[no Termux:API] ${title}: ${String(body).slice(0, 140)}`);
        resolve();
      },
    );
  });
}

async function log(line) {
  const entry = `${new Date().toISOString()} ${line}\n`;
  process.stdout.write(entry);
  try {
    await appendFile(LOG, entry);
  } catch {
    // Logging must never kill the monitor.
  }
}

const mon = new NetMonitor({
  tenantId: 'jim-phone',
  pollMs: 5000,
  enforce: false, // no root on stock Android: watch and alert, don't block
  popup: false,
  auditLog: audit,
  onSuspicious: async (flow) => {
    const dest = `${flow.remoteHost ?? flow.remoteAddr}:${flow.remotePort}`;
    const msg = `${flow.proto.toUpperCase()} -> ${dest} (${flow.reason})`;
    await log(`SUSPICIOUS ${msg}`);
    await notify('Sentinel: suspicious connection', msg);
  },
});

mon.start();
await log('Sentinel phone monitor running (monitor mode — no root, no blocking). Ctrl-C to stop.');

// Heartbeat: per-minute wifi byte counters, so you can see what's moving.
setInterval(async () => {
  try {
    const ifaces = await mon.interfaceStats();
    const wlan = ifaces.find((i) => i.iface === 'wlan0') ?? ifaces[0];
    if (wlan) await log(`traffic ${wlan.iface}: rx=${wlan.rxBytes} tx=${wlan.txBytes}`);
  } catch {
    // Heartbeat failure must never kill the monitor.
  }
}, 60000);
