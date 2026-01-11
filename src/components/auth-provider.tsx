"use client";

import { useEffect } from "react";
import { useEdgeStore } from "@/hooks/use-edge-store";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const initializeAuth = useEdgeStore((state) => state.initializeAuth);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return <>{children}</>;
}
