# Demonstration outline

Estimated walkthrough: 5–7 minutes.

1. **Scope (30 sec):** identify the Kaggle EV dataset, the 200,000-row training split and 100,000-row test split, and explain why the app uses only train data for this descriptive dashboard.
2. **Data quality (45 sec):** show one exact duplicate, the five fields with missingness, and explain that the source file remains unchanged.
3. **Dashboard KPIs (45 sec):** explain sum, mean, distinct count, and null handling before interpreting the values.
4. **Market comparisons (60 sec):** discuss sales by manufacturer, chemistry, region, category, and manufacturing-country labels.
5. **Vehicle performance (60 sec):** compare customer ratings, range, and energy consumption. Explain that range/rating/efficiency are averages and lower Wh/km indicates less energy use per kilometer.
6. **Filters and Story (60 sec):** choose one manufacturer, region, or model-year interval and demonstrate that the KPIs and all charts recompute; move through the insight narrative.
7. **Database and Tableau (60 sec):** show the SQL schema/import workflow, then open the separate packaged Tableau workbook and its [published Tableau Public view](https://public.tableau.com/app/profile/man.mohan.singh3746/viz/EV_Market_Performance_Public_Ready_Clean/ManufacturerSales). Explain that Tableau Public uses an extract and makes the workbook/data public.
8. **Performance and limitations (30 sec):** show measured in-process timings and the SQL/HTTP/browser checks still marked pending; reiterate that sums are field aggregates pending grain validation.
