export type PartnerOutreachCorridor = 'haitian' | 'general';

export type PartnerOutreachRecord = {
  partnerId: string;
  corridor: PartnerOutreachCorridor;
  batch: string;
  batchLabel: string;
  businessName: string;
  personName: string;
  title: string;
  category: string;
  categoryRaw: string;
  city: string;
  metro: string;
  website: string;
  phone: string;
  email: string;
  hasPhone: boolean;
  hasEmail: boolean;
  hasPhoneAndEmail: boolean;
  icpFit: string;
  whyFit: string;
  sourceUrls: string[];
  status: string;
  outreachStatus: string;
};

export type PartnerOutreachFilters = {
  corridor?: PartnerOutreachCorridor | 'all';
  metro?: string;
  category?: string;
  hasPhoneAndEmail?: boolean;
  outreachHold?: boolean;
  q?: string;
};

export function isOutreachHold(status: string | undefined): boolean {
  return (status || '').toUpperCase().includes('HOLD');
}

export function matchesPartnerOutreachFilters(
  row: PartnerOutreachRecord,
  filters: PartnerOutreachFilters = {},
): boolean {
  if (filters.corridor && filters.corridor !== 'all' && row.corridor !== filters.corridor) return false;
  if (filters.metro && filters.metro !== 'all' && row.metro !== filters.metro) return false;
  if (filters.category && filters.category !== 'all' && row.category !== filters.category) return false;
  if (filters.hasPhoneAndEmail && !row.hasPhoneAndEmail) return false;
  if (filters.outreachHold && !isOutreachHold(row.outreachStatus)) return false;
  const q = (filters.q || '').trim().toLowerCase();
  if (q) {
    const hay = [
      row.partnerId,
      row.businessName,
      row.personName,
      row.title,
      row.category,
      row.city,
      row.metro,
      row.email,
      row.phone,
    ]
      .join(' ')
      .toLowerCase();
    if (!hay.includes(q)) return false;
  }
  return true;
}

export function uniqueSorted(values: string[]): string[] {
  return Array.from(new Set(values.map((v) => v.trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b));
}

export function partnerOutreachExportCsv(rows: PartnerOutreachRecord[]): string {
  const headers = [
    'partner_id',
    'corridor',
    'metro',
    'category',
    'business_name',
    'person_name',
    'title',
    'city',
    'website',
    'phone',
    'email',
    'has_phone_and_email',
    'icp_fit',
    'outreach_status',
    'why_fit',
  ];
  const escape = (value: string) => {
    const s = value ?? '';
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [
    headers.join(','),
    ...rows.map((r) =>
      [
        r.partnerId,
        r.corridor,
        r.metro,
        r.category,
        r.businessName,
        r.personName,
        r.title,
        r.city,
        r.website,
        r.phone,
        r.email,
        r.hasPhoneAndEmail ? 'yes' : 'no',
        r.icpFit,
        r.outreachStatus,
        r.whyFit,
      ]
        .map((v) => escape(String(v ?? '')))
        .join(','),
    ),
  ];
  return lines.join('\n');
}
