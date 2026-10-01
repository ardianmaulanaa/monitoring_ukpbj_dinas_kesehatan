import {
  BadgeCheck,
  Building2,
  CalendarDays,
  Edit3,
  IdCard,
  Mail,
  Phone,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import AppHeader from "@/components/appheader/AppHeader";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function formatDate(value: Date | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

function InfoItem({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value?: string | null;
  icon?: typeof UserRound;
}) {
  return (
    <div className="flex min-w-0 gap-3 rounded-lg border border-slate-100 bg-slate-50/70 p-4">
      {Icon ? (
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-white text-[#08783f] shadow-sm">
          <Icon className="h-5 w-5" strokeWidth={2.25} />
        </span>
      ) : null}
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
          {label}
        </p>
        <p className="mt-1 break-words text-sm font-black text-slate-900">
          {value || "-"}
        </p>
      </div>
    </div>
  );
}

export default async function Page() {
  const currentUser = await requireCurrentUser();
  const user = await prisma.user.findUnique({
    where: { id: currentUser.id },
    include: {
      roles: {
        include: {
          role: true,
        },
      },
    },
  });

  if (!user) {
    throw new Error("USER_NOT_FOUND");
  }

  const initial = (user.name || user.email).trim().charAt(0).toUpperCase();
  const roleNames = user.roles.map((userRole) => userRole.role.name);
  const primaryRole = roleNames[0] ?? "Belum ada role";
  const joinedRoles = roleNames.length > 0 ? roleNames.join(", ") : "-";

  return (
    <main className="min-h-dvh bg-[#f4f7f5]">
      <AppHeader
        title="Profil"
        subtitle="Informasi akun dan hak akses pengguna"
        rightLabel="Akun"
      />

      <div className="w-full space-y-5 px-4 py-5 sm:px-6 lg:px-8">
        <section className="grid gap-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.75fr)]">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-6 md:flex-row md:items-center">
              <div className="relative h-28 w-28 shrink-0">
                <div className="flex h-28 w-28 items-center justify-center rounded-lg bg-[#08783f] text-5xl font-black text-white shadow-sm">
                  {initial}
                </div>
                <span className="absolute -bottom-2 -right-2 flex h-9 w-9 items-center justify-center rounded-md border-4 border-white bg-emerald-500">
                  <BadgeCheck className="h-5 w-5 text-white" />
                </span>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-3xl font-black tracking-tight text-slate-950">
                    {user.name}
                  </h2>
                  <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                    {user.status === "ACTIVE" ? "Aktif" : "Nonaktif"}
                  </span>
                </div>
                <p className="mt-2 text-sm font-bold text-slate-500">
                  {user.jabatan || "Jabatan belum diisi"}
                </p>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg bg-slate-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                      Unit Kerja
                    </p>
                    <p className="mt-1 text-sm font-black text-slate-900">
                      {user.unitKerja || "-"}
                    </p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                      Akses Utama
                    </p>
                    <p className="mt-1 text-sm font-black text-slate-900">
                      {primaryRole}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Status Akun
                </p>
                <h3 className="mt-1 text-xl font-black text-slate-950">
                  Internal Terverifikasi
                </h3>
              </div>
              <span className="flex h-11 w-11 items-center justify-center rounded-md bg-emerald-50 text-[#08783f]">
                <ShieldCheck className="h-6 w-6" strokeWidth={2.25} />
              </span>
            </div>
            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3">
                <span className="text-sm font-bold text-slate-500">Role</span>
                <span className="text-right text-sm font-black text-slate-950">
                  {joinedRoles}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3">
                <span className="text-sm font-bold text-slate-500">
                  Dibuat
                </span>
                <span className="text-right text-sm font-black text-slate-950">
                  {formatDate(user.createdAt)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm font-bold text-slate-500">
                  Login Terakhir
                </span>
                <span className="text-right text-sm font-black text-slate-950">
                  {formatDate(user.lastLoginAt)}
                </span>
              </div>
            </div>
          </aside>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-[#08783f]">
                Data Pengguna
              </p>
              <h3 className="mt-1 text-lg font-black text-slate-950">
                Informasi Profil
              </h3>
            </div>
            <button className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-[#f59e0b] px-3 text-xs font-black text-white shadow-sm transition hover:bg-[#d97706]">
              <Edit3 className="h-3.5 w-3.5" strokeWidth={2.4} />
              Edit Profil
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <InfoItem label="Nama Lengkap" value={user.name} icon={UserRound} />
            <InfoItem label="NIP" value={user.nip} icon={IdCard} />
            <InfoItem label="Email" value={user.email} icon={Mail} />
            <InfoItem
              label="Nomor Telepon"
              value={user.nomorTelepon}
              icon={Phone}
            />
            <InfoItem label="Jabatan" value={user.jabatan} icon={BadgeCheck} />
            <InfoItem label="Unit Kerja" value={user.unitKerja} icon={Building2} />
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6 lg:col-span-2">
            <p className="text-xs font-bold uppercase tracking-wide text-[#08783f]">
              Hak Akses
            </p>
            <h3 className="mt-1 text-lg font-black text-slate-950">
              Struktur Pengguna Internal
            </h3>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {roleNames.length > 0 ? (
                roleNames.map((roleName) => (
                  <div
                    key={roleName}
                    className="flex items-center gap-3 rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3"
                  >
                    <ShieldCheck
                      className="h-5 w-5 shrink-0 text-[#08783f]"
                      strokeWidth={2.25}
                    />
                    <span className="text-sm font-black text-slate-900">
                      {roleName}
                    </span>
                  </div>
                ))
              ) : (
                <div className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-500">
                  Belum ada role pengguna.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <p className="text-xs font-bold uppercase tracking-wide text-[#08783f]">
              Aktivitas Akun
            </p>
            <div className="mt-5 space-y-4">
              <div className="flex gap-3">
                <CalendarDays className="mt-0.5 h-5 w-5 shrink-0 text-[#08783f]" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    Akun Dibuat
                  </p>
                  <p className="mt-1 text-sm font-black text-slate-900">
                    {formatDate(user.createdAt)}
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#08783f]" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    Login Terakhir
                  </p>
                  <p className="mt-1 text-sm font-black text-slate-900">
                    {formatDate(user.lastLoginAt)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
