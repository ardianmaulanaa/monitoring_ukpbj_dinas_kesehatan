"use client";

import { useCallback, useEffect, useState } from "react";
import { LoaderCircle } from "lucide-react";
import ModalShell from "@/components/modal/ModalShell";
import VendorForm from "@/components/vendor-management/VendorForm";
import VendorProductModal from "@/components/vendor-management/VendorProductModal";

type NamedCategory = { category: { id: string; name: string } };
type VendorDetail = {
  id: string;
  companyName: string;
  businessEntityType: string;
  nib: string;
  npwp: string | null;
  address: string;
  province: string;
  city: string;
  website: string | null;
  businessDescription: string | null;
  status: string;
  contacts: {
    id: string;
    name: string;
    position: string;
    phone: string;
    email: string;
    notes: string | null;
  }[];
  categories: NamedCategory[];
  documents: {
    id: string;
    type: string;
    number: string | null;
    originalName: string;
    expiresAt: string | null;
  }[];
  products: {
    id: string;
    name: string;
    brand: string | null;
    model: string | null;
    category: { name: string } | null;
    relationship: "OWNER" | "OFFERING";
  }[];
  presentations: {
    id: string;
    title: string;
    type: string;
    proposedAt: string;
    scheduledAt: string | null;
    status: string;
    technicalEvaluation: { result: string; conclusion: string } | null;
  }[];
  procurementLinks: {
    id: string;
    sourceModule: string;
    role: string;
    package: {
      kodePaket: string;
      namaPaket: string;
      jenisPengadaan: string;
      metodePengadaan: string;
      statusPaket: string;
      hps: string;
    };
  }[];
  evaluations: {
    id: string;
    status: string;
    period: string | null;
    summary: string | null;
    createdAt: string;
    package: { namaPaket: string } | null;
    scores: {
      id: string;
      score: string;
      notes: string | null;
      criterion: { name: string };
    }[];
  }[];
  statusHistory: {
    id: string;
    fromStatus: string | null;
    toStatus: string;
    note: string | null;
    createdAt: string;
    actor: { name: string };
  }[];
};
type DetailResponse = {
  success: boolean;
  message: string;
  data?: {
    vendor: VendorDetail;
    permissions: { canUpdate: boolean; canArchive: boolean; canCreateProduct: boolean };
  };
};

const tabs = [
  "Perusahaan",
  "Kontak & PIC",
  "Dokumen",
  "Katalog Produk",
  "Presentasi & Trial",
  "Riwayat Pengadaan",
  "Evaluasi Kinerja",
  "Aktivitas",
] as const;
type Tab = (typeof tabs)[number];

function masked(value: string | null) {
  if (!value) return "-";
  const clean = value.replace(/\D/g, "");
  return clean.length > 4
    ? `${"•".repeat(Math.min(10, clean.length - 4))}${clean.slice(-4)}`
    : "••••";
}
function date(value: string | null) {
  return value ? new Date(value).toLocaleString("id-ID") : "-";
}
function Empty({ children }: { children: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 px-5 py-10 text-center text-sm text-slate-500">
      {children}
    </div>
  );
}
function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-bold uppercase tracking-wide text-slate-400">
        {label}
      </dt>
      <dd className="mt-1 break-words text-sm font-semibold text-slate-700">
        {value || "-"}
      </dd>
    </div>
  );
}

