export type CertificateId = string;

export type Certificate = {
  id: CertificateId;
  partnerId: string;
  courseId: string;
  courseTitle: string;
  recipientName?: string;
  issuedAt: string;
  /** Lightweight verification code for “show proof” use cases. */
  verificationCode: string;
};

