# RBAC Matrix SIMUKPBJ

> Audited 2026-10-17. Matrix below reflects `access-control.ts` route access. Mutation permissions may be narrower/different and must be checked in each handler.

## Roles

Schema roles: SUPER_ADMIN, LPSE_ADMIN, OPERATOR, LEADER, PPTK, PA, KPA, PPK, PROCUREMENT_OFFICER, SELECTION_WORKGROUP, UKPBJ, AUDITOR, VIEWER.

## Route access

| Module | Allowed non-super roles | View | Mutation notes |
|---|---|---|---|
| Dashboard/notifications/profile/timeline | LEADER, PA, KPA, PPK | yes | primarily read/profile-specific |
| Perencanaan/SIRUP | LEADER, PA, KPA, PPK | yes | workflow helper grants OPERATOR edit and UKPBJ/LPSE RUP processing, but route matrix does not: **GAP** |
| Verifikasi | LEADER, PPTK, PPK, PA, KPA, UKPBJ, LPSE_ADMIN | yes | approval stage helpers + unit scope |
| E-Purchasing/Tender | PPK | yes | E-Purchasing action also permits PROCUREMENT_OFFICER: **GAP** |
| Package procurement | LEADER, PA, KPA, PPK | yes | handler checks require audit |
| Data barang | PPK | yes | handler checks require audit |
| Contract/SP | PA, KPA, PPK | yes | handler checks require audit |
| Progress/handover/realization/risk | PA, KPA, PPK | yes | handler checks require audit |
| Audit readiness | PA, KPA, PPK | yes | helper matches |
| Klinik UKPBJ | LEADER, PPK | yes | server actions include local role guards |
| Reports | PA, KPA, PPK | yes/export UI | endpoint authorization NEEDS VERIFICATION |
| Docs template | LEADER, PA, KPA, PPK | yes | includes procurement role set effectively PPK |
| Master/settings/admin | none | SUPER_ADMIN only | sync also LPSE_ADMIN |
| Vendor market | none | DEPRECATED/redirected | no access |

SUPER_ADMIN bypasses route role rules. OPERATOR, PROCUREMENT_OFFICER, SELECTION_WORKGROUP, UKPBJ, AUDITOR, VIEWER, and LPSE_ADMIN have limited or no general route access despite enum existence; do not infer intended access.

## Planning mutation authority

| Action | Roles | Scope |
|---|---|---|
| Edit draft/revision | OPERATOR, SUPER_ADMIN | proposal edit guard; route mismatch currently blocks normal OPERATOR navigation |
| Head-unit verification | LEADER, SUPER_ADMIN | same unit/name scope for LEADER |
| PPK/PPTK validation | PPK, PPTK, SUPER_ADMIN | global by current helper |
| PA/KPA approval | PA, KPA, SUPER_ADMIN | global by current helper |
| Process RUP | UKPBJ, LPSE_ADMIN, SUPER_ADMIN | route mismatch noted |
| E-Purchasing action | PPK, PROCUREMENT_OFFICER, SUPER_ADMIN | eligibility + workflow guard |
| Pengadaan Langsung read/write | PPK, PROCUREMENT_OFFICER, SUPER_ADMIN | route + server role, method, and RUP ID guard |
| Delete planning proposal | SUPER_ADMIN | server helper |
| SIRUP sync | SUPER_ADMIN | server helper |

## Enforcement rules

- Route proxy/menu filtering is defense-in-depth only.
- Every API/Server Action must verify signed JWT and role again.
- Object-level authorization is mandatory for unit-bound proposals and record IDs.
- Export, delete, approval, reset, and admin operations require explicit server guards and audit logging.

## Verified gaps

1. `access-control.ts` does not grant OPERATOR `/perencanaan`, although edit helper expects OPERATOR.
2. It does not grant UKPBJ/LPSE_ADMIN `/sirup-rup`, although RUP helper expects them.
3. It does not grant PROCUREMENT_OFFICER E-Purchasing routes, although Server Action permits it.
4. AUDITOR/VIEWER have no broad read routes in current matrix.
5. Endpoint-by-endpoint RBAC is not covered by automated tests.

These are findings, not silently approved business changes. Resolve through explicit access decisions and regression tests.

## VMS permissions

- `SUPER_ADMIN`: seluruh aksi VMS.
- `UKPBJ`/`LPSE_ADMIN`: pengelolaan vendor/produk, verifikasi, penjadwalan, review, laporan; arsip hanya UKPBJ/SUPER_ADMIN.
- `PPK`: baca, pengajuan/evaluasi teknis, evaluasi kinerja hingga finalisasi, laporan.
- `PPTK`, `PROCUREMENT_OFFICER`, `SELECTION_WORKGROUP`: akses operasional terbatas sesuai `vendor-management.ts`.
- `LEADER`, `PA`, `KPA`, `AUDITOR`, `VIEWER`: monitoring/read; export hanya role yang dipetakan eksplisit.

API vendor yang baru memverifikasi JWT bertanda tangan dan permission di server; proxy/menu hanya defense-in-depth.
