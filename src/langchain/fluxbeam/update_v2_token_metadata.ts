import { PublicKey } from "@solana/web3.js";
import { Tool } from "langchain/tools";
import { SolanaAgentKit } from "../../agent";

export class SolanaFluxbeamUpdateV2MetadataTool extends Tool {
  name = "solana_update_token2022_metadata";
  description = `This tool updates metadata for a token using the 2022 standard.

  Inputs (input is a JSON string):
  mint: string, e.g., "TokenMintPublicKey" (required)
  name: string, token name (required)
  symbol: string, token symbol (required)
  uri:string token uri (required)`;

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  protected async _call(input: string): Promise<string> {
    try {
      const parsedInput = JSON.parse(input);

      const signature = this.solanaKit.fluxbeamUpdateV2Metadata(
        this.solanaKit,
        new PublicKey(parsedInput.mint),
        parsedInput.name,
        parsedInput.symbol,
        parsedInput.uri,
      );

      return JSON.stringify({
        status: "success",
        message: "Token 2022 metadata updated successfully",
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
