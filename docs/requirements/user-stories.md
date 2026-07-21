# User Stories

| ID | As a... | I want to... | So that... | Priority |
|---|---|---|---|---|
| US-01 | Employee | ask an HR policy question in plain language | I don't need to know which document to search | Must |
| US-02 | Employee | see which policy document/section an answer came from | I can trust and verify the answer | Must |
| US-03 | Employee | be told clearly when the system can't find a confident answer | I know to ask HR directly instead of trusting a guess | Must |
| US-04 | HR Admin | upload or update a policy document | employees get answers based on the current policy | Should |
| US-05 | HR Admin | see which questions the system couldn't answer | I can identify documentation gaps | Could (future phase) |
| US-06 | Technical Lead | swap the LLM provider without changing the retrieval code | the system isn't locked into one vendor | Could (architecture-level) |
| US-07 | Employee | see my previous questions in the current session | I don't need to re-ask something I already covered | Should |

Owner: Dineli. Each story maps to a Functional Requirement in `docs/assessment-1/functional-requirements.md` (US-01→FR-01/02/03, US-02→FR-04, US-03→FR-05, US-04→FR-07, US-06→FR-08).
