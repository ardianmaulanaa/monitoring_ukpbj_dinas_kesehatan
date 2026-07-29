import { cookies } from "next/headers";
import type { RoleCode } from "@prisma/client";
import { sessionCookieName, verifySessionToken } from "@/lib/jwt";

export type CurrentUser = {
  id: string;
  email: string;
  name: string;
  roles: RoleCode[];
};

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookieName)?.value;

  if (!token) {
    return null;
  }

  try {
    const payload = verifySessionToken(token);

    return {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      roles: payload.roles,
    };
  } catch {
    return null;
  }
}

export async function requireCurrentUser() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("UNAUTHORIZED");
  }

  return user;
}
