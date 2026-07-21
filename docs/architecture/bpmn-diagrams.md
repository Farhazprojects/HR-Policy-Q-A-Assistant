# BPMN Diagrams

## Current State: Employee Asks an HR Question (As-Is)

```mermaid
flowchart LR
    A[Employee has HR question] --> B{Knows where to look?}
    B -- Yes --> C[Searches handbook/intranet]
    B -- No --> D[Emails or messages HR staff]
    C --> E{Found answer?}
    E -- No --> D
    E -- Yes --> F[Question resolved]
    D --> G[HR staff manually answers]
    G --> F
```

## Future State: Employee Asks an HR Question (To-Be)

```mermaid
flowchart LR
    A[Employee has HR question] --> B[Asks HR Policy Q&A Assistant]
    B --> C[System retrieves relevant policy passage]
    C --> D{Confident match found?}
    D -- Yes --> E[Grounded answer with citation returned]
    D -- No --> F[System flags as unanswered, routes to HR staff]
    E --> G[Question resolved]
    F --> H[HR staff answers + reviews for documentation gap]
    H --> G
```

Owner: Dineli. The future-state diagram's "flagged as unanswered" branch is the direct process source for the analytics dashboard's "unanswered questions" feature in the roadmap's Phase 4.
