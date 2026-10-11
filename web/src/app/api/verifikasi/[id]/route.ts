import type { StatusUsulan } from "@prisma/client";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import {
  canRunApprovalStage,
  canVerificationTransition,
  canAccessProposalUnit,
  getApprovalStage,
  getPrimaryApprovalRole,
  nextApprovalStatus,
} from "@/lib/planning-workflow";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/response";
import {
  planningCompletionErrors,
  planningIncompleteMessage,
} from "@/lib/workflow-completeness";
import { validateUsulanCompleteness } from "@/lib/workflow-completeness-server";

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
}: Parameters<typeof canAccessProposal>[0] & {
  proposal: Parameters<typeof canAccessProposal>[0]["proposal"] & {
    statusUsulan?: StatusUsulan | string;
  };
}) {
  const stage = getApprovalStage(proposal.statusUsulan ?? "");

  if (!canRunApprovalStage(user.roles, stage)) return false;
  if (stage !== "kepala_unit") return true;

  return canAccessProposal({ proposal, user, userUnit });
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
      verificationStage: getApprovalStage(proposal.statusUsulan),
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

  const stage = getApprovalStage(proposal.statusUsulan);

  if (!stage) {
    return apiError("Status usulan telah berubah. Silakan muat ulang halaman.", 409);
  }

  const nextStatus: StatusUsulan = nextApprovalStatus(stage, parsed.data.action);

  if (parsed.data.action === "approve") {
    const completeness = await validateUsulanCompleteness(id);

    if (!completeness) {
      return apiError("Usulan tidak ditemukan.", 404);
    }

    if (!completeness.complete) {
      return apiError(
        planningIncompleteMessage(completeness.missingFields),
        400,
        planningCompletionErrors(completeness.missingFields),
      );
    }
  }

  if (!canVerificationTransition(proposal.statusUsulan, nextStatus)) {
    return apiError("Transisi status usulan tidak valid.", 422);
  }

  const now = new Date();
  const actorRole = getPrimaryApprovalRole(user.roles, stage);
  const approveAction =
    stage === "kepala_unit"
      ? "VERIFY_HEAD_UNIT"
      : stage === "ppk_pptk"
        ? "VALIDATE_PPK_PPTK"
        : "APPROVE_PA_KPA";

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.rencanaUmumPengadaan.updateMany({
      where: { id, statusUsulan: proposal.statusUsulan },
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
            ? approveAction
            : "REQUEST_REVISION",
        actorId: user.id,
        actorName: user.name,
        actorRole,
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
      ? stage === "kepala_unit"
        ? "Usulan berhasil diverifikasi dan diteruskan ke PPK/PPTK."
        : stage === "ppk_pptk"
          ? "Perencanaan berhasil divalidasi dan diteruskan ke PA/KPA."
          : "Perencanaan berhasil disetujui dan siap diproses ke RUP."
      : "Usulan dikembalikan untuk revisi.",
  );
}
