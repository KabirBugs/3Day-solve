# 3DaySolve

3DaySolve is a responsive marketplace experience for focused student-to-business projects. The current workspace contains a dependency-free browser prototype so it can be previewed immediately without installing a framework or package manager.

## Run locally

From PowerShell:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\serve.ps1
```

Then open <http://localhost:4173/>.

## Included now

- Premium responsive landing page with branded motion, reduced-motion support, mobile navigation, scroll reveals, and loading state.
- Light and dark themes with persistent browser preference, 3D logo treatment, animated diagram blocks, and interactive motion effects.
- Solver Bot helper with quick prompts and built-in answers about tasks, applications, payments, commission, privacy, forms, and workflow.
- Explore Projects board with search, category filtering, sorting, project detail pages, save/share actions, and project reference numbers.
- Student and business registration flows with client-side validation and local dashboard routing.
- Project submission and student application flows with duplicate-application protection.
- Contact, feedback, and newsletter forms with local persistence and reference numbers.
- Official Google Forms handoff links for student registration, business registration, project submissions, contact, feedback, and newsletter forms.
- Optional Google Sheets integration through the included Google Apps Script receiver (`Code.gs`) for profile records, projects, applications, contact messages, feedback, newsletter subscriptions, sign-in events, and saved-project events.
- Student, business, and local admin overview surfaces.
- Centralized 15% commission calculation with the required ₹500 / ₹1,000 / ₹2,000 / ₹5,000 / ₹10,000 examples on the commission page.
- Privacy, terms, about, and commission pages that avoid claiming payment processing or verified external delivery.

## Google Sheets integration setup

See `GOOGLE-SHEETS-SETUP.md` for the complete setup. In brief: create a private Google Sheet, paste `Code.gs` into its Apps Script project, deploy it as a Web app, copy the `/exec` URL into `GOOGLE_SHEETS_ENDPOINT` near the top of `app.js`, then redeploy the website. The Apps Script creates separate tabs for student/business profiles, projects, applications, contact, feedback, newsletter, sign-in events, and saved-project events.

## Important limitations before production

- The site keeps `localStorage` for the current dashboard and navigation experience. The Sheets receiver stores central copies of submissions, but it does not load central records back into the site. This does not yet provide cross-device sign-in or shared project listings.
- Sign-in is currently a local prototype that recognizes an email in the same browser; it is not secure authentication. Do not use this setup for real private accounts, passwords, payment data, or identity documents.
- A public Apps Script web app endpoint can be spammed. Keep the spreadsheet private, verify test submissions, and use this integration for a prototype/low-risk collection only. For a real marketplace, add a proper authentication provider and server-side database with role-based access controls.
- Browser requests use `no-cors`, so the site cannot read Apps Script's response status. Verify successful writes in the spreadsheet and Apps Script's Executions panel during testing.
- The UI currently calculates commission only; it does not collect payments or issue payouts.
