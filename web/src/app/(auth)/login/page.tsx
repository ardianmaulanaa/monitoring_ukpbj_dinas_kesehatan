"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      setError("Email dan password wajib diisi.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: normalizedEmail,
          password,
        }),
      });

      const result = (await response.json()) as {
        success?: boolean;
        message?: string;
      };

      if (!response.ok || !result.success) {
        setError(result.message ?? "Email atau password salah.");
        return;
      }

      router.replace("/dashboard");
      router.refresh();
    } catch {
      setError("Tidak dapat menghubungi server. Coba lagi sebentar.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="fixed inset-0 h-[100dvh] max-h-[100dvh] overflow-hidden overscroll-none bg-[#f2f7f3] text-slate-900">
      {/* Garis identitas Dinkes */}
      <div className="absolute inset-x-0 top-0 z-40 grid h-1.5 grid-cols-3">
        <div className="bg-[#08783f]" />
        <div className="bg-[#f5bd20]" />
        <div className="bg-[#159cc3]" />
      </div>

      {/* Background mobile */}
      <div className="absolute inset-0 lg:hidden">
        <div className="absolute inset-0 bg-[linear-gradient(160deg,#f8fbf8_0%,#eef6f1_48%,#e4f0e8_100%)]" />

        <div className="absolute inset-0 bg-[radial-gradient(#8fb39d_0.65px,transparent_0.65px)] bg-[size:24px_24px] opacity-[0.13]" />

        <div className="absolute -right-28 -top-24 h-72 w-72 rounded-full bg-[#f5bd20]/10 blur-3xl" />

        <div className="absolute -bottom-28 -left-24 h-72 w-72 rounded-full bg-[#159cc3]/10 blur-3xl" />
      </div>

      <section className="relative z-10 grid h-full min-h-0 lg:grid-cols-[1.04fr_0.96fr]">
        {/* Panel identitas desktop */}
        <aside className="relative hidden h-full min-h-0 overflow-hidden bg-[#08783f] text-white lg:flex">
          <div className="absolute inset-0 bg-[linear-gradient(145deg,#0a8847_0%,#08783f_48%,#045b30_100%)]" />

          <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full border-[65px] border-[#f5bd20]/10" />

          <div className="absolute -bottom-40 -left-32 h-[430px] w-[430px] rounded-full border-[75px] border-[#159cc3]/10" />

          <div className="absolute right-[12%] top-[28%] h-52 w-52 rounded-full bg-[#f5bd20]/10 blur-3xl" />

          <div className="absolute bottom-[15%] right-[13%] grid grid-cols-5 gap-4 opacity-20">
            {Array.from({ length: 25 }).map((_, index) => (
              <span
                key={index}
                className="h-1.5 w-1.5 rounded-full bg-[#f5bd20]"
              />
            ))}
          </div>

          <div className="relative z-10 flex h-full w-full min-h-0 flex-col px-10 pb-9 pt-10 xl:px-16 xl:pb-11 xl:pt-12">
            {/* Identitas */}
            <header className="flex shrink-0 items-center gap-4">
              <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-2xl bg-white p-2 shadow-[0_16px_36px_rgba(0,0,0,0.18)] xl:h-[76px] xl:w-[76px]">
                <Image
                  src="/app/logo-dinkes.png"
                  alt="Logo Dinas Kesehatan Jawa Barat"
                  width={70}
                  height={70}
                  priority
                  className="h-full w-full object-contain"
                />
              </div>

              <div className="min-w-0">
                <p className="truncate text-[11px] font-bold uppercase tracking-[0.18em] text-green-100 xl:text-xs">
                  Pemerintah Provinsi Jawa Barat
                </p>

                <h1 className="mt-1 text-lg font-black">Dinas Kesehatan</h1>
              </div>
            </header>

            {/* Judul utama */}
            <div className="flex min-h-0 flex-1 items-center">
              <div className="max-w-2xl">
                <div className="mb-5 flex items-center gap-4">
                  <span className="h-1.5 w-12 rounded-full bg-[#f5bd20] xl:w-14" />

                  <p className="text-[11px] font-black uppercase tracking-[0.26em] text-green-100 xl:text-xs">
                    Portal PBJ
                  </p>
                </div>

                <h2 className="animate-dinkes text-5xl font-black leading-[0.92] tracking-[-0.06em] xl:text-7xl">
                  Dinkes
                  <span className="block text-[#f5bd20]">Jabar</span>
                </h2>

                <p className="mt-6 max-w-lg text-lg font-semibold leading-7 text-green-50 xl:text-xl xl:leading-8">
                  Sistem Pengelolaan Pengadaan Barang dan Jasa
                </p>
              </div>
            </div>

            {/* Footer panel */}
            <footer className="flex shrink-0 items-center gap-4 border-t border-white/15 pt-5 xl:pt-6">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[#f5bd20]">
                <ShieldCheck className="h-6 w-6" strokeWidth={2} />
              </div>

              <div>
                <p className="text-sm font-bold">Pengadaan Barang/Jasa</p>

                <p className="mt-1 text-xs text-green-100">
                  Dinas Kesehatan Provinsi Jawa Barat
                </p>
              </div>
            </footer>
          </div>

          {/* Pemisah lengkung */}
          <div className="absolute -right-14 top-0 h-full w-28 rounded-l-[100%] bg-[#f2f7f3]" />
        </aside>

        {/* Area login */}
        <div className="relative flex h-full min-h-0 flex-col overflow-hidden">
          {/* Background desktop */}
          <div className="absolute inset-0 hidden lg:block">
            <div className="absolute inset-0 bg-[radial-gradient(#9ab9a5_0.7px,transparent_0.7px)] bg-[size:27px_27px] opacity-[0.14]" />

            <div className="absolute -right-24 top-12 h-72 w-72 rounded-full bg-[#f5bd20]/10 blur-3xl" />

            <div className="absolute -bottom-28 left-8 h-72 w-72 rounded-full bg-[#159cc3]/10 blur-3xl" />
          </div>

          {/*
            Satu-satunya area yang boleh scroll.
            Tingginya tetap dibatasi viewport.
          */}
          <div className="relative z-10 h-full min-h-0 overflow-y-auto overscroll-contain [scrollbar-width:thin]">
            <div className="flex min-h-full w-full items-center justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-5 sm:px-6 sm:py-6 lg:px-10 lg:py-8 xl:px-14">
              <div className="w-full max-w-[470px]">
                {/* Identitas mobile */}
                <header className="mb-4 flex items-center justify-between gap-3 lg:hidden">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white p-1 shadow-[0_8px_22px_rgba(8,120,63,0.12)] ring-1 ring-green-100 sm:h-14 sm:w-14 sm:rounded-2xl">
                      <Image
                        src="/app/logo-dinkes.png"
                        alt="Logo Dinas Kesehatan Jawa Barat"
                        width={52}
                        height={52}
                        priority
                        className="h-full w-full object-contain"
                      />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-[9px] font-black uppercase tracking-[0.16em] text-[#08783f] sm:text-[10px]">
                        Pemerintah Provinsi Jawa Barat
                      </p>

                      <h1 className="mt-0.5 truncate text-base font-black text-slate-950 sm:text-lg">
                        Dinkes Jabar
                      </h1>

                      <p className="truncate text-[11px] font-medium text-slate-500 sm:text-xs">
                        Pengadaan Barang/Jasa
                      </p>
                    </div>
                  </div>

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#08783f] text-white shadow-[0_8px_20px_rgba(8,120,63,0.18)] sm:h-11 sm:w-11">
                    <ShieldCheck className="h-5 w-5" strokeWidth={2.2} />
                  </div>
                </header>

                {/* Kartu login */}
                <div className="overflow-hidden rounded-[1.65rem] border border-white bg-white shadow-[0_24px_65px_rgba(4,94,50,0.14)] sm:rounded-[2rem]">
                  <div className="grid grid-cols-3">
                    <div className="h-1.5 bg-[#08783f] sm:h-2" />
                    <div className="h-1.5 bg-[#f5bd20] sm:h-2" />
                    <div className="h-1.5 bg-[#159cc3] sm:h-2" />
                  </div>

                  <div className="px-5 py-5 sm:px-8 sm:py-7 xl:px-9 xl:py-8">
                    {/* Header form */}
                    <div className="mb-5 sm:mb-6">
                      <p className="mb-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-[#08783f] sm:mb-2 sm:text-xs">
                        Login
                      </p>

                      <h2 className="text-2xl font-black tracking-[-0.04em] text-slate-950 sm:text-3xl">
                        Masuk ke sistem
                      </h2>

                      <p className="mt-1.5 text-xs leading-5 text-slate-500 sm:mt-2 sm:text-sm sm:leading-6">
                        Masukkan email dan password akun Anda.
                      </p>
                    </div>

                    <form
                      onSubmit={handleLogin}
                      className="space-y-3.5 sm:space-y-4"
                    >
                      {/* Email */}
                      <div>
                        <label
                          htmlFor="email"
                          className="mb-1.5 block text-xs font-bold text-slate-700 sm:mb-2 sm:text-sm"
                        >
                          Email
                        </label>

                        <div className="group relative">
                          <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition group-focus-within:text-[#08783f]">
                            <Mail className="h-5 w-5" strokeWidth={2} />
                          </div>

                          <input
                            id="email"
                            type="email"
                            autoComplete="email"
                            inputMode="email"
                            placeholder="Masukkan email"
                            value={email}
                            onChange={(event) => {
                              setEmail(event.target.value);

                              if (error) {
                                setError("");
                              }
                            }}
                            className="h-12 w-full rounded-xl border border-slate-200 bg-[#f8fbf8] pl-12 pr-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-[#afd0bc] focus:border-[#08783f] focus:bg-white focus:ring-4 focus:ring-[#08783f]/10 sm:h-14 sm:rounded-2xl"
                          />
                        </div>
                      </div>

                      {/* Password */}
                      <div>
                        <label
                          htmlFor="password"
                          className="mb-1.5 block text-xs font-bold text-slate-700 sm:mb-2 sm:text-sm"
                        >
                          Password
                        </label>

                        <div className="group relative">
                          <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition group-focus-within:text-[#08783f]">
                            <LockKeyhole className="h-5 w-5" strokeWidth={2} />
                          </div>

                          <input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            autoComplete="current-password"
                            placeholder="Masukkan password"
                            value={password}
                            onChange={(event) => {
                              setPassword(event.target.value);

                              if (error) {
                                setError("");
                              }
                            }}
                            className="h-12 w-full rounded-xl border border-slate-200 bg-[#f8fbf8] pl-12 pr-12 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-[#afd0bc] focus:border-[#08783f] focus:bg-white focus:ring-4 focus:ring-[#08783f]/10 sm:h-14 sm:rounded-2xl"
                          />

                          <button
                            type="button"
                            onClick={() =>
                              setShowPassword((current) => !current)
                            }
                            className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-green-50 hover:text-[#08783f] sm:right-3 sm:rounded-xl"
                            aria-label={
                              showPassword
                                ? "Sembunyikan password"
                                : "Tampilkan password"
                            }
                            title={
                              showPassword
                                ? "Sembunyikan password"
                                : "Tampilkan password"
                            }
                          >
                            {showPassword ? (
                              <EyeOff className="h-5 w-5" strokeWidth={2} />
                            ) : (
                              <Eye className="h-5 w-5" strokeWidth={2} />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Error */}
                      {error && (
                        <div
                          role="alert"
                          className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-semibold text-red-700 sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm"
                        >
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100 text-xs font-black">
                            !
                          </span>

                          <span>{error}</span>
                        </div>
                      )}

                      {/* Tombol login */}
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="group flex h-12 w-full items-center justify-center gap-2.5 rounded-xl bg-[#08783f] px-5 text-sm font-black text-white shadow-[0_12px_28px_rgba(8,120,63,0.23)] transition duration-300 hover:bg-[#066532] active:scale-[0.98] sm:h-14 sm:gap-3 sm:rounded-2xl"
                      >
                        {isSubmitting ? "Memeriksa akun..." : "Masuk ke Dashboard"}
                        <ArrowRight
                          className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1"
                          strokeWidth={2.2}
                        />
                      </button>
                    </form>
                  </div>

                  <footer className="border-t border-slate-100 bg-[#fafcf9] px-4 py-2.5 text-center sm:px-6 sm:py-3">
                    <p className="text-[10px] text-slate-400 sm:text-xs">
                      © 2026 Dinas Kesehatan Provinsi Jawa Barat
                    </p>
                  </footer>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
