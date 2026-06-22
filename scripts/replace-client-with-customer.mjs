/**
 * Replace user-facing "client/clients" with "customer/customers".
 * Skips code identifiers, imports, attorney-client, client-side, role id 'client'.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

const EXT = new Set(['.ts', '.tsx', '.json', '.txt', '.md']);
const SKIP_DIRS = new Set(['node_modules', 'dist', '.git', '.rshot']);

const REPLACEMENTS = [
  [/Client Success Stories/g, 'Customer Success Stories'],
  [/Client Portal & Services Agreement/g, 'Customer Portal & Services Agreement'],
  [/Client Portal/g, 'Customer Portal'],
  [/Client-facing/g, 'Customer-facing'],
  [/Client threads/g, 'Customer threads'],
  [/Client dashboard/g, 'Customer dashboard'],
  [/Client Dashboard/g, 'Customer Dashboard'],
  [/Client journey/g, 'Customer journey'],
  [/Client management/g, 'Customer management'],
  [/Client files/g, 'Customer files'],
  [/Client file/g, 'Customer file'],
  [/Client profile/g, 'Customer profile'],
  [/Client name/g, 'Customer name'],
  [/Client acknowledges/g, 'Customer acknowledges'],
  [/Client idle/g, 'Customer idle'],
  [/Client vs ops/g, 'Customer vs ops'],
  [/Client \/ Partner/g, 'Customer / Partner'],
  [/Partner \(client\)/g, 'Partner (customer)'],
  [/Partner\/client/g, 'Partner/customer'],
  [/title: 'Client'/g, "title: 'Customer'"],
  [/label: 'Client'/g, "label: 'Customer'"],
  [/label: 'Clients'/g, "label: 'Customers'"],
  ["{ label: 'Client dashboard'", "{ label: 'Customer dashboard'"],
  ["{ label: 'Clients'", "{ label: 'Customers'"],
  [/primaryAction: \{ label: 'Client dashboard'/g, "primaryAction: { label: 'Customer dashboard'"],
  [/actionLabel: 'Client dashboard'/g, "actionLabel: 'Customer dashboard'"],
  [/Clients:/g, 'Customers:'],
  [/>Clients</g, '>Customers<'],
  [/option value="clients">Clients/g, 'option value="clients">Customers'],
  [/All clients/g, 'All customers'],
  [/all clients/g, 'all customers'],
  [/assigned client/g, 'assigned customer'],
  [/open a client/g, 'open a customer'],
  [/the client name/g, 'the customer name'],
  [/client name/g, 'customer name'],
  [/client portal/g, 'customer portal'],
  [/client files/g, 'customer files'],
  [/client file/g, 'customer file'],
  [/client profiles/g, 'customer profiles'],
  [/client profile/g, 'customer profile'],
  [/Run client/g, 'Run customer'],
  [/Work client/g, 'Work customer'],
  [/Work a client/g, 'Work a customer'],
  [/running client/g, 'running customer'],
  [/Operate client/g, 'Operate customer'],
  [/for each client/g, 'for each customer'],
  [/your clients/g, 'your customers'],
  [/Your clients/g, 'Your customers'],
  [/Refer clients/g, 'Refer customers'],
  [/refer clients/g, 'refer customers'],
  [/Enroll clients/g, 'Enroll customers'],
  [/enroll clients/g, 'enroll customers'],
  [/Reach clients/g, 'Reach customers'],
  [/with clients/g, 'with customers'],
  [/chasing clients/g, 'chasing customers'],
  [/new clients/g, 'new customers'],
  [/taking new clients/g, 'taking new customers'],
  [/agency client/g, 'agency customer'],
  [/Agency client/g, 'Agency customer'],
  [/before client send/g, 'before customer send'],
  [/client review/g, 'customer review'],
  [/client approval/g, 'customer approval'],
  [/client lanes/g, 'customer lanes'],
  [/client vs/g, 'customer vs'],
  [/to client profile/g, 'to customer profile'],
  [/Create a client/g, 'Create a customer'],
  [/Open a client/g, 'Open a customer'],
  [/credit repair client/g, 'credit repair customer'],
  [/Clients •/g, 'Customers •'],
  [/clients, affiliates/g, 'customers, affiliates'],
  [/workflow, clients,/g, 'workflow, customers,'],
  [/Partners are your clients/g, 'Partners are your customers'],
  [/assign you clients/g, 'assign you customers'],
  [/without a client file/g, 'without a customer file'],
  [/tied to a client file/g, 'tied to a customer file'],
  [/Join thousands of clients/g, 'Join thousands of customers'],
  [/Unlimited clients/g, 'Unlimited customers'],
  [/more seats and clients/g, 'more seats and customers'],
  [/Up to (\d+) client files/g, 'Up to $1 customer files'],
  [/Up to (\d+) active client files/g, 'Up to $1 active customer files'],
  [/(\d+) clients/g, '$1 customers'],
  [/Unlimited' : tier\.activeClientLimit\} clients/g, "Unlimited' : tier.activeClientLimit} customers"],
  [/activeClientLimit \?\? 25\} clients/g, 'activeClientLimit ?? 25} customers'],
  [/activeClientLimit\} clients/g, 'activeClientLimit} customers'],
  [/Client pays/g, 'Customer pays'],
  [/on client files/g, 'on customer files'],
  [/no client payouts/g, 'no customer payouts'],
  [/client file management/g, 'customer file management'],
  [/client restore/g, 'customer restore'],
  [/client list/g, 'customer list'],
  [/client import/g, 'customer import'],
  [/client routing/g, 'customer routing'],
  [/client threads/g, 'customer threads'],
  [/your client pays/g, 'your customer pays'],
  [/as your client pays/g, 'as your customer pays'],
  [/as clients pay/g, 'as customers pay'],
  [/Client threads/g, 'Customer threads'],
  [/Client /g, 'Customer /'],
  [/Clients /g, 'Customers '],
  [/ clients\./g, ' customers.'],
  [/ clients,/g, ' customers,'],
  [/ clients'/g, " customers'"],
  [/ clients"/g, ' customers"'],
  [/ clients /g, ' customers '],
  [/ clients\)/g, ' customers)'],
  [/ clients\?/g, ' customers?'],
  [/ clients;/g, ' customers;'],
  [/ clients</g, ' customers<'],
  [/ clients\}/g, ' customers}'],
  [/ clients`/g, ' customers`'],
  [/ clients$/gm, ' customers'],
];

function shouldSkipLine(line) {
  if (/attorney-client/i.test(line)) return true;
  if (/client-side/i.test(line)) return true;
  if (/supabaseClient|aiClient|mailerClient|tenorClient|inviteDeliveryClient|legacyImportServerClient|inHouseFinancingClient|getBlobStore|react-dom\/client/i.test(line)) return true;
  if (/activeClientLimit|sampleClientFeeCents|managedClientsCount|partner-client-journey|tour-agent-client-file|sop-agent-client-file|course-partner-client|no-clients|edge_client|agency_first_client|agency_client_import|tradeline_client|bundle_client|edge_agency_churn|client_ghost/i.test(line)) return true;
  if (/self\.clients|clientH|scrollH/i.test(line)) return true;
  if (/direct client write/i.test(line)) return true;
  if (/type OnboardingRole|ProspectTarget|'client' \|/i.test(line) && /'client'/i.test(line)) return true;
  if (/role === 'client'|role !== 'client'|role \|\| 'client'|return 'client'|id: 'client'|roleId: 'client'|roleId === 'client'|audience="client"|computeRoleWorkflowProgress\('client'/i.test(line)) return true;
  if (/target: 'clients'|value="clients"|recommendedSignupPath\('clients'\)/i.test(line)) return true;
  if (/import.*Client|from '\.\/.*Client'/i.test(line)) return true;
  if (/ClientError|createClient|QueryClient/i.test(line)) return true;
  return false;
}

function transform(content) {
  const lines = content.split('\n');
  const out = lines.map((line) => {
    if (shouldSkipLine(line)) return line;
    let next = line;
    for (const entry of REPLACEMENTS) {
      const re = entry[0] instanceof RegExp ? entry[0] : new RegExp(entry[0].replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      const rep = entry[1];
      next = next.replace(re, rep);
    }
    return next;
  });
  return out.join('\n');
}

function walk(dir, files = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(ent.name)) continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, files);
    else if (EXT.has(path.extname(ent.name))) files.push(p);
  }
  return files;
}

const targets = [
  path.join(root, 'src'),
  path.join(root, 'public', 'tours'),
];

let changed = 0;
for (const base of targets) {
  if (!fs.existsSync(base)) continue;
  for (const file of walk(base)) {
    const raw = fs.readFileSync(file, 'utf8');
    const next = transform(raw);
    if (next !== raw) {
      fs.writeFileSync(file, next, 'utf8');
      changed++;
      console.log('updated', path.relative(root, file));
    }
  }
}
console.log(`Done. ${changed} files updated.`);
