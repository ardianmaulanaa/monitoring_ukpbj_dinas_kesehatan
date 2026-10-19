# AGENTS.md - SIMUKPBJ Coding Agent Instructions

Dokumen ini adalah operating instruction untuk coding agent/Codex yang bekerja pada repository SIMUKPBJ.

## Mandatory Reading

Sebelum melakukan perubahan, agent wajib membaca dokumen yang relevan terhadap task:

- `docs/PRD.md`
- `docs/BUSINESS_RULES.md`
- `docs/WORKFLOW.md`
- `docs/RBAC_MATRIX.md`
- `docs/SYSTEM_ARCHITECTURE.md`
- `docs/DATABASE.md`
- `docs/DATA_DICTIONARY.md`
- `docs/VALIDATION_STANDARD.md`
- `docs/DESIGN_SYSTEM.md`
- `docs/SECURITY_STANDARD.md`
- `docs/CODING_STANDARD.md`
- `docs/TESTING_STANDARD.md`

Baca secara relevan, bukan membabi buta:

- UI task: `PRD.md`, `DESIGN_SYSTEM.md`, `CODING_STANDARD.md`.
- Workflow task: `PRD.md`, `BUSINESS_RULES.md`, `WORKFLOW.md`, `RBAC_MATRIX.md`.
- Database task: `DATABASE.md`, `DATA_DICTIONARY.md`, `BUSINESS_RULES.md`.
- Security task: `SECURITY_STANDARD.md`, `RBAC_MATRIX.md`, `SYSTEM_ARCHITECTURE.md`.
- Validation task: `VALIDATION_STANDARD.md`, `BUSINESS_RULES.md`, `DATA_DICTIONARY.md`, `WORKFLOW.md`.
- Test task: `TESTING_STANDARD.md`, dokumen requirement yang dicakup test, dan file implementation terkait.

## Source Of Truth Priority

Jika terjadi konflik, gunakan prioritas berikut:

1. Explicit latest user requirement.
2. Verified schema, migrations, tests, and running implementation for statements about current behavior.
3. Approved requirements in `docs/PRD.md` and business decisions explicitly marked as requirements.
4. `docs/BUSINESS_RULES.md`, `docs/WORKFLOW.md`, and `docs/RBAC_MATRIX.md`.
5. Supporting technical documentation.

Do not silently change code to match stale documentation or rewrite approved requirements to excuse a bug. Investigate the discrepancy, label current versus target behavior, and request direction when fixing it changes an approved business decision.

## Working Rule

Sebelum coding:

1. Pahami requirement.
2. Audit implementation terkait.
3. Bandingkan code dengan documentation.
4. Identifikasi root cause.
5. Identifikasi file yang terdampak.
6. Buat implementation plan singkat.
7. Implementasikan.

## Do Not

- Jangan mengarang business rule.
- Jangan duplicate business logic.
- Jangan hardcode production data.
- Jangan menampilkan database field kepada user.
- Jangan membuat migration tanpa kebutuhan.
- Jangan melewati server-side authorization.
- Jangan memperbaiki bug hanya dengan menyembunyikan error.
- Jangan membuat duplicate component jika shared component dapat digunakan.
- Jangan mengubah design system secara lokal tanpa alasan.
- Jangan melewati workflow state guard.
- Jangan percaya UI hiding sebagai security boundary.
- Jangan memakai stale props, cached modal data, atau state React sebagai dasar approval final.

## Security

- Authorization harus diverifikasi di server.
- Semua input tidak dipercaya.
- Secrets tidak boleh di-commit.
- JWT/session payload harus diverifikasi signature-nya sebelum dipercaya.
- API route dan server action yang membaca/mengubah data harus punya autentikasi, otorisasi role, dan object-level authorization.
- Action penting harus dicatat di audit trail/history.

## Database

Prisma schema adalah technical source of truth untuk database existing. `BUSINESS_RULES.md` dan `DATA_DICTIONARY.md` menjelaskan semantics.

Jika perubahan schema diperlukan:

- jelaskan alasan,
- buat migration aman,
- pertimbangkan existing data,
- jangan edit migration production yang sudah berjalan,
- jalankan Prisma generate setelah schema berubah.

## UI

- Ikuti `docs/DESIGN_SYSTEM.md`.
- Gunakan shared components.
- Responsive wajib diperiksa.
- Jangan membuat status label, currency formatter, date formatter, atau permission mapping lokal jika sudah ada shared helper.

## Bug Fix

Untuk bug:

1. Reproduce.
2. Cari root cause.
3. Perbaiki root cause.
4. Tambahkan regression protection/test jika feasible.
5. Pastikan tidak merusak workflow lain.

## After Implementation

Agent wajib menjalankan command sesuai tooling project:

- lint
- typecheck jika tersedia
- tests jika tersedia
- build

Jika command tidak tersedia, laporkan dengan jelas.

## Final Report

Laporkan:

- root cause / tujuan perubahan,
- files changed,
- requirement IDs,
- business rule IDs,
- tests performed,
- lint,
- typecheck,
- build,
- outstanding risk.

## Documentation-First Awareness (Definition of Done)

Untuk setiap task perubahan kode, agent wajib:

1. Membaca dokumentasi yang relevan sebelum mengubah fitur.
2. Memeriksa dokumen yang berpotensi terdampak.
3. Mengimplementasikan perubahan sesuai scope.
4. Memperbarui hanya dokumentasi relevan dalam task yang sama.
5. Memastikan dokumentasi tidak bertentangan dengan kode dan membedakan IMPLEMENTED, PARTIAL, PLANNED, NEEDS VERIFICATION, dan DEPRECATED.
6. Menambahkan perubahan dokumentasi material ke `docs/CHANGELOG.md`.
7. Memberi tahu pengguna secara eksplisit bahwa dokumentasi berubah, file apa, ringkasan, alasan, dan hal yang belum terverifikasi.

Mapping minimum:

- Dashboard UI/layout: `DESIGN_SYSTEM.md`, `design-brief.md`, dan `PRD.md` bila requirement berubah.
- KPI/agregasi: `BUSINESS_RULES.md`, `DATA_DICTIONARY.md`, `PRD.md`, `TESTING_STANDARD.md`.
- Prisma schema: `DATABASE.md`, `DATA_DICTIONARY.md`, dan `SYSTEM_ARCHITECTURE.md` bila boundary berubah.
- Workflow: `WORKFLOW.md`, `BUSINESS_RULES.md`, `PRD.md`, `VALIDATION_STANDARD.md`, serta `RBAC_MATRIX.md` bila akses berubah.
- Authentication/authorization: `SECURITY_STANDARD.md`, `RBAC_MATRIX.md`, `SYSTEM_ARCHITECTURE.md`.
- Shared component/layout: `DESIGN_SYSTEM.md`, dan `CODING_STANDARD.md` bila polanya berubah.
- Deployment: `SYSTEM_ARCHITECTURE.md` dan dokumentasi deployment terkait.

Tidak perlu menyentuh semua dokumen untuk perubahan kecil. Jika bug fix hanya menyelaraskan kode dengan requirement yang sudah benar, jangan mengubah requirement agar mengikuti bug lama.

### Mandatory Documentation Update Report

Jika ada dokumentasi diubah, final response harus memuat: task, source changes, documentation files + isi/alasan, documentation not changed bila relevan, implementation status, validation results, dan notes/unverified decisions. Documentation synchronization adalah bagian dari definition of done.
