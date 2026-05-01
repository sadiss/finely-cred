import type { SupportTopic } from './support';

export type CommsChannel = 'portal' | 'email' | 'sms';

export type CommsTemplate = {
  id: string;
  name: string;
  channel: CommsChannel;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;

  /** Portal/support message settings */
  topic?: SupportTopic;
  threadStrategy?: 'new_thread' | 'append_by_subject';

  /** Subject is used by portal/email; ignored for SMS. */
  subjectTemplate?: string;
  bodyTemplate: string;

  tags?: string[];
  meta?: Record<string, any>;
};

export type CommsSendStatus = 'sent' | 'error' | 'dry_run';

export type CommsSendLog = {
  id: string;
  templateId?: string;
  channel: CommsChannel;
  partnerId?: string;
  to?: string;
  createdAt: string;
  status: CommsSendStatus;
  subject?: string;
  body?: string;
  error?: string;
  meta?: Record<string, any>;
};

