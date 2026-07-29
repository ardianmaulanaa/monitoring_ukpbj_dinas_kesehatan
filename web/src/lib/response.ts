import { NextResponse } from "next/server";

export type ApiMeta = {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
};

export type ApiErrorDetail = {
  field?: string;
  message: string;
};

export function apiSuccess<TData>(
  data: TData,
  message = "Data berhasil diproses.",
  init?: ResponseInit,
  meta?: ApiMeta,
) {
  return NextResponse.json(
    {
      success: true,
      message,
      data,
      ...(meta ? { meta } : {}),
    },
    init,
  );
}

export function apiError(
  message: string,
  status = 400,
  errors: ApiErrorDetail[] = [],
) {
  return NextResponse.json(
    {
      success: false,
      message,
      errors,
    },
    { status },
  );
}
