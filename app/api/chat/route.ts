import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { buildSystemPrompt } from '../../../lib/systemPrompt';

export async function POST(req: NextRequest) {
  try {
    const { messages, executive } = await req.json();
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ reply: 'Heather is running in demo mode. Add OPENAI_API_KEY in Vercel Environment Variables to activate live AI responses.' });
    }
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: buildSystemPrompt(executive || 'Heather') },
        ...(messages || [])
      ],
      temperature: 0.6
    });
    return NextResponse.json({ reply: completion.choices[0]?.message?.content || 'I am online, but I did not receive a clear response.' });
  } catch (error:any) {
    return NextResponse.json({ reply: `Heather hit an error: ${error.message}` }, { status: 500 });
  }
}
