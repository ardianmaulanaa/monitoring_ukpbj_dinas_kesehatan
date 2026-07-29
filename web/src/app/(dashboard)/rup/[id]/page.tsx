import Link from "next/link";
import { notFound } from "next/navigation";
import AppHeader from "@/app/(dashboard)/_shared/AppHeader";
import { formatCurrency } from "@/lib/currency";
import { prisma } from "@/lib/prisma";

type RupDetailPageProps = {
  params: Promise<{ id: string }>;
};

function labelize(value: string) {
  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default async function Page({ params }: RupDetailPageProps) {
  const { id } = await params;
  const rup = await prisma.rencanaUmumPengadaan.findUnique({
    where: { id },
  });

  if (!rup) notFound();

  const rows = [
    ["Kode RUP", rup.kodeRup],
    ["Nama Paket", rup.namaPaket],
    ["Unit Pengusul", rup.unitPengusul],
    ["Sumber Dana", rup.sumberDana],
    ["Pagu", formatCurrency(rup.pagu.toString())],
    ["Metode Pengadaan", labelize(rup.metodePengadaan)],
    ["Jadwal Pemilihan", rup.jadwalPemilihan || "-"],
    ["Tahun Anggaran", `TA ${rup.tahunAnggaran}`],
    ["Status SIRUP", labelize(rup.statusSirup)],
    ["Catatan", rup.catatan || "-"],
  ];

  return (
    <>
      <AppHeader
        title="Detail RUP"
        subtitle={rup.namaPaket}
        rightLabel="Perencanaan"
      />

      <main className="bg-[#f4f7f5] px-4 py-6 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h1 className="text-lg font-black text-[#16227c]">
              Detail Rencana Umum Pengadaan
            </h1>
            <Link
              href="/rup"
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-black text-slate-600 transition hover:bg-slate-50"
            >
              Kembali
            </Link>
          </div>

          <dl className="divide-y divide-slate-100">
            {rows.map(([label, value]) => (
              <div
                key={label}
                className="grid gap-2 px-5 py-4 md:grid-cols-[220px_minmax(0,1fr)]"
              >
                <dt className="text-xs font-black uppercase tracking-wide text-slate-400">
                  {label}
                </dt>
                <dd className="font-bold text-slate-700">{value}</dd>
              </div>
            ))}
          </dl>
        </section>
      </main>
    </>
  );
}
