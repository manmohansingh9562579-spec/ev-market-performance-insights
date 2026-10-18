# Deploy the Flask dashboard on free tiers

The repository has two public parts: GitHub Pages serves the static project landing page and Tableau Public embeds; Vercel serves the interactive Flask dashboard and its custom database filters. Aiven hosts MySQL. The Flask app is configured for Vercel's Python runtime, and its browser assets are under `public/static/` so Vercel can serve them through its CDN while Flask also serves them locally.

## Free-tier fit and limits

- **Vercel Hobby** is $0 for personal, non-commercial projects. Flask runs as a serverless Python Function. The Hobby plan has usage limits, including 1 million function invocations and a maximum 60-second function duration; over-limit usage is paused until the quota resets rather than billed as an overage. It is not for commercial use. See [Hobby plan limits](https://vercel.com/docs/plans/hobby) and [Flask on Vercel](https://vercel.com/docs/frameworks/backend/flask).
- **Aiven MySQL Free** has no time limit or credit-card requirement, with 1 CPU, 1 GB RAM, and 1 GB storage. Aiven may power off a free service after extended inactivity; it can be powered back on. See [Aiven MySQL Free limits](https://aiven.io/docs/products/mysql/concepts/mysql-free-tier).
- No provider can promise that a free offer will last for a user's lifetime. This combination avoids a monthly subscription today, but availability, quotas, and terms can change. Keep a local copy of the CSV and a separate database backup.

## 1. Create the MySQL service

1. Finish creating/signing in to the Aiven account yourself; do not share its password or database credentials in chat.
2. In the Aiven Console, create a **MySQL → Free** service. The free service has a 1 GB storage limit. Copy its connection details and download its CA certificate.
3. Keep the service on the Free plan; do not add a payment method or upgrade.

## 2. Import the local training CSV

The source CSV is not in GitHub. On the computer that has `ev_market_train.csv`:

1. Copy `.env.example` to `.env` if `.env` does not already exist.
2. In the private `.env`, set `DATABASE_URL` to Aiven's SQLAlchemy/PyMySQL form:

   ```text
   DATABASE_URL=mysql+pymysql://USER:URL_ENCODED_PASSWORD@HOST:PORT/DATABASE_NAME
   ```

   URL-encode special characters in the username or password. Set `MYSQL_SSL_CA` to the path of the downloaded CA file and `MYSQL_SSL_REQUIRED=true`.
3. Install the project requirements and import the CSV:

   ```powershell
   python -m pip install -r requirements.txt
   python scripts/import_csv.py --split train --input "C:/Users/Manmohan Singh/Downloads/archive/ev_market_train.csv"
   ```

4. Confirm that the import completed and the destination table is `ev_market_train`. Do not commit `.env`, the CSV, or the CA file.

The importer drops exact duplicate rows and refuses to replace a non-empty table unless `--replace` is explicitly passed.

## 3. Deploy Flask to Vercel Hobby

1. Sign in to Vercel with GitHub and import `manmohansingh9562579-spec/ev-market-performance-insights`, using the `main` branch and repository root. Vercel detects the Flask app from `app.py` and `requirements.txt`.
2. In the Vercel project, open **Settings → Environment Variables** and add these for **Production**:

   | Variable | Value |
   | --- | --- |
   | `DATABASE_URL` | Aiven SQLAlchemy URL, with special password characters URL-encoded |
   | `EV_TABLE_NAME` | `ev_market_train` |
   | `MYSQL_SSL_REQUIRED` | `true` |
   | `MYSQL_SSL_CA_CERT` | Full contents of the Aiven CA `.pem` file |
   | `SECRET_KEY` | A private random value generated locally; never paste it in chat or commit it |
   | `REQUIRE_SECRET_KEY` | `true` |
   | `SESSION_COOKIE_SECURE` | `true` |
   | `TRUST_PROXY` | `true` |
   | `TABLEAU_PUBLIC_URL` | `https://public.tableau.com/app/profile/man.mohan.singh3746/viz/EV_Market_Performance_Green_Executive_Refresh/Dashboard1` |
   | `TABLEAU_STORY_URL` | `https://public.tableau.com/app/profile/man.mohan.singh3746/viz/EV_Market_Performance_Green_Executive_Refresh/Story2` |

   Vercel supports multiline environment values for PEM certificates. Keep the database URL and `SECRET_KEY` private. Environment-variable changes apply to a new deployment, so redeploy after saving them.
3. In **Settings → Domains**, use the free `*.vercel.app` project domain. Do not add a paid custom domain.
4. Open `https://YOUR-VERCEL-DOMAIN/api/health`; it should report `"state":"ready"` after the database and table are available. Then check the custom dashboard filters and `/register`.
5. Add the resulting Vercel URL as an **Interactive Flask dashboard** link in `docs/site/index.html`, then push the change. GitHub Pages remains the static entry point and links to Flask; the Vercel domain is the separate live backend/dashboard.

Vercel's Python runtime is currently documented as Beta. Hobby is suitable for this personal student project within the published limits, but if a request takes over 60 seconds or monthly quotas are exceeded, the function can fail or pause until quotas reset. See [Python runtime](https://vercel.com/docs/functions/runtimes/python), [function limits](https://vercel.com/docs/functions/limitations), and [environment variables](https://vercel.com/docs/environment-variables).

## Website accounts

The Flask dashboard stays public. Visitors may optionally register at `/register`, sign in at `/login`, and delete their account at `/account`. The app creates `ev_user_accounts` in MySQL on the first account request and stores one-way password hashes. Email verification and password-reset email are not configured because this project has no mail service. Accounts do not make the dashboard private or give users administrator access.

## Local vs hosted data

Local development can use `sqlite:///ev_market.sqlite`. GitHub Pages and Vercel cannot read a database file or CSV stored only on the laptop; import the CSV into Aiven and configure the Vercel environment variables. Do not commit `.env`, database credentials, CA certificates, or source datasets.
