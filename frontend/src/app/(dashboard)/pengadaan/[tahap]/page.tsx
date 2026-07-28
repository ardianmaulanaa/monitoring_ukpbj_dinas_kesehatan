import ProcurementModulePage from "@/app/(dashboard)/_shared/ProcurementModulePage";

type PageProps = {
  params: Promise<{
    tahap: string;
  }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Page({ params, searchParams }: PageProps) {
  const { tahap } = await params;
  const resolvedSearchParams = (await searchParams) ?? {};

  return (
    <ProcurementModulePage
      pageKey="pengadaan-tahap"
      tahap={tahap}
      searchParams={resolvedSearchParams}
    />
  );
}
