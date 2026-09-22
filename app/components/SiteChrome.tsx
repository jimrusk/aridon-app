"use client";

import { usePathname } from "next/navigation";
import InternalLaunchers from "../InternalLaunchers";
import AridonRadarTabs from "./AridonRadarTabs";
import CustomerSessionControls from "./CustomerSessionControls";
import SalesTeamIntentRedirect from "./SalesTeamIntentRedirect";
import PublicInstallPromo from "./PublicInstallPromo";
import ConditionalGlobalLanguageLayer from "./ConditionalGlobalLanguageLayer";

export default function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const standalone = pathname === "/r-beautiful" || pathname.startsWith("/r-beautiful/");

  if (standalone) return <>{children}</>;

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
