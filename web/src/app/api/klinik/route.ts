import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/response";

const createClinicSchema = z.object({
  unitKerja: z.string().trim().min(1, "Unit kerja wajib diisi."),
  jenis: z.string().trim().min(1, "Jenis konsultasi wajib diisi."),
  pertanyaan: z.string().trim().min(1, "Pertanyaan wajib diisi."),
});

function formatZodError(error: z.ZodError) {
  return error.issues.map((issue) => ({
    field: issue.path.join("."),
    message: issue.message,
  }));
}

export async function GET() {
  const data = await prisma.klinikKonsultasi.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return apiSuccess(data, "Data konsultasi berhasil diambil.");
}

export async function POST(request: Request) {
  const parsed = createClinicSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return apiError(
      "Data konsultasi tidak valid.",
      422,
      formatZodError(parsed.error),
    );
  }

  const konsultasi = await prisma.klinikKonsultasi.create({
    data: parsed.data,
  });

  return apiSuccess(konsultasi, "Konsultasi berhasil disimpan.", { status: 201 });
}
