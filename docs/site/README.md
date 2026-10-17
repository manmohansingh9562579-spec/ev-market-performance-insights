# Public Tableau demo landing page

This static GitHub Pages landing page presents the separately published Tableau dashboard and Story with Tableau's Embedding API v3.

The landing page includes a responsive EV-focused hero, dataset scope cards, four dashboard entry points, a Dashboard/Story view switcher, active section navigation, reading progress, and a back-to-top control. Its visual EV concept art is illustrative and is not presented as a dataset record.

The page does not run the Flask application, MySQL, or local CSV analysis. Run Flask from the repository using the instructions in the root README. No dataset file or workbook extract is bundled here.

The GitHub Actions workflow at `.github/workflows/pages.yml` deploys this directory when it changes. If Pages is not enabled for the repository, an owner must enable it once under **Settings → Pages → Build and deployment → GitHub Actions**. GitHub documents the required account and repository permissions in its [Pages deployment documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

After a successful deployment, the expected site URL is:

`https://manmohansingh9562579-spec.github.io/ev-market-performance-insights/`

Verify that URL and the Actions run before submitting it. GitHub Pages can take several minutes to publish after the workflow succeeds.
