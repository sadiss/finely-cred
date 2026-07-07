# Nora Capital Group — Inbound API Implementation Handoff

**Paste this entire document into your Nora Capital Group (`noracapitalgroupllc`) Cursor chat.**  
Finely Cred (outbound) is already built on branch `preview/sitewide-ux-pack-merge`. Nora side is **your** work in the **Nora repo only** — do not mix Finely Cred files.

---

## What Finely Cred sends you

When a partner is fund-ready, Finely Cred **POSTs** to your gateway:

```
POST {NORA_CAPITAL_BASE_URL}/v1/partners/finelycred/webhook
```

### Headers

| Header | Value |
|--------|--------|
| `Content-Type` | `application/json` |
| `X-FinelyCred-Signature` | Shared secret (same as `FINELY_CRED_WEBHOOK_SECRET`) |
| `X-Webhook-Secret` | Same secret (alternate header) |
| `X-FinelyCred-Version` | `6` |
| `X-Idempotency-Key` | `dossier_{partnerId}_{timestamp}` — dedupe retries |

### Event

```json
{
  "event": "finelycred.dossier_exported",
  "type": "finelycred.dossier_exported",
  "clientId": "nora_firebase_uid_or_partner_id",
  "client_id": "…",
  "externalId": "…",
  "partnerId": "partner_abc123",
  "phase": "fund_ready",
  "version": 6,
  "exportedAt": "2026-07-07T12:00:00.000Z",
  "data": {
    "summary": { },
    "brief": { },
    "dossier": { }
  }
}
```

---

## `data.summary` (CRM card — store on profile)

```json
{
  "exportId": "dossier_partner_abc_1720000000000",
  "partnerId": "partner_abc123",
  "externalId": "laravel_uid_or_null",
  "exportedAt": "2026-07-07T12:00:00.000Z",
  "version": 6,
  "readinessScore": 72,
  "fundingVerdict": "ready",
  "lenderVerdict": "approve_track",
  "creditPhase": "fund_ready",
  "headline": "Fund-ready — NCG can advance to Bridge underwriting with full credit dossier.",
  "doThisNext": [
    "Submit Nora Capital underwriting review",
    "Complete LEG-201 consent scope"
  ],
  "scorecard": {
    "credit": 78,
    "disputes": 65,
    "documents": 70,
    "identity": 85,
    "debt": 80,
    "overall": 74
  },
  "keyMetrics": {
    "readinessScore": 72,
    "tradelineTotal": 24,
    "negativeCount": 5,
    "avgScore": 685
  },
  "complianceScore": 71,
  "exportReady": true,
  "blockers": [],
  "estimatedWeeksToFundable": 6
}
```

### CRM profile fields to patch (`registry` + `crmClients`)

| Field | Source |
|-------|--------|
| `finelyCredSyncedAt` | `exportedAt` |
| `finelyCredDossierAt` | `exportedAt` |
| `finelyCredDossierExportId` | `summary.exportId` |
| `fundingReadinessScore` | `summary.readinessScore` |
| `fundingReadinessVerdict` | `summary.fundingVerdict` |
| `lenderReadinessVerdict` | `summary.lenderVerdict` |
| `finelyCredDossierHeadline` | `summary.headline` |
| `finelyCredDossierSummary` | full `summary` object |
| `finelyCredDossierBrief` | `data.brief` |
| `complianceScore` | `summary.complianceScore` |
| `doThisNext` | `summary.doThisNext` |
| `estimatedWeeksToFundable` | `summary.estimatedWeeksToFundable` |
| `finelyCredPhase` / `creditPhase` | `dossier.creditProgram.phase` |

When `fundingVerdict === "ready"` OR `lenderVerdict === "approve_track"`:

- Set `bridgeHandoffSuggestedAt`
- Set `bridgeHandoffReason`: `finely_cred_dossier_ready`
- Call existing `ensureFundReadyBridgeTasks(db, appId, clientId)`

