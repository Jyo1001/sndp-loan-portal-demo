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
6. Sign in with:
   - **manager / demo123** (Kalady branch manager)
   - **kochi_mgr / demo123** (Kochi branch manager)
   - **jyo / demo123** (Kalady member)
   - **mariya / demo123** (Kochi member)

---

## What's new in this build

- Password reset flow with OTP delivery (displayed on-screen for the offline demo) and per-user password overrides stored locally.
- Role-aware dashboard that surfaces branch tags, branch filtering and an audit log for managers.
- Automatic monthly interest projections (1% demo rate) plus PDF statement export for any month.
- Receipt/attachment capture with mobile camera support; files live in local storage for evaluation.
- Multi-branch data model (`data/branches.json`) with per-branch account books and managers.
- Fresh JSON account datasets for each demo user plus a reusable `sample_account.json` you can clone for new members. The UI gene
rates downloadable `.zip` files containing Excel workbooks on demand.
- Local audit log viewer showing logins, exports, password resets, and document actions.

---

## What’s included

- `index.html` — Login page
- `app.html` — Portal (Profile, Account, Manager)
- `styles.css` — Simple dark theme, mobile friendly
- `data/users.json` — Users, roles, salted password hashes, profile + account dataset path
- `data/branches.json` — Branch/unit metadata for managers
- `data/accounts/*.json` — One account dataset per person (download as Excel `.zip` from the portal)
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
