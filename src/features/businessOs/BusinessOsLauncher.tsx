import { useMemo, useState, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { captionDraft } from '../commandIntelligence/commandRouter';
import { runCommand } from '../commandIntelligence/commandRunner';
import { warmPartnerRows } from '../commandIntelligence/warmPartners';
import { PartnerEmailDesk } from '../partnerEmailDesk/PartnerEmailDesk';
import './businessOs.css';
import {
  listKeySlots,
  listOtherBusinesses,
  listQaChecks,
  listVaultDocs,
  noraHandoffUrl,
  readBrandLinks,
  rememberKeyRef,
  saveBrandLinks,
  saveOtherBusiness,
  saveVaultDoc,
  toggleQaCheck,
  type KeySlot,
  type OtherBusiness,
  type QaCheck,
  type VaultDoc,
} from './businessOsStore';

type View =
  | 'home'
  | 'finely'
  | 'nora'
  | 'jireh'
  | 'clients'
  | 'vault'
  | 'tools'
  | 'brief'
  | 'drafts'
  | 'captions';

const FINELY_LINKS = [
  { to: '/admin/courses', label: 'Courses' },
  { to: '/admin/marketing-desk', label: 'Marketing Desk' },
  { to: '/admin/partners', label: 'Partners' },
  { to: '/pricing/business-credit', label: 'Business credit journey' },
  { to: '/admin', label: 'Command Intelligence' },
] as const;

const CAPTION_TOPICS = ['This week’s credit step', 'Book a session', 'Document checklist', 'Partner win, no score promise'];

export function BusinessOsLauncher({ active }: { active: boolean }) {
  const [open, setOpen] = useState(false);
  if (!active) return null;
  return (
    <>
      <button type="button" className="fc-bos-orb" aria-label="Open Business OS" onClick={() => setOpen(true)}>
        <img src="/brand/finely-cred-icon.svg" alt="" />
      </button>
      {open ? createPortal(<BusinessOsPortal onClose={() => setOpen(false)} />, document.body) : null}
    </>
  );
}

function BusinessOsPortal({ onClose }: { onClose: () => void }) {
  const [view, setView] = useState<View>('home');
  return (
    <div className="fc-bos" role="dialog" aria-modal="true" aria-label="Business OS">
      <div className="fc-bos-inner">
        <div className="fc-bos-top">
          <div className="fc-bos-brand">
            <img src="/brand/finely-cred-icon.svg" alt="" />
            <div>
              <p className="fc-bos-kicker">Start here</p>
              <h1>Business OS</h1>
            </div>
          </div>
          <button type="button" className="fc-bos-close" onClick={onClose}>Close</button>
        </div>
        <p className="fc-bos-lead">One icon. Your companies, docs, and free tools. First click works with demos. Nothing emails anyone unless you approve it.</p>
        {view === 'home' ? <Home onOpen={setView} onClose={onClose} /> : <Back onBack={() => setView('home')} />}
        {view === 'finely' ? <FinelyRoom onClose={onClose} /> : null}
        {view === 'nora' ? <NoraRoom /> : null}
        {view === 'jireh' ? <JirehRoom /> : null}
        {view === 'clients' ? <ClientsRoom /> : null}
        {view === 'vault' ? <VaultRoom /> : null}
        {view === 'tools' ? <ToolsRoom /> : null}
        {view === 'brief' ? <BriefRoom /> : null}
        {view === 'drafts' ? <DraftRoom /> : null}
        {view === 'captions' ? <CaptionRoom /> : null}
      </div>
    </div>
  );
}

function Back({ onBack }: { onBack: () => void }) {
  return (
    <div>
      <button type="button" className="fc-bos-ink" onClick={onBack}>Back to businesses</button>
    </div>
  );
}

function Home({ onOpen, onClose }: { onOpen: (view: View) => void; onClose: () => void }) {
  return (
    <>
      <div className="fc-bos-strip" aria-label="Start here">
        <button type="button" onClick={() => onOpen('finely')}>Finely Cred</button>
        <button type="button" onClick={() => onOpen('brief')}>Morning brief</button>
        <button type="button" onClick={() => onOpen('drafts')}>Partner drafts</button>
        <button type="button" onClick={() => onOpen('captions')}>Caption pack</button>
        <button type="button" onClick={() => onOpen('tools')}>Free power tools</button>
      </div>
      <div className="fc-bos-grid">
        <button type="button" className="fc-bos-tile fc-bos-finely" onClick={() => onOpen('finely')}>
          <strong>Finely Cred</strong>
          <span>Courses, Marketing Desk, partners, business credit, and Command Intelligence.</span>
        </button>
        <button type="button" className="fc-bos-tile fc-bos-nora" onClick={() => onOpen('nora')}>
          <strong>Nora Capital</strong>
          <span>{noraHandoffUrl() ? 'Open the Nora handoff.' : 'Open-Nora checklist until a URL is saved.'}</span>
        </button>
        <button type="button" className="fc-bos-tile fc-bos-jireh" onClick={() => onOpen('jireh')}>
          <strong>Jireh Profits</strong>
          <span>Separate company. Trading and EA headquarters is the next build.</span>
        </button>
        <button type="button" className="fc-bos-tile fc-bos-plain" onClick={() => onOpen('clients')}>
          <strong>Client businesses</strong>
          <span>Name, notes, and a docs-folder link. Stored on this browser.</span>
        </button>
        <button type="button" className="fc-bos-tile fc-bos-plain" onClick={() => onOpen('vault')}>
          <strong>Docs & Keys</strong>
          <span>Document links and masked key slots. Full secrets are not kept.</span>
        </button>
        <button type="button" className="fc-bos-tile fc-bos-plain" onClick={() => onOpen('tools')}>
          <strong>Free power tools</strong>
          <span>Maps, weather, census, banks, YouTube quota, Zoho, nightly QA.</span>
        </button>
      </div>
      <p className="fc-bos-lead">Command Intelligence also sits on the admin home. <Link to="/admin" onClick={onClose}>Go there</Link>.</p>
    </>
  );
}

function FinelyRoom({ onClose }: { onClose: () => void }) {
  return (
    <section className="fc-bos-grid">
      {FINELY_LINKS.map((item) => (
        <Link key={item.to} to={item.to} className="fc-bos-tile fc-bos-finely" onClick={onClose}>
          <strong>{item.label}</strong>
          <span>Open inside Finely Cred.</span>
        </Link>
      ))}
    </section>
  );
}

function NoraRoom() {
  const [localUrl, setLocalUrl] = useState(readBrandLinks().noraUrl);
  const [savedUrl, setSavedUrl] = useState(noraHandoffUrl);
  const steps = [
    'Ask your dev to set VITE_NORA_CAPITAL_URL, or paste the public Nora site below.',
    'Do not paste the Nora API key into this screen. Keys stay in server secrets.',
    'When a URL is present, Open Nora leaves Finely and opens that site.',
  ];
  return (
    <section className="fc-bos-panel">
      <h2>Nora Capital</h2>
      <p>Handoff only. Nora is not restyled as Finely.</p>
      {savedUrl ? (
        <a href={savedUrl} target="_blank" rel="noreferrer">Open Nora</a>
      ) : (
        <ol>
          {steps.map((step) => <li key={step}>{step}</li>)}
        </ol>
      )}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const next = saveBrandLinks({ noraUrl: localUrl.trim() });
          const fromEnv = String(import.meta.env.VITE_NORA_CAPITAL_URL || '').trim();
          setSavedUrl(fromEnv || next.noraUrl.trim());
        }}
      >
        <input value={localUrl} onChange={(event) => setLocalUrl(event.target.value)} placeholder="https://nora.example" aria-label="Nora public URL" />
        <button className="fc-bos-gold" type="submit">Save Nora link</button>
      </form>
    </section>
  );
}

