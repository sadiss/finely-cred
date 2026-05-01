import { supabase, isSupabaseConfigured } from './supabaseClient';
import { isFeatureEnabled, getCommsSettings } from '../data/settingsRepo';

export async function sendEmail(args: { toEmail: string; toName?: string; subject: string; text: string }) {
  if (!isFeatureEnabled('commsDelivery')) throw new Error('Comms delivery is disabled (Feature Flags).');
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');

  const comms = getCommsSettings();
  const fromEmail = comms.sendgridFromEmail;
  const fromName = comms.sendgridFromName;

  const { data, error } = await supabase.functions.invoke('send-email', {
    body: {
      to: { email: args.toEmail, name: args.toName ?? undefined },
      from: { email: fromEmail ?? undefined, name: fromName ?? undefined },
      subject: args.subject,
      text: args.text,
    },
  });
  if (error) throw new Error(error.message);
  if (!data?.ok) throw new Error(data?.error || 'Email send failed.');
  return true;
}

export async function sendSms(args: { toPhone: string; body: string }) {
  if (!isFeatureEnabled('commsDelivery')) throw new Error('Comms delivery is disabled (Feature Flags).');
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');

  const comms = getCommsSettings();
  const from = comms.twilioFromPhone;

  const { data, error } = await supabase.functions.invoke('send-sms', {
    body: { to: args.toPhone, from: from ?? undefined, body: args.body },
  });
  if (error) throw new Error(error.message);
  if (!data?.ok) throw new Error(data?.error || 'SMS send failed.');
  return true;
}

