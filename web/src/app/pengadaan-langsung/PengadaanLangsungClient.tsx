"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { ClipboardList, FileCheck2, Handshake, LayoutDashboard, PackageSearch, Truck, UserRound, WalletCards } from "lucide-react";
import ModalShell from "@/components/modal/ModalShell";
import { removePengadaanLangsungDocument, savePengadaanLangsungStep, uploadPengadaanLangsungDocument, type PengadaanLangsungStep } from "./actions";

const randomUUID = () => crypto.randomUUID();

type JsonObject = Record<string, unknown>;
type Props = { rup: { id:string; kodeRup:string; namaPaket:string; unitPengusul:string; sumberDana:string; tahunAnggaran:number; pagu:string; jenisBelanja:string|null; ppkPptk:string|null; createdAt:string; updatedAt:string }; workflow: { rincian:unknown; penyedia:unknown; negosiasi:unknown; kontrak:unknown; pengiriman:unknown; pemeriksaan:unknown; pembayaran:unknown; tahapAktif:string } | null; documents: { dokumen:string; status:string; catatan:string|null; fileUrl:string|null; updatedAt:string }[] };
const tabs = [
  ["overview","Overview",LayoutDashboard],["rincian","Rincian Barang/Jasa",PackageSearch],["penyedia","Penyedia",UserRound],["negosiasi","Penawaran & Negosiasi",Handshake],["kontrak","Kontrak / SPK",FileCheck2],["pengiriman","Pengiriman / Pelaksanaan",Truck],["pemeriksaan","Pemeriksaan",ClipboardList],["pembayaran","Pembayaran",WalletCards],["dokumen","Dokumen",ClipboardList],
] as const;
const input = "h-11 min-w-0 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-[#08783f] focus:ring-2 focus:ring-emerald-100";
const area = `${input} h-auto min-h-24 py-3`;
const label = "grid min-w-0 gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500";
const fields: Record<Exclude<PengadaanLangsungStep,"rincian">, [string,string,string?][]> = {
  penyedia:[["nama","Nama Perusahaan / Penyedia"],["badanUsaha","Bentuk Badan Usaha"],["npwpNib","NPWP / NIB"],["telepon","Telepon"],["email","Email","email"],["pic","Nama PIC"],["kontakPic","Kontak PIC"],["alamat","Alamat","textarea"],["keterangan","Keterangan Penyedia","textarea"]],
  negosiasi:[["tanggalPermintaan","Tanggal Permintaan Penawaran","date"],["nomorPenawaran","Nomor Surat Penawaran"],["tanggalPenawaran","Tanggal Surat Penawaran","date"],["nilaiPenawaran","Nilai Penawaran","number"],["statusKlarifikasi","Status Klarifikasi"],["tanggalNegosiasi","Tanggal Negosiasi","date"],["hargaNegosiasi","Harga Hasil Negosiasi","number"],["evaluasi","Evaluasi Administrasi / Teknis","textarea"],["hasil","Hasil Kesepakatan","textarea"],["keterangan","Keterangan Negosiasi","textarea"]],
  kontrak:[["jenisBukti","Jenis Bukti Kontrak"],["nomorDokumen","Nomor Dokumen"],["tanggalDokumen","Tanggal Dokumen","date"],["nilaiKontrak","Nilai Kontrak / Transaksi","number"],["namaPenyedia","Nama Penyedia"],["pejabat","PPK / Pejabat Terkait"],["waktuPelaksanaan","Waktu Pelaksanaan"],["tanggalMulai","Tanggal Mulai","date"],["tanggalSelesai","Tanggal Selesai","date"],["status","Status Kontrak"],["catatan","Catatan Kontrak","textarea"]],
  pengiriman:[["tanggalRencana","Tanggal Rencana","date"],["tanggalRealisasi","Tanggal Realisasi","date"],["jumlah","Jumlah yang Dikirim"],["lokasi","Lokasi Pengiriman / Pelaksanaan"],["nomorSuratJalan","Nomor Surat Jalan"],["status","Status Pengiriman / Pelaksanaan"],["keterangan","Keterangan Pengiriman","textarea"],["catatan","Catatan Pengiriman","textarea"]],
  pemeriksaan:[["tanggal","Tanggal Pemeriksaan","date"],["petugas","Petugas Pemeriksa"],["kesesuaianJumlah","Kesesuaian Jumlah"],["kesesuaianSpesifikasi","Kesesuaian Spesifikasi"],["ujiFungsi","Hasil Uji Fungsi / Tidak Berlaku"],["status","Status Pemeriksaan"],["nomorDokumen","Nomor Dokumen Pemeriksaan"],["tanggalSerahTerima","Tanggal Serah Terima","date"],["nomorBast","Nomor BAST"],["kondisi","Kondisi Barang / Hasil Pekerjaan","textarea"],["tindakLanjut","Tindak Lanjut Ketidaksesuaian","textarea"],["keterangan","Keterangan Pemeriksaan","textarea"],["catatan","Catatan Pemeriksaan","textarea"]],
  pembayaran:[["statusDokumen","Status Kelengkapan Dokumen"],["statusPembayaran","Status Pembayaran"],["nilai","Nilai Pembayaran","number"],["nomorInvoice","Nomor Invoice"],["nomorFaktur","Nomor Faktur Pajak"],["tanggal","Tanggal Pembayaran","date"],["keterangan","Keterangan Pembayaran","textarea"],["catatan","Catatan Pembayaran","textarea"]],
};
function object(value: unknown): JsonObject { return value && typeof value === "object" && !Array.isArray(value) ? value as JsonObject : {}; }
function currency(value: unknown) { return new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0}).format(Number(value)||0); }

