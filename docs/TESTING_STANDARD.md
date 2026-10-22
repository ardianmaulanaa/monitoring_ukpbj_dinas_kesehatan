# Testing Standard SIMUKPBJ

> Audit status 2026-10-17: no automated `test` script or test/spec files were found. TypeScript, ESLint, Prisma validation, and production build are quality checks, not substitutes for behavior tests.

## Required layers

- Unit: pure workflow, permission, format, date, stage, and aggregation functions.
- Integration/database: Prisma queries, constraints, transactions, unique conflicts, Decimal/date behavior.
- API/Server Action: authentication, role/object scope, validation, transition, safe error and revalidation.
- UI: loading/empty/error/success, interactions, responsive layout, accessibility.
- E2E: login, navigation, critical planning/E-Purchasing flows, reports.
- Security: forged/expired JWT, missing cookie, wrong role, IDOR/unit scope, injection/invalid input.

## Critical workflow cases

1. Draft/revision submit -> head-unit queue.
2. LEADER can only act within matching unit.
3. Head unit -> PPK/PPTK -> PA/KPA -> SIAP_RUP.
4. Revision returns without skipping stages and history is saved.
5. E-Purchasing prerequisite blocks stage skipping; failed writes do not advance marker.
6. Ready + in-progress + completed equals eligible distinct packages.
7. Saving delivery, inspection, or payment notes changes only that stage's note; refresh/edit and switching between two package IDs must not leak or overwrite notes.
8. Pengadaan Langsung accepts only its enum, keeps `NON_TENDER` historical rows separate, persists seven independent stage payloads, scopes documents by package, and calculates dashboard method counts without double counting.

## Dashboard regression suite

- Shared Sidebar and AppHeader appear once; other routes are unchanged.
- KPI values match direct backend aggregation; no constants/mock fallback.
- Histogram counts RUP by `createdAt` month.
- Funding donut sums pagu by source including BLUD/DBHCHT when present.
- Trend pagu uses RUP pagu/input date; realization uses payment value/payment date.
- Cumulative Oct/Nov/Dec equality renders horizontal; Chart.js datasets have `tension: 0`; exact tooltip value.
- Current-stage chart counts each RUP once.
- Empty states render for no data; no canvas clipping/overflow.
- Check 375, 503, 768, 1024, 1280, and 1440 px with authenticated browser.

## RBAC tests

Test route gate and server handler independently for every supported role. Hidden menu is not proof. Explicitly cover current mismatches such as PROCUREMENT_OFFICER E-Purchasing action access versus route access and helper access to RUP versus route matrix.

## Database aggregation fixtures

Include duplicate child rows, optional nulls, Decimal values, invalid string dates, partial workflow, completed payment, negative correction (if allowed), and multiple funding/unit/year scopes. Assert no name-based joining or double counting.

## Release gate

Minimum current commands:

```bash
cd web
npx tsc --noEmit
npm run lint
npx prisma validate
npm run build
```

Release is blocked by failed required checks, unreviewed migration, known authorization bypass, or documentation contradicting shipped behavior. Until automated tests exist, record manual scenarios and do not claim automated coverage.

## VMS release coverage

Minimum regression: duplicate NIB ditolak, status tidak dapat melompati transition map, alasan revisi wajib, role tanpa permission mendapat 403, pagination/search stabil, audit/status history dibuat dalam transaction yang sama, relasi vendor-paket tidak mengubah paket, dan halaman kosong tidak memakai data palsu. Upload privat, export terfilter, scheduler, serta object ownership portal vendor belum dapat dinyatakan lulus sebelum fiturnya diimplementasikan.

Create vendor juga harus mencakup: modal terbuka tanpa navigasi; X/Batal dan konfirmasi dirty state; validasi field tidak mengosongkan input; konflik NIB, kegagalan jaringan, dan error server mempertahankan modal serta data; sukses menutup modal dan me-refresh Server Component tanpa `window.location.reload()`; serta layout satu kolom tanpa overflow pada mobile.
