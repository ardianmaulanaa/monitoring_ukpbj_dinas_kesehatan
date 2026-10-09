"use client";

import { useRouter } from "next/navigation";
import ModalShell from "@/components/modal/ModalShell";
import {
  DetailModalHeader,
  DetailStatusBadge,
} from "@/components/detail/DetailHorizontalSection";
import KatalogManualWorkflowClient, {
  type EPurchasingDraft,
} from "@/app/katalog-v6-v5/KatalogManualWorkflowClient";
import { formatCurrency } from "@/lib/currency";

type EPurchasingDetailModalProps = {
  basePath?: string;
  draft: EPurchasingDraft;
  rup: {
    id: string;
    idRupSirup?: string | null;
    kodeRup: string;
    linkSirup?: string | null;
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
    statusSirup?: string | null;
    tanggalInputSirup?: string | null;
    tanggalTayangSirup?: string | null;
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
      eyebrow="Proses E-Purchasing"
      title={rup.namaPaket}
      maxWidthClassName="max-w-7xl"
    >
      <div className="mb-5">
        <DetailModalHeader
          code={rup.kodeRup}
          title={rup.namaPaket}
          badge={
            <DetailStatusBadge className="bg-emerald-100 text-[#08783f] ring-emerald-200">
              {stageLabel}
            </DetailStatusBadge>
          }
          items={[
            { label: "Unit Pengusul", value: rup.unitPengusul },
            { label: "Tahun Anggaran", value: `TA ${rup.tahunAnggaran}` },
            { label: "Pagu", value: formatCurrency(rup.pagu) },
            { label: "Metode", value: rup.metodePengadaan.replaceAll("_", " ") },
            { label: "Sumber Dana", value: rup.sumberDana },
          ]}
        />
      </div>

      <KatalogManualWorkflowClient initialDraft={draft} rup={rup} />
    </ModalShell>
  );
}
