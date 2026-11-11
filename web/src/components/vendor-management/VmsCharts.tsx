"use client";

import Chart from "chart.js/auto";
import { useEffect, useRef } from "react";

type Point = { label: string; value: number };

function ChartCanvas({ title, type, data }: { title: string; type: "line" | "doughnut" | "bar"; data: Point[] }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!ref.current || !data.length) return;
    const chart = new Chart(ref.current, {
      type,
      data: {
        labels: data.map((item) => item.label),
        datasets: [{
          label: title,
          data: data.map((item) => item.value),
          backgroundColor: type === "line" ? "rgba(8,120,63,.12)" : ["#08783f", "#16227c", "#f5b719", "#159fbe", "#0f766e", "#94a3b8"],
          borderColor: type === "line" ? "#08783f" : "#fff",
          borderWidth: type === "line" ? 2 : 2,
          borderRadius: type === "bar" ? 7 : undefined,
          fill: type === "line",
          tension: .35,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: type === "doughnut", position: "bottom", labels: { usePointStyle: true, boxWidth: 8, font: { family: "Plus Jakarta Sans" } } },
          tooltip: { backgroundColor: "#0f172a", padding: 10 },
        },
        scales: type === "doughnut" ? undefined : {
          x: { grid: { display: false }, ticks: { color: "#64748b" } },
          y: { beginAtZero: true, ticks: { precision: 0, color: "#64748b" }, grid: { color: "rgba(148,163,184,.18)" } },
        },
      },
    });
    return () => chart.destroy();
  }, [data, title, type]);

  if (!data.some((item) => item.value > 0)) return <div className="flex h-64 items-center justify-center text-sm text-slate-500">Belum ada data untuk divisualisasikan.</div>;
  return <div className="h-64"><canvas ref={ref} role="img" aria-label={title} /></div>;
}

export default function VmsCharts({ growth, categories, statuses }: { growth: Point[]; categories: Point[]; statuses: Point[] }) {
  return <div className="grid gap-4 xl:grid-cols-3">
    <article className="rounded-2xl border border-[#dee9e2] bg-white p-5 shadow-sm xl:col-span-2"><h3 className="mb-4 font-extrabold text-slate-900">Pertumbuhan registrasi vendor</h3><ChartCanvas title="Registrasi vendor" type="line" data={growth} /></article>
    <article className="rounded-2xl border border-[#dee9e2] bg-white p-5 shadow-sm"><h3 className="mb-4 font-extrabold text-slate-900">Status verifikasi</h3><ChartCanvas title="Status verifikasi vendor" type="doughnut" data={statuses} /></article>
    <article className="rounded-2xl border border-[#dee9e2] bg-white p-5 shadow-sm xl:col-span-3"><h3 className="mb-4 font-extrabold text-slate-900">Vendor berdasarkan kategori usaha</h3><ChartCanvas title="Kategori usaha vendor" type="bar" data={categories} /></article>
  </div>;
}
