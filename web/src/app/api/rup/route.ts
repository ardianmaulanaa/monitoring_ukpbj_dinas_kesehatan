import { Prisma, type StatusUsulan } from "@prisma/client";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { canDeletePlanningProposal } from "@/lib/permissions";
import { canEditUsulan, canSubmitTransition } from "@/lib/planning-workflow";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/response";
import { getPlanningCompleteness } from "@/lib/workflow-completeness";

const rupStatuses = [
  "DRAFT",
  "DIAJUKAN",
  "VERIFIKASI",
  "REVISI",
  "DISETUJUI",
  "SIAP_RUP",
  "BELUM_INPUT",
  "PROSES_VERIFIKASI",
  "MENUNGGU_PPTK",
  "MENUNGGU_PPK",
  "MENUNGGU_KPA_PA",
  "SUDAH_TAYANG",
  "REVISI_PAGU",
  "DITARIK",
] as const;

const rupQuerySchema = z.object({
  q: z.string().trim().optional(),
  tahunAnggaran: z.coerce.number().int().optional(),
  sumberDana: z.string().trim().optional(),
  unitPengusul: z.string().trim().optional(),
  statusSirup: z.enum(rupStatuses).optional(),
});

const deleteRupSchema = z.object({
  id: z.string().uuid("ID usulan perencanaan tidak valid."),
});

const updateRupSchema = z.object({
  id: z.string().uuid("ID usulan perencanaan tidak valid."),
});

const optionalNumber = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z.coerce.number().optional(),
);

const optionalPositiveNumber = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z.coerce.number().positive("Jumlah harus lebih dari 0.").optional(),
);

