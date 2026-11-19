import type { Metadata } from 'next';
import SentinelDemoClient from './SentinelDemoClient';
import SentinelPersonalOffer from '@/components/SentinelPersonalOffer';

export const metadata: Metadata = {
  title: 'Sentinel: The Action-Control Platform for AI Agents | Aridon',
  description:
    'Sentinel by Aridon is the action-control platform for AI agents. It checks every proposed agent action against policy before it executes, holds consequential actions for human approval, and writes each decision to a tamper-evident audit log. Live demo: run all 18 attack and control scenarios. Development-stage technical preview, internal testing only.',
  alternates: { canonical: '/sentinel-demo' },
  openGraph: {
    title: 'Sentinel: The Action-Control Platform for AI Agents',
    description:
      'Pre-execution authorization for AI agents: allow, hold for a human, or deny, with a hash-chained audit record. Try the live demo.',
    url: '/sentinel-demo',
    siteName: 'Aridon',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Sentinel: The Action-Control Platform for AI Agents',
    description:
      'Pre-execution authorization for AI agents: allow, hold for a human, or deny, with a hash-chained audit record. Try the live demo.',
  },
};

// Structured data (SEO audit appendix): SoftwareApplication + FAQPage matching
// the server-rendered answer block in SentinelDemoClient. Rendered here in the
// server component so it is present in the raw HTML for crawlers.
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'SoftwareApplication',
      name: 'Sentinel by Aridon',
      applicationCategory: 'SecurityApplication',
      operatingSystem: 'Cross-platform (MCP server, Node.js 18+)',
      description:
        'Sentinel is the action-control platform for AI agents. It evaluates every proposed agent action against policy before execution, returns allow, hold for human approval, or deny, and writes each decision to a SHA-256 hash-chained audit log. Development-stage technical preview, internal testing only.',
      url: 'https://aridon-v02.vercel.app/sentinel-demo',
      author: { '@type': 'Organization', name: 'Aridon' },
      sameAs: [
        'https://github.com/jimrusk/sentinel-mcp',
        'https://github.com/jimrusk/sentinel-crewai-template',
        'https://doi.org/10.5281/zenodo.23920785',
      ],
      offers: {
        '@type': 'Offer',
        name: 'Sentinel Personal, founding cohort',
        price: '150',
        priceCurrency: 'USD',
        description:
          '$150 setup, then $50 per month. Includes one personal agent workflow wired through Sentinel, an action-exposure map, continuous action checks, approval holds, and monthly activity reviews.',
        eligibleCustomerType: 'Consumer',
        priceSpecification: {
          '@type': 'UnitPriceSpecification',
          price: '50',
          priceCurrency: 'USD',
          unitText: 'MONTH',
        },
      },
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'How is Sentinel different from a guardrail library?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Guardrails mostly filter what a model says. Sentinel governs what an agent does: it evaluates the proposed action and its tool calls, and consequential actions require a human approval bound to that exact action before anything runs.',
          },
        },
        {
          '@type': 'Question',
          name: 'What kinds of actions does Sentinel gate?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Payments and transfers, sending email and messages, shell and command execution, database writes and deletes, credential access, network requests, and file deletion, plus any action whose content scores as hostile, such as prompt injection or data exfiltration attempts.',
          },
        },
        {
          '@type': 'Question',
          name: 'Does Sentinel work with MCP and agent frameworks?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes. The public test build is an MCP server that sits in front of any MCP client, and a CrewAI template is published alongside it. Both are linked on the demo page.',
          },
        },
        {
          '@type': 'Question',
          name: 'Is Sentinel a certified security product?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'No. It is a development-stage technical preview with internal testing only, no SOC 2 or other certification, and it is not a guarantee of safety.',
          },
        },
      ],
    },
  ],
};

export default function SentinelDemoPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SentinelDemoClient />
      <SentinelPersonalOffer />
    </>
  );
}
