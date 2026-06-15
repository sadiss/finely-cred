/** Service-role SendGrid send (server cron — no admin JWT required). */
export async function sendServiceEmail(args: {
  toEmail: string;
  toName?: string;
  subject: string;
  text: string;
  html?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const apiKey = (Deno.env.get('SENDGRID_API_KEY') || '').trim();
  if (!apiKey) return { ok: false, error: 'SENDGRID_API_KEY missing' };

  const fromEmail = (Deno.env.get('SENDGRID_FROM_EMAIL') || '').trim();
  const fromName = (Deno.env.get('SENDGRID_FROM_NAME') || 'Finely Cred').trim();
  if (!fromEmail) return { ok: false, error: 'SENDGRID_FROM_EMAIL missing' };

  const toEmail = args.toEmail.trim();
  if (!toEmail) return { ok: false, error: 'Missing toEmail' };

  const subject = args.subject.trim();
  const text = args.text.trim();
  const html = (args.html || '').trim();
  if (!subject || (!text && !html)) return { ok: false, error: 'Missing subject/body' };

  const content = html
    ? [
        { type: 'text/plain', value: text || html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() },
        { type: 'text/html', value: html },
      ]
    : [{ type: 'text/plain', value: text }];

  const payload = {
    personalizations: [{ to: [{ email: toEmail, name: args.toName || undefined }] }],
    from: { email: fromEmail, name: fromName },
    subject,
    content,
  };

  try {
    const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return { ok: false, error: `SendGrid ${res.status}: ${await res.text()}` };
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : 'Send failed' };
  }
}
