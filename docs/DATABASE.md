# Database SIMUKPBJ

> Audited 2026-10-17 from `web/prisma/schema.prisma` and five migration directories. No migration or data mutation was performed during this audit.

## Platform

- PostgreSQL, accessed with Prisma ORM/client 6.19.3 (despite project context sometimes calling it Prisma 7).
- Production-compatible Compose uses PostgreSQL 16 Alpine and applies `prisma migrate deploy` at app start.
- Connection is supplied by `DATABASE_URL`; credentials must never appear in documentation.

## Domain model

| Domain | Models | Relationship notes |
|---|---|---|
| Identity/RBAC | `User`, `Role`, `UserRole` | many-to-many; `(userId,roleId)` unique |
| Audit | `AuditLog` | optional User, `SetNull` on user deletion |
| Planning/RUP/E-Purchasing | `RencanaUmumPengadaan`, `UsulanVerificationHistory`, `SumberDana` | verification history cascades with proposal; E-Purchasing stored as columns on RUP |
| Procurement execution | `PaketPengadaan`, `Kontrak`, `RisikoMitigasi`, `RealisasiBelanja`, `ProgresPaket`, `SerahTerima`, `TimelineEvent`, `AuditChecklist` | child links optional; mostly `SetNull` |
| Supporting | `DataBarang`, `Penyedia`, `KlinikKonsultasi`, `DokumenTemplate`, `LaporanTersimpan` | independent/master records |

Important: `RencanaUmumPengadaan` has no foreign key to `PaketPengadaan` or `Kontrak`. Dashboard RUP aggregation therefore reads RUP directly and must not join by package name.

## Types and money

- IDs are UUID strings stored as `Char(36)`.
- Money and quantities use PostgreSQL `Decimal(18,2)`; percentages use `Decimal(5,2)` where applicable.
- Application aggregation currently converts Prisma Decimal to JavaScript Number. This is adequate for current values but exact arithmetic beyond Number safe precision requires Decimal-based aggregation.
- Several E-Purchasing date fields are `VarChar(120)`, not `Date`; parsing failure must be treated as missing date, not coerced silently.

## Constraints and indexes

- Unique: user email; role code; user-role pair; item/package/contract/provider/document business identifiers; `RencanaUmumPengadaan.kodeRup`; `SumberDana.kode`; audit checklist `(paketId,dokumen)`.
- Indexed filters include year, source, unit/name, method, status, createdAt, relation IDs, and workflow marker fields as declared in schema.
- String length constraints are enforced via `VarChar`; server validation must mirror these limits.
- Enums enforce identity, procurement, package, contract, risk, timeline, and document states. E-Purchasing sub-statuses remain strings and need application validation.

## Transactions and integrity

- Use Prisma `$transaction` when one business action changes multiple records/history entries.
- Never catch a failed child write and leave a workflow marker advanced.
- Map known Prisma errors (`P2000`, `P2002`, relation/not-found errors) to safe client messages; log technical code without payload secrets.
- Count packages by primary ID/row, not child-row count.
- Normalize empty optional input to `null`; validate Decimal range before write.

## Migrations

Known migrations:

1. `20261001000000_init_postgresql`
2. `20261003132000_extend_planning_needs_workflow`
3. `20261004114500_add_status_usulan_workflow`
4. `20261005043700_extend_e_purchasing_workflow`
5. `20261011172000_extend_planning_approval_hierarchy`
6. `20261020060000_separate_e_purchasing_notes`
7. `20261020073000_add_pengadaan_langsung_workflow`

Migrasi keenam menambah kolom nullable `catatan_pengiriman`, `catatan_pemeriksaan`, dan `catatan_pembayaran`. Migrasi tidak mengubah atau menyalin `catatan_katalog`, sehingga data historis tetap utuh dan tidak diklasifikasikan ke tahap yang belum diketahui asalnya.

Migrasi ketujuh menambah tabel satu-ke-satu `pengadaan_langsung_workflow` yang mereferensikan RUP dan paket monitoring existing. Seluruh kolom tahap nullable dan tidak ada update/backfill terhadap `NON_TENDER`.

Production changes require reviewed migration SQL, recent restorable backup, explicit approval, `prisma migrate deploy`, and post-deploy verification. Never run `migrate reset` or unreviewed `db push` in production.

## Backup and recovery policy

- Backup PostgreSQL before schema deployment; record timestamp, database, checksum/location, and restore procedure.
- Test restoration outside production periodically.
- Application container restart is not a backup.
- Secrets and dumps must not enter Git.

## Known risks

- App Compose command currently runs `prisma db seed` at every start; production idempotency and safety are **NEEDS VERIFICATION**.
- String dates and duplicate domain paths (RUP workflow versus generic package models) increase reconciliation risk.
- No automated database aggregation test suite was found.

See [Data dictionary](DATA_DICTIONARY.md), [Business rules](BUSINESS_RULES.md), and [System architecture](SYSTEM_ARCHITECTURE.md).

## VMS migration

Migration `20261022103000_add_vendor_management` bersifat additive: menambah enum status serta tabel `vendors`, kontak, dokumen, kategori/assignment, produk/attachment, presentasi/produk/hasil teknis, relasi paket, kriteria/evaluasi/skor, dan status history. Tidak ada tabel atau data lama yang dihapus. `VendorProcurementLink` mereferensikan `PaketPengadaan`; ia tidak menyalin atau mengubah nilai/status paket sumber.