---

## `data.brief` (executive one-screen)

```json
{
  "partnerName": "Jane Doe",
  "email": "jane@example.com",
  "headline": "…",
  "verdict": "ready",
  "readinessScore": 72,
  "creditPhase": "fund_ready",
  "fundingStage": "submitted",
  "topBlockers": [],
  "topWins": ["Tri-bureau report on file…"],
  "doThisNext": ["…"],
  "scorecard": { "credit": 78, "disputes": 65, "documents": 70, "identity": 85, "debt": 80, "overall": 74 },
  "lenderSnapshot": {
    "avgScore": 685,
    "negativeCount": 5,
    "positiveCount": 19,
    "utilizationPct": 28,
    "inquiries90d": 2,
    "exportGateOpen": true
  },
  "counts": { "reports": 1, "letters": 3, "evidence": 8, "cases": 2, "debtSignals": 0 }
}
```

---

## `data.dossier` — full v6 sections

| Section | Contents |
|---------|----------|
| `identity` | Name, email, phone, lane, journey/funding stage, mailing address |
| `readiness` | Score, blockers, verdict (`ready` / `conditional` / `not_ready`) |
| `creditProgram` | Phase, export gate, dispute posture, guided next steps |
| `credit` | Scores, tradelines (+/- by category), utilization, inquiries, public records, identity check |
| `disputes` | Cases, letters, rounds summary |
| `debt` | Collections from report, bankruptcy public records, debt signals |
| `evidence` | Classified vault docs (identity, income, bureau response, etc.) |
| `documents` | Report index + letter PDF refs |
| `creditorContacts` | Parsed creditor addresses/phones for letters |
| `disputeCandidates` | Auto-detected negatives for Round 1–N |
| `mlAdvisory` | Executive summary, funding path, dispute strategy |
| `lenderReadiness` | Verdict, strengths, risks, recommended products, weeks estimate |
| `compliance` | Checklist items + `exportReady` boolean |
| `timeline` | Chronological: reports, letters, cases, evidence, auth, funding |
| `workTasks` | Open Bridge/restore tasks |
| `authActivity` | Signup/login milestones |
| `nextSteps` | Prioritized actions with owner, lane, priority, due days |
| `resultsSummary` | Headline, key metrics, wins, blockers |
| `underwritingPacketV2` | Bridge-compatible packet |

---

## Nora repo — files to implement / extend

### 1. `functions/finelyCredAdapter.js`

- Add `finelycred.dossier_exported` to `FINELY_CRED_EVENTS`
- Extend `buildProfilePatchFromEvent()` for dossier fields (table above)
- Add `buildDossierFirestoreDoc(normalized)` → shape for Firestore

### 2. `functions/index.js` — webhook handler

Route: `POST /v1/partners/finelycred/webhook` (already exists)

On `finelycred.dossier_exported`:

1. Validate signature (`FINELY_CRED_WEBHOOK_SECRET`)
2. Log to `finelyCredEvents` collection (existing)
3. Patch `users/{clientId}/profile/registry` + `crmClients/{clientId}`
4. **Persist full dossier** → `public/data/finelyCredDossiers/{exportId}`
5. If fund-ready → bridge handoff + `ensureFundReadyBridgeTasks`

### 3. NEW — retrieval routes (auth required)

```
GET /v1/partners/finelycred/dossiers?clientId=&partnerId=&limit=20
GET /v1/partners/finelycred/dossiers/:exportId
```

Return `{ ok: true, dossier: { id, summary, brief, dossier, lenderReadiness, … } }`

### 4. Firestore document shape (`finelyCredDossiers/{exportId}`)

