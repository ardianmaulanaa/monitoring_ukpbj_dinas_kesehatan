# Validation Standard SIMUKPBJ

## Principles

- Browser validation improves UX; server validation is authoritative.
- Validate type, requiredness, length, enum, range, date, cross-field rules, workflow transition, role, and object/unit scope.
- Normalize optional blank strings to `null`; do not silently convert invalid numbers/dates to meaningful values.

## Planning/RUP

- `kodeRup` must be unique and fit 80 chars; package name 220; unit 160; source 120.
- `pagu` and applicable estimates must fit Decimal(18,2); year must be a valid integer.
- Method/status values must be schema enums.
- Only draft/revision can be submitted/edited (except approved SUPER_ADMIN bypass); approval transition must match current stage.
- LEADER object scope must match proposal unit.

## E-Purchasing

- Product: name required max 220; quantity/harga positive; unit required max 60; platform required max 80; brand 160; display 160; category 120; link 255.
- Provider identity required; negotiation values positive; payment value nonnegative.
- Prerequisite completeness is enforced before entering a stage.
- Eligibility is checked on server before write.
- Completion requires authoritative final status, not merely one intermediate date/form.
- Duplicate/constraint/length errors must return specific safe feedback (`P2000` length, `P2002` conflict where applicable).

## Pengadaan Langsung

- Hanya RUP ber-metode `PENGADAAN_LANGSUNG` yang dapat dimutasi; `NON_TENDER` tidak boleh dipetakan implisit.
- Payload tahap memakai discriminated server mapping dan Zod; multi-item maksimal 100, volume positif, nominal non-negatif, nilai kontrak tidak melebihi pagu.
- Dokumen dibatasi PDF/JPG/PNG maksimal 10 MB dan selalu direlasikan ke paket workflow.

## Dates and money

- Native Date fields require valid ISO-compatible dates and business ordering where relevant.
- E-Purchasing string dates must be parsed defensively; invalid/missing dates do not enter monthly realization.
- Never infer a currency multiplier. Aggregate raw Decimal values then round only presentation.
- Contract and realization are different concepts and must not be substituted.

## Error contract

Use Indonesian field-specific messages for invalid input, HTTP 400/422 for validation, 401 unauthenticated, 403 unauthorized, 404 not found, 409 conflict, and safe 500 for unknown server failures. Server logs may contain error code/entity ID but not secrets or complete sensitive payloads.

## Frontend/backend consistency

Input `maxLength`, required state, and numeric constraints must match Zod and Prisma. A frontend option must map to a valid enum/string accepted server-side. Changes require boundary tests at exactly max and max+1.

## Duplicate prevention

Rely on schema unique constraints for concurrency safety and catch conflict errors. Client pre-checks alone are insufficient.

## Known gaps

- Many workflow status/date fields are free-form strings; stricter shared schemas are recommended.
- Full validation consistency across all legacy/general APIs is **NEEDS VERIFICATION** because no automated contract suite exists.

## VMS validation

- NIB dinormalisasi menjadi karakter alfanumerik kapital dan dijaga unik oleh database.
- Payload create vendor dan produk menggunakan Zod dengan batas panjang sesuai schema.
- `NEEDS_REVISION` mewajibkan catatan; transisi status diperiksa ulang di transaction server.
- Semua mutation VMS wajib memverifikasi JWT dan action permission; ID yang diterima tidak pernah menjadi bukti otorisasi.
- Form create vendor memakai `vendorCreateSchema` yang sama dengan API agar requiredness, format, dan panjang field konsisten. Error `422` dipetakan ke field, konflik NIB `409` ditampilkan spesifik, dan kegagalan validasi/jaringan/server tidak boleh mereset input atau menutup modal.
- Field opsional VMS boleh dikirim sebagai string kosong dari kontrol HTML dan dinormalisasi menjadi `null` sebelum penyimpanan Prisma; deskripsi usaha, NPWP, dan website tidak boleh ditandai wajib oleh frontend.