export default function VendorDetailModal({
  vendorId,
  categories,
  onClose,
  onUpdated,
}: {
  vendorId: string | null;
  categories: { id: string; name: string }[];
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [detail, setDetail] = useState<DetailResponse["data"]>();
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("Perusahaan");
  const [mode, setMode] = useState<"detail" | "edit">("detail");
  const [dirty, setDirty] = useState(false);
  const [productMode, setProductMode] = useState<"create" | "link" | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    if (!vendorId) return;
    const controller = new AbortController();
    fetch(`/api/vendor-management/vendors/${vendorId}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        const body = (await response.json()) as DetailResponse;
        if (!response.ok || !body.data)
          throw new Error(body.message || "Detail penyedia gagal dimuat.");
        setDetail(body.data);
      })
      .catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === "AbortError")
          return;
        setError(
          reason instanceof Error
            ? reason.message
            : "Detail penyedia gagal dimuat.",
        );
      });
    return () => controller.abort();
  }, [reloadKey, vendorId]);

  const close = useCallback(() => {
    if (
      mode === "edit" &&
      dirty &&
      !window.confirm(
        "Perubahan yang belum disimpan akan hilang. Tutup formulir?",
      )
    )
      return;
    onClose();
  }, [dirty, mode, onClose]);
  const vendor = detail?.vendor;
  const primaryContact = vendor?.contacts[0];
  const initialValues = vendor
    ? {
        companyName: vendor.companyName,
        businessEntityType: vendor.businessEntityType,
        nib: vendor.nib,
        npwp: vendor.npwp ?? "",
        address: vendor.address,
        province: vendor.province,
        city: vendor.city,
        website: vendor.website ?? "",
        businessDescription: vendor.businessDescription ?? "",
        contactName: primaryContact?.name ?? "",
        contactPosition: primaryContact?.position ?? "",
        contactPhone: primaryContact?.phone ?? "",
        contactEmail: primaryContact?.email ?? "",
        categoryIds: vendor.categories.map((item) => item.category.id),
      }
    : undefined;
  async function restoreVendor() {
    if (!vendor || !window.confirm("Pulihkan vendor ini ke status DRAFT?")) return;
    setRestoring(true); setError("");
    const response = await fetch(`/api/vendor-management/vendors/${vendor.id}/status`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "DRAFT", note: "Vendor dipulihkan dari arsip." }),
    });
    const body = await response.json() as { message?: string };
    setRestoring(false);
    if (!response.ok) { setError(body.message || "Vendor gagal dipulihkan."); return; }
    setReloadKey((value) => value + 1); onUpdated();
  }
  return (
    <ModalShell
      isOpen={Boolean(vendorId)}
      onClose={close}
      eyebrow="Manajemen Penyedia"
      title={mode === "edit" ? "Kelola Vendor" : "Detail Penyedia"}
      maxWidthClassName="max-w-6xl"
    >
      {!vendor && !error && (
        <div className="flex min-h-64 items-center justify-center gap-3 text-sm font-bold text-slate-500">
          <LoaderCircle className="h-5 w-5 animate-spin" /> Memuat detail
          penyedia…
        </div>
      )}
      {error && (
        <div
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800"
        >
          <b>Detail tidak dapat ditampilkan.</b>
          <p className="mt-1">{error}</p>
        </div>
      )}
      {vendor && mode === "edit" && initialValues && (
        <div>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-xl font-black">{vendor.companyName}</h3>
              <p className="text-sm text-slate-500">
                Perbarui profil, kontak utama, dan kategori vendor.
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black">
              {vendor.status.replaceAll("_", " ")}
            </span>
          </div>
          <VendorForm
            categories={categories}
            initialValues={initialValues}
            vendorId={vendor.id}
            onCancel={close}
            onDirtyChange={setDirty}
            onSaved={() => {
              setDirty(false);
              onUpdated();
              onClose();
            }}
          />
        </div>
      )}
      {vendor && mode === "detail" && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-xl font-black text-slate-950">
                {vendor.companyName}
              </h3>
              <p className="mt-1 text-sm text-slate-500">NIB {vendor.nib}</p>
            </div>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-800">
              {vendor.status.replaceAll("_", " ")}
            </span>
          </div>
          <div className="max-w-full overflow-x-auto border-b border-slate-200">
            <div className="flex min-w-max gap-1">
              {tabs.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setTab(item)}
                  className={`rounded-t-lg px-3 py-2.5 text-sm font-bold ${tab === item ? "border-b-2 border-emerald-700 bg-emerald-50 text-emerald-800" : "text-slate-500 hover:bg-slate-50"}`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
          {tab === "Perusahaan" && (
            <dl className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Nama perusahaan" value={vendor.companyName} />
              <Field label="Badan usaha" value={vendor.businessEntityType} />
              <Field label="NIB" value={vendor.nib} />
              <Field label="NPWP" value={masked(vendor.npwp)} />
              <Field label="Provinsi" value={vendor.province} />
              <Field label="Kabupaten/Kota" value={vendor.city} />
              <Field label="Alamat" value={vendor.address} />
              <Field
                label="Website"
                value={
                  vendor.website ? (
                    <a
                      className="text-emerald-700 underline"
                      href={vendor.website}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {vendor.website}
                    </a>
                  ) : (
                    "-"
                  )
                }
              />
              <Field
                label="Kategori"
                value={vendor.categories.map((x) => x.category.name).join(", ")}
              />
              <div className="sm:col-span-2 lg:col-span-3">
                <Field
                  label="Deskripsi usaha"
                  value={vendor.businessDescription}
                />
              </div>
            </dl>
          )}
          {tab === "Kontak & PIC" &&
            (vendor.contacts.length ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {vendor.contacts.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-slate-200 p-4"
                  >
                    <b>{item.name}</b>
                    <p className="mt-1 text-sm text-slate-500">
                      {item.position}
                    </p>
                    <p className="mt-2 text-sm">
                      {item.phone} · {item.email}
                    </p>
                    {item.notes && (
                      <p className="mt-2 text-sm text-slate-500">
                        {item.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <Empty>Belum ada kontak vendor.</Empty>
            ))}
          {tab === "Dokumen" &&
            (vendor.documents.length ? (
              <div className="space-y-2">
                {vendor.documents.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-wrap justify-between gap-3 rounded-xl border p-4"
                  >
                    <div>
                      <b>{item.type}</b>
                      <p className="text-sm text-slate-500">
                        {item.originalName}{" "}
                        {item.number ? `· ${item.number}` : ""}
                      </p>
                    </div>
                    <span className="text-sm">
                      Berlaku hingga: {date(item.expiresAt)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <Empty>Belum ada dokumen legalitas.</Empty>
            ))}
          {tab === "Katalog Produk" && <div className="space-y-4">
            {vendor.status === "ARCHIVED" ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Vendor telah diarsipkan dan harus dipulihkan sebelum produk dapat ditambahkan atau dihubungkan.</div>
            ) : detail.permissions.canCreateProduct ? (
              <div className="flex flex-wrap justify-end gap-2">
                <button type="button" onClick={() => setProductMode("create")} className="rounded-xl bg-[#08783f] px-4 py-2 text-sm font-bold text-white">+ Tambah Produk</button>
                <button type="button" onClick={() => setProductMode("link")} className="rounded-xl border border-emerald-700 px-4 py-2 text-sm font-bold text-emerald-800">Hubungkan Produk Existing</button>
              </div>
            ) : null}
            {vendor.products.length ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {vendor.products.map((item) => (
                  <div key={item.id} className="rounded-xl border p-4">
                    <b>{item.name}</b>
                    <p className="text-sm text-slate-500">
                      {[item.brand, item.model, item.category?.name]
                        .filter(Boolean)
                        .join(" · ") || "Detail produk belum tersedia"}
                    </p>
                    <p className="mt-2 text-xs font-bold text-emerald-700">{item.relationship === "OWNER" ? "Produk milik vendor" : "Produk katalog terhubung"}</p>
                  </div>
                ))}
              </div>
            ) : (
              <Empty>Belum ada produk vendor.</Empty>
            )}</div>}
          {tab === "Presentasi & Trial" &&
            (vendor.presentations.length ? (
              <div className="space-y-3">
                {vendor.presentations.map((item) => (
                  <div key={item.id} className="rounded-xl border p-4">
                    <div className="flex flex-wrap justify-between gap-2">
                      <b>{item.title}</b>
                      <span className="text-xs font-bold text-emerald-700">
                        {item.status.replaceAll("_", " ")}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      {item.type} · {date(item.scheduledAt || item.proposedAt)}
                    </p>
                    {item.technicalEvaluation && (
                      <p className="mt-2 text-sm">
                        {item.technicalEvaluation.result.replaceAll("_", " ")} —{" "}
                        {item.technicalEvaluation.conclusion}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <Empty>Belum ada riwayat presentasi atau trial.</Empty>
            ))}
          {tab === "Riwayat Pengadaan" &&
            (vendor.procurementLinks.length ? (
              <div className="space-y-3">
                {vendor.procurementLinks.map((item) => (
                  <div key={item.id} className="rounded-xl border p-4">
                    <b>{item.package.namaPaket}</b>
                    <p className="mt-1 text-sm text-slate-500">
                      {item.package.kodePaket} ·{" "}
                      {item.package.metodePengadaan.replaceAll("_", " ")} ·{" "}
                      {item.package.statusPaket.replaceAll("_", " ")}
                    </p>
                    <p className="mt-1 text-sm">
                      Sumber: {item.sourceModule} · Peran:{" "}
                      {item.role.replaceAll("_", " ")}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <Empty>Vendor belum ditautkan ke paket pengadaan.</Empty>
            ))}
          {tab === "Evaluasi Kinerja" &&
            (vendor.evaluations.length ? (
              <div className="space-y-3">
                {vendor.evaluations.map((item) => (
                  <div key={item.id} className="rounded-xl border p-4">
                    <div className="flex justify-between gap-2">
                      <b>
                        {item.package?.namaPaket ||
                          item.period ||
                          "Evaluasi internal"}
                      </b>
                      <span className="text-xs font-bold">{item.status}</span>
                    </div>
                    {item.summary && (
                      <p className="mt-2 text-sm">{item.summary}</p>
                    )}
                    <p className="mt-2 text-xs text-slate-400">
                      {item.scores.length} aspek dinilai ·{" "}
                      {date(item.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <Empty>Belum ada evaluasi kinerja internal.</Empty>
            ))}
          {tab === "Aktivitas" &&
            (vendor.statusHistory.length ? (
              <div className="space-y-3">
                {vendor.statusHistory.map((item) => (
                  <div
                    key={item.id}
                    className="border-l-2 border-emerald-300 pl-4"
                  >
                    <b className="text-sm">
                      {item.fromStatus
                        ? `${item.fromStatus.replaceAll("_", " ")} → `
                        : ""}
                      {item.toStatus.replaceAll("_", " ")}
                    </b>
                    <p className="text-xs text-slate-500">
                      {item.actor.name} · {date(item.createdAt)}
                    </p>
                    {item.note && <p className="mt-1 text-sm">{item.note}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <Empty>Belum ada aktivitas vendor.</Empty>
            ))}
          <div className="sticky bottom-0 -mx-4 -mb-4 flex justify-end gap-2 border-t border-slate-200 bg-white px-4 py-4 sm:-mx-6 sm:-mb-6 sm:px-6">
            <button
              type="button"
              onClick={close}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700"
            >
              Tutup
            </button>
            {detail.permissions.canUpdate && vendor.status !== "ARCHIVED" && (
              <button
                type="button"
                onClick={() => setMode("edit")}
                className="rounded-xl bg-[#08783f] px-4 py-2 text-sm font-bold text-white"
              >
                Kelola Vendor
              </button>
            )}
            {detail.permissions.canArchive && vendor.status === "ARCHIVED" && (
              <button type="button" disabled={restoring} onClick={restoreVendor} className="rounded-xl bg-[#08783f] px-4 py-2 text-sm font-bold text-white disabled:opacity-60">{restoring ? "Memulihkan…" : "Pulihkan Vendor"}</button>
            )}
          </div>
        </div>
      )}
      {vendor && <VendorProductModal
        key={vendor.id}
        mode={productMode}
        vendorId={vendor.id}
        categories={categories}
        onClose={() => setProductMode(null)}
        onSaved={() => {
          setProductMode(null);
          setReloadKey((value) => value + 1);
          onUpdated();
        }}
      />}
    </ModalShell>
  );
}
