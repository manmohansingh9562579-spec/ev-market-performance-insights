# Tableau workbook and Tableau Public workflow

## Existing work preservation

The existing `Book1.twb` and `EV_Market_Performance.twb` in the user's Tableau Workbooks folder were left unchanged. A separate packaged workbook, `outputs/EV_Market_Performance_Final.twbx`, preserves the existing seven chart sheets, dashboard, and two Stories, and adds Category, Market Region, and Model Year dashboard filters. The packaged copy includes the inherited Tableau extract, which has not been independently inspected. Tableau and Flask remain separate deliverables.

## Prepare data if refreshing the workbook

No source CSV has been copied into the project. To create a fresh, Tableau-ready file without overwriting the original:

```powershell
python scripts/prepare_tableau_csv.py --input "C:/path/to/ev_market_train.csv" --output "C:/path/to/ev_market_train_tableau.csv"
```

The script removes exact duplicate rows, rejects conflicting `vehicle_id` records, and writes to the new path. It refuses to overwrite an existing output unless `--overwrite` is explicitly passed. In Tableau Desktop/Public Desktop, connect to this prepared CSV, verify the data types and row count, then create an extract (Data Source page: select Extract, then save/refresh the extract). Save a packaged workbook as `.twbx` so the extract travels with that workbook.

**Current package data caveat:** the source train CSV has one exact duplicate, and the inherited Hyper extract's rows were not independently queried. Its existing sales sums may still count the duplicate. Before treating Tableau sales as corrected or publishing, refresh/replace the workbook data source from the deduplicated CSV and verify the extract row count.

## Publish through Tableau Public Desktop

1. Open the packaged workbook in Tableau Public Desktop and confirm that all sheets, filters, and both Stories load from the extract.
2. Preview the dashboard at desktop and phone sizes; resolve layout or filter issues before publishing.
3. Use **Server → Tableau Public → Save to Tableau Public** and sign in to the Tableau Public account. Give the workbook a descriptive title and save.
4. After publication, open the view on the Tableau Public profile, use **Share → Copy Link**, and copy the view URL. Add that exact HTTPS URL to `TABLEAU_PUBLIC_URL` in `.env`, then restart Flask to show the embedded Story/dashboard section.
5. Keep the local Flask dashboard available as a separate usable view. It does not need a Tableau URL to render.

## Limitations, account, and visibility

- Tableau Public publishing requires signing in to a Tableau Public account. Tableau's official Desktop instructions support Tableau Desktop Professional and Public Edition; Desktop Free Edition cannot publish to Tableau Public.
- Tableau Public is public hosting. Published workbook and data are freely accessible to anyone; download can be enabled by default. Do not publish confidential or restricted data.
- Tableau Public supports extracts, not live data connections. It creates an extract during publication. CSV/Excel sources do not automatically refresh on Tableau Public; Google Sheets is the documented refresh exception.
- Public has a 15-million-row per-workbook limit according to Tableau's FAQ. This project has 199,999 analyzed training records after exact de-duplication, below that published limit, although file size and browser rendering still merit review.
- Tableau Public permissions and profile settings govern visibility and download options. Hiding a view from the profile does not make a known URL private.
- There is currently no published URL: the earlier save flow was canceled before publication. The Tableau Public submission remains pending the account owner's sign-in and publish action. The downloadable local `.twbx` is not a Public submission.

## Embed implementation

When `TABLEAU_PUBLIC_URL` is a valid HTTPS URL hosted by `public.tableau.com`, the Flask template loads the official Tableau Embedding API v3 and uses its `<tableau-viz>` web component. An unset/invalid URL leaves the local Chart.js dashboard fully available and omits the embed panel.

Official references:

- [Save workbooks with Tableau Public](https://help.tableau.com/current/pro/desktop/en-us/publish_workbooks_tableaupublic.htm)
- [Tableau Public FAQ](https://help.tableau.com/current/pro/desktop/en-us/public_faq.htm)
- [Basic Embedding with Embedding API v3](https://help.tableau.com/current/api/embedding_api/en-us/docs/embedding_api_basic.html)
- [About Embedding API v3](https://help.tableau.com/current/api/embedding_api/en-us/docs/embedding_api_about.html)
