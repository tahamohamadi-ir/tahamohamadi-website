"use client";

import { useEffect } from "react";
import { reportAccessibility } from "@/lib/a11y";

export function A11yProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    reportAccessibility().catch(console.error);
  }, []);

  return <>{children}</>;
}
