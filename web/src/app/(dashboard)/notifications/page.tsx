import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  CheckCircle2,
  Clock3,
  Info,
} from "lucide-react";
import AppHeader from "@/app/(dashboard)/_shared/AppHeader";
import { getNotificationSummary } from "@/lib/notifications";

export const dynamic = "force-dynamic";

function toneClasses(tone: "info" | "warning" | "danger") {
  if (tone === "danger") {
    return {
      badge: "bg-red-100 text-red-700",
      dot: "bg-red-500",
      icon: "bg-red-50 text-red-600",
      Icon: AlertTriangle,
    };
  }

  if (tone === "warning") {
    return {
      badge: "bg-amber-100 text-amber-700",
      dot: "bg-amber-500",
      icon: "bg-amber-50 text-amber-600",
      Icon: Clock3,
    };
  }

  return {
    badge: "bg-cyan-100 text-cyan-700",
    dot: "bg-[#159cc3]",
    icon: "bg-cyan-50 text-[#159cc3]",
    Icon: Info,
  };
}

export default async function NotificationsPage() {
  const notifications = await getNotificationSummary();

  return (
    <>
      <AppHeader
        title="Notifikasi"
        subtitle="Pengajuan, persetujuan, dan tindak lanjut yang perlu dicek."
        rightLabel="Inbox"
      />

      <main className="px-4 py-5 sm:px-6 lg:px-8">
        <section className="mb-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                  Total Notifikasi
                </p>
                <p className="mt-2 text-3xl font-black text-slate-950">
                  {notifications.total}
                </p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-50 text-[#08783f]">
                <Bell className="h-5 w-5" strokeWidth={2.5} />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:col-span-2">
            <p className="text-sm font-black text-slate-900">
              Pusat notifikasi pengajuan
            </p>
            <p className="mt-1 max-w-3xl text-sm font-semibold leading-6 text-slate-500">
              Notifikasi di kanan atas tetap tampil sebagai penanda cepat.
              Detail pengajuan baru, draft, deadline, dan tindak lanjut masuk
              ke halaman ini.
            </p>
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-4 py-4 sm:px-5">
            <h2 className="text-sm font-black text-slate-950">
              Daftar Notifikasi
            </h2>
            <p className="mt-1 text-xs font-semibold text-slate-400">
              Klik item untuk membuka halaman sumber pengajuan.
            </p>
          </div>

          {notifications.items.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {notifications.items.map((item) => {
                const tone = toneClasses(item.tone);
                const Icon = tone.Icon;

                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className="grid gap-3 px-4 py-4 transition hover:bg-emerald-50/70 sm:grid-cols-[auto_1fr_auto] sm:items-center sm:px-5"
                  >
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-lg ${tone.icon}`}
                    >
                      <Icon className="h-5 w-5" strokeWidth={2.4} />
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`h-2.5 w-2.5 rounded-full ${tone.dot}`} />
                        <h3 className="text-sm font-black text-slate-900">
                          {item.title}
                        </h3>
                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] font-black ${tone.badge}`}
                        >
                          {item.count} baru
                        </span>
                      </div>
                      <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
                        {item.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-black text-[#08783f] sm:justify-end">
                      Buka
                      <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center px-4 py-14 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-[#08783f]">
                <CheckCircle2 className="h-6 w-6" strokeWidth={2.5} />
              </div>
              <p className="text-sm font-black text-slate-800">
                Tidak ada notifikasi
              </p>
              <p className="mt-1 max-w-md text-sm font-semibold leading-6 text-slate-400">
                Belum ada pengajuan baru, draft, deadline, atau tindak lanjut
                yang perlu dicek.
              </p>
            </div>
          )}
        </section>
      </main>
    </>
  );
}
