/** Partner support message (in-app; email integration later). */
export type MessageTopic =
  | 'general'
  | 'billing'
  | 'disputes'
  | 'documents'
  | 'debt_summons'
  | 'other';

export type PartnerMessage = {
  id: string;
  partnerId: string;
  topic: MessageTopic;
  subject: string;
  body: string;
  /** true = from partner; false = from support (admin) */
  fromPartner: boolean;
  createdAt: string;
};
