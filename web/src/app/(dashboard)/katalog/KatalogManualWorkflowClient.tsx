"use client";

import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  CircleDollarSign,
  ClipboardList,
  FileCheck2,
  Handshake,
  PackageSearch,
  RotateCcw,
  Save,
  Truck,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";

type RupSummary = {
  id: string;
  kodeRup: string;
  namaPaket: string;
  unitPengusul: string;
  sumberDana: string;
  pagu: number;
};

type ProductData = {
  namaProduk: string;
  merk: string;
  jumlah: number;
  satuan: string;
};

type ProviderData = {
  namaPenyedia: string;
  hargaTayang: number;
  estimasiPengiriman: string;
};

type NegotiationData = {
  hargaPenawaran: number;
  hargaKesepakatan: number;
  catatan: string;
};

type ManualCatalogDraft = {
  product?: ProductData;
  provider?: ProviderData;
  negotiation?: NegotiationData;
  updatedAt?: string;
};

type EditableStep = 2 | 3 | 4;

function rupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);
}

export default function KatalogManualWorkflowClient({
  rup,
}: {
  rup: RupSummary;
}) {
  const storageKey = `ukpbj-ekatalog-manual:${rup.id}`;

  const [draft, setDraft] = useState<ManualCatalogDraft>({});
  const [loaded, setLoaded] = useState(false);
  const [activeStep, setActiveStep] = useState<EditableStep>(2);
  const [error, setError] = useState("");

  const [productForm, setProductForm] = useState({
    namaProduk: "",
    merk: "",
    jumlah: "1",
    satuan: "Unit",
  });

  const [providerForm, setProviderForm] = useState({
    namaPenyedia: "",
    hargaTayang: "",
    estimasiPengiriman: "",
  });

  const [negotiationForm, setNegotiationForm] = useState({
    hargaPenawaran: "",
    hargaKesepakatan: "",
    catatan: "",
  });

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as ManualCatalogDraft;
        setDraft(parsed);

        if (parsed.product) {
          setProductForm({
            namaProduk: parsed.product.namaProduk,
            merk: parsed.product.merk,
            jumlah: String(parsed.product.jumlah),
            satuan: parsed.product.satuan,
          });
        }

        if (parsed.provider) {
          setProviderForm({
            namaPenyedia: parsed.provider.namaPenyedia,
            hargaTayang: String(parsed.provider.hargaTayang),
            estimasiPengiriman: parsed.provider.estimasiPengiriman,
          });
        }

        if (parsed.negotiation) {
          setNegotiationForm({
            hargaPenawaran: String(parsed.negotiation.hargaPenawaran),
            hargaKesepakatan: String(parsed.negotiation.hargaKesepakatan),
            catatan: parsed.negotiation.catatan,
          });
        }

        if (!parsed.product) setActiveStep(2);
        else if (!parsed.provider) setActiveStep(3);
        else if (!parsed.negotiation) setActiveStep(4);
        else setActiveStep(4);
      }
    } catch {
      // Jika localStorage rusak, mulai dari draft kosong.
      setDraft({});
    } finally {
      setLoaded(true);
    }
  }, [storageKey]);

  function persist(next: ManualCatalogDraft) {
    const value = {
      ...next,
      updatedAt: new Date().toISOString(),
    };
    setDraft(value);
    window.localStorage.setItem(storageKey, JSON.stringify(value));
  }

  const currentStep = !draft.product
    ? 2
    : !draft.provider
      ? 3
      : !draft.negotiation
        ? 4
        : 5;

  const totalHargaTayang = useMemo(() => {
    if (!draft.product || !draft.provider) return 0;
    return draft.product.jumlah * draft.provider.hargaTayang;
  }, [draft.product, draft.provider]);

  const sisaPagu = rup.pagu - totalHargaTayang;

  const stepItems = [
    {
      no: 1,
      title: "RUP Tayang",
      helper: "Paket sudah tayang dan siap diproses melalui e-Katalog.",
      icon: ClipboardList,
    },
    {
      no: 2,
      title: "Pilih Produk",
      helper: "Isi nama produk, merk, jumlah, dan satuan secara manual.",
      icon: PackageSearch,
    },
    {
      no: 3,
      title: "Pilih Penyedia",
      helper: "Isi penyedia, harga tayang per unit, dan estimasi pengiriman.",
      icon: Truck,
    },
    {
      no: 4,
      title: "Negosiasi",
      helper: "Catat harga penawaran, kesepakatan, dan catatan negosiasi.",
      icon: Handshake,
    },
    {
      no: 5,
      title: "Surat Pesanan",
      helper: "Lanjutkan ke modul Kontrak & Surat Pesanan setelah negosiasi.",
      icon: FileCheck2,
    },
    {
      no: 6,
      title: "Pengiriman",
      helper: "Pantau pengiriman atau pelaksanaan setelah surat pesanan.",
      icon: Truck,
    },
    {
      no: 7,
      title: "BAST",
      helper: "Catat pemeriksaan dan serah terima.",
      icon: CheckCircle2,
    },
    {
      no: 8,
      title: "Pembayaran",
      helper: "Lengkapi proses pembayaran setelah serah terima.",
      icon: CircleDollarSign,
    },
  ];

  function stepState(no: number) {
    if (no === 1) return "done";
    if (no < currentStep) return "done";
    if (no === currentStep) return "active";
    return "waiting";
  }

  function canOpenStep(no: number) {
    if (no === 2) return true;
    if (no === 3) return Boolean(draft.product);
    if (no === 4) return Boolean(draft.product && draft.provider);
    return false;
  }

  function openStep(no: number) {
    if (!canOpenStep(no)) return;
    setError("");
    setActiveStep(no as EditableStep);
  }

  function saveProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const jumlah = Number(productForm.jumlah);

    if (!productForm.namaProduk.trim()) {
      setError("Nama produk wajib diisi.");
      return;
    }

    if (!Number.isFinite(jumlah) || jumlah <= 0) {
      setError("Jumlah produk harus lebih dari 0.");
      return;
    }

    const product: ProductData = {
      namaProduk: productForm.namaProduk.trim(),
      merk: productForm.merk.trim(),
      jumlah,
      satuan: productForm.satuan.trim() || "Unit",
    };

    // Jika produk diubah, penyedia dan negosiasi direset agar harga tetap konsisten.
    persist({ product });
    setProviderForm({
      namaPenyedia: "",
      hargaTayang: "",
      estimasiPengiriman: "",
    });
    setNegotiationForm({
      hargaPenawaran: "",
      hargaKesepakatan: "",
      catatan: "",
    });
    setActiveStep(3);
  }

  function saveProvider(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!draft.product) {
      setError("Pilih produk terlebih dahulu.");
      setActiveStep(2);
      return;
    }

    const hargaTayang = Number(providerForm.hargaTayang);
    const total = draft.product.jumlah * hargaTayang;

    if (!providerForm.namaPenyedia.trim()) {
      setError("Nama penyedia wajib diisi.");
      return;
    }

    if (!Number.isFinite(hargaTayang) || hargaTayang <= 0) {
      setError("Harga tayang per unit harus lebih dari 0.");
      return;
    }

    if (total > rup.pagu) {
      setError(
        `Total harga tayang ${rupiah(total)} melebihi pagu RUP ${rupiah(rup.pagu)}.`,
      );
      return;
    }

    const provider: ProviderData = {
      namaPenyedia: providerForm.namaPenyedia.trim(),
      hargaTayang,
      estimasiPengiriman: providerForm.estimasiPengiriman.trim(),
    };

    // Jika penyedia/harga diubah, negosiasi direset.
    persist({
      product: draft.product,
      provider,
    });
    setNegotiationForm({
      hargaPenawaran: "",
      hargaKesepakatan: "",
      catatan: "",
    });
    setActiveStep(4);
  }

  function saveNegotiation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!draft.product || !draft.provider) {
      setError("Produk dan penyedia harus dipilih terlebih dahulu.");
      return;
    }

    const hargaPenawaran = Number(negotiationForm.hargaPenawaran);
    const hargaKesepakatan = Number(negotiationForm.hargaKesepakatan);
    const totalTayang = draft.product.jumlah * draft.provider.hargaTayang;

    if (!Number.isFinite(hargaPenawaran) || hargaPenawaran <= 0) {
      setError("Harga penawaran wajib diisi.");
      return;
    }

    if (!Number.isFinite(hargaKesepakatan) || hargaKesepakatan <= 0) {
      setError("Harga kesepakatan wajib diisi.");
      return;
    }

    if (hargaKesepakatan > totalTayang) {
      setError("Harga kesepakatan tidak boleh melebihi total harga tayang.");
      return;
    }

    if (hargaKesepakatan > rup.pagu) {
      setError("Harga kesepakatan tidak boleh melebihi pagu RUP.");
      return;
    }

    persist({
      product: draft.product,
      provider: draft.provider,
      negotiation: {
        hargaPenawaran,
        hargaKesepakatan,
        catatan: negotiationForm.catatan.trim(),
      },
    });
  }

  function resetDraft() {
    const confirmed = window.confirm(
      "Hapus seluruh input manual produk, penyedia, dan negosiasi untuk paket ini?",
    );
    if (!confirmed) return;

    window.localStorage.removeItem(storageKey);
    setDraft({});
    setProductForm({
      namaProduk: "",
      merk: "",
      jumlah: "1",
      satuan: "Unit",
    });
    setProviderForm({
      namaPenyedia: "",
      hargaTayang: "",
      estimasiPengiriman: "",
    });
    setNegotiationForm({
      hargaPenawaran: "",
      hargaKesepakatan: "",
      catatan: "",
    });
    setError("");
    setActiveStep(2);
  }

  if (!loaded) {
    return (
      <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-5 text-sm font-semibold text-slate-500">
        Memuat proses manual e-Katalog...
      </div>
    );
  }

  return (
    <div className="mt-6">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-slate-400">
            Workflow Manual
          </p>
          <h3 className="mt-1 text-base font-black text-slate-900">
            RUP → Produk → Penyedia → Negosiasi → Surat Pesanan
          </h3>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            Tanpa API LKPP, tanpa link produk, dan tanpa input ID katalog.
          </p>
        </div>

        {(draft.product || draft.provider || draft.negotiation) && (
          <button
            type="button"
            onClick={resetDraft}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-red-200 bg-white px-3 text-xs font-black text-red-600 transition hover:bg-red-50"
          >
            <RotateCcw className="h-4 w-4" />
            Reset Proses
          </button>
        )}
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {stepItems.map((step) => {
          const state = stepState(step.no);
          const Icon = step.icon;
          const clickable = canOpenStep(step.no);

          return (
            <button
              key={step.no}
              type="button"
              disabled={!clickable}
              onClick={() => openStep(step.no)}
              className={`rounded-lg border p-4 text-left transition ${
                state === "done"
                  ? "border-emerald-200 bg-emerald-50"
                  : state === "active"
                    ? "border-amber-300 bg-amber-50 ring-2 ring-amber-100"
                    : "border-slate-200 bg-slate-50"
              } ${
                clickable
                  ? "cursor-pointer hover:-translate-y-0.5 hover:shadow-sm"
                  : "cursor-default"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <span
                  className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-black ${
                    state === "done"
                      ? "bg-[#08783f] text-white"
                      : state === "active"
                        ? "bg-amber-500 text-white"
                        : "bg-slate-200 text-slate-500"
                  }`}
                >
                  {state === "done" ? "✓" : step.no}
                </span>
                <Icon
                  className={`h-5 w-5 ${
                    state === "done"
                      ? "text-[#08783f]"
                      : state === "active"
                        ? "text-amber-600"
                        : "text-slate-400"
                  }`}
                />
              </div>

              <p className="mt-3 text-sm font-black text-slate-900">
                {step.title}
              </p>
              <p className="mt-1 min-h-10 text-xs font-semibold leading-5 text-slate-500">
                {step.helper}
              </p>

              <p
                className={`mt-3 text-[10px] font-black uppercase tracking-wide ${
                  state === "done"
                    ? "text-[#08783f]"
                    : state === "active"
                      ? "text-amber-700"
                      : "text-slate-400"
                }`}
              >
                {state === "done"
                  ? "Selesai"
                  : state === "active"
                    ? "Tahap Saat Ini"
                    : "Menunggu"}
              </p>
            </button>
          );
        })}
      </div>

      {error && (
        <div className="mt-4 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-5 py-4">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#08783f]">
              Input Manual
            </p>
            <h3 className="mt-1 font-black text-[#16227c]">
              {activeStep === 2
                ? "Pilih Produk"
                : activeStep === 3
                  ? "Pilih Penyedia"
                  : "Negosiasi"}
            </h3>
          </div>

          {activeStep === 2 && (
            <form onSubmit={saveProduct} className="space-y-4 p-5">
              <div>
                <label className="text-xs font-black uppercase text-slate-500">
                  Nama Produk *
                </label>
                <input
                  value={productForm.namaProduk}
                  onChange={(e) =>
                    setProductForm((prev) => ({
                      ...prev,
                      namaProduk: e.target.value,
                    }))
                  }
                  placeholder="Contoh: Mikropipet 100–1000 µL"
                  className="mt-2 h-10 w-full rounded-md border border-slate-300 px-3 text-sm font-semibold text-slate-700 outline-none focus:border-[#08783f] focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              <div>
                <label className="text-xs font-black uppercase text-slate-500">
                  Merk
                </label>
                <input
                  value={productForm.merk}
                  onChange={(e) =>
                    setProductForm((prev) => ({
                      ...prev,
                      merk: e.target.value,
                    }))
                  }
                  placeholder="Contoh: Eppendorf"
                  className="mt-2 h-10 w-full rounded-md border border-slate-300 px-3 text-sm font-semibold text-slate-700 outline-none focus:border-[#08783f] focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-black uppercase text-slate-500">
                    Jumlah *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={productForm.jumlah}
                    onChange={(e) =>
                      setProductForm((prev) => ({
                        ...prev,
                        jumlah: e.target.value,
                      }))
                    }
                    className="mt-2 h-10 w-full rounded-md border border-slate-300 px-3 text-sm font-semibold text-slate-700 outline-none focus:border-[#08783f] focus:ring-2 focus:ring-emerald-100"
                  />
                </div>

                <div>
                  <label className="text-xs font-black uppercase text-slate-500">
                    Satuan *
                  </label>
                  <input
                    value={productForm.satuan}
                    onChange={(e) =>
                      setProductForm((prev) => ({
                        ...prev,
                        satuan: e.target.value,
                      }))
                    }
                    placeholder="Unit"
                    className="mt-2 h-10 w-full rounded-md border border-slate-300 px-3 text-sm font-semibold text-slate-700 outline-none focus:border-[#08783f] focus:ring-2 focus:ring-emerald-100"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#08783f] px-4 text-sm font-black text-white transition hover:bg-[#066a37]"
              >
                <Save className="h-4 w-4" />
                Simpan Produk
              </button>
            </form>
          )}

          {activeStep === 3 && (
            <form onSubmit={saveProvider} className="space-y-4 p-5">
              {!draft.product ? (
                <p className="text-sm font-semibold text-slate-500">
                  Pilih produk terlebih dahulu.
                </p>
              ) : (
                <>
                  <div className="rounded-md border border-emerald-100 bg-emerald-50 px-4 py-3">
                    <p className="text-xs font-black uppercase text-emerald-700">
                      Produk Terpilih
                    </p>
                    <p className="mt-1 text-sm font-black text-slate-800">
                      {draft.product.namaProduk}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      {draft.product.jumlah} {draft.product.satuan}
                      {draft.product.merk ? ` · ${draft.product.merk}` : ""}
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-black uppercase text-slate-500">
                      Nama Penyedia *
                    </label>
                    <input
                      value={providerForm.namaPenyedia}
                      onChange={(e) =>
                        setProviderForm((prev) => ({
                          ...prev,
                          namaPenyedia: e.target.value,
                        }))
                      }
                      placeholder="Contoh: PT ABC Laboratory"
                      className="mt-2 h-10 w-full rounded-md border border-slate-300 px-3 text-sm font-semibold text-slate-700 outline-none focus:border-[#08783f] focus:ring-2 focus:ring-emerald-100"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-black uppercase text-slate-500">
                      Harga Tayang / Unit *
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={providerForm.hargaTayang}
                      onChange={(e) =>
                        setProviderForm((prev) => ({
                          ...prev,
                          hargaTayang: e.target.value,
                        }))
                      }
                      placeholder="4000000"
                      className="mt-2 h-10 w-full rounded-md border border-slate-300 px-3 text-sm font-semibold text-slate-700 outline-none focus:border-[#08783f] focus:ring-2 focus:ring-emerald-100"
                    />
                    <p className="mt-1 text-xs font-semibold text-slate-400">
                      Masukkan angka tanpa titik/koma.
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-black uppercase text-slate-500">
                      Estimasi Pengiriman
                    </label>
                    <input
                      value={providerForm.estimasiPengiriman}
                      onChange={(e) =>
                        setProviderForm((prev) => ({
                          ...prev,
                          estimasiPengiriman: e.target.value,
                        }))
                      }
                      placeholder="Contoh: 14 hari"
                      className="mt-2 h-10 w-full rounded-md border border-slate-300 px-3 text-sm font-semibold text-slate-700 outline-none focus:border-[#08783f] focus:ring-2 focus:ring-emerald-100"
                    />
                  </div>

                  {Number(providerForm.hargaTayang) > 0 && (
                    <div className="rounded-md bg-slate-50 p-4">
                      <p className="text-xs font-black uppercase text-slate-400">
                        Total Harga Tayang
                      </p>
                      <p className="mt-1 text-lg font-black text-[#16227c]">
                        {rupiah(
                          draft.product.jumlah *
                            Number(providerForm.hargaTayang),
                        )}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        Pagu RUP: {rupiah(rup.pagu)}
                      </p>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#08783f] px-4 text-sm font-black text-white transition hover:bg-[#066a37]"
                  >
                    <Save className="h-4 w-4" />
                    Simpan Penyedia
                  </button>
                </>
              )}
            </form>
          )}

          {activeStep === 4 && (
            <form onSubmit={saveNegotiation} className="space-y-4 p-5">
              {!draft.product || !draft.provider ? (
                <p className="text-sm font-semibold text-slate-500">
                  Produk dan penyedia harus disimpan terlebih dahulu.
                </p>
              ) : (
                <>
                  <div className="rounded-md border border-emerald-100 bg-emerald-50 px-4 py-3">
                    <p className="text-xs font-black uppercase text-emerald-700">
                      Dasar Negosiasi
                    </p>
                    <p className="mt-1 text-sm font-black text-slate-800">
                      {draft.provider.namaPenyedia}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      Harga tayang total: {rupiah(totalHargaTayang)}
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-black uppercase text-slate-500">
                      Harga Penawaran Total *
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={negotiationForm.hargaPenawaran}
                      onChange={(e) =>
                        setNegotiationForm((prev) => ({
                          ...prev,
                          hargaPenawaran: e.target.value,
                        }))
                      }
                      placeholder="19000000"
                      className="mt-2 h-10 w-full rounded-md border border-slate-300 px-3 text-sm font-semibold text-slate-700 outline-none focus:border-[#08783f] focus:ring-2 focus:ring-emerald-100"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-black uppercase text-slate-500">
                      Harga Kesepakatan Total *
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={negotiationForm.hargaKesepakatan}
                      onChange={(e) =>
                        setNegotiationForm((prev) => ({
                          ...prev,
                          hargaKesepakatan: e.target.value,
                        }))
                      }
                      placeholder="19250000"
                      className="mt-2 h-10 w-full rounded-md border border-slate-300 px-3 text-sm font-semibold text-slate-700 outline-none focus:border-[#08783f] focus:ring-2 focus:ring-emerald-100"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-black uppercase text-slate-500">
                      Catatan
                    </label>
                    <textarea
                      value={negotiationForm.catatan}
                      onChange={(e) =>
                        setNegotiationForm((prev) => ({
                          ...prev,
                          catatan: e.target.value,
                        }))
                      }
                      rows={4}
                      placeholder="Contoh: Harga sudah termasuk pengiriman."
                      className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 outline-none focus:border-[#08783f] focus:ring-2 focus:ring-emerald-100"
                    />
                  </div>

                  <button
                    type="submit"
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#08783f] px-4 text-sm font-black text-white transition hover:bg-[#066a37]"
                  >
                    <Save className="h-4 w-4" />
                    Simpan Hasil Negosiasi
                  </button>
                </>
              )}
            </form>
          )}
        </section>

        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-5 py-4">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#08783f]">
              Ringkasan
            </p>
            <h3 className="mt-1 font-black text-[#16227c]">
              Produk, Penyedia & Harga
            </h3>
          </div>

          <div className="space-y-4 p-5">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-black uppercase text-slate-400">
                Produk
              </p>
              {draft.product ? (
                <>
                  <p className="mt-2 text-sm font-black text-slate-800">
                    {draft.product.namaProduk}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    Merk: {draft.product.merk || "-"}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    {draft.product.jumlah} {draft.product.satuan}
                  </p>
                  <button
                    type="button"
                    onClick={() => openStep(2)}
                    className="mt-3 text-xs font-black text-[#08783f] hover:underline"
                  >
                    Ubah produk
                  </button>
                </>
              ) : (
                <p className="mt-2 text-sm font-semibold text-slate-400">
                  Belum dipilih.
                </p>
              )}
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-black uppercase text-slate-400">
                Penyedia
              </p>
              {draft.provider ? (
                <>
                  <p className="mt-2 text-sm font-black text-slate-800">
                    {draft.provider.namaPenyedia}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    Harga/unit: {rupiah(draft.provider.hargaTayang)}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    Estimasi: {draft.provider.estimasiPengiriman || "-"}
                  </p>
                  <button
                    type="button"
                    onClick={() => openStep(3)}
                    className="mt-3 text-xs font-black text-[#08783f] hover:underline"
                  >
                    Ubah penyedia
                  </button>
                </>
              ) : (
                <p className="mt-2 text-sm font-semibold text-slate-400">
                  Menunggu produk dipilih.
                </p>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-slate-200 p-4">
                <p className="text-xs font-black uppercase text-slate-400">
                  Total Harga Tayang
                </p>
                <p className="mt-2 text-base font-black text-slate-800">
                  {draft.provider ? rupiah(totalHargaTayang) : "-"}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 p-4">
                <p className="text-xs font-black uppercase text-slate-400">
                  Sisa Pagu
                </p>
                <p
                  className={`mt-2 text-base font-black ${
                    sisaPagu < 0 ? "text-red-600" : "text-[#08783f]"
                  }`}
                >
                  {draft.provider ? rupiah(sisaPagu) : rupiah(rup.pagu)}
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-black uppercase text-slate-400">
                Hasil Negosiasi
              </p>
              {draft.negotiation ? (
                <>
                  <div className="mt-3 space-y-2 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-semibold text-slate-500">
                        Penawaran
                      </span>
                      <span className="font-black text-slate-800">
                        {rupiah(draft.negotiation.hargaPenawaran)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-semibold text-slate-500">
                        Kesepakatan
                      </span>
                      <span className="font-black text-[#08783f]">
                        {rupiah(draft.negotiation.hargaKesepakatan)}
                      </span>
                    </div>
                  </div>
                  {draft.negotiation.catatan && (
                    <p className="mt-3 rounded-md bg-white px-3 py-2 text-xs font-semibold leading-5 text-slate-500">
                      {draft.negotiation.catatan}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => openStep(4)}
                    className="mt-3 text-xs font-black text-[#08783f] hover:underline"
                  >
                    Ubah negosiasi
                  </button>
                </>
              ) : (
                <p className="mt-2 text-sm font-semibold text-slate-400">
                  Menunggu produk dan penyedia selesai.
                </p>
              )}
            </div>

            {draft.negotiation && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#08783f]" />
                  <div>
                    <p className="text-sm font-black text-[#08783f]">
                      Negosiasi selesai
                    </p>
                    <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                      Tahap berikutnya adalah membuat atau mencatat Surat
                      Pesanan.
                    </p>
                    <Link
                      href="/kontrak"
                      className="mt-3 inline-flex h-9 items-center justify-center rounded-md bg-[#08783f] px-4 text-xs font-black text-white transition hover:bg-[#066a37]"
                    >
                      Lanjut ke Surat Pesanan
                    </Link>
                  </div>
                </div>
              </div>
            )}

            <div className="rounded-md border border-blue-200 bg-blue-50 px-4 py-3">
              <p className="text-xs font-semibold leading-5 text-blue-800">
                Versi ini menyimpan input manual di browser perangkat
                (localStorage), sehingga belum menjadi data bersama antar-user.
                Untuk produksi/multi-user, pindahkan field yang sama ke Prisma
                setelah alur UI ini sudah disetujui.
              </p>
            </div>
          </div>
        </section>
      </div>

      <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs font-black uppercase tracking-wide text-[#08783f]">
          Urutan tindakan
        </p>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
          RUP tayang → isi produk manual → isi penyedia dan harga tayang →
          negosiasi → Surat Pesanan → pengiriman → pemeriksaan/BAST →
          pembayaran. Tidak perlu API LKPP, link produk, atau input paket ulang.
        </p>
      </div>
    </div>
  );
}
