# Diagram and Project Documentation Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Mermaid-based diagram documentation with one clearly named Visual Paradigm Online instruction-and-explanation Markdown file per diagram, then synchronize every project-facing Markdown document with the four-role workflow.

**Architecture:** Diagram folders remain organized by diagram type. Each folder contains one authoritative Markdown guide named `penjelasan diagram <nama>.md`; all `.mmd`, generic `penjelasan.md`, and the combined multi-diagram Markdown are removed. Product, requirements, design, testing, and project-structure documents use the same role names, routes, database entities, permissions, and workflow states as the implemented system.

**Tech Stack:** Markdown, Visual Paradigm Online, pytest documentation-contract tests, repository search with `rg`.

---

### Task 1: Lock the documentation contract

**Files:**
- Create: `backend/tests/test_role_documentation_contract.py`

- [ ] Add failing tests asserting there are no `diagram/**/*.mmd`, no generic `diagram/**/penjelasan.md`, and no `diagram/semua_penjelasan_diagram.md`.
- [ ] Assert every diagram folder has exactly one authoritative `penjelasan diagram *.md` containing sections for purpose, Visual Paradigm construction steps, connector/layout instructions, report explanation, and final checklist.
- [ ] Assert required new diagram guides exist for doctor activity, head-worker activity, validation sequence, follow-up sequence, system flowchart, and component diagram.
- [ ] Assert the use-case, navigation, ERD, login, backend class, architecture, flowchart, and component guides contain the four roles and their relevant responsibilities.
- [ ] Run `.venv/bin/python -m pytest -q tests/test_role_documentation_contract.py` from `backend/` and confirm failures describe the legacy structure.

### Task 2: Replace legacy diagram sources with Visual Paradigm guides

**Files:**
- Delete: every `diagram/**/*.mmd`, every generic `diagram/**/penjelasan.md`, and `diagram/semua_penjelasan_diagram.md`
- Create: one descriptively named Markdown guide in each existing diagram folder
- Create folders/guides: `activity-dokter`, `activity-kepala-pekerja`, `sequence-validasi`, `sequence-tindak-lanjut`, `flowchart-sistem`, `component-diagram`

- [ ] Rewrite existing diagram guides using a consistent template: tujuan, jenis diagram, elemen, langkah Visual Paradigm Online, konektor/relasi, layout, penjelasan laporan, checklist.
- [ ] Update affected diagrams for the shared login, role guards, staff account creation, disease-only validation queue, immediate isolation, veterinarian verdict/correction, treatment gating, and automatic Healthy closure.
- [ ] Keep ML training/inference logic unchanged while converting their guides to the same Visual Paradigm instruction format.
- [ ] Add the six new diagram guides with complete node/lifeline/component lists and exact arrow order; do not embed Mermaid as the primary deliverable.
- [ ] Run the documentation-contract test and fix structural/content failures.

### Task 3: Synchronize product and requirements documents

**Files:**
- Modify: `README.md`, `PREVIEW_PROYEK.md`, `ANALISIS_SISTEM.md`, `mobile/PRODUCT.md`
- Modify: `panduan/PRD.md`, `panduan/SRS.md`, `panduan/SDD.md`, `panduan/STRUKTUR_PROYEK.md`, `panduan/TaskBreakdown.md`

- [ ] Replace the two-role description with Pekerja Kandang, Admin/Pemilik, Dokter Hewan, and Kepala Pekerja.
- [ ] Document shared `/login`, role routes, exactly two tabs per new role, Admin account creation, and unchanged anonymous worker access.
- [ ] Document `staff_profiles`, `prediction_validations`, `prediction_followups`, disease-only/new-data workflow, validation verdicts, correction rules, isolation/treatment states, ownership/edit locking, and role-specific visibility.
- [ ] Update backend endpoint lists, RLS descriptions, directory trees, and data flow to match the implemented code.
- [ ] Preserve the fixed product decisions: no profile pages, no animal/coop identity, recommendations remain visible, Admin does not see/export validation or follow-up data, and historical predictions are not backfilled.

### Task 4: Synchronize report and verification documents

**Files:**
- Modify when relevant: `panduan/BAB4_DRAFT.md`, `panduan/HASIL_PENGUJIAN.md`, `panduan/DeploymentGuide.md`

- [ ] Add implementation-result placeholders/sections for Doctor and Head Worker screens without inventing empirical results.
- [ ] Expand black-box test scenarios for shared login/authorization, doctor validation, correction/uncertain outcomes, immediate isolation, treatment gating, automatic Healthy closure, and cross-role denial.
- [ ] Add deployment notes for applying the staff-workflow migration and bootstrapping existing Auth users as Admin; never include secrets.

### Task 5: Reader and consistency audit

**Files:**
- Modify: any project-facing Markdown found inconsistent by the audit, excluding dependency/tool instruction files such as `node_modules/**`, `.agents/**`, `.codex/**`, and `mobile/AGENTS.md`

- [ ] Run `rg` checks for stale phrases and paths including “dua aktor”, `app/admin/login.tsx` as the primary form, generic `penjelasan.md`, and `.mmd` references.
- [ ] Run the documentation-contract test, full backend tests, mobile tests, and mobile TypeScript check.
- [ ] Reader-test representative guides by asking whether a fresh reader can recreate the diagram in Visual Paradigm without repository context; repair ambiguous nodes, connectors, and role boundaries.
- [ ] Run `git diff --check` and review deletions/renames so seluruh sumber diagram lama (`.mmd` dan `.drawio`) terhapus tanpa menyentuh file pengguna yang tidak terkait.
