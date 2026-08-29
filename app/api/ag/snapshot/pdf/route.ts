import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import {
  generateAgOperationSnapshot,
  normalizeAgSnapshotInput,
  validateAgSnapshotInput,
} from '../../../../../lib/agOperationSnapshot';

export const runtime = 'nodejs';
export const maxDuration = 30;

function dollars(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}

function wrap(text: string, maxChars: number) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxChars && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const input = normalizeAgSnapshotInput(body);
    const validationError = validateAgSnapshotInput(input);
    if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });

    const report = generateAgOperationSnapshot(input);
    const pdf = await PDFDocument.create();
    const page = pdf.addPage([612, 792]);
    const regular = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

    const navy = rgb(0.035, 0.18, 0.25);
    const green = rgb(0.12, 0.34, 0.22);
    const muted = rgb(0.33, 0.39, 0.43);
    const pale = rgb(0.94, 0.96, 0.93);
    const black = rgb(0.08, 0.10, 0.10);

    page.drawRectangle({ x: 0, y: 682, width: 612, height: 110, color: navy });
    page.drawText('ARIDON AG', { x: 40, y: 754, size: 11, font: bold, color: rgb(0.74, 0.93, 0.57) });
    page.drawText('Operation Snapshot', { x: 40, y: 716, size: 28, font: bold, color: rgb(1, 1, 1) });
    page.drawText(report.operationLabel, { x: 40, y: 694, size: 11, font: regular, color: rgb(0.88, 0.93, 0.93) });

    page.drawText('Directional opportunity worth investigating', { x: 40, y: 650, size: 10, font: bold, color: muted });
    page.drawText(`${dollars(report.opportunityLow)} - ${dollars(report.opportunityHigh)}`, { x: 40, y: 619, size: 25, font: bold, color: green });
    page.drawText('Potential annual impact across the three highest-priority areas below.', { x: 40, y: 600, size: 9.5, font: regular, color: muted });

    let y = 557;
    report.opportunities.forEach((opportunity, index) => {
      page.drawRectangle({ x: 36, y: y - 92, width: 540, height: 100, color: pale });
      page.drawText(`${index + 1}`, { x: 50, y: y - 18, size: 18, font: bold, color: green });
      page.drawText(opportunity.title, { x: 78, y: y - 15, size: 13, font: bold, color: black });
      page.drawText(`${dollars(opportunity.estimateLow)} - ${dollars(opportunity.estimateHigh)} worth reviewing`, { x: 78, y: y - 33, size: 9.5, font: bold, color: green });

      const whyLines = wrap(opportunity.why, 88).slice(0, 2);
      whyLines.forEach((line, lineIndex) => {
        page.drawText(line, { x: 78, y: y - 51 - lineIndex * 12, size: 8.5, font: regular, color: muted });
      });

      const actionLines = wrap(`Next: ${opportunity.action}`, 88).slice(0, 2);
      actionLines.forEach((line, lineIndex) => {
        page.drawText(line, { x: 78, y: y - 76 - lineIndex * 12, size: 8.5, font: bold, color: black });
      });
      y -= 112;
    });

    page.drawText('Funding check', { x: 40, y: 196, size: 11, font: bold, color: green });
    wrap(report.fundingPrompt, 103).slice(0, 3).forEach((line, index) => {
      page.drawText(line, { x: 40, y: 180 - index * 11, size: 8.2, font: regular, color: muted });
    });

    page.drawText('What to do next', { x: 40, y: 132, size: 11, font: bold, color: navy });
    page.drawText('Bring this page and your last 12 months of ranch records to a 20-minute Aridon review.', { x: 40, y: 117, size: 8.8, font: regular, color: black });
    page.drawText('Founding Ranch Plan: $149/month or $1,490/year.', { x: 40, y: 102, size: 9, font: bold, color: green });

    wrap(report.disclaimer, 112).slice(0, 3).forEach((line, index) => {
      page.drawText(line, { x: 40, y: 66 - index * 9, size: 6.8, font: regular, color: muted });
    });

    const bytes = await pdf.save();
    const fileName = `aridon-operation-snapshot-${input.county.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'ranch'}.pdf`;
    return new NextResponse(Buffer.from(bytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Operation Snapshot PDF error', error);
    return NextResponse.json({ error: 'The PDF could not be generated.' }, { status: 500 });
  }
}
