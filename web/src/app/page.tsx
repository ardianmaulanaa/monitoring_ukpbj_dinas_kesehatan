import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  ClipboardList,
  FileCheck2,
  FileClock,
  FileSearch,
  Landmark,
  Layers3,
  PackageCheck,
  SearchCheck,
  ShieldCheck,
  ShoppingCart,
  Truck,
  WalletCards,
} from "lucide-react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { ProductPreview } from "@/components/landing/ProductPreview";

export const metadata: Metadata = {
  title: "SIMUKPBJ | Monitoring Pengadaan Barang dan Jasa",
  description:
    "Sistem monitoring proses pengadaan barang dan jasa Laboratorium Kesehatan Dinas Kesehatan Provinsi Jawa Barat.",
};

const benefits = [
  {
    title: "Monitoring Terpusat",
    description: "Seluruh progres pengadaan dapat dipantau dalam satu sistem.",
    icon: Layers3,
  },
  {
    title: "Status Lebih Jelas",
    description:
      "Pengguna dapat mengetahui posisi setiap paket dalam workflow pengadaan.",
    icon: SearchCheck,
  },
  {
    title: "Dokumentasi Terstruktur",
    description:
      "Data dan dokumen terkait proses pengadaan tercatat berdasarkan tahapannya.",
    icon: FileCheck2,
  },
  {
    title: "Informasi Lebih Cepat",
    description: "Dashboard memberikan ringkasan proses yang mudah dipahami.",
    icon: FileClock,
  },
];

const lifecycleGroups = [
  {
    eyebrow: "Perencanaan",
    title: "Dari usulan sampai RUP tayang",
    description:
      "Kebutuhan unit diajukan, diverifikasi, lalu disusun menjadi RUP/SIRUP sebelum metode pengadaan final ditetapkan.",
    steps: [
      "Usulan Kebutuhan",
      "Verifikasi",
      "RUP / SIRUP",
      "Penetapan Metode",
    ],
    icon: ClipboardList,
  },
  {
    eyebrow: "Proses Pengadaan",
    title: "Metode berbeda, tetap satu kontrol",
    description:
      "Paket E-Purchasing, Tender, maupun Non-Tender dipantau sesuai jalur prosesnya tanpa mencampur konsep katalog dengan transaksi.",
    steps: ["E-Purchasing", "Tender", "Non-Tender", "Tindak Lanjut Paket"],
    icon: ShoppingCart,
  },
  {
    eyebrow: "Pelaksanaan",
    title: "Kontrak sampai pembayaran selesai",
    description:
      "Tahapan kontrak, pengiriman, pemeriksaan, BAST, dan pembayaran tersusun sehingga tindak lanjut lebih mudah dilihat.",
    steps: ["Kontrak / SP", "Pengiriman", "Pemeriksaan", "Pembayaran"],
    icon: PackageCheck,
  },
];

const methodCards = [
  {
    title: "E-Purchasing",
    description:
      "Memonitor transaksi dari RUP, produk katalog, penyedia, negosiasi, kontrak, pengiriman, pemeriksaan, hingga pembayaran.",
    icon: ShoppingCart,
  },
  {
    title: "Tender",
    description:
      "Memantau paket dengan metode tender sesuai tahap pemilihan dan tindak lanjut dokumennya.",
    icon: ShieldCheck,
  },
  {
    title: "Non-Tender",
    description:
      "Mengawal paket non-tender dan pengadaan langsung agar status, dokumen, dan penyelesaian tetap terlihat.",
    icon: ClipboardCheck,
  },
];

const features = [
  {
    title: "Pengelolaan Usulan",
    description: "Kelola dan pantau kebutuhan yang diajukan unit.",
    icon: ClipboardList,
  },
  {
    title: "Verifikasi Usulan",
    description: "Memastikan kelengkapan data sebelum proses selanjutnya.",
    icon: SearchCheck,
  },
  {
    title: "RUP & SIRUP",
    description: "Mengelola informasi perencanaan pengadaan.",
    icon: Landmark,
  },
  {
    title: "E-Purchasing",
    description: "Memonitor tahapan pembelian melalui metode elektronik.",
    icon: ShoppingCart,
  },
  {
    title: "Tender & Non Tender",
    description: "Memonitor paket berdasarkan metode pemilihan.",
    icon: ShieldCheck,
  },
  {
    title: "Kontrak & Surat Pesanan",
    description: "Mencatat proses setelah penetapan penyedia.",
    icon: FileCheck2,
  },
  {
    title: "Pengiriman & Pemeriksaan",
    description: "Memantau realisasi penyediaan barang/jasa.",
    icon: Truck,
  },
  {
    title: "Pembayaran",
    description: "Memonitor penyelesaian paket sampai tahap pembayaran.",
    icon: WalletCards,
  },
];

