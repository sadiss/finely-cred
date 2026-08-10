# Owner clicks — Roosevelt court (Jul 27)

**Roosevelt Corelus** = Midland / Citi hearing partner.  
**Yolie** = credit restore only — not the court case.

Stable partner id: `a8c3e7f1-4b2d-4e9a-9c1f-7d6e5b4a3928`  
Hearing: **2026-07-27**

---

## Why he was missing

Admin **Partners** loads from **Supabase** (`admin-list-partners` edge function), not localStorage.  
Earlier seed paths could write locally (or update with a client upsert that RLS silently blocked), so Sanz/Yolie showed but Roosevelt did not.

**Ensure Roosevelt court** now upserts via the same admin API as Create Partner / Import Partners, then refreshes the directory.

---

## Fastest path (usable now)

1. Sign in as owner/admin.
2. Open **Admin → Partners** → `http://127.0.0.1:5173/admin/partners` (or your deployed `/admin/partners`).
3. At the **top amber card**, click **Ensure Roosevelt court** (or wait — page auto-seeds him if missing).
4. Confirm he appears in the Directory (search **Roosevelt** if needed).
5. From the green banner, click **Open Litigation Command**.
6. You land on `/portal/debt?tab=litigation` **as Roosevelt** with Midland summons + Jul 27 countdown.

### Optional (Credit Letters / full parse)

7. From the same banner click **Upload HTML report** (or Admin → Roosevelt → **Reports**).
8. Upload `_import_roosevelt/Roosevelts-Report.html`.
9. Parse unlocks Credit Letters / Analysis / Disputes on his file.

### Optional (Import Partners page)

- **Admin → Partners → Import partners** → amber card **Ensure Roosevelt court → show in directory** → returns to Partner Management.

### Optional (Admin debt tools without portal)

- Banner → **Admin debt tab** → **Affidavit & Court Center**.

---

## Confirm Yolie is separate

1. Admin → Partners → search **Yolie** → open her profile.
2. She stays personal restore; she is **not** the Midland Jul 27 owner.
3. Search **Roosevelt** → separate partner row / id `a8c3e7f1-4b2d-4e9a-9c1f-7d6e5b4a3928`.

Jul 27 is **not** auto-stamped onto every partner’s debt case. Only Roosevelt’s seeded summons has it; others use the date picker or **Use Jul 27** explicitly.

---

## If Ensure fails

- Banner shows **Admin save blocked: …** (session expired, not full admin, or edge function error).
- Sign out/in as owner, retry **Ensure Roosevelt court**.
- Confirm `admin-list-partners` is deployed and your account is a full admin / can view all partners.
