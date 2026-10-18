# Host the interactive Flask dashboard on Railway

GitHub Pages serves the public landing page and Tableau embeds. It does not run Flask or connect to the laptop's private SQLite file. To use this project's custom filters online, deploy the Flask app to Railway and connect it to a hosted MySQL database. The repository includes a `Procfile` with a Gunicorn production command; Railway can also deploy the Flask app directly from this GitHub repository.

## 1. Create a hosted MySQL database

For this project, use the Aiven MySQL account already being set up. Create a MySQL service and database, then download its CA certificate from the Aiven service page. The database login and connection URL are private. Do not paste them into GitHub, screenshots, or chat messages.

## 2. Import the training CSV into MySQL

The CSV is intentionally excluded from GitHub. On the computer that has `ev_market_train.csv`:

1. Copy `.env.example` to `.env` if `.env` does not already exist.
2. Replace the local SQLite `DATABASE_URL` with the Aiven MySQL URL using the SQLAlchemy/PyMySQL form:

   ```text
   DATABASE_URL=mysql+pymysql://USER:URL_ENCODED_PASSWORD@HOST:PORT/DATABASE_NAME
   ```

   URL-encode special characters in the username or password. Set `MYSQL_SSL_CA` to the local path of Aiven's downloaded CA certificate and set `MYSQL_SSL_REQUIRED=true`.
3. Import the training file from PowerShell:

   ```powershell
   python -m pip install -r requirements.txt
   python scripts/import_csv.py --split train --input "C:/Users/Manmohan Singh/Downloads/archive/ev_market_train.csv"
   ```

4. Keep the terminal result private if it contains account details. Confirm the import completed and the destination is `ev_market_train`. Do not add the CSV, `.env`, or CA file to GitHub.

The importer removes exact duplicate rows and refuses to replace an existing non-empty table unless `--replace` is explicitly passed.

## 3. Deploy Flask from GitHub to Railway

1. In Railway, create a project and choose **Deploy from GitHub repo**. Connect `manmohansingh9562579-spec/ev-market-performance-insights` and select `main`.
2. If Railway does not pick up the `Procfile`, set the service's start command to:

   ```text
   gunicorn app:app --bind 0.0.0.0:$PORT --workers 1 --threads 4 --timeout 120
   ```

   Railway detects the Python dependencies from `requirements.txt`.
3. In the Flask service's **Variables**, add these values. Keep the MySQL URL and session secret private:

   | Variable | Value |
   | --- | --- |
   | `DATABASE_URL` | The same Aiven URL used for import, with the password URL-encoded |
   | `EV_TABLE_NAME` | `ev_market_train` |
   | `MYSQL_SSL_REQUIRED` | `true` |
   | `MYSQL_SSL_CA_CERT` | Full contents of the downloaded Aiven CA `.pem` file; Railway accepts multiline variable values |
   | `SECRET_KEY` | A private random value generated on your computer, for example with `py -c "import secrets; print(secrets.token_urlsafe(48))"` |
   | `REQUIRE_SECRET_KEY` | `true` |
   | `SESSION_COOKIE_SECURE` | `true` |
   | `TRUST_PROXY` | `true` |
   | `TABLEAU_PUBLIC_URL` | `https://public.tableau.com/app/profile/man.mohan.singh3746/viz/EV_Market_Performance_Green_Executive_Refresh/Dashboard1` |
   | `TABLEAU_STORY_URL` | `https://public.tableau.com/app/profile/man.mohan.singh3746/viz/EV_Market_Performance_Green_Executive_Refresh/Story2` |

   Railway documents GitHub-connected Flask deployments, generated public domains, and multiline variables in its [Flask guide](https://docs.railway.com/guides/flask) and [variables guide](https://docs.railway.com/variables).
4. Deploy the service. In **Settings → Networking**, generate a public domain. Open `/api/health` on that domain; it should report `"state":"ready"` and the loaded row count. Then use the dashboard filters and create a test account at `/register`.
5. Add the new public Flask URL as the **Interactive Flask dashboard** link in `docs/site/index.html`, then push the site change so GitHub Pages publishes it. This is a separate URL from the Pages landing page and Tableau Public.

## Website accounts

The dashboard remains public. Visitors can optionally create an account at `/register`, sign in at `/login`, and delete their account at `/account`. The app creates the private `ev_user_accounts` table on the first account request. Passwords are stored as one-way hashes. CSRF protection, secure session cookies, and per-IP rate limits for sign-up and sign-in are enabled.

Email verification and password-reset email are not configured because this project has no mail service. Accounts only provide sign-in and a private account page; they do not make the dashboard private or give users administrator access.

## Cost and availability

Railway's current Free plan provides $1 of monthly resource credit, and its trial includes a one-time $5 credit for up to 30 days. The Hobby subscription is $5/month, with extra charges if usage exceeds the included credit. Check the plan and usage estimate in Railway before enabling paid service; don't add a payment method or upgrade unless you accept the charge. See Railway's [current plans](https://docs.railway.com/pricing/plans) and [free trial details](https://docs.railway.com/pricing/free-trial).

## Local vs hosted data

Local development can keep using `sqlite:///ev_market.sqlite`. Railway cannot access the laptop's SQLite database, and the source CSV remains local during import. The hosted Flask app reads the imported Aiven MySQL table using a verified TLS connection. Do not commit the `.env`, database credentials, CA certificate, or CSV file.
