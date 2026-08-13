'use client';

import { useEffect, useState } from 'react';

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

export default function InstallAridon() {
  const [promptEvent, setPromptEvent] = useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [status, setStatus] = useState('');

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
    setInstalled(standalone);
    setIsIOS(/iphone|ipad|ipod/i.test(navigator.userAgent));

    const beforeInstall = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as InstallPromptEvent);
    };
    const appInstalled = () => {
      setInstalled(true);
      setPromptEvent(null);
      setStatus('Aridon is installed on this device.');
    };

    window.addEventListener('beforeinstallprompt', beforeInstall);
    window.addEventListener('appinstalled', appInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', beforeInstall);
      window.removeEventListener('appinstalled', appInstalled);
    };
  }, []);

  async function install() {
    if (!promptEvent) {
      if (isIOS) setStatus('On iPhone or iPad, tap Share, then Add to Home Screen.');
      else setStatus('Open your browser menu and choose Install app or Add to Home Screen.');
      return;
    }

    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    setStatus(choice.outcome === 'accepted' ? 'Aridon installation started.' : 'Installation was not completed. You can install anytime.');
    setPromptEvent(null);
  }

  if (installed) {
    return <div style={successStyle}>✓ Aridon is installed on this device.</div>;
  }

  return (
    <div>
      <button type="button" onClick={() => void install()} style={buttonStyle}>Install Aridon App</button>
      <p style={helpStyle}>{status || (isIOS ? 'Works on iPhone/iPad through Add to Home Screen.' : 'Installs as its own app window on supported phones and computers.')}</p>
    </div>
  );
}

const buttonStyle = {
  border: 0,
  borderRadius: 12,
  padding: '15px 20px',
  background: '#9EF0CF',
  color: '#07130F',
  fontSize: 16,
  fontWeight: 950,
  cursor: 'pointer',
};

const helpStyle = { margin: '10px 0 0', color: '#9AA9BF', fontSize: 13, lineHeight: 1.5 };
const successStyle = { border: '1px solid #4C806D', background: '#10261F', color: '#9EF0CF', borderRadius: 12, padding: '14px 16px', fontWeight: 900 };
