#!/usr/bin/env node
/** Patch PartnerDetailPage — paginated notes/debt lists + tab lanes (Part BR). */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const filePath = path.join(root, 'src/pages/admin/PartnerDetailPage.tsx');
let s = fs.readFileSync(filePath, 'utf8');

if (!s.includes('useTabLanes')) {
  s = s.replace(
    '      onTabChange={(k) => setTab(k as any)}',
    '      useTabLanes\n      onTabChange={(k) => setTab(k as any)}',
  );
}

s = s.replace(
  `  const [showAllSystemNotes, setShowAllSystemNotes] = useState(false);
  const [showAllManualNotes, setShowAllManualNotes] = useState(false);
  const [showAllDebtCases, setShowAllDebtCases] = useState(false);
  const [reportsRefreshKey, setReportsRefreshKey] = useState(0);
  const didAutoTab = useRef(false);
  const generatedLettersRef = useRef<HTMLDivElement | null>(null);
  const analysisReportsRef = useRef<HTMLDivElement | null>(null);

  const SYSTEM_NOTES_LIMIT = 10;
  const MANUAL_NOTES_LIMIT = 10;
  const DEBT_CASES_LIMIT = 12;
`,
  `  const [reportsRefreshKey, setReportsRefreshKey] = useState(0);
  const didAutoTab = useRef(false);
  const generatedLettersRef = useRef<HTMLDivElement | null>(null);
  const analysisReportsRef = useRef<HTMLDivElement | null>(null);
`,
);

if (!s.includes('sortedManualNotes')) {
  s = s.replace(
    '  const manualNotes = useMemo(() => (partner ? listPartnerNotesByPartner(partner.id) : []), [partner, notesVersion]);',
    `  const manualNotes = useMemo(() => (partner ? listPartnerNotesByPartner(partner.id) : []), [partner, notesVersion]);
  const sortedManualNotes = useMemo(
    () =>
      manualNotes
        .slice()
        .sort(
          (a, b) =>
            Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)) || b.createdAt.localeCompare(a.createdAt),
        ),
    [manualNotes],
  );`,
  );
}

const systemNotesOld = `                <div className="mt-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {systemNotes.length > SYSTEM_NOTES_LIMIT ? (
                      <button
                        type="button"
                        className={FINELY_OS_ENTITY_ACTION}
                        onClick={() => setShowAllSystemNotes((v) => !v)}
                        title={showAllSystemNotes ? 'Show less' : 'Show all auto notes'}
                      >
                        {showAllSystemNotes ? 'Show less' : \`Show all (\${systemNotes.length})\`}
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className={FINELY_OS_ENTITY_ACTION}
                      onClick={() => setNotesVersion((v) => v + 1)}
                      title="Refresh auto notes"
                    >
                      Refresh
                    </button>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                {(showAllSystemNotes ? systemNotes : systemNotes.slice(0, SYSTEM_NOTES_LIMIT)).map((n) => (
                    <div key={\`\${n.createdAt}-\${n.title}\`} className={\`\${finelyOsInlineListItem()} p-5\`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className={\`\${FINELY_OS_ENTITY_VALUE} truncate\`}>{n.title}</div>
                          <div className={\`\${FINELY_OS_ENTITY_SUBLABEL}\`}>
                            {new Date(n.createdAt).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <pre className={\`mt-3 whitespace-pre-wrap text-sm leading-relaxed \${FINELY_OS_ENTITY_BODY}\`}>{n.body}</pre>
                    </div>
                  ))}
              </div>`;

const systemNotesNew = `                <div className="mt-3">
                  <button
                    type="button"
                    className={FINELY_OS_ENTITY_ACTION}
                    onClick={() => setNotesVersion((v) => v + 1)}
                    title="Refresh auto notes"
                  >
                    Refresh
                  </button>
                </div>
              </div>
              <FinelyOsPaginatedStack
                items={systemNotes}
                pageSize={6}
                emptyMessage="No auto notes yet."
                itemSpacingClassName="space-y-3"
                renderItem={(n) => (
                  <div key={\`\${n.createdAt}-\${n.title}\`} className={\`\${finelyOsInlineListItem()} p-5\`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className={\`\${FINELY_OS_ENTITY_VALUE} truncate\`}>{n.title}</div>
                        <div className={\`\${FINELY_OS_ENTITY_SUBLABEL}\`}>{new Date(n.createdAt).toLocaleString()}</div>
                      </div>
                    </div>
                    <pre className={\`mt-3 whitespace-pre-wrap text-sm leading-relaxed \${FINELY_OS_ENTITY_BODY}\`}>{n.body}</pre>
                  </div>
                )}
              />`;

