import { ImageResponse } from 'next/og';
import { createElement } from 'react';

export const runtime = 'edge';

export function GET(_request: Request, { params }: { params: { size: string } }) {
  const requested = Number(params.size);
  const size = requested === 192 ? 192 : 512;
  const fontSize = Math.round(size * 0.46);
  const innerSize = Math.round(size * 0.72);
  const radius = Math.round(size * 0.22);

  return new ImageResponse(
    createElement(
      'div',
      {
        style: {
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#07101D',
        },
      },
      createElement(
        'div',
        {
          style: {
            width: innerSize,
            height: innerSize,
            borderRadius: radius,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#0D1728',
            border: `${Math.max(6, Math.round(size * 0.025))}px solid #9EF0CF`,
            color: '#9EF0CF',
            fontSize,
            fontWeight: 900,
            letterSpacing: '-0.08em',
          },
        },
        'A'
      )
    ),
    { width: size, height: size }
  );
}
