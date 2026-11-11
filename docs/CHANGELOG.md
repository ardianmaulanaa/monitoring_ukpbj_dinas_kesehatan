# Documentation Changelog

## 2026-11-11 — Single-page VMS workspace

- Menambahkan route utama `/vms` dengan enam tab horizontal berbasis React state dan pola ARIA tab, tanpa membuat route terpisah untuk perpindahan submenu.
- Mengadaptasi pola visual Tabler 1.7.4 ke token, shell, sidebar, typography, Tailwind, modal, RBAC, Prisma, dan Chart.js existing milik SIMUKPBJ; tidak mengimpor Bootstrap atau asset Tabler.
- Dashboard kini menampilkan empat KPI, pertumbuhan registrasi, distribusi kategori/status, aktivitas, dan tindak lanjut dari data database aktual.
- Direktori menyediakan search/filter/sort/pagination dan detail/edit modal; katalog mempertahankan mutation existing; presentasi/evaluasi memakai data aktual dan laporan menyediakan filter serta export CSV berbasis permission.
- Status tetap PARTIAL untuk mutation presentasi/evaluasi lengkap, penyimpanan file privat, export Excel/PDF, notifikasi terjadwal, dan browser/E2E. Tidak ada perubahan schema atau migration database.

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
# 2026-10-25

- Memperbaiki agregasi dashboard agar workflow Pengadaan Langsung ikut menentukan tahap, nilai kontrak, realisasi, tren pembayaran, dan status selesai.
- Mempertahankan RUP sebagai identitas agregasi tunggal untuk mencegah double counting terhadap record `PaketPengadaan` pendamping.
- Menjadikan route dashboard dinamis dan mempertahankan revalidasi setelah penyimpanan tahap agar perubahan workflow langsung tercermin.

## 2026-11-01 — Persentase dan progress kartu Dashboard

- Menambahkan persentase besar dan progress bar aksesibel pada enam KPI, tiga sumber dana, tiga metode pengadaan, serta paket gagal/batal.
- Menampilkan kontribusi pagu/paket dan progres realisasi/penyelesaian dari agregasi database aktual dengan fallback aman `0%`.
- Mempertahankan definisi risiko yang lebih luas dan memisahkannya dari indikator gagal/batal.
- Menyeragamkan layout responsif menjadi satu, dua, dan tiga kolom tanpa mengubah endpoint, schema Prisma, atau filter backend.

## 2026-11-01 — Analisis negosiasi Dashboard

- Menambahkan section perbandingan total penawaran awal dan hasil negosiasi final setelah enam KPI Dashboard.
- Mengagregasi satu pasangan valid per RUP dari E-Purchasing dan Pengadaan Langsung, mengikuti scope/filter backend Dashboard tanpa menggabungkan record pendamping.
- Menampilkan selisih bertanda, efisiensi terhadap penawaran awal, rasio final, breakdown metode, anomali kenaikan, empty state, dan alasan paket dikecualikan.
- Tidak mengubah schema Prisma, data historis, endpoint, atau definisi KPI efisiensi terhadap pagu.
