import { apiSuccess, type ApiMeta } from "@/lib/response";

const emptyMeta: Required<ApiMeta> = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
};

export function emptyListResponse(message = "Data berhasil diambil.") {
  return apiSuccess<[]>([], message, { status: 200 }, emptyMeta);
}

export function emptyObjectResponse<TData extends Record<string, unknown>>(
  data: TData,
  message = "Data berhasil diambil.",
) {
  return apiSuccess(data, message, { status: 200 });
}
