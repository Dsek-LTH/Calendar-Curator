"use client";

import { Home } from "@/components/home";
import React from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { QueryClient } from "@tanstack/query-core";

export default function Page() {
  return (
    <QueryClientProvider client={new QueryClient()}>
      <Home />
    </QueryClientProvider>
  );
}
