"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Chart from "chart.js/auto";

type ChartItem = {
  label: string;
  count: number;
  amount: number;
};

type ChartCategoryKey = "sumberDana" | "metodeFinal" | "jenisBarang";

type ChartCategory = {
  key: ChartCategoryKey;
  label: string;
  items: ChartItem[];
};

type SirupRupLineChartProps = {
  categories: ChartCategory[];
  primarySourceFund?: string;
  totalPackages: number;
  totalPagu: number;
};

const CHART_COLORS = [
  "#08783f",
  "#16227c",
  "#f5b719",
  "#159fbe",
  "#0f766e",
];

const GRID_COLOR = "rgba(148, 163, 184, 0.2)";
const CHART_FONT_FAMILY =
  "Plus Jakarta Sans, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif";

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
  categories,
  primarySourceFund,
  totalPackages,
  totalPagu,
}: SirupRupLineChartProps) {
  const doughnutRef = useRef<HTMLCanvasElement | null>(null);
  const barRef = useRef<HTMLCanvasElement | null>(null);
  const [selectedCategoryKey, setSelectedCategoryKey] =
    useState<ChartCategoryKey>("sumberDana");

  const selectedCategory =
    categories.find((category) => category.key === selectedCategoryKey) ??
    categories[0];
  const chartItems = useMemo(
    () => (selectedCategory?.items ?? []).filter((item) => item.amount > 0),
    [selectedCategory],
  );
  const dominantItem = chartItems[0];

  useEffect(() => {
    if (!doughnutRef.current || chartItems.length === 0) return;

    const context = doughnutRef.current.getContext("2d");
    if (!context) return;

    const chart = new Chart(context, {
      type: "doughnut",
      data: {
        labels: chartItems.map((item) => item.label),
        datasets: [
          {
            data: chartItems.map((item) => item.amount),
            backgroundColor: chartItems.map(
              (_, index) => CHART_COLORS[index % CHART_COLORS.length],
            ),
            borderColor: "#ffffff",
            borderRadius: 7,
            borderWidth: 4,
            hoverOffset: 8,
          },
        ],
      },
      options: {
        cutout: "62%",
        maintainAspectRatio: false,
        responsive: true,
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              boxHeight: 10,
              boxWidth: 10,
              color: "#475569",
              font: {
                family: CHART_FONT_FAMILY,
                size: 12,
                weight: 600,
              },
              padding: 14,
              usePointStyle: true,
            },
          },
          tooltip: {
            backgroundColor: "#0f172a",
            bodyFont: {
              family: CHART_FONT_FAMILY,
              size: 12,
              weight: 600,
            },
            callbacks: {
              label(context) {
                const value = Number(context.raw ?? 0);
                const item = chartItems[context.dataIndex];

                return `${item.label}: ${formatCompactCurrency(value)} (${item.count.toLocaleString("id-ID")} paket)`;
              },
            },
            padding: 12,
            titleFont: {
              family: CHART_FONT_FAMILY,
              size: 12,
              weight: 700,
            },
          },
        },
      },
    });

    return () => {
      chart.destroy();
    };
  }, [chartItems]);

  useEffect(() => {
    if (!barRef.current || chartItems.length === 0) return;

    const context = barRef.current.getContext("2d");
    if (!context) return;

    const chart = new Chart(context, {
      type: "bar",
      data: {
        labels: chartItems.map((item) => item.label),
        datasets: [
          {
            label: "Total Pagu",
            data: chartItems.map((item) => item.amount),
            backgroundColor: chartItems.map(
              (_, index) => CHART_COLORS[index % CHART_COLORS.length],
            ),
            borderRadius: 8,
            borderSkipped: false,
            maxBarThickness: 56,
          },
        ],
      },
      options: {
        maintainAspectRatio: false,
        responsive: true,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            backgroundColor: "#0f172a",
            bodyFont: {
              family: CHART_FONT_FAMILY,
              size: 12,
              weight: 600,
            },
            callbacks: {
              label(context) {
                const value = Number(context.raw ?? 0);
                const item = chartItems[context.dataIndex];

                return `${formatCompactCurrency(value)} | ${item.count.toLocaleString("id-ID")} paket`;
              },
            },
            padding: 12,
            titleFont: {
              family: CHART_FONT_FAMILY,
              size: 12,
              weight: 700,
            },
          },
        },
        scales: {
          x: {
            grid: {
              display: false,
            },
            ticks: {
              color: "#64748b",
              font: {
                family: CHART_FONT_FAMILY,
                size: 11,
                weight: 600,
              },
              maxRotation: 0,
              minRotation: 0,
            },
          },
          y: {
            beginAtZero: true,
            grid: {
              color: GRID_COLOR,
            },
            border: {
              color: "rgba(148, 163, 184, 0.35)",
            },
            ticks: {
              callback(value) {
                return formatCompactCurrency(Number(value));
              },
              color: "#64748b",
              font: {
                family: CHART_FONT_FAMILY,
                size: 11,
                weight: 600,
              },
              padding: 8,
            },
          },
        },
      },
    });

    return () => {
      chart.destroy();
    };
  }, [chartItems]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#08783f]">
            Monitoring SIRUP / RUP
          </p>
          <h2 className="mt-1 text-lg font-bold leading-tight tracking-tight text-[#16227c] sm:text-xl">
            Grafik distribusi pagu dan paket
          </h2>
          <p className="mt-1 text-sm font-bold text-slate-500">
            Mengikuti seluruh data hasil filter halaman SIRUP/RUP.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[620px]">
          <div className="rounded-xl bg-slate-50 px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.04em] text-slate-400">
              Paket Terpantau
            </p>
            <p className="mt-1 truncate text-xl font-bold text-slate-950 sm:text-2xl">
              {totalPackages.toLocaleString("id-ID")}
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.04em] text-slate-400">
              Total Pagu
            </p>
            <p className="mt-1 truncate text-xl font-bold text-slate-950 sm:text-2xl">
              {formatCompactCurrency(totalPagu)}
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.04em] text-slate-400">
              Sumber Dana Utama
            </p>
            <p className="mt-1 truncate text-xl font-bold text-slate-950 sm:text-2xl">
              {primarySourceFund ?? "-"}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div></div>

        <select
          value={selectedCategoryKey}
          onChange={(event) =>
            setSelectedCategoryKey(event.target.value as ChartCategoryKey)
          }
          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-[#16227c] outline-none transition focus:border-[#08783f] focus:ring-4 focus:ring-emerald-100 sm:w-[260px]"
        >
          {categories.map((category) => (
            <option key={category.key} value={category.key}>
              {category.label}
            </option>
          ))}
        </select>
      </div>

      {chartItems.length > 0 && totalPackages > 0 ? (
        <div className="mt-5 grid gap-5 xl:grid-cols-[380px_1fr]">
          <div className="rounded-xl bg-slate-50 p-4">
            <div className="relative mx-auto h-[280px] max-w-[340px] sm:h-[320px]">
              <canvas
                ref={doughnutRef}
                aria-label={`Doughnut chart ${selectedCategory?.label ?? "SIRUP RUP"}`}
              />
              <div className="pointer-events-none absolute inset-x-0 top-[38%] mx-auto w-32 text-center">
                <p className="text-[10px] font-semibold uppercase tracking-[0.04em] text-slate-400">
                  Dominan
                </p>
                <p className="mt-1 truncate text-base font-bold text-slate-950">
                  {dominantItem?.label ?? "-"}
                </p>
                <p className="mt-1 text-xs font-semibold text-[#08783f]">
                  {formatCompactCurrency(dominantItem?.amount ?? 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-slate-50 p-4">
            <div className="overflow-x-auto overscroll-x-contain pb-2">
              <div className="h-[300px] min-w-[620px] sm:h-[340px] xl:min-w-0">
                <canvas
                  ref={barRef}
                  aria-label={`Bar chart ${selectedCategory?.label ?? "SIRUP RUP"}`}
                />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-5 flex h-[260px] items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 text-center text-sm font-semibold text-slate-500 sm:h-[320px]">
          Belum ada paket perencanaan yang sudah disetujui untuk masuk grafik
          SIRUP/RUP.
        </div>
      )}
    </div>
  );
}
