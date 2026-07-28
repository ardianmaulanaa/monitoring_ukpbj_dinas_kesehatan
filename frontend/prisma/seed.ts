/* eslint-disable @typescript-eslint/no-require-imports */
const bcrypt = require("bcrypt");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const roles = [
  ["SUPER_ADMIN", "Super Admin"],
  ["LPSE_ADMIN", "Admin LPSE"],
  ["OPERATOR", "Operator"],
  ["LEADER", "Pimpinan"],
  ["PA", "Pengguna Anggaran"],
  ["KPA", "Kuasa Pengguna Anggaran"],
  ["PPK", "PPK"],
  ["PROCUREMENT_OFFICER", "Pejabat Pengadaan"],
  ["SELECTION_WORKGROUP", "Pokja Pemilihan"],
  ["UKPBJ", "UKPBJ"],
  ["AUDITOR", "Auditor"],
  ["VIEWER", "Viewer"],
];

const sumberDana = [
  ["APBD", "APBD"],
  ["BLUD", "BLUD"],
  ["DBHCHT", "DBHCHT"],
];

async function main() {
  for (const [code, name] of roles) {
    await prisma.role.upsert({
      where: { code },
      update: { name },
      create: { code, name },
    });
  }

  for (const [kode, nama] of sumberDana) {
    await prisma.sumberDana.upsert({
      where: { kode },
      update: { nama, aktif: true },
      create: { kode, nama, aktif: true },
    });
  }

  const superAdminRole = await prisma.role.findUniqueOrThrow({
    where: { code: "SUPER_ADMIN" },
  });

  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@health.local";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "admin12345";
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: "Administrator",
      passwordHash,
      jabatan: "Administrator Sistem",
      unitKerja: "UKPBJ Labkes Provinsi Jawa Barat",
      nomorTelepon: "0812-0000-0000",
      nip: "198001012010011001",
      status: "ACTIVE",
    },
    create: {
      name: "Administrator",
      email: adminEmail,
      passwordHash,
      jabatan: "Administrator Sistem",
      unitKerja: "UKPBJ Labkes Provinsi Jawa Barat",
      nomorTelepon: "0812-0000-0000",
      nip: "198001012010011001",
      status: "ACTIVE",
    },
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: admin.id,
        roleId: superAdminRole.id,
      },
    },
    update: {},
    create: {
      userId: admin.id,
      roleId: superAdminRole.id,
    },
  });

  console.info(`Seed selesai. Admin: ${adminEmail}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
