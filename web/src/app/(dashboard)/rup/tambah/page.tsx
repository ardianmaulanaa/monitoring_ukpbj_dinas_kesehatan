import AppHeader from "@/app/(dashboard)/_shared/AppHeader";
import { getActiveSumberDanaOptions } from "@/lib/sumber-dana";
import RupForm from "./rup-form";

export default async function Page() {
  const sumberDanaOptions = await getActiveSumberDanaOptions();

  return (
    <>
      <AppHeader
        title="Tambah RUP"
        subtitle="Input rencana umum pengadaan sebelum masuk proses paket."
        rightLabel="Perencanaan"
      />

      <main className="bg-[#f4f7f5] px-4 py-6 sm:px-6 lg:px-8">
        <RupForm sumberDanaOptions={sumberDanaOptions} />
      </main>
    </>
  );
}
