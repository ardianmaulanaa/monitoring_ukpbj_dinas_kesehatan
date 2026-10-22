import {
  Prisma,
  type AuditAction,
  type VendorProfileStatus,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { CurrentUser } from "@/lib/auth";
import {
  normalizeIdentifier,
  vendorStatusTransitions,
} from "@/lib/vendor-management";
import type { z } from "zod";
import type { vendorCreateSchema } from "@/lib/vendor-validation";

type VendorInput = z.infer<typeof vendorCreateSchema>;

export async function createVendor(input: VendorInput, actor: CurrentUser) {
  const nibNormalized = normalizeIdentifier(input.nib);
  const npwpNormalized = input.npwp ? normalizeIdentifier(input.npwp) : null;
  return prisma.$transaction(async (tx) => {
    const vendor = await tx.vendor.create({
      data: {
        companyName: input.companyName,
        businessEntityType: input.businessEntityType,
        nib: input.nib,
        nibNormalized,
        npwp: input.npwp || null,
        npwpNormalized,
        address: input.address,
        province: input.province,
        city: input.city,
        website: input.website || null,
        businessDescription: input.businessDescription || null,
        createdById: actor.id,
        updatedById: actor.id,
        contacts: {
          create: {
            name: input.contactName,
            position: input.contactPosition,
            phone: input.contactPhone,
            email: input.contactEmail,
            isPrimary: true,
          },
        },
        categories: {
          create: input.categoryIds.map((categoryId) => ({ categoryId })),
        },
      },
    });
    await tx.vendorStatusHistory.create({
      data: {
        vendorId: vendor.id,
        actorId: actor.id,
        toStatus: "DRAFT",
        note: "Profil vendor dibuat.",
      },
    });
    await tx.auditLog.create({
      data: {
        userId: actor.id,
        action: "CREATE" as AuditAction,
        entity: "Vendor",
        entityId: vendor.id,
        after: { companyName: vendor.companyName, status: vendor.status },
      },
    });
    return vendor;
  });
}

export async function updateVendor(
  id: string,
  input: VendorInput,
  actor: CurrentUser,
) {
  const nibNormalized = normalizeIdentifier(input.nib);
  const npwpNormalized = input.npwp ? normalizeIdentifier(input.npwp) : null;
  return prisma.$transaction(async (tx) => {
    const current = await tx.vendor.findUnique({
      where: { id },
      include: { contacts: { where: { isPrimary: true }, take: 1 } },
    });
    if (!current) throw new Error("NOT_FOUND");
    if (current.status === "ARCHIVED") throw new Error("ARCHIVED");
    const updated = await tx.vendor.update({
      where: { id },
      data: {
        companyName: input.companyName,
        businessEntityType: input.businessEntityType,
        nib: input.nib,
        nibNormalized,
        npwp: input.npwp || null,
        npwpNormalized,
        address: input.address,
        province: input.province,
        city: input.city,
        website: input.website || null,
        businessDescription: input.businessDescription || null,
        updatedById: actor.id,
        contacts: current.contacts[0]
          ? {
              update: {
                where: { id: current.contacts[0].id },
                data: {
                  name: input.contactName,
                  position: input.contactPosition,
                  phone: input.contactPhone,
                  email: input.contactEmail,
                },
              },
            }
          : {
              create: {
                name: input.contactName,
                position: input.contactPosition,
                phone: input.contactPhone,
                email: input.contactEmail,
                isPrimary: true,
              },
            },
        categories: {
          deleteMany: {},
          create: input.categoryIds.map((categoryId) => ({ categoryId })),
        },
      },
    });
    await tx.auditLog.create({
      data: {
        userId: actor.id,
        action: "UPDATE" as AuditAction,
        entity: "Vendor",
        entityId: id,
        before: { companyName: current.companyName, nib: current.nib },
        after: { companyName: updated.companyName, nib: updated.nib },
      },
    });
    return updated;
  });
}

export async function transitionVendor(
  id: string,
  target: VendorProfileStatus,
  note: string | undefined,
  actor: CurrentUser,
) {
  return prisma.$transaction(async (tx) => {
    const vendor = await tx.vendor.findUnique({ where: { id } });
    if (!vendor) throw new Error("NOT_FOUND");
    if (!vendorStatusTransitions[vendor.status].includes(target))
      throw new Error("INVALID_TRANSITION");
    const updated = await tx.vendor.update({
      where: { id },
      data: {
        status: target,
        revisionNote:
          target === "NEEDS_REVISION"
            ? note
            : target === "VERIFIED_INTERNAL"
              ? null
              : undefined,
        verifiedAt: target === "VERIFIED_INTERNAL" ? new Date() : undefined,
        verifiedById: target === "VERIFIED_INTERNAL" ? actor.id : undefined,
        archivedAt:
          target === "ARCHIVED" ? new Date() : target === "DRAFT" ? null : undefined,
        updatedById: actor.id,
      },
    });
    await tx.vendorStatusHistory.create({
      data: {
        vendorId: id,
        actorId: actor.id,
        fromStatus: vendor.status,
        toStatus: target,
        note,
      },
    });
    await tx.auditLog.create({
      data: {
        userId: actor.id,
        action:
          target === "VERIFIED_INTERNAL"
            ? "APPROVE"
            : target === "NEEDS_REVISION"
              ? "REJECT"
              : "UPDATE",
        entity: "Vendor",
        entityId: id,
        before: { status: vendor.status },
        after: { status: target, note },
      },
    });
    return updated;
  });
}

export function isUniqueConstraintError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}
