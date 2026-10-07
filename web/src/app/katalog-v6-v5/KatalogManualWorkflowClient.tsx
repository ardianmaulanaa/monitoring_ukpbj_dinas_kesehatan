"use client";

import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  FileCheck2,
  Handshake,
  PackageSearch,
  Save,
  Truck,
  WalletCards,
} from "lucide-react";
import { FormEvent, useMemo, useState, useTransition } from "react";
import { updateKatalogWorkflowAction } from "@/app/katalog-v6-v5/actions";

type RupSummary = {
  id: string;
  kodeRup: string;
  lokasiPaket?: string | null;
  namaPaket: string;
  unitPengusul: string;
  sumberDana: string;
  pagu: number;
  tahunAnggaran: number;
  program?: string | null;
  kegiatan?: string | null;
  subKegiatan?: string | null;
  ppkPptk?: string | null;
  metodePengadaan: string;
};

export type EPurchasingDraft = {
  alamatPenyediaKatalog?: string | null;
  catatanKatalog?: string | null;
  emailPenyediaKatalog?: string | null;
  etalaseKatalog?: string | null;
  hargaNegosiasiKatalog?: string | null;
  hargaPenawaranKatalog?: string | null;
  hargaSatuanKatalog?: string | null;
  hasilPemeriksaan?: string | null;
  jenisKatalog?: string | null;
  jumlahProdukKatalog?: string | null;
  kategoriProdukKatalog?: string | null;
  kontakPenyediaKatalog?: string | null;
  linkProdukKatalog?: string | null;
  merekTipeKatalog?: string | null;
  namaPenyediaKatalog?: string | null;
  namaProdukKatalog?: string | null;
  nilaiPembayaran?: string | null;
  nomorBaPemeriksaan?: string | null;
  nomorBaUjiFungsi?: string | null;
  nomorBast?: string | null;
  nomorFaktur?: string | null;
  nomorInvoice?: string | null;
  nomorSpkKontrak?: string | null;
  nomorSpmk?: string | null;
  nomorSppbj?: string | null;
  nomorSuratJalan?: string | null;
  nomorSuratPesanan?: string | null;
  satuanProdukKatalog?: string | null;
  spesifikasiProdukKatalog?: string | null;
  statusDokumenPembayaran?: string | null;
  statusNegosiasiKatalog?: string | null;
  statusPembayaranEp?: string | null;
  statusPemeriksaanEp?: string | null;
  statusPengirimanEp?: string | null;
  statusSuratPesanan?: string | null;
  statusTransaksiKatalog?: string | null;
  statusUjiFungsi?: string | null;
  tanggalAktualKirim?: string | null;
  tanggalBast?: string | null;
  tanggalKontrakEp?: string | null;
  tanggalPembayaranEp?: string | null;
  tanggalPemeriksaan?: string | null;
  tanggalRencanaKirim?: string | null;
  tanggalSpmk?: string | null;
  tanggalSppbj?: string | null;
  tanggalSuratPesanan?: string | null;
  tanggalUjiFungsi?: string | null;
  totalHargaKatalog?: string | null;
};

type TabKey =
  | "overview"
  | "product"
  | "provider"
  | "negotiation"
  | "contract"
  | "delivery"
  | "inspection"
  | "payment"
  | "documents";

const inputClass =
  "h-10 w-full min-w-0 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#08783f] focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-100";
const labelClass = "text-xs font-black uppercase tracking-wide text-slate-500";
const textareaClass =
  "min-h-24 w-full min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm font-semibold leading-6 text-slate-700 outline-none transition focus:border-[#08783f] focus:ring-2 focus:ring-emerald-100";

function rupiah(value: number | string | null | undefined) {
  const amount = Number(value ?? 0);

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0);
}

function numberValue(value: string | null | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <p className={labelClass}>{label}</p>
      <p className="mt-2 break-words text-sm font-black text-slate-800">
        {value || "-"}
      </p>
    </div>
  );
}

function SubmitButton({
  children,
  pending,
}: {
  children: React.ReactNode;
  pending: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#08783f] px-4 text-sm font-black text-white transition hover:bg-[#066a37] disabled:cursor-not-allowed disabled:opacity-60"
    >
      <Save className="h-4 w-4" />
      {pending ? "Menyimpan..." : children}
    </button>
  );
}

