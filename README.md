# SNDP Loan Portal — Demo (Static, GitHub Pages)

**⚠️ Prototype only — do not use with real personal/financial data.**  
This is a static, front‑end–only demo that works on GitHub Pages (no server).  
Logins are verified **in the browser** using salted SHA‑256 (still not secure for production).

---

## Quick start (for GitHub Pages)

1. Download the ZIP from ChatGPT and extract it.
2. Create a new GitHub repo, e.g. `sndp-loan-portal-demo`.
3. Upload the folder contents to the repo root.
4. Enable **GitHub Pages** (Settings → Pages → Deploy from branch → `main` → `/root`).
5. Visit your Pages URL (wait a minute after first deploy).
6. Sign in:
   - **Member portal** — `jyo / demo123`, `mariya / demo123`
   - **Manager cockpit** — `manager / demo123`, `kochi_mgr / demo123`

---

## What's new in this build

- Landing page glow-up with Sree Narayana Guru artwork, dual login cards, and fresh historical context pulled from public SNDP Yogam references.
- Strictly separated login flows: member credentials open the personal portal, while manager credentials unlock the command center.
- Branch intelligence dashboard with per-account cards, aggregate KPIs, and a one-click CSV export for portfolio oversight.
- Copy/paste AI prompt (ChatGPT-5 ready) that asks for ten demo members, JSON account books, and base64 `.xlsx` payloads.
- Sample Excel download backed by `data/sample_account_workbook.json`, which stores a base64 `.xlsx` generated from `data/accounts/sample_account.json`.
- Attachments, interest projections, PDF statements, and audit logging continue to work with the simplified login-only authentication (no OTP preview in this iteration).

---

## What’s included

- `index.html` — Landing page with dual logins, AI prompt helper, and sample Excel download
- `app.html` — Portal (Profile, Account, Manager with top-down view + CSV export)
- `styles.css` — Simple dark theme, mobile friendly
- `data/users.json` — Users, roles, salted password hashes, profile + account dataset path
- `data/branches.json` — Branch/unit metadata for managers
- `data/accounts/*.json` — One account dataset per person (download as Excel `.zip` or export a fresh `.xlsx` from the portal)
- `data/sample_account_workbook.json` — Base64 encoded sample workbook generated from `data/accounts/sample_account.json`
- `data/profile_photos/*.svg` — Avatars
- `README.md` + `README.html` — This help doc

The portal reads each person’s JSON dataset, renders an account table with totals, and uses [SheetJS](https://sheetjs.com/) to build Excel workbooks. Users can **download** the preserved dataset as a `.zip` (Excel inside) or **export** a new Excel snapshot (client‑side); neither action saves back to the server.

---

## Add a new member

1. Copy `data/accounts/jyo_account.json` → `data/accounts/<username>_account.json` (or start from `sample_account.json`).
2. Edit `data/users.json` and add an object like:

```json
{
  "username": "anu",
  "role": "member",
  "full_name": "Anu Example",
  "dob": "1998-05-10",
  "address": "Kalady, Kerala",
  "phone": "+91 9xxx",
  "email": "anu@example.com",
  "photo": "data/profile_photos/manager.svg",
  "account_excel": "data/accounts/anu_account.json",
  "salt": "<GENERATE>",
  "password_hash": "<SHA256(salt + password)>"
}
```

3. Commit the changes. The new user can now sign in.

### Generate more demo members automatically

On `index.html`, use the **AI prompt** card to copy a ChatGPT-5 ready instruction block. It asks the assistant to return ten ready-to-commit user entries, matching account JSON files, and base64-encoded Excel workbooks you can decode locally. After pasting the results into `data/users.json` and the `data/accounts/` folder, managers will instantly see the new members inside the portfolio dashboard.

Need a quick reference for the Excel structure? Click **Download sample Excel** on the same card — it decodes `data/sample_account_workbook.json` (pre-generated from `data/accounts/sample_account.json`) so you can inspect the expected columns immediately.

### Generate salt + password hash

- Pick a random hex salt, e.g. `python -c "import secrets;print(secrets.token_hex(8))"`  
- Compute SHA‑256 of `salt + password` and paste the hex into `password_hash`.  
  In this ZIP, we used:
  - manager: salt = `4d2fb81fdad07588`
  - jyo: salt = `7868bc771e3390b1`

> ⚠️ These demo secrets are public. Change them for any real use.

---

## How to work around “no server”

- **To update data**: open in the portal, click **Export** (Excel), then commit the new file to GitHub.
- **To accept new profiles**: ask members to export their profile Excel and send it to the manager for commit.
- **To prototype “real” saving** later: attach a backend (e.g. Firebase Auth + Firestore, Supabase, or a tiny Node/Express API) and replace `fetch('data/users.json')` with API calls.

---

## Roadmap ideas

- Real backend APIs for authentication, profile/account persistence, and secure password resets.
- Email/SMS delivery for OTP and notifications (replace the on-screen demo codes).
- Server-side audit log retention with tamper resistance and export tooling.
- Malayalam/English translation, INR formatting polish, and accessibility audits.
- Workflow automation: monthly interest posting, delinquency alerts, and statement emails.

---

## Security & privacy note

This demo places some configuration in a public repo and verifies passwords inside the browser. **This is not secure** for real deployments. For production you must add a backend with real authentication and access controls.
