'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useStore } from './store';

type StoreContextValue = ReturnType<typeof useStore>;

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const store = useStore();
  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

export function useStoreContext(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStoreContext must be used inside StoreProvider');
  return ctx;
}
