import { Tool } from "langchain/tools";
import { SolanaAgentKit } from "../../agent";
import { Chain } from "../../tools/fluxbeam_bridge_tokens";

export class SolanaFluxbeamBridgeTokensTool extends Tool {
  name = "solana_bridge_tokens";
  description = `This tool bridges tokens from Solana to a destination blockchain.

  Inputs (input is a JSON string):
  destination: string, e.g., "ethereum" (required)
  destinationWalletAddress: string, wallet address on destination chain (required)
  fromToken: string, e.g., "SOL" (required)
  toToken: string, e.g., "USDT" (required)
  gasDrop?: number, optional gas drop to be applied to the transaction (optional)`;

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  protected async _call(input: string): Promise<string> {
    try {
      const parsedInput = JSON.parse(input);

      // Validate destination chain type
      if (!(parsedInput.destination in Chain)) {
        throw new Error("Invalid destination chain.");
      }

      // Bridge the tokens
      const signature = await this.solanaKit.fluxbeamBridgeTokens(
        this.solanaKit,
        parsedInput.destination as Chain,
        parsedInput.destinationWalletAddress,
        parsedInput.fromToken,
        parsedInput.toToken,
        parsedInput.gasDrop,
      );

      return JSON.stringify({
        status: "success",
        message: "Token bridge initiated successfully",
        transaction: signature,
        track_url: `https://explorer.mayan.finance/tx/${signature}`,
      });
    } catch (error: any) {
      return JSON.stringify({
        status: "error",
        message: error.message,
        code: error.code || "UNKNOWN_ERROR",
      });
    }
  }
}
