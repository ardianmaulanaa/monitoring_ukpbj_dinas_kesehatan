import {
  BadgeCheck,
  CalendarClock,
  CircleUserRound,
  IdCard,
  Mail,
  Phone,
  ShieldCheck,
  UserCog,
  type LucideIcon,
  UserRound,
} from "lucide-react";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import MobileProfileBackButton from "./MobileProfileBackButton";

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
    <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-[#08783f]">
        <Icon className="h-4 w-4" strokeWidth={2.3} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
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
  const primaryRole = roleNames[0] ?? "Belum ada role";
  const profileRows = [
    { icon: Mail, label: "Email", value: user.email },
    { icon: Phone, label: "Nomor Telepon", value: user.nomorTelepon },
    { icon: IdCard, label: "NIP", value: user.nip },
    { icon: UserRound, label: "Unit Kerja", value: user.unitKerja },
    { icon: ShieldCheck, label: "Jabatan", value: user.jabatan },
    {
      icon: CalendarClock,
      label: "Login Terakhir",
      value: formatDate(user.lastLoginAt),
    },
  ];

  return (
    <main className="min-h-screen bg-[#f4f7f5] px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl space-y-4 sm:space-y-5">
        <div className="flex w-full items-center lg:hidden">
          <MobileProfileBackButton />
        </div>

        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="grid h-1.5 grid-cols-3">
          <div className="bg-[#08783f]" />
          <div className="bg-[#f5bd20]" />
          <div className="bg-[#159cc3]" />
        </div>
        <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-[#08783f] text-3xl font-black text-white ring-4 ring-emerald-50">
              {initial}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-2xl font-black tracking-[-0.02em] text-slate-950">
                  {user.name}
                </h2>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-black text-emerald-700">
                  <BadgeCheck className="h-3.5 w-3.5" />
                  {user.status === "ACTIVE" ? "Aktif" : "Nonaktif"}
                </span>
              </div>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                {user.jabatan || "-"}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {roleNames.length > 0 ? (
                  roleNames.map((roleName) => (
                    <span
                      key={roleName}
                      className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-black text-[#08783f]"
                    >
                      <ShieldCheck className="h-3.5 w-3.5" />
                      {roleName}
                    </span>
                  ))
                ) : (
                  <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-black text-slate-500">
                    Belum ada role
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-3">
              <CircleUserRound className="h-5 w-5 text-[#08783f]" />
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
                  Akses Utama
                </p>
                <p className="text-sm font-black text-slate-800">
                  {primaryRole}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <UserCog className="h-5 w-5 text-[#08783f]" />
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
                  Unit
                </p>
                <p className="text-sm font-black text-slate-800">
                  {user.unitKerja || "-"}
                </p>
              </div>
            </div>
          </div>
        </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-black text-[#16227c]">Informasi Profil</h3>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Data ini mengikuti akun yang tersimpan di database.
            </p>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {profileRows.map((row) => (
            <ProfileRow
              key={row.label}
              icon={row.icon}
              label={row.label}
              value={row.value}
            />
          ))}
        </div>
        </section>
      </div>
    </main>
  );
}
