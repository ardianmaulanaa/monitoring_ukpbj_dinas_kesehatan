"use client";

import { useMemo, useState } from "react";
import { Edit3, Plus, Save } from "lucide-react";
import ModalShell from "@/app/(dashboard)/_shared/ModalShell";

export type UnitOption = {
  name: string;
  userCount: number;
  paketCount: number;
  rupCount: number;
  satuanKerjaCount: number;
};

export type UnitUserOption = {
  id: string;
  name: string;
  email: string;
  unitKerja: string | null;
};

type UnitManagementPanelProps = {
  units: UnitOption[];
  users: UnitUserOption[];
};

const inputClass =
  "h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#08783f] focus:ring-2 focus:ring-emerald-100";

const emptyForm = {
  name: "",
  userIds: [] as string[],
};

function UnitBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-[#08783f]">
      {children}
    </span>
  );
}

export default function UnitManagementPanel({
  units,
  users,
}: UnitManagementPanelProps) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<UnitOption | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [editName, setEditName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const sortedUnits = useMemo(
    () => [...units].sort((a, b) => a.name.localeCompare(b.name, "id-ID")),
    [units],
  );

  const assignedUserCount = users.filter((user) => user.unitKerja).length;

  function closeAdd() {
    setIsAddOpen(false);
    setForm(emptyForm);
    setError("");
  }

  function closeEdit() {
    setEditingUnit(null);
    setEditName("");
    setError("");
  }

  async function handleAddSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError("");

    try {
      const response = await fetch("/api/pengaturan/units", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        setError(payload.message ?? "Unit gagal disimpan.");
        return;
      }

      closeAdd();
      window.location.reload();
    } finally {
      setIsSaving(false);
    }
  }

  async function handleEditSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingUnit) return;

    setIsSaving(true);
    setError("");

    try {
      const response = await fetch("/api/pengaturan/units", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentName: editingUnit.name,
          name: editName,
        }),
      });
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        setError(payload.message ?? "Unit gagal diperbarui.");
        return;
      }

      closeEdit();
      window.location.reload();
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-wide text-slate-400">
            Total Unit
          </p>
          <p className="mt-2 text-2xl font-black text-[#16227c]">
            {sortedUnits.length.toLocaleString("id-ID")}
          </p>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            Dari data user, paket, dan RUP
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-wide text-slate-400">
            User Berunit
          </p>
          <p className="mt-2 text-2xl font-black text-[#16227c]">
            {assignedUserCount.toLocaleString("id-ID")}
          </p>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            Terhubung lewat kolom unit kerja
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-wide text-slate-400">
            Belum Diisi
          </p>
          <p className="mt-2 text-2xl font-black text-[#16227c]">
            {(users.length - assignedUserCount).toLocaleString("id-ID")}
          </p>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            User tanpa unit kerja
          </p>
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-black text-[#16227c]">
              Unit Kerja
            </h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Data unit dibaca dari database yang sudah dipakai modul user,
              paket pengadaan, dan RUP.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsAddOpen(true)}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#08783f] px-4 text-sm font-black text-white shadow-sm transition hover:bg-[#066532]"
          >
            <Plus className="h-4 w-4" strokeWidth={2.6} />
            Tambah Unit
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-black uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-5 py-3">Nama Unit</th>
                <th className="px-5 py-3">User</th>
                <th className="px-5 py-3">Paket</th>
                <th className="px-5 py-3">RUP</th>
                <th className="px-5 py-3">Satuan Kerja</th>
                <th className="px-5 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedUnits.length > 0 ? (
                sortedUnits.map((unit) => (
                  <tr key={unit.name} className="transition hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <p className="font-black text-slate-900">{unit.name}</p>
                    </td>
                    <td className="px-5 py-4">
                      <UnitBadge>{unit.userCount} user</UnitBadge>
                    </td>
                    <td className="px-5 py-4 font-semibold text-slate-600">
                      {unit.paketCount.toLocaleString("id-ID")}
                    </td>
                    <td className="px-5 py-4 font-semibold text-slate-600">
                      {unit.rupCount.toLocaleString("id-ID")}
                    </td>
                    <td className="px-5 py-4 font-semibold text-slate-600">
                      {unit.satuanKerjaCount.toLocaleString("id-ID")}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingUnit(unit);
                          setEditName(unit.name);
                        }}
                        className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-white px-4 text-sm font-black text-[#08783f] transition hover:bg-emerald-50"
                      >
                        <Edit3 className="h-4 w-4" />
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-14 text-center text-sm font-semibold text-slate-400"
                  >
                    Belum ada unit dari database.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ModalShell
        isOpen={isAddOpen}
        onClose={closeAdd}
        eyebrow="Pengaturan"
        title="Tambah Unit"
        maxWidthClassName="max-w-2xl"
      >
        <form className="space-y-5" onSubmit={handleAddSubmit}>
          <label className="grid gap-2">
            <span className="text-xs font-black uppercase tracking-wide text-slate-500">
              Nama Unit
            </span>
            <input
              className={inputClass}
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({ ...current, name: event.target.value }))
              }
              required
              maxLength={160}
            />
          </label>

          <label className="grid gap-2">
            <span className="text-xs font-black uppercase tracking-wide text-slate-500">
              Tempelkan ke User
            </span>
            <select
              className="min-h-40 rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#08783f] focus:ring-2 focus:ring-emerald-100"
              multiple
              value={form.userIds}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  userIds: Array.from(
                    event.currentTarget.selectedOptions,
                    (option) => option.value,
                  ),
                }))
              }
              required
            >
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} - {user.unitKerja || "Belum ada unit"}
                </option>
              ))}
            </select>
            <span className="text-xs font-semibold text-slate-400">
              Karena belum ada tabel master unit terpisah, unit baru disimpan
              melalui user yang dipilih.
            </span>
          </label>

          {error ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-700">
              {error}
            </p>
          ) : null}

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={closeAdd}
              className="h-11 rounded-lg border border-slate-300 bg-white px-4 text-sm font-black text-slate-600 transition hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#08783f] px-4 text-sm font-black text-white transition hover:bg-[#066532] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              Simpan
            </button>
          </div>
        </form>
      </ModalShell>

      <ModalShell
        isOpen={Boolean(editingUnit)}
        onClose={closeEdit}
        eyebrow="Pengaturan"
        title="Edit Unit"
        maxWidthClassName="max-w-xl"
      >
        <form className="space-y-5" onSubmit={handleEditSubmit}>
          <label className="grid gap-2">
            <span className="text-xs font-black uppercase tracking-wide text-slate-500">
              Nama Unit
            </span>
            <input
              className={inputClass}
              value={editName}
              onChange={(event) => setEditName(event.target.value)}
              required
              maxLength={160}
            />
          </label>

          {editingUnit ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-600">
              Perubahan nama unit akan diterapkan ke {editingUnit.userCount}{" "}
              user, {editingUnit.paketCount} paket, {editingUnit.rupCount} RUP,
              dan {editingUnit.satuanKerjaCount} satuan kerja.
            </div>
          ) : null}

          {error ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-700">
              {error}
            </p>
          ) : null}

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={closeEdit}
              className="h-11 rounded-lg border border-slate-300 bg-white px-4 text-sm font-black text-slate-600 transition hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#08783f] px-4 text-sm font-black text-white transition hover:bg-[#066532] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              Simpan Perubahan
            </button>
          </div>
        </form>
      </ModalShell>
    </>
  );
}
