# Test Report — 2026-10-24

**Automated suite: 11/11 PASS** (`npm test` — Node test runner + Supertest, isolated temp DB per run). Frontend production build passes (Vite). Manual curl/Python E2E + PDF check pass on the live server.

| # | Test | Result |
|---|---|---|
| 1 | Variance 5% boundary (≤5 Green, >5 Red; 700000 vs 738500 = 5.21%) | ✅ |
| 2 | Plate verification rejects invalid, passes Indian format | ✅ |
| 3 | Platform accuracy score penalizes variance | ✅ |
| 4 | Wrong password 401, unauthenticated 401 | ✅ |
| 5 | OTP request/verify + wrong OTP 401 | ✅ |
| 6 | Inspector cannot create jobs (403 role guard) | ✅ |
| 7 | Invalid registration → 422 with verification detail | ✅ |
| 8 | Far inspector radius-blocked (403); exclusive accept — second accept 409 | ✅ |
| 9 | GREEN E2E: inspection→AI→auto-approve→report→rating 0.4/0.6→settle; duplicate inspection/rate/settle all 409; instant pay exactly once; seeker summary hides AI valuation | ✅ |
| 10 | Fraud E2E: duplicate hashes + GPS mismatch + odometer tamper → fraud ≥55, RED, settle blocked, admin audit approves at senior final | ✅ |
| 11 | RATING_PRIORITY blocks lower-rated inspector in window, top-rated accepts | ✅ |

Bugs found & fixed during development: ledger INSERT column count (10 vs 9), valuations INSERT column count (12 vs 11), pipeline-failure rollback (inspection/ledger never stranded), Vitest↔`node:sqlite` incompatibility (moved to Node test runner).
Known limits (by design, documented): AI/vendors are deterministic simulators behind provider interfaces; OTP is demo-mode; SQLite suits demo/single-node — Postgres swap documented in TECH_STACK_DECISION.md.
