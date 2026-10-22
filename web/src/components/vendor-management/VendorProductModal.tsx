"use client";

import { FormEvent, useEffect, useState } from "react";
import { LoaderCircle, Search } from "lucide-react";
import ModalShell from "@/components/modal/ModalShell";

type Category = { id: string; name: string };
type VendorOption = { id: string; companyName: string };
type Product = { id: string; name: string; brand: string | null; model: string | null; category: Category | null; vendor: { companyName: string } };
type ApiResponse<T> = { success: boolean; message: string; data?: T; errors?: { field: string; message: string }[] };

export default function VendorProductModal({ mode, vendorId, vendors = [], categories, onClose, onSaved }: {
  mode: "create" | "link" | null;
  vendorId?: string;
  vendors?: VendorOption[];
  categories: Category[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [selectedVendorId, setSelectedVendorId] = useState(vendorId ?? "");

  useEffect(() => {
    if (mode !== "link" || !selectedVendorId) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoadingProducts(true);
      const params = new URLSearchParams({ excludeVendorId: selectedVendorId });
      if (query.trim()) params.set("search", query.trim());
      if (categoryId) params.set("categoryId", categoryId);
      try {
        const response = await fetch(`/api/vendor-management/products?${params}`, { signal: controller.signal });
        const body = await response.json() as ApiResponse<Product[]>;
        if (!response.ok) throw new Error(body.message);
        setProducts(body.data ?? []);
      } catch (reason) {
        if (!(reason instanceof DOMException && reason.name === "AbortError")) setError(reason instanceof Error ? reason.message : "Katalog gagal dimuat.");
      } finally { setLoadingProducts(false); }
    }, 250);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [categoryId, mode, query, selectedVendorId]);

  async function createProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setFieldErrors({});
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    try {
      const targetVendorId = vendorId ?? String(payload.vendorId || "");
      const response = await fetch("/api/vendor-management/products", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...payload, vendorId: targetVendorId, indicativePrice: payload.indicativePrice || undefined }) });
      const body = await response.json() as ApiResponse<unknown>;
      if (!response.ok) {
        setError(body.message || "Produk gagal disimpan.");
        setFieldErrors(Object.fromEntries((body.errors ?? []).map((item) => [item.field, item.message])));
        return;
      }
      onSaved();
    } catch {
      setError("Koneksi ke server gagal. Data formulir tetap tersimpan; silakan coba kembali.");
    } finally {
      setBusy(false);
    }
  }

  async function linkProduct(productId: string) {
    if (!selectedVendorId) { setError("Pilih vendor tujuan terlebih dahulu."); return; }
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/vendor-management/vendors/${selectedVendorId}/products`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId }) });
      const body = await response.json() as ApiResponse<unknown>;
      if (!response.ok) { setError(body.message || "Produk gagal dihubungkan."); return; }
      onSaved();
    } catch {
      setError("Koneksi ke server gagal. Silakan coba menghubungkan produk kembali.");
    } finally {
      setBusy(false);
    }
  }

  const inputClass = "mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600";
  return <ModalShell isOpen={mode !== null} onClose={busy ? () => undefined : onClose} eyebrow="Katalog Produk" title={mode === "create" ? "Tambah Produk" : "Hubungkan Produk Existing"} maxWidthClassName="max-w-3xl">
    {error && <div role="alert" className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</div>}
    {mode === "create" ? <form onSubmit={createProduct} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        {!vendorId && <label className="text-sm font-bold sm:col-span-2">Vendor/penyedia<select name="vendorId" required className={inputClass}><option value="">Pilih vendor aktif</option>{vendors.map((item) => <option key={item.id} value={item.id}>{item.companyName}</option>)}</select><small className="text-rose-600">{fieldErrors.vendorId}</small></label>}
        <label className="text-sm font-bold">Nama produk<input name="name" required className={inputClass}/><small className="text-rose-600">{fieldErrors.name}</small></label>
        <label className="text-sm font-bold">Kategori<select name="categoryId" className={inputClass}><option value="">Tanpa kategori</option>{categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label className="text-sm font-bold">Merek<input name="brand" className={inputClass}/></label>
        <label className="text-sm font-bold">Model/tipe<input name="model" className={inputClass}/></label>
        <label className="text-sm font-bold">Satuan<input name="unit" required defaultValue="unit" className={inputClass}/><small className="text-rose-600">{fieldErrors.unit}</small></label>
        <label className="text-sm font-bold">Harga indikatif (opsional)<input name="indicativePrice" type="number" min="0" step="0.01" className={inputClass}/></label>
        <label className="text-sm font-bold sm:col-span-2">Spesifikasi teknis<textarea name="specification" required rows={4} className={inputClass}/><small className="text-rose-600">{fieldErrors.specification}</small></label>
        <label className="text-sm font-bold sm:col-span-2">Deskripsi<textarea name="description" rows={3} className={inputClass}/></label>
        <label className="text-sm font-bold">Garansi<textarea name="warranty" rows={2} className={inputClass}/></label>
        <label className="text-sm font-bold">Layanan purna jual<textarea name="afterSales" rows={2} className={inputClass}/></label>
      </div>
      <p className="text-xs text-slate-500">Unggah brosur belum tersedia karena penyimpanan dokumen produk privat belum diimplementasikan.</p>
      <div className="flex justify-end gap-2 border-t pt-4"><button type="button" onClick={onClose} disabled={busy} className="rounded-xl border px-4 py-2 text-sm font-bold">Batal</button><button disabled={busy} className="rounded-xl bg-[#08783f] px-4 py-2 text-sm font-bold text-white disabled:opacity-60">{busy ? "Menyimpan…" : "Simpan Produk"}</button></div>
    </form> : <div className="space-y-4">
      {!vendorId && <label className="block text-sm font-bold">Vendor tujuan<select value={selectedVendorId} onChange={(event) => setSelectedVendorId(event.target.value)} className={inputClass}><option value="">Pilih vendor aktif</option>{vendors.map((item) => <option key={item.id} value={item.id}>{item.companyName}</option>)}</select></label>}
      <div className="grid gap-3 sm:grid-cols-[1fr_220px]"><label className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400"/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari nama, merek, model, kategori" className={`${inputClass} mt-0 pl-9`}/></label><select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={`${inputClass} mt-0`}><option value="">Semua kategori</option>{categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div>
      {!selectedVendorId ? <div className="rounded-xl border border-dashed p-8 text-center text-sm text-slate-500">Pilih vendor tujuan untuk melihat produk yang dapat dihubungkan.</div> : loadingProducts ? <div className="flex justify-center py-12"><LoaderCircle className="animate-spin"/></div> : products.length ? <div className="max-h-[50vh] space-y-2 overflow-y-auto">{products.map((product) => <div key={product.id} className="flex items-center justify-between gap-3 rounded-xl border p-3"><div><b>{product.name}</b><p className="text-xs text-slate-500">{[product.brand, product.model, product.category?.name, product.vendor.companyName].filter(Boolean).join(" · ")}</p></div><button type="button" disabled={busy} onClick={() => linkProduct(product.id)} className="shrink-0 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-bold text-white disabled:opacity-60">Hubungkan</button></div>)}</div> : <div className="rounded-xl border border-dashed p-8 text-center text-sm text-slate-500">Tidak ada produk yang dapat dihubungkan.</div>}
      <div className="flex justify-end border-t pt-4"><button type="button" onClick={onClose} disabled={busy} className="rounded-xl border px-4 py-2 text-sm font-bold">Tutup</button></div>
    </div>}
  </ModalShell>;
}
