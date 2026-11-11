"use client";

import { useMemo, useState } from "react";
import { FileText, ImageIcon, Plus, Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import VendorProductModal from "@/components/vendor-management/VendorProductModal";
import { Card } from "@/app/vendor-management/_components";

type Category = { id: string; name: string };
type Vendor = { id: string; companyName: string };
type PackageHistory = {
  id: string;
  packageName: string;
  method: string;
  rupCode: string;
  quantity: string | null;
  unit: string | null;
  listedUnitPrice?: string | null;
  offeredPrice?: string | null;
  transactionPrice: string | null;
  status: string | null;
  productUrl: string | null;
};
type Product = {
  id: string;
  name: string;
  brand: string | null;
  model: string | null;
  specification: string;
  indicativePrice: string | null;
  currency: string;
  category: Category | null;
  vendors: Vendor[];
  attachments?: {
    id: string;
    type: string;
    originalName: string;
    mimeType: string;
  }[];
  procurementMethods?: string[];
  packageHistories?: PackageHistory[];
  source?: "VENDOR_PRODUCT" | "RUP_E_PURCHASING";
};

const methodFilters = [
  { value: "", label: "Semua" },
  { value: "E_PURCHASING", label: "E-Purchasing" },
  { value: "PENGADAAN_LANGSUNG", label: "Pengadaan Langsung" },
  { value: "TENDER", label: "Tender" },
  { value: "SELEKSI", label: "Seleksi" },
  { value: "NON_TENDER", label: "Non-Tender" },
] as const;

function money(value: string, currency: string) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number(value));
}

