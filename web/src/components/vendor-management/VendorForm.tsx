"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { vendorCreateSchema } from "@/lib/vendor-validation";

type Category = { id: string; name: string };
type FieldErrors = Record<string, string>;

type VendorFormProps = {
  categories: Category[];
  initialValues?: Record<string, string | string[]>;
  vendorId?: string;
  onCancel?: () => void;
  onDirtyChange?: (dirty: boolean) => void;
  onSaved?: (vendorId: string) => void;
};

const inputClass =
  "h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-[#08783f] focus:ring-2 focus:ring-emerald-100";
const invalidInputClass =
  "border-rose-400 focus:border-rose-500 focus:ring-rose-100";

const fields = [
  {
    name: "companyName",
    label: "Nama perusahaan",
    required: true,
    maxLength: 180,
  },
  {
    name: "businessEntityType",
    label: "Jenis badan usaha",
    required: true,
    maxLength: 80,
  },
  {
    name: "nib",
    label: "NIB",
    required: true,
    maxLength: 40,
    inputMode: "numeric" as const,
  },
  { name: "npwp", label: "NPWP (opsional)", required: false, maxLength: 40 },
  { name: "province", label: "Provinsi", required: true, maxLength: 120 },
  { name: "city", label: "Kabupaten/kota", required: true, maxLength: 120 },
  {
    name: "website",
    label: "Website (opsional)",
    required: false,
    maxLength: 255,
    type: "url",
  },
] as const;

function issuesToErrors(issues: Array<{ field?: string; message: string }>) {
  return issues.reduce<FieldErrors>((errors, issue) => {
    if (issue.field && !errors[issue.field])
      errors[issue.field] = issue.message;
    return errors;
  }, {});
}

