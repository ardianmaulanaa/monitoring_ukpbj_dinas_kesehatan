import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/response";

const createDocumentSchema = z.object({
  nama: z.string().trim().min(1, "Nama dokumen wajib diisi."),
  jenis: z.enum(["DOKUMEN", "TEMPLATE"]).default("DOKUMEN"),
  kategori: z.string().trim().optional(),
  fileUrl: z.string().trim().optional(),
  status: z.enum(["DRAFT", "AKTIF", "NONAKTIF"]).default("AKTIF"),
  catatan: z.string().trim().optional(),
});

function formatZodError(error: z.ZodError) {
  return error.issues.map((issue) => ({
    field: issue.path.join("."),
    message: issue.message,
  }));
}

export async function GET() {
  const data = await prisma.dokumenTemplate.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return apiSuccess(data, "Data dokumen berhasil diambil.");
}

export async function POST(request: Request) {
  const parsed = createDocumentSchema.safeParse(
    await request.json().catch(() => null),
  );

  if (!parsed.success) {
    return apiError(
      "Data dokumen tidak valid.",
      422,
      formatZodError(parsed.error),
    );
  }

  const { kategori, fileUrl, catatan, ...data } = parsed.data;

  const document = await prisma.dokumenTemplate.create({
    data: {
      ...data,
      kategori: kategori || undefined,
      fileUrl: fileUrl || undefined,
      catatan: catatan || undefined,
    },
  });

  return apiSuccess(document, "Data dokumen berhasil disimpan.", { status: 201 });
}