const createRupSchema = z
  .object({
  mode: z.enum(["rup", "planning"]).default("rup"),
  submitIntent: z.enum(["draft", "submit", "save"]).default("save"),
  kodeRup: z.string().trim().optional(),
  namaPaket: z.string().trim().optional(),
  jenisBelanja: z.string().trim().optional(),
  unitPengusul: z.string().trim().optional(),
  unitBidang: z.string().trim().optional(),
  ppkPptk: z.string().trim().optional(),
  kontakPenanggungJawab: z.string().trim().optional(),
  program: z.string().trim().optional(),
  kegiatan: z.string().trim().optional(),
  subKegiatan: z.string().trim().optional(),
  kodeRekening: z.string().trim().optional(),
  uraianBelanja: z.string().trim().optional(),
  lokasiPaket: z.string().trim().optional(),
  sumberDana: z.string().trim().optional(),
  pagu: z.coerce.number().min(0, "Pagu tidak boleh negatif.").default(0),
  uraianKebutuhan: z.string().trim().optional(),
  volumeKebutuhan: z.string().trim().optional(),
  jumlahKebutuhan: optionalPositiveNumber,
  satuanKebutuhan: z.string().trim().optional(),
  spesifikasiAwal: z.string().trim().optional(),
  estimasiHargaSatuan: optionalNumber.refine(
    (value) => value === undefined || value >= 0,
    "Estimasi harga satuan tidak boleh negatif.",
  ),
  totalEstimasi: optionalNumber.refine(
    (value) => value === undefined || value >= 0,
    "Total estimasi tidak boleh negatif.",
  ),
  justifikasi: z.string().trim().optional(),
  outputDiharapkan: z.string().trim().optional(),
  prioritas: z.string().trim().optional(),
  waktuKebutuhan: z.string().trim().optional(),
  caraPengadaan: z.string().trim().optional(),
  metodePengadaan: z.enum([
    "TENDER",
    "NON_TENDER",
    "E_PURCHASING",
    "PENGADAAN_LANGSUNG",
    "SWAKELOLA",
  ]),
  jadwalPemilihan: z.string().trim().optional(),
  idRupSirup: z.string().trim().optional(),
  tanggalInputSirup: z.string().trim().optional(),
  tanggalTayangSirup: z.string().trim().optional(),
  linkSirup: z.string().trim().optional(),
  jenisKatalog: z.string().trim().optional(),
  etalaseKatalog: z.string().trim().optional(),
  namaProdukKatalog: z.string().trim().optional(),
  spesifikasiProdukKatalog: z.string().trim().optional(),
  merekTipeKatalog: z.string().trim().optional(),
  jumlahProdukKatalog: z.string().trim().optional(),
  satuanProdukKatalog: z.string().trim().optional(),
  hargaSatuanKatalog: z.coerce.number().min(0).optional(),
  totalHargaKatalog: z.coerce.number().min(0).optional(),
  namaPenyediaKatalog: z.string().trim().optional(),
  statusNegosiasiKatalog: z.string().trim().optional(),
  hargaNegosiasiKatalog: z.coerce.number().min(0).optional(),
  nomorSuratPesanan: z.string().trim().optional(),
  tanggalSuratPesanan: z.string().trim().optional(),
  statusTransaksiKatalog: z.string().trim().optional(),
  catatanKatalog: z.string().trim().optional(),
  jadwalMulaiRencana: z.string().trim().optional(),
  jadwalSelesaiRencana: z.string().trim().optional(),
  tahunAnggaran: z.coerce
    .number()
    .int()
    .min(2000, "Tahun anggaran tidak valid."),
  statusSirup: z.enum(rupStatuses).default("BELUM_INPUT"),
  statusKak: z.string().trim().optional(),
  statusHps: z.string().trim().optional(),
  statusRancanganKontrak: z.string().trim().optional(),
  statusDokumenPendukung: z.string().trim().optional(),
  kekuranganDokumen: z.string().trim().optional(),
  kendala: z.string().trim().optional(),
  tindakLanjut: z.string().trim().optional(),
  picTindakLanjut: z.string().trim().optional(),
  revisionNote: z.string().trim().optional(),
  catatan: z.string().trim().optional(),
  })
  .superRefine((data, context) => {
    const isRup = data.mode === "rup";
    const isPlanningSubmit =
      data.mode === "planning" && data.submitIntent === "submit";

    if (isRup) {
      const requiredFields: Array<[keyof typeof data, string]> = [
        ["kodeRup", "Kode RUP wajib diisi."],
        ["namaPaket", "Nama paket wajib diisi."],
        ["unitPengusul", "Unit pengusul wajib diisi."],
        ["sumberDana", "Sumber dana wajib diisi."],
      ];

      requiredFields.forEach(([field, message]) => {
        const value = data[field];
        if (value === undefined || value === null || String(value).trim() === "") {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: [field],
            message,
          });
        }
      });

      return;
    }

    if (!isPlanningSubmit) return;

    const requiredFields: Array<[keyof typeof data, string]> = [
      ["kodeRup", "Kode usulan wajib diisi."],
      ["namaPaket", "Uraian / nama kebutuhan wajib diisi."],
      ["unitPengusul", "Unit pengusul wajib diisi."],
      ["tahunAnggaran", "Tahun anggaran wajib diisi."],
      ["sumberDana", "Sumber dana wajib diisi."],
      ["satuanKebutuhan", "Satuan wajib dipilih."],
      ["spesifikasiAwal", "Spesifikasi awal wajib diisi."],
      ["prioritas", "Prioritas wajib dipilih."],
      ["justifikasi", "Justifikasi wajib diisi."],
    ];

    requiredFields.forEach(([field, message]) => {
      const value = data[field];
      if (value === undefined || value === null || String(value).trim() === "") {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: [field],
          message,
        });
      }
    });

    if (!data.jumlahKebutuhan || data.jumlahKebutuhan <= 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["jumlahKebutuhan"],
        message: "Jumlah harus lebih dari 0.",
      });
    }
  });

function nullableText(value?: string) {
  return value && value.length > 0 ? value : null;
}

function completionErrors(fields: string[]) {
  return fields.map((field) => ({
    field,
    message: `${field} belum lengkap.`,
  }));
}

function requiredText(value: string | undefined, fallback: string) {
  const text = value?.trim();
  return text && text.length > 0 ? text : fallback;
}

