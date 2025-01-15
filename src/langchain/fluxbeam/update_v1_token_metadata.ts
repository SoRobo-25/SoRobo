import { PublicKey } from "@solana/web3.js";
import { Tool } from "langchain/tools";
import { SolanaAgentKit } from "../../agent";

export class SolanaFluxbeamUpdateV1MetadataTool extends Tool {
  name = "solana_update_metadata";
  description = `This tool updates metadata for a v1 (legacy) token account.

  Inputs (input is a JSON string):
  mint: string, e.g., "TokenMintPublicKey" (required)
  name: string, token name (required)
  symbol: string, token symbol (required)
  uri: string, token symbol (required)
  `;

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  protected async _call(input: string): Promise<string> {
    try {
      const parsedInput = JSON.parse(input);

      const signature = await this.solanaKit.fluxbeamUpdateV1Metadata(
        this.solanaKit,
        // updateAuthority,
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