```json
{
  "exportId": "dossier_partner_abc_1720000000000",
  "partnerId": "partner_abc123",
  "clientId": "firebase_uid",
  "version": 6,
  "receivedAt": "ISO",
  "summary": { },
  "brief": { },
  "dossier": { },
  "lenderReadiness": { },
  "nextSteps": [],
  "resultsSummary": { },
  "compliance": { },
  "creditSnapshot": {
    "reportCount": 1,
    "avgScore": 685,
    "tradelineTotal": 24,
    "negativeCount": 5,
    "positiveCount": 19,
    "utilizationPct": 28
  }
}
```

### 5. UI (optional but recommended)

- CRM panel: show `finelyCredDossierBrief` scorecard + `doThisNext`
- Integration Hub: link to dossier by `exportId`
- Bridge tab: lender verdict badge

### 6. Docs

Update `docs/FINELY_CRED_API.md` with dossier event + GET routes.

---

## Finely Cred pulls (Nora calls Finely — already live)

Finely exposes **inbound pull** via Supabase edge function:

```
POST https://{FINELY_SUPABASE}/functions/v1/finely-partner-api
Header: x-finely-partner-api-key: {key}
```

| Action | Purpose |
|--------|---------|
| `partner.funding_brief` | Fast CRM snapshot |
| `partner.funding_dossier_v6` | Full file (`sections: "full"` or subset) |
| `partner.funding_queue` | Ops batch list |
| `api.playbook` | Human-readable action guide |

Full Finely-side docs: `docs/NORA_CAPITAL_API.md` in **finely-cred** repo.

---

## Secrets (both sides must match)

| Finely Cred (Supabase secrets) | Nora (gateway env) |
|----------------------------------|---------------------|
| `NORA_CAPITAL_BASE_URL` | Gateway public URL |
| `FINELY_CRED_WEBHOOK_SECRET` | `FINELY_CRED_WEBHOOK_SECRET` |
| `FINELY_PARTNER_API_KEYS_JSON` | Nora uses key to pull from Finely |

---

## Test checklist (Nora side)

1. `POST /v1/partners/finelycred/webhook` with sample `finelycred.dossier_exported` + valid signature → `200 { ok: true, eventId }`
2. Firestore `finelyCredDossiers/{exportId}` document created
3. `crmClients/{clientId}` shows `fundingReadinessScore`, `doThisNext`, `lenderReadinessVerdict`
4. Fund-ready dossier → `bridgeHandoffSuggestedAt` + bridge tasks created
5. `GET /v1/partners/finelycred/dossiers/:exportId` returns stored dossier
6. Idempotent retry with same `X-Idempotency-Key` does not duplicate tasks

---

## Sample minimal webhook body (for smoke test)

```json
{
  "event": "finelycred.dossier_exported",
  "clientId": "TEST_CLIENT_UID",
  "partnerId": "partner_test",
  "phase": "fund_ready",
  "version": 6,
  "exportedAt": "2026-07-07T12:00:00.000Z",
  "data": {
    "summary": {
      "exportId": "dossier_test_001",
      "partnerId": "partner_test",
      "readinessScore": 75,
      "fundingVerdict": "ready",
      "lenderVerdict": "approve_track",
      "headline": "Test dossier",
      "doThisNext": ["Review in Bridge"],
      "complianceScore": 80,
      "exportReady": true
    },
    "brief": {
      "partnerName": "Test Partner",
      "verdict": "ready",
      "readinessScore": 75,
      "doThisNext": ["Review in Bridge"]
    },
    "dossier": {
      "version": 6,
      "exportId": "dossier_test_001",
      "partnerId": "partner_test",
      "creditProgram": { "phase": "fund_ready", "exportGateOpen": true }
    }
  }
}
```

---

## Repo separation rule

| Repo | Remote | Branch |
|------|--------|--------|
| **finely-cred** | `github.com/sadiss/finely-cred` | `preview/sitewide-ux-pack-merge` |
| **noracapitalgroupllc** | `github.com/sadiss/noracapitalgroupllc` | same branch name |

**Do not** copy Finely edge functions into Nora repo or vice versa.
