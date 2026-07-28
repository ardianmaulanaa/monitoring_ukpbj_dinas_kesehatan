import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/response";

const createSumberDanaSchema = z.object({
  kode: z.string().trim().min(1, "Kode sumber dana wajib diisi."),
  nama: z.string().trim().min(1, "Nama sumber dana wajib diisi."),
  aktif: z.boolean().optional().default(true),
});

export async function GET() {
  const data = await prisma.sumberDana.findMany({
    orderBy: [{ aktif: "desc" }, { nama: "asc" }],
  });

  return apiSuccess(data, "Data sumber dana berhasil diambil.");
}

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = createSumberDanaSchema.safeParse(json);

  if (!parsed.success) {
    return apiError(
      "Data sumber dana tidak valid.",
      422,
      parsed.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    );
  }

  try {
    const data = await prisma.sumberDana.create({
      data: parsed.data,
    });

    return apiSuccess(data, "Data sumber dana berhasil disimpan.", {
      status: 201,
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return apiError("Kode sumber dana sudah digunakan.", 409, [
        { field: "kode", message: "Kode sumber dana harus unik." },
      ]);
    }

    return apiError("Data sumber dana gagal disimpan.", 500);
  }
}
