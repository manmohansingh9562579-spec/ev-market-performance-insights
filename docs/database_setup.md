# Database setup

## Required workflow: SQLite and SQL

SQLite is the active database for this project. It is a SQL database and runs locally without a cloud account, paid plan, or database server.

1. Copy `.env.example` to `.env` if needed. Keep `.env` private and out of source control.
2. Install Python dependencies with `python -m pip install -r requirements.txt`.
3. (Optional) Run `sql/schema_sqlite.sql` against `ev_market.sqlite` using a SQLite client to inspect/create the table and indexes. The importer creates the same schema automatically when needed.
4. Start the local app with `python scripts/launch_local.py`. It creates `ev_market.sqlite`, imports the training split if the table is empty, and runs Flask locally.
5. To import manually instead, run:

   ```powershell
   python scripts/import_csv.py --split train --input "C:/path/to/ev_market_train.csv"
   ```

   The importer creates the SQLite table and indexes. To load the separate test split into `ev_market_test`, run:

   ```powershell
   python scripts/import_csv.py --split test --input "C:/path/to/ev_market_test.csv"
   ```

6. Run the SQL examples in `sql/analysis_queries.sql` against `ev_market.sqlite` using a SQLite client. The Flask dashboard reads `ev_market_train` from this database.

The importer requires all 37 inspected fields. It removes exact duplicate rows, refuses missing IDs and conflicting duplicate IDs, and refuses to append to a non-empty destination unless `--replace` is explicitly supplied. Review the target table before using `--replace`, because that option deletes existing rows before replacing them from the selected CSV.

To create a Tableau-ready local extract source from the configured database table after import, run:

```powershell
python scripts/prepare_tableau_csv.py --from-database --table ev_market_train --output "C:/path/to/ev_market_train_tableau.csv"
```

This exports a local CSV for a packaged Tableau extract. It does not expose database credentials or create a live connection from Tableau Public to a database.

To run without the database for source-file fallback, clear `DATABASE_URL` and set `EV_TRAIN_CSV`.

## Verification status

SQLite: automated synthetic integration coverage plus a manual local import and dashboard check using 199,999 real training rows. Hosted database deployment and remote query performance are not part of the required workflow.
