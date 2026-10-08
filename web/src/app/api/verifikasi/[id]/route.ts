import type { StatusUsulan } from "@prisma/client";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import {
  canVerificationTransition,
  canVerifyProposalUnit,
  canAccessProposalUnit,
} from "@/lib/planning-workflow";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/response";
import { getPlanningCompleteness } from "@/lib/workflow-completeness";

const verificationSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("request_revision"),
    note: z.string().trim().min(5, "Catatan revisi minimal 5 karakter."),
  }),
  z.object({
    action: z.literal("approve"),
    note: z.string().trim().optional(),
  }),
]);

async function getUserUnit(userId: string) {
  const profile = await prisma.user.findUnique({
    where: { id: userId },
    select: { unitKerja: true },
  });

  return profile?.unitKerja ?? null;
}

function canAccessProposal({
  proposal,
  user,
  userUnit,
}: {
  proposal: { unitBidang: string | null; unitPengusul: string };
  user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;
  userUnit?: string | null;
}) {
  return (
    canAccessProposalUnit({
      proposalUnit: proposal.unitPengusul,
      userName: user.name,
      userRoles: user.roles,
      userUnit,
    }) ||
    canAccessProposalUnit({
      proposalUnit: proposal.unitBidang ?? "",
      userName: user.name,
      userRoles: user.roles,
      userUnit,
    })
  );
}

function canVerifyProposal({
  proposal,
  user,
  userUnit,
}: Parameters<typeof canAccessProposal>[0]) {
  return (
    canVerifyProposalUnit({
      proposalUnit: proposal.unitPengusul,
      userName: user.name,
      userRoles: user.roles,
      userUnit,
    }) ||
    canVerifyProposalUnit({
      proposalUnit: proposal.unitBidang ?? "",
      userName: user.name,
      userRoles: user.roles,
      userUnit,
    })
  );
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();

  if (!user) {
    return apiError("Sesi login tidak ditemukan.", 401);
  }

  const { id } = await context.params;
  const proposal = await prisma.rencanaUmumPengadaan.findUnique({
    where: { id },
    include: {
      verificationHistory: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!proposal) {
    return apiError("Usulan tidak ditemukan.", 404);
  }

  const userUnit = await getUserUnit(user.id);

  if (!canAccessProposal({ proposal, user, userUnit })) {
    return apiError(
      "Anda tidak memiliki akses untuk melihat usulan ini.",
      403,
    );
  }

  return apiSuccess(
    {
      ...proposal,
      canVerify: canVerifyProposal({ proposal, user, userUnit }),
    },
    "Detail pengajuan berhasil dimuat.",
  );
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();

  if (!user) {
    return apiError("Sesi login tidak ditemukan.", 401);
  }

  const { id } = await context.params;
  const json = await request.json().catch(() => null);
  const parsed = verificationSchema.safeParse(json);

  if (!parsed.success) {
    return apiError(
      "Data verifikasi tidak valid.",
      422,
      parsed.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    );
  }

  const proposal = await prisma.rencanaUmumPengadaan.findUnique({
    where: { id },
    select: {
      id: true,
      namaPaket: true,
      statusUsulan: true,
      unitBidang: true,
      unitPengusul: true,
      caraPengadaan: true,
      jadwalMulaiRencana: true,
      jadwalPemilihan: true,
      jadwalSelesaiRencana: true,
      jumlahKebutuhan: true,
      justifikasi: true,
      kegiatan: true,
      kodeRekening: true,
      kontakPenanggungJawab: true,
      metodePengadaan: true,
      pagu: true,
      ppkPptk: true,
      prioritas: true,
      program: true,
      satuanKebutuhan: true,
      spesifikasiAwal: true,
      statusDokumenPendukung: true,
      statusHps: true,
      statusKak: true,
      subKegiatan: true,
      sumberDana: true,
      tahunAnggaran: true,
      uraianKebutuhan: true,
    },
  });

  if (!proposal) {
    return apiError("Usulan tidak ditemukan.", 404);
  }

  const userUnit = await getUserUnit(user.id);

  if (
    !canVerifyProposal({ proposal, user, userUnit })
  ) {
    return apiError(
      "Anda tidak memiliki akses untuk memverifikasi usulan ini.",
      403,
    );
  }

  if (proposal.statusUsulan !== "DIAJUKAN") {
    return apiError("Status usulan telah berubah. Silakan muat ulang halaman.", 409);
  }

  const nextStatus: StatusUsulan =
    parsed.data.action === "approve" ? "SIAP_RUP" : "PERLU_REVISI";

  if (parsed.data.action === "approve") {
    const completeness = getPlanningCompleteness(proposal);

    if (!completeness.complete) {
      return apiError(
        "Usulan belum memenuhi kelengkapan minimum.",
        400,
        completeness.missingFields.map((field) => ({
          field,
          message: `${field} belum lengkap.`,
        })),
      );
    }
  }

  if (!canVerificationTransition(proposal.statusUsulan, nextStatus)) {
    return apiError("Transisi status usulan tidak valid.", 422);
  }

  const now = new Date();

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.rencanaUmumPengadaan.updateMany({
      where: { id, statusUsulan: "DIAJUKAN" },
      data:
        parsed.data.action === "approve"
          ? {
              statusUsulan: nextStatus,
              verifiedAt: now,
              verifiedBy: user.name,
              verificationChecklist: undefined,
              verificationNote: parsed.data.note?.trim() || null,
              catatan: parsed.data.note?.trim() || null,
            }
          : {
              statusUsulan: nextStatus,
              revisionAt: now,
              revisionBy: user.name,
              revisionNote: parsed.data.note,
              catatan: `Revisi diminta: ${parsed.data.note}`,
            },
    });

    if (updated.count !== 1) {
      throw new Error("STALE_STATUS");
    }

    await tx.usulanVerificationHistory.create({
      data: {
        action:
          parsed.data.action === "approve"
            ? "APPROVE_USULAN"
            : "REQUEST_REVISION",
        actorId: user.id,
        actorName: user.name,
        newStatus: nextStatus,
        note: parsed.data.note?.trim() || null,
        oldStatus: proposal.statusUsulan,
        proposalId: id,
      },
    });

    return tx.rencanaUmumPengadaan.findUniqueOrThrow({
      where: { id },
    });
  }).catch((error) => {
    if (error instanceof Error && error.message === "STALE_STATUS") {
      return null;
    }

    throw error;
  });

  if (!result) {
    return apiError("Status usulan telah berubah. Silakan muat ulang halaman.", 409);
  }

  return apiSuccess(
    result,
    parsed.data.action === "approve"
      ? "Usulan berhasil diverifikasi dan siap diproses ke RUP."
      : "Usulan dikembalikan untuk revisi.",
  );
}
