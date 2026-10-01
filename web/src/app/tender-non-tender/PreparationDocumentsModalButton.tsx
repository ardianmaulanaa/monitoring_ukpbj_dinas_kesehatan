"use client";

import { useCallback, useMemo, useState } from "react";
import { ClipboardCheck, FileUp, Save } from "lucide-react";
import ModalShell from "@/components/modal/ModalShell";

type PreparationDocument = {
  key: string;
  label: string;
};

type DocumentChecklistItem = {
  dokumen: string;
  status: string;
  catatan: string | null;
  fileUrl: string | null;
};

type PreparationDocumentsModalButtonProps = {
  action: (formData: FormData) => void | Promise<void>;
  buttonLabel?: string;
  documents: PreparationDocument[];
  existingDocuments: DocumentChecklistItem[];
  namaPaket: string;
  paketId: string;
  submitLabel?: string;
  title?: string;
};

function getDocumentStatus(documents: DocumentChecklistItem[], key: string) {
  return documents.find((item) => item.dokumen === key)?.status ?? "BELUM_ADA";
}

function getExistingDocument(documents: DocumentChecklistItem[], key: string) {
  return documents.find((item) => item.dokumen === key);
}

function getVisibleCatatan(value: string | null | undefined) {
  if (!value) return "";
  if (value.startsWith("Checklist persiapan dokumen tahap 1")) return "";
  return value;
}

function buildInitialNotes(
  documents: PreparationDocument[],
  existingDocuments: DocumentChecklistItem[],
) {
  return Object.fromEntries(
    documents.map((document) => [
      document.key,
      getVisibleCatatan(getExistingDocument(existingDocuments, document.key)?.catatan),
    ]),
  );
}

function hasSavedFile(documents: DocumentChecklistItem[], key: string) {
  return Boolean(getExistingDocument(documents, key)?.fileUrl);
}

function isDocumentComplete(
  documents: DocumentChecklistItem[],
  key: string,
  notes: Record<string, string>,
  selectedFiles: Record<string, string>,
) {
  return (
    getDocumentStatus(documents, key) === "LENGKAP" ||
    Boolean(notes[key]?.trim()) ||
    Boolean(selectedFiles[key]) ||
    hasSavedFile(documents, key)
  );
}

export default function PreparationDocumentsModalButton({
  action,
  buttonLabel = "Lengkapi Dokumen",
  documents,
  existingDocuments,
  namaPaket,
  paketId,
  submitLabel = "Simpan & Lanjut Jadwal",
  title = "Persiapan Dokumen",
}: PreparationDocumentsModalButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const initialNotes = useMemo(
    () => buildInitialNotes(documents, existingDocuments),
    [documents, existingDocuments],
  );
  const [notes, setNotes] = useState<Record<string, string>>(initialNotes);
  const [selectedFiles, setSelectedFiles] = useState<Record<string, string>>({});
  const completedCount = documents.filter((document) =>
    isDocumentComplete(existingDocuments, document.key, notes, selectedFiles),
  ).length;
  const isStageReady = completedCount > 0;
  const close = useCallback(() => setIsOpen(false), []);
  const open = useCallback(() => {
    setNotes(initialNotes);
    setSelectedFiles({});
    setIsOpen(true);
  }, [initialNotes]);

  return (
    <>
      <button
        type="button"
        onClick={open}
        className="inline-flex items-center justify-center gap-2 rounded-md border border-[#08783f] px-3 py-2 text-xs font-black text-[#08783f] transition hover:bg-emerald-50"
      >
        <ClipboardCheck className="h-4 w-4" strokeWidth={2.4} />
        {buttonLabel}
      </button>

      <ModalShell
        isOpen={isOpen}
        onClose={close}
        eyebrow="Tahap 1"
        title={title}
        maxWidthClassName="max-w-2xl"
      >
        <form action={action} className="grid gap-5">
          <input type="hidden" name="paketId" value={paketId} />

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
              Paket
            </p>
            <p className="mt-1 text-sm font-black leading-6 text-slate-900">
              {namaPaket}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#08783f]">
                {completedCount} data terisi
              </span>
              {!isStageReady ? (
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-700">
                  Isi minimal 1 data agar bisa lanjut tahap
                </span>
              ) : completedCount < documents.length ? (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
                  Data lainnya opsional
                </span>
              ) : null}
            </div>
          </div>

          <div className="grid gap-4">
            {documents.map((document) => {
              const existingDocument = getExistingDocument(
                existingDocuments,
                document.key,
              );
              const isComplete =
                isDocumentComplete(
                  existingDocuments,
                  document.key,
                  notes,
                  selectedFiles,
                );

              return (
                <div
                  key={`${paketId}-${document.key}`}
                  className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-sm font-black text-slate-900">
                      {document.label}
                    </h3>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-black ${
                        isComplete
                          ? "bg-emerald-50 text-[#08783f]"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {isComplete ? "Lengkap" : "Belum lengkap"}
                    </span>
                  </div>

                  <label className="grid gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wide text-slate-500">
                      Deskripsi dokumen
                    </span>
                    <textarea
                      name={`catatan_${document.key}`}
                      value={notes[document.key] ?? ""}
                      onChange={(event) =>
                        setNotes((current) => ({
                          ...current,
                          [document.key]: event.target.value,
                        }))
                      }
                      placeholder={`Isi deskripsi ${document.label}, atau upload file sebagai pengganti.`}
                      className="min-h-20 rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#08783f] focus:ring-2 focus:ring-emerald-100"
                    />
                  </label>

                  <label className="grid gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wide text-slate-500">
                      Upload alternatif
                    </span>
                    <span className="flex min-h-11 items-center gap-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 text-sm font-semibold text-slate-600">
                      <FileUp
                        className="h-4 w-4 shrink-0 text-[#08783f]"
                        strokeWidth={2.4}
                      />
                      <input
                        type="file"
                        name={`file_${document.key}`}
                        accept="application/pdf,image/png,image/jpeg"
                        onChange={(event) =>
                          setSelectedFiles((current) => ({
                            ...current,
                            [document.key]: event.target.files?.[0]?.name ?? "",
                          }))
                        }
                        className="min-w-0 flex-1 text-xs font-bold file:mr-3 file:rounded-md file:border-0 file:bg-[#08783f] file:px-3 file:py-2 file:text-xs file:font-black file:text-white hover:file:bg-[#066532]"
                      />
                    </span>
                    {selectedFiles[document.key] ? (
                      <p className="rounded-md bg-emerald-50 px-3 py-2 text-xs font-black text-[#08783f]">
                        File siap disimpan: {selectedFiles[document.key]}
                      </p>
                    ) : null}
                    {existingDocument?.fileUrl ? (
                      <a
                        href={existingDocument.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex w-fit items-center rounded-md bg-emerald-50 px-3 py-2 text-xs font-black text-[#08783f] hover:underline"
                      >
                        File sudah tersimpan - buka file
                      </a>
                    ) : null}
                  </label>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={close}
              className="h-11 rounded-lg border border-slate-300 bg-white px-4 text-sm font-black text-slate-600 transition hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#08783f] px-4 text-sm font-black text-white transition hover:bg-[#066532]"
            >
              <Save className="h-4 w-4" strokeWidth={2.4} />
              {isStageReady ? submitLabel : "Simpan Draft"}
            </button>
          </div>
        </form>
      </ModalShell>
    </>
  );
}
