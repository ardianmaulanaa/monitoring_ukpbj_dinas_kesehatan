"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  ClipboardCheck,
  KeyRound,
  Plus,
  RotateCcw,
  Save,
  ShieldCheck,
  Trash2,
  UsersRound,
} from "lucide-react";

type CustomRole = {
  id: string;
  code: string;
  name: string;
  actor: string;
  approvalStep: string;
  accessScope: string;
  modules: string[];
  grants: string[];
  createdAt: string;
};

type RoleUser = {
  id: string;
  code: string;
  name: string;
};

type ExistingUser = {
  id: string;
  name: string;
  email: string;
  jabatan: string | null;
  unitKerja: string | null;
  status: "ACTIVE" | "INACTIVE";
  roles: RoleUser[];
};

type RoleCreateClientProps = {
  users: ExistingUser[];
};

const storageKey = "health-procurement-custom-roles";

const moduleOptions = [
  "Dashboard",
  "Perencanaan",
  "RUP/SIRUP",
  "Paket Pengadaan",
  "Katalog V5/V6",
  "Tender & Non Tender",
  "Kontrak & SP",
  "Progres",
  "Serah Terima",
  "Realisasi",
  "Risiko & Mitigasi",
  "Audit Readiness",
  "Dokumen",
  "Laporan",
  "Master Data",
  "User & Role",
  "Audit Log",
];

const grantOptions = [
  "Read",
  "Create",
  "Update",
  "Delete",
  "Approve",
  "Reject",
  "Minta Revisi",
  "Upload Dokumen",
  "Export",
  "Manage User",
  "Manage Role",
  "Sinkron SIRUP",
  "Read Only",
];

function makeRoleCode(value: string) {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function readCustomRoles() {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(storageKey);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as CustomRole[]) : [];
  } catch {
    return [];
  }
}

