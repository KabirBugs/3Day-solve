# Connect 3DaySolve to Google Sheets

This integration adds a Google Apps Script receiver that creates separate tabs for:

- `Students`
- `Businesses`
- `Projects`
- `Applications`
- `ContactMessages`
- `Feedback`
- `Newsletter`
- `SignInEvents`
- `SavedProjects`

Each row includes a timestamp, record type, common fields, and the full non-credential record as JSON.

## Setup

1. Create a new Google Sheet for 3DaySolve. Keep it private and share it only with people who need access.
2. In that spreadsheet, select **Extensions → Apps Script**.
3. Replace the starter contents of `Code.gs` with the code in this package's `Code.gs`, then save.
4. In Apps Script, select **Deploy → New deployment**.
5. Choose **Web app** as the deployment type.
6. Set **Execute as** to your account. For **Who has access**, choose the least restrictive option that still permits anonymous website visitors to submit (usually **Anyone**). This makes the write endpoint public, so use this only for a prototype or low-risk data. Public endpoints can receive spam; Google Sheets is not a production authentication system.
7. Click **Deploy**, authorize the script, and copy the Web app URL ending in `/exec`.
8. Open `app.js` in this website package and replace the empty value in `GOOGLE_SHEETS_ENDPOINT` with that URL. Example:

   ```js
   const GOOGLE_SHEETS_ENDPOINT = 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec';
   ```

9. Save the file, redeploy/update your website, and open it through your normal local server or hosting provider.
10. Submit one test student registration using dummy details. Check that a `Students` tab and a new row appear in the spreadsheet. Repeat for project, application, contact, feedback, and newsletter forms.

## Important limitations

- The website sends a copy of each submission to Sheets and continues to use `localStorage` for its current dashboard and navigation behaviour. The Apps Script endpoint is write-only; it does not load central records back into the website. Therefore, this step does **not** yet make profiles, sign-in, or project listings work across devices.
- The current sign-in screen is a prototype that identifies profiles by email on the same browser. It is not secure authentication. Do not use this for real account access or private student/business dashboards.
- Never collect or store passwords, authentication tokens, identity documents, bank details, or payment credentials in this sheet. The receiver strips fields with credential-like names as a safety precaution, but the frontend should not send them in the first place.
- The frontend uses a cross-origin `no-cors` request so a static site can send data to Apps Script. Browsers do not expose the response body/status in this mode. A resolved request means the browser sent the request, **not** that the row is guaranteed to have been written. Verify the first test in the Sheet and check Apps Script's Executions page if it does not appear.
- Do not put passwords or private API keys in `app.js`. The Apps Script URL is public by design for this prototype.
- For a production marketplace with real accounts, private applications, role permissions, and shared project listings, use a proper authentication provider and a server-side database. Google Sheets can remain an admin export/reporting destination.
