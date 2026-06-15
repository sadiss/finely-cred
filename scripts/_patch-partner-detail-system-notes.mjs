#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const filePath = path.join(root, 'src/pages/admin/PartnerDetailPage.tsx');
let s = fs.readFileSync(filePath, 'utf8');

const oldBlock = `                <div className="mt-3">
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
                          <div className={\`mt-1 \${FINELY_OS_ENTITY_SUBLABEL}\`}>
                            {new Date(n.createdAt).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <pre className={\`mt-3 whitespace-pre-wrap text-sm leading-relaxed \${FINELY_OS_ENTITY_BODY}\`}>{n.body}</pre>
                    </div>
                  ))}
              </div>`;

const newBlock = `                <div className="mt-3">
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
                        <div className={\`mt-1 \${FINELY_OS_ENTITY_SUBLABEL}\`}>{new Date(n.createdAt).toLocaleString()}</div>
                      </div>
                    </div>
                    <pre className={\`mt-3 whitespace-pre-wrap text-sm leading-relaxed \${FINELY_OS_ENTITY_BODY}\`}>{n.body}</pre>
                  </div>
                )}
              />`;

if (!s.includes(oldBlock)) {
  console.error('System notes block not found');
  process.exit(1);
}

s = s.replace(oldBlock, newBlock);
fs.writeFileSync(filePath, s);
console.log('Fixed system notes pagination');
