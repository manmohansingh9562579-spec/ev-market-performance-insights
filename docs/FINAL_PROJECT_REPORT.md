# Electric Vehicle Market Performance & Insights
## Project Final Report

**Prepared by:** Manmohan Singh  
**Repository:** https://github.com/manmohansingh9562579-spec/ev-market-performance-insights  
**Public landing page:** https://manmohansingh9562579-spec.github.io/ev-market-performance-insights/

> **Report status:** Draft for review. Before final submission, verify the live implementation, insert genuine project screenshots, and complete the dataset source and institution-specific details. Do not present unverified features or performance measurements as confirmed.

## 1. Introduction

### 1.1 Project Overview
Electric Vehicle Market Performance & Insights is a data analytics project intended to make electric-vehicle data easier to explore. It combines data preparation, SQL-based analysis, an interactive Flask dashboard, visual comparisons, and a story-oriented presentation of findings. The dashboard is designed to help users inspect dimensions such as manufacturer, vehicle category, region, battery type, customer rating, model year, driving range, energy efficiency, and CO₂-related measures where those fields are available.

### 1.2 Purpose
The purpose is to turn a structured dataset into a more accessible analytical experience. Users can review summary indicators, compare groups, apply available filters, and explore visualizations rather than manually inspecting rows. The project also documents the analysis workflow and provides a public landing page for project information and available resources.

## 2. Ideation Phase

### 2.1 Problem Statement
Electric-vehicle datasets may contain many records and multiple dimensions. Without a consistent analytical view, it can be difficult to compare manufacturers, categories, regions, battery types, ratings, and vehicle capability measures efficiently. This project addresses the exploration and presentation challenge by organizing the available data into summary indicators and related visualizations.

### 2.2 Empathy Map Canvas
**Intended user:** a reviewer, student, or analyst exploring EV market data.

- **Says:** “I need to compare EV categories and manufacturers quickly.”
- **Thinks:** “Are these figures based on the supplied dataset, and how should I interpret them?”
- **Does:** selects filters, reviews KPI cards, compares charts, and opens supporting documentation.
- **Needs:** readable charts, consistent filtering, clear metric definitions, and accessible documentation.
- **Pain points:** large tables, scattered indicators, unclear metric definitions, and the risk of treating dataset aggregates as market-wide facts.

### 2.3 Brainstorming
- Create summary KPI cards for key dataset measures.
- Provide charts for manufacturer, category, region, battery type, ratings, model-year trends, driving range, and energy efficiency.
- Add filters so users can focus on selected portions of the data.
- Organize related visualizations into a story or insights sequence.
- Keep data preparation and SQL analysis documented in the repository.
- Provide a public landing page linking to available project resources.

## 3. Requirement Analysis

### 3.1 Customer Journey Map

| Stage | User action | Expected experience |
|---|---|---|
| Discover | Open the landing page or repository | Understand the purpose and find resources |
| Explore | Open the dashboard and scan summary cards | Get an overview of the dataset |
| Filter | Select a manufacturer or another available filter | Inspect a focused subset of records |
| Compare | Review charts and tooltips | Compare patterns across available dimensions |
| Understand | Navigate Story/Insights steps | Follow a structured analytical sequence |
| Review | Open documentation and repository resources | Understand scope, methods, and limitations |

### 3.2 Solution Requirements

**Functional requirements**
- Present a project overview and links to available resources.
- Display dataset summary indicators and relevant charts.
- Support available interactive filters and update displayed results accordingly.
- Provide a Story/Insights sequence where implemented.
- Document data preparation, SQL schema, and analysis queries.

**Non-functional requirements**
- Keep labels and visualizations readable.
- Make the data workflow understandable and reproducible where the local setup permits.
- Avoid silently treating missing values as zero.
- Exclude the identified exact duplicate from analysis without modifying the source CSV.
- Communicate dataset scope and performance-measurement limitations clearly.

### 3.3 Data Flow Diagram
Logical data flow (replace or supplement with a diagram of the implemented system before final submission):

```text
Source CSV files (train / test kept separate)
        |
        v
Data profiling and preparation
        |
        v
Analysis dataset (one exact duplicate excluded)
        |
        v
Local SQLite schema and SQL analysis workflow
        |
        v
Flask dashboard -> KPI cards / charts / filters
        |
        v
Story / Insights and user interpretation
```

### 3.4 Technology Stack

| Component | Role |
|---|---|
| Python / Flask | Local web application and dashboard workflow, as described for this project |
| SQLite | Local relational database workflow |
| SQL | Schema and analytical queries |
| HTML / CSS / JavaScript | Web presentation layer, where used |
| Tableau | Dashboard/story resources where links and published views are available |
| GitHub | Source repository and documentation |
| GitHub Pages | Static public landing page; it does not run the Python backend |

## 4. Project Design

### 4.1 Problem-Solution Fit
The project addresses the need to make a multi-dimensional dataset easier to review. KPI cards provide a high-level summary, charts support comparisons, filters support focused exploration, and Story/Insights provides a guided sequence. The solution should be evaluated by confirming that users can understand the charts and interpret measures within the dataset's scope.

