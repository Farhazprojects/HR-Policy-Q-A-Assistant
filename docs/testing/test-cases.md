# Test Cases (Initial Set — expanded in Assessment 3)

| ID | Description | Preconditions | Steps | Expected Result | Linked Requirement |
|---|---|---|---|---|---|
| TC-01 | Submit a clear, in-scope HR question | Sample policy documents loaded | Ask "How many days of annual leave do I get?" | Answer returned with citation to leave policy section | FR-01, FR-02, FR-03, FR-04 |
| TC-02 | Submit a question with no matching policy content | Sample documents loaded, question outside their scope | Ask an unrelated question | System responds that it cannot find a confident answer, does not fabricate one | FR-05 |
| TC-03 | Submit the same question twice in one session | Session active | Ask question A, then ask it again | Both answers consistent with each other and with the source document | NFR-01 |
| TC-04 | View citation source | Answer returned | Click/inspect the citation | Citation correctly identifies the source document and section | FR-04, NFR-04 |
| TC-05 | Admin uploads an updated policy document | Admin access (future phase) | Upload revised leave policy | Subsequent answers reflect the updated content | FR-07 |
| TC-06 | Response time under normal load | System running in dev environment | Submit a question | Answer returned within a few seconds | NFR-02 |

Owner: Dineli (design) / Isuru (execution coordination, UAT). Expanded with edge cases and automated test mappings once `src/backend` and `src/ai/rag` have implementations to test against (Assessment 2–3).
