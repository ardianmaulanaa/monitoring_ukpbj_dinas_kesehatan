import { NextResponse, type NextRequest } from "next/server";
import { canAccessPath } from "@/lib/access-control";

const sessionCookieName = "dinkes_pbj_session";

const protectedPrefixes = [
  "/dashboard",
  "/notifications",
  "/data-barang",
  "/paket",
  "/pengadaan",
  "/kontrak",
  "/progres",
  "/realisasi",
  "/serah-terima",
  "/penyedia",
  "/warning",
  "/laporan",
  "/master",
  "/admin",
  "/profile",
];

const removedRoutePrefixes = [
  "/admin/users",
  "/admin/roles",
  "/admin/audit-log",
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
    "/notifications/:path*",
    "/data-barang/:path*",
    "/paket/:path*",
    "/pengadaan/:path*",
    "/kontrak/:path*",
    "/progres/:path*",
    "/realisasi/:path*",
    "/serah-terima/:path*",
    "/penyedia/:path*",
    "/warning/:path*",
    "/laporan/:path*",
    "/master/:path*",
    "/admin/:path*",
    "/profile/:path*",
  ],
};