export default function KatalogManualWorkflowClient({
  initialDraft,
  rup,
}: {
  initialDraft: EPurchasingDraft;
  rup: RupSummary;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const jumlah = numberValue(initialDraft.jumlahProdukKatalog) || 1;
  const hargaTayang = numberValue(initialDraft.hargaSatuanKatalog);
  const totalHargaTayang = jumlah * hargaTayang;
  const hargaFinal = numberValue(initialDraft.hargaNegosiasiKatalog);
  const selisihPagu = Math.max(rup.pagu - hargaFinal, 0);

  const progress = useMemo(
    () => [
      { label: "RUP", done: true },
      { label: "Produk", done: Boolean(initialDraft.namaProdukKatalog) },
      { label: "Penyedia", done: Boolean(initialDraft.namaPenyediaKatalog) },
      { label: "Negosiasi", done: Boolean(initialDraft.hargaNegosiasiKatalog) },
      { label: "Kontrak", done: Boolean(initialDraft.nomorSuratPesanan || initialDraft.nomorSpkKontrak) },
      { label: "Pengiriman", done: Boolean(initialDraft.statusPengirimanEp) },
      { label: "Pemeriksaan", done: Boolean(initialDraft.nomorBaPemeriksaan || initialDraft.nomorBast) },
      { label: "Pembayaran", done: initialDraft.statusPembayaranEp === "DIBAYAR" },
    ],
    [initialDraft],
  );

  const tabs: { key: TabKey; label: string; icon: typeof ClipboardList }[] = [
    { key: "overview", label: "Overview", icon: ClipboardList },
    { key: "product", label: "Produk", icon: PackageSearch },
    { key: "provider", label: "Penyedia", icon: Truck },
    { key: "negotiation", label: "Negosiasi", icon: Handshake },
    { key: "contract", label: "Kontrak", icon: FileCheck2 },
    { key: "delivery", label: "Pengiriman", icon: Truck },
    { key: "inspection", label: "Pemeriksaan", icon: CheckCircle2 },
    { key: "payment", label: "Pembayaran", icon: WalletCards },
    { key: "documents", label: "Dokumen", icon: ClipboardList },
  ];

  function submit(
    event: FormEvent<HTMLFormElement>,
    buildPayload: (formData: FormData) => Parameters<typeof updateKatalogWorkflowAction>[0],
  ) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await updateKatalogWorkflowAction(buildPayload(formData));

      if (!result.ok) {
        setError(result.message);
        return;
      }

      setSuccess(result.message);
      router.refresh();
    });
  }

  return (
    <div className="grid gap-5">
      <div className="overflow-x-auto border-b border-slate-200 pb-2">
        <div className="flex min-w-max gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.key;

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`inline-flex h-9 items-center justify-center gap-2 rounded-lg border px-3 text-xs font-black transition ${
                  active
                    ? "border-[#08783f] bg-emerald-50 text-[#08783f]"
                    : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {error ? (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      {success ? (
        <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{success}</span>
        </div>
      ) : null}

      {activeTab === "overview" ? (
        <section className="grid gap-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <ReadOnlyField label="Kode RUP" value={rup.kodeRup} />
            <ReadOnlyField label="Unit" value={rup.unitPengusul} />
            <ReadOnlyField label="Tahun Anggaran" value={`TA ${rup.tahunAnggaran}`} />
            <ReadOnlyField label="Pagu" value={rupiah(rup.pagu)} />
            <ReadOnlyField label="Program" value={rup.program ?? "-"} />
            <ReadOnlyField label="Kegiatan" value={rup.kegiatan ?? "-"} />
            <ReadOnlyField label="Sub Kegiatan" value={rup.subKegiatan ?? "-"} />
            <ReadOnlyField label="PP / PPK" value={rup.ppkPptk ?? "-"} />
            <ReadOnlyField label="Sumber Dana" value={rup.sumberDana} />
            <ReadOnlyField label="Metode Final" value="E-Purchasing" />
            <ReadOnlyField label="Lokasi" value={rup.lokasiPaket ?? "-"} />
            <ReadOnlyField
              label="Tahap Saat Ini"
              value={initialDraft.statusTransaksiKatalog ?? "PERSIAPAN"}
            />
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-xs font-black uppercase tracking-wide text-[#08783f]">
              Progress E-Purchasing
            </p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {progress.map((item) => (
                <div
                  key={item.label}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-black ${
                    item.done
                      ? "border-emerald-200 bg-emerald-50 text-[#08783f]"
                      : "border-slate-200 bg-slate-50 text-slate-400"
                  }`}
                >
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs">
                    {item.done ? "✓" : "○"}
                  </span>
                  {item.label}
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {activeTab === "product" ? (
        <form
          onSubmit={(event) =>
            submit(event, (formData) => ({
              step: "product",
              id: rup.id,
              namaProduk: String(formData.get("namaProduk") ?? ""),
              merk: String(formData.get("merk") ?? ""),
              jumlah: Number(formData.get("jumlah") ?? 0),
              satuan: String(formData.get("satuan") ?? ""),
              spesifikasi: String(formData.get("spesifikasi") ?? ""),
              etalase: String(formData.get("etalase") ?? ""),
              platform: String(formData.get("platform") ?? ""),
              kategori: String(formData.get("kategori") ?? ""),
              linkProduk: String(formData.get("linkProduk") ?? ""),
              hargaTayang: Number(formData.get("hargaTayang") ?? 0),
            }))
          }
          className="grid gap-4 sm:grid-cols-2"
        >
          <label className="grid gap-2">
            <span className={labelClass}>Nama Produk *</span>
            <input name="namaProduk" defaultValue={initialDraft.namaProdukKatalog ?? ""} className={inputClass} />
          </label>
          <label className="grid gap-2">
            <span className={labelClass}>Merk / Tipe</span>
            <input name="merk" defaultValue={initialDraft.merekTipeKatalog ?? ""} className={inputClass} />
          </label>
          <label className="grid gap-2">
            <span className={labelClass}>Jumlah *</span>
            <input name="jumlah" type="number" min="1" defaultValue={initialDraft.jumlahProdukKatalog ?? "1"} className={inputClass} />
          </label>
          <label className="grid gap-2">
            <span className={labelClass}>Satuan *</span>
            <input name="satuan" defaultValue={initialDraft.satuanProdukKatalog ?? "Unit"} className={inputClass} />
          </label>
          <label className="grid gap-2">
            <span className={labelClass}>Platform / Versi Katalog</span>
            <select name="platform" defaultValue={initialDraft.jenisKatalog ?? "Katalog V6"} className={inputClass}>
              <option value="Katalog V6">Katalog V6</option>
              <option value="Katalog V5">Katalog V5</option>
            </select>
          </label>
          <label className="grid gap-2">
            <span className={labelClass}>Etalase / Kategori</span>
            <input name="etalase" defaultValue={initialDraft.etalaseKatalog ?? ""} className={inputClass} />
          </label>
          <label className="grid gap-2">
            <span className={labelClass}>Kategori Produk</span>
            <input name="kategori" defaultValue={initialDraft.kategoriProdukKatalog ?? ""} className={inputClass} placeholder="TKDN / Import / Non-TKDN" />
          </label>
          <label className="grid gap-2">
            <span className={labelClass}>Harga Tayang Satuan *</span>
            <input name="hargaTayang" type="number" min="1" defaultValue={initialDraft.hargaSatuanKatalog ?? ""} className={inputClass} />
          </label>
          <label className="grid gap-2 sm:col-span-2">
            <span className={labelClass}>Link Produk Katalog</span>
            <input name="linkProduk" type="url" defaultValue={initialDraft.linkProdukKatalog ?? ""} className={inputClass} />
          </label>
          <label className="grid gap-2 sm:col-span-2">
            <span className={labelClass}>Spesifikasi Katalog</span>
            <textarea name="spesifikasi" defaultValue={initialDraft.spesifikasiProdukKatalog ?? ""} className={textareaClass} />
          </label>
          <div className="rounded-lg bg-slate-50 p-3 sm:col-span-2">
            <p className={labelClass}>Harga Tayang Total</p>
            <p className="mt-1 text-lg font-black text-[#16227c]">
              {rupiah(totalHargaTayang)}
            </p>
          </div>
          <div className="sm:col-span-2">
            <SubmitButton pending={isPending}>Simpan Produk</SubmitButton>
          </div>
        </form>
      ) : null}

      {activeTab === "provider" ? (
        <form
          onSubmit={(event) =>
            submit(event, (formData) => ({
              step: "provider",
              id: rup.id,
              namaPenyedia: String(formData.get("namaPenyedia") ?? ""),
              kontakPenyedia: String(formData.get("kontakPenyedia") ?? ""),
              emailPenyedia: String(formData.get("emailPenyedia") ?? ""),
              alamatPenyedia: String(formData.get("alamatPenyedia") ?? ""),
            }))
          }
          className="grid gap-4 sm:grid-cols-2"
        >
          <label className="grid gap-2">
            <span className={labelClass}>Nama Penyedia / Vendor *</span>
            <input name="namaPenyedia" defaultValue={initialDraft.namaPenyediaKatalog ?? ""} className={inputClass} />
          </label>
          <label className="grid gap-2">
            <span className={labelClass}>Nomor Kontak Penyedia</span>
            <input name="kontakPenyedia" defaultValue={initialDraft.kontakPenyediaKatalog ?? ""} className={inputClass} />
          </label>
          <label className="grid gap-2">
            <span className={labelClass}>Email</span>
            <input name="emailPenyedia" type="email" defaultValue={initialDraft.emailPenyediaKatalog ?? ""} className={inputClass} />
          </label>
          <label className="grid gap-2 sm:col-span-2">
            <span className={labelClass}>Alamat / Informasi Penyedia</span>
            <textarea name="alamatPenyedia" defaultValue={initialDraft.alamatPenyediaKatalog ?? ""} className={textareaClass} />
          </label>
          <div className="sm:col-span-2">
            <SubmitButton pending={isPending}>Simpan Penyedia</SubmitButton>
          </div>
        </form>
      ) : null}

      {activeTab === "negotiation" ? (
        <form
          onSubmit={(event) =>
            submit(event, (formData) => ({
              step: "negotiation",
              id: rup.id,
              hargaPenawaran: Number(formData.get("hargaPenawaran") ?? 0),
              hargaKesepakatan: Number(formData.get("hargaKesepakatan") ?? 0),
              statusNegosiasi: String(formData.get("statusNegosiasi") ?? ""),
              catatan: String(formData.get("catatan") ?? ""),
            }))
          }
          className="grid gap-4 sm:grid-cols-2"
        >
          <ReadOnlyField label="Pagu Total" value={rupiah(rup.pagu)} />
          <ReadOnlyField label="Harga Tayang Total" value={rupiah(initialDraft.totalHargaKatalog ?? totalHargaTayang)} />
          <label className="grid gap-2">
            <span className={labelClass}>Harga Penawaran Total *</span>
            <input name="hargaPenawaran" type="number" min="1" defaultValue={initialDraft.hargaPenawaranKatalog ?? initialDraft.totalHargaKatalog ?? ""} className={inputClass} />
          </label>
          <label className="grid gap-2">
            <span className={labelClass}>Harga Nego Final *</span>
            <input name="hargaKesepakatan" type="number" min="1" defaultValue={initialDraft.hargaNegosiasiKatalog ?? ""} className={inputClass} />
          </label>
          <label className="grid gap-2">
            <span className={labelClass}>Status Negosiasi</span>
            <select name="statusNegosiasi" defaultValue={initialDraft.statusNegosiasiKatalog ?? "PROSES"} className={inputClass}>
              <option value="BELUM_DIMULAI">Belum Dimulai</option>
              <option value="PROSES">Proses</option>
              <option value="SELESAI">Selesai</option>
              <option value="BATAL">Batal</option>
            </select>
          </label>
          <ReadOnlyField label="Selisih Pagu" value={rupiah(selisihPagu)} />
          <label className="grid gap-2 sm:col-span-2">
            <span className={labelClass}>Catatan Negosiasi</span>
            <textarea name="catatan" defaultValue={initialDraft.catatanKatalog ?? ""} className={textareaClass} />
          </label>
          <div className="sm:col-span-2">
            <SubmitButton pending={isPending}>Simpan Negosiasi</SubmitButton>
          </div>
        </form>
      ) : null}

      {activeTab === "contract" ? (
        <form
          onSubmit={(event) =>
            submit(event, (formData) => ({
              step: "contract",
              id: rup.id,
              nomorSppbj: String(formData.get("nomorSppbj") ?? ""),
              tanggalSppbj: String(formData.get("tanggalSppbj") ?? ""),
              statusSuratPesanan: String(formData.get("statusSuratPesanan") ?? ""),
              nomorSuratPesanan: String(formData.get("nomorSuratPesanan") ?? ""),
              tanggalSuratPesanan: String(formData.get("tanggalSuratPesanan") ?? ""),
              nomorSpkKontrak: String(formData.get("nomorSpkKontrak") ?? ""),
              tanggalKontrak: String(formData.get("tanggalKontrak") ?? ""),
              nomorSpmk: String(formData.get("nomorSpmk") ?? ""),
              tanggalSpmk: String(formData.get("tanggalSpmk") ?? ""),
            }))
          }
          className="grid gap-4 sm:grid-cols-2"
        >
          <label className="grid gap-2"><span className={labelClass}>Nomor SPPBJ</span><input name="nomorSppbj" defaultValue={initialDraft.nomorSppbj ?? ""} className={inputClass} /></label>
          <label className="grid gap-2"><span className={labelClass}>Tanggal SPPBJ</span><input name="tanggalSppbj" type="date" defaultValue={initialDraft.tanggalSppbj ?? ""} className={inputClass} /></label>
          <label className="grid gap-2"><span className={labelClass}>Status Surat Pesanan</span><select name="statusSuratPesanan" defaultValue={initialDraft.statusSuratPesanan ?? ""} className={inputClass}><option value="">Belum Ada</option><option value="DRAFT">Draft</option><option value="TERBIT">Terbit</option><option value="DITANDATANGANI">Ditandatangani</option></select></label>
          <label className="grid gap-2"><span className={labelClass}>Nomor Surat Pesanan</span><input name="nomorSuratPesanan" defaultValue={initialDraft.nomorSuratPesanan ?? ""} className={inputClass} /></label>
          <label className="grid gap-2"><span className={labelClass}>Tanggal Surat Pesanan</span><input name="tanggalSuratPesanan" type="date" defaultValue={initialDraft.tanggalSuratPesanan ?? ""} className={inputClass} /></label>
          <label className="grid gap-2"><span className={labelClass}>Nomor SPK / Kontrak</span><input name="nomorSpkKontrak" defaultValue={initialDraft.nomorSpkKontrak ?? ""} className={inputClass} /></label>
          <label className="grid gap-2"><span className={labelClass}>Tanggal Kontrak</span><input name="tanggalKontrak" type="date" defaultValue={initialDraft.tanggalKontrakEp ?? ""} className={inputClass} /></label>
          <label className="grid gap-2"><span className={labelClass}>Nomor SPMK</span><input name="nomorSpmk" defaultValue={initialDraft.nomorSpmk ?? ""} className={inputClass} /></label>
          <label className="grid gap-2"><span className={labelClass}>Tanggal SPMK</span><input name="tanggalSpmk" type="date" defaultValue={initialDraft.tanggalSpmk ?? ""} className={inputClass} /></label>
          <div className="sm:col-span-2"><SubmitButton pending={isPending}>Simpan Kontrak & Pesanan</SubmitButton></div>
        </form>
      ) : null}

      {activeTab === "delivery" ? (
        <form
          onSubmit={(event) =>
            submit(event, (formData) => ({
              step: "delivery",
              id: rup.id,
              statusPengiriman: String(formData.get("statusPengiriman") ?? ""),
              tanggalRencanaKirim: String(formData.get("tanggalRencanaKirim") ?? ""),
              tanggalAktualKirim: String(formData.get("tanggalAktualKirim") ?? ""),
              nomorSuratJalan: String(formData.get("nomorSuratJalan") ?? ""),
              catatan: String(formData.get("catatan") ?? ""),
            }))
          }
          className="grid gap-4 sm:grid-cols-2"
        >
          <label className="grid gap-2"><span className={labelClass}>Status Pengiriman</span><select name="statusPengiriman" defaultValue={initialDraft.statusPengirimanEp ?? "BELUM_DIKIRIM"} className={inputClass}><option value="BELUM_DIKIRIM">Belum Dikirim</option><option value="DIJADWALKAN">Dijadwalkan</option><option value="DALAM_PENGIRIMAN">Dalam Pengiriman</option><option value="DITERIMA">Diterima</option><option value="TERLAMBAT">Terlambat</option></select></label>
          <label className="grid gap-2"><span className={labelClass}>Tanggal Rencana Pengiriman</span><input name="tanggalRencanaKirim" type="date" defaultValue={initialDraft.tanggalRencanaKirim ?? ""} className={inputClass} /></label>
          <label className="grid gap-2"><span className={labelClass}>Tanggal Aktual</span><input name="tanggalAktualKirim" type="date" defaultValue={initialDraft.tanggalAktualKirim ?? ""} className={inputClass} /></label>
          <label className="grid gap-2"><span className={labelClass}>Surat Jalan</span><input name="nomorSuratJalan" defaultValue={initialDraft.nomorSuratJalan ?? ""} className={inputClass} /></label>
          <label className="grid gap-2 sm:col-span-2"><span className={labelClass}>Catatan</span><textarea name="catatan" defaultValue={initialDraft.catatanKatalog ?? ""} className={textareaClass} /></label>
          <div className="sm:col-span-2"><SubmitButton pending={isPending}>Simpan Pengiriman</SubmitButton></div>
        </form>
      ) : null}

      {activeTab === "inspection" ? (
        <form
          onSubmit={(event) =>
            submit(event, (formData) => ({
              step: "inspection",
              id: rup.id,
              statusUjiFungsi: String(formData.get("statusUjiFungsi") ?? ""),
              nomorBaUjiFungsi: String(formData.get("nomorBaUjiFungsi") ?? ""),
              tanggalUjiFungsi: String(formData.get("tanggalUjiFungsi") ?? ""),
              statusPemeriksaan: String(formData.get("statusPemeriksaan") ?? ""),
              nomorBaPemeriksaan: String(formData.get("nomorBaPemeriksaan") ?? ""),
              tanggalPemeriksaan: String(formData.get("tanggalPemeriksaan") ?? ""),
              hasilPemeriksaan: String(formData.get("hasilPemeriksaan") ?? ""),
              nomorBast: String(formData.get("nomorBast") ?? ""),
              tanggalBast: String(formData.get("tanggalBast") ?? ""),
              catatan: String(formData.get("catatan") ?? ""),
            }))
          }
          className="grid gap-4 sm:grid-cols-2"
        >
          <label className="grid gap-2"><span className={labelClass}>Status Uji Fungsi</span><select name="statusUjiFungsi" defaultValue={initialDraft.statusUjiFungsi ?? ""} className={inputClass}><option value="">Belum</option><option value="PROSES">Proses</option><option value="SELESAI">Selesai</option><option value="TIDAK_PERLU">Tidak Perlu</option></select></label>
          <label className="grid gap-2"><span className={labelClass}>Nomor BA Uji Fungsi</span><input name="nomorBaUjiFungsi" defaultValue={initialDraft.nomorBaUjiFungsi ?? ""} className={inputClass} /></label>
          <label className="grid gap-2"><span className={labelClass}>Tanggal Uji Fungsi</span><input name="tanggalUjiFungsi" type="date" defaultValue={initialDraft.tanggalUjiFungsi ?? ""} className={inputClass} /></label>
          <label className="grid gap-2"><span className={labelClass}>Status Pemeriksaan</span><select name="statusPemeriksaan" defaultValue={initialDraft.statusPemeriksaanEp ?? ""} className={inputClass}><option value="">Belum</option><option value="PROSES">Proses</option><option value="SELESAI">Selesai</option></select></label>
          <label className="grid gap-2"><span className={labelClass}>Nomor BA Pemeriksaan</span><input name="nomorBaPemeriksaan" defaultValue={initialDraft.nomorBaPemeriksaan ?? ""} className={inputClass} /></label>
          <label className="grid gap-2"><span className={labelClass}>Tanggal Pemeriksaan</span><input name="tanggalPemeriksaan" type="date" defaultValue={initialDraft.tanggalPemeriksaan ?? ""} className={inputClass} /></label>
          <label className="grid gap-2"><span className={labelClass}>Hasil Pemeriksaan</span><select name="hasilPemeriksaan" defaultValue={initialDraft.hasilPemeriksaan ?? ""} className={inputClass}><option value="">Belum Ada</option><option value="DITERIMA">Diterima</option><option value="DITERIMA_DENGAN_CATATAN">Diterima Dengan Catatan</option><option value="DITOLAK">Ditolak</option></select></label>
          <label className="grid gap-2"><span className={labelClass}>Nomor BAST</span><input name="nomorBast" defaultValue={initialDraft.nomorBast ?? ""} className={inputClass} /></label>
          <label className="grid gap-2"><span className={labelClass}>Tanggal BAST</span><input name="tanggalBast" type="date" defaultValue={initialDraft.tanggalBast ?? ""} className={inputClass} /></label>
          <label className="grid gap-2 sm:col-span-2"><span className={labelClass}>Catatan Pemeriksaan</span><textarea name="catatan" defaultValue={initialDraft.catatanKatalog ?? ""} className={textareaClass} /></label>
          <div className="sm:col-span-2"><SubmitButton pending={isPending}>Simpan Pemeriksaan</SubmitButton></div>
        </form>
      ) : null}

      {activeTab === "payment" ? (
        <form
          onSubmit={(event) =>
            submit(event, (formData) => ({
              step: "payment",
              id: rup.id,
              statusDokumenPembayaran: String(formData.get("statusDokumenPembayaran") ?? ""),
              statusPembayaran: String(formData.get("statusPembayaran") ?? ""),
              nilaiPembayaran: Number(formData.get("nilaiPembayaran") ?? 0),
              nomorInvoice: String(formData.get("nomorInvoice") ?? ""),
              nomorFaktur: String(formData.get("nomorFaktur") ?? ""),
              tanggalPembayaran: String(formData.get("tanggalPembayaran") ?? ""),
              catatan: String(formData.get("catatan") ?? ""),
            }))
          }
          className="grid gap-4 sm:grid-cols-2"
        >
          <label className="grid gap-2"><span className={labelClass}>Status Dokumen Pembayaran</span><select name="statusDokumenPembayaran" defaultValue={initialDraft.statusDokumenPembayaran ?? "BELUM_LENGKAP"} className={inputClass}><option value="BELUM_LENGKAP">Belum Lengkap</option><option value="LENGKAP">Lengkap</option></select></label>
          <label className="grid gap-2"><span className={labelClass}>Status Pembayaran</span><select name="statusPembayaran" defaultValue={initialDraft.statusPembayaranEp ?? "BELUM"} className={inputClass}><option value="BELUM">Belum</option><option value="PROSES">Proses</option><option value="DIBAYAR">Dibayar</option></select></label>
          <label className="grid gap-2"><span className={labelClass}>Nilai Pembayaran</span><input name="nilaiPembayaran" type="number" min="0" defaultValue={initialDraft.nilaiPembayaran ?? initialDraft.hargaNegosiasiKatalog ?? ""} className={inputClass} /></label>
          <label className="grid gap-2"><span className={labelClass}>Invoice</span><input name="nomorInvoice" defaultValue={initialDraft.nomorInvoice ?? ""} className={inputClass} /></label>
          <label className="grid gap-2"><span className={labelClass}>Faktur</span><input name="nomorFaktur" defaultValue={initialDraft.nomorFaktur ?? ""} className={inputClass} /></label>
          <label className="grid gap-2"><span className={labelClass}>Tanggal Pembayaran</span><input name="tanggalPembayaran" type="date" defaultValue={initialDraft.tanggalPembayaranEp ?? ""} className={inputClass} /></label>
          <label className="grid gap-2 sm:col-span-2"><span className={labelClass}>Keterangan</span><textarea name="catatan" defaultValue={initialDraft.catatanKatalog ?? ""} className={textareaClass} /></label>
          <div className="sm:col-span-2"><SubmitButton pending={isPending}>Simpan Pembayaran</SubmitButton></div>
        </form>
      ) : null}

      {activeTab === "documents" ? (
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ["SPPBJ", initialDraft.nomorSppbj],
            ["Surat Pesanan", initialDraft.nomorSuratPesanan],
            ["SPK / Kontrak", initialDraft.nomorSpkKontrak],
            ["SPMK", initialDraft.nomorSpmk],
            ["BA Uji Fungsi", initialDraft.nomorBaUjiFungsi],
            ["BA Pemeriksaan", initialDraft.nomorBaPemeriksaan],
            ["BAST", initialDraft.nomorBast],
            ["Invoice", initialDraft.nomorInvoice],
            ["Faktur", initialDraft.nomorFaktur],
          ].map(([label, value]) => (
            <ReadOnlyField key={label} label={label ?? ""} value={value ?? "-"} />
          ))}
        </section>
      ) : null}
    </div>
  );
}
