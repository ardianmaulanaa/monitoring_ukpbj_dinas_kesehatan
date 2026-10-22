# Documentation Changelog

## 2026-10-22 — Modal create vendor dan feedback validasi

- Tombol Tambah Vendor pada Direktori Penyedia kini membuka `ModalShell` shared tanpa navigasi route.
- Form vendor dipindahkan menjadi komponen shared untuk modal dan route fallback `/vendor-management/vendors/new`.
- Validasi client dan API memakai schema Zod yang sama, pesan validation error dibuat spesifik dan dipetakan ke field.
- Data form dipertahankan pada validation, conflict, network, dan server error; reset/close hanya terjadi setelah simpan berhasil.
- Deskripsi usaha yang opsional tidak lagi keliru ditandai wajib pada frontend.

## 2026-10-22 — Vendor Management System foundation

- Area: additive database design/migration, vendor onboarding workflow, server RBAC, sidebar/routes, database-backed dashboard and read views.
- Status: PARTIAL; core vendor create, submit, revise, verify, archive, search/pagination, history, and audit are implemented. Remaining product/presentation/evaluation mutations, secured files, export, scheduled notifications, and portal are documented gaps.
- Documents: `PRD.md`, `WORKFLOW.md`, `DATABASE.md`, `RBAC_MATRIX.md`, and this changelog.
- Verification: Prisma validate/generate and TypeScript were run; final lint/build status is recorded in the implementation report. Migration was generated but not applied to production.

## 2026-10-20 — Pengadaan Langsung module

- Area: navigation, RUP procurement workflow, dashboard, database, RBAC, validation, responsive UI, and documents.
- Summary: added a dedicated nine-tab `PENGADAAN_LANGSUNG` module and independent workflow storage while retaining historical `NON_TENDER` classification.
- Dashboard: added database-backed statistics, source-fund distribution, workflow-derived status/progress, server-side search and filters, sorting, pagination, responsive table/cards, and filtered CSV export.
- Documents: `PRD.md`, `WORKFLOW.md`, `DATABASE.md`, `DATA_DICTIONARY.md`, `VALIDATION_STANDARD.md`, `RBAC_MATRIX.md`, `TESTING_STANDARD.md`, and `DESIGN_SYSTEM.md`.
- Verification: recorded in the implementation report; production migration was not applied.

## 2026-10-20 — Independent E-Purchasing execution notes

- Area: E-Purchasing Pengiriman, Pemeriksaan, and Pembayaran.
- Summary: documented independent nullable note columns and explicit per-stage form/action mapping; preserved ambiguous historical `catatan_katalog` without automatic copying.
- Documents: `WORKFLOW.md`, `DATABASE.md`, `DATA_DICTIONARY.md`, and `TESTING_STANDARD.md`.
- Verification: Prisma validation, TypeScript, ESLint, production build, and behavior-test status are recorded in the implementation report.

## 2026-10-19 — Compact SIRUP/RUP package cards

- Area: SIRUP/RUP responsive UI.
- Summary: replaced the 2780px desktop package grid and horizontal scrolling with compact responsive cards; preserved Detail and permission-controlled actions.
- Documents: `DESIGN_SYSTEM.md`.
- Verification: targeted ESLint and TypeScript checks; production build and browser viewport verification recorded in the implementation report.

## 2026-10-17 — Full documentation audit and synchronization

- Area: product, workflow, dashboard, database, architecture, design, RBAC, security, validation, testing, coding policy, diagrams.
- Summary: replaced mixed target/current descriptions with audited status-aware documentation; documented Dashboard data sources and linear trend; recorded RBAC/data-model/test gaps; synchronized HTML/SVG workflow diagram; added continuous documentation policy.
- Documents: all Markdown standards in `docs/`, procurement diagrams, and root `AGENTS.md`.
- Commit reference: not available; changes are uncommitted.
- Verification: source/schema/static inspection, Markdown relative-link check, SVG XML validation, Prisma validation, TypeScript, ESLint, and production build passed.

Only verifiable future entries should be added; do not reconstruct undocumented history.