if (s.includes('showAllSystemNotes')) {
  if (!s.includes(systemNotesOld.split('\n')[0])) {
    console.error('System notes block not found — manual patch may be needed.');
    process.exit(1);
  }
  s = s.replace(systemNotesOld, systemNotesNew);
}

// Manual notes — replace show-all block and map with paginated stack
s = s.replace(
  /                  \{manualNotes\.length > MANUAL_NOTES_LIMIT \? \([\s\S]*?\) : null\}\n                <\/div>\n              <\/div>\n\n              <div className="space-y-3">\n                \{manualNotes\.length === 0 \? \([\s\S]*?\) : \(\n                  manualNotes[\s\S]*?\.slice\(0, showAllManualNotes \? 999 : MANUAL_NOTES_LIMIT\)\n                    \.map\(\(n\) => \(/,
  `                </div>
              </div>

              {sortedManualNotes.length === 0 ? (
                  <div className={FINELY_OS_ENTITY_BODY}>No manual notes yet.</div>
                ) : (
                  <FinelyOsPaginatedStack
                    items={sortedManualNotes}
                    pageSize={6}
                    emptyMessage="No manual notes yet."
                    itemSpacingClassName="space-y-3"
                    renderItem={(n) => (`,
);

// Close manual notes map — find the closing of manual notes map and replace with paginated stack close
s = s.replace(
  /                      <\/div>\n                    \)\)\n                \)}\n              <\/div>\n            <\/div>\n          <\/div>\n        \)}\n\n        \{tab === 'debt'/,
  `                      </div>
                    )}
                  />
                )}
            </div>
          </div>
        )}

        {tab === 'debt'`,
);

// Debt cases
const debtOld = `              <div className="space-y-3">
                {debtCases.length > DEBT_CASES_LIMIT ? (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      className={FINELY_OS_ENTITY_ACTION}
                      onClick={() => setShowAllDebtCases((v) => !v)}
                      title={showAllDebtCases ? 'Show less' : 'Show all debt cases'}
                    >
                      {showAllDebtCases ? 'Show less' : \`Show all (\${debtCases.length})\`}
                    </button>
                  </div>
                ) : null}
                <div className="grid md:grid-cols-2 gap-3">
                  {(showAllDebtCases ? debtCases : debtCases.slice(0, DEBT_CASES_LIMIT)).map((d) => (
                    <div key={d.id} className={\`\${finelyOsInlineListItem()} p-4 flex items-center justify-between gap-4\`}>
                    <div className="min-w-0">
                      <div className={\`\${FINELY_OS_ENTITY_VALUE} truncate\`}>{d.name}</div>
                      <div className={\`\${FINELY_OS_ENTITY_SUBLABEL} mt-0.5\`}>
                        {(d.amountCents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })} · {d.type} · {d.status}
                        {d.courtCaseNumber ? \` · \${d.courtCaseNumber}\` : ''}
                      </div>
                    </div>
                    <a
                      href={\`/portal/debt/\${d.id}\`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={\`\${FINELY_OS_SECONDARY_BTN} shrink-0 text-[10px]\`}
                    >
                      View <ExternalLink size={12} />
                    </a>
                    </div>
                  ))}
                </div>
              </div>`;

const debtNew = `              <FinelyOsPaginatedStack
                items={debtCases}
                pageSize={8}
                emptyMessage="No debt cases."
                itemSpacingClassName="grid md:grid-cols-2 gap-3"
                renderItem={(d) => (
                  <div key={d.id} className={\`\${finelyOsInlineListItem()} p-4 flex items-center justify-between gap-4\`}>
                    <div className="min-w-0">
                      <div className={\`\${FINELY_OS_ENTITY_VALUE} truncate\`}>{d.name}</div>
                      <div className={\`\${FINELY_OS_ENTITY_SUBLABEL} mt-0.5\`}>
                        {(d.amountCents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })} · {d.type} · {d.status}
                        {d.courtCaseNumber ? \` · \${d.courtCaseNumber}\` : ''}
                      </div>
                    </div>
                    <a
                      href={\`/portal/debt/\${d.id}\`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={\`\${FINELY_OS_SECONDARY_BTN} shrink-0 text-[10px]\`}
                    >
                      View <ExternalLink size={12} />
                    </a>
                  </div>
                )}
              />`;

if (s.includes('showAllDebtCases') || s.includes('DEBT_CASES_LIMIT')) {
  s = s.replace(debtOld, debtNew);
}

fs.writeFileSync(filePath, s);
console.log('Patched PartnerDetailPage for paginated notes/debt + tab lanes');
