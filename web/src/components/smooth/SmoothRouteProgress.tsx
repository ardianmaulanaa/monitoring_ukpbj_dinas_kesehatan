"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export function SmoothRouteProgress() {
  const pathname = usePathname();
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
  }, [pathname]);

  return (
    <div
      aria-hidden="true"
      className={`smooth-route-progress ${active ? "is-active" : ""}`}
    >
      <span />
    </div>
  );
}
