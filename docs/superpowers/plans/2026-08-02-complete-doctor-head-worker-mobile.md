# Complete Doctor and Head Worker Mobile Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the production mobile areas for Veterinarian and Head Worker with exactly two tabs each, shared workflow components, authenticated API integration, complete state handling, and final regression verification.

**Architecture:** Keep role routing in Expo Router and authorization in the existing `AuthProvider`/`RoleGuard`. Add a typed workflow client and focused shared presentation components, then implement Doctor and Head Worker screens independently on top. Backend routes and database workflow are already implemented and remain the source of truth.

**Tech Stack:** React Native 0.81, Expo SDK 54, Expo Router 6, TypeScript, Axios, NativeWind, Supabase Auth, FastAPI.

**Required sequencing:** The user explicitly requested that all implementation be completed before any tests are written or run. Tasks 1–4 therefore perform implementation and read-only review only. Tests and commands run exclusively in Task 5.

---

### Task 1: Shared mobile workflow foundation

**Files:**
- Create: `mobile/types/workflow.ts`
- Create: `mobile/services/workflow.ts`
- Create: `mobile/utils/workflow.ts`
- Create: `mobile/components/workflow/StaffScreenHeader.tsx`
- Create: `mobile/components/workflow/WorkflowStatusBadge.tsx`
- Create: `mobile/components/workflow/WorkflowStateView.tsx`
- Create: `mobile/components/workflow/WorkflowCaseCard.tsx`
- Create: `mobile/components/workflow/WorkflowCaseDetails.tsx`
- Create: `mobile/components/workflow/WorkflowDetailModal.tsx`

- [ ] Define exact API types for diseases, verdicts, statuses, workflow items, list responses, validation mutations, dashboard counts, and dashboard responses.
- [ ] Implement Axios functions for all four Doctor endpoints and all five Head Worker endpoints, including typed query filters.
- [ ] Implement pure label/date/error/action helpers. Indonesian status and verdict labels must exactly match product language.
- [ ] Build shared header with role title, supporting subtitle, logo, accessible logout action, and safe-area spacing.
- [ ] Build reusable loading, empty, error/retry, status badge, case card, case detail, and base modal components.
- [ ] Follow `mobile/DESIGN.md`: Outfit typography, white/neutral surfaces, brand blue, functional status colors, border hierarchy, no heavy shadows or decorative animation.
- [ ] Do not run tests or TypeScript yet.

### Task 2: Veterinarian area

**Files:**
- Create: `mobile/app/doctor/(tabs)/_layout.tsx`
- Create: `mobile/app/doctor/(tabs)/index.tsx`
- Create: `mobile/app/doctor/(tabs)/history.tsx`
- Create: `mobile/components/workflow/ValidationModal.tsx`
- Modify only if required: `mobile/app/doctor/_layout.tsx`

- [ ] Create exactly two tabs: `Validasi` and `Riwayat`.
- [ ] Validasi fetches the shared pending queue, supports pull-to-refresh, and handles initial loading, empty, error, retry, and modal detail states.
- [ ] Validation modal shows image, AI label, confidence, probabilities, worker, timestamp, recommendation, three verdicts, optional note, and correction choices excluding the current AI class.
- [ ] Client validation requires a correction for `incorrect` and removes correction for other verdicts.
- [ ] Successful create closes the modal and refreshes the queue. HTTP 409 explains first-write-wins, closes stale detail, and refreshes.
- [ ] Riwayat fetches only the current doctor's backend-owned history and presents verdict/effective label/status.
- [ ] History detail allows editing only when `editable === true`; update uses the validation ID and handles 404/409/422 without exposing backend internals.
- [ ] Provide accessible labels, disabled/busy states, and no profile page.
- [ ] Do not run tests or TypeScript yet.

### Task 3: Head Worker area

