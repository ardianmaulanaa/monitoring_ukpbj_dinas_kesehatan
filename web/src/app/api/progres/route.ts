import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/response";

const createProgresSchema = z.object({
  paketId: z.string().trim().optional(),
  tahap: z.string().trim().min(1, "Tahap wajib diisi."),
  persentase: z.coerce.number().int().min(0).max(100).default(0),
  status: z.enum(["RENCANA", "BERJALAN", "SELESAI", "TERLAMBAT"]).default("BERJALAN"),
  tanggal: z.string().trim().optional(),
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
  const data = await prisma.progresPaket.findMany({
    include: { paket: { select: { namaPaket: true, unitPemohon: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return apiSuccess(data, "Data progres berhasil diambil.");
}

export async function POST(request: Request) {
  const parsed = createProgresSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return apiError(
      "Data progres tidak valid.",
      422,
      formatZodError(parsed.error),
    );
  }

  const { paketId, tanggal, catatan, ...data } = parsed.data;

  const progres = await prisma.progresPaket.create({
    data: {
      ...data,
      paketId: paketId || undefined,
      tanggal: toDate(tanggal),
      catatan: catatan || undefined,
    },
  });

  return apiSuccess(progres, "Data progres berhasil disimpan.", { status: 201 });
}
