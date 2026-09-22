import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "R Beautiful Landscaping Inc.",
  description: "Lawn mowing, edging, leaf and debris removal, light trimming, and seasonal yard cleanup.",
  applicationName: "R Beautiful Landscaping Inc.",
  themeColor: "#174c31",
  manifest: null,
  icons: {},
};

export default function RBeautifulLayout({ children }: { children: React.ReactNode }) {
  return children;
}
