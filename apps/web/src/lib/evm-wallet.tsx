"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { payloadJsonToSign } from "@oneway/connect";

type EvmWalletContextValue = {
  address: `0x${string}` | undefined;
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  signIntentPayload: (payload: {
    payload_json?: string | Record<string, unknown>;
  }) => Promise<`0x${string}`>;
};

const EvmWalletContext = createContext<EvmWalletContextValue | null>(null);

function getEthereum(): {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
} | null {
  if (typeof window === "undefined") return null;
  const eth = (window as unknown as { ethereum?: unknown }).ethereum;
  if (!eth || typeof eth !== "object") return null;
  const request = (eth as { request?: unknown }).request;
  if (typeof request !== "function") return null;
  return eth as {
    request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  };
}

export function EvmWalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<`0x${string}` | undefined>();

  const connect = useCallback(async () => {
    const eth = getEthereum();
    if (!eth) throw new Error("No injected wallet (install MetaMask)");
    const accounts = (await eth.request({
      method: "eth_requestAccounts",
    })) as string[];
    const first = accounts[0];
    if (!first?.startsWith("0x")) throw new Error("Wallet did not return an address");
    setAddress(first as `0x${string}`);
  }, []);

  const disconnect = useCallback(() => setAddress(undefined), []);

  const signIntentPayload = useCallback(
    async (payload: { payload_json?: string | Record<string, unknown> }) => {
      const eth = getEthereum();
      if (!eth || !address) throw new Error("Connect wallet first");
      const message = payloadJsonToSign(payload);
      const sig = (await eth.request({
        method: "personal_sign",
        params: [message, address],
      })) as string;
      if (!sig.startsWith("0x")) throw new Error("Invalid signature from wallet");
      return sig as `0x${string}`;
    },
    [address],
  );

  const value = useMemo<EvmWalletContextValue>(
    () => ({
      address,
      isConnected: Boolean(address),
      connect,
      disconnect,
      signIntentPayload,
    }),
    [address, connect, disconnect, signIntentPayload],
  );

  return (
    <EvmWalletContext.Provider value={value}>{children}</EvmWalletContext.Provider>
  );
}

export function useEvmWallet() {
  const ctx = useContext(EvmWalletContext);
  if (!ctx) throw new Error("useEvmWallet must be used within EvmWalletProvider");
  return ctx;
}
