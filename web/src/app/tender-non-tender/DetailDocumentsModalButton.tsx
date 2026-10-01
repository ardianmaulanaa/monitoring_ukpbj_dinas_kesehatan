"use client";

import { useCallback, useState } from "react";
import { Eye, FileText } from "lucide-react";
import ModalShell from "@/components/modal/ModalShell";

type DetailDocument = {
  key: string;
  label: string;
};

type DetailDocumentGroup = {
  title: string;
  documents: DetailDocument[];
};

type DocumentChecklistItem = {
  dokumen: string;
  status: string;
  catatan: string | null;
  fileUrl: string | null;
};

type DetailDocumentsModalButtonProps = {
  documents: DocumentChecklistItem[];
  groups: DetailDocumentGroup[];
  kodePaket: string;
  namaPaket: string;
  statusLabel: string;
};

function getExistingDocument(documents: DocumentChecklistItem[], key: string) {
  return documents.find((item) => item.dokumen === key);
}

function isComplete(document: DocumentChecklistItem | undefined) {
  return document?.status === "LENGKAP";
}

export default function DetailDocumentsModalButton({
  documents,
  groups,
  kodePaket,
  namaPaket,
  statusLabel,
}: DetailDocumentsModalButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const close = useCallback(() => setIsOpen(false), []);
  const open = useCallback(() => setIsOpen(true), []);
  const totalDocuments = groups.reduce(
    (total, group) => total + group.documents.length,
    0,
  );
  const completeDocuments = groups.reduce(
    (total, group) =>
      total +
      group.documents.filter((document) =>
        isComplete(getExistingDocument(documents, document.key)),
      ).length,
    0,
  );

  return (
    <>
      <button
        type="button"
        onClick={open}
        className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-xs font-black text-slate-700 transition hover:border-[#08783f] hover:bg-emerald-50 hover:text-[#08783f]"
      >
        <Eye className="h-4 w-4" strokeWidth={2.4} />
        Detail
      </button>

      <ModalShell
        isOpen={isOpen}
        onClose={close}
        eyebrow="Detail Pengisian"
        title={kodePaket}
        maxWidthClassName="max-w-4xl"
      >
        <div className="grid gap-5">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-black leading-6 text-slate-900">
              {namaPaket}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-700">
                Status: {statusLabel}
              </span>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-[#08783f]">
                {completeDocuments}/{totalDocuments} isian lengkap
              </span>
            </div>
          </div>

          <div className="grid gap-4">
            {groups.map((group) => (
              <section
                key={group.title}
                className="overflow-hidden rounded-lg border border-slate-200 bg-white"
              >
                <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
                  <h3 className="text-sm font-black text-[#16227c]">
                    {group.title}
                  </h3>
                </div>
                <div className="divide-y divide-slate-100">
                  {group.documents.map((document) => {
                    const existingDocument = getExistingDocument(
                      documents,
                      document.key,
                    );
                    const complete = isComplete(existingDocument);

                    return (
                      <div
                        key={`${group.title}-${document.key}`}
                        className="grid gap-3 px-4 py-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-black text-slate-900">
                            {document.label}
                          </p>
                          <span
                            className={`rounded-full px-3 py-1 text-[11px] font-black ${
                              complete
                                ? "bg-emerald-50 text-[#08783f]"
                                : "bg-amber-50 text-amber-700"
                            }`}
                          >
                            {complete ? "Lengkap" : "Belum lengkap"}
                          </span>
                        </div>

                        <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-3">
                          <p className="text-[10px] font-black uppercase tracking-wide text-slate-500">
                            Catatan / Deskripsi
                          </p>
                          <p className="mt-2 whitespace-pre-wrap text-sm font-semibold leading-6 text-slate-700">
                            {existingDocument?.catatan?.trim() || "-"}
                          </p>
                        </div>

                        {existingDocument?.fileUrl ? (
                          <a
                            href={existingDocument.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex w-fit items-center gap-2 rounded-md bg-emerald-50 px-3 py-2 text-xs font-black text-[#08783f] hover:underline"
                          >
                            <FileText className="h-4 w-4" strokeWidth={2.4} />
                            Buka file tersimpan
                          </a>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </div>
      </ModalShell>
    </>
  );
}
