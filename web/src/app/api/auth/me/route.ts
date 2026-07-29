import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/response";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return apiError("Belum login.", 401);
  }

  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    include: {
      roles: {
        include: {
          role: true,
        },
      },
    },
  });

  if (!profile) {
    return apiError("Data pengguna tidak ditemukan.", 404);
  }

  return apiSuccess(
    {
      user: {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        nip: profile.nip,
        jabatan: profile.jabatan,
        unitKerja: profile.unitKerja,
        nomorTelepon: profile.nomorTelepon,
        avatarUrl: profile.avatarUrl,
        status: profile.status,
        lastLoginAt: profile.lastLoginAt,
        roles: profile.roles.map((userRole) => userRole.role.code),
      },
    },
    "Data pengguna aktif berhasil diambil.",
  );
}
