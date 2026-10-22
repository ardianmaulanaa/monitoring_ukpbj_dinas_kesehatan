"use client";

import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import VendorProductModal from "@/components/vendor-management/VendorProductModal";
import { Card } from "@/app/vendor-management/_components";

type Category = { id: string; name: string };
type Vendor = { id: string; companyName: string };
type Product = { id: string; name: string; brand: string | null; model: string | null; specification: string; indicativePrice: string | null; currency: string; category: Category | null; vendors: Vendor[] };

function money(value: string, currency: string) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency, maximumFractionDigits: 0 }).format(Number(value));
}

export default function ProductCatalog({ products, categories, vendors, canCreate }: { products: Product[]; categories: Category[]; vendors: Vendor[]; canCreate: boolean }) {
  const router = useRouter();
  const [mode, setMode] = useState<"create" | "link" | null>(null);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [vendorId, setVendorId] = useState("");
  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("id-ID");
    return products.filter((product) => (!query || [product.name, product.brand, product.model, product.category?.name].filter(Boolean).some((value) => value!.toLocaleLowerCase("id-ID").includes(query))) && (!categoryId || product.category?.id === categoryId) && (!vendorId || product.vendors.some((vendor) => vendor.id === vendorId)));
  }, [categoryId, products, search, vendorId]);
  function saved() { setMode(null); router.refresh(); }

  return <>
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><h1 className="text-xl font-black text-slate-900">Katalog Produk</h1><p className="mt-1 text-sm text-slate-500">Kelola produk dan vendor penyedia dalam satu katalog.</p></div>
        {canCreate && <div className="flex flex-wrap gap-2">
          <button type="button" disabled={!vendors.length} onClick={() => setMode("create")} className="inline-flex items-center gap-2 rounded-xl bg-[#08783f] px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"><Plus className="h-4 w-4"/> Tambah Produk</button>
          <button type="button" disabled={!vendors.length || !products.length} onClick={() => setMode("link")} className="rounded-xl border border-emerald-700 px-4 py-2 text-sm font-bold text-emerald-800 disabled:cursor-not-allowed disabled:opacity-50">Hubungkan Produk Existing</button>
        </div>}
      </div>
      {!vendors.length && <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">Belum ada vendor aktif yang dapat menerima produk. Pulihkan vendor arsip atau tambahkan vendor aktif terlebih dahulu.</div>}
      <div className="mt-5 grid gap-3 md:grid-cols-[minmax(240px,1fr)_220px_220px]">
        <label className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400"/><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari nama, merek, model, kategori…" className="w-full rounded-xl border border-slate-300 py-2 pl-9 pr-3 text-sm"/></label>
        <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)} className="rounded-xl border border-slate-300 px-3 py-2 text-sm"><option value="">Semua kategori</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select>
        <select value={vendorId} onChange={(event) => setVendorId(event.target.value)} className="rounded-xl border border-slate-300 px-3 py-2 text-sm"><option value="">Semua vendor</option>{vendors.map((vendor) => <option key={vendor.id} value={vendor.id}>{vendor.companyName}</option>)}</select>
      </div>
    </Card>
    {filtered.length ? <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{filtered.map((product) => <Card key={product.id}>
      <p className="text-xs font-bold uppercase text-emerald-700">{product.category?.name ?? "Tanpa kategori"}</p><h2 className="mt-2 text-lg font-black">{product.name}</h2>
      <p className="text-sm text-slate-500">{[product.brand, product.model].filter(Boolean).join(" · ") || "Merek/model belum diisi"}</p><p className="mt-2 text-xs text-slate-500">Vendor: {product.vendors.map((vendor) => vendor.companyName).join(", ")}</p>
      <p className="mt-3 line-clamp-3 text-sm">{product.specification}</p><p className="mt-4 font-black text-slate-800">{product.indicativePrice ? money(product.indicativePrice, product.currency) : "Harga informatif belum tersedia"}</p><p className="mt-1 text-xs text-slate-400">Harga indikatif, bukan HPS.</p>
    </Card>)}</div> : <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-12 text-center"><h2 className="font-black text-slate-800">{products.length ? "Tidak ada produk sesuai filter." : "Katalog produk masih kosong."}</h2><p className="mt-2 text-sm text-slate-500">{products.length ? "Ubah kata pencarian atau filter untuk melihat produk lain." : "Tambahkan produk dari penyedia atau hubungkan produk yang sudah terdaftar."}</p>{canCreate && vendors.length > 0 && !products.length && <button type="button" onClick={() => setMode("create")} className="mt-4 rounded-xl bg-[#08783f] px-4 py-2 text-sm font-bold text-white">+ Tambah Produk</button>}</div>}
    <VendorProductModal key={mode ?? "closed"} mode={mode} vendors={vendors} categories={categories} onClose={() => setMode(null)} onSaved={saved}/>
  </>;
}