**Files:**
- Create: `mobile/app/head-worker/(tabs)/_layout.tsx`
- Create: `mobile/app/head-worker/(tabs)/index.tsx`
- Create: `mobile/app/head-worker/(tabs)/follow-ups.tsx`
- Create: `mobile/components/workflow/FollowUpActionPanel.tsx`
- Modify only if required: `mobile/app/head-worker/_layout.tsx`

- [ ] Create exactly two tabs: `Dashboard` and `Tindak Lanjut`.
- [ ] Dashboard loads four summary counts and latest cases, with pull-to-refresh plus loading/error/retry/empty states.
- [ ] Tindak Lanjut loads follow-ups and supports a compact status filter without creating another page.
- [ ] Detail modal displays AI/effective label, status, doctor verdict/note, recommendation, timestamps, and clear locked-state explanations.
- [ ] Offer `Sudah dipisahkan` only when isolation is missing and case is open; allow it before validation.
- [ ] Offer `Mulai penanganan` only for `ready_for_treatment`.
- [ ] Offer `Penanganan selesai` only for `active_treatment`.
- [ ] Use native confirmation alerts before mutations; show busy state, refresh dashboard/list after success, and map transition conflicts to understandable messages.
- [ ] Display `Perlu pemeriksaan lebih lanjut`, automatic Healthy closure, and completed treatment as terminal/locked informational states.
- [ ] Do not run tests or TypeScript yet.

### Task 4: Integration hardening and documentation status

**Files:**
- Modify as needed: all files created in Tasks 1–3
- Modify: `panduan/TaskBreakdown.md`
- Modify: `panduan/STRUKTUR_PROYEK.md`
- Modify: `panduan/KONTEKS_PEMBARUAN_ROLE_BARU_UNTUK_AI_SKRIPSI.md`
- Modify: `panduan/BAB4_DRAFT.md`
- Modify: `panduan/HASIL_PENGUJIAN.md` only to add pending test rows before verification; do not mark manual scenarios Pass.

- [ ] Verify by code inspection that `/doctor` and `/head-worker` resolve to real `(tabs)` routes and RoleGuard remains the parent boundary.
- [ ] Ensure both role areas use the shared authenticated Axios client and never access workflow tables directly from Supabase.
- [ ] Check list render callbacks, memoized case cards, stable keys, safe-area spacing, modal keyboard behavior, image handling, and 44px touch targets.
- [ ] Ensure every network state has loading, empty, error, retry, refresh, and mutation feedback.
- [ ] Update documentation from “UI pending” to “implemented, automated/manual verification pending.”
- [ ] Do not run tests, TypeScript, Expo, or build commands yet.

### Task 5: Tests and full verification after implementation

**Files:**
- Create: `mobile/tests/workflow.test.ts`
- Modify if failures reveal implementation defects: relevant feature files only
- Modify after verified outputs: `panduan/HASIL_PENGUJIAN.md`, `panduan/BAB4_DRAFT.md`, `panduan/TaskBreakdown.md`

- [ ] Add pure unit tests for status labels, verdict labels, correction validation, error mapping, and Head Worker action availability.
- [ ] Run mobile tests: `cd mobile && npm test -- --runInBand`.
- [ ] Run TypeScript: `cd mobile && npx tsc --noEmit`.
- [ ] Run full backend tests: `cd backend && .venv/bin/python -m pytest -q`.
- [ ] Run documentation contract tests and `git diff --check`.
- [ ] If commands fail, diagnose and fix implementation, then rerun the affected command and the full regression set.
- [ ] Record only actual automated results. Keep real-device/Supabase E2E and screenshots marked `Belum diuji` unless performed with evidence.

### Task 6: Final review and branch completion

**Files:**
- Review all changed feature files and user documentation.

- [ ] Run independent specification review against the original four-role plan.
- [ ] Run independent code-quality review for React Native correctness, performance, accessibility, and error safety.
- [ ] Resolve every concrete finding and rerun full verification.
- [ ] Use the finishing-development workflow to report the branch state without overwriting or discarding the user's existing changes.
