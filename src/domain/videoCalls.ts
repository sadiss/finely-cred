export type VideoParticipantRole = 'client' | 'partner' | 'specialist' | 'affiliate' | 'admin' | 'finely_staff';

export type VideoCallParticipant = {
  role: VideoParticipantRole;
  label: string;
  userId?: string;
  email?: string;
};

export type VideoCallRecord = {
  id: string;
  partnerId: string;
  threadId?: string;
  calendarEventId?: string;
  title: string;
  roomName: string;
  meetingUrl: string;
  createdAt: string;
  updatedAt: string;
  createdBy: { displayName: string; role: VideoParticipantRole; userId?: string };
  participants: VideoCallParticipant[];
  status: 'active' | 'ended';
  /** Optional password fragment for room config (demo — not cryptographically secure) */
  roomPin?: string;
};

export type CreateInstantVideoCallArgs = {
  partnerId: string;
  threadId?: string;
  title: string;
  createdBy: VideoCallRecord['createdBy'];
  participants: VideoCallParticipant[];
};
