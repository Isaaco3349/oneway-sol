export type SolanaAccountMeta = {
  pubkey: string;
  isSigner: boolean;
  isWritable: boolean;
};

export type SolanaExecutionStep = {
  metadata?: { name?: string; description?: string };
  programId: string;
  discriminator: string;
  args: Array<{ name: string; type: string; value: string | number }>;
  accounts: SolanaAccountMeta[];
};

export type ConnectQuote = {
  originAsset: string;
  amount: string;
  destinationAsset: string;
  slippageTolerance: number;
  swapType: "EXACT_INPUT" | "EXACT_OUTPUT";
  deadline: string;
};

export type BridgeInStakeRequest = {
  version: "1.0";
  type: "solana";
  quote: ConnectQuote;
  steps: SolanaExecutionStep[];
  metadata?: { title?: string; intent?: string };
  dry?: boolean;
};

export type ExecutionPayload = {
  payload_json?: string | Record<string, unknown>;
  payload_bytes_base64?: string;
  standard?: string;
};

export type CreateExecutionResult = {
  executionId?: string;
  quote?: {
    depositAddress?: string;
    depositMemo?: string;
    amountIn?: string;
  };
  details?: {
    networkFee?: string;
    payload?: ExecutionPayload;
    signingStandard?: string;
  };
};

export type IntermediaryResponse = {
  result?: {
    originAccount?: string;
    originType?: string;
    evm?: string | null;
    solana?: string | null;
  };
};

export type SigningStandard =
  | "erc191"
  | "nep413"
  | "raw_ed25519"
  | "sep53"
  | "ton_connect"
  | "tip191";
