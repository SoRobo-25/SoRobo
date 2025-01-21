import { PublicKey } from "@solana/web3.js";
import { Tool } from "langchain/tools";
import { SolanaAgentKit } from "../../agent";

export class SolanaFluxbeamUpdateV1TokenMetadataTool extends Tool {
  name = "solana_update_v1_token_metadata";
  description = `This tool updates metadata for a v1 (legacy) token.

  Inputs (input is a JSON string):
  mint: string, e.g., "TokenMintPublicKey" (required)
  newName: string, token name (required)
  newSymbol: string, token symbol (required)
  newUri: string, token symbol (required)
  `;

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  protected async _call(input: string): Promise<string> {
    try {
      const parsedInput = JSON.parse(input);

      const signature = await this.solanaKit.fluxbeamUpdateV1Metadata(
        new PublicKey(parsedInput.mint),
        parsedInput.name,
        parsedInput.symbol,
        parsedInput.uri,
      );

      return JSON.stringify({
        status: "success",
        message: "Metadata updated successfully",
        transaction: signature,
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
