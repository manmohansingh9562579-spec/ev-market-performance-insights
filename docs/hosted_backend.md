# Run the Flask dashboard with SQLite

The project guidance calls for SQL/database work; it does not require a cloud database provider or a hosted Flask backend. The required setup uses SQLite, which is a SQL database, locally. GitHub Pages remains a static landing page with Tableau Public embeds; it does not run Flask or access the local SQLite file.

## Start the local application

1. Keep `ev_market_train.csv` in the local `Downloads/archive/` folder, or set `EV_TRAIN_CSV` in your private `.env` file.
2. In PowerShell at the project root, run:

   ```powershell
   python scripts/launch_local.py
   ```

3. Open the local address printed in the terminal. The launcher creates `ev_market.sqlite` and imports the training CSV into `ev_market_train` if the table is empty. Use the Flask filters and reset the selected filters to view the full data.
4. Run SQL examples from `sql/analysis_queries.sql` against the local SQLite database. To create a Tableau-ready extract file from the database, use `python scripts/prepare_tableau_csv.py --from-database --table ev_market_train --output "C:/path/to/ev_market_train_tableau.csv"`.

The importer validates all 37 columns, removes exact duplicate rows, rejects missing/conflicting IDs, and protects an existing non-empty table unless `--replace` is explicitly supplied. The original CSV remains unchanged and local data files are not committed.

## Public deliverables

GitHub Pages hosts the static project landing page. Tableau Public hosts the published Dashboard and Story. Flask + SQLite is a local interactive companion and is not currently exposed as a public backend. No hosted database is needed for the submitted SQL/database work.

## Optional account pages

The Flask app includes local demonstration routes for registration, login, and account deletion. They store password hashes in the local SQLite database. They do not provide an online account service, and are not necessary to demonstrate the required SQL or Tableau deliverables.