### 4.2 Proposed Solution
The solution combines data preparation, a local SQL database workflow, an interactive dashboard, and a public-facing landing page. It prioritizes exploration and transparent interpretation over claims of independently verified market-wide estimates.

### 4.3 Solution Architecture
1. **Data layer:** source training and test files are kept separate; dashboard analysis uses the training data.
2. **Preparation layer:** data profiling and duplicate handling are documented; the original CSV is not modified by excluding the duplicate from analysis.
3. **Database layer:** SQLite is used for the local workflow, with schema and analysis queries in the repository.
4. **Application layer:** the Flask dashboard presents summary cards, charts, and available filter controls.
5. **Story layer:** related views are organized into a Story/Insights sequence where implemented.
6. **Access layer:** GitHub Pages serves a static landing page; local Flask/SQLite functionality remains separate from the static site.

## 5. Project Planning & Scheduling

### 5.1 Project Planning

| Phase | Main tasks | Deliverable |
|---|---|---|
| Data understanding | Review source fields, train/test separation, and data profile | Data profile and methodology notes |
| Preparation | Apply documented preparation and duplicate exclusion | Analysis-ready dataset |
| Database | Define SQLite schema and SQL analysis queries | SQL files / local database workflow |
| Dashboard | Present KPI cards, charts, and filters | Interactive dashboard |
| Storytelling | Organize related analytical views into story steps | Story / Insights section |
| Review | Inspect performance notes, links, and outputs | Final report and demo resources |

Add actual project dates and team responsibilities if required by the submission template; these details must be verified before final submission.

## 6. Functional and Performance Testing

### 6.1 Performance Testing
The project includes a performance report describing measured in-process results. Browser-level timing has not been confirmed in the information available for this report, so no page-load performance claim is made here.

| Test area | Verification | Status to confirm |
|---|---|---|
| Landing page | Open the public URL and check navigation | Verify before submission |
| Dashboard load | Start local Flask app and open dashboard | Verify in target environment |
| Filters | Apply and reset each available filter; confirm charts update | Verify in live app |
| Charts/tooltips | Inspect labels, values, and hover details | Verify in live app |
| Story steps | Navigate through each available step | Verify in live app |
| Data handling | Confirm train/test separation, duplicate handling, and missing-value policy | Check current implementation |
| Performance | Record method, environment, repetitions, and results | Do not claim browser timing until measured |

## 7. Results

### 7.1 Output Screenshots
Insert genuine screenshots from the current running project. Recommended figures:

1. Public project landing page.
2. Dashboard top section with KPI cards.
3. Dashboard visualizations.
4. Example filter before and after applying it.
5. Story/Insights steps.
6. Tableau dashboard/story, only if the links are available and working.

Do not use stock images in place of actual project screenshots.

## 8. Advantages & Disadvantages

### Advantages
- Makes multi-dimensional data easier to explore visually.
- Combines summary indicators with detailed charts.
- Interactive filters support focused comparisons.
- Documentation and SQL files help explain the analytical workflow.
- The public landing page gives reviewers a central access point.

### Disadvantages / Limitations
- Conclusions depend on the supplied dataset and its field definitions.
- Dataset aggregates should not be treated as independently verified market-wide totals.
- The local Flask/SQLite application is separate from the static GitHub Pages site.
- Browser-level performance results require separate measurement.
- Public Tableau functionality depends on valid, accessible published links.

## 9. Conclusion
Electric Vehicle Market Performance & Insights demonstrates an analytical presentation workflow built around data preparation, SQL-based analysis, an interactive dashboard, and data storytelling. Its main value is helping users explore the supplied EV dataset through structured summaries and visual comparisons. The report emphasizes transparent data handling and clear limits on interpretation. Before final submission, verify the implementation and links and add genuine output screenshots.

## 10. Future Scope
- Add additional reliable EV datasets and document their provenance.
- Improve metric definitions and data-quality checks.
- Add further comparisons across regions, manufacturers, categories, and model years where fields permit.
- Measure browser-level performance using a documented and repeatable method.
- Improve deployment so the public demo experience is consistent and clearly documented.
- Add accessible chart descriptions and user guidance.

## 11. Appendix

### Source Code
https://github.com/manmohansingh9562579-spec/ev-market-performance-insights

### Dataset Link
Add the official dataset URL or approved source reference here. The source dataset URL must be confirmed before final submission.

### GitHub & Project Demo Link
- **Repository:** https://github.com/manmohansingh9562579-spec/ev-market-performance-insights
- **Public landing page:** https://manmohansingh9562579-spec.github.io/ev-market-performance-insights/
- **Presentation video:** Add the final accessible video URL after confirming that the submission platform accepts it.

### Final Pre-submission Checklist
- [ ] Verify project name, author name, institution, course, and date.
- [ ] Insert genuine screenshots in Section 7.
- [ ] Confirm feature counts and descriptions against the live implementation.
- [ ] Add the real dataset source link.
- [ ] Confirm demo/video links open for the intended reviewer.
- [ ] Remove any placeholder or unverified statement before submission.