export default function PengadaanLangsungClient({rup,workflow,documents}:Props) {
  const router=useRouter(); const [tab,setTab]=useState<(typeof tabs)[number][0]>("overview"); const [message,setMessage]=useState(""); const [pending,startTransition]=useTransition();
  const tabListRef=useRef<HTMLDivElement>(null);
  const saved = { rincian:object(workflow?.rincian), penyedia:object(workflow?.penyedia), negosiasi:object(workflow?.negosiasi), kontrak:object(workflow?.kontrak), pengiriman:object(workflow?.pengiriman), pemeriksaan:object(workflow?.pemeriksaan), pembayaran:object(workflow?.pembayaran) };
  const initialItems = Array.isArray(saved.rincian.items) ? saved.rincian.items as JsonObject[] : [];
  const [items,setItems]=useState<JsonObject[]>(initialItems.length?initialItems:[{id:randomUUID(),nama:"",kategori:"",spesifikasi:"",merek:"",volume:1,satuan:"",hargaSatuan:0,lokasi:"",catatan:""}]);
  function submit(step:PengadaanLangsungStep,data:unknown){setMessage("");startTransition(async()=>{const result=await savePengadaanLangsungStep(rup.id,step,data);setMessage(result.message);if(result.ok)router.refresh();});}
  function upload(formData:FormData){setMessage("");startTransition(async()=>{const result=await uploadPengadaanLangsungDocument(rup.id,formData);setMessage(result.message);if(result.ok)router.refresh();});}
  function remove(dokumen:string){if(!window.confirm(`Lepas dokumen ${dokumen} dari paket?`))return;startTransition(async()=>{const result=await removePengadaanLangsungDocument(rup.id,dokumen);setMessage(result.message);if(result.ok)router.refresh();});}
  function close(){router.push("/pengadaan-langsung");}
  useEffect(()=>{
    const activeTab=tabListRef.current?.querySelector<HTMLElement>(`[role="tab"][data-tab="${tab}"]`);
    activeTab?.scrollIntoView({behavior:"smooth",block:"nearest",inline:"nearest"});
  },[tab]);
  function handleTabKeyDown(event:React.KeyboardEvent<HTMLDivElement>){
    if(!["ArrowLeft","ArrowRight","Home","End"].includes(event.key))return;
    event.preventDefault();
    const current=tabs.findIndex(([key])=>key===tab);
    const next=event.key==="Home"?0:event.key==="End"?tabs.length-1:event.key==="ArrowRight"?(current+1)%tabs.length:(current-1+tabs.length)%tabs.length;
    setTab(tabs[next][0]);
    requestAnimationFrame(()=>tabListRef.current?.querySelector<HTMLElement>(`[data-tab="${tabs[next][0]}"]`)?.focus());
  }
  const completed = Object.values(saved).filter((value)=>Object.keys(value).length>0).length;
  return <ModalShell isOpen onClose={close} eyebrow="Pengadaan Langsung" title={rup.namaPaket} maxWidthClassName="max-w-7xl">
    <div className="min-w-0">
      <div ref={tabListRef} onKeyDown={handleTabKeyDown} className="mb-4 overflow-x-auto overscroll-x-contain scroll-smooth pb-2" role="tablist" aria-label="Tahapan Pengadaan Langsung"><div className="flex min-w-max gap-2">{tabs.map(([key,text,Icon])=><button key={key} data-tab={key} type="button" role="tab" aria-selected={tab===key} tabIndex={tab===key?0:-1} onClick={()=>setTab(key)} className={`flex min-h-11 shrink-0 items-center gap-2 rounded-xl border px-3 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 ${tab===key?"border-[#08783f] bg-[#08783f] text-white":"border-slate-200 bg-white text-slate-600 hover:border-emerald-300 hover:text-[#08783f]"}`}><Icon className="h-4 w-4"/>{text}</button>)}</div></div>
      {message?<p className={`mb-4 rounded-xl px-4 py-3 text-sm font-semibold ${message.includes("berhasil")?"bg-emerald-50 text-emerald-700":"bg-red-50 text-red-700"}`} role="status">{message}</p>:null}
      {tab==="overview"?<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{[["Kode RUP",rup.kodeRup],["Tahun",rup.tahunAnggaran],["Sumber Dana",rup.sumberDana],["Unit",rup.unitPengusul],["Jenis",rup.jenisBelanja||"-"],["Metode","Pengadaan Langsung"],["Pagu",currency(rup.pagu)],["Penanggung Jawab",rup.ppkPptk||"-"],["Progres",`${completed}/7 tahap tersimpan`],["Tahap Aktif",workflow?.tahapAktif||"RINCIAN"],["Dibuat",new Date(rup.createdAt).toLocaleDateString("id-ID")],["Diperbarui",new Date(rup.updatedAt).toLocaleDateString("id-ID")]].map(([a,b])=><div key={String(a)} className="min-w-0 rounded-xl border border-slate-200 bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">{a}</p><p className="mt-1 break-words font-semibold text-slate-900">{String(b)}</p></div>)}</div>:null}
      {tab==="rincian"?<div className="space-y-4">{items.map((item,index)=><div key={String(item.id)} className="rounded-2xl border border-slate-200 p-4"><div className="mb-3 flex items-center justify-between"><h3 className="font-bold">Item {index+1}</h3><button type="button" disabled={items.length===1} onClick={()=>setItems(v=>v.filter((_,i)=>i!==index))} className="min-h-11 rounded-xl px-3 text-sm font-bold text-red-600 disabled:opacity-40">Hapus</button></div><div className="grid gap-3 sm:grid-cols-2">{[["nama","Nama Barang/Jasa"],["kategori","Kategori"],["merek","Merek/Tipe"],["volume","Volume","number"],["satuan","Satuan"],["hargaSatuan","Harga Satuan","number"],["lokasi","Lokasi Penyerahan/Pelaksanaan"],["spesifikasi","Spesifikasi Teknis","textarea"],["catatan","Catatan Kebutuhan","textarea"]].map(([key,text,type])=><label key={key} className={`${label} ${type==="textarea"?"sm:col-span-2":""}`}>{text}{type==="textarea"?<textarea className={area} value={String(item[key]??"")} onChange={e=>setItems(v=>v.map((x,i)=>i===index?{...x,[key]:e.target.value}:x))}/>:<input className={input} type={type||"text"} min={type==="number"?0:undefined} value={String(item[key]??"")} onChange={e=>setItems(v=>v.map((x,i)=>i===index?{...x,[key]:type==="number"?Number(e.target.value):e.target.value}:x))}/>}</label>)}</div><p className="mt-3 text-right text-sm font-bold text-[#08783f]">Total: {currency(Number(item.volume)*Number(item.hargaSatuan))}</p></div>)}<div className="flex flex-wrap gap-3"><button type="button" onClick={()=>setItems(v=>[...v,{id:randomUUID(),nama:"",kategori:"",spesifikasi:"",merek:"",volume:1,satuan:"",hargaSatuan:0,lokasi:"",catatan:""}])} className="min-h-11 rounded-xl border border-emerald-300 px-4 font-bold text-[#08783f]">Tambah Item</button><button type="button" disabled={pending} onClick={()=>submit("rincian",{items})} className="min-h-11 rounded-xl bg-[#08783f] px-5 font-bold text-white disabled:opacity-60">Simpan Rincian</button></div></div>:null}
      {Object.keys(fields).includes(tab)?<StageForm key={`${rup.id}-${tab}`} step={tab as Exclude<PengadaanLangsungStep,"rincian">} values={saved[tab as Exclude<PengadaanLangsungStep,"rincian">]} pending={pending} onSave={submit}/>:null}
      {tab==="dokumen"?<div className="space-y-4"><form action={upload} className="grid gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4 sm:grid-cols-2"><label className={label}>Jenis Dokumen<input name="jenis" required placeholder="Contoh: DOKUMEN_KONTRAK" className={input}/></label><label className={label}>File PDF/JPG/PNG<input name="file" required type="file" accept=".pdf,.jpg,.jpeg,.png" className={`${input} py-2`}/></label><label className={`${label} sm:col-span-2`}>Catatan<textarea name="catatan" className={area}/></label><button disabled={pending} className="min-h-11 rounded-xl bg-[#08783f] px-5 font-bold text-white sm:col-span-2">Upload Dokumen</button></form>{documents.length?documents.map(d=><div key={d.dokumen} className="flex min-w-0 flex-col gap-2 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="break-words font-bold">{d.dokumen.replaceAll("_"," ")}</p><p className="text-xs text-slate-500">{d.status} · {new Date(d.updatedAt).toLocaleDateString("id-ID")}</p></div><div className="flex flex-wrap gap-2">{d.fileUrl?<a className="inline-flex min-h-11 items-center rounded-xl border px-4 font-bold text-[#08783f]" href={d.fileUrl} target="_blank" rel="noreferrer">Preview / Download</a>:null}<button type="button" disabled={pending} onClick={()=>remove(d.dokumen)} className="min-h-11 rounded-xl border border-red-200 px-4 font-bold text-red-600">Hapus</button></div></div>):<p className="rounded-xl bg-slate-50 p-6 text-center text-slate-500">Belum ada dokumen yang terhubung ke paket ini.</p>}</div>:null}
    </div>
  </ModalShell>;
}

function StageForm({step,values,pending,onSave}:{step:Exclude<PengadaanLangsungStep,"rincian">;values:JsonObject;pending:boolean;onSave:(step:PengadaanLangsungStep,data:unknown)=>void}){
  const [applicable,setApplicable]=useState(values.berlaku!==false);
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data: Record<string, string | number | boolean> = Object.fromEntries(new FormData(event.currentTarget)) as Record<string, string>;
    if (step === "negosiasi" && !applicable) {
      fields.negosiasi.forEach(([key,,type]) => { data[key] = type === "number" ? 0 : ""; });
    }
    fields[step].forEach(([key,,type]) => { if (type === "number") data[key] = Number(data[key] || 0); });
    if (step === "negosiasi") data.berlaku = applicable;
    onSave(step, data);
  }
  return <form onSubmit={handleSubmit} className="grid min-w-0 gap-4 sm:grid-cols-2">{step==="negosiasi"?<label className="sm:col-span-2 flex min-h-11 items-center gap-3 rounded-xl bg-slate-50 px-4 text-sm font-bold"><input type="checkbox" checked={applicable} onChange={e=>setApplicable(e.target.checked)}/>Negosiasi berlaku untuk paket ini</label>:null}{fields[step].map(([key,text,type])=><label key={key} className={`${label} ${type==="textarea"?"sm:col-span-2":""}`}>{text}{type==="textarea"?<textarea name={key} defaultValue={String(values[key]??"")} disabled={!applicable&&step==="negosiasi"} className={area}/>:<input name={key} type={type||"text"} min={type==="number"?0:undefined} defaultValue={String(values[key]??"")} disabled={!applicable&&step==="negosiasi"} className={input}/>}</label>)}<button disabled={pending} className="min-h-11 rounded-xl bg-[#08783f] px-5 font-bold text-white disabled:opacity-60 sm:col-span-2">{pending?"Menyimpan...":"Simpan Tahap"}</button></form>;
}
