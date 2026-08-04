'use client';

import Link from 'next/link';

export default function AvatarLauncher() {
  return (
    <Link href="/avatars" className="avatar-launcher" aria-label="Open talking executive avatars">
      <span className="avatar-launcher-orb" aria-hidden="true">◉</span>
      <span>
        <strong>Talking Avatars</strong>
        <small>Tap an executive to speak</small>
      </span>
    </Link>
  );
}
