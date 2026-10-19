# Tableau workbook and Tableau Public workflow

## Existing workbook preservation

The original `Book1.twb` and `EV_Market_Performance.twb` files in the Tableau Workbooks folder were left unchanged. Other local packaged workbook versions under `outputs/` were also retained.

The current public workbook is `EV_Market_Performance_Rating_Corrected`, published as a separate copy from Tableau Public Desktop 2026.2. It preserves seven chart worksheets, the dashboard and two Stories, with six KPI cards for manufacturer count, EV models, annual sales, average rating, driving range and battery capacity. The overlap pass shortened category labels, reduced long manufacturer and range headers, removed crowded value labels from two bar charts, and changed the manufacturing map from point marks to green filled country shapes. The rating card is corrected to 4.09 to match the verified 4.088754 train-split mean. The earlier Overlap Fixed, Green Executive Refresh and Public Ready Clean vizzes have been removed from the public profile; this corrected workbook is the remaining published viz. Original source workbooks remain untouched. The `.twbx` packages and prepared CSV are kept outside this source repository because they contain the dataset.

The prepared source `ev_market_train_tableau.csv` has 199,999 rows and 37 columns after removing the single exact duplicate from the 200,000-row train CSV. The source CSV was not modified. The workbook's embedded Hyper extract was generated from this prepared file; Tableau's data preview showed 37 fields and 199,999 rows before saving. The package also contains a text connection pointing to the prepared CSV's local output-folder path for refresh. When moving the workbook to another computer, use the embedded extract for viewing; reconnect to a local copy of the prepared CSV if refreshing.

## Re-create or refresh the Tableau data

The original train CSV remains in the local Downloads archive and is not included in this project or its GitHub repository. Create a separate Tableau-ready CSV without overwriting the original:

```powershell
python scripts/prepare_tableau_csv.py --input "C:/path/to/ev_market_train.csv" --output "C:/path/to/ev_market_train_tableau.csv"
```

The script removes exact duplicate rows, rejects conflicting `vehicle_id` records, and refuses to overwrite an existing output unless `--overwrite` is explicitly supplied. To prepare from the configured local SQLite table instead of a CSV, run:

```powershell
python scripts/prepare_tableau_csv.py --from-database --table ev_market_train --output "C:/path/to/ev_market_train_tableau.csv"
```

The database export uses the local SQLite `DATABASE_URL` and a validated table name. It creates a local file for Tableau's packaged extract; it does not publish a live database connection. In Tableau Desktop/Public Desktop, connect to that prepared CSV, check field types and row count, select **Extract** on the Data Source page, and refresh. Save a new packaged workbook (`.twbx`) so the extract travels with it. Keep the previous workbook versions until the refreshed copy has been checked.

## Publish through Tableau Public Desktop

Tableau Public workbooks can expose downloadable workbook data; publishing is a public redistribution of the embedded extract. During this session, the dataset owner confirmed they checked the Kaggle dataset terms and authorized public publication. The assistant could not independently read the dataset-specific license statement, so this records the owner's confirmation rather than independent license verification.

After the owner's license confirmation:

1. Open the local `EV_Market_Performance_Overlap_Fixed_2026-10-18_Rating_Corrected.twbx` in Tableau Public Desktop. Confirm the extract is available and the dashboard, corrected rating KPI, seven chart sheets, filters, and both Stories load.
2. Review the dashboard at desktop and phone sizes. Check filter behavior and verify the sales total against the deduplicated source if you use the total in a submission.
3. In Tableau Public Desktop, choose **File → Save to Tableau Public**, then sign in to the Tableau Public account. Review the workbook title and public visibility before completing the upload.
4. When publishing a future update, save it as a new Tableau Public view, then update the Tableau URLs in `docs/site/app.js`, `docs/site/index.html`, `README.md`, and the Flask environment values. Verify Dashboard 1 and Story 2 before considering the refresh complete.
5. To show the full dashboard inside Flask, set `TABLEAU_PUBLIC_URL` to the Dashboard 1 URL in a local `.env` file and restart Flask. The app converts Tableau Public profile share links (`/app/profile/.../viz/...`) into `/views/<workbook>/<view>` and adds literal `:showVizHome=no` and `:embed=true` query keys, so Tableau serves the view directly inside the frame. If the variable is unset, the local Flask dashboard continues to work without an embed.

The current rating-corrected workbook is public on the account owner's Tableau Public profile. Do not enter a password into the Flask project or commit `.env`.

## Tableau Public limits and visibility

- Tableau Public requires a signed-in Tableau Public account. A workbook saved locally is not a Tableau Public submission.
- Tableau Public is public hosting. Published workbook and data may be viewed and downloaded by other people; profile hiding does not make a known URL private. Check account and workbook download settings before publication.
- Tableau Public uses extracts rather than live database connections for published workbooks. CSV/Excel sources do not automatically refresh there; refresh the local extract and republish when updating data.
- The workbook has 199,999 analyzed rows, within Tableau Public's documented 15-million-row workbook limit. This does not guarantee browser performance.
- The owner confirmed checking the dataset terms and authorizing publication; the assistant could not independently read the dataset-specific Kaggle license statement.
- The workbook has been published to Tableau Public. Use the Dashboard 1 link above for the full dashboard and the Story 2 link for the eight-step narrative; the initial save URL opens only the Manufacturer Sales worksheet.

## Flask embedding

When `TABLEAU_PUBLIC_URL` or `TABLEAU_STORY_URL` is a valid HTTPS Tableau Public view or profile share URL, the Flask app normalizes profile share links to `/views/<workbook>/<view>` and adds literal `:showVizHome=no` and `:embed=true` query keys. These flags keep Tableau on the view route instead of redirecting to the profile share page, which refuses to render inside a frame. The app then loads Tableau's official Embedding API v3 and uses the `<tableau-viz>` web component. An unset or invalid URL leaves the local dashboard available and omits the embed panel. Flask is a separate deliverable and does not replace Tableau Public publication.

Official references:

- [Kaggle dataset page](https://www.kaggle.com/datasets/tharishreddy22/electric-vehicle-market-classification-dataset) (license section was not readable during this project check)
- [Save workbooks with Tableau Public](https://help.tableau.com/current/pro/desktop/en-us/publish_workbooks_tableaupublic.htm)
- [Tableau Public FAQ](https://help.tableau.com/current/pro/desktop/en-us/public_faq.htm)
- [Basic Embedding with Embedding API v3](https://help.tableau.com/current/api/embedding_api/en-us/docs/embedding_api_basic.html)
- [About Embedding API v3](https://help.tableau.com/current/api/embedding_api/en-us/docs/embedding_api_about.html)
