import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { buildSystemPrompt } from '../../../lib/systemPrompt';
import { getServerClient } from '../../../lib/supabase';

// ── Tools the executives can invoke ─────────────────────────────────────────
const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'add_lead',
      description: 'Add a new lead or contact to the CRM. Use when the user asks to add, track, or log a contact, customer, or prospect.',
      parameters: {
        type: 'object',
        properties: {
          name:    { type: 'string', description: 'Full name' },
          company: { type: 'string', description: 'Company or organization' },
          email:   { type: 'string', description: 'Email address' },
          notes:   { type: 'string', description: 'Context, next steps, or relationship notes' },
          status:  { type: 'string', enum: ['new','contacted','qualified','closed'] }
        },
        required: ['name']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'add_task',
      description: 'Create a task or follow-up action item. Use when the user asks to create a task, to-do, or action item.',
      parameters: {
        type: 'object',
        properties: {
          title:       { type: 'string', description: 'Task description' },
          assigned_to: { type: 'string', description: 'Who it is assigned to' },
          priority:    { type: 'string', enum: ['low','medium','high','urgent'] }
        },
        required: ['title']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'add_project',
      description: 'Add a new project to track. Use when the user mentions a new project, initiative, or contract.',
      parameters: {
        type: 'object',
        properties: {
          name:        { type: 'string', description: 'Project name' },
          description: { type: 'string', description: 'Scope, notes, or context' },
          executive:   { type: 'string', description: 'Owning executive' },
          status:      { type: 'string', enum: ['active','planning','on-hold','completed'] }
        },
        required: ['name']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'save_to_knowledge_vault',
      description: 'Save information or documents to the Knowledge Vault for future reference.',
      parameters: {
        type: 'object',
        properties: {
          title:    { type: 'string', description: 'Document or item title' },
          content:  { type: 'string', description: 'The content to save' },
          category: { type: 'string', description: 'Category: grant, compliance, financial, capability, contract, strategy, idea, or other' }
        },
        required: ['title','content']
      }
    }
  }
];

// ── Execute a tool call against Supabase ─────────────────────────────────────
async function executeTool(name: string, args: Record<string, any>): Promise<string> {
  const db = getServerClient();
  try {
    if (name === 'add_lead') {
      const { error } = await db.from('leads').insert({
        name: args.name,
        company: args.company || null,
        email:   args.email   || null,
        notes:   args.notes   || null,
        status:  args.status  || 'new'
      });
      if (error) return `Failed to add lead: ${error.message}`;
      return `Added ${args.name}${args.company ? ` (${args.company})` : ''} to CRM with status "${args.status || 'new'}".`;
    }
    if (name === 'add_task') {
      const { error } = await db.from('tasks').insert({
        title:       args.title,
        assigned_to: args.assigned_to || null,
        priority:    args.priority || 'medium',
        status:      'open'
      });
      if (error) return `Failed to add task: ${error.message}`;
      return `Task created: "${args.title}"${args.assigned_to ? ` — assigned to ${args.assigned_to}` : ''}.`;
    }
    if (name === 'add_project') {
      const { error } = await db.from('projects').insert({
        name:        args.name,
        description: args.description || null,
        executive:   args.executive   || 'Heather',
        status:      args.status      || 'active'
      });
      if (error) return `Failed to add project: ${error.message}`;
      return `Project "${args.name}" added with status "${args.status || 'active'}".`;
    }
    if (name === 'save_to_knowledge_vault') {
      const { error } = await db.from('knowledge_vault').insert({
        title:    args.title,
        content:  args.content,
        category: args.category || 'general'
      });
      if (error) return `Failed to save to vault: ${error.message}`;
      return `Saved "${args.title}" to Knowledge Vault under category "${args.category || 'general'}".`;
    }
    return 'Unknown tool.';
  } catch (e: any) {
    return `Error executing action: ${e.message}`;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { messages, executive } = await req.json();
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ reply: 'AI is in demo mode — add OPENAI_API_KEY in Vercel Environment Variables.' });
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const systemMsg = { role: 'system' as const, content: buildSystemPrompt(executive || 'Heather') };

    // First call — may include tool calls
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [systemMsg, ...(messages || [])],
      tools,
      tool_choice: 'auto',
      temperature: 0.6
    });

    const msg = completion.choices[0]?.message;

    // If the model wants to call one or more tools, execute them
    if (msg?.tool_calls?.length) {
      const toolResults: string[] = [];

      for (const tc of msg.tool_calls) {
        let args: Record<string, any> = {};
        try { args = JSON.parse(tc.function.arguments); } catch {}
        const result = await executeTool(tc.function.name, args);
        toolResults.push(result);
      }

      // Second call — give the model the tool results so it can reply naturally
      const followUp = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          systemMsg,
          ...(messages || []),
          msg,
          ...msg.tool_calls.map((tc, i) => ({
            role: 'tool' as const,
            tool_call_id: tc.id,
            content: toolResults[i]
          }))
        ],
        temperature: 0.6
      });

      return NextResponse.json({
        reply:   followUp.choices[0]?.message?.content || toolResults.join('\n'),
        actions: toolResults   // frontend can use this to trigger a data refresh
      });
    }

    return NextResponse.json({ reply: msg?.content || 'No response received.' });
  } catch (error: any) {
    return NextResponse.json({ reply: `Error: ${error.message}` }, { status: 500 });
  }
}
