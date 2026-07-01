/** Resolve comms secrets — supports canonical names and API_ID / API_KEY aliases. */

export function trimEnv(name: string): string {
  return (Deno.env.get(name) || '').trim();
}

export function getEmailApiCredentials(): { apiId: string; apiKey: string } {
  return {
    apiId: trimEnv('EMAIL_API_ID') || trimEnv('API_ID'),
    apiKey: trimEnv('EMAIL_API_KEY') || trimEnv('API_KEY'),
  };
}

export function getSmtpCredentials(): { host: string; port: number; user: string; pass: string; secure: boolean } | null {
  const host = trimEnv('SMTP_HOST');
  if (!host) return null;

  const port = parseInt(trimEnv('SMTP_PORT') || '587', 10);
  if (!port) return null;

  const { apiId, apiKey } = getEmailApiCredentials();
  const user = trimEnv('SMTP_USER') || apiId;
  const pass = trimEnv('SMTP_PASS') || apiKey;
  if (!user || !pass) return null;

  const secure = trimEnv('SMTP_SECURE').toLowerCase() === 'true' || port === 465;
  return { host, port, user, pass, secure };
}

export function isSmtpConfigured(): boolean {
  return Boolean(getSmtpCredentials());
}

export function isSendGridConfigured(): boolean {
  return Boolean(trimEnv('SENDGRID_API_KEY'));
}

export function isEmailDeliveryConfigured(): boolean {
  return isSmtpConfigured() || isSendGridConfigured();
}

export function getSmsApiCredentials(): { apiId: string; apiKey: string } {
  return {
    apiId: trimEnv('SMS_API_ID') || trimEnv('API_ID'),
    apiKey: trimEnv('SMS_API_KEY') || trimEnv('API_KEY'),
  };
}

export function getSmsProvider(): 'twilio' | 'rest' {
  const explicit = trimEnv('SMS_PROVIDER').toLowerCase();
  if (explicit === 'rest' || explicit === 'api') return 'rest';
  if (explicit === 'twilio') return 'twilio';

  const { apiId, apiKey } = getSmsApiCredentials();
  const twilioSid = trimEnv('TWILIO_ACCOUNT_SID');
  const twilioToken = trimEnv('TWILIO_AUTH_TOKEN');
  if (twilioSid && twilioToken) return 'twilio';
  if (apiId && apiKey) return 'rest';
  return 'twilio';
}

export function isTwilioConfigured(): boolean {
  return Boolean(trimEnv('TWILIO_ACCOUNT_SID') && trimEnv('TWILIO_AUTH_TOKEN'));
}

export function isRestSmsConfigured(): boolean {
  const { apiId, apiKey } = getSmsApiCredentials();
  return Boolean(apiId && apiKey && trimEnv('SMS_SENDER_ID'));
}

export function isSmsDeliveryConfigured(): boolean {
  const provider = getSmsProvider();
  return provider === 'rest' ? isRestSmsConfigured() : isTwilioConfigured();
}
