import Image from "next/image";

type BrandLogoProps = {
  variant?: "navbar" | "footer" | "compact";
  className?: string;
};

const logoSrc = "/app/logo-dinkes.png";

export function BrandLogo({
  variant = "navbar",
  className = "",
}: BrandLogoProps) {
  const compact = variant === "compact";
  const footer = variant === "footer";

  return (
    <div className={`flex min-w-0 items-center gap-3 ${className}`}>
      <div
        className={`flex shrink-0 items-center justify-center rounded-2xl border border-emerald-100 bg-white p-1.5 shadow-sm ${
          compact ? "h-10 w-10" : footer ? "h-12 w-12" : "h-11 w-11"
        }`}
      >
        <Image
          src={logoSrc}
          alt="Logo Dinas Kesehatan Provinsi Jawa Barat"
          width={48}
          height={48}
          priority={variant === "navbar"}
          className="h-full w-full object-contain"
          style={{ width: "100%", height: "auto" }}
        />
      </div>

      {!compact ? (
        <div className="min-w-0">
          <p className="truncate text-[10px] font-black uppercase tracking-[0.2em] text-[#08783f]">
            SIMUKPBJ
          </p>
          <p
            className={`truncate font-black tracking-[-0.03em] text-slate-950 ${
              footer ? "text-lg" : "text-base"
            }`}
          >
            Dinkes Jabar
          </p>
        </div>
      ) : null}
    </div>
  );
}
