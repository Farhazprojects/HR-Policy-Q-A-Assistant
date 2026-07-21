# UML Diagrams

## Use Case Diagram (initial)

```mermaid
graph TD
    Employee((Employee))
    Admin((HR Admin))
    Employee --> UC1[Ask HR policy question]
    Employee --> UC2[View answer with citation]
    Admin --> UC3[Upload/update policy document]
    Admin --> UC4[Review unanswered questions]
    UC1 --> UC2
```

Owner: Dineli. Expand with class diagrams once `src/backend/models` is scaffolded in Assessment 2, so the diagram reflects real data models rather than a speculative design.
