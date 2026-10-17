# Host the interactive Flask dashboard

GitHub Pages serves the public landing page and Tableau embeds. It does not run Flask or connect to the laptop's private SQLite file. To use this project's custom filters online, deploy the Flask app as a web service and connect it to a hosted MySQL database.

## 1. Create a hosted MySQL database

Use a MySQL 8-compatible database provider. Create a database and a user that can create tables, read rows, and import the training data. Keep its host, port, database name, username, and password private. Do not put credentials in GitHub, a screenshot, or a chat message.

## 2. Import the training CSV into that database

The CSV is intentionally excluded from GitHub. From the project folder on the computer that has `ev_market_train.csv`:

1. Copy `.env.example` to `.env` if `.env` does not already exist.
2. In the local `.env`, replace `DATABASE_URL=sqlite:///ev_market.sqlite` with the hosted connection URL:

   ```text
   DATABASE_URL=mysql+pymysql://USER:URL_ENCODED_PASSWORD@HOST:3306/DATABASE_NAME
   ```

   Keep `.env` private; `.gitignore` excludes it. URL-encode special characters in the password.
3. Run the importer using the local CSV path:

   ```powershell
   python -m pip install -r requirements.txt
   python scripts/import_csv.py --split train --input "C:/Users/Manmohan Singh/Downloads/archive/ev_market_train.csv"
   ```

   The importer creates `ev_market_train`, removes exact duplicate rows, and refuses to replace existing rows unless `--replace` is explicitly supplied.
4. Confirm the import reports the expected row count. Do not commit `.env` or the CSV.

## 3. Deploy the Flask service on Render

The repository includes `render.yaml` with the Python build/start commands and a prompt for the secret database URL.

1. Sign in to Render and choose **New → Blueprint**.
2. Connect `manmohansingh9562579-spec/ev-market-performance-insights` and select the `main` branch.
3. Review the service from `render.yaml`. When prompted, paste the same MySQL URL into the private `DATABASE_URL` value. Never add that URL to a repository file.
4. Create the Blueprint and wait for the deploy to finish.
5. Open the service's `onrender.com` URL. Check `/api/health`; it must say `ready` and report the imported rows. Then open the dashboard and try filters.

Render's free web service can sleep after inactivity, so its first request may take longer to respond. The database provider must allow connections from the Render service.

## 4. Link the deployed dashboard from GitHub Pages

After Render gives the service its final URL, add that URL to the public landing page as the **Interactive Flask dashboard** link. GitHub Pages cannot proxy the Flask service itself. The Tableau embed and the hosted Flask dashboard remain separate interactive views.

## Local vs hosted data

The local app can keep using `sqlite:///ev_market.sqlite`. Render must use the hosted MySQL `DATABASE_URL`; a laptop's SQLite file is not reachable from Render. The CSV remains local during import and is not committed or uploaded to GitHub.
