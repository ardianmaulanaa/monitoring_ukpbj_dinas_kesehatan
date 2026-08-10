import { prisma } from "@/lib/prisma";

export type NotificationTone = "info" | "warning" | "danger";

export type NotificationItem = {
  id: string;
  title: string;
  description: string;
  href: string;
  count: number;
  tone: NotificationTone;
};

export type NotificationSummary = {
  total: number;
  items: NotificationItem[];
};

function buildItem(
  id: string,
  title: string,
  description: string,
  href: string,
  count: number,
  tone: NotificationTone,
): NotificationItem | null {
  if (count <= 0) return null;

  return {
    id,
    title,
    description,
    href,
    count,
    tone,
  };
}

export async function getNotificationSummary(): Promise<NotificationSummary> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const nextSevenDays = new Date(today);
  nextSevenDays.setDate(nextSevenDays.getDate() + 7);

  const [
    rupMenunggu,
    klinikBaru,
    kontrakDraft,
    auditBelumLengkap,
    timelineTerlambat,
    progresTerlambat,
    serahTerimaTerlambat,
    kontrakHampirSelesai,
  ] = await Promise.all([
    prisma.rencanaUmumPengadaan.count({
      where: {
        statusSirup: {
          in: [
            "PROSES_VERIFIKASI",
            "MENUNGGU_PPTK",
            "MENUNGGU_PPK",
            "MENUNGGU_KPA_PA",
            "REVISI_PAGU",
          ],
        },
      },
    }),
    prisma.klinikKonsultasi.count({
      where: { status: "BARU" },
    }),
    prisma.kontrak.count({
      where: { status: "DRAFT" },
    }),
    prisma.auditChecklist.count({
      where: { status: { in: ["BELUM_ADA", "PROSES"] } },
    }),
    prisma.timelineEvent.count({
      where: { status: "TERLAMBAT" },
    }),
    prisma.progresPaket.count({
      where: { status: "TERLAMBAT" },
    }),
    prisma.serahTerima.count({
      where: { status: "TERLAMBAT" },
    }),
    prisma.kontrak.count({
      where: {
        status: "AKTIF",
        tanggalSelesai: {
          gte: today,
          lte: nextSevenDays,
        },
      },
    }),
  ]);

  const items = [
    buildItem(
      "rup-menunggu",
      "Pengajuan RUP perlu diproses",
      "Ada RUP dalam verifikasi, revisi, atau menunggu persetujuan.",
      "/rup",
      rupMenunggu,
      "warning",
    ),
    buildItem(
      "klinik-baru",
      "Konsultasi UKPBJ baru",
      "Ada pengajuan konsultasi dari unit kerja yang belum ditindaklanjuti.",
      "/klinik",
      klinikBaru,
      "info",
    ),
    buildItem(
      "kontrak-draft",
      "Draft Kontrak & SP",
      "Ada kontrak atau surat pesanan yang masih perlu dilengkapi.",
      "/kontrak",
      kontrakDraft,
      "warning",
    ),
    buildItem(
      "audit-belum-lengkap",
      "Dokumen audit belum lengkap",
      "Ada checklist audit yang masih belum ada atau masih proses.",
      "/audit",
      auditBelumLengkap,
      "warning",
    ),
    buildItem(
      "timeline-terlambat",
      "Timeline/progres terlambat",
      "Ada tahapan, progres, atau serah terima yang melewati jadwal.",
      "/timeline",
      timelineTerlambat + progresTerlambat + serahTerimaTerlambat,
      "danger",
    ),
    buildItem(
      "kontrak-hampir-selesai",
      "Kontrak hampir selesai",
      "Ada kontrak aktif yang berakhir dalam tujuh hari.",
      "/kontrak",
      kontrakHampirSelesai,
      "danger",
    ),
  ].filter((item): item is NotificationItem => Boolean(item));

  return {
    total: items.reduce((sum, item) => sum + item.count, 0),
    items,
  };
}
