import { NextRequest, NextResponse } from 'next/server';
import { analyzeSentinel } from '@/lib/sentinel-grid';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MCP_PROTOCOL_VERSION = '2025-06-18';
const SERVER_NAME = 'aridon-sentinel';
const SERVER_VERSION = '0.2.0';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, Mcp-Session-Id, MCP-Protocol-Version',
  'Cache-Control': 'no-store',
};

type JsonRpcRequest = {
  jsonrpc?: string;
  id?: string | number | null;
  method?: string;
  params?: any;
};

function rpc(id: JsonRpcRequest['id'], result: unknown, status = 200) {
  return NextResponse.json({ jsonrpc: '2.0', id: id ?? null, result }, { status, headers: cors });
}

function rpcError(id: JsonRpcRequest['id'], code: number, message: string, status = 400) {
  return NextResponse.json(
    { jsonrpc: '2.0', id: id ?? null, error: { code, message } },
    { status, headers: cors },
  );
}

const tools = [
  {
    name: 'sentinel_scan_prompt',
    title: 'Scan prompt with Aridon Sentinel',
    description: 'Defensively assess a prompt and recent conversation trajectory for malicious-intent indicators before consequential actions are allowed.',
    inputSchema: {
      type: 'object',
      properties: {
        prompt: { type: 'string', description: 'The current prompt or instruction to assess.' },
        history: { type: 'array', items: { type: 'string' }, description: 'Optional recent conversation turns, newest last.' },
        authorizationContext: { type: 'string', description: 'Optional authorized defensive, lab, audit, or ownership context.' },
      },
      required: ['prompt'],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
  },
  {
    name: 'sentinel_assess_action',
    title: 'Assess an AI action before execution',
    description: 'Run Sentinel as an independent pre-action gate for tool calls, messages, shell commands, network requests, database changes, credential access, or other consequential actions.',
    inputSchema: {
      type: 'object',
      properties: {
        prompt: { type: 'string', description: 'The user or agent instruction that led to the proposed action.' },
        requestedActions: { type: 'array', items: { type: 'string' }, description: 'Human-readable descriptions of proposed external actions.' },
        history: { type: 'array', items: { type: 'string' } },
        authorizationContext: { type: 'string' },
      },
      required: ['prompt', 'requestedActions'],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
  },
  {
    name: 'sentinel_federated_risk',
    title: 'Combine provider risk signals',
    description: 'Combine minimized risk signals from multiple AI providers without requiring raw prompt sharing.',
    inputSchema: {
      type: 'object',
      properties: {
        prompt: { type: 'string', description: 'Local prompt text used by the originating system.' },
        providerSignals: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              provider: { type: 'string' },
              score: { type: 'number', minimum: 0, maximum: 100 },
              confidence: { type: 'number', minimum: 0, maximum: 1 },
              category: { type: 'string' },
            },
            required: ['provider', 'score'],
            additionalProperties: false,
          },
        },
        requestedActions: { type: 'array', items: { type: 'string' } },
        authorizationContext: { type: 'string' },
      },
      required: ['prompt', 'providerSignals'],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
  },
  {
    name: 'sentinel_policy',
    title: 'Get Sentinel operating policy',
    description: 'Return the current defensive operating principles and action-gate behavior for Aridon Sentinel.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
  },
];

function normalizeStringArray(value: unknown, limit: number) {
  return Array.isArray(value) ? value.map(String).filter(Boolean).slice(0, limit) : [];
}

function toolResult(payload: unknown) {
  return {
    content: [{ type: 'text', text: JSON.stringify(payload, null, 2) }],
    structuredContent: payload,
    isError: false,
  };
}

function callTool(name: string, args: any) {
  if (name === 'sentinel_policy') {
    return toolResult({
      name: 'Aridon Sentinel Grid',
      version: SERVER_VERSION,
      purpose: 'Independent pre-action AI security and early-warning layer.',
      principles: [
        'Detect intent and behavioral trajectories, not keywords alone.',
        'Require an independent gate before consequential tool actions.',
        'Preserve legitimate authorized defensive research.',
        'Keep raw prompts with the originating provider whenever possible.',
        'Share minimized threat indicators and risk signals across providers.',
        'Escalate ambiguous consequential actions to human review.',
      ],
    });
  }

  if (!args?.prompt || typeof args.prompt !== 'string') {
    return {
      content: [{ type: 'text', text: 'A prompt string is required.' }],
      isError: true,
    };
  }

  if (args.prompt.length > 20000) {
    return {
      content: [{ type: 'text', text: 'Prompt exceeds the 20,000 character Sentinel limit.' }],
      isError: true,
    };
  }

  const providerSignals = Array.isArray(args.providerSignals)
    ? args.providerSignals.slice(0, 8).map((s: any) => ({
        provider: String(s?.provider || 'unknown'),
        score: Number(s?.score || 0),
        confidence: s?.confidence == null ? undefined : Number(s.confidence),
        category: s?.category == null ? undefined : String(s.category),
      }))
    : [];

  const assessment = analyzeSentinel({
    prompt: args.prompt,
    history: normalizeStringArray(args.history, 12),
    requestedActions: normalizeStringArray(args.requestedActions, 20),
    providerSignals,
    authorizationContext: typeof args.authorizationContext === 'string' ? args.authorizationContext : '',
  });

  return toolResult({
    assessment,
    protocolVersion: 'sentinel-grid/0.2',
    generatedAt: new Date().toISOString(),
    note: 'Sentinel is a defensive decision-support layer. A low score is not a guarantee that an activity is safe or authorized.',
  });
}

export async function POST(request: NextRequest) {
  let body: JsonRpcRequest;
  try {
    body = await request.json();
  } catch {
    return rpcError(null, -32700, 'Parse error');
  }

  if (body.jsonrpc !== '2.0' || !body.method) {
    return rpcError(body.id, -32600, 'Invalid Request');
  }

  if (body.method === 'initialize') {
    return rpc(body.id, {
      protocolVersion: MCP_PROTOCOL_VERSION,
      capabilities: { tools: { listChanged: false } },
      serverInfo: { name: SERVER_NAME, version: SERVER_VERSION },
      instructions: 'Use Aridon Sentinel as a defensive pre-action risk gate. It does not authorize activity and should not replace platform safety controls, legal review, or human approval for consequential actions.',
    });
  }

  if (body.method === 'notifications/initialized') {
    return new NextResponse(null, { status: 202, headers: cors });
  }

  if (body.method === 'ping') return rpc(body.id, {});
  if (body.method === 'tools/list') return rpc(body.id, { tools });

  if (body.method === 'tools/call') {
    const name = String(body.params?.name || '');
    const tool = tools.find((t) => t.name === name);
    if (!tool) return rpcError(body.id, -32602, `Unknown tool: ${name}`);
    return rpc(body.id, callTool(name, body.params?.arguments || {}));
  }

  return rpcError(body.id, -32601, `Method not found: ${body.method}`);
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: cors });
}

export async function GET() {
  return NextResponse.json(
    {
      name: 'Aridon Sentinel MCP',
      status: 'online',
      transport: 'MCP Streamable HTTP (stateless JSON-RPC)',
      endpoint: '/api/sentinel-mcp',
      tools: tools.map((tool) => tool.name),
      privacy: '/sentinel-grid/privacy',
    },
    { headers: cors },
  );
}
