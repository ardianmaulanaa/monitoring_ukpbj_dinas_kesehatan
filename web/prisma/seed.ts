/* eslint-disable @typescript-eslint/no-require-imports */
const bcrypt = require("bcrypt");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const roles = [
  ["SUPER_ADMIN", "Super Admin"],
  ["LPSE_ADMIN", "Admin LPSE"],
  ["OPERATOR", "Operator"],
  ["LEADER", "Pimpinan"],
  ["PPTK", "PPTK"],
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

const demoPassword = process.env.SEED_DEMO_PASSWORD ?? "demo12345";

const demoUsers = [
  {
    roleCode: "SUPER_ADMIN",
    email: "superadmin@health.local",
    name: "Super Admin Demo",
    jabatan: "Administrator Sistem",
    unitKerja: "UKPBJ Labkes Provinsi Jawa Barat",
    nip: "198001012010011001",
  },
  {
    roleCode: "LPSE_ADMIN",
    email: "lpseadmin@health.local",
    name: "Admin LPSE Demo",
    jabatan: "Admin SIRUP/SPSE",
    unitKerja: "UKPBJ Labkes Provinsi Jawa Barat",
    nip: "198001012010011002",
  },
  {
    roleCode: "OPERATOR",
    email: "operator@health.local",
    name: "Operator Demo",
    jabatan: "Operator Unit",
    unitKerja: "Seksi Mikrobiologi",
    nip: "198001012010011003",
  },
  {
    roleCode: "LEADER",
    email: "kepalaunit@health.local",
    name: "Kepala Unit Demo",
    jabatan: "Kepala Unit",
    unitKerja: "Seksi Mikrobiologi",
    nip: "198001012010011004",
  },
  {
    roleCode: "PPTK",
    email: "pptk@health.local",
    name: "PPTK Demo",
    jabatan: "Pejabat Pelaksana Teknis Kegiatan",
    unitKerja: "Seksi Mikrobiologi",
    nip: "198001012010011013",
  },
  {
    roleCode: "PA",
    email: "pa@health.local",
    name: "PA Demo",
    jabatan: "Pengguna Anggaran",
    unitKerja: "Labkes Provinsi Jawa Barat",
    nip: "198001012010011005",
  },
  {
    roleCode: "KPA",
    email: "kpa@health.local",
    name: "KPA Demo",
    jabatan: "Kuasa Pengguna Anggaran",
    unitKerja: "Labkes Provinsi Jawa Barat",
    nip: "198001012010011006",
  },
  {
    roleCode: "PPK",
    email: "ppk@health.local",
    name: "PPK Demo",
    jabatan: "Pejabat Pembuat Komitmen",
    unitKerja: "UKPBJ Labkes Provinsi Jawa Barat",
    nip: "198001012010011007",
  },
  {
    roleCode: "PROCUREMENT_OFFICER",
    email: "pejabatpengadaan@health.local",
    name: "Pejabat Pengadaan Demo",
    jabatan: "Pejabat Pengadaan",
    unitKerja: "UKPBJ Labkes Provinsi Jawa Barat",
    nip: "198001012010011008",
  },
  {
    roleCode: "SELECTION_WORKGROUP",
    email: "pokja@health.local",
    name: "Pokja Pemilihan Demo",
    jabatan: "Pokja Pemilihan",
    unitKerja: "UKPBJ Labkes Provinsi Jawa Barat",
    nip: "198001012010011009",
  },
  {
    roleCode: "UKPBJ",
    email: "ukpbj@health.local",
    name: "UKPBJ Demo",
    jabatan: "Tim UKPBJ",
    unitKerja: "UKPBJ Labkes Provinsi Jawa Barat",
    nip: "198001012010011010",
  },
  {
    roleCode: "AUDITOR",
    email: "auditor@health.local",
    name: "Auditor Demo",
    jabatan: "Auditor",
    unitKerja: "Inspektorat",
    nip: "198001012010011011",
  },
  {
    roleCode: "VIEWER",
    email: "viewer@health.local",
    name: "Viewer Demo",
    jabatan: "Viewer",
    unitKerja: "Labkes Provinsi Jawa Barat",
    nip: "198001012010011012",
  },
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

  const demoPasswordHash = await bcrypt.hash(demoPassword, 12);

  for (const demoUser of demoUsers) {
    const role = await prisma.role.findUniqueOrThrow({
      where: { code: demoUser.roleCode },
    });

    const user = await prisma.user.upsert({
      where: { email: demoUser.email },
      update: {
        name: demoUser.name,
        passwordHash: demoPasswordHash,
        jabatan: demoUser.jabatan,
        unitKerja: demoUser.unitKerja,
        nomorTelepon: "0812-0000-0000",
        nip: demoUser.nip,
        status: "ACTIVE",
      },
      create: {
        name: demoUser.name,
        email: demoUser.email,
        passwordHash: demoPasswordHash,
        jabatan: demoUser.jabatan,
        unitKerja: demoUser.unitKerja,
        nomorTelepon: "0812-0000-0000",
        nip: demoUser.nip,
        status: "ACTIVE",
      },
    });

    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: user.id,
          roleId: role.id,
        },
      },
      update: {},
      create: {
        userId: user.id,
        roleId: role.id,
      },
    });
  }

  console.info(`Seed selesai. Admin: ${adminEmail}`);
  console.info(`Akun demo role dibuat. Password demo: ${demoPassword}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
