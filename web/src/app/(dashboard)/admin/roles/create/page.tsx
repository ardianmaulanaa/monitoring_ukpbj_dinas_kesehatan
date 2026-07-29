import AppHeader from "@/app/(dashboard)/_shared/AppHeader";
import { prisma } from "@/lib/prisma";
import RoleCreateClient from "./role-create-client";

export default async function Page() {
  const users = await prisma.user.findMany({
    include: {
      roles: {
        include: {
          role: true,
        },
      },
    },
    orderBy: [{ status: "asc" }, { name: "asc" }],
    take: 100,
  });

  return (
    <>
      <AppHeader
        title="Buat Role Baru"
        subtitle="Administrasi › Role › Tambah"
        rightLabel="Super Admin"
      />
      <RoleCreateClient
        users={users.map((user) => ({
          id: user.id,
          name: user.name,
          email: user.email,
          jabatan: user.jabatan,
          unitKerja: user.unitKerja,
          status: user.status,
          roles: user.roles.map((userRole) => ({
            id: userRole.role.id,
            code: userRole.role.code,
            name: userRole.role.name,
          })),
        }))}
      />
    </>
  );
}
