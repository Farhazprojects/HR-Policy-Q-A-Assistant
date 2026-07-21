# Functional Requirements

| ID | Requirement | Priority |
|---|---|---|
| FR-01 | The system shall allow an employee to submit a natural-language HR policy question via a chat interface. | Must |
| FR-02 | The system shall retrieve policy document passages relevant to the submitted question. | Must |
| FR-03 | The system shall generate an answer grounded in the retrieved passages. | Must |
| FR-04 | The system shall display, alongside each generated answer, a citation identifying the source document/section. | Must |
| FR-05 | The system shall indicate when it cannot find a sufficiently relevant policy passage, rather than generating an unsupported answer. | Must |
| FR-06 | The system shall maintain a record of each question and answer for the duration of a user's session. | Should |
| FR-07 | The system shall allow an administrator to add or update policy documents in the knowledge base. | Should |
| FR-08 | The system shall support swapping the underlying LLM provider without changes to the retrieval layer. | Could (architecture-level, not user-facing this trimester) |
| FR-09 | The system shall version policy documents so that answers reflect the currently active version. | Could (future phase) |
| FR-10 | The system shall provide a dashboard summarising most-asked and unanswered questions. | Won't (this trimester) — future SaaS phase |

Priority uses MoSCoW (Must/Should/Could/Won't), chosen because it is simple enough for all three team members — including those without a technical background — to apply consistently when reviewing scope trade-offs together.
