"use server";

import { Prisma, type RoleCode } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { hasAnyRole } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

const roles: RoleCode[] = ["SUPER_ADMIN", "PPK", "PROCUREMENT_OFFICER"];
const text = (max = 10_000) => z.string().trim().max(max).default("");
const requiredText = (label: string, max: number) => z.string().trim().min(1, `${label} wajib diisi.`).max(max);
const money = z.coerce.number().min(0).max(999_999_999_999_999.99);
const itemSchema = z.object({
  id: z.string().uuid(), nama: requiredText("Nama barang/jasa", 220), kategori: text(120), spesifikasi: text(),
  merek: text(160), volume: z.coerce.number().positive(), satuan: text(60),
  hargaSatuan: money, lokasi: text(180), catatan: text(),
});
const schemas = {
  rincian: z.object({ items: z.array(itemSchema).min(1).max(100) }),
  penyedia: z.object({ nama: requiredText("Nama penyedia", 180), badanUsaha: text(80), npwpNib: text(80), alamat: text(), telepon: text(40), email: text(180), pic: text(120), kontakPic: text(80), keterangan: text() }),
  negosiasi: z.object({ berlaku: z.boolean(), tanggalPermintaan: text(20), nomorPenawaran: text(120), tanggalPenawaran: text(20), nilaiPenawaran: money, evaluasi: text(), statusKlarifikasi: text(80), tanggalNegosiasi: text(20), hargaNegosiasi: money, hasil: text(), keterangan: text() }),
  kontrak: z.object({ jenisBukti: requiredText("Jenis bukti kontrak",80), nomorDokumen: text(120), tanggalDokumen: text(20), nilaiKontrak: money, namaPenyedia: text(180), pejabat: text(160), waktuPelaksanaan: text(120), tanggalMulai: text(20), tanggalSelesai: text(20), status: requiredText("Status kontrak",80), catatan: text() }),
  pengiriman: z.object({ tanggalRencana: text(20), tanggalRealisasi: text(20), jumlah: text(80), lokasi: text(180), nomorSuratJalan: text(120), status: requiredText("Status pengiriman/pelaksanaan",80), keterangan: text(), catatan: text() }),
  pemeriksaan: z.object({ tanggal: text(20), petugas: text(160), kesesuaianJumlah: text(80), kesesuaianSpesifikasi: text(80), kondisi: text(), ujiFungsi: text(80), status: requiredText("Status pemeriksaan",80), nomorDokumen: text(120), tanggalSerahTerima: text(20), nomorBast: text(120), keterangan: text(), catatan: text(), tindakLanjut: text() }),
  pembayaran: z.object({ statusDokumen: requiredText("Status dokumen pembayaran",80), statusPembayaran: requiredText("Status pembayaran",80), nilai: money, nomorInvoice: text(120), nomorFaktur: text(120), tanggal: text(20), keterangan: text(), catatan: text() }),
};

export type PengadaanLangsungStep = keyof typeof schemas;
export type ActionState = { ok: boolean; message: string };
const documentTypes = new Map([["application/pdf",".pdf"],["image/jpeg",".jpg"],["image/png",".png"]]);

async function authorize(rupId: string) {
  const user = await getCurrentUser();
  if (!user || !hasAnyRole(user.roles, roles)) return { error: "Akses ditolak." } as const;
  const rup = await prisma.rencanaUmumPengadaan.findUnique({ where: { id: rupId } });
  if (!rup || rup.metodePengadaan !== "PENGADAAN_LANGSUNG") return { error: "Paket Pengadaan Langsung tidak ditemukan." } as const;
  return { user, rup } as const;
}

async function ensureWorkflow(rup: NonNullable<Awaited<ReturnType<typeof prisma.rencanaUmumPengadaan.findUnique>>>) {
  const existing = await prisma.pengadaanLangsungWorkflow.findUnique({ where: { rupId: rup.id } });
  if (existing) return existing;
  return prisma.$transaction(async (tx) => {
    const paket = await tx.paketPengadaan.upsert({
      where: { kodePaket: `PL-${rup.kodeRup}` },
      update: {},
      create: { kodePaket: `PL-${rup.kodeRup}`, namaPaket: rup.namaPaket, unitPemohon: rup.unitPengusul, tahunAnggaran: rup.tahunAnggaran, sumberDana: rup.sumberDana, kategori: rup.jenisBelanja ?? "LAINNYA", metodePengadaan: "PENGADAAN_LANGSUNG", pagu: rup.pagu, hps: rup.totalEstimasi ?? rup.pagu, ppkPenanggungJawab: rup.ppkPptk, lokasiPelaksanaan: rup.lokasiPaket, statusPaket: "PERSIAPAN_DOKUMEN" },
    });
    return tx.pengadaanLangsungWorkflow.create({ data: { rupId: rup.id, paketId: paket.id } });
  });
}