export default function RoleCreateClient({ users }: RoleCreateClientProps) {
  const [name, setName] = useState("");
  const [manualCode, setManualCode] = useState("");
  const [actor, setActor] = useState("");
  const [approvalStep, setApprovalStep] = useState("Tidak masuk approval");
  const [accessScope, setAccessScope] = useState("");
  const [modules, setModules] = useState<string[]>(["Dashboard"]);
  const [grants, setGrants] = useState<string[]>(["Read"]);
  const [roles, setRoles] = useState<CustomRole[]>(() => readCustomRoles());
  const [message, setMessage] = useState("");

  const code = useMemo(
    () => makeRoleCode(manualCode || name || "ROLE_BARU"),
    [manualCode, name],
  );

  function toggleValue(value: string, selected: string[], setter: (values: string[]) => void) {
    setter(
      selected.includes(value)
        ? selected.filter((item) => item !== value)
        : [...selected, value],
    );
  }

  function resetForm() {
    setName("");
    setManualCode("");
    setActor("");
    setApprovalStep("Tidak masuk approval");
    setAccessScope("");
    setModules(["Dashboard"]);
    setGrants(["Read"]);
    setMessage("");
  }

  function saveRole(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name.trim()) {
      setMessage("Nama role wajib diisi.");
      return;
    }

    const nextRole: CustomRole = {
      id: crypto.randomUUID(),
      code,
      name: name.trim(),
      actor: actor.trim() || "Role custom",
      approvalStep,
      accessScope:
        accessScope.trim() ||
        `Akses ${grants.join(", ")} pada modul ${modules.join(", ")}.`,
      modules,
      grants,
      createdAt: new Date().toISOString(),
    };

    const withoutDuplicate = roles.filter((role) => role.code !== nextRole.code);
    const nextRoles = [nextRole, ...withoutDuplicate];

    window.localStorage.setItem(storageKey, JSON.stringify(nextRoles));
    setRoles(nextRoles);
    setMessage(`Role ${nextRole.name} berhasil dibuat untuk demo.`);
    resetForm();
  }

  function deleteRole(id: string) {
    const nextRoles = roles.filter((role) => role.id !== id);
    window.localStorage.setItem(storageKey, JSON.stringify(nextRoles));
    setRoles(nextRoles);
  }

  return (
    <main className="bg-[#f4f7f5] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/admin/roles"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Roles
        </Link>
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-black text-[#08783f]">
          <ShieldCheck className="h-4 w-4" />
          Khusus Super Admin
        </span>
      </div>

      <section className="space-y-5">
        <form
          onSubmit={saveRole}
          className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-[#08783f]" />
            <h2 className="text-lg font-black text-[#16227c]">
              Form Role Baru
            </h2>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-xs font-black uppercase text-slate-400">
                Nama Role
              </span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Contoh: Bendahara"
                className="h-11 rounded-lg border border-slate-300 px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#08783f] focus:ring-4 focus:ring-emerald-100"
              />
            </label>
            <label className="grid gap-2">
              <span className="text-xs font-black uppercase text-slate-400">
                Kode Role
              </span>
              <input
                value={manualCode}
                onChange={(event) => setManualCode(event.target.value)}
                placeholder={code}
                className="h-11 rounded-lg border border-slate-300 px-3 font-mono text-sm font-semibold text-slate-700 outline-none transition focus:border-[#08783f] focus:ring-4 focus:ring-emerald-100"
              />
            </label>
            <label className="grid gap-2">
              <span className="text-xs font-black uppercase text-slate-400">
                Aktor
              </span>
              <input
                value={actor}
                onChange={(event) => setActor(event.target.value)}
                placeholder="Contoh: Bendahara pengeluaran"
                className="h-11 rounded-lg border border-slate-300 px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#08783f] focus:ring-4 focus:ring-emerald-100"
              />
            </label>
            <label className="grid gap-2">
              <span className="text-xs font-black uppercase text-slate-400">
                Tahap Workflow
              </span>
              <select
                value={approvalStep}
                onChange={(event) => setApprovalStep(event.target.value)}
                className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#08783f] focus:ring-4 focus:ring-emerald-100"
              >
                <option>Tidak masuk approval</option>
                <option>Draft/Input data</option>
                <option>Approve Kepala Unit</option>
                <option>Verifikasi PPTK</option>
                <option>Review PPK</option>
                <option>Approval KPA/PA</option>
                <option>Input/Tayang RUP</option>
                <option>Proses pengadaan</option>
                <option>Audit readiness</option>
              </select>
            </label>
          </div>

          <label className="mt-4 grid gap-2">
            <span className="text-xs font-black uppercase text-slate-400">
              Scope Akses
            </span>
            <textarea
              value={accessScope}
              onChange={(event) => setAccessScope(event.target.value)}
              placeholder="Contoh: Bisa melihat realisasi, upload dokumen pembayaran, dan export laporan pembayaran."
              className="min-h-24 rounded-lg border border-slate-300 px-3 py-3 text-sm font-semibold leading-6 text-slate-700 outline-none transition focus:border-[#08783f] focus:ring-4 focus:ring-emerald-100"
            />
          </label>

          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <div>
              <p className="text-xs font-black uppercase text-slate-400">
                Akses Modul
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {moduleOptions.map((module) => (
                  <label
                    key={module}
                    className="flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-700"
                  >
                    <input
                      type="checkbox"
                      checked={modules.includes(module)}
                      onChange={() => toggleValue(module, modules, setModules)}
                      className="h-4 w-4 accent-[#08783f]"
                    />
                    {module}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-black uppercase text-slate-400">
                Grant Access
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {grantOptions.map((grant) => (
                  <label
                    key={grant}
                    className="flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-700"
                  >
                    <input
                      type="checkbox"
                      checked={grants.includes(grant)}
                      onChange={() => toggleValue(grant, grants, setGrants)}
                      className="h-4 w-4 accent-[#08783f]"
                    />
                    {grant}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {message ? (
            <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-[#08783f]">
              {message}
            </div>
          ) : null}

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <button
              type="submit"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#08783f] px-5 text-sm font-black text-white shadow-sm transition hover:bg-[#076b39]"
            >
              <Save className="h-4 w-4" />
              Simpan Role
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-5 text-sm font-black text-slate-700 transition hover:bg-slate-50"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </button>
          </div>
        </form>

        <aside className="space-y-5">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-[#08783f]" />
              <h2 className="text-lg font-black text-[#16227c]">Preview</h2>
            </div>
            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <span className="inline-flex rounded-full bg-[#08783f] px-3 py-1 text-xs font-black text-white">
                {name || "Nama Role"}
              </span>
              <p className="mt-4 font-mono text-xs font-black text-slate-400">
                {code}
              </p>
              <p className="mt-2 text-sm font-black text-slate-900">
                {actor || "Aktor role"}
              </p>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
                {accessScope || "Scope akses akan tampil di sini."}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {grants.map((grant) => (
                  <span
                    key={grant}
                    className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-black text-slate-600"
                  >
                    <Check className="h-3 w-3 text-[#08783f]" />
                    {grant}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-black text-[#16227c]">
                Role Custom Demo
              </h2>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
                {roles.length}
              </span>
            </div>
            <div className="mt-4 space-y-3">
              {roles.length > 0 ? (
                roles.map((role) => (
                  <div
                    key={role.id}
                    className="rounded-lg border border-slate-200 bg-slate-50 p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-black text-slate-900">{role.name}</p>
                        <p className="mt-1 font-mono text-xs font-bold text-slate-400">
                          {role.code}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => deleteRole(role.id)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-red-500 transition hover:bg-red-50"
                        aria-label={`Hapus ${role.name}`}
                        title={`Hapus ${role.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">
                      {role.modules.join(", ")}
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-lg border border-dashed border-slate-300 p-5 text-center">
                  <Plus className="mx-auto h-8 w-8 text-slate-300" />
                  <p className="mt-3 text-sm font-black text-slate-700">
                    Belum ada role custom
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <UsersRound className="h-5 w-5 text-[#08783f]" />
                <h2 className="text-lg font-black text-[#16227c]">
                  User Terdaftar
                </h2>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
                {users.length} user
              </span>
            </div>
            <div className="mt-4 max-h-[520px] divide-y divide-slate-100 overflow-y-auto">
              {users.length > 0 ? (
                users.map((user) => (
                  <div
                    key={user.id}
                    className="grid gap-3 py-3 text-sm md:grid-cols-[1.15fr_1fr_auto]"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-black text-slate-900">{user.name}</p>
                      <p className="mt-1 truncate text-xs font-semibold text-slate-500">
                        {user.email}
                      </p>
                    </div>
                    <div className="min-w-0 text-xs font-semibold leading-5 text-slate-500">
                      <p className="truncate">{user.jabatan || "Jabatan belum diisi"}</p>
                      <p className="truncate">{user.unitKerja || "Unit kerja belum diisi"}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 md:justify-end">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-black ${
                          user.status === "ACTIVE"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {user.status === "ACTIVE" ? "Aktif" : "Nonaktif"}
                      </span>
                      {user.roles.length > 0 ? (
                        user.roles.map((role) => (
                          <span
                            key={`${user.id}-${role.id}`}
                            className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-black text-slate-600"
                          >
                            {role.name}
                          </span>
                        ))
                      ) : (
                        <span className="rounded-full border border-dashed border-slate-300 px-2.5 py-1 text-xs font-black text-slate-400">
                          Belum ada role
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-lg border border-dashed border-slate-300 p-5 text-center">
                  <UsersRound className="mx-auto h-8 w-8 text-slate-300" />
                  <p className="mt-3 text-sm font-black text-slate-700">
                    Belum ada user
                  </p>
                </div>
              )}
            </div>
            <Link
              href="/admin/users"
              className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 px-4 text-sm font-black text-[#08783f] transition hover:bg-emerald-100"
            >
              Buka Manajemen User
            </Link>
          </div>
        </aside>
      </section>
    </main>
  );
}
