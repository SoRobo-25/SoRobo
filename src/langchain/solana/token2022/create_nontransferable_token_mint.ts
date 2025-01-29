import { Tool } from "langchain/tools";
import { SolanaAgentKit } from "../../../agent";

export class SolanaCreateNonTransferableTokenMintTool extends Tool {
  name = "solana_create_non_transferable_token_mint";
  description = `Create a non-transferable token mint.

  Inputs (input is a JSON string):
  {
    "decimals": number, // e.g., 9
    "tokenName": string, // e.g., "My Non-Transferable Token"
    "tokenSymbol": string, // e.g., "MNT"
    "uri": string, // e.g., "https://example.com/token-metadata"
    "additionalMetadata": [["customField", "customValue"]] // optional
  }`;

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  protected async _call(input: string): Promise<string> {
    try {
      const parsedInput = JSON.parse(input);

      const { mint, signature } =
        await this.solanaKit.createNonTransferableTokenMint(
          parsedInput.decimals,
          parsedInput.tokenName,
          parsedInput.tokenSymbol,
          parsedInput.uri,
          parsedInput.additionalMetadata || [],
        );

      return JSON.stringify({
        status: "success",
        mint: mint.toString(),
        signature,
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