function JirehRoom() {
  const links = readBrandLinks();
  const [site, setSite] = useState(links.jirehSite);
  const [docs, setDocs] = useState(links.jirehEaDocs);
  return (
    <section className="fc-bos-panel">
      <div className="fc-bos-brand">
        <div className="fc-bos-jireh-mark" aria-hidden>JP</div>
        <div>
          <p className="fc-bos-kicker">Separate company</p>
          <h2>Jireh Profits</h2>
        </div>
      </div>
      <p>Status: next build. This room holds the trading and EA headquarters until that product exists. It does not share Finely courses or Nora capital files.</p>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          saveBrandLinks({ jirehSite: site.trim(), jirehEaDocs: docs.trim() });
        }}
      >
        <input value={site} onChange={(event) => setSite(event.target.value)} placeholder="Jireh site URL" aria-label="Jireh site URL" />
        <input value={docs} onChange={(event) => setDocs(event.target.value)} placeholder="EA docs URL" aria-label="EA docs URL" />
        <button className="fc-bos-gold" type="submit">Save link slots</button>
      </form>
      {site ? <a href={site} target="_blank" rel="noreferrer">Open Jireh site</a> : <p>Site slot is empty.</p>}
      {docs ? <a href={docs} target="_blank" rel="noreferrer">Open EA docs</a> : <p>EA docs slot is empty.</p>}
    </section>
  );
}

