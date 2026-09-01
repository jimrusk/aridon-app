import type { ReactNode } from 'react';
import PasteAssist from './PasteAssist';

export default function VideoStudioLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <PasteAssist />
    </>
  );
}