export async function savePengadaanLangsungStep(rupId: string, step: PengadaanLangsungStep, input: unknown): Promise<ActionState> {
  const auth = await authorize(rupId);
  if ("error" in auth) return { ok: false, message: auth.error ?? "Akses ditolak." };
  const schema = schemas[step];
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  const workflow = await ensureWorkflow(auth.rup);
  const data = parsed.data as Prisma.InputJsonValue;
  const stageOrder: PengadaanLangsungStep[] = ["rincian", "penyedia", "negosiasi", "kontrak", "pengiriman", "pemeriksaan", "pembayaran"];
  const stageIndex = stageOrder.indexOf(step);
  const nextStage = (stageOrder[Math.min(stageIndex + 1, stageOrder.length - 1)] ?? step).toUpperCase();

  if (step === "kontrak" && Number((parsed.data as z.infer<typeof schemas.kontrak>).nilaiKontrak) > Number(auth.rup.pagu)) {
    return { ok: false, message: "Nilai kontrak tidak boleh melebihi pagu paket." };
  }
  await prisma.$transaction([
    prisma.pengadaanLangsungWorkflow.update({ where: { id: workflow.id }, data: { [step]: data, tahapAktif: nextStage } }),
    prisma.auditLog.create({ data: { userId: auth.user.id, action: "UPDATE", entity: `PENGADAAN_LANGSUNG_${step.toUpperCase()}`, entityId: workflow.id, after: data } }),
  ]);
  revalidatePath("/pengadaan-langsung"); revalidatePath("/dashboard");
  return { ok: true, message: "Data berhasil disimpan." };
}

export async function uploadPengadaanLangsungDocument(rupId: string, formData: FormData): Promise<ActionState> {
  const auth = await authorize(rupId); if ("error" in auth) return {ok:false,message:auth.error??"Akses ditolak."};
  const jenis=String(formData.get("jenis")??"").trim().slice(0,160); const catatan=String(formData.get("catatan")??"").trim().slice(0,10_000); const file=formData.get("file");
  if(!jenis||!(file instanceof File)||file.size===0) return {ok:false,message:"Jenis dokumen dan file wajib diisi."};
  const extension=documentTypes.get(file.type); if(!extension||file.size>10*1024*1024) return {ok:false,message:"File harus PDF/JPG/PNG dengan ukuran maksimal 10 MB."};
  const workflow=await ensureWorkflow(auth.rup); const directory=path.join(process.cwd(),"public","uploads","pengadaan-langsung"); await mkdir(directory,{recursive:true});
  const fileName=`${workflow.paketId}-${randomUUID()}${extension}`; await writeFile(path.join(directory,fileName),Buffer.from(await file.arrayBuffer()));
  await prisma.$transaction([
    prisma.auditChecklist.upsert({where:{paketId_dokumen:{paketId:workflow.paketId,dokumen:jenis}},update:{status:"LENGKAP",catatan:catatan||null,fileUrl:`/uploads/pengadaan-langsung/${fileName}`},create:{paketId:workflow.paketId,dokumen:jenis,status:"LENGKAP",catatan:catatan||null,fileUrl:`/uploads/pengadaan-langsung/${fileName}`}}),
    prisma.auditLog.create({data:{userId:auth.user.id,action:"CREATE",entity:"PENGADAAN_LANGSUNG_DOKUMEN",entityId:workflow.id,after:{jenis,fileUrl:`/uploads/pengadaan-langsung/${fileName}`}}}),
  ]);
  revalidatePath("/pengadaan-langsung"); return {ok:true,message:"Dokumen berhasil diunggah."};
}

export async function removePengadaanLangsungDocument(rupId:string,dokumen:string):Promise<ActionState>{
  const auth=await authorize(rupId);if("error" in auth)return{ok:false,message:auth.error??"Akses ditolak."};const workflow=await prisma.pengadaanLangsungWorkflow.findUnique({where:{rupId}});if(!workflow)return{ok:false,message:"Workflow belum tersedia."};
  await prisma.$transaction([prisma.auditChecklist.delete({where:{paketId_dokumen:{paketId:workflow.paketId,dokumen}}}),prisma.auditLog.create({data:{userId:auth.user.id,action:"DELETE",entity:"PENGADAAN_LANGSUNG_DOKUMEN",entityId:workflow.id,before:{dokumen}}})]);
  revalidatePath("/pengadaan-langsung");return{ok:true,message:"Dokumen dilepas dari paket. Berkas fisik dipertahankan untuk kebutuhan audit."};
}
