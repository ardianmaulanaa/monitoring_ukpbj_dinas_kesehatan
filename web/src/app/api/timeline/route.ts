import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/response";

const createTimelineSchema = z.object({
  paketId: z.string().trim().optional(),
  kontrakId: z.string().trim().optional(),
  judul: z.string().trim().min(1, "Judul timeline wajib diisi."),
  tahap: z.string().trim().min(1, "Tahap wajib diisi."),
  unitKerja: z.string().trim().optional(),
  tanggalMulai: z.string().trim().optional(),
  tanggalSelesai: z.string().trim().optional(),
  status: z.enum(["RENCANA", "BERJALAN", "SELESAI", "TERLAMBAT"]).default("RENCANA"),
  catatan: z.string().trim().optional(),
});

function toDate(value?: string) {
  if (!value) return undefined;
  return new Date(`${value}T00:00:00`);
}

function formatZodError(error: z.ZodError) {
  return error.issues.map((issue) => ({
    field: issue.path.join("."),
    message: issue.message,
  }));
}

export async function GET() {
  const data = await prisma.timelineEvent.findMany({
    include: {
      paket: { select: { namaPaket: true, unitPemohon: true } },
      kontrak: { select: { nomorKontrak: true, penyedia: true } },
    },
    orderBy: [{ tanggalMulai: "asc" }, { createdAt: "desc" }],
    take: 100,
  });

  return apiSuccess(data, "Data timeline berhasil diambil.");
}

export async function POST(request: Request) {
  const parsed = createTimelineSchema.safeParse(
    await request.json().catch(() => null),
  );

  if (!parsed.success) {
    return apiError(
      "Data timeline tidak valid.",
      422,
      formatZodError(parsed.error),
    );
  }

  const {
    paketId,
    kontrakId,
    unitKerja,
    tanggalMulai,
    tanggalSelesai,
    catatan,
    ...data
  } = parsed.data;

  const event = await prisma.timelineEvent.create({
    data: {
      ...data,
      paketId: paketId || undefined,
      kontrakId: kontrakId || undefined,
      unitKerja: unitKerja || undefined,
      tanggalMulai: toDate(tanggalMulai),
      tanggalSelesai: toDate(tanggalSelesai),
      catatan: catatan || undefined,
    },
  });

  return apiSuccess(event, "Data timeline berhasil disimpan.", { status: 201 });
}
