"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState } from "react";
import { Toaster } from "react-hot-toast";
import CustomCursor from "@/components/shared/CustomCursor";

interface AppProvidersProps {
  children: ReactNode;
}

export default function AppProviders({ children }: AppProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 30,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <CustomCursor />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#083047",
            color: "#f4fbff",
            border: "1px solid rgba(255,255,255,0.12)",
          },
        }}
      />
    </QueryClientProvider>
  );
}
