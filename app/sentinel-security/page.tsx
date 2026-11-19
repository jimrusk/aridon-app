import { permanentRedirect } from 'next/navigation';

// Retired (SEO audit Fix 5): this page carried the retired breach-detection /
// incident-response framing, and it was the only Sentinel page Google had
// indexed. The Sentinel story now lives at /sentinel, the action-control
// platform hub. Permanent redirect so the indexed URL resolves to the hub.
export default function SentinelSecurityPage() {
  permanentRedirect('/sentinel');
}