function rupMutationData(parsedData: z.infer<typeof createRupSchema>) {
  const {
    mode,
    submitIntent,
    pagu,
    kodeRup,
    unitBidang,
    ppkPptk,
    kontakPenanggungJawab,
    program,
    kegiatan,
    subKegiatan,
    kodeRekening,
    uraianBelanja,
    lokasiPaket,
    uraianKebutuhan,
    volumeKebutuhan,
    jumlahKebutuhan,
    satuanKebutuhan,
    spesifikasiAwal,
    estimasiHargaSatuan,
    totalEstimasi,
    justifikasi,
    outputDiharapkan,
    prioritas,
    waktuKebutuhan,
    caraPengadaan,
    jadwalPemilihan,
    idRupSirup,
    tanggalInputSirup,
    tanggalTayangSirup,
    linkSirup,
    jenisKatalog,
    etalaseKatalog,
    namaProdukKatalog,
    spesifikasiProdukKatalog,
    merekTipeKatalog,
    jumlahProdukKatalog,
    satuanProdukKatalog,
    hargaSatuanKatalog,
    totalHargaKatalog,
    namaPenyediaKatalog,
    statusNegosiasiKatalog,
    hargaNegosiasiKatalog,
    nomorSuratPesanan,
    tanggalSuratPesanan,
    statusTransaksiKatalog,
    catatanKatalog,
    jadwalMulaiRencana,
    jadwalSelesaiRencana,
    statusKak,
    statusHps,
    statusRancanganKontrak,
    statusDokumenPendukung,
    kekuranganDokumen,
    kendala,
    tindakLanjut,
    picTindakLanjut,
    revisionNote,
    catatan,
    ...data
  } = parsedData;
  const normalizedJumlah = jumlahKebutuhan ?? null;
  const normalizedHargaSatuan = estimasiHargaSatuan ?? null;
  const calculatedTotal =
    normalizedJumlah !== null && normalizedHargaSatuan !== null
      ? normalizedJumlah * normalizedHargaSatuan
      : (totalEstimasi ?? pagu);
  const isPlanningDraft = mode === "planning" && submitIntent === "draft";

  return {
    ...data,
    kodeRup: kodeRup || "",
    namaPaket: requiredText(
      data.namaPaket,
      isPlanningDraft ? "Draft usulan perencanaan" : "Paket belum diberi nama",
    ),
    unitPengusul: requiredText(
      data.unitPengusul,
      isPlanningDraft ? "Unit belum diisi" : "Unit pengusul belum diisi",
    ),
    sumberDana: requiredText(
      data.sumberDana,
      isPlanningDraft ? "Belum ditentukan" : "Sumber dana belum diisi",
    ),
    statusSirup: data.statusSirup,
    statusUsulan:
      mode === "planning" && submitIntent === "submit"
        ? ("DIAJUKAN" as StatusUsulan)
        : mode === "planning"
          ? ("DRAFT" as StatusUsulan)
          : undefined,
    pagu: new Prisma.Decimal(pagu),
    unitBidang: nullableText(unitBidang),
    ppkPptk: nullableText(ppkPptk),
    kontakPenanggungJawab: nullableText(kontakPenanggungJawab),
    program: nullableText(program),
    kegiatan: nullableText(kegiatan),
    subKegiatan: nullableText(subKegiatan),
    kodeRekening: nullableText(kodeRekening),
    uraianBelanja: nullableText(uraianBelanja),
    lokasiPaket: nullableText(lokasiPaket),
    uraianKebutuhan: nullableText(uraianKebutuhan),
    volumeKebutuhan:
      nullableText(volumeKebutuhan) ??
      (normalizedJumlah === null ? null : String(normalizedJumlah)),
    jumlahKebutuhan:
      normalizedJumlah === null ? null : new Prisma.Decimal(normalizedJumlah),
    satuanKebutuhan: nullableText(satuanKebutuhan),
    spesifikasiAwal: nullableText(spesifikasiAwal),
    estimasiHargaSatuan:
      normalizedHargaSatuan === null
        ? null
        : new Prisma.Decimal(normalizedHargaSatuan),
    totalEstimasi: new Prisma.Decimal(calculatedTotal),
    justifikasi: nullableText(justifikasi),
    outputDiharapkan: nullableText(outputDiharapkan),
    prioritas: nullableText(prioritas),
    waktuKebutuhan: nullableText(waktuKebutuhan),
    caraPengadaan: nullableText(caraPengadaan),
    jadwalPemilihan: nullableText(jadwalPemilihan),
    idRupSirup: nullableText(idRupSirup),
    tanggalInputSirup: nullableText(tanggalInputSirup),
    tanggalTayangSirup: nullableText(tanggalTayangSirup),
    linkSirup: nullableText(linkSirup),
    jenisKatalog: nullableText(jenisKatalog),
    etalaseKatalog: nullableText(etalaseKatalog),
    namaProdukKatalog: nullableText(namaProdukKatalog),
    spesifikasiProdukKatalog: nullableText(spesifikasiProdukKatalog),
    merekTipeKatalog: nullableText(merekTipeKatalog),
    jumlahProdukKatalog: nullableText(jumlahProdukKatalog),
    satuanProdukKatalog: nullableText(satuanProdukKatalog),
    hargaSatuanKatalog:
      hargaSatuanKatalog === undefined
        ? null
        : new Prisma.Decimal(hargaSatuanKatalog),
    totalHargaKatalog:
      totalHargaKatalog === undefined
        ? null
        : new Prisma.Decimal(totalHargaKatalog),
    namaPenyediaKatalog: nullableText(namaPenyediaKatalog),
    statusNegosiasiKatalog: nullableText(statusNegosiasiKatalog),
    hargaNegosiasiKatalog:
      hargaNegosiasiKatalog === undefined
        ? null
        : new Prisma.Decimal(hargaNegosiasiKatalog),
    nomorSuratPesanan: nullableText(nomorSuratPesanan),
    tanggalSuratPesanan: nullableText(tanggalSuratPesanan),
    statusTransaksiKatalog: nullableText(statusTransaksiKatalog),
    catatanKatalog: nullableText(catatanKatalog),
    jadwalMulaiRencana: nullableText(jadwalMulaiRencana),
    jadwalSelesaiRencana: nullableText(jadwalSelesaiRencana),
    statusKak: nullableText(statusKak),
    statusHps: nullableText(statusHps),
    statusRancanganKontrak: nullableText(statusRancanganKontrak),
    statusDokumenPendukung: nullableText(statusDokumenPendukung),
    kekuranganDokumen: nullableText(kekuranganDokumen),
    kendala: nullableText(kendala),
    tindakLanjut: nullableText(tindakLanjut),
    picTindakLanjut: nullableText(picTindakLanjut),
    revisionNote: nullableText(revisionNote),
    catatan: nullableText(catatan),
  };
}

