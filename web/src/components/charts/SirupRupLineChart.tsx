"use client";

import { useEffect, useRef } from "react";
import Chart from "chart.js/auto";

type SirupRupLineChartProps = {
  labels: string[];
  paguData: number[];
  packageData: number[];
  latestPagu: number;
  primarySourceFund?: string;
  totalPackages: number;
  totalPagu: number;
};

const CHART_COLORS = {
  pagu: "#16227c",
  package: "#08783f",
  axis: "#64748b",
  grid: "rgba(148, 163, 184, 0.22)",
  tooltip: "#0f172a",
};

function formatCompactCurrency(value: number) {
  if (value >= 1_000_000_000) {
    return `Rp ${(value / 1_000_000_000).toLocaleString("id-ID", {
      maximumFractionDigits: 1,
    })} M`;
  }

  if (value >= 1_000_000) {
    return `Rp ${(value / 1_000_000).toLocaleString("id-ID", {
      maximumFractionDigits: 1,
    })} jt`;
  }

  return value.toLocaleString("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  });
}

export default function SirupRupLineChart({
  labels,
  paguData,
  packageData,
  latestPagu,
  primarySourceFund,
  totalPackages,
  totalPagu,
}: SirupRupLineChartProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!canvasRef.current || labels.length === 0) return;

    const context = canvasRef.current.getContext("2d");
    if (!context) return;

    const maxPagu = Math.max(...paguData, 0);
    const maxPackage = Math.max(...packageData, 0);

    const chart = new Chart(context, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Total Pagu",
            backgroundColor: CHART_COLORS.pagu,
            borderColor: CHART_COLORS.pagu,
            borderWidth: 2.5,
            data: paguData,
            fill: false,
            pointBackgroundColor: CHART_COLORS.pagu,
            pointBorderColor: "#ffffff",
            pointBorderWidth: 2,
            pointHoverRadius: 6,
            pointRadius: 3,
            tension: 0,
            yAxisID: "pagu",
          },
          {
            label: "Jumlah Paket",
            backgroundColor: CHART_COLORS.package,
            borderColor: CHART_COLORS.package,
            borderWidth: 2.5,
            data: packageData,
            fill: false,
            pointBackgroundColor: CHART_COLORS.package,
            pointBorderColor: "#ffffff",
            pointBorderWidth: 2,
            pointHoverRadius: 6,
            pointRadius: 3,
            tension: 0,
            yAxisID: "paket",
          },
        ],
      },
      options: {
        maintainAspectRatio: false,
        responsive: true,
        layout: {
          padding: {
            top: 28,
            right: 16,
            bottom: 4,
            left: 0,
          },
        },
        interaction: {
          mode: "index",
          intersect: false,
        },
        plugins: {
          legend: {
            align: "end",
            position: "bottom",
            labels: {
              boxHeight: 8,
              boxWidth: 20,
              color: "#475569",
              font: {
                size: 12,
                weight: 700,
              },
              usePointStyle: true,
            },
          },
          title: {
            display: false,
          },
          tooltip: {
            backgroundColor: CHART_COLORS.tooltip,
            borderColor: "rgba(15, 23, 42, 0.12)",
            borderWidth: 1,
            bodyFont: {
              size: 12,
              weight: 700,
            },
            callbacks: {
              label(context) {
                const label = context.dataset.label ?? "";
                const value = Number(context.raw ?? 0);

                if (context.dataset.yAxisID === "pagu") {
                  return `${label}: ${formatCompactCurrency(value)}`;
                }

                return `${label}: ${value.toLocaleString("id-ID")} paket`;
              },
            },
            displayColors: true,
            padding: 12,
            titleFont: {
              size: 12,
              weight: 800,
            },
          },
        },
        scales: {
          x: {
            display: true,
            grid: {
              color: CHART_COLORS.grid,
              drawTicks: false,
            },
            border: {
              color: "rgba(148, 163, 184, 0.35)",
            },
            ticks: {
              color: CHART_COLORS.axis,
              font: {
                size: 11,
                weight: 700,
              },
              padding: 8,
            },
          },
          pagu: {
            beginAtZero: true,
            display: true,
            grace: "12%",
            grid: {
              color: CHART_COLORS.grid,
            },
            border: {
              color: "rgba(148, 163, 184, 0.35)",
            },
            position: "left",
            suggestedMax: maxPagu > 0 ? maxPagu * 1.18 : undefined,
            ticks: {
              callback(value) {
                return formatCompactCurrency(Number(value));
              },
              color: CHART_COLORS.axis,
              font: {
                size: 11,
                weight: 700,
              },
              padding: 8,
            },
          },
          paket: {
            beginAtZero: true,
            display: false,
            grace: "18%",
            grid: {
              drawOnChartArea: false,
            },
            position: "right",
            suggestedMax: maxPackage > 0 ? maxPackage * 1.18 : undefined,
          },
        },
      },
    });

    return () => {
      chart.destroy();
    };
  }, [labels, packageData, paguData]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-black uppercase tracking-wide text-[#08783f]">
            Monitoring SIRUP / RUP
          </p>
          <h2 className="mt-1 text-lg font-black leading-tight text-[#16227c] sm:text-xl">
            Grafik tren pagu dan jumlah paket
          </h2>
          <p className="mt-1 text-sm font-bold text-slate-500">
            Hanya paket perencanaan yang sudah approve sampai Siap RUP/SIRUP.
          </p>
          <p className="mt-1 text-xs font-bold text-slate-400">
            Pagu aktif terakhir {formatCompactCurrency(latestPagu)}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[620px]">
          <div className="rounded-xl bg-slate-50 px-4 py-3">
            <p className="text-[10px] font-black uppercase text-slate-400">
              Paket Terpantau
            </p>
            <p className="mt-1 truncate text-xl font-black text-slate-950 sm:text-2xl">
              {totalPackages.toLocaleString("id-ID")}
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 px-4 py-3">
            <p className="text-[10px] font-black uppercase text-slate-400">
              Total Pagu
            </p>
            <p className="mt-1 truncate text-xl font-black text-slate-950 sm:text-2xl">
              {formatCompactCurrency(totalPagu)}
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 px-4 py-3">
            <p className="text-[10px] font-black uppercase text-slate-400">
              Sumber Dana Utama
            </p>
            <p className="mt-1 truncate text-xl font-black text-slate-950 sm:text-2xl">
              {primarySourceFund ?? "-"}
            </p>
          </div>
        </div>
      </div>

      {labels.length > 0 && totalPackages > 0 ? (
        <div className="mt-5 overflow-x-auto overscroll-x-contain pb-3 pt-3">
          <div className="relative h-[320px] min-w-[780px] sm:h-[360px] lg:h-[400px] lg:min-w-0">
            <canvas
              ref={canvasRef}
              aria-label="Grafik tren pagu bulanan SIRUP RUP"
            />
          </div>
        </div>
      ) : (
        <div className="mt-5 flex h-[260px] items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 text-center text-sm font-semibold text-slate-500 sm:h-[320px] lg:h-[380px]">
          Belum ada paket perencanaan yang sudah disetujui untuk masuk grafik
          SIRUP/RUP.
        </div>
      )}
    </div>
  );
}
