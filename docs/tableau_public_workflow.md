# Tableau workbook and Tableau Public workflow

## Existing workbook preservation

The original `Book1.twb` and `EV_Market_Performance.twb` files in the Tableau Workbooks folder were left unchanged. Other local packaged workbook versions under `outputs/` were also retained.

Use the local output file `EV_Market_Performance_Public_Ready_Clean.twbx` for the Tableau Public handoff. It was saved as a separate package in Tableau Public Desktop 2026.2 from the prepared CSV. Verification of the saved package found one embedded Hyper file (18,808,832 uncompressed bytes; the `.twbx` package is 11,210,219 bytes), one data source captioned `ev_market_train_tableau`, and all seven distinct chart worksheets connected to that data source. The existing dashboard and two Stories remain in the workbook. The original source extracts are not present in this clean package. The `.twbx` and prepared CSV are kept outside the source repository because they contain the dataset.

The prepared source `ev_market_train_tableau.csv` has 199,999 rows and 37 columns after removing the single exact duplicate from the 200,000-row train CSV. The source CSV was not modified. The workbook's embedded Hyper extract was generated from this prepared file; Tableau's data preview showed 37 fields and 199,999 rows before saving. The package also contains a text connection pointing to the prepared CSV's local output-folder path for refresh. When moving the workbook to another computer, use the embedded extract for viewing; reconnect to a local copy of the prepared CSV if refreshing.

## Re-create or refresh the Tableau data

The original train CSV remains in the local Downloads archive and is not included in this project or its GitHub repository. Create a separate Tableau-ready CSV without overwriting the original:

```powershell
python scripts/prepare_tableau_csv.py --input "C:/path/to/ev_market_train.csv" --output "C:/path/to/ev_market_train_tableau.csv"
```

The script removes exact duplicate rows, rejects conflicting `vehicle_id` records, and refuses to overwrite an existing output unless `--overwrite` is explicitly supplied. In Tableau Desktop/Public Desktop, connect to that prepared CSV, check field types and row count, select **Extract** on the Data Source page, and refresh. Save a new packaged workbook (`.twbx`) so the extract travels with it. Keep the previous workbook versions until the refreshed copy has been checked.

## Publish through Tableau Public Desktop

Before publishing, confirm the dataset's license permits making the workbook and its embedded data publicly available. The Kaggle page for this dataset did not expose a readable license statement during this project's check, so permission to redistribute the data has **not** been verified. Tableau Public workbooks can expose downloadable workbook data; public hosting is a redistribution of the extracted records.

Once the license is confirmed:

1. Open the local output file `EV_Market_Performance_Public_Ready_Clean.twbx` in Tableau Public Desktop. Confirm the extract is available and the dashboard, seven chart sheets, filters, and both Stories load.
2. Review the dashboard at desktop and phone sizes. Check filter behavior and verify the sales total against the deduplicated source if you use the total in a submission.
3. In Tableau Public Desktop, choose **File → Save to Tableau Public**, then sign in to the Tableau Public account. Review the workbook title and public visibility before completing the upload.
4. Wait for the save/upload to finish. Open the published view from the Tableau Public profile, check that it renders, and copy its share URL. No published URL has been recorded for this project yet.
5. To show that view inside Flask, put the exact HTTPS `public.tableau.com` URL in `TABLEAU_PUBLIC_URL` in a local `.env` file and restart Flask. If the variable is unset, the local Flask dashboard continues to work without an embed.

Tableau Public account login and publishing must be completed by the account owner. Do not enter a password into the Flask project or commit `.env`.

## Tableau Public limits and visibility

- Tableau Public requires a signed-in Tableau Public account. A workbook saved locally is not a Tableau Public submission.
- Tableau Public is public hosting. Published workbook and data may be viewed and downloaded by other people; profile hiding does not make a known URL private. Check account and workbook download settings before publication.
- Tableau Public uses extracts rather than live database connections for published workbooks. CSV/Excel sources do not automatically refresh there; refresh the local extract and republish when updating data.
- The workbook has 199,999 analyzed rows, within Tableau Public's documented 15-million-row workbook limit. This does not guarantee browser performance.
- Dataset redistribution permission is unresolved because the dataset-specific Kaggle license statement could not be verified. Do not publish the extract until its terms permit this use.
- The earlier Tableau Public save flow was canceled before publication. There is no Tableau Public URL, and the local `.twbx` is not the required public submission.

## Flask embedding

When `TABLEAU_PUBLIC_URL` is a valid HTTPS URL hosted by `public.tableau.com`, the Flask page loads Tableau's official Embedding API v3 and uses the `<tableau-viz>` web component. An unset or invalid URL leaves the local Chart.js dashboard available and omits the embed panel. Flask is a separate deliverable and does not replace Tableau Public publication.

Official references:

- [Kaggle dataset page](https://www.kaggle.com/datasets/tharishreddy22/electric-vehicle-market-classification-dataset) (license section was not readable during this project check)
- [Save workbooks with Tableau Public](https://help.tableau.com/current/pro/desktop/en-us/publish_workbooks_tableaupublic.htm)
- [Tableau Public FAQ](https://help.tableau.com/current/pro/desktop/en-us/public_faq.htm)
- [Basic Embedding with Embedding API v3](https://help.tableau.com/current/api/embedding_api/en-us/docs/embedding_api_basic.html)
- [About Embedding API v3](https://help.tableau.com/current/api/embedding_api/en-us/docs/embedding_api_about.html)
