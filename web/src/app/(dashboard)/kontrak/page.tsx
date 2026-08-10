import ProcurementModulePage from "@/app/(dashboard)/_shared/ProcurementModulePage";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Page({ searchParams }: PageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};

  return (
    <ProcurementModulePage
      pageKey="kontrak"
      searchParams={resolvedSearchParams}
    />
  );
}
