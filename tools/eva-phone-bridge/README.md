# Aridon Eva Phone Bridge

This Chrome extension connects Aridon's Eva call queue to the user's own Google Voice web line. It is designed to remove SignalWire/Twilio/AI-receptionist subscriptions from the critical path.

## What it does

- Keeps `voice.google.com` open as the actual phone line.
- Polls Aridon for permitted outbound jobs.
- Dials through Google Voice in the browser.
- Routes the remote call audio into OpenAI Realtime and Eva's generated audio back into the Google Voice WebRTC microphone track.
- Detects incoming calls and can let Eva answer automatically.
- Stores only a revocable Aridon bridge token locally. The permanent OpenAI API key stays on the Aridon server. The extension receives only short-lived Realtime client secrets.
- Reports call state and transcript back to Aridon.

## Install once

1. Open Chrome on the computer that will stay signed in to Eva's Google Voice account.
2. Go to `chrome://extensions`, turn on **Developer mode**, choose **Load unpacked**, and select this folder.
3. Open `https://voice.google.com/u/0/calls`, sign in, allow microphone/audio permissions, and leave the tab open.
4. In Aridon, open `/eva-phone-bridge` and click **Create pairing code**.
5. Open the extension, paste the Bridge ID and six-digit code, then click **Pair this browser**.

After pairing, the bridge reconnects automatically when Chrome starts. No SignalWire credentials are needed.

## Important limitations

Google Voice does not publish a general calling API for consumer web Voice. This bridge therefore controls the user's own Google Voice web session and WebRTC media. Google can change the Voice web UI, so the selector layer is intentionally isolated in `voice-ui.js` for easy repair.

For autonomous outbound AI calls, Aridon still requires the existing `allowed_ai_opt_in` compliance gate and a recorded permission basis. Incoming calls are caller-initiated and do not use that outbound gate.
