"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, RotateCcw, Save } from "lucide-react";
import ModalShell from "@/app/(dashboard)/_shared/ModalShell";
import { formatCurrency } from "@/lib/currency";
import {
  updateRupRevisionAction,
  type RupRevisionState,
} from "./actions";

export type RupDetailItem = {
  catatan: string | null;
  id: string;
  jadwalPemilihan: string | null;
  kodeRup: string;
  metodePengadaan: string;
  namaPaket: string;
  pagu: string;
  sumberDana: string;
  statusSirup: string;
  tahunAnggaran: number;
  unitPengusul: string;
};

type RupDetailModalButtonProps = {
  canEditRevision: boolean;
  item: RupDetailItem;
  statusLabel: string;
  statusStyle: string;
};

const initialState: RupRevisionState = {
  message: "",
  ok: false,
};

const inputClass =
  "h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#08783f] focus:ring-2 focus:ring-emerald-100";
const labelClass = "text-xs font-black uppercase tracking-wide text-slate-400";

function methodLabel(value: string) {
  const labels: Record<string, string> = {
    TENDER: "Tender",
    NON_TENDER: "Non Tender",
    E_PURCHASING: "e-Katalog",
    PENGADAAN_LANGSUNG: "Pengadaan Langsung",
    SWAKELOLA: "Swakelola",
  };

  return labels[value] ?? value.replaceAll("_", " ");
}

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
      <dt className={labelClass}>{label}</dt>
      <dd className="break-words text-sm font-bold text-slate-700">{value}</dd>
    </div>
  );
}

function RevisionSubmitButton({
  children,
  submitMode,
}: {
  children: React.ReactNode;
  submitMode: "save" | "resubmit";
}) {
  return (
    <button
      type="submit"
      name="submitMode"
      value={submitMode}
      className={
        submitMode === "resubmit"
          ? "inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#08783f] px-4 text-sm font-black text-white transition hover:bg-[#066532]"
          : "inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-white px-4 text-sm font-black text-[#08783f] transition hover:bg-emerald-50"
      }
    >
      {submitMode === "resubmit" ? (
        <RotateCcw className="h-4 w-4" strokeWidth={2.4} />
      ) : (
        <Save className="h-4 w-4" strokeWidth={2.4} />
      )}
      {children}
    </button>
  );
}

export default function RupDetailModalButton({
  canEditRevision,
  item,
  statusLabel,
  statusStyle,
}: RupDetailModalButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [state, formAction] = useActionState(
    updateRupRevisionAction,
    initialState,
  );
  const [pagu, setPagu] = useState(onlyDigits(item.pagu));

  const formattedPagu = useMemo(() => formatCurrency(pagu), [pagu]);
  const showRevisionForm =
    item.statusSirup === "REVISI_PAGU" && canEditRevision;

  useEffect(() => {
    if (state.ok) router.refresh();
  }, [router, state.ok]);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-white px-4 text-sm font-black text-[#08783f] transition hover:bg-emerald-50"
      >
        <Eye className="h-4 w-4" strokeWidth={2.4} />
        Detail
      </button>

      <ModalShell
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        eyebrow="Detail Perencanaan"
        title={item.namaPaket}
        maxWidthClassName="max-w-4xl"
      >
        <div className="grid gap-5">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-4">
            <div>
              <p className="font-mono text-xs font-black uppercase tracking-wide text-slate-400">
                {item.kodeRup}
              </p>
              <p className="mt-1 text-lg font-black text-[#16227c]">
                {item.namaPaket}
              </p>
            </div>
            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${statusStyle}`}
            >
              {statusLabel}
            </span>
          </div>

          <dl className="grid gap-3 sm:grid-cols-2">
            <DetailRow label="Unit Pengusul" value={item.unitPengusul} />
            <DetailRow label="Sumber Dana" value={item.sumberDana} />
            <DetailRow label="Pagu" value={formatCurrency(item.pagu)} />
            <DetailRow
              label="Metode Pengadaan"
              value={methodLabel(item.metodePengadaan)}
            />
            <DetailRow
              label="Jadwal Pemilihan"
              value={item.jadwalPemilihan || "-"}
            />
            <DetailRow
              label="Tahun Anggaran"
              value={`TA ${item.tahunAnggaran}`}
            />
          </dl>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className={labelClass}>Catatan / Revisi</p>
            <p className="mt-2 whitespace-pre-wrap text-sm font-semibold leading-6 text-slate-700">
              {item.catatan || "Belum ada catatan revisi."}
            </p>
          </div>

          {item.statusSirup === "REVISI_PAGU" && !canEditRevision ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold leading-6 text-amber-700">
              Revisi hanya dapat diubah oleh unit pengusul.
            </div>
          ) : null}

          {showRevisionForm ? (
            <form
              action={formAction}
              className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-4"
            >
              <input type="hidden" name="id" value={item.id} />
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-xs font-black uppercase tracking-wide text-[#08783f]">
                    Pagu Revisi
                  </span>
                  <input
                    name="pagu"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    required
                    value={pagu}
                    onChange={(event) => setPagu(onlyDigits(event.target.value))}
                    className={inputClass}
                  />
                  <span className="text-xs font-bold text-slate-500">
                    {formattedPagu}
                  </span>
                </label>

                <label className="grid gap-2">
                  <span className="text-xs font-black uppercase tracking-wide text-[#08783f]">
                    Jadwal Pemilihan
                  </span>
                  <input
                    name="jadwalPemilihan"
                    type="date"
                    defaultValue={item.jadwalPemilihan ?? ""}
                    className={inputClass}
                  />
                </label>

                <label className="grid gap-2 sm:col-span-2">
                  <span className="text-xs font-black uppercase tracking-wide text-[#08783f]">
                    Catatan Revisi Unit Pengusul
                  </span>
                  <textarea
                    name="catatan"
                    defaultValue={item.catatan ?? ""}
                    className="min-h-28 w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm font-semibold leading-6 text-slate-700 outline-none transition focus:border-[#08783f] focus:ring-2 focus:ring-emerald-100"
                  />
                </label>
              </div>

              {state.message ? (
                <p
                  className={`mt-4 rounded-lg px-3 py-2 text-sm font-bold ${
                    state.ok
                      ? "bg-emerald-100 text-[#08783f]"
                      : "bg-red-50 text-red-700"
                  }`}
                >
                  {state.message}
                </p>
              ) : null}

              <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <RevisionSubmitButton submitMode="save">
                  Simpan Revisi
                </RevisionSubmitButton>
                <RevisionSubmitButton submitMode="resubmit">
                  Simpan & Ajukan Ulang
                </RevisionSubmitButton>
              </div>
            </form>
          ) : null}
        </div>
      </ModalShell>
    </>
  );
}