function ClientsRoom() {
  const [rows, setRows] = useState<OtherBusiness[]>(() => listOtherBusinesses());
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [docsUrl, setDocsUrl] = useState('');
  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    saveOtherBusiness({ name, notes, docsUrl });
    setRows(listOtherBusinesses());
    setName('');
    setNotes('');
    setDocsUrl('');
  }
  return (
    <section className="fc-bos-panel">
      <h2>Client and other businesses</h2>
      <form onSubmit={onSubmit}>
        <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Business name" aria-label="Business name" />
        <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} placeholder="Notes" aria-label="Notes" />
        <input value={docsUrl} onChange={(event) => setDocsUrl(event.target.value)} placeholder="Docs folder link" aria-label="Docs folder link" />
        <button className="fc-bos-gold" type="submit">Add business</button>
      </form>
      {rows.length === 0 ? <p>No other businesses yet. Add a name to start.</p> : null}
      {rows.map((row) => (
        <div className="fc-bos-row" key={row.id}>
          <div>
            <strong>{row.name}</strong>
            <p>{row.notes || 'No notes.'}</p>
            {row.docsUrl ? <a href={row.docsUrl} target="_blank" rel="noreferrer">Docs folder</a> : null}
          </div>
        </div>
      ))}
    </section>
  );
}

function VaultRoom() {
  const [docs, setDocs] = useState<VaultDoc[]>(() => listVaultDocs());
  const [slots, setSlots] = useState<KeySlot[]>(() => listKeySlots());
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [pasted, setPasted] = useState<Record<string, string>>({});
  return (
    <section className="fc-bos-grid">
      <div className="fc-bos-panel">
        <h2>Documents</h2>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (!title.trim()) return;
            saveVaultDoc({ title, url, note: '' });
            setDocs(listVaultDocs());
            setTitle('');
            setUrl('');
          }}
        >
          <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Document name" aria-label="Document name" />
          <input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="Link" aria-label="Document link" />
          <button className="fc-bos-gold" type="submit">Add document</button>
        </form>
        {docs.length === 0 ? <p>No documents yet.</p> : null}
        {docs.map((doc) => (
          <div key={doc.id} className="fc-bos-row">
            <span>{doc.title}</span>
            {doc.url ? <a href={doc.url} target="_blank" rel="noreferrer">Open</a> : <span>No link</span>}
          </div>
        ))}
      </div>
      <div className="fc-bos-panel">
        <h2>Key slots</h2>
        <p>Paste a secret to store the last 4 characters only. Put the real value in server env, never in git.</p>
        {slots.map((slot) => (
          <form
            key={slot.id}
            onSubmit={(event) => {
              event.preventDefault();
              setSlots(rememberKeyRef(slot.id, pasted[slot.id] || ''));
              setPasted((current) => ({ ...current, [slot.id]: '' }));
            }}
          >
            <strong>{slot.label}</strong>
            <p>{slot.envName} · {slot.last4 ? `saved ••••${slot.last4}` : 'empty'}</p>
            <input
              type="password"
              value={pasted[slot.id] || ''}
              onChange={(event) => setPasted((current) => ({ ...current, [slot.id]: event.target.value }))}
              placeholder="Paste, then save the mask"
              aria-label={slot.label}
              autoComplete="off"
            />
            <button className="fc-bos-ink" type="submit">Save mask</button>
          </form>
        ))}
      </div>
    </section>
  );
}

