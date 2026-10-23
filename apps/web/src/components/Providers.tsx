"use client";

import { EvmWalletProvider } from "@/lib/evm-wallet";

export function Providers({ children }: { children: React.ReactNode }) {
  return <EvmWalletProvider>{children}</EvmWalletProvider>;
}