function duplicateCodeErrorMessage(mode?: string) {
  return mode === "planning"
    ? "Kode Usulan sudah digunakan. Gunakan kode lain."
    : "Kode RUP sudah digunakan. Gunakan kode lain.";
}

function duplicateCodeFieldMessage(mode?: string) {
  return mode === "planning"
    ? "Kode Usulan sudah digunakan. Gunakan kode lain."
    : "Kode RUP harus unik.";
}

async function appendUsulanHistory({
  action,
  actorId,
  actorName,
  newStatus,
  note,
  oldStatus,
  proposalId,
}: {
  action: string;
  actorId?: string | null;
  actorName: string;
  newStatus?: StatusUsulan | null;
  note?: string | null;
  oldStatus?: StatusUsulan | null;
  proposalId: string;
}) {
  await prisma.usulanVerificationHistory.create({
    data: {
      action,
      actorId: actorId ?? null,
      actorName,
      newStatus: newStatus ?? null,
      note: note ?? null,
      oldStatus: oldStatus ?? null,
      proposalId,
    },
  });
}

async function generateKodeUsulan(tahunAnggaran: number) {
  const prefix = `USUL-${tahunAnggaran}-`;
  const latest = await prisma.rencanaUmumPengadaan.findFirst({
    where: { kodeRup: { startsWith: prefix } },
    orderBy: { kodeRup: "desc" },
    select: { kodeRup: true },
  });
  const latestNumber = latest?.kodeRup
    ? Number(latest.kodeRup.slice(prefix.length))
    : 0;
  const nextNumber = Number.isFinite(latestNumber) ? latestNumber + 1 : 1;

  return `${prefix}${String(nextNumber).padStart(3, "0")}`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = rupQuerySchema.safeParse({
    q: searchParams.get("q") ?? undefined,
    tahunAnggaran: searchParams.get("tahunAnggaran") ?? undefined,
    sumberDana: searchParams.get("sumberDana") ?? undefined,
    unitPengusul: searchParams.get("unitPengusul") ?? undefined,
    statusSirup: searchParams.get("statusSirup") ?? undefined,
  });

  if (!parsed.success) {
    return apiError("Filter RUP tidak valid.", 422);
  }

  const { q, tahunAnggaran, sumberDana, unitPengusul, statusSirup } =
    parsed.data;
  const where: Prisma.RencanaUmumPengadaanWhereInput = {
    ...(tahunAnggaran ? { tahunAnggaran } : {}),
    ...(sumberDana ? { sumberDana } : {}),
    ...(unitPengusul ? { unitPengusul } : {}),
    ...(statusSirup ? { statusSirup } : {}),
    ...(q
      ? {
          OR: [
            { kodeRup: { contains: q } },
            { idRupSirup: { contains: q } },
            { namaPaket: { contains: q } },
            { unitPengusul: { contains: q } },
            { lokasiPaket: { contains: q } },
          ],
        }
      : {}),
  };

  const data = await prisma.rencanaUmumPengadaan.findMany({
    where,
    orderBy: [{ tahunAnggaran: "desc" }, { createdAt: "desc" }],
    take: 100,
  });

  return apiSuccess(data, "Data RUP berhasil diambil.");
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  const json = await request.json().catch(() => null);
  const parsed = createRupSchema.safeParse(json);

  if (!parsed.success) {
    const isPlanning = json && typeof json === "object" && json.mode === "planning";
    return apiError(
      isPlanning ? "Data usulan perencanaan tidak valid." : "Data RUP tidak valid.",
      422,
      parsed.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    );
  }

  try {
    const planningPayload = parsed.data;
    const kodeRup =
      planningPayload.kodeRup ||
      (planningPayload.mode === "planning"
        ? await generateKodeUsulan(planningPayload.tahunAnggaran)
        : "");

    if (!kodeRup) {
      return apiError(
        planningPayload.mode === "planning"
          ? "Kode Usulan wajib diisi."
          : "Kode RUP wajib diisi.",
        422,
        [
          {
            field: "kodeRup",
            message:
              planningPayload.mode === "planning"
                ? "Kode Usulan wajib diisi."
                : "Kode RUP wajib diisi.",
          },
        ],
      );
    }

    if (planningPayload.mode === "planning" && planningPayload.submitIntent === "submit") {
      const completeness = getPlanningCompleteness({
        ...planningPayload,
        pagu: planningPayload.pagu,
      });

      if (!completeness.complete) {
        return apiError(
          "Usulan belum lengkap dan belum dapat diajukan.",
          400,
          completionErrors(completeness.missingFields),
        );
      }
    }

    const rup = await prisma.rencanaUmumPengadaan.create({
      data: {
        ...rupMutationData({ ...planningPayload, kodeRup }),
        ...(planningPayload.mode === "planning" && planningPayload.submitIntent === "submit"
          ? {
              catatan: nullableText(planningPayload.catatan),
              submittedAt: new Date(),
              submittedBy: user?.name ?? null,
            }
          : {}),
      },
    });

    if (planningPayload.mode === "planning") {
      await appendUsulanHistory({
        action:
          planningPayload.submitIntent === "submit"
            ? "SUBMIT_USULAN"
            : "CREATE_USULAN",
        actorId: user?.id,
        actorName: user?.name ?? "Sistem",
        newStatus: rup.statusUsulan,
        note: planningPayload.catatan,
        proposalId: rup.id,
      });
    }

    return apiSuccess(
      rup,
      planningPayload.mode === "planning" && planningPayload.submitIntent === "submit"
        ? "Usulan berhasil diajukan."
        : planningPayload.mode === "planning"
          ? "Usulan berhasil disimpan sebagai draft."
          : "Data RUP berhasil disimpan.",
      { status: 201 },
    );
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const mode = json && typeof json === "object" ? String(json.mode ?? "") : "";
      return apiError(duplicateCodeErrorMessage(mode), 409, [
        { field: "kodeRup", message: duplicateCodeFieldMessage(mode) },
      ]);
    }

    return apiError("Data RUP gagal disimpan.", 500);
  }
}

