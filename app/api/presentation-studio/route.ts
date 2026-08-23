import { NextRequest, NextResponse } from 'next/server';
import PptxGenJS from 'pptxgenjs';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { routeModel, type AridonChatMessage } from '../../../lib/modelRouter';

export const runtime = 'nodejs';
export const maxDuration = 60;

const NO_STORE_HEADERS = { 'Cache-Control': 'no-store' };

type SlideSpec = {
  title: string;
  subtitle?: string;
  bullets: string[];
};

type DeckSpec = {
  title: string;
  subtitle: string;
  slides: SlideSpec[];
};

function text(value: unknown, max = 12_000) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function safeFileName(value: string) {
  const cleaned = value.replace(/[^a-z0-9-_ ]/gi, '').trim().replace(/\s+/g, '-').slice(0, 70);
  return cleaned || 'Aridon-Presentation';
}

function trimBullet(value: unknown) {
  return typeof value === 'string' ? value.trim().replace(/^[-•*]\s*/, '').slice(0, 220) : '';
}

function normalizeDeck(raw: any, fallbackTitle: string, purpose: string): DeckSpec {
  const slides = Array.isArray(raw?.slides)
    ? raw.slides
        .slice(0, 14)
        .map((slide: any) => ({
          title: text(slide?.title, 90) || 'Key Point',
          subtitle: text(slide?.subtitle, 150),
          bullets: Array.isArray(slide?.bullets)
            ? slide.bullets.map(trimBullet).filter(Boolean).slice(0, 6)
            : [],
        }))
        .filter((slide: SlideSpec) => slide.title || slide.bullets.length)
    : [];

  return {
    title: text(raw?.title, 100) || fallbackTitle,
    subtitle: text(raw?.subtitle, 180) || purpose || 'Prepared by Aridon Presentation Studio',
    slides: slides.length
      ? slides
      : [
          { title: 'Objective', bullets: [purpose || 'Define the decision, opportunity, or proposal clearly.'] },
          { title: 'What matters now', bullets: ['Current situation', 'Primary opportunity', 'Important constraints', 'Evidence to verify'] },
          { title: 'Recommended direction', bullets: ['Prioritize the highest-value move', 'Assign owners and timing', 'Measure outcomes', 'Adjust from evidence'] },
          { title: 'Next actions', bullets: ['Confirm scope', 'Launch the first action', 'Track results', 'Return to Aridon for the next decision'] },
        ],
  };
}

function parseDeckJson(value: string, fallbackTitle: string, purpose: string) {
  const first = value.indexOf('{');
  const last = value.lastIndexOf('}');
  if (first < 0 || last <= first) return normalizeDeck({}, fallbackTitle, purpose);
  try {
    return normalizeDeck(JSON.parse(value.slice(first, last + 1)), fallbackTitle, purpose);
  } catch {
    return normalizeDeck({}, fallbackTitle, purpose);
  }
}

async function createDeckSpec(title: string, purpose: string, audience: string, sourceText: string) {
  const prompt = `Create a concise, decision-ready presentation outline for Aridon Presentation Studio.\n\nTITLE: ${title}\nPURPOSE: ${purpose || 'Explain the opportunity and recommended next actions'}\nAUDIENCE: ${audience || 'Business decision-makers'}\nSOURCE MATERIAL:\n${sourceText || 'No extra source material was supplied. Build a strong general structure and do not invent specific facts.'}\n\nReturn ONLY valid JSON using this exact shape:\n{\n  \"title\": \"deck title\",\n  \"subtitle\": \"short subtitle\",\n  \"slides\": [\n    {\"title\": \"slide title\", \"subtitle\": \"optional\", \"bullets\": [\"bullet 1\", \"bullet 2\"]}\n  ]\n}\n\nRules: 6 to 10 content slides; no more than 6 bullets per slide; each bullet under 24 words; lead with the decision/problem, then evidence/opportunity, then plan, then next actions; never invent financials, customers, partnerships, contacts, or verified claims not present in source material.`;

  const messages: AridonChatMessage[] = [{ role: 'user', content: prompt }];
  try {
    const result = await routeModel(messages, 'You are Aridon Presentation Studio. Build crisp executive presentation structures and obey the requested JSON schema exactly.');
    return { deck: parseDeckJson(result.text, title, purpose), routing: result.routing };
  } catch (error) {
    console.error('Presentation Studio outline fallback', error);
    return { deck: normalizeDeck({}, title, purpose), routing: null };
  }
}

