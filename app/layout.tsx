import './globals.css';
import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Aridon v0.2', description: 'AI Executive Operating System' };
export default function RootLayout({ children }: { children: React.ReactNode }) { return <html lang="en"><body>{children}</body></html>; }