export async function PUT(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return apiError("Sesi login tidak ditemukan.", 401);
  }

  const { searchParams } = new URL(request.url);
  const idParsed = updateRupSchema.safeParse({
    id: searchParams.get("id") ?? undefined,
  });

  if (!idParsed.success) {
    return apiError("ID usulan perencanaan tidak valid.", 422);
  }

  const json = await request.json().catch(() => null);
  const parsed = createRupSchema.safeParse(json);

  if (!parsed.success) {
    const isPlanning = json && typeof json === "object" && json.mode === "planning";
    return apiError(
      isPlanning ? "Data usulan perencanaan tidak valid." : "Data RUP tidak valid.",
      422,
      parsed.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    );
  }

  try {
    const planningPayload = parsed.data;
    const existing = await prisma.rencanaUmumPengadaan.findUnique({
      where: { id: idParsed.data.id },
      select: { statusUsulan: true },
    });

    if (!existing) {
      return apiError("Usulan perencanaan tidak ditemukan.", 404);
    }

    const targetStatus: StatusUsulan =
      planningPayload.mode === "planning" && planningPayload.submitIntent === "draft"
        ? "DRAFT"
        : planningPayload.mode === "planning" && planningPayload.submitIntent === "submit"
          ? "DIAJUKAN"
          : existing.statusUsulan;

    const canEditWorkflow =
      planningPayload.mode === "planning" &&
      canEditUsulan(user.roles, existing.statusUsulan) &&
      (targetStatus === existing.statusUsulan ||
        targetStatus === "DRAFT" ||
        canSubmitTransition(existing.statusUsulan, targetStatus));

    if (!canDeletePlanningProposal(user.roles) && !canEditWorkflow) {
      return apiError(
        "Usulan hanya dapat diedit saat Draft/Revisi oleh role yang berwenang.",
        403,
      );
    }

    const kodeRup =
      planningPayload.kodeRup ||
      (planningPayload.mode === "planning"
        ? await generateKodeUsulan(planningPayload.tahunAnggaran)
        : "");

    if (!kodeRup) {
      return apiError(
        planningPayload.mode === "planning"
          ? "Kode Usulan wajib diisi."
          : "Kode RUP wajib diisi.",
        422,
        [
          {
            field: "kodeRup",
            message:
              planningPayload.mode === "planning"
                ? "Kode Usulan wajib diisi."
                : "Kode RUP wajib diisi.",
          },
        ],
      );
    }

    if (planningPayload.mode === "planning" && planningPayload.submitIntent === "submit") {
      const completeness = getPlanningCompleteness({
        ...planningPayload,
        pagu: planningPayload.pagu,
      });

      if (!completeness.complete) {
        return apiError(
          "Usulan belum lengkap dan belum dapat diajukan.",
          400,
          completionErrors(completeness.missingFields),
        );
      }
    }

    const rup = await prisma.rencanaUmumPengadaan.update({
      where: { id: idParsed.data.id },
      data: {
        ...rupMutationData({ ...planningPayload, kodeRup }),
        ...(planningPayload.mode === "planning"
          ? {
              statusUsulan: targetStatus,
            }
          : {}),
        ...(planningPayload.mode === "planning" && planningPayload.submitIntent === "submit"
          ? {
              submittedAt: new Date(),
              submittedBy: user.name,
            }
          : {}),
      },
    });

    if (planningPayload.mode === "planning") {
      await appendUsulanHistory({
        action:
          planningPayload.submitIntent === "submit"
          ? existing.statusUsulan === "PERLU_REVISI"
              ? "RESUBMIT_USULAN"
              : "SUBMIT_USULAN"
            : "UPDATE_USULAN",
        actorId: user.id,
        actorName: user.name,
        newStatus: rup.statusUsulan,
        note: planningPayload.catatan,
        oldStatus: existing.statusUsulan,
        proposalId: rup.id,
      });
    }

    return apiSuccess(
      rup,
      planningPayload.mode === "planning" && planningPayload.submitIntent === "submit"
        ? "Usulan berhasil diajukan."
        : planningPayload.mode === "planning"
          ? "Usulan berhasil disimpan sebagai draft."
          : "Data RUP berhasil diubah.",
    );
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const mode = json && typeof json === "object" ? String(json.mode ?? "") : "";
      return apiError(duplicateCodeErrorMessage(mode), 409, [
        { field: "kodeRup", message: duplicateCodeFieldMessage(mode) },
      ]);
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return apiError("Usulan perencanaan tidak ditemukan.", 404);
    }

    return apiError("Data RUP gagal diubah.", 500);
  }
}

export async function DELETE(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return apiError("Sesi login tidak ditemukan.", 401);
  }

  if (!canDeletePlanningProposal(user.roles)) {
    return apiError("Hanya superadmin yang boleh menghapus usulan perencanaan.", 403);
  }

  const { searchParams } = new URL(request.url);
  const parsed = deleteRupSchema.safeParse({
    id: searchParams.get("id") ?? undefined,
  });

  if (!parsed.success) {
    return apiError("ID usulan perencanaan tidak valid.", 422);
  }

  try {
    const deleted = await prisma.rencanaUmumPengadaan.delete({
      where: { id: parsed.data.id },
      select: { id: true, kodeRup: true, namaPaket: true },
    });

    return apiSuccess(deleted, "Usulan perencanaan berhasil dihapus.");
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return apiError("Usulan perencanaan tidak ditemukan.", 404);
    }

    return apiError("Usulan perencanaan gagal dihapus.", 500);
  }
}
