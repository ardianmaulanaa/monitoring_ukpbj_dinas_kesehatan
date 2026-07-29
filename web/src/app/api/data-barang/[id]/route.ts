import { z } from "zod";
import { apiError } from "@/lib/response";

const paramsSchema = z.object({
  id: z.string().uuid("ID barang tidak valid."),
});

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const params = paramsSchema.safeParse(await context.params);

  if (!params.success) {
    return apiError("ID barang tidak valid.", 422);
  }

  return apiError("Data barang tidak ditemukan.", 404);
}

export async function PATCH(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const params = paramsSchema.safeParse(await context.params);

  if (!params.success) {
    return apiError("ID barang tidak valid.", 422);
  }

  return apiError(
    "Pembaruan data barang menunggu implementasi model database pada Tahap 2.",
    409,
  );
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const params = paramsSchema.safeParse(await context.params);

  if (!params.success) {
    return apiError("ID barang tidak valid.", 422);
  }

  return apiError(
    "Penonaktifan data barang menunggu implementasi model database pada Tahap 2.",
    409,
  );
}
