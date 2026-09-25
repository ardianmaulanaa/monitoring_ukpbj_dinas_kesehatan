"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export function SmoothRouteProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const routeKey = useMemo(
    () => `${pathname}?${searchParams.toString()}`,
    [pathname, searchParams],
  );
  const [active, setActive] = useState(false);

  useEffect(() => {
    const startFrame = requestAnimationFrame(() => {
      setActive(true);
    });
    const timeout = window.setTimeout(() => {
      setActive(false);
    }, 520);

    return () => {
      cancelAnimationFrame(startFrame);
      window.clearTimeout(timeout);
    };
  }, [routeKey]);

  return (
    <div
      aria-hidden="true"
      className={`smooth-route-progress ${active ? "is-active" : ""}`}
    >
      <span />
    </div>
  );
}