const planningPoints = [
  "Input usulan kebutuhan dari unit",
  "Verifikasi dan catatan tindak lanjut",
  "Penyusunan RUP dan data SIRUP",
  "Penetapan metode pengadaan final",
];

function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
}: {
  eyebrow: string;
  title: string;
  description: string;
  align?: "center" | "left";
}) {
  return (
    <div
      className={`max-w-3xl ${
        align === "center" ? "mx-auto text-center" : "text-left"
      }`}
    >
      <p className="text-xs font-black uppercase tracking-[0.24em] text-[#08783f]">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] text-slate-950 sm:text-4xl lg:text-5xl">
        {title}
      </h2>
      <p className="mt-4 text-base font-medium leading-7 text-slate-600 sm:text-lg">
        {description}
      </p>
    </div>
  );
}

function MiniDashboardPanel() {
  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#08783f]">
            Monitoring Dashboard
          </p>
          <h3 className="mt-1 text-xl font-black text-slate-950">
            Informasi paket dalam satu pandangan
          </h3>
        </div>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-[#08783f]">
          Preview
        </span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {["Total Paket", "Dalam Proses", "Perlu Tindak Lanjut"].map((label) => (
          <div
            key={label}
            className="rounded-2xl border border-slate-100 bg-[#f6f8f7] p-4"
          >
            <p className="text-xs font-black uppercase text-slate-400">
              {label}
            </p>
            <div className="mt-3 h-3 w-20 rounded-full bg-slate-200" />
            <div className="mt-2 h-3 w-14 rounded-full bg-emerald-100" />
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl border border-slate-100 bg-[#f6f8f7] p-4">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm font-black text-slate-800">
              Distribusi Metode
            </span>
            <span className="text-xs font-bold text-slate-400">
              Aman publik
            </span>
          </div>
          <div className="grid h-40 grid-cols-5 items-end gap-3">
            {[62, 44, 78, 56, 68].map((height, index) => (
              <span
                key={`${height}-${index}`}
                className="rounded-t-xl bg-[#08783f]"
                style={{ height: `${height}%` }}
                aria-hidden="true"
              />
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-[#f6f8f7] p-4">
          <div className="mb-4 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#08783f]">
              <BadgeCheck className="h-5 w-5" strokeWidth={2.4} />
            </span>
            <div>
              <p className="text-sm font-black text-slate-800">
                Riwayat Aktivitas
              </p>
              <p className="text-xs font-semibold text-slate-500">
                Status, waktu, dan tindak lanjut
              </p>
            </div>
          </div>
          <div className="space-y-3">
            {[
              "Usulan diverifikasi",
              "RUP ditayangkan",
              "Dokumen diperbarui",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <span className="h-2.5 w-2.5 rounded-full bg-[#08783f]" />
                <span className="text-sm font-bold text-slate-600">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <main className="landing-page-enter min-h-dvh overflow-x-hidden bg-white text-slate-900">
      <LandingNavbar />

      <section
        id="beranda"
        tabIndex={-1}
        className="landing-section relative overflow-hidden bg-[linear-gradient(180deg,#ffffff_0%,#f6f8f7_100%)]"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#9ab9a5_0.65px,transparent_0.65px)] bg-[size:28px_28px] opacity-[0.12]" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 pb-20 pt-16 sm:px-6 lg:grid-cols-[0.92fr_1.08fr] lg:px-8 lg:pb-28 lg:pt-24">
          <div className="max-w-3xl">
            <h1 className="landing-stagger landing-delay-1 mt-7 text-5xl font-black leading-[0.96] tracking-[-0.06em] text-slate-950 sm:text-6xl lg:text-7xl">
              Pengadaan Lebih Terpantau,{" "}
              <span className="text-[#08783f]">Terintegrasi</span>, dan
              Transparan.
            </h1>

            <p className="landing-stagger landing-delay-2 mt-6 max-w-2xl text-base font-medium leading-8 text-slate-600 sm:text-lg">
              SIMUKPBJ membantu Laboratorium Kesehatan Provinsi Jawa Barat
              memonitor proses pengadaan barang dan jasa secara terstruktur,
              mulai dari usulan kebutuhan hingga penyelesaian pengadaan dalam
              satu sistem.
            </p>

            <div className="landing-stagger landing-delay-3 mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/login"
                className="inline-flex h-[52px] items-center justify-center gap-2 rounded-full bg-[#08783f] px-6 text-sm font-black text-white shadow-[0_20px_42px_rgba(8,120,63,0.24)] hover:bg-[#066532] sm:w-auto"
              >
                Masuk Sistem
                <ArrowRight className="h-4 w-4" strokeWidth={2.6} />
              </Link>
              <a
                href="#alur-pengadaan"
                className="inline-flex h-[52px] items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-6 text-sm font-black text-slate-700 shadow-sm hover:border-emerald-200 hover:bg-emerald-50 hover:text-[#08783f] sm:w-auto"
              >
                Lihat Alur Pengadaan
                <ChevronRight className="h-4 w-4" strokeWidth={2.6} />
              </a>
            </div>
          </div>

          <div className="landing-stagger landing-delay-4">
            <ProductPreview />
          </div>
        </div>
      </section>

      <section
        id="tentang-sistem"
        tabIndex={-1}
        className="landing-section bg-white px-4 py-20 sm:px-6 lg:px-8"
      >
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            eyebrow="SIMUKPBJ"
            title="Satu sistem untuk memonitor seluruh proses pengadaan"
            description="SIMUKPBJ dirancang sebagai control tower internal agar progres, status, dokumen, dan tindak lanjut pengadaan dapat dilihat lebih jelas oleh tim terkait."
          />

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map((benefit) => {
              const Icon = benefit.icon;

              return (
                <article
                  key={benefit.title}
                  className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-950/5"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-[#08783f]">
                    <Icon className="h-5 w-5" strokeWidth={2.4} />
                  </span>
                  <h3 className="mt-5 text-lg font-black text-slate-950">
                    {benefit.title}
                  </h3>
                  <p className="mt-3 text-sm font-medium leading-6 text-slate-600">
                    {benefit.description}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section
        id="alur-pengadaan"
        tabIndex={-1}
        className="landing-section bg-[#f6f8f7] px-4 py-20 sm:px-6 lg:px-8"
      >
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            eyebrow="Alur Pengadaan"
            title="Pantau proses dari usulan hingga pembayaran"
            description="Alur dibuat mengikuti proses internal: RUP tetap menjadi konteks sebelum paket masuk ke E-Purchasing, Tender, atau Non-Tender."
          />

          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {lifecycleGroups.map((group, groupIndex) => {
              const Icon = group.icon;

              return (
                <article
                  key={group.title}
                  className="rounded-[1.6rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-950/5"
                >
                  <div className="flex items-start gap-4">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#08783f] text-white">
                      <Icon className="h-5 w-5" strokeWidth={2.4} />
                    </span>
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#08783f]">
                        {String(groupIndex + 1).padStart(2, "0")}{" "}
                        {group.eyebrow}
                      </p>
                      <h3 className="mt-2 text-xl font-black tracking-[-0.03em] text-slate-950">
                        {group.title}
                      </h3>
                    </div>
                  </div>

                  <p className="mt-5 text-sm font-medium leading-6 text-slate-600">
                    {group.description}
                  </p>

                  <div className="mt-6 space-y-3">
                    {group.steps.map((step, index) => (
                      <div key={step} className="flex items-center gap-3">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-xs font-black text-[#08783f]">
                          {index + 1}
                        </span>
                        <span className="text-sm font-black text-slate-700">
                          {step}
                        </span>
                      </div>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="landing-section bg-white px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          <SectionHeading
            eyebrow="Perencanaan"
            title="Perencanaan yang lebih terstruktur"
            description="Tahap awal pengadaan tetap dimulai dari kebutuhan unit. SIMUKPBJ membantu menjaga konteks usulan, verifikasi, RUP, dan metode final tetap tersambung."
            align="left"
          />

          <div className="rounded-[1.5rem] border border-slate-200 bg-[#f6f8f7] p-5 shadow-sm">
            <div className="rounded-[1.25rem] bg-white p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                {planningPoints.map((point) => (
                  <div key={point} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-[#08783f]">
                      <CheckCircle2 className="h-4 w-4" strokeWidth={2.6} />
                    </span>
                    <p className="text-sm font-bold leading-6 text-slate-700">
                      {point}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-section bg-[#f6f8f7] px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            eyebrow="Proses Pengadaan"
            title="Setiap metode, tetap dapat dipantau dalam satu sistem"
            description="Terminologi mengikuti modul aplikasi: E-Purchasing adalah workflow transaksi, sedangkan katalog menjadi sumber produk di dalam proses tersebut."
          />

          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {methodCards.map((method) => {
              const Icon = method.icon;

              return (
                <article
                  key={method.title}
                  className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-950/5"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-[#08783f]">
                    <Icon className="h-5 w-5" strokeWidth={2.4} />
                  </span>
                  <h3 className="mt-5 text-xl font-black text-slate-950">
                    {method.title}
                  </h3>
                  <p className="mt-3 text-sm font-medium leading-6 text-slate-600">
                    {method.description}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="landing-section bg-white px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[0.95fr_1.05fr]">
          <div>
            <SectionHeading
              eyebrow="Monitoring"
              title="Informasi penting, terlihat dalam satu pandangan"
              description="Dashboard SIMUKPBJ memberikan ringkasan kondisi pengadaan sehingga tim dapat dengan cepat melihat paket yang baru diajukan, sedang diproses, membutuhkan tindak lanjut, maupun telah selesai."
              align="left"
            />

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {[
                "Monitoring progres",
                "Status paket",
                "Rekap proses",
                "Distribusi metode pengadaan",
                "Histori aktivitas",
                "Monitoring penyelesaian",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-[#08783f]">
                    <CheckCircle2 className="h-4 w-4" strokeWidth={2.6} />
                  </span>
                  <span className="text-sm font-black text-slate-700">
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <MiniDashboardPanel />
        </div>
      </section>

      <section
        id="fitur"
        tabIndex={-1}
        className="landing-section bg-[#f6f8f7] px-4 py-20 sm:px-6 lg:px-8"
      >
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            eyebrow="Fitur"
            title="Modul utama yang mendukung monitoring PBJ"
            description="Landing page ini hanya menjelaskan modul yang sudah menjadi bagian sistem internal, tanpa membuka data sensitif ke publik."
          />

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <article
                  key={feature.title}
                  className="rounded-[1.35rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/5"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-[#08783f]">
                    <Icon className="h-5 w-5" strokeWidth={2.4} />
                  </span>
                  <h3 className="mt-4 text-base font-black text-slate-950">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm font-medium leading-6 text-slate-600">
                    {feature.description}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="landing-section bg-white px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl items-center gap-10 rounded-[2rem] border border-emerald-900/10 bg-[#f6f8f7] p-6 sm:p-8 lg:grid-cols-[0.85fr_1.15fr] lg:p-10">
          <SectionHeading
            eyebrow="Transparansi"
            title="Proses lebih jelas. Informasi lebih mudah ditelusuri."
            description="Sistem membantu tim melihat status setiap proses, waktu pembaruan, riwayat perubahan, dan dokumen terkait sesuai data yang tersedia di aplikasi."
            align="left"
          />

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              "Status setiap proses",
              "Timestamp pembaruan",
              "Riwayat perubahan",
              "Dokumen terkait",
            ].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-white bg-white p-5 shadow-sm"
              >
                <FileSearch
                  className="h-5 w-5 text-[#08783f]"
                  strokeWidth={2.4}
                />
                <p className="mt-4 text-sm font-black text-slate-800">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-section bg-white px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-[#056a33] p-8 text-white shadow-[0_28px_80px_rgba(5,106,51,0.24)] sm:p-10 lg:p-14">
          <div className="grid items-center gap-8 lg:grid-cols-[1fr_auto]">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-green-100">
                SIMUKPBJ
              </p>
              <h2 className="mt-3 max-w-3xl text-3xl font-black tracking-[-0.04em] sm:text-4xl lg:text-5xl">
                Kelola dan pantau proses pengadaan dalam satu sistem.
              </h2>
              <p className="mt-4 max-w-2xl text-base font-medium leading-7 text-green-50">
                Masuk ke SIMUKPBJ untuk melanjutkan pengelolaan dan monitoring
                proses pengadaan.
              </p>
            </div>

            <Link
              href="/login"
              className="inline-flex h-[52px] items-center justify-center gap-2 rounded-full bg-white px-6 text-sm font-black text-[#056a33] shadow-lg shadow-emerald-950/20 hover:bg-emerald-50"
            >
              Login
              <ArrowRight className="h-4 w-4" strokeWidth={2.6} />
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-[#f6f8f7] px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <BrandLogo variant="footer" />
            <p className="mt-4 max-w-md text-sm font-medium leading-6 text-slate-600">
              Sistem Monitoring Pengadaan Barang/Jasa Laboratorium Kesehatan
              Dinas Kesehatan Provinsi Jawa Barat.
            </p>
          </div>

          <p className="text-sm font-semibold text-slate-500">
            © 2026 Dinas Kesehatan Provinsi Jawa Barat
          </p>
        </div>
      </footer>
    </main>
  );
}