async function buildPptx(deck: DeckSpec) {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE';
  pptx.author = 'Aridon';
  pptx.company = 'Aridon';
  pptx.subject = deck.subtitle;
  pptx.title = deck.title;
  pptx.lang = 'en-US';

  const dark = '07101D';
  const mint = '9EF0CF';
  const white = 'F8FAFC';
  const soft = 'B8C4D5';

  const titleSlide = pptx.addSlide();
  titleSlide.background = { color: dark };
  titleSlide.addShape(pptx.ShapeType.rect, { x: 0.6, y: 0.7, w: 0.12, h: 5.8, fill: { color: mint }, line: { color: mint } });
  titleSlide.addText('ARIDON PRESENTATION STUDIO', { x: 1.0, y: 0.75, w: 5.5, h: 0.35, fontFace: 'Arial', fontSize: 12, bold: true, color: mint, charSpacing: 1.2 });
  titleSlide.addText(deck.title, { x: 1.0, y: 1.45, w: 10.9, h: 2.2, fontFace: 'Arial', fontSize: 32, bold: true, color: white, margin: 0.02, breakLine: false, valign: 'mid' });
  titleSlide.addText(deck.subtitle, { x: 1.0, y: 4.0, w: 9.8, h: 1.1, fontFace: 'Arial', fontSize: 17, color: soft, margin: 0.02, valign: 'top' });
  titleSlide.addText('Research → executive review → decision-ready output', { x: 1.0, y: 6.45, w: 7.8, h: 0.3, fontFace: 'Arial', fontSize: 10, color: soft });

  deck.slides.forEach((spec, index) => {
    const slide = pptx.addSlide();
    slide.background = { color: index % 2 === 0 ? 'F4F1E9' : dark };
    const light = index % 2 === 0;
    const titleColor = light ? '171717' : white;
    const bodyColor = light ? '3F3C37' : soft;
    slide.addText(String(index + 1).padStart(2, '0'), { x: 0.65, y: 0.45, w: 0.6, h: 0.35, fontFace: 'Arial', fontSize: 11, bold: true, color: mint });
    slide.addText(spec.title, { x: 1.35, y: 0.45, w: 10.8, h: 0.8, fontFace: 'Arial', fontSize: 26, bold: true, color: titleColor, margin: 0.01 });
    if (spec.subtitle) {
      slide.addText(spec.subtitle, { x: 1.35, y: 1.28, w: 10.2, h: 0.45, fontFace: 'Arial', fontSize: 11, color: bodyColor, margin: 0.01 });
    }

    const startY = spec.subtitle ? 1.95 : 1.65;
    const bullets = spec.bullets.length ? spec.bullets : ['Use this slide to capture the decision, evidence, or next action.'];
    bullets.forEach((bullet, bulletIndex) => {
      const y = startY + bulletIndex * 0.78;
      slide.addShape(pptx.ShapeType.ellipse, { x: 1.38, y: y + 0.15, w: 0.12, h: 0.12, fill: { color: mint }, line: { color: mint } });
      slide.addText(bullet, { x: 1.7, y, w: 9.9, h: 0.55, fontFace: 'Arial', fontSize: 18, color: bodyColor, margin: 0.01, valign: 'mid' });
    });
    slide.addText('ARIDON', { x: 11.55, y: 6.92, w: 1.0, h: 0.2, fontFace: 'Arial', fontSize: 8, bold: true, color: light ? '6B665E' : soft, align: 'right' });
  });

  const buffer = await pptx.write({ outputType: 'nodebuffer' });
  return buffer as Buffer;
}

