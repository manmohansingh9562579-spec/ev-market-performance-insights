# Demonstration outline

Target length: 5–7 minutes. Record a screen-share walkthrough using this order.

1. **Introduce the project (30 sec):** state the EV market problem, your name/team, and why manufacturer, battery, customer and vehicle performance comparisons matter.
2. **Show data source and scope (45 sec):** identify the Kaggle dataset and actual train/test files. State that the Flask dashboard uses only the 200,000-row training file, removes one exact duplicate in memory, and keeps the test split separate.
3. **Explain preparation (45 sec):** show docs/data_profile.md and docs/methodology.md. Explain missing values, numeric parsing, duplicate handling, aggregation grain and that the source CSV stays unchanged.
4. **Tour the dashboard (60 sec):** explain the seven KPIs and their aggregation rules. Tour all nine charts, including sales by manufacturer, battery, region, category and country labels, plus rating, model-year grouping, range and Wh/km efficiency.
5. **Demonstrate interaction (60 sec):** apply manufacturer, battery, region, category, country and model-year filters; reset them; change sales sort. Explain that KPIs and chart values recalculate and show one empty selection if practical.
6. **Present the Story (60 sec):** follow the narrative from market scale to market mix, customer satisfaction and vehicle capability; then summarize the key data limitations.
7. **Show database and Tableau deliverables (60 sec):** show the MySQL schema/import instructions and note that MySQL connectivity was not tested. Open the separate Tableau workbook, [published Dashboard 1](https://public.tableau.com/app/profile/man.mohan.singh3746/viz/EV_Market_Performance_Public_Ready_Clean/Dashboard1), and [published Story 2](https://public.tableau.com/app/profile/man.mohan.singh3746/viz/EV_Market_Performance_Public_Ready_Clean/Story2). Explain Tableau Public makes the workbook and embedded data public.
8. **Close with performance evidence (30 sec):** present the measured in-process load and response numbers from docs/performance_report.md, clarify browser/MySQL checks are pending, and show the public GitHub source repository.
