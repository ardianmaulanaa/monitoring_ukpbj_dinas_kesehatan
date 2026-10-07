import {
  CheckCircle2,
  ClipboardList,
  FileCheck2,
  LineChart,
  PackageCheck,
} from "lucide-react";

const previewRows = [
  {
    code: "RUP",
    name: "Biological Safety Cabinet",
    stage: "E-Purchasing",
    status: "Proses",
  },
  {
    code: "USULAN",
    name: "Reagen dan bahan uji",
    stage: "Verifikasi",
    status: "Review",
  },
  {
    code: "KONTRAK",
    name: "Pemeliharaan alat lab",
    stage: "Kontrak / SP",
    status: "Tindak lanjut",
  },
];

const microCards = [
  { label: "Usulan", value: "Status dipantau", icon: ClipboardList },
  { label: "Proses", value: "Tahap terlihat", icon: PackageCheck },
  { label: "Selesai", value: "Riwayat tercatat", icon: CheckCircle2 },
];

export function ProductPreview() {
  return (
    <div className="relative mx-auto w-full max-w-[640px] lg:mx-0">
      <div className="absolute -left-5 top-12 hidden rounded-2xl border border-white/70 bg-white/90 p-4 shadow-[0_18px_45px_rgba(15,23,42,0.12)] backdrop-blur sm:block">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-[#08783f]">
            <LineChart className="h-5 w-5" strokeWidth={2.4} />
          </span>
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">
              Monitoring
            </p>
            <p className="text-sm font-black text-slate-950">
              Ringkasan proses
            </p>
          </div>
        </div>
      </div>

      <div className="absolute -right-3 bottom-8 hidden rounded-2xl border border-white/70 bg-white/90 p-4 shadow-[0_18px_45px_rgba(15,23,42,0.12)] backdrop-blur md:block">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <FileCheck2 className="h-5 w-5" strokeWidth={2.4} />
          </span>
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">
              Dokumen
            </p>
            <p className="text-sm font-black text-slate-950">
              Tersusun per tahap
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-[1.75rem] border border-emerald-900/10 bg-white shadow-[0_34px_90px_rgba(15,23,42,0.16)]">
        <div className="flex h-12 items-center gap-2 border-b border-slate-100 bg-slate-50/90 px-5">
          <span className="h-3 w-3 rounded-full bg-red-300" />
          <span className="h-3 w-3 rounded-full bg-amber-300" />
          <span className="h-3 w-3 rounded-full bg-emerald-400" />
          <span className="ml-3 truncate rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-400">
            simukpbj.dinkes-jabar.local/dashboard
          </span>
        </div>

        <div className="bg-[linear-gradient(135deg,#f7fbf8_0%,#ffffff_46%,#eef8f2_100%)] p-4 sm:p-6">
          <div className="grid gap-3 sm:grid-cols-3">
            {microCards.map((card) => {
              const Icon = card.icon;

              return (
                <div
                  key={card.label}
                  className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-[#08783f]">
                      <Icon className="h-[18px] w-[18px]" strokeWidth={2.4} />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-slate-950">
                        {card.label}
                      </p>
                      <p className="truncate text-xs font-semibold text-slate-500">
                        {card.value}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#08783f]">
                  Dashboard SIMUKPBJ
                </p>
                <h3 className="mt-1 text-xl font-black tracking-[-0.03em] text-slate-950">
                  Paket pengadaan aktif
                </h3>
              </div>
              <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-black text-[#08783f]">
                Preview UI
              </span>
            </div>

            <div className="mt-5 space-y-3">
              {previewRows.map((row) => (
                <div
                  key={`${row.code}-${row.name}`}
                  className="grid gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-3 text-sm sm:grid-cols-[84px_minmax(0,1fr)_120px_100px] sm:items-center"
                >
                  <span className="font-black text-[#08783f]">{row.code}</span>
                  <span className="min-w-0 font-bold text-slate-800">
                    {row.name}
                  </span>
                  <span className="text-xs font-black text-slate-500">
                    {row.stage}
                  </span>
                  <span className="w-fit rounded-full bg-white px-3 py-1 text-xs font-black text-slate-600 ring-1 ring-slate-200">
                    {row.status}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-5 grid h-28 grid-cols-8 items-end gap-2 rounded-2xl bg-[#f6f8f7] p-4">
              {[38, 52, 44, 72, 58, 84, 66, 76].map((height, index) => (
                <span
                  key={`${height}-${index}`}
                  className="rounded-t-lg bg-[#08783f]"
                  style={{ height: `${height}%` }}
                  aria-hidden="true"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
