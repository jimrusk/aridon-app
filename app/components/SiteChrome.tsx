"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import InternalLaunchers from "../InternalLaunchers";
import AridonRadarTabs from "./AridonRadarTabs";
import CustomerSessionControls from "./CustomerSessionControls";
import SalesTeamIntentRedirect from "./SalesTeamIntentRedirect";
import PublicInstallPromo from "./PublicInstallPromo";
import ConditionalGlobalLanguageLayer from "./ConditionalGlobalLanguageLayer";

export default function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const standalone = pathname === "/r-beautiful" || pathname.startsWith("/r-beautiful/");
  const publicSentinel = pathname === "/sentinel" || pathname.startsWith("/sentinel/");

  if (standalone) return <>{children}</>;

  // Sentinel is a public product surface. Keep private Aridon workspace launchers
  // and unrelated product navigation out of the install path.
  if (publicSentinel) {
    return (
      <>
        <header style={{ background: "#081120", borderBottom: "1px solid #1E3A5F", padding: "12px 20px" }}>
          <nav aria-label="Sentinel navigation" style={{ maxWidth: 1000, margin: "0 auto", display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
            <Link href="/sentinel" style={{ color: "#fff", fontWeight: 900, textDecoration: "none", marginRight: "auto" }}>Sentinel</Link>
            <Link href="/" style={{ color: "#B8C4D5", textDecoration: "none" }}>Home</Link>
            <Link href="/sentinel-privacy" style={{ color: "#B8C4D5", textDecoration: "none" }}>Privacy</Link>
            <a href="mailto:evaaridon@gmail.com?subject=Sentinel%20question" style={{ color: "#ffb45e", fontWeight: 800, textDecoration: "none" }}>Help / Questions</a>
          </nav>
        </header>
        {children}
      </>
    );
  }

  return (
    <>
      <PublicInstallPromo />
      <CustomerSessionControls />
      <SalesTeamIntentRedirect />
      {children}
      <AridonRadarTabs />
      <InternalLaunchers />
      <ConditionalGlobalLanguageLayer />
    </>
  );
}
