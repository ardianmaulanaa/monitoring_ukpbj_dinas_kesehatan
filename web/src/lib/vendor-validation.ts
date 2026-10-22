import { z } from "zod";

const optionalText = (max: number) =>
  z.string().trim().max(max).optional().or(z.literal(""));

export const vendorCreateSchema = z.object({
  companyName: z
    .string()
    .trim()
    .min(3, "Nama perusahaan minimal 3 karakter.")
    .max(180, "Nama perusahaan maksimal 180 karakter."),
  businessEntityType: z
    .string()
    .trim()
    .min(2, "Jenis badan usaha wajib diisi.")
    .max(80),
  nib: z
    .string()
    .trim()
    .min(8, "NIB minimal 8 karakter.")
    .max(40, "NIB maksimal 40 karakter."),
  npwp: optionalText(40),
  address: z
    .string()
    .trim()
    .min(5, "Alamat perusahaan minimal 5 karakter.")
    .max(2000),
  province: z.string().trim().min(2, "Provinsi wajib diisi.").max(120),
  city: z.string().trim().min(2, "Kabupaten/kota wajib diisi.").max(120),
  website: z
    .string()
    .trim()
    .url("Format website tidak valid.")
    .max(255)
    .optional()
    .or(z.literal("")),
  businessDescription: optionalText(4000),
  contactName: z
    .string()
    .trim()
    .min(2, "Nama penanggung jawab wajib diisi.")
    .max(160),
  contactPosition: z.string().trim().min(2, "Jabatan wajib diisi.").max(120),
  contactPhone: z
    .string()
    .trim()
    .min(6, "Nomor telepon minimal 6 karakter.")
    .max(40),
  contactEmail: z.string().trim().email("Format email tidak valid.").max(180),
  categoryIds: z.array(z.string().uuid()).max(20).default([]),
});

export const vendorUpdateSchema = vendorCreateSchema;

export const vendorStatusSchema = z
  .object({
    status: z.enum([
      "DRAFT",
      "PENDING_REVIEW",
      "NEEDS_REVISION",
      "VERIFIED_INTERNAL",
      "ARCHIVED",
    ]),
    note: z.string().trim().max(4000).optional().or(z.literal("")),
  })
  .superRefine((value, context) => {
    if (value.status === "NEEDS_REVISION" && !value.note) {
      context.addIssue({
        code: "custom",
        path: ["note"],
        message: "Alasan revisi wajib diisi.",
      });
    }
  });

export const productCreateSchema = z.object({
  vendorId: z.string().uuid(),
  categoryId: z.string().uuid().optional().or(z.literal("")),
  name: z.string().trim().min(2).max(180),
  brand: optionalText(120),
  model: optionalText(120),
  description: optionalText(4000),
  specification: z.string().trim().min(3).max(10000),
  unit: z.string().trim().min(1).max(40),
  indicativePrice: z.coerce.number().nonnegative().optional(),
  currency: z.string().trim().length(3).default("IDR"),
  warranty: optionalText(2000),
  afterSales: optionalText(2000),
});

export const productLinkSchema = z.object({
  productId: z.string().uuid(),
});

export const presentationCreateSchema = z.object({
  vendorId: z.string().uuid(),
  productIds: z.array(z.string().uuid()).max(20).default([]),
  type: z.enum(["PRESENTATION", "DEMO", "TRIAL", "TECHNICAL_TEST"]),
  title: z.string().trim().min(3).max(180),
  purpose: z.string().trim().min(3).max(4000),
  proposedAt: z.coerce.date(),
  location: z.string().trim().min(2).max(180),
  agenda: optionalText(4000),
  notes: optionalText(4000),
  requesterUnit: optionalText(160),
});
