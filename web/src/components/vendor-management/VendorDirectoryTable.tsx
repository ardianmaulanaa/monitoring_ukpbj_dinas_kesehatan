"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import VendorDetailModal from "./VendorDetailModal";

export default function VendorDirectoryTable({
  children,
  categories,
}: {
  children: React.ReactNode;
  categories: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [vendorId, setVendorId] = useState<string | null>(null);
  return (
    <>
      <div
        onClick={(event) => {
          const button = (
            event.target as HTMLElement
          ).closest<HTMLButtonElement>("[data-vendor-detail]");
          if (button) setVendorId(button.dataset.vendorDetail || null);
        }}
      >
        {children}
      </div>
      <VendorDetailModal
        key={vendorId ?? "closed"}
        vendorId={vendorId}
        categories={categories}
        onClose={() => setVendorId(null)}
        onUpdated={() => router.refresh()}
      />
    </>
  );
}
