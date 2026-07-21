# Gantt Chart — Assessment 1 (Weeks 1–6)

> Rendered as a Mermaid Gantt chart. GitHub renders Mermaid natively in Markdown previews.

```mermaid
gantt
    title HR Policy Q&A Assistant — Assessment 1 Timeline
    dateFormat  YYYY-MM-DD
    axisFormat  Wk %W

    section Project Setup
    Team roles & repo setup           :done,    pm1, 2026-01-01, 5d
    GitHub project board & labels     :done,    pm2, after pm1, 3d

    section Business Analysis (Isuru)
    Stakeholder analysis              :ba1, 2026-01-06, 5d
    Scope & business case             :ba2, after ba1, 5d
    WBS                               :ba3, after ba2, 3d
    Gantt chart                       :ba4, after ba3, 2d
    Risk register                     :ba5, after ba4, 4d
    Quality plan                      :ba6, after ba5, 4d

    section Requirements & Design (Dineli)
    Functional requirements           :rq1, 2026-01-13, 5d
    Non-functional requirements       :rq2, after rq1, 3d
    User stories                      :rq3, after rq2, 4d
    UML diagrams                      :rq4, after rq3, 4d
    BPMN diagrams                     :rq5, after rq4, 4d

    section Architecture (Farhaz)
    System architecture draft         :ar1, 2026-01-13, 6d
    LLM/vector store evaluation       :ar2, after ar1, 5d
    Repository scaffolding            :ar3, 2026-01-06, 4d

    section Assessment 1 Wrap-up
    Report compilation                :done, wrap1, 2026-02-03, 4d
    Presentation prep                 :wrap2, after wrap1, 3d
    Submission                        :milestone, sub1, after wrap2, 0d
```

**Why Mermaid instead of an image or spreadsheet embed:** the chart lives in version control as text — it diffs cleanly in PRs when dates shift, doesn't require an external tool to view, and renders directly on GitHub. A screenshot or spreadsheet link would go stale and be opaque to reviewers.
