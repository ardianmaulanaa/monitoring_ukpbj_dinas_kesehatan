import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/response";

const createRiskSchema = z.object({
  paketId: z.string().trim().optional(),
  risiko: z.string().trim().min(1, "Uraian risiko wajib diisi."),
  level: z.enum(["RENDAH", "SEDANG", "TINGGI"]).default("SEDANG"),
  mitigasi: z.string().trim().min(1, "Mitigasi wajib diisi."),
  pic: z.string().trim().min(1, "PIC wajib diisi."),
  deadline: z.string().trim().optional(),
  status: z
    .enum(["PERLU_TINDAK_LANJUT", "PROSES", "SELESAI"])
    .default("PERLU_TINDAK_LANJUT"),
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
  const data = await prisma.risikoMitigasi.findMany({
    include: {
      paket: {
        select: {
          id: true,
          kodePaket: true,
          namaPaket: true,
          unitPemohon: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return apiSuccess(data, "Data risiko berhasil diambil.");
}

export async function POST(request: Request) {
  const parsed = createRiskSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return apiError(
      "Data risiko tidak valid.",
      422,
      formatZodError(parsed.error),
    );
  }

  const { paketId, deadline, catatan, ...data } = parsed.data;

  const risk = await prisma.risikoMitigasi.create({
    data: {
      ...data,
      paketId: paketId || undefined,
      deadline: toDate(deadline),
      catatan: catatan || undefined,
    },
  });

  return apiSuccess(risk, "Data risiko berhasil disimpan.", { status: 201 });
}
