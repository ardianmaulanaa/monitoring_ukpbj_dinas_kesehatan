"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";

type SmoothPresenceProps = {
  show: boolean;
  children: (state: "open" | "closing") => ReactNode;
  durationMs?: number;
};

export function SmoothPresence({
  show,
  children,
  durationMs = 180,
}: SmoothPresenceProps) {
  const [rendered, setRendered] = useState(show);
  const [state, setState] = useState<"open" | "closing">(
    show ? "open" : "closing",
  );

  useEffect(() => {
    let openFrame = 0;

    if (show) {
      openFrame = requestAnimationFrame(() => {
        setRendered(true);
        setState("open");
      });

      return () => cancelAnimationFrame(openFrame);
    }

    if (!rendered) {
      return;
    }

    openFrame = requestAnimationFrame(() => {
      setState("closing");
    });
    const timeout = window.setTimeout(() => {
      setRendered(false);
    }, durationMs);

    return () => {
      cancelAnimationFrame(openFrame);
      window.clearTimeout(timeout);
    };
  }, [durationMs, rendered, show]);

  if (!rendered) {
    return null;
  }

  return children(state);
}
