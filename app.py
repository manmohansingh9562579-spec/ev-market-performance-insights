from flask import Flask, render_template

app = Flask(__name__)

# Embed sources for the Tableau Embedding API.
DASHBOARD_URL = (
    "https://public.tableau.com/views/"
    "EV_Market_Performance_Public_Ready_Clean/Dashboard1"
)
STORY_URL = (
    "https://public.tableau.com/views/"
    "EV_Market_Performance_Public_Ready_Clean/Story2"
)

# Normal Tableau Public pages (used for the "Open on Tableau Public" buttons).
DASHBOARD_PAGE = (
    "https://public.tableau.com/app/profile/man.mohan.singh3746/viz/"
    "EV_Market_Performance_Public_Ready_Clean/Dashboard1"
)
STORY_PAGE = (
    "https://public.tableau.com/app/profile/man.mohan.singh3746/viz/"
    "EV_Market_Performance_Public_Ready_Clean/Story2"
)


@app.route("/")
def home():
    return render_template(
        "index.html",
        dashboard_url=DASHBOARD_URL,
        story_url=STORY_URL,
        dashboard_page=DASHBOARD_PAGE,
        story_page=STORY_PAGE,
    )


if __name__ == "__main__":
    app.run(debug=True)
