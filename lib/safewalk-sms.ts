// SafeWalk SMS sender (Twilio REST via fetch, no new dependencies).
// Never throws: every failure path returns { sent: false, reason } and logs.

export type SmsResult = { sent: boolean; sid?: string; reason?: string };

export async function sendSms(to: string, body: string): Promise<SmsResult> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  const from = process.env.TWILIO_FROM?.trim();

  if (!accountSid || !authToken || !from) {
    console.log(`[safewalk-sms:unsent] to=${to} body=${body}`);
    return { sent: false, reason: 'twilio_not_configured' };
  }

  try {
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(accountSid)}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ To: to, From: from, Body: body }).toString(),
      },
    );
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.log(`[safewalk-sms:failed] to=${to} status=${res.status} ${text.slice(0, 200)}`);
      return { sent: false, reason: `twilio_${res.status}` };
    }
    const data = (await res.json().catch(() => ({}))) as { sid?: string };
    return { sent: true, sid: data.sid };
  } catch (e) {
    console.log(`[safewalk-sms:error] to=${to} ${e instanceof Error ? e.message : e}`);
    return { sent: false, reason: 'twilio_error' };
  }
}
