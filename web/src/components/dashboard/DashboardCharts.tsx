"use client";

import { useEffect, useRef } from "react";
import Chart from "chart.js/auto";
import type { DashboardBreakdown, DashboardMonthlyPackage, DashboardMonthlyRealization } from "@/lib/dashboard-data";

const palette = ["#0f766e", "#2f9e73", "#d29a38", "#2563a8", "#7c9589", "#c24141"];

function fullCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function compactCurrency(value: number) {
  const scales = [
    { limit: 1_000_000_000, suffix: "M" },
    { limit: 1_000_000, suffix: "Jt" },
    { limit: 1_000, suffix: "Rb" },
  ];
  const scale = scales.find((item) => value >= item.limit);
  if (!scale) return `Rp ${value.toLocaleString("id-ID")}`;
  return `Rp ${(value / scale.limit).toLocaleString("id-ID", { maximumFractionDigits: 1 })} ${scale.suffix}`;
}

export function DashboardDonutChart({
  items,
  valueKind,
}: {
  items: DashboardBreakdown[];
  valueKind: "amount" | "count";
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const visible = items.filter((item) => item[valueKind] > 0);

  useEffect(() => {
    if (!canvasRef.current || visible.length === 0) return;
    const chart = new Chart(canvasRef.current, {
      type: "doughnut",
      data: {
        labels: visible.map((item) => item.label),
        datasets: [{
          data: visible.map((item) => item[valueKind]),
          backgroundColor: visible.map((_, index) => palette[index % palette.length]),
          borderColor: "#ffffff",
          borderWidth: 3,
          hoverOffset: 5,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "66%",
        plugins: {
          legend: {
            position: "bottom",
            labels: { boxWidth: 10, boxHeight: 10, padding: 14, color: "#64748b", font: { size: 11 } },
          },
          tooltip: {
            callbacks: {
              label(context) {
                const item = visible[context.dataIndex];
                const value = valueKind === "amount" ? fullCurrency(item.amount) : `${item.count.toLocaleString("id-ID")} paket`;
                return ` ${item.label}: ${value} (${item.percent.toLocaleString("id-ID")}%)`;
              },
            },
          },
        },
      },
    });
    return () => chart.destroy();
  }, [valueKind, visible]);

  if (visible.length === 0) {
    return <ChartEmpty message="Belum ada data aktual untuk periode dan filter ini." />;
  }
  return <div className="h-[300px] min-w-0"><canvas ref={canvasRef} /></div>;
}

export function DashboardTrendChart({ data }: { data: DashboardMonthlyRealization[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cumulative = data.reduce<DashboardMonthlyRealization[]>((result, item) => {
    const previous = result.at(-1);
    result.push({
      month: item.month,
      pagu: (previous?.pagu ?? 0) + item.pagu,
      realisasi: (previous?.realisasi ?? 0) + item.realisasi,
    });
    return result;
  }, []);
  const hasData = cumulative.some((item) => item.pagu > 0 || item.realisasi > 0);

  useEffect(() => {
    if (!canvasRef.current || !hasData) return;
    const chart = new Chart(canvasRef.current, {
      type: "line",
      data: {
        labels: cumulative.map((item) => item.month),
        datasets: [
          { label: "Pagu kumulatif", data: cumulative.map((item) => item.pagu), borderColor: "#2563a8", backgroundColor: "#2563a81a", fill: true, tension: 0, pointRadius: 2 },
          { label: "Realisasi kumulatif", data: cumulative.map((item) => item.realisasi), borderColor: "#0f766e", backgroundColor: "#0f766e1a", fill: true, tension: 0, pointRadius: 2 },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: { position: "bottom", labels: { boxWidth: 12, padding: 14, color: "#64748b", font: { size: 11 } } },
          tooltip: { callbacks: { label: (context) => ` ${context.dataset.label}: ${fullCurrency(Number(context.raw))}` } },
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: "#64748b", font: { size: 10 } } },
          y: { beginAtZero: true, grid: { color: "#e2e8f0" }, ticks: { color: "#64748b", font: { size: 10 }, callback: (value) => compactCurrency(Number(value)) } },
        },
      },
    });
    return () => chart.destroy();
  }, [cumulative, hasData]);

  if (!hasData) {
    return <ChartEmpty message="Belum ada data pagu atau pembayaran bertanggal valid untuk membentuk tren bulanan." />;
  }
  return <div className="h-[300px] min-w-0"><canvas ref={canvasRef} /></div>;
}

export function DashboardMonthlyPackageChart({ data }: { data: DashboardMonthlyPackage[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hasData = data.some((item) => item.count > 0);

  useEffect(() => {
    if (!canvasRef.current || !hasData) return;
    const chart = new Chart(canvasRef.current, {
      type: "bar",
      data: {
        labels: data.map((item) => item.month),
        datasets: [{
          label: "Paket dimasukkan",
          data: data.map((item) => item.count),
          backgroundColor: "#16834c",
          hoverBackgroundColor: "#087f4f",
          borderColor: "#087f4f",
          borderWidth: 1,
          borderRadius: 6,
          borderSkipped: false,
          maxBarThickness: 54,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        layout: { padding: { top: 12, right: 8, bottom: 2, left: 4 } },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context) => ` ${Number(context.raw).toLocaleString("id-ID")} paket`,
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: "#64796f", font: { size: 11 } },
          },
          y: {
            beginAtZero: true,
            grace: "12%",
            grid: { color: "#e9efeb" },
            ticks: {
              color: "#64796f",
              font: { size: 11 },
              precision: 0,
              stepSize: 1,
            },
            title: {
              display: true,
              text: "Jumlah paket",
              color: "#64796f",
              font: { size: 11, weight: 600 },
            },
          },
        },
      },
    });
    return () => chart.destroy();
  }, [data, hasData]);

  if (!hasData) {
    return <ChartEmpty message="Belum ada data paket untuk periode dan filter ini." heightClass="h-[340px]" />;
  }

  return <div className="h-[320px] min-w-0 sm:h-[360px]"><canvas ref={canvasRef} /></div>;
}

function ChartEmpty({ message, heightClass = "h-[300px]" }: { message: string; heightClass?: string }) {
  return <div className={`flex ${heightClass} items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-xs text-slate-500`}>{message}</div>;
}