export default function ProductCatalog({
  products,
  categories,
  vendors,
  canCreate,
}: {
  products: Product[];
  categories: Category[];
  vendors: Vendor[];
  canCreate: boolean;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"create" | "link" | null>(null);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [vendorId, setVendorId] = useState("");
  const [method, setMethod] = useState("");
  const [selected, setSelected] = useState<Product | null>(null);
  const ePurchasingCount = products.filter(
    (product) => product.source === "RUP_E_PURCHASING",
  ).length;
  const vendorOptions = useMemo(
    () =>
      Array.from(
        new Map(
          [...vendors, ...products.flatMap((product) => product.vendors)].map(
            (vendor) => [vendor.id, vendor],
          ),
        ).values(),
      ).sort((a, b) => a.companyName.localeCompare(b.companyName, "id")),
    [products, vendors],
  );
  const categoryOptions = useMemo(
    () =>
      Array.from(
        new Map(
          [
            ...categories,
            ...products.flatMap((product) =>
              product.category ? [product.category] : [],
            ),
          ].map((category) => [category.id, category]),
        ).values(),
      ).sort((a, b) => a.name.localeCompare(b.name, "id")),
    [categories, products],
  );
  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("id-ID");
    return products.filter(
      (product) =>
        (!query ||
          [
            product.name,
            product.brand,
            product.model,
            product.category?.name,
            product.specification,
            ...product.vendors.map((vendor) => vendor.companyName),
          ]
            .filter(Boolean)
            .some((value) =>
              value!.toLocaleLowerCase("id-ID").includes(query),
            )) &&
        (!categoryId || product.category?.id === categoryId) &&
        (!vendorId ||
          product.vendors.some((vendor) => vendor.id === vendorId)) &&
        (!method || product.procurementMethods?.includes(method)),
    );
  }, [categoryId, method, products, search, vendorId]);
  function saved() {
    setMode(null);
    router.refresh();
  }

  return (
    <>
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-black text-slate-900">
              Katalog Produk
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Kelola produk dan vendor penyedia dalam satu katalog.
            </p>
          </div>
          {canCreate && (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={!vendors.length}
                onClick={() => setMode("create")}
                className="inline-flex items-center gap-2 rounded-xl bg-[#08783f] px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus className="h-4 w-4" /> Tambah Produk
              </button>
              <button
                type="button"
                disabled={!vendors.length || !products.length}
                onClick={() => setMode("link")}
                className="rounded-xl border border-emerald-700 px-4 py-2 text-sm font-bold text-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Hubungkan Produk Existing
              </button>
            </div>
          )}
        </div>
        {!vendors.length && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            Belum ada vendor aktif yang dapat menerima produk. Pulihkan vendor
            arsip atau tambahkan vendor aktif terlebih dahulu.
          </div>
        )}
        <div
          className="mt-5 flex gap-2 overflow-x-auto pb-1"
          role="group"
          aria-label="Filter metode pengadaan"
        >
          {methodFilters.map((item) => (
            <button
              key={item.value || "all"}
              type="button"
              onClick={() => setMethod(item.value)}
              aria-pressed={method === item.value}
              className={`shrink-0 rounded-full px-3.5 py-2 text-sm font-bold ring-1 ring-inset ${method === item.value ? "bg-[#08783f] text-white ring-[#08783f]" : "bg-white text-slate-600 ring-slate-200 hover:bg-emerald-50"}`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-[minmax(240px,1fr)_220px_220px]">
          <label className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari nama, merek, model, kategori…"
              className="w-full rounded-xl border border-slate-300 py-2 pl-9 pr-3 text-sm"
            />
          </label>
          <select
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">Semua kategori</option>
            {categoryOptions.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <select
            value={vendorId}
            onChange={(event) => setVendorId(event.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">Semua vendor</option>
            {vendorOptions.map((vendor) => (
              <option key={vendor.id} value={vendor.id}>
                {vendor.companyName}
              </option>
            ))}
          </select>
        </div>
      </Card>
      <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
        Katalog terhubung langsung ke data E-Purchasing dan saat ini menemukan{" "}
        <strong>{ePurchasingCount} item produk</strong>. Perubahan item pada
        workflow E-Purchasing otomatis tercermin di sini; riwayat vendor tidak
        diwariskan ke produk lain.
      </div>
      {filtered.length ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((product) => {
            const attachments = product.attachments ?? [];
            const methods = product.procurementMethods ?? [];
            const image = attachments.find((attachment) =>
              attachment.mimeType.startsWith("image/"),
            );
            const documents = attachments.filter(
              (attachment) => !attachment.mimeType.startsWith("image/"),
            );
            return (
              <Card key={product.id}>
                <div className="mb-4 flex h-32 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                  {image ? (
                    <div className="px-4 text-center">
                      <ImageIcon className="mx-auto h-8 w-8" />
                      <p className="mt-2 line-clamp-1 text-xs">
                        {image.originalName}
                      </p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <ImageIcon className="mx-auto h-8 w-8" />
                      <p className="mt-2 text-xs">Foto belum tersedia</p>
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-bold uppercase text-emerald-700">
                    {product.category?.name ?? "Tanpa kategori"}
                  </p>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">
                    {methods.length
                      ? methods
                          .map(
                            (value) =>
                              methodFilters.find((item) => item.value === value)
                                ?.label ?? value,
                          )
                          .join(", ")
                      : "Belum Terhubung dengan Paket"}
                  </span>
                </div>
                <h2 className="mt-2 text-lg font-black">{product.name}</h2>
                <p className="mt-1 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                  {product.source === "RUP_E_PURCHASING"
                    ? "Sumber: transaksi E-Purchasing"
                    : "Sumber: master VMS"}
                </p>
                <p className="text-sm text-slate-500">
                  {[product.brand, product.model].filter(Boolean).join(" · ") ||
                    "Merek/model belum diisi"}
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  Vendor:{" "}
                  {product.vendors
                    .map((vendor) => vendor.companyName)
                    .join(", ") || "Belum tersedia pada transaksi sumber"}
                </p>
                <p className="mt-3 line-clamp-3 text-sm">
                  {product.specification}
                </p>
                <p className="mt-4 font-black text-slate-800">
                  {product.indicativePrice
                    ? money(product.indicativePrice, product.currency)
                    : "Harga indikatif master belum tersedia"}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Harga transaksi ditampilkan terpisah pada detail riwayat
                  paket.
                </p>
                <div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500">
                  <FileText className="h-4 w-4" />
                  {documents.length
                    ? `${documents.length} dokumen: ${documents.map((item) => item.originalName).join(", ")}`
                    : "Brosur/datasheet belum tersedia"}
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    {product.packageHistories?.length ?? 0} riwayat paket
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelected(product)}
                    className="rounded-lg border border-emerald-700 px-3 py-1.5 text-xs font-bold text-emerald-800"
                  >
                    Detail
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-12 text-center">
          <h2 className="font-black text-slate-800">
            {products.length
              ? "Tidak ada produk sesuai filter."
              : "Belum ada produk existing di database."}
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            {products.length
              ? "Ubah kata pencarian atau filter untuk melihat produk lain."
              : "Belum ada master VendorProduct atau record E-Purchasing dengan nama item produk yang terisi."}
          </p>
        </div>
      )}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-0 sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="product-detail-title"
        >
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase text-emerald-700">
                  Detail produk
                </p>
                <h2
                  id="product-detail-title"
                  className="mt-1 text-xl font-black text-slate-900"
                >
                  {selected.name}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                aria-label="Tutup detail produk"
                className="rounded-lg border border-slate-200 p-2"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs font-bold text-slate-500">Merek / tipe</p>
                <p className="mt-1 text-sm">
                  {[selected.brand, selected.model]
                    .filter(Boolean)
                    .join(" · ") || "-"}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500">Kategori</p>
                <p className="mt-1 text-sm">{selected.category?.name ?? "-"}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500">
                  Harga indikatif master
                </p>
                <p className="mt-1 text-sm">
                  {selected.indicativePrice
                    ? money(selected.indicativePrice, selected.currency)
                    : "Belum tersedia"}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500">
                  Sumber record
                </p>
                <p className="mt-1 text-sm">
                  {selected.source === "RUP_E_PURCHASING"
                    ? "Item transaksi E-Purchasing"
                    : "Master produk VMS"}
                </p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs font-bold text-slate-500">Penyedia</p>
                <p className="mt-1 text-sm">
                  {selected.vendors
                    .map((vendor) => vendor.companyName)
                    .join(", ") || "Belum tersedia pada transaksi sumber"}
                </p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs font-bold text-slate-500">Spesifikasi</p>
                <p className="mt-1 whitespace-pre-wrap text-sm">
                  {selected.specification}
                </p>
              </div>
            </div>
            <h3 className="mt-6 font-black text-slate-900">
              Dokumen pendukung
            </h3>
            <div className="mt-2 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
              {selected.attachments?.length
                ? selected.attachments.map((file) => (
                    <p key={file.id}>
                      {file.type}: {file.originalName}
                    </p>
                  ))
                : "Belum ada attachment pada sumber data ini."}
            </div>
            <h3 className="mt-6 font-black text-slate-900">
              Riwayat paket pengadaan
            </h3>
            <div className="mt-2 space-y-3">
              {selected.packageHistories?.length ? (
                selected.packageHistories.map((history) => (
                  <div
                    key={history.id}
                    className="rounded-xl border border-slate-200 p-4"
                  >
                    <div className="flex flex-wrap justify-between gap-2">
                      <strong>{history.packageName}</strong>
                      <span className="text-xs font-bold text-emerald-700">
                        {methodFilters.find(
                          (item) => item.value === history.method,
                        )?.label ?? history.method}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-slate-500">
                      Kode RUP: {history.rupCode} · Jumlah:{" "}
                      {history.quantity ?? "-"} {history.unit ?? ""}
                    </p>
                    <div className="mt-2 grid gap-1 text-xs text-slate-500 sm:grid-cols-3">
                      <p>
                        Harga tayang/satuan:{" "}
                        {history.listedUnitPrice
                          ? money(history.listedUnitPrice, "IDR")
                          : "-"}
                      </p>
                      <p>
                        Harga penawaran:{" "}
                        {history.offeredPrice
                          ? money(history.offeredPrice, "IDR")
                          : "-"}
                      </p>
                      <p>
                        Harga final/negosiasi:{" "}
                        {history.transactionPrice
                          ? money(history.transactionPrice, "IDR")
                          : "-"}
                      </p>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      Status transaksi: {history.status ?? "-"}
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
                  Produk master belum mempunyai relasi item paket.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      <VendorProductModal
        key={mode ?? "closed"}
        mode={mode}
        vendors={vendors}
        categories={categories}
        onClose={() => setMode(null)}
        onSaved={saved}
      />
    </>
  );
}
