'use client';

import { useEffect, useState } from 'react';

const SENTINEL_SCRIPT = `Create a 30-second Sentinel commercial. Start in a normal company office. A stolen credential gets through. Individual security systems begin showing small warnings, but Sentinel recognizes that they are one coordinated attack. Freeze the attempted data export, preserve the evidence, then show the CEO reviewing the incident before outside escalation. End with: You may not be able to stop every attack from starting. You can change what happens after it starts.`;

function promptBox() {
  return document.querySelector<HTMLTextAreaElement>('textarea[placeholder*="Sentinel ad"]') || document.querySelector<HTMLTextAreaElement>('textarea');
}

function setPromptValue(value: string) {
  const textarea = promptBox();
  if (!textarea) return false;
  const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set;
  setter?.call(textarea, value);
  textarea.dispatchEvent(new Event('input', { bubbles: true }));
  textarea.dispatchEvent(new Event('change', { bubbles: true }));
  textarea.focus();
  textarea.setSelectionRange(value.length, value.length);
  return true;
}

export default function PasteAssist() {
  const [status, setStatus] = useState('');

  useEffect(() => {
    let textarea: HTMLTextAreaElement | null = null;
    let cleanup: (() => void) | null = null;
    let attempts = 0;

    const attach = () => {
      textarea = promptBox();
      if (!textarea) {
        attempts += 1;
        if (attempts < 30) window.setTimeout(attach, 250);
        return;
      }

      const onPaste = (event: ClipboardEvent) => {
        const pasted = event.clipboardData?.getData('text/plain') || '';
        if (!pasted) return;
        event.preventDefault();
        const start = textarea?.selectionStart ?? textarea?.value.length ?? 0;
        const end = textarea?.selectionEnd ?? start;
        const current = textarea?.value || '';
        const next = `${current.slice(0, start)}${pasted}${current.slice(end)}`;
        setPromptValue(next);
        setStatus('Pasted into Video Studio ✓');
      };

      textarea.addEventListener('paste', onPaste);
      cleanup = () => textarea?.removeEventListener('paste', onPaste);
    };

    attach();
    return () => cleanup?.();
  }, []);

  async function pasteClipboard() {
    try {
      if (!navigator.clipboard?.readText) throw new Error('Clipboard access is not available in this browser.');
      const text = await navigator.clipboard.readText();
      if (!text.trim()) throw new Error('Your clipboard is empty.');
      if (!setPromptValue(text)) throw new Error('The Video Studio text box is not ready yet.');
      setStatus('Clipboard pasted ✓');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not read the clipboard. Long-press the box and tap Paste.');
    }
  }

  function loadSentinel() {
    if (setPromptValue(SENTINEL_SCRIPT)) setStatus('Sentinel commercial loaded ✓');
    else setStatus('The Video Studio text box is not ready yet.');
  }

  return (
    <div style={{ position: 'fixed', left: 12, right: 12, bottom: 12, zIndex: 2147482500, display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
      <div style={{ pointerEvents: 'auto', width: 'min(680px, 100%)', background: 'rgba(7,19,15,.97)', color: '#fff', border: '1px solid rgba(158,240,207,.45)', borderRadius: 16, padding: 10, boxShadow: '0 12px 34px rgba(0,0,0,.28)', fontFamily: 'Arial, sans-serif' }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <button onClick={pasteClipboard} style={{ flex: '1 1 180px', border: 0, borderRadius: 10, padding: '11px 13px', fontWeight: 900, background: '#9EF0CF', color: '#10211c', cursor: 'pointer' }}>Paste from clipboard</button>
          <button onClick={loadSentinel} style={{ flex: '1 1 180px', border: '1px solid #5d756b', borderRadius: 10, padding: '11px 13px', fontWeight: 900, background: '#162a22', color: '#fff', cursor: 'pointer' }}>Load Sentinel script</button>
        </div>
        {status && <div style={{ marginTop: 7, fontSize: 12, fontWeight: 800, color: '#d9ece4' }}>{status}</div>}
      </div>
    </div>
  );
}
