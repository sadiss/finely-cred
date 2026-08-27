-- Source-faithful evidence integrity metadata.
-- Raw reports remain in the private PII bucket; this stores only the protected
-- blob reference, crop coordinates, hashes, redaction policy, and review gate.

alter table public.evidence
  add column if not exists provenance jsonb,
  add column if not exists tags text[];

create index if not exists evidence_source_report_idx
  on public.evidence ((provenance ->> 'sourceReportId'))
  where provenance is not null;

create index if not exists evidence_provenance_kind_idx
  on public.evidence ((provenance ->> 'kind'))
  where provenance is not null;

comment on column public.evidence.provenance is
  'Source report anchor, hashes, redaction profile, demo safety, and human mailing review state.';
