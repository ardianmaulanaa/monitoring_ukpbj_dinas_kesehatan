"use client";

import { useRouter } from "next/navigation";
import ModalShell from "@/components/modal/ModalShell";
import KatalogManualWorkflowClient, {
  type EPurchasingDraft,
} from "@/app/katalog-v6-v5/KatalogManualWorkflowClient";

type EPurchasingDetailModalProps = {
  basePath?: string;
  draft: EPurchasingDraft;
  rup: {
    id: string;
    kodeRup: string;
    lokasiPaket?: string | null;
    namaPaket: string;
    unitPengusul: string;
    sumberDana: string;
    pagu: number;
    tahunAnggaran: number;
    program?: string | null;
    kegiatan?: string | null;
    subKegiatan?: string | null;
    ppkPptk?: string | null;
    metodePengadaan: string;
  };
  stageLabel: string;
};

export default function EPurchasingDetailModal({
  basePath = "/e-purchasing",
  draft,
  rup,
  stageLabel,
}: EPurchasingDetailModalProps) {
  const router = useRouter();

  function closeModal() {
    router.push(basePath);
  }

  return (
    <ModalShell
      isOpen
      onClose={closeModal}
      eyebrow="E-Purchasing"
      title={rup.namaPaket}
      maxWidthClassName="max-w-7xl"
    >
      <div className="mb-5 flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="font-mono text-xs font-black uppercase tracking-wide text-slate-400">
            {rup.kodeRup}
          </p>
          <h3 className="mt-1 truncate text-lg font-black text-[#16227c]">
            {rup.namaPaket}
          </h3>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            {rup.unitPengusul} · {rup.sumberDana}
          </p>
        </div>
        <span className="inline-flex w-fit shrink-0 rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-black text-[#08783f]">
          {stageLabel}
        </span>
      </div>

      <KatalogManualWorkflowClient initialDraft={draft} rup={rup} />
    </ModalShell>
  );
}
