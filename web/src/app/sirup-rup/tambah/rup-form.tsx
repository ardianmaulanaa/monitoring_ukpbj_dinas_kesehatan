"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { validatePlanningSubmission } from "@/lib/workflow-completeness";
import {
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileCheck2,
  Save,
  Send,
  WalletCards,
} from "lucide-react";

const inputClass =
  "h-11 w-full min-w-0 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#08783f] focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-100";
const labelClass = "text-xs font-black uppercase tracking-wide text-slate-500";
const textareaClass =
  "min-h-28 w-full min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#08783f] focus:ring-2 focus:ring-emerald-100";

type SumberDanaOption = {
  kode: string;
  nama: string;
};

type RupFormProps = {
  sumberDanaOptions: SumberDanaOption[];
  defaultKodeUsulan?: string | null;
  defaultUnitPengusul?: string | null;
  onCancel?: () => void;
  onSaved?: () => void;
  variant?: "page" | "modal";
  mode?: "rup" | "planning";
  initialData?: Record<string, string | number | null | undefined>;
  submitLabel?: string;
};

const satuanOptions = [
  "Unit",
  "Buah",
  "Set",
  "Paket",
  "Box",
  "Kit",
  "Botol",
  "Liter",
  "Kg",
  "Jasa",
];

const planningSteps = [
  {
    key: "unit",
    label: "Unit",
    title: "Data OPD / Unit",
    helper: "Identitas unit pengusul dan penanggung jawab awal.",
    icon: Building2,
  },
  {
    key: "budget",
    label: "Anggaran",
    title: "Data Anggaran",
    helper: "Sumber awal dari RKA/DPA OPD sebelum dibentuk menjadi paket.",
    icon: WalletCards,
  },
  {
    key: "needs",
    label: "Kebutuhan",
    title: "Data Usulan Kebutuhan",
    helper: "Detail barang, alat, bahan, atau jasa yang diusulkan unit.",
    icon: ClipboardList,
  },
  {
    key: "schedule",
    label: "Jadwal",
    title: "Rencana Paket Pengadaan",
    helper: "Cara pengadaan, metode, jadwal awal, kendala, dan tindak lanjut.",
    icon: CalendarDays,
  },
  {
    key: "documents",
    label: "Dokumen",
    title: "Dokumen Pendukung",
    helper: "Checklist kesiapan KAK, HPS, rancangan kontrak, dan dokumen pendukung.",
    icon: FileCheck2,
  },
  {
    key: "review",
    label: "Review",
    title: "Review Usulan",
    helper: "Periksa ringkasan sebelum disimpan sebagai draft atau diajukan.",
    icon: CheckCircle2,
  },
] as const;

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

function currency(value: string | number) {
  const amount = Number(value);

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0);
}

function SectionTitle({
  number,
  title,
  helper,
}: {
  number: string;
  title: string;
  helper: string;
}) {
  return (
    <div className="md:col-span-2">
      <div className="flex items-start gap-3 rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3">
        <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#08783f] text-xs font-black text-white">
          {number}
        </span>
        <div>
          <h2 className="text-sm font-black uppercase tracking-wide text-[#08783f]">
            {title}
          </h2>
          <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
            {helper}
          </p>
        </div>
      </div>
    </div>
  );
}

function DocumentStatusOptions() {
  return (
    <>
      <option value="BELUM_ADA">Belum Ada</option>
      <option value="PROSES">Proses</option>
      <option value="SIAP">Siap</option>
      <option value="TIDAK_PERLU">Tidak Perlu</option>
    </>
  );
}

