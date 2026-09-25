import { NextResponse, type NextRequest } from "next/server";
import { canAccessPath } from "@/lib/access-control";

const sessionCookieName = "dinkes_pbj_session";

const protectedPrefixes = [
  "/dashboard",
  "/audit-readiness",
  "/data-barang",
  "/dokumen-template",
  "/katalog-v6-v5",
  "/klinik-ukpbj",
  "/kontrak-sp",
  "/laporan",
  "/master-data",
  "/notifications",
  "/paket-pengadaan",
  "/perencanaan",
  "/pengaturan",
  "/vendor-pasar",
  "/profile",
  "/progres-fisik",
  "/realisasi-belanja",
  "/sirup-rup",
  "/serah-terima",
  "/tender-non-tender",
  "/timeline",
  "/risiko-mitigasi",
  "/admin",
];

const removedRoutePrefixes = [
  "/admin/users",
  "/admin/roles",
  "/admin/audit-log",
  "/vendor-pasar",
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/login") {
    const response = NextResponse.next();
    response.cookies.delete(sessionCookieName);
    return response;
  }

  const isProtectedRoute = protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  const isRemovedRoute = removedRoutePrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (isRemovedRoute) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = "/dashboard";
    dashboardUrl.search = "";
    return NextResponse.redirect(dashboardUrl);
  }

  const hasSession = Boolean(request.cookies.get(sessionCookieName)?.value);

  if (!hasSession) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const sessionToken = request.cookies.get(sessionCookieName)?.value;
  const roles = sessionToken ? readRolesFromJwtPayload(sessionToken) : [];

  if (!canAccessPath(pathname, roles)) {
    const unauthorizedUrl = request.nextUrl.clone();
    unauthorizedUrl.pathname = "/unauthorized";
    unauthorizedUrl.search = "";
    return NextResponse.redirect(unauthorizedUrl);
  }

  return NextResponse.next();
}

function readRolesFromJwtPayload(token: string) {
  try {
    const payload = token.split(".")[1];

    if (!payload) {
      return [];
    }

    const normalizedPayload = payload.replaceAll("-", "+").replaceAll("_", "/");
    const paddedPayload = normalizedPayload.padEnd(
      Math.ceil(normalizedPayload.length / 4) * 4,
      "=",
    );
    const decoded = JSON.parse(atob(paddedPayload)) as { roles?: string[] };

    return Array.isArray(decoded.roles) ? decoded.roles : [];
  } catch {
    return [];
  }
}

export const config = {
  matcher: [
    "/login",
    "/dashboard/:path*",
    "/audit-readiness/:path*",
    "/data-barang/:path*",
    "/dokumen-template/:path*",
    "/katalog-v6-v5/:path*",
    "/klinik-ukpbj/:path*",
    "/kontrak-sp/:path*",
    "/laporan/:path*",
    "/master-data/:path*",
    "/notifications/:path*",
    "/paket-pengadaan/:path*",
    "/perencanaan/:path*",
    "/pengaturan/:path*",
    "/vendor-pasar/:path*",
    "/profile/:path*",
    "/progres-fisik/:path*",
    "/realisasi-belanja/:path*",
    "/sirup-rup/:path*",
    "/serah-terima/:path*",
    "/tender-non-tender/:path*",
    "/timeline/:path*",
    "/risiko-mitigasi/:path*",
    "/admin/:path*",
  ],
};
