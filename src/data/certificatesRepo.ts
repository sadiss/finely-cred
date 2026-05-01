import type { Certificate, CertificateId } from '../domain/certificates';
import { loadJson, saveJson } from './localJsonStore';
import { newId } from '../utils/ids';

const KEY = 'finely.certificates.v1';

type Store = { certs: Certificate[] };

function loadStore(): Store {
  return loadJson<Store>(
    KEY,
    {
      certs: [],
    },
    1,
  );
}

function saveStore(store: Store) {
  saveJson(KEY, store, 1);
}

function code(): string {
  // short, human-readable-ish
  return Math.random().toString(36).slice(2, 8).toUpperCase() + '-' + Math.random().toString(36).slice(2, 8).toUpperCase();
}

export function listCertificatesByPartner(partnerId: string): Certificate[] {
  return loadStore().certs.filter((c) => c.partnerId === partnerId).slice().sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));
}

export function getCertificate(id: CertificateId): Certificate | null {
  return loadStore().certs.find((c) => c.id === id) ?? null;
}

export function getCertificateForCourse(args: { partnerId: string; courseId: string }): Certificate | null {
  return loadStore().certs.find((c) => c.partnerId === args.partnerId && c.courseId === args.courseId) ?? null;
}

export function issueCertificate(args: {
  partnerId: string;
  courseId: string;
  courseTitle: string;
  recipientName?: string;
  issuedAt: string;
}): Certificate {
  const store = loadStore();
  const existing = store.certs.find((c) => c.partnerId === args.partnerId && c.courseId === args.courseId) ?? null;
  if (existing) return existing;

  const next: Certificate = {
    id: newId('cert'),
    partnerId: args.partnerId,
    courseId: args.courseId,
    courseTitle: args.courseTitle,
    recipientName: args.recipientName,
    issuedAt: args.issuedAt,
    verificationCode: code(),
  };
  store.certs.push(next);
  saveStore(store);
  return next;
}

