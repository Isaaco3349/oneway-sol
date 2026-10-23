import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  title: "OneWay | Earn on Solana from any chain",
  description:
    "Bridge USDC from Base (and 31+ chains) into Kamino lending on Solana in one Aurora Intents Connect flow.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
