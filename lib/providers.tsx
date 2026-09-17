"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { isSupabaseConfigured } from "./supabase/client";
import { Profile } from "./types";
import { getCurrentProfile } from "./data-store";

interface AppContextType {
  isConfigured: boolean;
  profile: Profile | null;
  refreshProfile: () => Promise<void>;
}

const AppContext = createContext<AppContextType>({
  isConfigured: false,
  profile: null,
  refreshProfile: async () => {},
});

export const useApp = () => useContext(AppContext);

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 2, // 2 minutes
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  const [isConfigured, setIsConfigured] = useState<boolean>(false);
  const [profile, setProfile] = useState<Profile | null>(null);

  const refreshProfile = async () => {
    try {
      const p = await getCurrentProfile();
      setProfile(p);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    setIsConfigured(isSupabaseConfigured());
    refreshProfile();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AppContext.Provider value={{ isConfigured, profile, refreshProfile }}>
        {children}
      </AppContext.Provider>
    </QueryClientProvider>
  );
}