export default function VendorForm({
  categories,
  initialValues,
  vendorId,
  onCancel,
  onDirtyChange,
  onSaved,
}: VendorFormProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);

  function markDirty() {
    onDirtyChange?.(true);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = {
      ...Object.fromEntries(formData.entries()),
      categoryIds: formData.getAll("categoryIds"),
    };
    const parsed = vendorCreateSchema.safeParse(payload);

    setError("");
    setFieldErrors({});
    if (!parsed.success) {
      const errors = issuesToErrors(
        parsed.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      );
      setFieldErrors(errors);
      setError("Periksa kembali field yang ditandai.");
      form.querySelector<HTMLElement>("[aria-invalid='true']")?.focus();
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(
        vendorId
          ? `/api/vendor-management/vendors/${vendorId}`
          : "/api/vendor-management/vendors",
        {
          method: vendorId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsed.data),
        },
      );
      const result = (await response.json().catch(() => null)) as {
        data?: { id?: string };
        errors?: Array<{ field?: string; message: string }>;
        message?: string;
      } | null;

      if (!response.ok) {
        setFieldErrors(issuesToErrors(result?.errors ?? []));
        setError(
          result?.message ??
            (response.status >= 500
              ? "Terjadi kesalahan pada server. Data formulir tetap tersimpan, silakan coba kembali."
              : "Vendor gagal disimpan. Periksa kembali data yang diisi."),
        );
        return;
      }

      const savedVendorId = result?.data?.id;
      if (!savedVendorId) {
        setError(
          "Respons server tidak lengkap. Data formulir tetap tersimpan, silakan coba kembali.",
        );
        return;
      }
      onDirtyChange?.(false);
      if (onSaved) onSaved(savedVendorId);
      else {
        router.push(`/vendor-management/vendors/${savedVendorId}`);
        router.refresh();
      }
    } catch {
      setError(
        "Terjadi gangguan koneksi. Data formulir tetap tersimpan, silakan coba kembali.",
      );
    } finally {
      setSaving(false);
    }
  }

  function errorFor(name: string) {
    const message = fieldErrors[name];
    return message ? (
      <p
        id={`${name}-error`}
        className="mt-1 text-xs font-semibold text-rose-600"
      >
        {message}
      </p>
    ) : null;
  }

  return (
    <form
      noValidate
      onSubmit={submit}
      onChange={markDirty}
      className="space-y-5"
    >
      <section className="space-y-4">
        <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3">
          <h3 className="text-sm font-black text-[#08783f]">
            1. Identitas Perusahaan
          </h3>
          <p className="mt-1 text-xs text-slate-600">
            Informasi legal dan alamat utama penyedia.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {fields.map((field) => (
            <label key={field.name} className="block">
              <span className="mb-1 block text-sm font-bold text-slate-700">
                {field.label}
              </span>
              <input
                name={field.name}
                autoFocus={field.name === "companyName"}
                type={"type" in field ? field.type : "text"}
                inputMode={"inputMode" in field ? field.inputMode : undefined}
                required={field.required ?? false}
                maxLength={field.maxLength}
                aria-invalid={Boolean(fieldErrors[field.name])}
                aria-describedby={
                  fieldErrors[field.name] ? `${field.name}-error` : undefined
                }
                className={`${inputClass} ${fieldErrors[field.name] ? invalidInputClass : ""}`}
                defaultValue={initialValues?.[field.name] as string | undefined}
              />
              {errorFor(field.name)}
            </label>
          ))}
          <label className="md:col-span-2">
            <span className="mb-1 block text-sm font-bold text-slate-700">
              Alamat perusahaan
            </span>
            <textarea
              name="address"
              required
              maxLength={2000}
              defaultValue={initialValues?.address as string | undefined}
              aria-invalid={Boolean(fieldErrors.address)}
              className={`min-h-24 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#08783f] focus:ring-2 focus:ring-emerald-100 ${fieldErrors.address ? invalidInputClass : ""}`}
            />
            {errorFor("address")}
          </label>
          <label className="md:col-span-2">
            <span className="mb-1 block text-sm font-bold text-slate-700">
              Deskripsi usaha (opsional)
            </span>
            <textarea
              name="businessDescription"
              maxLength={4000}
              defaultValue={
                initialValues?.businessDescription as string | undefined
              }
              aria-invalid={Boolean(fieldErrors.businessDescription)}
              className={`min-h-24 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#08783f] focus:ring-2 focus:ring-emerald-100 ${fieldErrors.businessDescription ? invalidInputClass : ""}`}
            />
            {errorFor("businessDescription")}
          </label>
        </div>
      </section>

      <section className="space-y-4">
        <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3">
          <h3 className="text-sm font-black text-[#08783f]">
            2. Kontak dan PIC
          </h3>
          <p className="mt-1 text-xs text-slate-600">
            Kontak utama yang dapat dihubungi.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {[
            {
              name: "contactName",
              label: "Nama penanggung jawab",
              type: "text",
              maxLength: 160,
            },
            {
              name: "contactPosition",
              label: "Jabatan",
              type: "text",
              maxLength: 120,
            },
            {
              name: "contactPhone",
              label: "Nomor telepon/HP",
              type: "tel",
              maxLength: 40,
            },
            {
              name: "contactEmail",
              label: "Email",
              type: "email",
              maxLength: 180,
            },
          ].map(({ name, label, type, maxLength }) => (
            <label key={name}>
              <span className="mb-1 block text-sm font-bold text-slate-700">
                {label}
              </span>
              <input
                name={name}
                type={type}
                required
                maxLength={maxLength}
                defaultValue={initialValues?.[name] as string | undefined}
                aria-invalid={Boolean(fieldErrors[name])}
                className={`${inputClass} ${fieldErrors[name] ? invalidInputClass : ""}`}
              />
              {errorFor(name)}
            </label>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3">
          <h3 className="text-sm font-black text-[#08783f]">
            3. Kategori Usaha
          </h3>
          <p className="mt-1 text-xs text-slate-600">
            Dokumen legalitas dapat ditambahkan setelah profil vendor tersimpan.
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <label
              key={category.id}
              className="flex min-h-11 items-center gap-2 rounded-lg border border-slate-200 p-3 text-sm"
            >
              <input
                type="checkbox"
                name="categoryIds"
                value={category.id}
                defaultChecked={(
                  initialValues?.categoryIds as string[] | undefined
                )?.includes(category.id)}
              />
              {category.name}
            </label>
          ))}
        </div>
      </section>

      {error && (
        <p
          role="alert"
          className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm font-bold text-rose-700"
        >
          {error}
        </p>
      )}
      <div className="sticky -bottom-4 -mx-4 flex flex-col-reverse gap-2 border-t border-slate-200 bg-white px-4 py-4 sm:-bottom-6 sm:-mx-6 sm:flex-row sm:justify-end sm:px-6">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="h-11 rounded-lg border border-slate-300 px-5 text-sm font-bold text-slate-700 disabled:opacity-60"
          >
            Batal
          </button>
        )}
        <button
          type="submit"
          disabled={saving}
          className="h-11 rounded-lg bg-[#08783f] px-5 text-sm font-black text-white transition hover:bg-[#066532] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving
            ? "Menyimpan…"
            : vendorId
              ? "Simpan Perubahan"
              : "Simpan Vendor"}
        </button>
      </div>
    </form>
  );
}
