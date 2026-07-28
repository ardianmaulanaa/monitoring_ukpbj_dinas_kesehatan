import {
  BadgeCheck,
  CalendarClock,
  IdCard,
  Mail,
  Phone,
  ShieldCheck,
  type LucideIcon,
  UserRound,
} from "lucide-react";
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

function ProfileRow({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value?: string | null;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
        <Icon className="h-4 w-4" strokeWidth={2.3} />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
          {label}
        </p>
        <p className="mt-1 break-words text-sm font-semibold text-slate-800">
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

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="h-2 bg-gradient-to-r from-[#08783f] via-[#f5bd20] to-[#159cc3]" />
        <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-6">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-[#08783f] text-3xl font-black text-white ring-4 ring-emerald-50">
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-black tracking-[-0.03em] text-slate-950">
                {user.name}
              </h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                <BadgeCheck className="h-3.5 w-3.5" />
                {user.status === "ACTIVE" ? "Aktif" : "Nonaktif"}
              </span>
            </div>
            <p className="mt-1 text-sm font-medium text-slate-500">
              {user.jabatan || "Pengguna Sistem"}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {roleNames.length > 0 ? (
                roleNames.map((roleName) => (
                  <span
                    key={roleName}
                    className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-[#08783f]"
                  >
                    <ShieldCheck className="h-3.5 w-3.5" />
                    {roleName}
                  </span>
                ))
              ) : (
                <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-bold text-slate-500">
                  Belum ada role
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <ProfileRow icon={Mail} label="Email" value={user.email} />
        <ProfileRow icon={Phone} label="Nomor Telepon" value={user.nomorTelepon} />
        <ProfileRow icon={IdCard} label="NIP" value={user.nip} />
        <ProfileRow icon={UserRound} label="Unit Kerja" value={user.unitKerja} />
        <ProfileRow icon={ShieldCheck} label="Jabatan" value={user.jabatan} />
        <ProfileRow
          icon={CalendarClock}
          label="Login Terakhir"
          value={formatDate(user.lastLoginAt)}
        />
      </section>
    </div>
  );
}
