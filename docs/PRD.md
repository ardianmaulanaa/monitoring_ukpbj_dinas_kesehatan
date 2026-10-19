# PRD SIMUKPBJ

> Audited snapshot: 2026-10-17. Kode, Prisma schema, dan route aktif adalah bukti implementasi. Status: **IMPLEMENTED**, **PARTIAL**, **PLANNED**, **NEEDS VERIFICATION**, atau **DEPRECATED**.

## Product overview

SIMUKPBJ memonitor perencanaan dan pelaksanaan pengadaan Laboratorium Kesehatan Provinsi Jawa Barat dari usulan, verifikasi berjenjang, RUP/SIRUP, pemilihan penyedia, kontrak, pelaksanaan, serah terima, pembayaran, pelaporan, risiko, dan audit readiness. Stakeholder: operator/unit pengusul, kepala unit, PPTK/PPK, PA/KPA, UKPBJ/LPSE, pejabat pengadaan/pokja, auditor, pimpinan, dan administrator.

## Modul dan status

| Modul | Route | Status | Bukti/catatan |
|---|---|---|---|
| Dashboard | `/dashboard` | IMPLEMENTED | Agregasi server `getDashboardData`; Chart.js; shared application shell |
| Perencanaan | `/perencanaan` | IMPLEMENTED | `RencanaUmumPengadaan`, submit/edit, guard status |
| Verifikasi | `/verifikasi` | IMPLEMENTED | Tiga tingkat: kepala unit, PPK/PPTK, PA/KPA; history tersimpan |
| SIRUP/RUP | `/sirup-rup` | IMPLEMENTED | CRUD/import dan status RUP |
| E-Purchasing | `/e-purchasing`, `/katalog-v6-v5` | IMPLEMENTED | Workflow tahap produk sampai pembayaran pada RUP |
| Tender/Non-Tender | `/tender-non-tender` | PARTIAL | Halaman tersedia; workflow khusus tidak dimodelkan selengkap E-Purchasing |
| Kontrak/SP | `/kontrak-sp` | IMPLEMENTED | Model `Kontrak` dan data kontrak/SP E-Purchasing tersedia sebagai jalur terpisah |
| Realisasi | `/realisasi-belanja` | IMPLEMENTED | Model `RealisasiBelanja`; Dashboard RUP memakai `nilaiPembayaran` pada RUP |
| Risiko | `/risiko-mitigasi` | IMPLEMENTED | Model dan route tersedia |
| Notifikasi | `/notifications`, API | IMPLEMENTED | Notifikasi internal; kelengkapan event lintas workflow NEEDS VERIFICATION |
| Laporan/export | `/laporan/*`, API laporan | IMPLEMENTED | Endpoint dan halaman tersedia; kontrol ekspor per endpoint harus diuji |
| Administrasi | `/pengaturan`, `/master-data`, `/admin/sinkronisasi` | IMPLEMENTED | SUPER_ADMIN; sinkronisasi juga LPSE_ADMIN |
| Vendor pasar | `/vendor-pasar` | DEPRECATED | Proxy mengalihkan route; daftar akses kosong |

## Dashboard

Dashboard adalah halaman biasa di dalam `ProtectedDashboardLayout -> DashboardShell`; tidak boleh membuat Sidebar atau AppHeader kedua. UI aktual memakai tema putih-hijau. Bar filter dashboard telah dihapus; query parameter lama masih dapat diproses server dan default memilih tahun terbaru. Urutan konten: histogram paket bulanan, enam KPI, tiga grafik analitik, dan ringkasan sumber dana/pelaksanaan.

### KPI

| KPI | Definisi dan sumber | Formula aktual | Empty state/update |
|---|---|---|---|
| Total Pagu RUP | `RencanaUmumPengadaan.pagu` | jumlah seluruh row dalam scope | Rp0 bila scope kosong; request dinamis |
| Total Realisasi | `nilaiPembayaran` | jumlah pembayaran tersimpan | bukan nilai kontrak |
| Nilai Kontrak | `hargaNegosiasiKatalog` pada row dengan bukti kontrak/SP | jumlah nilai final valid | tidak memakai pembayaran sebagai fallback |
| Efisiensi | pasangan `pagu` dan `hargaNegosiasiKatalog` positif | `max(sum(pagu pasangan)-sum(nilai final),0)` | “Belum tersedia” jika tidak ada pasangan |
| Paket Selesai | status akhir E-Purchasing | `statusTransaksiKatalog=SELESAI` atau `statusPembayaranEp=DIBAYAR` | distinct row RUP |
| Paket Berisiko | revisi/kendala/gagal/batal tersimpan | jumlah row matching indikator | angka 0 berarti tidak ada indikator tercatat, bukan jaminan tanpa risiko |

Scope default adalah tahun anggaran terbaru pada data. UI tidak lagi menawarkan filter tahun/sumber dana/unit. Data dibaca server-side dan route dinamis untuk menghindari cache agregasi lama.

### Analitik

- **Histogram paket bulanan (IMPLEMENTED):** jumlah RUP menurut `createdAt`; timestamp ini berarti waktu record masuk SIMUKPBJ, bukan tanggal rencana anggaran.
- **Distribusi pagu per sumber dana (IMPLEMENTED):** `sum(pagu)` dikelompokkan `sumberDana`.
- **Tren pagu/realisasi (IMPLEMENTED):** pagu bulanan menurut `createdAt`; realisasi menurut tanggal valid `tanggalPembayaranEp`; keduanya dikumulatifkan Jan-Des. Chart.js memakai garis linear (`tension: 0`) agar tidak terjadi spline overshoot; tooltip menampilkan Rupiah penuh.
- **Distribusi tahap (IMPLEMENTED):** satu current stage per row RUP, lalu dipetakan ke Perencanaan, Verifikasi/Persiapan, Pemilihan, Kontrak, Pelaksanaan, atau Selesai.
- **Ringkasan APBD/BLUD/DBHCHT dan metode (IMPLEMENTED):** kategori tanpa data tampil nol; tidak membuat data palsu.

## Functional rules

- Semua statistik produksi berasal dari PostgreSQL melalui Prisma; dilarang hardcode angka.
- Satu row RUP dihitung sekali pada kategori tahap dan status proses.
- Mutasi gagal tidak boleh mengubah statistik.
- Authorization UI bukan pengganti pemeriksaan server.
- Nilai uang memakai `Decimal(18,2)` di database dan hanya dikonversi untuk presentasi/agregasi aplikasi.

## Non-goals dan gap

- Tidak ada integrasi otomatis resmi ke SIRUP/e-Katalog yang terbukti; import/sinkronisasi yang ada harus dinilai per endpoint.
- Automated test suite belum tersedia (**PARTIAL quality assurance**).
- Hubungan antara `RencanaUmumPengadaan` dan `PaketPengadaan` tidak berupa foreign key; agregasi Dashboard saat ini memilih RUP sebagai sumber utama.
- Role tersedia di enum lebih banyak daripada role yang diberi route access; lihat [RBAC matrix](RBAC_MATRIX.md).

## Referensi

[Business rules](BUSINESS_RULES.md) · [Workflow](WORKFLOW.md) · [Data dictionary](DATA_DICTIONARY.md) · [Architecture](SYSTEM_ARCHITECTURE.md) · [Testing](TESTING_STANDARD.md)