export default function RupForm({
  defaultKodeUsulan,
  defaultUnitPengusul,
  sumberDanaOptions,
  onCancel,
  onSaved,
  variant = "page",
  mode = "rup",
  initialData,
  submitLabel,
}: RupFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const isPlanning = mode === "planning";
  const isEditing = Boolean(initialData?.id);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [activePlanningStep, setActivePlanningStep] = useState(0);
  const [submitIntent, setSubmitIntent] = useState<"draft" | "submit" | "save">(
    "save",
  );
  const [formSnapshot, setFormSnapshot] = useState<Record<string, FormDataEntryValue>>({});
  const [pagu, setPagu] = useState(onlyDigits(String(initialData?.pagu ?? "")));
  const [jumlah, setJumlah] = useState(
    String(initialData?.jumlahKebutuhan ?? initialData?.volumeKebutuhan ?? ""),
  );
  const [hargaSatuan, setHargaSatuan] = useState(
    onlyDigits(String(initialData?.estimasiHargaSatuan ?? "")),
  );
  const unitPengusulValue = String(
    initialData?.unitPengusul ?? (isPlanning ? "" : defaultUnitPengusul ?? ""),
  );
  const kodeRupValue = String(
    initialData?.kodeRup ?? (isPlanning ? "" : defaultKodeUsulan ?? ""),
  );

  const totalEstimasi = useMemo(() => {
    const parsedJumlah = Number(jumlah);
    const parsedHarga = Number(hargaSatuan);
    if (!Number.isFinite(parsedJumlah) || !Number.isFinite(parsedHarga)) {
      return 0;
    }

    return parsedJumlah * parsedHarga;
  }, [hargaSatuan, jumlah]);

  const planningValidation = useMemo(
    () =>
      validatePlanningSubmission({
        ...initialData,
        kodeRup: kodeRupValue,
        unitPengusul: unitPengusulValue,
        tahunAnggaran: Number(initialData?.tahunAnggaran ?? new Date().getFullYear()),
        sumberDana: String(initialData?.sumberDana ?? sumberDanaOptions[0]?.kode ?? ""),
        metodePengadaan: String(initialData?.metodePengadaan ?? "E_PURCHASING"),
        prioritas: String(initialData?.prioritas ?? "SEDANG"),
        statusKak: String(initialData?.statusKak ?? "BELUM_ADA"),
        statusHps: String(initialData?.statusHps ?? "BELUM_ADA"),
        statusDokumenPendukung: String(
          initialData?.statusDokumenPendukung ?? "BELUM_ADA",
        ),
        ...formSnapshot,
        jumlahKebutuhan: jumlah,
        pagu: String(totalEstimasi),
      }),
    [
      formSnapshot,
      initialData,
      jumlah,
      kodeRupValue,
      sumberDanaOptions,
      totalEstimasi,
      unitPengusulValue,
    ],
  );
  const incompletePlanningSections = Object.values(planningValidation.sections)
    .filter((section) => !section.complete)
    .map((section) => section.label);

  function refreshFormSnapshot(form: HTMLFormElement | null) {
    if (!form) return;
    setFormSnapshot(Object.fromEntries(new FormData(form).entries()));
  }

  function incompleteMessage() {
    if (incompletePlanningSections.length === 0) {
      return "Masih ada data wajib yang belum lengkap.";
    }

    return `Lengkapi bagian ${incompletePlanningSections.join(", ")} sebelum diajukan.`;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");

    const formData = new FormData(event.currentTarget);
    const submitter = (event.nativeEvent as SubmitEvent).submitter as
      | HTMLButtonElement
      | null;
    const clickedIntent =
      submitter?.value === "draft" || submitter?.value === "submit"
        ? submitter.value
        : submitIntent;
    const payload = Object.fromEntries(formData.entries());
    const finalPayload = {
      ...payload,
      mode,
      submitIntent: clickedIntent,
      jumlahKebutuhan: jumlah,
      volumeKebutuhan: jumlah,
      estimasiHargaSatuan: hargaSatuan,
      totalEstimasi: String(totalEstimasi),
      pagu: isPlanning ? String(totalEstimasi) : String(payload.pagu ?? pagu),
    };

    if (isPlanning && clickedIntent === "submit") {
      const completeness = validatePlanningSubmission(finalPayload);

      if (!completeness.complete) {
        setSaving(false);
        setError(`Usulan belum lengkap. ${incompleteMessage()}`);
        const firstIncompleteIndex = planningSteps.findIndex((step) => {
          const section = completeness.sections[step.key as keyof typeof completeness.sections];
          return section && !section.complete;
        });
        if (firstIncompleteIndex >= 0) {
          setActivePlanningStep(firstIncompleteIndex);
        }
        return;
      }
    }

    const url = isEditing
      ? `/api/rup?id=${encodeURIComponent(String(initialData?.id))}`
      : "/api/rup";
    const response = await fetch(url, {
      method: isEditing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(finalPayload),
    });

    const result = await response.json().catch(() => null);
    setSaving(false);

    if (!response.ok) {
      const detail = Array.isArray(result?.errors)
        ? result.errors.map((item: { message?: string }) => item.message).join(" ")
        : "";
      setError(result?.message ?? detail ?? "Data gagal disimpan.");
      return;
    }

    if (onSaved) {
      onSaved();
      return;
    }

    router.push(isPlanning ? "/perencanaan" : "/sirup-rup");
    router.refresh();
  }

  if (isPlanning) {
    const activeStep = planningSteps[activePlanningStep];
    const isFirstStep = activePlanningStep === 0;
    const isReviewStep = activePlanningStep === planningSteps.length - 1;
    const modalContentClass =
      "grid min-w-0 gap-5 md:grid-cols-2 rounded-xl border border-slate-200 bg-white p-4 sm:p-5";
    const inactiveContentClass = `${modalContentClass} hidden`;
    const shownContentClass = modalContentClass;
    const planningFormTitle = isEditing
      ? "Edit Usulan Perencanaan"
      : "Tambah Usulan Perencanaan";

    return (
      <form
        ref={formRef}
        onSubmit={handleSubmit}
        onChangeCapture={(event) =>
          refreshFormSnapshot(event.currentTarget as HTMLFormElement)
        }
        className={
          variant === "modal"
            ? "flex min-h-0 min-w-0 flex-col bg-white"
            : "overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
        }
      >
        {variant === "page" ? (
          <div className="border-b border-slate-100 px-5 py-4">
            <h1 className="text-lg font-black text-[#16227c]">
              Form Usulan Perencanaan
            </h1>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Isi E-Planning & Usulan Kebutuhan dari unit pengusul.
            </p>
          </div>
        ) : (
          <div className="mb-5 rounded-xl border border-emerald-100 bg-emerald-50/60 px-4 py-3">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#08783f]">
              Perencanaan
            </p>
            <h3 className="mt-1 text-lg font-black text-[#16227c]">
              {planningFormTitle}
            </h3>
            <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
              Lengkapi data kebutuhan sebelum diajukan untuk verifikasi.
            </p>
          </div>
        )}

        <input type="hidden" name="mode" value={mode} />
        <input type="hidden" name="submitIntent" value={submitIntent} />
        <input type="hidden" name="statusSirup" value="DRAFT" />

        <div className="mb-5 overflow-x-auto border-b border-slate-200 pb-3">
          <div className="flex min-w-max gap-2">
            {planningSteps.map((step, index) => {
              const Icon = step.icon;
              const active = activePlanningStep === index;
              const completed = index < activePlanningStep;

              return (
                <button
                  key={step.key}
                  type="button"
                  onClick={() => setActivePlanningStep(index)}
                  className={`inline-flex h-10 items-center justify-center gap-2 rounded-lg border px-3 text-xs font-black transition ${
                    active
                      ? "border-[#08783f] bg-emerald-50 text-[#08783f]"
                      : completed
                        ? "border-emerald-100 bg-white text-[#08783f] hover:bg-emerald-50"
                        : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                  }`}
                >
                  <span
                    className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] ${
                      active || completed
                        ? "bg-[#08783f] text-white"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {completed ? (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    ) : (
                      index + 1
                    )}
                  </span>
                  <Icon className="h-4 w-4" />
                  {step.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mb-5 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-2 rounded-full bg-[#08783f] transition-all"
            style={{
              width: `${((activePlanningStep + 1) / planningSteps.length) * 100}%`,
            }}
          />
        </div>

        <div className="mb-4 flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#08783f] text-sm font-black text-white">
            {activePlanningStep + 1}
          </span>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#08783f]">
              Tahap {activePlanningStep + 1} dari {planningSteps.length}
            </p>
            <h4 className="mt-1 text-base font-black text-[#16227c]">
              {activeStep.title}
            </h4>
            <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
              {activeStep.helper}
            </p>
          </div>
        </div>

        <div className="min-h-[360px]">
          <section
            className={activePlanningStep === 0 ? shownContentClass : inactiveContentClass}
          >
            <label className="grid min-w-0 gap-2">
              <span className={labelClass}>Kode Usulan</span>
              <input
                name="kodeRup"
                required
                className={inputClass}
                defaultValue={kodeRupValue}
              />
            </label>

            <label className="grid min-w-0 gap-2">
              <span className={labelClass}>Tahun Anggaran</span>
              <input
                name="tahunAnggaran"
                type="number"
                min="2000"
                className={inputClass}
                defaultValue={Number(
                  initialData?.tahunAnggaran ?? new Date().getFullYear(),
                )}
              />
            </label>

            <label className="grid min-w-0 gap-2">
              <span className={labelClass}>Unit Pengusul / OPD</span>
              <input
                name="unitPengusul"
                required
                className={inputClass}
                defaultValue={unitPengusulValue}
              />
            </label>

            <label className="grid min-w-0 gap-2">
              <span className={labelClass}>Unit / Bidang</span>
              <input
                name="unitBidang"
                className={inputClass}
                defaultValue={String(initialData?.unitBidang ?? "")}
              />
            </label>

            <label className="grid min-w-0 gap-2">
              <span className={labelClass}>Nama PPK / PPTK</span>
              <input
                name="ppkPptk"
                className={inputClass}
                defaultValue={String(initialData?.ppkPptk ?? "")}
              />
            </label>

            <label className="grid min-w-0 gap-2">
              <span className={labelClass}>Kontak Penanggung Jawab</span>
              <input
                name="kontakPenanggungJawab"
                className={inputClass}
                defaultValue={String(initialData?.kontakPenanggungJawab ?? "")}
              />
            </label>
          </section>

          <section
            className={activePlanningStep === 1 ? shownContentClass : inactiveContentClass}
          >
            <label className="grid min-w-0 gap-2">
              <span className={labelClass}>Program</span>
              <input
                name="program"
                className={inputClass}
                defaultValue={String(initialData?.program ?? "")}
              />
            </label>

            <label className="grid min-w-0 gap-2">
              <span className={labelClass}>Kegiatan</span>
              <input
                name="kegiatan"
                className={inputClass}
                defaultValue={String(initialData?.kegiatan ?? "")}
              />
            </label>

            <label className="grid min-w-0 gap-2">
              <span className={labelClass}>Sub Kegiatan</span>
              <input
                name="subKegiatan"
                className={inputClass}
                defaultValue={String(initialData?.subKegiatan ?? "")}
              />
            </label>

            <label className="grid min-w-0 gap-2">
              <span className={labelClass}>Kode Rekening Belanja</span>
              <input
                name="kodeRekening"
                className={inputClass}
                defaultValue={String(initialData?.kodeRekening ?? "")}
              />
            </label>

            <label className="grid min-w-0 gap-2">
              <span className={labelClass}>Jenis Belanja</span>
              <select
                name="jenisBelanja"
                className={inputClass}
                defaultValue={String(initialData?.jenisBelanja ?? "Barang")}
              >
                <option value="Barang">Barang</option>
                <option value="Jasa">Jasa</option>
                <option value="Modal">Modal</option>
                <option value="Pegawai">Pegawai</option>
              </select>
            </label>

            <label className="grid min-w-0 gap-2">
              <span className={labelClass}>Sumber Dana</span>
              <select
                name="sumberDana"
                className={inputClass}
                defaultValue={String(
                  initialData?.sumberDana ?? sumberDanaOptions[0]?.kode ?? "",
                )}
                disabled={sumberDanaOptions.length === 0}
              >
                {sumberDanaOptions.length === 0 ? (
                  <option value="">Master sumber dana belum tersedia</option>
                ) : null}
                {sumberDanaOptions.map((option) => (
                  <option key={option.kode} value={option.kode}>
                    {option.nama}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid min-w-0 gap-2 md:col-span-2">
              <span className={labelClass}>Uraian Belanja</span>
              <textarea
                name="uraianBelanja"
                className={textareaClass}
                defaultValue={String(initialData?.uraianBelanja ?? "")}
              />
            </label>
          </section>

          <section
            className={activePlanningStep === 2 ? shownContentClass : inactiveContentClass}
          >
            <label className="grid min-w-0 gap-2 md:col-span-2">
              <span className={labelClass}>Uraian / Nama Kebutuhan</span>
              <input
                name="namaPaket"
                className={inputClass}
                defaultValue={String(initialData?.namaPaket ?? "")}
                placeholder="Masukkan nama barang, alat, bahan, atau jasa"
              />
            </label>

            <label className="grid min-w-0 gap-2 md:col-span-2">
              <span className={labelClass}>Uraian Kebutuhan</span>
              <textarea
                name="uraianKebutuhan"
                className={textareaClass}
                defaultValue={String(initialData?.uraianKebutuhan ?? "")}
                placeholder="Jelaskan kebutuhan yang diajukan secara ringkas."
              />
            </label>

            <label className="grid min-w-0 gap-2">
              <span className={labelClass}>Jumlah</span>
              <input
                name="jumlahKebutuhan"
                type="number"
                min="0"
                step="0.01"
                className={inputClass}
                value={jumlah}
                onChange={(event) => setJumlah(event.target.value)}
                placeholder="1"
              />
            </label>

            <label className="grid min-w-0 gap-2">
              <span className={labelClass}>Satuan</span>
              <select
                name="satuanKebutuhan"
                className={inputClass}
                defaultValue={String(initialData?.satuanKebutuhan ?? "")}
              >
                <option value="">Pilih satuan</option>
                {satuanOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid min-w-0 gap-2 md:col-span-2">
              <span className={labelClass}>Spesifikasi Awal</span>
              <textarea
                name="spesifikasiAwal"
                className={textareaClass}
                defaultValue={String(initialData?.spesifikasiAwal ?? "")}
                placeholder="Tuliskan spesifikasi awal kebutuhan"
              />
            </label>

            <label className="grid min-w-0 gap-2">
              <span className={labelClass}>Estimasi Harga Satuan</span>
              <input
                name="estimasiHargaSatuan"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                className={inputClass}
                value={hargaSatuan}
                onChange={(event) =>
                  setHargaSatuan(onlyDigits(event.target.value))
                }
                placeholder="150000000"
              />
              <span className="text-xs font-bold text-slate-500">
                {currency(hargaSatuan)}
              </span>
            </label>

            <label className="grid min-w-0 gap-2">
              <span className={labelClass}>Total Estimasi</span>
              <input
                readOnly
                className={`${inputClass} bg-slate-50`}
                value={currency(totalEstimasi)}
              />
              <input type="hidden" name="totalEstimasi" value={String(totalEstimasi)} />
              <input type="hidden" name="pagu" value={String(totalEstimasi)} />
              <input type="hidden" name="volumeKebutuhan" value={jumlah} />
            </label>

            <label className="grid min-w-0 gap-2">
              <span className={labelClass}>Prioritas</span>
              <select
                name="prioritas"
                className={inputClass}
                defaultValue={String(initialData?.prioritas ?? "SEDANG")}
              >
                <option value="RENDAH">Rendah</option>
                <option value="SEDANG">Sedang</option>
                <option value="TINGGI">Tinggi</option>
                <option value="MENDESAK">Mendesak</option>
              </select>
            </label>

            <label className="grid min-w-0 gap-2">
              <span className={labelClass}>Waktu Kebutuhan</span>
              <input
                name="waktuKebutuhan"
                type="date"
                className={inputClass}
                defaultValue={String(initialData?.waktuKebutuhan ?? "")}
              />
            </label>

            <label className="grid min-w-0 gap-2 md:col-span-2">
              <span className={labelClass}>Justifikasi / Alasan Kebutuhan</span>
              <textarea
                name="justifikasi"
                className={textareaClass}
                defaultValue={String(initialData?.justifikasi ?? "")}
                placeholder="Jelaskan alasan dan urgensi kebutuhan ini..."
              />
            </label>
          </section>

          <section
            className={activePlanningStep === 3 ? shownContentClass : inactiveContentClass}
          >
            <label className="grid min-w-0 gap-2">
              <span className={labelClass}>Cara Pengadaan</span>
              <select
                name="caraPengadaan"
                className={inputClass}
                defaultValue={String(initialData?.caraPengadaan ?? "PENYEDIA")}
              >
                <option value="PENYEDIA">Penyedia</option>
                <option value="SWAKELOLA">Swakelola</option>
              </select>
            </label>

            <label className="grid min-w-0 gap-2">
              <span className={labelClass}>Metode</span>
              <select
                name="metodePengadaan"
                className={inputClass}
                defaultValue={String(initialData?.metodePengadaan ?? "E_PURCHASING")}
              >
                <option value="E_PURCHASING">E-Purchasing</option>
                <option value="TENDER">Tender</option>
                <option value="NON_TENDER">Non Tender</option>
                <option value="PENGADAAN_LANGSUNG">Pengadaan Langsung</option>
                <option value="SWAKELOLA">Swakelola</option>
              </select>
            </label>

            <label className="grid min-w-0 gap-2">
              <span className={labelClass}>Jadwal Pemilihan</span>
              <input
                name="jadwalPemilihan"
                type="date"
                className={inputClass}
                defaultValue={String(initialData?.jadwalPemilihan ?? "")}
              />
            </label>

            <label className="grid min-w-0 gap-2">
              <span className={labelClass}>Tanggal Masuk Grafik SIRUP/RUP</span>
              <input
                name="jadwalMulaiRencana"
                type="date"
                className={inputClass}
                defaultValue={String(initialData?.jadwalMulaiRencana ?? "")}
              />
            </label>

            <label className="grid min-w-0 gap-2">
              <span className={labelClass}>Jadwal Selesai Rencana</span>
              <input
                name="jadwalSelesaiRencana"
                type="date"
                className={inputClass}
                defaultValue={String(initialData?.jadwalSelesaiRencana ?? "")}
              />
            </label>

            <label className="grid min-w-0 gap-2">
              <span className={labelClass}>PIC Tindak Lanjut</span>
              <input
                name="picTindakLanjut"
                className={inputClass}
                defaultValue={String(initialData?.picTindakLanjut ?? "")}
              />
            </label>

            <label className="grid min-w-0 gap-2 md:col-span-2">
              <span className={labelClass}>Kendala</span>
              <textarea
                name="kendala"
                className={textareaClass}
                defaultValue={String(initialData?.kendala ?? "")}
              />
            </label>

            <label className="grid min-w-0 gap-2 md:col-span-2">
              <span className={labelClass}>Tindak Lanjut</span>
              <textarea
                name="tindakLanjut"
                className={textareaClass}
                defaultValue={String(initialData?.tindakLanjut ?? "")}
              />
            </label>
          </section>

          <section
            className={activePlanningStep === 4 ? shownContentClass : inactiveContentClass}
          >
            <label className="grid min-w-0 gap-2">
              <span className={labelClass}>Status KAK / Spesifikasi</span>
              <select
                name="statusKak"
                className={inputClass}
                defaultValue={String(initialData?.statusKak ?? "BELUM_ADA")}
              >
                <DocumentStatusOptions />
              </select>
            </label>

            <label className="grid min-w-0 gap-2">
              <span className={labelClass}>Status HPS</span>
              <select
                name="statusHps"
                className={inputClass}
                defaultValue={String(initialData?.statusHps ?? "BELUM_ADA")}
              >
                <DocumentStatusOptions />
              </select>
            </label>

            <label className="grid min-w-0 gap-2">
              <span className={labelClass}>Status Rancangan Kontrak</span>
              <select
                name="statusRancanganKontrak"
                className={inputClass}
                defaultValue={String(
                  initialData?.statusRancanganKontrak ?? "BELUM_ADA",
                )}
              >
                <DocumentStatusOptions />
              </select>
            </label>

            <label className="grid min-w-0 gap-2">
              <span className={labelClass}>Status Dokumen Pendukung</span>
              <select
                name="statusDokumenPendukung"
                className={inputClass}
                defaultValue={String(
                  initialData?.statusDokumenPendukung ?? "BELUM_ADA",
                )}
              >
                <DocumentStatusOptions />
              </select>
            </label>

            <label className="grid min-w-0 gap-2 md:col-span-2">
              <span className={labelClass}>Catatan Kekurangan Dokumen</span>
              <textarea
                name="kekuranganDokumen"
                className={textareaClass}
                defaultValue={String(initialData?.kekuranganDokumen ?? "")}
              />
            </label>
          </section>

          <section
            className={activePlanningStep === 5 ? shownContentClass : inactiveContentClass}
          >
            <div className="grid gap-3 sm:grid-cols-2 md:col-span-2 lg:grid-cols-4">
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                <p className={labelClass}>Jumlah Kebutuhan</p>
                <p className="mt-2 text-sm font-black text-slate-700">
                  {jumlah || "0"}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                <p className={labelClass}>Total Estimasi</p>
                <p className="mt-2 text-sm font-black text-[#08783f]">
                  {currency(totalEstimasi)}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                <p className={labelClass}>Tahun Anggaran</p>
                <p className="mt-2 text-sm font-black text-slate-700">
                  {String(initialData?.tahunAnggaran ?? new Date().getFullYear())}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                <p className={labelClass}>Status Setelah Draft</p>
                <p className="mt-2 text-sm font-black text-slate-700">Draft</p>
              </div>
            </div>

            <label className="grid min-w-0 gap-2 md:col-span-2">
              <span className={labelClass}>Catatan</span>
              <textarea
                name="catatan"
                className={textareaClass}
                defaultValue={String(initialData?.catatan ?? "")}
                placeholder="Tambahkan catatan untuk verifikator bila diperlukan."
              />
            </label>

            {planningValidation.complete ? (
              <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3 md:col-span-2">
                <p className="text-sm font-black text-[#08783f]">
                  Siap diajukan untuk verifikasi Kepala Unit
                </p>
                <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                  Seluruh data wajib usulan telah lengkap.
                </p>
              </div>
            ) : (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 md:col-span-2">
                <p className="text-sm font-black text-amber-700">
                  Usulan belum lengkap
                </p>
                <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                  {incompleteMessage()}
                </p>
              </div>
            )}
          </section>
        </div>

        {error ? (
          <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
            {error}
          </div>
        ) : null}

        <div
          className={`mt-6 flex flex-col-reverse gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center ${
            isFirstStep ? "sm:justify-end" : "sm:justify-between"
          }`}
        >
          <div className="flex flex-col-reverse gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onCancel ?? (() => router.back())}
              className="h-11 rounded-lg border border-slate-300 bg-white px-4 text-sm font-black text-slate-600 transition hover:bg-slate-50"
            >
              Batal
            </button>
            {!isFirstStep ? (
              <button
                type="button"
                onClick={() =>
                  setActivePlanningStep((current) => Math.max(current - 1, 0))
                }
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-black text-slate-600 transition hover:bg-slate-50"
              >
                <ChevronLeft className="h-4 w-4" />
                Kembali
              </button>
            ) : null}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="submit"
              name="submitIntentButton"
              value="draft"
              disabled={saving}
              onClick={() => setSubmitIntent("draft")}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 text-sm font-black text-[#08783f] transition hover:bg-emerald-100 disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {saving && submitIntent === "draft"
                ? "Menyimpan..."
                : "Simpan Draft"}
            </button>

            {isReviewStep ? (
              <button
                type="submit"
                name="submitIntentButton"
                value="submit"
                disabled={saving || !planningValidation.complete}
                onClick={() => setSubmitIntent("submit")}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#08783f] px-4 text-sm font-black text-white transition hover:bg-[#066532] disabled:opacity-60"
              >
                <Send className="h-4 w-4" />
                {saving && submitIntent === "submit"
                  ? "Mengajukan..."
                  : "Ajukan Usulan"}
              </button>
            ) : (
              <button
                type="button"
                onClick={() =>
                  setActivePlanningStep((current) =>
                    Math.min(current + 1, planningSteps.length - 1),
                  )
                }
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#08783f] px-4 text-sm font-black text-white transition hover:bg-[#066532]"
              >
                Lanjut
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </form>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={
        variant === "modal"
          ? "min-w-0 bg-white"
          : "overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
      }
    >
      {variant === "page" ? (
        <div className="border-b border-slate-100 px-5 py-4">
          <h1 className="text-lg font-black text-[#16227c]">
            {isPlanning
              ? "Form Usulan Perencanaan"
              : "Form Rencana Umum Pengadaan"}
          </h1>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            {isPlanning
              ? "Isi E-Planning & Usulan Kebutuhan dari unit pengusul."
              : "Isi data RUP seperti kode RUP, unit pengusul, sumber dana, pagu, metode, jadwal pemilihan, dan status tayang SIRUP."}
          </p>
        </div>
      ) : null}

      <div
        className={`grid min-w-0 gap-5 md:grid-cols-2 ${variant === "modal" ? "p-0" : "p-5"}`}
      >
        <input type="hidden" name="mode" value={mode} />
        <input type="hidden" name="submitIntent" value={submitIntent} />

        {isPlanning ? (
          <SectionTitle
            number="1"
            title="Data OPD / Unit"
            helper="Identitas unit pengusul dan penanggung jawab awal."
          />
        ) : null}

        <label className="grid min-w-0 gap-2">
          <span className={labelClass}>
            {isPlanning ? "Kode Usulan" : "Kode RUP"}
          </span>
          <input
            name="kodeRup"
            required
            className={inputClass}
            defaultValue={kodeRupValue}
          />
        </label>

        <label className="grid min-w-0 gap-2">
          <span className={labelClass}>Tahun Anggaran</span>
          <input
            name="tahunAnggaran"
            type="number"
            min="2000"
            required
            className={inputClass}
            defaultValue={Number(
              initialData?.tahunAnggaran ?? new Date().getFullYear(),
            )}
          />
        </label>

        <label className="grid min-w-0 gap-2">
          <span className={labelClass}>Unit Pengusul / OPD</span>
          <input
            name="unitPengusul"
            required
            className={inputClass}
            defaultValue={unitPengusulValue}
          />
        </label>

        {isPlanning ? (
          <>
            <label className="grid min-w-0 gap-2">
              <span className={labelClass}>Unit / Bidang</span>
              <input
                name="unitBidang"
                className={inputClass}
                defaultValue={String(initialData?.unitBidang ?? "")}
              />
            </label>

            <label className="grid min-w-0 gap-2">
              <span className={labelClass}>Nama PPK / PPTK</span>
              <input
                name="ppkPptk"
                className={inputClass}
                defaultValue={String(initialData?.ppkPptk ?? "")}
              />
            </label>

            <label className="grid min-w-0 gap-2">
              <span className={labelClass}>Kontak Penanggung Jawab</span>
              <input
                name="kontakPenanggungJawab"
                className={inputClass}
                defaultValue={String(initialData?.kontakPenanggungJawab ?? "")}
              />
            </label>

            <SectionTitle
              number="2"
              title="Data Anggaran"
              helper="Sumber awal dari RKA/DPA OPD sebelum dibentuk menjadi paket pengadaan."
            />

            <label className="grid min-w-0 gap-2">
              <span className={labelClass}>Program</span>
              <input
                name="program"
                className={inputClass}
                defaultValue={String(initialData?.program ?? "")}
              />
            </label>

            <label className="grid min-w-0 gap-2">
              <span className={labelClass}>Kegiatan</span>
              <input
                name="kegiatan"
                className={inputClass}
                defaultValue={String(initialData?.kegiatan ?? "")}
              />
            </label>

            <label className="grid min-w-0 gap-2">
              <span className={labelClass}>Sub Kegiatan</span>
              <input
                name="subKegiatan"
                className={inputClass}
                defaultValue={String(initialData?.subKegiatan ?? "")}
              />
            </label>

            <label className="grid min-w-0 gap-2">
              <span className={labelClass}>Kode Rekening Belanja</span>
              <input
                name="kodeRekening"
                className={inputClass}
                defaultValue={String(initialData?.kodeRekening ?? "")}
              />
            </label>
          </>
        ) : null}

        <label className="grid min-w-0 gap-2">
          <span className={labelClass}>Jenis Belanja</span>
          <select
            name="jenisBelanja"
            required={!isPlanning}
            className={inputClass}
            defaultValue={String(initialData?.jenisBelanja ?? "Barang")}
          >
            <option value="Barang">Barang</option>
            <option value="Jasa">Jasa</option>
            <option value="Modal">Modal</option>
            <option value="Pegawai">Pegawai</option>
          </select>
        </label>

        <label className="grid min-w-0 gap-2">
          <span className={labelClass}>Sumber Dana</span>
          <select
            name="sumberDana"
            required
            className={inputClass}
            defaultValue={String(
              initialData?.sumberDana ?? sumberDanaOptions[0]?.kode ?? "",
            )}
            disabled={sumberDanaOptions.length === 0}
          >
            {sumberDanaOptions.length === 0 ? (
              <option value="">Master sumber dana belum tersedia</option>
            ) : null}
            {sumberDanaOptions.map((option) => (
              <option key={option.kode} value={option.kode}>
                {option.nama}
              </option>
            ))}
          </select>
        </label>

        <label className="grid min-w-0 gap-2 md:col-span-2">
          <span className={labelClass}>Uraian Belanja</span>
          <textarea
            name="uraianBelanja"
            className={textareaClass}
            defaultValue={String(initialData?.uraianBelanja ?? "")}
          />
        </label>

        {!isPlanning ? (
          <>
            <label className="grid min-w-0 gap-2 md:col-span-2">
              <span className={labelClass}>Nama Paket</span>
              <input
                name="namaPaket"
                required
                className={inputClass}
                defaultValue={String(initialData?.namaPaket ?? "")}
              />
            </label>

            <label className="grid min-w-0 gap-2">
              <span className={labelClass}>Lokasi Paket</span>
              <input
                name="lokasiPaket"
                required
                className={inputClass}
                defaultValue={String(initialData?.lokasiPaket ?? "")}
              />
            </label>

            <label className="grid min-w-0 gap-2">
              <span className={labelClass}>Pagu</span>
              <input
                name="pagu"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                required
                className={inputClass}
                value={pagu}
                onChange={(event) => setPagu(onlyDigits(event.target.value))}
                placeholder="0"
              />
              <span className="text-xs font-bold text-slate-500">
                {currency(pagu)}
              </span>
            </label>
          </>
        ) : null}

        {isPlanning ? (
          <>
            <SectionTitle
              number="3"
              title="Data Usulan Kebutuhan"
              helper="Detail barang, alat, bahan, atau jasa yang diusulkan oleh unit."
            />

            <label className="grid min-w-0 gap-2 md:col-span-2">
              <span className={labelClass}>Uraian / Nama Kebutuhan</span>
              <input
                name="namaPaket"
                required
                className={inputClass}
                defaultValue={String(initialData?.namaPaket ?? "")}
                placeholder="Masukkan nama barang, alat, bahan, atau jasa"
              />
            </label>

            <label className="grid min-w-0 gap-2">
              <span className={labelClass}>Jumlah</span>
              <input
                name="jumlahKebutuhan"
                type="number"
                min="0"
                step="0.01"
                className={inputClass}
                value={jumlah}
                onChange={(event) => setJumlah(event.target.value)}
                placeholder="1"
              />
            </label>

            <label className="grid min-w-0 gap-2">
              <span className={labelClass}>Satuan</span>
              <select
                name="satuanKebutuhan"
                className={inputClass}
                defaultValue={String(initialData?.satuanKebutuhan ?? "")}
              >
                <option value="">Pilih satuan</option>
                {satuanOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid min-w-0 gap-2 md:col-span-2">
              <span className={labelClass}>Spesifikasi Awal</span>
              <textarea
                name="spesifikasiAwal"
                className={textareaClass}
                defaultValue={String(initialData?.spesifikasiAwal ?? "")}
                placeholder="Tuliskan spesifikasi awal kebutuhan"
              />
            </label>

            <label className="grid min-w-0 gap-2">
              <span className={labelClass}>Estimasi Harga Satuan</span>
              <input
                name="estimasiHargaSatuan"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                className={inputClass}
                value={hargaSatuan}
                onChange={(event) =>
                  setHargaSatuan(onlyDigits(event.target.value))
                }
                placeholder="150000000"
              />
              <span className="text-xs font-bold text-slate-500">
                {currency(hargaSatuan)}
              </span>
            </label>

            <label className="grid min-w-0 gap-2">
              <span className={labelClass}>Total Estimasi</span>
              <input
                readOnly
                className={`${inputClass} bg-slate-50`}
                value={currency(totalEstimasi)}
              />
              <input
                type="hidden"
                name="totalEstimasi"
                value={String(totalEstimasi)}
              />
              <input type="hidden" name="pagu" value={String(totalEstimasi)} />
              <input type="hidden" name="volumeKebutuhan" value={jumlah} />
            </label>

            <label className="grid min-w-0 gap-2">
              <span className={labelClass}>Prioritas</span>
              <select
                name="prioritas"
                className={inputClass}
                defaultValue={String(initialData?.prioritas ?? "SEDANG")}
              >
                <option value="RENDAH">Rendah</option>
                <option value="SEDANG">Sedang</option>
                <option value="TINGGI">Tinggi</option>
                <option value="MENDESAK">Mendesak</option>
              </select>
            </label>

            <label className="grid min-w-0 gap-2">
              <span className={labelClass}>Waktu Kebutuhan</span>
              <input
                name="waktuKebutuhan"
                type="date"
                className={inputClass}
                defaultValue={String(initialData?.waktuKebutuhan ?? "")}
              />
            </label>

            <label className="grid min-w-0 gap-2 md:col-span-2">
              <span className={labelClass}>Justifikasi / Alasan Kebutuhan</span>
              <textarea
                name="justifikasi"
                className={textareaClass}
                defaultValue={String(initialData?.justifikasi ?? "")}
                placeholder="Jelaskan alasan dan urgensi kebutuhan ini..."
              />
            </label>

            <SectionTitle
              number="4"
              title="Dokumen Pendukung"
              helper="Checklist kesiapan KAK, HPS, rancangan kontrak, dan dokumen pendukung."
            />

            <label className="grid min-w-0 gap-2">
              <span className={labelClass}>Status KAK / Spesifikasi</span>
              <select
                name="statusKak"
                className={inputClass}
                defaultValue={String(initialData?.statusKak ?? "BELUM_ADA")}
              >
                <DocumentStatusOptions />
              </select>
            </label>

            <label className="grid min-w-0 gap-2">
              <span className={labelClass}>Status HPS</span>
              <select
                name="statusHps"
                className={inputClass}
                defaultValue={String(initialData?.statusHps ?? "BELUM_ADA")}
              >
                <DocumentStatusOptions />
              </select>
            </label>

            <label className="grid min-w-0 gap-2">
              <span className={labelClass}>Status Rancangan Kontrak</span>
              <select
                name="statusRancanganKontrak"
                className={inputClass}
                defaultValue={String(
                  initialData?.statusRancanganKontrak ?? "BELUM_ADA",
                )}
              >
                <DocumentStatusOptions />
              </select>
            </label>

            <label className="grid min-w-0 gap-2">
              <span className={labelClass}>Status Dokumen Pendukung</span>
              <select
                name="statusDokumenPendukung"
                className={inputClass}
                defaultValue={String(
                  initialData?.statusDokumenPendukung ?? "BELUM_ADA",
                )}
              >
                <DocumentStatusOptions />
              </select>
            </label>

            <label className="grid min-w-0 gap-2 md:col-span-2">
              <span className={labelClass}>Catatan Kekurangan Dokumen</span>
              <textarea
                name="kekuranganDokumen"
                className={textareaClass}
                defaultValue={String(initialData?.kekuranganDokumen ?? "")}
              />
            </label>

            <SectionTitle
              number="5"
              title="Ringkasan Usulan"
              helper="Ringkasan otomatis sebelum usulan disimpan atau diajukan."
            />

            <div className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:grid-cols-4 md:col-span-2">
              <div>
                <p className={labelClass}>Jumlah Kebutuhan</p>
                <p className="mt-2 text-sm font-black text-slate-700">
                  {jumlah || "0"}
                </p>
              </div>
              <div>
                <p className={labelClass}>Total Estimasi</p>
                <p className="mt-2 text-sm font-black text-[#08783f]">
                  {currency(totalEstimasi)}
                </p>
              </div>
              <div>
                <p className={labelClass}>Tahun Anggaran</p>
                <p className="mt-2 text-sm font-black text-slate-700">
                  {String(initialData?.tahunAnggaran ?? new Date().getFullYear())}
                </p>
              </div>
              <div>
                <p className={labelClass}>Status</p>
                <p className="mt-2 text-sm font-black text-slate-700">Draft</p>
              </div>
            </div>

            <SectionTitle
              number="6"
              title="Rencana Paket Pengadaan"
              helper="Rencana cara/metode pengadaan dan jadwal awal."
            />

            <label className="grid min-w-0 gap-2">
              <span className={labelClass}>Cara Pengadaan</span>
              <select
                name="caraPengadaan"
                className={inputClass}
                defaultValue={String(initialData?.caraPengadaan ?? "PENYEDIA")}
              >
                <option value="PENYEDIA">Penyedia</option>
                <option value="SWAKELOLA">Swakelola</option>
              </select>
            </label>
          </>
        ) : null}

        <label className="grid min-w-0 gap-2">
          <span className={labelClass}>Metode</span>
          <select
            name="metodePengadaan"
            required
            className={inputClass}
            defaultValue={String(initialData?.metodePengadaan ?? "E_PURCHASING")}
          >
            <option value="E_PURCHASING">E-Purchasing</option>
            <option value="TENDER">Tender</option>
            <option value="NON_TENDER">Non Tender</option>
            <option value="PENGADAAN_LANGSUNG">Pengadaan Langsung</option>
            <option value="SWAKELOLA">Swakelola</option>
          </select>
        </label>

        <label className="grid min-w-0 gap-2">
          <span className={labelClass}>Jadwal Pemilihan</span>
          <input
            name="jadwalPemilihan"
            type="date"
            className={inputClass}
            defaultValue={String(initialData?.jadwalPemilihan ?? "")}
          />
        </label>

        {isPlanning ? (
          <>
            <label className="grid min-w-0 gap-2">
              <span className={labelClass}>Tanggal Masuk Grafik SIRUP/RUP</span>
              <input
                name="jadwalMulaiRencana"
                type="date"
                className={inputClass}
                defaultValue={String(initialData?.jadwalMulaiRencana ?? "")}
              />
            </label>

            <label className="grid min-w-0 gap-2">
              <span className={labelClass}>Jadwal Selesai Rencana</span>
              <input
                name="jadwalSelesaiRencana"
                type="date"
                className={inputClass}
                defaultValue={String(initialData?.jadwalSelesaiRencana ?? "")}
              />
            </label>

            <label className="grid min-w-0 gap-2 md:col-span-2">
              <span className={labelClass}>Kendala</span>
              <textarea
                name="kendala"
                className={textareaClass}
                defaultValue={String(initialData?.kendala ?? "")}
              />
            </label>

            <label className="grid min-w-0 gap-2 md:col-span-2">
              <span className={labelClass}>Tindak Lanjut</span>
              <textarea
                name="tindakLanjut"
                className={textareaClass}
                defaultValue={String(initialData?.tindakLanjut ?? "")}
              />
            </label>

            <label className="grid min-w-0 gap-2">
              <span className={labelClass}>PIC Tindak Lanjut</span>
              <input
                name="picTindakLanjut"
                className={inputClass}
                defaultValue={String(initialData?.picTindakLanjut ?? "")}
              />
            </label>
          </>
        ) : null}

        <label className="grid min-w-0 gap-2">
          <span className={labelClass}>
            {isPlanning ? "Status Workflow" : "Status SIRUP"}
          </span>
          <select
            name="statusSirup"
            required
            className={inputClass}
            defaultValue={String(
              initialData?.statusSirup ?? (isPlanning ? "DRAFT" : "BELUM_INPUT"),
            )}
          >
            {isPlanning ? (
              <>
                <option value="DRAFT">Draft</option>
                <option value="DIAJUKAN">Diajukan</option>
                <option value="VERIFIKASI">Verifikasi</option>
                <option value="REVISI">Perlu Revisi</option>
                <option value="DISETUJUI">Disetujui</option>
                <option value="SIAP_RUP">Siap RUP</option>
              </>
            ) : (
              <>
                <option value="BELUM_INPUT">Belum Input</option>
                <option value="PROSES_VERIFIKASI">Proses Verifikasi</option>
                <option value="SUDAH_TAYANG">Sudah Tayang</option>
                <option value="REVISI_PAGU">Revisi Pagu</option>
                <option value="DITARIK">Ditarik</option>
              </>
            )}
          </select>
        </label>

        <label className="grid min-w-0 gap-2 md:col-span-2">
          <span className={labelClass}>Catatan</span>
          <textarea
            name="catatan"
            className={textareaClass}
            defaultValue={String(initialData?.catatan ?? "")}
          />
        </label>
      </div>

      {error ? (
        <div
          className={`${variant === "modal" ? "mt-5" : "mx-5"} rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700`}
        >
          {error}
        </div>
      ) : null}

      <div
        className={`flex flex-col-reverse gap-3 border-t border-slate-100 sm:flex-row sm:justify-end ${variant === "modal" ? "mt-6 pt-4" : "px-5 py-4"}`}
      >
        <button
          type="button"
          onClick={onCancel ?? (() => router.back())}
          className="h-11 rounded-lg border border-slate-300 bg-white px-4 text-sm font-black text-slate-600 transition hover:bg-slate-50"
        >
          Batal
        </button>

        {isPlanning ? (
          <>
            <button
              type="submit"
              disabled={saving}
              onClick={() => setSubmitIntent("draft")}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 text-sm font-black text-[#08783f] transition hover:bg-emerald-100 disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {saving && submitIntent === "draft"
                ? "Menyimpan..."
                : "Simpan Draft"}
            </button>
            <button
              type="submit"
              disabled={saving}
              onClick={() => setSubmitIntent("submit")}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#08783f] px-4 text-sm font-black text-white transition hover:bg-[#066532] disabled:opacity-60"
            >
              <Send className="h-4 w-4" />
              {saving && submitIntent === "submit"
                ? "Mengajukan..."
                : "Ajukan Usulan"}
            </button>
          </>
        ) : (
          <button
            type="submit"
            disabled={saving}
            onClick={() => setSubmitIntent("save")}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#08783f] px-4 text-sm font-black text-white transition hover:bg-[#066532] disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {saving
              ? "Menyimpan..."
              : submitLabel ?? (isEditing ? "Simpan Perubahan" : "Simpan RUP")}
          </button>
        )}
      </div>
    </form>
  );
}