function wrapText(value: string, maxChars = 78) {
  const words = value.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (candidate.length > maxChars && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}

async function buildPdf(deck: DeckSpec) {
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const width = 960;
  const height = 540;
  const dark = rgb(7 / 255, 16 / 255, 29 / 255);
  const mint = rgb(158 / 255, 240 / 255, 207 / 255);
  const white = rgb(248 / 255, 250 / 255, 252 / 255);
  const soft = rgb(184 / 255, 196 / 255, 213 / 255);
  const ink = rgb(23 / 255, 23 / 255, 23 / 255);

  let page = pdf.addPage([width, height]);
  page.drawRectangle({ x: 0, y: 0, width, height, color: dark });
  page.drawRectangle({ x: 55, y: 60, width: 8, height: 420, color: mint });
  page.drawText('ARIDON PRESENTATION STUDIO', { x: 90, y: 450, size: 12, font: bold, color: mint });
  let titleY = 385;
  for (const line of wrapText(deck.title, 42).slice(0, 4)) {
    page.drawText(line, { x: 90, y: titleY, size: 30, font: bold, color: white });
    titleY -= 38;
  }
  let subY = 200;
  for (const line of wrapText(deck.subtitle, 82).slice(0, 3)) {
    page.drawText(line, { x: 90, y: subY, size: 16, font: regular, color: soft });
    subY -= 24;
  }

  deck.slides.forEach((spec, index) => {
    page = pdf.addPage([width, height]);
    const light = index % 2 === 0;
    page.drawRectangle({ x: 0, y: 0, width, height, color: light ? rgb(244 / 255, 241 / 255, 233 / 255) : dark });
    page.drawText(String(index + 1).padStart(2, '0'), { x: 58, y: 480, size: 11, font: bold, color: mint });
    page.drawText(spec.title.slice(0, 90), { x: 105, y: 468, size: 24, font: bold, color: light ? ink : white });
    if (spec.subtitle) page.drawText(spec.subtitle.slice(0, 120), { x: 105, y: 435, size: 10, font: regular, color: light ? rgb(0.36, 0.35, 0.33) : soft });

    let y = spec.subtitle ? 380 : 405;
    const bullets = spec.bullets.length ? spec.bullets : ['Use this slide to capture the decision, evidence, or next action.'];
    bullets.slice(0, 6).forEach((bullet) => {
      page.drawCircle({ x: 112, y: y + 7, size: 4, color: mint });
      const lines = wrapText(bullet, 82).slice(0, 2);
      lines.forEach((line, lineIndex) => {
        page.drawText(line, { x: 135, y: y - lineIndex * 18, size: 15, font: regular, color: light ? rgb(0.25, 0.24, 0.22) : soft });
      });
      y -= lines.length > 1 ? 64 : 48;
    });
    page.drawText('ARIDON', { x: 835, y: 28, size: 8, font: bold, color: light ? rgb(0.42, 0.40, 0.37) : soft });
  });

  return Buffer.from(await pdf.save());
}

export async function POST(req: NextRequest) {
  try {
    if (!req.headers.get('content-type')?.includes('application/json')) {
      return NextResponse.json({ error: 'Content-Type must be application/json.' }, { status: 415, headers: NO_STORE_HEADERS });
    }

    const body = await req.json();
    const title = text(body?.title, 100) || 'Aridon Presentation';
    const purpose = text(body?.purpose, 500);
    const audience = text(body?.audience, 300);
    const sourceText = text(body?.sourceText, 18_000);
    const format = body?.format === 'pdf' ? 'pdf' : 'pptx';

    const { deck, routing } = await createDeckSpec(title, purpose, audience, sourceText);
    const fileName = `${safeFileName(deck.title)}.${format}`;
    const buffer = format === 'pdf' ? await buildPdf(deck) : await buildPptx(deck);

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        ...NO_STORE_HEADERS,
        'Content-Type': format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'X-Aridon-Router': routing ? `${routing.provider}/${routing.model}` : 'fallback',
      },
    });
  } catch (error) {
    console.error('Aridon Presentation Studio error', error);
    return NextResponse.json({ error: 'Unable to generate the presentation right now.' }, { status: 500, headers: NO_STORE_HEADERS });
  }
}
