# Business Rules SIMUKPBJ

> Audited 2026-10-17 against `schema.prisma`, `planning-workflow.ts`, server actions, and dashboard aggregation.

## Status notation

- **IMPLEMENTED:** enforced by code/schema.
- **PARTIAL:** UI/data exists but enforcement or coverage is incomplete.
- **NEEDS VERIFICATION:** cannot be proven without runtime/E2E evidence.

## Perencanaan dan verifikasi

1. Operator dapat mengedit usulan hanya saat `DRAFT` atau `PERLU_REVISI`; `SUPER_ADMIN` bypasses this edit guard.
2. Submit valid bergerak dari draft/revisi ke `MENUNGGU_VERIFIKASI_KEPALA_UNIT` (legacy `DIAJUKAN` masih dikenali).
3. Kepala unit (`LEADER`) hanya memproses unit yang cocok dengan `unitKerja` atau nama aktor; `SUPER_ADMIN` dapat memproses semua.
4. Approval kepala unit: ke `MENUNGGU_VALIDASI_PPK_PPTK`; PPK/PPTK: ke `MENUNGGU_PERSETUJUAN_PA_KPA`; PA/KPA: ke `SIAP_RUP`.
5. Setiap tingkat dapat meminta revisi ke `PERLU_REVISI`.
6. Checklist verifikasi terdiri dari kebutuhan, uraian, jumlah/satuan, spesifikasi, estimasi, prioritas, justifikasi, mapping anggaran, dan dokumen.
7. Aksi verifikasi menyimpan `UsulanVerificationHistory`; kelengkapan audit log global untuk semua aksi adalah **NEEDS VERIFICATION**.

Canonical `StatusUsulan`: `DRAFT`, `DIAJUKAN`, `MENUNGGU_VERIFIKASI_KEPALA_UNIT`, `DIVERIFIKASI_KEPALA_UNIT`, `MENUNGGU_VALIDASI_PPK_PPTK`, `DIVALIDASI_PPK_PPTK`, `MENUNGGU_PERSETUJUAN_PA_KPA`, `DISETUJUI_PA_KPA`, `PERLU_REVISI`, `SIAP_RUP`, `RUP_TAYANG`. Beberapa status intermediate tersimpan di enum untuk kompatibilitas, tetapi transisi aktif melewati status `DIVERIFIKASI_*`/`DIVALIDASI_*` langsung ke antrean berikutnya.

## RUP/SIRUP

- Hanya role proses RUP (`SUPER_ADMIN`, `UKPBJ`, `LPSE_ADMIN`) yang diizinkan oleh helper workflow; route-level matrix saat ini lebih sempit untuk `/sirup-rup` dan merupakan gap yang harus diuji.
- `kodeRup` unik. Status RUP memakai enum `RupStatus`.
- RUP tayang bukan bukti bahwa proses procurement selesai.

## E-Purchasing

- Eligibility mengikuti helper `isEligibleForEPurchasing`, metode `E_PURCHASING`, serta data/status RUP yang diperlukan.
- Mutasi tahap hanya untuk `SUPER_ADMIN`, `PPK`, atau `PROCUREMENT_OFFICER` pada server action. Route UI saat ini hanya membuka untuk `SUPER_ADMIN`/`PPK`; ini adalah mismatch terdokumentasi.
- Urutan tahap: produk -> penyedia -> negosiasi -> kontrak/SP -> pengiriman -> pemeriksaan/BAST -> pembayaran. `workflow-completeness.ts` memeriksa prerequisite sebelum masuk tahap berikut.
- Nilai produk/nego/pembayaran harus numerik sesuai Zod; batas panjang string diselaraskan dengan constraint database untuk form produk.
- Marker `statusTransaksiKatalog` berupa string (`PRODUK`, `PENYEDIA`, `NEGOSIASI`, `KONTRAK`, `PENGIRIMAN`, `PEMERIKSAAN`, `PEMBAYARAN`, `SELESAI`). Historical label dapat berbeda dan dipetakan defensif.
- Selesai authoritative: `statusTransaksiKatalog = SELESAI` atau `statusPembayaranEp = DIBAYAR`.

### Hitungan proses dinamis

Untuk row RUP eligible E-Purchasing:

`eligible = ready + inProgress + completed`

- **Ready:** current stage masih planning/verification/RUP.
- **In progress:** telah melewati tahap awal dan belum memenuhi aturan selesai.
- **Completed:** memenuhi marker selesai authoritative.
- Unit hitung adalah row/paket RUP, bukan produk, history, atau dokumen anak.

## Kontrak, realisasi, dan efisiensi Dashboard

- Nilai kontrak Dashboard RUP adalah `hargaNegosiasiKatalog` hanya jika nomor/tanggal/status kontrak atau Surat Pesanan membuktikan kontrak/SP telah ada.
- Realisasi Dashboard RUP hanya `nilaiPembayaran`; tidak disamakan dengan kontrak, HPS, atau BAST.
- Efisiensi hanya untuk row dengan `pagu > 0` dan `hargaNegosiasiKatalog > 0`: `max(total pagu pasangan - total nilai final pasangan, 0)`. Cakupan parsial tidak dibandingkan dengan total pagu semua paket.
- Model `Kontrak` dan `RealisasiBelanja` adalah jalur transaksi umum terpisah; Dashboard terpusat saat ini tidak menggabungkan model tersebut ke KPI RUP.

## Dashboard time-series

- Paket masuk per bulan: `RencanaUmumPengadaan.createdAt`.
- Pagu bulanan: pagu RUP pada bulan `createdAt`.
- Realisasi bulanan: `nilaiPembayaran` pada bulan tanggal valid `tanggalPembayaranEp` dan tahun yang sama dengan `tahunAnggaran`.
- Data disusun Jan-Des sebelum cumulative reduce, sehingga sorting tidak bergantung urutan query.
- Nilai negatif tidak dipaksa naik; koreksi sah akan terlihat. Kurva visual wajib linear agar tidak mengarang overshoot.

## Authorization and integrity

- Cookie/JWT harus diverifikasi pada server handler yang sensitif; proxy hanya navigation gate dan membaca payload tanpa verifikasi signature.
- Dilarang mengandalkan menu tersembunyi sebagai authorization.
- Dilarang reset DB, melemahkan constraint, atau mengubah data produksi untuk memperbaiki UI.

## Known gaps

- Konsistensi route matrix versus handler checks perlu regression test.
- Sejumlah tanggal workflow E-Purchasing disimpan sebagai `String`, sehingga parsing dan format perlu validasi lebih ketat.
- Tidak ada foreign key RUP -> PaketPengadaan/Kontrak/RealisasiBelanja; rekonsiliasi lintas domain tidak boleh memakai nama paket secara implisit.
