# Database setup

## MySQL 8+

1. Install and start a local MySQL 8+ server and create a database user with permission to create/use the project database and insert/update its tables.
2. Open a MySQL client and run `sql/schema.sql`. It creates `ev_market`, `ev_market_train`, and `ev_market_test` with a `vehicle_id` primary key and indexes supporting the dashboard filters.
3. Copy `.env.example` to `.env`. Clear the default `DATABASE_URL=sqlite:///ev_market.sqlite`, then set `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, and `DB_NAME=ev_market`; set `EV_TRAIN_CSV` to the actual training CSV path. Keep `.env` private and out of source control.
4. Install Python dependencies with `python -m pip install -r requirements.txt`.
5. Import training data:

   ```powershell
   python scripts/import_csv.py --split train --input "C:/path/to/ev_market_train.csv"
   ```

   To load the separate test split into `ev_market_test`, run:

   ```powershell
   python scripts/import_csv.py --split test --input "C:/path/to/ev_market_test.csv"
   ```

6. Start the dashboard with `python app.py`. With complete DB environment settings, the dashboard reads `ev_market_train`.

The importer requires all 37 inspected fields. It removes exact duplicate rows, refuses missing IDs and conflicting duplicate IDs, and refuses to append to a non-empty destination unless `--replace` is explicitly supplied. Review the target table before using `--replace`, because that option deletes existing rows before replacing them from the selected CSV.

## SQLite local fallback

The one-click launcher defaults to `DATABASE_URL=sqlite:///ev_market.sqlite`; it creates the database and imports the training CSV the first time it runs. You can also set this value in `.env` and run the importer manually. The importer creates the schema and indexes. SQLite import and dashboard reading were exercised by the automated integration test.

To switch back to CSV mode, clear `DATABASE_URL` and the MySQL `DB_*` settings, then set `EV_TRAIN_CSV`.

## Verification status

SQLite: automated synthetic integration coverage plus a manual local import and dashboard check using 199,999 real training rows. MySQL runtime, server connection, DDL compatibility against a running server, real-data MySQL import, and query performance: pending because no MySQL service or configured connection was available during this work.