function ToolsRoom() {
  const [query, setQuery] = useState('weather Miami');
  const [output, setOutput] = useState('Pick a tool or type a plain ask. Empty keys stay honest.');
  const [busy, setBusy] = useState(false);
  const tools = [
    ['Find places', 'find partners in Miami'],
    ['YouTube quota', 'youtube credit education'],
    ['Census corridor', 'census FL'],
    ['FDIC and NCUA', 'banks FL'],
    ['Open-Meteo', 'weather Miami'],
    ['Zoho draft', 'draft partner email'],
  ] as const;
  async function run(text: string) {
    setBusy(true);
    setQuery(text);
    try {
      const result = await runCommand(text);
      setOutput(`${result.title}\n${result.body}`);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="fc-bos-panel">
      <h2>Free power tools</h2>
      <div className="fc-bos-chips">
        {tools.map(([label, text]) => (
          <button key={label} type="button" onClick={() => run(text)}>{label}</button>
        ))}
      </div>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void run(query);
        }}
      >
        <input value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Tool ask" />
        <button className="fc-bos-gold" type="submit" disabled={busy}>{busy ? 'Working' : 'Run'}</button>
      </form>
      <p style={{ whiteSpace: 'pre-wrap' }}>{output}</p>
      <QaList />
    </section>
  );
}

function QaList() {
  const [rows, setRows] = useState<QaCheck[]>(() => listQaChecks());
  return (
    <div>
      <h2>Nightly QA</h2>
      {rows.map((row) => (
        <label key={row.id} className="fc-bos-row">
          <span>{row.label}</span>
          <input type="checkbox" checked={row.done} onChange={() => setRows(toggleQaCheck(row.id))} />
        </label>
      ))}
    </div>
  );
}

function BriefRoom() {
  const warm = useMemo(() => warmPartnerRows(4), []);
  const today = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
  return (
    <section className="fc-bos-panel">
      <p className="fc-bos-kicker">Morning brief</p>
      <h2>{today}</h2>
      <p>Local only. This chip does not email or post.</p>
      {warm.length === 0 ? <p>No warm partner files on this browser yet.</p> : null}
      {warm.map((row) => (
        <div key={row.id} className="fc-bos-row">
          <span><strong>{row.name}</strong> — {row.next}</span>
        </div>
      ))}
    </section>
  );
}

function DraftRoom() {
  return (
    <section className="fc-bos-panel">
      <PartnerEmailDesk />
    </section>
  );
}

function CaptionRoom() {
  return (
    <section className="fc-bos-panel">
      <h2>Social caption pack</h2>
      <p>Copy lives here. Nothing posts to a network.</p>
      {CAPTION_TOPICS.map((topic) => (
        <div key={topic}>
          <strong>{topic}</strong>
          <p style={{ whiteSpace: 'pre-wrap' }}>{captionDraft(topic)}</p>
        </div>
      ))}
    </section>
  );
}
