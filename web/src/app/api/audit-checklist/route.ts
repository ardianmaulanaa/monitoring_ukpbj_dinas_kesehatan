import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/response";

const createAuditChecklistSchema = z.object({
  paketId: z.string().trim().optional(),
  dokumen: z.string().trim().min(1, "Nama dokumen wajib diisi."),
  status: z.enum(["BELUM_ADA", "PROSES", "LENGKAP"]).default("BELUM_ADA"),
  catatan: z.string().trim().optional(),
});

function formatZodError(error: z.ZodError) {
  return error.issues.map((issue) => ({
    field: issue.path.join("."),
    message: issue.message,
  }));
}

export async function GET() {
  const data = await prisma.auditChecklist.findMany({
    include: { paket: { select: { namaPaket: true, unitPemohon: true } } },
    orderBy: { updatedAt: "desc" },
    take: 200,
  });

  return apiSuccess(data, "Data audit checklist berhasil diambil.");
}

export async function POST(request: Request) {
  const parsed = createAuditChecklistSchema.safeParse(
    await request.json().catch(() => null),
  );

  if (!parsed.success) {
    return apiError(
      "Data audit checklist tidak valid.",
      422,
      formatZodError(parsed.error),
    );
  }

  const { paketId, catatan, ...data } = parsed.data;

  try {
    const checklist = await prisma.auditChecklist.create({
      data: {
        ...data,
        paketId: paketId || undefined,
        catatan: catatan || undefined,
      },
    });

    return apiSuccess(checklist, "Audit checklist berhasil disimpan.", {
      status: 201,
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return apiError("Dokumen untuk paket ini sudah ada.", 409);
    }

    return apiError("Audit checklist gagal disimpan.", 500);
  }
}
