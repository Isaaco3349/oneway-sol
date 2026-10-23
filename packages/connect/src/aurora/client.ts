import type {
  BridgeInStakeRequest,
  CreateExecutionResult,
  IntermediaryResponse,
} from "./types.js";

export class AuroraConnectClient {
  constructor(
    private readonly baseUrl: string,
    private readonly apiKey?: string,
  ) {}

  private headers(json = true): HeadersInit {
    const h: Record<string, string> = {};
    if (json) h["Content-Type"] = "application/json";
    if (this.apiKey) h["x-api-key"] = this.apiKey;
    return h;
  }

  async getIntermediary(wallet: string): Promise<IntermediaryResponse> {
    const res = await fetch(
      `${this.baseUrl}/api/v1/executions/${wallet}/intermediary`,
      { headers: this.headers(false) },
    );
    if (!res.ok) {
      throw new Error(`intermediary failed: ${res.status} ${await res.text()}`);
    }
    return res.json() as Promise<IntermediaryResponse>;
  }

  async createBridgeInExecution(
    wallet: string,
    body: BridgeInStakeRequest,
  ): Promise<{ result?: CreateExecutionResult }> {
    const res = await fetch(`${this.baseUrl}/api/v1/executions/${wallet}`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(body),
    });
    const text = await res.text();
    if (!res.ok) {
      throw new Error(`create execution failed: ${res.status} ${text}`);
    }
    return JSON.parse(text) as { result?: CreateExecutionResult };
  }

  async submitSignature(
    wallet: string,
    body: { signature: string; executionId: string; publicKey?: string },
  ): Promise<unknown> {
    const res = await fetch(`${this.baseUrl}/api/v1/executions/${wallet}/submit`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(body),
    });
    const text = await res.text();
    if (!res.ok) {
      throw new Error(`submit failed: ${res.status} ${text}`);
    }
    return text ? JSON.parse(text) : {};
  }

  async recordDeposit(body: {
    txHash: string;
    depositAddress: string;
    memo?: string;
  }): Promise<unknown> {
    const res = await fetch(`${this.baseUrl}/api/v1/executions/deposit/submit`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(body),
    });
    const text = await res.text();
    if (!res.ok) {
      throw new Error(`deposit/submit failed: ${res.status} ${text}`);
    }
    return text ? JSON.parse(text) : {};
  }
}
