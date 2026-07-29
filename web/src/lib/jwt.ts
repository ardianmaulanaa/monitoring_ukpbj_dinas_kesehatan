import jwt from "jsonwebtoken";
import type { RoleCode } from "@prisma/client";

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;

export type SessionPayload = {
  sub: string;
  email: string;
  name: string;
  roles: RoleCode[];
};

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET belum diatur.");
  }

  return secret;
}

export function signSessionToken(payload: SessionPayload) {
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: SESSION_MAX_AGE_SECONDS,
  });
}

export function verifySessionToken(token: string) {
  return jwt.verify(token, getJwtSecret()) as SessionPayload & {
    iat: number;
    exp: number;
  };
}

export const sessionCookieName = "dinkes_pbj_session";
export const sessionMaxAgeSeconds = SESSION_MAX_AGE_SECONDS;
